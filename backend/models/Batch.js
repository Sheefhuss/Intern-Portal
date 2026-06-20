const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  domain:    { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

batchSchema.index({ name: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);