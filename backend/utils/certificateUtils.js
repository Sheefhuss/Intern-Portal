const crypto = require('crypto');
const Submission = require('../models/Submission');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const User = require('../models/User');
const socketManager = require('./socketManager');

const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CERT-${year}-${random}`;
};

const maybeIssueCertificate = async (internId) => {
  const intern = await User.findById(internId).select('name email domain batch status');
  if (!intern) return;
  if (intern.status !== 'completed') return; // admin must mark the internship Completed first

  const allSubs = await Submission.find({ intern: internId });
  if (!allSubs.length) return;
  if (!allSubs.every(s => s.status === 'reviewed')) return;

  const latestReviewedAt = allSubs.reduce((max, s) => {
    const t = s.reviewedAt ? new Date(s.reviewedAt).getTime() : 0;
    return t > max ? t : max;
  }, 0);

  const existing = await Certificate.findOne({ student: internId });

  if (existing && existing.lastReviewedAt && new Date(existing.lastReviewedAt).getTime() >= latestReviewedAt) {
    return existing;
  }

  const certificate = await Certificate.findOneAndUpdate(
    { student: internId },
    {
      $set: {
        domain: intern.domain,
        batch: intern.batch,
        emailSent: false,
        lastReviewedAt: new Date(latestReviewedAt),
      },
      $setOnInsert: {
        student: internId,
        certificateId: generateCertificateId(),
      },
    },
    { new: true, upsert: true }
  );

  if (!certificate) return;

  const domainLabel = intern.domain || 'Internship';
  const batchLabel = intern.batch ? `, Batch ${intern.batch}` : '';

  await Notification.insertMany([
    {
      role: 'hr',
      type: 'certificate',
      text: `🎓 ${intern.name} has completed all assigned tasks in the ${domainLabel} program${batchLabel}. Please prepare and upload their completion certificate.`,
      meta: { certificateId: certificate.certificateId },
    },
    {
      role: 'admin',
      type: 'certificate',
      text: `🎓 ${intern.name} has completed all assigned tasks in the ${domainLabel} program${batchLabel}. Please prepare and upload their completion certificate.`,
      meta: { certificateId: certificate.certificateId },
    },
  ]);

  const internNotif = await Notification.create({
    userId: intern._id,
    role: 'intern',
    type: 'certificate',
    text: `🎉 You've completed all assigned tasks in the ${domainLabel} program${batchLabel}! Your certificate is being prepared and will be emailed to you shortly.`,
    meta: { certificateId: certificate.certificateId },
  });

  socketManager.emitToUser(intern._id, 'notification:new', {
    id: internNotif._id,
    role: internNotif.role,
    type: internNotif.type,
    text: internNotif.text,
    read: false,
    time: new Date(internNotif.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata',
    }),
  });

  return certificate;
};

module.exports = { generateCertificateId, maybeIssueCertificate };