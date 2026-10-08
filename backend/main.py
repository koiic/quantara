from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import settings
from kernel import kernel_manager
from auth import router as auth_router
from auth import get_current_user, User
from scheduler import router as scheduler_router
from scheduler import scheduler

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(scheduler_router)

@app.on_event("startup")
async def startup_event():
    kernel_manager.start()
    scheduler.start()
    print("Scheduler started.")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    kernel_manager.stop()

class ExecuteRequest(BaseModel):
    code: str

@app.post("/api/execute")
async def execute_code(req: ExecuteRequest, current_user: User = Depends(get_current_user)):
    try:
        # We can log who is executing code here!
        print(f"User {current_user.username} is executing code...")
        
        outputs = await kernel_manager.execute(req.code)
        return {"status": "ok", "outputs": outputs}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        return {"status": "error", "outputs": [{"type": "error", "data": str(e)}]}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "kernel_alive": kernel_manager.is_alive()}
