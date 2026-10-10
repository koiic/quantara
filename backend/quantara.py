"""
Quantara Python SDK for Quants & Notebook Execution.
Enables programmatic paper and shadow trading directly from interactive Jupyter cells.
"""

import requests
import json
import os
from typing import Dict, List, Optional

DEFAULT_API_URL = os.getenv("QUANTARA_API_URL", "http://127.0.0.1:8000")
_TOKEN = os.getenv("QUANTARA_TOKEN", None)

def set_token(token: str):
    """Sets the authentication token for Quantara execution engine."""
    global _TOKEN
    _TOKEN = token

def _get_headers() -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if _TOKEN:
        headers["Authorization"] = f"Bearer {_TOKEN}"
    return headers

def get_providers() -> List[Dict]:
    """Returns available execution providers and connectivity status."""
    res = requests.get(f"{DEFAULT_API_URL}/api/trading/providers", headers=_get_headers())
    res.raise_for_status()
    return res.json().get("providers", [])

def get_portfolio(mode: str = "PAPER") -> Dict:
    """Returns the current staging portfolio equity, cash balance, and PnL."""
    res = requests.get(f"{DEFAULT_API_URL}/api/trading/portfolio?mode={mode.upper()}", headers=_get_headers())
    res.raise_for_status()
    return res.json()

def get_positions(mode: str = "PAPER") -> List[Dict]:
    """Returns active open positions with mark-to-market valuations."""
    res = requests.get(f"{DEFAULT_API_URL}/api/trading/positions?mode={mode.upper()}", headers=_get_headers())
    res.raise_for_status()
    return res.json().get("positions", [])

def order(
    symbol: str, 
    side: str, 
    qty: float, 
    order_type: str = "MARKET", 
    limit_price: Optional[float] = None, 
    mode: str = "PAPER", 
    provider: str = "quantara_virtual",
    notes: Optional[str] = None
) -> Dict:
    """
    Submits a trade to the Quantara execution staging layer.
    
    Args:
        symbol: Ticker symbol (e.g. 'NVDA', '2222.SR', 'BTC-USD')
        side: 'BUY' or 'SELL'
        qty: Number of shares or contracts
        order_type: 'MARKET' or 'LIMIT'
        limit_price: Required if order_type is 'LIMIT'
        mode: 'PAPER' (Simulated Fills) or 'SHADOW' (Dark Canary Live Benchmarking)
        provider: Execution provider ('quantara_virtual', 'tadawul_fix_sandbox', 'interactive_brokers_paper', 'binance_testnet')
        notes: Optional quant strategy audit note
    """
    payload = {
        "symbol": symbol,
        "side": side.upper(),
        "order_type": order_type.upper(),
        "quantity": float(qty),
        "limit_price": limit_price,
        "execution_mode": mode.upper(),
        "provider_id": provider,
        "notes": notes
    }
    res = requests.post(f"{DEFAULT_API_URL}/api/trading/orders", json=payload, headers=_get_headers())
    res.raise_for_status()
    data = res.json()
    print(f"[{data['execution_mode']}] {data['side']} {data['quantity']} {data['symbol']} @ {data['fill_price']} (Slippage: {data['slippage_bps']} bps | Latency: {data['latency_ms']}ms)")
    return data

def close_position(symbol: str, mode: str = "PAPER") -> Dict:
    """Closes an open position at current market price."""
    res = requests.post(f"{DEFAULT_API_URL}/api/trading/positions/{symbol}/close?mode={mode.upper()}", headers=_get_headers())
    res.raise_for_status()
    return res.json()

def reset_portfolio(mode: str = "PAPER") -> Dict:
    """Resets the portfolio balance to $100,000 and clears positions."""
    res = requests.post(f"{DEFAULT_API_URL}/api/trading/reset?mode={mode.upper()}", headers=_get_headers())
    res.raise_for_status()
    return res.json()
