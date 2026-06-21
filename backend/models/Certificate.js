const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
  certificateId: { type: String, unique: true, required: true },
  domain: { type: String, default: '' },
  batch: { type: String, default: '' },
  pdfUrl: String,
  issuedAt: { type: Date, default: Date.now }
});

certificateSchema.index({ student: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);