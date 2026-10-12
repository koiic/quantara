import asyncio
import jupyter_client
import queue
import time
import re
from typing import Dict, Optional, List
from config import settings

class KernelSession:
    def __init__(self, session_id: str, kernel_name: str = "python3"):
        self.session_id = session_id
        self.kernel_name = kernel_name
        self.km: Optional[jupyter_client.KernelManager] = None
        self.kc: Optional[jupyter_client.KernelClient] = None
        self.lock = asyncio.Lock()
        self.state: str = "idle"  # idle, busy, restarting, dead
        self.last_active: float = time.time()
        self.ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        self._current_msg_id: Optional[str] = None

    def start(self):
        print(f"Starting kernel session '{self.session_id}' ({self.kernel_name})...")
        self.km = jupyter_client.KernelManager(kernel_name=self.kernel_name)
        self.km.start_kernel()
        self.kc = self.km.client()
        self.kc.start_channels()
        try:
            self.kc.wait_for_ready(timeout=10)
            self.state = "idle"
            print(f"Kernel session '{self.session_id}' is ready.")
            self._inject_env()
        except Exception as e:
            self.state = "dead"
            print(f"Error starting kernel session '{self.session_id}': {e}")
            raise e

    def _inject_env(self):
        if not self.kc:
            return
        setup_code = (
            "import sys, os\n"
            "repo_root = os.path.abspath(os.path.join(os.getcwd(), '..'))\n"
            "if repo_root not in sys.path:\n"
            "    sys.path.insert(0, repo_root)\n"
            "if os.getcwd() not in sys.path:\n"
            "    sys.path.insert(0, os.getcwd())\n"
            "try:\n"
            "    import plotly.io as pio\n"
            "    pio.renderers.default = 'notebook_connected'\n"
            "except ImportError:\n"
            "    pass\n"
        )
        self.kc.execute(setup_code)

    def is_alive(self) -> bool:
        return self.km.is_alive() if self.km else False

    def interrupt(self) -> bool:
        """Interrupts currently executing code immediately without acquiring the execution lock."""
        if self.km and self.km.is_alive():
            print(f"Interrupting kernel session '{self.session_id}'...")
            try:
                self.km.interrupt_kernel()
                return True
            except Exception as e:
                print(f"Error interrupting kernel session '{self.session_id}': {e}")
                return False
        return False

    async def restart(self) -> bool:
        """Restarts the kernel, resetting variables and execution state."""
        self.state = "restarting"
        print(f"Restarting kernel session '{self.session_id}'...")
        if self.km:
            try:
                await asyncio.to_thread(self.km.restart_kernel, now=True)
                if self.kc:
                    await asyncio.to_thread(self.kc.wait_for_ready, timeout=10)
                self._inject_env()
                self.state = "idle"
                self.last_active = time.time()
                return True
            except Exception as e:
                print(f"Error restarting kernel '{self.session_id}': {e}")
                self.state = "dead"
                return False
        else:
            self.start()
            return True

    def stop(self):
        self.state = "dead"
        if self.kc:
            try:
                self.kc.stop_channels()
            except Exception:
                pass
        if self.km:
            try:
                self.km.shutdown_kernel(now=True)
            except Exception:
                pass

    async def execute(self, code: str) -> list:
        if not self.km or not self.km.is_alive():
            self.start()

        if not self.kc:
            raise RuntimeError("Kernel client not initialized")

        async with self.lock:
            self.state = "busy"
            self.last_active = time.time()
            msg_id = self.kc.execute(code)
            self._current_msg_id = msg_id
            outputs = []
            start_time = time.time()

            try:
                while True:
                    await asyncio.sleep(0.01)

                    if self.state == "restarting":
                        outputs.append({"type": "error", "data": "Kernel was restarted during execution."})
                        break

                    try:
                        msg = self.kc.get_iopub_msg(timeout=0.2)
                    except queue.Empty:
                        if not self.km or not self.km.is_alive():
                            outputs.append({"type": "error", "data": "Kernel died during execution."})
                            break
                        if time.time() - start_time > settings.execution_timeout_seconds:
                            outputs.append({
                                "type": "error",
                                "data": f"Execution timed out ({settings.execution_timeout_seconds}s limit)."
                            })
                            self.interrupt()
                            break
                        continue

                    parent_id = msg.get("parent_header", {}).get("msg_id")
                    if parent_id != msg_id:
                        continue

                    msg_type = msg["header"]["msg_type"]
                    content = msg["content"]

                    if msg_type == "status" and content.get("execution_state") == "idle":
                        break

                    if msg_type == "stream":
                        clean_text = self.ansi_escape.sub('', content["text"])
                        outputs.append({"type": content.get("name", "stdout"), "data": clean_text})
                    elif msg_type in ("execute_result", "display_data"):
                        data = content.get("data", {})
                        if "text/html" in data:
                            outputs.append({"type": "html", "data": data["text/html"]})
                        elif "image/png" in data:
                            outputs.append({"type": "image", "data": data["image/png"]})
                        else:
                            text_data = data.get("text/plain", str(data))
                            clean_text = self.ansi_escape.sub('', text_data)
                            outputs.append({"type": "data", "data": clean_text})
                    elif msg_type == "error":
                        raw_traceback = "\n".join(content.get("traceback", []))
                        clean_traceback = self.ansi_escape.sub('', raw_traceback)
                        outputs.append({"type": "error", "data": clean_traceback})
            finally:
                self._current_msg_id = None
                if self.state not in ("restarting", "dead"):
                    self.state = "idle"
                self.last_active = time.time()

            return outputs


