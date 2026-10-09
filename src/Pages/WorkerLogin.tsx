import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const WorkerLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/worker/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('mistro_worker_token', data.token);
        localStorage.setItem('mistro_worker_info', JSON.stringify(data.user));
        if (data.provider) {
          localStorage.setItem('mistro_provider_info', JSON.stringify(data.provider));
        }
        navigate('/worker/dashboard');
      } else {
        setErrorMsg(data.error || 'Invalid worker credentials');
      }
    } catch (err) {
      setErrorMsg('Network error connecting to MISTRO server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #0f172a, #020617)',
      fontFamily: "'Poppins', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px 30px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <img src="/mistro logo.png" alt="MISTRO Logo" style={{ width: '45px', height: '45px' }} />
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>MISTRO</span>
          </Link>
          <div style={{ marginTop: '12px' }}>
            <span style={{
              background: 'rgba(249, 115, 22, 0.15)',
              color: '#F97316',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600
            }}>PARTNER LOGIN</span>
          </div>
          <h2 style={{ color: '#fff', marginTop: '15px', fontSize: '22px', fontWeight: 600 }}>Worker Portal</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>Sign in to manage service requests & active jobs</p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="worker-email" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>Partner Email</label>
            <input
              type="email"
              id="worker-email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ramesh@example.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '15px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label htmlFor="worker-password" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>Password</label>
            <input
              type="password"
              id="worker-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '15px',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '30px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              color: '#fff',
              boxShadow: '0 5px 20px rgba(249, 115, 22, 0.3)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Partner'}
          </button>
        </form>

        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '25px' }}>
          Want to become a partner?{' '}
          <Link to="/worker/register" style={{ color: '#F97316', fontWeight: 600, textDecoration: 'none' }}>
            Register Profile
          </Link>
        </p>

        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link to="/login" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>
            Looking for Customer Login? Click Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WorkerLogin;
