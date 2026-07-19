const mongoose = require('mongoose');

const taskCertificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  certificateId: { type: String, unique: true, required: true },
  taskTitle: { type: String, default: '' },
  domain: { type: String, default: '' },
  batch: { type: String, default: '' },
  issuedAt: { type: Date, default: Date.now },
  emailSent: { type: Boolean, default: false },
});
taskCertificateSchema.index({ student: 1, task: 1 }, { unique: true });

module.exports = mongoose.model('TaskCertificate', taskCertificateSchema);