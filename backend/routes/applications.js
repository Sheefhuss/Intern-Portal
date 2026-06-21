const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'intern')
      return res.status(403).json({ error: 'Only interns can apply.' });

    const { internship, resumeUrl } = req.body;
    if (!internship)
      return res.status(400).json({ error: 'Internship is required.' });

    const exists = await Internship.findById(internship);
    if (!exists) return res.status(404).json({ error: 'Internship not found.' });

    const application = await Application.create({
      internship,
      resumeUrl,
      student: req.user.id,
      status: 'pending',
    });
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    if (req.user.role !== 'intern')
      return res.status(403).json({ error: 'Access denied.' });

    const applications = await Application.find({ student: req.user.id }).populate('internship');
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;