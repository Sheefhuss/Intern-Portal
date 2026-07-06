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

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts. Try again in 1 hour.' },
});

const generateToken = () => crypto.randomBytes(32).toString('hex');

const passwordStrong = (pw) => {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;':",.<>?]).{8,}$/.test(pw);
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

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { name, email, password, domain } = req.body;

    if (!name || !email || !password || !domain)
      return res.status(400).json({ error: 'All fields are required.' });

    if (!passwordStrong(password))
      return res.status(400).json({
        error: 'Password must be 8+ characters with 1 uppercase, 1 number, and 1 special character.',
      });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered.' });

    const hashed       = await bcrypt.hash(password, 12);
    const verifyToken  = generateToken();
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      domain,
      role:               'intern',
      status:             'pending',
      emailVerified:      false,
      emailVerifyToken:   verifyToken,
      emailVerifyExpires: verifyExpires,
    });

    try {
      await mailer.sendVerificationEmail({ to: email, name, token: verifyToken });
    } catch (mailErr) {
      console.error('Mail error:', mailErr.message);
    }

    res.status(201).json({
      message: 'Application submitted! Please check your email to verify your address.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Invalid verification link.' });

    const user = await User.findOne({
      emailVerifyToken:   token,
      emailVerifyExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ error: 'Verification link is invalid or has expired.' });

    user.emailVerified      = true;
    user.emailVerifyToken   = null;
    user.emailVerifyExpires = null;
    await user.save();

    res.redirect(`${process.env.FRONTEND_URL}?verified=true`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(404).json({ error: 'No account found.' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified.' });

    const verifyToken   = generateToken();
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerifyToken   = verifyToken;
    user.emailVerifyExpires = verifyExpires;
    await user.save();

    await mailer.sendVerificationEmail({ to: user.email, name: user.name, token: verifyToken });
    res.json({ message: 'Verification email resent.' });
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

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Incorrect password.' });

    const isStaff = user.role === 'admin' || user.role === 'hr';

    if (!isStaff && !user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        code:  'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    if (user.status === 'revoked') {
      return res.status(403).json({ error: 'Your access has been revoked. Contact an administrator.' });
    }

    if (user.role === 'intern' && user.status !== 'active') {
      const messages = {
        pending:     'Your application is under HR review.',
        hr_reviewed: 'Your application is pending Admin approval.',
        rejected:    'Your application was not approved. Contact HR for details.',
      };
      return res.status(403).json({ error: messages[user.status] || 'Account not active.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, role: user.role, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

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

router.get('/applications/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied.' });

    const users = await User.find({ role: 'intern', status: 'pending', emailVerified: true })
      .select('-password').sort({ appliedAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/applications/:id/forward', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr')
      return res.status(403).json({ error: 'Only HR can forward applications.' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'hr_reviewed' },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'Applicant not found.' });
    res.json({ message: 'Forwarded to Admin.', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/applications/reviewed', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied.' });

    const users = await User.find({ role: 'intern', status: 'hr_reviewed' })
      .select('-password').sort({ appliedAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/applications/:id/decision', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Only Admin can approve/reject.' });

    const { decision, batch } = req.body;
    if (!['active', 'rejected'].includes(decision))
      return res.status(400).json({ error: 'Decision must be active or rejected.' });

    const update = { status: decision };
    if (decision === 'active' && batch) update.batch = batch;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Applicant not found.' });

    try {
      if (decision === 'active') {
        await mailer.sendApprovalEmail({ to: user.email, name: user.name, batch });
      } else {
        await mailer.sendRejectionEmail({ to: user.email, name: user.name });
      }
    } catch (mailErr) {
      console.error('Mail error:', mailErr.message);
    }

    res.json({ message: `Application ${decision === 'active' ? 'approved' : 'rejected'}.`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/interns/:id/batch', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr')
      return res.status(403).json({ error: 'Access denied.' });

    const { batch } = req.body;
    if (!batch || !batch.trim())
      return res.status(400).json({ error: 'Batch value is required.' });

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'intern', status: 'active' },
      { batch: batch.trim() },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'Active intern not found.' });
    res.json({ message: 'Batch updated.', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/interns', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied.' });

    const interns = await User.find({ role: 'intern', status: 'active' })
      .select('-password').sort({ appliedAt: -1 });
    res.json(interns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;