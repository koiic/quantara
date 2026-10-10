import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

import { API_URL } from '../config';

export default function TickerTape({ onSelectSymbol, activeSymbol = 'BTC-USD' }) {
  const [tickers, setTickers] = useState([]);
  const [lastPrices, setLastPrices] = useState({});
  const [flashStates, setFlashStates] = useState({});

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/market/ticker`);
        const newTickers = res.data.tickers || [];
        
        // Detect price change ticks for flashing animation
        const newFlash = {};
        newTickers.forEach(t => {
          const prev = lastPrices[t.symbol];
          if (prev !== undefined && prev !== t.price) {
            newFlash[t.symbol] = t.price > prev ? 'flash-up' : 'flash-down';
          }
        });

        if (Object.keys(newFlash).length > 0) {
          setFlashStates(newFlash);
          setTimeout(() => setFlashStates({}), 600);
        }

        const priceMap = {};
        newTickers.forEach(t => { priceMap[t.symbol] = t.price; });
        setLastPrices(priceMap);
        setTickers(newTickers);
      } catch (err) {
        // Silently retry
      }
    };

    fetchTickers();
    const interval = setInterval(fetchTickers, 3000);
    return () => clearInterval(interval);
  }, [lastPrices]);

  if (tickers.length === 0) return null;

  return (
    <div className="ticker-tape-container">
      <div className="ticker-tape-label">
        <Activity size={12} color="#10b981" />
        <span>LIVE FEEDS</span>
      </div>
      <div className="ticker-tape-scroll">
        {tickers.map(t => {
          const isSelected = t.symbol === activeSymbol;
          const flash = flashStates[t.symbol] || '';
          const isUp = t.change_24h >= 0;
          return (
            <div 
              key={t.symbol} 
              className={`ticker-item ${isSelected ? 'selected' : ''} ${flash}`}
              onClick={() => onSelectSymbol && onSelectSymbol(t.symbol)}
              title={`Click to inspect L2 depth for ${t.symbol}`}
            >
              <span className="ticker-symbol">{t.symbol}</span>
              <span className="ticker-price">
                {t.price < 10 ? t.price.toFixed(4) : t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`ticker-change ${isUp ? 'positive' : 'negative'}`}>
                {isUp ? '+' : ''}{t.change_24h.toFixed(2)}%
              </span>
              {t.funding_rate !== 'N/A' && (
                <span className="ticker-funding" title="Estimated 8h Funding Rate">
                  {t.funding_rate}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
