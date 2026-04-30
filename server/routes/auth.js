const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SECRET = process.env.JWT_SECRET || 'change-this-secret';
const sign = (user) => jwt.sign({ id: user.id, email: user.email, is_admin: !!user.is_admin }, SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { id } = db.users.create({ name, email, password_hash: hash });
    const user = { id, name: name || '', email: email.toLowerCase().trim() };
    res.status(201).json({ token: sign(user), user });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const row = db.users.findByEmail(email);
    if (!row) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const { password_hash, ...user } = row;
    res.json({ token: sign(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
