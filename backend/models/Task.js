const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  assignedBatch:  { type: String, default: '' }, 
  deadline:       { type: Date },
  submissionLink: { type: String, default: '' },   
  formLink:       { type: String, default: '' },   
  status:         { type: String, enum: ['pending','submitted','reviewed'], default: 'pending' },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);