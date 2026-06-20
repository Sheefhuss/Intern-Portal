const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  task:   { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: {
    type: String,
    enum: ['pending', 'submitted', 'hr_reviewed', 'reviewed'],
    default: 'pending',
  },

  submissionUrl: { type: String, default: '' },
  submittedAt:   { type: Date, default: null },

  source: {
    type: String,
    enum: ['intern', 'backfill'],
    default: 'intern',
  },

  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

submissionSchema.index({ task: 1, intern: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);