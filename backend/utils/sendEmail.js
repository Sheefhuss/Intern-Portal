const { sendBrevoEmail } = require('./brevoMailer');

   const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function sendCertificateEmail({ to, internName, domain, batch, certificateId, issuedAt, verifyUrl, downloadUrl, pdfBase64, pdfFilename }) {
  const issued = new Date(issuedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const hasLogo = true;
  const logoDataUri = `${BASE_URL}/api/certificates/logo.png`;
  const qrDataUri = `${BASE_URL}/api/certificates/${certificateId}/qr.png`;

  const html = `
      <div style="font-family:'Inter',system-ui,sans-serif;background:#ede9f8;padding:40px 20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(124,58,237,0.15);">
          <div style="height:8px;background:linear-gradient(90deg,#9333EA,#7C3AED,#6D28D9);"></div>
          <div style="padding:36px 40px;">
            <table style="margin-bottom:24px;"><tr>
              ${hasLogo ? `<td><img src="${logoDataUri}" alt="Enginow" width="40" height="40" style="border-radius:8px;"></td>` : ''}
              <td style="padding-left:12px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#7C3AED;">
                Enginow Internship Program
              </td>
            </tr></table>
            <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9CA3AF;margin:0 0 8px;">
              Certificate of Achievement
            </p>
            <h1 style="font-size:26px;color:#1F1235;margin:0 0 18px;font-family:Georgia,serif;">
              Congratulations, ${internName}! 🎉
            </h1>
            <p style="font-size:14px;color:#374151;line-height:1.7;">
              You have successfully completed all assigned tasks in the <strong>${domain || 'Internship'} Program</strong>${batch ? `, Batch <strong>${batch}</strong>` : ''},
              reviewed and approved by the Enginow team.
            </p>
            <table style="width:100%;margin-top:26px;padding-top:18px;border-top:1px solid #F3F0FF;">
              <tr>
                <td>
                  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9CA3AF;">Date of Issue</div>
                  <div style="font-size:14px;font-weight:600;color:#1F1235;">${issued}</div>
                </td>
                <td>
                  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9CA3AF;">Certificate ID</div>
                  <div style="font-size:13px;font-weight:600;color:#7C3AED;font-family:'Courier New',monospace;">${certificateId}</div>
                </td>
                <td style="text-align:right;">
                  <img src="${qrDataUri}" alt="Verify" width="70" height="70" style="border-radius:6px;border:1.5px solid #EDE9FE;">
                </td>
              </tr>
            </table>
            <table style="width:100%;margin-top:28px;"><tr>
              ${downloadUrl ? `<td style="padding-right:8px;"><a href="${downloadUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;padding:13px;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px">⬇ Download PDF</a></td>` : ''}
              ${verifyUrl ? `<td style="padding-left:${downloadUrl ? '8px' : '0'};"><a href="${verifyUrl}" style="display:block;text-align:center;background:#fff;color:#7C3AED;border:1.5px solid #C4B5FD;padding:11.5px;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px">View Certificate</a></td>` : ''}
            </tr></table>
          </div>
          <div style="height:5px;background:linear-gradient(90deg,#6D28D9,#7C3AED,#9333EA);"></div>
        </div>
      </div>
    `;

  return sendBrevoEmail({
    to,
    toName: internName,
    subject: `🎓 Your Certificate of Completion — ${domain || 'Internship'} Program`,
    html,
    attachments: pdfBase64
      ? [{ filename: pdfFilename || `certificate-${certificateId}.pdf`, content: pdfBase64 }]
      : undefined,
  });
}

async function sendTaskCertificateEmail({ to, internName, taskTitle, domain, batch, certificateId, issuedAt, verifyUrl, pdfBase64, pdfFilename }) {
  const issued = new Date(issuedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const logoDataUri = `${BASE_URL}/api/certificates/logo.png`;
  const qrDataUri = `${BASE_URL}/api/task-certificates/${certificateId}/qr.png`;

  const html = `
      <div style="font-family:'Inter',system-ui,sans-serif;background:#ede9f8;padding:40px 20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(124,58,237,0.15);">
          <div style="height:8px;background:linear-gradient(90deg,#9333EA,#7C3AED,#6D28D9);"></div>
          <div style="padding:36px 40px;">
            <table style="margin-bottom:24px;"><tr>
              <td><img src="${logoDataUri}" alt="Enginow" width="40" height="40" style="border-radius:8px;"></td>
              <td style="padding-left:12px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#7C3AED;">
                Enginow Internship Program
              </td>
            </tr></table>
            <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9CA3AF;margin:0 0 8px;">
              Task Completion Certificate
            </p>
            <h1 style="font-size:26px;color:#1F1235;margin:0 0 18px;font-family:Georgia,serif;">
              Great work, ${internName}! 🎉
            </h1>
            <p style="font-size:14px;color:#374151;line-height:1.7;">
              You have successfully completed the task <strong>"${taskTitle}"</strong>${domain ? ` in the <strong>${domain} Program</strong>` : ''}${batch ? `, Batch <strong>${batch}</strong>` : ''},
              reviewed and approved by the Enginow team.
            </p>
            <table style="width:100%;margin-top:26px;padding-top:18px;border-top:1px solid #F3F0FF;">
              <tr>
                <td>
                  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9CA3AF;">Date of Issue</div>
                  <div style="font-size:14px;font-weight:600;color:#1F1235;">${issued}</div>
                </td>
                <td>
                  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9CA3AF;">Certificate ID</div>
                  <div style="font-size:13px;font-weight:600;color:#7C3AED;font-family:'Courier New',monospace;">${certificateId}</div>
                </td>
                <td style="text-align:right;">
                  <img src="${qrDataUri}" alt="Verify" width="70" height="70" style="border-radius:6px;border:1.5px solid #EDE9FE;">
                </td>
              </tr>
            </table>
            <table style="width:100%;margin-top:28px;"><tr>
              ${verifyUrl ? `<td><a href="${verifyUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;padding:13px;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px">View Certificate</a></td>` : ''}
            </tr></table>
          </div>
          <div style="height:5px;background:linear-gradient(90deg,#6D28D9,#7C3AED,#9333EA);"></div>
        </div>
      </div>
    `;

  return sendBrevoEmail({
    to,
    toName: internName,
    subject: `🎉 Task Completed — "${taskTitle}"`,
    html,
    attachments: pdfBase64
      ? [{ filename: pdfFilename || `task-certificate-${certificateId}.pdf`, content: pdfBase64 }]
      : undefined,
  });
}

async function sendMeetingEmail({ to, subject, title, time, link, isReminder, isReschedule }) {
  const formattedTime = time
    ? new Date(time).toLocaleString('en-IN', {
        dateStyle: 'medium', timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      })
    : '';

  const eyebrow = isReminder ? 'Meeting Reminder' : isReschedule ? 'Meeting Rescheduled' : 'Meeting Confirmed';
  const heading = isReminder
    ? `⏰ "${title}" starts soon`
    : isReschedule
      ? `🔄 "${title}" was rescheduled`
      : `✅ "${title}" is scheduled`;

  const html = `
      <div style="font-family:'Inter',system-ui,sans-serif;background:#ede9f8;padding:40px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(124,58,237,0.15);">
          <div style="height:8px;background:linear-gradient(90deg,#9333EA,#7C3AED,#6D28D9);"></div>
          <div style="padding:36px 40px;">
            <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9CA3AF;margin:0 0 8px;">
              ${eyebrow}
            </p>
            <h1 style="font-size:22px;color:#1F1235;margin:0 0 18px;font-family:Georgia,serif;">
              ${heading}
            </h1>
            ${formattedTime ? `
            <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 24px;">
              <strong>When:</strong> ${formattedTime}
            </p>` : ''}
            ${link ? `
            <a href="${link}" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
              Join Meeting →
            </a>` : ''}
          </div>
          <div style="height:5px;background:linear-gradient(90deg,#6D28D9,#7C3AED,#9333EA);"></div>
        </div>
      </div>
    `;

  return sendBrevoEmail({ to, subject, html });
}

async function sendTaskEmail({ to, internName, taskTitle, type, note, deadline }) {
  const deadlineStr = deadline
    ? new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : null;

  const copy = {
    reset: {
      label: 'Submission Reset',
      heading: `↩️ "${taskTitle}" was reset to Pending`,
      body: `Your submission for <strong>${taskTitle}</strong> has been reset to Pending by the review team. Please review the feedback (if any) and resubmit when ready.`,
    },
    assigned: {
      label: 'New Task Assigned',
      heading: `📋 New task: "${taskTitle}"`,
      body: `You've been assigned a new task: <strong>${taskTitle}</strong>.${deadlineStr ? ` It's due <strong>${deadlineStr}</strong>.` : ' No deadline has been set yet.'} Head to the Tasks page in the portal for full details.`,
    },
  }[type] || {
    label: 'Task Update',
    heading: `"${taskTitle}" was updated`,
    body: `There's an update on your task <strong>${taskTitle}</strong>.`,
  };

  const noteHtml = note
    ? `<p style="font-size:13px;color:#374151;line-height:1.6;margin:14px 0 0;padding:12px 14px;background:#F5F3FF;border-left:3px solid #7C3AED;border-radius:4px;">
         <strong>Note from reviewer:</strong> ${note}
       </p>`
    : '';

  const html = `
      <div style="font-family:'Inter',system-ui,sans-serif;background:#ede9f8;padding:40px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(124,58,237,0.15);">
          <div style="height:8px;background:linear-gradient(90deg,#9333EA,#7C3AED,#6D28D9);"></div>
          <div style="padding:36px 40px;">
            <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9CA3AF;margin:0 0 8px;">
              ${copy.label}
            </p>
            <h1 style="font-size:22px;color:#1F1235;margin:0 0 18px;font-family:Georgia,serif;">
              ${copy.heading}
            </h1>
            <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;">
              Hi ${internName || 'there'}, ${copy.body}
            </p>
            ${noteHtml}
          </div>
          <div style="height:5px;background:linear-gradient(90deg,#6D28D9,#7C3AED,#9333EA);"></div>
        </div>
      </div>
    `;

  return sendBrevoEmail({ to, toName: internName, subject: copy.heading, html });
}

async function sendAnnouncementEmail({ to, internName, text }) {
  const logoDataUri = `${BASE_URL}/api/certificates/logo.png`;

  const html = `
      <div style="font-family:'Inter',system-ui,sans-serif;background:#ede9f8;padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;margin:0 auto;">
          <tr>
            <td style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(124,58,237,0.15);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:8px;line-height:8px;font-size:0;background:linear-gradient(90deg,#9333EA,#7C3AED,#6D28D9);">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:28px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;">
                      <tr>
                        <td style="width:36px;padding-right:10px;vertical-align:middle;">
                          <img src="${logoDataUri}" alt="Enginow" width="36" height="36" style="display:block;border-radius:8px;">
                        </td>
                        <td style="vertical-align:middle;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#7C3AED;">
                          Enginow Internship Program
                        </td>
                      </tr>
                    </table>
                    <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9CA3AF;margin:0 0 8px;">
                      📢 New Announcement
                    </p>
                    <h1 style="font-size:20px;color:#1F1235;margin:0 0 18px;font-family:Georgia,serif;">
                      Hi ${internName || 'there'},
                    </h1>
                    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;white-space:pre-wrap;word-break:break-word;">
                      ${text}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="height:5px;line-height:5px;font-size:0;background:linear-gradient(90deg,#6D28D9,#7C3AED,#9333EA);">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

  return sendBrevoEmail({ to, toName: internName, subject: '📢 New Announcement from Enginow Portal', html });
}

module.exports = { sendCertificateEmail, sendTaskCertificateEmail, sendMeetingEmail, sendTaskEmail, sendAnnouncementEmail };