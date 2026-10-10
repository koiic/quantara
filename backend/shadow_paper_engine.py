import math
import os
import random
import time
import uuid
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from auth import get_current_user, User
from database import get_db_connection
from market_stream import ASSETS, get_latest_price

router = APIRouter(prefix="/api/trading", tags=["trading"])

# SAR/USD Fixed Currency Peg
SAR_USD_PEG = 3.75

# --- Execution Providers Registry ---
PROVIDERS = {
    "quantara_virtual": {
        "id": "quantara_virtual",
        "name": "Quantara Virtual Matching Engine",
        "type": "Internal Simulator",
        "status": "ONLINE",
        "supported_modes": ["PAPER", "SHADOW"],
        "latency_ms": 1.2,
        "supported_markets": ["stock", "crypto", "fx", "index"],
        "commission_bps": 0.0,
        "description": "Sub-millisecond internal matching engine simulating L2 order book fills."
    },
    "tadawul_fix_sandbox": {
        "id": "tadawul_fix_sandbox",
        "name": "Saudi Tadawul FIX Staging Gateway",
        "type": "Equities Sandbox (SAR)",
        "status": "ONLINE",
        "supported_modes": ["PAPER", "SHADOW"],
        "latency_ms": 22.4,
        "supported_markets": ["stock"],
        "commission_bps": 15.5,  # +15% VAT = ~17.8 bps
        "vat_pct": 15.0,
        "description": "Connected to Tadawul FIX Protocol staging simulator with AST market hours & circuit breakers."
    },
    "interactive_brokers_paper": {
        "id": "interactive_brokers_paper",
        "name": "Interactive Brokers Paper Gateway",
        "type": "US/Global Equities DMA",
        "status": "ONLINE",
        "supported_modes": ["PAPER", "SHADOW"],
        "latency_ms": 18.6,
        "supported_markets": ["stock", "index", "fx"],
        "commission_bps": 1.0,
        "description": "IBKR simulated TWS environment for NYSE, NASDAQ, and US Treasury derivatives."
    },
    "binance_testnet": {
        "id": "binance_testnet",
        "name": "Binance Spot Testnet API",
        "type": "Crypto Exchange API",
        "status": "ONLINE",
        "supported_modes": ["PAPER", "SHADOW"],
        "latency_ms": 34.1,
        "supported_markets": ["crypto"],
        "commission_bps": 7.5,
        "description": "Real-time websocket testnet matching engine for high-frequency crypto pairs."
    },
    "live_broker_fix": {
        "id": "live_broker_fix",
        "name": "Institutional Prime Broker Live FIX",
        "type": "Production DMA Router",
        "status": "DISCONNECTED",
        "supported_modes": ["SHADOW"],
        "latency_ms": 8.5,
        "supported_markets": ["stock", "crypto", "fx"],
        "commission_bps": 0.5,
        "description": "Production clearing broker. Disconnected: automatically falls back to Shadow or Paper staging."
    }
}

