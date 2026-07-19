const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role:   { type: String, enum: ['hr', 'admin', 'intern', 'all'] },
  type:   { type: String, enum: ['announcement', 'task', 'system', 'certificate'], default: 'system' },
  text:   { type: String, required: true },
  read:   { type: Boolean, default: false }, 
  readBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  task:   { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  meta:   { certificateId: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);