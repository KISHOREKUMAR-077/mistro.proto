const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, default: null, index: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, required: true },
  service: { type: String, required: true, index: true },
  specialization: { type: String, default: '' },
  experience: { type: Number, default: 1 },
  serviceArea: { type: String, default: 'Chennai' },
  rating: { type: Number, default: 5.0 },
  totalJobs: { type: Number, default: 0 },
  availability: { type: String, enum: ['Available', 'Offline'], default: 'Available' },
  status: { type: String, default: 'Available' },
  badge: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  profilePhoto: { type: String, default: null },
  lat: { type: Number, default: 13.0827 },
  lng: { type: Number, default: 80.2707 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Provider', providerSchema);
