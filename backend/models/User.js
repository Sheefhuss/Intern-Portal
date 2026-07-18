const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, default: null },
  role:     { type: String, enum: ['intern', 'hr', 'admin'], default: 'intern' },
  status:   { type: String, enum: ['invited', 'active', 'revoked', 'pending', 'hr_reviewed', 'rejected', 'completed'], default: 'invited' },
  domain:   { type: String, default: '' },
  batch:    { type: String, default: '' },
  appliedAt:{ type: Date, default: Date.now },

  invitedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  inviteDeliveryMethod: { type: String, enum: ['passcode_email', 'offer_letter_email', 'manual'], default: 'passcode_email' },
  revokedAt:    { type: Date, default: null },
  revokedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  completedAt:  { type: Date, default: null },
  completedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  emailVerified:      { type: Boolean, default: false },
  emailVerifyToken:   { type: String, default: null },
  emailVerifyExpires: { type: Date,   default: null },

  resetPasswordToken:   { type: String, default: null },
  resetPasswordExpires: { type: Date,   default: null },
  linkedIn: { type: String, default: '' },
  mobile: { type: String, default: '' },
  isMobileVerified: { type: Boolean, default: false },
  photoBase64: { type: String, default: '' },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
});

module.exports = mongoose.model('User', userSchema);