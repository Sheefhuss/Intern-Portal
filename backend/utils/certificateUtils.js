const crypto = require('crypto');
const Submission = require('../models/Submission');
const Certificate = require('../models/Certificate');
const User = require('../models/User');

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
  if (existing) return;

  const intern = await User.findById(internId).select('domain batch');
  if (!intern) return;

  try {
    await Certificate.create({
      student: internId,
      certificateId: generateCertificateId(),
      domain: intern.domain,
      batch: intern.batch,
    });
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
};

module.exports = { generateCertificateId, maybeIssueCertificate };