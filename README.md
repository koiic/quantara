# Quantara Quantitative & Autonomous DRL Trading Platform

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react)](https://react.dev)
[![Gymnasium](https://img.shields.io/badge/Gymnasium-1.0+-brightgreen)](https://gymnasium.farama.org)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

Quantara (قنطرة — *The Arch / Bridge*) is an institutional quantitative research, multi-market data engineering, and autonomous Deep Reinforcement Learning (DRL) pre/post-processing platform designed for algorithmic trading firms, quantitative funds, and AI research teams.

It bridges the gap between interactive Python research notebooks, high-frequency execution backtesting, and stakeholder executive reporting (Streamlit), with real-time multiplayer collaboration, Git-like strategy version control, and granular role-based access control (`OWNER`, `EDITOR`, `VIEWER`).

---

## 🏛️ Platform Architecture

```
                  Public Internet (Public IP on :80 or Custom Domain on :443)
                                               │
                                               ▼
                     ┌──────────────────────────────────────────────────┐
                     │       Caddy / Nginx Reverse Proxy (SSL / TLS)     │
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

## 🌟 Complete Feature Inventory

### 1. Interactive Quant Research Canvas
- **Multi-Session Jupyter Kernels:** Isolated background `ipykernel` instances per notebook session with interrupt (SIGINT) and memory-reset capabilities.
- **Rich Media Output:** Native rendering for interactive Plotly charts (candlesticks, volume bars, subplots), Pandas Styler HTML heatmaps, SVG, and console streams.
- **Notion-Style Canvas:** Auto-resizing Monaco editor cells, Markdown text blocks, drag-and-drop reordering, block duplication, and cell outputs collapse.

### 2. Autonomous DRL Engine & Quant Studio
- **Multi-Market Harmonization:** Vectorized alignment of heterogeneous market sessions across Saudi Tadawul (TASI Sun–Thu), US Equities (NYSE/NASDAQ), Brent Crude, and FX.
- **Feature Engineering & Stationarity:** Marcos López de Prado memory-preserving Fractional Differencing ($d=0.45$), Microstructure Order Flow Imbalance (OFI), and Volume-Synchronized Probability of Toxicity (VPIN).
- **Vectorized Gymnasium Environment (`QuantaraTradingEnv`):** Standardized observation vector, continuous action sizing $[-1.0, 1.0]$, Differential Sharpe ratio reward formulation (Moody & Saffell), and venue friction accounting (Tadawul 15.5 bps broker fee + 15% VAT, Almgren-Chriss non-linear slippage).
- **Policy Behavioral Audit:** Shannon Action Entropy distribution auditor detecting policy inertia or action collapse.
- **CTO Executive Tear Sheet Generator:** 1-Click generation of PDF/HTML tear sheets displaying equity curves, Sharpe ratio, Sortino, Calmar, Max Drawdown, and Value at Risk (VaR).

### 3. Streamlit Executive Studio Integration
- **Zero-Friction Presentation View:** Live Streamlit dashboards embedded directly into the platform for stakeholder and CTO briefings.
- **1-Click Notebook Exporter:** Automatically compiles any interactive quant notebook into an autonomous, interactive Streamlit dashboard.
- **Headless Process Manager:** Background lifecycle management for Streamlit applications via FastAPI without terminal intervention.

### 4. Real-Time Market Depth & L2 Order Book Ladder
- **WebSocket Depth Streaming (`/api/market/ws`):** Real-time order book ladders broadcast every 500ms across crypto, equities, commodities, and FX.
- **Institutional Ticker Tape:** Live multi-market ticker displaying prices, percent changes, and bid/ask volume distribution.
- **Queue Imbalance Heatmap:** Order Book Imbalance Matrix ($\rho = \frac{Bids - Asks}{Bids + Asks}$) computed across 10 depth levels.

### 5. Risk Sentinel: Extreme Tail Risk Stress Testing
- **Crisis Scenario Presets:** 1-click simulation against historic tail risk events:
  - 2020 COVID Liquidity Panic (-38%)
  - 2022 FTX Counterparty Contagion (-55%)
  - 2010 Flash Crash (-9%)
  - 2008 Lehman Systemic Freeze (-48%)
  - 2023 SVB Duration Shock (-16%)
- **Quantitative Metrics:** Historical VaR (95%/99%), Conditional VaR (Expected Shortfall CVaR), Leverage Margin Call Thresholds, and Recovery Days estimate.

### 6. Strategy Version Control (Git-like Checkpoints & Diffs)
- **Strategy Commit History:** Create named strategy checkpoints with commit messages, author attribution, and timestamps.
- **Visual Code Diff Viewer:** Side-by-side inspection of modified code and parameters between strategy versions.
- **1-Click Rollback:** Instant restoration of prior strategy states without data loss.

### 7. Data Lake & High-Speed Parquet Engine
- **DuckDB + PyArrow Local Lake:** Sub-millisecond queries on aggregated tick data and partitioned OHLCV Parquet datasets.
- **Interactive SQL Explorer:** Modal for testing DuckDB SQL queries directly on parquet storage.

### 8. Institutional Automated Job Scheduling
- **APScheduler Engine:** Headless cron job scheduling for data pipelines, automated backtests, and daily model retraining.
- **Audit Run Logs:** Complete execution history (status, start time, end time, cell outputs, errors) persisted in SQLite.

### 9. AI Quant Copilot
- **Alpha Synthesizer & Bias Auditor:** Synthesizes institutional quantitative models with a single prompt.
- **Lookahead Bias Detection:** Audits code blocks for data leakage, future data snooping, and survivorship bias.

### 10. Multi-User Collaboration & Granular RBAC
- **User Registration & JWT Auth:** Self-service registration (`POST /api/auth/register`) with bcrypt hashing and JWT session tokens.
- **SQLite WAL Concurrency:** High-concurrency SQLite storage with Write-Ahead Logging (`PRAGMA journal_mode = WAL`) and busy timeouts.
- **Role-Based Access Control (RBAC):**
  - **`OWNER`:** Full control, notebook deletion, collaborator invitations, and permission management.
  - **`EDITOR`:** Can edit notebook code, save changes, and execute kernel cells. Cannot delete notebook.
  - **`VIEWER`:** Read-only presentation mode. Monaco editor is locked (`readOnly: true`), code execution is disabled (enforced on frontend & backend with `403 Forbidden`).
- **Share Modal & Direct Link Generator:** Generates `http://<host>/?notebook=<id>` direct links and manages team invites by email or username.
- **Multiplayer CRDT Sync:** Real-time multi-user cursor tracking, awareness avatars, and collaborative editing via Yjs (`y-websocket`).

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- SQLite 3

### 1-Click Local Launch
```bash
# Clone the repository
git clone https://github.com/your-org/quantara-quant-platform.git
cd quantara-quant-platform/dpp

# Run all services concurrently (FastAPI, React, Streamlit, Yjs)
./start_all.sh
```

Navigate to `http://localhost:5173`.
- **Default Admin Account:** `admin` / `admin`
- **Default Quant Account:** `quant1` / `quant123`
- Or click **Create Account** to register a new user profile.

---

## 🌐 Production Deployment (Option A: Native Systemd + Caddy)

Quantara is optimized for native host execution without Docker memory overhead, allowing a low-cost VPS (< €8/month) to comfortably host concurrent quants, Jupyter kernels, and Streamlit.

### Recommended VPS:
* **Top Pick:** **Hetzner Cloud CPX21** (€7.05/mo, 3 vCPUs AMD Milan, 4 GB RAM, 80 GB NVMe SSD).
* **Memory Footprint:** < 600 MB idle, ~2.5 GB peak with active DRL rollouts.

### Automated 1-Click Deployment (Ubuntu / Debian VPS)
```bash
# 1. SSH into your VPS as root
ssh root@<YOUR_VPS_IP>

# 2. Clone repository to /opt/quantara
git clone https://github.com/your-org/quantara-quant-platform.git /opt/quantara
cd /opt/quantara

# 3. Execute automated production deployer
sudo bash dpp/deploy/deploy.sh
```

### Dual Networking (Public IP & Custom Domain)
- **Public IP:** Works out-of-the-box at `http://<YOUR_VPS_IP>` (Port 80).
- **Custom Domain:** Point your DNS A-Record to the VPS IP, edit `/etc/caddy/Caddyfile`, and run `systemctl reload caddy`. Automatic HTTPS is provisioned in seconds.

---

## 📂 Repository Structure

```text
dpp/
├── backend/
│   ├── main.py                 # FastAPI application & kernel execution router
│   ├── kernel.py               # Jupyter ipykernel manager (ZeroMQ)
│   ├── auth.py                 # User registration & JWT authentication
│   ├── database.py             # SQLite WAL database & schema migrations
│   ├── notebooks_api.py        # Multi-user notebook persistence & sharing API
│   ├── drl_pipeline.py         # Autonomous DRL end-to-end pipeline API
│   ├── drl_preprocessor.py     # Multi-market harmonization & fractional differencing
│   ├── drl_backtester.py       # Almgren-Chriss fee-realistic DRL backtester
│   ├── executive_reports.py    # CTO briefing reports & PDF tear sheets
│   ├── risk_sentinel.py        # Tail risk stress testing & CVaR engine
│   ├── market_stream.py        # Real-time WebSocket L2 market depth feed
│   ├── version_control.py      # Strategy Git checkpoints & visual diffs
│   ├── datalake.py             # DuckDB Parquet storage & SQL queries
│   ├── scheduler.py            # APScheduler automated cron scheduler
│   ├── streamlit_manager.py    # Background Streamlit process controller
│   └── test_multitenant_flow.py # Automated end-to-end multi-tenant test suite
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main quantitative workspace & UI
│   │   ├── config.js           # Dynamic origin & WebSocket protocol resolver
│   │   ├── components/
│   │   │   ├── DRLStudioView.jsx           # DRL pre/post-processing studio
│   │   │   ├── ShareNotebookModal.jsx      # Team sharing, link generator & RBAC
│   │   │   ├── MarketDepthView.jsx         # Real-time L2 order book ladder
│   │   │   ├── RiskSentinelView.jsx        # Stress testing & VaR simulator
│   │   │   ├── VersionControlDrawer.jsx    # Strategy Git checkpoints & diffs
│   │   │   ├── ExecutiveBriefingModal.jsx  # PDF tear sheet briefing modal
│   │   │   ├── QuantCopilotDrawer.jsx      # AI Alpha synthesizer & bias auditor
│   │   │   └── TickerTape.jsx              # Real-time institutional ticker tape
│   │   └── index.css           # Institutional financial styling
│   └── package.json
├── deploy/
│   ├── deploy.sh               # 1-click automated production installer
│   ├── Caddyfile               # Caddy reverse proxy (Public IP + Custom Domain)
│   ├── nginx.conf              # Nginx alternative reverse proxy
│   └── systemd/                # Systemd service units (backend, yjs, streamlit)
├── streamlit_apps/
│   ├── drl_quant_studio.py     # Interactive DRL strategy exploration studio
│   └── executive_dashboard.py  # Institutional executive performance briefing
└── README.md
```

---

## 🔒 Security & Role Enforcement

| Operation | `OWNER` | `EDITOR` | `VIEWER` |
|---|:---:|:---:|:---:|
| **Read Strategy & Visualizations** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Export Streamlit / Tear Sheets** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Edit Code & Markdown Cells** | ✅ Allowed | ✅ Allowed | ❌ Read-Only Lockdown |
| **Execute Kernel Code** | ✅ Allowed | ✅ Allowed | ❌ Blocked (`403 Forbidden`) |
| **Save Notebook Changes** | ✅ Allowed | ✅ Allowed | ❌ Blocked (`403 Forbidden`) |
| **Invite Team Collaborators** | ✅ Allowed | ❌ Disabled | ❌ Disabled |
| **Delete Notebook** | ✅ Allowed | ❌ Blocked (`403 Forbidden`) | ❌ Blocked (`403 Forbidden`) |

---

## 📄 License
Proprietary & Confidential. Developed for autonomous quantitative trading research.
