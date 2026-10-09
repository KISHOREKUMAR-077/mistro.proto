const mongoose = require('mongoose');
const OTP = require('../models/OTP');
const User = require('../models/User');
const dbJson = require('../db');
const https = require('https');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// Helper to sanitize 10-digit Indian mobile numbers
function sanitizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

// Generate & Send OTP via MSG91 (with Dev Mode fallback)
async function sendPhoneOTP(phone, purpose = 'PHONE_VERIFICATION') {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone) {
    throw new Error('Valid 10-digit mobile number is required.');
  }

  // Rate Limiting: Max 3 active non-expired OTPs per phone in last 5 mins
  if (isMongoConnected()) {
    try {
      const recentCount = await OTP.countDocuments({
        phone: cleanPhone,
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      });

      if (recentCount >= 3) {
        throw new Error('Too many OTP requests. Please wait 5 minutes before trying again.');
      }
    } catch (err) {
      console.error('[SMS MONGODB RATE-LIMIT CHECK ERROR]:', err.message);
    }
  } else {
    const allOtps = await dbJson.getOTPs();
    const recentCount = allOtps.filter(o =>
      o.phone === cleanPhone &&
      new Date(o.createdAt) >= new Date(Date.now() - 5 * 60 * 1000)
    ).length;

    if (recentCount >= 3) {
      throw new Error('Too many OTP requests. Please wait 5 minutes before trying again.');
    }
  }

  // Generate 6-digit OTP
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  const otpObj = {
    id: 'otp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    phone: cleanPhone,
    otpCode,
    expiresAt,
    purpose,
    verified: false,
    attempts: 0,
    createdAt: new Date().toISOString()
  };

  if (isMongoConnected()) {
    try {
      const otpRecord = new OTP(otpObj);
      await otpRecord.save();
    } catch (err) {
      console.error('[SMS MONGODB SAVE ERROR]:', err.message);
      await dbJson.saveOTP({ ...otpObj, expiresAt: expiresAt.toISOString() });
    }
  } else {
    await dbJson.saveOTP({ ...otpObj, expiresAt: expiresAt.toISOString() });
  }

  const msg91Key = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (msg91Key && templateId) {
    // Real MSG91 Gateway Delivery
    try {
      const payload = JSON.stringify({
        template_id: templateId,
        mobile: cleanPhone,
        authkey: msg91Key,
        otp: otpCode
      });

      const options = {
        hostname: 'control.msg91.com',
        path: '/api/v5/otp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': msg91Key
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log(`[MSG91 SMS DISPATCH] Response for ${cleanPhone}:`, body);
        });
      });

      req.on('error', err => console.error('[MSG91 SMS ERROR]:', err));
      req.write(payload);
      req.end();

      return { success: true, message: `OTP sent via MSG91 to +${cleanPhone}`, isDevMode: false };
    } catch (err) {
      console.error('[MSG91 Exception]:', err.message);
    }
  }

  // Development Fallback Mode (Explicitly Labeled)
  console.log(`\n==========================================================`);
  console.log(`[MSG91 DEV MODE ALERT] No MSG91_AUTH_KEY set in .env.`);
  console.log(`Target Phone: +${cleanPhone}`);
  console.log(`Development OTP Code: ${otpCode}`);
  console.log(`Expires At: ${expiresAt.toISOString()}`);
  console.log(`==========================================================\n`);

  return {
    success: true,
    message: `[DEVELOPMENT_MODE] Verification OTP generated for +${cleanPhone}. Use OTP: ${otpCode}`,
    devOtp: otpCode,
    isDevMode: true
  };
}

// Verify OTP & Mark Phone Verified on User
async function verifyPhoneOTP(phone, inputOtp, userId = null) {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone || !inputOtp) {
    throw new Error('Phone number and OTP code are required.');
  }

  if (isMongoConnected()) {
    try {
      const record = await OTP.findOne({
        phone: cleanPhone,
        verified: false,
        expiresAt: { $gte: new Date() }
      }).sort({ createdAt: -1 });

      if (!record) {
        throw new Error('OTP has expired or was not found. Please request a new OTP.');
      }

      if (record.attempts >= 5) {
        throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
      }

      if (record.otpCode !== String(inputOtp).trim()) {
        record.attempts += 1;
        await record.save();
        throw new Error('Invalid verification code. Please check and try again.');
      }

      // Mark verified
      record.verified = true;
      await record.save();

      // Update user phone verification status
      if (userId) {
        await User.updateOne(
          { id: userId },
          { $set: { isPhoneVerified: true, phoneVerifiedAt: new Date() } }
        );
      } else {
        await User.updateMany(
          { phone: { $regex: cleanPhone.slice(-10) } },
          { $set: { isPhoneVerified: true, phoneVerifiedAt: new Date() } }
        );
      }

      return { success: true, message: 'Phone number verified successfully!' };
    } catch (err) {
      if (err.message.includes('OTP') || err.message.includes('verification')) {
        throw err;
      }
      console.error('[SMS MONGODB VERIFY ERROR]:', err.message);
    }
  }

  // JSON Fallback
  const allOtps = await dbJson.getOTPs();
  const validOtps = allOtps.filter(o =>
    o.phone === cleanPhone &&
    !o.verified &&
    new Date(o.expiresAt) >= new Date()
  );
  validOtps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const record = validOtps[0];

  if (!record) {
    throw new Error('OTP has expired or was not found. Please request a new OTP.');
  }

  if (record.attempts >= 5) {
    throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
  }

  if (record.otpCode !== String(inputOtp).trim()) {
    record.attempts = (record.attempts || 0) + 1;
    await dbJson.updateOTP(record.id, { attempts: record.attempts });
    throw new Error('Invalid verification code. Please check and try again.');
  }

  await dbJson.updateOTP(record.id, { verified: true });

  if (userId) {
    await dbJson.updateUserProfile(userId, { isPhoneVerified: true });
  }

  return { success: true, message: 'Phone number verified successfully!' };
}

// Transactional SMS Alerts for Bookings
async function sendBookingRequestSMS(workerPhone, customerName, service, slot) {
  const cleanPhone = sanitizePhone(workerPhone);
  const text = `MISTRO: New ${service} booking request from ${customerName} for ${slot}. Open your Worker Dashboard to accept or reject.`;
  console.log(`[SMS ALERT -> WORKER +${cleanPhone}]: ${text}`);
  return { success: true, text };
}

async function sendBookingConfirmationSMS(customerPhone, workerName, service, slot) {
  const cleanPhone = sanitizePhone(customerPhone);
  const text = `MISTRO: ${workerName} has accepted your booking for ${service} service at ${slot}. Check your dashboard for live tracking.`;
  console.log(`[SMS ALERT -> CUSTOMER +${cleanPhone}]: ${text}`);
  return { success: true, text };
}

async function sendBookingStatusSMS(customerPhone, workerName, status) {
  const cleanPhone = sanitizePhone(customerPhone);
  const text = `MISTRO: Service status update from ${workerName}: ${status}. Check live status in your dashboard.`;
  console.log(`[SMS ALERT -> CUSTOMER +${cleanPhone}]: ${text}`);
  return { success: true, text };
}

module.exports = {
  sendPhoneOTP,
  verifyPhoneOTP,
  sendBookingRequestSMS,
  sendBookingConfirmationSMS,
  sendBookingStatusSMS
};
