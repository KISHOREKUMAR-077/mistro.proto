import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface ProviderData {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  specialization: string;
  experience: number;
  serviceArea: string;
  rating: number;
  totalJobs: number;
  availability: 'Available' | 'Offline';
  badge: string;
  bio: string;
  profilePhoto?: string;
}

interface RequestItem {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  service: string;
  selectedProviderId?: string;
  selectedProviderName?: string;
  date: string;
  slot: string;
  address: string;
  problem?: string;
  urgency: 'Emergency' | 'Standard';
  distanceKm: number;
  matchScore: number;
  createdAt: string;
}

interface JobItem {
  id: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  slot: string;
  address: string;
  status: string;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

const WorkerDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Navigation tab states
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'active' | 'completed' | 'profile'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Data states
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [availability, setAvailability] = useState<'Available' | 'Offline'>('Available');
  const [incomingRequests, setIncomingRequests] = useState<RequestItem[]>([]);
  const [activeJobs, setActiveJobs] = useState<JobItem[]>([]);
  const [completedJobs, setCompletedJobs] = useState<JobItem[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);

  // UI / Notification / Rejection Modal states
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [prevRequestCount, setPrevRequestCount] = useState<number>(0);
  const [rejectModalBookingId, setRejectModalBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Schedule conflict');

  // Profile Edit states
  const [editPhone, setEditPhone] = useState('');
  const [editSpec, setEditSpec] = useState('');
  const [editExp, setEditExp] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editBio, setEditBio] = useState('');

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // 1. Initial auth check & initial data load
  useEffect(() => {
    const token = localStorage.getItem('mistro_worker_token');
    if (!token) {
      navigate('/worker/login');
      return;
    }

    fetchDashboardData(true);
  }, []);

