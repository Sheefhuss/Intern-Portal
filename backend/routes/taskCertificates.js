const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const TaskCertificate = require('../models/TaskCertificate');
const auth = require('../middleware/authMiddleware');
const { renderTaskCertificateHtml, renderTaskCertificatePdf, resendTaskCertificate } = require('../utils/taskCertificateUtils');

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

router.get('/:certificateId/download', async (req, res) => {
  try {
    const certificate = await TaskCertificate
      .findOne({ certificateId: req.params.certificateId })
      .populate('student', 'name');

    if (!certificate) return res.status(404).send('Certificate not found.');

    const pdfBuffer = await renderTaskCertificatePdf(certificate);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="task-certificate-${certificate.certificateId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Task certificate PDF generation failed:', err);
    res.status(500).send('Error generating certificate PDF.');
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

router.post('/:certificateId/resend-self', auth, async (req, res) => {
  try {
    if (req.user.role !== 'intern')
      return res.status(403).json({ error: 'Access denied.' });

    const owned = await TaskCertificate.findOne({
      certificateId: req.params.certificateId,
      student: req.user.id,
    });
    if (!owned) return res.status(404).json({ error: 'Certificate not found.' });

    const certificate = await resendTaskCertificate(req.params.certificateId);
    res.json({ success: true, certificate });
  } catch (err) {
    console.error('Task certificate self-resend failed:', err);
    res.status(500).json({ error: 'Failed to resend certificate email.' });
  }
});

module.exports = router;