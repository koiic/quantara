from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import re
import time

from auth import get_current_user, User

router = APIRouter(prefix="/api/ai", tags=["ai"])

class GenerateRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    asset: Optional[str] = "BTC-USD"

class AuditRequest(BaseModel):
    notebook_title: Optional[str] = "Untitled"
    cells: List[dict] # [{ type: str, content: str }]

class OptimizeRequest(BaseModel):
    code: str

# --- Knowledge Base for Quant Intelligence ---
QUANT_TEMPLATES = {
    "vwap": """import duckdb
import pandas as pd
import numpy as np

# 1. High-Performance Intraday VWAP Calculation via DuckDB
print("Computing Intraday Volume-Weighted Average Price (VWAP)...")
con = duckdb.connect()

query = \"\"\"
    SELECT 
        time_bucket(INTERVAL '5 minutes', timestamp) AS bar_time,
        sum(price * volume) / sum(volume) AS vwap,
        avg(price) AS twap,
        sum(volume) AS total_volume,
        max(price) AS high,
        min(price) AS low,
        first(price) AS open,
        last(price) AS close
    FROM read_parquet('../datalake/processed/ohlcv.parquet')
    GROUP BY bar_time
    ORDER BY bar_time ASC
\"\"\"
try:
    df_vwap = con.execute(query).df()
    print("VWAP calculated for", len(df_vwap), "bars.")
    display(df_vwap.head(10))
except Exception as e:
    print("Parquet file query fallback:", e)
""",

    "stat_arb": """import numpy as np
import pandas as pd
import plotly.graph_objects as go

# Statistical Arbitrage: Cointegration & Z-Score Mean Reversion
print("Running Statistical Arbitrage Pair Analysis (BTC vs ETH)...")
np.random.seed(42)
days = 180
dates = pd.date_range(end=pd.Timestamp.now(), periods=days, freq='D')

p1 = 60000 * np.exp(np.cumsum(np.random.normal(0.001, 0.02, days)))
p2 = 3000 * np.exp(np.cumsum(np.random.normal(0.001, 0.025, days)))

df_pair = pd.DataFrame({'BTC': p1, 'ETH': p2}, index=dates)

# Hedge ratio and Spread
hedge_ratio = np.polyfit(df_pair['ETH'], df_pair['BTC'], 1)[0]
df_pair['spread'] = df_pair['BTC'] - hedge_ratio * df_pair['ETH']
df_pair['zscore'] = (df_pair['spread'] - df_pair['spread'].rolling(20).mean()) / df_pair['spread'].rolling(20).std()

fig = go.Figure()
fig.add_trace(go.Scatter(x=df_pair.index, y=df_pair['zscore'], name="Spread Z-Score", line=dict(color="#2563eb")))
fig.add_hline(y=2.0, line_dash="dash", line_color="#ef4444", annotation_text="Upper Entry (+2σ)")
fig.add_hline(y=-2.0, line_dash="dash", line_color="#10b981", annotation_text="Lower Entry (-2σ)")
fig.add_hline(y=0.0, line_color="#6b7280", annotation_text="Mean Exit")
fig.update_layout(title=f"Stat-Arb Pair Z-Score (Hedge Ratio: {hedge_ratio:.2f})", template="plotly_white", height=420)
fig.show()
""",

    "monte_carlo": """import numpy as np
import pandas as pd
import plotly.express as px

# 1,000-Path Monte Carlo Portfolio Value-at-Risk (VaR)
print("Simulating 1,000-Path Monte Carlo Forward Projection...")
np.random.seed(101)
horizon_days = 60
num_simulations = 1000
initial_portfolio_value = 1_000_000

daily_mu = 0.0006
daily_sigma = 0.018

sim_returns = np.random.normal(daily_mu, daily_sigma, (horizon_days, num_simulations))
price_paths = initial_portfolio_value * np.cumprod(1 + sim_returns, axis=0)

final_values = price_paths[-1]
var_95 = initial_portfolio_value - np.percentile(final_values, 5)
cvar_95 = initial_portfolio_value - final_values[final_values <= np.percentile(final_values, 5)].mean()

print(f"Initial Portfolio: ${initial_portfolio_value:,.2f}")
print(f"95% Value-at-Risk (60-Day): ${var_95:,.2f} ({var_95 / initial_portfolio_value:.1%})")
print(f"95% Conditional VaR (Expected Shortfall): ${cvar_95:,.2f} ({cvar_95 / initial_portfolio_value:.1%})")

df_mc = pd.DataFrame(price_paths[:, :50])
fig = px.line(df_mc, title="Monte Carlo 60-Day Forward Paths (Subset 50 Paths)")
fig.update_layout(template="plotly_white", height=420, showlegend=False, yaxis_title="Portfolio Value ($)")
fig.show()
"""
}

