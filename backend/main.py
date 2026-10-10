from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from config import settings
from kernel import kernel_manager
from database import init_db
from auth import router as auth_router
from auth import get_current_user, User
from scheduler import router as scheduler_router
from scheduler import scheduler, load_and_register_all_jobs
from datalake import router as datalake_router
from streamlit_manager import router as streamlit_router, streamlit_manager
from ai_copilot import router as ai_router
from market_stream import router as market_router, broadcast_market_depth_loop
from executive_reports import router as reports_router
from version_control import router as versions_router
from risk_sentinel import router as risk_router
from drl_preprocessor import router as drl_preprocess_router
from drl_backtester import router as drl_backtest_router
from drl_pipeline import router as drl_pipeline_router
from notebooks_api import router as notebooks_router
from shadow_paper_engine import router as trading_router
import asyncio

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(notebooks_router)
app.include_router(trading_router)
app.include_router(scheduler_router)
app.include_router(datalake_router)
app.include_router(streamlit_router)
app.include_router(ai_router)
app.include_router(market_router)
app.include_router(reports_router)
app.include_router(versions_router)
app.include_router(risk_router)
app.include_router(drl_preprocess_router)
app.include_router(drl_backtest_router)
app.include_router(drl_pipeline_router)



market_stream_task = None

@app.on_event("startup")
async def startup_event():
    global market_stream_task
    # 1. Initialize SQLite Database
    init_db()
    # 2. Start Execution Engine
    kernel_manager.start()
    # 3. Start Scheduler & register persistent jobs
    scheduler.start()
    load_and_register_all_jobs()
    # 4. Pre-launch default Streamlit Executive Dashboard
    try:
        streamlit_manager.start("executive_dashboard.py", 8501)
    except Exception as e:
        print(f"[Main] Warning: Could not start default Streamlit dashboard: {e}")
    # 5. Launch background real-time market depth loop
    market_stream_task = asyncio.create_task(broadcast_market_depth_loop())
    print("Quantara Engine: All Quant Feature Pillars, Streamlit, and Data Lake ready.")

@app.on_event("shutdown")
async def shutdown_event():
    global market_stream_task
    if market_stream_task:
        market_stream_task.cancel()
    streamlit_manager.stop()
    scheduler.shutdown()
    kernel_manager.stop()



class ExecuteRequest(BaseModel):
    code: str
    session_id: Optional[str] = "default"

class SessionControlRequest(BaseModel):
    session_id: Optional[str] = "default"

@app.post("/api/execute")
async def execute_code(req: ExecuteRequest, current_user: User = Depends(get_current_user)):
    try:
        session_id = req.session_id or "default"
        # If executing in a notebook session, enforce role permissions
        if session_id != "default":
            from database import check_user_notebook_role
            role = check_user_notebook_role(session_id, current_user.username, current_user.email)
            if role == "viewer":
                raise HTTPException(
                    status_code=403,
                    detail="Viewers have read-only access. Code execution is disabled."
                )
        print(f"User {current_user.username} is executing code in session '{session_id}'...")
        outputs = await kernel_manager.execute(req.code, session_id=session_id)
        return {"status": "ok", "outputs": outputs, "session_id": session_id}
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        return {"status": "error", "outputs": [{"type": "error", "data": str(e)}], "session_id": req.session_id}

@app.post("/api/kernel/interrupt")
async def interrupt_kernel(req: SessionControlRequest, current_user: User = Depends(get_current_user)):
    session_id = req.session_id or "default"
    success = kernel_manager.interrupt(session_id=session_id)
    return {"status": "ok" if success else "failed", "interrupted": success, "session_id": session_id}

@app.post("/api/kernel/restart")
async def restart_kernel(req: SessionControlRequest, current_user: User = Depends(get_current_user)):
    session_id = req.session_id or "default"
    success = await kernel_manager.restart(session_id=session_id)
    return {"status": "ok" if success else "failed", "restarted": success, "session_id": session_id}

@app.get("/api/kernel/status")
async def kernel_status(session_id: Optional[str] = "default", current_user: User = Depends(get_current_user)):
    return kernel_manager.get_status(session_id=session_id or "default")

@app.get("/api/kernel/list")
async def list_kernels(current_user: User = Depends(get_current_user)):
    return {"sessions": kernel_manager.list_sessions()}

@app.delete("/api/kernel/{session_id}")
async def delete_kernel(session_id: str, current_user: User = Depends(get_current_user)):
    kernel_manager.stop_session(session_id)
    return {"status": "ok", "message": f"Session {session_id} terminated"}

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "default_kernel_alive": kernel_manager.is_alive("default"),
        "active_sessions": len(kernel_manager.sessions)
    }
