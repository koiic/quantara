import asyncio
import jupyter_client
import queue
import time
import re
from config import settings

class ExecutionManager:
    def __init__(self):
        self.km = None
        self.kc = None
        self.lock = asyncio.Lock()
        self.ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')

    def start(self):
        print(f"Starting {settings.kernel_name} Kernel...")
        self.km = jupyter_client.KernelManager(kernel_name=settings.kernel_name)
        self.km.start_kernel()
        self.kc = self.km.client()
        self.kc.start_channels()
        try:
            self.kc.wait_for_ready(timeout=10)
            print("Kernel is ready.")
            self._inject_env()
        except Exception as e:
            print(f"Error starting kernel: {e}")

    def _inject_env(self):
        setup_code = (
            "try:\n"
            "    import plotly.io as pio\n"
            "    pio.renderers.default = 'notebook_connected'\n"
            "except ImportError:\n"
            "    pass\n"
        )
        self.kc.execute(setup_code)

    def stop(self):
        if self.kc:
            self.kc.stop_channels()
        if self.km:
            self.km.shutdown_kernel()

    def is_alive(self):
        return self.km.is_alive() if self.km else False

    async def execute(self, code: str) -> list:
        if not self.kc:
            raise RuntimeError("Kernel not running")

        async with self.lock:
            msg_id = self.kc.execute(code)
            outputs = []
            start_time = time.time()
            
            while True:
                try:
                    await asyncio.sleep(0.01)
                    msg = self.kc.get_iopub_msg(timeout=0.5)
                    
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
                        
                except queue.Empty:
                    pass
                    
                if time.time() - start_time > settings.execution_timeout_seconds: 
                    outputs.append({"type": "error", "data": f"Execution timed out ({settings.execution_timeout_seconds}s limit)."})
                    break

        return outputs

kernel_manager = ExecutionManager()
