const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role domain batch status');
    if (!user) return res.status(401).json({ error: 'Invalid or expired token.' });
    if (user.status === 'revoked') return res.status(403).json({ error: 'Your access has been revoked.' });

    req.user = {
      id: user._id.toString(),
      role: user.role,
      domain: user.domain,
      batch: user.batch,
      status: user.status,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};