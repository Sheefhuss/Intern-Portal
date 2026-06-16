const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db');
const User = require('./models/User');
const Application = require('./models/Application'); 
const Notification = require('./models/Notification');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/internships', require('./routes/internships'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/tasks', require('./routes/tasks'));

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalInterns = await User.countDocuments({ 
      role: { $in: ["intern", "member"] } 
    });

    const pendingReviews = await Application.countDocuments({ 
      status: "pending" 
    });

    const completedProfiles = await User.countDocuments({ 
      role: { $in: ["intern", "member"] },
      isProfileComplete: true 
    });
    
    const onboardingPercent = totalInterns > 0 
      ? Math.round((completedProfiles / totalInterns) * 100) 
      : 0;

    res.json({
      count1: totalInterns,
      count2: pendingReviews, 
      count3: onboardingPercent 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    // auth check
    const authHeader = req.headers.authorization;
    let userId = null, userRole = null;
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
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
      id: n._id, role: n.role, type: n.type,
      text: n.text, read: n.read,
      time: new Date(n.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch any notifications' });
  }
});

// single notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update read status" });
  }
});

// notifications as read
app.put('/api/notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});
app.post('/api/announcements', async (req, res) => {
  try {
    const { text, role } = req.body; 
    const notif = await Notification.create({
      role: role || 'all',
      type: 'announcement',
      text,
    });
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Intern Portal API running');
});

app.listen(5000, () => console.log('Server running on port 5000'));