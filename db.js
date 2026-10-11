const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROVIDERS_FILE = path.join(DATA_DIR, 'providers.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const OTPS_FILE = path.join(DATA_DIR, 'otps.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');

// Default initial data for Service Providers
const DEFAULT_PROVIDERS = [
  {
    id: "prov-101",
    name: "Ramesh Kumar",
    service: "Electrical",
    phone: "9876543210",
    rating: 4.9,
    totalJobs: 142,
    status: "Available",
    availability: "Available",
    badge: "Master Electrician",
    specialization: "Residential Wiring & Emergency Repairs",
    experience: 5,
    serviceArea: "Chennai Central & South",
    bio: "Certified master electrician with 5+ years of experience specializing in home wiring, fuse box repair, and smart lighting installation.",
    skills: ["Wiring & Rewiring", "Switchboard Repair", "Appliance Installation", "Short Circuit Fixing"],
    profilePhoto: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "prov-102",
    name: "Suresh V",
    service: "Electrical",
    phone: "9876543211",
    rating: 4.8,
    totalJobs: 98,
    status: "Available",
    availability: "Available",
    badge: "Wiring Specialist",
    specialization: "Electrical Fixtures & Inverter Repairs",
    experience: 4,
    serviceArea: "Chennai West & North",
    bio: "Reliable electrical technician experienced in inverter installation, panel boards, and complete house safety inspection.",
    skills: ["Inverter Setup", "Panel Maintenance", "MCB Troubleshooting", "LED Lighting"],
    profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "prov-201",
    name: "Karthik Raja",
    service: "Plumbing",
    phone: "9876543220",
    rating: 4.9,
    totalJobs: 185,
    status: "Available",
    availability: "Available",
    badge: "Senior Plumber",
    specialization: "Pipe Leakage & Sanitary Installation",
    experience: 6,
    serviceArea: "Chennai All Zones",
    bio: "Senior plumber with 6 years of expertise in high-pressure leak detection, tap replacement, and bathroom renovation plumbing.",
    skills: ["Leakage Repair", "Drain Unblocking", "Sanitary Ware Setup", "Water Heater Plumbing"],
    profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "prov-202",
    name: "Arun Prakash",
    service: "Plumbing",
    phone: "9876543221",
    rating: 4.7,
    totalJobs: 76,
    status: "Available",
    availability: "Available",
    badge: "Leakage Expert",
    specialization: "Overhead Tank & Pump Maintenance",
    experience: 3,
    serviceArea: "Chennai South",
    bio: "Expert plumbing technician focused on water motor pump fitting, overhead tank cleaning, and pipe network repairs.",
    skills: ["Motor Fitting", "Pipe Fitting", "Tap Repair", "Flush Tank Fix"],
    profilePhoto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "prov-301",
    name: "Murugan S",
    service: "Carpentry",
    phone: "9876543230",
    rating: 4.95,
    totalJobs: 210,
    status: "Available",
    availability: "Available",
    badge: "Custom Woodcraft",
    specialization: "Modular Furniture & Door Lock Fixes",
    experience: 8,
    serviceArea: "Chennai Central",
    bio: "Master carpenter specializing in custom wooden furniture creation, door hinge/lock replacement, and modular wardrobe repairs.",
    skills: ["Furniture Assembly", "Door Lock Fitting", "Cabinet Repair", "Wood Polishing"],
    profilePhoto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "prov-401",
    name: "Lakshmi Deep Clean",
    service: "Cleaning",
    phone: "9876543240",
    rating: 4.85,
    totalJobs: 160,
    status: "Available",
    availability: "Available",
    badge: "Sanitation Specialist",
    specialization: "Full Home & Kitchen Deep Sanitization",
    experience: 5,
    serviceArea: "Chennai Metro Area",
    bio: "Professional home hygiene specialist team using eco-friendly hospital grade disinfectants for complete kitchen and bathroom deep cleaning.",
    skills: ["Kitchen Degreasing", "Bathroom Scrubbing", "Sofa Shampooing", "Full House Sanitization"],
    profilePhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
  }
];

// Default initial data for Services Catalog
const DEFAULT_SERVICES = [
  {
    id: "srv-elect",
    name: "Electrical Services",
    category: "Electrical",
    icon: "⚡",
    startingPrice: 299,
    description: "Expert electrician support for wiring, fuse repairs, appliance installation, and smart lighting fixes.",
    features: ["Instant 30-min Arrival", "Verified Master Technicians", "60-Day Work Warranty"]
  },
  {
    id: "srv-plumb",
    name: "Plumbing Solutions",
    category: "Plumbing",
    icon: "🔧",
    startingPrice: 349,
    description: "Rapid resolution for pipe leaks, drain blockages, tap replacements, and bathroom fixture installation.",
    features: ["Advanced Leak Detection", "Eco-friendly Materials", "Clean-up Guarantee"]
  },
  {
    id: "srv-carp",
    name: "Carpentry & Assembly",
    category: "Carpentry",
    icon: "🪚",
    startingPrice: 399,
    description: "Custom furniture assembly, door & lock repair, modular cabinet installation, and custom woodworking.",
    features: ["Precision Wood Tooling", "Custom Lock Setup", "Hardware Sourcing Included"]
  },
  {
    id: "srv-clean",
    name: "Full Home Deep Cleaning",
    category: "Cleaning",
    icon: "🧹",
    startingPrice: 599,
    description: "Comprehensive home cleaning, sofa shampooing, kitchen degreasing, and bathroom sanitization.",
    features: ["Hospital-grade Sanitizers", "Steam Scrubbing Equipment", "Zero Residue Tech"]
  }
];

// Utility helper to safely read JSON files
async function readJsonFile(filePath, defaultValue = []) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return defaultValue;
  }
}

