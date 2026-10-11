const mongoose = require('mongoose');
const crypto = require('crypto');
const dbJson = require('./db');

// Mongoose Models
const User = require('./models/User');
const Provider = require('./models/Provider');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Service = require('./models/Service');
const Session = require('./models/Session');
const Contact = require('./models/Contact');

let isConnected = false;

// Password hashing utility
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, originalHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return hash === originalHash;
}

// Distance math utility
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Initialize Database connection & auto-seed
async function initDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mistro';
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    isConnected = true;
    console.log('==========================================================');
    console.log(`MongoDB Connected successfully to ${uri}`);
    console.log('==========================================================');

    // Seed default providers if empty
    const providerCount = await Provider.countDocuments();
    if (providerCount === 0) {
      const jsonProviders = await dbJson.getProviders();
      if (jsonProviders && jsonProviders.length > 0) {
        await Provider.insertMany(jsonProviders);
        console.log(`Seeded ${jsonProviders.length} providers into MongoDB`);
      }
    }

    // Seed default services if empty
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      const jsonServices = await dbJson.getServices();
      if (jsonServices && jsonServices.length > 0) {
        await Service.insertMany(jsonServices);
        console.log(`Seeded ${jsonServices.length} services into MongoDB`);
      }
    }

    // Seed default reviews if empty
    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      const jsonReviews = await dbJson.getReviews();
      if (jsonReviews && jsonReviews.length > 0) {
        await Review.insertMany(jsonReviews);
        console.log(`Seeded ${jsonReviews.length} reviews into MongoDB`);
      }
    }

  } catch (err) {
    isConnected = false;
    console.log('==========================================================');
    console.log('MongoDB server offline or not configured.');
    console.log('Fallback: Using file-backed JSON storage engine seamlessly.');
    console.log('==========================================================');
    await dbJson.initDb();
  }
}

// Helper wrapper to delegate to dbJson if MongoDB is not connected
function checkMongo() {
  return isConnected;
}

/* ==========================================================
   USER AUTH & SESSION OPERATIONS
   ========================================================== */

async function createUser({ name, email, password }) {
  if (!checkMongo()) return dbJson.createUser({ name, email, password });

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const { salt, hash } = hashPassword(password);
  const id = "usr-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

  const newUser = new User({
    id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    salt,
    passwordHash: hash,
    role: "customer"
  });

  await newUser.save();
  const obj = newUser.toObject();
  delete obj.salt;
  delete obj.passwordHash;
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function authenticateUser(email, password) {
  if (!checkMongo()) return dbJson.authenticateUser(email, password);

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) return null;

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) return null;

  const obj = user.toObject();
  delete obj.salt;
  delete obj.passwordHash;
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function findUserByEmail(email) {
  if (!checkMongo()) return dbJson.findUserByEmail(email);
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  return user ? user.toObject() : null;
}

async function findUserById(id) {
  if (!checkMongo()) return dbJson.findUserById(id);
  const user = await User.findOne({ id });
  return user ? user.toObject() : null;
}

async function createSession(user) {
  if (!checkMongo()) return dbJson.createSession(user);
  const token = "mistro-usr-session-" + crypto.randomBytes(24).toString('hex');
  await Session.create({
    token,
    userId: user.id,
    email: user.email,
    name: user.name
  });
  return token;
}

async function getUserBySessionToken(token) {
  if (!checkMongo()) return dbJson.getUserBySessionToken(token);
  if (!token) return null;
  const session = await Session.findOne({ token });
  if (!session) return null;
  return await findUserById(session.userId);
}

async function updateUserProfile(userId, { name, phone, address }) {
  if (!checkMongo()) return dbJson.updateUserProfile(userId, { name, phone, address });
  const user = await User.findOne({ id: userId });
  if (user) {
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    await user.save();
    const obj = user.toObject();
    delete obj.salt;
    delete obj.passwordHash;
    return obj;
  }
  return null;
}

async function changeUserPassword(userId, oldPassword, newPassword) {
  if (!checkMongo()) return dbJson.changeUserPassword(userId, oldPassword, newPassword);
  const user = await User.findOne({ id: userId });
  if (!user) throw new Error("User not found");

  const isValid = verifyPassword(oldPassword, user.salt, user.passwordHash);
  if (!isValid) throw new Error("Incorrect current password");

  if (newPassword.length < 6) throw new Error("New password must be at least 6 characters long");

  const { salt, hash } = hashPassword(newPassword);
  user.salt = salt;
  user.passwordHash = hash;
  await user.save();
  return true;
}

/* ==========================================================
   BOOKINGS & DISPATCH OPERATIONS
   ========================================================== */

