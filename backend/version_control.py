import difflib
import uuid
import time
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from auth import get_current_user, User
from database import (
    save_strategy_version,
    get_strategy_versions,
    get_strategy_version_by_id
)

router = APIRouter(prefix="/api/versions", tags=["versions"])

class CommitRequest(BaseModel):
    notebook_id: str = "default_notebook"
    commit_message: str
    cells: List[dict] # [{ id: str, type: str, content: str }]
    parent_id: Optional[str] = None

class DiffRequest(BaseModel):
    v1_id: str
    v2_id: Optional[str] = None # If None, diff v1 against current cells provided in body
    current_cells: Optional[List[dict]] = None

class RollbackRequest(BaseModel):
    version_id: str

def compute_cells_diff(old_cells: List[dict], new_cells: List[dict]) -> List[dict]:
    max_len = max(len(old_cells), len(new_cells))
    cell_diffs = []

    for idx in range(max_len):
        old_c = old_cells[idx] if idx < len(old_cells) else {"content": "", "type": "code"}
        new_c = new_cells[idx] if idx < len(new_cells) else {"content": "", "type": "code"}

        old_lines = (old_c.get("content", "") or "").splitlines()
        new_lines = (new_c.get("content", "") or "").splitlines()

        matcher = difflib.SequenceMatcher(None, old_lines, new_lines)
        diff_lines = []
        additions = 0
        deletions = 0

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                for line in old_lines[i1:i2]:
                    diff_lines.append({"type": "same", "text": line})
            elif tag == 'delete':
                for line in old_lines[i1:i2]:
                    diff_lines.append({"type": "del", "text": line})
                    deletions += 1
            elif tag == 'insert':
                for line in new_lines[j1:j2]:
                    diff_lines.append({"type": "add", "text": line})
                    additions += 1
            elif tag == 'replace':
                for line in old_lines[i1:i2]:
                    diff_lines.append({"type": "del", "text": line})
                    deletions += 1
                for line in new_lines[j1:j2]:
                    diff_lines.append({"type": "add", "text": line})
                    additions += 1

        cell_diffs.append({
            "cell_index": idx + 1,
            "cell_type": new_c.get("type", old_c.get("type", "code")),
            "additions": additions,
            "deletions": deletions,
            "has_changes": additions > 0 or deletions > 0,
            "diff_lines": diff_lines
        })

    return cell_diffs

@router.post("/commit")
async def commit_version(req: CommitRequest, current_user: User = Depends(get_current_user)):
    version_id = f"c-{uuid.uuid4().hex[:7]}"
    saved = save_strategy_version(
        version_id=version_id,
        notebook_id=req.notebook_id,
        commit_message=req.commit_message,
        author=current_user.username,
        cells=req.cells,
        parent_id=req.parent_id
    )
    return {
        "status": "ok",
        "version_id": version_id,
        "commit": saved
    }

@router.get("/list")
async def list_versions(notebook_id: str = Query("default_notebook"), current_user: User = Depends(get_current_user)):
    versions = get_strategy_versions(notebook_id=notebook_id, limit=50)
    return {
        "status": "ok",
        "notebook_id": notebook_id,
        "versions": versions
    }

@router.post("/diff")
async def get_diff(req: DiffRequest, current_user: User = Depends(get_current_user)):
    v1 = get_strategy_version_by_id(req.v1_id)
    if not v1:
        raise HTTPException(status_code=404, detail=f"Base commit {req.v1_id} not found")

    if req.v2_id:
        v2 = get_strategy_version_by_id(req.v2_id)
        if not v2:
            raise HTTPException(status_code=404, detail=f"Target commit {req.v2_id} not found")
        new_cells = v2.get("cells", [])
        target_label = f"Commit {req.v2_id}"
    else:
        new_cells = req.current_cells or []
        target_label = "Current Working Notebook"

    cell_diffs = compute_cells_diff(v1.get("cells", []), new_cells)
    total_additions = sum(c["additions"] for c in cell_diffs)
    total_deletions = sum(c["deletions"] for c in cell_diffs)

    return {
        "status": "ok",
        "base_version": req.v1_id,
        "target_label": target_label,
        "total_additions": total_additions,
        "total_deletions": total_deletions,
        "cell_diffs": cell_diffs
    }

@router.post("/rollback")
async def rollback_to_version(req: RollbackRequest, current_user: User = Depends(get_current_user)):
    ver = get_strategy_version_by_id(req.version_id)
    if not ver:
        raise HTTPException(status_code=404, detail=f"Commit {req.version_id} not found")

    return {
        "status": "ok",
        "version_id": req.version_id,
        "commit_message": ver["commit_message"],
        "author": ver["author"],
        "cells": ver["cells"]
    }
