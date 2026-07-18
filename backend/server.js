const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
require('./db');
require('./utils/reminderCron');
const User = require('./models/User');
const Task = require('./models/Task');
const Submission = require('./models/Submission');
const Notification = require('./models/Notification');
const auth = require('./middleware/authMiddleware');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const productionOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
const vercelProjectSlug = process.env.VERCEL_PROJECT_NAME
  || productionOrigin.match(/^https:\/\/([\w-]+)\.vercel\.app$/)?.[1];
const previewOriginPattern = vercelProjectSlug
  ? new RegExp(`^https:\\/\\/${vercelProjectSlug}-[\\w-]+\\.vercel\\.app$`)
  : null;

const allowedSocketOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (origin === productionOrigin || origin === 'http://localhost:5173') return callback(null, true);
  if (previewOriginPattern && previewOriginPattern.test(origin)) return callback(null, true);
  callback(new Error(`Origin ${origin} not allowed by Socket.IO CORS`));
};

const io = new Server(server, {
  cors: {
    origin: allowedSocketOrigin,
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/applications')); // active-intern roster routes
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/tasks', require('./routes/submissions')); // task submission lifecycle routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/profile', require('./routes/profile'));

app.get('/api/dashboard/stats', auth, async (req, res) => {
  try {
    const role = req.user.role;

    if (role === 'hr') {
      const totalInterns = await User.countDocuments({ role: 'intern', status: 'active' });
      const awaitingActivation = await User.countDocuments({ role: 'intern', status: 'invited' });
      const internsWithBatch = await User.countDocuments({ role: 'intern', status: 'active', batch: { $ne: '' } });
      const onboardingPercent = totalInterns > 0
        ? Math.round((internsWithBatch / totalInterns) * 100) : 0;

      return res.json({
        count1: totalInterns,
        count2: awaitingActivation,
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
        { metric: 'Awaiting Activation', value: await User.countDocuments({ role: 'intern', status: 'invited' }), status: 'Warning' },
        { metric: 'Unread Alerts', value: systemAlerts, status: systemAlerts > 0 ? 'Warning' : 'Good' },
        { metric: 'DB Status', value: 'Connected', status: 'Good' },
      ];

      return res.json({ count1: totalUsers, count2: activeInterns, count3: systemAlerts, serverHealth });
    }

    if (role === 'intern') {
      const myTasks = await Task.find({
        $or: [
          { assignedTo: req.user.id },
          { assignedTo: { $in: [null, undefined] }, assignedDomain: req.user.domain, assignedBatch: req.user.batch },
        ],
      }).sort({ deadline: 1 });

      const mySubs = await Submission.find({
        task: { $in: myTasks.map(t => t._id) },
        intern: req.user.id,
      });
      const subByTask = {};
      mySubs.forEach(s => { subByTask[s.task.toString()] = s; });

      const withStatus = myTasks.map(t => ({
        task: t,
        status: subByTask[t._id.toString()]?.status || 'pending',
      }));

      const pendingCount = withStatus.filter(x => x.status === 'pending').length;
      const submittedCount = withStatus.filter(x => ['submitted', 'hr_reviewed'].includes(x.status)).length;
      const completedCount = withStatus.filter(x => x.status === 'reviewed').length;
      const nextDeadlineEntry = withStatus.find(x => x.status === 'pending' && x.task.deadline);

      return res.json({
        count1: myTasks.length,
        count2: pendingCount,
        count3: completedCount,
        count4: submittedCount,
        batch: req.user.batch || 'Unassigned',
        domain: req.user.domain || 'Unassigned',
        nextDeadline: nextDeadlineEntry ? {
          title: nextDeadlineEntry.task.title,
          date: new Date(nextDeadlineEntry.task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        } : null,
      });
    }

    return res.json({ count1: 0, count2: 0, count3: 0 });

  } catch (error) {
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
      ? {
          $or: [
            { userId },
            { role: 'all' },
            { role: userRole, userId: { $exists: false } },
          ],
        }
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

require('./utils/socketManager')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));