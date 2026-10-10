import asyncio
import random
import time
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

router = APIRouter(prefix="/api/market", tags=["market"])

# Base prices for assets
ASSETS = {
    "BTC-USD": {"base": 68450.0, "tick": 0.5, "step": 15.0, "name": "Bitcoin"},
    "ETH-USD": {"base": 3520.0, "tick": 0.1, "step": 2.5, "name": "Ethereum"},
    "SOL-USD": {"base": 182.4, "tick": 0.05, "step": 0.4, "name": "Solana"},
    "SPX": {"base": 5860.0, "tick": 0.25, "step": 1.2, "name": "S&P 500"},
    "US10Y": {"base": 4.18, "tick": 0.01, "step": 0.005, "name": "US 10Y Yield"},
}

_current_prices = {k: v["base"] for k, v in ASSETS.items()}
_24h_changes = {
    "BTC-USD": 2.45,
    "ETH-USD": 1.82,
    "SOL-USD": -0.92,
    "SPX": 0.65,
    "US10Y": -0.04
}

def generate_l2_depth(symbol: str = "BTC-USD") -> Dict:
    asset_cfg = ASSETS.get(symbol, ASSETS["BTC-USD"])
    mid = _current_prices.get(symbol, asset_cfg["base"])
    
    # Jitter current price slightly
    drift = random.gauss(0, asset_cfg["step"] * 0.1)
    mid = round(mid + drift, 2 if "USD" in symbol else 4)
    _current_prices[symbol] = mid

    spread = asset_cfg["tick"] * random.choice([1, 2])
    best_bid = round(mid - spread / 2, 2)
    best_ask = round(mid + spread / 2, 2)

    bids = []
    cum_bid = 0.0
    for i in range(12):
        price = round(best_bid - i * asset_cfg["tick"] * random.randint(1, 3), 2)
        size = round(random.uniform(0.15, 3.5), 3)
        cum_bid += size
        bids.append({"price": price, "size": size, "total": round(cum_bid, 3)})

    asks = []
    cum_ask = 0.0
    for i in range(12):
        price = round(best_ask + i * asset_cfg["tick"] * random.randint(1, 3), 2)
        size = round(random.uniform(0.15, 3.5), 3)
        cum_ask += size
        asks.append({"price": price, "size": size, "total": round(cum_ask, 3)})

    # Simulated recent trade prints
    recent_trades = []
    for _ in range(5):
        side = random.choice(["buy", "sell"])
        p = best_ask if side == "buy" else best_bid
        recent_trades.append({
            "id": f"t-{random.randint(100000, 999999)}",
            "time": time.strftime("%H:%M:%S", time.localtime()),
            "price": p,
            "size": round(random.uniform(0.05, 1.8), 3),
            "side": side
        })

    return {
        "symbol": symbol,
        "name": asset_cfg["name"],
        "mid_price": mid,
        "spread": round(best_ask - best_bid, 2),
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
        tickers.append({
            "symbol": sym,
            "name": cfg["name"],
            "price": price,
            "change_24h": chg,
            "high_24h": round(price * 1.025, 2),
            "low_24h": round(price * 0.978, 2),
            "funding_rate": "0.0100%" if "USD" in sym else "N/A"
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

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_market_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Send initial snapshot immediately
    await websocket.send_json({"type": "snapshot", "data": generate_l2_depth("BTC-USD")})
    try:
        while True:
            # Keep reading or handle symbol switch messages
            msg = await websocket.receive_text()
            if msg:
                try:
                    import json
                    req = json.loads(msg)
                    if req.get("action") == "subscribe":
                        sym = req.get("symbol", "BTC-USD")
                        await websocket.send_json({"type": "snapshot", "data": generate_l2_depth(sym)})
                except Exception:
                    pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# Background broadcast loop task
_streaming_task = None

async def broadcast_market_depth_loop():
    while True:
        await asyncio.sleep(0.7)
        if manager.active_connections:
            depth_btc = generate_l2_depth("BTC-USD")
            await manager.broadcast({
                "type": "depth_update",
                "data": depth_btc
            })
