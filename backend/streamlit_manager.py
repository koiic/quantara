import subprocess
import os
import sys
import signal
import time
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user, User

router = APIRouter(prefix="/api/streamlit", tags=["streamlit"])

APPS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "streamlit_apps"))
STREAMLIT_BIN = os.path.join(os.path.dirname(__file__), ".venv", "bin", "streamlit")
if not os.path.exists(STREAMLIT_BIN):
    STREAMLIT_BIN = "streamlit"

class StreamlitServerManager:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.active_app: str = "executive_dashboard.py"
        self.port: int = 8501

    def is_running(self) -> bool:
        if self.process is not None and self.process.poll() is None:
            return True
        import socket
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.3)
                return s.connect_ex(('127.0.0.1', self.port)) == 0
        except Exception:
            return False

    def start(self, app_filename: str = "executive_dashboard.py", port: int = 8501) -> bool:
        os.makedirs(APPS_DIR, exist_ok=True)
        app_path = os.path.join(APPS_DIR, app_filename)
        if not os.path.exists(app_path):
            raise FileNotFoundError(f"App script '{app_filename}' not found in {APPS_DIR}")

        if self.is_running():
            if self.active_app == app_filename:
                return True
            self.stop()

        self.active_app = app_filename
        self.port = port
        cmd = [
            STREAMLIT_BIN, "run", app_path,
            "--server.port", str(port),
            "--server.headless", "true",
            "--browser.gatherUsageStats", "false",
            "--server.enableCORS", "false",
            "--server.enableXsrfProtection", "false"
        ]

        print(f"[StreamlitManager] Launching Streamlit: {' '.join(cmd)}")
        self.process = subprocess.Popen(
            cmd,
            cwd=APPS_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        time.sleep(1.5)
        return self.is_running()

    def stop(self) -> bool:
        if self.process and self.process.poll() is None:
            print("[StreamlitManager] Stopping Streamlit...")
            self.process.terminate()
            try:
                self.process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self.process.kill()
            self.process = None
            return True
        self.process = None
        return True

    def get_status(self) -> dict:
        running = self.is_running()
        return {
            "running": running,
            "active_app": self.active_app if running else None,
            "port": self.port,
            "url": f"http://localhost:{self.port}" if running else None
        }

    def list_apps(self) -> List[dict]:
        os.makedirs(APPS_DIR, exist_ok=True)
        apps = []
        for f in os.listdir(APPS_DIR):
            if f.endswith(".py"):
                fpath = os.path.join(APPS_DIR, f)
                stat = os.stat(fpath)
                apps.append({
                    "filename": f,
                    "title": f.replace("_", " ").replace(".py", "").title(),
                    "size_bytes": stat.st_size,
                    "modified": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stat.st_mtime))
                })
        return sorted(apps, key=lambda x: x["filename"])

streamlit_manager = StreamlitServerManager()

class StartAppRequest(BaseModel):
    app_filename: Optional[str] = "executive_dashboard.py"
    port: Optional[int] = 8501

class GenerateAppRequest(BaseModel):
    notebook_title: str
    cells: List[dict] # [{ type: 'code'|'markdown', content: str }]
    launch_immediately: Optional[bool] = True

@router.get("/status")
async def get_status(current_user: User = Depends(get_current_user)):
    return streamlit_manager.get_status()

@router.get("/apps")
async def list_apps(current_user: User = Depends(get_current_user)):
    return {"apps": streamlit_manager.list_apps(), "status": streamlit_manager.get_status()}

@router.post("/start")
async def start_streamlit(req: StartAppRequest, current_user: User = Depends(get_current_user)):
    try:
        success = streamlit_manager.start(req.app_filename or "executive_dashboard.py", req.port or 8501)
        return {"status": "ok" if success else "failed", "info": streamlit_manager.get_status()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop")
async def stop_streamlit(current_user: User = Depends(get_current_user)):
    streamlit_manager.stop()
    return {"status": "ok", "message": "Streamlit stopped"}

@router.post("/generate")
async def generate_app_from_notebook(req: GenerateAppRequest, current_user: User = Depends(get_current_user)):
    """Translates notebook cells into an executable Streamlit dashboard script."""
    clean_slug = "".join(c if c.isalnum() else "_" for c in req.notebook_title.lower()).strip("_")
    if not clean_slug:
        clean_slug = "custom_dashboard"
    filename = f"{clean_slug}.py"
    target_path = os.path.join(APPS_DIR, filename)

    lines = [
        "import streamlit as st",
        "import pandas as pd",
        "import numpy as np",
        "import plotly.graph_objects as go",
        "import duckdb",
        "import os",
        "",
        f"st.set_page_config(page_title='{req.notebook_title}', layout='wide')",
        f"st.title('{req.notebook_title}')",
        "st.markdown('*Generated directly from Quantara Notebook for Stakeholders & Executive Presentation*')",
        "st.markdown('---')",
        ""
    ]

    for idx, cell in enumerate(req.cells):
        ctype = cell.get("type", "code")
        content = cell.get("content", "").strip()
        if not content:
            continue

        if ctype == "markdown":
            escaped = content.replace('"""', '\\"\\"\\"')
            lines.append(f'st.markdown("""{escaped}""")\n')
        else:
            # Code cell conversion
            # Look for display(...) or plot commands
            lines.append(f"# --- Cell {idx+1} ---")
            # Wrap with expander so executive can inspect code if curious
            clean_code = content.replace("display(", "st.write(").replace("fig.show()", "st.plotly_chart(fig, use_container_width=True)")
            
            # Execute code directly in streamlit
            lines.append(clean_code)
            lines.append("")

    with open(target_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    if req.launch_immediately:
        streamlit_manager.start(filename)

    return {
        "status": "ok",
        "filename": filename,
        "message": f"Generated Streamlit dashboard '{filename}'",
        "info": streamlit_manager.get_status()
    }
