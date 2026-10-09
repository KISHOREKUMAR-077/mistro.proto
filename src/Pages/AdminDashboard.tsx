import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface PlatformStats {
  totalBookings: number;
  completedBookings: number;
  totalProviders: number;
  totalUsers: number;
  totalRevenue?: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState<string>('admin');
  const [passwordInput, setPasswordInput] = useState<string>('mistrosecret2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Tab & Data states
  const [activeTab, setActiveTab] = useState<'stats' | 'workers' | 'bookings' | 'payments' | 'services'>('stats');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('mistro_admin_token');
    if (token) {
      setAdminToken(token);
      fetchAdminData(token);
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('mistro_admin_token', data.token);
        setAdminToken(data.token);
        fetchAdminData(data.token);
      } else {
        setLoginError(data.error || 'Invalid admin credentials');
      }
    } catch (err) {
      setLoginError('Network error connecting to MISTRO server');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchAdminData = async (token: string) => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Stats
      const statsRes = await fetch('/api/stats', { headers });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Fetch Providers/Workers
      const workersRes = await fetch('/api/providers');
      const workersData = await workersRes.json();
      if (workersData.success) setWorkers(workersData.providers || []);

      // Fetch All Bookings
      const bookingsRes = await fetch('/api/bookings', { headers });
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) setBookings(bookingsData.bookings || []);

      // Fetch Services Catalog
      const servicesRes = await fetch('/api/services');
      const servicesData = await servicesRes.json();
      if (servicesData.success) setServices(servicesData.services || []);

    } catch (err) {
      console.error('Failed to load admin dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWorkerApproval = async (workerId: string, currentStatus: string) => {
    if (!adminToken) return;
    const newStatus = currentStatus === 'Available' ? 'Offline' : 'Available';

    try {
      const res = await fetch(`/api/providers/${workerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: newStatus, availability: newStatus })
      });

      const data = await res.json();
      if (data.success) {
        setActionMsg(`Worker status updated to ${newStatus}`);
        setTimeout(() => setActionMsg(null), 3000);
        fetchAdminData(adminToken);
      }
    } catch (err) {
      console.error('Failed to toggle worker approval:', err);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('mistro_admin_token');
    setAdminToken(null);
  };

  // 1. ADMIN LOGIN FORM IF NOT AUTHENTICATED
  if (!adminToken) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #0f172a, #020617)',
        fontFamily: "'Poppins', sans-serif",
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 30px',
          borderRadius: '20px',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          textAlign: 'center'
        }}>
          <img src="/mistro logo.png" alt="MISTRO" style={{ width: '50px', marginBottom: '15px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 5px' }}>MISTRO Admin Control</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '25px' }}>Management Portal Access</p>

          {loginError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              required
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              placeholder="Admin Username"
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
            <input
              type="password"
              required
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="Admin Password"
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn-accent"
              style={{ padding: '14px', borderRadius: '25px', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
            >
              {isLoggingIn ? 'Authenticating...' : 'Access Admin Dashboard'}
            </button>
          </form>
          <div style={{ marginTop: '20px' }}>
            <Link to="/" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none' }}>← Back to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN DASHBOARD VIEW
  return (
    <div style={{ minHeight: '100vh', background: '#090d16', fontFamily: "'Poppins', sans-serif", color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '15px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/mistro logo.png" alt="MISTRO" style={{ width: '36px' }} />
          <span style={{ fontSize: '20px', fontWeight: 800 }}>MISTRO ADMIN PORTAL</span>
        </div>
        <button onClick={handleAdminLogout} style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Log Out Admin
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex' }}>
        {/* Navigation Sidebar */}
        <aside style={{ width: '220px', background: '#0b1120', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '25px 15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setActiveTab('stats')} style={{ background: activeTab === 'stats' ? 'rgba(249,115,22,0.15)' : 'transparent', color: activeTab === 'stats' ? '#F97316' : '#94a3b8', border: 'none', padding: '12px', borderRadius: '10px', textAlign: 'left', fontWeight: 600, cursor: 'pointer' }}>
            📊 Platform Overview
          </button>
          <button onClick={() => setActiveTab('workers')} style={{ background: activeTab === 'workers' ? 'rgba(249,115,22,0.15)' : 'transparent', color: activeTab === 'workers' ? '#F97316' : '#94a3b8', border: 'none', padding: '12px', borderRadius: '10px', textAlign: 'left', fontWeight: 600, cursor: 'pointer' }}>
            👷 Manage Workers ({workers.length})
          </button>
          <button onClick={() => setActiveTab('bookings')} style={{ background: activeTab === 'bookings' ? 'rgba(249,115,22,0.15)' : 'transparent', color: activeTab === 'bookings' ? '#F97316' : '#94a3b8', border: 'none', padding: '12px', borderRadius: '10px', textAlign: 'left', fontWeight: 600, cursor: 'pointer' }}>
            📋 Bookings History ({bookings.length})
          </button>
          <button onClick={() => setActiveTab('services')} style={{ background: activeTab === 'services' ? 'rgba(249,115,22,0.15)' : 'transparent', color: activeTab === 'services' ? '#F97316' : '#94a3b8', border: 'none', padding: '12px', borderRadius: '10px', textAlign: 'left', fontWeight: 600, cursor: 'pointer' }}>
            ⚡ Service Categories
          </button>
        </aside>

        {/* Main Workspace */}
        <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {actionMsg && (
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: '12px 20px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px' }}>
              ✓ {actionMsg}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>Platform Metrics & Health</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Total Registered Bookings</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#F97316', marginTop: '6px' }}>{stats?.totalBookings || bookings.length}</div>
                </div>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Completed Jobs</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#4ade80', marginTop: '6px' }}>{stats?.completedBookings || bookings.filter(b => b.status === 'Completed').length}</div>
                </div>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Active Partner Professionals</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#60a5fa', marginTop: '6px' }}>{stats?.totalProviders || workers.length}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workers' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>Registered Partner Professionals</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {workers.map(w => (
                  <div key={w.id} className="glass-card" style={{ padding: '20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>{w.name} <span style={{ fontSize: '13px', color: '#F97316' }}>({w.service})</span></div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Specialization: {w.specialization || w.badge} | Experience: {w.experience || 5} Yrs | Rating: ⭐ {w.rating || 5}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Phone: {w.phone} | Area: {w.serviceArea}</div>
                    </div>
                    <button onClick={() => handleToggleWorkerApproval(w.id, w.status)} style={{ background: w.status === 'Available' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: w.status === 'Available' ? '1px solid #22c55e' : '1px solid #ef4444', color: w.status === 'Available' ? '#4ade80' : '#f87171', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                      {w.status === 'Available' ? '🟢 Active / Suspend' : '🔴 Suspended / Activate'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>Platform Service Orders</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {bookings.map(b => (
                  <div key={b.id} className="glass-card" style={{ padding: '20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700 }}>#{b.id.slice(-6)} - {b.service} ({b.name})</div>
                      <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>Selected Worker: <span style={{ color: '#F97316' }}>{b.selectedProviderName || 'Generic Request'}</span> | Slot: {b.date} ({b.slot})</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Address: {b.address}</div>
                    </div>
                    <span style={{ background: b.status === 'Completed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)', color: b.status === 'Completed' ? '#4ade80' : '#F97316', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 700 }}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>Service Categories & Base Rates</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {services.map(s => (
                  <div key={s.id} className="glass-card" style={{ padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>{s.icon}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: '20px', color: '#F97316', fontWeight: 800, margin: '8px 0' }}>From ₹{s.startingPrice}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
