const crypto = require('crypto');
const Submission = require('../models/Submission');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendCertificateEmail } = require('./sendEmail');
const socketManager = require('./socketManager');

const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CERT-${year}-${random}`;
};

const maybeIssueCertificate = async (internId) => {
  const allSubs = await Submission.find({ intern: internId });
  if (!allSubs.length) return;
  if (!allSubs.every(s => s.status === 'reviewed')) return;

  const existing = await Certificate.findOne({ student: internId });
  if (existing && existing.emailSent) return existing;

  const intern = await User.findById(internId).select('name email domain batch');
  if (!intern) return;

  let certificate = existing;
  if (!certificate) {
    try {
      certificate = await Certificate.create({
        student: internId,
        certificateId: generateCertificateId(),
        domain: intern.domain,
        batch: intern.batch,
        emailSent: false,
      });
    } catch (err) {
      if (err.code === 11000) {
        certificate = await Certificate.findOne({ student: internId });
      } else {
        throw err;
      }
    }
  }

  if (!certificate) return;

  let emailSucceeded = false;
  try {
    await sendCertificateEmail({
      to: intern.email,
      internName: intern.name,
      domain: intern.domain,
      batch: intern.batch,
      certificateId: certificate.certificateId,
      issuedAt: certificate.issuedAt || certificate.createdAt,
      verifyUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/certificates/${certificate.certificateId}/view`,
    });
    certificate.emailSent = true;
    await certificate.save();
    emailSucceeded = true;
  } catch (emailErr) {
    console.error('Certificate email failed for', intern.email, ':', emailErr.message);
  }

  const notif = await Notification.create({
    userId: intern._id,
    role: 'intern',
    type: 'certificate',
    text: emailSucceeded
      ? `🎓 Your Certificate of Completion for the ${intern.domain || 'Internship'} program${intern.batch ? `, Batch ${intern.batch}` : ''} has been issued and emailed to you.`
      : `🎓 Your Certificate of Completion for the ${intern.domain || 'Internship'} program${intern.batch ? `, Batch ${intern.batch}` : ''} has been issued. We're having trouble emailing it — you can view it in your portal.`,
    meta: { certificateId: certificate.certificateId },
  });
  socketManager.emitToUser(intern._id, 'notification:new', {
    id: notif._id, role: notif.role, type: notif.type, text: notif.text, read: false,
    time: new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  });

  return certificate;
};

module.exports = { generateCertificateId, maybeIssueCertificate };