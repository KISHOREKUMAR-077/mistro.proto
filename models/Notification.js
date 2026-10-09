const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  recipientRole: { type: String, enum: ['customer', 'worker', 'admin'], default: 'customer' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'INFO' }, // BOOKING_REQUEST, BOOKING_ACCEPTED, BOOKING_REJECTED, STATUS_UPDATE, PAYMENT_SUCCESS, PAYMENT_FAILED, CANCELLED
  bookingId: { type: String, default: null, index: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
