from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import uuid
import time

from kernel import kernel_manager
from auth import get_current_user, User
from database import (
    save_schedule, get_all_schedules, get_schedule_by_id, 
    remove_schedule, update_schedule_status, record_run_start, 
    record_run_complete, get_runs_for_job, get_all_recent_runs
)

scheduler = AsyncIOScheduler()
router = APIRouter(prefix="/api/schedule", tags=["schedule"])

class ScheduleRequest(BaseModel):
    name: str
    cron: str  # e.g., "*/5 * * * *" for every 5 minutes
    cells: List[str] # List of code strings to execute sequentially

async def execute_notebook_task(job_id: str, name: str, cells: List[str]):
    run_id = str(uuid.uuid4())
    started_at = record_run_start(run_id, job_id, name)
    print(f"[Scheduler] Starting task run {run_id} for '{name}' (Job ID: {job_id})...")

    all_outputs = []
    status = "success"
    error_msg = None
    session_id = f"sched_{job_id}"

    for idx, code in enumerate(cells):
        try:
            print(f"[Scheduler] Executing cell {idx+1}/{len(cells)}...")
            cell_outputs = await kernel_manager.execute(code, session_id=session_id)
            all_outputs.append({
                "cell_index": idx + 1,
                "code": code,
                "outputs": cell_outputs
            })
            
            # Check for runtime error in outputs
            has_error = any(o.get("type") == "error" for o in cell_outputs)
            if has_error:
                status = "error"
                error_msg = f"Cell {idx+1} reported an execution error."
                print(f"[Scheduler] Cell {idx+1} encountered an error.")
                break
        except Exception as e:
            status = "error"
            error_msg = str(e)
            all_outputs.append({
                "cell_index": idx + 1,
                "code": code,
                "outputs": [{"type": "error", "data": str(e)}]
            })
            print(f"[Scheduler] Cell {idx+1} failed with exception: {e}")
            break

    record_run_complete(run_id, status, all_outputs, error_msg)
    update_schedule_status(job_id, started_at, status)
    print(f"[Scheduler] Completed run {run_id} for '{name}' with status: {status}")

def load_and_register_all_jobs():
    """Loads all persisted schedules from SQLite and registers them with APScheduler."""
    schedules = get_all_schedules()
    print(f"[Scheduler] Registering {len(schedules)} saved job(s) from SQLite...")
    for s in schedules:
        try:
            trigger = CronTrigger.from_crontab(s["cron"])
            scheduler.add_job(
                execute_notebook_task,
                trigger,
                args=[s["id"], s["name"], s["cells"]],
                id=s["id"],
                replace_existing=True
            )
            print(f"[Scheduler] Registered job '{s['name']}' ({s['cron']})")
        except Exception as e:
            print(f"[Scheduler] Failed to register job '{s['name']}': {e}")

@router.post("/")
async def create_schedule(req: ScheduleRequest, current_user: User = Depends(get_current_user)):
    job_id = str(uuid.uuid4())
    
    try:
        trigger = CronTrigger.from_crontab(req.cron)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid cron expression. Example: '*/5 * * * *'")

    # Save to SQLite database
    save_schedule(job_id, req.name, req.cron, current_user.username, req.cells)

    # Register with APScheduler
    job = scheduler.add_job(
        execute_notebook_task,
        trigger,
        args=[job_id, req.name, req.cells],
        id=job_id,
        replace_existing=True
    )
    
    return {
        "message": "Job scheduled successfully",
        "job": {
            "id": job_id,
            "name": req.name,
            "cron": req.cron,
            "owner": current_user.username,
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None
        }
    }

@router.get("/")
async def list_schedules(current_user: User = Depends(get_current_user)):
    schedules = get_all_schedules()
    enhanced = []
    for s in schedules:
        job = scheduler.get_job(s["id"])
        s_copy = dict(s)
        s_copy["next_run_time"] = job.next_run_time.isoformat() if (job and job.next_run_time) else None
        s_copy["is_active"] = job is not None
        enhanced.append(s_copy)
    return {"jobs": enhanced}

@router.delete("/{job_id}")
async def delete_schedule(job_id: str, current_user: User = Depends(get_current_user)):
    target = get_schedule_by_id(job_id)
    if not target:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if target["owner"] != current_user.username and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
        
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        
    remove_schedule(job_id)
    return {"message": "Job deleted"}

@router.post("/{job_id}/run")
async def trigger_run_now(job_id: str, current_user: User = Depends(get_current_user)):
    target = get_schedule_by_id(job_id)
    if not target:
        raise HTTPException(status_code=404, detail="Job not found")

    import asyncio
    asyncio.create_task(execute_notebook_task(job_id, target["name"], target["cells"]))
    return {"message": f"Execution started for '{target['name']}'"}

@router.get("/{job_id}/history")
async def get_job_history(job_id: str, current_user: User = Depends(get_current_user)):
    runs = get_runs_for_job(job_id)
    return {"job_id": job_id, "runs": runs}

@router.get("/runs/recent")
async def get_recent_runs(current_user: User = Depends(get_current_user)):
    runs = get_all_recent_runs()
    return {"runs": runs}
