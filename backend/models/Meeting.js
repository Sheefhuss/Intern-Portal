const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['slot', 'request'], required: true },
  meetLink: { type: String, trim: true },
  approvalLink: { type: String, trim: true, default: '' },
  requestNote: { type: String, trim: true },
  scheduledAt: { type: Date },
  duration: { type: Number, default: 30 },
  scope: { type: String, enum: ['global', 'batch', 'intern'], default: 'global' },
  domain: { type: String, default: '' },
  batch: { type: String, default: '' },
  status: { type: String, enum: ['open', 'booked', 'pending', 'approved', 'rejected'], default: 'open' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reminderSent: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);