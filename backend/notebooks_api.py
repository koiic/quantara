from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
import time

from auth import get_current_user, User
from database import (
    save_or_update_notebook,
    get_notebook_by_id,
    get_user_accessible_notebooks,
    delete_notebook,
    share_notebook_with_user,
    get_notebook_shares,
    remove_notebook_share,
    check_user_notebook_role,
    get_user_by_username,
    get_user_by_email
)

router = APIRouter(prefix="/api/notebooks", tags=["notebooks"])

class NotebookSaveRequest(BaseModel):
    id: Optional[str] = None
    title: str
    cells: List[Dict[str, Any]]

class NotebookShareRequest(BaseModel):
    user_or_email: str
    role: str # 'editor' or 'viewer'

@router.get("", response_model=List[Dict[str, Any]])
async def list_notebooks(current_user: User = Depends(get_current_user)):
    """List all notebooks owned by or shared with the authenticated quant."""
    accessible = get_user_accessible_notebooks(current_user.username, current_user.email)
    return accessible

@router.get("/{notebook_id}")
async def get_notebook(notebook_id: str, current_user: User = Depends(get_current_user)):
    """Get full notebook content with cells, checking access role."""
    role = check_user_notebook_role(notebook_id, current_user.username, current_user.email)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access permissions for this notebook."
        )
    nb = get_notebook_by_id(notebook_id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found.")
    nb["role"] = role
    return nb

@router.post("")
async def create_notebook(req: NotebookSaveRequest, current_user: User = Depends(get_current_user)):
    """Create a new notebook with the authenticated user as owner."""
    notebook_id = req.id if req.id else str(uuid.uuid4())
    result = save_or_update_notebook(
        notebook_id=notebook_id,
        title=req.title or "Untitled Notebook",
        owner=current_user.username,
        cells=req.cells
    )
    result["role"] = "owner"
    return result

@router.put("/{notebook_id}")
async def update_notebook(notebook_id: str, req: NotebookSaveRequest, current_user: User = Depends(get_current_user)):
    """Update notebook cells and title. Requires 'owner' or 'editor' role."""
    role = check_user_notebook_role(notebook_id, current_user.username, current_user.email)
    if not role:
        # If notebook doesn't exist yet, allow creation if caller claims it
        nb = get_notebook_by_id(notebook_id)
        if not nb:
            return save_or_update_notebook(notebook_id, req.title, current_user.username, req.cells)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this notebook."
        )
    
    if role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers have read-only permissions and cannot modify or save notebook contents."
        )
        
    existing = get_notebook_by_id(notebook_id)
    owner = existing["owner"] if existing else current_user.username
    result = save_or_update_notebook(notebook_id, req.title, owner, req.cells)
    result["role"] = role
    return result

@router.delete("/{notebook_id}")
async def delete_notebook_endpoint(notebook_id: str, current_user: User = Depends(get_current_user)):
    """Delete a notebook. Allowed for notebook OWNER only."""
    role = check_user_notebook_role(notebook_id, current_user.username, current_user.email)
    if not role:
        raise HTTPException(status_code=404, detail="Notebook not found or inaccessible.")
    if role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the notebook owner can delete this notebook."
        )
    delete_notebook(notebook_id)
    return {"status": "ok", "message": f"Notebook {notebook_id} permanently deleted."}

# --- Collaborator Sharing Endpoints ---

@router.get("/{notebook_id}/shares")
async def list_shares(notebook_id: str, current_user: User = Depends(get_current_user)):
    """List all collaborators shared on this notebook."""
    role = check_user_notebook_role(notebook_id, current_user.username, current_user.email)
    if not role:
        raise HTTPException(status_code=403, detail="Access denied.")
    
    nb = get_notebook_by_id(notebook_id)
    shares = get_notebook_shares(notebook_id)
    return {
        "notebook_id": notebook_id,
        "owner": nb["owner"] if nb else None,
        "user_role": role,
        "shares": shares
    }

@router.post("/{notebook_id}/share")
async def invite_share(notebook_id: str, req: NotebookShareRequest, current_user: User = Depends(get_current_user)):
    """Invite or grant access to a user or email with role 'editor' or 'viewer'."""
    role = check_user_notebook_role(notebook_id, current_user.username, current_user.email)
    if role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the notebook owner can invite or change collaborator roles."
        )
    
    clean_role = req.role.strip().lower()
    if clean_role not in ["editor", "viewer"]:
        raise HTTPException(status_code=400, detail="Role must be either 'editor' or 'viewer'.")
    
    target = req.user_or_email.strip().lower()
    if target == current_user.username.lower() or (current_user.email and target == current_user.email.lower()):
        raise HTTPException(status_code=400, detail="Cannot share notebook with yourself (you are the owner).")
        
    share_id = str(uuid.uuid4())
    result = share_notebook_with_user(
        share_id=share_id,
        notebook_id=notebook_id,
        user_or_email=target,
        role=clean_role,
        invited_by=current_user.username
    )
    return {"status": "ok", "share": result}

@router.delete("/{notebook_id}/shares/{user_or_email}")
async def revoke_share(notebook_id: str, user_or_email: str, current_user: User = Depends(get_current_user)):
    """Revoke sharing permissions for a collaborator."""
    role = check_user_notebook_role(notebook_id, current_user.username, current_user.email)
    if role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the notebook owner can revoke collaborator access."
        )
    remove_notebook_share(notebook_id, user_or_email)
    return {"status": "ok", "message": f"Access revoked for {user_or_email}."}
