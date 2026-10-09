/* ==========================================================================
   MISTRO PREMIUM STARTUP WEBSITE SCRIPT (GSAP, LENIS, CUSTOM EFFECTS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Initialize features
  initLenisSmoothScroll();
  initNavbarScroll();
  initCursorGlow();
  initHeroParticles();
  initHeroParallax();
  initScrollAnimations();
  initProblemTimeline();
  initSolutionTilt();
  initAppShowcase();
  initImpactCounters();
  initAIChatbot();
  initVideoModal();
  initHowItWorksFlow();
  initBookingModal();
});

/* --- 1. LENIS SMOOTH SCROLL --- */
let lenis;
function initLenisSmoothScroll() {
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    
    // Connect GSAP ScrollTrigger to Lenis
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }
}

/* --- 2. NAVBAR SCROLL EFFECT --- */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/* --- 3. CURSOR GLOW EFFECT --- */
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;

  window.addEventListener('mousemove', (e) => {
    // Smooth pointer tracking
    gsap.to(glow, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.1,
      ease: 'power1.out'
    });
  });
}

/* --- 4. HERO SECTION PARTICLES --- */
function initHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

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

/* --- 5. HERO MOUSE PARALLAX --- */
function initHeroParallax() {
  const scene = document.getElementById('hero-parallax-scene');
  if (!scene) return;

  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX - window.innerWidth / 2) / 35;
    const y = (e.clientY - window.innerHeight / 2) / 35;

    // Parallax on badges
    const badges = scene.querySelectorAll('.floating-service-icon');
    badges.forEach(badge => {
      const depth = parseFloat(badge.getAttribute('data-depth')) || 0.2;
      const moveX = x * depth * 20;
      const moveY = y * depth * 20;
      
      gsap.to(badge, {
        x: moveX,
        y: moveY,
        duration: 0.6,
        ease: 'power2.out'
      });
    });

    // Subtler parallax on the central house model
    const house = scene.querySelector('.house-wrapper');
    if (house) {
      gsap.to(house, {
        x: x * 4,
        y: y * 4,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  });
}

