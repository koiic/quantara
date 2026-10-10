import React, { useState } from 'react';
import axios from 'axios';
import { 
  Sparkles, X, ShieldAlert, CheckCircle, AlertTriangle, 
  ArrowRight, Play, Plus, Cpu, Info
} from 'lucide-react';

import { API_URL } from '../config';

const PROMPT_CHIPS = [
  { label: 'Intraday VWAP (DuckDB)', prompt: 'Calculate 5-minute Intraday VWAP using DuckDB SQL from parquet data' },
  { label: 'Stat-Arb Cointegration', prompt: 'Statistical Arbitrage pair cointegration and Z-score spread between BTC and ETH' },
  { label: 'Monte Carlo 1k Paths', prompt: '1,000-path Monte Carlo forward simulation with 95% Parametric VaR' },
  { label: 'Dual Momentum & Slip', prompt: 'Dual moving average momentum strategy with 5 bps fee and slippage' }
];

export default function QuantCopilotDrawer({ 
  isOpen, 
  onClose, 
  token, 
  activeNotebook, 
  onInsertCell,
  onExecuteCode 
}) {
  const [tab, setTab] = useState('synthesizer'); // 'synthesizer' | 'auditor'
  const [prompt, setPrompt] = useState('');
  const [asset, setAsset] = useState('BTC-USD');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);

  // Auditor state
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async (overridePrompt) => {
    const q = overridePrompt || prompt;
    if (!q.trim()) return;
    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const res = await axios.post(`${API_URL}/api/ai/generate`, {
        prompt: q,
        asset: asset
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeneratedResult(res.data);
    } catch (err) {
      alert("AI Generation failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAudit = async () => {
    if (!activeNotebook) return;
    setIsAuditing(true);
    setAuditResult(null);

    try {
      const res = await axios.post(`${API_URL}/api/ai/audit`, {
        notebook_title: activeNotebook.title,
        cells: activeNotebook.cells
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditResult(res.data);
    } catch (err) {
      alert("AI Audit failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="copilot-icon-badge">
              <Sparkles size={16} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)' }}>
                Quantara Quant AI Copilot
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Institutional Strategy Synthesis & Pitfall Auditor
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tab Toggle */}
        <div className="drawer-tabs">
          <button 
            className={`drawer-tab-btn ${tab === 'synthesizer' ? 'active' : ''}`}
            onClick={() => setTab('synthesizer')}
          >
            <Cpu size={14} /> Strategy Synthesizer
          </button>
          <button 
            className={`drawer-tab-btn ${tab === 'auditor' ? 'active' : ''}`}
            onClick={() => setTab('auditor')}
          >
            <ShieldAlert size={14} /> Quant Bias Auditor
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {tab === 'synthesizer' ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  TARGET ASSET UNIVERSE
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['BTC-USD', 'ETH-USD', 'SOL-USD', 'SPX'].map(a => (
                    <button
                      key={a}
                      className={`pill-btn ${asset === a ? 'active' : ''}`}
                      onClick={() => setAsset(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  STRATEGY PROMPT OR HYPOTHESIS
                </label>
                <textarea 
                  className="copilot-textarea"
                  rows={3}
                  placeholder="e.g. Design an intraday VWAP mean reversion model that checks 5m bar volume spikes against 20-period moving average..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* Quick Prompt Chips */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  POPULAR INSTITUTIONAL TEMPLATES:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PROMPT_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      className="chip-btn"
                      onClick={() => {
                        setPrompt(chip.prompt);
                        handleGenerate(chip.prompt);
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim()}
              >
                <Sparkles size={15} /> {isGenerating ? 'Synthesizing Strategy...' : 'Synthesize Quantitative Model'}
              </button>

              {/* Generated Result Output */}
              {generatedResult && (
                <div className="generated-result-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> Strategy Ready
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => onInsertCell && onInsertCell(generatedResult.code)}
                        title="Add as new cell in active notebook"
                      >
                        <Plus size={13} /> Insert to Notebook
                      </button>
                      <button 
                        className="btn-primary"
                        onClick={() => onExecuteCode && onExecuteCode(generatedResult.code)}
                        title="Run directly in current kernel session"
                      >
                        <Play size={13} /> Run Live
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                    {generatedResult.explanation}
                  </p>

                  <pre className="copilot-code-preview">
                    <code>{generatedResult.code}</code>
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 0 }}>
                Audits all notebook cells against institutional quantitative pitfalls: <b>Lookahead Bias</b> (future peeking), <b>Friction Leakage</b> (unaccounted fees & slippage), and <b>Non-Vectorized Loops</b>.
              </p>

              <button 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '10px', marginBottom: '20px' }}
                onClick={handleAudit}
                disabled={isAuditing}
              >
                <ShieldAlert size={15} /> {isAuditing ? 'Scanning Notebook Cells...' : 'Audit Active Notebook'}
              </button>

              {auditResult && (
                <div>
                  {/* Score Card */}
                  <div className="audit-score-card" style={{ borderColor: auditResult.color }}>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: auditResult.color }}>
                      {auditResult.score}/100
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: auditResult.color }}>
                        {auditResult.status_label}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {auditResult.findings_count === 0 
                          ? 'Zero critical biases detected. Strategy meets backtesting standards.' 
                          : `${auditResult.findings_count} pitfall(s) flagged for remediation.`}
                      </div>
                    </div>
                  </div>

                  {/* Findings */}
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {auditResult.findings.map((f, i) => (
                      <div key={i} className={`finding-card ${f.severity.toLowerCase()}`}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className={`finding-badge ${f.severity.toLowerCase()}`}>
                            {f.severity}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                            {f.category}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '8px' }}>
                          {f.message}
                        </div>
                        <div className="remedy-box">
                          <span style={{ fontWeight: 600 }}>Remedy:</span> {f.remedy}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