// Utility helper to safely write JSON files
async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Initialize database storage files
async function initDb() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Check & initialize bookings
    try { await fs.access(BOOKINGS_FILE); } catch { await writeJsonFile(BOOKINGS_FILE, []); }

    // Check & initialize contacts
    try { await fs.access(CONTACTS_FILE); } catch { await writeJsonFile(CONTACTS_FILE, []); }

    // Check & initialize users
    try { await fs.access(USERS_FILE); } catch { await writeJsonFile(USERS_FILE, []); }

    // Check & initialize sessions
    try { await fs.access(SESSIONS_FILE); } catch { await writeJsonFile(SESSIONS_FILE, {}); }

    // Check & initialize providers
    try {
      await fs.access(PROVIDERS_FILE);
    } catch {
      await writeJsonFile(PROVIDERS_FILE, DEFAULT_PROVIDERS);
    }

    // Check & initialize services
    try {
      await fs.access(SERVICES_FILE);
    } catch {
      await writeJsonFile(SERVICES_FILE, DEFAULT_SERVICES);
    }

    try { await fs.access(NOTIFICATIONS_FILE); } catch { await writeJsonFile(NOTIFICATIONS_FILE, []); }
    try { await fs.access(OTPS_FILE); } catch { await writeJsonFile(OTPS_FILE, []); }
    try { await fs.access(PAYMENTS_FILE); } catch { await writeJsonFile(PAYMENTS_FILE, []); }

    console.log("Database initialized successfully!");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
}

/* ==========================================================
   AUTHENTICATION & USER MANAGEMENT
   ========================================================== */

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

async function getUsers() {
  return await readJsonFile(USERS_FILE, []);
}

async function findUserByEmail(email) {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
}

async function findUserById(id) {
  const users = await getUsers();
  return users.find(u => u.id === id);
}

