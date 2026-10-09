const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  bookingId: { type: String, default: null },
  userId: { type: String, default: null },
  userName: { type: String, default: 'Anonymous Customer' },
  service: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
