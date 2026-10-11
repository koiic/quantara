# Quantara Quant Platform: Production Deployment & Architecture Blueprint

This document specifies the institutional production configuration, resource benchmarks, VPS recommendations, and multi-user collaboration workflow for the **Quantara Autonomous Quantitative & DRL Platform**.

---

## 1. System Topology & Reverse Proxy Routing

```
        Public Internet (Dual Mode: Public IP on :80 or Custom Domain on :443)
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       Caddy / Nginx Reverse Proxy (SSL / TLS)     │
             │   - Dual Mode: Raw Public IP (:80) or Domain (:443)│
             │   - Automated Let's Encrypt TLS Certificate       │
             │   - WebSocket Upgrade & Multiplexing Router       │
             │   - Static Asset Serving (Vite / React dist)      │
             └───────┬──────────────────┬─────────────────┬─────┘
                     │                  │                 │
         /api/*      │     /yjs-ws/*    │   /streamlit/*  │
                     ▼                  ▼                 ▼
             ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
             │ FastAPI App  │   │ Yjs Collab   │   │ Streamlit    │
             │ (Port 8000)  │   │ Server (Node)│   │ Studio (8501)│
             │ Kernel Mgr,  │   │ (Port 1234)  │   │ Exec Briefing│
             │ Schedulers   │   │ CRDT Sync    │   │ Dashboards   │
             └───────┬──────┘   └──────────────┘   └──────────────┘
                     │
         ZeroMQ      ▼
        ┌───────────────────────────────┐
        │ Jupyter Kernel Worker Sessions│
        │ (Session-isolated ipykernels) │
        └───────────────────────────────┘
```

---

## 2. Cheapest VPS Provider Matrix

| Provider | Plan | Compute Specs | Monthly Cost | Recommendation |
|---|---|---|---|---|
| **Hetzner Cloud** *(Top Pick)* | **CPX21** | **3 vCPUs (AMD Milan), 4 GB RAM, 80 GB NVMe, 20 TB Traffic** | **€7.05 / mo** (~$7.60) | **★★★★★ Best Value.** Sub-millisecond NVMe I/O for DuckDB & Parquet pipelines. |
| **Hetzner Cloud** *(Power Pick)* | **CPX31** | **4 vCPUs (AMD Milan), 8 GB RAM, 160 GB NVMe, 20 TB Traffic** | **€13.40 / mo** (~$14.50) | **★★★★★ Heavy DRL Workloads.** Ideal for multi-agent parallel rollouts. |
| **Contabo** | **Cloud VPS S** | 4 vCPUs, 6 GB RAM, 100 GB NVMe, 32 TB Traffic | €5.50 / mo (~$6.00) | **★★★★☆ Budget Pick.** Great raw memory per euro; shared CPU neighbors. |
| **OVHcloud** | **VPS Essential**| 2 vCPUs, 4 GB RAM, 80 GB SSD, Unmetered | $7.00 / mo | **★★★★☆ Enterprise Security.** Built-in Anti-DDoS protection included. |

> [!TIP]
> **Recommended Selection:** **Hetzner CPX21 (€7.05/mo)**. It provides dedicated-class AMD Milan performance, lowest latency, and allows the entire platform to run comfortably under 4 GB RAM with zero Docker overhead.

---

## 3. Production Features Implemented

