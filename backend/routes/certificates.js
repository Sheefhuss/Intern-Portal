const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { getBrowser } = require('../utils/browserPool');
const { sendCertificateEmail } = require('../utils/sendEmail');
const socketManager = require('../utils/socketManager');

const LOGO_PATH = path.join(__dirname, '../../frontend/public/enginow.png');
let LOGO_B64 = '';
try {
  const raw = fs.readFileSync(LOGO_PATH);
  LOGO_B64 = 'data:image/png;base64,' + raw.toString('base64');
} catch {
  LOGO_B64 = '';
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const renderCertificateHtml = async (cert) => {
  const issued = new Date(cert.issuedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const verifyUrl = `${BASE_URL}/api/certificates/${cert.certificateId}/view`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 100, margin: 1,
    color: { dark: '#7C3AED', light: '#ffffff' },
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Certificate — ${cert.certificateId}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#ede9f8;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px}
.wrap{display:flex;flex-direction:column;align-items:center;gap:18px}
.cert-outer{width:860px;max-width:98vw;background:#fff;border-radius:6px;position:relative;box-shadow:0 20px 60px rgba(124,58,237,0.18),0 4px 16px rgba(0,0,0,0.07);overflow:hidden}
.top-bar{height:8px;background:linear-gradient(90deg,#9333EA,#7C3AED,#6D28D9)}
.inner{padding:52px 64px 44px;position:relative}
.wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.04;pointer-events:none;z-index:0}
.wm img{width:360px}
.corner{position:absolute;width:72px;height:72px}
.tl{top:14px;left:14px;border-top:2.5px solid #7C3AED;border-left:2.5px solid #7C3AED;border-radius:5px 0 0 0}
.tr{top:14px;right:14px;border-top:2.5px solid #7C3AED;border-right:2.5px solid #7C3AED;border-radius:0 5px 0 0}
.bl{bottom:14px;left:14px;border-bottom:2.5px solid #7C3AED;border-left:2.5px solid #7C3AED;border-radius:0 0 0 5px}
.br{bottom:14px;right:14px;border-bottom:2.5px solid #7C3AED;border-right:2.5px solid #7C3AED;border-radius:0 0 5px 0}
.content{position:relative;z-index:1}
.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px}
.logo{height:75px; width:auto;}
.org{font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#7C3AED;text-align:right;line-height:1.6}
.lbl{font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#9CA3AF;margin-bottom:10px}
.title{font-size:46px;font-weight:700;color:#1F1235;line-height:1.1;margin-bottom:30px;font-family:Georgia,serif}
.divider{display:flex;align-items:center;gap:14px;margin-bottom:26px}
.dline{flex:1;height:1px;background:linear-gradient(90deg,transparent,#C4B5FD,transparent)}
.ddot{width:7px;height:7px;background:#7C3AED;transform:rotate(45deg);flex-shrink:0}
.sub{font-size:13px;color:#6B7280;letter-spacing:0.5px;margin-bottom:10px}
.name{font-size:52px;font-weight:600;line-height:1.1;margin-bottom:26px;font-family:Georgia,serif;background:linear-gradient(135deg,#9333EA,#7C3AED,#6D28D9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.body-text{font-size:14.5px;color:#374151;line-height:1.85;max-width:560px;margin-bottom:38px}
.body-text strong{color:#1F1235;font-weight:600}
.footer{display:flex;align-items:flex-end;justify-content:space-between;padding-top:22px;border-top:1px solid #F3F0FF}
.flabel{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9CA3AF;margin-bottom:4px}
.fval{font-size:14px;font-weight:600;color:#1F1235}
.certid{font-size:12px;font-weight:600;color:#7C3AED;letter-spacing:1.5px;font-family:'Courier New',monospace}
.qr-wrap{display:flex;flex-direction:column;align-items:center;gap:5px}
.qr-wrap img{width:78px;height:78px;border-radius:6px;border:1.5px solid #EDE9FE;padding:3px}
.qlbl{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#9CA3AF}
.bot-bar{height:5px;background:linear-gradient(90deg,#6D28D9,#7C3AED,#9333EA)}
.actions{display:flex;gap:12px}
.btn{padding:10px 26px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;border:none;transition:opacity 0.2s}
.btn:hover{opacity:0.85}
.primary{background:linear-gradient(135deg,#9333EA,#7C3AED);color:#fff}
.ghost{background:#fff;color:#7C3AED;border:1.5px solid #C4B5FD}
@media print{body{background:#fff;padding:0}.cert-outer{box-shadow:none;width:100%;max-width:100%}.actions{display:none}}
</style>
</head>
<body>
<div class="wrap">
  <div class="cert-outer">
    <div class="top-bar"></div>
    <div class="inner">
      <div class="wm"><img src="${LOGO_B64}" alt=""></div>
      <div class="corner tl"></div>
      <div class="corner tr"></div>
      <div class="corner bl"></div>
      <div class="corner br"></div>
      <div class="content">
        <div class="hdr">
          <img class="logo" src="${LOGO_B64}" alt="Enginow">
          <div class="org">Enginow<br>Internship Program</div>
        </div>
        <div class="lbl">Certificate of Achievement</div>
        <div class="title">Certificate of<br>Completion</div>
        <div class="divider"><div class="dline"></div><div class="ddot"></div><div class="dline"></div></div>
        <div class="sub">This is proudly presented to</div>
        <div class="name">${cert.student?.name || 'Intern'}</div>
        <div class="body-text">
          For successfully completing all assigned tasks in the <strong>${cert.domain || 'Internship'} Program</strong>${cert.batch ? ', <strong>Batch ' + cert.batch + '</strong>' : ''}, reviewed and approved by the Enginow team. This achievement reflects a strong commitment to excellence and professional growth.
        </div>
        <div class="footer">
          <div>
            <div class="flabel">Date of Issue</div>
            <div class="fval">${issued}</div>
          </div>
          <div>
            <div class="flabel">Certificate ID</div>
            <div class="certid">${cert.certificateId}</div>
          </div>
          <div class="qr-wrap">
            <img src="${qrDataUrl}" alt="Verify certificate">
            <div class="qlbl">Scan to verify</div>
          </div>
        </div>
      </div>
    </div>
    <div class="bot-bar"></div>
  </div>
  <div class="actions">
    <button class="btn ghost" onclick="window.close()">Close</button>
    <a class="btn primary" href="/api/certificates/${cert.certificateId}/download" style="text-decoration:none;display:inline-block">⬇ Download PDF</a>
  </div>
</div>
</body>
</html>`;
};

const renderCertificatePdf = async (cert) => {
  const html = await renderCertificateHtml(cert);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1000, height: 900 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const box = await page.$eval('.cert-outer', el => {
      const rect = el.getBoundingClientRect();
      return { width: Math.ceil(rect.width), height: Math.ceil(rect.height) };
    });

    return await page.pdf({
      width: `${box.width}px`,
      height: `${box.height}px`,
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  } finally {
    await page.close();
  }
};

router.get('/logo.png', (req, res) => {
  if (!fs.existsSync(LOGO_PATH)) return res.status(404).end();
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(LOGO_PATH).pipe(res);
});

router.get('/:certificateId/qr.png', async (req, res) => {
  try {
    const verifyUrl = `${BASE_URL}/api/certificates/${req.params.certificateId}/view`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      width: 140, margin: 1, color: { dark: '#7C3AED', light: '#ffffff' },
    });
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(qrBuffer);
  } catch (err) {
    res.status(500).end();
  }
});

router.get('/', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const certificates = await Certificate
      .find({})
      .populate('student', 'name email domain batch')
      .sort({ issuedAt: -1 });

    res.json(certificates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:certificateId/issue', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const { pdfBase64, filename } = req.body;
    if (!pdfBase64 || !pdfBase64.trim())
      return res.status(400).json({ error: 'A certificate PDF (base64) is required.' });

    const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',').pop() : pdfBase64;

    const approxBytes = Math.ceil((cleanBase64.length * 3) / 4);
    if (approxBytes > 8 * 1024 * 1024)
      return res.status(400).json({ error: 'PDF is too large (max 8MB).' });

    const certificate = await Certificate
      .findOne({ certificateId: req.params.certificateId })
      .populate('student', 'name email status');

    if (!certificate) return res.status(404).json({ error: 'Certificate not found.' });
    if (!certificate.student) return res.status(404).json({ error: 'Intern not found for this certificate.' });
    if (certificate.student.status !== 'completed')
      return res.status(400).json({ error: 'This intern is not marked Completed. Mark their internship complete in Full Registry first.' });


    try {
      await sendCertificateEmail({
        to: certificate.student.email,
        internName: certificate.student.name,
        domain: certificate.domain,
        batch: certificate.batch,
        certificateId: certificate.certificateId,
        issuedAt: certificate.issuedAt || certificate.createdAt,
        pdfBase64: cleanBase64,
        pdfFilename: filename || `certificate-${certificate.certificateId}.pdf`,
      });
    } catch (emailErr) {
      console.error('Manual certificate email failed for', certificate.student.email, ':', emailErr.message);
      return res.status(502).json({ error: `Certificate email failed: ${emailErr.message}` });
    }

    certificate.emailSent = true;
    await certificate.save();

    const internNotif = await Notification.create({
      userId: certificate.student._id,
      role: 'intern',
      type: 'certificate',
      text: `🎓 Your Certificate of Completion for the ${certificate.domain || 'Internship'} program${certificate.batch ? `, Batch ${certificate.batch}` : ''} has been issued and emailed to you.`,
      meta: { certificateId: certificate.certificateId },
    });
    socketManager.emitToUser(certificate.student._id, 'notification:new', {
      id: internNotif._id,
      role: internNotif.role,
      type: internNotif.type,
      text: internNotif.text,
      read: false,
      time: new Date(internNotif.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata',
      }),
    });

    res.json({ success: true, certificate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    if (req.user.role !== 'intern')
      return res.status(403).json({ error: 'Access denied.' });

    const certificate = await Certificate.findOne({ student: req.user.id });
    res.json(certificate || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/:certificateId/download', async (req, res) => {
  try {
    const certificate = await Certificate
      .findOne({ certificateId: req.params.certificateId })
      .populate('student', 'name');

    if (!certificate) return res.status(404).send('Certificate not found.');

    const pdfBuffer = await renderCertificatePdf(certificate);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="certificate-${certificate.certificateId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Certificate PDF generation failed:', err);
    res.status(500).send('Error generating certificate PDF.');
  }
});

router.get('/:certificateId/view', async (req, res) => {
  try {
    const certificate = await Certificate
      .findOne({ certificateId: req.params.certificateId })
      .populate('student', 'name');
      
    if (!certificate) return res.status(404).send('Certificate not found.');
    
    const html = await renderCertificateHtml(certificate);
    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading certificate.');
  }
});

module.exports = router;