import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const WorkerRegister: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [service, setService] = useState('Electrical');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('3');
  const [serviceArea, setServiceArea] = useState('Chennai');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/worker/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          confirmPassword,
          service,
          specialization: specialization.trim(),
          experience: Number(experience),
          serviceArea: serviceArea.trim(),
          bio: bio.trim()
        })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('mistro_worker_token', data.token);
        localStorage.setItem('mistro_worker_info', JSON.stringify(data.user));
        if (data.provider) {
          localStorage.setItem('mistro_provider_info', JSON.stringify(data.provider));
        }
        setSuccessMsg(true);
      } else {
        setErrorMsg(data.error || 'Failed to create worker account');
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
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '650px',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <img src="/mistro logo.png" alt="MISTRO Logo" style={{ width: '45px', height: '45px' }} />
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>MISTRO</span>
          </Link>
          <span style={{
            display: 'inline-block',
            background: 'rgba(249, 115, 22, 0.15)',
            color: '#F97316',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            marginLeft: '10px'
          }}>PARTNER PORTAL</span>
          <h2 style={{ color: '#fff', marginTop: '15px', fontSize: '24px', fontWeight: 700 }}>Become a MISTRO Partner</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>Join India's smart home service marketplace & receive instant job requests</p>
        </div>

        {successMsg ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{
              width: '65px',
              height: '65px',
              background: '#22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              margin: '0 auto 20px',
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)'
            }}>✓</div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px' }}>Welcome to MISTRO Partners!</h3>
            <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '25px', lineHeight: 1.6 }}>
              Your professional profile has been created successfully. You can now toggle your availability and receive incoming customer requests.
            </p>
            <button
              onClick={() => navigate('/worker/dashboard')}
              className="btn-accent"
              style={{
                padding: '14px 35px',
                borderRadius: '30px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 5px 20px rgba(249, 115, 22, 0.3)'
              }}
            >
              Go to Worker Dashboard
            </button>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                marginBottom: '25px',
                textAlign: 'center'
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Row 1: Name & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <div>
                  <label htmlFor="reg-name" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Full Name *</label>
                  <input
                    type="text"
                    id="reg-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ramesh Kumar"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Email Address *</label>
                  <input
                    type="email"
                    id="reg-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@example.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Phone & Service Category */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <div>
                  <label htmlFor="reg-phone" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Phone Number *</label>
                  <input
                    type="tel"
                    id="reg-phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="reg-service" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Primary Service Category *</label>
                  <select
                    id="reg-service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: '#0f172a',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="Electrical">⚡ Electrical</option>
                    <option value="Plumbing">🔧 Plumbing</option>
                    <option value="Carpentry">🪚 Carpentry</option>
                    <option value="Cleaning">🧹 Cleaning</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Specialization & Experience */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <div>
                  <label htmlFor="reg-spec" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Skills & Specialization</label>
                  <input
                    type="text"
                    id="reg-spec"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="Wiring, breaker repair, appliance installation"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="reg-exp" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Years of Experience</label>
                  <input
                    type="number"
                    id="reg-exp"
                    min="1"
                    max="40"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Row 4: Service Area & Password */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <div>
                  <label htmlFor="reg-area" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Service Area / City</label>
                  <input
                    type="text"
                    id="reg-area"
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    placeholder="Chennai"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Password *</label>
                  <input
                    type="password"
                    id="reg-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Row 5: Confirm Password */}
              <div>
                <label htmlFor="reg-confirm" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Confirm Password *</label>
                <input
                  type="password"
                  id="reg-confirm"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="reg-bio" style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Short Professional Bio</label>
                <textarea
                  id="reg-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Briefly describe your work background, toolset, or guarantees..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-accent"
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '30px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  border: 'none',
                  color: '#fff',
                  boxShadow: '0 5px 20px rgba(249, 115, 22, 0.3)',
                  marginTop: '10px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Registering Partner Profile...' : 'Complete Partner Registration'}
              </button>
            </form>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', color: '#94a3b8' }}>
          Already a registered partner?{' '}
          <Link to="/worker/login" style={{ color: '#F97316', fontWeight: 600, textDecoration: 'none' }}>
            Worker Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WorkerRegister;