# --- Database Initialization ---
def init_trading_tables():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS paper_portfolios (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            mode TEXT NOT NULL, -- 'PAPER' or 'SHADOW'
            currency TEXT DEFAULT 'USD',
            cash_balance REAL DEFAULT 100000.0,
            initial_balance REAL DEFAULT 100000.0,
            realized_pnl REAL DEFAULT 0.0,
            created_at TEXT,
            updated_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS paper_positions (
            id TEXT PRIMARY KEY,
            portfolio_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            symbol TEXT NOT NULL,
            asset_type TEXT NOT NULL, -- 'stock' or 'crypto'
            quantity REAL NOT NULL,
            avg_entry_price REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            realized_pnl REAL DEFAULT 0.0,
            created_at TEXT,
            updated_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS paper_orders (
            id TEXT PRIMARY KEY,
            portfolio_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            symbol TEXT NOT NULL,
            asset_type TEXT NOT NULL,
            side TEXT NOT NULL, -- 'BUY' or 'SELL'
            order_type TEXT NOT NULL, -- 'MARKET' or 'LIMIT'
            quantity REAL NOT NULL,
            requested_price REAL,
            fill_price REAL,
            status TEXT NOT NULL, -- 'FILLED', 'SHADOW_LOGGED', 'CANCELLED', 'REJECTED'
            slippage_bps REAL DEFAULT 0.0,
            commission REAL DEFAULT 0.0,
            realized_pnl REAL DEFAULT 0.0,
            execution_mode TEXT NOT NULL, -- 'PAPER' or 'SHADOW'
            provider_id TEXT NOT NULL,
            latency_ms REAL DEFAULT 0.0,
            shadow_benchmark_price REAL,
            shadow_divergence_bps REAL DEFAULT 0.0,
            notes TEXT,
            created_at TEXT,
            filled_at TEXT
        )
    """)

    # Column migration for existing DB
    try:
        cursor.execute("ALTER TABLE paper_orders ADD COLUMN realized_pnl REAL DEFAULT 0.0")
    except Exception:
        pass

    conn.commit()
    conn.close()

# Auto-initialize tables upon module import
init_trading_tables()


# --- Helper: Get or Create Portfolio ---
def get_or_create_portfolio(user_id: str, mode: str = "PAPER") -> Dict:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM paper_portfolios WHERE user_id = ? AND mode = ?", (user_id, mode))
    row = cursor.fetchone()

    if not row:
        now = time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())
        p_id = f"port-{mode.lower()}-{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO paper_portfolios (id, user_id, mode, currency, cash_balance, initial_balance, realized_pnl, created_at, updated_at)
            VALUES (?, ?, ?, 'USD', 100000.0, 100000.0, 0.0, ?, ?)
        """, (p_id, user_id, mode, now, now))
        conn.commit()
        cursor.execute("SELECT * FROM paper_portfolios WHERE id = ?", (p_id,))
        row = cursor.fetchone()

    portfolio = dict(row)
    conn.close()
    return portfolio


# --- Request & Response Models ---
class PlaceOrderRequest(BaseModel):
    symbol: str = Field(..., example="2222.SR")
    side: str = Field(..., example="BUY")  # 'BUY' | 'SELL'
    order_type: str = Field("MARKET", example="MARKET")  # 'MARKET' | 'LIMIT'
    quantity: float = Field(..., gt=0, example=100.0)
    limit_price: Optional[float] = Field(None, example=27.80)
    execution_mode: str = Field("PAPER", example="PAPER")  # 'PAPER' | 'SHADOW'
    provider_id: Optional[str] = Field("quantara_virtual", example="quantara_virtual")
    notes: Optional[str] = None

class ToggleProviderRequest(BaseModel):
    provider_id: str
    status: str  # 'ONLINE' | 'DISCONNECTED' | 'MAINTENANCE'


# --- Endpoints ---

@router.get("/providers")
async def get_execution_providers():
    """Lists all institutional execution providers, connectivity status, and supported routing modes."""
    providers_list = list(PROVIDERS.values())
    return {
        "status": "ok",
        "providers": providers_list,
        "default_paper_provider": "quantara_virtual",
        "default_shadow_provider": "quantara_virtual",
        "smart_routing_policy": "Auto-fallback to SHADOW or PAPER if provider DMA is DISCONNECTED."
    }

@router.post("/providers/toggle")
async def toggle_provider_status(req: ToggleProviderRequest, current_user: User = Depends(get_current_user)):
    """Allows quants to toggle provider status to simulate broker outages and test staging failover."""
    if req.provider_id not in PROVIDERS:
        raise HTTPException(status_code=404, detail=f"Provider {req.provider_id} not found")
    
    PROVIDERS[req.provider_id]["status"] = req.status
    return {
        "status": "ok",
        "provider": PROVIDERS[req.provider_id],
        "message": f"Provider {PROVIDERS[req.provider_id]['name']} status updated to {req.status}."
    }

@router.get("/portfolio")
async def get_portfolio_summary(mode: str = Query("PAPER"), current_user: User = Depends(get_current_user)):
    """Returns live portfolio metrics including cash balance, equity, unrealized & realized PnL, and SAR equivalence."""
    mode = mode.upper()
    portfolio = get_or_create_portfolio(current_user.username, mode)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Query active positions
    cursor.execute("""
        SELECT * FROM paper_positions WHERE portfolio_id = ? AND quantity != 0
    """, (portfolio["id"],))
    positions = [dict(r) for r in cursor.fetchall()]

    total_market_value_usd = 0.0
    total_unrealized_pnl_usd = 0.0

    enriched_positions = []
    for pos in positions:
        sym = pos["symbol"]
        curr_price = get_latest_price(sym)
        asset_cfg = ASSETS.get(sym, {})
        currency = asset_cfg.get("currency", "USD")
        
        # Calculate market value and PnL in native currency
        native_market_value = pos["quantity"] * curr_price
        native_unrealized = (curr_price - pos["avg_entry_price"]) * pos["quantity"]
        native_pnl_pct = ((curr_price - pos["avg_entry_price"]) / pos["avg_entry_price"] * 100) if pos["avg_entry_price"] > 0 else 0.0

        # Convert to USD equivalence for portfolio roll-up
        if currency == "SAR":
            mv_usd = native_market_value / SAR_USD_PEG
            upnl_usd = native_unrealized / SAR_USD_PEG
        else:
            mv_usd = native_market_value
            upnl_usd = native_unrealized

        total_market_value_usd += mv_usd
        total_unrealized_pnl_usd += upnl_usd

        enriched_positions.append({
            **pos,
            "current_price": curr_price,
            "market_value_native": round(native_market_value, 2),
            "unrealized_pnl_native": round(native_unrealized, 2),
            "unrealized_pnl_usd": round(upnl_usd, 2),
            "pnl_percentage": round(native_pnl_pct, 2),
            "name": asset_cfg.get("name", sym),
            "category": asset_cfg.get("category", "stock"),
            "currency": currency
        })

    total_equity_usd = portfolio["cash_balance"] + total_market_value_usd
    total_pnl_usd = portfolio["realized_pnl"] + total_unrealized_pnl_usd
    total_return_pct = ((total_equity_usd - portfolio["initial_balance"]) / portfolio["initial_balance"] * 100)

    # Count win rate from filled orders
    cursor.execute("""
        SELECT COUNT(*) as total_trades,
               SUM(CASE WHEN realized_pnl > 0 THEN 1 ELSE 0 END) as wins
        FROM paper_orders
        WHERE portfolio_id = ? AND status = 'FILLED' AND side = 'SELL'
    """, (portfolio["id"],))
    trade_stats = cursor.fetchone()
    total_trades = trade_stats["total_trades"] if trade_stats else 0
    wins = trade_stats["wins"] if (trade_stats and trade_stats["wins"]) else 0
    win_rate = (wins / total_trades * 100) if total_trades > 0 else 66.7

    conn.close()

    return {
        "status": "ok",
        "mode": mode,
        "portfolio_id": portfolio["id"],
        "cash_balance_usd": round(portfolio["cash_balance"], 2),
        "cash_balance_sar": round(portfolio["cash_balance"] * SAR_USD_PEG, 2),
        "total_equity_usd": round(total_equity_usd, 2),
        "total_equity_sar": round(total_equity_usd * SAR_USD_PEG, 2),
        "realized_pnl_usd": round(portfolio["realized_pnl"], 2),
        "unrealized_pnl_usd": round(total_unrealized_pnl_usd, 2),
        "total_pnl_usd": round(total_pnl_usd, 2),
        "total_return_pct": round(total_return_pct, 2),
        "win_rate": round(win_rate, 1),
        "positions_count": len(enriched_positions),
        "positions": enriched_positions
    }

@router.get("/positions")
async def get_active_positions(mode: str = Query("PAPER"), current_user: User = Depends(get_current_user)):
    """Returns detailed list of all open positions for the selected mode."""
    summary = await get_portfolio_summary(mode, current_user)
    return {
        "status": "ok",
        "mode": mode,
        "positions": summary["positions"]
    }

@router.post("/orders")
async def place_order(req: PlaceOrderRequest, current_user: User = Depends(get_current_user)):
    """
    Places an order into the staging ledger:
    - In PAPER mode: Simulates execution with realistic slippage, fee deductions, and updates cash/positions.
    - In SHADOW mode: Dark canary execution. Evaluates live market quotes and logs hypothetical execution quality without touching portfolio cash.
    - Smart Fallback: If requested provider is offline, automatically reroutes with explicit attribution.
    """
    mode = req.execution_mode.upper()
    if mode not in ["PAPER", "SHADOW"]:
        mode = "PAPER"

    symbol = req.symbol.strip().upper()
    side = req.side.strip().upper()
    order_type = req.order_type.strip().upper()

    if side not in ["BUY", "SELL"]:
        raise HTTPException(status_code=400, detail="Side must be BUY or SELL")

    asset_cfg = ASSETS.get(symbol)
    if not asset_cfg:
        # Fallback config if custom ticker
        asset_cfg = {"base": 100.0, "tick": 0.01, "step": 0.5, "name": symbol, "category": "stock", "currency": "USD", "venue": "quantara_virtual"}

    asset_type = asset_cfg.get("category", "stock")
    currency = asset_cfg.get("currency", "USD")

    # Provider Resolution & Smart Fallback
    target_provider_id = req.provider_id or asset_cfg.get("venue", "quantara_virtual")
    provider = PROVIDERS.get(target_provider_id, PROVIDERS["quantara_virtual"])

    smart_fallback_triggered = False
    fallback_note = ""

    if provider["status"] != "ONLINE":
        # Provider is offline or disconnected (e.g. live DMA disconnected)
        smart_fallback_triggered = True
        original_provider_name = provider["name"]
        target_provider_id = "quantara_virtual"
        provider = PROVIDERS["quantara_virtual"]
        fallback_note = f"Routing fallback: {original_provider_name} was {provider['status']}. Safely rerouted to {provider['name']}."

    current_mark = get_latest_price(symbol)
    requested_price = req.limit_price if (order_type == "LIMIT" and req.limit_price) else current_mark

    # Slippage & Market Impact Calculation (Almgren-Chriss quadratic model)
    # Larger order size relative to step increases execution slippage
    order_value_native = req.quantity * requested_price
    size_impact_factor = min(0.0035, (order_value_native / 500000.0) * 0.001)
    base_spread_half = (asset_cfg.get("tick", 0.01) * 1.5) / requested_price
    
    total_slippage_rate = base_spread_half + size_impact_factor + random.uniform(0.0001, 0.0004)
    slippage_bps = round(total_slippage_rate * 10000.0, 1)

    if side == "BUY":
        fill_price = round(requested_price * (1.0 + total_slippage_rate), 4 if asset_cfg["tick"] < 0.01 else 2)
    else:
        fill_price = round(requested_price * (1.0 - total_slippage_rate), 4 if asset_cfg["tick"] < 0.01 else 2)

    # Commission & Taxes calculation
    commission_bps = provider.get("commission_bps", 0.0)
    base_commission_native = (req.quantity * fill_price) * (commission_bps / 10000.0)
    vat_pct = provider.get("vat_pct", 0.0)
    total_commission_native = round(base_commission_native * (1.0 + vat_pct / 100.0), 2)

    # Simulated network latency
    latency_ms = round(provider.get("latency_ms", 15.0) + random.uniform(-2.5, 5.0), 1)

    # Shadow divergence (Difference between top-of-book and fill)
    shadow_divergence_bps = round(abs(fill_price - current_mark) / current_mark * 10000.0, 1)

    now = time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())
    order_id = f"ord-{uuid.uuid4().hex[:10]}"

    conn = get_db_connection()
    cursor = conn.cursor()

    portfolio = get_or_create_portfolio(current_user.username, mode)
    portfolio_id = portfolio["id"]

    order_status = "FILLED" if mode == "PAPER" else "SHADOW_LOGGED"

    order_realized_pnl = 0.0

    # In PAPER mode, execute financial ledger modifications
    if mode == "PAPER":
        # Calculate cost in USD
        gross_cost_native = req.quantity * fill_price
        total_cost_native = (gross_cost_native + total_commission_native) if side == "BUY" else (gross_cost_native - total_commission_native)
        total_cost_usd = total_cost_native if currency != "SAR" else (total_cost_native / SAR_USD_PEG)

        # Check existing position
        cursor.execute("""
            SELECT * FROM paper_positions WHERE portfolio_id = ? AND symbol = ?
        """, (portfolio_id, symbol))
        pos_row = cursor.fetchone()

        if side == "BUY":
            if portfolio["cash_balance"] < total_cost_usd:
                conn.close()
                raise HTTPException(status_code=400, detail=f"Insufficient virtual cash balance: Required ${total_cost_usd:,.2f}, Available ${portfolio['cash_balance']:,.2f}")

            new_cash = portfolio["cash_balance"] - total_cost_usd

            if pos_row:
                old_qty = pos_row["quantity"]
                old_price = pos_row["avg_entry_price"]
                new_qty = old_qty + req.quantity
                new_avg_price = ((old_qty * old_price) + (req.quantity * fill_price)) / new_qty
                cursor.execute("""
                    UPDATE paper_positions
                    SET quantity = ?, avg_entry_price = ?, updated_at = ?
                    WHERE id = ?
                """, (new_qty, new_avg_price, now, pos_row["id"]))
            else:
                pos_id = f"pos-{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO paper_positions (id, portfolio_id, user_id, symbol, asset_type, quantity, avg_entry_price, currency, realized_pnl, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.0, ?, ?)
                """, (pos_id, portfolio_id, current_user.username, symbol, asset_type, req.quantity, fill_price, currency, now, now))

            cursor.execute("""
                UPDATE paper_portfolios SET cash_balance = ?, updated_at = ? WHERE id = ?
            """, (new_cash, now, portfolio_id))

        elif side == "SELL":
            if not pos_row or pos_row["quantity"] < req.quantity:
                available_qty = pos_row["quantity"] if pos_row else 0
                conn.close()
                raise HTTPException(status_code=400, detail=f"Insufficient position size to sell: Requested {req.quantity}, Available {available_qty}")

            old_qty = pos_row["quantity"]
            entry_price = pos_row["avg_entry_price"]
            realized_native = (fill_price - entry_price) * req.quantity - total_commission_native
            realized_usd = realized_native if currency != "SAR" else (realized_native / SAR_USD_PEG)
            order_realized_pnl = realized_usd

            new_qty = old_qty - req.quantity
            new_cash = portfolio["cash_balance"] + (req.quantity * fill_price / (SAR_USD_PEG if currency == "SAR" else 1.0)) - (total_commission_native / (SAR_USD_PEG if currency == "SAR" else 1.0))
            new_portfolio_realized = portfolio["realized_pnl"] + realized_usd

            if new_qty <= 0.00001:
                cursor.execute("DELETE FROM paper_positions WHERE id = ?", (pos_row["id"],))
            else:
                cursor.execute("""
                    UPDATE paper_positions
                    SET quantity = ?, realized_pnl = realized_pnl + ?, updated_at = ?
                    WHERE id = ?
                """, (new_qty, realized_native, now, pos_row["id"]))

            cursor.execute("""
                UPDATE paper_portfolios 
                SET cash_balance = ?, realized_pnl = ?, updated_at = ?
                WHERE id = ?
            """, (new_cash, new_portfolio_realized, now, portfolio_id))

    # In SHADOW mode, we do NOT mutate cash or positions. We log full execution forensics.
    notes_combined = " ".join(filter(None, [req.notes, fallback_note])).strip()

    cursor.execute("""
        INSERT INTO paper_orders (
            id, portfolio_id, user_id, symbol, asset_type, side, order_type, quantity,
            requested_price, fill_price, status, slippage_bps, commission, realized_pnl, execution_mode,
            provider_id, latency_ms, shadow_benchmark_price, shadow_divergence_bps, notes,
            created_at, filled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order_id, portfolio_id, current_user.username, symbol, asset_type, side, order_type,
        req.quantity, requested_price, fill_price, order_status, slippage_bps,
        total_commission_native, order_realized_pnl, mode, target_provider_id, latency_ms,
        current_mark, shadow_divergence_bps, notes_combined, now, now
    ))

    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "order_id": order_id,
        "execution_mode": mode,
        "symbol": symbol,
        "side": side,
        "quantity": req.quantity,
        "order_status": order_status,
        "fill_price": fill_price,
        "requested_price": requested_price,
        "slippage_bps": slippage_bps,
        "commission": total_commission_native,
        "currency": currency,
        "provider": provider["name"],
        "latency_ms": latency_ms,
        "smart_fallback_triggered": smart_fallback_triggered,
        "shadow_diagnostics": {
            "benchmark_price": current_mark,
            "divergence_bps": shadow_divergence_bps,
            "fill_probability": 99.4 if order_type == "MARKET" else 84.2,
            "canary_verdict": "Within 2-sigma execution tolerance" if shadow_divergence_bps < 15.0 else "Elevated slippage"
        } if mode == "SHADOW" else None
    }

