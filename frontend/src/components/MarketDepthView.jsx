import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Activity, ArrowUpRight, ArrowDownRight, Layers, RefreshCw } from 'lucide-react';

import { API_URL, getMarketWsUrl } from '../config';

export default function MarketDepthView({ activeSymbol = 'BTC-USD', onSymbolChange }) {
  const [symbol, setSymbol] = useState(activeSymbol);
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

  if (!depthData) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Connecting to Level 2 Order Book Feed...
      </div>
    );
  }

  const maxBidTotal = depthData.bids.length > 0 ? depthData.bids[depthData.bids.length - 1].total : 1;
  const maxAskTotal = depthData.asks.length > 0 ? depthData.asks[depthData.asks.length - 1].total : 1;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal, 1);

  // Microstructure Imbalance
  const bidSum = depthData.bids.reduce((acc, b) => acc + b.size, 0);
  const askSum = depthData.asks.reduce((acc, a) => acc + a.size, 0);
  const imbalance = (bidSum - askSum) / (bidSum + askSum || 1);
  const spreadBps = ((depthData.spread / depthData.mid_price) * 10000).toFixed(1);

  return (
    <div className="market-depth-layout">
      {/* Top Microstructure Metrics */}
      <div className="depth-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['BTC-USD', 'ETH-USD', 'SOL-USD'].map(s => (
              <button
                key={s}
                className={`pill-btn ${symbol === s ? 'active' : ''}`}
                onClick={() => handleSelectSymbol(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="feed-status-badge">
            <span className={`status-dot ${wsStatus === 'connected' ? 'idle' : 'busy'}`} />
            <span>{wsStatus === 'connected' ? 'L2 Live WebSocket (500ms)' : 'L2 Polling'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mid Price: </span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginLeft: '4px' }}>
              ${depthData.mid_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spread: </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#f59e0b', marginLeft: '4px' }}>
              ${depthData.spread.toFixed(2)} ({spreadBps} bps)
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order Imbalance: </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: imbalance >= 0 ? '#10b981' : '#ef4444', marginLeft: '4px' }}>
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
            <span>TOTAL: {bidSum.toFixed(2)}</span>
          </div>
          <div className="ladder-header">
            <span>PRICE ($)</span>
            <span>SIZE</span>
            <span>CUMULATIVE</span>
          </div>
          <div className="ladder-rows">
            {depthData.bids.map((b, i) => {
              const depthPct = Math.min((b.total / maxTotal) * 100, 100);
              return (
                <div key={i} className="ladder-row bid">
                  <div className="depth-bar-fill bid" style={{ width: `${depthPct}%` }} />
                  <span className="price bid">{b.price.toFixed(2)}</span>
                  <span className="size">{b.size.toFixed(3)}</span>
                  <span className="total">{b.total.toFixed(3)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asks Ladder */}
        <div className="depth-ladder-card">
          <div className="depth-card-header red">
            <span>ASKS (SELL ORDERS)</span>
            <span>TOTAL: {askSum.toFixed(2)}</span>
          </div>
          <div className="ladder-header">
            <span>PRICE ($)</span>
            <span>SIZE</span>
            <span>CUMULATIVE</span>
          </div>
          <div className="ladder-rows">
            {depthData.asks.map((a, i) => {
              const depthPct = Math.min((a.total / maxTotal) * 100, 100);
              return (
                <div key={i} className="ladder-row ask">
                  <div className="depth-bar-fill ask" style={{ width: `${depthPct}%` }} />
                  <span className="price ask">{a.price.toFixed(2)}</span>
                  <span className="size">{a.size.toFixed(3)}</span>
                  <span className="total">{a.total.toFixed(3)}</span>
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
            <span>PRICE ($)</span>
            <span>QTY</span>
            <span>SIDE</span>
          </div>
          <div className="ladder-rows">
            {depthData.recent_trades.map((t, i) => (
              <div key={i} className="tape-row">
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{t.time}</span>
                <span style={{ fontWeight: 600, color: t.side === 'buy' ? '#10b981' : '#ef4444' }}>
                  {t.price.toFixed(2)}
                </span>
                <span>{t.size.toFixed(3)}</span>
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
