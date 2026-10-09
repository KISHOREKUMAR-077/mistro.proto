import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login: React.FC = () => {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('mistro_user_token', data.token);
        localStorage.setItem('mistro_user_info', JSON.stringify(data.user));
        navigate('/');
      } else {
        setErrorMsg(data.error || 'Invalid credentials');
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #0f172a, #020617)',
      fontFamily: "'Poppins', sans-serif",
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
            <span style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '1px'
            }}>MISTRO</span>
          </Link>
          <h2 style={{ color: '#fff', marginTop: '20px', fontSize: '22px', fontWeight: 600 }}>Welcome Back</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>Sign in to continue to MISTRO</p>
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
            <label htmlFor="login-email" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>Email Address</label>
            <input
              type="email"
              id="login-email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label htmlFor="login-password" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>Password</label>
            <input
              type="password"
              id="login-password"
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
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-accent" style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: '0.3s',
            border: 'none',
            color: '#fff',
            opacity: loading ? 0.7 : 1
          }}>{loading ? 'Signing In...' : 'Sign In'}</button>
        </form>

        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '25px' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#F97316', fontWeight: 600, textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
