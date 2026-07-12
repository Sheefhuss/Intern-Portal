const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
console.log('EMAIL_HOST set:', !!process.env.EMAIL_HOST, '| EMAIL_USER set:', !!process.env.EMAIL_USER);
transporter.verify((err) => {
  if (err) console.error('❌ Mailer config error:', err.message);
  else console.log('✅ Mailer ready');
});

exports.sendVerificationEmail = async ({ to, name, token }) => {
  const link = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Enginow Intern Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your email — Enginow',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #E5E7EB">
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#7C3AED,#A78BFA);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff">E</div>
        </div>
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Hi ${name} 👋</h2>
        <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px">
          Thanks for applying to the Enginow Intern Portal. Please verify your email address to complete your application.
        </p>
        <a href="${link}" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
          Verify Email Address →
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin:20px 0 0;text-align:center">
          This link expires in 24 hours. If you didn't apply, ignore this email.
        </p>
      </div>
    `,
  });
};

exports.sendApprovalEmail = async ({ to, name, batch }) => {
  await transporter.sendMail({
    from: `"Enginow Intern Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🎉 Your internship application is approved — Enginow',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #E5E7EB">
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#7C3AED,#A78BFA);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff">E</div>
        </div>
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Welcome aboard, ${name}! 🎉</h2>
        <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px">
          Your internship application has been <strong style="color:#16A34A">approved</strong>.
          ${batch ? `You have been assigned to <strong>Batch ${batch}</strong>.` : ''}
        </p>
        <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px">
          You can now log in to the Intern Portal using your registered email and password.
        </p>
        <a href="${process.env.FRONTEND_URL}" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
          Go to Portal →
        </a>
      </div>
    `,
  });
};

exports.sendRejectionEmail = async ({ to, name }) => {
  await transporter.sendMail({
    from: `"Enginow Intern Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Update on your internship application — Enginow',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #E5E7EB">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Hi ${name},</h2>
        <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px">
          Thank you for your interest in Enginow. After careful review, we're unable to move forward with your application at this time.
        </p>
        <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0">
          We encourage you to apply again in a future intake. Best of luck!
        </p>
      </div>
    `,
  });
};

exports.sendPasswordResetEmail = async ({ to, name, token }) => {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Enginow Intern Portal" <${process.env.EMAIL_USER}>`,
    to,
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
