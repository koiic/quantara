import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Layers, Radio, TrendingUp, Wallet, RefreshCw, AlertTriangle,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck,
  Server, Cpu, Zap, RotateCcw, ChevronRight, BarChart2, Info, Check
} from 'lucide-react';
import { API_URL } from '../config';

const SAR_USD_PEG = 3.75;

export default function StagingShadowView({ token }) {
  // Staging Mode: 'PAPER' | 'SHADOW'
  const [mode, setMode] = useState('PAPER');
  const [activeTab, setActiveTab] = useState('positions'); // 'positions' | 'blotter' | 'diagnostics' | 'sdk'
  
  // Data States
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [providers, setProviders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [tickers, setTickers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Order Entry Form
  const [selectedSymbol, setSelectedSymbol] = useState('2222.SR');
  const [side, setSide] = useState('BUY');
  const [orderType, setOrderType] = useState('MARKET');
  const [quantity, setQuantity] = useState(100);
  const [limitPrice, setLimitPrice] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('tadawul_fix_sandbox');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all core data
  const fetchData = async () => {
    if (!token) return;
    try {
      const [portRes, posRes, ordRes, provRes, analRes, tickRes] = await Promise.all([
        axios.get(`${API_URL}/api/trading/portfolio?mode=${mode}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/trading/positions?mode=${mode}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/trading/history?mode=${mode}&limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/trading/providers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/trading/shadow-analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/market/ticker`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setPortfolio(portRes.data);
      setPositions(posRes.data.positions || []);
      setOrders(ordRes.data.orders || []);
      setProviders(provRes.data.providers || []);
      setAnalytics(analRes.data);
      setTickers(tickRes.data.tickers || []);
    } catch (err) {
      console.error("Failed to load staging data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [token, mode]);

  // Set default provider based on selected symbol
  useEffect(() => {
    const asset = tickers.find(t => t.symbol === selectedSymbol);
    if (asset) {
      if (asset.venue && asset.venue !== 'internal') {
        setSelectedProvider(asset.venue);
      }
      if (orderType === 'LIMIT' && !limitPrice) {
        setLimitPrice(asset.price);
      }
    }
  }, [selectedSymbol]);

  // Handle Order Submission
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) {
      alert("Please enter a valid order quantity.");
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const res = await axios.post(`${API_URL}/api/trading/orders`, {
        symbol: selectedSymbol,
        side,
        order_type: orderType,
        quantity: parseFloat(quantity),
        limit_price: orderType === 'LIMIT' ? parseFloat(limitPrice) : null,
        execution_mode: mode,
        provider_id: selectedProvider,
        notes: orderNotes.trim() || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const orderData = res.data;
      setActionMessage({
        type: 'success',
        text: `[${orderData.execution_mode}] ${orderData.side} ${orderData.quantity} ${orderData.symbol} executed @ ${orderData.fill_price} ${orderData.currency} (${orderData.slippage_bps} bps slippage, ${orderData.latency_ms}ms latency)`
      });

      setOrderNotes('');
      fetchData();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.detail || err.message || "Failed to execute order"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle 1-Click Close Position
  const handleClosePosition = async (sym) => {
    if (!confirm(`Confirm market liquidation of ${sym} position?`)) return;
    try {
      await axios.post(`${API_URL}/api/trading/positions/${sym}/close?mode=${mode}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActionMessage({ type: 'success', text: `Position ${sym} closed successfully.` });
      fetchData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.detail || "Failed to close position." });
    }
  };

  // Handle Portfolio Reset
  const handleResetPortfolio = async () => {
    if (!confirm(`Reset ${mode} portfolio back to initial $100,000 cash balance? This will clear all active positions and blotter records.`)) return;
    try {
      await axios.post(`${API_URL}/api/trading/reset?mode=${mode}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActionMessage({ type: 'success', text: `${mode} portfolio restored to $100,000 capital.` });
      fetchData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.detail || "Failed to reset portfolio." });
    }
  };

  // Toggle Provider Status (simulate disconnect/failover)
  const handleToggleProvider = async (pId, currentStatus) => {
    const nextStatus = currentStatus === 'ONLINE' ? 'DISCONNECTED' : 'ONLINE';
    try {
      await axios.post(`${API_URL}/api/trading/providers/toggle`, {
        provider_id: pId,
        status: nextStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error("Failed to toggle provider:", err);
    }
  };

  const currentAsset = tickers.find(t => t.symbol === selectedSymbol) || { price: 100.0, currency: 'USD', change_24h: 0 };
  const currentProviderObj = providers.find(p => p.id === selectedProvider) || {};
  const isCurrentProviderOffline = currentProviderObj.status !== 'ONLINE';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-main)', color: 'var(--text-main)', overflow: 'hidden' }}>
      
      {/* TOP HEADER & STAGING MODE SELECTOR */}
      <div className="staging-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: mode === 'PAPER' ? '#FF4B4B' : '#111827', padding: '6px', borderRadius: '6px', color: 'white' }}>
              <Layers size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Quantara Staging & Execution Engine
                <span style={{ 
                  fontSize: '11px', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  background: mode === 'PAPER' ? 'rgba(255, 75, 75, 0.1)' : 'rgba(17, 24, 39, 0.08)',
                  color: mode === 'PAPER' ? '#FF4B4B' : '#111827',
                  fontWeight: 600,
                  border: `1px solid ${mode === 'PAPER' ? '#FECDD3' : '#E5E7EB'}`
                }}>
                  {mode === 'PAPER' ? 'SANDBOX SIMULATOR' : 'CANARY SHADOW MIRROR'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Multi-venue order routing for Saudi Equities (TASI), US Stocks & Crypto
              </div>
            </div>
          </div>
        </div>

        {/* MODE SWITCHER PILL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setMode('PAPER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: mode === 'PAPER' ? '#FF4B4B' : 'transparent',
                color: mode === 'PAPER' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Cpu size={14} /> Paper Trading (Sandbox)
            </button>
            <button
              onClick={() => setMode('SHADOW')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: mode === 'SHADOW' ? '#111827' : 'transparent',
                color: mode === 'SHADOW' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Radio size={14} /> Shadow Trading (Dark Canary)
            </button>
          </div>

          <button
            onClick={handleResetPortfolio}
            title="Reset Portfolio Balance"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} /> Reset Capital
          </button>
        </div>
      </div>

      {/* PORTFOLIO STATS RIBBON */}
      {portfolio && (
        <div className="portfolio-stats-ribbon">
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Equity</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              ${portfolio.total_equity_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ≈ {portfolio.total_equity_sar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Cash Available</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              ${portfolio.cash_balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ≈ {portfolio.cash_balance_sar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Unrealized PnL</div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: portfolio.unrealized_pnl_usd >= 0 ? '#10b981' : '#f43f5e',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {portfolio.unrealized_pnl_usd >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
              ${portfolio.unrealized_pnl_usd >= 0 ? '+' : ''}{portfolio.unrealized_pnl_usd.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mark-to-market</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Realized PnL</div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: portfolio.realized_pnl_usd >= 0 ? '#10b981' : '#f43f5e',
              marginTop: '2px'
            }}>
              ${portfolio.realized_pnl_usd >= 0 ? '+' : ''}{portfolio.realized_pnl_usd.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Closed trades</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Return / Win Rate</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>
              {portfolio.total_return_pct >= 0 ? '+' : ''}{portfolio.total_return_pct.toFixed(2)}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Win Rate: {portfolio.win_rate}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Active Exposures</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              {portfolio.positions_count} Positions
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {mode === 'SHADOW' ? 'Zero Live Risk' : 'Simulated Ledger'}
            </div>
          </div>
        </div>
      )}

      {/* PROVIDER STATUS TICKER BAR */}
      {/* PROVIDER STATUS TICKER BAR */}
      <div style={{ 
        background: '#F9FAFB', 
        borderBottom: '1px solid var(--border-color)', 
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        overflowX: 'auto',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
          <Server size={14} /> Execution Gateways:
        </div>
        {providers.map(p => (
          <div 
            key={p.id}
            onClick={() => handleToggleProvider(p.id, p.status)}
            title="Click to toggle Online/Disconnected for staging failover test"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '4px 10px', 
              borderRadius: '6px', 
              background: '#FFFFFF',
              border: `1px solid ${p.status === 'ONLINE' ? 'var(--border-color)' : '#FECDD3'}`,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <div style={{ 
              width: '7px', 
              height: '7px', 
              borderRadius: '50%', 
              background: p.status === 'ONLINE' ? '#10b981' : '#ef4444' 
            }} />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name.split(' ')[0]}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({p.latency_ms}ms)</span>
            <span style={{ 
              fontSize: '10px', 
              padding: '1px 5px', 
              borderRadius: '4px',
              background: p.status === 'ONLINE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: p.status === 'ONLINE' ? '#059669' : '#dc2626',
              fontWeight: 600
            }}>
              {p.status}
            </span>
          </div>
        ))}
      </div>

      {/* ACTION MESSAGE TOAST */}
      {actionMessage && (
        <div style={{ 
          padding: '10px 24px', 
          background: actionMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: actionMessage.type === 'success' ? '#065F46' : '#991B1B',
          borderBottom: `1px solid ${actionMessage.type === 'success' ? '#A7F3D0' : '#FECDD3'}`,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* MAIN CONTENT SPLIT: LEFT ORDER TICKET + RIGHT BLOTTER & FORENSICS */}
      <div className="staging-main-split">

        {/* LEFT COLUMN: ORDER ENTRY TICKET */}
        <div className="staging-order-ticket-col">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} color="#FF4B4B" /> Order Ticket
            </span>
            <span style={{ 
              fontSize: '11px', 
              padding: '2px 8px', 
              borderRadius: '4px',
              background: mode === 'PAPER' ? '#FF4B4B' : '#111827',
              color: 'white',
              fontWeight: 600
            }}>
              {mode} MODE
            </span>
          </div>

          <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Symbol Selector */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                Target Symbol
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <optgroup label="Saudi Equities (Tadawul / SAR)">
                  <option value="2222.SR">2222.SR - Saudi Aramco</option>
                  <option value="1120.SR">1120.SR - Al Rajhi Bank</option>
                  <option value="2010.SR">2010.SR - SABIC</option>
                </optgroup>
                <optgroup label="US Equities (USD)">
                  <option value="NVDA">NVDA - NVIDIA Corp</option>
                  <option value="AAPL">AAPL - Apple Inc</option>
                  <option value="MSFT">MSFT - Microsoft Corp</option>
                </optgroup>
                <optgroup label="Crypto Assets (USD)">
                  <option value="BTC-USD">BTC-USD - Bitcoin</option>
                  <option value="ETH-USD">ETH-USD - Ethereum</option>
                  <option value="SOL-USD">SOL-USD - Solana</option>
                </optgroup>
              </select>
              <div style={{ marginTop: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Mark Price: <b>{currentAsset.price} {currentAsset.currency}</b></span>
                <span style={{ color: currentAsset.change_24h >= 0 ? '#10b981' : '#ef4444' }}>
                  {currentAsset.change_24h >= 0 ? '+' : ''}{currentAsset.change_24h}%
                </span>
              </div>
            </div>

            {/* Buy / Sell Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSide('BUY')}
                style={{
                  padding: '10px 0',
                  borderRadius: '6px',
                  border: side === 'BUY' ? '1px solid #10b981' : '1px solid var(--border-color)',
                  background: side === 'BUY' ? '#10b981' : '#F3F4F6',
                  color: side === 'BUY' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                BUY / LONG
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                style={{
                  padding: '10px 0',
                  borderRadius: '6px',
                  border: side === 'SELL' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  background: side === 'SELL' ? '#ef4444' : '#F3F4F6',
                  color: side === 'SELL' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                SELL / SHORT
              </button>
            </div>

            {/* Order Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>ORDER TYPE</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                >
                  <option value="MARKET">Market</option>
                  <option value="LIMIT">Limit</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>QUANTITY</label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            {/* Limit Price (if LIMIT order) */}
            {orderType === 'LIMIT' && (
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                  LIMIT PRICE ({currentAsset.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder={`e.g. ${currentAsset.price}`}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                />
              </div>
            )}

            {/* Execution Gateway Selector */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ROUTING GATEWAY</label>
                {isCurrentProviderOffline && (
                  <span style={{ fontSize: '11px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <AlertTriangle size={12} /> Auto-Fallback
                  </span>
                )}
              </div>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  border: `1px solid ${isCurrentProviderOffline ? '#ef4444' : 'var(--border-color)'}`,
                  color: 'var(--text-main)',
                  fontSize: '13px'
                }}
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status !== 'ONLINE' ? `(${p.status})` : ''}
                  </option>
                ))}
              </select>

              {isCurrentProviderOffline && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#b91c1c', background: '#FEF2F2', padding: '6px 8px', borderRadius: '4px', border: '1px solid #FECDD3' }}>
                  Gateway is disconnected. Quantara will automatically route to internal sandbox with dark canary logging.
                </div>
              )}
            </div>

            {/* Strategy Audit Note */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>STRATEGY NOTE (AUDIT TRAIL)</label>
              <input
                type="text"
                placeholder="e.g. DRL Momentum Signal #42"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '12px'
                }}
              />
            </div>

            {/* Friction Estimate Panel */}
            <div style={{ background: '#F9FAFB', borderRadius: '6px', padding: '10px 12px', border: '1px solid var(--border-color)', fontSize: '11px' }}>
              <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>ESTIMATED VENUE IMPACT</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                <span>Order Notional:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{(quantity * currentAsset.price).toFixed(2)} {currentAsset.currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                <span>Est. Slippage:</span>
                <span style={{ color: '#2563eb', fontWeight: 600 }}>~{currentAsset.category === 'crypto' ? '3.5' : '15.2'} bps</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Tadawul Fee + VAT / Comm:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedSymbol.includes('.SR') ? '15.5 bps + 15% VAT' : '1.0 bps'}</span>
              </div>
            </div>

            {/* Submit Order Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px 0',
                borderRadius: '8px',
                border: 'none',
                background: side === 'BUY' ? '#10b981' : '#ef4444',
                color: 'white',
                fontWeight: 700,
                fontSize: '14px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.15s ease'
              }}
            >
              {isSubmitting ? 'Executing...' : `${side} ${quantity} ${selectedSymbol} (${mode})`}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: MULTI-TAB BLOTTER, POSITIONS & FORENSICS */}
        <div className="staging-blotter-col">
          
          {/* TABS NAVIGATION */}
          <div style={{ 
            background: '#FFFFFF', 
            borderBottom: '1px solid var(--border-color)', 
            padding: '0 16px', 
            display: 'flex', 
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none'
          }}>
            {[
              { id: 'positions', label: `Active Positions (${positions.length})`, icon: TrendingUp },
              { id: 'blotter', label: `Order Blotter & Audit (${orders.length})`, icon: Clock },
              { id: 'diagnostics', label: 'Shadow vs Live Diagnostics', icon: BarChart2 },
              { id: 'sdk', label: 'Python SDK Integration', icon: Cpu }
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '14px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: activeTab === t.id ? '#FF4B4B' : 'var(--text-muted)',
                    borderBottom: activeTab === t.id ? '2px solid #FF4B4B' : '2px solid transparent',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENTS */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

            {/* TAB 1: ACTIVE POSITIONS */}
            {activeTab === 'positions' && (
              <div>
                {mode === 'SHADOW' && (
                  <div style={{ 
                    background: 'rgba(124, 58, 237, 0.1)', 
                    border: '1px solid rgba(124, 58, 237, 0.3)', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: '#c084fc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <Info size={18} />
                    <span><b>Shadow Mode Active:</b> Orders in shadow mode run dark canary simulations with zero portfolio exposure. To build real virtual positions with mark-to-market balances, switch to <b>Paper Trading</b> above.</span>
                  </div>
                )}

                {positions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <TrendingUp size={42} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>No Open Positions</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>
                      Place an order on the left ticket to open a position in Saudi Tadawul, US Stocks, or Crypto.
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '10px' }}>Symbol / Asset</th>
                          <th style={{ padding: '10px' }}>Quantity</th>
                          <th style={{ padding: '10px' }}>Entry Price</th>
                          <th style={{ padding: '10px' }}>Current Price</th>
                          <th style={{ padding: '10px' }}>Market Value</th>
                          <th style={{ padding: '10px' }}>Unrealized PnL</th>
                          <th style={{ padding: '10px' }}>Return</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--text-main)' }}>
                              <div>{p.symbol}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{p.name}</div>
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{p.quantity}</td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{p.avg_entry_price} {p.currency}</td>
                            <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--text-main)' }}>{p.current_price} {p.currency}</td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-main)' }}>
                              {p.market_value_native.toLocaleString()} {p.currency}
                              {p.currency === 'SAR' && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}> (${(p.market_value_native / SAR_USD_PEG).toFixed(2)})</span>}
                            </td>
                            <td style={{ 
                              padding: '12px 10px', 
                              fontWeight: 700, 
                              color: p.unrealized_pnl_native >= 0 ? '#10b981' : '#f43f5e' 
                            }}>
                              {p.unrealized_pnl_native >= 0 ? '+' : ''}{p.unrealized_pnl_native.toFixed(2)} {p.currency}
                            </td>
                            <td style={{ 
                              padding: '12px 10px', 
                              fontWeight: 700, 
                              color: p.pnl_percentage >= 0 ? '#10b981' : '#f43f5e' 
                            }}>
                              {p.pnl_percentage >= 0 ? '+' : ''}{p.pnl_percentage.toFixed(2)}%
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleClosePosition(p.symbol)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '5px',
                                  border: '1px solid #FECDD3',
                                  background: '#FEF2F2',
                                  color: '#dc2626',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Market Close
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ORDER BLOTTER */}
            {activeTab === 'blotter' && (
              <div style={{ overflowX: 'auto' }}>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <Clock size={40} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <div>No order records in blotter yet.</div>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px' }}>Timestamp</th>
                        <th style={{ padding: '8px' }}>Symbol</th>
                        <th style={{ padding: '8px' }}>Side</th>
                        <th style={{ padding: '8px' }}>Qty</th>
                        <th style={{ padding: '8px' }}>Req. Price</th>
                        <th style={{ padding: '8px' }}>Fill Price</th>
                        <th style={{ padding: '8px' }}>Slippage</th>
                        <th style={{ padding: '8px' }}>Gateway</th>
                        <th style={{ padding: '8px' }}>Latency</th>
                        <th style={{ padding: '8px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{o.created_at}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--text-main)' }}>{o.symbol}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 700, color: o.side === 'BUY' ? '#10b981' : '#ef4444' }}>
                            {o.side}
                          </td>
                          <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{o.quantity}</td>
                          <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{o.requested_price}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--text-main)' }}>{o.fill_price}</td>
                          <td style={{ padding: '10px 8px', color: '#2563eb' }}>{o.slippage_bps} bps</td>
                          <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{o.provider_id}</td>
                          <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{o.latency_ms}ms</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              background: o.status === 'FILLED' ? '#ECFDF5' : '#F5F3FF',
                              color: o.status === 'FILLED' ? '#059669' : '#7c3aed',
                              border: o.status === 'FILLED' ? '1px solid #A7F3D0' : '1px solid #DDD6FE',
                              fontWeight: 600
                            }}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 3: SHADOW DIAGNOSTICS & DARK-LAUNCH METRICS */}
            {activeTab === 'diagnostics' && analytics && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ 
                  background: '#FFFFFF', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  padding: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Production Readiness</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                      {analytics.production_readiness_score}/100
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Within 2σ slippage limit</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Execution Drag</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                      {analytics.avg_execution_drag_bps} bps
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Theoretical market impact</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Venue Latency</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
                      {analytics.avg_network_latency_ms} ms
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Direct Gateway FIX/WebSocket</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Simulated Fill Rate</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                      {analytics.simulated_fill_rate_pct}%
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Top-of-book depth liquidity</div>
                  </div>
                </div>

                {/* INSTITUTIONAL EXPLANATION */}
                <div style={{ background: '#F9FAFB', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="#10b981" /> Institutional Dark-Launch Protocols
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    In tier-1 algorithmic trading firms, quantitative strategies are never directly wired to live financial exchanges. 
                    Instead, they run in <b>Shadow Mode</b> for a minimum of 14 trading days. 
                    During this period, Quantara intercepts every live algorithmic signal, matches it against real-time Level 2 order book depth, calculates non-linear market impact (Almgren-Chriss), and logs theoretical execution drag without exposing fund capital.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: PYTHON SDK GUIDE */}
            {activeTab === 'sdk' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--text-main)' }}>
                    Automate Staging Execution from Quant Notebooks
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    You can execute both Paper and Shadow orders programmatically inside your research notebook cells using the built-in <code>quantara</code> Python SDK:
                  </div>

                  <pre style={{ 
                    background: '#1E1E24', 
                    padding: '16px', 
                    borderRadius: '6px', 
                    color: '#e2e8f0', 
                    fontSize: '12px', 
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    border: '1px solid #2D3139'
                  }}>
{`import quantara as qtr

# 1. Place a paper market order in Saudi Aramco (SAR)
qtr.order(symbol="2222.SR", side="BUY", qty=200, mode="paper", provider="tadawul_fix_sandbox")

# 2. Place a paper limit order in NVIDIA (USD)
qtr.order(symbol="NVDA", side="BUY", qty=50, order_type="LIMIT", limit_price=138.00, mode="paper")

# 3. Canary Shadow Launch: dark-track an algorithmic DRL signal without capital risk
qtr.order(symbol="BTC-USD", side="BUY", qty=1.5, mode="shadow", notes="DRL Policy Rollout #91")

# 4. Check real-time portfolio balance and active positions
portfolio = qtr.get_portfolio()
positions = qtr.get_positions()
print(f"Equity: \${portfolio['total_equity_usd']:,} USD")`}
                  </pre>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
