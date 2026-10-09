const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, default: null, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  selectedProviderId: { type: String, default: null, index: true },
  selectedProviderName: { type: String, default: null },
  date: { type: String, required: true },
  slot: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    lat: Number,
    lng: Number
  },
  problem: { type: String, default: '' },
  urgency: { type: String, default: 'Standard' },
  status: { type: String, default: 'Pending', index: true },
  workerResponse: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  workerResponseAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },
  rejectedBy: [{ type: String }],
  assignedProvider: {
    id: String,
    userId: String,
    name: String,
    service: String,
    phone: String,
    rating: Number,
    badge: String,
    experience: Number,
    specialization: String,
    profilePhoto: String
  },
  paymentStatus: { type: String, default: 'Pending' },
  paymentMethod: { type: String, default: null },
  paidAmount: { type: Number, default: 0 },
  acceptedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
