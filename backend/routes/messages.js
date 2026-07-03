const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user.id,
      read: false
    });
    res.json({ count: unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/mark-read/:senderId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.senderId, receiver: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', auth, async (req, res) => {
  try {
    let query = { _id: { $ne: req.user.id }, status: { $ne: 'revoked' } };

    if (req.user.role === 'intern') {
      query.role = 'hr';
    } else if (req.user.role === 'admin') {
      query.role = { $in: ['hr', 'admin'] };
    }
    const users = await User.find(query).select('name role domain batch _id').lean();
    const unreadMessages = await Message.find({ receiver: req.user.id, read: false }).select('sender').lean();
    const unreadSenders = new Set(unreadMessages.map(m => String(m.sender)));
    const usersWithUnread = users.map(user => ({
      ...user,
      hasUnread: unreadSenders.has(String(user._id))
    }));

    res.json(usersWithUnread);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;