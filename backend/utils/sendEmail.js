const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');
const QRCode = require('qrcode');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  pool: true, 
  maxConnections: 5,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendCertificateEmail({ to, internName, domain, batch, certificateId, issuedAt, verifyUrl }) {
  const issued = new Date(issuedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  
  const logoPath = path.join(__dirname, '../public/enginow.png');
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 140, margin: 1, color: { dark: '#7C3AED', light: '#ffffff' },
  });

  // FIX 3: Safely verify attachment exists before sending
  const attachments = [
    { filename: 'verify-qr.png', content: qrBuffer, cid: 'enginow-qr' }
  ];
  if (fs.existsSync(logoPath)) {
    attachments.unshift({ filename: 'enginow.png', path: logoPath, cid: 'enginow-logo' });
  }

  const mailOptions = {
    from: `"Enginow Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🎓 Your Certificate of Completion — ${domain || 'Internship'} Program`,
    html: `
      <div style="font-family:'Inter',system-ui,sans-serif;background:#ede9f8;padding:40px 20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(124,58,237,0.15);">
          <div style="height:8px;background:linear-gradient(90deg,#9333EA,#7C3AED,#6D28D9);"></div>
          <div style="padding:36px 40px;">
            <table style="margin-bottom:24px;"><tr>
              ${fs.existsSync(logoPath) ? '<td><img src="cid:enginow-logo" alt="Enginow" width="40" height="40" style="border-radius:8px;"></td>' : ''}
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
              You have successfully completed the <strong>${domain || 'Internship'} Program</strong>${batch ? `, Batch <strong>${batch}</strong>` : ''}
              with all assigned tasks reviewed and approved by the Enginow team.
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
                  <img src="cid:enginow-qr" alt="Verify" width="70" height="70" style="border-radius:6px;border:1.5px solid #EDE9FE;">
                </td>
              </tr>
            </table>
          </div>
          <div style="height:5px;background:linear-gradient(90deg,#6D28D9,#7C3AED,#9333EA);"></div>
        </div>
      </div>
    `,
    attachments,
  };

  return transporter.sendMail(mailOptions);
}

async function sendMeetingEmail({ to, subject, title, time, link, isReminder }) {
  const formattedTime = time
    ? new Date(time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  const mailOptions = {
    from: `"Enginow Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:'Inter',system-ui,sans-serif;background:#ede9f8;padding:40px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(124,58,237,0.15);">
          <div style="height:8px;background:linear-gradient(90deg,#9333EA,#7C3AED,#6D28D9);"></div>
          <div style="padding:36px 40px;">
            <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9CA3AF;margin:0 0 8px;">
              ${isReminder ? 'Meeting Reminder' : 'Meeting Approved'}
            </p>
            <h1 style="font-size:22px;color:#1F1235;margin:0 0 18px;font-family:Georgia,serif;">
              ${isReminder ? `⏰ "${title}" starts soon` : `✅ "${title}" was approved`}
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
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendCertificateEmail, sendMeetingEmail };