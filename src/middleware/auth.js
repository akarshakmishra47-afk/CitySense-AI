const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'citysense_secret_key_123!';

const authMiddleware = (req, res, next) => {
  const token = req.cookies.citysense_token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;