### A. Dual IP & Custom Domain Networking
- Works immediately upon deployment using the server's public IP: `http://<VPS_PUBLIC_IP>`
- Pre-configured to support custom domains with automated Let's Encrypt TLS: `https://quant.yourfirm.com`
- Client frontend dynamically resolves origin and WebSocket protocols (`ws://` vs `wss://`, `http://` vs `https://`) via [`config.js`](file:///home/calory/Work/tries/app/dpp/frontend/src/config.js).

### B. User Registration & Sign Up
- **Endpoint**: `POST /api/auth/register` in [`auth.py`](file:///home/calory/Work/tries/app/dpp/backend/auth.py).
- Allows quants to sign up with `username`, `password`, `full_name`, and corporate `email`.
- Bcrypt password hashing + instant JWT access token issuance upon registration.
- Duplicate username and email prevention with SQLite constraints.

### C. Persistent Multi-User Notebooks
- **Storage**: SQLite with Write-Ahead Logging (`WAL` mode) and 5000ms busy timeout in [`database.py`](file:///home/calory/Work/tries/app/dpp/backend/database.py).
- Quants' strategies, formulas, code cells, and outputs are permanently persisted across browser refreshes and server reboots.
- Endpoints in [`notebooks_api.py`](file:///home/calory/Work/tries/app/dpp/backend/notebooks_api.py):
  - `GET /api/notebooks`: Lists all accessible notebooks for the quant (owned + shared).
  - `GET /api/notebooks/{id}`: Fetches complete notebook cells and role permission.
  - `POST /api/notebooks`: Creates a new notebook with the creator as `owner`.
  - `PUT /api/notebooks/{id}`: Updates notebook cells and title (checks permissions).
  - `DELETE /api/notebooks/{id}`: Permanently deletes notebook (restricted to `owner`).

### D. Granular Role-Based Access Control (RBAC)
| Role | Code Editing | Kernel Execution | Save Changes | Share & Invite | Delete Notebook |
|---|:---:|:---:|:---:|:---:|:---:|
| **OWNER** | ✅ Full | ✅ Full | ✅ Allowed | ✅ Full Control | ✅ Allowed |
| **EDITOR** | ✅ Full | ✅ Full | ✅ Allowed | ❌ Read Shares Only | ❌ Blocked (403) |
| **VIEWER** | ❌ Locked (Read-Only) | ❌ Disabled (403) | ❌ Blocked (403) | ❌ Read Shares Only | ❌ Blocked (403) |

- **UI Enforcement**:
  - `VIEWER` displays a prominent golden badge: `Viewer (Read-Only)`.
  - Monaco Editor is locked (`readOnly: true`).
  - Run Cell, Run All, Restart Kernel, Interrupt, and Add Block buttons are disabled/hidden.
  - Markdown text blocks are displayed in render-only mode without double-click edit triggers.
- **Backend Enforcement**:
  - `PUT /api/notebooks/{id}` returns `403 Forbidden` if caller has `viewer` role.
  - `POST /api/execute` checks the notebook session role and returns `403 Forbidden` if a viewer attempts to send code to the kernel.

### E. Team Collaboration & Share Modal
- Dedicated Share Modal in [`ShareNotebookModal.jsx`](file:///home/calory/Work/tries/app/dpp/frontend/src/components/ShareNotebookModal.jsx):
  - Direct shareable link generator: `http://<host>/?notebook=<id>` with 1-click clipboard copy.
  - Invite team members by username or email, selecting their role (`Editor` vs `Viewer`).
  - Real-time collaborator access list with role badges and owner revoke actions.

---

## 4. Production Deployment Files Created

All deployment assets are prepared in [`dpp/deploy/`](file:///home/calory/Work/tries/app/dpp/deploy/):

1. [`dpp/deploy/Caddyfile`](file:///home/calory/Work/tries/app/dpp/deploy/Caddyfile): Reverse proxy supporting both `:80` public IP and custom domain with automated SSL.
2. [`dpp/deploy/nginx.conf`](file:///home/calory/Work/tries/app/dpp/deploy/nginx.conf): Standard Nginx alternative configuration.
3. [`dpp/deploy/systemd/nexus-backend.service`](file:///home/calory/Work/tries/app/dpp/deploy/systemd/nexus-backend.service): Systemd daemon for FastAPI backend.
4. [`dpp/deploy/systemd/nexus-yjs.service`](file:///home/calory/Work/tries/app/dpp/deploy/systemd/nexus-yjs.service): Systemd daemon for Yjs multiplayer WebSocket server.
5. [`dpp/deploy/systemd/nexus-streamlit.service`](file:///home/calory/Work/tries/app/dpp/deploy/systemd/nexus-streamlit.service): Systemd daemon for Streamlit executive studio.
6. [`dpp/deploy/deploy.sh`](file:///home/calory/Work/tries/app/dpp/deploy/deploy.sh): Automated 1-click deployment script.

---

## 5. 1-Click Deployment Guide

To deploy on a fresh Hetzner Ubuntu 22.04 / 24.04 VPS:

```bash
# 1. SSH into the VPS
ssh root@<YOUR_VPS_IP>

# 2. Clone repository or upload project directory
git clone https://github.com/your-org/nexus-quant-platform.git /opt/nexus
cd /opt/nexus

# 3. Run the automated deployment script
sudo bash dpp/deploy/deploy.sh
```

The script will automatically:
- Install Caddy, Node.js 20, Python 3, and build dependencies.
- Compile the React frontend with `npm run build`.
- Install Python requirements in `.venv`.
- Install and start the 3 systemd services.
- Configure Caddy for both Public IP and custom domain.
- Print your ready-to-use URL: `http://<YOUR_VPS_IP>`.
