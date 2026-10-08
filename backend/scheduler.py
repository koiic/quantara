from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import uuid

from kernel import kernel_manager
from auth import get_current_user, User

# We use an in-memory scheduler for the MVP
scheduler = AsyncIOScheduler()
router = APIRouter(prefix="/api/schedule", tags=["schedule"])

# In-memory store for active jobs
active_jobs: Dict[str, dict] = {}

class ScheduleRequest(BaseModel):
    name: str
    cron: str  # e.g., "*/5 * * * *" for every 5 minutes
    cells: List[str] # List of code strings to execute sequentially

async def execute_notebook_task(job_id: str, name: str, cells: List[str]):
    print(f"[Scheduler] Starting scheduled notebook execution: {name} (Job: {job_id})")
    for idx, code in enumerate(cells):
        try:
            print(f"[Scheduler] Executing cell {idx+1}/{len(cells)}...")
            outputs = await kernel_manager.execute(code)
            # In a production system, we would log these outputs to MinIO or a database
            print(f"[Scheduler] Cell {idx+1} finished with {len(outputs)} outputs.")
        except Exception as e:
            print(f"[Scheduler] Cell {idx+1} failed: {str(e)}")
            break # Stop execution on failure
    print(f"[Scheduler] Finished executing {name}")

@router.post("/")
async def create_schedule(req: ScheduleRequest, current_user: User = Depends(get_current_user)):
    if not kernel_manager.is_alive():
        raise HTTPException(status_code=500, detail="Kernel not ready")
        
    job_id = str(uuid.uuid4())
    
    try:
        trigger = CronTrigger.from_crontab(req.cron)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid cron expression")

    # Add the job to APScheduler
    job = scheduler.add_job(
        execute_notebook_task,
        trigger,
        args=[job_id, req.name, req.cells],
        id=job_id,
        replace_existing=True
    )
    
    active_jobs[job_id] = {
        "id": job_id,
        "name": req.name,
        "cron": req.cron,
        "owner": current_user.username,
        "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None
    }
    
    return {"message": "Job scheduled successfully", "job": active_jobs[job_id]}

@router.get("/")
async def list_schedules(current_user: User = Depends(get_current_user)):
    # In production, filter by user role. For MVP, just return all for visibility
    return {"jobs": list(active_jobs.values())}

@router.delete("/{job_id}")
async def delete_schedule(job_id: str, current_user: User = Depends(get_current_user)):
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if active_jobs[job_id]["owner"] != current_user.username and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
        
    scheduler.remove_job(job_id)
    del active_jobs[job_id]
    
    return {"message": "Job deleted"}
