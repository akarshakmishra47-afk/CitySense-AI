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
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    let user = await User.findOne({ email });

    // --- HACKATHON DEMO FALLBACK ---
    // If the judges use the exact demo credentials but the database wasn't seeded,
    // we create the accounts on the fly so the demo never fails.
    if (!user && password === '123456') {
      if (email === 'state@123') {
        const hashedPassword = await bcrypt.hash('123456', 10);
        user = await User.create({ name: 'State Chief Admin', email: 'state@123', password: hashedPassword, role: 'admin_state', state: 'Uttar Pradesh', municipalCorp: null, ward: null });
      } else if (email === 'admin@123') {
        const hashedPassword = await bcrypt.hash('123456', 10);
        user = await User.create({ name: 'Lucknow Commissioner', email: 'admin@123', password: hashedPassword, role: 'admin_city', state: 'Uttar Pradesh', municipalCorp: 'Lucknow', ward: null });
      } else if (email === 'ward@123') {
        const hashedPassword = await bcrypt.hash('123456', 10);
        user = await User.create({ name: 'Ward Engineer (1)', email: 'ward@123', password: hashedPassword, role: 'admin_ward', state: 'Uttar Pradesh', municipalCorp: 'Lucknow', ward: '1' });
      } else if (email === 'citizen@123') {
        const hashedPassword = await bcrypt.hash('123456', 10);
        user = await User.create({ name: 'Demo Citizen', email: 'citizen@123', password: hashedPassword, role: 'citizen', state: 'Uttar Pradesh', municipalCorp: 'Lucknow', ward: '1' });
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create JWT
    const token = jwt.sign(
      { 
        id: user._id || user.id, 
        role: user.role, 
        name: user.name, 
        email: user.email,
        state: user.state,
        municipalCorp: user.municipalCorp,
        ward: user.ward
      },
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
