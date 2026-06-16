const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role:   { type: String, enum: ['hr', 'admin', 'intern', 'all'] },
  type:   { type: String, enum: ['announcement', 'task', 'system'], default: 'system' },
  text:   { type: String, required: true },
  read:   { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);