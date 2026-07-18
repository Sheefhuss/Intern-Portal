const { sendBrevoEmail } = require('./brevoMailer');

exports.sendInviteEmail = async ({ to, name, passcode }) => {
  await sendBrevoEmail({
    to,
    toName: name,
    subject: "You're invited to the Enginow Intern Portal",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #E5E7EB">
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#7C3AED,#A78BFA);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff">E</div>
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