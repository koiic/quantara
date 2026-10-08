import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { 
  FileText, Plus, Save, Play, Trash2, 
  LayoutTemplate, Sidebar as SidebarIcon, 
  Terminal, GripVertical, ChevronRight, Activity, BarChart2, Briefcase, Database, Lock, User
} from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:8000';

const TEMPLATES = [
  {
    id: 'tpl-4',
    icon: <Database size={16} color="#8b5cf6" />,
    title: 'Data Engineering (Parquet Pipeline)',
    cells: [
      { id: 'c1', content: 'import duckdb\nimport pandas as pd\nimport numpy as np\nimport os\n\nprint("Connecting to local DuckDB Data Lake...")\nos.makedirs("../datalake/raw", exist_ok=True)\nos.makedirs("../datalake/processed", exist_ok=True)\n\n# 1. Simulate pulling 1M rows of tick data\nprint("Generating raw CSV tick data...")\ndates = pd.date_range("2024-01-01", periods=100000, freq="s")\ndf = pd.DataFrame({\n    "timestamp": dates,\n    "symbol": np.random.choice(["BTC-USD", "ETH-USD", "SOL-USD"], 100000),\n    "price": np.random.uniform(100, 50000, 100000),\n    "volume": np.random.uniform(0.1, 10, 100000)\n})\ndf.to_csv("../datalake/raw/ticks.csv", index=False)\nprint(f"Raw CSV size: {os.path.getsize(\'../datalake/raw/ticks.csv\') / 1024 / 1024:.2f} MB")' },
      { id: 'c2', content: '# 2. Use DuckDB to query CSV and convert to Parquet directly\nprint("Executing DuckDB Transformation pipeline...")\nquery = """\n    COPY (\n        SELECT \n            symbol,\n            time_bucket(INTERVAL \'1 minute\', timestamp) AS minute,\n            avg(price) as vwap,\n            sum(volume) as total_volume\n        FROM read_csv_auto(\'../datalake/raw/ticks.csv\')\n        GROUP BY symbol, minute\n        ORDER BY minute ASC\n    ) TO \'../datalake/processed/ohlcv.parquet\' (FORMAT PARQUET, COMPRESSION ZSTD);\n"""\n\ncon = duckdb.connect()\ncon.execute(query)\n\nparquet_size = os.path.getsize("../datalake/processed/ohlcv.parquet")\nprint(f"Aggregated Parquet size: {parquet_size / 1024:.2f} KB (Highly Compressed!)")\n\n# Query the Parquet file to verify\ndisplay(con.execute("SELECT * FROM \'../datalake/processed/ohlcv.parquet\' LIMIT 5").df())' }
    ]
  },
  {
    id: 'tpl-1',
    icon: <Activity size={16} color="#0f7b6c" />,
    title: 'Quantitative Signal Analysis',
    cells: [
      { id: 'c1', content: 'import yfinance as yf\nimport plotly.graph_objects as go\nfrom plotly.subplots import make_subplots\n\nprint("Fetching BTC-USD Market Data...")\nticker = yf.Ticker("BTC-USD")\ndf = ticker.history(period="3mo")\n\n# Calculate Technical Indicators\ndf["SMA_20"] = df["Close"].rolling(window=20).mean()\ndf["BB_Upper"] = df["SMA_20"] + 2 * df["Close"].rolling(window=20).std()\ndf["BB_Lower"] = df["SMA_20"] - 2 * df["Close"].rolling(window=20).std()\n\nprint("Rendering Interactive Chart...")' },
      { id: 'c2', content: 'fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.05, row_heights=[0.7, 0.3])\n\n# Candlestick\nfig.add_trace(go.Candlestick(x=df.index, open=df["Open"], high=df["High"], low=df["Low"], close=df["Close"], name="BTC"), row=1, col=1)\n\n# Bollinger Bands & SMA\nfig.add_trace(go.Scatter(x=df.index, y=df["SMA_20"], name="SMA 20", line=dict(color="#2383e2")), row=1, col=1)\nfig.add_trace(go.Scatter(x=df.index, y=df["BB_Upper"], name="BB Upper", line=dict(color="rgba(100,100,100,0.3)", dash="dash")), row=1, col=1)\nfig.add_trace(go.Scatter(x=df.index, y=df["BB_Lower"], name="BB Lower", line=dict(color="rgba(100,100,100,0.3)", dash="dash"), fill="tonexty"), row=1, col=1)\n\n# Volume\nfig.add_trace(go.Bar(x=df.index, y=df["Volume"], name="Volume", marker_color="#0f7b6c"), row=2, col=1)\n\nfig.update_layout(title="BTC-USD Technical Signals (Interactive)", height=600, template="plotly_white", margin=dict(l=20, r=20, t=50, b=20))\nfig.show()' }
    ]
  },
  {
    id: 'tpl-2',
    icon: <BarChart2 size={16} color="#d97706" />,
    title: 'Order Book Imbalance Matrix',
    cells: [
      { id: 'c1', content: 'import numpy as np\nimport pandas as pd\nfrom IPython.display import display, HTML\n\nprint("Simulating L2 Order Book Imbalance (Bids vs Asks)...")\n\nlevels = [f"Level {i}" for i in range(1, 11)]\n# Simulate micro-structure data\nnp.random.seed(42)\nbids = np.random.randint(100, 1000, size=(10, 5))\nasks = np.random.randint(100, 1000, size=(10, 5))\n\ndf_bids = pd.DataFrame(bids, columns=["T-4", "T-3", "T-2", "T-1", "Current"], index=levels)\ndf_asks = pd.DataFrame(asks, columns=["T-4", "T-3", "T-2", "T-1", "Current"], index=levels)\n\n# Calculate Imbalance Ratio (-1 to 1)\nimbalance = (df_bids - df_asks) / (df_bids + df_asks)\n\n# Render beautiful Heatmap directly to the notebook UI\nhtml_output = imbalance.style.background_gradient(cmap="RdYlGn", axis=None).format("{:.2f}").to_html()\n\ndisplay(HTML(f"""\n<div style="font-family: sans-serif;">\n    <h3 style="color: #37352f; margin-bottom: 10px;">L2 Book Imbalance Heatmap</h3>\n    <p style="color: #666; font-size: 13px;">Green indicates heavy Bid concentration (buy pressure). Red indicates Ask concentration (sell pressure).</p>\n    {html_output}\n</div>\n"""))' }
    ]
  },
  {
    id: 'tpl-3',
    icon: <Briefcase size={16} color="#e11d48" />,
    title: 'Portfolio Backtest Tear Sheet',
    cells: [
      { id: 'c1', content: 'import pandas as pd\nimport numpy as np\nimport plotly.express as px\nfrom IPython.display import display, HTML\n\nprint("Backtesting Algorithmic Strategy: Mean Reversion...")\n\n# Simulate 2 years of daily returns\nnp.random.seed(99)\ndays = 500\nreturns = np.random.normal(0.0008, 0.012, days)\ndates = pd.date_range(start="2024-01-01", periods=days)\n\ndf = pd.DataFrame({"Daily Return": returns}, index=dates)\ndf["Cumulative Equity"] = (1 + df["Daily Return"]).cumprod()\n\n# Calculate Metrics\nsharpe = np.sqrt(252) * (df["Daily Return"].mean() / df["Daily Return"].std())\nrolling_max = df["Cumulative Equity"].cummax()\ndrawdown = (df["Cumulative Equity"] - rolling_max) / rolling_max\nmax_dd = drawdown.min()\ntotal_return = df["Cumulative Equity"].iloc[-1] - 1\n\n# 1. Render Metrics Dashboard\ndashboard = f"""\n<div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eee; margin-bottom: 20px; font-family: sans-serif; display: flex; gap: 40px;">\n    <div><div style="font-size: 12px; color: #888; text-transform: uppercase;">Sharpe Ratio</div><div style="font-size: 28px; font-weight: bold; color: {"#0f7b6c" if sharpe > 1 else "#e11d48"};">{sharpe:.2f}</div></div>\n    <div><div style="font-size: 12px; color: #888; text-transform: uppercase;">Max Drawdown</div><div style="font-size: 28px; font-weight: bold; color: #e11d48;">{max_dd:.2%}</div></div>\n    <div><div style="font-size: 12px; color: #888; text-transform: uppercase;">Total Return</div><div style="font-size: 28px; font-weight: bold; color: #0f7b6c;">{total_return:.2%}</div></div>\n</div>\n"""\ndisplay(HTML(dashboard))\n\n# 2. Render Equity Curve\nfig = px.area(df, x=df.index, y="Cumulative Equity", title="Strategy Equity Curve")\nfig.update_layout(template="plotly_white", height=400, margin=dict(l=20, r=20, t=50, b=20))\nfig.update_traces(line_color="#2383e2", fillcolor="rgba(35, 131, 226, 0.1)")\nfig.show()' }
    ]
  }
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('nexus_token'));
  const [user, setUser] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notebooks, setNotebooks] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Auth Effect
  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUser(res.data))
      .catch(() => {
        setToken(null);
        localStorage.removeItem('nexus_token');
      });
    }
  }, [token]);
  
  // Load from LocalStorage
  useEffect(() => {
    if (!token) return;
    const saved = localStorage.getItem('nexus_notebooks_v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotebooks(parsed);
      if (parsed.length > 0 && !activeId) setActiveId(parsed[0].id);
    } else {
      const defaultNb = { id: Date.now().toString(), title: 'Initial Workspace', cells: [{ id: 'init-c1', content: '' }] };
      setNotebooks([defaultNb]);
      setActiveId(defaultNb.id);
    }
  }, [token]);

  const saveWork = () => {
    localStorage.setItem('nexus_notebooks_v3', JSON.stringify(notebooks));
  };

  const createFromTemplate = (template) => {
    const newNb = {
      id: Date.now().toString(),
      title: `${template.title}`,
      cells: template.cells.map(c => ({ id: Date.now().toString() + Math.random(), content: c.content }))
    };
    setNotebooks([...notebooks, newNb]);
    setActiveId(newNb.id);
  };

  const createBlankNotebook = () => {
    const newNb = {
      id: Date.now().toString(),
      title: '',
      cells: [{ id: Date.now().toString() + 'c1', content: '' }]
    };
    setNotebooks([...notebooks, newNb]);
    setActiveId(newNb.id);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append('username', e.target.username.value);
    formData.append('password', e.target.password.value);
    
    try {
      const res = await axios.post(`${API_URL}/api/auth/token`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('nexus_token', res.data.access_token);
      setToken(res.data.access_token);
    } catch (err) {
      alert("Invalid credentials. Try admin / admin or quant1 / quant123");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f7f7f5' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontWeight: 'bold', fontSize: '18px' }}>
            <Terminal size={20} color="#2383e2" /> Nexus Data Platform
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>USERNAME</label>
              <input name="username" type="text" defaultValue="admin" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '4px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>PASSWORD</label>
              <input name="password" type="password" defaultValue="admin" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '4px' }} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              <Lock size={16} /> Sign In
            </button>
          </form>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '20px', textAlign: 'center' }}>
            Try <b>admin</b> / <b>admin</b>
          </div>
        </div>
      </div>
    );
  }

  const activeNotebook = notebooks.find(nb => nb.id === activeId);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* SIDEBAR */}
      <div style={{ 
        width: sidebarOpen ? '280px' : '0px', 
        background: 'var(--bg-sidebar)', 
        borderRight: '1px solid var(--border-color)',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
          <div style={{ background: 'var(--accent-blue)', color: 'white', borderRadius: '6px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Terminal size={18} />
          </div>
          Nexus Trading Hub
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', padding: '16px 16px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Private Notebooks
          </div>
          {notebooks.map(nb => (
            <div 
              key={nb.id}
              className={`sidebar-item ${activeId === nb.id ? 'active' : ''}`}
              onClick={() => setActiveId(nb.id)}
            >
              <FileText size={16} style={{ marginRight: '10px', color: activeId === nb.id ? 'var(--text-main)' : 'var(--text-placeholder)' }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                {nb.title || 'Untitled'}
              </span>
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
              onClick={() => createFromTemplate(tpl)}
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
        
        {/* TOP NAV */}
        <div style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "Close sidebar" : "Open sidebar"}>
              <SidebarIcon size={18} />
            </button>
            {!sidebarOpen && activeNotebook && (
              <>
                <ChevronRight size={16} color="var(--text-placeholder)" />
                <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>
                  {activeNotebook.title || 'Untitled'}
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-placeholder)', fontWeight: '500' }}>Auto-saving on run</span>
            <button className="btn-primary" onClick={saveWork}>
              <Save size={14} /> Save Now
            </button>
          </div>
        </div>

        {/* EDITOR SCROLL AREA */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeNotebook ? (
            <NotebookView 
              notebook={activeNotebook} 
              token={token}
              updateNotebook={(updatedNb) => {
                setNotebooks(nbs => nbs.map(nb => nb.id === updatedNb.id ? updatedNb : nb));
                localStorage.setItem('nexus_notebooks_v3', JSON.stringify(notebooks.map(nb => nb.id === updatedNb.id ? updatedNb : nb)));
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-placeholder)' }}>
              Select or create a notebook to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotebookView({ notebook, token, updateNotebook }) {
  const updateTitle = (newTitle) => {
    updateNotebook({ ...notebook, title: newTitle });
  };

  const addCell = (index = notebook.cells.length) => {
    const newCells = [...notebook.cells];
    newCells.splice(index, 0, { id: Date.now().toString(), content: '' });
    updateNotebook({ ...notebook, cells: newCells });
  };

  const updateCellContent = (cellId, content) => {
    const newCells = notebook.cells.map(c => c.id === cellId ? { ...c, content } : c);
    updateNotebook({ ...notebook, cells: newCells });
  };

  const removeCell = (cellId) => {
    const newCells = notebook.cells.filter(c => c.id !== cellId);
    if (newCells.length === 0) newCells.push({ id: Date.now().toString(), content: '' }); 
    updateNotebook({ ...notebook, cells: newCells });
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '60px 40px 200px' }}>
      <input 
        type="text"
        value={notebook.title}
        onChange={(e) => updateTitle(e.target.value)}
        className="title-input"
        placeholder="Untitled"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {notebook.cells.map((cell, index) => (
          <Cell 
            key={cell.id} 
            cell={cell} 
            token={token}
            onChange={(content) => updateCellContent(cell.id, content)}
            onRemove={() => removeCell(cell.id)}
            onAddBelow={() => addCell(index + 1)}
          />
        ))}
      </div>

      <div style={{ marginTop: '16px', marginLeft: '40px' }}>
        <button className="add-block-btn" onClick={() => addCell()}>
          <Plus size={16} /> Click to add a block
        </button>
      </div>
    </div>
  );
}

function Cell({ cell, token, onChange, onRemove, onAddBelow }) {
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const handleRun = async () => {
    setIsRunning(true);
    setOutput([]);
    try {
      const res = await axios.post(`${API_URL}/api/execute`, 
        { code: cell.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOutput(res.data.outputs || []);
    } catch (err) {
      if (err.response?.status === 401) {
         alert("Session expired. Please refresh and log in again.");
      }
      setOutput([{ type: 'error', data: err.message || 'Execution failed' }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="cell-wrapper">
      <div style={{ width: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div className="cell-drag-handle">
          <GripVertical size={16} />
        </div>
        
        <button 
          onClick={handleRun}
          disabled={isRunning}
          className="btn-icon"
          style={{ 
            marginTop: '4px',
            color: isRunning ? 'var(--text-placeholder)' : 'var(--text-muted)',
            cursor: isRunning ? 'default' : 'pointer'
          }}
          title="Run Cell"
        >
          {isRunning ? (
            <div style={{ width: '16px', height: '16px', border: '2px solid var(--border-color)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
        </button>
      </div>
      
      <div className={`cell-content ${isFocused ? 'focused' : ''}`}>
        <div className="editor-container">
          <Editor
            height="100px" 
            defaultLanguage="python"
            value={cell.content}
            onChange={(val) => onChange(val)}
            onMount={(editor) => {
              editor.onDidFocusEditorWidget(() => setIsFocused(true));
              editor.onDidBlurEditorWidget(() => setIsFocused(false));
              
              const updateHeight = () => {
                const contentHeight = Math.min(1000, Math.max(40, editor.getContentHeight()));
                editor.getContainerElement().style.height = `${contentHeight}px`;
                editor.layout();
              };
              editor.onDidContentSizeChange(updateHeight);
              setTimeout(updateHeight, 100);
            }}
            options={{ 
              minimap: { enabled: false }, 
              scrollBeyondLastLine: false, 
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineNumbers: 'off',
              folding: false,
              overviewRulerLanes: 0,
              renderLineHighlight: 'none',
              hideCursorInOverviewRuler: true,
              scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
              contextmenu: false,
              wordWrap: 'on'
            }}
          />
        </div>

        {output.length > 0 && (
          <div className="output-container" style={{ padding: output.find(o => o.type === 'html') ? '0px' : '12px' }}>
            {output.map((out, i) => {
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
                <div key={i} style={{ color: out.type === 'error' ? 'var(--accent-red)' : 'inherit', whiteSpace: 'pre-wrap', padding: '12px' }}>
                  {out.data}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ width: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '8px', opacity: 0 }} className="cell-actions-right">
        <button className="btn-icon" onClick={onRemove} title="Delete">
          <Trash2 size={14} />
        </button>
        <button className="btn-icon" onClick={onAddBelow} title="Add below">
          <Plus size={14} />
        </button>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .cell-wrapper:hover .cell-actions-right { opacity: 1 !important; }
        
        .output-container table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        .output-container th, .output-container td { padding: 8px 12px; border: 1px solid #eee; text-align: right; }
        .output-container th { background: #fbfbfb; font-weight: 600; color: #555; }
      `}</style>
    </div>
  );
}
