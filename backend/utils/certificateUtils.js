const crypto = require('crypto');
const Submission = require('../models/Submission');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendCertificateEmail } = require('./sendEmail');

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
  } catch (emailErr) {
    console.error('Certificate email failed for', intern.email, ':', emailErr.message);
  }

  await Notification.create({
    userId: intern._id,
    role: 'intern',
    type: 'certificate',
    text: `🎓 Your Certificate of Completion for the ${intern.domain || 'Internship'} program${intern.batch ? `, Batch ${intern.batch}` : ''} has been issued and emailed to you.`,
    meta: { certificateId: certificate.certificateId },
  });

  return certificate;
};

module.exports = { generateCertificateId, maybeIssueCertificate };