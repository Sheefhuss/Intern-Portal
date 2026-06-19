const express = require('express');
const router  = express.Router();
const Task    = require('../models/Task');
const Notification = require('../models/Notification');
const User    = require('../models/User');
const auth    = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'intern'
      ? { 
          $or: [
            { assignedTo: req.user.id }, 
            { assignedBatch: req.user.batch, assignedDomain: req.user.domain }
          ] 
        }
      : {};
    const tasks = await Task.find(query).sort({ deadline: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (!['admin','hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const taskData = { ...req.body, createdBy: req.user.id };
    
    if (taskData.assignmentType === 'batch') {
      taskData.assignedTo = null;
    } else {
      taskData.assignedBatch = '';
    }

    const task = await Task.create(taskData);
    const text = `New task assigned: "${task.title}" — due ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'TBD'}`;

    if (task.assignedTo) {
      await Notification.create({
        userId: task.assignedTo,
        role: 'intern',
        type: 'task',
        text,
      });
    } else if (task.assignedBatch && task.assignedDomain) {
      const usersInBatch = await User.find({ role: 'intern', domain: task.assignedDomain, batch: task.assignedBatch });
      
      if (usersInBatch.length > 0) {
        const notifs = usersInBatch.map(u => ({
          userId: u._id,
          role: 'intern',
          type: 'task',
          text,
        }));
        await Notification.insertMany(notifs);
      }
    }
    
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/submit', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: 'submitted' },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/review', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });
    const task = await Task.findByIdAndUpdate(req.params.id, { status: 'reviewed' }, { new: true });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;