  // 2. Real-time polling every 5 seconds for incoming requests & status changes
  useEffect(() => {
    const token = localStorage.getItem('mistro_worker_token');
    if (!token) return;

    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [prevRequestCount]);

  const fetchDashboardData = async (isInitial = false) => {
    const token = localStorage.getItem('mistro_worker_token');
    if (!token) return;

    try {
      const res = await fetch('/api/worker/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('mistro_worker_token');
        navigate('/worker/login');
        return;
      }

      const data = await res.json();

      if (data.success) {
        setProvider(data.provider);
        setAvailability(data.availability || 'Available');
        setIncomingRequests(data.incomingRequests || []);
        setActiveJobs(data.activeJobs || []);
        setCompletedJobs(data.completedJobs || []);
        setTotalEarnings(data.totalEarnings || 0);

        if (isInitial && data.provider) {
          setEditPhone(data.provider.phone || '');
          setEditSpec(data.provider.specialization || '');
          setEditExp(String(data.provider.experience || ''));
          setEditArea(data.provider.serviceArea || '');
          setEditBio(data.provider.bio || '');
        }

        const newCount = (data.incomingRequests || []).length;
        if (!isInitial && newCount > prevRequestCount && prevRequestCount >= 0) {
          showToast(`🔔 New ${data.provider?.service || 'Service'} request received directly for you!`);
        }
        setPrevRequestCount(newCount);
      }
    } catch (err) {
      console.error("Dashboard polling error:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Toggle Availability (Available <-> Offline)
  const handleToggleAvailability = async () => {
    const token = localStorage.getItem('mistro_worker_token');
    if (!token) return;

    const newStatus = availability === 'Available' ? 'Offline' : 'Available';

    try {
      const res = await fetch('/api/worker/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ availability: newStatus })
      });

      const data = await res.json();
      if (data.success) {
        setAvailability(data.availability);
        showToast(`Status updated to: ${data.availability === 'Available' ? '🟢 Available' : '🔴 Offline'}`);
        fetchDashboardData(false);
      } else {
        showToast(data.error || 'Failed to update availability', true);
      }
    } catch (err) {
      showToast('Network error updating availability', true);
    }
  };

  // Accept incoming request
  const handleAcceptRequest = async (bookingId: string) => {
    const token = localStorage.getItem('mistro_worker_token');
    if (!token) return;

    setActionLoading(bookingId);

    try {
      const res = await fetch(`/api/worker/bookings/${bookingId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        showToast('✓ Request Accepted! Job moved to Active Jobs.');
        setActiveTab('active');
        await fetchDashboardData(false);
      } else {
        showToast(data.error || 'Request no longer available.', true);
        await fetchDashboardData(false);
      }
    } catch (err) {
      showToast('Error accepting request', true);
    } finally {
      setActionLoading(null);
    }
  };

  // Confirm rejection with reason
  const handleConfirmReject = async () => {
    if (!rejectModalBookingId) return;
    const token = localStorage.getItem('mistro_worker_token');
    if (!token) return;

    const bookingId = rejectModalBookingId;
    setActionLoading(bookingId);

    try {
      const res = await fetch(`/api/worker/bookings/${bookingId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Request rejected. Customer notified.');
        setIncomingRequests(prev => prev.filter(r => r.bookingId !== bookingId));
        setRejectModalBookingId(null);
      } else {
        showToast(data.error || 'Failed to reject request', true);
      }
    } catch (err) {
      showToast('Error rejecting request', true);
    } finally {
      setActionLoading(null);
    }
  };

  // Progress Active Job Status
  const handleUpdateJobStatus = async (bookingId: string, nextStatus: string) => {
    const token = localStorage.getItem('mistro_worker_token');
    if (!token) return;

    setActionLoading(bookingId);

    try {
      const res = await fetch(`/api/worker/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Job status updated: ${nextStatus}`);
        if (nextStatus === 'Completed') {
          setActiveTab('completed');
        }
        await fetchDashboardData(false);
      } else {
        showToast(data.error || 'Failed to update job status', true);
      }
    } catch (err) {
      showToast('Error updating status', true);
    } finally {
      setActionLoading(null);
    }
  };

  // Update Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('mistro_worker_token');
    if (!token) return;

    try {
      const res = await fetch('/api/worker/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: editPhone,
          specialization: editSpec,
          experience: Number(editExp),
          serviceArea: editArea,
          bio: editBio
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('✓ Partner profile updated successfully!');
        setProvider(data.provider);
      } else {
        showToast(data.error || 'Failed to update profile', true);
      }
    } catch (err) {
      showToast('Error saving profile', true);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('mistro_worker_token');
    localStorage.removeItem('mistro_worker_info');
    localStorage.removeItem('mistro_provider_info');
    navigate('/worker/login');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/mistro logo.png" alt="MISTRO" style={{ width: '50px', marginBottom: '15px' }} />
          <h3>Loading MISTRO Partner Dashboard...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, #1e293b, #0f172a, #020617)',
      fontFamily: "'Poppins', sans-serif",
      color: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '25px',
          right: '25px',
          background: toastMsg.isError ? '#ef4444' : '#22c55e',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '30px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '15px 30px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer'
            }}
            className="mobile-menu-btn"
          >
            ☰
          </button>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/mistro logo.png" alt="MISTRO" style={{ width: '38px', height: '38px' }} />
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>MISTRO</span>
          </Link>
          <span style={{
            background: 'rgba(249, 115, 22, 0.15)',
            color: '#F97316',
            padding: '3px 10px',
            borderRadius: '15px',
            fontSize: '11px',
            fontWeight: 700
          }}>PARTNER APP</span>
        </div>

        {/* Right Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Availability Toggle */}
          <button
            onClick={handleToggleAvailability}
            style={{
              background: availability === 'Available' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: availability === 'Available' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              color: availability === 'Available' ? '#4ade80' : '#f87171',
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: availability === 'Available' ? '#22c55e' : '#ef4444',
              boxShadow: availability === 'Available' ? '0 0 8px #22c55e' : 'none'
            }}></span>
            {availability === 'Available' ? '🟢 Available' : '🔴 Offline'}
          </button>

          {/* Notification bell badge */}
          <div
            onClick={() => setActiveTab('requests')}
            style={{
              position: 'relative',
              cursor: 'pointer',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: '18px' }}>🔔</span>
            {incomingRequests.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#F97316',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)'
              }}>
                {incomingRequests.length}
              </span>
            )}
          </div>

          {/* User Profile avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E3A8A, #F97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '15px'
            }}>
              {provider?.name ? provider.name.charAt(0).toUpperCase() : 'W'}
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD BODY LAYOUT */}
      <div style={{ flex: 1, display: 'flex' }}>
        
        {/* SIDEBAR NAVIGATION */}
        <aside style={{
          width: '240px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '25px 15px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }} className={`sidebar-container ${mobileMenuOpen ? 'open' : ''}`}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '1px', padding: '0 12px 10px' }}>
              MISTRO PARTNER
            </div>

            <button
              onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'overview' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                color: activeTab === 'overview' ? '#F97316' : '#94a3b8',
                fontWeight: activeTab === 'overview' ? 600 : 400,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>📊</span> Dashboard
            </button>

            <button
              onClick={() => { setActiveTab('requests'); setMobileMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'requests' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                color: activeTab === 'requests' ? '#F97316' : '#94a3b8',
                fontWeight: activeTab === 'requests' ? 600 : 400,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>⚡</span> Booking Requests
              </span>
              {incomingRequests.length > 0 && (
                <span style={{
                  background: '#F97316',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>{incomingRequests.length}</span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('active'); setMobileMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'active' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                color: activeTab === 'active' ? '#F97316' : '#94a3b8',
                fontWeight: activeTab === 'active' ? 600 : 400,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>🔧</span> Active Jobs
              </span>
              {activeJobs.length > 0 && (
                <span style={{
                  background: '#3b82f6',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>{activeJobs.length}</span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('completed'); setMobileMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'completed' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                color: activeTab === 'completed' ? '#F97316' : '#94a3b8',
                fontWeight: activeTab === 'completed' ? 600 : 400,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>✅</span> Completed Jobs
            </button>

            <button
              onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'profile' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                color: activeTab === 'profile' ? '#F97316' : '#94a3b8',
                fontWeight: activeTab === 'profile' ? 600 : 400,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>👤</span> My Profile
            </button>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: '30px'
            }}
          >
            <span>🚪</span> Logout
          </button>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          
          {/* Welcome Banner */}
          <div style={{ marginBottom: '25px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Welcome, {provider?.name || 'Partner'} 👋
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
              Category: <span style={{ color: '#F97316', fontWeight: 600 }}>{provider?.service}</span> | Experience: {provider?.experience || 5} Years | Rating: ⭐ {provider?.rating || '5.0'}
            </p>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* STATS CARDS GRID */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, marginBottom: '8px' }}>⭐ Rating</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#fbbf24' }}>{provider?.rating ? provider.rating.toFixed(1) : '5.0'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Overall customer score</div>
                </div>

                <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, marginBottom: '8px' }}>Completed Jobs</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#4ade80' }}>{completedJobs.length || provider?.totalJobs || 0}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Successfully delivered</div>
                </div>

                <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, marginBottom: '8px' }}>Pending Requests</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#F97316' }}>{incomingRequests.length}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Awaiting your response</div>
                </div>

                <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, marginBottom: '8px' }}>Active Jobs</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#60a5fa' }}>{activeJobs.length}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>In progress pipeline</div>
                </div>
              </div>

              {/* QUICK SECTION: INCOMING REQUESTS PREVIEW */}
              <div className="glass-card" style={{ padding: '25px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚡</span> Direct Booking Requests
                  </h3>
                  <button onClick={() => setActiveTab('requests')} style={{ background: 'transparent', border: 'none', color: '#F97316', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                    View All ({incomingRequests.length}) →
                  </button>
                </div>

                {incomingRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8' }}>
                    <p style={{ fontSize: '15px', margin: 0 }}>No pending booking requests right now.</p>
                    <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>When a customer chooses your profile and books, requests will notify you in real-time.</small>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {incomingRequests.slice(0, 2).map((req) => (
                      <RequestCard
                        key={req.bookingId}
                        req={req}
                        actionLoading={actionLoading}
                        onAccept={handleAcceptRequest}
                        onOpenRejectModal={(id) => setRejectModalBookingId(id)}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: INCOMING REQUESTS */}
          {activeTab === 'requests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Booking Requests</h2>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{incomingRequests.length} Pending</span>
              </div>

              {incomingRequests.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px', borderRadius: '16px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '40px', marginBottom: '15px' }}>📭</div>
                  <h3>No pending booking requests</h3>
                  <p style={{ fontSize: '14px', maxWidth: '400px', margin: '8px auto 0' }}>
                    Customer requests specifically sent to your profile will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {incomingRequests.map((req) => (
                    <RequestCard
                      key={req.bookingId}
                      req={req}
                      actionLoading={actionLoading}
                      onAccept={handleAcceptRequest}
                      onOpenRejectModal={(id) => setRejectModalBookingId(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE JOBS */}
          {activeTab === 'active' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Active Jobs</h2>

              {activeJobs.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px', borderRadius: '16px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔧</div>
                  <h3>No active jobs right now</h3>
                  <p style={{ fontSize: '14px', margin: '8px 0 0' }}>Accept incoming requests to move jobs into active pipeline.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {activeJobs.map(job => (
                    <ActiveJobCard
                      key={job.id}
                      job={job}
                      actionLoading={actionLoading}
                      onUpdateStatus={handleUpdateJobStatus}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLETED JOBS */}
          {activeTab === 'completed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Completed Jobs</h2>
                <span style={{ fontSize: '14px', color: '#4ade80', fontWeight: 600 }}>Total: {completedJobs.length}</span>
              </div>

              {completedJobs.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px', borderRadius: '16px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '40px', marginBottom: '15px' }}>📋</div>
                  <h3>No completed jobs history yet</h3>
                  <p style={{ fontSize: '14px', margin: '8px 0 0' }}>Finished service orders will be archived here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {completedJobs.map(job => (
                    <div key={job.id} className="glass-card" style={{ padding: '20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span style={{ background: '#22c55e', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>COMPLETED</span>
                          <span style={{ fontWeight: 600, fontSize: '16px' }}>{job.name}</span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>(ID: {job.id.slice(-6)})</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#cbd5e1' }}>Service: {job.service} | Address: {job.address}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Date: {job.date} ({job.slot})</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#facc15' }}>
                          ₹{job.service.toLowerCase().includes('clean') ? 599 : job.service.toLowerCase().includes('elect') ? 299 : 349}
                        </div>
                        <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '2px' }}>✓ Verified Payment</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROFILE EDIT */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '600px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>My Partner Profile</h2>
              
              <div className="glass-card" style={{ padding: '30px', borderRadius: '16px' }}>
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Full Name</label>
                    <input
                      type="text"
                      disabled
                      value={provider?.name || ''}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Primary Service Category</label>
                    <input
                      type="text"
                      disabled
                      value={provider?.service || ''}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-phone" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Phone Number</label>
                    <input
                      type="tel"
                      id="prof-phone"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-spec" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Specialization</label>
                    <input
                      type="text"
                      id="prof-spec"
                      value={editSpec}
                      onChange={e => setEditSpec(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-exp" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Years of Experience</label>
                    <input
                      type="number"
                      id="prof-exp"
                      value={editExp}
                      onChange={e => setEditExp(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-area" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Service Area</label>
                    <input
                      type="text"
                      id="prof-area"
                      value={editArea}
                      onChange={e => setEditArea(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="prof-bio" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Bio</label>
                    <textarea
                      id="prof-bio"
                      rows={3}
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-accent"
                    style={{
                      padding: '14px',
                      borderRadius: '30px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      color: '#fff',
                      boxShadow: '0 5px 20px rgba(249, 115, 22, 0.3)',
                      marginTop: '10px'
                    }}
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* REJECTION REASON MODAL */}
      {rejectModalBookingId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '450px',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '20px', color: '#f87171' }}>
              Reject Booking Request
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '20px' }}>
              Please select a reason so the customer can choose a replacement professional:
            </p>

            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '25px'
              }}
            >
              <option value="Schedule conflict" style={{ background: '#0f172a' }}>Schedule conflict</option>
              <option value="Worker unavailable" style={{ background: '#0f172a' }}>Worker unavailable</option>
              <option value="Outside service area" style={{ background: '#0f172a' }}>Outside service area</option>
              <option value="Tools / parts unavailable" style={{ background: '#0f172a' }}>Tools / parts unavailable</option>
            </select>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setRejectModalBookingId(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '25px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmReject}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '25px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

/* ==========================================================
   SUB-COMPONENT: INCOMING REQUEST CARD
   ========================================================== */
interface RequestCardProps {
  req: RequestItem;
  actionLoading: string | null;
  onAccept: (bookingId: string) => void;
  onOpenRejectModal: (bookingId: string) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ req, actionLoading, onAccept, onOpenRejectModal }) => {
  const isLoading = actionLoading === req.bookingId;

  return (
    <div className="glass-card" style={{
      padding: '24px',
      borderRadius: '16px',
      border: '1px solid rgba(249, 115, 22, 0.3)',
      background: 'rgba(249, 115, 22, 0.03)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: req.urgency === 'Emergency' ? '#ef4444' : '#F97316',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '12px'
          }}>
            {req.urgency === 'Emergency' ? '🚨 EMERGENCY REQUEST' : '🔔 NEW BOOKING REQUEST'}
          </span>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>ID: #{req.bookingId.slice(-6)}</span>
        </div>
        <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: 600 }}>
          ⏳ Waiting for your response
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>CUSTOMER</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{req.customerName}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Phone: {req.customerPhone}</div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>SERVICE</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#F97316', marginTop: '2px' }}>{req.service}</div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>SCHEDULE</div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff', marginTop: '2px' }}>{req.date || 'Today'}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{req.slot}</div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>LOCATION</div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px', wordBreak: 'break-word' }}>{req.address}</div>
        </div>
      </div>

      {req.problem && (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Problem Note: </span>
          <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{req.problem}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => onAccept(req.bookingId)}
          disabled={isLoading}
          className="btn-accent"
          style={{
            flex: 2,
            padding: '13px 24px',
            borderRadius: '25px',
            fontSize: '15px',
            fontWeight: 700,
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Accepting...' : 'ACCEPT BOOKING'}
        </button>

        <button
          onClick={() => onOpenRejectModal(req.bookingId)}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '13px 20px',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          REJECT
        </button>
      </div>
    </div>
  );
};

/* ==========================================================
   SUB-COMPONENT: ACTIVE JOB CARD
   ========================================================== */
interface ActiveJobCardProps {
  job: JobItem;
  actionLoading: string | null;
  onUpdateStatus: (bookingId: string, status: string) => void;
}

const ActiveJobCard: React.FC<ActiveJobCardProps> = ({ job, actionLoading, onUpdateStatus }) => {
  const isLoading = actionLoading === job.id;

  let nextActionLabel = 'ON THE WAY';
  let nextStatus = 'On the Way';

  if (job.status === 'Accepted' || job.status === 'Assigned') {
    nextActionLabel = 'ON THE WAY';
    nextStatus = 'On the Way';
  } else if (job.status === 'On the Way') {
    nextActionLabel = 'ARRIVED';
    nextStatus = 'Arrived';
  } else if (job.status === 'Arrived') {
    nextActionLabel = 'START SERVICE';
    nextStatus = 'In Progress';
  } else if (job.status === 'In Progress') {
    nextActionLabel = 'COMPLETE JOB';
    nextStatus = 'Completed';
  }

  return (
    <div className="glass-card" style={{
      padding: '24px',
      borderRadius: '16px',
      border: '1px solid rgba(96, 165, 250, 0.3)',
      background: 'rgba(30, 58, 138, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: '#3b82f6',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '12px'
          }}>
            STATUS: {job.status.toUpperCase()}
          </span>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>ID: #{job.id.slice(-6)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>CUSTOMER & PHONE</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{job.name}</div>
          <div style={{ fontSize: '13px', color: '#60a5fa', marginTop: '2px' }}>
            <a href={`tel:${job.phone}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>📞 {job.phone}</a>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>SERVICE</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>{job.service}</div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>SCHEDULE</div>
          <div style={{ fontSize: '14px', color: '#fff', marginTop: '2px' }}>{job.date}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{job.slot}</div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>LOCATION</div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>{job.address}</div>
        </div>
      </div>

      {/* Status Transition Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
        <button
          onClick={() => onUpdateStatus(job.id, nextStatus)}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '13px 20px',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            background: job.status === 'In Progress' ? '#22c55e' : '#F97316',
            color: '#fff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Updating Status...' : `[ ${nextActionLabel} ]`}
        </button>
      </div>
    </div>
  );
};

export default WorkerDashboard;
