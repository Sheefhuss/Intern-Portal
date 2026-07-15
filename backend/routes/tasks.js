const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const { decorate, batchInterns, isIndividual } = require('../utils/taskUtils');
const { maybeIssueCertificate } = require('../utils/certificateUtils');
const { sendTaskEmail } = require('../utils/sendEmail');

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


router.get('/progress/interns', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const subs = await Submission.find({}).populate('task', 'title status assignedTo assignedDomain assignedBatch deadline createdBy');

    const byIntern = {};
    subs.forEach(s => {
      const key = s.intern.toString();
      if (!byIntern[key]) byIntern[key] = [];
      byIntern[key].push({
        taskId: s.task?._id,
        title: s.task?.title,
        deadline: s.task?.deadline,
        status: s.status,
        submissionUrl: s.submissionUrl,
        source: s.source,
      });
    });

    res.json(byIntern);
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

router.patch('/:id/submit', auth, async (req, res) => {
  try {
    if (req.user.role !== 'intern')
      return res.status(403).json({ error: 'Only interns can submit.' });

    const { submissionUrl } = req.body;
    if (!submissionUrl || !submissionUrl.trim())
      return res.status(400).json({ error: 'Submission link is required.' });

    const trimmedUrl = submissionUrl.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://'))
      return res.status(400).json({ error: 'Submission link must start with http:// or https://' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const eligible = isIndividual(task)
      ? task.assignedTo?.toString() === req.user.id
      : task.assignedDomain === req.user.domain && task.assignedBatch === req.user.batch;
    if (!eligible) return res.status(403).json({ error: 'This task is not assigned to you.' });

    const existing = await Submission.findOne({ task: task._id, intern: req.user.id });
    if (existing && existing.status !== 'pending')
      return res.status(400).json({ error: 'You cannot resubmit a task that is already under review.' });

    const submission = await Submission.findOneAndUpdate(
      { task: task._id, intern: req.user.id },
      { status: 'submitted', submissionUrl: trimmedUrl, submittedAt: new Date(), source: 'intern' },
      { new: true, upsert: true }
    );

    try {
      const intern = await User.findById(req.user.id).select('name');
      await Notification.create({
        role: 'hr',
        type: 'task',
        text: `${intern?.name || 'An intern'} submitted "${task.title}" for review.`,
      });
    } catch (notifyErr) {
      console.error('Submission notification failed:', notifyErr.message);
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/withdraw', auth, async (req, res) => {
  try {
    if (req.user.role !== 'intern')
      return res.status(403).json({ error: 'Only interns can withdraw submissions.' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const submission = await Submission.findOne({ task: task._id, intern: req.user.id });
    if (!submission) return res.status(404).json({ error: 'No submission found.' });

    if (submission.status !== 'submitted')
      return res.status(400).json({ error: 'You can only withdraw a submission that has not been reviewed yet.' });

    submission.status = 'pending';
    submission.submissionUrl = '';
    submission.submittedAt = null;
    submission.source = 'intern';
    await submission.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:submissionId/forward', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr')
      return res.status(403).json({ error: 'Access denied.' });

    const submission = await Submission.findByIdAndUpdate(
      req.params.submissionId,
      { status: 'hr_reviewed' },
      { new: true }
    );
    if (!submission) return res.status(404).json({ error: 'Submission not found.' });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:submissionId/review', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied.' });

    const submission = await Submission.findByIdAndUpdate(
      req.params.submissionId,
      { status: 'reviewed', reviewedAt: new Date(), reviewedBy: req.user.id },
      { new: true }
    );
    if (!submission) return res.status(404).json({ error: 'Submission not found.' });
    await maybeIssueCertificate(submission.intern);
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:submissionId/reset', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const submission = await Submission.findByIdAndUpdate(
      req.params.submissionId,
      {
        status: 'pending',
        submissionUrl: '',
        submittedAt: null,
        reviewedAt: null,
        reviewedBy: null,
        source: 'intern',
      },
      { new: true }
    );
    if (!submission) return res.status(404).json({ error: 'Submission not found.' });

    await Certificate.deleteOne({ student: submission.intern });

    const task = await Task.findById(submission.task).select('title');
    const intern = await User.findById(submission.intern).select('name email');

    if (intern) {
      await Notification.create({
        userId: intern._id,
        role: 'intern',
        type: 'task',
        text: `Your submission for "${task?.title || 'a task'}" has been reset to Pending. Please resubmit.`,
      });
      try {
        await sendTaskEmail({
          to: intern.email,
          internName: intern.name,
          taskTitle: task?.title || 'a task',
          type: 'reset',
        });
      } catch (emailErr) {
        console.error('Reset email failed:', emailErr.message);
      }
    }

    res.json(submission);
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