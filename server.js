require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db-mongo');
const smsService = require('./services/sms');
const paymentService = require('./services/payment');
const notifService = require('./services/notification');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and parsing middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from Vite build output
app.use(express.static(path.join(__dirname, 'dist')));
// Serve media assets and other static files from root directory
app.use(express.static(path.join(__dirname)));

// Initialize database storage files
db.initDb();

// Secret token for admin authentication
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "mistro-admin-session-token-2026";

/* ==========================================================
   AUTHENTICATION MIDDLEWARES
   ========================================================== */

// Admin Authentication Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader === `Bearer ${ADMIN_TOKEN}`) {
    next();
  } else {
    res.status(401).json({ success: false, error: "Unauthorized admin access" });
  }
}

// User Authentication Middleware
async function requireUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: "Authentication token missing" });
  }

  const token = authHeader.split(' ')[1];
  const user = await db.getUserBySessionToken(token);

  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid or expired session token" });
  }

  req.user = user;
  next();
}

// Worker Authentication Middleware
async function requireWorker(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: "Authentication token missing" });
  }

  const token = authHeader.split(' ')[1];
  const user = await db.getUserBySessionToken(token);

  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid or expired session token" });
  }

  if (user.role !== 'worker') {
    return res.status(403).json({ success: false, error: "Access denied. Worker credentials required." });
  }

  req.user = user;
  next();
}

// Optional User Middleware (Attaches user if token exists, otherwise continues)
async function optionalUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = await db.getUserBySessionToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

/* ==========================================================
   REST API ENDPOINTS
   ========================================================== */

/* ==========================================================
   WORKER & PARTNER PORTAL API ENDPOINTS
   ========================================================== */

// Worker Registration
app.post('/api/worker/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, service, specialization, experience, serviceArea, bio, profilePhoto } = req.body;

    if (!name || !email || !password || !service) {
      return res.status(400).json({ success: false, error: "Full Name, email, password, and service category are required" });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, error: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters long" });
    }

    const { user, provider } = await db.createWorkerAccount({
      name, email, phone, password, service, specialization, experience, serviceArea, bio, profilePhoto
    });

    const token = await db.createSession(user);

    res.status(201).json({
      success: true,
      message: "Worker account created successfully",
      user,
      provider,
      token
    });
  } catch (err) {
    console.error("Worker register error:", err.message);
    res.status(400).json({ success: false, error: err.message || "Failed to register worker profile" });
  }
});

// Worker Login
app.post('/api/worker/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const result = await db.authenticateWorker(email, password);
    if (!result) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const token = await db.createSession(result.user);

    res.json({
      success: true,
      message: "Worker login successful",
      user: result.user,
      provider: result.provider,
      token
    });
  } catch (err) {
    console.error("Worker login error:", err.message);
    res.status(400).json({ success: false, error: err.message || "Worker authentication failed" });
  }
});

// Worker 1-Click Demo Login (Ramesh Kumar, Karthik Raja, Murugan, Lakshmi, Suresh)
app.post('/api/worker/demo-login', async (req, res) => {
  try {
    const { workerId, email, name } = req.body || {};
    const result = await db.demoWorkerLogin({ workerId, email, name });
    const token = await db.createSession(result.user);

    res.json({
      success: true,
      message: `Logged in as ${result.provider.name}`,
      user: result.user,
      provider: result.provider,
      token
    });
  } catch (err) {
    console.error("Demo worker login error:", err.message);
    res.status(400).json({ success: false, error: err.message || "Failed to log in demo worker" });
  }
});

// Get Worker Profile & Provider Details
app.get('/api/worker/profile', requireWorker, async (req, res) => {
  try {
    const provider = await db.getProviderByUserId(req.user.id);
    res.json({ success: true, user: req.user, provider });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch worker profile" });
  }
});

