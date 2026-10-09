const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const dbMongo = require('../db-mongo');
const dbJson = require('../db');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// Initialize Razorpay Instance
let instance = null;

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_id && key_secret) {
    if (!instance) {
      instance = new Razorpay({ key_id, key_secret });
    }
    return instance;
  }
  return null;
}

// 1. Create Razorpay Payment Order
async function createPaymentOrder({ bookingId, customerId, amount }) {
  if (!bookingId || !amount) {
    throw new Error('Booking ID and amount in INR are required.');
  }

  const booking = await dbMongo.getBookingById(bookingId);
  if (!booking) {
    throw new Error('Booking record not found.');
  }

  const receiptNo = `rcpt_${bookingId}_${Date.now().toString().slice(-6)}`;
  const amountPaise = Math.round(Number(amount) * 100);

  const rzp = getRazorpayInstance();
  let gatewayOrderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  if (rzp) {
    try {
      const order = await rzp.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: receiptNo,
        notes: { bookingId, customerId: customerId || '' }
      });
      gatewayOrderId = order.id;
    } catch (err) {
      console.error('[RAZORPAY ORDER CREATION ERROR]:', err.message);
    }
  } else {
    console.log(`[RAZORPAY TEST MODE] Created mock gateway order: ${gatewayOrderId} for ₹${amount}`);
  }

  const paymentId = 'pay-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const paymentObj = {
    id: paymentId,
    bookingId,
    customerId: customerId || booking.userId || null,
    amount: Number(amount),
    currency: 'INR',
    provider: 'Razorpay',
    gatewayOrderId,
    status: 'PENDING',
    receiptNo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isMongoConnected()) {
    try {
      const newPayment = new Payment(paymentObj);
      await newPayment.save();
      await Booking.updateOne({ id: bookingId }, { $set: { paymentStatus: 'PENDING' } });
    } catch (err) {
      console.error('[PAYMENT MONGODB SAVE ERROR]:', err.message);
      await dbJson.savePayment(paymentObj);
    }
  } else {
    await dbJson.savePayment(paymentObj);
    await dbJson.processPayment(bookingId, { paymentMethod: 'Razorpay', amount: Number(amount) });
  }

  return {
    success: true,
    payment: paymentObj,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mistro2026',
    gatewayOrderId,
    amount: Number(amount),
    amountPaise,
    currency: 'INR',
    isTestMode: !rzp
  };
}

// 2. Verify Razorpay Payment Signature
async function verifyPaymentSignature({ bookingId, gatewayOrderId, gatewayPaymentId, gatewaySignature }) {
  if (!gatewayOrderId || !gatewayPaymentId) {
    throw new Error('Order ID and Payment ID are required for verification.');
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_secret && gatewaySignature) {
    const text = `${gatewayOrderId}|${gatewayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(text)
      .digest('hex');

    if (expectedSignature !== gatewaySignature) {
      if (isMongoConnected()) {
        await Payment.updateOne(
          { gatewayOrderId },
          { $set: { status: 'FAILED', updatedAt: new Date() } }
        );
      } else {
        await dbJson.updatePayment(gatewayOrderId, { status: 'FAILED' });
      }
      throw new Error('Invalid Razorpay payment signature verification failed.');
    }
  } else {
    console.log(`[RAZORPAY TEST VERIFY] Verifying payment in test mode for Order: ${gatewayOrderId}`);
  }

  if (isMongoConnected()) {
    try {
      const paymentRecord = await Payment.findOneAndUpdate(
        { gatewayOrderId },
        {
          $set: {
            gatewayPaymentId: gatewayPaymentId || `pay_mock_${Date.now()}`,
            gatewaySignature: gatewaySignature || 'mock_signature',
            status: 'PAID',
            verifiedAt: new Date(),
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      const targetBookingId = bookingId || (paymentRecord ? paymentRecord.bookingId : null);
      const booking = await Booking.findOneAndUpdate(
        { id: targetBookingId },
        {
          $set: {
            paymentStatus: 'PAID',
            paidAmount: paymentRecord ? paymentRecord.amount : 399,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      return {
        success: true,
        message: 'Payment verified and status updated to PAID!',
        payment: paymentRecord ? paymentRecord.toObject() : null,
        booking: booking ? booking.toObject() : null
      };
    } catch (err) {
      console.error('[PAYMENT MONGODB VERIFY ERROR]:', err.message);
    }
  }

  // JSON Fallback
  const paymentRecord = await dbJson.updatePayment(gatewayOrderId, {
    gatewayPaymentId: gatewayPaymentId || `pay_mock_${Date.now()}`,
    gatewaySignature: gatewaySignature || 'mock_signature',
    status: 'PAID',
    verifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const targetBookingId = bookingId || (paymentRecord ? paymentRecord.bookingId : null);
  let updatedBooking = null;
  if (targetBookingId) {
    updatedBooking = await dbJson.processPayment(targetBookingId, {
      paymentMethod: 'Razorpay',
      amount: paymentRecord ? paymentRecord.amount : 399
    });
  }

  return {
    success: true,
    message: 'Payment verified and status updated to PAID!',
    payment: paymentRecord,
    booking: updatedBooking
  };
}

// 3. Process Razorpay Webhook Event
async function processRazorpayWebhook(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (secret && signature) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Invalid webhook signature');
    }
  }

  const payload = JSON.parse(rawBody.toString());
  const event = payload.event;

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = payload.payload.payment.entity;
    const gatewayOrderId = paymentEntity.order_id;
    const gatewayPaymentId = paymentEntity.id;

    if (isMongoConnected()) {
      await Payment.updateOne(
        { gatewayOrderId },
        {
          $set: {
            gatewayPaymentId,
            status: 'PAID',
            verifiedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      const payObj = await Payment.findOne({ gatewayOrderId });
      if (payObj) {
        await Booking.updateOne(
          { id: payObj.bookingId },
          { $set: { paymentStatus: 'PAID', paidAmount: payObj.amount } }
        );
      }
    } else {
      const payObj = await dbJson.updatePayment(gatewayOrderId, {
        gatewayPaymentId,
        status: 'PAID',
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      if (payObj && payObj.bookingId) {
        await dbJson.processPayment(payObj.bookingId, { paymentMethod: 'Razorpay', amount: payObj.amount });
      }
    }
  }

  return { success: true };
}

module.exports = {
  createPaymentOrder,
  verifyPaymentSignature,
  processRazorpayWebhook
};
