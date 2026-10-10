import os
import time
from fastapi import APIRouter, Depends, HTTPException
import duckdb
from typing import List, Optional

from auth import get_current_user, User
from config import settings

router = APIRouter(prefix="/api/datalake", tags=["datalake"])

DATALAKE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datalake"))

def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

@router.get("/files")
async def list_datalake_files(current_user: User = Depends(get_current_user)):
    files = []
    
    for category in ["raw", "processed"]:
        cat_dir = os.path.join(DATALAKE_DIR, category)
        if not os.path.exists(cat_dir):
            continue
            
        for fname in os.listdir(cat_dir):
            fpath = os.path.join(cat_dir, fname)
            if not os.path.isfile(fpath):
                continue
                
            stat = os.stat(fpath)
            ext = fname.split(".")[-1].lower() if "." in fname else "unknown"
            rel_path = f"../datalake/{category}/{fname}"
            
            # Generate instant DuckDB snippet
            query_snippet = f"import duckdb\ncon = duckdb.connect()\ndf = con.execute(\"SELECT * FROM '{rel_path}' LIMIT 10\").df()\ndisplay(df)"
            
            files.append({
                "name": fname,
                "category": category,
                "relative_path": rel_path,
                "format": ext,
                "size_bytes": stat.st_size,
                "size_formatted": format_size(stat.st_size),
                "modified": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stat.st_mtime)),
                "query_snippet": query_snippet
            })
            
    return {"files": sorted(files, key=lambda x: x["category"])}

@router.get("/preview")
async def preview_datalake_file(path: str, current_user: User = Depends(get_current_user)):
    # Validate path is within datalake directory for security
    clean_path = os.path.normpath(os.path.join(os.path.dirname(__file__), path))
    if not clean_path.startswith(DATALAKE_DIR):
        raise HTTPException(status_code=403, detail="Path must be within datalake directory")
        
    if not os.path.isfile(clean_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        con = duckdb.connect()
        # Query first 10 rows
        df = con.execute(f"SELECT * FROM '{clean_path}' LIMIT 10").df()
        
        # Convert df to dictionary records
        columns = list(df.columns)
        records = df.fillna("").to_dict(orient="records")
        row_count = con.execute(f"SELECT COUNT(*) FROM '{clean_path}'").fetchone()[0]
        
        return {
            "columns": columns,
            "rows": records,
            "total_rows": row_count,
            "preview_limit": 10
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query file: {str(e)}")
