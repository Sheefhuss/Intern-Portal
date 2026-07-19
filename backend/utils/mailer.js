const { sendBrevoEmail } = require('./brevoMailer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const LOGO_URL = `${BASE_URL}/api/certificates/logo.png`;

exports.sendInviteEmail = async ({ to, name, passcode }) => {
  await sendBrevoEmail({
    to,
    toName: name,
    subject: "You're invited to the Enginow Intern Portal",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #E5E7EB">
        <div style="text-align:center;margin-bottom:24px">
          <img src="${LOGO_URL}" alt="Enginow" width="48" height="48" style="border-radius:12px;display:inline-block">
        </div>
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Welcome, ${name} 👋</h2>
        <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px">
          You've been added to the Enginow Intern Portal. Use the one-time passcode below under
          <strong>Create Account</strong> to set your password and activate your account.
        </p>
        <div style="text-align:center;background:#F5F3FF;border:1px solid #DDD6FE;border-radius:12px;padding:18px;margin:0 0 24px">
          <div style="font-size:28px;font-weight:800;letter-spacing:4px;color:#7C3AED">${passcode}</div>
        </div>
        <a href="${process.env.FRONTEND_URL}" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
          Go to Portal →
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin:20px 0 0;text-align:center">
          This passcode expires in 7 days. If you weren't expecting this, ignore this email.
        </p>
      </div>
    `,
  });
};

exports.sendOfferLetterEmail = async ({ to, name, passcode, domain, batch }) => {
  await sendBrevoEmail({
    to,
    toName: name,
    subject: `Your Internship Offer Letter — Enginow${domain ? ` (${domain})` : ''}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #E5E7EB">
        <div style="text-align:center;margin-bottom:24px">
          <img src="${LOGO_URL}" alt="Enginow" width="48" height="48" style="border-radius:12px;display:inline-block">
        </div>
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Offer of Internship</h2>
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px">
          Dear ${name},
        </p>
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px">
          We are pleased to offer you an internship position${domain ? ` in <strong>${domain}</strong>` : ''}${batch ? ` (batch: <strong>${batch}</strong>)` : ''}
          at Enginow. This letter confirms your selection and grants you access to the Enginow Intern Portal,
          where you'll manage your tasks, meetings, and progress throughout the internship.
        </p>
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px">
          To activate your account, go to the portal, open <strong>Create Account</strong>, and enter this
          email address along with the one-time passcode below to set your own password:
        </p>
        <div style="text-align:center;background:#F5F3FF;border:1px solid #DDD6FE;border-radius:12px;padding:18px;margin:0 0 24px">
          <div style="font-size:28px;font-weight:800;letter-spacing:4px;color:#7C3AED">${passcode}</div>
        </div>
        <a href="${process.env.FRONTEND_URL}" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
          Go to Portal →
        </a>
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:24px 0 0">
          We look forward to having you on the team.
        </p>
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:4px 0 0">
          Warm regards,<br/>Enginow Internship Team
        </p>
        <p style="color:#9CA3AF;font-size:12px;margin:24px 0 0;text-align:center">
          This passcode expires in 7 days. If you weren't expecting this, ignore this email.
        </p>
      </div>
    `,
  });
};

exports.sendOfferLetterPdfEmail = async ({ to, name, domain, batch, pdfBase64, pdfFilename }) => {
  await sendBrevoEmail({
    to,
    toName: name,
    subject: `🎉 Your Internship Offer Letter — Enginow${domain ? ` (${domain})` : ''}`,
    html: `
      <div style="font-family:'Inter',system-ui,sans-serif;background:#f3f0fb;padding:40px 20px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(124,58,237,0.14);">
          <div style="height:8px;background:linear-gradient(90deg,#9333EA,#7C3AED,#6D28D9);"></div>

          <div style="padding:40px 40px 32px;">
            <div style="text-align:center;margin-bottom:28px">
              <img src="${LOGO_URL}" alt="Enginow" width="52" height="52" style="border-radius:14px;display:inline-block;box-shadow:0 4px 14px rgba(124,58,237,0.25)">
            </div>

            <p style="text-align:center;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9333EA;font-weight:700;margin:0 0 10px">
              You're In 🎉
            </p>
            <h1 style="text-align:center;font-size:26px;color:#1F1235;margin:0 0 22px;font-family:Georgia,serif;">
              Offer of Internship
            </h1>

            <p style="color:#374151;font-size:14.5px;line-height:1.75;margin:0 0 16px">
              Dear <strong>${name}</strong>,
            </p>
            <p style="color:#374151;font-size:14.5px;line-height:1.75;margin:0 0 24px">
              Congratulations! We're delighted to offer you an internship position at Enginow.
              Your official offer letter is attached to this email as a PDF.
            </p>

            ${(domain || batch) ? `
            <div style="display:flex;gap:8px;justify-content:center;margin:0 0 26px;flex-wrap:wrap;">
              ${domain ? `<span style="background:#F5F3FF;color:#7C3AED;border:1px solid #DDD6FE;padding:6px 16px;border-radius:20px;font-size:12.5px;font-weight:700;">${domain}</span>` : ''}
              ${batch ? `<span style="background:#F5F3FF;color:#7C3AED;border:1px solid #DDD6FE;padding:6px 16px;border-radius:20px;font-size:12.5px;font-weight:700;">Batch ${batch}</span>` : ''}
            </div>` : ''}

            <div style="display:flex;align-items:center;gap:12px;background:#FAF5FF;border:1px solid #EDE9FE;border-radius:12px;padding:14px 16px;margin:0 0 26px;">
              <div style="width:36px;height:36px;flex-shrink:0;background:#fff;border:1px solid #DDD6FE;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;">📎</div>
              <div>
                <div style="font-size:12.5px;font-weight:700;color:#1F1235;">${pdfFilename || 'Offer-Letter.pdf'}</div>
                <div style="font-size:11.5px;color:#9CA3AF;">Your official offer letter is attached</div>
              </div>
            </div>

            <p style="color:#374151;font-size:14.5px;line-height:1.75;margin:0;">
              Welcome aboard — we're genuinely excited to have you on the team and can't wait to see
              what you'll build with us.
            </p>
            <p style="color:#374151;font-size:14.5px;line-height:1.75;margin:20px 0 0;">
              Warm regards,<br/><strong>Enginow Internship Team</strong>
            </p>
          </div>

          <div style="height:5px;background:linear-gradient(90deg,#6D28D9,#7C3AED,#9333EA);"></div>
        </div>
      </div>
    `,
    attachments: pdfBase64
      ? [{ filename: pdfFilename || `offer-letter-${name.replace(/\s+/g, '-')}.pdf`, content: pdfBase64 }]
      : undefined,
  });
};

exports.sendPasswordResetEmail = async ({ to, name, token }) => {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendBrevoEmail({
    to,
    toName: name,
    subject: 'Reset your password — Enginow',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #E5E7EB">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Password Reset</h2>
        <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px">
          Hi ${name}, click below to reset your password. This link expires in 1 hour.
        </p>
        <a href="${link}" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
          Reset Password →
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin:20px 0 0;text-align:center">
          If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
};