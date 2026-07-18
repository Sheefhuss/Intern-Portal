const express  = require('express');
const router   = express.Router();
const Meeting  = require('../models/Meeting');
const Notification = require('../models/Notification');
const User     = require('../models/User');
const auth     = require('../middleware/authMiddleware');
const { sendMeetingEmail } = require('../utils/sendEmail');
const socketManager = require('../utils/socketManager');

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
};

const notifyStaff = async (text) => {
  const docs = await Notification.insertMany([
    { role: 'admin', type: 'system', text },
    { role: 'hr',    type: 'system', text },
  ]);
  docs.forEach(n => socketManager.emitToAll('notification:new', {
    id: n._id, role: n.role, type: n.type, text: n.text, read: false,
    time: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));
};
router.get('/options', auth, async (req, res) => {
  try {
    const domains = await User.distinct('domain', { domain: { $exists: true, $ne: '' } });
    const batches = await User.distinct('batch', { batch: { $exists: true, $ne: '' } });
    
    res.json({
      domains: domains.sort(),
      batches: batches.sort()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const { role, id } = req.user;
    
    if (['admin', 'hr'].includes(role)) {
      const history = await Meeting.find({ isDeleted: true })
        .populate('bookedBy', 'name email')
        .populate('createdBy', 'name')
        .sort({ updatedAt: -1 });
      return res.json(history);
    }

    const history = await Meeting.find({ createdBy: id, isDeleted: true }).sort({ updatedAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/slots', auth, requireAdmin, async (req, res) => {
  try {
    const { title, meetLink, scheduledAt, duration, scope, domain, batch, assignedTo } = req.body;
    if (!title?.trim())   return res.status(400).json({ error: 'Title is required.' });
    if (!meetLink?.trim()) return res.status(400).json({ error: 'Meeting link is required.' });
    if (!scheduledAt)     return res.status(400).json({ error: 'Scheduled time is required.' });

    const meeting = await Meeting.create({
      title: title.trim(),
      type: 'slot',
      meetLink: meetLink.trim(),
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      scope: scope || 'global',
      domain: domain || '',
      batch:  batch  || '',
      assignedTo: assignedTo || null,
      createdBy: req.user.id,
      status: 'open',
    });
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { role, id, domain, batch } = req.user;

    if (role === 'admin') {
      const meetings = await Meeting.find({ isDeleted: false })
        .populate('bookedBy', 'name email domain batch')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });
      return res.json(meetings);
    }

    if (role === 'hr') {
      const meetings = await Meeting.find({
        isDeleted: false,
        $or: [
          { type: 'slot' },
          { type: 'request' },
        ],
      })
        .populate('bookedBy', 'name email domain batch')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });
      return res.json(meetings);
    }

    const slotQuery = {
      type: 'slot',
      status: { $in: ['open', 'booked'] },
      isDeleted: false,
      $or: [
        { scope: 'global' },
        { scope: 'batch',  domain, batch },
        { scope: 'intern', assignedTo: id },
      ],
    };
    const slots    = await Meeting.find(slotQuery).populate('createdBy', 'name').sort({ scheduledAt: 1 });
    const requests = await Meeting.find({ type: 'request', createdBy: id, isDeleted: false }).sort({ createdAt: -1 });

    return res.json([...slots, ...requests]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/book', auth, async (req, res) => {
  try {
    if (req.user.role !== 'intern') return res.status(403).json({ error: 'Only interns can book slots.' });

    const meeting = await Meeting.findOne({ _id: req.params.id, isDeleted: false });
    if (!meeting)                 return res.status(404).json({ error: 'Slot not found.' });
    if (meeting.type !== 'slot') return res.status(400).json({ error: 'This is not a bookable slot.' });
    if (meeting.status !== 'open') return res.status(409).json({ error: 'Slot is no longer available.' });

    meeting.status   = 'booked';
    meeting.bookedBy = req.user.id;
    await meeting.save();

    const intern = await User.findById(req.user.id).select('name');
    await notifyStaff(`📅 ${intern.name} booked a meeting slot: "${meeting.title}" on ${new Date(meeting.scheduledAt).toLocaleString('en-IN')}`);

    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, isDeleted: false });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    if (meeting.bookedBy?.toString() !== req.user.id)
      return res.status(403).json({ error: 'You did not book this slot.' });

    meeting.status   = 'open';
    meeting.bookedBy = null;
    await meeting.save();
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'intern') return res.status(403).json({ error: 'Only interns can send requests.' });

    const { title, requestNote, preferredAt } = req.body;
    if (!title?.trim())       return res.status(400).json({ error: 'Title is required.' });
    if (!requestNote?.trim()) return res.status(400).json({ error: 'Please describe your meeting purpose.' });

    const meeting = await Meeting.create({
      title: title.trim(),
      type: 'request',
      requestNote: requestNote.trim(),
      scheduledAt: preferredAt ? new Date(preferredAt) : null,
      createdBy: req.user.id,
      status: 'pending',
    });

    const intern = await User.findById(req.user.id).select('name');
    await notifyStaff(`📨 ${intern.name} sent a meeting request: "${meeting.title}"`);

    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/approve', auth, requireAdmin, async (req, res) => {
  try {
    const { approvalLink, scheduledAt } = req.body;
    const meeting = await Meeting.findOne({ _id: req.params.id, isDeleted: false }).populate('createdBy');
    if (!meeting) return res.status(404).json({ error: 'Request not found.' });
    if (meeting.type !== 'request') return res.status(400).json({ error: 'Only requests can be approved.' });

    meeting.status       = 'approved';
    meeting.approvalLink = approvalLink?.trim() || '';
    if (scheduledAt) meeting.scheduledAt = new Date(scheduledAt);
    await meeting.save();

    await Notification.create({
      userId: meeting.createdBy._id,
      type: 'system',
      text: `✅ Your meeting request "${meeting.title}" was approved!${approvalLink ? ' Check the Meetings page for your link.' : ''}`,
    }).then(n => socketManager.emitToUser(meeting.createdBy._id, 'notification:new', {
      id: n._id, role: n.role, type: n.type, text: n.text, read: false,
      time: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }));

    if (meeting.createdBy?.email) {
      sendMeetingEmail({
        to: meeting.createdBy.email,
        subject: `Approved: ${meeting.title}`,
        title: meeting.title,
        time: meeting.scheduledAt,
        link: meeting.approvalLink
      }).catch(() => {});
    }

    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/reject', auth, requireAdmin, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, isDeleted: false });
    if (!meeting) return res.status(404).json({ error: 'Request not found.' });

    meeting.status = 'rejected';
    await meeting.save();

    await Notification.create({
      userId: meeting.createdBy,
      type: 'system',
      text: `❌ Your meeting request "${meeting.title}" was not approved. Contact HR for details.`,
    }).then(n => socketManager.emitToUser(meeting.createdBy, 'notification:new', {
      id: n._id, role: n.role, type: n.type, text: n.text, read: false,
      time: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }));

    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/reschedule', auth, requireAdmin, async (req, res) => {
  try {
    const { scheduledAt, meetLink } = req.body;
    if (!scheduledAt) return res.status(400).json({ error: 'New date and time are required.' });

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting record not found.' });

    meeting.scheduledAt = new Date(scheduledAt);
    if (meetLink) meeting.meetLink = meetLink.trim();
    
    meeting.status = meeting.type === 'request' ? 'pending' : 'open';
    meeting.isDeleted = false;
    meeting.reminderSent = false;
    
    await meeting.save();
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    res.json({ success: true, message: 'Moved to history log' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/permanent', auth, requireAdmin, async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    res.json({ success: true, message: 'Permanently deleted from system storage' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;