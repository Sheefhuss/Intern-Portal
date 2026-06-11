const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
  certificateId: { type: String, unique: true },
  pdfUrl: String,
  issuedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', certificateSchema);