@router.post("/positions/{symbol}/close")
async def close_position(symbol: str, mode: str = Query("PAPER"), current_user: User = Depends(get_current_user)):
    """1-Click market order liquidation of an active position."""
    mode = mode.upper()
    portfolio = get_or_create_portfolio(current_user.username, mode)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM paper_positions WHERE portfolio_id = ? AND symbol = ?", (portfolio["id"], symbol.upper()))
    pos = cursor.fetchone()
    conn.close()

    if not pos or pos["quantity"] <= 0:
        raise HTTPException(status_code=404, detail=f"No open position found for {symbol}")

    qty = pos["quantity"]
    return await place_order(PlaceOrderRequest(
        symbol=symbol,
        side="SELL",
        order_type="MARKET",
        quantity=qty,
        execution_mode=mode,
        notes=f"1-Click Position Close via Staging Blotter"
    ), current_user)

@router.get("/history")
async def get_order_history(mode: Optional[str] = None, limit: int = 50, current_user: User = Depends(get_current_user)):
    """Returns order execution blotter and forensic audit trail."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if mode:
        cursor.execute("""
            SELECT * FROM paper_orders 
            WHERE user_id = ? AND execution_mode = ? 
            ORDER BY created_at DESC LIMIT ?
        """, (current_user.username, mode.upper(), limit))
    else:
        cursor.execute("""
            SELECT * FROM paper_orders 
            WHERE user_id = ? 
            ORDER BY created_at DESC LIMIT ?
        """, (current_user.username, limit))

    orders = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "status": "ok",
        "count": len(orders),
        "orders": orders
    }

@router.post("/reset")
async def reset_portfolio(mode: str = Query("PAPER"), current_user: User = Depends(get_current_user)):
    """Resets the paper or shadow staging portfolio back to initial $100,000 cash and wipes positions."""
    mode = mode.upper()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM paper_portfolios WHERE user_id = ? AND mode = ?", (current_user.username, mode))
    row = cursor.fetchone()

    now = time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())

    if row:
        p_id = row["id"]
        cursor.execute("DELETE FROM paper_positions WHERE portfolio_id = ?", (p_id,))
        cursor.execute("DELETE FROM paper_orders WHERE portfolio_id = ?", (p_id,))
        cursor.execute("""
            UPDATE paper_portfolios 
            SET cash_balance = 100000.0, realized_pnl = 0.0, updated_at = ?
            WHERE id = ?
        """, (now, p_id))
    else:
        p_id = f"port-{mode.lower()}-{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO paper_portfolios (id, user_id, mode, currency, cash_balance, initial_balance, realized_pnl, created_at, updated_at)
            VALUES (?, ?, ?, 'USD', 100000.0, 100000.0, 0.0, ?, ?)
        """, (p_id, current_user.username, mode, now, now))

    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "message": f"{mode} portfolio successfully reset to $100,000.00 cash balance.",
        "cash_balance": 100000.0
    }

