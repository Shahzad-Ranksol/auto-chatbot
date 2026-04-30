const express = require('express');
const router = express.Router();
const db = require('../db');

// Used by the widget to fetch chatbot name/config (no auth required)
router.get('/:id', (req, res) => {
  try {
    const chatbot = db.chatbots.findById(req.params.id);
    if (!chatbot) return res.status(404).json({ error: 'Chatbot not found' });
    const { id, name, website_url, icon } = chatbot;
    res.json({ id, name, website_url, icon });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chatbot config' });
  }
});

module.exports = router;
