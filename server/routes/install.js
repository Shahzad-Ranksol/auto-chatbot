const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('../db');

const LOCK_FILE = path.join(__dirname, '../../installed.lock');

const PAGE = (opts) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${opts.title} — ChatBot Pro</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border-radius:20px;padding:48px 40px;max-width:460px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.10)}
    .logo{font-size:40px;text-align:center;margin-bottom:8px}
    h1{font-size:22px;font-weight:700;color:#1e293b;text-align:center;margin-bottom:6px}
    .sub{font-size:14px;color:#64748b;text-align:center;margin-bottom:32px}
    label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px}
    input{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:14px;color:#1e293b;outline:none;margin-bottom:18px;transition:border-color .15s}
    input:focus{border-color:#2563eb}
    button{width:100%;background:#2563eb;color:#fff;border:none;border-radius:10px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;transition:background .15s}
    button:hover{background:#1d4ed8}
    button:disabled{background:#94a3b8;cursor:not-allowed}
    .msg{margin-top:16px;padding:12px 16px;border-radius:10px;font-size:14px;display:none}
    .msg.error{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
    .msg.success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
    .done-icon{font-size:56px;text-align:center;margin-bottom:16px}
    .btn-link{display:inline-block;margin-top:24px;background:#2563eb;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px}
    .cred-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:24px 0 8px;text-align:left}
    .cred-box p{font-size:12px;color:#64748b;margin-bottom:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
    .cred-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .cred-label{font-size:13px;color:#64748b}
    .cred-value{font-size:13px;font-weight:700;color:#1e293b;background:#e2e8f0;padding:3px 10px;border-radius:6px;font-family:monospace;word-break:break-all}
  </style>
</head>
<body>
  <div class="card">${opts.body}</div>
  ${opts.script || ''}
</body>
</html>`;

const INSTALL_FORM = PAGE({
  title: 'Setup',
  body: `
    <div class="logo">🤖</div>
    <h1>ChatBot Pro Setup</h1>
    <p class="sub">Create your admin account to get started.</p>
    <form id="form">
      <label for="name">Full Name</label>
      <input id="name" name="name" type="text" placeholder="Your name" required autocomplete="name"/>
      <label for="email">Email Address</label>
      <input id="email" name="email" type="email" placeholder="admin@example.com" required autocomplete="email"/>
      <label for="password">Password <span style="font-weight:400;color:#94a3b8">(min 6 characters)</span></label>
      <input id="password" name="password" type="password" placeholder="Choose a strong password" required autocomplete="new-password"/>
      <button type="submit" id="btn">Create Admin Account</button>
      <div class="msg" id="msg"></div>
    </form>`,
  script: `<script>
    document.getElementById('form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = document.getElementById('btn');
      const msg = document.getElementById('msg');
      btn.disabled = true; btn.textContent = 'Setting up…';
      msg.style.display = 'none';
      const email = document.getElementById('email').value;
      try {
        const res = await fetch('/install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: document.getElementById('name').value,
            email,
            password: document.getElementById('password').value
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Setup failed');
        msg.className = 'msg success'; msg.textContent = '✅ ' + data.message; msg.style.display = 'block';
        setTimeout(() => { window.location.href = '/install/success?email=' + encodeURIComponent(email); }, 1200);
      } catch(err) {
        msg.className = 'msg error'; msg.textContent = '❌ ' + err.message; msg.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Create Admin Account';
      }
    });
  </script>`
});

function alreadyInstalledPage(loginUrl) {
  return PAGE({
    title: 'Already Installed',
    body: `
      <div class="done-icon">✅</div>
      <h1>Already Installed</h1>
      <p class="sub" style="margin-bottom:0">ChatBot Pro is already set up.<br/>Use the link below to log in.</p>
      <div style="text-align:center"><a class="btn-link" href="${loginUrl}">Go to Login</a></div>`
  });
}

function successPage(email, loginUrl) {
  return PAGE({
    title: 'Setup Complete',
    body: `
      <div class="done-icon">🎉</div>
      <h1>Setup Complete!</h1>
      <p class="sub">Your admin account is ready. Save these credentials now.</p>
      <div class="cred-box">
        <p>Your Login Credentials</p>
        <div class="cred-row">
          <span class="cred-label">Email</span>
          <span class="cred-value">${email}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Password</span>
          <span class="cred-value">the password you entered</span>
        </div>
      </div>
      <div style="text-align:center"><a class="btn-link" href="${loginUrl}">Go to Login →</a></div>`
  });
}

function loginUrl(req) {
  const base = process.env.BASE_URL || '';
  return base ? `${base}/login.html` : '/login.html';
}

router.get('/', (req, res) => {
  if (fs.existsSync(LOCK_FILE)) return res.send(alreadyInstalledPage(loginUrl(req)));
  if (db.users.count() > 0)    return res.send(alreadyInstalledPage(loginUrl(req)));
  res.send(INSTALL_FORM);
});

router.post('/', async (req, res) => {
  if (fs.existsSync(LOCK_FILE)) return res.status(400).json({ error: 'Already installed' });

  const { name, email, password } = req.body || {};
  if (!name || !email || !password)      return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6)               return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email address' });

  try {
    const hash = await bcrypt.hash(password, 10);
    db.users.create({ name: name.trim(), email: email.trim().toLowerCase(), password_hash: hash, is_admin: 1 });
    fs.writeFileSync(LOCK_FILE, new Date().toISOString());
    res.json({ success: true, message: 'Admin account created. Redirecting…' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'An account with that email already exists' });
    res.status(500).json({ error: 'Setup failed: ' + err.message });
  }
});

// Success page — shows the admin their credentials after install
router.get('/success', (req, res) => {
  const email = req.query.email || '';
  res.send(successPage(email, loginUrl(req)));
});

module.exports = router;
