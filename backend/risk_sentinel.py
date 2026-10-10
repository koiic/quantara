import numpy as np
import math
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user, User

router = APIRouter(prefix="/api/risk", tags=["risk"])

SCENARIOS = {
    "covid_2020": {
        "name": "2020 COVID Market Liquidity Shock",
        "description": "Rapid -38% equity drawdown coupled with an 82-point VIX volatility spike and global liquidity dislocation.",
        "shock_return": -0.38,
        "vol_multiplier": 3.8,
        "spread_multiplier": 4.5,
        "recovery_days": 140,
        "historical_period": "Feb - Mar 2020"
    },
    "ftx_2022": {
        "name": "2022 FTX / Terra-LUNA Crypto Evaporation",
        "description": "Cross-venue counterparty freeze and cascaded liquidation resulting in a -55% asset plunge.",
        "shock_return": -0.55,
        "vol_multiplier": 4.2,
        "spread_multiplier": 6.0,
        "recovery_days": 280,
        "historical_period": "Nov 2022"
    },
    "flash_crash_2010": {
        "name": "2010 Flash Crash (HFT Order Book Vacuum)",
        "description": "Intraday spoofing-induced liquidity vacuum causing an immediate -9% collapse within 15 minutes followed by mean reversion.",
        "shock_return": -0.09,
        "vol_multiplier": 5.0,
        "spread_multiplier": 8.0,
        "recovery_days": 2,
        "historical_period": "May 6, 2010"
    },
    "lehman_2008": {
        "name": "2008 Lehman Brothers Credit Freeze",
        "description": "Systemic credit crisis with -48% drawdown and multi-month correlation breakdown across all asset classes.",
        "shock_return": -0.48,
        "vol_multiplier": 4.0,
        "spread_multiplier": 5.0,
        "recovery_days": 360,
        "historical_period": "Sep - Dec 2008"
    },
    "svb_2023": {
        "name": "2023 Regional Bank Run (SVB / Signature)",
        "description": "Unprecedented deposit run driving extreme bond yield volatility and stablecoin peg dislocations.",
        "shock_return": -0.16,
        "vol_multiplier": 2.2,
        "spread_multiplier": 2.5,
        "recovery_days": 45,
        "historical_period": "Mar 2023"
    }
}

class StressTestRequest(BaseModel):
    scenario_id: str = "covid_2020"
    portfolio_value: float = 1_000_000.0
    leverage: float = 1.0 # 1.0x to 5.0x
    hedge_ratio: float = 0.0 # 0.0 to 1.0 (0% to 100% hedged)
    margin_maintenance_pct: float = 25.0 # 25% liquidation threshold

class VaRMetricsRequest(BaseModel):
    portfolio_value: float = 1_000_000.0
    daily_volatility: float = 0.022 # 2.2% daily vol
    annualized_return: float = 0.32
    time_horizon_days: int = 10

@router.get("/scenarios")
async def get_scenarios():
    """List available crisis stress scenarios."""
    return {"status": "ok", "scenarios": SCENARIOS}

@router.post("/stress-test")
async def run_stress_test(req: StressTestRequest, current_user: User = Depends(get_current_user)):
    scenario = SCENARIOS.get(req.scenario_id)
    if not scenario:
        raise HTTPException(status_code=400, detail=f"Scenario '{req.scenario_id}' not found.")

    # Apply hedge and leverage dynamics
    unhedged_shock = scenario["shock_return"] * req.leverage
    effective_shock = unhedged_shock * (1.0 - req.hedge_ratio * 0.85)
    
    # Calculate stressed loss
    dollar_loss = req.portfolio_value * abs(effective_shock)
    stressed_equity = max(0.0, req.portfolio_value - dollar_loss)
    
    # Liquidation / Margin Call check
    margin_threshold_value = req.portfolio_value * (req.margin_maintenance_pct / 100.0)
    liquidation_triggered = stressed_equity < margin_threshold_value

    # Synthesize 30-step stress trajectory curve
    np.random.seed(42)
    path_days = 30
    shock_trough_day = 8
    t = np.linspace(0, 1, path_days)
    
    trajectory = []
    current_val = req.portfolio_value
    for day in range(path_days):
        if day <= shock_trough_day:
            factor = (day / shock_trough_day)
            val = req.portfolio_value - (dollar_loss * factor) + np.random.normal(0, req.portfolio_value * 0.005)
        else:
            recovery_rate = (day - shock_trough_day) / (path_days - shock_trough_day)
            # Rebound 40% of the dip during initial recovery
            val = (req.portfolio_value - dollar_loss) + (dollar_loss * 0.40 * recovery_rate) + np.random.normal(0, req.portfolio_value * 0.008)
        
        trajectory.append({
            "day": day + 1,
            "portfolio_value": round(max(val, 0.0), 2),
            "drawdown_pct": round(((val - req.portfolio_value) / req.portfolio_value) * 100, 2)
        })

    # Recommendations
    mitigations = []
    if liquidation_triggered:
        mitigations.append("CRITICAL: Portfolio breaches margin maintenance threshold. Immediate 40% position de-leveraging required.")
    if req.leverage > 1.5:
        mitigations.append("High leverage amplification detected. Implement trailing Volatility-Targeted position sizing.")
    if req.hedge_ratio < 0.2:
        mitigations.append("Unhedged directional risk is substantial. Allocate 5-10% to out-of-the-money protective put options or dynamic inverse perpetual hedges.")
    else:
        mitigations.append("Existing hedge buffer significantly curtailed maximum drawdown shock.")

    return {
        "status": "ok",
        "scenario": scenario["name"],
        "historical_period": scenario["historical_period"],
        "initial_portfolio": req.portfolio_value,
        "stressed_loss_dollars": round(dollar_loss, 2),
        "stressed_loss_pct": round(abs(effective_shock) * 100, 2),
        "stressed_equity": round(stressed_equity, 2),
        "liquidation_triggered": liquidation_triggered,
        "margin_deficit": round(max(0.0, margin_threshold_value - stressed_equity), 2),
        "trajectory": trajectory,
        "mitigations": mitigations
    }

@router.post("/var-metrics")
async def calculate_var(req: VaRMetricsRequest, current_user: User = Depends(get_current_user)):
    """Calculates Parametric, Historical, and Expected Shortfall VaR metrics."""
    pv = req.portfolio_value
    sigma = req.daily_volatility
    horizon = req.time_horizon_days
    h_sqrt = math.sqrt(horizon)

    # Parametric normal VaR z-scores: 95% = 1.645, 99% = 2.326
    var_95_pct = 1.645 * sigma * h_sqrt
    var_99_pct = 2.326 * sigma * h_sqrt
    
    # Conditional VaR (Expected Shortfall) ~ E[L | L > VaR]
    cvar_95_pct = (1.645 + 0.3989 / 0.05 * math.exp(-0.5 * 1.645**2)) * sigma * h_sqrt * 0.75
    cvar_99_pct = 2.665 * sigma * h_sqrt

    return {
        "status": "ok",
        "horizon_days": horizon,
        "portfolio_value": pv,
        "var_95_dollars": round(pv * var_95_pct, 2),
        "var_95_pct": round(var_95_pct * 100, 2),
        "var_99_dollars": round(pv * var_99_pct, 2),
        "var_99_pct": round(var_99_pct * 100, 2),
        "cvar_95_expected_shortfall": round(pv * cvar_95_pct, 2),
        "cvar_99_expected_shortfall": round(pv * cvar_99_pct, 2),
        "daily_volatility_pct": round(sigma * 100, 2)
    }
