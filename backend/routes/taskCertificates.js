const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const TaskCertificate = require('../models/TaskCertificate');
const Notification = require('../models/Notification');
const socketManager = require('../utils/socketManager');
const auth = require('../middleware/authMiddleware');
const { renderTaskCertificateHtml, resendTaskCertificate } = require('../utils/taskCertificateUtils');

router.get('/:certificateId/qr.png', async (req, res) => {
  try {
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    const verifyUrl = `${BASE_URL}/api/task-certificates/${req.params.certificateId}/view`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      width: 140, margin: 1, color: { dark: '#7C3AED', light: '#ffffff' },
    });
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(qrBuffer);
  } catch (err) {
    res.status(500).end();
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    if (req.user.role !== 'intern')
      return res.status(403).json({ error: 'Access denied.' });

    const certificates = await TaskCertificate
      .find({ student: req.user.id })
      .populate('task', 'title')
      .sort({ issuedAt: -1 });

    res.json(certificates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const certificates = await TaskCertificate
      .find({})
      .populate('student', 'name email domain batch')
      .populate('task', 'title')
      .sort({ issuedAt: -1 });

    res.json(certificates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:certificateId/view', async (req, res) => {
  try {
    const certificate = await TaskCertificate
      .findOne({ certificateId: req.params.certificateId })
      .populate('student', 'name');

    if (!certificate) return res.status(404).send('Certificate not found.');

    const html = await renderTaskCertificateHtml(certificate);
    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading certificate.');
  }
});

router.post('/:certificateId/resend', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const certificate = await resendTaskCertificate(req.params.certificateId);
    if (!certificate) return res.status(404).json({ error: 'Certificate not found.' });

    res.json({ success: true, certificate });
  } catch (err) {
    console.error('Task certificate resend failed:', err);
    res.status(500).json({ error: 'Failed to resend certificate email.' });
  }
});
router.post('/:certificateId/request-resend', auth, async (req, res) => {
  try {
    if (req.user.role !== 'intern')
      return res.status(403).json({ error: 'Access denied.' });

    const certificate = await TaskCertificate.findOne({
      certificateId: req.params.certificateId,
      student: req.user.id,
    }).populate('student', 'name');
    if (!certificate) return res.status(404).json({ error: 'Certificate not found.' });

    const notif = await Notification.create({
      role: 'hr',
      type: 'certificate',
      text: `${certificate.student?.name || 'An intern'} says they didn't receive the certificate for "${certificate.taskTitle}" — please resend it from Task Certificates.`,
      meta: { certificateId: certificate.certificateId },
      task: certificate.task,
      relatedUser: certificate.student?._id || req.user.id,
    });
    socketManager.emitToAll('notification:new', {
      id: notif._id, role: notif.role, type: notif.type, text: notif.text, read: false,
      time: new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Task certificate resend request failed:', err);
    res.status(500).json({ error: 'Failed to send request.' });
  }
});

module.exports = router;