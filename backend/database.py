import sqlite3
import os
import json
import time
from typing import Optional, List, Dict
import bcrypt

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "data", "nexus.db")

def get_db_connection():
    os.makedirs(os.path.join(DB_DIR, "data"), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()


    # Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            hashed_password TEXT NOT NULL,
            full_name TEXT,
            email TEXT,
            role TEXT DEFAULT 'user',
            created_at TEXT
        )
    """)

    # Schedules Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schedules (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            cron TEXT NOT NULL,
            owner TEXT NOT NULL,
            cells_json TEXT NOT NULL,
            created_at TEXT,
            last_run_time TEXT,
            last_status TEXT
        )
    """)

    # Schedule Runs History Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schedule_runs (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            job_name TEXT NOT NULL,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            status TEXT NOT NULL,
            outputs_json TEXT,
            error TEXT,
            FOREIGN KEY (job_id) REFERENCES schedules(id) ON DELETE CASCADE
        )
    """)

    # Strategy Versions (Git-like Version Control)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS strategy_versions (
            id TEXT PRIMARY KEY,
            notebook_id TEXT NOT NULL,
            commit_message TEXT NOT NULL,
            author TEXT NOT NULL,
            cells_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            parent_id TEXT
        )
    """)

    # Executive Briefing Reports Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS executive_reports (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            report_type TEXT NOT NULL,
            summary TEXT,
            metrics_json TEXT,
            html_content TEXT,
            created_at TEXT NOT NULL
        )
    """)

    # Notebooks Table (Persistent Multi-User Storage)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notebooks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            owner TEXT NOT NULL,
            cells_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (owner) REFERENCES users(username)
        )
    """)

    # Notebook Collaborator Shares & Roles (VIEWER, EDITOR, OWNER)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notebook_shares (
            id TEXT PRIMARY KEY,
            notebook_id TEXT NOT NULL,
            user_or_email TEXT NOT NULL,
            role TEXT NOT NULL, -- 'editor' or 'viewer'
            invited_by TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE
        )
    """)

    conn.commit()


    # Seed Default Users if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        print("Seeding initial users into SQLite...")
        seed_users = [
            ("admin", "admin", "Principal Architect", "admin@nexus.io", "admin"),
            ("quant1", "quant123", "Quantitative Analyst", "quant1@nexus.io", "user")
        ]
        for uname, plain_pwd, fname, email, role in seed_users:
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(plain_pwd.encode('utf-8'), salt).decode('utf-8')
            cursor.execute("""
                INSERT INTO users (username, hashed_password, full_name, email, role, created_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            """, (uname, hashed, fname, email, role))
        conn.commit()

    conn.close()

# --- User Queries ---

def get_user_by_username(username: str) -> Optional[dict]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return dict(row) if row else None

# --- Schedule Queries ---

def save_schedule(job_id: str, name: str, cron: str, owner: str, cells: list):
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO schedules (id, name, cron, owner, cells_json, created_at, last_run_time, last_status)
        VALUES (?, ?, ?, ?, ?, datetime('now'), NULL, 'pending')
    """, (job_id, name, cron, owner, json.dumps(cells)))
    conn.commit()
    conn.close()

def get_all_schedules() -> List[dict]:
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM schedules ORDER BY created_at DESC").fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["cells"] = json.loads(d["cells_json"])
        result.append(d)
    return result

def get_schedule_by_id(job_id: str) -> Optional[dict]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM schedules WHERE id = ?", (job_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["cells"] = json.loads(d["cells_json"])
    return d

def remove_schedule(job_id: str):
    conn = get_db_connection()
    conn.execute("DELETE FROM schedules WHERE id = ?", (job_id,))
    conn.execute("DELETE FROM schedule_runs WHERE job_id = ?", (job_id,))
    conn.commit()
    conn.close()

def update_schedule_status(job_id: str, last_run_time: str, last_status: str):
    conn = get_db_connection()
    conn.execute("""
        UPDATE schedules 
        SET last_run_time = ?, last_status = ? 
        WHERE id = ?
    """, (last_run_time, last_status, job_id))
    conn.commit()
    conn.close()

# --- Run History Queries ---

def record_run_start(run_id: str, job_id: str, job_name: str) -> str:
    conn = get_db_connection()
    started_at = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    conn.execute("""
        INSERT INTO schedule_runs (id, job_id, job_name, started_at, status, outputs_json, error)
        VALUES (?, ?, ?, ?, 'running', '[]', NULL)
    """, (run_id, job_id, job_name, started_at))
    conn.commit()
    conn.close()
    return started_at