// Update Worker Profile
app.put('/api/worker/profile', requireWorker, async (req, res) => {
  try {
    const updated = await db.updateWorkerProfile(req.user.id, req.body);
    if (updated) {
      res.json({ success: true, message: "Profile updated successfully", provider: updated });
    } else {
      res.status(404).json({ success: false, error: "Worker profile not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
});

// Toggle Worker Availability (Available vs Offline)
app.put('/api/worker/availability', requireWorker, async (req, res) => {
  try {
    const { availability } = req.body;
    if (!availability || (availability !== 'Available' && availability !== 'Offline')) {
      return res.status(400).json({ success: false, error: "Availability must be 'Available' or 'Offline'" });
    }

    const provider = await db.updateWorkerAvailability(req.user.id, availability);
    res.json({ success: true, availability: provider.availability, provider });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update availability" });
  }
});

// Fetch Incoming Requests for Worker
app.get('/api/worker/requests', requireWorker, async (req, res) => {
  try {
    const requests = await db.getWorkerIncomingRequests(req.user.id);
    res.json({ success: true, requests, count: requests.length });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch incoming requests" });
  }
});

// Accept Request
app.post('/api/worker/bookings/:bookingId/accept', requireWorker, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await db.acceptBookingByWorker(bookingId, req.user.id);

    // SMS Alert to Customer
    await smsService.sendBookingConfirmationSMS(booking.phone, req.user.name, booking.service, booking.slot);

    // Persistent Notification to Customer
    if (booking.userId) {
      await notifService.createNotification({
        userId: booking.userId,
        recipientRole: 'customer',
        title: 'Booking Accepted!',
        message: `${req.user.name} has accepted your ${booking.service} booking request for ${booking.slot}.`,
        type: 'BOOKING_ACCEPTED',
        bookingId
      });
    }

    res.json({ success: true, message: "Booking accepted successfully!", booking });
  } catch (err) {
    console.error("Worker accept error:", err.message);
    res.status(400).json({ success: false, error: err.message || "Failed to accept booking" });
  }
});

// Reject Request
app.post('/api/worker/bookings/:bookingId/reject', requireWorker, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body || {};
    await db.rejectBookingByWorker(bookingId, req.user.id, reason);
    res.json({ success: true, message: "Booking request rejected" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to reject booking request" });
  }
});

// Fetch Worker Active & Completed Jobs
app.get('/api/worker/jobs', requireWorker, async (req, res) => {
  try {
    const { activeJobs, completedJobs } = await db.getWorkerJobs(req.user.id);
    res.json({ success: true, activeJobs, completedJobs });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch worker jobs" });
  }
});

// Update Job Status (Accepted -> On the Way -> Arrived -> In Progress -> Completed)
app.put('/api/worker/bookings/:bookingId/status', requireWorker, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: "Status field is required" });
    }

    const updatedBooking = await db.updateWorkerJobStatus(bookingId, req.user.id, status);

    // SMS Alert to Customer
    await smsService.sendBookingStatusSMS(updatedBooking.phone, req.user.name, status);

    // Persistent Notification to Customer
    if (updatedBooking.userId) {
      await notifService.createNotification({
        userId: updatedBooking.userId,
        recipientRole: 'customer',
        title: `Status Update: ${status}`,
        message: `${req.user.name} updated your service status to "${status}".`,
        type: 'STATUS_UPDATE',
        bookingId
      });
    }

    res.json({ success: true, booking: updatedBooking });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || "Failed to update job status" });
  }
});

// Worker Dashboard Consolidated Stats & Notification Polling Endpoint
app.get('/api/worker/dashboard', requireWorker, async (req, res) => {
  try {
    const data = await db.getWorkerDashboardData(req.user.id);
    if (!data) {
      return res.status(404).json({ success: false, error: "Worker data not found" });
    }
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to load worker dashboard data" });
  }
});

app.get('/api/worker/notifications', requireWorker, async (req, res) => {
  try {
    const requests = await db.getWorkerIncomingRequests(req.user.id);
    res.json({ success: true, count: requests.length, latestRequest: requests[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});

// 1. AUTHENTICATION ENDPOINTS
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters long" });
    }

    const user = await db.createUser({ name, email, password });
    const token = await db.createSession(user);

    res.status(201).json({ success: true, message: "Account created successfully", user, token });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(400).json({ success: false, error: err.message || "Failed to create account" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const user = await db.authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const token = await db.createSession(user);
    res.json({ success: true, message: "Login successful", user, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Authentication failed" });
  }
});

app.get('/api/auth/me', requireUser, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Update user profile details
app.put('/api/user/profile', requireUser, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updatedUser = await db.updateUserProfile(req.user.id, { name, phone, address });
    if (updatedUser) {
      res.json({ success: true, message: "Profile updated successfully", user: updatedUser });
    } else {
      res.status(404).json({ success: false, error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
});

// Change user password
app.put('/api/user/password', requireUser, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Old password and new password are required" });
    }

    await db.changeUserPassword(req.user.id, oldPassword, newPassword);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || "Failed to update password" });
  }
});

// 2. SERVICE BOOKINGS & LIVE TRACKING ENDPOINTS

// Submit booking (Supports guest or authenticated users & direct worker selection)
app.post('/api/bookings', optionalUser, async (req, res) => {
  try {
    const { name, phone, service, selectedProviderId, selectedProviderName, problem, urgency, date, slot, address, coordinates } = req.body;
    
    if (!name || !phone || !service || !date || !slot || !address) {
      return res.status(400).json({ success: false, error: "Missing required booking details" });
    }

    const userId = req.user ? req.user.id : null;
    const booking = await db.saveBooking({ name, phone, service, selectedProviderId, selectedProviderName, problem, urgency, date, slot, address, coordinates }, userId);
    
    // Dispatch SMS and Persistent Notification to Target Worker
    if (selectedProviderId) {
      const targetProvider = await db.getProviderByUserId(selectedProviderId);
      if (targetProvider) {
        // SMS Alert
        await smsService.sendBookingRequestSMS(targetProvider.phone, name, service, slot);

        // Persistent Notification
        if (targetProvider.userId) {
          await notifService.createNotification({
            userId: targetProvider.userId,
            recipientRole: 'worker',
            title: 'New Booking Request',
            message: `New ${service} booking request from ${name} for ${slot}.`,
            type: 'BOOKING_REQUEST',
            bookingId: booking.id
          });
        }
      }
    }

    res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ success: false, error: "Failed to process booking request" });
  }
});

