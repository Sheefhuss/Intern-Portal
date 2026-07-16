const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const crypto = require('crypto');
const { sendBrevoEmail } = require('../utils/brevoMailer');
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', auth, async (req, res) => {
  try {
    const { name, linkedIn, mobile, photoBase64 } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (user.mobile !== mobile) {
      user.isMobileVerified = false;
    }

    user.name = name || user.name;
    user.linkedIn = linkedIn || user.linkedIn;
    user.mobile = mobile || user.mobile;
    
    if (photoBase64) {
      user.photoBase64 = photoBase64;
    }

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-otp', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.mobile) return res.status(400).json({ error: "No mobile number found to verify." });

    const otp = crypto.randomInt(100000, 999999).toString();
    
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60000); 
    await user.save();

    await sendBrevoEmail({
      to: user.email,
      toName: user.name,
      subject: 'Verify your Mobile Number - Enginow',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827;">
          <h2 style="color: #7C3AED;">Enginow Verification</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to verify the mobile number <strong>${user.mobile}</strong>.</p>
          <p>Your 6-digit verification code is:</p>
          <h1 style="letter-spacing: 5px; background: #F3F4F6; padding: 10px; display: inline-block; border-radius: 8px;">${otp}</h1>
          <p style="color: #6B7280; font-size: 12px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    res.json({ success: true, message: "OTP sent successfully to your email!" });
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ error: "Failed to send OTP email." });
  }
});

router.post('/verify-mobile', auth, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP code." });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    user.isMobileVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ success: true, message: "Mobile number verified successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;