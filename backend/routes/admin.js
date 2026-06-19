const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Batch = require('../models/Batch');
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { role, status } = req.query;
    let query = {};
    
    if (role) query.role = role;
    if (status) query.status = status;
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status, batch } = req.body;
    
    if (!['pending', 'hr_reviewed', 'active', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const updateData = { status };
    if (batch !== undefined) updateData.batch = batch;

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found.' });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/batch', auth, adminOnly, async (req, res) => {
  try {
    const { batch } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { batch }, 
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['intern', 'hr', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role value.' });
    }
    if (req.params.id === req.user.id) {
      return res.status(403).json({ error: 'You cannot change your own role.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/batches', auth, adminOnly, async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: 1 });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches', auth, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Batch name is required' });
    
    const batch = await Batch.create({ name: name.trim() });
    res.status(201).json(batch);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Batch already exists.' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/batches/:oldName', auth, adminOnly, async (req, res) => {
  try {
    const { newName } = req.body;
    const oldName = req.params.oldName;
    const cleanNewName = newName.trim();

    if (!cleanNewName) return res.status(400).json({ error: 'New batch name is required.' });

    await Batch.findOneAndUpdate({ name: oldName }, { name: cleanNewName });

    const usersToUpdate = await User.find({ batch: oldName });
    await User.updateMany({ batch: oldName }, { batch: cleanNewName });

    const notifications = usersToUpdate.map(u => ({
      userId: u._id,
      role: 'intern',
      type: 'system',
      text: `Admin Update: Your assigned batch has been changed from "${oldName}" to "${cleanNewName}".`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ success: true, newName: cleanNewName });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'A batch with this new name already exists.' });
    res.status(500).json({ error: err.message });
  }
});
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, message: 'User history permanently deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;