// Get booking live tracking status with ETAs
app.get('/api/bookings/:id/track', optionalUser, async (req, res) => {
  try {
    const { id } = req.params;
    const tracking = await db.getBookingTrackingStatus(id);
    if (tracking) {
      res.json({ success: true, tracking, booking: tracking.booking || tracking });
    } else {
      res.status(404).json({ success: false, error: "Booking not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to load tracking status" });
  }
});

// Process payment for booking
app.post('/api/bookings/:id/payment', optionalUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, amount } = req.body;
    const updatedBooking = await db.processPayment(id, { paymentMethod, amount });
    if (updatedBooking) {
      res.json({ success: true, message: "Payment processed successfully", booking: updatedBooking });
    } else {
      res.status(404).json({ success: false, error: "Booking not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to process payment" });
  }
});

// Retrieve itemized invoice
app.get('/api/bookings/:id/invoice', optionalUser, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await db.getInvoice(id);
    if (invoice) {
      res.json({ success: true, invoice });
    } else {
      res.status(404).json({ success: false, error: "Booking not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to generate invoice" });
  }
});

// Get user's own bookings
app.get('/api/user/bookings', requireUser, async (req, res) => {
  try {
    const bookings = await db.getBookingsByUserId(req.user.id);
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch user bookings" });
  }
});

// Retrieve all bookings list (Admin Only)
app.get('/api/bookings', requireAdmin, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch bookings list" });
  }
});

// Update a booking status (Admin Only)
app.put('/api/bookings/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, error: "Missing new status" });
    }

    const updatedBooking = await db.updateBookingStatus(id, status);
    if (updatedBooking) {
      res.json({ success: true, booking: updatedBooking });
    } else {
      res.status(404).json({ success: false, error: "Booking request not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update booking status" });
  }
});

// Assign provider to a booking (Admin Only)
app.post('/api/bookings/:id/assign', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { providerId } = req.body;

    if (!providerId) {
      return res.status(400).json({ success: false, error: "Provider ID is required" });
    }

    const booking = await db.assignProviderToBooking(id, providerId);
    if (booking) {
      res.json({ success: true, booking });
    } else {
      res.status(404).json({ success: false, error: "Booking or provider not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to assign provider" });
  }
});

// Cancel/Delete booking request
app.delete('/api/bookings/:id', optionalUser, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await db.getBookingById(id);

    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    // Allow if admin or if booking belongs to current user
    const authHeader = req.headers['authorization'];
    const isAdmin = authHeader && authHeader === `Bearer ${ADMIN_TOKEN}`;
    const isOwner = req.user && req.user.id === booking.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: "Permission denied" });
    }

    await db.deleteBooking(id);
    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to cancel booking" });
  }
});

// 3. SERVICE PROVIDERS & CATALOG ENDPOINTS

app.get('/api/services', async (req, res) => {
  try {
    const services = await db.getServices();
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch services catalog" });
  }
});

app.get('/api/providers', async (req, res) => {
  try {
    const { service } = req.query;
    let providers;
    if (service) {
      providers = await db.getProvidersByCategory(service);
    } else {
      providers = await db.getProviders();
    }
    res.json({ success: true, providers });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch service providers" });
  }
});

app.get('/api/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await db.getProviderByUserId(id);
    if (provider) {
      res.json({ success: true, provider });
    } else {
      res.status(404).json({ success: false, error: "Provider profile not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch provider profile" });
  }
});

app.post('/api/providers', requireAdmin, async (req, res) => {
  try {
    const { name, service, phone, badge } = req.body;
    if (!name || !service || !phone) {
      return res.status(400).json({ success: false, error: "Name, service category, and phone are required" });
    }

    const provider = await db.addProvider({ name, service, phone, badge });
    res.status(201).json({ success: true, provider });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to create service provider profile" });
  }
});

app.put('/api/providers/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateProvider(id, req.body);
    if (updated) {
      res.json({ success: true, provider: updated });
    } else {
      res.status(404).json({ success: false, error: "Provider not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update provider profile" });
  }
});

