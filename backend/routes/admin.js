const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Batch   = require('../models/Batch');
const Task    = require('../models/Task');
const auth    = require('../middleware/authMiddleware');

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
};

const requireManager = (req, res, next) => {
  if (!['admin', 'hr'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied.' });
  next();
};

const safeFields = '-password -resetPasswordToken -resetPasswordExpires -emailVerifyToken -emailVerifyExpires';
router.get('/users', auth, requireManager, async (req, res) => {
  try {
    const { status, role } = req.query;
    const query = {};
    if (status) query.status = status;
    if (role)   query.role   = role;
    const users = await User.find(query).select(safeFields).sort({ appliedAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/registry', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select(safeFields).sort({ appliedAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.patch('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { batch, status, role } = req.body;
    const update = {};
    if (batch !== undefined) update.batch = batch;
    if (role  !== undefined) update.role  = role;

    if (status !== undefined) {
      if (status === 'revoked') return res.status(400).json({ error: 'Use /users/:id/revoke instead.' });
      update.status = status;
      if (status === 'active') { update.revokedAt = null; update.revokedBy = null; }
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select(safeFields);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/revoke', auth, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'You cannot revoke your own access.' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'revoked', revokedAt: new Date(), revokedBy: req.user.id },
      { new: true }
    ).select(safeFields);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.patch('/users/:id/reactivate', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active', revokedAt: null, revokedBy: null },
      { new: true }
    ).select(safeFields);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'You cannot delete your own account.' });

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/batches', auth, requireManager, async (req, res) => {
  try {
    const batches = await Batch.find({}).sort({ domain: 1, name: 1 });
    const counts = await User.aggregate([
      { $match: { role: 'intern', status: 'active' } },
      { $group: { _id: { domain: '$domain', batch: '$batch' }, count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[`${c._id.domain}::${c._id.batch}`] = c.count; });

    res.json(batches.map(b => ({
      ...b.toObject(),
      internCount: countMap[`${b.domain}::${b.name}`] || 0,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches', auth, requireAdmin, async (req, res) => {
  try {
    const { name, domain } = req.body;
    if (!name?.trim() || !domain?.trim())
      return res.status(400).json({ error: 'Batch name and domain are required.' });

    const exists = await Batch.findOne({ name: name.trim(), domain: domain.trim() });
    if (exists) return res.status(409).json({ error: 'This batch already exists for this domain.' });

    const batch = await Batch.create({ name: name.trim(), domain: domain.trim(), createdBy: req.user.id });
    res.status(201).json({ ...batch.toObject(), internCount: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/batches/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Batch name is required.' });

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found.' });

    const oldName = batch.name;
    batch.name = name.trim();
    await batch.save();

    await User.updateMany({ domain: batch.domain, batch: oldName }, { batch: batch.name });
    await Task.updateMany({ assignedDomain: batch.domain, assignedBatch: oldName }, { assignedBatch: batch.name });

    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/batches/:id', auth, requireAdmin, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found.' });

    const internCount = await User.countDocuments({ domain: batch.domain, batch: batch.name, role: 'intern' });
    if (internCount > 0) {
      return res.status(409).json({ error: `Cannot delete — ${internCount} intern(s) still assigned to this batch.` });
    }

    await Batch.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign an intern to a batch
router.patch('/batches/:id/assign', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found.' });

    const user = await User.findOneAndUpdate(
      { _id: userId, domain: batch.domain },
      { batch: batch.name },
      { new: true }
    ).select(safeFields);
    if (!user) return res.status(404).json({ error: 'Intern not found, or domain mismatch with batch.' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;