const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const auth    = require('../middleware/authMiddleware');

// Public: Intern applies
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, domain } = req.body;
    if (!name || !email || !password || !domain)
      return res.status(400).json({ error: 'All fields are required.' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      name, email,
      password: hashed,
      domain,
      role: 'intern',
      status: 'pending',
    });

    res.status(201).json({ message: 'Application submitted. Awaiting HR review.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No account found with this email.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Incorrect password.' });


    if (user.role === 'intern' && user.status !== 'active')  {
      const messages = {
        pending:     'Your application is under HR review.',
        hr_reviewed: 'Your application is pending Admin approval.',
        rejected:    'Your application was not approved.',
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

// HR: Get all pending applications 
router.get('/applications/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied.' });

    const users = await User.find({ role: 'intern', status: 'pending' })
      .select('-password').sort({ appliedAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//HR: Forward application to Admin 
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

//Admin: Get HR-reviewed applications
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

// Admin: Approve or Reject
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

    res.json({ message: `Application ${decision === 'active' ? 'approved' : 'rejected'}.`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all active interns
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