async function createUser({ name, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const { salt, hash } = hashPassword(password);
  const users = await getUsers();
  
  const newUser = {
    id: "usr-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    salt,
    passwordHash: hash,
    role: "customer",
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  await writeJsonFile(USERS_FILE, users);

  // Return user profile without salt/hash
  const { salt: _, passwordHash: __, ...userProfile } = newUser;
  return userProfile;
}

async function authenticateUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const { salt, passwordHash, ...userProfile } = user;
  return userProfile;
}

// Session Token helpers
async function createSession(user) {
  const token = "mistro-usr-session-" + crypto.randomBytes(24).toString('hex');
  const sessions = await readJsonFile(SESSIONS_FILE, {});
  sessions[token] = {
    userId: user.id,
    email: user.email,
    name: user.name,
    createdAt: new Date().toISOString()
  };
  await writeJsonFile(SESSIONS_FILE, sessions);
  return token;
}

async function getUserBySessionToken(token) {
  if (!token) return null;
  const sessions = await readJsonFile(SESSIONS_FILE, {});
  const session = sessions[token];
  if (!session) return null;
  
  return await findUserById(session.userId);
}

/* ==========================================================
   BOOKINGS MANAGEMENT
   ========================================================== */

async function getBookings() {
  return await readJsonFile(BOOKINGS_FILE, []);
}

async function getBookingsByUserId(userId) {
  const bookings = await getBookings();
  return bookings.filter(b => b.userId === userId);
}

async function getBookingById(id) {
  const bookings = await getBookings();
  return bookings.find(b => b.id === id);
}

async function saveBooking(bookingData, userId = null) {
  const bookings = await getBookings();
  
  const newBooking = {
    id: "bk-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100).toString().padStart(2, '0'),
    userId: userId || null,
    name: bookingData.name,
    phone: bookingData.phone,
    service: bookingData.service,
    selectedProviderId: bookingData.selectedProviderId || null,
    selectedProviderName: bookingData.selectedProviderName || null,
    date: bookingData.date,
    slot: bookingData.slot,
    address: bookingData.address,
    coordinates: bookingData.coordinates || null,
    problem: bookingData.problem || `${bookingData.service} service request`,
    urgency: bookingData.urgency || "Standard",
    status: 'Pending', // Pending, Accepted, Assigned, On the Way, Arrived, In Progress, Completed, Rejected, Cancelled
    workerResponse: 'Pending', // Pending, Accepted, Rejected
    workerResponseAt: null,
    rejectionReason: null,
    assignedProvider: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  bookings.push(newBooking);
  await writeJsonFile(BOOKINGS_FILE, bookings);
  return newBooking;
}

async function updateBookingStatus(id, status) {
  const bookings = await getBookings();
  const index = bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    bookings[index].status = status;
    bookings[index].updatedAt = new Date().toISOString();
    await writeJsonFile(BOOKINGS_FILE, bookings);
    return bookings[index];
  }
  return null;
}

async function assignProviderToBooking(bookingId, providerId) {
  const bookings = await getBookings();
  const providers = await readJsonFile(PROVIDERS_FILE, []);
  
  const bookingIndex = bookings.findIndex(b => b.id === bookingId);
  const provider = providers.find(p => p.id === providerId);

  if (bookingIndex !== -1 && provider) {
    bookings[bookingIndex].assignedProvider = {
      id: provider.id,
      name: provider.name,
      service: provider.service,
      phone: provider.phone,
      rating: provider.rating,
      badge: provider.badge
    };
    bookings[bookingIndex].status = 'Assigned';
    bookings[bookingIndex].updatedAt = new Date().toISOString();
    
    await writeJsonFile(BOOKINGS_FILE, bookings);
    return bookings[bookingIndex];
  }
  return null;
}

async function deleteBooking(id) {
  const bookings = await getBookings();
  const filtered = bookings.filter(b => b.id !== id);
  if (filtered.length !== bookings.length) {
    await writeJsonFile(BOOKINGS_FILE, filtered);
    return true;
  }
  return false;
}

/* ==========================================================
   CONTACT INQUIRIES
   ========================================================== */

async function getContacts() {
  return await readJsonFile(CONTACTS_FILE, []);
}

async function saveContact(contact) {
  const contacts = await getContacts();
  const newContact = {
    id: "cnt-" + Date.now().toString().slice(-6),
    name: contact.name,
    email: contact.email,
    message: contact.message,
    status: 'Unread', // Statuses: Unread, Read, Replied
    createdAt: new Date().toISOString()
  };
  contacts.push(newContact);
  await writeJsonFile(CONTACTS_FILE, contacts);
  return newContact;
}

async function updateContactStatus(id, status) {
  const contacts = await getContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index !== -1) {
    contacts[index].status = status;
    await writeJsonFile(CONTACTS_FILE, contacts);
    return contacts[index];
  }
  return null;
}

const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

const DEFAULT_REVIEWS = [
  {
    id: "rev-1",
    userName: "Anand R",
    service: "Electrical",
    rating: 5,
    comment: "The electrician arrived in 20 minutes and fixed our main circuit breaker issue safely. Excellent service!",
    createdAt: "2026-09-15T10:30:00Z"
  },
  {
    id: "rev-2",
    userName: "Priya Sundar",
    service: "Plumbing",
    rating: 5,
    comment: "Fixed a persistent kitchen sink leak that two other local repairmen couldn't fix. Super professional!",
    createdAt: "2026-09-20T14:15:00Z"
  },
  {
    id: "rev-3",
    userName: "Vikram Seth",
    service: "Carpentry",
    rating: 4.8,
    comment: "Assembled our heavy modular wardrobe perfectly. Very careful with flooring and clean-up.",
    createdAt: "2026-09-28T16:45:00Z"
  }
];

// Extend initDb with reviews file
const originalInitDb = initDb;

async function initDbExpanded() {
  await originalInitDb();
  try {
    await fs.access(REVIEWS_FILE);
  } catch {
    await writeJsonFile(REVIEWS_FILE, DEFAULT_REVIEWS);
  }
}

/* ==========================================================
   USER PROFILE & PASSWORD MANAGEMENT
   ========================================================== */

async function updateUserProfile(userId, { name, phone, address }) {
  const users = await getUsers();
  const index = users.findIndex(u => u.id === userId);

  if (index !== -1) {
    if (name) users[index].name = name.trim();
    if (phone) users[index].phone = phone.trim();
    if (address) users[index].address = address.trim();
    users[index].updatedAt = new Date().toISOString();

    await writeJsonFile(USERS_FILE, users);
    const { salt: _, passwordHash: __, ...userProfile } = users[index];
    return userProfile;
  }
  return null;
}

