import urllib.request
import urllib.parse
import json

BASE_URL = "http://localhost:8000"

def post_json(path, data, token=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def get_json(path, token=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}"} if token else {},
        method="GET"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def put_json(path, data, token=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="PUT"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def delete_req(path, token=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}"} if token else {},
        method="DELETE"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def test_flow():
    print("--- 1. Testing User Registration ---")
    # Register Quant Lead
    status, res = post_json("/api/auth/register", {
        "username": "lead_quant",
        "password": "quant_password_123",
        "full_name": "Lead Quant Dr. Sarah",
        "email": "sarah@quantaratrading.com"
    })
    if status == 400 and "already registered" in res.get("detail", ""):
        print("Lead quant already exists, logging in instead...")
        # Get token
        data = urllib.parse.urlencode({"username": "lead_quant", "password": "quant_password_123"}).encode()
        req = urllib.request.Request(f"{BASE_URL}/api/auth/token", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        with urllib.request.urlopen(req) as resp:
            lead_token = json.loads(resp.read().decode())["access_token"]
    else:
        assert status == 200, f"Registration failed: {res}"
        lead_token = res["access_token"]
    print("✓ Lead Quant authenticated with token.")

    # Register Junior Analyst (Viewer)
    status, res = post_json("/api/auth/register", {
        "username": "junior_alex",
        "password": "alex_password_123",
        "full_name": "Alex Smith",
        "email": "alex@quantaratrading.com"
    })
    if status == 400 and "already registered" in res.get("detail", ""):
        data = urllib.parse.urlencode({"username": "junior_alex", "password": "alex_password_123"}).encode()
        req = urllib.request.Request(f"{BASE_URL}/api/auth/token", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        with urllib.request.urlopen(req) as resp:
            junior_token = json.loads(resp.read().decode())["access_token"]
    else:
        assert status == 200, f"Registration failed: {res}"
        junior_token = res["access_token"]
    print("✓ Junior Analyst registered & authenticated.")

    print("\n--- 2. Testing Notebook Creation & Persistence ---")
    nb_id = "test-nb-drl-alpha"
    status, res = post_json("/api/notebooks", {
        "id": nb_id,
        "title": "Tadawul DRL Production Strategy",
        "cells": [
            {"id": "c1", "type": "markdown", "content": "# Production Model"},
            {"id": "c2", "type": "code", "content": "print('Alpha pipeline running.')"}
        ]
    }, token=lead_token)
    assert status == 200, f"Failed to create notebook: {res}"
    print(f"✓ Notebook created in SQLite: {res['id']}, owner={res['owner']}")

    print("\n--- 3. Testing Collaborator Sharing (Inviting Junior as VIEWER) ---")
    status, res = post_json(f"/api/notebooks/{nb_id}/share", {
        "user_or_email": "junior_alex",
        "role": "viewer"
    }, token=lead_token)
    assert status == 200, f"Failed to share notebook: {res}"
    print(f"✓ Shared notebook with junior_alex as VIEWER")

    print("\n--- 4. Verifying Accessible Notebooks for Junior Analyst ---")
    status, res = get_json("/api/notebooks", token=junior_token)
    assert status == 200, f"Failed to list notebooks: {res}"
    junior_nb = next((n for n in res if n["id"] == nb_id), None)
    assert junior_nb is not None, "Notebook not listed for junior analyst"
    assert junior_nb["role"] == "viewer", f"Expected role 'viewer', got {junior_nb['role']}"
    print(f"✓ Junior Analyst sees shared notebook with role: {junior_nb['role']}")

    print("\n--- 5. Verifying Permission Enforcement (VIEWER cannot save or execute) ---")
    # Test Viewer attempting to PUT changes
    status, res = put_json(f"/api/notebooks/{nb_id}", {
        "title": "Hacked Title",
        "cells": []
    }, token=junior_token)
    assert status == 403, f"Expected 403 Forbidden for viewer update, got {status}: {res}"
    print(f"✓ Correctly blocked Viewer from saving changes: 403 Forbidden ({res['detail']})")

    # Test Viewer attempting code execution
    status, res = post_json("/api/execute", {
        "code": "print('Malicious attempt')",
        "session_id": nb_id
    }, token=junior_token)
    assert status == 403, f"Expected 403 Forbidden for viewer execution, got {status}: {res}"
    print(f"✓ Correctly blocked Viewer from executing cells: 403 Forbidden ({res['detail']})")

    print("\n--- 6. Verifying Owner Deletion Permissions ---")
    # Junior attempts to delete notebook
    status, res = delete_req(f"/api/notebooks/{nb_id}", token=junior_token)
    assert status == 403, f"Expected 403 Forbidden for viewer deletion, got {status}: {res}"
    print(f"✓ Correctly blocked non-owner from deleting notebook: 403 Forbidden")

    # Lead Quant (Owner) deletes notebook
    status, res = delete_req(f"/api/notebooks/{nb_id}", token=lead_token)
    assert status == 200, f"Owner delete failed: {res}"
    print(f"✓ Notebook successfully cleaned up by Owner.")

    print("\n=======================================================")
    print("ALL MULTI-TENANT & ROLE-BASED ACCESS CHECKS PASSED!")
    print("=======================================================")

if __name__ == "__main__":
    test_flow()