app.delete('/api/providers/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteProvider(id);
    if (deleted) {
      res.json({ success: true, message: "Provider de-registered successfully" });
    } else {
      res.status(404).json({ success: false, error: "Provider not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to delete provider" });
  }
});

// 4. CUSTOMER REVIEWS ENDPOINTS

app.get('/api/reviews', async (req, res) => {
  try {
    const { category } = req.query;
    const reviews = await db.getReviews(category);
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch customer reviews" });
  }
});

app.post('/api/reviews', optionalUser, async (req, res) => {
  try {
    const { bookingId, rating, comment, service } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ success: false, error: "Rating and comment are required" });
    }

    const userName = req.user ? req.user.name : req.body.userName;
    const userId = req.user ? req.user.id : null;

    const review = await db.addReview({ bookingId, userId, userName, rating, comment, service });
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to submit review" });
  }
});

// 4. CONTACT INQUIRIES ENDPOINTS

app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Missing required contact details" });
    }

    const contact = await db.saveContact({ name, email, message });
    res.status(201).json({ success: true, contact });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ success: false, error: "Failed to submit contact message" });
  }
});

app.get('/api/contacts', requireAdmin, async (req, res) => {
  try {
    const contacts = await db.getContacts();
    res.json({ success: true, contacts });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch inquiries list" });
  }
});

app.put('/api/contacts/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await db.updateContactStatus(id, status);
    if (updated) {
      res.json({ success: true, contact: updated });
    } else {
      res.status(404).json({ success: false, error: "Contact inquiry not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update inquiry status" });
  }
});

/* ==========================================================
   MSG91 SMS & PHONE OTP ENDPOINTS
   ========================================================== */

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone, purpose } = req.body;
    const result = await smsService.sendPhoneOTP(phone, purpose);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || "Failed to send OTP" });
  }
});

app.post('/api/auth/verify-otp', optionalUser, async (req, res) => {
  try {
    const { phone, otpCode } = req.body;
    const userId = req.user ? req.user.id : null;
    const result = await smsService.verifyPhoneOTP(phone, otpCode, userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || "Invalid OTP code" });
  }
});

/* ==========================================================
   RAZORPAY PAYMENTS ENDPOINTS
   ========================================================== */

app.post('/api/payments/create-order', optionalUser, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const customerId = req.user ? req.user.id : null;
    const result = await paymentService.createPaymentOrder({ bookingId, customerId, amount });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || "Failed to create payment order" });
  }
});

app.post('/api/payments/verify', optionalUser, async (req, res) => {
  try {
    const { bookingId, gatewayOrderId, gatewayPaymentId, gatewaySignature } = req.body;
    const result = await paymentService.verifyPaymentSignature({ bookingId, gatewayOrderId, gatewayPaymentId, gatewaySignature });
    
    if (req.user) {
      await notifService.createNotification({
        userId: req.user.id,
        recipientRole: 'customer',
        title: 'Payment Successful',
        message: `Your payment of ₹${result.booking?.paidAmount || ''} was successfully processed!`,
        type: 'PAYMENT_SUCCESS',
        bookingId
      });
    }

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || "Payment verification failed" });
  }
});

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    await paymentService.processRazorpayWebhook(req.body, signature);
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ==========================================================
   PERSISTENT NOTIFICATIONS ENDPOINTS
   ========================================================== */

app.get('/api/notifications', optionalUser, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.query.userId;
    const role = req.query.role || (req.user ? req.user.role : null);
    if (!userId) {
      return res.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const data = await notifService.getUserNotifications(userId, role);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});

app.put('/api/notifications/:id/read', optionalUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : req.body.userId;
    const result = await notifService.markNotificationAsRead(id, userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update notification" });
  }
});

// 5. ADMIN LOGIN & PLATFORM METRICS

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const envUser = process.env.ADMIN_USERNAME || "admin";
  const envPass = process.env.ADMIN_PASSWORD || "mistrosecret2026";

  if (username === envUser && password === envPass) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ success: false, error: "Invalid username or password" });
  }
});

app.get('/api/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await db.getPlatformStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to load platform stats" });
  }
});

// Endpoint to catch client-side errors
app.post('/api/log-error', (req, res) => {
  console.log("\n=================== CLIENT-SIDE RUNTIME ERROR ===================");
  console.log("Message:", req.body.message);
  console.log("Source:", req.body.source);
  console.log("Line:", req.body.lineno, "Col:", req.body.colno);
  if (req.body.stack) {
    console.log("Stack Trace:\n", req.body.stack);
  }
  console.log("=================================================================\n");
  res.json({ success: true });
});

// Explicit fallback to serve index.html for all client-side routes (SPA)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==========================================================`);
  console.log(`MISTRO Full-Stack Application is running on port ${PORT}`);
  console.log(`Local Access: http://localhost:${PORT}`);
  console.log(`==========================================================`);
});

