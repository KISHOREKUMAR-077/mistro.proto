const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  bookingId: { type: String, required: true, index: true },
  customerId: { type: String, default: null, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  provider: { type: String, default: 'Razorpay' },
  gatewayOrderId: { type: String, required: true, index: true },
  gatewayPaymentId: { type: String, default: null, index: true },
  gatewaySignature: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'], 
    default: 'PENDING',
    index: true 
  },
  paymentMethod: { type: String, default: 'ONLINE' }, // UPI, CARD, NETBANKING, COD
  receiptNo: { type: String, default: null },
  verifiedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
