# Nexus Data Platform

Nexus is an enterprise-grade, highly modular interactive notebook platform designed specifically for autonomous trading companies. It provides Quantitative Analysts and Data Engineers with a Notion-style interface for backtesting, real-time data engineering, and interactive visualizations.

## 🌟 Core Features

- **Interactive Execution Engine:** Powered by a persistent headless Jupyter Kernel wrapper via FastAPI.
- **Rich Media & Visualizations:** Native support for interactive Plotly charts, Pandas Styler HTML heatmaps, and base64 imagery directly inside the editor.
- **Local Data Lake Pipeline:** Built-in templates utilizing DuckDB and PyArrow for hyper-fast localized Parquet transformations.
- **Modular Enterprise Backend:** 
  - JWT Authentication & RBAC (`auth.py`)
  - APScheduler for Headless Cron Jobs (`scheduler.py`)
  - Asynchronous Locking for Race Condition Prevention (`kernel.py`)
- **Notion-Style UI:** Auto-resizing Monaco editor cells with highly polished custom CSS.

## 🏗️ Architecture

- **Frontend:** React + Vite + Monaco Editor + Lucide Icons.
- **Backend API:** Python FastAPI + Uvicorn.
- **Execution Layer:** `jupyter_client` (IPython Kernel).
- **Collaboration Server:** `y-websocket` Node.js server (Foundation for Yjs CRDTs).

## 🚀 Getting Started

The easiest way to run the entire platform (Backend, Frontend, and Sync Server) is using the provided master script:

```bash
./start_all.sh
```
Navigate to `http://localhost:5173`. 
*(Default Login: `admin` / `admin`)*

---

### Manual Startup (Service by Service)

If you prefer to run the services individually for debugging:

**1. Start the Backend (Execution Engine)**

The backend handles code execution, scheduling, and authentication.

```bash
cd backend
# Create and activate virtual environment
uv venv .venv
source .venv/bin/activate
# Install dependencies
uv pip install fastapi uvicorn jupyter_client pydantic-settings python-jose[cryptography] bcrypt python-multipart apscheduler duckdb pyarrow polars yfinance plotly scipy pandas
# Run the API
uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend (React UI)

The frontend provides the interactive workspace.

```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173`. 
*(Default Login: `admin` / `admin`)*

### 3. Start the Collaborative Sync Server (Optional)

We use a local `y-websocket` server to handle real-time multiplayer CRDT sync.

```bash
cd yjs-backend
npm install
./start.sh
```

## 📂 Project Structure

```text
dpp/
├── backend/
│   ├── main.py          # FastAPI Router & Middleware
│   ├── kernel.py        # ExecutionManager (Jupyter lifecycle)
│   ├── auth.py          # JWT & User Management
│   ├── scheduler.py     # APScheduler Headless Cron
│   └── config.py        # Pydantic Settings
├── frontend/
│   ├── src/App.jsx      # Main React Application & UI
│   └── src/index.css    # Custom Notion-style styling
├── yjs-backend/         # Real-time WebSocket CRDT Server
└── datalake/            # Auto-generated DuckDB / Parquet storage
```

## 🛠️ Built-in Templates

Nexus comes pre-loaded with industry-standard Quant templates:
1. **Data Engineering (Parquet Pipeline):** Demonstrates ingesting 100k rows of tick CSV data and aggregating it to 1-minute OHLCV Parquet files using DuckDB.
2. **Quantitative Signal Analysis:** Downloads live BTC-USD data via `yfinance` and plots interactive Bollinger Bands using Plotly.
3. **Order Book Imbalance Matrix:** Simulates L2 limit order book data and renders a beautiful HTML Pandas gradient heatmap.
4. **Portfolio Backtest Tear Sheet:** Simulates a mean-reversion algorithm equity curve and calculates Sharpe Ratio and Max Drawdown.
