const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const { sendMeetingEmail } = require('./sendEmail');

cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const sixtyFiveMinsFromNow = new Date(now.getTime() + 65 * 60 * 1000);

  try {
    const upcomingMeetings = await Meeting.find({
      status: 'approved',
      reminderSent: { $ne: true },
      scheduledAt: { $gte: oneHourFromNow, $lte: sixtyFiveMinsFromNow }
    }).populate('createdBy');

    for (const meeting of upcomingMeetings) {
      if (meeting.createdBy?.email) {
        await sendMeetingEmail({
          to: meeting.createdBy.email,
          subject: `Reminder: ${meeting.title} starts in 1 hour`,
          title: meeting.title,
          time: meeting.scheduledAt,
          link: meeting.approvalLink,
          isReminder: true
        });
      }
      
      meeting.reminderSent = true;
      await meeting.save();
    }
  } catch (err) {
    console.error(err);
  }
});