const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendMeetingEmail({ to, subject, title, time, link, isReminder = false }) {
  const formattedTime = new Date(time).toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const mailOptions = {
    from: `"Enginow Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #111827;">
        <h2>${isReminder ? '⏰ Meeting Reminder' : '📅 Meeting Approved!'}</h2>
        <p>Hi there,</p>
        <p>Your meeting <strong>"${title}"</strong> is confirmed.</p>
        <p><strong>Scheduled Time:</strong> ${formattedTime}</p>
        ${link ? `<p><a href="${link}" style="background: #7C3AED; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">Join Meeting</a></p>` : ''}
        <br/>
        <p>Best regards,<br/>Enginow Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

async function sendTaskEmail({ to, internName, taskTitle, type }) {
  const subjects = {
    reset: `Action Required: Resubmit "${taskTitle}"`,
    assigned: `New Task Assigned: "${taskTitle}"`,
  };

  const bodies = {
    reset: `
      <div style="font-family: sans-serif; padding: 20px; color: #111827;">
        <h2>🔄 Submission Reset</h2>
        <p>Hi ${internName},</p>
        <p>Your submission for the task <strong>"${taskTitle}"</strong> has been reset back to <strong>Pending</strong>.</p>
        <p>Please log in to the portal and resubmit your work at your earliest convenience.</p>
        <br/>
        <p>Best regards,<br/>Enginow Team</p>
      </div>
    `,
    assigned: `
      <div style="font-family: sans-serif; padding: 20px; color: #111827;">
        <h2>📋 New Task Assigned</h2>
        <p>Hi ${internName},</p>
        <p>A new task <strong>"${taskTitle}"</strong> has been assigned to you.</p>
        <p>Please log in to the portal to view the details and complete it before the deadline.</p>
        <br/>
        <p>Best regards,<br/>Enginow Team</p>
      </div>
    `,
  };

  const mailOptions = {
    from: `"Enginow Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject: subjects[type] || 'Task Update',
    html: bodies[type] || '',
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendMeetingEmail, sendTaskEmail };