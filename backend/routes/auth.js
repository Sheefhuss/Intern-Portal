const express   = require('express');
const router    = express.Router();
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const rateLimit = require('express-rate-limit');
const User      = require('../models/User');
const auth      = require('../middleware/authMiddleware');
const mailer    = require('../utils/mailer');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Try again in 1 hour.' },
});

const generateToken = () => crypto.randomBytes(32).toString('hex');
const generatePasscode = () => crypto.randomInt(100000, 1000000).toString(); // 6 digits

const passwordStrong = (pw) => {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;':",.<>?]).{8,}$/.test(pw);
};

const issueSession = (user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { token, role: user.role, name: user.name, email: user.email };
};

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.status === 'revoked') {
      return res.status(403).json({ error: 'Your access has been revoked. Contact an administrator.' });
    }

    res.json({
      email: user.email,
      role: user.role,
      name: user.name,
      domain: user.domain,
      batch: user.batch,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/signup', signupLimiter, async (req, res) => {
  try {
    const { email, passcode, password } = req.body;

    if (!email || !passcode || !password)
      return res.status(400).json({ error: 'Email, passcode, and password are all required.' });

    if (!passwordStrong(password))
      return res.status(400).json({
        error: 'Password must be 8+ characters with 1 uppercase, 1 number, and 1 special character.',
      });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ error: 'No invitation found for this email. Ask your admin to add you first.' });

    if (user.status === 'active')
      return res.status(409).json({ error: 'This account already exists. Try signing in instead.' });

    if (user.status === 'revoked')
      return res.status(403).json({ error: 'This account has been revoked. Contact an administrator.' });

    if (!user.otp || !user.otpExpires || user.otpExpires < new Date())
      return res.status(400).json({ error: 'Your passcode has expired. Ask your admin to resend it.' });

    if (user.otp !== String(passcode).trim())
      return res.status(400).json({ error: 'Incorrect passcode.' });

    user.password      = await bcrypt.hash(password, 12);
    user.status        = 'active';
    user.emailVerified = true;
    user.otp           = null;
    user.otpExpires    = null;
    await user.save();

    res.status(201).json({ message: 'Account created!', ...issueSession(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resend-passcode', signupLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No invitation found for this email.' });
    if (user.status !== 'invited')
      return res.status(400).json({ error: 'This account is not awaiting activation.' });

    const passcode = generatePasscode();
    user.otp        = passcode;
    user.otpExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await mailer.sendInviteEmail({ to: user.email, name: user.name, passcode });
    } catch (mailErr) {
      console.error('Mail error:', mailErr.message);
    }

    res.json({ message: 'Passcode resent. Check your email.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No account found with this email.' });

    if (user.status === 'invited') {
      return res.status(403).json({
        error: 'Your account is ready to be activated. Use the passcode emailed to you under "Create Account".',
        code:  'ACCOUNT_NOT_ACTIVATED',
        email: user.email,
      });
    }

    if (user.status === 'revoked') {
      return res.status(403).json({ error: 'Your access has been revoked. Contact an administrator.' });
    }

    const match = await bcrypt.compare(password, user.password || '');
    if (!match) return res.status(401).json({ error: 'Incorrect password.' });

    res.json(issueSession(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.status !== 'active')
      return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const resetToken   = generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken   = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    await mailer.sendPasswordResetEmail({ to: user.email, name: user.name, token: resetToken });
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: 'Token and new password are required.' });

    if (!passwordStrong(password))
      return res.status(400).json({
        error: 'Password must be 8+ characters with 1 uppercase, 1 number, and 1 special character.',
      });

    const user = await User.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ error: 'Reset link is invalid or has expired.' });

    user.password             = await bcrypt.hash(password, 12);
    user.resetPasswordToken   = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;