async function changeUserPassword(userId, oldPassword, newPassword) {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    throw new Error("User not found");
  }

  const isValid = verifyPassword(oldPassword, user.salt, user.passwordHash);
  if (!isValid) {
    throw new Error("Incorrect current password");
  }

  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long");
  }

  const { salt, hash } = hashPassword(newPassword);
  user.salt = salt;
  user.passwordHash = hash;
  user.updatedAt = new Date().toISOString();

  await writeJsonFile(USERS_FILE, users);
  return true;
}

/* ==========================================================
   CUSTOMER REVIEWS ENGINE
   ========================================================== */

async function getReviews(category = null) {
  const reviews = await readJsonFile(REVIEWS_FILE, DEFAULT_REVIEWS);
  if (category) {
    return reviews.filter(r => r.service.toLowerCase() === category.toLowerCase());
  }
  return reviews;
}

async function addReview({ bookingId, userId, userName, rating, comment, service }) {
  const reviews = await getReviews();
  const newReview = {
    id: "rev-" + Date.now().toString().slice(-6),
    bookingId: bookingId || null,
    userId: userId || null,
    userName: userName || "Anonymous Customer",
    rating: Number(rating) || 5,
    comment: comment.trim(),
    service: service || "General Home Service",
    createdAt: new Date().toISOString()
  };

  reviews.push(newReview);
  await writeJsonFile(REVIEWS_FILE, reviews);

  if (bookingId) {
    const bookings = await getBookings();
    const bIndex = bookings.findIndex(b => b.id === bookingId);
    if (bIndex !== -1) {
      bookings[bIndex].hasReviewed = true;
      bookings[bIndex].rating = Number(rating);
      await writeJsonFile(BOOKINGS_FILE, bookings);
    }
  }

  return newReview;
}

/* ==========================================================
   LIVE TRACKING, PAYMENTS & INVOICING
   ========================================================== */

async function getBookingTrackingStatus(id) {
  const booking = await getBookingById(id);
  if (!booking) return null;

  let step = 1;
  let statusText = "Booking Request Received";
  let etaMinutes = 45;

  if (booking.status === 'Pending') {
    step = 1;
    statusText = "Waiting for selected worker response...";
    etaMinutes = 45;
  } else if (booking.status === 'Accepted' || booking.status === 'Assigned') {
    step = 2;
    statusText = "Worker Accepted & Confirmed";
    etaMinutes = 30;
  } else if (booking.status === 'On the Way') {
    step = 3;
    statusText = "Professional Dispatched & On The Way";
    etaMinutes = 15;
  } else if (booking.status === 'Arrived') {
    step = 4;
    statusText = "Professional Arrived at Location";
    etaMinutes = 5;
  } else if (booking.status === 'In Progress') {
    step = 4;
    statusText = "Service In Progress";
    etaMinutes = 10;
  } else if (booking.status === 'Completed') {
    step = 5;
    statusText = "Service Completed Successfully";
    etaMinutes = 0;
  } else if (booking.status === 'Rejected') {
    step = 0;
    statusText = "Selected professional is unavailable";
    etaMinutes = 0;
  } else if (booking.status === 'Cancelled') {
    step = 0;
    statusText = "Booking Request Cancelled";
    etaMinutes = 0;
  }

  return {
    booking,
    bookingId: booking.id,
    status: booking.status,
    selectedProviderId: booking.selectedProviderId || null,
    selectedProviderName: booking.selectedProviderName || (booking.assignedProvider ? booking.assignedProvider.name : null),
    workerResponse: booking.workerResponse || 'Pending',
    rejectionReason: booking.rejectionReason || null,
    step,
    totalSteps: 5,
    statusText,
    etaMinutes,
    service: booking.service,
    date: booking.date,
    slot: booking.slot,
    address: booking.address,
    coordinates: booking.coordinates,
    assignedProvider: booking.assignedProvider || null,
    paymentStatus: booking.paymentStatus || 'Pending'
  };
}

async function processPayment(bookingId, { paymentMethod, amount }) {
  const bookings = await getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);

  if (index !== -1) {
    bookings[index].paymentStatus = 'Paid';
    bookings[index].paymentDetails = {
      method: paymentMethod || 'UPI',
      amount: amount || 499,
      transactionId: "tx_" + Date.now().toString().slice(-8),
      paidAt: new Date().toISOString()
    };
    bookings[index].updatedAt = new Date().toISOString();

    await writeJsonFile(BOOKINGS_FILE, bookings);
    return bookings[index];
  }
  return null;
}