def record_run_complete(run_id: str, status: str, outputs: list, error: Optional[str] = None):
    conn = get_db_connection()
    finished_at = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    conn.execute("""
        UPDATE schedule_runs
        SET finished_at = ?, status = ?, outputs_json = ?, error = ?
        WHERE id = ?
    """, (finished_at, status, json.dumps(outputs), error, run_id))
    conn.commit()
    conn.close()

def get_runs_for_job(job_id: str, limit: int = 20) -> List[dict]:
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT * FROM schedule_runs 
        WHERE job_id = ? 
        ORDER BY started_at DESC 
        LIMIT ?
    """, (job_id, limit)).fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["outputs"] = json.loads(d["outputs_json"]) if d["outputs_json"] else []
        results.append(d)
    return results

def get_all_recent_runs(limit: int = 50) -> List[dict]:
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT * FROM schedule_runs 
        ORDER BY started_at DESC 
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["outputs"] = json.loads(d["outputs_json"]) if d["outputs_json"] else []
        results.append(d)
    return results

# --- Strategy Version Control Queries ---

def save_strategy_version(version_id: str, notebook_id: str, commit_message: str, author: str, cells: list, parent_id: Optional[str] = None):
    conn = get_db_connection()
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    conn.execute("""
        INSERT INTO strategy_versions (id, notebook_id, commit_message, author, cells_json, created_at, parent_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (version_id, notebook_id, commit_message, author, json.dumps(cells), now, parent_id))
    conn.commit()
    conn.close()
    return {"id": version_id, "notebook_id": notebook_id, "commit_message": commit_message, "author": author, "created_at": now}

def get_strategy_versions(notebook_id: str, limit: int = 50) -> List[dict]:
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT id, notebook_id, commit_message, author, created_at, parent_id,
               json_array_length(cells_json) as cell_count
        FROM strategy_versions
        WHERE notebook_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, (notebook_id, limit)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_strategy_version_by_id(version_id: str) -> Optional[dict]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM strategy_versions WHERE id = ?", (version_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["cells"] = json.loads(d["cells_json"])
    return d

# --- Executive Report Queries ---

def save_executive_report(report_id: str, title: str, author: str, report_type: str, summary: str, metrics: dict, html_content: str):
    conn = get_db_connection()
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    conn.execute("""
        INSERT INTO executive_reports (id, title, author, report_type, summary, metrics_json, html_content, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (report_id, title, author, report_type, summary, json.dumps(metrics), html_content, now))
    conn.commit()
    conn.close()
    return {"id": report_id, "title": title, "created_at": now}

def get_executive_reports(limit: int = 20) -> List[dict]:
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT id, title, author, report_type, summary, metrics_json, created_at
        FROM executive_reports
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["metrics"] = json.loads(d["metrics_json"]) if d["metrics_json"] else {}
        results.append(d)
    return results

def get_executive_report_by_id(report_id: str) -> Optional[dict]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM executive_reports WHERE id = ?", (report_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["metrics"] = json.loads(d["metrics_json"]) if d["metrics_json"] else {}
    return d

# --- User Registration Queries ---

def create_user(username: str, hashed_password: str, full_name: Optional[str], email: Optional[str], role: str = 'user') -> dict:
    conn = get_db_connection()
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    conn.execute("""
        INSERT INTO users (username, hashed_password, full_name, email, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (username, hashed_password, full_name, email, role, now))
    conn.commit()
    conn.close()
    return {"username": username, "full_name": full_name, "email": email, "role": role, "created_at": now}

def get_user_by_email(email: str) -> Optional[dict]:
    if not email:
        return None
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),)).fetchone()
    conn.close()
    return dict(row) if row else None

# --- Persistent Multi-User Notebook & Collaboration Queries ---