async function getBookings() {
  if (!checkMongo()) return dbJson.getBookings();
  return await Booking.find().lean();
}

async function getBookingsByUserId(userId) {
  if (!checkMongo()) return dbJson.getBookingsByUserId(userId);
  return await Booking.find({ userId }).lean();
}

async function getBookingById(id) {
  if (!checkMongo()) return dbJson.getBookingById(id);
  return await Booking.findOne({ id }).lean();
}

async function saveBooking(bookingData, userId = null) {
  if (!checkMongo()) return dbJson.saveBooking(bookingData, userId);

  const id = "bk-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100).toString().padStart(2, '0');

  const newBooking = new Booking({
    id,
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
    status: 'Pending',
    workerResponse: 'Pending'
  });

  await newBooking.save();
  return newBooking.toObject();
}

async function updateBookingStatus(id, status) {
  if (!checkMongo()) return dbJson.updateBookingStatus(id, status);
  const updated = await Booking.findOneAndUpdate(
    { id },
    { $set: { status, updatedAt: new Date() } },
    { new: true }
  ).lean();
  return updated;
}

async function assignProviderToBooking(bookingId, providerId) {
  if (!checkMongo()) return dbJson.assignProviderToBooking(bookingId, providerId);
  const provider = await Provider.findOne({ id: providerId });
  if (!provider) return null;

  const assignedProviderObj = {
    id: provider.id,
    userId: provider.userId || null,
    name: provider.name,
    service: provider.service,
    phone: provider.phone,
    rating: provider.rating,
    badge: provider.badge
  };

  const updated = await Booking.findOneAndUpdate(
    { id: bookingId },
    { $set: { assignedProvider: assignedProviderObj, status: 'Assigned', updatedAt: new Date() } },
    { new: true }
  ).lean();

  return updated;
}

async function deleteBooking(id) {
  if (!checkMongo()) return dbJson.deleteBooking(id);
  const res = await Booking.deleteOne({ id });
  return res.deletedCount > 0;
}

async function getBookingTrackingStatus(id) {
  if (!checkMongo()) return dbJson.getBookingTrackingStatus(id);
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

/* ==========================================================
   WORKER / PARTNER SYSTEM OPERATIONS
   ========================================================== */

async function createWorkerAccount({ name, email, phone, password, service, specialization, experience, serviceArea, bio, profilePhoto }) {
  if (!checkMongo()) return dbJson.createWorkerAccount({ name, email, phone, password, service, specialization, experience, serviceArea, bio, profilePhoto });

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const { salt, hash } = hashPassword(password);
  const userId = "usr-w-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

  const newUser = new User({
    id: userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : "",
    salt,
    passwordHash: hash,
    role: "worker"
  });

  await newUser.save();

  const provId = "prov-" + Date.now().toString().slice(-6);
  const newProvider = new Provider({
    id: provId,
    userId,
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
    profilePhoto: profilePhoto || null
  });

  await newProvider.save();

  const userObj = newUser.toObject();
  delete userObj.salt;
  delete userObj.passwordHash;

  return { user: userObj, provider: newProvider.toObject() };
}

async function authenticateWorker(email, password) {
  if (!checkMongo()) return dbJson.authenticateWorker(email, password);

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) return null;

  if (user.role !== 'worker') {
    throw new Error("This account is registered as a customer. Please use customer login.");
  }

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) return null;

  const provider = await Provider.findOne({ $or: [{ userId: user.id }, { email: user.email }] });

  const userObj = user.toObject();
  delete userObj.salt;
  delete userObj.passwordHash;

  return { user: userObj, provider: provider ? provider.toObject() : null };
}

async function getProviderByUserId(userId) {
  if (!checkMongo()) return dbJson.getProviderByUserId(userId);
  const p = await Provider.findOne({ $or: [{ userId }, { id: userId }] });
  return p ? p.toObject() : null;
}

async function updateWorkerProfile(userId, { phone, specialization, experience, serviceArea, bio, profilePhoto, name }) {
  if (!checkMongo()) return dbJson.updateWorkerProfile(userId, { phone, specialization, experience, serviceArea, bio, profilePhoto, name });

  const updateFields = {};
  if (name) updateFields.name = name.trim();
  if (phone) updateFields.phone = phone.trim();
  if (specialization) updateFields.specialization = specialization.trim();
  if (experience) {
    updateFields.experience = Number(experience);
    updateFields.badge = `${experience}+ Yrs Exp`;
  }
  if (serviceArea) updateFields.serviceArea = serviceArea.trim();
  if (bio) updateFields.bio = bio.trim();
  if (profilePhoto) updateFields.profilePhoto = profilePhoto;
  updateFields.updatedAt = new Date();

  const updated = await Provider.findOneAndUpdate(
    { $or: [{ userId }, { id: userId }] },
    { $set: updateFields },
    { new: true }
  ).lean();

  return updated;
}

