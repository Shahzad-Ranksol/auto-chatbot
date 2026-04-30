const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { randomUUID: uuidv4 } = require('crypto');
const auth = require('../middleware/auth');
const db = require('../db');
const { parseFile } = require('../services/fileParser');

const iconDir = path.join(__dirname, '../../public/uploads/icons');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'iconFile') {
      if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });
      cb(null, iconDir);
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.fieldname === 'iconFile') {
      const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      return allowed.includes(ext) ? cb(null, true) : cb(new Error('Only PNG, JPG, GIF, WEBP allowed for icon'));
    }
    const allowed = ['.pdf', '.csv', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only PDF, CSV, and TXT files are allowed'));
  }
});

const uploadFields = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'iconFile', maxCount: 1 }
]);

router.get('/', auth, (req, res) => {
  try {
    res.json(db.chatbots.findByUser(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chatbots' });
  }
});

router.get('/:id/messages', auth, (req, res) => {
  try {
    const chatbot = db.chatbots.findByIdAndUser(req.params.id, req.user.id);
    if (!chatbot) return res.status(404).json({ error: 'Chatbot not found' });
    res.json(db.messages.findByChatbot(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.delete('/:id/messages', auth, (req, res) => {
  try {
    const chatbot = db.chatbots.findByIdAndUser(req.params.id, req.user.id);
    if (!chatbot) return res.status(404).json({ error: 'Chatbot not found' });
    db.messages.deleteByChatbot(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

router.post('/', auth, uploadFields, async (req, res) => {
  const { name, websiteUrl, knowledgeBase } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  let kb = knowledgeBase || '';
  const kbFile   = req.files?.['file']?.[0];
  const iconFile = req.files?.['iconFile']?.[0];

  if (kbFile) {
    try {
      const extracted = await parseFile(kbFile.path, kbFile.originalname);
      kb = kb ? `${kb}\n\n---\n\n${extracted}` : extracted;
    } catch (err) {
      fs.unlinkSync(kbFile.path);
      if (iconFile) fs.unlinkSync(iconFile.path);
      return res.status(400).json({ error: err.message });
    }
    fs.unlinkSync(kbFile.path);
  }

  const icon = iconFile ? `/uploads/icons/${iconFile.filename}` : (req.body.icon || '💬');

  try {
    const id = uuidv4();
    db.chatbots.create({ id, user_id: req.user.id, name, website_url: websiteUrl || null, knowledge_base: kb || null, icon });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({
      id, name, websiteUrl, icon,
      script: `<script data-cfasync="false" defer src="${baseUrl}/chatbot.js" data-id="${id}"></script>`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create chatbot' });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const chatbot = db.chatbots.findByIdAndUser(req.params.id, req.user.id);
    if (!chatbot) return res.status(404).json({ error: 'Chatbot not found' });
    res.json(chatbot);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chatbot' });
  }
});

router.put('/:id', auth, uploadFields, async (req, res) => {
  try {
    const existing = db.chatbots.findByIdAndUser(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Chatbot not found' });

    const name       = req.body.name || existing.name;
    const websiteUrl = req.body.websiteUrl !== undefined ? req.body.websiteUrl : existing.website_url;
    let   kb         = req.body.knowledgeBase !== undefined ? req.body.knowledgeBase : (existing.knowledge_base || '');

    const kbFile   = req.files?.['file']?.[0];
    const iconFile = req.files?.['iconFile']?.[0];

    if (kbFile) {
      try {
        const extracted = await parseFile(kbFile.path, kbFile.originalname);
        kb = kb ? `${kb}\n\n---\n\n${extracted}` : extracted;
      } catch (err) {
        fs.unlinkSync(kbFile.path);
        if (iconFile) fs.unlinkSync(iconFile.path);
        return res.status(400).json({ error: err.message });
      }
      fs.unlinkSync(kbFile.path);
    }

    const icon = iconFile
      ? `/uploads/icons/${iconFile.filename}`
      : (req.body.icon !== undefined ? req.body.icon : (existing.icon || '💬'));

    db.chatbots.update(req.params.id, { name, website_url: websiteUrl || null, knowledge_base: kb || null, icon });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update chatbot' });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const deleted = db.chatbots.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Chatbot not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete chatbot' });
  }
});

router.get('/:id/script', auth, (req, res) => {
  try {
    const chatbot = db.chatbots.findByIdAndUser(req.params.id, req.user.id);
    if (!chatbot) return res.status(404).json({ error: 'Chatbot not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const { id, name } = chatbot;
    const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} — Chatbot Demo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #fff; border-radius: 16px; padding: 48px 40px; text-align: center; max-width: 480px; width: 90%; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 10px; }
    p { font-size: 15px; color: #64748b; line-height: 1.6; margin-bottom: 8px; }
    .arrow { margin-top: 24px; display: inline-flex; align-items: center; gap: 8px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 8px 18px; border-radius: 100px; font-size: 13px; font-weight: 600; }
    code { display: block; margin-top: 28px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #475569; text-align: left; word-break: break-all; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🤖</div>
    <h1>${name} Chatbot</h1>
    <p>Your chatbot is live and ready. Click the chat button in the <strong>bottom-right corner</strong> to start a conversation.</p>
    <p>Copy the snippet below into any webpage to embed this chatbot.</p>
    <div class="arrow">👇 Chat button — bottom right</div>
    <code>&lt;script data-cfasync="false" defer src="${baseUrl}/chatbot.js" data-id="${id}"&gt;&lt;/script&gt;</code>
  </div>
  <script data-cfasync="false" defer src="${baseUrl}/chatbot.js" data-id="${id}"></script>
</body>
</html>`;
    res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/\s+/g, '-').toLowerCase()}-chatbot.html"`);
    res.setHeader('Content-Type', 'text/html');
    res.send(content);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

module.exports = router;
