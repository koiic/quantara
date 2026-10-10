import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, AlertTriangle, TrendingDown, 
  Activity, CheckCircle, Sliders, Zap
} from 'lucide-react';

import { API_URL } from '../config';

const SCENARIO_PRESETS = [
  { id: 'covid_2020', name: '2020 COVID Crash', drop: '-38%', badge: 'Liquidity Panic' },
  { id: 'ftx_2022', name: '2022 FTX Contagion', drop: '-55%', badge: 'Counterparty Halt' },
  { id: 'flash_crash_2010', name: '2010 Flash Crash', drop: '-9%', badge: 'HFT Vacuum' },
  { id: 'lehman_2008', name: '2008 Lehman Freeze', drop: '-48%', badge: 'Systemic Crisis' },
  { id: 'svb_2023', name: '2023 Bank Run (SVB)', drop: '-16%', badge: 'Duration Shock' }
];

export default function RiskSentinelView({ token }) {
  const [selectedScenario, setSelectedScenario] = useState('covid_2020');
  const [portfolioValue, setPortfolioValue] = useState(1000000);
  const [leverage, setLeverage] = useState(1.0);
  const [hedgeRatio, setHedgeRatio] = useState(0.2); // 20%
  const [isSimulating, setIsSimulating] = useState(false);
  const [stressResult, setStressResult] = useState(null);
  const [varMetrics, setVarMetrics] = useState(null);

  useEffect(() => {
    runSimulation();
    fetchVar();
  }, [selectedScenario, leverage, hedgeRatio]);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await axios.post(`${API_URL}/api/risk/stress-test`, {
        scenario_id: selectedScenario,
        portfolio_value: parseFloat(portfolioValue),
        leverage: parseFloat(leverage),
        hedge_ratio: parseFloat(hedgeRatio)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStressResult(res.data);
    } catch (e) {
      console.error("Stress test failed:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  const fetchVar = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/risk/var-metrics`, {
        portfolio_value: parseFloat(portfolioValue),
        daily_volatility: 0.022,
        annualized_return: 0.32,
        time_horizon_days: 10
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVarMetrics(res.data);
    } catch (e) {}
  };

  return (
    <div className="risk-sentinel-container">
      {/* Risk View Header */}
      <div className="risk-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="risk-icon-badge">
            <ShieldAlert size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              Live Alpha Decay & Risk Sentinel
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Historical Crisis Stress Testing • Extreme Tail VaR & Expected Shortfall Engine
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[500000, 1000000, 5000000].map(val => (
            <button
              key={val}
              className={`pill-btn ${portfolioValue === val ? 'active' : ''}`}
              onClick={() => setPortfolioValue(val)}
            >
              ${(val / 1000000).toFixed(1)}M Capital
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Controls & Results */}
      <div className="risk-grid">
        {/* Left Column: Scenarios & Controls */}
        <div className="risk-panel controls">
          <div className="panel-title">
            <Sliders size={15} /> STRESS TEST PARAMETERS
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="field-label">SELECT CRISIS SHOCK SCENARIO</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SCENARIO_PRESETS.map(s => (
                <div
                  key={s.id}
                  className={`scenario-select-card ${selectedScenario === s.id ? 'active' : ''}`}
                  onClick={() => setSelectedScenario(s.id)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.name}</div>
                    <span className="scenario-badge">{s.badge}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#ef4444' }}>
                    {s.drop}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="field-label">PORTFOLIO LEVERAGE</label>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>{leverage.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="1.0" 
              max="4.0" 
              step="0.2"
              value={leverage} 
              onChange={(e) => setLeverage(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="field-label">PROTECTIVE HEDGE RATIO</label>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>{(hedgeRatio * 100).toFixed(0)}% Hedged</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="1.0" 
              step="0.05"
              value={hedgeRatio} 
              onChange={(e) => setHedgeRatio(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <button 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            onClick={runSimulation}
            disabled={isSimulating}
          >
            <Zap size={14} /> Re-run Stress Simulation
          </button>
        </div>

        {/* Right Column: Simulation Outcomes */}
        <div className="risk-panel outcomes">
          {stressResult ? (
            <div>
              {/* Liquidation Alert Banner */}
              {stressResult.liquidation_triggered && (
                <div className="liquidation-warning-banner">
                  <AlertTriangle size={20} color="#ef4444" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px' }}>MARGIN CALL // LIQUIDATION TRIGGERED</div>
                    <div style={{ fontSize: '12px' }}>
                      Stressed equity drops below 25% maintenance threshold. Margin Deficit: <b>${stressResult.margin_deficit.toLocaleString()}</b>.
                    </div>
                  </div>
                </div>
              )}

              {/* KPI Shock Cards */}
              <div className="risk-kpi-grid">
                <div className="risk-kpi-card">
                  <div className="kpi-label">Stressed Loss ($)</div>
                  <div className="kpi-value loss">
                    -${stressResult.stressed_loss_dollars.toLocaleString()}
                  </div>
                  <div className="kpi-sub">
                    ({stressResult.stressed_loss_pct.toFixed(1)}% Max Drop)
                  </div>
                </div>

                <div className="risk-kpi-card">
                  <div className="kpi-label">Remaining Stressed Equity</div>
                  <div className="kpi-value">
                    ${stressResult.stressed_equity.toLocaleString()}
                  </div>
                  <div className="kpi-sub" style={{ color: stressResult.liquidation_triggered ? '#ef4444' : '#10b981' }}>
                    {stressResult.liquidation_triggered ? 'Insolvency Risk' : 'Capital Preserved'}
                  </div>
                </div>

                <div className="risk-kpi-card">
                  <div className="kpi-label">10-Day 95% Parametric VaR</div>
                  <div className="kpi-value" style={{ color: '#2563eb' }}>
                    {varMetrics ? `$${varMetrics.var_95_dollars.toLocaleString()}` : 'Calculating...'}
                  </div>
                  <div className="kpi-sub">
                    {varMetrics ? `${varMetrics.var_95_pct.toFixed(1)}% Portfolio at Risk` : ''}
                  </div>
                </div>

                <div className="risk-kpi-card">
                  <div className="kpi-label">95% Expected Shortfall (CVaR)</div>
                  <div className="kpi-value" style={{ color: '#e11d48' }}>
                    {varMetrics ? `$${varMetrics.cvar_95_expected_shortfall.toLocaleString()}` : 'Calculating...'}
                  </div>
                  <div className="kpi-sub">Tail Loss Beyond VaR</div>
                </div>
              </div>

              {/* Stress Trajectory Visualizer (SVG) */}
              <div className="trajectory-chart-card">
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Simulated 30-Day Drawdown & Rebound Path: {stressResult.scenario}
                </div>
                <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#e2e8f0" strokeDasharray="3,3" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#fee2e2" strokeDasharray="2,2" />
                    
                    {/* Trajectory Polyline */}
                    <polyline
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      points={stressResult.trajectory.map((pt, i) => {
                        const x = (i / 29) * 500;
                        const minVal = portfolioValue * (1 - stressResult.stressed_loss_pct / 100);
                        const range = portfolioValue - minVal || 1;
                        const norm = (pt.portfolio_value - minVal) / range;
                        const y = 100 - norm * 80;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Day 1 (Onset)</span>
                  <span>Day 8 (Max Drawdown Trough)</span>
                  <span>Day 30 (Partial Rebound)</span>
                </div>
              </div>

              {/* Prescriptive Directives */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  RISK OFFICER MITIGATION PROTOCOLS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {stressResult.mitigations.map((m, i) => (
                    <div key={i} className="mitigation-item">
                      <span className="mitigation-dot" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Running Monte Carlo Risk Engine...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
