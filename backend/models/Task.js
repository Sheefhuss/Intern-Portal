const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedDomain: { type: String, default: '' },
  assignedBatch:  { type: String, default: '' },
  deadline:       { type: Date },
  submissionLink: { type: String, default: '' },
  formLink:       { type: String, default: '' },
  requiresLink:   { type: Boolean, default: true },
  status:         { type: String, enum: ['pending', 'submitted', 'hr_reviewed', 'reviewed'], default: 'pending' },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);