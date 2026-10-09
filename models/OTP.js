const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  phone: { type: String, required: true, index: true },
  otpCode: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  purpose: { type: String, default: 'PHONE_VERIFICATION' }, // PHONE_VERIFICATION, PASSWORD_RESET
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OTP', otpSchema);