async function getInvoice(bookingId) {
  const booking = await getBookingById(bookingId);
  if (!booking) return null;

  let basePrice = 399;
  if (booking.service.toLowerCase().includes('clean')) basePrice = 599;
  if (booking.service.toLowerCase().includes('elect')) basePrice = 299;
  if (booking.service.toLowerCase().includes('plumb')) basePrice = 349;

  const platformFee = 49;
  const subtotal = basePrice + platformFee;
  const gstTax = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + gstTax;

  return {
    invoiceNo: "INV-MST-" + booking.id.slice(-6),
    bookingId: booking.id,
    customerName: booking.name,
    customerPhone: booking.phone,
    serviceName: booking.service,
    address: booking.address,
    date: booking.date,
    items: [
      { description: `${booking.service} Standard Service Fee`, amount: basePrice },
      { description: "MISTRO Smart Match Platform Guarantee", amount: platformFee }
    ],
    subtotal,
    gstTax,
    totalAmount,
    paymentStatus: booking.paymentStatus || 'Pending',
    paymentDetails: booking.paymentDetails || null,
    issuedAt: new Date().toISOString()
  };
}

/* ==========================================================
   ADVANCED PROVIDER & SERVICES & STATS CRUD
   ========================================================== */

async function getProviders() {
  return await readJsonFile(PROVIDERS_FILE, DEFAULT_PROVIDERS);
}

async function addProvider(providerData) {
  const providers = await getProviders();
  const newProvider = {
    id: "prov-" + Date.now().toString().slice(-4),
    name: providerData.name,
    service: providerData.service,
    phone: providerData.phone,
    rating: providerData.rating || 5.0,
    totalJobs: 0,
    status: "Available",
    badge: providerData.badge || "Verified Expert"
  };
  providers.push(newProvider);
  await writeJsonFile(PROVIDERS_FILE, providers);
  return newProvider;
}

async function getServices() {
  return await readJsonFile(SERVICES_FILE, DEFAULT_SERVICES);
}

async function getPlatformStats() {
  const bookings = await getBookings();
  const contacts = await getContacts();
  const providers = await getProviders();
  const users = await getUsers();

  const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
  const assignedBookings = bookings.filter(b => b.status === 'Assigned').length;
  const completedBookings = bookings.filter(b => b.status === 'Completed').length;
  const unreadContacts = contacts.filter(c => c.status === 'Unread').length;

  return {
    totalBookings: bookings.length,
    pendingBookings,
    assignedBookings,
    completedBookings,
    totalContacts: contacts.length,
    unreadContacts,
    totalProviders: providers.length,
    totalUsers: users.length
  };
}

async function updateProvider(id, updateData) {
  const providers = await getProviders();
  const index = providers.findIndex(p => p.id === id);

  if (index !== -1) {
    providers[index] = { ...providers[index], ...updateData };
    await writeJsonFile(PROVIDERS_FILE, providers);
    return providers[index];
  }
  return null;
}

async function deleteProvider(id) {
  const providers = await getProviders();
  const filtered = providers.filter(p => p.id !== id);

  if (filtered.length !== providers.length) {
    await writeJsonFile(PROVIDERS_FILE, filtered);
    return true;
  }
  return false;
}

/* ==========================================================
   WORKER & PARTNER MANAGEMENT
   ========================================================== */

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.4;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

async function createWorkerAccount({ name, email, phone, password, service, specialization, experience, serviceArea, bio, profilePhoto }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("An account with this email address already exists");
  }

  const { salt, hash } = hashPassword(password);
  const users = await getUsers();

  const newUser = {
    id: "usr-w-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : "",
    salt,
    passwordHash: hash,
    role: "worker",
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  await writeJsonFile(USERS_FILE, users);

  const providers = await getProviders();
  const newProvider = {
    id: "prov-" + Date.now().toString().slice(-6),
    userId: newUser.id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : "",
    service: service.trim(),
    specialization: specialization ? specialization.trim() : service.trim(),
    experience: Number(experience) || 1,
    serviceArea: serviceArea ? serviceArea.trim() : "Chennai",
    rating: 5.0,
    totalJobs: 0,
    availability: "Available",
    status: "Available",
    badge: `${experience || 1}+ Yrs Exp`,
    bio: bio ? bio.trim() : `Certified ${service} Specialist`,
    profilePhoto: profilePhoto || null,
    createdAt: new Date().toISOString()
  };

  providers.push(newProvider);
  await writeJsonFile(PROVIDERS_FILE, providers);

  const { salt: _, passwordHash: __, ...userProfile } = newUser;
  return { user: userProfile, provider: newProvider };
}

async function authenticateWorker(email, password) {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  if (user.role !== 'worker') {
    throw new Error("This account is registered as a customer. Please use customer login.");
  }

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const providers = await getProviders();
  const provider = providers.find(p => p.userId === user.id || p.email === user.email);

  const { salt, passwordHash, ...userProfile } = user;
  return { user: userProfile, provider: provider || null };
}

