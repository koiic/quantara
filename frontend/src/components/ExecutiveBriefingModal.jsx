import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, X, Send, Printer, CheckCircle, 
  ExternalLink, Sparkles, MessageSquare, ShieldCheck
} from 'lucide-react';

import { API_URL } from '../config';

export default function ExecutiveBriefingModal({ isOpen, onClose, token, activeNotebook }) {
  const [title, setTitle] = useState(activeNotebook ? `${activeNotebook.title} Tear Sheet` : 'Alpha Momentum Tear Sheet');
  const [author, setAuthor] = useState('Quantara Quantitative Team');
  const [annReturn, setAnnReturn] = useState(34.8);
  const [sharpe, setSharpe] = useState(2.42);
  const [maxDd, setMaxDd] = useState(-8.6);
  const [winRate, setWinRate] = useState(63.4);
  const [alpha, setAlpha] = useState(14.2);
  const [memo, setMemo] = useState(
    'The quantitative strategy demonstrates strong risk-adjusted alpha with low benchmark beta. ' +
    'Intraday VWAP execution combined with statistical mean reversion has effectively curtailed drawdown exposure during high-volatility regimes.'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const [isDispatching, setIsDispatching] = useState(false);
  const [slackResult, setSlackResult] = useState(null);

  const [pastReports, setPastReports] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchPastReports();
    }
  }, [isOpen]);

  const fetchPastReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reports/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPastReports(res.data.reports || []);
    } catch (e) {}
  };

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGeneratedReport(null);
    try {
      const res = await axios.post(`${API_URL}/api/reports/generate`, {
        title,
        author,
        annualized_return: parseFloat(annReturn),
        sharpe_ratio: parseFloat(sharpe),
        max_drawdown: parseFloat(maxDd),
        win_rate: parseFloat(winRate),
        alpha: parseFloat(alpha),
        executive_summary: memo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeneratedReport(res.data);
      fetchPastReports();
    } catch (err) {
      alert("Failed to generate briefing: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDispatchSlack = async () => {
    setIsDispatching(true);
    setSlackResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/reports/dispatch-slack`, {
        report_title: title,
        channel: '#quant-briefings-cto',
        sharpe_ratio: parseFloat(sharpe),
        annualized_return: parseFloat(annReturn),
        max_drawdown: parseFloat(maxDd),
        executive_summary: memo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlackResult(res.data);
    } catch (err) {
      alert("Failed to send Slack digest: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '16px' }}>
            <FileText size={18} color="#FF4B4B" />
            <span>Executive Briefing & Tear Sheet Generator</span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 0 }}>
            Generate institutional tear sheets formatted for stakeholders and the CTO. Includes PDF export styling, risk-adjusted attribution metrics, and instant Slack digest webhook broadcast.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="field-label">BRIEFING TITLE</label>
              <input 
                className="input-field" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>
            <div>
              <label className="field-label">REPORT AUTHOR / QUANT</label>
              <input 
                className="input-field" 
                value={author} 
                onChange={(e) => setAuthor(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label className="field-label">ANN. RETURN (%)</label>
              <input 
                type="number" 
                step="0.1" 
                className="input-field" 
                value={annReturn} 
                onChange={(e) => setAnnReturn(e.target.value)} 
              />
            </div>
            <div>
              <label className="field-label">SHARPE RATIO</label>
              <input 
                type="number" 
                step="0.05" 
                className="input-field" 
                value={sharpe} 
                onChange={(e) => setSharpe(e.target.value)} 
              />
            </div>
            <div>
              <label className="field-label">MAX DD (%)</label>
              <input 
                type="number" 
                step="0.1" 
                className="input-field" 
                value={maxDd} 
                onChange={(e) => setMaxDd(e.target.value)} 
              />
            </div>
            <div>
              <label className="field-label">WIN RATE (%)</label>
              <input 
                type="number" 
                step="0.1" 
                className="input-field" 
                value={winRate} 
                onChange={(e) => setWinRate(e.target.value)} 
              />
            </div>
            <div>
              <label className="field-label">ALPHA (%)</label>
              <input 
                type="number" 
                step="0.1" 
                className="input-field" 
                value={alpha} 
                onChange={(e) => setAlpha(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="field-label">EXECUTIVE MEMORANDUM</label>
            <textarea 
              className="copilot-textarea" 
              rows={3} 
              value={memo} 
              onChange={(e) => setMemo(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button 
              className="btn-primary" 
              style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              onClick={handleGenerateReport}
              disabled={isGenerating}
            >
              <Printer size={15} /> {isGenerating ? 'Compiling Tear Sheet...' : 'Generate Institutional Tear Sheet (PDF Ready)'}
            </button>

            <button 
              className="btn-secondary" 
              style={{ justifyContent: 'center', padding: '10px' }}
              onClick={handleDispatchSlack}
              disabled={isDispatching}
            >
              <MessageSquare size={15} color="#10b981" /> {isDispatching ? 'Dispatching...' : 'Send Slack Digest to CTO'}
            </button>
          </div>

          {/* Result Alert: Generated Tear Sheet */}
          {generatedReport && (
            <div className="report-success-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#10b981" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#065f46' }}>
                    Tear Sheet Compiled Successfully ({generatedReport.report_id})
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857' }}>
                    Open in new browser tab to view or click Print / Save as PDF.
                  </div>
                </div>
              </div>
              <a 
                href={`${API_URL}${generatedReport.html_url}`} 
                target="_blank" 
                rel="noreferrer"
                className="btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={14} /> Open Tear Sheet
              </a>
            </div>
          )}

          {/* Result Alert: Slack Dispatch */}
          {slackResult && (
            <div className="report-success-banner" style={{ background: '#eff6ff', borderColor: '#bfdbfe', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#2563eb" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e40af' }}>
                    {slackResult.message}
                  </div>
                  <div style={{ fontSize: '12px', color: '#3b82f6' }}>
                    Target: {slackResult.destination} • Status: Delivered with Block Kit payload
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Past Generated Tear Sheets */}
          {pastReports.length > 0 && (
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                Historical Executive Briefings
              </div>
              <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                {pastReports.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F9FAFB', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{r.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                        by {r.author} • {r.created_at}
                      </span>
                    </div>
                    <a 
                      href={`${API_URL}/api/reports/${r.id}/view`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn-secondary"
                      style={{ textDecoration: 'none', fontSize: '11px' }}
                    >
                      <ExternalLink size={12} /> View Tear Sheet
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
