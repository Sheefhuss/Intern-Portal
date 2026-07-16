const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const { sendMeetingEmail } = require('./sendEmail');

cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const sixtyFiveMinsFromNow = new Date(now.getTime() + 65 * 60 * 1000);

  try {
    const upcomingMeetings = await Meeting.find({
      status: { $in: ['approved', 'booked'] },
      reminderSent: { $ne: true },
      scheduledAt: { $gte: oneHourFromNow, $lte: sixtyFiveMinsFromNow }
    }).populate('createdBy').populate('bookedBy');

    if (upcomingMeetings.length === 0) return;
    const emailPromises = upcomingMeetings.map(async (meeting) => {
      const attendee = meeting.type === 'slot' ? meeting.bookedBy : meeting.createdBy;

      if (attendee?.email) {
        await sendMeetingEmail({
          to: attendee.email,
          subject: `Reminder: ${meeting.title} starts in 1 hour`,
          title: meeting.title,
          time: meeting.scheduledAt,
          link: meeting.approvalLink,
          isReminder: true
        });
      }
      
      meeting.reminderSent = true;
      return meeting.save();
    });
    await Promise.allSettled(emailPromises);
    
    console.log(`Successfully processed ${upcomingMeetings.length} meeting reminders.`);

  } catch (err) {
    console.error('Cron Job Error:', err);
  }
});