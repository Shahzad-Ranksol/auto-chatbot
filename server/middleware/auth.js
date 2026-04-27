const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET || 'change-this-secret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