def save_or_update_notebook(notebook_id: str, title: str, owner: str, cells: list) -> dict:
    conn = get_db_connection()
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    cells_json = json.dumps(cells)
    
    row = conn.execute("SELECT id, owner FROM notebooks WHERE id = ?", (notebook_id,)).fetchone()
    if row:
        conn.execute("""
            UPDATE notebooks
            SET title = ?, cells_json = ?, updated_at = ?
            WHERE id = ?
        """, (title, cells_json, now, notebook_id))
    else:
        conn.execute("""
            INSERT INTO notebooks (id, title, owner, cells_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (notebook_id, title, owner, cells_json, now, now))
        
    conn.commit()
    conn.close()
    return {"id": notebook_id, "title": title, "owner": owner if not row else row["owner"], "updated_at": now}

def get_notebook_by_id(notebook_id: str) -> Optional[dict]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM notebooks WHERE id = ?", (notebook_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    try:
        d["cells"] = json.loads(d["cells_json"])
    except Exception:
        d["cells"] = []
    return d

def get_user_accessible_notebooks(username: str, email: Optional[str] = None) -> List[dict]:
    conn = get_db_connection()
    clean_email = (email or "").strip().lower()
    clean_user = username.strip().lower()
    
    query = """
        SELECT n.id, n.title, n.owner, n.created_at, n.updated_at,
               'owner' as role,
               json_array_length(n.cells_json) as cell_count
        FROM notebooks n
        WHERE LOWER(n.owner) = ?
        UNION
        SELECT n.id, n.title, n.owner, n.created_at, n.updated_at,
               s.role as role,
               json_array_length(n.cells_json) as cell_count
        FROM notebooks n
        JOIN notebook_shares s ON n.id = s.notebook_id
        WHERE LOWER(s.user_or_email) = ? OR LOWER(s.user_or_email) = ?
        ORDER BY updated_at DESC
    """
    rows = conn.execute(query, (clean_user, clean_user, clean_email)).fetchall()
    conn.close()
    
    role_weights = {'owner': 3, 'editor': 2, 'viewer': 1}
    notebooks_dict = {}
    for r in rows:
        d = dict(r)
        nid = d["id"]
        if nid not in notebooks_dict:
            notebooks_dict[nid] = d
        else:
            if role_weights.get(d["role"], 0) > role_weights.get(notebooks_dict[nid]["role"], 0):
                notebooks_dict[nid] = d
    return list(notebooks_dict.values())

def delete_notebook(notebook_id: str):
    conn = get_db_connection()
    conn.execute("DELETE FROM notebooks WHERE id = ?", (notebook_id,))
    conn.execute("DELETE FROM notebook_shares WHERE notebook_id = ?", (notebook_id,))
    conn.commit()
    conn.close()

def share_notebook_with_user(share_id: str, notebook_id: str, user_or_email: str, role: str, invited_by: str) -> dict:
    conn = get_db_connection()
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    target = user_or_email.strip().lower()
    
    conn.execute("""
        DELETE FROM notebook_shares
        WHERE notebook_id = ? AND LOWER(user_or_email) = ?
    """, (notebook_id, target))
    
    conn.execute("""
        INSERT INTO notebook_shares (id, notebook_id, user_or_email, role, invited_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (share_id, notebook_id, target, role.lower(), invited_by, now))
    conn.commit()
    conn.close()
    return {"id": share_id, "notebook_id": notebook_id, "user_or_email": target, "role": role.lower(), "invited_by": invited_by, "created_at": now}

def get_notebook_shares(notebook_id: str) -> List[dict]:
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT id, notebook_id, user_or_email, role, invited_by, created_at
        FROM notebook_shares
        WHERE notebook_id = ?
        ORDER BY created_at ASC
    """, (notebook_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def remove_notebook_share(notebook_id: str, user_or_email: str):
    conn = get_db_connection()
    conn.execute("""
        DELETE FROM notebook_shares
        WHERE notebook_id = ? AND LOWER(user_or_email) = LOWER(?)
    """, (notebook_id, user_or_email.strip()))
    conn.commit()
    conn.close()

def check_user_notebook_role(notebook_id: str, username: str, email: Optional[str] = None) -> Optional[str]:
    conn = get_db_connection()
    nb = conn.execute("SELECT owner FROM notebooks WHERE id = ?", (notebook_id,)).fetchone()
    if not nb:
        conn.close()
        return None
    if nb["owner"].strip().lower() == username.strip().lower():
        conn.close()
        return "owner"
    
    clean_email = (email or "").strip().lower()
    clean_user = username.strip().lower()
    shares = conn.execute("""
        SELECT role FROM notebook_shares
        WHERE notebook_id = ? AND (LOWER(user_or_email) = ? OR LOWER(user_or_email) = ?)
    """, (notebook_id, clean_user, clean_email)).fetchall()
    conn.close()
    if not shares:
        return None
    
    roles = [s["role"].lower() for s in shares]
    if "editor" in roles:
        return "editor"
    if "viewer" in roles:
        return "viewer"
    return None


