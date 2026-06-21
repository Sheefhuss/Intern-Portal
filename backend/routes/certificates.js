const express = require('express');
const router  = express.Router();
const Certificate = require('../models/Certificate');
const auth = require('../middleware/authMiddleware');

const renderCertificateHtml = (cert) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Certificate ${cert.certificateId}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
  .cert { width: 800px; max-width: 92vw; background: #fff; border: 10px solid #7C3AED; padding: 60px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
  .cert h1 { font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #7C3AED; margin: 0 0 30px; }
  .cert .name { font-size: 36px; font-weight: bold; color: #111827; margin: 20px 0; border-bottom: 2px solid #E5E7EB; display: inline-block; padding-bottom: 10px; }
  .cert p { font-size: 15px; color: #4B5563; line-height: 1.8; }
  .cert .id { margin-top: 40px; font-size: 11px; color: #9CA3AF; letter-spacing: 2px; }
  .printbtn { margin-top: 24px; }
  .printbtn button { padding: 10px 22px; background: #7C3AED; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
  @media print { body { background: #fff; } .cert { box-shadow: none; border: 6px solid #7C3AED; } .printbtn { display: none; } }
</style>
</head>
<body>
  <div>
    <div class="cert">
      <h1>Certificate of Completion</h1>
      <p>This certifies that</p>
      <div class="name">${cert.student?.name || 'Intern'}</div>
      <p>has successfully completed the ${cert.domain || 'internship'} program${cert.batch ? `, Batch ${cert.batch}` : ''}, with all assigned tasks reviewed and approved.</p>
      <p>Issued on ${new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <div class="id">CERTIFICATE ID: ${cert.certificateId}</div>
    </div>
    <div class="printbtn" style="text-align:center;">
      <button onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;

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
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId }).populate('student', 'name');
    if (!certificate) return res.status(404).send('Certificate not found.');

    res.send(renderCertificateHtml(certificate));
  } catch (err) {
    res.status(500).send('Error loading certificate.');
  }
});

module.exports = router;