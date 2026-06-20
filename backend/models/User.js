const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['intern', 'hr', 'admin'], default: 'intern' },
  status:   { type: String, enum: ['pending', 'hr_reviewed', 'active', 'rejected', 'revoked'], default: 'pending' },
  domain:   { type: String, default: '' },
  batch:    { type: String, default: '' },
  appliedAt:{ type: Date, default: Date.now },

  revokedAt:    { type: Date, default: null },
  revokedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  emailVerified:      { type: Boolean, default: false },
  emailVerifyToken:   { type: String, default: null },
  emailVerifyExpires: { type: Date,   default: null },

  resetPasswordToken:   { type: String, default: null },
  resetPasswordExpires: { type: Date,   default: null },
});

module.exports = mongoose.model('User', userSchema);