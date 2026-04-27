const express = require('express');
const router = express.Router();
const db = require('../db');

// Used by the widget to fetch chatbot name/config (no auth required)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, website_url, icon FROM chatbots WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Chatbot not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chatbot config' });
  }
});

module.exports = router;
