const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const User    = require('../models/User');
const Batch   = require('../models/Batch');
const Task    = require('../models/Task');
const Submission = require('../models/Submission');
const TaskCertificate = require('../models/TaskCertificate');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const Meeting = require('../models/Meeting');
const auth    = require('../middleware/authMiddleware');
const mailer  = require('../utils/mailer');
const { maybeIssueCertificate } = require('../utils/certificateUtils');

const generatePasscode = () => crypto.randomInt(100000, 1000000).toString(); 

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
};

const requireManager = (req, res, next) => {
  if (!['admin', 'hr'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied.' });
  next();
};

const safeFields = '-password -resetPasswordToken -resetPasswordExpires -otp -otpExpires';
router.get('/users', auth, requireManager, async (req, res) => {
  try {
    const { status, role } = req.query;
    const query = {};
    if (status) query.status = status;
    if (role)   query.role   = role;
    const users = await User.find(query).select(safeFields).sort({ appliedAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/registry', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select(safeFields).sort({ appliedAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.patch('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { batch, status, role } = req.body;
    const update = {};
    if (batch !== undefined) update.batch = batch;
    if (role  !== undefined) update.role  = role;

    if (status !== undefined) {
      if (status === 'revoked') return res.status(400).json({ error: 'Use /users/:id/revoke instead.' });
      if (status === 'completed') return res.status(400).json({ error: 'Use /users/:id/complete instead.' });
      update.status = status;
      if (status === 'active') { update.revokedAt = null; update.revokedBy = null; update.completedAt = null; update.completedBy = null; }
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select(safeFields);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/revoke', auth, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'You cannot revoke your own access.' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'revoked', revokedAt: new Date(), revokedBy: req.user.id, completedAt: null, completedBy: null },
      { new: true }
    ).select(safeFields);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/complete', auth, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'You cannot mark your own account as completed.' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role !== 'intern')
      return res.status(400).json({ error: 'Only interns can be marked as completed.' });

    user.status      = 'completed';
    user.completedAt = new Date();
    user.completedBy = req.user.id;
    user.revokedAt    = null;
    user.revokedBy    = null;
    await user.save();

    try {
      await maybeIssueCertificate(user._id);
    } catch (certErr) {
      console.error(`Certificate check failed after marking ${user._id} completed:`, certErr);
    }

    const safeUser = await User.findById(user._id).select(safeFields);
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/reactivate', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active', revokedAt: null, revokedBy: null, completedAt: null, completedBy: null },
      { new: true }
    ).select(safeFields);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/interns/invite', auth, requireAdmin, async (req, res) => {
  try {
    const { name, email, domain, batch, deliveryMethod } = req.body;
    if (!name?.trim() || !email?.trim() || !domain?.trim())
      return res.status(400).json({ error: 'Name, email, and domain are required.' });

    const validMethods = ['passcode_email', 'manual'];
    const method = validMethods.includes(deliveryMethod) ? deliveryMethod : 'passcode_email';

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ error: 'An account with this email already exists.' });

    const passcode = generatePasscode();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      role: 'intern',
      status: 'invited',
      domain: domain.trim(),
      batch: batch?.trim() || '',
      invitedBy: req.user.id,
      inviteDeliveryMethod: method,
      otp: passcode,
      otpExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    let emailSent = false;
    if (method !== 'manual') {
      try {
        await mailer.sendInviteEmail({ to: user.email, name: user.name, passcode });
        emailSent = true;
      } catch (mailErr) {
        console.error('Mail error:', mailErr.message);
      }
    }

    const safeUser = await User.findById(user._id).select(safeFields);
    res.status(201).json({
      message: method === 'manual' ? 'Invitation created. No email was sent — share the passcode yourself.' : 'Invitation sent.',
      user: safeUser,
      passcode,
      emailSent,
      deliveryMethod: method,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/interns/:id/resend-passcode', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.status !== 'invited')
      return res.status(400).json({ error: 'This account is not awaiting activation.' });

    const validMethods = ['passcode_email', 'manual'];
    const { deliveryMethod } = req.body;
    const method = validMethods.includes(deliveryMethod) ? deliveryMethod : (user.inviteDeliveryMethod || 'passcode_email');

    const passcode = generatePasscode();
    user.otp        = passcode;
    user.otpExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.inviteDeliveryMethod = method;
    await user.save();

    let emailSent = false;
    if (method !== 'manual') {
      try {
        await mailer.sendInviteEmail({ to: user.email, name: user.name, passcode });
        emailSent = true;
      } catch (mailErr) {
        console.error('Mail error:', mailErr.message);
      }
    }

    res.json({
      message: method === 'manual' ? 'Passcode regenerated. No email was sent — share it yourself.' : 'Passcode resent.',
      passcode,
      emailSent,
      deliveryMethod: method,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/interns/:id/offer-letter', auth, requireManager, async (req, res) => {
  try {
    const { pdfBase64, filename } = req.body;
    if (!pdfBase64 || !pdfBase64.trim())
      return res.status(400).json({ error: 'An offer letter PDF (base64) is required.' });

    const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',').pop() : pdfBase64;

    const intern = await User.findById(req.params.id);
    if (!intern) return res.status(404).json({ error: 'Intern not found.' });

    try {
      await mailer.sendOfferLetterPdfEmail({
        to: intern.email,
        name: intern.name,
        domain: intern.domain,
        batch: intern.batch,
        pdfBase64: cleanBase64,
        pdfFilename: filename || `offer-letter-${intern.name.replace(/\s+/g, '-')}.pdf`,
      });
    } catch (emailErr) {
      console.error('Offer letter email failed for', intern.email, ':', emailErr.message);
      return res.status(502).json({ error: `Offer letter email failed: ${emailErr.message}` });
    }

    intern.offerLetterSentAt = new Date();
    await intern.save();

    res.json({ success: true, offerLetterSentAt: intern.offerLetterSentAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/interns/:id/offer-letter/mark-sent', auth, requireManager, async (req, res) => {
  try {
    const intern = await User.findById(req.params.id);
    if (!intern) return res.status(404).json({ error: 'Intern not found.' });
    if (intern.role !== 'intern')
      return res.status(400).json({ error: 'Only interns have an offer letter status.' });

    intern.offerLetterSentAt = new Date();
    await intern.save();

    res.json({ success: true, offerLetterSentAt: intern.offerLetterSentAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'You cannot delete your own account.' });

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    
    await Submission.deleteMany({ intern: user._id });
    await TaskCertificate.deleteMany({ student: user._id });
    await Certificate.deleteMany({ student: user._id });
    await Notification.deleteMany({
      $or: [{ userId: user._id }, { relatedUser: user._id }],
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/maintenance/notifications', auth, requireAdmin, async (req, res) => {
  try {
    const result = await Notification.deleteMany({});
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/maintenance/cleanup-orphaned-data', auth, requireAdmin, async (req, res) => {
  try {
    const [allUserIds, allTaskIds] = await Promise.all([
      User.find({}).distinct('_id'),
      Task.find({}).distinct('_id'),
    ]);
    const allMeetingIds = await Meeting.find({ isDeleted: { $ne: true } }).distinct('_id');

    const orphanedSubmissions = await Submission.deleteMany({
      $or: [{ intern: { $nin: allUserIds } }, { task: { $nin: allTaskIds } }],
    });
    const orphanedTaskCerts = await TaskCertificate.deleteMany({
      $or: [{ student: { $nin: allUserIds } }, { task: { $nin: allTaskIds } }],
    });
    const orphanedCerts = await Certificate.deleteMany({ student: { $nin: allUserIds } });

    const remainingTaskCertIds = await TaskCertificate.find({}).distinct('certificateId');
    const remainingCertIds = await Certificate.find({}).distinct('certificateId');
    const remainingValidCertIds = [...remainingTaskCertIds, ...remainingCertIds];

    const orphanedNotifications = await Notification.deleteMany({
      $or: [
        { userId: { $exists: true, $ne: null, $nin: allUserIds } },
        { relatedUser: { $exists: true, $ne: null, $nin: allUserIds } },
        { task: { $exists: true, $ne: null, $nin: allTaskIds } },
        { meeting: { $exists: true, $ne: null, $nin: allMeetingIds } },
        { 'meta.certificateId': { $exists: true, $ne: null, $nin: remainingValidCertIds } },
      ],
    });
    const issuedCertIds = (await Certificate.find({ emailSent: true }).distinct('certificateId'));
    const staleResolvedNotifs = issuedCertIds.length
      ? await Notification.deleteMany({
          type: 'certificate',
          role: { $in: ['hr', 'admin'] },
          'meta.certificateId': { $in: issuedCertIds },
        })
      : { deletedCount: 0 };

    const pendingCertNotifs = await Notification.find({
      type: 'certificate',
      role: { $in: ['hr', 'admin'] },
      'meta.certificateId': { $exists: true, $ne: null },
    }).sort({ createdAt: -1 });
    const seenKeys = new Set();
    const duplicateIds = [];
    for (const n of pendingCertNotifs) {
      const key = `${n.meta.certificateId}::${n.role}`;
      if (seenKeys.has(key)) duplicateIds.push(n._id);
      else seenKeys.add(key);
    }
    const dedupedNotifs = duplicateIds.length
      ? await Notification.deleteMany({ _id: { $in: duplicateIds } })
      : { deletedCount: 0 };

    const issuedCertsRaw = await Certificate.find({ emailSent: true }).populate('student', 'name email status');
    const inconsistentCertificates = issuedCertsRaw
      .filter(c => c.student && c.student.status !== 'completed')
      .map(c => ({
        certificateId: c.certificateId,
        internName: c.student.name,
        internEmail: c.student.email,
        internStatus: c.student.status,
      }));

    res.json({
      success: true,
      deleted: {
        submissions: orphanedSubmissions.deletedCount,
        taskCertificates: orphanedTaskCerts.deletedCount,
        certificates: orphanedCerts.deletedCount,
        notifications: orphanedNotifications.deletedCount + staleResolvedNotifs.deletedCount + dedupedNotifs.deletedCount,
      },
      inconsistentCertificates,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/batches', auth, requireManager, async (req, res) => {
  try {
    const batches = await Batch.find({}).sort({ domain: 1, name: 1 });
    const counts = await User.aggregate([
      { $match: { role: 'intern', status: 'active' } },
      { $group: { _id: { domain: '$domain', batch: '$batch' }, count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[`${c._id.domain}::${c._id.batch}`] = c.count; });

    res.json(batches.map(b => ({
      ...b.toObject(),
      internCount: countMap[`${b.domain}::${b.name}`] || 0,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches', auth, requireAdmin, async (req, res) => {
  try {
    const { name, domain } = req.body;
    if (!name?.trim() || !domain?.trim())
      return res.status(400).json({ error: 'Batch name and domain are required.' });

    const exists = await Batch.findOne({ name: name.trim(), domain: domain.trim() });
    if (exists) return res.status(409).json({ error: 'This batch already exists for this domain.' });

    const batch = await Batch.create({ name: name.trim(), domain: domain.trim(), createdBy: req.user.id });
    res.status(201).json({ ...batch.toObject(), internCount: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/batches/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Batch name is required.' });

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found.' });

    const oldName = batch.name;
    batch.name = name.trim();
    await batch.save();

    await User.updateMany({ domain: batch.domain, batch: oldName }, { batch: batch.name });
    await Task.updateMany({ assignedDomain: batch.domain, assignedBatch: oldName }, { assignedBatch: batch.name });

    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/batches/:id', auth, requireAdmin, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found.' });

    const internCount = await User.countDocuments({ domain: batch.domain, batch: batch.name, role: 'intern', status: 'active' });
    if (internCount > 0) {
      return res.status(409).json({ error: `Cannot delete — ${internCount} intern(s) still assigned to this batch.` });
    }

    await Batch.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/batches/:id/assign', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found.' });

    const user = await User.findOneAndUpdate(
      { _id: userId, domain: batch.domain },
      { batch: batch.name },
      { new: true }
    ).select(safeFields);
    if (!user) return res.status(404).json({ error: 'Intern not found, or domain mismatch with batch.' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;