async function getProviderByUserId(userId) {
  const providers = await getProviders();
  return providers.find(p => p.userId === userId || p.id === userId);
}

async function updateWorkerProfile(userId, { phone, specialization, experience, serviceArea, bio, profilePhoto, name }) {
  const providers = await getProviders();
  const index = providers.findIndex(p => p.userId === userId || p.id === userId);

  if (index !== -1) {
    if (name) providers[index].name = name.trim();
    if (phone) providers[index].phone = phone.trim();
    if (specialization) providers[index].specialization = specialization.trim();
    if (experience) {
      providers[index].experience = Number(experience);
      providers[index].badge = `${experience}+ Yrs Exp`;
    }
    if (serviceArea) providers[index].serviceArea = serviceArea.trim();
    if (bio) providers[index].bio = bio.trim();
    if (profilePhoto) providers[index].profilePhoto = profilePhoto;
    providers[index].updatedAt = new Date().toISOString();

    await writeJsonFile(PROVIDERS_FILE, providers);
    return providers[index];
  }
  return null;
}

async function updateWorkerAvailability(userId, availability) {
  const providers = await getProviders();
  const index = providers.findIndex(p => p.userId === userId || p.id === userId);

  if (index !== -1) {
    const statusVal = availability === 'Offline' ? 'Offline' : 'Available';
    providers[index].availability = statusVal;
    providers[index].status = statusVal;
    providers[index].updatedAt = new Date().toISOString();

    await writeJsonFile(PROVIDERS_FILE, providers);
    return providers[index];
  }
  return null;
}

async function getProvidersByCategory(category) {
  const providers = await getProviders();
  if (!category) return providers.filter(p => (p.availability || p.status) === 'Available');
  
  const cat = category.toLowerCase();
  const filtered = providers.filter(p => {
    const pService = (p.service || "").toLowerCase();
    const isCatMatch = pService.includes(cat) || cat.includes(pService);
    const isAvailable = (p.availability || p.status) === 'Available';
    return isCatMatch && isAvailable;
  });

  // Sort by rating (desc), totalJobs (desc)
  filtered.sort((a, b) => {
    if ((b.rating || 0) !== (a.rating || 0)) {
      return (b.rating || 0) - (a.rating || 0);
    }
    return (b.totalJobs || 0) - (a.totalJobs || 0);
  });

  return filtered;
}

async function getWorkerIncomingRequests(userId) {
  const provider = await getProviderByUserId(userId);
  if (!provider || provider.availability === 'Offline') {
    return [];
  }

  const bookings = await getBookings();
  const workerService = provider.service.toLowerCase();

  const matchingBookings = bookings.filter(b => {
    // 1. Service category match
    const bService = (b.service || "").toLowerCase();
    const isServiceMatch = bService.includes(workerService) || workerService.includes(bService);
    if (!isServiceMatch) return false;

    // 2. Status must be Pending or Searching
    const isPending = b.status === 'Pending' || b.status === 'Searching';
    if (!isPending) return false;

    // 3. Must not be already assigned
    if (b.assignedProvider !== null && b.assignedProvider !== undefined) return false;

    // 4. Worker has not already rejected this booking
    if (b.rejectedBy && (b.rejectedBy.includes(userId) || b.rejectedBy.includes(provider.id))) {
      return false;
    }

    // 5. DIRECT WORKER SELECTION MATCH: If customer selected a specific worker, only show to that worker!
    if (b.selectedProviderId) {
      const matchesProviderId = b.selectedProviderId === provider.id || b.selectedProviderId === provider.userId || b.selectedProviderId === userId;
      if (!matchesProviderId) {
        return false;
      }
    }

    return true;
  });

  const scoredRequests = matchingBookings.map(b => {
    let distanceKm = 2.4;
    if (b.coordinates && b.coordinates.lat && b.coordinates.lng) {
      const provLat = provider.lat || 13.0827;
      const provLng = provider.lng || 80.2707;
      distanceKm = calculateHaversineDistance(b.coordinates.lat, b.coordinates.lng, provLat, provLng);
    }

    const isEmergency = (b.slot && b.slot.toLowerCase().includes('emergency')) || (b.address && b.address.toLowerCase().includes('urgent'));

    let matchScore = 100;
    matchScore += (provider.experience || 1) * 3;
    matchScore += (provider.rating || 5) * 5;
    if (isEmergency) matchScore += 20;
    matchScore -= Math.round(distanceKm * 4);

    return {
      bookingId: b.id,
      customerName: b.name,
      customerPhone: b.phone,
      service: b.service,
      selectedProviderId: b.selectedProviderId || null,
      selectedProviderName: b.selectedProviderName || null,
      date: b.date,
      slot: b.slot,
      address: b.address,
      coordinates: b.coordinates,
      problem: b.problem || `${b.service} repair request`,
      urgency: isEmergency ? 'Emergency' : 'Standard',
      distanceKm,
      matchScore,
      createdAt: b.createdAt
    };
  });

  scoredRequests.sort((a, b) => b.matchScore - a.matchScore);
  return scoredRequests;
}

