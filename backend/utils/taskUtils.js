const User = require('../models/User');
const toEndOfDay = (dateInput) => {
  if (!dateInput) return dateInput;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

const decorate = async (tasks) => {
  const creatorIds = [...new Set(tasks.map(t => t.createdBy?.toString()).filter(Boolean))];
  const creators = await User.find({ _id: { $in: creatorIds } }).select('role');
  const roleMap = {};
  creators.forEach(c => { roleMap[c._id.toString()] = c.role; });
  return tasks.map(t => ({
    ...t.toObject(),
    createdByRole: roleMap[t.createdBy?.toString()] || null,
  }));
};

const isIndividual = (task) => !!task.assignedTo;

const batchInterns = async (task) => {
  if (isIndividual(task)) return [task.assignedTo];
  const users = await User.find({
    role: 'intern', status: 'active',
    domain: task.assignedDomain, batch: task.assignedBatch,
  }).select('_id');
  return users.map(u => u._id);
};

module.exports = { decorate, isIndividual, batchInterns, toEndOfDay };