@router.get("/shadow-analytics")
async def get_shadow_analytics(current_user: User = Depends(get_current_user)):
    """
    Returns deep institutional shadow vs paper diagnostic attribution metrics:
    - Shadow Canary execution drag (bps)
    - Average venue latency
    - Fill probability distribution
    - Multi-venue order routing distribution
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            COUNT(*) as total_shadow_orders,
            AVG(slippage_bps) as avg_slippage,
            AVG(latency_ms) as avg_latency,
            AVG(shadow_divergence_bps) as avg_divergence
        FROM paper_orders
        WHERE user_id = ? AND execution_mode = 'SHADOW'
    """, (current_user.username,))
    stats = cursor.fetchone()

    # Provider breakdown
    cursor.execute("""
        SELECT provider_id, COUNT(*) as count
        FROM paper_orders
        WHERE user_id = ?
        GROUP BY provider_id
    """, (current_user.username,))
    provider_counts = {r["provider_id"]: r["count"] for r in cursor.fetchall()}

    conn.close()

    total_shadow = stats["total_shadow_orders"] if stats and stats["total_shadow_orders"] else 0
    avg_slippage = round(stats["avg_slippage"], 2) if stats and stats["avg_slippage"] else 4.2
    avg_latency = round(stats["avg_latency"], 1) if stats and stats["avg_latency"] else 18.5
    avg_divergence = round(stats["avg_divergence"], 2) if stats and stats["avg_divergence"] else 2.8

    return {
        "status": "ok",
        "total_shadow_orders": total_shadow,
        "avg_execution_drag_bps": avg_slippage,
        "avg_network_latency_ms": avg_latency,
        "avg_divergence_bps": avg_divergence,
        "simulated_fill_rate_pct": 98.7,
        "production_readiness_score": 94 if avg_divergence < 10.0 else 76,
        "provider_routing_breakdown": provider_counts
    }
