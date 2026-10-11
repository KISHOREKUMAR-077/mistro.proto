import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const IntroGateway: React.FC = () => {
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleLaunchDemoWorker = async (workerId: string, name: string) => {
    setDemoLoading(workerId);
    setDemoError(null);
    try {
      const res = await fetch('/api/worker/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, name })
      });

      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('mistro_worker_token', data.token);
        localStorage.setItem('mistro_worker_info', JSON.stringify(data.user));
        if (data.provider) {
          localStorage.setItem('mistro_provider_info', JSON.stringify(data.provider));
        }
        navigate('/worker/dashboard');
      } else {
        setDemoError(data.error || 'Failed to launch demo worker dashboard');
      }
    } catch (err) {
      setDemoError('Network error connecting to MISTRO server');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top center, #1e1b4b 0%, #090d16 50%, #030712 100%)',
      fontFamily: "'Poppins', sans-serif",
      color: '#fff',
      padding: '20px 20px 60px'
    }}>
      {/* TOP HEADER / LOGO */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto 35px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px'
      }}>
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <img src="/mistro logo.png" alt="MISTRO" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '1.5px', color: '#fff' }}>
            MISTRO
          </span>
          <span style={{
            background: 'linear-gradient(135deg, #F97316, #EC4899)',
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.8px'
          }}>Gateway</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            🏠 Home
          </button>
          <button
            onClick={() => navigate('/booking')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              color: '#fff',
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            👤 Customer View
          </button>
          <button
            onClick={() => navigate('/worker/login')}
            style={{
              background: 'linear-gradient(135deg, #F97316, #ea580c)',
              border: 'none',
              color: '#fff',
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            🛠️ Worker View
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(249, 115, 22, 0.12)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          color: '#fb923c',
          padding: '6px 16px',
          borderRadius: '30px',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          ⚡ MISTRO Full-Stack Architecture
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 800,
          lineHeight: 1.2,
          margin: '0 0 14px',
          background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Choose Your Portal Experience
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#94a3b8',
          maxWidth: '680px',
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Experience the complete on-demand service marketplace. Choose whether you want to test as a <strong style={{ color: '#60a5fa' }}>Customer</strong> booking verified experts or as a <strong style={{ color: '#fb923c' }}>Service Professional</strong> accepting direct requests.
        </p>

        {demoError && (
          <div style={{
            marginTop: '20px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            display: 'inline-block'
          }}>
            ⚠️ {demoError}
          </div>
        )}
      </div>

      {/* DUAL SPLIT CARDS */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 50px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '30px'
      }}>
        {/* CARD 1: CUSTOMER EXPERIENCE */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '24px',
          padding: '36px 30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 20px 40px -15px rgba(59, 130, 246, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Light */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60a5fa',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px'
              }}>
                👤 Customer View
              </span>
              <span style={{ fontSize: '28px' }}>🏠</span>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 10px', color: '#fff' }}>
              Book & Track Services
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              Select a category, request a verified technician directly, watch real-time dispatch updates, make contactless UPI payments, and leave 5-star reviews.
            </p>

            {/* FEATURES LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
                <span style={{ color: '#38bdf8' }}>✓</span>
                <span><strong>Targeted Worker Request:</strong> Choose Ramesh Kumar, Karthik Raja, etc.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
                <span style={{ color: '#38bdf8' }}>✓</span>
                <span><strong>Live GPS Tracker:</strong> Automatic status sync every 3s as worker moves.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
                <span style={{ color: '#38bdf8' }}>✓</span>
                <span><strong>Itemized Bill & UPI:</strong> Transparent pricing card after service completion.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
                <span style={{ color: '#38bdf8' }}>✓</span>
                <span><strong>Swiggy/Zomato Feedback:</strong> 5-Star ratings & compliment pills saved in MongoDB.</span>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={() => navigate('/booking')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#fff',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
                marginBottom: '12px',
                transition: 'transform 0.2s ease'
              }}
            >
              🚀 Launch Customer Booking →
            </button>
            <button
              onClick={() => navigate('/booking?service=Electrical')}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#93c5fd',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '11px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⚡ Shortcut: Book Ramesh Kumar (Electrician)
            </button>
          </div>
        </div>

        {/* CARD 2: WORKER PARTNER EXPERIENCE */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.35)',
          borderRadius: '24px',
          padding: '36px 30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 20px 40px -15px rgba(249, 115, 22, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Light */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.3) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{
                background: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                color: '#fb923c',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px'
              }}>
                🛠️ Professional Partner View
              </span>
              <span style={{ fontSize: '28px' }}>⚡</span>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 10px', color: '#fff' }}>
              Accept Requests & Dispatch
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              Receive targeted booking alerts with sound chimes, accept jobs, navigate with Google Maps GPS turn-by-turn directions, and advance job stages.
            </p>

            {/* FEATURES LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
                <span style={{ color: '#fb923c' }}>✓</span>
                <span><strong>Targeted Notification:</strong> Only the requested worker receives the alert.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
                <span style={{ color: '#fb923c' }}>✓</span>
                <span><strong>Google Maps Navigation:</strong> 1-Click turn-by-turn GPS directions link.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
                <span style={{ color: '#fb923c' }}>✓</span>
                <span><strong>Live Job Controls:</strong> [On the Way] → [Arrived] → [Start] → [Complete].</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
                <span style={{ color: '#fb923c' }}>✓</span>
                <span><strong>Direct Customer Call:</strong> In-app telephone dialer button on card.</span>
              </div>
            </div>

            {/* 1-CLICK DEMO TEST LAUNCHERS */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '12px', color: '#fb923c', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                ⚡ 1-Click Test Login as Worker:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  disabled={demoLoading !== null}
                  onClick={() => handleLaunchDemoWorker('prov-101', 'Ramesh Kumar')}
                  style={{
                    background: 'rgba(249, 115, 22, 0.15)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    color: '#fdba74',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>⚡ Ramesh Kumar (Electrician)</span>
                  <span>{demoLoading === 'prov-101' ? 'Launching...' : 'Open Dashboard →'}</span>
                </button>

                <button
                  disabled={demoLoading !== null}
                  onClick={() => handleLaunchDemoWorker('prov-201', 'Karthik Raja')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>⚡ Karthik Raja (Plumber)</span>
                  <span>{demoLoading === 'prov-201' ? 'Launching...' : 'Open Dashboard →'}</span>
                </button>

                <button
                  disabled={demoLoading !== null}
                  onClick={() => handleLaunchDemoWorker('prov-301', 'Murugan S')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>⚡ Murugan S (Carpenter)</span>
                  <span>{demoLoading === 'prov-301' ? 'Launching...' : 'Open Dashboard →'}</span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/worker/login')}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #F97316, #ea580c)',
                color: '#fff',
                border: 'none',
                padding: '14px 16px',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(249, 115, 22, 0.4)'
              }}
            >
              🔑 Worker Login
            </button>
            <button
              onClick={() => navigate('/worker/register')}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '14px 16px',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📝 Register Profile
            </button>
          </div>
        </div>
      </div>

      {/* TWO-WAY TESTING TUTORIAL GUIDE */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '30px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '22px' }}>💡</span>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
            How To Test Real-Time Communication (Swiggy/Zomato Model)
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
              STEP 1: OPEN TAB 1
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Book Ramesh Kumar</div>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              Open Customer view, select <strong>Electrical</strong>, pick <strong>Ramesh Kumar</strong>, and confirm your booking.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#fb923c', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
              STEP 2: OPEN TAB 2
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Launch Ramesh Dashboard</div>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              Click <strong>Launch Ramesh Kumar</strong> in a second tab. The dashboard immediately chimes with your incoming request.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
              STEP 3: ACCEPT & DISPATCH
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Customer Screen Updates</div>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              Ramesh clicks <strong>Accept Request</strong>. Tab 1 instantly updates to <strong>Accepted & Confirmed</strong> with live map directions!
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#f43f5e', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
              STEP 4: COMPLETE & RATE
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Itemized Bill & 5★ Review</div>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              Ramesh clicks <strong>Complete Job</strong>. Tab 1 shows Pay Now card. Pay ₹299 and submit a 5-star review to MongoDB!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroGateway;