/* --- 6. GENERAL SCROLL REVEALS (GSAP) --- */
function initScrollAnimations() {
  if (typeof gsap === 'undefined') return;

  // Zoom reveals (About Image)
  gsap.from('.reveal-zoom', {
    scale: 0.9,
    opacity: 0,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.reveal-zoom',
      start: 'top 85%',
      toggleActions: 'play none none none'
    }
  });

  // Scale up loops slightly on scrolling past
  gsap.to('.about-video-loop', {
    scale: 1.08,
    scrollTrigger: {
      trigger: '.about-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    }
  });

  // Slide left animations
  const slideLefts = document.querySelectorAll('.reveal-slide-left');
  slideLefts.forEach(item => {
    gsap.from(item, {
      x: -80,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: item,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // Slide right animations
  const slideRights = document.querySelectorAll('.reveal-slide-right');
  slideRights.forEach(item => {
    gsap.from(item, {
      x: 80,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: item,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // Generic fade-ups
  const fadeUps = document.querySelectorAll('.reveal-fade');
  fadeUps.forEach(item => {
    gsap.from(item, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: item,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });
}

/* --- 7. PROBLEM TIMELINE DRAWING --- */
function initProblemTimeline() {
  if (typeof gsap === 'undefined') return;

  // Draw central line on scroll
  gsap.to('#timeline-line-progress', {
    height: '100%',
    scrollTrigger: {
      trigger: '.timeline-container',
      start: 'top 30%',
      end: 'bottom 70%',
      scrub: true
    }
  });

  // Highlight timeline elements as they are crossed
  const timelineItems = document.querySelectorAll('.timeline-item');
  timelineItems.forEach(item => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 70%',
      onEnter: () => item.classList.add('active'),
      onLeaveBack: () => item.classList.remove('active')
    });
  });
}

/* --- 8. SOLUTIONS TILT EFFECT --- */
function initSolutionTilt() {
  const cards = document.querySelectorAll('.tilt-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      
      // Calculate rotation degree
      const rotateX = (yc - y) / 8;
      const rotateY = (x - xc) / 8;
      
      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        y: -6,
        duration: 0.3,
        ease: 'power1.out'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    });
  });
}

/* --- 9. APP SHOWCASE SCREEN AUTO-CYCLE --- */
let appCarouselTimer;
function initAppShowcase() {
  const features = document.querySelectorAll('.feature-item');
  const screens = document.querySelectorAll('.app-mockup-screen');
  
  if (features.length === 0) return;

  let currentIndex = 0;
  const slideDuration = 4000; // 4 seconds per screen

  function switchScreen(index) {
    currentIndex = index;
    
    // Update active screen
    screens.forEach(screen => screen.classList.remove('active'));
    const targetScreenId = `screen-${features[index].getAttribute('data-screen')}`;
    const targetScreen = document.getElementById(targetScreenId);
    if (targetScreen) targetScreen.classList.add('active');

    // Update active feature indicator
    features.forEach(feat => feat.classList.remove('active'));
    features[index].classList.add('active');
  }

  function startAutoCycle() {
    appCarouselTimer = setInterval(() => {
      let nextIndex = (currentIndex + 1) % features.length;
      switchScreen(nextIndex);
    }, slideDuration);
  }

  function resetAutoCycle() {
    clearInterval(appCarouselTimer);
    startAutoCycle();
  }

  // Handle click on feature items to switch manually
  features.forEach((feat, idx) => {
    feat.addEventListener('click', () => {
      switchScreen(idx);
      resetAutoCycle();
    });
  });

  // Start cycling initially
  startAutoCycle();
}

/* --- 10. IMPACT COUNTERS --- */
function initImpactCounters() {
  if (typeof gsap === 'undefined') return;

  const stats = document.querySelectorAll('.stat-number');
  stats.forEach(stat => {
    const target = parseInt(stat.getAttribute('data-target')) || 0;
    const countObj = { val: 0 };

    gsap.to(countObj, {
      val: target,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: stat,
        start: 'top 85%',
        once: true
      },
      onUpdate: () => {
        stat.textContent = Math.floor(countObj.val);
      },
      onComplete: () => {
        stat.textContent = target; // Ensure exact final value
      }
    });
  });
}

/* --- 11. AI CHATBOT INTERACTIVE SYSTEM --- */
function initAIChatbot() {
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-user-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const chips = document.querySelectorAll('.chat-chip-btn');
  const floatTrigger = document.getElementById('chatbot-float-trigger');

  if (!chatMessages) return;

  // Bot responses library
  const botReplies = {
    'bedroom lights': '💡 I recommend booking an **Electrician**. Based on your flickering issue, our certified electrician Kumar S is nearby (350m away) and can diagnose the switchboard or loose connection. Fares start at ₹149.',
    'sink leak': '💧 You need a **Plumber**. I can alert Priya M or Rajesh K, our top-rated local plumbing technicians. They can clear clogs and fix leaking piping under the basin instantly.',
    'verifying workers': '🆔 MISTRO secures your home. All dispatched professionals wear a digital MISTRO badge. You can view their government KYC, ID photo, and background safety verification on your app screen before they arrive.',
    'default': '🤖 Thank you for reaching out! Let me know if you need to book an **Electrician, Plumber, Carpenter, or Cleaning specialist**. I can match a verified professional in 30 seconds.'
  };

  function appendMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chat-message ${sender}`;
    bubble.innerHTML = `<p>${text}</p>`;
    chatMessages.appendChild(bubble);
    
    // Auto-scroll chat box
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function simulateBotReply(userQuery) {
    // Show a typing bubble
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-message bot typing-indicator';
    typingBubble.innerHTML = '<p>MISTRO AI is thinking...</p>';
    chatMessages.appendChild(typingBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
      // Remove typing bubble
      chatMessages.removeChild(typingBubble);

      // Match replies
      const queryLower = userQuery.toLowerCase();
      let reply = botReplies['default'];
      
      if (queryLower.includes('light') || queryLower.includes('flicker') || queryLower.includes('electrical')) {
        reply = botReplies[' bedroom lights'];
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
  }

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';
    simulateBotReply(text);
  }

  // Handle send triggers
  if (sendBtn) sendBtn.addEventListener('click', handleSend);
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  // Handle chip button clicks
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.getAttribute('data-input');
      appendMessage(promptText, 'user');
      simulateBotReply(promptText);
    });
  });

  // Floating chatbot trigger scroll actions
  if (floatTrigger) {
    floatTrigger.addEventListener('click', () => {
      // Smooth scroll to chat section
      const aiSection = document.getElementById('ai-assistant');
      if (aiSection) {
        if (lenis) {
          lenis.scrollTo(aiSection);
        } else {
          aiSection.scrollIntoView({ behavior: 'smooth' });
        }
        setTimeout(() => chatInput.focus(), 800);
      }
    });
  }
}

/* --- 12. VIDEO MODAL POPUP --- */
function initVideoModal() {
  const triggers = document.querySelectorAll('.play-trigger');
  const modal = document.getElementById('video-modal');
  const closeBtn = document.getElementById('close-video-modal');
  const player = document.getElementById('modal-video-player');

  if (!modal) return;

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const videoSrc = trigger.getAttribute('data-video');
      if (player && videoSrc) {
        const source = player.querySelector('source');
        if (source) {
          source.setAttribute('src', videoSrc);
          player.load();
        }
      }
      modal.classList.add('active');
      if (player) {
        player.currentTime = 0;
        player.play().catch(err => console.log('Video autoplay blocked or issue:', err));
      }
      // Stop Lenis scroll when video is overlayed
      if (lenis) lenis.stop();
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    if (player) player.pause();
    // Restart Lenis scroll
    if (lenis) lenis.start();
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Press ESC to close modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* --- 13. HOW IT WORKS PROGRESS FLOW --- */
function initHowItWorksFlow() {
  if (typeof gsap === 'undefined') return;

  // Fill up progress line horizontally as scroll goes
  gsap.to('#process-line-fill', {
    width: '100%',
    scrollTrigger: {
      trigger: '.process-flow-container',
      start: 'top 70%',
      end: 'bottom 60%',
      scrub: true
    }
  });

  // Highlight process circles
  const steps = document.querySelectorAll('.process-step-item');
  steps.forEach((step, idx) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 75%',
      onEnter: () => step.classList.add('active'),
      onLeaveBack: () => step.classList.remove('active')
    });
  });
}

/* --- 14. BOOKING MODAL & API INTEGRATION --- */
function initBookingModal() {
  const modal = document.getElementById('booking-modal');
  const closeBtn = document.getElementById('close-booking-modal');
  const triggers = document.querySelectorAll('.open-booking-trigger');
  const bookingForm = document.getElementById('booking-form');
  const contactForm = document.getElementById('contact-form');
  const serviceSelect = document.getElementById('booking-service');

  if (!modal) return;

  // Toast helper function
  function showToast(message, isError = false) {
    let toast = document.querySelector('.mistro-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'mistro-toast';
      document.body.appendChild(toast);
    }
    const icon = isError ? 'fa-exclamation-triangle' : 'fa-check-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    
    // Trigger CSS animation
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 4000);
  }

  // Open booking modal
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const selectedService = trigger.getAttribute('data-service');
      if (selectedService && serviceSelect) {
        serviceSelect.value = selectedService;
      } else if (serviceSelect) {
        serviceSelect.selectedIndex = 0; // Default placeholder
      }
      modal.classList.add('active');
      if (lenis) lenis.stop();
    });
  });

  // Close booking modal
  function closeModal() {
    modal.classList.remove('active');
    if (lenis) lenis.start();
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Close booking modal on Esc key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Submit booking form
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('booking-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
      }

      const bookingData = {
        name: document.getElementById('booking-name').value.trim(),
        phone: document.getElementById('booking-phone').value.trim(),
        service: document.getElementById('booking-service').value,
        date: document.getElementById('booking-date').value,
        slot: document.getElementById('booking-slot').value,
        address: document.getElementById('booking-address').value.trim()
      };

      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookingData)
        });

        const result = await response.json();
        
        if (result.success) {
          showToast('Booking Request Confirmed! MISTRO will connect you with a professional.');
          bookingForm.reset();
          closeModal();
        } else {
          showToast(result.error || 'Booking failed. Please check your details.', true);
        }
      } catch (err) {
        console.error('Booking submission error:', err);
        showToast('Connection error. Please try again later.', true);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm Booking';
        }
      }
    });
  }

  // Submit contact form
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('contact-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      const contactData = {
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        message: document.getElementById('contact-message').value.trim()
      };

      try {
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactData)
        });

        const result = await response.json();
        
        if (result.success) {
          showToast('Message Sent! Our support team will contact you shortly.');
          contactForm.reset();
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
    });
  }
}