async function acceptBookingByWorker(bookingId, userId) {
  const provider = await getProviderByUserId(userId);
  if (!provider) {
    throw new Error("Worker profile not found");
  }

  const bookings = await getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);

  if (index === -1) {
    throw new Error("Booking request not found");
  }

  const booking = bookings[index];

  // SECURITY CHECK: If targeted to a specific worker, prevent other workers from accepting
  if (booking.selectedProviderId) {
    const isTarget = booking.selectedProviderId === provider.id || booking.selectedProviderId === provider.userId || booking.selectedProviderId === userId;
    if (!isTarget) {
      throw new Error("Access denied. This booking request was sent to another professional.");
    }
  }

  // ATOMIC CHECK: Prevent double acceptance
  if (booking.assignedProvider !== null && booking.assignedProvider !== undefined) {
    throw new Error("Request no longer available. Another professional has already accepted it.");
  }

  if (booking.status !== 'Pending' && booking.status !== 'Searching') {
    throw new Error("Request is no longer available.");
  }

  bookings[index].assignedProvider = {
    id: provider.id,
    userId: provider.userId || userId,
    name: provider.name,
    service: provider.service,
    phone: provider.phone,
    rating: provider.rating,
    badge: provider.badge,
    experience: provider.experience,
    specialization: provider.specialization,
    profilePhoto: provider.profilePhoto || null
  };
  bookings[index].workerResponse = 'Accepted';
  bookings[index].workerResponseAt = new Date().toISOString();
  bookings[index].status = 'Accepted';
  bookings[index].acceptedAt = new Date().toISOString();
  bookings[index].updatedAt = new Date().toISOString();

  await writeJsonFile(BOOKINGS_FILE, bookings);
  return bookings[index];
}

async function rejectBookingByWorker(bookingId, userId, reason = "") {
  const provider = await getProviderByUserId(userId);
  const pId = provider ? provider.id : userId;

  const bookings = await getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);

  if (index !== -1) {
    if (!bookings[index].rejectedBy) {
      bookings[index].rejectedBy = [];
    }
    if (!bookings[index].rejectedBy.includes(userId)) {
      bookings[index].rejectedBy.push(userId);
    }
    if (!bookings[index].rejectedBy.includes(pId)) {
      bookings[index].rejectedBy.push(pId);
    }

    // If targeted at this specific worker, update workerResponse & status
    if (bookings[index].selectedProviderId && (bookings[index].selectedProviderId === pId || bookings[index].selectedProviderId === userId || (provider && bookings[index].selectedProviderId === provider.id))) {
      bookings[index].workerResponse = 'Rejected';
      bookings[index].workerResponseAt = new Date().toISOString();
      bookings[index].rejectionReason = reason || "Selected professional is unavailable";
      bookings[index].status = 'Rejected';
    }

    bookings[index].updatedAt = new Date().toISOString();
    await writeJsonFile(BOOKINGS_FILE, bookings);
    return true;
  }
  return false;
}

async function updateWorkerJobStatus(bookingId, userId, newStatus) {
  const provider = await getProviderByUserId(userId);
  const pId = provider ? provider.id : userId;

  const bookings = await getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);

  if (index === -1) {
    throw new Error("Booking not found");
  }

  const booking = bookings[index];
  if (!booking.assignedProvider || (booking.assignedProvider.userId !== userId && booking.assignedProvider.id !== pId)) {
    throw new Error("Unauthorized to update this booking");
  }

  bookings[index].status = newStatus;
  bookings[index].updatedAt = new Date().toISOString();

  if (newStatus === 'Completed') {
    bookings[index].completedAt = new Date().toISOString();
    
    if (provider) {
      const providers = await getProviders();
      const provIndex = providers.findIndex(p => p.id === provider.id);
      if (provIndex !== -1) {
        providers[provIndex].totalJobs = (providers[provIndex].totalJobs || 0) + 1;
        await writeJsonFile(PROVIDERS_FILE, providers);
      }
    }
  }

  await writeJsonFile(BOOKINGS_FILE, bookings);
  return bookings[index];
}

