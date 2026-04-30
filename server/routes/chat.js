const express = require('express');
const router = express.Router();
const db = require('../db');
const { smartEcho } = require('../services/echoBot');

router.post('/', async (req, res) => {
  const { chatbotId, message } = req.body;
  if (!chatbotId || !message) return res.status(400).json({ error: 'chatbotId and message are required' });

  try {
    const chatbot = db.chatbots.findByIdWithOwner(chatbotId);
    if (!chatbot) return res.status(404).json({ error: 'Chatbot not found' });

    const context  = chatbot.knowledge_base || '';
    const provider = chatbot.ai_provider;
    const key      = chatbot.ai_key;

    let reply;

    if (provider === 'openai' && key) {
      try {
        const { generateAIResponse } = require('../services/openai');
        reply = await generateAIResponse(message, context, chatbot.name, key);
      } catch (err) {
        console.error('OpenAI error:', err.message);
        reply = smartEcho(message, context, chatbot.name);
      }
    } else if (provider === 'gemini' && key) {
      try {
        const { generateGeminiResponse } = require('../services/gemini');
        reply = await generateGeminiResponse(message, context, chatbot.name, key);
      } catch (err) {
        console.error('Gemini error:', err.message);
        reply = smartEcho(message, context, chatbot.name);
      }
    } else if (process.env.OPENAI_API_KEY) {
      try {
        const { generateAIResponse } = require('../services/openai');
        reply = await generateAIResponse(message, context, chatbot.name, process.env.OPENAI_API_KEY);
      } catch (err) {
        console.error('OpenAI (server key) error:', err.message);
        reply = smartEcho(message, context, chatbot.name);
      }
    } else {
      reply = smartEcho(message, context, chatbot.name);
    }

    db.messages.create({ chatbot_id: chatbotId, user_message: message, bot_reply: reply });
    res.json({ reply, chatbotId, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

module.exports = router;
