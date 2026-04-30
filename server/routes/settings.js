const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, (req, res) => {
  try {
    const user = db.users.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password_hash, ...rest } = user;
    if (rest.ai_key) {
      rest.ai_key_preview = '••••••••' + rest.ai_key.slice(-4);
      rest.has_ai_key = true;
    } else {
      rest.ai_key_preview = '';
      rest.has_ai_key = false;
    }
    delete rest.ai_key;
    res.json(rest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', auth, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    db.users.update(req.user.id, { name: name.trim() });
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
    const user = db.users.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    if (db.users.emailTaken(email, req.user.id)) return res.status(409).json({ error: 'Email already in use by another account' });
    db.users.update(req.user.id, { email: email.toLowerCase() });
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
    const user = db.users.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    db.users.update(req.user.id, { password_hash: hash });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

router.put('/ai', auth, (req, res) => {
  const { provider, key } = req.body;
  const allowed = ['none', 'openai', 'gemini'];
  if (!allowed.includes(provider)) return res.status(400).json({ error: 'Invalid provider' });
  if (provider !== 'none' && !key) return res.status(400).json({ error: 'API key is required for this provider' });
  try {
    db.users.update(req.user.id, { ai_provider: provider, ai_key: provider === 'none' ? null : key.trim() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save AI settings' });
  }
});

module.exports = router;
