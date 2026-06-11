const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  skillsRequired: [String],
  location: String,
  duration: String,
  deadline: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Internship', internshipSchema);