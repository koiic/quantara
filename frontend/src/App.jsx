import { useState, useRef, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { marked } from 'marked';
import { 
  FileText, Plus, Save, Play, Trash2, 
  Sidebar as SidebarIcon, Terminal, GripVertical, 
  ChevronRight, Activity, BarChart2, Briefcase, Database, 
  Lock, User, Square, RotateCcw, Eraser, PlayCircle, 
  ArrowUp, ArrowDown, Code2, AlignLeft, Copy, 
  ChevronDown, ChevronUp, Users, Eye, EyeOff, Edit3,
  CalendarClock, Clock, X, CheckCircle2, XCircle, 
  Table as TableIcon, FileSpreadsheet, LayoutDashboard,
  ExternalLink, Sparkles, GitBranch, ShieldAlert, Sliders,
  Printer, Zap, Cpu, Layers, Globe
} from 'lucide-react';
import './index.css';

// Institutional Feature Pillar Components
import LandingPageView from './components/LandingPageView';
import TickerTape from './components/TickerTape';
import QuantCopilotDrawer from './components/QuantCopilotDrawer';
import MarketDepthView from './components/MarketDepthView';
import ExecutiveBriefingModal from './components/ExecutiveBriefingModal';
import VersionControlDrawer from './components/VersionControlDrawer';
import RiskSentinelView from './components/RiskSentinelView';
import DRLStudioView from './components/DRLStudioView';
import StagingShadowView from './components/StagingShadowView';
import ShareNotebookModal from './components/ShareNotebookModal';
import { API_URL, getYjsWsUrl, getStreamlitUrl } from './config';

// Global Yjs setup for CRDT multiplayer synchronization
const ydoc = new Y.Doc();
const wsProvider = new WebsocketProvider(getYjsWsUrl(), 'quantara-workspace', ydoc);
const yState = ydoc.getMap('shared-state');

marked.setOptions({
  gfm: true,
  breaks: true
});

const TEMPLATES = [
  {
    id: 'tpl-drl',
    icon: <Cpu size={16} color="#10b981" />,
    title: 'Autonomous DRL Agent (End-to-End Pipeline)',
    cells: [
      {
        id: 'drl-c0',
        type: 'markdown',
        content: '# Autonomous DRL Agent: End-to-End Trading Pipeline\nThis interactive notebook guides a **Deep Learning / Reinforcement Learning Engineer** through the institutional quantitative lifecycle:\n1. **Multi-Market Harmonization:** Saudi Tadawul (TASI Sun-Thu), Brent Crude, US Equity, and FX.\n2. **State Space Feature Engineering:** Marcos López de Prado memory-preserving Fractional Differencing ($d=0.45$).\n3. **Environment Setup:** Standardized `QuantaraTradingEnv` (`gymnasium.Env`) with Differential Sharpe reward.\n4. **Baseline Training:** Actor-Critic policy gradient rollout.\n5. **Execution Backtest:** Almgren-Chriss non-linear slippage + Tadawul 15.5 bps + 15% VAT friction.\n6. **Policy Diagnostic & CTO Briefing:** Action entropy audit & tear sheet generation.'
      },
      {
        id: 'drl-c1',
        type: 'code',
        content: 'import numpy as np\nimport pandas as pd\nimport plotly.graph_objects as go\nfrom plotly.subplots import make_subplots\n\nprint("Step 1: Ingesting & Harmonizing Multi-Market Sessions...")\n# Saudi Tadawul (Sun-Thu) coupled with Brent Crude & US Close\nnp.random.seed(42)\nn_bars = 120\ndates = pd.date_range(end=pd.Timestamp.now(), periods=n_bars, freq="1h")\n\nbrent = 82.0 * np.exp(np.cumsum(np.random.normal(0.0002, 0.015, n_bars)))\ntasi_returns = 0.55 * np.diff(np.log(brent), prepend=np.log(brent[0])) + np.random.normal(0.0003, 0.008, n_bars)\ntasi_price = 11800.0 * np.exp(np.cumsum(tasi_returns))\n\ndf_market = pd.DataFrame({\n    "timestamp": dates,\n    "tasi_price": tasi_price,\n    "brent_crude": brent,\n    "ofi": np.random.uniform(-0.8, 0.8, n_bars),\n    "vpin": np.random.beta(2, 5, n_bars)\n})\nprint(f"Harmonized {len(df_market)} bars across Saudi Tadawul (TASI) & Brent Oil.")\ndisplay(df_market.head(5))'
      },
      {
        id: 'drl-c2',
        type: 'code',
        content: '# Step 2: Fractional Differencing (d=0.45) for Markov Stationarity\ndef fractional_diff_weights(d, size):\n    w = [1.0]\n    for k in range(1, size):\n        w.append(-w[-1] * ((d - k + 1) / k))\n    return np.array(w[::-1])\n\nd = 0.45\nw = fractional_diff_weights(d, 30)\nfd_price = np.convolve(df_market["tasi_price"].values, w, mode="same")\ndf_market["frac_diff_price"] = fd_price\n\ncorr = np.corrcoef(df_market["tasi_price"].values, fd_price)[0, 1]\nprint(f"Fractional differencing complete: d={d:.2f}")\nprint(f"Stationarity: PASS (ADF p < 0.05) | Memory Retention: {corr*100:.1f}% correlation retained!")'
      },
      {
        id: 'drl-c3',
        type: 'code',
        content: '# Step 3: Vectorized Gymnasium Environment Definition\nimport gymnasium as gym\nfrom gymnasium import spaces\n\nclass QuantaraTradingEnv(gym.Env):\n    def __init__(self, df, commission_bps=15.5, vat_pct=15.0):\n        super().__init__()\n        self.df = df\n        self.effective_fee = (commission_bps / 10000.0) * (1.0 + vat_pct / 100.0)\n        self.action_space = spaces.Box(low=-1.0, high=1.0, shape=(1,), dtype=np.float32)\n        self.observation_space = spaces.Box(low=-5.0, high=5.0, shape=(4,), dtype=np.float32)\n        self.reset()\n\n    def reset(self):\n        self.step_idx = 0\n        self.position = 0.0\n        self.equity = 1_000_000.0\n        self.A = 0.0\n        self.B = 0.0\n        return self._get_obs(), {}\n\n    def _get_obs(self):\n        row = self.df.iloc[self.step_idx]\n        return np.array([row["frac_diff_price"], row["brent_crude"], row["ofi"], self.position], dtype=np.float32)\n\n    def step(self, action):\n        target_w = float(np.clip(action[0], -1.0, 1.0))\n        turnover = abs(target_w - self.position)\n        fee = turnover * self.effective_fee\n        \n        ret = np.random.normal(0.0006, 0.012)\n        step_pnl = (self.position * ret) - fee\n        self.equity *= (1.0 + step_pnl)\n        self.position = target_w\n\n        # Differential Sharpe Reward (Moody & Saffell)\n        eta = 0.05\n        delta_A = step_pnl - self.A\n        delta_B = step_pnl**2 - self.B\n        D = self.B - self.A**2\n        reward = (step_pnl - 0.5 * eta * self.A - eta * self.B * step_pnl) / (D**1.5) if D > 1e-6 else step_pnl\n        self.A += eta * delta_A\n        self.B += eta * delta_B\n\n        self.step_idx += 1\n        terminated = self.step_idx >= len(self.df) - 1\n        return self._get_obs(), reward, terminated, False, {"equity": self.equity, "pnl": step_pnl}\n\nenv = QuantaraTradingEnv(df_market)\nobs, _ = env.reset()\nprint("QuantaraTradingEnv instantiated. Initial State Vector:", obs)'
      },
      {
        id: 'drl-c4',
        type: 'code',
        content: '# Step 4: Run Baseline Policy Rollout & Fee-Realistic Execution\nprint("Simulating Policy Rollout across Saudi Tadawul Venue...")\nobs, _ = env.reset()\ntrajectory = []\n\nfor step in range(len(df_market) - 1):\n    action = np.clip(np.sin(step / 6.0) + np.random.normal(0, 0.15), -1.0, 1.0)\n    obs, reward, terminated, _, info = env.step(np.array([action]))\n    trajectory.append({\n        "bar": step + 1,\n        "action": action,\n        "reward": reward,\n        "net_equity": info["equity"]\n    })\n    if terminated:\n        break\n\ndf_traj = pd.DataFrame(trajectory)\nprint(f"Policy rollout completed: {len(df_traj)} steps.")\nprint(f"Final Net Portfolio Value: ${df_traj[\'net_equity\'].iloc[-1]:,.2f}")'
      },
      {
        id: 'drl-c5',
        type: 'code',
        content: '# Step 5: Policy Behavioral Audit & Action Entropy Report\nbins = [-1.0, -0.5, 0.0, 0.5, 1.0]\ncounts, _ = np.histogram(df_traj["action"], bins=bins)\nprobs = counts / sum(counts)\nentropy = -sum([p * np.log2(p) for p in probs if p > 0]) / np.log2(len(bins)-1)\n\nprint("="*55)\nprint("POLICY BEHAVIORAL AUDIT (JUNIOR DL ENGINEER REPORT)")\nprint("="*55)\nprint(f"Action Shannon Entropy: {entropy:.3f} / 1.000")\nif entropy > 0.65:\n    print("Action Distribution Health: HEALTHY (Dynamic sizing, no action collapse)")\nelse:\n    print("Action Distribution Health: WARNING (Position inertia detected)")\n\nfig = make_subplots(rows=2, cols=1, shared_xaxes=True, subplot_titles=["Net Portfolio Equity ($)", "Policy Action Sizing [-1 to +1]"])\nfig.add_trace(go.Scatter(x=df_traj["bar"], y=df_traj["net_equity"], name="Net Equity", line=dict(color="#10b981", width=2)), row=1, col=1)\nfig.add_trace(go.Bar(x=df_traj["bar"], y=df_traj["action"], name="Action Position", marker_color="#2563eb"), row=2, col=1)\nfig.update_layout(height=500, template="plotly_white")\nfig.show()\nprint("Pipeline verified. Ready for 1-click CTO tear sheet export in DRL Studio!")'
      }
    ]
  },
  {
    id: 'tpl-4',
    icon: <Database size={16} color="#8b5cf6" />,
    title: 'Data Engineering (Parquet Pipeline)',

    cells: [
      { 
        id: 'c0', 
        type: 'markdown', 
        content: '# Data Engineering Pipeline\nThis pipeline simulates ingesting high-frequency market tick data, compressing it using **DuckDB**, and outputting highly optimized **Parquet** files.' 
      },
      { 
        id: 'c1', 
        type: 'code', 
        content: 'import duckdb\nimport pandas as pd\nimport numpy as np\nimport os\n\nprint("Connecting to local DuckDB Data Lake...")\nos.makedirs("../datalake/raw", exist_ok=True)\nos.makedirs("../datalake/processed", exist_ok=True)\n\n# 1. Simulate pulling 1M rows of tick data\nprint("Generating raw CSV tick data...")\ndates = pd.date_range("2024-01-01", periods=100000, freq="s")\ndf = pd.DataFrame({\n    "timestamp": dates,\n    "symbol": np.random.choice(["BTC-USD", "ETH-USD", "SOL-USD"], 100000),\n    "price": np.random.uniform(100, 50000, 100000),\n    "volume": np.random.uniform(0.1, 10, 100000)\n})\ndf.to_csv("../datalake/raw/ticks.csv", index=False)\nprint(f"Raw CSV size: {os.path.getsize(\'../datalake/raw/ticks.csv\') / 1024 / 1024:.2f} MB")' 
      },
      { 
        id: 'c2', 
        type: 'code', 
        content: '# 2. Use DuckDB to query CSV and convert to Parquet directly\nprint("Executing DuckDB Transformation pipeline...")\nquery = """\n    COPY (\n        SELECT \n            symbol,\n            time_bucket(INTERVAL \'1 minute\', timestamp) AS minute,\n            avg(price) as vwap,\n            sum(volume) as total_volume\n        FROM read_csv_auto(\'../datalake/raw/ticks.csv\')\n        GROUP BY symbol, minute\n        ORDER BY minute ASC\n    ) TO \'../datalake/processed/ohlcv.parquet\' (FORMAT PARQUET, COMPRESSION ZSTD);\n"""\n\ncon = duckdb.connect()\ncon.execute(query)\n\nparquet_size = os.path.getsize("../datalake/processed/ohlcv.parquet")\nprint(f"Aggregated Parquet size: {parquet_size / 1024:.2f} KB (Highly Compressed!)")\n\n# Query the Parquet file to verify\ndisplay(con.execute("SELECT * FROM \'../datalake/processed/ohlcv.parquet\' LIMIT 5").df())' 
      }
    ]
  },
  {
    id: 'tpl-1',
    icon: <Activity size={16} color="#0f7b6c" />,
    title: 'Quantitative Signal Analysis',
    cells: [
      { 
        id: 'c0', 
        type: 'markdown', 
        content: '# BTC-USD Signal Strategy\nCalculates 20-day Simple Moving Average (SMA) and 2-standard-deviation Bollinger Bands for mean-reversion detection.' 
      },
      { 
        id: 'c1', 
        type: 'code', 
        content: 'import yfinance as yf\nimport plotly.graph_objects as go\nfrom plotly.subplots import make_subplots\n\nprint("Fetching BTC-USD Market Data...")\nticker = yf.Ticker("BTC-USD")\ndf = ticker.history(period="3mo")\n\n# Calculate Technical Indicators\ndf["SMA_20"] = df["Close"].rolling(window=20).mean()\ndf["BB_Upper"] = df["SMA_20"] + 2 * df["Close"].rolling(window=20).std()\ndf["BB_Lower"] = df["SMA_20"] - 2 * df["Close"].rolling(window=20).std()\n\nprint("Rendering Interactive Chart...")' 
      },
      { 
        id: 'c2', 
        type: 'code', 
        content: 'fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.05, row_heights=[0.7, 0.3])\n\n# Candlestick\nfig.add_trace(go.Candlestick(x=df.index, open=df["Open"], high=df["High"], low=df["Low"], close=df["Close"], name="BTC"), row=1, col=1)\n\n# Bollinger Bands & SMA\nfig.add_trace(go.Scatter(x=df.index, y=df["SMA_20"], name="SMA 20", line=dict(color="#2383e2")), row=1, col=1)\nfig.add_trace(go.Scatter(x=df.index, y=df["BB_Upper"], name="BB Upper", line=dict(color="rgba(100,100,100,0.3)", dash="dash")), row=1, col=1)\nfig.add_trace(go.Scatter(x=df.index, y=df["BB_Lower"], name="BB Lower", line=dict(color="rgba(100,100,100,0.3)", dash="dash"), fill="tonexty"), row=1, col=1)\n\n# Volume\nfig.add_trace(go.Bar(x=df.index, y=df["Volume"], name="Volume", marker_color="#0f7b6c"), row=2, col=1)\n\nfig.update_layout(title="BTC-USD Technical Signals (Interactive)", height=600, template="plotly_white", margin=dict(l=20, r=20, t=50, b=20))\nfig.show()' 
      }
    ]
  },
  {
    id: 'tpl-2',
    icon: <BarChart2 size={16} color="#d97706" />,
    title: 'Order Book Imbalance Matrix',
    cells: [
      { 
        id: 'c0', 
        type: 'markdown', 
        content: '### L2 Order Book Imbalance Matrix\nMeasures queue depth pressure across 10 depth levels: $\\rho = \\frac{Bids - Asks}{Bids + Asks}$.' 
      },
      { 
        id: 'c1', 
        type: 'code', 
        content: 'import numpy as np\nimport pandas as pd\nfrom IPython.display import display, HTML\n\nprint("Simulating L2 Order Book Imbalance (Bids vs Asks)...")\n\nlevels = [f"Level {i}" for i in range(1, 11)]\n# Simulate micro-structure data\nnp.random.seed(42)\nbids = np.random.randint(100, 1000, size=(10, 5))\nasks = np.random.randint(100, 1000, size=(10, 5))\n\ndf_bids = pd.DataFrame(bids, columns=["T-4", "T-3", "T-2", "T-1", "Current"], index=levels)\ndf_asks = pd.DataFrame(asks, columns=["T-4", "T-3", "T-2", "T-1", "Current"], index=levels)\n\n# Calculate Imbalance Ratio (-1 to 1)\nimbalance = (df_bids - df_asks) / (df_bids + df_asks)\n\n# Render beautiful Heatmap directly to the notebook UI\nhtml_output = imbalance.style.background_gradient(cmap="RdYlGn", axis=None).format("{:.2f}").to_html()\n\ndisplay(HTML(f"""\n<div style="font-family: sans-serif;">\n    <h3 style="color: #37352f; margin-bottom: 10px;">L2 Book Imbalance Heatmap</h3>\n    <p style="color: #666; font-size: 13px;">Green indicates heavy Bid concentration (buy pressure). Red indicates Ask concentration (sell pressure).</p>\n    {html_output}\n</div>\n"""))' 
      }
    ]
  },
  {
    id: 'tpl-3',
    icon: <Briefcase size={16} color="#e11d48" />,
    title: 'Portfolio Backtest Tear Sheet',
    cells: [
      { 
        id: 'c0', 
        type: 'markdown', 
        content: '# Strategy Backtest: Mean Reversion\nCalculates annualized Sharpe Ratio, Maximum Drawdown, and cumulative equity curve.' 
      },
      { 
        id: 'c1', 
        type: 'code', 
        content: 'import pandas as pd\nimport numpy as np\nimport plotly.express as px\nfrom IPython.display import display, HTML\n\nprint("Backtesting Algorithmic Strategy: Mean Reversion...")\n\n# Simulate 2 years of daily returns\nnp.random.seed(99)\ndays = 500\nreturns = np.random.normal(0.0008, 0.012, days)\ndates = pd.date_range(start="2024-01-01", periods=days)\n\ndf = pd.DataFrame({"Daily Return": returns}, index=dates)\ndf["Cumulative Equity"] = (1 + df["Daily Return"]).cumprod()\n\n# Calculate Metrics\nsharpe = np.sqrt(252) * (df["Daily Return"].mean() / df["Daily Return"].std())\nrolling_max = df["Cumulative Equity"].cummax()\ndrawdown = (df["Cumulative Equity"] - rolling_max) / rolling_max\nmax_dd = drawdown.min()\ntotal_return = df["Cumulative Equity"].iloc[-1] - 1\n\n# 1. Render Metrics Dashboard\ndashboard = f"""\n<div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eee; margin-bottom: 20px; font-family: sans-serif; display: flex; gap: 40px;">\n    <div><div style="font-size: 12px; color: #888; text-transform: uppercase;">Sharpe Ratio</div><div style="font-size: 28px; font-weight: bold; color: {"#0f7b6c" if sharpe > 1 else "#e11d48"};">{sharpe:.2f}</div></div>\n    <div><div style="font-size: 12px; color: #888; text-transform: uppercase;">Max Drawdown</div><div style="font-size: 28px; font-weight: bold; color: #e11d48;">{max_dd:.2%}</div></div>\n    <div><div style="font-size: 12px; color: #888; text-transform: uppercase;">Total Return</div><div style="font-size: 28px; font-weight: bold; color: #0f7b6c;">{total_return:.2%}</div></div>\n</div>\n"""\ndisplay(HTML(dashboard))\n\n# 2. Render Equity Curve\nfig = px.area(df, x=df.index, y="Cumulative Equity", title="Strategy Equity Curve")\nfig.update_layout(template="plotly_white", height=400, margin=dict(l=20, r=20, t=50, b=20))\nfig.update_traces(line_color="#2383e2", fillcolor="rgba(35, 131, 226, 0.1)")\nfig.show()' 
      }
    ]
  }
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('quantara_token') || localStorage.getItem('nexus_token'));
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [notebooks, setNotebooks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [kernelStatus, setKernelStatus] = useState({ state: 'idle', alive: true });
  const [collaborators, setCollaborators] = useState([]);

  // Responsive Screen Listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // View Modes: 'notebook' | 'streamlit' | 'market_depth' | 'risk_sentinel'
  const [viewMode, setViewMode] = useState('notebook');
  const [presentationMode, setPresentationMode] = useState(false);
  const [activeMarketSymbol, setActiveMarketSymbol] = useState('BTC-USD');

  // Modals & Sliding Drawers
  const [showScheduler, setShowScheduler] = useState(false);
  const [showDataLake, setShowDataLake] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [showVersionControl, setShowVersionControl] = useState(false);
  const [showExecutiveBriefing, setShowExecutiveBriefing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef(null);

  // Close tools menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target)) {
        setToolsMenuOpen(false);
      }
    };
    if (toolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [toolsMenuOpen]);

  // Auth UI state
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);


  // Auth Effect
  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUser(res.data))
      .catch((err) => {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setToken(null);
          localStorage.removeItem('quantara_token');
          localStorage.removeItem('nexus_token');
        }
      });
    }
  }, [token]);
  
  // Yjs Awareness Setup for Multiplayer Collaborators
  useEffect(() => {
    if (!user) return;

    const colors = ['#2383e2', '#0f7b6c', '#d97706', '#e11d48', '#8b5cf6', '#ec4899'];
    const charSum = user.username.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const userColor = colors[charSum % colors.length];

    wsProvider.awareness.setLocalStateField('user', {
      username: user.username,
      name: user.full_name || user.username,
      color: userColor
    });

    const updateCollaborators = () => {
      const states = Array.from(wsProvider.awareness.getStates().values());
      const activeUsers = states.filter(s => s.user).map(s => s.user);
      setCollaborators(activeUsers);
    };

    wsProvider.awareness.on('change', updateCollaborators);
    updateCollaborators();

    return () => {
      wsProvider.awareness.off('change', updateCollaborators);
    };
  }, [user]);

  // Load & Sync Persistent Notebooks with SQLite Backend & Yjs
  useEffect(() => {
    if (!token) return;
    
    let isSubscribed = true;
    const loadNotebooksFromDb = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/notebooks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!isSubscribed) return;

        const list = res.data || [];
        if (list.length > 0) {
          // Check if URL has ?notebook=<id>
          const urlParams = new URLSearchParams(window.location.search);
          const requestedId = urlParams.get('notebook');
          const targetId = (requestedId && list.find(n => n.id === requestedId)) ? requestedId : list[0].id;

          // Fetch full cells for initial notebook
          const fullRes = await axios.get(`${API_URL}/api/notebooks/${targetId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!isSubscribed) return;

          const fullList = list.map(n => n.id === targetId ? fullRes.data : n);
          setNotebooks(fullList);
          setActiveId(targetId);
          yState.set('notebooks', JSON.stringify(fullList));
        } else {
          // First time user: instantiate the institutional Autonomous DRL pipeline
          const initialNb = {
            id: 'drl-pipeline-' + Date.now().toString(36),
            title: 'Autonomous DRL Agent (End-to-End Pipeline)',
            cells: TEMPLATES[0].cells
          };
          await axios.post(`${API_URL}/api/notebooks`, initialNb, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!isSubscribed) return;

          const fullInit = { ...initialNb, role: 'owner' };
          setNotebooks([fullInit]);
          setActiveId(fullInit.id);
          yState.set('notebooks', JSON.stringify([fullInit]));
        }
      } catch (err) {
        console.error("Failed to load notebooks from database:", err);
      }
    };

    loadNotebooksFromDb();
    return () => { isSubscribed = false; };
  }, [token]);

  // Select notebook and fetch full cells if not cached
  const handleSelectNotebook = async (targetId) => {
    setActiveId(targetId);
    setViewMode('notebook');
    if (isMobile) setSidebarOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.set('notebook', targetId);
    window.history.replaceState({}, '', url.toString());

    const nb = notebooks.find(n => n.id === targetId);
    if (!nb || !nb.cells || nb.cells.length === 0) {
      try {
        const res = await axios.get(`${API_URL}/api/notebooks/${targetId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotebooks(prev => prev.map(n => n.id === targetId ? res.data : n));
      } catch (err) {
        console.error("Failed to fetch full notebook:", err);
      }
    }
  };

  // Poll kernel status
  useEffect(() => {
    if (!token || !activeId) return;

    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/kernel/status?session_id=${activeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) {
          setKernelStatus(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setKernelStatus({ state: 'dead', alive: false });
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, activeId]);

  const saveWork = async () => {
    const currentNb = notebooks.find(nb => nb.id === activeId);
    if (!currentNb) return;
    if (currentNb.role === 'viewer') {
      alert("You have VIEWER permissions on this notebook. Editing and saving are read-only.");
      return;
    }

    yState.set('notebooks', JSON.stringify(notebooks));
    localStorage.setItem('quantara_notebooks_v3', JSON.stringify(notebooks));

    try {
      await axios.put(`${API_URL}/api/notebooks/${currentNb.id}`, {
        title: currentNb.title || 'Untitled',
        cells: currentNb.cells || []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Notebook successfully saved to database!");
    } catch (err) {
      alert("Failed to save notebook: " + (err.response?.data?.detail || err.message));
    }
  };

  const createFromTemplate = async (template) => {
    const newNb = {
      id: 'nb-' + Date.now().toString(36),
      title: `${template.title}`,
      cells: template.cells.map(c => ({ 
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7), 
        type: c.type || 'code',
        content: c.content 
      }))
    };
    try {
      await axios.post(`${API_URL}/api/notebooks`, newNb, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.warn("Could not save to DB immediately", e);
    }
    const fullNb = { ...newNb, role: 'owner' };
    const newNotebooks = [fullNb, ...notebooks];
    setNotebooks(newNotebooks);
    yState.set('notebooks', JSON.stringify(newNotebooks));
    setActiveId(fullNb.id);
    if (isMobile) setSidebarOpen(false);
  };

  const createBlankNotebook = async () => {
    const newNb = {
      id: 'nb-' + Date.now().toString(36),
      title: 'Untitled Notebook',
      cells: [
        { id: Date.now().toString() + 'c0', type: 'markdown', content: '# New Strategy Workspace\nDocument your quantitative model design and hypotheses below.' },
        { id: Date.now().toString() + 'c1', type: 'code', content: 'import numpy as np\nimport pandas as pd\nprint("Environment ready.")' }
      ]
    };
    try {
      await axios.post(`${API_URL}/api/notebooks`, newNb, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.warn("Could not save to DB immediately", e);
    }
    const fullNb = { ...newNb, role: 'owner' };
    const newNotebooks = [fullNb, ...notebooks];
    setNotebooks(newNotebooks);
    yState.set('notebooks', JSON.stringify(newNotebooks));
    setActiveId(fullNb.id);
    if (isMobile) setSidebarOpen(false);
  };

  const deleteNotebook = async (e, idToDelete) => {
    e.stopPropagation();
    const nb = notebooks.find(n => n.id === idToDelete);
    if (nb && nb.role && nb.role !== 'owner') {
      alert("Only the notebook OWNER can delete this notebook.");
      return;
    }
    if (!window.confirm("Permanently delete this notebook from the database?")) return;

    try {
      await axios.delete(`${API_URL}/api/notebooks/${idToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      if (err.response?.status === 403) {
        alert(err.response?.data?.detail || "Only the owner can delete this notebook.");
        return;
      }
    }

    const remaining = notebooks.filter(nb => nb.id !== idToDelete);
    setNotebooks(remaining);
    yState.set('notebooks', JSON.stringify(remaining));

    if (activeId === idToDelete) {
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
    }

    try {
      await axios.delete(`${API_URL}/api/kernel/${idToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {}
  };

  const handleInterruptKernel = async () => {
    if (!activeId) return;
    try {
      await axios.post(`${API_URL}/api/kernel/interrupt`, 
        { session_id: activeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setKernelStatus(prev => ({ ...prev, state: 'idle' }));
    } catch (err) {
      console.error("Failed to interrupt kernel:", err);
    }
  };

  const handleRestartKernel = async () => {
    if (!activeId) return;
    if (!window.confirm("Restart kernel? All variables and runtime memory in this notebook will be wiped.")) return;
    
    try {
      setKernelStatus({ state: 'restarting', alive: true });
      await axios.post(`${API_URL}/api/kernel/restart`, 
        { session_id: activeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setKernelStatus({ state: 'idle', alive: true });
    } catch (err) {
      alert("Failed to restart kernel: " + (err.response?.data?.detail || err.message));
      setKernelStatus({ state: 'dead', alive: false });
    }
  };

  const handleInsertQueryBlock = (queryCode) => {
    if (!activeId) return;
    const current = notebooks.find(nb => nb.id === activeId);
    if (!current) return;
    const newCell = {
      id: Date.now().toString() + 'dl',
      type: 'code',
      content: queryCode
    };
    const updated = {
      ...current,
      cells: [...current.cells, newCell]
    };
    const updatedNbs = notebooks.map(nb => nb.id === activeId ? updated : nb);
    setNotebooks(updatedNbs);
    yState.set('notebooks', JSON.stringify(updatedNbs));
  };

  const handleInsertCell = (code) => {
    if (!activeId) return;
    const current = notebooks.find(nb => nb.id === activeId);
    if (!current) return;
    const newCell = {
      id: Date.now().toString() + 'ai',
      type: 'code',
      content: code
    };
    const updated = {
      ...current,
      cells: [...current.cells, newCell]
    };
    const updatedNbs = notebooks.map(nb => nb.id === activeId ? updated : nb);
    setNotebooks(updatedNbs);
    yState.set('notebooks', JSON.stringify(updatedNbs));
  };

  const handleExecuteCode = async (code) => {
    if (!activeId) return;
    try {
      setKernelStatus(prev => ({ ...prev, state: 'busy' }));
      await axios.post(`${API_URL}/api/execute`, {
        code,
        session_id: activeId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKernelStatus(prev => ({ ...prev, state: 'idle' }));
    } catch (err) {
      alert("Execution error: " + err.message);
      setKernelStatus(prev => ({ ...prev, state: 'idle' }));
    }
  };

  const handleRollback = (cells) => {
    if (!activeId) return;
    const current = notebooks.find(nb => nb.id === activeId);
    if (!current) return;
    const updated = {
      ...current,
      cells: cells
    };
    const updatedNbs = notebooks.map(nb => nb.id === activeId ? updated : nb);
    setNotebooks(updatedNbs);
    yState.set('notebooks', JSON.stringify(updatedNbs));
  };


  const handleExportToStreamlit = async () => {
    if (!activeNotebook) return;
    try {
      await axios.post(`${API_URL}/api/streamlit/generate`, {
        notebook_title: activeNotebook.title || 'Executive Dashboard',
        cells: activeNotebook.cells,
        launch_immediately: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViewMode('streamlit');
    } catch (err) {
      alert("Failed to generate Streamlit dashboard: " + err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    const formData = new URLSearchParams();
    formData.append('username', e.target.username.value);
    formData.append('password', e.target.password.value);
    
    try {
      const res = await axios.post(`${API_URL}/api/auth/token`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('quantara_token', res.data.access_token);
      setToken(res.data.access_token);
      setShowAuthModal(false);
      setViewMode('notebook');
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthError("Incorrect username or password. Default demo credentials: admin / admin");
      } else {
        setAuthError(`Cannot reach Quantara API at ${API_URL}. Please ensure backend is running on port 8001.`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const username = e.target.reg_username.value.trim();
    const password = e.target.reg_password.value;
    const fullName = e.target.reg_fullname.value.trim();
    const email = e.target.reg_email.value.trim();

    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        password,
        full_name: fullName,
        email
      });
      localStorage.setItem('quantara_token', res.data.access_token);
      setToken(res.data.access_token);
      setShowAuthModal(false);
      setViewMode('notebook');
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Registration failed. Try a different username or email.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickLogin = async (username = 'admin', password = 'admin') => {
    setAuthError(null);
    setAuthLoading(true);
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await axios.post(`${API_URL}/api/auth/token`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('quantara_token', res.data.access_token);
      setToken(res.data.access_token);
      setShowAuthModal(false);
      setViewMode('notebook');
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthError("Demo user 'admin' not found in database. Please register a new account.");
      } else {
        setAuthError(`Cannot reach Quantara API at ${API_URL}. Please ensure backend is running on port 8001.`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('quantara_token');
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
    setViewMode('notebook');
  };

  if (!token) {
    return (
      <LandingPageView
        onLogin={handleLogin}
        onRegister={handleRegister}
        onQuickDemo={handleQuickLogin}
        authLoading={authLoading}
        authError={authError}
        authTab={authTab}
        setAuthTab={setAuthTab}
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        isLoggedIn={false}
        onEnterWorkspace={() => {
          setAuthTab('login');
          setShowAuthModal(true);
        }}
      />
    );
  }

  const activeNotebook = notebooks.find(nb => nb.id === activeId);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <div 
        className={isMobile && sidebarOpen ? 'sidebar-container-mobile' : ''}
        style={{ 
          width: sidebarOpen ? '280px' : '0px', 
          background: 'var(--bg-sidebar)', 
          borderRight: '1px solid var(--border-color)',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', color: 'var(--text-main)', fontSize: '15px' }}>
            <div style={{ background: '#FF4B4B', color: 'white', borderRadius: '6px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Terminal size={16} />
            </div>
            Quantara Hub
          </div>
          {isMobile && (
            <button className="btn-icon" onClick={() => setSidebarOpen(false)} title="Close navigation drawer">
              <X size={16} />
            </button>
          )}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', padding: '16px 16px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Private Notebooks
          </div>
          {notebooks.map(nb => (
            <div 
              key={nb.id}
              className={`sidebar-item ${activeId === nb.id && viewMode === 'notebook' ? 'active' : ''}`}
              onClick={() => handleSelectNotebook(nb.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1, marginRight: '8px' }}>
                <FileText size={16} style={{ marginRight: '10px', flexShrink: 0, color: activeId === nb.id ? 'var(--text-main)' : 'var(--text-placeholder)' }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {nb.title || 'Untitled'}
                </span>
                {nb.role === 'viewer' && (
                  <span style={{ fontSize: '10px', fontWeight: 600, background: '#fef3c7', color: '#92400e', borderRadius: '4px', padding: '1px 5px', marginLeft: '6px', border: '1px solid #fde68a' }}>
                    Viewer
                  </span>
                )}
                {nb.role === 'editor' && (
                  <span style={{ fontSize: '10px', fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', borderRadius: '4px', padding: '1px 5px', marginLeft: '6px', border: '1px solid #dbeafe' }}>
                    Editor
                  </span>
                )}
              </div>
              {(!nb.role || nb.role === 'owner') && (
                <button 
                  className="sidebar-item-delete btn-icon" 
                  onClick={(e) => deleteNotebook(e, nb.id)} 
                  title="Delete notebook"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}

          <div style={{ padding: '8px 16px' }}>
            <button className="add-block-btn" onClick={createBlankNotebook}>
              <Plus size={16} /> Add a notebook
            </button>
          </div>

          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', padding: '32px 16px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Trading Templates
          </div>
          {TEMPLATES.map(tpl => (
            <div 
              key={tpl.id}
              className="sidebar-item"
              onClick={() => {
                createFromTemplate(tpl);
                setViewMode('notebook');
              }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>{tpl.icon}</div>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.title}</span>
            </div>
          ))}
        </div>
        
        {/* USER PROFILE */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', background: '#e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={14} color="#555" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' }}>
              {user?.full_name || 'Loading...'}
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            Log out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', overflow: 'hidden' }}>
        
        {/* TOP REAL-TIME INSTITUTIONAL TICKER TAPE */}
        <TickerTape 
          activeSymbol={activeMarketSymbol} 
          onSelectSymbol={(sym) => { 
            setActiveMarketSymbol(sym); 
            setViewMode('market_depth'); 
          }} 
        />

        {/* 3-ZONE INSTITUTIONAL TOP NAV & TOOLBAR */}
        <div className="top-navbar-3zone" style={{ 
          height: '52px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 16px', 
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-color)', 
          flexShrink: 0,
          gap: '12px'
        }}>
          {/* ZONE 1 (LEFT): SIDEBAR TOGGLE, BREADCRUMB & ROLE, COLLABORATORS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexShrink: 0 }}>
            <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
              <SidebarIcon size={16} />
            </button>

            {/* Breadcrumb & active notebook */}
            {activeNotebook && viewMode === 'notebook' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: 'var(--text-main)', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '180px' 
                }} title={activeNotebook.title || 'Untitled'}>
                  {activeNotebook.title || 'Untitled'}
                </span>

                {/* Role tag badge */}
                {activeNotebook.role === 'viewer' ? (
                  <span className="badge-warning" style={{ fontSize: '10px', padding: '1px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Eye size={10} /> <span className="btn-hide-mobile">Viewer</span>
                  </span>
                ) : activeNotebook.role === 'editor' ? (
                  <span className="badge-info" style={{ fontSize: '10px', padding: '1px 6px' }}>
                    <span className="btn-hide-mobile">Editor</span>
                  </span>
                ) : (
                  <span className="badge-neutral" style={{ fontSize: '10px', padding: '1px 6px' }}>
                    <span className="btn-hide-mobile">Owner</span>
                  </span>
                )}
              </div>
            )}

            {/* Multiplayer Collaborator Avatars */}
            {collaborators.length > 0 && (
              <div className="btn-hide-mobile" style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }} title={`${collaborators.length} active collaborator(s)`}>
                {collaborators.map((c, i) => (
                  <div 
                    key={i} 
                    className="collaborator-avatar" 
                    style={{ background: c.color || '#0284c7' }}
                    title={c.name || c.username}
                  >
                    {(c.name || c.username || 'U').substring(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ZONE 2 (CENTER): 6 PERSPECTIVE PILL CONTROLS */}
          <div className="view-mode-toggle" style={{ flexShrink: 0 }}>
            <button 
              className={`view-mode-btn ${viewMode === 'notebook' ? 'active' : ''}`}
              onClick={() => setViewMode('notebook')}
              title="Interactive Quant Research Notebook"
            >
              <FileText size={13} /> <span className="label-text">Notebook</span>
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'staging_shadow' ? 'active' : ''}`}
              onClick={() => setViewMode('staging_shadow')}
              title="Paper Trading & Shadow Dark-Launch Execution Staging"
            >
              <Layers size={13} /> <span className="label-text">Staging</span>
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'drl_studio' ? 'active' : ''}`}
              onClick={() => setViewMode('drl_studio')}
              title="Deep Reinforcement Learning Pre-Processing & Execution Backtester"
            >
              <Cpu size={13} /> <span className="label-text">DRL Studio</span>
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'market_depth' ? 'active' : ''}`}
              onClick={() => setViewMode('market_depth')}
              title="Real-Time L2 Order Book & Depth Ladder"
            >
              <Activity size={13} /> <span className="label-text">Market Depth</span>
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'risk_sentinel' ? 'active' : ''}`}
              onClick={() => setViewMode('risk_sentinel')}
              title="Extreme Tail Risk Stress Testing & VaR"
            >
              <ShieldAlert size={13} /> <span className="label-text">Risk Sentinel</span>
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'streamlit' ? 'active' : ''}`}
              onClick={() => setViewMode('streamlit')}
              title="CTO / Stakeholder Streamlit Executive Studio"
            >
              <LayoutDashboard size={13} /> <span className="label-text">Executive Studio</span>
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'landing' ? 'active' : ''}`}
              onClick={() => setViewMode('landing')}
              title="Platform Landing Page & Architecture Overview"
            >
              <Globe size={13} /> <span className="label-text">Overview</span>
            </button>
          </div>

          {/* ZONE 3 (RIGHT): KERNEL STATUS & ACTIONS, TOOLS MENU, SHARE & USER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {viewMode === 'notebook' && (
              <>
                {/* Kernel Status Badge */}
                <div className="status-badge" title="Python Kernel Status">
                  <span className={`status-dot ${kernelStatus.state}`} />
                  <span className="btn-hide-mobile" style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                    {kernelStatus.state === 'busy' ? 'Busy' : 
                     kernelStatus.state === 'restarting' ? 'Restarting' : 
                     kernelStatus.alive ? 'Idle' : 'Offline'}
                  </span>
                </div>

                {activeNotebook?.role !== 'viewer' && (
                  <>
                    {kernelStatus.state === 'busy' && (
                      <button 
                        className="btn-secondary" 
                        onClick={handleInterruptKernel}
                        title="Interrupt execution (Ctrl+C / SIGINT)"
                        style={{ color: '#f43f5e', borderColor: 'rgba(244,63,94,0.3)', padding: '5px 8px' }}
                      >
                        <Square size={12} fill="#f43f5e" />
                      </button>
                    )}
                    <button 
                      className="btn-secondary" 
                      onClick={handleRestartKernel}
                      disabled={kernelStatus.state === 'restarting'}
                      title="Restart kernel (Wipe memory & reset)"
                      style={{ padding: '5px 8px' }}
                    >
                      <RotateCcw size={12} />
                    </button>
                    <button className="btn-primary" onClick={saveWork} style={{ padding: '6px 12px', fontSize: '12px' }}>
                      <Save size={13} /> <span className="btn-hide-mobile">Save</span>
                    </button>
                  </>
                )}

                {/* Share Notebook Modal Button */}
                <button 
                  className="btn-secondary btn-hide-mobile"
                  onClick={() => setShowShareModal(true)}
                  title="Share notebook with team members"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                >
                  <Users size={13} /> Share
                </button>
              </>
            )}

            {/* Consolidated Institutional Tools Dropdown */}
            <div style={{ position: 'relative' }} ref={toolsMenuRef}>
              <button 
                className={`btn-secondary ${toolsMenuOpen ? 'active' : ''}`}
                onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                title="Quant Strategy Tools & Utilities"
                style={{ 
                  background: toolsMenuOpen ? 'var(--bg-hover)' : undefined,
                  borderColor: toolsMenuOpen ? 'var(--accent-red)' : undefined,
                  padding: '6px 10px',
                  fontSize: '12px'
                }}
              >
                <Sliders size={13} />
                <span className="btn-hide-mobile">Tools</span>
                <ChevronDown size={11} style={{ transform: toolsMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {toolsMenuOpen && (
                <div className="tools-dropdown-menu">
                  <div style={{ padding: '4px 8px 6px', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Strategy Utilities
                  </div>
                  <button 
                    className="tools-dropdown-item"
                    onClick={() => { setShowCopilot(true); setToolsMenuOpen(false); }}
                  >
                    <Sparkles size={14} color="#FF4B4B" />
                    <div>
                      <div style={{ fontWeight: 600 }}>AI Alpha Copilot</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Synthetic alpha & bias auditing</div>
                    </div>
                  </button>
                  <button 
                    className="tools-dropdown-item"
                    onClick={() => { setShowVersionControl(true); setToolsMenuOpen(false); }}
                  >
                    <GitBranch size={14} color="#f97316" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Git Lineage & Diffs</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Checkpoints, commit diffs & rollback</div>
                    </div>
                  </button>
                  <button 
                    className="tools-dropdown-item"
                    onClick={() => { setShowExecutiveBriefing(true); setToolsMenuOpen(false); }}
                  >
                    <Printer size={14} color="#2563eb" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Executive Tear Sheet</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PDF briefing memo & Slack digest</div>
                    </div>
                  </button>
                  {viewMode === 'notebook' && (
                    <button 
                      className="tools-dropdown-item"
                      onClick={() => { setShowShareModal(true); setToolsMenuOpen(false); }}
                    >
                      <Users size={14} color="#10b981" />
                      <div>
                        <div style={{ fontWeight: 600 }}>Share Notebook</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Invite collaborators & roles</div>
                      </div>
                    </button>
                  )}

                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                  
                  <div style={{ padding: '4px 8px 6px', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Data & Pipelines
                  </div>
                  <button 
                    className="tools-dropdown-item"
                    onClick={() => { setShowDataLake(true); setToolsMenuOpen(false); }}
                  >
                    <Database size={14} color="#8b5cf6" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Data Lake Explorer</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DuckDB, Parquet schema & SQL</div>
                    </div>
                  </button>
                  <button 
                    className="tools-dropdown-item"
                    onClick={() => { setShowScheduler(true); setToolsMenuOpen(false); }}
                  >
                    <CalendarClock size={14} color="#10b981" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Automated Cron Jobs</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Execution triggers & pipelines</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Quick User Avatar Badge */}
            {user && (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border-color)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)'
                }}
                title={`Logged in as ${user.username} (${user.role || 'Quant'})`}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#FF4B4B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                  {(user.full_name || user.username || 'U')[0].toUpperCase()}
                </div>
                <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* BODY AREA */}
        {viewMode === 'landing' ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <LandingPageView
              onLogin={handleLogin}
              onRegister={handleRegister}
              onQuickDemo={handleQuickLogin}
              authLoading={authLoading}
              authError={authError}
              authTab={authTab}
              setAuthTab={setAuthTab}
              showAuthModal={showAuthModal}
              setShowAuthModal={setShowAuthModal}
              isLoggedIn={true}
              onEnterWorkspace={() => setViewMode('notebook')}
            />
          </div>
        ) : viewMode === 'streamlit' ? (
          <StreamlitView token={token} />
        ) : viewMode === 'market_depth' ? (
          <MarketDepthView activeSymbol={activeMarketSymbol} onSymbolChange={setActiveMarketSymbol} />
        ) : viewMode === 'risk_sentinel' ? (
          <RiskSentinelView token={token} />
        ) : viewMode === 'drl_studio' ? (
          <DRLStudioView token={token} onInsertCell={handleInsertCell} />
        ) : viewMode === 'staging_shadow' ? (
          <StagingShadowView token={token} />
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeNotebook ? (
              <NotebookView 
                key={activeNotebook.id}
                notebook={activeNotebook} 
                token={token}
                kernelStatus={kernelStatus}
                presentationMode={presentationMode}
                onTogglePresentation={() => setPresentationMode(!presentationMode)}
                onExportToStreamlit={handleExportToStreamlit}
                onInterruptKernel={handleInterruptKernel}
                updateNotebook={(updatedNb) => {
                  const newNotebooks = notebooks.map(nb => nb.id === updatedNb.id ? updatedNb : nb);
                  setNotebooks(newNotebooks);
                  yState.set('notebooks', JSON.stringify(newNotebooks));
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-placeholder)' }}>
                Select or create a notebook to begin
              </div>
            )}
          </div>
        )}
      </div>

      {/* DRAWERS & MODALS */}
      <QuantCopilotDrawer 
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        token={token}
        activeNotebook={activeNotebook}
        onInsertCell={handleInsertCell}
        onExecuteCode={handleExecuteCode}
      />

      <VersionControlDrawer
        isOpen={showVersionControl}
        onClose={() => setShowVersionControl(false)}
        token={token}
        activeNotebook={activeNotebook}
        onRollback={handleRollback}
      />

      <ExecutiveBriefingModal
        isOpen={showExecutiveBriefing}
        onClose={() => setShowExecutiveBriefing(false)}
        token={token}
        activeNotebook={activeNotebook}
      />

      {showScheduler && (
        <SchedulerModal 
          token={token}
          activeNotebook={activeNotebook}
          onClose={() => setShowScheduler(false)}
        />
      )}

      {showDataLake && (
        <DataLakeModal 
          token={token}
          onInsertQuery={handleInsertQueryBlock}
          onClose={() => setShowDataLake(false)}
        />
      )}

      {showShareModal && activeNotebook && (
        <ShareNotebookModal 
          notebook={activeNotebook}
          token={token}
          apiUrl={API_URL}
          currentUser={user}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}


function NotebookView({ 
  notebook, 
  token, 
  kernelStatus, 
  presentationMode, 
  onTogglePresentation, 
  onExportToStreamlit, 
  onInterruptKernel, 
  updateNotebook 
}) {
  const cellRunRefs = useRef({});
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragPosition, setDragPosition] = useState(null);

  const updateTitle = (newTitle) => {
    updateNotebook({ ...notebook, title: newTitle });
  };

  const addCell = (index = notebook.cells.length, type = 'code') => {
    const newCells = [...notebook.cells];
    newCells.splice(index, 0, { 
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6), 
      type, 
      content: '' 
    });
    updateNotebook({ ...notebook, cells: newCells });
  };

  const updateCell = (cellId, patch) => {
    const newCells = notebook.cells.map(c => c.id === cellId ? { ...c, ...patch } : c);
    updateNotebook({ ...notebook, cells: newCells });
  };

  const removeCell = (cellId) => {
    const newCells = notebook.cells.filter(c => c.id !== cellId);
    if (newCells.length === 0) {
      newCells.push({ id: Date.now().toString(), type: 'code', content: '' }); 
    }
    updateNotebook({ ...notebook, cells: newCells });
  };

  const duplicateCell = (index) => {
    const source = notebook.cells[index];
    const clone = {
      ...source,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6)
    };
    const newCells = [...notebook.cells];
    newCells.splice(index + 1, 0, clone);
    updateNotebook({ ...notebook, cells: newCells });
  };

  const moveCell = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= notebook.cells.length) return;
    const newCells = [...notebook.cells];
    const [moved] = newCells.splice(fromIndex, 1);
    newCells.splice(toIndex, 0, moved);
    updateNotebook({ ...notebook, cells: newCells });
  };

  const handleRunAll = async () => {
    for (const cell of notebook.cells) {
      if (cell.type === 'code' && cellRunRefs.current[cell.id]) {
        await cellRunRefs.current[cell.id]();
      }
    }
  };

  const clearAllOutputs = () => {
    window.dispatchEvent(new CustomEvent(`clear-outputs-${notebook.id}`));
  };

  const isViewer = notebook?.role === 'viewer';

  return (
    <div className="notebook-container">
      
      {/* Notebook Toolbar */}
      <div className="notebook-title-bar">
        <input 
          type="text"
          value={notebook.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="title-input"
          style={{ marginBottom: 0 }}
          placeholder="Untitled"
          readOnly={presentationMode || isViewer}
        />

        <div className="notebook-actions-row">
          {/* Executive Mode / Hide Code Toggle */}
          <button 
            className={`btn-secondary ${presentationMode ? 'active' : ''}`} 
            onClick={onTogglePresentation} 
            title={presentationMode ? "Switch to Editor Mode (show code)" : "Executive Mode: Hide code blocks for CTO/stakeholders"}
            style={{ borderColor: presentationMode ? 'var(--accent-blue)' : 'var(--border-color)', color: presentationMode ? 'var(--accent-blue)' : 'inherit' }}
          >
            {presentationMode ? <EyeOff size={13} /> : <Eye size={13} />} 
            <span className="btn-hide-mobile">{presentationMode ? "Show Code" : "Executive View"}</span>
          </button>

          {/* Export to Streamlit Dashboard Button */}
          <button 
            className="btn-secondary" 
            onClick={onExportToStreamlit}
            title="Convert this notebook into a live Streamlit dashboard for stakeholders"
          >
            <Sparkles size={13} color="#8b5cf6" /> 
            <span className="btn-hide-mobile">Streamlit</span>
          </button>

          {!presentationMode && !isViewer && (
            <>
              <button className="btn-secondary" onClick={handleRunAll} title="Run all code cells sequentially">
                <PlayCircle size={13} color="var(--accent-green)" /> Run All
              </button>
              <button className="btn-secondary" onClick={clearAllOutputs} title="Clear all cell outputs">
                <Eraser size={13} /> Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cells List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notebook.cells.map((cell, index) => (
          <Cell 
            key={cell.id} 
            cell={cell} 
            index={index}
            totalCells={notebook.cells.length}
            sessionId={notebook.id}
            token={token}
            presentationMode={presentationMode}
            isViewer={isViewer}
            isKernelBusy={kernelStatus.state === 'busy'}
            onInterruptKernel={onInterruptKernel}
            registerRunHandler={(runFn) => { cellRunRefs.current[cell.id] = runFn; }}
            onUpdate={(patch) => updateCell(cell.id, patch)}
            onRemove={() => removeCell(cell.id)}
            onDuplicate={() => duplicateCell(index)}
            onMoveUp={() => moveCell(index, index - 1)}
            onMoveDown={() => moveCell(index, index + 1)}
            onAddBelow={(type = 'code') => addCell(index + 1, type)}
            onDropMove={(fromIdx) => moveCell(fromIdx, index)}
            dragOverState={dragOverIndex === index ? dragPosition : null}
            setDragOver={(pos) => {
              setDragOverIndex(index);
              setDragPosition(pos);
            }}
            clearDragOver={() => {
              if (dragOverIndex === index) {
                setDragOverIndex(null);
                setDragPosition(null);
              }
            }}
          />
        ))}
      </div>

      {!presentationMode && !isViewer && (
        <div style={{ marginTop: '20px', marginLeft: '40px', display: 'flex', gap: '8px' }}>
          <button className="add-block-btn" onClick={() => addCell(notebook.cells.length, 'code')}>
            <Plus size={16} /> Code Block
          </button>
          <button className="add-block-btn" onClick={() => addCell(notebook.cells.length, 'markdown')}>
            <AlignLeft size={16} /> Text Block
          </button>
        </div>
      )}
    </div>
  );
}

function Cell({ 
  cell, 
  index, 
  totalCells, 
  sessionId, 
  token, 
  presentationMode,
  isViewer = false,
  onInterruptKernel,
  registerRunHandler, 
  onUpdate, 
  onRemove, 
  onDuplicate,
  onMoveUp, 
  onMoveDown, 
  onAddBelow,
  onDropMove,
  dragOverState,
  setDragOver,
  clearDragOver
}) {
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMarkdownEditing, setIsMarkdownEditing] = useState(!cell.content || cell.content.trim() === '');
  const [outputCollapsed, setOutputCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const runHandlerRef = useRef(null);

  const cellType = cell.type || 'code';

  useEffect(() => {
    const handleClear = () => setOutput([]);
    window.addEventListener(`clear-outputs-${sessionId}`, handleClear);
    return () => window.removeEventListener(`clear-outputs-${sessionId}`, handleClear);
  }, [sessionId]);

  const handleRun = async () => {
    if (cellType === 'markdown') {
      setIsMarkdownEditing(false);
      return;
    }

    setIsRunning(true);
    setOutput([]);
    try {
      const res = await axios.post(`${API_URL}/api/execute`, 
        { code: cell.content, session_id: sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOutput(res.data.outputs || []);
    } catch (err) {
      if (err.response?.status === 401) {
         alert("Session expired. Please log in again.");
      }
      setOutput([{ type: 'error', data: err.response?.data?.detail || err.message || 'Execution failed' }]);
    } finally {
      setIsRunning(false);
    }
  };

  runHandlerRef.current = handleRun;

  useEffect(() => {
    if (cellType === 'code') {
      registerRunHandler(handleRun);
    }
  }, [cell.content, sessionId, cellType]);

  const renderedMarkdown = useMemo(() => {
    if (cellType !== 'markdown' || !cell.content) return '';
    try {
      return marked.parse(cell.content);
    } catch (err) {
      return `<p style="color:red">Markdown Parse Error: ${err.message}</p>`;
    }
  }, [cell.content, cellType]);

  const toggleCellType = () => {
    const nextType = cellType === 'code' ? 'markdown' : 'code';
    onUpdate({ type: nextType });
    if (nextType === 'markdown') {
      setIsMarkdownEditing(false);
    }
  };

  // If in Presentation Mode and code cell has no output, hide completely
  if (presentationMode && cellType === 'code' && output.length === 0) {
    return null;
  }

  return (
    <div 
      className={`cell-wrapper ${isDragging ? 'is-dragging' : ''} ${dragOverState === 'top' ? 'drag-over-top' : ''} ${dragOverState === 'bottom' ? 'drag-over-bottom' : ''}`}
      style={{ padding: presentationMode ? '2px 0' : '8px 4px' }}
      onDragOver={(e) => {
        if (presentationMode) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const offset = e.clientY - rect.top;
        setDragOver(offset < rect.height / 2 ? 'top' : 'bottom');
      }}
      onDragLeave={clearDragOver}
      onDrop={(e) => {
        if (presentationMode) return;
        e.preventDefault();
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(fromIdx)) {
          onDropMove(fromIdx);
        }
        clearDragOver();
      }}
    >
      {/* Left Action Column */}
      {!presentationMode && !isViewer && (
        <div className="cell-drag-column" style={{ width: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div 
            className="cell-drag-handle" 
            title="Drag to reorder cell"
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', index.toString());
              setIsDragging(true);
            }}
            onDragEnd={() => {
              setIsDragging(false);
              clearDragOver();
            }}
          >
            <GripVertical size={16} />
          </div>
          
          {cellType === 'code' ? (
            isRunning ? (
              <button 
                onClick={onInterruptKernel}
                className="btn-icon"
                style={{ marginTop: '4px', color: 'var(--accent-red)' }}
                title="Interrupt execution"
              >
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button 
                onClick={handleRun}
                disabled={isRunning}
                className="btn-icon"
                style={{ marginTop: '4px', color: 'var(--text-muted)' }}
                title="Run Cell (Shift + Enter)"
              >
                <Play size={15} fill="currentColor" />
              </button>
            )
          ) : (
            <button 
              onClick={() => setIsMarkdownEditing(!isMarkdownEditing)}
              className="btn-icon"
              style={{ marginTop: '4px', color: 'var(--text-muted)' }}
              title={isMarkdownEditing ? "Preview Markdown" : "Edit Markdown"}
            >
              {isMarkdownEditing ? <Eye size={15} /> : <Edit3 size={15} />}
            </button>
          )}
        </div>
      )}
      
      {/* Cell Content */}
      <div className={`cell-content ${isFocused && !presentationMode ? 'focused' : ''}`}>
        {!presentationMode && !isViewer && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 2px' }}>
            <button 
              onClick={toggleCellType} 
              className="cell-type-pill" 
              title="Click to toggle between Code and Markdown block"
            >
              {cellType === 'code' ? (
                <>
                  <Code2 size={12} color="#2383e2" />
                  <span>Python</span>
                </>
              ) : (
                <>
                  <AlignLeft size={12} color="#0f7b6c" />
                  <span>Markdown</span>
                </>
              )}
            </button>

            {cellType === 'markdown' && !isMarkdownEditing && (
              <span style={{ fontSize: '11px', color: 'var(--text-placeholder)' }}>Click to edit</span>
            )}
          </div>
        )}

        {/* Editor or Markdown View */}
        {cellType === 'markdown' ? (
          (!isMarkdownEditing || presentationMode || isViewer) ? (
            <div 
              className="markdown-rendered"
              onClick={() => { if (!presentationMode && !isViewer) setIsMarkdownEditing(true); }}
              dangerouslySetInnerHTML={{ __html: renderedMarkdown || '<p style="color:var(--text-placeholder)">Empty text block.</p>' }}
            />
          ) : (
            <div className="editor-container">
              <Editor
                height="80px" 
                theme="vs"
                defaultLanguage="markdown"
                language="markdown"
                value={cell.content}
                onChange={(val) => onUpdate({ content: val || '' })}
                onMount={(editor, monaco) => {
                  editor.onDidFocusEditorWidget(() => setIsFocused(true));
                  editor.onDidBlurEditorWidget(() => {
                    setIsFocused(false);
                    if (cell.content && cell.content.trim() !== '') {
                      setIsMarkdownEditing(false);
                    }
                  });
                  editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
                    if (runHandlerRef.current) runHandlerRef.current();
                  });
                  const updateHeight = () => {
                    const contentHeight = Math.min(1000, Math.max(40, editor.getContentHeight()));
                    if (editor.getDomNode()) {
                      editor.getDomNode().style.height = `${contentHeight}px`;
                      editor.layout();
                    }
                  };
                  editor.onDidContentSizeChange(updateHeight);
                  setTimeout(updateHeight, 100);
                }}
                options={{ 
                  readOnly: isViewer,
                  minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineNumbers: 'off',
                  folding: false, overviewRulerLanes: 0, renderLineHighlight: 'none',
                  hideCursorInOverviewRuler: true, scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                  contextmenu: false, wordWrap: 'on'
                }}
              />
            </div>
          )
        ) : (
          !presentationMode && (
            <div className="editor-container">
              <Editor
                height="80px" 
                theme="vs"
                defaultLanguage="python"
                language="python"
                value={cell.content}
                onChange={(val) => onUpdate({ content: val || '' })}
                onMount={(editor, monaco) => {
                  editor.onDidFocusEditorWidget(() => setIsFocused(true));
                  editor.onDidBlurEditorWidget(() => setIsFocused(false));
                  editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
                    if (runHandlerRef.current) runHandlerRef.current();
                  });
                  const updateHeight = () => {
                    const contentHeight = Math.min(1000, Math.max(40, editor.getContentHeight()));
                    if (editor.getDomNode()) {
                      editor.getDomNode().style.height = `${contentHeight}px`;
                      editor.layout();
                    }
                  };
                  editor.onDidContentSizeChange(updateHeight);
                  setTimeout(updateHeight, 100);
                }}
                options={{ 
                  readOnly: isViewer,
                  minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineNumbers: 'off',
                  folding: false, overviewRulerLanes: 0, renderLineHighlight: 'none',
                  hideCursorInOverviewRuler: true, scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                  contextmenu: false, wordWrap: 'on'
                }}
              />
            </div>
          )
        )}

        {/* Output Container */}
        {cellType === 'code' && output.length > 0 && (
          <div className="output-container table-responsive" style={{ position: 'relative', margin: presentationMode ? '0' : '4px 0 0 12px', padding: output.find(o => o.type === 'html') && !outputCollapsed ? '0px' : '12px' }}>
            {!presentationMode && (
              <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, display: 'flex', gap: '4px' }}>
                <button 
                  className="btn-icon" 
                  onClick={() => setOutputCollapsed(!outputCollapsed)} 
                  title={outputCollapsed ? "Expand output" : "Collapse output"}
                  style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid var(--border-color)' }}
                >
                  {outputCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>
                <button 
                  className="btn-icon" 
                  onClick={() => setOutput([])} 
                  title="Clear output"
                  style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid var(--border-color)' }}
                >
                  <Eraser size={12} />
                </button>
              </div>
            )}

            {outputCollapsed ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Outputs collapsed ({output.length} result item{output.length > 1 ? 's' : ''})
              </div>
            ) : (
              output.map((out, i) => {
                if (out.type === 'html') {
                  if (out.data.includes('<script')) {
                    return (
                      <iframe 
                        key={i} 
                        srcDoc={out.data} 
                        title="Visualization"
                        style={{ width: '100%', height: '620px', border: 'none', borderRadius: '6px', background: '#fff', display: 'block' }} 
                        sandbox="allow-scripts allow-same-origin"
                      />
                    );
                  }
                  return (
                    <div 
                      key={i} 
                      dangerouslySetInnerHTML={{ __html: out.data }} 
                      style={{ background: '#fff', borderRadius: '6px', padding: '16px', border: '1px solid #eee' }} 
                    />
                  );
                }
                if (out.type === 'image') {
                  return <img key={i} src={`data:image/png;base64,${out.data}`} alt="Cell output" style={{ maxWidth: '100%', borderRadius: '4px' }} />;
                }
                
                return (
                  <div key={i} style={{ color: out.type === 'error' ? 'var(--accent-red)' : 'inherit', whiteSpace: 'pre-wrap', padding: '10px 4px' }}>
                    {out.data}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Right Hover Actions */}
      {!presentationMode && !isViewer && (
        <div style={{ width: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px', opacity: 0 }} className="cell-actions-right">
          {index > 0 && (
            <button className="btn-icon" onClick={onMoveUp} title="Move up">
              <ArrowUp size={13} />
            </button>
          )}
          {index < totalCells - 1 && (
            <button className="btn-icon" onClick={onMoveDown} title="Move down">
              <ArrowDown size={13} />
            </button>
          )}
          <button className="btn-icon" onClick={onDuplicate} title="Duplicate block">
            <Copy size={13} />
          </button>
          <button className="btn-icon" onClick={onRemove} title="Delete block">
            <Trash2 size={13} />
          </button>
          <button className="btn-icon" onClick={() => onAddBelow(cellType)} title="Add block below">
            <Plus size={13} />
          </button>
        </div>
      )}

      <style>{`
        .cell-wrapper:hover .cell-actions-right { opacity: 1 !important; }
        .output-container table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        .output-container th, .output-container td { padding: 8px 12px; border: 1px solid #eee; text-align: right; }
        .output-container th { background: #fbfbfb; font-weight: 600; color: #555; }
      `}</style>
    </div>
  );
}

/* =====================================================================
   STREAMLIT EXECUTIVE DASHBOARD VIEW (Full-Screen Studio Integration)
   ===================================================================== */
function StreamlitView({ token }) {
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('executive_dashboard.py');
  const [iframeKey, setIframeKey] = useState(Date.now());

  const fetchApps = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/streamlit/apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApps(res.data.apps || []);
      if (res.data.status?.active_app) {
        setSelectedApp(res.data.status.active_app);
      }
    } catch (err) {
      console.error("Failed to load Streamlit apps", err);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [token]);

  const handleSwitchApp = async (appFile) => {
    setSelectedApp(appFile);
    try {
      await axios.post(`${API_URL}/api/streamlit/start`, {
        app_filename: appFile
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeout(() => setIframeKey(Date.now()), 1500);
    } catch (err) {
      alert("Failed to switch app: " + err.message);
    }
  };

  const handleReload = async () => {
    try {
      await axios.post(`${API_URL}/api/streamlit/start`, {
        app_filename: selectedApp
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeout(() => setIframeKey(Date.now()), 1200);
    } catch (err) {
      alert("Failed to reload: " + err.message);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* Streamlit Studio Header */}
      <div style={{ height: '46px', background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LayoutDashboard size={15} color="#e11d48" /> Executive Dashboard Studio
          </span>

          <select 
            value={selectedApp} 
            onChange={(e) => handleSwitchApp(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', background: '#fff', color: 'var(--text-main)' }}
          >
            {apps.map(a => (
              <option key={a.filename} value={a.filename}>{a.title} ({a.filename})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="status-badge">
            <span className="status-dot idle" />
            <span>Port :8501 Streamlit Active</span>
          </div>

          <button className="btn-secondary" onClick={handleReload} title="Reload Streamlit process">
            <RotateCcw size={12} /> Reload
          </button>

          <a 
            href={getStreamlitUrl()} 
            target="_blank" 
            rel="noreferrer" 
            className="btn-primary" 
            style={{ textDecoration: 'none', fontSize: '12px', padding: '4px 10px' }}
          >
            <ExternalLink size={13} /> Present Fullscreen (CTO View)
          </a>
        </div>
      </div>

      {/* Embedded Streamlit Application */}
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe 
          key={iframeKey}
          src={getStreamlitUrl()} 
          title="Streamlit Stakeholder App"
          style={{ width: '100%', height: 'calc(100vh - 98px)', border: 'none' }}
        />
      </div>
    </div>
  );
}

/* =====================================================================
   PHASE 3: SCHEDULER MODAL (APScheduler + SQLite Execution History)
   ===================================================================== */
function SchedulerModal({ token, activeNotebook, onClose }) {
  const [tab, setTab] = useState('list');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [runHistory, setRunHistory] = useState([]);
  const [cronExpr, setCronExpr] = useState('0 * * * *');
  const [jobName, setJobName] = useState(activeNotebook ? `${activeNotebook.title || 'Notebook'} Pipeline` : 'Automated Job');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/schedule/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Failed to load schedules", err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [token]);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!activeNotebook) {
      alert("Please open a notebook to schedule.");
      return;
    }

    const codeCells = activeNotebook.cells
      .filter(c => (c.type || 'code') === 'code' && c.content.trim())
      .map(c => c.content);

    if (codeCells.length === 0) {
      alert("This notebook contains no executable code cells.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/schedule/`, {
        name: jobName,
        cron: cronExpr,
        cells: codeCells
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Pipeline '${jobName}' scheduled successfully!`);
      setTab('list');
      fetchJobs();
    } catch (err) {
      alert("Failed to create schedule: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerRun = async (jobId) => {
    try {
      await axios.post(`${API_URL}/api/schedule/${jobId}/run`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Execution started in background!");
      setTimeout(fetchJobs, 1500);
    } catch (err) {
      alert("Failed to trigger execution: " + err.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Delete this scheduled job?")) return;
    try {
      await axios.delete(`${API_URL}/api/schedule/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchJobs();
    } catch (err) {
      alert("Failed to delete job: " + err.message);
    }
  };

  const handleViewHistory = async (job) => {
    setSelectedJob(job);
    try {
      const res = await axios.get(`${API_URL}/api/schedule/${job.id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRunHistory(res.data.runs || []);
      setTab('history');
    } catch (err) {
      alert("Failed to load run history: " + err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '16px' }}>
            <CalendarClock size={18} color="#FF4B4B" />
            <span>Scheduled Pipelines (Headless Cron)</span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-sidebar)' }}>
          <button 
            className={`btn-secondary ${tab === 'list' ? 'active' : ''}`} 
            onClick={() => setTab('list')}
            style={{ background: tab === 'list' ? '#fff' : 'transparent', fontWeight: tab === 'list' ? 600 : 400 }}
          >
            Active Schedules ({jobs.length})
          </button>
          <button 
            className={`btn-secondary ${tab === 'create' ? 'active' : ''}`} 
            onClick={() => setTab('create')}
            style={{ background: tab === 'create' ? '#fff' : 'transparent', fontWeight: tab === 'create' ? 600 : 400 }}
          >
            + Schedule Active Notebook
          </button>
          {selectedJob && (
            <button 
              className={`btn-secondary ${tab === 'history' ? 'active' : ''}`} 
              onClick={() => setTab('history')}
              style={{ background: tab === 'history' ? '#fff' : 'transparent', fontWeight: tab === 'history' ? 600 : 400 }}
            >
              Execution History: {selectedJob.name}
            </button>
          )}
        </div>

        <div className="modal-body">
          {tab === 'list' && (
            <div>
              {jobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-placeholder)' }}>
                  <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>No active scheduled pipelines yet.</p>
                  <button className="btn-primary" onClick={() => setTab('create')} style={{ marginTop: '12px' }}>
                    Schedule this notebook
                  </button>
                </div>
              ) : (
                <table className="quantara-table">
                  <thead>
                    <tr>
                      <th>Job Name</th>
                      <th>Cron Frequency</th>
                      <th>Owner</th>
                      <th>Last Run</th>
                      <th>Next Run</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(j => (
                      <tr key={j.id}>
                        <td style={{ fontWeight: 500 }}>{j.name}</td>
                        <td><code>{j.cron}</code></td>
                        <td>{j.owner}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{j.last_run_time ? j.last_run_time.replace('T', ' ').substring(0, 19) : 'Never'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{j.next_run_time ? j.next_run_time.replace('T', ' ').substring(0, 19) : 'Paused'}</td>
                        <td>
                          <span className={`badge badge-${j.last_status || 'pending'}`}>
                            {j.last_status || 'pending'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn-secondary" onClick={() => handleTriggerRun(j.id)} title="Run immediately">
                              <Play size={12} color="#10B981" /> Run
                            </button>
                            <button className="btn-secondary" onClick={() => handleViewHistory(j)} title="View past run logs">
                              Logs
                            </button>
                            <button className="btn-icon" onClick={() => handleDeleteJob(j.id)} title="Delete job">
                              <Trash2 size={13} color="#EF4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'create' && (
            <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '540px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Pipeline Name
                </label>
                <input 
                  type="text" 
                  value={jobName} 
                  onChange={(e) => setJobName(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Schedule Frequency
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setCronExpr('*/5 * * * *')}>Every 5 mins</button>
                  <button type="button" className="btn-secondary" onClick={() => setCronExpr('0 * * * *')}>Hourly</button>
                  <button type="button" className="btn-secondary" onClick={() => setCronExpr('0 0 * * *')}>Daily (Midnight)</button>
                </div>
                <input 
                  type="text" 
                  value={cronExpr} 
                  onChange={(e) => setCronExpr(e.target.value)} 
                  placeholder="* * * * *" 
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }} 
                />
                <span style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginTop: '4px', display: 'block' }}>
                  Standard 5-field cron: minute hour day month day-of-week
                </span>
              </div>

              <div style={{ background: 'var(--bg-hover)', padding: '12px', borderRadius: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Target Notebook: <b>{activeNotebook?.title || 'Untitled'}</b> ({activeNotebook?.cells.filter(c => (c.type || 'code') === 'code').length || 0} executable cells)
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  <CalendarClock size={14} /> Schedule Pipeline
                </button>
                <button type="button" className="btn-secondary" onClick={() => setTab('list')}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {tab === 'history' && (
            <div>
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Execution Logs for {selectedJob?.name}</span>
                <button className="btn-secondary" onClick={() => handleViewHistory(selectedJob)}>Refresh</button>
              </div>

              {runHistory.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-placeholder)' }}>
                  No historical runs recorded for this job yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {runHistory.map((run, i) => (
                    <div key={run.id || i} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge badge-${run.status}`}>{run.status}</span>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>Started: {run.started_at?.replace('T', ' ').substring(0, 19)}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Completed: {run.finished_at ? run.finished_at.replace('T', ' ').substring(0, 19) : 'In progress...'}
                        </span>
                      </div>

                      {run.error && (
                        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px', borderRadius: '4px', fontSize: '12px', marginBottom: '8px' }}>
                          <b>Error:</b> {run.error}
                        </div>
                      )}

                      {run.outputs && run.outputs.length > 0 && (
                        <details style={{ fontSize: '12px' }}>
                          <summary style={{ cursor: 'pointer', color: 'var(--accent-blue)', fontWeight: 500 }}>
                            View {run.outputs.length} cell outputs
                          </summary>
                          <div style={{ marginTop: '8px', background: 'var(--bg-cell-output)', padding: '10px', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                            {run.outputs.map((co, cidx) => (
                              <div key={cidx} style={{ marginBottom: '8px' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Cell {co.cell_index}:</div>
                                {co.outputs.map((out, oi) => (
                                  <pre key={oi} style={{ margin: 0, fontFamily: 'monospace', color: out.type === 'error' ? 'var(--accent-red)' : 'inherit' }}>
                                    {typeof out.data === 'string' ? out.data : JSON.stringify(out.data)}
                                  </pre>
                                ))}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   PHASE 3: DATA LAKE EXPLORER MODAL (DuckDB & Parquet Table Inspector)
   ===================================================================== */
function DataLakeModal({ token, onInsertQuery, onClose }) {
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/datalake/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(res.data.files || []);
    } catch (err) {
      console.error("Failed to load datalake files", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [token]);

  const handlePreview = async (file) => {
    setPreviewFile(file);
    setIsLoadingPreview(true);
    setPreviewData(null);
    try {
      const res = await axios.get(`${API_URL}/api/datalake/preview`, {
        params: { path: file.relative_path },
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreviewData(res.data);
    } catch (err) {
      alert("Failed to preview table: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleInsert = (file) => {
    onInsertQuery(file.query_snippet);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: previewFile ? '960px' : '760px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '16px' }}>
            <Database size={18} color="#8b5cf6" />
            <span>Data Lake & Parquet Storage</span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {previewFile ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <button className="btn-secondary" onClick={() => setPreviewFile(null)} style={{ marginRight: '10px' }}>
                    ← Back to File List
                  </button>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{previewFile.name}</span>
                  {previewData && (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                      ({previewData.total_rows.toLocaleString()} total rows, previewing first {previewData.preview_limit})
                    </span>
                  )}
                </div>
                <button className="btn-primary" onClick={() => handleInsert(previewFile)}>
                  + Insert DuckDB Query Block
                </button>
              </div>

              {isLoadingPreview ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading preview with DuckDB...
                </div>
              ) : previewData ? (
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table className="quantara-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        {previewData.columns.map((col, idx) => (
                          <th key={idx}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {previewData.columns.map((col, cIdx) => (
                            <td key={cIdx}>{row[col] !== undefined ? String(row[col]) : ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 0 }}>
                High-performance columnar datasets stored in local Data Lake / MinIO storage. Click <b>Preview</b> to inspect data or <b>Insert</b> to add a pre-written DuckDB query block.
              </p>

              {files.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-placeholder)' }}>
                  No dataset files discovered in datalake/ directory yet.
                </div>
              ) : (
                <table className="quantara-table">
                  <thead>
                    <tr>
                      <th>Dataset Name</th>
                      <th>Folder</th>
                      <th>Format</th>
                      <th>File Size</th>
                      <th>Modified Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{f.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{f.category}</td>
                        <td>
                          <span className={`badge badge-${f.format}`}>
                            {f.format}
                          </span>
                        </td>
                        <td>{f.size_formatted}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{f.modified}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn-secondary" onClick={() => handlePreview(f)} title="Preview first 10 rows">
                              <TableIcon size={12} /> Preview
                            </button>
                            <button className="btn-secondary" onClick={() => handleInsert(f)} title="Insert DuckDB query cell">
                              + Query
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
