const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  icon: { type: String, required: true },
  startingPrice: { type: Number, required: true },
  description: { type: String, required: true },
  features: [{ type: String }]
});

module.exports = mongoose.model('Service', serviceSchema);
