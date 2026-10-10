// Dynamic networking configuration supporting:
// 1. Local Vite dev server (port 5173)
// 2. Production VPS access via Public IP (http://195.201.x.x)
// 3. Production access via Custom Domain with SSL (https://quant.firm.com)

export const getApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:8000';
  return window.location.port === '5173' ? 'http://localhost:8000' : window.location.origin;
};

export const API_URL = getApiUrl();

export const getYjsWsUrl = () => {
  if (typeof window === 'undefined') return 'ws://localhost:1234';
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (window.location.port === '5173') {
    return `${proto}//${window.location.hostname}:1234`;
  }
  return `${proto}//${window.location.host}/yjs-ws`;
};

export const getMarketWsUrl = () => {
  if (typeof window === 'undefined') return 'ws://localhost:8000/api/market/ws';
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (window.location.port === '5173') {
    return `${proto}//${window.location.hostname}:8000/api/market/ws`;
  }
  return `${proto}//${window.location.host}/api/market/ws`;
};

export const getStreamlitUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:8501';
  if (window.location.port === '5173') {
    return `http://${window.location.hostname}:8501`;
  }
  return `${window.location.origin}/streamlit`;
};
