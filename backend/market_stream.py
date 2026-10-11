import asyncio
import random
import time
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

router = APIRouter(prefix="/api/market", tags=["market"])

# Multi-Asset Universe: Crypto, US Equities, Saudi Tadawul Equities, and Forex (FX)
ASSETS = {
    # --- Crypto ---
    "BTC-USD": {
        "base": 68450.0, "tick": 0.5, "step": 15.0, "name": "Bitcoin", 
        "category": "crypto", "currency": "USD", "venue": "binance_testnet", "decimals": 2, "unit": "BTC"
    },
    "ETH-USD": {
        "base": 3520.0, "tick": 0.1, "step": 2.5, "name": "Ethereum", 
        "category": "crypto", "currency": "USD", "venue": "binance_testnet", "decimals": 2, "unit": "ETH"
    },
    "SOL-USD": {
        "base": 182.4, "tick": 0.05, "step": 0.4, "name": "Solana", 
        "category": "crypto", "currency": "USD", "venue": "binance_testnet", "decimals": 2, "unit": "SOL"
    },

    # --- US Equities ---
    "NVDA": {
        "base": 138.25, "tick": 0.01, "step": 0.45, "name": "NVIDIA Corp", 
        "category": "stock", "currency": "USD", "venue": "nasdaq_paper", "decimals": 2, "unit": "shares"
    },
    "AAPL": {
        "base": 227.50, "tick": 0.01, "step": 0.35, "name": "Apple Inc", 
        "category": "stock", "currency": "USD", "venue": "nasdaq_paper", "decimals": 2, "unit": "shares"
    },
    "MSFT": {
        "base": 418.30, "tick": 0.01, "step": 0.60, "name": "Microsoft Corp", 
        "category": "stock", "currency": "USD", "venue": "nasdaq_paper", "decimals": 2, "unit": "shares"
    },
    "TSLA": {
        "base": 252.10, "tick": 0.01, "step": 0.75, "name": "Tesla Inc", 
        "category": "stock", "currency": "USD", "venue": "nasdaq_paper", "decimals": 2, "unit": "shares"
    },
    "SPY": {
        "base": 586.40, "tick": 0.01, "step": 0.30, "name": "SPDR S&P 500 ETF", 
        "category": "stock", "currency": "USD", "venue": "nyse_arca_paper", "decimals": 2, "unit": "shares"
    },

    # --- Saudi Tadawul Equities (SAR) ---
    "2222.SR": {
        "base": 27.80, "tick": 0.05, "step": 0.10, "name": "Saudi Aramco", 
        "category": "stock", "currency": "SAR", "venue": "tadawul_fix_sandbox", "decimals": 2, "unit": "shares"
    },
    "1120.SR": {
        "base": 84.50, "tick": 0.10, "step": 0.25, "name": "Al Rajhi Bank", 
        "category": "stock", "currency": "SAR", "venue": "tadawul_fix_sandbox", "decimals": 2, "unit": "shares"
    },
    "2010.SR": {
        "base": 72.10, "tick": 0.10, "step": 0.20, "name": "SABIC Industries", 
        "category": "stock", "currency": "SAR", "venue": "tadawul_fix_sandbox", "decimals": 2, "unit": "shares"
    },

    # --- Forex / FX ---
    "EUR/USD": {
        "base": 1.08520, "tick": 0.0001, "step": 0.0003, "name": "Euro / US Dollar", 
        "category": "fx", "currency": "USD", "venue": "interbank_ecn", "decimals": 4, "unit": "lots"
    },
    "GBP/USD": {
        "base": 1.30650, "tick": 0.0001, "step": 0.0003, "name": "British Pound / US Dollar", 
        "category": "fx", "currency": "USD", "venue": "interbank_ecn", "decimals": 4, "unit": "lots"
    },
    "USD/JPY": {
        "base": 149.25, "tick": 0.01, "step": 0.04, "name": "US Dollar / Japanese Yen", 
        "category": "fx", "currency": "JPY", "venue": "interbank_ecn", "decimals": 2, "unit": "lots"
    },
    "USD/CHF": {
        "base": 0.86480, "tick": 0.0001, "step": 0.00025, "name": "US Dollar / Swiss Franc", 
        "category": "fx", "currency": "CHF", "venue": "interbank_ecn", "decimals": 4, "unit": "lots"
    },
    "AUD/USD": {
        "base": 0.67180, "tick": 0.0001, "step": 0.00025, "name": "Australian Dollar / US Dollar", 
        "category": "fx", "currency": "USD", "venue": "interbank_ecn", "decimals": 4, "unit": "lots"
    }
}

_current_prices = {k: v["base"] for k, v in ASSETS.items()}
_24h_changes = {
    "BTC-USD": 2.45,
    "ETH-USD": 1.82,
    "SOL-USD": -0.92,
    "NVDA": 3.82,
    "AAPL": 0.95,
    "MSFT": 1.20,
    "TSLA": 2.15,
    "SPY": 0.65,
    "2222.SR": 0.54,
    "1120.SR": 1.15,
    "2010.SR": -0.42,
    "EUR/USD": -0.12,
    "GBP/USD": 0.28,
    "USD/JPY": 0.35,
    "USD/CHF": -0.08,
    "AUD/USD": 0.19
}