class SessionKernelManager:
    def __init__(self):
        self.sessions: Dict[str, KernelSession] = {}

    @property
    def km(self):
        return self.get_or_create("default").km

    @property
    def kc(self):
        return self.get_or_create("default").kc

    def get_or_create(self, session_id: str = "default") -> KernelSession:
        if not session_id:
            session_id = "default"
        if session_id not in self.sessions:
            session = KernelSession(session_id=session_id, kernel_name=settings.kernel_name)
            session.start()
            self.sessions[session_id] = session
        return self.sessions[session_id]

    async def execute(self, code: str, session_id: str = "default") -> list:
        session = self.get_or_create(session_id)
        return await session.execute(code)

    def interrupt(self, session_id: str = "default") -> bool:
        if not session_id:
            session_id = "default"
        if session_id in self.sessions:
            return self.sessions[session_id].interrupt()
        return False

    async def restart(self, session_id: str = "default") -> bool:
        if not session_id:
            session_id = "default"
        if session_id in self.sessions:
            return await self.sessions[session_id].restart()
        else:
            self.get_or_create(session_id)
            return True

    def get_status(self, session_id: str = "default") -> dict:
        if not session_id:
            session_id = "default"
        if session_id in self.sessions:
            session = self.sessions[session_id]
            return {
                "session_id": session_id,
                "alive": session.is_alive(),
                "state": session.state,
                "last_active": session.last_active
            }
        return {
            "session_id": session_id,
            "alive": False,
            "state": "not_started",
            "last_active": None
        }

    def list_sessions(self) -> List[dict]:
        return [
            {
                "session_id": sid,
                "alive": s.is_alive(),
                "state": s.state,
                "last_active": s.last_active
            }
            for sid, s in self.sessions.items()
        ]

    def stop_session(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id].stop()
            del self.sessions[session_id]

    def start(self):
        # Pre-warm default session
        self.get_or_create("default")

    def stop(self):
        for session in list(self.sessions.values()):
            session.stop()
        self.sessions.clear()

    def is_alive(self, session_id: str = "default") -> bool:
        if not session_id:
            session_id = "default"
        if session_id in self.sessions:
            return self.sessions[session_id].is_alive()
        return False


kernel_manager = SessionKernelManager()
