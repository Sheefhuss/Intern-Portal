require('dotenv').config();
require('../db');
const Task = require('../models/Task');
const User = require('../models/User');
const Submission = require('../models/Submission');

async function internsForTask(task) {
  if (task.assignedTo) return [task.assignedTo];
  const users = await User.find({
    role: 'intern', status: 'active',
    domain: task.assignedDomain, batch: task.assignedBatch,
  }).select('_id');
  return users.map(u => u._id);
}

async function run() {
  const tasks = await Task.find({});
  console.log(`Scanning ${tasks.length} task(s) for missing submission records...`);

  let created = 0;
  let skipped = 0;

  for (const task of tasks) {
    const internIds = await internsForTask(task);

    for (const internId of internIds) {
      const exists = await Submission.findOne({ task: task._id, intern: internId });
      if (exists) { skipped++; continue; }

      const seedStatus = ['pending', 'submitted', 'hr_reviewed', 'reviewed'].includes(task.status)
        ? task.status
        : 'pending';

      await Submission.create({
        task: task._id,
        intern: internId,
        status: seedStatus,
        submissionUrl: task.submissionLink || '',
        submittedAt: seedStatus !== 'pending' ? task.updatedAt : null,
        source: 'backfill',
      });
      console.log(`Created submission for task "${task.title}" -> intern ${internId} (status: ${seedStatus})`);
      created++;
    }
  }

  console.log(`\nDone. Created: ${created}, Already existed (skipped): ${skipped}`);
  console.log('Note: backfilled status was copied from the old shared Task.status field.');
  console.log('If different interns in the same batch actually had different real submission states, please correct them manually in the Track Submissions view.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});