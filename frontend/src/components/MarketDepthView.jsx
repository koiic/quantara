import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Activity, ArrowUpRight, ArrowDownRight, Layers, RefreshCw, Globe, TrendingUp, DollarSign } from 'lucide-react';

import { API_URL, getMarketWsUrl } from '../config';

const ASSET_CATEGORIES = {
  all: { label: 'All Markets' },
  crypto: { label: 'Crypto' },
  stock: { label: 'Equities / Stocks' },
  fx: { label: 'Forex (FX)' }
};

const SYMBOL_LIST = [
  // Crypto
  { symbol: 'BTC-USD', name: 'Bitcoin', category: 'crypto', venue: 'Binance' },
  { symbol: 'ETH-USD', name: 'Ethereum', category: 'crypto', venue: 'Binance' },
  { symbol: 'SOL-USD', name: 'Solana', category: 'crypto', venue: 'Binance' },
  // US Stocks
  { symbol: 'NVDA', name: 'NVIDIA', category: 'stock', venue: 'NASDAQ' },
  { symbol: 'AAPL', name: 'Apple', category: 'stock', venue: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft', category: 'stock', venue: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla', category: 'stock', venue: 'NASDAQ' },
  { symbol: 'SPY', name: 'S&P 500 ETF', category: 'stock', venue: 'NYSE' },
  // Saudi Tadawul
  { symbol: '2222.SR', name: 'Saudi Aramco', category: 'stock', venue: 'Tadawul' },
  { symbol: '1120.SR', name: 'Al Rajhi Bank', category: 'stock', venue: 'Tadawul' },
  // Forex / FX
  { symbol: 'EUR/USD', name: 'Euro / USD', category: 'fx', venue: 'Interbank' },
  { symbol: 'GBP/USD', name: 'Pound / USD', category: 'fx', venue: 'Interbank' },
  { symbol: 'USD/JPY', name: 'USD / Yen', category: 'fx', venue: 'Interbank' },
  { symbol: 'USD/CHF', name: 'USD / Swiss Franc', category: 'fx', venue: 'Interbank' },
  { symbol: 'AUD/USD', name: 'Aussie / USD', category: 'fx', venue: 'Interbank' },
];

