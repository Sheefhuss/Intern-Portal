const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['intern', 'hr', 'admin'], default: 'intern' },
  status:   { type: String, enum: ['pending', 'hr_reviewed', 'active', 'rejected'], default: 'pending' },
  domain:   { type: String, default: '' },
  batch:    { type: String, default: '' },
  appliedAt:{ type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);