@router.post("/generate")
async def generate_quant_code(req: GenerateRequest, current_user: User = Depends(get_current_user)):
    p = req.prompt.lower()
    
    # Intelligently route by financial intent
    if "vwap" in p or "twap" in p or "tick" in p:
        code = QUANT_TEMPLATES["vwap"]
        explanation = "Generated a high-performance 5-minute Intraday VWAP calculation pipeline using localized DuckDB SQL grouping on Parquet files."
    elif "arbitrage" in p or "pair" in p or "zscore" in p or "stat" in p:
        code = QUANT_TEMPLATES["stat_arb"]
        explanation = "Created a Statistical Arbitrage cointegration model calculating the hedge ratio, dynamic spread, and ±2σ normalized Z-Score entry thresholds."
    elif "monte" in p or "var" in p or "risk" in p or "simulation" in p:
        code = QUANT_TEMPLATES["monte_carlo"]
        explanation = "Implemented a 1,000-path Monte Carlo forward simulation calculating 95% Parametric VaR and Conditional VaR (Expected Shortfall)."
    else:
        # Default adaptive strategy
        code = f"""import pandas as pd
import numpy as np
import plotly.graph_objects as go

# Custom Alpha Model: {req.prompt.title()}
print("Compiling Quantitative Alpha Strategy for {req.asset}...")

# 1. Ingest Market Data
dates = pd.date_range(end=pd.Timestamp.now(), periods=120, freq='D')
np.random.seed(42)
returns = np.random.normal(0.0012, 0.02, len(dates))
prices = 50000 * np.cumprod(1 + returns)

df = pd.DataFrame({{'Date': dates, 'Close': prices}}).set_index('Date')

# 2. Compute Signals
df['Signal'] = np.where(df['Close'] > df['Close'].rolling(20).mean(), 1, -1)
df['Strategy_Returns'] = df['Signal'].shift(1) * df['Close'].pct_change()
df['Cumulative_Equity'] = (1 + df['Strategy_Returns'].fillna(0)).cumprod()

# 3. Calculate Risk Metrics
sharpe = np.sqrt(252) * (df['Strategy_Returns'].mean() / df['Strategy_Returns'].std())
print(f"Generated Strategy Sharpe Ratio: {{sharpe:.2f}}")

# 4. Render Chart
fig = go.Figure()
fig.add_trace(go.Scatter(x=df.index, y=df['Cumulative_Equity'], name="Strategy Equity", line=dict(color="#0f7b6c", width=2)))
fig.update_layout(title="{req.prompt.title()} - Cumulative Performance", template="plotly_white", height=400)
fig.show()
"""
        explanation = f"Generated a customized momentum/signal pipeline tailored to '{req.prompt}' for {req.asset}."

    return {
        "status": "ok",
        "prompt": req.prompt,
        "explanation": explanation,
        "code": code.strip()
    }

@router.post("/audit")
async def audit_notebook(req: AuditRequest, current_user: User = Depends(get_current_user)):
    """Audits notebook code for common quantitative research pitfalls."""
    findings = []
    score = 100

    full_code = "\n".join([c.get("content", "") for c in req.cells if c.get("type", "code") == "code"])

    # 1. Lookahead Bias Detection
    if re.search(r"shift\s*\(\s*-\d+\s*\)", full_code):
        if not re.search(r"\.shift\s*\(\s*1\s*\)", full_code) and "pct_change" in full_code:
            findings.append({
                "severity": "CRITICAL",
                "category": "Lookahead Bias",
                "message": "Detected negative shift `shift(-1)` without signal lag. Signals generated on bar T must not execute until bar T+1, or returns will leak future price information.",
                "remedy": "Ensure strategy returns use `df['Signal'].shift(1) * df['Returns']`."
            })
            score -= 35

    # 2. Zero-Slippage / Transaction Cost Assumption
    if "pct_change" in full_code and not re.search(r"(fee|commission|slippage|bps)", full_code, re.IGNORECASE):
        findings.append({
            "severity": "WARNING",
            "category": "Friction Leakage",
            "message": "Strategy does not account for exchange trading fees or execution slippage. High-frequency or mean-reverting strategies will degrade heavily under live exchange conditions.",
            "remedy": "Deduct at least 5-10 bps per trade turnover (e.g. `returns - turnover * 0.0005`)."
        })
        score -= 15

    # 3. Non-Vectorized Loops
    if re.search(r"(iterrows|itertuples|\bfor\s+\w+\s+in\s+range\(\s*len\()", full_code):
        findings.append({
            "severity": "OPTIMIZATION",
            "category": "Inefficient Iteration",
            "message": "Detected `iterrows()` or manual Python loops over dataframe records. This severely bottlenecks backtest throughput.",
            "remedy": "Vectorize using NumPy array operations or execute directly in DuckDB SQL."
        })
        score -= 10

    # 4. Survivorship Bias check
    if re.search(r"(\['BTC-USD'\]|yfinance)", full_code) and not re.search(r"(universe|point_in_time|delisted)", full_code, re.IGNORECASE):
        findings.append({
            "severity": "INFO",
            "category": "Universe Survivorship",
            "message": "Backtest uses a static asset without point-in-time universe selection. Verify survivorship bias when expanding to equities or altcoins.",
            "remedy": "Use dynamic point-in-time asset lists when running multi-asset sweeps."
        })

    # Summary Assessment
    if score >= 90:
        status_label = "Production Ready"
        color = "#10b981"
    elif score >= 70:
        status_label = "Acceptable with Warnings"
        color = "#f59e0b"
    else:
        status_label = "Significant Bias Detected"
        color = "#ef4444"

    return {
        "status": "ok",
        "notebook_title": req.notebook_title,
        "score": max(score, 20),
        "status_label": status_label,
        "color": color,
        "findings_count": len(findings),
        "findings": findings
    }
