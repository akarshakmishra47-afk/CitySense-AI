const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret for JWT (should be in .env for prod)
const JWT_SECRET = process.env.JWT_SECRET || 'citysense_secret_key_123!';

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // --- HACKATHON MVP BYPASS ---
    // Instantly log in any user without checking database or password
    const role = (email && email.toLowerCase().includes('admin')) ? 'admin' : 'citizen';
    const name = role === 'admin' ? 'City Authority' : 'Citizen User';
    const safeEmail = email || (role === 'admin' ? 'admin@citysense.ai' : 'demo@citysense.ai');

    // Create JWT
    const token = jwt.sign(
      { id: '64f7b2c9e4b0a1b2c3d4e5f6', role, name, email: safeEmail }, // Mock valid Mongo ObjectID
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set HTTP-only cookie
    res.cookie('citysense_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ success: true, role, name });
  } catch (error) {
    next(error);
  }
});
// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "citizen"
    });

    // Create JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set HTTP-only cookie
    res.cookie('citysense_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ success: true, role: user.role, name: user.name });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const token = req.cookies.citysense_token;
  
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      authenticated: true,
      user: decoded
    });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('citysense_token');
  res.json({ success: true });
});

module.exports = router;
