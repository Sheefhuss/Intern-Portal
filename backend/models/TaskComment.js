const mongoose = require('mongoose');

const taskCommentSchema = new mongoose.Schema({
  task:       { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, enum: ['hr', 'admin'], required: true },
  text:       { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('TaskComment', taskCommentSchema);