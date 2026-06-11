const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const auth = require('../middleware/authMiddleware');
 
//for apply
router.post('/', auth, async (req, res) => {
  try {
    const application = await Application.create({ ...req.body, student: req.user.id });
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//for getting application
router.get('/my', auth, async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user.id }).populate('internship');
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;