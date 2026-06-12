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
    const notifs = await Notification.find().sort({ createdAt: -1 }).limit(20);
    const formattedNotifs = notifs.map(n => ({
      id: n._id,
      role: n.role,
      text: n.text,
      read: n.read,
      time: "Recent"
    }));
    
    res.json(formattedNotifs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
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

app.get('/', (req, res) => {
  res.send('Intern Portal API running');
});

app.listen(5000, () => console.log('Server running on port 5000'));