const express = require('express');
const router = express.Router();
const Internship = require('../models/Internship');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
  try {
    const internships = await Internship.find().populate('company', 'name email');
    res.json(internships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role))
      return res.status(403).json({ error: 'Access denied.' });

    const { title, description, skillsRequired, location, duration, deadline } = req.body;
    if (!title || !title.trim())
      return res.status(400).json({ error: 'Title is required.' });

    const internship = await Internship.create({
      title: title.trim(),
      description,
      skillsRequired,
      location,
      duration,
      deadline,
      company: req.user.id,
    });
    res.status(201).json(internship);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;