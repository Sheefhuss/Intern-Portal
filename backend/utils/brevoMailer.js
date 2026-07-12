const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const SENDER_EMAIL = process.env.EMAIL_USER;         // must be a verified sender in Brevo
const SENDER_NAME = process.env.EMAIL_FROM_NAME || 'Enginow Portal';

if (!process.env.BREVO_API_KEY) {
  console.error('❌ BREVO_API_KEY is not set — emails will fail to send.');
} else if (!SENDER_EMAIL) {
  console.error('❌ EMAIL_USER is not set — Brevo needs a verified sender email.');
} else {
  console.log('✅ Brevo mailer configured. Sender:', SENDER_EMAIL);
}
async function sendBrevoEmail({ to, toName, subject, html }) {
  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: to, name: toName || undefined }],
    subject,
    htmlContent: html,
  };

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${errText}`);
  }

  return res.json();
}

module.exports = { sendBrevoEmail };
