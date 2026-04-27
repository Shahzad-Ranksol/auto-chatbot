const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, ai_provider, ai_key, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    // Mask the key — only return last 4 chars
    const user = rows[0];
    if (user.ai_key) {
      user.ai_key_preview = '••••••••' + user.ai_key.slice(-4);
      user.has_ai_key = true;
    } else {
      user.ai_key_preview = '';
      user.has_ai_key = false;
    }
    delete user.ai_key;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', auth, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    await db.execute('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.put('/email', auth, async (req, res) => {
  const { email, currentPassword } = req.body;
  if (!email || !currentPassword) return res.status(400).json({ error: 'Email and password are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email address' });
  try {
    const [rows] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const [taken] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase(), req.user.id]);
    if (taken.length) return res.status(409).json({ error: 'Email already in use by another account' });
    await db.execute('UPDATE users SET email = ? WHERE id = ?', [email.toLowerCase(), req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update email' });
  }
});

router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  try {
    const [rows] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

router.put('/ai', auth, async (req, res) => {
  const { provider, key } = req.body;
  const allowed = ['none', 'openai', 'gemini'];
  if (!allowed.includes(provider)) return res.status(400).json({ error: 'Invalid provider' });
  if (provider !== 'none' && !key) return res.status(400).json({ error: 'API key is required for this provider' });
  try {
    await db.execute(
      'UPDATE users SET ai_provider = ?, ai_key = ? WHERE id = ?',
      [provider, provider === 'none' ? null : key.trim(), req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save AI settings' });
  }
});


module.exports = router;
