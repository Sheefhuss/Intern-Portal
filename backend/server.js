const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db');
const User = require('./models/User');
const Notification = require('./models/Notification');
const auth = require('./middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/internships', require('./routes/internships'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/dashboard/stats', auth, async (req, res) => {
  try {
    const role = req.user.role;

    if (role === 'hr') {
      const totalInterns = await User.countDocuments({ role: 'intern', status: 'active' });
      const pendingReviews = await User.countDocuments({ role: 'intern', status: 'pending', emailVerified: true });
      const internsWithBatch = await User.countDocuments({ role: 'intern', status: 'active', batch: { $ne: '' } });
      const onboardingPercent = totalInterns > 0
        ? Math.round((internsWithBatch / totalInterns) * 100) : 0;

      return res.json({
        count1: totalInterns,
        count2: pendingReviews,
        count3: onboardingPercent,
        milestones: [],
      });
    }

    if (role === 'admin') {
      const totalUsers = await User.countDocuments({ role: { $in: ['intern', 'hr'] } });
      const activeInterns = await User.countDocuments({ role: 'intern', status: 'active' });
      const systemAlerts = await Notification.countDocuments({ type: 'system', read: false });

      const serverHealth = [
        { metric: 'Active Interns', value: activeInterns, status: 'Good' },
        { metric: 'Pending Approvals', value: await User.countDocuments({ role: 'intern', status: 'hr_reviewed' }), status: 'Warning' },
        { metric: 'Unread Alerts', value: systemAlerts, status: systemAlerts > 0 ? 'Warning' : 'Good' },
        { metric: 'DB Status', value: 'Connected', status: 'Good' },
      ];

      return res.json({
        count1: totalUsers,
        count2: activeInterns,
        count3: systemAlerts,
        serverHealth,
      });
    }

    return res.json({ count1: 0, count2: 0, count3: 0 });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    let userId = null, userRole = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
        userRole = decoded.role;
      } catch {}
    }

    const query = userId
      ? { $or: [{ userId }, { role: userRole }, { role: 'all' }] }
      : { role: 'all' };

    const notifs = await Notification.find(query).sort({ createdAt: -1 }).limit(30);
    res.json(notifs.map(n => ({
      id: n._id,
      role: n.role,
      type: n.type,
      text: n.text,
      read: n.read,
      time: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update read status' });
  }
});

app.post('/api/announcements', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const { text, role } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ error: 'Announcement text is required.' });

    const validRoles = ['all', 'intern', 'hr', 'admin'];
    const notif = await Notification.create({
      role: validRoles.includes(role) ? role : 'all',
      type: 'announcement',
      text: text.trim(),
    });
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Intern Portal API running'));

app.listen(5000, () => console.log('Server running on port 5000'));