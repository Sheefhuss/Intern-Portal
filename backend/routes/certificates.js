const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const auth = require('../middleware/authMiddleware');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

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
          For successfully completing the <strong>${cert.domain || 'Internship'} Program</strong>${cert.batch ? ', <strong>Batch ' + cert.batch + '</strong>' : ''} with all assigned tasks reviewed and approved by the Enginow team. This achievement reflects a strong commitment to excellence and professional growth.
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
    <button class="btn primary" onclick="window.print()">🖨 Print / Save as PDF</button>
  </div>
</div>
</body>
</html>`;
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