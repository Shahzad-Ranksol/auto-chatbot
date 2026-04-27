const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const db = require('../db');

// All admin routes require auth + admin flag
router.use(auth, (req, res, next) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
});

// List all users with chatbot + message counts
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT u.id, u.name, u.email, u.ai_provider, u.is_admin,
        CASE WHEN u.ai_key IS NOT NULL AND u.ai_key != '' THEN 1 ELSE 0 END AS has_ai_key,
        u.created_at,
        COUNT(DISTINCT c.id)  AS chatbot_count,
        COUNT(DISTINCT m.id)  AS message_count
      FROM users u
      LEFT JOIN chatbots c ON c.user_id = u.id
      LEFT JOIN messages m ON m.chatbot_id = c.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user account
router.post('/users', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name?.trim() || '', email.toLowerCase().trim(), hash]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete a user (cannot delete self or other admins)
router.delete('/users/:id', async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  try {
    const [rows] = await db.execute('SELECT is_admin FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    if (rows[0].is_admin) return res.status(400).json({ error: 'Cannot delete another admin' });
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