async function updateWorkerAvailability(userId, availability) {
  if (!checkMongo()) return dbJson.updateWorkerAvailability(userId, availability);
  const statusVal = availability === 'Offline' ? 'Offline' : 'Available';

  const updated = await Provider.findOneAndUpdate(
    { $or: [{ userId }, { id: userId }] },
    { $set: { availability: statusVal, status: statusVal, updatedAt: new Date() } },
    { new: true }
  ).lean();

  return updated;
}

async function getWorkerIncomingRequests(userId) {
  if (!checkMongo()) return dbJson.getWorkerIncomingRequests(userId);

  const provider = await getProviderByUserId(userId);
  if (!provider || provider.availability === 'Offline') {
    return [];
  }

  const workerService = provider.service.toLowerCase();

  const query = {
    $or: [{ status: 'Pending' }, { status: 'Searching' }],
    assignedProvider: null,
    rejectedBy: { $nin: [userId, provider.id] }
  };

  const bookings = await Booking.find(query).lean();

  const matchingBookings = bookings.filter(b => {
    const bService = (b.service || "").toLowerCase();
    const isServiceMatch = bService.includes(workerService) || workerService.includes(bService);
    if (!isServiceMatch) return false;

    if (b.selectedProviderId) {
      const matches = b.selectedProviderId === provider.id || b.selectedProviderId === provider.userId || b.selectedProviderId === userId;
      if (!matches) return false;
    }
    return true;
  });

  const scoredRequests = matchingBookings.map(b => {
    let distanceKm = 2.4;
    if (b.coordinates && b.coordinates.lat && b.coordinates.lng) {
      distanceKm = calculateHaversineDistance(b.coordinates.lat, b.coordinates.lng, provider.lat || 13.0827, provider.lng || 80.2707);
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
  if (!checkMongo()) return dbJson.acceptBookingByWorker(bookingId, userId);

  const provider = await getProviderByUserId(userId);
  if (!provider) throw new Error("Worker profile not found");

  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw new Error("Booking request not found");

  if (booking.selectedProviderId) {
    const isTarget = booking.selectedProviderId === provider.id || booking.selectedProviderId === provider.userId || booking.selectedProviderId === userId;
    if (!isTarget) {
      throw new Error("Access denied. This booking request was sent to another professional.");
    }
  }

  if (booking.assignedProvider) {
    throw new Error("Request no longer available. Another professional has already accepted it.");
  }

  if (booking.status !== 'Pending' && booking.status !== 'Searching') {
    throw new Error("Request is no longer available.");
  }

  const assignedProviderObj = {
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

  booking.assignedProvider = assignedProviderObj;
  booking.workerResponse = 'Accepted';
  booking.workerResponseAt = new Date();
  booking.status = 'Accepted';
  booking.acceptedAt = new Date();
  booking.updatedAt = new Date();

  await booking.save();
  return booking.toObject();
}

async function rejectBookingByWorker(bookingId, userId, reason = "") {
  if (!checkMongo()) return dbJson.rejectBookingByWorker(bookingId, userId, reason);

  const provider = await getProviderByUserId(userId);
  const pId = provider ? provider.id : userId;

  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) return false;

  if (!booking.rejectedBy) booking.rejectedBy = [];
  if (!booking.rejectedBy.includes(userId)) booking.rejectedBy.push(userId);
  if (!booking.rejectedBy.includes(pId)) booking.rejectedBy.push(pId);

  if (booking.selectedProviderId && (booking.selectedProviderId === pId || booking.selectedProviderId === userId || (provider && booking.selectedProviderId === provider.id))) {
    booking.workerResponse = 'Rejected';
    booking.workerResponseAt = new Date();
    booking.rejectionReason = reason || "Selected professional is unavailable";
    booking.status = 'Rejected';
  }

  booking.updatedAt = new Date();
  await booking.save();
  return true;
}

async function updateWorkerJobStatus(bookingId, userId, newStatus) {
  if (!checkMongo()) return dbJson.updateWorkerJobStatus(bookingId, userId, newStatus);

  const provider = await getProviderByUserId(userId);
  const pId = provider ? provider.id : userId;

  const booking = await Booking.findOne({ id: bookingId });
  if (!booking) throw new Error("Booking not found");

  if (!booking.assignedProvider || (booking.assignedProvider.userId !== userId && booking.assignedProvider.id !== pId)) {
    throw new Error("Unauthorized to update this booking");
  }

  booking.status = newStatus;
  booking.updatedAt = new Date();

  if (newStatus === 'Completed') {
    booking.completedAt = new Date();
    if (provider) {
      await Provider.updateOne({ id: provider.id }, { $inc: { totalJobs: 1 } });
    }
  }

  await booking.save();
  return booking.toObject();
}

async function getWorkerJobs(userId) {
  if (!checkMongo()) return dbJson.getWorkerJobs(userId);

  const provider = await getProviderByUserId(userId);
  const pId = provider ? provider.id : userId;

  const allBookings = await Booking.find({
    $or: [
      { 'assignedProvider.userId': userId },
      { 'assignedProvider.id': pId }
    ]
  }).lean();

  const activeJobs = allBookings.filter(b => ['Accepted', 'Assigned', 'On the Way', 'Arrived', 'In Progress'].includes(b.status));
  const completedJobs = allBookings.filter(b => b.status === 'Completed');

  return { activeJobs, completedJobs };
}

async function getWorkerDashboardData(userId) {
  if (!checkMongo()) return dbJson.getWorkerDashboardData(userId);

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
   PROVIDERS & SERVICES CATALOG OPERATIONS
   ========================================================== */

async function getProviders() {
  if (!checkMongo()) return dbJson.getProviders();
  return await Provider.find().lean();
}

async function getProvidersByCategory(category) {
  if (!checkMongo()) return dbJson.getProvidersByCategory(category);

  if (!category) return await Provider.find({ availability: 'Available' }).lean();

  const regex = new RegExp(category, 'i');
  const providers = await Provider.find({
    service: regex,
    availability: 'Available'
  }).sort({ rating: -1, totalJobs: -1 }).lean();

  return providers;
}

async function getServices() {
  if (!checkMongo()) return dbJson.getServices();
  return await Service.find().lean();
}

async function getReviews(category = null) {
  if (!checkMongo()) return dbJson.getReviews(category);
  if (category) {
    return await Review.find({ service: new RegExp(category, 'i') }).lean();
  }
  return await Review.find().lean();
}

async function addReview({ bookingId, userId, userName, rating, comment, service }) {
  if (!checkMongo()) return dbJson.addReview({ bookingId, userId, userName, rating, comment, service });
  const id = "rev-" + Date.now().toString().slice(-6);
  const rev = new Review({
    id,
    bookingId: bookingId || null,
    userId: userId || null,
    userName: userName || "Anonymous Customer",
    rating: Number(rating) || 5,
    comment: comment.trim(),
    service: service || "General Home Service"
  });
  await rev.save();

  if (bookingId) {
    const booking = await Booking.findOneAndUpdate(
      { id: bookingId },
      { $set: { hasReviewed: true, rating: Number(rating) } },
      { new: true }
    );
    if (booking && (booking.selectedProviderId || booking.assignedProvider)) {
      const provId = booking.selectedProviderId || (booking.assignedProvider ? booking.assignedProvider.id : null);
      if (provId) {
        await Provider.updateOne(
          { $or: [{ id: provId }, { userId: provId }] },
          { $inc: { totalJobs: 1 } }
        );
      }
    }
  }

  return rev.toObject();
}

async function getContacts() {
  if (!checkMongo()) return dbJson.getContacts();
  return await Contact.find().lean();
}

async function saveContact({ name, email, message }) {
  if (!checkMongo()) return dbJson.saveContact({ name, email, message });
  const id = "cnt-" + Date.now().toString().slice(-6);
  const cnt = new Contact({ id, name, email, message });
  await cnt.save();
  return cnt.toObject();
}

async function updateContactStatus(id, status) {
  if (!checkMongo()) return dbJson.updateContactStatus(id, status);
  return await Contact.findOneAndUpdate({ id }, { $set: { status } }, { new: true }).lean();
}

async function getPlatformStats() {
  if (!checkMongo()) return dbJson.getPlatformStats();
  const totalBookings = await Booking.countDocuments();
  const completedBookings = await Booking.countDocuments({ status: 'Completed' });
  const totalProviders = await Provider.countDocuments();
  const totalUsers = await User.countDocuments();
  return { totalBookings, completedBookings, totalProviders, totalUsers };
}

module.exports = {
  initDb,
  createUser,
  authenticateUser,
  findUserByEmail,
  findUserById,
  createSession,
  getUserBySessionToken,
  updateUserProfile,
  changeUserPassword,
  getBookings,
  getBookingsByUserId,
  getBookingById,
  saveBooking,
  updateBookingStatus,
  assignProviderToBooking,
  deleteBooking,
  getBookingTrackingStatus,
  getReviews,
  addReview,
  getContacts,
  saveContact,
  updateContactStatus,
  getProviders,
  getProvidersByCategory,
  getServices,
  getPlatformStats,
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
