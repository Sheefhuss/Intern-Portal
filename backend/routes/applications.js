const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const mailer = require('../utils/mailer');

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