def get_latest_price(symbol: str) -> float:
    asset_cfg = ASSETS.get(symbol, ASSETS.get("BTC-USD"))
    curr = _current_prices.get(symbol, asset_cfg["base"])
    decimals = asset_cfg.get("decimals", 2)
    drift = random.gauss(0, asset_cfg["step"] * 0.05)
    new_price = round(curr + drift, decimals)
    _current_prices[symbol] = new_price
    return new_price

def generate_l2_depth(symbol: str = "BTC-USD") -> Dict:
    asset_cfg = ASSETS.get(symbol, ASSETS["BTC-USD"])
    curr = _current_prices.get(symbol, asset_cfg["base"])
    decimals = asset_cfg.get("decimals", 2)
    cat = asset_cfg.get("category", "crypto")

    # Organic drift
    drift = random.gauss(0, asset_cfg["step"] * 0.08)
    mid = round(curr + drift, decimals)
    _current_prices[symbol] = mid

    spread_units = asset_cfg["tick"] * random.choice([1, 2])
    spread = round(spread_units, decimals)
    best_bid = round(mid - spread / 2, decimals)
    best_ask = round(mid + spread / 2, decimals)

    # Size generation tuned per asset class
    def sample_size():
        if cat == "crypto":
            return round(random.uniform(0.15, 3.8), 3)
        elif cat == "stock":
            return round(random.uniform(50, 850), 0)
        elif cat == "fx":
            return round(random.uniform(10000, 250000), 0)
        return round(random.uniform(1.0, 50.0), 2)

    bids = []
    cum_bid = 0.0
    for i in range(12):
        step_mult = (i + 1) * asset_cfg["tick"] * random.choice([1, 1.5, 2])
        p = round(best_bid - step_mult, decimals)
        sz = sample_size()
        cum_bid += sz
        bids.append({"price": p, "size": sz, "total": round(cum_bid, 3 if cat == 'crypto' else 0)})

    asks = []
    cum_ask = 0.0
    for i in range(12):
        step_mult = (i + 1) * asset_cfg["tick"] * random.choice([1, 1.5, 2])
        p = round(best_ask + step_mult, decimals)
        sz = sample_size()
        cum_ask += sz
        asks.append({"price": p, "size": sz, "total": round(cum_ask, 3 if cat == 'crypto' else 0)})

    # Simulated recent prints
    recent_trades = []
    for _ in range(5):
        side = random.choice(["buy", "sell"])
        p = best_ask if side == "buy" else best_bid
        recent_trades.append({
            "id": f"t-{random.randint(100000, 999999)}",
            "time": time.strftime("%H:%M:%S", time.localtime()),
            "price": p,
            "size": sample_size(),
            "side": side
        })

    return {
        "symbol": symbol,
        "name": asset_cfg["name"],
        "category": cat,
        "currency": asset_cfg["currency"],
        "venue": asset_cfg["venue"],
        "decimals": decimals,
        "unit": asset_cfg["unit"],
        "mid_price": mid,
        "spread": spread,
        "best_bid": best_bid,
        "best_ask": best_ask,
        "bids": bids,
        "asks": asks,
        "recent_trades": recent_trades,
        "timestamp": int(time.time() * 1000)
    }

@router.get("/ticker")
async def get_market_ticker():
    """Returns top institutional asset ticker snapshot."""
    tickers = []
    for sym, cfg in ASSETS.items():
        price = _current_prices[sym]
        chg = _24h_changes[sym]
        decimals = cfg.get("decimals", 2)
        tickers.append({
            "symbol": sym,
            "name": cfg["name"],
            "category": cfg.get("category", "crypto"),
            "currency": cfg.get("currency", "USD"),
            "venue": cfg.get("venue", "internal"),
            "price": price,
            "change_24h": chg,
            "high_24h": round(price * 1.025, decimals),
            "low_24h": round(price * 0.978, decimals),
            "funding_rate": "0.0100%" if cfg.get("category") == "crypto" else "N/A"
        })
    return {"status": "ok", "tickers": tickers, "timestamp": int(time.time() * 1000)}

@router.get("/depth")
async def get_market_depth(symbol: str = Query("BTC-USD")):
    """REST snapshot for Level 2 order book depth."""
    return generate_l2_depth(symbol)

# --- WebSocket for Real-time Streaming ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.subscriptions[websocket] = "BTC-USD"

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.subscriptions:
            del self.subscriptions[websocket]

    def set_subscription(self, websocket: WebSocket, symbol: str):
        self.subscriptions[websocket] = symbol

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_market_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Send initial snapshot immediately
    await websocket.send_json({"type": "snapshot", "data": generate_l2_depth("BTC-USD")})
    try:
        while True:
            msg = await websocket.receive_text()
            if msg:
                try:
                    import json
                    req = json.loads(msg)
                    if req.get("action") == "subscribe":
                        sym = req.get("symbol", "BTC-USD")
                        manager.set_subscription(websocket, sym)
                        await websocket.send_json({"type": "snapshot", "data": generate_l2_depth(sym)})
                except Exception:
                    pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# Background broadcast loop task
async def broadcast_market_depth_loop():
    while True:
        await asyncio.sleep(0.7)
        if manager.active_connections:
            for ws in list(manager.active_connections):
                try:
                    sym = manager.subscriptions.get(ws, "BTC-USD")
                    depth_data = generate_l2_depth(sym)
                    await ws.send_json({
                        "type": "depth_update",
                        "data": depth_data
                    })
                except Exception:
                    pass
