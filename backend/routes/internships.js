const express = require('express');
const router = express.Router();
const Internship = require('../models/Internship');
const auth = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const internships = await Internship.find().populate('company', 'name email');
    res.json(internships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//company only
router.post('/', auth, async (req, res) => {
  try {
    const internship = await Internship.create({ ...req.body, company: req.user.id });
    res.status(201).json(internship);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;