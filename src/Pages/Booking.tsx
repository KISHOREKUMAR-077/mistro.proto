import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import GoogleMapComponent from '../Components/GoogleMap.tsx';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface Provider {
  id: string;
  name: string;
  service: string;
  phone?: string;
  rating: number;
  totalJobs: number;
  status: string;
  availability?: string;
  badge?: string;
  specialization?: string;
  experience?: number;
  serviceArea?: string;
  bio?: string;
  skills?: string[];
  profilePhoto?: string;
}

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const searchLocation = useLocation();

  // Form states
  const [selectedService, setSelectedService] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState<string>('');
  
  // Worker Selection & Modal states
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState<boolean>(false);
  const [selectedWorker, setSelectedWorker] = useState<Provider | null>(null);
  const [profileModalWorker, setProfileModalWorker] = useState<Provider | null>(null);

  // Location states
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState<boolean>(false);
  
  // Submission & Tracking states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Pre-select service from URL query parameter on load & pre-fill logged in user
  useEffect(() => {
    const params = new URLSearchParams(searchLocation.search);
    const serviceParam = params.get('service');
    if (serviceParam) {
      const val = serviceParam.toLowerCase();
      if (val.includes('elect')) setSelectedService('Electrical');
      else if (val.includes('plumb')) setSelectedService('Plumbing');
      else if (val.includes('carp')) setSelectedService('Carpentry');
      else if (val.includes('clean')) setSelectedService('Cleaning');
    }

    const userInfoStr = localStorage.getItem('mistro_user_info');
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        if (userInfo && userInfo.name) {
          setName(userInfo.name);
        }
      } catch (err) {
        // ignore JSON parse error
      }
    }
  }, [searchLocation]);

  // Fetch providers whenever selected service changes
  useEffect(() => {
    if (!selectedService) {
      setProviders([]);
      setSelectedWorker(null);
      return;
    }

    setLoadingProviders(true);
    fetch(`/api/providers?service=${encodeURIComponent(selectedService)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProviders(data.providers || []);
        } else {
          setProviders([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch providers:', err);
        setProviders([]);
      })
      .finally(() => setLoadingProviders(false));
  }, [selectedService]);

  // Polling active booking status when a booking is created
  useEffect(() => {
    if (!createdBookingId || !submitSuccess) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/bookings/${createdBookingId}/track`);
        const data = await res.json();
        if (data.success && data.booking) {
          setActiveBooking(data.booking);
        }
      } catch (err) {
        console.error('Polling booking status error:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [createdBookingId, submitSuccess]);

  const showToast = (message: string, isError = false) => {
    setToastMessage({ text: message, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLocationConfirm = (location: LocationData) => {
    setLocationData(location);
    setIsLocationConfirmed(true);
  };

  const handleLocationReset = () => {
    setLocationData(null);
    setIsLocationConfirmed(false);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService) {
      showToast('Please select a service category.', true);
      return;
    }

    if (!selectedWorker) {
      showToast('Please choose a specific worker for your service request.', true);
      return;
    }

    if (!isLocationConfirmed || !locationData) {
      showToast('Please confirm your service location on the map.', true);
      return;
    }

    setIsSubmitting(true);

    const bookingPayload = {
      name: name.trim(),
      phone: phone.trim(),
      service: selectedService,
      selectedProviderId: selectedWorker.id,
      selectedProviderName: selectedWorker.name,
      date: bookingDate,
      slot: timeSlot,
      problem: problemDescription || `${selectedService} Service Request`,
      address: locationData.address,
      coordinates: {
        lat: locationData.lat,
        lng: locationData.lng
      }
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      const userToken = localStorage.getItem('mistro_user_token');
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify(bookingPayload)
      });

      const result = await response.json();

      if (result.success && result.booking) {
        setSubmitSuccess(true);
        setCreatedBookingId(result.booking.id);
        setActiveBooking(result.booking);
        sessionStorage.removeItem('mistro_selected_location');
      } else {
        showToast(result.error || 'Failed to confirm booking. Please try again.', true);
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      showToast('Network error connecting to MISTRO server. Please try again.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewWorker = () => {
    setSubmitSuccess(false);
    setCreatedBookingId(null);
    setActiveBooking(null);
    setSelectedWorker(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #0f172a, #020617)',
      fontFamily: "'Poppins', sans-serif",
      color: '#fff',
      paddingBottom: '60px'
    }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`mistro-toast active ${toastMessage.isError ? 'error' : ''}`} style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: toastMessage.isError ? '#ef4444' : '#22c55e',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          fontFamily: "'Inter', sans-serif"
        }}>
          <i className={`fas ${toastMessage.isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Navbar header */}
      <nav className="navbar scrolled" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" className="nav-logo-container" id="nav-logo">
          <img src="/mistro logo.png" className="nav-logo-img" alt="MISTRO Logo" />
          <span className="nav-logo-text">MISTRO</span>
        </Link>
        <div className="nav-actions">
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '30px', fontSize: '14px' }}>
            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> Back to Home
          </Link>
        </div>
      </nav>

      {/* Main booking view container */}
      <div className="section-container" style={{ maxWidth: '850px', marginTop: '40px', padding: '0 20px' }}>
        
        {submitSuccess && activeBooking ? (
          /* LIVE STATUS TRACKER VIEW */
          <div className="glass-card" style={{
            padding: '40px 30px',
            borderRadius: '16px',
            textAlign: 'center',
            border: activeBooking.status === 'Rejected' || activeBooking.workerResponse === 'Rejected'
              ? '1px solid rgba(239, 68, 68, 0.4)'
              : '1px solid rgba(249, 115, 22, 0.3)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.37)',
            animation: 'fadeInMap 0.6s ease-out'
          }}>
            {activeBooking.status === 'Rejected' || activeBooking.workerResponse === 'Rejected' ? (
              /* WORKER REJECTED STATE */
              <div>
                <div style={{
                  width: '70px',
                  height: '70px',
                  background: '#ef4444',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  margin: '0 auto 20px',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
                }}>✕</div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '10px', color: '#f87171' }}>
                  Professional Unavailable
                </h1>
                <p style={{ color: '#cbd5e1', fontSize: '15px', maxWidth: '520px', margin: '0 auto 25px', lineHeight: 1.6 }}>
                  {activeBooking.selectedProviderName || 'The selected worker'} is currently unavailable for your requested time slot ({activeBooking.rejectionReason || 'Schedule conflict'}).
                </p>

                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed rgba(239, 68, 68, 0.3)', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
                  <p style={{ margin: 0, color: '#fca5a5', fontSize: '14px' }}>
                    Don't worry! You can easily select another expert professional for your <strong>{activeBooking.service}</strong> request.
                  </p>
                </div>

                <button
                  onClick={handleResetForNewWorker}
                  className="btn-accent"
                  style={{
                    border: 'none',
                    padding: '14px 36px',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)'
                  }}
                >
                  <i className="fas fa-user-check" style={{ marginRight: '8px' }}></i> Choose Another Worker
                </button>
              </div>
            ) : (
              /* LIVE STATUS PROGRESS PIPELINE */
              <div>
                <div style={{
                  width: '70px',
                  height: '70px',
                  background: activeBooking.status === 'Completed' ? '#22c55e' : '#F97316',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  margin: '0 auto 20px',
                  boxShadow: activeBooking.status === 'Completed' ? '0 0 20px rgba(34, 197, 94, 0.4)' : '0 0 20px rgba(249, 115, 22, 0.4)'
                }}>
                  {activeBooking.status === 'Completed' ? '✓' : '⚡'}
                </div>

                <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
                  {activeBooking.status === 'Completed'
                    ? 'Service Completed!'
                    : activeBooking.status === 'In Progress'
                    ? 'Service In Progress'
                    : activeBooking.status === 'Arrived'
                    ? 'Worker Arrived at Location'
                    : activeBooking.status === 'On the Way'
                    ? 'Worker is On The Way'
                    : activeBooking.status === 'Accepted' || activeBooking.status === 'Assigned'
                    ? 'Worker Accepted Booking!'
                    : 'Booking Request Sent!'}
                </h1>

                <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '520px', margin: '0 auto 25px', lineHeight: 1.6 }}>
                  {activeBooking.status === 'Completed'
                    ? 'Thank you for choosing MISTRO. Your service professional has marked the job complete.'
                    : activeBooking.status === 'Accepted' || activeBooking.status === 'Assigned'
                    ? `${activeBooking.selectedProviderName || 'Worker'} has accepted your booking request and is preparing for your appointment.`
                    : activeBooking.status === 'On the Way'
                    ? `${activeBooking.selectedProviderName || 'Worker'} is currently travelling to your location.`
                    : activeBooking.status === 'Arrived'
                    ? `${activeBooking.selectedProviderName || 'Worker'} has arrived at your address.`
                    : activeBooking.status === 'In Progress'
                    ? `${activeBooking.selectedProviderName || 'Worker'} is actively executing your service.`
                    : `We sent your booking request directly to ${activeBooking.selectedProviderName || 'your selected worker'}. Waiting for confirmation...`}
                </p>

                {/* WORKER SUMMARY CARD */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '30px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '15px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: '#1E3A8A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 700,
                      color: '#F97316'
                    }}>
                      {activeBooking.selectedProviderName ? activeBooking.selectedProviderName.charAt(0) : '👨‍🔧'}
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                        {activeBooking.selectedProviderName || 'Selected Worker'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                        Requested Service: <span style={{ color: '#F97316' }}>{activeBooking.service}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>STATUS</div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: activeBooking.status === 'Completed' ? '#22c55e' : '#F97316',
                      background: 'rgba(249, 115, 22, 0.1)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      display: 'inline-block',
                      marginTop: '4px'
                    }}>
                      {activeBooking.status === 'Pending' ? '⏳ Waiting for Worker' : activeBooking.status}
                    </div>
                  </div>
                </div>

                {/* PROGRESS PIPELINE STEPS */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: '10px',
                  marginBottom: '30px'
                }}>
                  {[
                    { key: 'Pending', label: 'Requested', icon: '📩' },
                    { key: 'Accepted', label: 'Accepted', icon: '✓' },
                    { key: 'On the Way', label: 'On The Way', icon: '🚗' },
                    { key: 'Arrived', label: 'Arrived', icon: '📍' },
                    { key: 'In Progress', label: 'In Progress', icon: '⚡' },
                    { key: 'Completed', label: 'Completed', icon: '🎉' }
                  ].map((step, idx) => {
                    const statusOrder = ['Pending', 'Accepted', 'Assigned', 'On the Way', 'Arrived', 'In Progress', 'Completed'];
                    const currentIdx = statusOrder.indexOf(activeBooking.status === 'Assigned' ? 'Accepted' : activeBooking.status);
                    const stepIdx = statusOrder.indexOf(step.key);
                    const isDone = currentIdx >= stepIdx && currentIdx !== -1;

                    return (
                      <div key={step.key} style={{
                        background: isDone ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: isDone ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '12px 8px',
                        borderRadius: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '18px', marginBottom: '4px' }}>{step.icon}</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: isDone ? '#4ade80' : '#64748b' }}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <button onClick={() => navigate('/')} className="btn-accent" style={{ border: 'none', padding: '12px 30px', borderRadius: '30px', cursor: 'pointer', fontSize: '15px' }}>
                    Go to Homepage
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* FORM STATE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', margin: 0 }}>Book a Service</h1>
              <p style={{ color: '#94a3b8', fontSize: '16px', marginTop: '5px' }}>Choose your category, pick an expert worker, and schedule</p>
            </div>

            <form onSubmit={handleSubmitBooking} style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
              
              {/* STEP 1: SERVICE CATEGORY CARDS */}
              <div className="glass-card" style={{ padding: '30px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#F97316' }}>01</span> Select Service Category
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '15px'
                }}>
                  {[
                    { name: 'Electrical', icon: '⚡', desc: 'Fuses, switches, wiring' },
                    { name: 'Plumbing', icon: '🔧', desc: 'Leaks, drains, fixtures' },
                    { name: 'Carpentry', icon: '🪚', desc: 'Furniture, locks, drilling' },
                    { name: 'Cleaning', icon: '🧹', desc: 'Kitchen, sofa, full home' }
                  ].map((srv) => (
                    <div
                      key={srv.name}
                      onClick={() => {
                        setSelectedService(srv.name);
                        setSelectedWorker(null);
                      }}
                      style={{
                        padding: '20px 15px',
                        borderRadius: '12px',
                        border: selectedService === srv.name ? '2px solid #F97316' : '1px solid rgba(255,255,255,0.08)',
                        background: selectedService === srv.name ? 'rgba(249, 115, 22, 0.08)' : 'rgba(255,255,255,0.02)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, border-color 0.2s, background-color 0.2s'
                      }}
                      className="service-card-item"
                    >
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{srv.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{srv.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{srv.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 2: CHOOSE A SPECIFIC WORKER */}
              {selectedService && (
                <div className="glass-card" style={{ padding: '30px', borderRadius: '16px', animation: 'fadeInMap 0.5s ease-out' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#F97316' }}>02</span> Choose Your Professional
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 35px' }}>
                        Compare ratings, completed jobs, experience & book a specific expert
                      </p>
                    </div>
                    {selectedWorker && (
                      <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                        ✓ Selected: {selectedWorker.name}
                      </span>
                    )}
                  </div>

                  {loadingProviders ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px', fontSize: '20px' }}></i>
                      Loading available {selectedService} experts...
                    </div>
                  ) : providers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <p style={{ color: '#cbd5e1', margin: 0 }}>No active professionals currently available for {selectedService}.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                      {providers.map((worker) => {
                        const isSelected = selectedWorker?.id === worker.id;
                        return (
                          <div
                            key={worker.id}
                            style={{
                              background: isSelected ? 'rgba(249, 115, 22, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                              border: isSelected ? '2px solid #F97316' : '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '14px',
                              padding: '20px',
                              display: 'flex',
                              flexDirection: 'column',
                              justify: 'space-between',
                              gap: '15px',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                              {/* Avatar */}
                              <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: '#1E3A8A',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                border: '2px solid rgba(249, 115, 22, 0.4)'
                              }}>
                                {worker.profilePhoto ? (
                                  <img src={worker.profilePhoto} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ fontSize: '24px', color: '#fff', fontWeight: 700 }}>
                                    {worker.name.charAt(0)}
                                  </span>
                                )}
                              </div>

                              {/* Details */}
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                                    {worker.name}
                                  </h4>
                                  <span style={{ fontSize: '11px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                    🟢 Available
                                  </span>
                                </div>

                                <div style={{ fontSize: '13px', color: '#F97316', fontWeight: 600, marginTop: '2px' }}>
                                  {worker.badge || worker.specialization || `${worker.service} Specialist`}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                                    ⭐ {worker.rating ? worker.rating.toFixed(1) : '5.0'}
                                  </span>
                                  <span>•</span>
                                  <span>{worker.totalJobs || 0} Jobs</span>
                                  <span>•</span>
                                  <span>{worker.experience || 3} Yrs Exp</span>
                                </div>
                              </div>
                            </div>

                            {/* Bio / Specialization snippet */}
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {worker.bio || `Specialized in residential ${worker.service.toLowerCase()} repairs and installations.`}
                            </p>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                              <button
                                type="button"
                                onClick={() => setProfileModalWorker(worker)}
                                style={{
                                  flex: 1,
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  color: '#fff',
                                  padding: '10px',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                VIEW PROFILE
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedWorker(worker)}
                                style={{
                                  flex: 1,
                                  background: isSelected ? '#22c55e' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                                  border: 'none',
                                  color: '#fff',
                                  padding: '10px',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxShadow: isSelected ? '0 2px 10px rgba(34, 197, 94, 0.3)' : '0 2px 10px rgba(249, 115, 22, 0.3)'
                                }}
                              >
                                {isSelected ? '✓ SELECTED' : 'BOOK THIS WORKER'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: CONTACT INFORMATION */}
              <div className="glass-card" style={{ padding: '30px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#F97316' }}>03</span> Contact & Details
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <label htmlFor="booking-name" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>Full Name</label>
                    <input
                      type="text"
                      id="booking-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
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

                  <div>
                    <label htmlFor="booking-phone" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>Phone Number</label>
                    <input
                      type="tel"
                      id="booking-phone"
                      required
                      pattern="[0-9]{10}"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
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
                </div>

                <div>
                  <label htmlFor="booking-problem" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>Problem Description (Optional)</label>
                  <textarea
                    id="booking-problem"
                    rows={2}
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder="Briefly describe what needs fixing (e.g. main switch tripping, tap leak)..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
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
              </div>

              {/* STEP 4: LOCATION DETECTION */}
              <div className="glass-card" style={{ padding: '30px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#F97316' }}>04</span> Service Location
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 25px 25px' }}>
                  Where should our professional come? Select your delivery address below.
                </p>

                <GoogleMapComponent
                  onLocationConfirm={handleLocationConfirm}
                  onLocationReset={handleLocationReset}
                  initialLocation={locationData}
                />
              </div>

              {/* STEP 5: SCHEDULE & SUBMIT */}
              {isLocationConfirmed && locationData && (
                <div className="glass-card" style={{ padding: '30px', borderRadius: '16px', animation: 'fadeInMap 0.5s ease-out' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#F97316' }}>05</span> Preferred Schedule
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px'
                  }}>
                    <div>
                      <label htmlFor="booking-date" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>Preferred Date</label>
                      <input
                        type="date"
                        id="booking-date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#fff',
                          fontSize: '15px',
                          outline: 'none',
                          colorScheme: 'dark'
                        }}
                      />
                    </div>

                    <div>
                      <label htmlFor="booking-slot" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>Preferred Time Slot</label>
                      <select
                        id="booking-slot"
                        required
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
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
                      >
                        <option value="" disabled>Select a timeslot</option>
                        <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                        <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                        <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                        <option value="Emergency (30-min Express)">Emergency (30-min Express)</option>
                      </select>
                    </div>
                  </div>

                  {/* Submission Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    {!selectedWorker && (
                      <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>
                        ⚠️ Please select a professional above before proceeding.
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedWorker}
                      className="btn-accent"
                      style={{
                        padding: '16px 50px',
                        borderRadius: '30px',
                        fontSize: '16px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: selectedWorker ? 'pointer' : 'not-allowed',
                        opacity: selectedWorker ? 1 : 0.6,
                        boxShadow: '0 5px 20px rgba(249, 115, 22, 0.3)',
                        width: '100%',
                        maxWidth: '420px'
                      }}
                    >
                      {isSubmitting ? 'Sending Request...' : `Send Booking Request to ${selectedWorker ? selectedWorker.name : 'Worker'}`}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        )}

      </div>

      {/* WORKER PROFILE DETAIL MODAL */}
      {profileModalWorker && (
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
            maxWidth: '550px',
            borderRadius: '20px',
            padding: '30px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative',
            animation: 'fadeInMap 0.3s ease-out'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setProfileModalWorker(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>

            {/* Header Info */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '25px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#1E3A8A',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid #F97316',
                flexShrink: 0
              }}>
                {profileModalWorker.profilePhoto ? (
                  <img src={profileModalWorker.profilePhoto} alt={profileModalWorker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '32px', color: '#fff', fontWeight: 700 }}>
                    {profileModalWorker.name.charAt(0)}
                  </span>
                )}
              </div>

              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#fff' }}>
                  {profileModalWorker.name}
                </h2>
                <div style={{ color: '#F97316', fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>
                  {profileModalWorker.badge || `${profileModalWorker.service} Specialist`}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                  📍 {profileModalWorker.serviceArea || 'Chennai'}
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              background: 'rgba(255,255,255,0.03)',
              padding: '15px',
              borderRadius: '12px',
              marginBottom: '25px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24' }}>
                  ⭐ {profileModalWorker.rating ? profileModalWorker.rating.toFixed(1) : '5.0'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Rating</div>
              </div>

              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                  {profileModalWorker.totalJobs || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Jobs Done</div>
              </div>

              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#4ade80' }}>
                  {profileModalWorker.experience || 3} Yrs
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Experience</div>
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                About Professional
              </h4>
              <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                {profileModalWorker.bio || `Certified expert in ${profileModalWorker.service.toLowerCase()} providing high quality service with warranty.`}
              </p>
            </div>

            {/* Skills */}
            {profileModalWorker.skills && profileModalWorker.skills.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  Specialized Skills
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profileModalWorker.skills.map((skill) => (
                    <span key={skill} style={{
                      background: 'rgba(249, 115, 22, 0.12)',
                      border: '1px solid rgba(249, 115, 22, 0.3)',
                      color: '#fdba74',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      • {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Sample */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Recent Customer Feedback
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#fbbf24', fontSize: '12px', marginBottom: '2px' }}>⭐⭐⭐⭐⭐ 5.0</div>
                  <div style={{ color: '#cbd5e1', fontSize: '13px' }}>"Punctual, professional, and solved the issue cleanly!"</div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>- Verified MISTRO Customer</div>
                </div>
              </div>
            </div>

            {/* Modal Book Button */}
            <button
              onClick={() => {
                setSelectedWorker(profileModalWorker);
                setProfileModalWorker(null);
              }}
              className="btn-accent"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '30px',
                fontSize: '15px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)'
              }}
            >
              BOOK THIS WORKER ({profileModalWorker.name})
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default Booking;
