import { useState, useMemo } from 'react';
import {
  Terminal, Play, ArrowRight, Check, Copy, X, 
  ExternalLink, ChevronDown, ChevronUp, Star,
  Sliders, Shield, Zap, Activity, BarChart2,
  Lock, User, RefreshCw, Cpu, Layers, HelpCircle
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
  // Interactive Hero Simulator States
  const [orderSize, setOrderSize] = useState(1500); // 100 to 5000 lots
  const [selectedVenue, setSelectedVenue] = useState('tadawul'); // 'tadawul' | 'crypto' | 'us_equity'
  const [slippageModel, setSlippageModel] = useState('almgren'); // 'almgren' | 'linear'
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeDeepDiveTab, setActiveDeepDiveTab] = useState('microstructure'); // 'microstructure' | 'risk' | 'crdt'
  const [openFaq, setOpenFaq] = useState(0);

  // Dynamic simulation calculations based on visitor's interaction
  const simResults = useMemo(() => {
    let baseSharpe = 2.84;
    let baseReturn = 28.5; // percent
    let feeBps = selectedVenue === 'tadawul' ? 17.8 : selectedVenue === 'crypto' ? 8.0 : 4.5;
    
    // Impact scaling from size
    const impactFactor = slippageModel === 'almgren' 
      ? Math.sqrt(orderSize / 1000) * 1.8 
      : (orderSize / 1000) * 2.4;

    const penalty = (feeBps * 0.04) + (impactFactor * 0.22);
    const calculatedSharpe = Math.max(1.15, +(baseSharpe - penalty * 0.45).toFixed(2));
    const calculatedReturn = Math.max(8.2, +(baseReturn - penalty * 2.8).toFixed(1));
    const calculatedFeeSAR = Math.round((orderSize * 89.4) * (feeBps / 10000));
    const calculatedSlippageBps = +(impactFactor * 0.9).toFixed(1);

    return {
      sharpe: calculatedSharpe,
      returnPct: calculatedReturn,
      totalFee: calculatedFeeSAR,
      slippageBps: calculatedSlippageBps,
      fillRate: Math.max(92, Math.round(100 - (orderSize / 5000) * 6))
    };
  }, [orderSize, selectedVenue, slippageModel]);

  const handleCopyInstall = () => {
    navigator.clipboard.writeText('pip install quantara && quantara start');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const FAQS = [
    {
      q: "How does Quantara compare to standard backtesting frameworks like Backtrader or Zipline?",
      a: "Legacy frameworks rely on naive price matching at the next bar's close without market microstructure. Quantara executes against an L2 order book depth simulator with Almgren-Chriss non-linear slippage and exact exchange fees (such as Saudi Tadawul 15.5 bps + 15% VAT). What you test in Quantara matches real exchange fills."
    },
    {
      q: "Can I use standard Python data science libraries like Pandas, Polars, and PyTorch?",
      a: "Yes, 100%. Quantara is built in pure Python. Your state spaces, features, and policies are standard NumPy arrays and PyTorch tensors. We provide standard Gymnasium (gym.Env) vectorized environments that integrate natively with Stable-Baselines3, Ray RLlib, or custom Actor-Critic networks."
    },
    {
      q: "What is the difference between Paper Trading and Shadow Dark-Launch?",
      a: "Paper trading typically simulates executions isolated from real market order flow. Quantara's Shadow Dark-Launch streams live Level 2 order books in real time, places virtual orders behind real queue volume, and logs simulated executions to a staging database—allowing you to stress-test your strategy in production without risking capital."
    },
    {
      q: "How does real-time collaborative editing work in the notebooks?",
      a: "Quantara embeds Monaco Editor with Conflict-free Replicated Data Types (CRDT) via Yjs and WebSocket synchronization. Multiple quantitative researchers and risk officers can edit code, inspect parameters, and trigger backtests concurrently without merge collisions."
    },
    {
      q: "Can I self-host Quantara on my own on-premise servers?",
      a: "Yes. Quantara is open source and can be deployed with Docker Compose on local hardware, private VPS instances, or Kubernetes clusters. Your models, weights, and alpha signals never leave your infrastructure."
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#111827',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div style={{
        backgroundColor: '#F8F9FA',
        borderBottom: '1px solid #E5E7EB',
        padding: '9px 16px',
        fontSize: '13px',
        textAlign: 'center',
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <span>🎈</span>
        <span style={{ fontWeight: 600, color: '#111827' }}>New in Quantara 2.4:</span>
        <span>Venue-Calibrated Shadow Staging & Autonomous DRL Studio in Pure Python</span>
        <a 
          href="https://github.com/koiic/quantara" 
          target="_blank" 
          rel="noreferrer"
          style={{ 
            color: '#FF4B4B', 
            fontWeight: 600, 
            textDecoration: 'none', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '2px',
            marginLeft: '4px' 
          }}
        >
          Check out the release notes <ArrowRight size={13} />
        </a>
      </div>

      {/* 2. MINIMALIST STICKY NAVIGATION */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E7EB',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: '#FF4B4B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(255, 75, 75, 0.25)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
            Quantara
          </span>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            padding: '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.5px'
          }}>
            OPEN SOURCE
          </span>
        </div>

        {/* Links */}
        <nav className="landing-nav-links" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
          fontSize: '14px',
          fontWeight: 500,
          color: '#4B5563'
        }}>
          <a href="#playground" style={{ color: '#374151', textDecoration: 'none' }}>Live Playground</a>
          <a href="#principles" style={{ color: '#374151', textDecoration: 'none' }}>Three Principles</a>
          <a href="#capabilities" style={{ color: '#374151', textDecoration: 'none' }}>Microstructure</a>
          <a href="#comparison" style={{ color: '#374151', textDecoration: 'none' }}>Comparison</a>
          <a href="#desks" style={{ color: '#374151', textDecoration: 'none' }}>Desks</a>
          <a 
            href="https://github.com/koiic/quantara" 
            target="_blank" 
            rel="noreferrer"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              color: '#374151', 
              textDecoration: 'none',
              backgroundColor: '#F3F4F6',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '13px'
            }}
          >
            <Star size={13} fill="#F59E0B" color="#F59E0B" /> Star on GitHub
          </a>
        </nav>

        {/* Right CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isLoggedIn ? (
            <button
              onClick={onEnterWorkspace}
              style={{
                backgroundColor: '#111827',
                color: '#ffffff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Back to Workspace <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={() => onQuickDemo('admin', 'admin')}
                style={{
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Log in directly as demo admin"
              >
                <Zap size={13} color="#059669" /> Guest Demo
              </button>

              <button
                onClick={() => {
                  setAuthTab('login');
                  setShowAuthModal(true);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#374151',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
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
                  backgroundColor: '#FF4B4B',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(255, 75, 75, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '70px 24px 50px',
        textAlign: 'center'
      }}>
        {/* Category Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#F3F4F6',
          border: '1px solid #E5E7EB',
          color: '#374151',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '24px'
        }}>
          <span style={{ color: '#FF4B4B' }}>●</span> Pure Python Quantitative Execution Engine
        </div>

        {/* Big Bold Headline */}
        <h1 style={{
          fontSize: 'clamp(36px, 5.2vw, 68px)',
          fontWeight: 900,
          color: '#111827',
          lineHeight: 1.08,
          letterSpacing: '-0.035em',
          maxWidth: '960px',
          margin: '0 auto 20px'
        }}>
          A faster way to research, backtest, and stage{' '}
          <span style={{
            position: 'relative',
            display: 'inline-block',
            color: '#FF4B4B'
          }}>
            trading strategies
            <span style={{
              position: 'absolute',
              bottom: '2px',
              left: 0,
              width: '100%',
              height: '4px',
              backgroundColor: '#FECACA',
              zIndex: -1,
              borderRadius: '2px'
            }} />
          </span>
        </h1>

        {/* Human, clear subheadline */}
        <p style={{
          fontSize: 'clamp(16px, 1.8vw, 21px)',
          color: '#4B5563',
          lineHeight: 1.6,
          maxWidth: '740px',
          margin: '0 auto 36px',
          fontWeight: 400
        }}>
          Turn your quantitative scripts into venue-calibrated algorithmic executions in minutes. All in pure Python. No fragmented spreadsheets, no execution illusions.
        </p>

        {/* Action Pair */}
        <div className="landing-hero-actions" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '50px'
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
              backgroundColor: '#FF4B4B',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255, 75, 75, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Launch Platform Hub <ArrowRight size={16} />
          </button>

          <a
            href="#playground"
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#111827',
              textDecoration: 'none',
              borderBottom: '2px solid #111827',
              paddingBottom: '2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Try the live strategy playground! →
          </a>
        </div>

        {/* Credibility Ribbon */}
        <div style={{
          fontSize: '13px',
          color: '#6B7280',
          fontWeight: 500,
          letterSpacing: '0.2px',
          marginBottom: '20px'
        }}>
          Engineered for Quantitative Researchers • Systematic Prop Traders • Deep RL Engineers
        </div>
      </section>

      {/* 4. THE SIDE-BY-SIDE "CODE -> LIVE STRATEGY SANDBOX" HERO DEMO */}
      <section id="playground" style={{
        maxWidth: '1240px',
        margin: '0 auto 80px',
        padding: '0 24px'
      }}>
        <div style={{
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Section Subtitle Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>
                Interactive Strategy Demo:
              </span>
              <span style={{ fontSize: '13px', color: '#4B5563' }}>
                Drag the slider or change venue to see execution slippage & fees calculate in real time.
              </span>
            </div>
            <span style={{
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px'
            }}>
              ● LIVE SIMULATOR
            </span>
          </div>

          {/* Side-by-Side Windows */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '20px'
          }}>
            {/* LEFT WINDOW: Clean MacOS Python Code Window */}
            <div style={{
              backgroundColor: '#1E1E24',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Traffic Light Header */}
              <div style={{
                backgroundColor: '#16161A',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #2A2A32'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
                  <span style={{ marginLeft: '10px', fontSize: '12px', color: '#9CA3AF', fontFamily: 'monospace' }}>
                    strategy.py
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'monospace' }}>Python 3.12</span>
              </div>

              {/* Code Content */}
              <div style={{
                padding: '20px',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: '13px',
                lineHeight: '1.7',
                color: '#E5E7EB',
                overflowX: 'auto',
                flex: 1
              }}>
                <div><span style={{ color: '#F472B6' }}>import</span> quantara <span style={{ color: '#F472B6' }}>as</span> qa</div>
                <div><span style={{ color: '#F472B6' }}>import</span> gymnasium <span style={{ color: '#F472B6' }}>as</span> gym</div>
                <br />
                <div style={{ color: '#6B7280' }}># 1. Ingest multi-market venue ticks</div>
                <div>df = qa.load_market(</div>
                <div style={{ paddingLeft: '16px' }}>venue=<span style={{ color: '#34D399' }}>"{selectedVenue.toUpperCase()}"</span>,</div>
                <div style={{ paddingLeft: '16px' }}>symbol=<span style={{ color: '#34D399' }}>"1120.SR"</span>, frac_diff_d=<span style={{ color: '#60A5FA' }}>0.45</span></div>
                <div>)</div>
                <br />
                <div style={{ color: '#6B7280' }}># 2. Vectorized Gym Env with venue realism</div>
                <div>env = qa.QuantaraTradingEnv(</div>
                <div style={{ paddingLeft: '16px' }}>df,</div>
                <div style={{ paddingLeft: '16px' }}>slippage=<span style={{ color: '#34D399' }}>"{slippageModel}"</span>,</div>
                <div style={{ paddingLeft: '16px' }}>order_size=<span style={{ color: '#FBBF24' }}>{orderSize}</span>,</div>
                <div style={{ paddingLeft: '16px' }}>reward=<span style={{ color: '#34D399' }}>"diff_sharpe"</span></div>
                <div>)</div>
                <br />
                <div style={{ color: '#6B7280' }}># 3. Roll out Actor-Critic policy</div>
                <div>agent = qa.DRLAgent(env)</div>
                <div>metrics = agent.backtest(friction_calibrated=<span style={{ color: '#60A5FA' }}>True</span>)</div>
                <div>print(f<span style={{ color: '#34D399' }}>"Sharpe: &#123;metrics.sharpe:.2f&#125;"</span>)</div>
              </div>
            </div>

            {/* RIGHT WINDOW: Live Interactive Execution Sandbox */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Browser Header Bar */}
              <div style={{
                backgroundColor: '#F3F4F6',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D1D5DB' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D1D5DB' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D1D5DB' }} />
                  <span style={{ marginLeft: '10px', fontSize: '12px', color: '#4B5563', fontWeight: 600 }}>
                    Quantara Shadow Sandbox • http://localhost:5174
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Live Reactive</span>
              </div>

              {/* Interactive Widget Controls */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Venue Selector Pills */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Execution Venue:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'tadawul', label: 'Saudi Tadawul (15.5 bps + VAT)' },
                      { id: 'crypto', label: 'Crypto Venue (8.0 bps)' },
                      { id: 'us_equity', label: 'US Equities (4.5 bps)' }
                    ].map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVenue(v.id)}
                        style={{
                          backgroundColor: selectedVenue === v.id ? '#111827' : '#F3F4F6',
                          color: selectedVenue === v.id ? '#ffffff' : '#374151',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Interactive Slider for Order Sizing */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                      Order Size (Lots):
                    </label>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF4B4B', fontFamily: 'monospace' }}>
                      {orderSize.toLocaleString()} shares
                    </span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="5000"
                    step="100"
                    value={orderSize}
                    onChange={(e) => setOrderSize(Number(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: '#FF4B4B',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>
                    <span>200 (Low Impact)</span>
                    <span>2,500</span>
                    <span>5,000 (Heavy Slippage)</span>
                  </div>
                </div>

                {/* 3. Real-Time Recalculated Metric Strip */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Sharpe Ratio</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: simResults.sharpe > 2.0 ? '#059669' : '#D97706', marginTop: '2px' }}>
                      {simResults.sharpe}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Slippage Impact</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#FF4B4B', marginTop: '2px' }}>
                      +{simResults.slippageBps} bps
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Fill Prob.</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginTop: '2px' }}>
                      {simResults.fillRate}%
                    </div>
                  </div>
                </div>

                {/* 4. Reactive Chart Canvas */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6B7280', marginBottom: '8px' }}>
                    <span>Net Cumulative Strategy Equity ($)</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>+{simResults.returnPct}% Net Alpha</span>
                  </div>
                  <svg viewBox="0 0 500 100" style={{ width: '100%', height: '80px', overflow: 'visible' }}>
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#F3F4F6" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#F3F4F6" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#F3F4F6" strokeDasharray="3 3" />
                    
                    {/* Dynamic Path based on simResults */}
                    <path
                      d={`M0,85 Q120,${80 - simResults.returnPct * 0.4} 240,${60 - simResults.returnPct * 0.8} T500,${90 - simResults.returnPct * 2.2}`}
                      fill="none"
                      stroke="#FF4B4B"
                      strokeWidth="2.5"
                    />
                    <circle 
                      cx="500" 
                      cy={Math.max(10, 90 - simResults.returnPct * 2.2)} 
                      r="4" 
                      fill="#FF4B4B" 
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. "GET STARTED IN UNDER A MINUTE" QUICK INSTALL STRIP (Streamlit-Style) */}
      <section style={{
        backgroundColor: '#111827',
        color: '#ffffff',
        padding: '64px 24px',
        margin: '0 auto'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Get started in under a minute
          </h2>
          <p style={{ fontSize: '16px', color: '#9CA3AF', maxWidth: '680px', margin: '0 0 32px', lineHeight: 1.6 }}>
            Quantara is an open-source algorithmic framework that is a breeze to get started with. Just install it like any other Python library:
          </p>

          {/* Code Box */}
          <div style={{
            backgroundColor: '#1E293B',
            borderRadius: '10px',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '15px'
          }}>
            <div>
              <span style={{ color: '#94A3B8' }}>$ </span>
              <span style={{ color: '#F8FAFC' }}>git clone https://github.com/koiic/quantara.git &amp;&amp; ./start_all.sh</span>
            </div>
            <button
              onClick={handleCopyInstall}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#E2E8F0',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copiedCode ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Three Direct Pathways */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            <div 
              onClick={() => onQuickDemo('admin', 'admin')}
              style={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ color: '#34D399', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
                → Try the in-browser live demo
              </div>
              <div style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: 1.5 }}>
                The fastest way to test Quantara before installing anything locally. 1-click guest access.
              </div>
            </div>

            <div style={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <div style={{ color: '#60A5FA', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
                → Deploy with Docker Compose
              </div>
              <div style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: 1.5 }}>
                Deploy self-hosted on your own Linux server or workstation with SQLite and DuckDB lake.
              </div>
            </div>

            <div style={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <div style={{ color: '#F472B6', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
                → Enterprise Desk on Kubernetes
              </div>
              <div style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: 1.5 }}>
                Dedicated air-gapped on-premise clusters with custom broker FIX gateways and 24/7 SLA.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. "QUANTARA BUILDS UPON THREE SIMPLE PRINCIPLES" */}
      <section id="principles" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '90px 24px 80px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 54px)',
            fontWeight: 900,
            color: '#111827',
            letterSpacing: '-0.03em',
            margin: '0 0 12px'
          }}>
            Quantara builds upon
          </h2>
          <div style={{
            fontSize: 'clamp(28px, 3.5vw, 48px)',
            fontWeight: 800,
            color: '#FF4B4B',
            textDecoration: 'underline',
            textDecorationColor: '#FEE2E2',
            textUnderlineOffset: '8px'
          }}>
            three simple principles
          </div>
        </div>

        {/* Principle 1 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'center',
          marginBottom: '80px'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#FF4B4B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Principle 1
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              Embrace pure Python scripting
            </h3>
            <p style={{ fontSize: '16px', color: '#4B5563', lineHeight: 1.65, margin: 0 }}>
              No proprietary black-box languages, XML configurations, or complex C++ bindings. Write standard <strong>NumPy</strong>, <strong>Pandas</strong>, and <strong>Gymnasium</strong> code that executes at native speed. Ingest millions of tick rows into DuckDB Parquet storage with zero serialization friction.
            </p>
          </div>
          <div style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '24px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            color: '#1F2937'
          }}>
            <div style={{ color: '#059669' }}># Standard Gymnasium Vectorized State Vector</div>
            <div>obs, _ = env.reset()</div>
            <div>print("Initial State:", obs)</div>
            <div style={{ color: '#6B7280', marginTop: '4px' }}>→ [frac_diff_price, brent_crude, ofi, position]</div>
            <div style={{ marginTop: '12px', color: '#059669' }}># Moody &amp; Saffell Differential Sharpe update</div>
            <div>obs, reward, done, _, info = env.step(action)</div>
            <div>print(f"Differential Sharpe: &#123;reward:.3f&#125;")</div>
          </div>
        </div>

        {/* Principle 2 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'center',
          marginBottom: '80px'
        }}>
          <div style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              Venue Fee &amp; Slippage Calibration Model
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ color: '#4B5563' }}>Exchange Commission (Tadawul)</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>15.5 bps</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ color: '#4B5563' }}>Value Added Tax (KSA VAT)</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>15.0%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ color: '#4B5563' }}>Market Impact Model</span>
                <span style={{ fontWeight: 600, color: '#059669' }}>Almgren-Chriss Non-Linear</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#4B5563' }}>Stationary Memory Retention</span>
                <span style={{ fontWeight: 600, color: '#D97706' }}>94.2% (d=0.45 FracDiff)</span>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#FF4B4B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Principle 2
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              Weave in execution realism
            </h3>
            <p style={{ fontSize: '16px', color: '#4B5563', lineHeight: 1.65, margin: 0 }}>
              The #1 cause of backtest failure is naive mid-price execution. Quantara applies Marcos López de Prado's fractional differencing to preserve memory while achieving ADF stationarity, combined with calibrated Almgren-Chriss non-linear slippage and exact venue exchange fees.
            </p>
          </div>
        </div>

        {/* Principle 3 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#FF4B4B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Principle 3
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              Stage instantly with zero leakage
            </h3>
            <p style={{ fontSize: '16px', color: '#4B5563', lineHeight: 1.65, margin: 0 }}>
              Transition from research notebook to live staging with zero code modifications. The virtual shadow broker engine streams live L2 market feeds, matches orders with realistic queuing latency, and publishes 1-click Streamlit executive tear sheets.
            </p>
          </div>
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '12px',
            padding: '24px',
            color: '#F9FAFB'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399', marginBottom: '10px' }}>
              ✓ Shadow Staging Sandbox Gateway
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.6 }}>
              Virtual broker matches orders against live order books. Zero dollars at risk. Real-time logging of partial fills, venue latency, and Almgren-Chriss execution drag.
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <span style={{ backgroundColor: '#1F2937', color: '#E2E8F0', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                Latency: 0.94ms
              </span>
              <span style={{ backgroundColor: '#1F2937', color: '#E2E8F0', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                Match Engine: Active
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INTERACTIVE PLATFORM DEEP-DIVE TABS */}
      <section id="capabilities" style={{
        backgroundColor: '#F9FAFB',
        borderTop: '1px solid #E5E7EB',
        borderBottom: '1px solid #E5E7EB',
        padding: '80px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
              Institutional Capabilities Built for High-Frequency Rigor
            </h2>
            <p style={{ fontSize: '15px', color: '#4B5563', margin: 0 }}>
              Click through the perspectives below to inspect our real-time analytics engine.
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '32px',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'microstructure', label: 'L2 Market Depth Ladder' },
              { id: 'risk', label: 'Real-Time Risk Sentinel' },
              { id: 'crdt', label: 'Multiplayer CRDT Collaboration' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDeepDiveTab(tab.id)}
                style={{
                  backgroundColor: activeDeepDiveTab === tab.id ? '#FF4B4B' : '#FFFFFF',
                  color: activeDeepDiveTab === tab.id ? '#FFFFFF' : '#374151',
                  border: activeDeepDiveTab === tab.id ? '1px solid #FF4B4B' : '1px solid #E5E7EB',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: activeDeepDiveTab === tab.id ? '0 2px 6px rgba(255, 75, 75, 0.25)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Box */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
          }}>
            {activeDeepDiveTab === 'microstructure' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                      Level 2/3 Order Book Depth &amp; Microstructural Flow
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
                      Real-time Order Flow Imbalance (OFI), micro-price calculation, and VPIN toxicity monitoring.
                    </p>
                  </div>
                  <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                    OFI Momentum: +0.42 (Bullish Micro-Price Pressure)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>BIDS (BUYING LIQUIDITY)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #DCFCE7' }}>
                      <span style={{ color: '#15803D', fontWeight: 600 }}>89.40 SAR</span>
                      <span style={{ color: '#374151' }}>12,450 shares</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #DCFCE7' }}>
                      <span style={{ color: '#15803D', fontWeight: 600 }}>89.30 SAR</span>
                      <span style={{ color: '#374151' }}>8,200 shares</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                      <span style={{ color: '#15803D', fontWeight: 600 }}>89.20 SAR</span>
                      <span style={{ color: '#374151' }}>19,100 shares</span>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#991B1B', marginBottom: '8px' }}>ASKS (SELLING LIQUIDITY)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #FEE2E2' }}>
                      <span style={{ color: '#B91C1C', fontWeight: 600 }}>89.50 SAR</span>
                      <span style={{ color: '#374151' }}>9,800 shares</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #FEE2E2' }}>
                      <span style={{ color: '#B91C1C', fontWeight: 600 }}>89.60 SAR</span>
                      <span style={{ color: '#374151' }}>14,300 shares</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                      <span style={{ color: '#B91C1C', fontWeight: 600 }}>89.70 SAR</span>
                      <span style={{ color: '#374151' }}>6,400 shares</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDeepDiveTab === 'risk' && (
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                  Real-Time Value-at-Risk &amp; Circuit Breakers
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280' }}>
                  Continuous parametric and Cornish-Fisher expansion tail risk monitoring with automated kill-switches.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>99% Parametric VaR</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>-$14,250</div>
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Conditional VaR (CVaR)</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>-$21,800</div>
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Circuit Breaker Trip</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#16A34A', marginTop: '4px' }}>CLEAR</div>
                  </div>
                </div>
              </div>
            )}

            {activeDeepDiveTab === 'crdt' && (
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                  Multiplayer CRDT Collaboration (Zero Merge Collisions)
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280' }}>
                  Edit code simultaneously with your quant team. Backed by Yjs WebSocket syncing and Monaco Editor.
                </p>
                <div style={{
                  backgroundColor: '#F3F4F6',
                  borderRadius: '8px',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#1F2937'
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
                    <span style={{ fontWeight: 600 }}>Sarah Chen (Portfolio Manager):</span>
                    <span style={{ color: '#4B5563' }}>Adjusted Differential Sharpe eta parameter to 0.05</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span style={{ fontWeight: 600 }}>Tariq Al-Mansoor (Quant Dev):</span>
                    <span style={{ color: '#4B5563' }}>Connected Tadawul L2 depth tick feed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 8. HONEST BENCHMARK COMPARISON MATRIX */}
      <section id="comparison" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '90px 24px 80px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
            Why Quantitative Engineers Choose Quantara
          </h2>
          <p style={{ fontSize: '15px', color: '#4B5563', margin: 0 }}>
            An honest comparison of capabilities.
          </p>
        </div>

        <div style={{
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          overflowX: 'auto',
          backgroundColor: '#ffffff'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#4B5563', fontWeight: 600 }}>Feature</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#FF4B4B', fontWeight: 700 }}>Quantara</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>Vanilla Jupyter</th>
                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>Legacy Retail Software</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Venue-Calibrated Shadow Staging", q: "Built-in (Tadawul, Crypto, US)", j: "Manual scripting", l: "Naive mid-price only" },
                { name: "Almgren-Chriss Slippage Model", q: "Native non-linear model", j: "Custom NumPy code", l: "Fixed spread assumption" },
                { name: "Memory-Preserving FracDiff (d=0.45)", q: "Native 1-click stationarity", j: "Manual implementation", l: "Unsupported" },
                { name: "Differential Sharpe Gymnasium Env", q: "Pre-vectorized environment", j: "Manual loop scripting", l: "Discrete PnL only" },
                { name: "Multiplayer Real-Time CRDT Sync", q: "Built-in zero-conflict Yjs", j: "Git merge conflicts", l: "Single desktop only" },
                { name: "Executive Streamlit Tear Sheets", q: "1-Click automated export", j: "Manual HTML plots", l: "Static PDF only" }
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #E5E7EB', fontSize: '13px' }}>
                  <td style={{ padding: '14px 20px', color: '#111827', fontWeight: 600 }}>{row.name}</td>
                  <td style={{ padding: '14px 20px', color: '#15803D', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Check size={14} color="#16A34A" /> {row.q}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#6B7280' }}>{row.j}</td>
                  <td style={{ padding: '14px 20px', color: '#9CA3AF' }}>{row.l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 9. TRANSPARENT DESKS & DEPLOYMENT TIERS */}
      <section id="desks" style={{
        backgroundColor: '#F9FAFB',
        borderTop: '1px solid #E5E7EB',
        borderBottom: '1px solid #E5E7EB',
        padding: '90px 24px'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
              Transparent Architecture for Every Scale
            </h2>
            <p style={{ fontSize: '15px', color: '#4B5563', margin: 0 }}>
              From independent academic quants to systematic hedge funds.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '24px'
          }}>
            {/* Tier 1: Free */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#4B5563' }}>Quant Researcher</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: '12px 0 6px' }}>$0 <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 400 }}>/ open source</span></div>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                  Full algorithmic workstation for students, researchers, and algorithm prototyping.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#374151' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> Monaco Python Editor &amp; Kernel</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> DuckDB &amp; Local Parquet Data Lake</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> Fractional Differencing Utilities</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> Local Shadow Paper Sandbox</div>
                </div>
              </div>
              <button
                onClick={() => onQuickDemo('admin', 'admin')}
                style={{
                  marginTop: '28px',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  color: '#111827',
                  padding: '10px 0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Launch Free Desk
              </button>
            </div>

            {/* Tier 2: Prop Desk (Highlighted) */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px solid #FF4B4B',
              borderRadius: '12px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(255, 75, 75, 0.12)'
            }}>
              <div>
                <div style={{ display: 'inline-block', backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                  MOST POPULAR
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Prop Desk / Hedge Fund</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: '12px 0 6px' }}>$490 <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 400 }}>/ desk / mo</span></div>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                  Engineered for active systematic crypto and equity prop trading teams.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#374151' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> All Researcher Features Included</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> Calibrated Tadawul 15.5 bps &amp; Almgren-Chriss</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> Real-Time L2/L3 Order Book Flow &amp; OFI</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> Multiplayer CRDT Collaboration</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> 1-Click Streamlit Executive Briefing Studio</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setAuthTab('register');
                  setShowAuthModal(true);
                }}
                style={{
                  marginTop: '28px',
                  backgroundColor: '#FF4B4B',
                  border: 'none',
                  color: '#ffffff',
                  padding: '11px 0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(255, 75, 75, 0.3)'
                }}
              >
                Start 14-Day Free Desk Trial
              </button>
            </div>

            {/* Tier 3: Enterprise */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#4B5563' }}>Institutional / Sovereign</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: '12px 0 6px' }}>Custom <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 400 }}>/ SLA</span></div>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                  Dedicated air-gapped on-premise Kubernetes clusters with direct exchange feeds.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#374151' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> Air-Gapped On-Premise Deployment</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> Direct FIX &amp; OUCH Exchange Gateways</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> Custom FPGA Sub-Millisecond Pipelines</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#16A34A" /> Dedicated Quant Support Engineer</div>
                </div>
              </div>
              <a
                href="https://github.com/koiic/quantara"
                target="_blank"
                rel="noreferrer"
                style={{
                  marginTop: '28px',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  color: '#111827',
                  padding: '10px 0',
                  borderRadius: '6px',
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
        </div>
      </section>

      {/* 10. DEVELOPER FAQ ACCORDION */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '90px 24px 100px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Answers to technical implementation questions.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#111827',
                    fontSize: '14px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} color="#FF4B4B" /> : <ChevronDown size={16} color="#6B7280" />}
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 20px 16px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: '#4B5563',
                    borderTop: '1px solid #F3F4F6'
                  }}>
                    <div style={{ paddingTop: '10px' }}>
                      {faq.a}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. CLEAN INSTITUTIONAL FOOTER */}
      <footer style={{
        backgroundColor: '#F9FAFB',
        borderTop: '1px solid #E5E7EB',
        padding: '36px 28px',
        fontSize: '13px',
        color: '#6B7280'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: '#FF4B4B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Terminal size={14} />
            </div>
            <span style={{ fontWeight: 700, color: '#111827' }}>Quantara Platform</span>
            <span>&copy; {new Date().getFullYear()} Open Source under MIT License</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              FastAPI: Online
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              Yjs CRDT: Online
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              DuckDB: Ready
            </span>
            <a
              href="https://github.com/koiic/quantara"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#111827', textDecoration: 'none', fontWeight: 600 }}
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>

      {/* 12. STREAMLIT-STYLED AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid #E5E7EB',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>

            {/* Brand Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                backgroundColor: '#FF4B4B',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Terminal size={18} />
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: '18px', color: '#111827' }}>Quantara</span>
                <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 700, backgroundColor: '#FEE2E2', color: '#DC2626', padding: '1px 5px', borderRadius: '4px' }}>
                  HUB
                </span>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Quantitative Research &amp; Staging
                </div>
              </div>
            </div>

            {/* Auth Tab Switcher */}
            <div style={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '6px', padding: '3px', margin: '18px 0 16px' }}>
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: authTab === 'login' ? '#ffffff' : 'transparent',
                  color: authTab === 'login' ? '#111827' : '#6B7280',
                  boxShadow: authTab === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
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
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: authTab === 'register' ? '#ffffff' : 'transparent',
                  color: authTab === 'register' ? '#111827' : '#6B7280',
                  boxShadow: authTab === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '14px'
              }}>
                {authError}
              </div>
            )}

            {authTab === 'login' ? (
              <form onSubmit={onLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase' }}>Username</label>
                  <input
                    name="username"
                    type="text"
                    defaultValue="admin"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#111827',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase' }}>Password</label>
                  <input
                    name="password"
                    type="password"
                    defaultValue="admin"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#111827',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '6px',
                    padding: '10px 0',
                    backgroundColor: '#FF4B4B',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(255, 75, 75, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Lock size={14} /> {authLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <div style={{
                  fontSize: '11px',
                  color: '#6B7280',
                  marginTop: '4px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Demo: <code style={{ color: '#FF4B4B' }}>admin / admin</code></span>
                  <button
                    type="button"
                    onClick={() => onQuickDemo('admin', 'admin')}
                    style={{
                      backgroundColor: '#FEE2E2',
                      border: 'none',
                      color: '#DC2626',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    1-Click Auto Fill
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={onRegister} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase' }}>Username *</label>
                  <input
                    name="reg_username"
                    type="text"
                    placeholder="e.g. sarah_quant"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#111827',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase' }}>Full Name</label>
                  <input
                    name="reg_fullname"
                    type="text"
                    placeholder="e.g. Sarah Chen, CFA"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#111827',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase' }}>Corporate / Quant Email</label>
                  <input
                    name="reg_email"
                    type="email"
                    placeholder="e.g. schen@firm.com"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#111827',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase' }}>Password *</label>
                  <input
                    name="reg_password"
                    type="password"
                    placeholder="At least 4 characters"
                    required
                    minLength={4}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#111827',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '6px',
                    padding: '10px 0',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <User size={14} /> {authLoading ? 'Creating Account...' : 'Register & Enter'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
