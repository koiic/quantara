import { useState, useEffect } from 'react';
import {
  Terminal, Cpu, Zap, ShieldAlert, Layers, Activity, 
  TrendingUp, BarChart2, CheckCircle2, Database, Lock, 
  User, Play, ArrowRight, ChevronRight, Star, Sliders, 
  Sparkles, Globe, Server, Clock, ExternalLink, GitBranch, 
  BookOpen, Users, Check, Copy, X, ArrowUpRight, PlayCircle,
  HelpCircle, ChevronDown, ChevronUp, Code2, LineChart
} from 'lucide-react';

export default function LandingPageView({
  onLogin,
  onRegister,
  onQuickDemo,
  authLoading,
  authError,
  authTab,
  setAuthTab,
  showAuthModal,
  setShowAuthModal,
  isLoggedIn,
  onEnterWorkspace
}) {
  const [activePreviewTab, setActivePreviewTab] = useState('drl'); // 'drl' | 'shadow' | 'depth' | 'notebook'
  const [openFaq, setOpenFaq] = useState(0);
  const [simulatedEquity, setSimulatedEquity] = useState(1248500);
  const [simulatedSharpe, setSimulatedSharpe] = useState(2.84);
  const [copiedCode, setCopiedCode] = useState(false);

  // Subtle live simulated tick for the hero/showcase banner
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedEquity(prev => prev + Math.floor((Math.random() - 0.45) * 850));
      setSimulatedSharpe(prev => +(prev + (Math.random() - 0.49) * 0.02).toFixed(2));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleCopyInstall = () => {
    navigator.clipboard.writeText('git clone https://github.com/koiic/quantara.git && ./start_all.sh');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const FAQS = [
    {
      q: "What makes Quantara's Shadow Staging different from standard paper trading?",
      a: "Standard paper trading relies on naive mid-price executions that ignore market microstructure. Quantara's Shadow Staging implements Almgren-Chriss non-linear slippage models, venue-calibrated exchange fees (such as Saudi Tadawul 15.5 bps + 15% VAT), and partial order queuing against live L2 order book depth, guaranteeing that strategies tested in shadow stage behave identically in production."
    },
    {
      q: "How does Fractional Differencing preserve predictive alpha in DRL policies?",
      a: "Traditional price returns achieve stationarity by first-order integer differencing (d=1.0), which destroys virtually all multi-period memory and autocorrelation. Quantara applies Marcos López de Prado's fractional differencing (optimal d ≈ 0.40–0.45), satisfying ADF stationarity tests while retaining over 90% of memory and macro trend information for the neural state space."
    },
    {
      q: "Can I connect my own exchange or proprietary broker gateway?",
      a: "Yes. Quantara provides standard broker adapters and vectorized Gymnasium interfaces. You can ingest live tick data via WebSocket or Parquet files, route orders through the virtual broker sandbox, and switch between simulated shadow matching and live FIX / REST execution with zero code changes."
    },
    {
      q: "How does multiplayer collaboration work in Quantara notebooks?",
      a: "Quantara embeds Monaco Editor backed by Conflict-free Replicated Data Types (CRDT) via Yjs and WebSocket synchronization. Multiple quantitative researchers, risk officers, and ML engineers can edit code, inspect parameters, and trigger backtests simultaneously with zero merge collisions."
    },
    {
      q: "Is Quantara self-hosted or cloud-only?",
      a: "Quantara is fully self-hostable with Docker Compose and local SQLite/DuckDB engines. You maintain 100% data sovereignty over your models, weights, and proprietary trading signals."
    }
  ];

  return (
    <div className="landing-page-root" style={{ 
      minHeight: '100vh', 
      background: '#070b14', 
      color: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Ambient Glow Gradients */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1000px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, rgba(16, 185, 129, 0.08) 40%, rgba(7, 11, 20, 0) 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* TOP ANNOUNCEMENT TICKER */}
      <div style={{
        background: 'rgba(2, 132, 199, 0.08)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
        padding: '8px 16px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        position: 'relative',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: '#10b981',
            boxShadow: '0 0 8px #10b981'
          }} />
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>Quantara 2.4 Live</span>
        </div>
        <span style={{ color: '#94a3b8' }}>
          Autonomous DRL Studio & Multi-Asset Shadow Staging (Saudi Tadawul + US Equity + Crypto)
        </span>
        <a 
          href="https://github.com/koiic/quantara" 
          target="_blank" 
          rel="noreferrer"
          style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}
        >
          View Release Notes <ArrowRight size={12} />
        </a>
      </div>

      {/* NAVIGATION BAR */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(7, 11, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1e293b',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            borderRadius: '8px',
            padding: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(2, 132, 199, 0.4)'
          }}>
            <Terminal size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.4px', color: '#f8fafc' }}>
                Quantara
              </span>
              <span style={{
                background: 'rgba(2, 132, 199, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '4px',
                padding: '1px 5px',
                letterSpacing: '0.5px'
              }}>
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="landing-nav-links" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          fontSize: '13px',
          fontWeight: 500,
          color: '#94a3b8'
        }}>
          <a href="#features" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Pillars</a>
          <a href="#interactive-showcase" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>DRL Studio</a>
          <a href="#shadow-staging" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Shadow Staging</a>
          <a href="#architecture" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Architecture</a>
          <a href="#comparison" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Benchmark</a>
          <a href="#pricing" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Desks</a>
          <a 
            href="https://github.com/koiic/quantara" 
            target="_blank" 
            rel="noreferrer" 
            style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            GitHub <ArrowUpRight size={13} />
          </a>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isLoggedIn ? (
            <button
              onClick={onEnterWorkspace}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                cursor: 'pointer',
                border: 'none',
                color: '#ffffff'
              }}
            >
              <LayoutIcon size={14} /> Back to Workspace
            </button>
          ) : (
            <>
              <button
                onClick={() => onQuickDemo('admin', 'admin')}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  padding: '7px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Instant access with demo credentials"
              >
                <Zap size={13} /> Quick Demo
              </button>

              <button
                onClick={() => {
                  setAuthTab('login');
                  setShowAuthModal(true);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  padding: '7px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Sign In
              </button>

              <button
                onClick={() => {
                  setAuthTab('register');
                  setShowAuthModal(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
              >
                Launch Platform <ArrowRight size={13} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '80px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(2, 132, 199, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '6px 14px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#38bdf8',
          marginBottom: '28px',
          boxShadow: '0 0 20px rgba(2, 132, 199, 0.15)'
        }}>
          <Sparkles size={14} />
          <span>AUTONOMOUS DEEP RL & QUANTITATIVE TRADING PLATFORM</span>
        </div>

        {/* Big Heading */}
        <h1 style={{
          fontSize: 'clamp(36px, 5.5vw, 68px)',
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-1.8px',
          color: '#f8fafc',
          maxWidth: '980px',
          margin: '0 auto 24px'
        }}>
          Where Quantitative Alpha Meets{' '}
          <span style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 45%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            Venue Execution Realism
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(15px, 1.8vw, 19px)',
          lineHeight: 1.6,
          color: '#94a3b8',
          maxWidth: '780px',
          margin: '0 auto 36px',
          fontWeight: 400
        }}>
          Design deep reinforcement learning policies, capture high-frequency L2 order book microstructural alpha, and stress-test multi-asset algorithms against venue-accurate shadow staging environments with zero execution leakage.
        </p>

        {/* Hero CTAs */}
        <div className="landing-hero-actions" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          marginBottom: '48px'
        }}>
          <button
            onClick={() => {
              if (isLoggedIn) {
                onEnterWorkspace();
              } else {
                setAuthTab('login');
                setShowAuthModal(true);
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#ffffff',
              padding: '13px 26px',
              borderRadius: '9px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Play size={15} fill="#ffffff" /> Launch Platform Workspace
          </button>

          <button
            onClick={() => onQuickDemo('admin', 'admin')}
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              padding: '13px 24px',
              borderRadius: '9px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={16} /> Instant Guest Demo (1-Click)
          </button>

          <button
            onClick={handleCopyInstall}
            style={{
              background: '#0d1322',
              border: '1px solid #334155',
              color: '#cbd5e1',
              padding: '13px 20px',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Code2 size={15} />
            <code>git clone koiic/quantara</code>
            {copiedCode ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#64748b" />}
          </button>
        </div>

        {/* Institutional Metrics Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          maxWidth: '1060px',
          margin: '0 auto',
          textAlign: 'left'
        }}>
          <div style={{
            background: 'rgba(13, 19, 34, 0.8)',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
              Execution Latency
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.5px' }} className="tnum">
              &lt; 1.2 ms
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Virtual broker matching & partial order queue
            </div>
          </div>

          <div style={{
            background: 'rgba(13, 19, 34, 0.8)',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '18px 20px'
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
              Tadawul Friction Model
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', letterSpacing: '-0.5px' }} className="tnum">
              15.5 bps + 15% VAT
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Calibrated Almgren-Chriss non-linear slippage
            </div>
          </div>

          <div style={{
            background: 'rgba(13, 19, 34, 0.8)',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '18px 20px'
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
              Memory-Stationary
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#a855f7', letterSpacing: '-0.5px' }} className="tnum">
              d = 0.45 FracDiff
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              ADF stationarity passed, 94% memory retained
            </div>
          </div>

          <div style={{
            background: 'rgba(13, 19, 34, 0.8)',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '18px 20px'
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
              Multiplayer CRDT Sync
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.5px' }} className="tnum">
              Zero-Conflict
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Real-time multi-quant collaborative research
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PRODUCT SHOWCASE */}
      <section id="interactive-showcase" style={{
        maxWidth: '1240px',
        margin: '20px auto 100px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          background: '#0d1322',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden'
        }}>
          {/* Top Window Bar */}
          <div style={{
            background: '#080d1a',
            padding: '12px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Window Dots & Tab Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              </div>

              <div style={{
                display: 'flex',
                background: '#070b14',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid #1e293b'
              }}>
                <button
                  onClick={() => setActivePreviewTab('drl')}
                  style={{
                    background: activePreviewTab === 'drl' ? '#1e293b' : 'transparent',
                    color: activePreviewTab === 'drl' ? '#38bdf8' : '#94a3b8',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Cpu size={13} /> DRL Studio
                </button>
                <button
                  onClick={() => setActivePreviewTab('shadow')}
                  style={{
                    background: activePreviewTab === 'shadow' ? '#1e293b' : 'transparent',
                    color: activePreviewTab === 'shadow' ? '#10b981' : '#94a3b8',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Activity size={13} /> Shadow Staging
                </button>
                <button
                  onClick={() => setActivePreviewTab('depth')}
                  style={{
                    background: activePreviewTab === 'depth' ? '#1e293b' : 'transparent',
                    color: activePreviewTab === 'depth' ? '#f59e0b' : '#94a3b8',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <BarChart2 size={13} /> L2 Market Depth
                </button>
                <button
                  onClick={() => setActivePreviewTab('notebook')}
                  style={{
                    background: activePreviewTab === 'notebook' ? '#1e293b' : 'transparent',
                    color: activePreviewTab === 'notebook' ? '#a855f7' : '#94a3b8',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Terminal size={13} /> Gym Environment
                </button>
              </div>
            </div>

            {/* Live Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                <span>Engine: Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} color="#38bdf8" />
                <span className="tnum">Sharpe: {simulatedSharpe}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={12} color="#10b981" />
                <span className="tnum">${simulatedEquity.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Interactive Preview Body */}
          <div style={{ padding: '24px', minHeight: '440px', background: '#0b101d' }}>
            {activePreviewTab === 'drl' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                      Autonomous DRL Agent: End-to-End Execution Pipeline
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Harmonizing Saudi Tadawul (TASI) + Brent Crude with Fractional Differencing (d=0.45) & Differential Sharpe Reward.
                    </p>
                  </div>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    Actor-Critic Policy: Convergence Reached
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  {/* Metric 1 */}
                  <div style={{ background: '#131b2e', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Differential Sharpe</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '4px' }} className="tnum">2.84</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Moody & Saffell online adaptive formulation</div>
                  </div>
                  {/* Metric 2 */}
                  <div style={{ background: '#131b2e', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Shannon Action Entropy</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }} className="tnum">0.78 / 1.00</div>
                    <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>Healthy (Dynamic sizing, no collapse)</div>
                  </div>
                  {/* Metric 3 */}
                  <div style={{ background: '#131b2e', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Stationarity (ADF p-val)</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#a855f7', marginTop: '4px' }} className="tnum">0.0041</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Stationary (p &lt; 0.05) with 94.2% memory kept</div>
                  </div>
                </div>

                {/* Simulated Chart Visual */}
                <div style={{
                  background: '#070b14',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '16px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                    <span>Simulated Policy Equity Curve (Almgren-Chriss + Tadawul 15.5 bps)</span>
                    <span style={{ color: '#10b981' }}>+24.8% Net Alpha</span>
                  </div>
                  {/* SVG Chart */}
                  <svg viewBox="0 0 800 160" style={{ width: '100%', height: '140px', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Gridlines */}
                    <line x1="0" y1="30" x2="800" y2="30" stroke="#1e293b" strokeDasharray="4 4" />
                    <line x1="0" y1="70" x2="800" y2="70" stroke="#1e293b" strokeDasharray="4 4" />
                    <line x1="0" y1="110" x2="800" y2="110" stroke="#1e293b" strokeDasharray="4 4" />
                    {/* Area */}
                    <path
                      d="M0,130 Q100,120 200,95 T400,65 T600,45 T800,20 L800,150 L0,150 Z"
                      fill="url(#equityGrad)"
                    />
                    {/* Line */}
                    <path
                      d="M0,130 Q100,120 200,95 T400,65 T600,45 T800,20"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />
                    {/* Live Indicator pulse */}
                    <circle cx="800" cy="20" r="5" fill="#10b981" />
                    <circle cx="800" cy="20" r="10" fill="none" stroke="#10b981" opacity="0.6">
                      <animate attributeName="r" values="5;14" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </div>
              </div>
            )}

            {activePreviewTab === 'shadow' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                      Shadow Staging Sandbox: Saudi Tadawul & Global Venues
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Virtual broker gateway with partial fills, non-linear market impact, and zero capital risk.
                    </p>
                  </div>
                  <span style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    Mode: Shadow Broker Isolated
                  </span>
                </div>

                {/* Staging Order Stream */}
                <div style={{
                  background: '#070b14',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr 1fr',
                    padding: '10px 16px',
                    background: '#0d1322',
                    borderBottom: '1px solid #1e293b',
                    fontSize: '11px',
                    color: '#64748b',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    <span>Symbol / Venue</span>
                    <span>Side</span>
                    <span>Order Price</span>
                    <span>Slippage Model</span>
                    <span>Exchange Fee</span>
                    <span>Status</span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr 1fr',
                      padding: '12px 16px',
                      borderBottom: '1px solid #141f33',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>1120.SR (Al Rajhi)</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>BUY 2,500</span>
                      <span className="tnum">89.40 SAR</span>
                      <span style={{ color: '#38bdf8' }}>Almgren-Chriss (0.8 bps)</span>
                      <span className="tnum" style={{ color: '#f59e0b' }}>15.5 bps + VAT</span>
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> FILLED (Shadow)
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr 1fr',
                      padding: '12px 16px',
                      borderBottom: '1px solid #141f33',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>BTC-USD (Binance)</span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>SELL 1.45</span>
                      <span className="tnum">$68,420.50</span>
                      <span style={{ color: '#38bdf8' }}>Square-Root Impact</span>
                      <span className="tnum" style={{ color: '#f59e0b' }}>4.0 bps Maker</span>
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> FILLED (Shadow)
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr 1fr',
                      padding: '12px 16px',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>2222.SR (Aramco)</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>BUY 10,000</span>
                      <span className="tnum">27.65 SAR</span>
                      <span style={{ color: '#38bdf8' }}>Almgren-Chriss (1.2 bps)</span>
                      <span className="tnum" style={{ color: '#f59e0b' }}>15.5 bps + VAT</span>
                      <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> QUEUED (L2 Depth)
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', fontSize: '11px', color: '#94a3b8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={12} color="#10b981" /> Capital Exposure: $0.00
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={12} color="#38bdf8" /> Order Queuing Latency: 0.94ms
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={12} color="#f59e0b" /> Fill Probability: 98.4%
                  </span>
                </div>
              </div>
            )}

            {activePreviewTab === 'depth' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                      L2/L3 Market Depth Ladder & Microstructural Flow
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Real-time Order Flow Imbalance (OFI), Micro-price, and VPIN toxicity monitoring.
                    </p>
                  </div>
                  <span style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    OFI Momentum: +0.42 (Bullish Micro-Price Pressure)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {/* Bids Ladder */}
                  <div style={{ background: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Bids (Buying Liquidity)
                    </div>
                    {[
                      { price: '68,418.50', size: '4.82', depth: '85%' },
                      { price: '68,416.00', size: '2.14', depth: '60%' },
                      { price: '68,412.50', size: '6.90', depth: '95%' },
                      { price: '68,410.00', size: '1.25', depth: '35%' },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #141f33', position: 'relative' }}>
                        <span style={{ color: '#34d399', fontWeight: 600 }} className="tnum">{row.price}</span>
                        <span style={{ color: '#cbd5e1' }} className="tnum">{row.size} BTC</span>
                      </div>
                    ))}
                  </div>

                  {/* Asks Ladder */}
                  <div style={{ background: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Asks (Selling Liquidity)
                    </div>
                    {[
                      { price: '68,421.00', size: '3.12', depth: '70%' },
                      { price: '68,423.50', size: '1.80', depth: '45%' },
                      { price: '68,426.00', size: '5.40', depth: '88%' },
                      { price: '68,430.00', size: '8.10', depth: '100%' },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #141f33' }}>
                        <span style={{ color: '#f87171', fontWeight: 600 }} className="tnum">{row.price}</span>
                        <span style={{ color: '#cbd5e1' }} className="tnum">{row.size} BTC</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'notebook' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                      Standardized Gymnasium Trading Environment
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Vectorized state vector, differential Sharpe reward, and frictionless DuckDB data loading.
                    </p>
                  </div>
                  <span style={{
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    color: '#c084fc',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    Multiplayer CRDT Ready
                  </span>
                </div>

                <div style={{
                  background: '#070a12',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '16px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: '#e2e8f0',
                  overflowX: 'auto'
                }}>
                  <div style={{ color: '#64748b' }}># QuantaraTradingEnv: Vectorized Differential Sharpe Formulation</div>
                  <div><span style={{ color: '#38bdf8' }}>class</span> <span style={{ color: '#34d399' }}>QuantaraTradingEnv</span>(gym.Env):</div>
                  <div style={{ paddingLeft: '18px' }}><span style={{ color: '#38bdf8' }}>def</span> <span style={{ color: '#f59e0b' }}>__init__</span>(self, df, commission_bps=15.5, vat_pct=15.0):</div>
                  <div style={{ paddingLeft: '36px', color: '#94a3b8' }}>self.effective_fee = (commission_bps / 10000.0) * (1.0 + vat_pct / 100.0)</div>
                  <div style={{ paddingLeft: '36px', color: '#94a3b8' }}>self.action_space = spaces.Box(low=-1.0, high=1.0, shape=(1,))</div>
                  <div style={{ paddingLeft: '36px', color: '#94a3b8' }}>self.observation_space = spaces.Box(low=-5.0, high=5.0, shape=(4,))</div>
                  <div style={{ paddingLeft: '18px' }}><span style={{ color: '#38bdf8' }}>def</span> <span style={{ color: '#f59e0b' }}>step</span>(self, action):</div>
                  <div style={{ paddingLeft: '36px', color: '#94a3b8' }}># Moody & Saffell differential Sharpe reward update</div>
                  <div style={{ paddingLeft: '36px' }}>reward = (step_pnl - 0.5 * eta * self.A - eta * self.B * step_pnl) / (D**1.5)</div>
                  <div style={{ paddingLeft: '36px', color: '#38bdf8' }}>return self._get_obs(), reward, terminated, False, &#123;"equity": self.equity&#125;</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CORE PILLARS GRID */}
      <section id="features" style={{
        maxWidth: '1240px',
        margin: '0 auto 120px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            fontSize: '12px',
            color: '#38bdf8',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px'
          }}>
            Institutional Architecture
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 3.5vw, 44px)',
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '-1px',
            margin: '0 0 16px'
          }}>
            Six Pillars Engineered for Rigorous Alpha
          </h2>
          <p style={{
            fontSize: '15px',
            color: '#94a3b8',
            maxWidth: '680px',
            margin: '0 auto'
          }}>
            Built from first principles to bridge the dangerous gap between theoretical quantitative backtests and harsh real-world order matching.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px'
        }}>
          {/* Card 1 */}
          <div style={{
            background: 'linear-gradient(180deg, #0d1322 0%, #070b14 100%)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '28px',
            position: 'relative'
          }}>
            <div style={{
              background: 'rgba(2, 132, 199, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <Cpu size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px', color: '#f8fafc' }}>
              Fractional Differencing Stationarity
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
              Avoid the memory-destruction of standard integer returns. Apply Marcos López de Prado's fractional differencing ($d \approx 0.45$) to pass Augmented Dickey-Fuller tests while preserving long-term cointegration memory.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'linear-gradient(180deg, #0d1322 0%, #070b14 100%)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '28px'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <Activity size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px', color: '#f8fafc' }}>
              Differential Sharpe Gym Envs
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
              Vectorized Gymnasium environments natively implement Moody & Saffell differential Sharpe reward updates. Directly optimize risk-adjusted returns instead of noisy step-by-step PnL.
            </p>
          </div>

          {/* Card 3 */}
          <div id="shadow-staging" style={{
            background: 'linear-gradient(180deg, #0d1322 0%, #070b14 100%)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '28px'
          }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <ShieldAlert size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px', color: '#f8fafc' }}>
              Venue-Accurate Shadow Staging
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
              Virtual broker engine accurately reflects exchange frictions: Tadawul 15.5 bps fees, 15% VAT, and Almgren-Chriss non-linear market impact, verifying strategies before a single dollar is risked.
            </p>
          </div>

          {/* Card 4 */}
          <div style={{
            background: 'linear-gradient(180deg, #0d1322 0%, #070b14 100%)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '28px'
          }}>
            <div style={{
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#a855f7',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <BarChart2 size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px', color: '#f8fafc' }}>
              L2 Order Book Flow & VPIN
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
              Calculate real-time Order Flow Imbalance (OFI), micro-price pressure, and volume-synchronized probability of toxicity (VPIN) to preempt adverse selection and toxic flow.
            </p>
          </div>

          {/* Card 5 */}
          <div style={{
            background: 'linear-gradient(180deg, #0d1322 0%, #070b14 100%)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '28px'
          }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <Sliders size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px', color: '#f8fafc' }}>
              Real-time Risk Sentinel
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
              Live 99% Parametric and Cornish-Fisher VaR calculations, maximum drawdown gates, and automated circuit breaker kill-switches with sub-millisecond trip latency.
            </p>
          </div>

          {/* Card 6 */}
          <div style={{
            background: 'linear-gradient(180deg, #0d1322 0%, #070b14 100%)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '28px'
          }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px', color: '#f8fafc' }}>
              Multiplayer CRDT Collaboration
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
              Real-time multi-quant collaborative research with Yjs WebSockets and Monaco Editor. Export verified models with 1-click into interactive Streamlit executive dashboards.
            </p>
          </div>
        </div>
      </section>

      {/* END-TO-END PIPELINE ARCHITECTURE */}
      <section id="architecture" style={{
        maxWidth: '1240px',
        margin: '0 auto 120px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          background: '#0d1322',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          padding: '48px 36px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Continuous Alpha Life Cycle
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '8px 0 12px' }}>
              From Tick Ingestion to Production Deployment
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto' }}>
              A unified pipeline that eliminates the friction of moving quantitative algorithms from Jupyter research to institutional execution.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {[
              {
                step: "01",
                title: "Tick Ingestion",
                desc: "DuckDB & Parquet compression storing 100k+ ticks/sec with zero latency overhead.",
                color: "#38bdf8"
              },
              {
                step: "02",
                title: "FracDiff Features",
                desc: "Marcos López de Prado memory-preserving stationary state space generation.",
                color: "#a855f7"
              },
              {
                step: "03",
                title: "DRL Policy Rollout",
                desc: "Actor-Critic training with Differential Sharpe reward in vectorized Gym environments.",
                color: "#10b981"
              },
              {
                step: "04",
                title: "Shadow Staging",
                desc: "Almgren-Chriss slippage, fee friction validation & L2 order queuing before live capital.",
                color: "#f59e0b"
              },
              {
                step: "05",
                title: "Executive Studio",
                desc: "1-Click Streamlit tear sheets, Action Shannon entropy audits, and PDF risk reports.",
                color: "#0284c7"
              }
            ].map((p, idx) => (
              <div key={idx} style={{
                background: '#070b14',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '20px',
                position: 'relative'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: p.color, marginBottom: '8px' }}>
                  STEP {p.step}
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', color: '#f8fafc' }}>
                  {p.title}
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM COMPARISON BENCHMARK */}
      <section id="comparison" style={{
        maxWidth: '1240px',
        margin: '0 auto 120px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Feature Matrix
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0 12px' }}>
            Why Leading Quant Desks Choose Quantara
          </h2>
        </div>

        <div style={{
          background: '#0d1322',
          border: '1px solid #1e293b',
          borderRadius: '14px',
          overflowX: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
            <thead>
              <tr style={{ background: '#080d1a', borderBottom: '1px solid #1e293b' }}>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Capability</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>Quantara PRO</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Generic Jupyter</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Traditional Retail Backtesters</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Venue-Calibrated Shadow Staging", q: "Built-in (Tadawul, Crypto, US)", j: "Manual scripting", t: "Naive mid-price only" },
                { name: "Almgren-Chriss Slippage Impact", q: "Native non-linear model", j: "Requires custom math", t: "Fixed spread assumption" },
                { name: "Fractional Differencing (d=0.45)", q: "1-Click automated weights", j: "Manual NumPy loops", t: "Unsupported" },
                { name: "Differential Sharpe Gymnasium", q: "Pre-vectorized Environment", j: "Manual gym code", t: "Discrete PnL only" },
                { name: "Real-time L2/L3 OFI & VPIN", q: "Live micro-price pressure", j: "Complex socket code", t: "Delayed or level 1 only" },
                { name: "Multiplayer CRDT Collaboration", q: "Zero-conflict Yjs sync", j: "Git merge conflicts", t: "Single user desktop" },
                { name: "Executive Tear Sheet Export", q: "1-Click Streamlit Dashboard", j: "Manual HTML plots", t: "Static PDF only" }
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #141f33', fontSize: '13px' }}>
                  <td style={{ padding: '14px 20px', color: '#f8fafc', fontWeight: 500 }}>{row.name}</td>
                  <td style={{ padding: '14px 20px', color: '#34d399', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={15} color="#10b981" /> {row.q}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#94a3b8' }}>{row.j}</td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>{row.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PRICING & TIERS */}
      <section id="pricing" style={{
        maxWidth: '1240px',
        margin: '0 auto 120px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Desks & Deployment
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0 12px' }}>
            Transparent Architecture for Every Scale
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            From independent quantitative researchers to institutional prop desks and sovereign funds.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* Tier 1 */}
          <div style={{
            background: '#0d1322',
            border: '1px solid #1e293b',
            borderRadius: '14px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8' }}>Quant Researcher</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', margin: '14px 0 6px' }}>$0 <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 400 }}>/ open source</span></div>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
                Ideal for individual researchers, student quants, and academic algorithm prototyping.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> Full Monaco Notebook & Python Kernel</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> DuckDB & Local Parquet Data Lake</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> Fractional Differencing Utilities</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> Basic Paper Trading Sandbox</div>
              </div>
            </div>
            <button
              onClick={() => onQuickDemo('admin', 'admin')}
              style={{
                marginTop: '32px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                padding: '10px 0',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Get Started Free
            </button>
          </div>

          {/* Tier 2 (Highlighted) */}
          <div style={{
            background: 'linear-gradient(180deg, #131b2e 0%, #0d1322 100%)',
            border: '2px solid #0284c7',
            borderRadius: '14px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            boxShadow: '0 12px 36px rgba(2, 132, 199, 0.2)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '3px 12px',
              borderRadius: '999px',
              letterSpacing: '0.8px'
            }}>
              MOST POPULAR
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>Prop Desk / Hedge Fund</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', margin: '14px 0 6px' }}>$490 <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 400 }}>/ desk / mo</span></div>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
                Engineered for active quantitative prop shops and systematic crypto/equity desks.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> All Researcher Features Included</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> High-Fidelity Shadow Staging with 15.5 bps Tadawul & Almgren-Chriss</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> Real-time L2/L3 Order Book OFI & VPIN</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> Multi-Quant CRDT Multiplayer Collaboration</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> 1-Click Streamlit Executive Briefing Studio</div>
              </div>
            </div>
            <button
              onClick={() => {
                setAuthTab('register');
                setShowAuthModal(true);
              }}
              style={{
                marginTop: '32px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                border: 'none',
                color: '#ffffff',
                padding: '11px 0',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              Start 14-Day Free Desk Trial
            </button>
          </div>

          {/* Tier 3 */}
          <div style={{
            background: '#0d1322',
            border: '1px solid #1e293b',
            borderRadius: '14px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8' }}>Institutional / Sovereign</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', margin: '14px 0 6px' }}>Custom <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 400 }}>/ SLA</span></div>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
                Dedicated on-premise air-gapped clusters with sub-millisecond hardware acceleration.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> Air-gapped On-Prem Kubernetes & Slurm</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> Direct FIX & OUCH/ITCH Exchange Gateways</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> Dedicated FPGA & GPU Acceleration Pipelines</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={15} color="#10b981" /> 24/7 Dedicated Quant Solutions Engineer</div>
              </div>
            </div>
            <a
              href="https://github.com/koiic/quantara"
              target="_blank"
              rel="noreferrer"
              style={{
                marginTop: '32px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                padding: '10px 0',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none'
              }}
            >
              Contact Solutions Desk
            </a>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section style={{
        maxWidth: '860px',
        margin: '0 auto 120px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            FAQ
          </span>
          <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '8px 0 12px' }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: '#0d1322',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease'
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '14px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} color="#38bdf8" /> : <ChevronDown size={18} color="#64748b" />}
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 20px 18px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: '#94a3b8',
                    borderTop: '1px solid #141f33'
                  }}>
                    <div style={{ paddingTop: '12px' }}>
                      {faq.a}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto 80px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(2, 132, 199, 0.25) 0%, #0d1322 70%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '16px',
          padding: '60px 24px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, margin: '0 0 16px' }}>
            Ready to Build Venue-Calibrated Alpha?
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 32px' }}>
            Spin up deep reinforcement learning pipelines, connect multi-market tick streams, and validate executions in under 2 minutes.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (isLoggedIn) {
                  onEnterWorkspace();
                } else {
                  setAuthTab('register');
                  setShowAuthModal(true);
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)'
              }}
            >
              Launch Workspace Now
            </button>
            <button
              onClick={() => onQuickDemo('admin', 'admin')}
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              1-Click Guest Demo
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid #1e293b',
        background: '#04070e',
        padding: '48px 28px 32px',
        fontSize: '12px',
        color: '#64748b',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              borderRadius: '6px',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Terminal size={14} color="#ffffff" />
            </div>
            <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>Quantara Platform</span>
            <span>&copy; {new Date().getFullYear()} Open Source under MIT License</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              FastAPI: Online
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              Yjs CRDT: Online
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              DuckDB: Ready
            </span>
            <a
              href="https://github.com/koiic/quantara"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              GitHub <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '16px'
        }}>
          <div style={{
            background: '#0d1322',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            width: '100%',
            maxWidth: '420px',
            border: '1px solid #1e293b',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px'
              }}
            >
              <X size={18} />
            </button>

            {/* Brand Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: 'white',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
              }}>
                <Terminal size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '18px', color: '#f8fafc', letterSpacing: '-0.3px' }}>Quantara</span>
                  <span style={{
                    background: 'rgba(2, 132, 199, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    padding: '1px 5px',
                    letterSpacing: '0.5px'
                  }}>PRO</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Quantitative Research & Staging Hub
                </div>
              </div>
            </div>

            {/* Auth Tab Switcher */}
            <div style={{ display: 'flex', background: '#070b14', borderRadius: '8px', padding: '3px', margin: '20px 0 18px', border: '1px solid #1e293b' }}>
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  background: authTab === 'login' ? '#1e293b' : 'transparent',
                  color: authTab === 'login' ? '#f8fafc' : '#64748b',
                  boxShadow: authTab === 'login' ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('register')}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  background: authTab === 'register' ? '#1e293b' : 'transparent',
                  color: authTab === 'register' ? '#f8fafc' : '#64748b',
                  boxShadow: authTab === 'register' ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                padding: '9px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '16px'
              }}>
                {authError}
              </div>
            )}

            {authTab === 'login' ? (
              <form onSubmit={onLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</label>
                  <input
                    name="username"
                    type="text"
                    defaultValue="admin"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: '#131b2e',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                  <input
                    name="password"
                    type="password"
                    defaultValue="admin"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: '#131b2e',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '6px',
                    padding: '10px 0',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Lock size={14} /> {authLoading ? 'Signing In...' : 'Sign In to Hub'}
                </button>

                <div style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  textAlign: 'center',
                  marginTop: '4px',
                  background: '#070b14',
                  border: '1px solid #1e293b',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Demo: <code style={{ color: '#38bdf8' }}>admin/admin</code></span>
                  <button
                    type="button"
                    onClick={() => onQuickDemo('admin', 'admin')}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    1-Click Auto Fill
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={onRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username *</label>
                  <input
                    name="reg_username"
                    type="text"
                    placeholder="e.g. sarah_quant"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#131b2e',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
                  <input
                    name="reg_fullname"
                    type="text"
                    placeholder="e.g. Sarah Chen, CFA"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#131b2e',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Corporate / Quant Email</label>
                  <input
                    name="reg_email"
                    type="email"
                    placeholder="e.g. schen@firm.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#131b2e',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password *</label>
                  <input
                    name="reg_password"
                    type="password"
                    placeholder="At least 4 characters"
                    required
                    minLength={4}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#131b2e',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '6px',
                    padding: '10px 0',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <User size={14} /> {authLoading ? 'Creating Account...' : 'Register & Enter Workspace'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper icon
function LayoutIcon(props) {
  return (
    <svg 
      width={props.size || 16} 
      height={props.size || 16} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}