export default function MarketDepthView({ activeSymbol = 'BTC-USD', onSymbolChange }) {
  const [symbol, setSymbol] = useState(activeSymbol);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [depthData, setDepthData] = useState(null);
  const [wsStatus, setWsStatus] = useState('connecting');
  const wsRef = useRef(null);

  useEffect(() => {
    setSymbol(activeSymbol);
  }, [activeSymbol]);

  // WebSocket connection for real-time L2 depth updates
  useEffect(() => {
    let ws;
    let pollInterval;

    const setupWs = () => {
      try {
        ws = new WebSocket(getMarketWsUrl());
        wsRef.current = ws;

        ws.onopen = () => {
          setWsStatus('connected');
          ws.send(JSON.stringify({ action: 'subscribe', symbol }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.data && (msg.type === 'depth_update' || msg.type === 'snapshot')) {
              if (!msg.data.symbol || msg.data.symbol === symbol) {
                setDepthData(msg.data);
              }
            }
          } catch (e) {}
        };

        ws.onerror = () => {
          setWsStatus('polling');
        };

        ws.onclose = () => {
          setWsStatus('polling');
        };
      } catch (err) {
        setWsStatus('polling');
      }
    };

    // Polling fallback
    const pollFallback = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/market/depth`, { params: { symbol } });
        setDepthData(res.data);
      } catch (e) {}
    };

    setupWs();
    pollFallback();
    pollInterval = setInterval(pollFallback, 1200);

    return () => {
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [symbol]);

  const handleSelectSymbol = (sym) => {
    setSymbol(sym);
    if (onSymbolChange) onSymbolChange(sym);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', symbol: sym }));
    }
  };

  const filteredSymbols = SYMBOL_LIST.filter(s => {
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory;
  });

  if (!depthData) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Connecting to Level 2 Order Book Feed ({symbol})...
      </div>
    );
  }

  const decimals = depthData.decimals || (depthData.category === 'fx' && !depthData.symbol.includes('JPY') ? 4 : 2);
  const currencySymbol = depthData.currency === 'SAR' ? 'SAR ' : (depthData.currency === 'JPY' ? '¥' : '$');

  const maxBidTotal = depthData.bids.length > 0 ? depthData.bids[depthData.bids.length - 1].total : 1;
  const maxAskTotal = depthData.asks.length > 0 ? depthData.asks[depthData.asks.length - 1].total : 1;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal, 1);

  // Microstructure Imbalance
  const bidSum = depthData.bids.reduce((acc, b) => acc + b.size, 0);
  const askSum = depthData.asks.reduce((acc, a) => acc + a.size, 0);
  const imbalance = (bidSum - askSum) / (bidSum + askSum || 1);
  const spreadBps = ((depthData.spread / (depthData.mid_price || 1)) * 10000).toFixed(1);

  const formatPrice = (p) => {
    if (typeof p !== 'number') return p;
    return p.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatSize = (sz) => {
    if (depthData.category === 'fx') {
      return sz >= 1000 ? `${(sz / 1000).toFixed(0)}k` : sz.toFixed(0);
    }
    if (depthData.category === 'stock') {
      return `${Math.round(sz)}`;
    }
    return sz.toFixed(3);
  };

  return (
    <div className="market-depth-layout">
      {/* Top Multi-Asset Navigation Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '10px 18px', 
        background: '#FFFFFF', 
        borderBottom: '1px solid #E5E7EB',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
            Asset Class:
          </span>
          {Object.entries(ASSET_CATEGORIES).map(([catKey, catCfg]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: selectedCategory === catKey ? 700 : 500,
                border: selectedCategory === catKey ? '1px solid #FF4B4B' : '1px solid #E5E7EB',
                background: selectedCategory === catKey ? '#FFF5F5' : '#FFFFFF',
                color: selectedCategory === catKey ? '#FF4B4B' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {catCfg.label}
            </button>
          ))}
        </div>

        {/* WebSocket Connection Status */}
        <div className="feed-status-badge">
          <span className={`status-dot ${wsStatus === 'connected' ? 'idle' : 'busy'}`} />
          <span>{wsStatus === 'connected' ? 'L2 Live WebSocket (700ms)' : 'L2 Polling'}</span>
          <span style={{ fontSize: '11px', color: '#6B7280', borderLeft: '1px solid #E5E7EB', paddingLeft: '6px', marginLeft: '2px' }}>
            Venue: <b>{depthData.venue || 'ECN'}</b>
          </span>
        </div>
      </div>

      {/* Asset Tickers Selector Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 18px',
        background: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {filteredSymbols.map(s => {
          const isSelected = symbol === s.symbol;
          let badgeColor = '#2563EB';
          if (s.category === 'crypto') badgeColor = '#F59E0B';
          if (s.category === 'fx') badgeColor = '#10B981';

          return (
            <button
              key={s.symbol}
              onClick={() => handleSelectSymbol(s.symbol)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 11px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: isSelected ? 700 : 500,
                border: isSelected ? '1px solid #111827' : '1px solid #E5E7EB',
                background: isSelected ? '#111827' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: isSelected ? '#FFFFFF' : badgeColor 
              }} />
              <span>{s.symbol}</span>
              <span style={{ 
                fontSize: '10px', 
                opacity: 0.75, 
                color: isSelected ? '#D1D5DB' : '#6B7280' 
              }}>
                {s.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Top Microstructure Metrics */}
      <div className="depth-header-bar" style={{ padding: '12px 18px', background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Asset: </span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginLeft: '4px' }}>
              {depthData.symbol} ({depthData.name})
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mid Price: </span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginLeft: '4px' }}>
              {currencySymbol}{formatPrice(depthData.mid_price)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spread: </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#F59E0B', marginLeft: '4px' }}>
              {currencySymbol}{formatPrice(depthData.spread)} ({spreadBps} bps)
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order Imbalance: </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: imbalance >= 0 ? '#10B981' : '#EF4444', marginLeft: '4px' }}>
              {imbalance >= 0 ? '+' : ''}{(imbalance * 100).toFixed(1)}% {imbalance >= 0 ? '(Buy Pressure)' : '(Sell Pressure)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Bids Ladder, Asks Ladder, Tape */}
      <div className="depth-grid-container">
        {/* Bids Ladder */}
        <div className="depth-ladder-card">
          <div className="depth-card-header green">
            <span>BIDS (BUY ORDERS)</span>
            <span>TOTAL: {formatSize(bidSum)}</span>
          </div>
          <div className="ladder-header">
            <span>PRICE ({depthData.currency})</span>
            <span>SIZE ({depthData.unit || 'units'})</span>
            <span>CUMULATIVE</span>
          </div>
          <div className="ladder-rows">
            {depthData.bids.map((b, i) => {
              const depthPct = Math.min((b.total / maxTotal) * 100, 100);
              return (
                <div key={i} className="ladder-row bid">
                  <div className="depth-bar-fill bid" style={{ width: `${depthPct}%` }} />
                  <span className="price bid">{formatPrice(b.price)}</span>
                  <span className="size">{formatSize(b.size)}</span>
                  <span className="total">{formatSize(b.total)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asks Ladder */}
        <div className="depth-ladder-card">
          <div className="depth-card-header red">
            <span>ASKS (SELL ORDERS)</span>
            <span>TOTAL: {formatSize(askSum)}</span>
          </div>
          <div className="ladder-header">
            <span>PRICE ({depthData.currency})</span>
            <span>SIZE ({depthData.unit || 'units'})</span>
            <span>CUMULATIVE</span>
          </div>
          <div className="ladder-rows">
            {depthData.asks.map((a, i) => {
              const depthPct = Math.min((a.total / maxTotal) * 100, 100);
              return (
                <div key={i} className="ladder-row ask">
                  <div className="depth-bar-fill ask" style={{ width: `${depthPct}%` }} />
                  <span className="price ask">{formatPrice(a.price)}</span>
                  <span className="size">{formatSize(a.size)}</span>
                  <span className="total">{formatSize(a.total)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Tape (Recent Trades) */}
        <div className="depth-ladder-card tape-card">
          <div className="depth-card-header neutral">
            <span>EXECUTION TAPE (FILLS)</span>
            <Activity size={13} color="#2563eb" />
          </div>
          <div className="ladder-header">
            <span>TIME</span>
            <span>PRICE ({depthData.currency})</span>
            <span>QTY</span>
            <span>SIDE</span>
          </div>
          <div className="ladder-rows">
            {depthData.recent_trades.map((t, i) => (
              <div key={i} className="tape-row">
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{t.time}</span>
                <span style={{ fontWeight: 600, color: t.side === 'buy' ? '#10B981' : '#EF4444' }}>
                  {formatPrice(t.price)}
                </span>
                <span>{formatSize(t.size)}</span>
                <span className={`side-badge ${t.side}`}>
                  {t.side.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
