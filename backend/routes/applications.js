const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

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