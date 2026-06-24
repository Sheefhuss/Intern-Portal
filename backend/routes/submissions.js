const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const { isIndividual } = require('../utils/taskUtils');
const { maybeIssueCertificate } = require('../utils/certificateUtils');
const { sendTaskEmail } = require('../utils/sendEmail');

router.patch('/:id/submit', auth, async (req, res) => {
  try {
    if (req.user.role !== 'intern')
      return res.status(403).json({ error: 'Only interns can submit.' });

    const { submissionUrl } = req.body;
    if (!submissionUrl || !submissionUrl.trim())
      return res.status(400).json({ error: 'Submission link is required.' });

    const trimmedUrl = submissionUrl.trim();
    const hasProtocol = trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
    if (!hasProtocol)
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
      {
        status: 'submitted',
        submissionUrl: trimmedUrl,
        submittedAt: new Date(),
        source: 'intern',
      },
      { new: true, upsert: true }
    );

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

module.exports = router;