async function getWorkerJobs(userId) {
  const provider = await getProviderByUserId(userId);
  const pId = provider ? provider.id : userId;

  const bookings = await getBookings();

  const workerBookings = bookings.filter(b => {
    if (!b.assignedProvider) return false;
    return b.assignedProvider.userId === userId || b.assignedProvider.id === pId;
  });

  const activeJobs = workerBookings.filter(b => b.status === 'Accepted' || b.status === 'Assigned' || b.status === 'On the Way' || b.status === 'Arrived' || b.status === 'In Progress');
  const completedJobs = workerBookings.filter(b => b.status === 'Completed');

  return { activeJobs, completedJobs };
}

async function getWorkerDashboardData(userId) {
  const provider = await getProviderByUserId(userId);
  if (!provider) return null;

  const incomingRequests = await getWorkerIncomingRequests(userId);
  const { activeJobs, completedJobs } = await getWorkerJobs(userId);

  let totalEarnings = 0;
  completedJobs.forEach(j => {
    let price = 399;
    if (j.service.toLowerCase().includes('clean')) price = 599;
    if (j.service.toLowerCase().includes('elect')) price = 299;
    if (j.service.toLowerCase().includes('plumb')) price = 349;
    totalEarnings += price;
  });

  return {
    provider,
    availability: provider.availability || "Available",
    incomingRequestsCount: incomingRequests.length,
    activeJobsCount: activeJobs.length,
    completedJobsCount: completedJobs.length,
    totalEarnings,
    rating: provider.rating || 5.0,
    totalJobs: provider.totalJobs || completedJobs.length,
    incomingRequests,
    activeJobs,
    completedJobs
  };
}

/* ==========================================================
   NOTIFICATION, OTP & PAYMENT FALLBACK STORAGE
   ========================================================== */

async function getNotifications() {
  return await readJsonFile(NOTIFICATIONS_FILE, []);
}

async function saveNotification(notifData) {
  const notifs = await getNotifications();
  notifs.push(notifData);
  await writeJsonFile(NOTIFICATIONS_FILE, notifs);
  return notifData;
}

async function getOTPs() {
  return await readJsonFile(OTPS_FILE, []);
}

async function saveOTP(otpData) {
  const otps = await getOTPs();
  otps.push(otpData);
  await writeJsonFile(OTPS_FILE, otps);
  return otpData;
}

async function updateOTP(id, updateData) {
  const otps = await getOTPs();
  const idx = otps.findIndex(o => o.id === id);
  if (idx !== -1) {
    otps[idx] = { ...otps[idx], ...updateData };
    await writeJsonFile(OTPS_FILE, otps);
    return otps[idx];
  }
  return null;
}

async function getPayments() {
  return await readJsonFile(PAYMENTS_FILE, []);
}

async function savePayment(paymentData) {
  const payments = await getPayments();
  payments.push(paymentData);
  await writeJsonFile(PAYMENTS_FILE, payments);
  return paymentData;
}

async function updatePayment(gatewayOrderId, updateData) {
  const payments = await getPayments();
  const idx = payments.findIndex(p => p.gatewayOrderId === gatewayOrderId || p.id === gatewayOrderId);
  if (idx !== -1) {
    payments[idx] = { ...payments[idx], ...updateData };
    await writeJsonFile(PAYMENTS_FILE, payments);
    return payments[idx];
  }
  return null;
}

module.exports = {
  initDb: initDbExpanded,
  NOTIFICATIONS_FILE,
  // User Auth & Profile
  createUser,
  authenticateUser,
  findUserByEmail,
  findUserById,
  createSession,
  getUserBySessionToken,
  updateUserProfile,
  changeUserPassword,
  // Bookings & Tracking
  getBookings,
  getBookingsByUserId,
  getBookingById,
  saveBooking,
  updateBookingStatus,
  assignProviderToBooking,
  deleteBooking,
  getBookingTrackingStatus,
  // Notifications, OTP & Payments Fallback
  getNotifications,
  saveNotification,
  getOTPs,
  saveOTP,
  updateOTP,
  getPayments,
  savePayment,
  updatePayment,
  writeJsonFile,
  // Reviews
  getReviews,
  addReview,
  // Payments & Invoicing
  processPayment,
  getInvoice,
  // Contacts
  getContacts,
  saveContact,
  updateContactStatus,
  // Providers & Services & Stats
  getProviders,
  getProvidersByCategory,
  addProvider,
  updateProvider,
  deleteProvider,
  getServices,
  getPlatformStats,
  // Worker & Partner System
  createWorkerAccount,
  authenticateWorker,
  getProviderByUserId,
  updateWorkerProfile,
  updateWorkerAvailability,
  getWorkerIncomingRequests,
  acceptBookingByWorker,
  rejectBookingByWorker,
  updateWorkerJobStatus,
  getWorkerJobs,
  getWorkerDashboardData
};



