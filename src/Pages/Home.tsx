import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    gsap: any;
    ScrollTrigger: any;
    Lenis: any;
  }
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const chatbotInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(() => {
    try {
      const stored = localStorage.getItem('mistro_user_info');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('mistro_user_token');
    localStorage.removeItem('mistro_user_info');
    setCurrentUser(null);
  };
  
  // Handlers to navigate to booking page with selected service
  const handleBookNow = (serviceName?: string) => {
    if (serviceName) {
      navigate(`/booking?service=${serviceName}`);
    } else {
      navigate('/booking');
    }
  };

  useEffect(() => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const Lenis = window.Lenis;

    let lenisInst: any = null;
    let appCarouselTimer: any = null;
    let ctx: any = null;

    // 1. LENIS SMOOTH SCROLL
    if (typeof Lenis !== 'undefined') {
      lenisInst = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      const raf = (time: number) => {
        lenisInst.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);

      if (gsap && ScrollTrigger) {
        lenisInst.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time: number) => {
          lenisInst.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      }
    }

    // 2. NAVBAR SCROLL EFFECT
    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);

    // 3. CURSOR GLOW EFFECT
    const glow = document.getElementById('cursor-glow');
    const handleMouseMoveGlow = (e: MouseEvent) => {
      if (glow && gsap) {
        gsap.to(glow, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1,
          ease: 'power1.out',
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMoveGlow);

    // 4. HERO SECTION PARTICLES
    const container = document.getElementById('hero-particles');
    if (container && container.childElementCount === 0) {
      const count = 35;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'hero-particle';
        const size = Math.random() * 8 + 3;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.animationDuration = `${Math.random() * 12 + 8}s`;
        p.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(p);
      }
    }

    // 5. HERO MOUSE PARALLAX
    const scene = document.getElementById('hero-parallax-scene');
    const handleMouseMoveParallax = (e: MouseEvent) => {
      if (!scene || !gsap) return;
      const x = (e.clientX - window.innerWidth / 2) / 35;
      const y = (e.clientY - window.innerHeight / 2) / 35;

      const badges = scene.querySelectorAll('.floating-service-icon');
      badges.forEach((badge) => {
        const depth = parseFloat(badge.getAttribute('data-depth') || '0.2');
        const moveX = x * depth * 20;
        const moveY = y * depth * 20;

        gsap.to(badge, {
          x: moveX,
          y: moveY,
          duration: 0.6,
          ease: 'power2.out',
        });
      });

      const house = scene.querySelector('.house-wrapper');
      if (house) {
        gsap.to(house, {
          x: x * 4,
          y: y * 4,
          duration: 0.8,
          ease: 'power2.out',
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMoveParallax);

    // 6. GENERAL SCROLL REVEALS (GSAP)
    if (gsap) {
      if (ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
      }
      ctx = gsap.context(() => {
        if (ScrollTrigger) {
          gsap.from('.reveal-zoom', {
        scale: 0.9,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.reveal-zoom',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });

      gsap.to('.about-video-loop', {
        scale: 1.08,
        scrollTrigger: {
          trigger: '.about-section',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      const slideLefts = document.querySelectorAll('.reveal-slide-left');
      slideLefts.forEach((item) => {
        gsap.from(item, {
          x: -80,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });

      const slideRights = document.querySelectorAll('.reveal-slide-right');
      slideRights.forEach((item) => {
        gsap.from(item, {
          x: 80,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });

      const fadeUps = document.querySelectorAll('.reveal-fade');
      fadeUps.forEach((item) => {
        gsap.from(item, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });

      // 7. PROBLEM TIMELINE DRAWING
      gsap.to('#timeline-line-progress', {
        height: '100%',
        scrollTrigger: {
          trigger: '.timeline-container',
          start: 'top 30%',
          end: 'bottom 70%',
          scrub: true,
        },
      });

      const timelineItems = document.querySelectorAll('.timeline-item');
      timelineItems.forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: 'top 70%',
          onEnter: () => item.classList.add('active'),
          onLeaveBack: () => item.classList.remove('active'),
        });
      });

      // 10. IMPACT COUNTERS
      const stats = document.querySelectorAll('.stat-number');
      stats.forEach((stat) => {
        const target = parseInt(stat.getAttribute('data-target') || '0') || 0;
        const countObj = { val: 0 };

        gsap.to(countObj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: stat,
            start: 'top 85%',
            once: true,
          },
          onUpdate: () => {
            stat.textContent = Math.floor(countObj.val).toString();
          },
          onComplete: () => {
            stat.textContent = target.toString();
          },
        });
      });

      // 13. HOW IT WORKS PROGRESS FLOW
      gsap.to('#process-line-fill', {
        width: '100%',
        scrollTrigger: {
          trigger: '.process-flow-container',
          start: 'top 70%',
          end: 'bottom 60%',
          scrub: true,
        },
      });

      const steps = document.querySelectorAll('.process-step-item');
      steps.forEach((step) => {
        ScrollTrigger.create({
          trigger: step,
          start: 'top 75%',
          onEnter: () => step.classList.add('active'),
          onLeaveBack: () => step.classList.remove('active'),
        });
      });
    }

    // 8. SOLUTIONS TILT EFFECT
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach((card) => {
      const handleMouseMoveTilt = (e: Event) => {
        if (!gsap) return;
        const mouseEvent = e as MouseEvent;
        const rect = card.getBoundingClientRect();
        const x = mouseEvent.clientX - rect.left;
        const y = mouseEvent.clientY - rect.top;

        const xc = rect.width / 2;
        const yc = rect.height / 2;

        const rotateX = (yc - y) / 8;
        const rotateY = (x - xc) / 8;

        gsap.to(card, {
          rotateX: rotateX,
          rotateY: rotateY,
          y: -6,
          duration: 0.3,
          ease: 'power1.out',
        });
      };

      const handleMouseLeaveTilt = () => {
        if (!gsap) return;
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        });
      };

      card.addEventListener('mousemove', handleMouseMoveTilt);
      card.addEventListener('mouseleave', handleMouseLeaveTilt);
    });
      }); // end of gsap.context
      
      if (ScrollTrigger) {
        ScrollTrigger.refresh();
        setTimeout(() => ScrollTrigger.refresh(), 500);
        setTimeout(() => ScrollTrigger.refresh(), 1500);
      }
    }

    // 9. APP SHOWCASE SCREEN AUTO-CYCLE
    const features = document.querySelectorAll('.feature-item');
    const screens = document.querySelectorAll('.app-mockup-screen');
    if (features.length > 0) {
      let currentIndex = 0;
      const slideDuration = 4000;

      const switchScreen = (index: number) => {
        currentIndex = index;
        screens.forEach((screen) => screen.classList.remove('active'));
        const targetScreenId = `screen-${features[index].getAttribute('data-screen')}`;
        const targetScreen = document.getElementById(targetScreenId);
        if (targetScreen) targetScreen.classList.add('active');

        features.forEach((feat) => feat.classList.remove('active'));
        features[index].classList.add('active');
      };

      const startAutoCycle = () => {
        appCarouselTimer = setInterval(() => {
          const nextIndex = (currentIndex + 1) % features.length;
          switchScreen(nextIndex);
        }, slideDuration);
      };

      const resetAutoCycle = () => {
        clearInterval(appCarouselTimer);
        startAutoCycle();
      };

      features.forEach((feat, idx) => {
        feat.addEventListener('click', () => {
          switchScreen(idx);
          resetAutoCycle();
        });
      });

      startAutoCycle();
    }

    // 11. AI CHATBOT INTERACTIVE SYSTEM
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-user-input') as HTMLInputElement | null;
    const sendBtn = document.getElementById('chat-send-btn');
    const chips = document.querySelectorAll('.chat-chip-btn');
    const floatTrigger = document.getElementById('chatbot-float-trigger');

    const botReplies: Record<string, string> = {
      'bedroom lights': '💡 I recommend booking an **Electrician**. Based on your flickering issue, our certified electrician Kumar S is nearby (350m away) and can diagnose the switchboard or loose connection. Fares start at ₹149.',
      'sink leak': '💧 You need a **Plumber**. I can alert Priya M or Rajesh K, our top-rated local plumbing technicians. They can clear clogs and fix leaking piping under the basin instantly.',
      'verifying workers': '🆔 MISTRO secures your home. All dispatched professionals wear a digital MISTRO badge. You can view their government KYC, ID photo, and background safety verification on your app screen before they arrive.',
      'default': '🤖 Thank you for reaching out! Let me know if you need to book an **Electrician, Plumber, Carpenter, or Cleaning specialist**. I can match a verified professional in 30 seconds.'
    };

    const appendMessage = (text: string, sender: 'bot' | 'user') => {
      if (!chatMessages) return;
      const bubble = document.createElement('div');
      bubble.className = `chat-message ${sender}`;
      bubble.innerHTML = `<p>${text}</p>`;
      chatMessages.appendChild(bubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const simulateBotReply = (userQuery: string) => {
      if (!chatMessages) return;
      const typingBubble = document.createElement('div');
      typingBubble.className = 'chat-message bot typing-indicator';
      typingBubble.innerHTML = '<p>MISTRO AI is thinking...</p>';
      chatMessages.appendChild(typingBubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      setTimeout(() => {
        if (chatMessages.contains(typingBubble)) {
          chatMessages.removeChild(typingBubble);
        }

        const queryLower = userQuery.toLowerCase();
        let reply = botReplies['default'];

        if (queryLower.includes('light') || queryLower.includes('flicker') || queryLower.includes('electrical')) {
          reply = botReplies['bedroom lights'];
        } else if (queryLower.includes('leak') || queryLower.includes('sink') || queryLower.includes('water')) {
          reply = botReplies['sink leak'];
        } else if (queryLower.includes('verify') || queryLower.includes('id') || queryLower.includes('identity')) {
          reply = botReplies['verifying workers'];
        } else if (queryLower.includes('plumb')) {
          reply = botReplies['sink leak'];
        } else if (queryLower.includes('elect')) {
          reply = botReplies['bedroom lights'];
        } else if (queryLower.includes('clean') || queryLower.includes('sweep') || queryLower.includes('broom')) {
          reply = '🧹 Deep home or bathroom cleaning required? I will match you with our specialized cleaning professionals. They arrive with eco-safe chemicals and vacuum supplies.';
        } else if (queryLower.includes('carpenter') || queryLower.includes('wood') || queryLower.includes('door')) {
          reply = '🪚 Standard carpentry checks starts at ₹99. We fix latches, alignments, and custom storage units. I can match a carpenter for you today.';
        }

        appendMessage(reply, 'bot');
      }, 1200);
    };

    const handleSend = () => {
      if (!chatInput) return;
      const text = chatInput.value.trim();
      if (!text) return;

      appendMessage(text, 'user');
      chatInput.value = '';
      simulateBotReply(text);
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (chatInput) {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
      };
      chatInput.addEventListener('keypress', handleKeyPress);
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const promptText = chip.getAttribute('data-input') || '';
        appendMessage(promptText, 'user');
        simulateBotReply(promptText);
      });
    });

    if (floatTrigger) {
      floatTrigger.addEventListener('click', () => {
        const aiSection = document.getElementById('ai-assistant');
        if (aiSection) {
          if (lenisInst) {
            lenisInst.scrollTo(aiSection);
          } else {
            aiSection.scrollIntoView({ behavior: 'smooth' });
          }
          setTimeout(() => chatInput?.focus(), 800);
        }
      });
    }

    // 12. VIDEO MODAL POPUP
    const playTriggers = document.querySelectorAll('.play-trigger');
    const videoModal = document.getElementById('video-modal');
    const closeVideoBtn = document.getElementById('close-video-modal');
    const player = document.getElementById('modal-video-player') as HTMLVideoElement | null;

    playTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const videoSrc = trigger.getAttribute('data-video');
        if (player && videoSrc) {
          const source = player.querySelector('source');
          if (source) {
            source.setAttribute('src', videoSrc);
            player.load();
          }
        }
        videoModal?.classList.add('active');
        if (player) {
          player.currentTime = 0;
          player.play().catch(err => console.log('Video autoplay blocked or issue:', err));
        }
        if (lenisInst) lenisInst.stop();
      });
    });

    const closeVideoModal = () => {
      videoModal?.classList.remove('active');
      if (player) player.pause();
      if (lenisInst) lenisInst.start();
    };

    if (closeVideoBtn) closeVideoBtn.addEventListener('click', closeVideoModal);
    videoModal?.addEventListener('click', (e) => {
      if (e.target === videoModal) closeVideoModal();
    });

    const handleKeyDownVideo = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && videoModal?.classList.contains('active')) {
        closeVideoModal();
      }
    };
    window.addEventListener('keydown', handleKeyDownVideo);

    // 14. CONTACT FORM SUBMISSION
    const contactForm = document.getElementById('contact-form') as HTMLFormElement | null;
    const showToast = (message: string, isError = false) => {
      let toast = document.querySelector('.mistro-toast') as HTMLElement | null;
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'mistro-toast';
        document.body.appendChild(toast);
      }
      const icon = isError ? 'fa-exclamation-triangle' : 'fa-check-circle';
      toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
      toast.classList.add('active');
      setTimeout(() => {
        toast?.classList.remove('active');
      }, 4000);
    };

    const handleContactSubmit = async (e: Event) => {
      e.preventDefault();
      const submitBtn = document.getElementById('contact-submit-btn') as HTMLButtonElement | null;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      const contactData = {
        name: (document.getElementById('contact-name') as HTMLInputElement).value.trim(),
        email: (document.getElementById('contact-email') as HTMLInputElement).value.trim(),
        message: (document.getElementById('contact-message') as HTMLTextAreaElement).value.trim()
      };

      try {
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactData)
        });
        const result = await response.json();
        if (result.success) {
          showToast('Message Sent! Our support team will contact you shortly.');
          contactForm?.reset();
        } else {
          showToast(result.error || 'Failed to send message. Please try again.', true);
        }
      } catch (err) {
        console.error('Contact form submission error:', err);
        showToast('Connection error. Please try again later.', true);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }
      }
    };

    if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);

    // Cleanup functions on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMoveGlow);
      window.removeEventListener('mousemove', handleMouseMoveParallax);
      window.removeEventListener('keydown', handleKeyDownVideo);
      if (lenisInst) {
        lenisInst.destroy();
      }
      if (appCarouselTimer) {
        clearInterval(appCarouselTimer);
      }
      if (contactForm) {
        contactForm.removeEventListener('submit', handleContactSubmit);
      }
      if (ctx) {
        ctx.revert();
      }
    };
  }, []);

  return (
    <>
      {/* Cursor Glow Effect */}
      <div id="cursor-glow" className="cursor-glow"></div>

      {/* FIXED GLASSMORPHIC NAVBAR */}
      <nav className="navbar" id="navbar">
        <a href="#hero" className="nav-logo-container" id="nav-logo">
          <img src="/mistro logo.png" className="nav-logo-img" alt="MISTRO Logo" />
          <span className="nav-logo-text">MISTRO</span>
        </a>
        
        <ul className="nav-links">
          <li><a href="#about" className="nav-link-item">About</a></li>
          <li><a href="#problem" className="nav-link-item">Timeline</a></li>
          <li><a href="#solution" className="nav-link-item">Solutions</a></li>
          <li><a href="#services" className="nav-link-item">Services</a></li>
          <li><a href="#app-showcase" className="nav-link-item">App</a></li>
          <li><a href="#why-choose" className="nav-link-item">Why MISTRO</a></li>
          <li><a href="#contact" className="nav-link-item">Contact</a></li>
        </ul>
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/portal')}
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(249, 115, 22, 0.2))',
              border: '1px solid rgba(249, 115, 22, 0.5)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔀</span> Switch Role
          </button>
          <button
            onClick={() => navigate('/worker/register')}
            style={{
              background: 'rgba(249, 115, 22, 0.12)',
              border: '1px solid rgba(249, 115, 22, 0.4)',
              color: '#F97316',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Become a Partner 🤝
          </button>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#F97316', fontSize: '14px', fontWeight: 600 }}>
                👤 {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '7px 18px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          )}
          <button className="btn-primary-nav" id="nav-book-btn" onClick={() => handleBookNow()}>Book Now</button>
        </div>
      </nav>

      {/* ==========================================================
           PAGE 1 - HERO SECTION (Full Screen)
           ========================================================== */}
      <section className="hero-section" id="hero">
        <div className="gradient-bg-overlay"></div>
        <div className="particles-container" id="hero-particles"></div>
        
        <div className="hero-container">
          {/* Left Side */}
          <div className="hero-left">
            <h1 className="hero-headline">India's Smart Home Service Marketplace</h1>
            <p className="hero-subheadline">Connecting customers with trusted electricians, plumbers, carpenters, and cleaning professionals through one intelligent platform.</p>
            <div className="hero-buttons">
              <button className="btn-accent" id="hero-btn-book" onClick={() => handleBookNow()}>Book a Service</button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/portal')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(249, 115, 22, 0.4)',
                  color: '#fff'
                }}
              >
                <span>🔀</span> Role Switcher
              </button>
              <button className="btn-secondary play-trigger" id="hero-btn-demo" data-video="/demo video.mp4">
                <i className="fas fa-play-circle"></i> Watch Demo
              </button>
            </div>
          </div>
          
          {/* Right Side */}
          <div className="hero-right" id="hero-parallax-scene">
            <div className="house-wrapper">
              <img src="/hero_house.png" className="hero-house-img" alt="3D illustration of a smart house" />
            </div>
            
            {/* Floating service icons around house */}
            <div className="floating-service-icon icon-electrician" data-depth="0.15">
              <div className="floating-badge">⚡ <span>Electrician</span></div>
            </div>
            <div className="floating-service-icon icon-plumber" data-depth="0.25">
              <div className="floating-badge">🔧 <span>Plumber</span></div>
            </div>
            <div className="floating-service-icon icon-carpenter" data-depth="0.2">
              <div className="floating-badge">🪚 <span>Carpenter</span></div>
            </div>
            <div className="floating-service-icon icon-cleaning" data-depth="0.3">
              <div className="floating-badge">🧹 <span>Cleaning</span></div>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator at bottom */}
        <a href="#about" className="scroll-indicator" aria-label="Scroll to next section">
          <span className="mouse-icon">
            <span className="mouse-wheel"></span>
          </span>
          <span className="arrow-down"></span>
        </a>
      </section>

      {/* ==========================================================
           PAGE 2 - ABOUT MISTRO
           ========================================================== */}
      <section className="about-section" id="about">
        <div className="section-container">
          {/* Left: Video/Animation showing workers helping customers */}
          <div className="about-left reveal-zoom">
            <div className="video-card-wrapper">
              <img src="/About mistro.png" className="about-video-loop" alt="About MISTRO" />
              <div className="video-overlay-glow"></div>
            </div>
          </div>
          
          {/* Right: Content */}
          <div className="about-right reveal-slide-right">
            <span className="badge-tag">Who We Are</span>
            <h2 className="about-title">About MISTRO</h2>
            <p className="about-desc">MISTRO is India's premier digital marketplace connecting professional service personnel directly with homeowners. By removing intermediaries, we ensure fair wages for professionals and top-tier services for our customers.</p>
            
            <div className="about-vision-mission">
              <div className="about-card">
                <div className="about-card-icon"><i className="fas fa-eye"></i></div>
                <div className="about-card-content">
                  <h3>Our Vision</h3>
                  <p>To digitalize and organize the domestic services market, empowering millions of skilled micro-entrepreneurs.</p>
                </div>
              </div>
              
              <div className="about-card">
                <div className="about-card-icon"><i className="fas fa-bullseye"></i></div>
                <div className="about-card-content">
                  <h3>Our Mission</h3>
                  <p>Providing seamless, reliable, and secure home repair services with instant professional matching within minutes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
           PAGE 3 - PROBLEM WE SOLVE
           ========================================================== */}
      <section className="problem-section" id="problem">
        <div className="bg-grid-glow"></div>
        <div className="section-container">
          <div className="section-header">
            <span className="badge-tag">Critical Challenges</span>
            <h2 className="section-title text-white">The Problems We Solve</h2>
            <p className="section-subtitle">Traditional home services are fragmented, frustrating, and lack accountability.</p>
          </div>
          
          {/* Center Timeline */}
          <div className="timeline-container">
            {/* SVG Connecting line that animatedly grows on scroll */}
            <div className="timeline-line-track">
              <div className="timeline-line-progress" id="timeline-line-progress"></div>
            </div>
            
            {/* Timeline Item 1 */}
            <div className="timeline-item timeline-left reveal-fade">
              <div className="timeline-dot">1</div>
              <div className="timeline-content glass-card">
                <div className="timeline-icon-box"><i className="fas fa-search-minus"></i></div>
                <h3>Finding Reliable Workers</h3>
                <p>Spending hours asking neighbors or searching online directories for contractors who might not show up.</p>
              </div>
            </div>
            
            {/* Timeline Item 2 */}
            <div className="timeline-item timeline-right reveal-fade">
              <div className="timeline-dot">2</div>
              <div className="timeline-content glass-card">
                <div className="timeline-icon-box"><i className="fas fa-tag"></i></div>
                <h3>Unclear Pricing</h3>
                <p>Hidden costs, arbitrary fees, and aggressive negotiations leave customers feeling cheated.</p>
              </div>
            </div>
            
            {/* Timeline Item 3 */}
            <div className="timeline-item timeline-left reveal-fade">
              <div className="timeline-dot">3</div>
              <div className="timeline-content glass-card">
                <div className="timeline-icon-box"><i className="fas fa-clock"></i></div>
                <h3>Delayed Service</h3>
                <p>Critical repairs like water leaks or electrical faults ignored for days due to low availability.</p>
              </div>
            </div>
            
            {/* Timeline Item 4 */}
            <div className="timeline-item timeline-right reveal-fade">
              <div className="timeline-dot">4</div>
              <div className="timeline-content glass-card">
                <div className="timeline-icon-box"><i className="fas fa-user-shield"></i></div>
                <h3>Lack of Trust</h3>
                <p>No safety verification, zero background screening, and absence of service warranty.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
           PAGE 4 - OUR SOLUTION
           ========================================================== */}
      <section className="solution-section" id="solution">
        <div className="section-container">
          <div className="section-header">
            <span className="badge-tag">Our Innovation</span>
            <h2 className="section-title">A Smarter Way for Home Services</h2>
            <p className="section-subtitle">We leverage technology to bring trust, clarity, and speed to every service request.</p>
          </div>
          
          {/* Four Interactive Cards */}
          <div className="solution-grid">
            {/* Card 1 */}
            <div className="solution-card tilt-card glass-card" id="sol-card-1">
              <div className="glow-border"></div>
              <div className="sol-icon-wrapper"><i className="fas fa-map-marked-alt"></i></div>
              <h3>Smart Search</h3>
              <p>Find nearby professionals instantly with our real-time GPS matching algorithm.</p>
            </div>
            
            {/* Card 2 */}
            <div className="solution-card tilt-card glass-card" id="sol-card-2">
              <div className="glow-border"></div>
              <div className="sol-icon-wrapper"><i className="fas fa-user-check"></i></div>
              <h3>Verified Workers</h3>
              <p>Rest easy knowing all technicians undergo a strict government KYC and background check.</p>
            </div>
            
            {/* Card 3 */}
            <div className="solution-card tilt-card glass-card" id="sol-card-3">
              <div className="glow-border"></div>
              <div className="sol-icon-wrapper"><i className="fas fa-bolt"></i></div>
              <h3>Instant Booking</h3>
              <p>Schedule emergency troubleshooting or routine maintenance in under 30 seconds.</p>
            </div>
            
            {/* Card 4 */}
            <div className="solution-card tilt-card glass-card" id="sol-card-4">
              <div className="glow-border"></div>
              <div className="sol-icon-wrapper"><i className="fas fa-star"></i></div>
              <h3>Ratings & Reviews</h3>
              <p>Access authentic reviews from local neighbors to choose the best professional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
           PAGE 5 - SERVICES SECTION
           ========================================================== */}
      <section className="services-section" id="services">
        <div className="section-container">
          <div className="section-header">
            <span className="badge-tag">Service Directory</span>
            <h2 className="section-title">Our Premium Services</h2>
            <p className="section-subtitle">Select from our vetted professionals specialized in home utility maintenance.</p>
          </div>
          
          {/* Premium Grid Layout */}
          <div className="services-grid-wrapper">
            {/* Service Card 1: Electrician */}
            <div className="service-large-card electrician-card" id="service-elect">
              <div className="service-media-bg">
                <video autoPlay loop muted playsInline className="service-card-video">
                  <source src="/Electrician working.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="service-card-glow"></div>
              <div className="service-card-body">
                <div className="service-card-icon-box lightning-icon">
                  <i className="fas fa-bolt"></i>
                </div>
                <h3>Electrician</h3>
                <p className="short-desc">Wiring, switchboard troubleshooting, appliance setups, and emergency repairs.</p>
                <div className="hover-details">
                  <ul>
                    <li><i className="fas fa-check"></i> Emergency wiring fixes</li>
                    <li><i className="fas fa-check"></i> Inverter & UPS servicing</li>
                    <li><i className="fas fa-check"></i> Lighting and fan installs</li>
                  </ul>
                  <button className="btn-accent-sm" onClick={() => handleBookNow('Electrical')}>Book Electrician</button>
                </div>
              </div>
            </div>

            {/* Service Card 2: Plumbing */}
            <div className="service-large-card plumbing-card" id="service-plumb">
              <div className="service-media-bg">
                <video autoPlay loop muted playsInline className="service-card-video">
                  <source src="/Plumber working.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="service-card-glow"></div>
              <div className="service-card-body">
                <div className="service-card-icon-box wrench-icon">
                  <i className="fas fa-wrench"></i>
                </div>
                <h3>Plumbing</h3>
                <p className="short-desc">Leaking pipe repairs, bathroom utilities installation, and water pump servicing.</p>
                <div className="hover-details">
                  <ul>
                    <li><i className="fas fa-check"></i> Blockage & clog clearing</li>
                    <li><i className="fas fa-check"></i> Sanitary ware fitting</li>
                    <li><i className="fas fa-check"></i> Tap and faucet repairs</li>
                  </ul>
                  <button className="btn-accent-sm" onClick={() => handleBookNow('Plumbing')}>Book Plumber</button>
                </div>
              </div>
            </div>

            {/* Service Card 3: Carpentry */}
            <div className="service-large-card carpentry-card" id="service-carp">
              <div className="service-media-bg">
                <video autoPlay loop muted playsInline className="service-card-video">
                  <source src="/Carpenter working.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="service-card-glow"></div>
              <div className="service-card-body">
                <div className="service-card-icon-box hammer-icon">
                  <i className="fas fa-hammer"></i>
                </div>
                <h3>Carpentry</h3>
                <p className="short-desc">Furniture repair, door/latch alignment, drilling and assembly services.</p>
                <div className="hover-details">
                  <ul>
                    <li><i className="fas fa-check"></i> Door lock installation</li>
                    <li><i className="fas fa-check"></i> Shelving & cabinet repair</li>
                    <li><i className="fas fa-check"></i> Custom wood refurbishing</li>
                  </ul>
                  <button className="btn-accent-sm" onClick={() => handleBookNow('Carpentry')}>Book Carpenter</button>
                </div>
              </div>
            </div>

            {/* Service Card 4: Cleaning */}
            <div className="service-large-card cleaning-card" id="service-clean">
              <div className="service-media-bg">
                <video autoPlay loop muted playsInline className="service-card-video">
                  <source src="/cleaning working.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="service-card-glow"></div>
              <div className="service-card-body">
                <div className="service-card-icon-box broom-icon">
                  <i className="fas fa-broom"></i>
                </div>
                <h3>Cleaning</h3>
                <p className="short-desc">Deep kitchen cleaning, bathroom sanitization, sofa scrubbing, and full home dust-off.</p>
                <div className="hover-details">
                  <ul>
                    <li><i className="fas fa-check"></i> Deep kitchen scrub</li>
                    <li><i className="fas fa-check"></i> Sofa & carpet vacuuming</li>
                    <li><i className="fas fa-check"></i> Eco-friendly sanitizing</li>
                  </ul>
                  <button className="btn-accent-sm" onClick={() => handleBookNow('Cleaning')}>Book Cleaning</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
           PAGE 6 - APP SHOWCASE
           ========================================================== */}
      <section className="app-showcase-section" id="app-showcase">
        <div className="section-container">
          {/* Left Mobile Mockup */}
          <div className="showcase-left">
            <div className="phone-mockup-frame">
              <div className="phone-camera-notch"></div>
              <div className="phone-screen-container">
                
                {/* Screen 1: Splash Screen */}
                <div className="app-mockup-screen active" id="screen-easy-search">
                  <div className="app-splash-view">
                    <img src="/mistro logo.png" className="splash-logo" alt="Logo" />
                    <h3>MISTRO</h3>
                    <div className="app-mockup-search">
                      <i className="fas fa-search"></i>
                      <span>Finding nearest electricians...</span>
                    </div>
                    <div className="radar-pulse">
                      <div className="pulse-ring"></div>
                      <div className="pulse-ring"></div>
                      <div className="pulse-center">📍</div>
                    </div>
                  </div>
                </div>
                
                {/* Screen 2: Booking Screen */}
                <div className="app-mockup-screen" id="screen-service-booking">
                  <div className="app-screen-header">
                    <span>Select Service</span>
                    <i className="fas fa-bell"></i>
                  </div>
                  <div className="app-booking-view">
                    <div className="app-service-row active">
                      <span>⚡ Switchboard sparking fix</span>
                      <strong>₹149</strong>
                    </div>
                    <div className="app-service-row">
                      <span>💡 LED bulb replacement</span>
                      <strong>₹79</strong>
                    </div>
                    <div className="app-service-row">
                      <span>🔌 Appliance wiring setup</span>
                      <strong>₹299</strong>
                    </div>
                    <button className="mockup-action-btn">Proceed to Book</button>
                  </div>
                </div>
                
                {/* Screen 3: Worker Profiles */}
                <div className="app-mockup-screen" id="screen-worker-profiles">
                  <div className="app-screen-header">
                    <span>Available Electricians</span>
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div className="app-profile-list">
                    <div className="mockup-profile-card">
                      <div className="pro-avatar">K</div>
                      <div className="pro-details">
                        <h4>Kumar S (4.8★)</h4>
                        <p>350m away • 85 repairs</p>
                      </div>
                    </div>
                    <div className="mockup-profile-card">
                      <div className="pro-avatar" style={{ background: '#1e3a8a' }}>S</div>
                      <div className="pro-details">
                        <h4>Suresh M (4.7★)</h4>
                        <p>1.2km away • 120 repairs</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Screen 4: Reviews */}
                <div className="app-mockup-screen" id="screen-reviews">
                  <div className="app-screen-header">
                    <span>Feedback for Kumar S</span>
                    <i className="fas fa-star" style={{ color: 'var(--accent)' }}></i>
                  </div>
                  <div className="app-reviews-view">
                    <div className="review-bubble">
                      <p>"Excellent work on short notice. Very polite."</p>
                      <strong>- Kishore K. (5★)</strong>
                    </div>
                    <div className="review-bubble">
                      <p>"Diagnosed the fuse fault in 10 minutes."</p>
                      <strong>- Mithilesh S. (5★)</strong>
                    </div>
                  </div>
                </div>
                
                {/* Screen 5: Notifications */}
                <div className="app-mockup-screen" id="screen-notifications">
                  <div className="app-screen-header">
                    <span>Job Status</span>
                    <i className="fas fa-comment-dots"></i>
                  </div>
                  <div className="app-notif-view">
                    <div className="notif-card">
                      <span className="notif-dot"></span>
                      <div>
                        <h4>Kumar S is arriving</h4>
                        <p>ETA: 12 minutes (Tracking active)</p>
                      </div>
                    </div>
                    <div className="notif-card read">
                      <div>
                        <h4>Booking Completed</h4>
                        <p>Invoice #M-4492 paid successfully</p>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
          
          {/* Right Feature list */}
          <div className="showcase-right">
            <span className="badge-tag">Experience MISTRO</span>
            <h2 className="showcase-title">Empowerment in Your Hand</h2>
            <p className="showcase-subtitle">Our mobile app provides an effortless, transparent booking workflow for customers.</p>
            
            <div className="feature-indicators">
              <div className="feature-item active" data-screen="easy-search">
                <div className="feat-number">01</div>
                <div className="feat-content">
                  <h3>Easy Search</h3>
                  <p>Locate the best technicians with our instant live-radar matching engine.</p>
                </div>
              </div>
              
              <div className="feature-item" data-screen="service-booking">
                <div className="feat-number">02</div>
                <div className="feat-content">
                  <h3>Service Booking</h3>
                  <p>Select specific jobs and confirm standardized transparent prices upfront.</p>
                </div>
              </div>
              
              <div className="feature-item" data-screen="worker-profiles">
                <div className="feat-number">03</div>
                <div className="feat-content">
                  <h3>Worker Profiles</h3>
                  <p>Verify individual ratings, review totals, and proximities before selecting.</p>
                </div>
              </div>
              
              <div className="feature-item" data-screen="reviews">
                <div className="feat-number">04</div>
                <div className="feat-content">
                  <h3>Reviews</h3>
                  <p>Browse authentic community feedback to ensure absolute peace of mind.</p>
                </div>
              </div>
              
              <div className="feature-item" data-screen="notifications">
                <div className="feat-number">05</div>
                <div className="feat-content">
                  <h3>Notifications</h3>
                  <p>Receive real-time progress alerts and live location tracking map updates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
           PAGE 7 - IMPACT SECTION
           ========================================================== */}
      <section className="impact-section" id="impact">
        <div className="section-container">
          <div className="impact-stats-grid">
            {/* Stat Card 1 */}
            <div className="stat-card glass-card">
              <div className="stat-number-wrapper">
                <span className="stat-number" id="stat-customers" data-target="5000">0</span>
                <span className="stat-suffix">+</span>
              </div>
              <p className="stat-label">Happy Customers</p>
            </div>
            
            {/* Stat Card 2 */}
            <div className="stat-card glass-card">
              <div className="stat-number-wrapper">
                <span className="stat-number" id="stat-pros" data-target="1000">0</span>
                <span className="stat-suffix">+</span>
              </div>
              <p className="stat-label">Verified Professionals</p>
            </div>
            
            {/* Stat Card 3 */}
            <div className="stat-card glass-card">
              <div className="stat-number-wrapper">
                <span className="stat-number" id="stat-cities" data-target="50">0</span>
                <span className="stat-suffix">+</span>
              </div>
              <p className="stat-label">Cities Covered</p>
            </div>
            
            {/* Stat Card 4 */}
            <div className="stat-card glass-card">
              <div className="stat-number-wrapper">
                <span className="stat-number" id="stat-satisfaction" data-target="98">0</span>
                <span className="stat-suffix">%</span>
              </div>
              <p className="stat-label">Customer Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
           PAGE 8 - AI ASSISTANT SECTION
           ========================================================== */}
      <section className="ai-section" id="ai-assistant">
        <div className="section-container">
          {/* Left: AI Chat Interface */}
          <div className="ai-left">
            <div className="chat-console-wrapper glass-card">
              <div className="chat-header">
                <div className="bot-badge">
                  <span className="bot-avatar-pulse"></span>
                  <i className="fas fa-robot"></i>
                </div>
                <div>
                  <h3>MISTRO AI</h3>
                  <p>Online • Service Helper</p>
                </div>
              </div>
              
              <div className="chat-messages-box" id="chat-messages">
                <div className="chat-message bot">
                  <p>Hi there! I'm the MISTRO AI Assistant. Tell me what service issue you're facing, and I will recommend the right professional!</p>
                </div>
              </div>
              
              <div className="chat-chips-scroll">
                <button className="chat-chip-btn" data-input="My bedroom lights are flickering. Who do I need?">💡 Flickering lights</button>
                <button className="chat-chip-btn" data-input="Water is leaking under the bathroom sink.">💧 Sink leak</button>
                <button className="chat-chip-btn" data-input="How do I verify the service professional's ID?">🆔 Verifying workers</button>
              </div>
              
              <div className="chat-input-bar">
                <input type="text" id="chat-user-input" ref={chatbotInputRef} placeholder="Type a message or select a shortcut above..." aria-label="Chat input" />
                <button id="chat-send-btn" aria-label="Send message"><i className="fas fa-paper-plane"></i></button>
              </div>
            </div>
          </div>
          
          {/* Right: Description */}
          <div className="ai-right">
            <span className="badge-tag">Intelligent matching</span>
            <h2 className="ai-title">Say Hello to MISTRO AI Assistant</h2>
            <p className="ai-subtitle">We integrate deep artificial intelligence to simplify home upkeep decisions, providing recommendations in real-time.</p>
            
            <div className="ai-features">
              <div className="ai-feature-row">
                <i className="fas fa-magic"></i>
                <div>
                  <h3>Service Recommendation</h3>
                  <p>Explain your issues in plain words, and our assistant instantly maps them to correct technicians.</p>
                </div>
              </div>
              <div className="ai-feature-row">
                <i className="fas fa-directions"></i>
                <div>
                  <h3>Booking Guidance</h3>
                  <p>Step-by-step assistant navigation to quickly confirm schedules, timeslots, and secure addresses.</p>
                </div>
              </div>
              <div className="ai-feature-row">
                <i className="fas fa-question-circle"></i>
                <div>
                  <h3>FAQ Support</h3>
                  <p>Instant support regarding service warranties, payment modes, cancellation terms, and worker screenings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
           PAGE 9 - VIDEO SECTION
           ========================================================== */}
      <section className="video-section" id="video-banner">
        <div className="video-banner-bg">
          <video autoPlay loop muted playsInline className="banner-video-media">
            <source src="/Looping_video_smart_home_interiors_202606051348.mp4" type="video/mp4" />
          </video>
          <div className="video-banner-overlay"></div>
        </div>
        
        <div className="video-banner-content">
          <h2 className="banner-headline">Watch How MISTRO Transforms Home Services</h2>
          <button className="play-demo-btn play-trigger" aria-label="Play promo video" data-video="/mistro transform.mp4">
            <i className="fas fa-play"></i>
          </button>
          <p className="banner-subtext">Click to watch our startup journey and operational framework</p>
        </div>
      </section>

      {/* ==========================================================
           PAGE 10 - WHY CHOOSE MISTRO
           ========================================================== */}
      <section className="why-choose-section" id="why-choose">
        <div className="section-container">
          <div className="section-header">
            <span className="badge-tag">Our Strengths</span>
            <h2 className="section-title">Why Choose MISTRO</h2>
            <p className="section-subtitle">We focus on standardizing quality, safety, and booking convenience.</p>
          </div>
          
          <div className="zig-zag-layout">
            {/* Feature 1: Left Content, Right Graphic */}
            <div className="zig-zag-row reveal-slide-left">
              <div className="zig-content">
                <span className="zig-num">01</span>
                <h3>Verified Professionals</h3>
                <p>Every professional on our database undergoes direct government documentation screening, ID verification, and quality background checks so your safety is never compromised.</p>
              </div>
              <div className="zig-graphic glass-card">
                <i className="fas fa-shield-alt zig-icon color-orange"></i>
                <div className="zig-card-decoration"></div>
              </div>
            </div>
            
            {/* Feature 2: Right Content, Left Graphic */}
            <div className="zig-zag-row reverse reveal-slide-right">
              <div className="zig-content">
                <span className="zig-num">02</span>
                <h3>Fast Booking</h3>
                <p>Our intelligent scheduling pipeline automatically selects the closest available technician to dispatch right away, resolving major utility breakdowns in under an hour.</p>
              </div>
              <div className="zig-graphic glass-card">
                <i className="fas fa-bolt zig-icon color-blue"></i>
                <div className="zig-card-decoration"></div>
              </div>
            </div>
            
            {/* Feature 3: Left Content, Right Graphic */}
            <div className="zig-zag-row reveal-slide-left">
              <div className="zig-content">
                <span className="zig-num">03</span>
                <h3>Transparent Pricing</h3>
                <p>No negotiations, no guesswork. Every specific repair job has a transparent flat-rate quote shown prior to dispatch. Pay securely with card, UPI, or digital wallets.</p>
              </div>
              <div className="zig-graphic glass-card">
                <i className="fas fa-hand-holding-usd zig-icon color-orange"></i>
                <div className="zig-card-decoration"></div>
              </div>
            </div>
            
            {/* Feature 4: Right Content, Left Graphic */}
            <div className="zig-zag-row reverse reveal-slide-right">
              <div className="zig-content">
                <span className="zig-num">04</span>
                <h3>Secure Platform</h3>
                <p>Your interactions and scheduling data are protected by strict privacy checks. Service issues are backed by MISTRO insurance and customer support guarantees.</p>
              </div>
              <div className="zig-graphic glass-card">
                <i className="fas fa-lock zig-icon color-blue"></i>
                <div className="zig-card-decoration"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
           PAGE 11 - HOW IT WORKS
           ========================================================== */}
      <section className="how-works-section" id="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <span className="badge-tag">Simple Steps</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Experience a hassle-free flow from booking to review in minutes.</p>
          </div>
          
          {/* Horizontal Process Flow */}
          <div className="process-flow-container">
            {/* SVG connecting flow line */}
            <div className="process-line-track">
              <div className="process-line-fill" id="process-line-fill"></div>
            </div>
            
            <div className="process-steps">
              {/* Step 1 */}
              <div className="process-step-item active" id="p-step-1">
                <div className="step-circle">
                  <i className="fas fa-search"></i>
                </div>
                <h4>Search Service</h4>
                <p>Choose your repair category from our catalog.</p>
              </div>
              
              {/* Step 2 */}
              <div className="process-step-item" id="p-step-2">
                <div className="step-circle">
                  <i className="fas fa-users-cog"></i>
                </div>
                <h4>Choose Professional</h4>
                <p>Compare local workers by ratings and base fares.</p>
              </div>
              
              {/* Step 3 */}
              <div className="process-step-item" id="p-step-3">
                <div className="step-circle">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <h4>Book Appointment</h4>
                <p>Pick a convenient schedule slot instantly.</p>
              </div>
              
              {/* Step 4 */}
              <div className="process-step-item" id="p-step-4">
                <div className="step-circle">
                  <i className="fas fa-toolbox"></i>
                </div>
                <h4>Service Completion</h4>
                <p>Technician finishes work on-site safely.</p>
              </div>
              
              {/* Step 5 */}
              <div className="process-step-item" id="p-step-5">
                <div className="step-circle">
                  <i className="fas fa-star-half-alt"></i>
                </div>
                <h4>Rate Experience</h4>
                <p>Pay digitally and review your professional's work.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
           PAGE 12 - CONTACT & CTA
           ========================================================== */}
      <section className="contact-cta-section" id="contact">
        {/* Animated city skyline background */}
        <div className="skyline-container">
          <svg className="city-skyline" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <path className="skyline-bg-buildings" d="M0,400 L0,320 L40,320 L40,280 L90,280 L90,340 L150,340 L150,220 L210,220 L210,310 L270,310 L270,250 L340,250 L340,330 L400,330 L400,190 L460,190 L460,290 L520,290 L520,260 L600,260 L600,340 L670,340 L670,200 L730,200 L730,310 L790,310 L790,270 L860,270 L860,340 L930,340 L930,210 L990,210 L990,300 L1060,300 L1060,240 L1130,240 L1130,330 L1200,330 L1200,400 Z" fill="#0c1222" opacity="0.6"/>
            <path className="skyline-fg-buildings" d="M0,400 L0,350 L60,350 L60,300 L120,300 L120,360 L180,360 L180,260 L240,260 L240,330 L300,330 L300,280 L380,280 L380,350 L440,350 L440,220 L500,220 L500,320 L560,320 L560,290 L640,290 L640,370 L700,370 L700,240 L760,240 L760,340 L820,340 L820,290 L900,290 L900,360 L970,360 L970,250 L1030,250 L1030,330 L1100,330 L1100,270 L1170,270 L1170,350 L1200,350 L1200,400 Z" fill="#080c16"/>
          </svg>
          <div className="skyline-gradient-beam"></div>
        </div>
        
        <div className="section-container contact-grid-container">
          {/* Left: CTA */}
          <div className="cta-left-box">
            <h2 className="cta-headline">Ready to Experience Hassle-Free Home Services?</h2>
            <p className="cta-subtext">Book a reliable, professional home maintenance expert in just a few clicks.</p>
            <div className="cta-buttons">
              <button className="btn-accent" id="cta-book-btn" onClick={() => handleBookNow()}>Book Service</button>
              <a href="mailto:support@mistro.in" className="btn-secondary" id="cta-contact-btn">Email Support</a>
            </div>
          </div>
          
          {/* Right: Contact Form */}
          <div className="contact-right-form glass-card">
            <h3>Send Us a Message</h3>
            <p>Have questions? Reach out to our support team directly.</p>
            <form id="contact-form" className="contact-form-element">
              <div className="form-group">
                <input type="text" id="contact-name" required placeholder="Full Name" />
              </div>
              <div className="form-group">
                <input type="email" id="contact-email" required placeholder="Email Address" />
              </div>
              <div className="form-group">
                <textarea id="contact-message" rows={3} required placeholder="Your Message"></textarea>
              </div>
              <button type="submit" className="btn-accent" id="contact-submit-btn">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* ==========================================================
           FOOTER
           ========================================================== */}
      <footer className="footer-section">
        <div className="section-container footer-grid">
          {/* Col 1: Brand */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <img src="/mistro logo.png" alt="MISTRO Logo" />
              <span>MISTRO</span>
            </div>
            <p className="footer-tagline">Service On. Stress Gone.</p>
            <p className="footer-copyright">&copy; 2026 MISTRO Tech. All rights reserved.</p>
          </div>
          
          {/* Col 2: Services */}
          <div className="footer-col">
            <h3>Services</h3>
            <ul>
              <li><a href="#services">⚡ Electrician</a></li>
              <li><a href="#services">🔧 Plumbing</a></li>
              <li><a href="#services">🪚 Carpentry</a></li>
              <li><a href="#services">🧹 Cleaning</a></li>
            </ul>
          </div>
          
          {/* Col 3: Resources */}
          <div className="footer-col">
            <h3>Resources</h3>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#problem">How It Works</a></li>
              <li><a href="#contact">FAQ / Help Center</a></li>
              <li><a href="#contact">Careers</a></li>
            </ul>
          </div>
          
          {/* Col 4: Social Media */}
          <div className="footer-col social-col">
            <h3>Follow Us</h3>
            <div className="social-links">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
            </div>
          </div>
        </div>
      </footer>

      {/* ==========================================================
           VIDEO MODAL POPUP
           ========================================================== */}
      <div className="video-modal-overlay" id="video-modal">
        <div className="video-modal-container">
          <button className="video-modal-close" id="close-video-modal" aria-label="Close video player">×</button>
          <div className="video-player-wrapper">
            <video controls className="modal-video-element" id="modal-video-player">
              <source src="/demo video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>

      {/* ==========================================================
           FLOATING AI CHAT BOT TRIGGER
           ========================================================== */}
      <div className="floating-chat-trigger" id="chatbot-float-trigger" aria-label="Open AI Assistant">
        <i className="fas fa-robot"></i>
        <span className="chat-trigger-pulse"></span>
      </div>
    </>
  );
};

export default Home;
