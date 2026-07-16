const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const { decorate, batchInterns } = require('../utils/taskUtils');
const { maybeIssueCertificate } = require('../utils/certificateUtils');

router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'intern') {
      query = {
        $or: [
          { assignedTo: req.user.id },
          {
            assignedTo: { $in: [null, undefined] },
            assignedDomain: req.user.domain,
            assignedBatch: req.user.batch,
          },
        ],
      };
    }
    const sortOrder = req.user.role === 'intern' ? { deadline: 1 } : { createdAt: -1 };
    const tasks = await Task.find(query).sort(sortOrder);
    const decorated = await decorate(tasks);

    if (req.user.role === 'intern') {
      const subs = await Submission.find({
        task: { $in: tasks.map(t => t._id) },
        intern: req.user.id,
      });
      const subMap = {};
      subs.forEach(s => { subMap[s.task.toString()] = s; });

      const withStatus = decorated.map(t => {
        const sub = subMap[t._id.toString()];
        return {
          ...t,
          status: sub ? sub.status : 'pending',
          submissionUrl: sub ? sub.submissionUrl : '',
          submittedAt: sub ? sub.submittedAt : null,
        };
      });
      return res.json(withStatus);
    }

    const allSubs = await Submission.find({ task: { $in: tasks.map(t => t._id) } });
    const progressMap = {};
    allSubs.forEach(s => {
      const key = s.task.toString();
      if (!progressMap[key]) progressMap[key] = { submitted: 0, hr_reviewed: 0, reviewed: 0, total: 0 };
      progressMap[key].total++;
      if (s.status !== 'pending') progressMap[key][s.status] = (progressMap[key][s.status] || 0) + 1;
    });

    const withProgress = await Promise.all(decorated.map(async (t) => {
      const interns = await batchInterns(t);
      const p = progressMap[t._id.toString()] || { submitted: 0, hr_reviewed: 0, reviewed: 0, total: 0 };
      const assigneeCount = interns.length;
      const submittedCount = p.submitted || 0;
      const hrReviewedCount = p.hr_reviewed || 0;
      const reviewedCount = p.reviewed || 0;

      let derivedStatus = 'pending';
      if (assigneeCount > 0 && reviewedCount === assigneeCount) derivedStatus = 'reviewed';
      else if (hrReviewedCount > 0) derivedStatus = 'hr_reviewed';
      else if (submittedCount > 0) derivedStatus = 'submitted';

      return {
        ...t,
        status: derivedStatus,
        assigneeCount,
        submittedCount,
        hrReviewedCount,
        reviewedCount,
      };
    }));

    res.json(withProgress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/submissions', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const internIds = await batchInterns(task);
    const interns = await User.find({ _id: { $in: internIds } }).select('name email');
    const subs = await Submission.find({ task: task._id });

    const subMap = {};
    subs.forEach(s => { subMap[s.intern.toString()] = s; });

    const rows = interns.map(i => {
      const s = subMap[i._id.toString()];
      return {
        internId: i._id,
        internName: i.name,
        internEmail: i.email,
        submissionId: s?._id || null,
        status: s?.status || 'pending',
        submissionUrl: s?.submissionUrl || '',
        submittedAt: s?.submittedAt || null,
        source: s?.source || 'intern',
      };
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const { title, description, deadline, submissionLink, formLink,
            assignedDomain, assignedBatch, assignedTo, assignmentType } = req.body;

    const payload = {
      title, description, deadline, submissionLink, formLink,
      assignedDomain, assignedBatch,
      createdBy: req.user.id,
    };
    if (assignmentType === 'intern' && assignedTo) {
      payload.assignedTo = assignedTo;
    } else {
      delete payload.assignedTo;
    }

    const task = await Task.create(payload);

    const internIds = await batchInterns(task);
    if (internIds.length) {
      await Submission.insertMany(
        internIds.map(internId => ({ task: task._id, intern: internId, status: 'pending' })),
        { ordered: false }
      ).catch(err => {
        const realErrors = (err.writeErrors || []).filter(e => e.code !== 11000);
        if (realErrors.length) {
          console.error(
            `Submission insertMany: ${realErrors.length} real failure(s) for task ${task._id}:`,
            realErrors.map(e => e.errmsg || e.err?.errmsg).join('; ')
          );
        } else if (err.code !== 11000) {
          console.error(`Submission insertMany failed for task ${task._id}:`, err.message);
        }
      });

      await Notification.insertMany(internIds.map(internId => ({
        userId: internId,
        role: 'intern',
        type: 'task',
        text: `New task assigned: "${task.title}" — due ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'TBD'}`,
      })));
    }

    const [decorated] = await decorate([task]);
    res.status(201).json({ ...decorated, status: 'pending', assigneeCount: internIds.length, submittedCount: 0, hrReviewedCount: 0, reviewedCount: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/certificates/:internId/resend', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const certificate = await maybeIssueCertificate(req.params.internId);
    if (!certificate) return res.status(400).json({ error: 'Certificate not eligible or not found.' });

    res.json({ success: true, certificate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const { title, description, deadline, submissionLink, formLink } = req.body;
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'Title cannot be empty.' });
      task.title = title.trim();
    }
    if (description !== undefined) task.description = description;
    if (deadline !== undefined) task.deadline = deadline;
    if (submissionLink !== undefined) task.submissionLink = submissionLink;
    if (formLink !== undefined) task.formLink = formLink;

    await task.save();
    const [decorated] = await decorate([task]);
    res.json(decorated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    await Submission.deleteMany({ task: task._id });
    await Task.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;