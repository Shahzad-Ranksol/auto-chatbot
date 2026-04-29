require('dotenv').config({ path: require('path').join(__dirname, '../.env'), override: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// ── File logging ───────────────────────────────────────────────────────────────
const logStream = fs.createWriteStream(path.join(__dirname, '../server.log'), { flags: 'a' });
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  logStream.write(line);
}
process.on('uncaughtException', (err) => { log('UNCAUGHT EXCEPTION: ' + err.stack); process.exit(1); });
process.on('unhandledRejection', (reason) => { log('UNHANDLED REJECTION: ' + reason); });

// ── DB auto-init ───────────────────────────────────────────────────────────────
async function initDB() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = sql
    .split(';')
    .map(s => s.trim())
    // Skip CREATE DATABASE and USE — buyer creates the DB manually on shared hosting
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.toUpperCase().startsWith('CREATE DATABASE') && !s.toUpperCase().startsWith('USE '));
  const conn = await require('./db').getConnection();
  try {
    for (const stmt of statements) await conn.query(stmt);
  } finally {
    conn.release();
  }
}

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
const iconDir = path.join(__dirname, '../public/uploads/icons');
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());

// Strip /auto-chatbot prefix added by cPanel's reverse proxy
app.use((req, res, next) => {
  if (req.url.startsWith('/auto-chatbot')) {
    req.url = req.url.slice('/auto-chatbot'.length) || '/';
  }
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many attempts, please try again later.' } });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: 'Too many messages, slow down.' } });
const apiLimiter  = rateLimit({ windowMs: 60 * 1000, max: 60, message: { error: 'Rate limit exceeded.' } });

// Install route — must be before static files
app.use('/install', require('./routes/install'));

// Static files
app.use(express.static(path.join(__dirname, '../widget')));
app.use(express.static(path.join(__dirname, '../public'), { extensions: ['html'] }));

// Returns the configured public base URL — used by the dashboard to build embed scripts
app.get('/api/config', (req, res) => {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}/auto-chatbot`;
  res.json({ baseUrl });
});

// Live preview page for testing a chatbot widget
app.get('/widget-test/:id', (req, res) => {
  const id = req.params.id;
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}/auto-chatbot`;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Widget Test — AutoChatbot</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;display:flex;flex-direction:column;min-height:100vh}
    .bar{background:#2563eb;color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:15px}
    .bar a{color:rgba(255,255,255,.75);font-size:13px;text-decoration:none;font-weight:400}
    .bar a:hover{color:#fff}
    .content{flex:1;display:flex;align-items:center;justify-content:center;padding:40px 20px}
    .card{background:#fff;border-radius:16px;padding:48px;text-align:center;max-width:520px;width:100%;box-shadow:0 4px 20px rgba(0,0,0,.08)}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:22px;font-weight:700;color:#1e293b;margin:0 0 10px}
    p{font-size:15px;color:#64748b;margin:0 0 28px;line-height:1.6}
    .pill{display:inline-block;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;padding:6px 16px;border-radius:100px;font-size:13px;font-weight:600;margin-bottom:24px}
    code{background:#f1f5f9;padding:3px 8px;border-radius:5px;font-size:12px;color:#374151}
  </style>
</head>
<body>
  <div class="bar">
    🤖 AutoChatbot — Widget Test
    <a href="/auto-chatbot/dashboard.html">← Back to Dashboard</a>
  </div>
  <div class="content">
    <div class="card">
      <div class="icon">🧪</div>
      <div class="pill">Live Preview Mode</div>
      <h1>Your chatbot is running!</h1>
      <p>Click the blue chat bubble in the <strong>bottom-right corner</strong> to open the widget and test it before embedding on your website.</p>
      <p>Chatbot ID: <code>${id}</code></p>
    </div>
  </div>
  <script data-cfasync="false" defer src="${baseUrl}/chatbot.js" data-id="${id}"></script>
</body>
</html>`);
});

// Public routes (no auth — used by the chat widget)
app.use('/chatbot', require('./routes/public'));
app.use('/chat', chatLimiter, require('./routes/chat'));

// Auth
app.use('/auth', authLimiter, require('./routes/auth'));

// Protected API
app.use('/api/chatbots', apiLimiter, require('./routes/chatbots'));
app.use('/api/settings', apiLimiter, require('./routes/settings'));
app.use('/api/admin',    apiLimiter, require('./routes/admin'));

app.get('/health', (req, res) => res.json({ status: 'ok', version: '2.0.0' }));

initDB()
  .then(() => {
    app.listen(PORT, () => log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    log('DB init failed: ' + err.message);
    // Start anyway — DB may already be initialised
    app.listen(PORT, () => log(`Server running on http://localhost:${PORT} (DB init skipped)`));
  });

module.exports = app;
