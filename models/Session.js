const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
