'use strict';

const BASE = '/auto-chatbot';
const token = localStorage.getItem('token');
if (!token) window.location.replace(BASE + '/login.html');

const user = JSON.parse(localStorage.getItem('user') || '{}');
document.getElementById('user-name-display').textContent = user.name || user.email || '';
document.getElementById('user-avatar').textContent = (user.name || user.email || '?')[0].toUpperCase();

// ── STATE ──────────────────────────────────────
let editingId = null;
let deleteTargetId = null;
let scriptTargetId = null;
let convoTargetId = null;
let allBots = [];
let selectedIcon = '💬';
let iconFileSelected = false;

const PRESET_ICONS = ['💬','🤖','🎯','💡','🛍️','🏪','🏥','🍕','✈️','🏋️','💻','📱','🎓','🏦','🔧','🌟','👋','🛒','🎁','🚀'];

// ── API ────────────────────────────────────────
async function authFetch(method, url, body) {
  const opts = { method, headers: { Authorization: `Bearer ${token}` } };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── TOAST ──────────────────────────────────────
function toast(msg, type = '') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${msg}`;
  c.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('visible')));
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 400); }, 3200);
}

// ── MODAL ──────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function backdropClose(e, id) { if (e.target === document.getElementById(id)) closeModal(id); }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') ['modal', 'script-modal', 'delete-modal', 'convo-modal'].forEach(closeModal);
});

// ── AUTH ───────────────────────────────────────
function logout() { localStorage.clear(); window.location.replace(BASE + '/login.html'); }

// ── LOAD ───────────────────────────────────────
async function loadChatbots() {
  try {
    allBots = await authFetch('GET', BASE + '/api/chatbots');
    renderGrid();
    updateStats();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function updateStats() {
  document.getElementById('stat-total').textContent = allBots.length;
  const totalMsgs = allBots.reduce((s, b) => s + (Number(b.message_count) || 0), 0);
  document.getElementById('stat-messages').textContent = totalMsgs;
  const statusEl  = document.getElementById('stat-status');
  const statusSub = document.getElementById('stat-status-sub');
  if (allBots.length === 0) {
    statusEl.textContent  = '⚪ None';
    statusSub.textContent = 'no chatbots yet';
  } else {
    statusEl.textContent  = '🟢 All Live';
    statusSub.textContent = `${allBots.length} chatbot${allBots.length !== 1 ? 's' : ''} active`;
  }
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderGrid() {
  const grid = document.getElementById('chatbot-grid');
  if (!allBots.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🤖</span>
        <h3 class="empty-title">No chatbots yet</h3>
        <p class="empty-desc">Create your first AI chatbot and paste one line of code onto any website — it works instantly.</p>
        <button class="btn btn-primary btn-lg" onclick="openCreateModal()">Create My First Chatbot</button>
      </div>`;
    return;
  }

  grid.innerHTML = allBots.map(bot => {
    const msgCount = Number(bot.message_count) || 0;
    const isIconUrl = bot.icon && (bot.icon.startsWith('/') || bot.icon.startsWith('http'));
    const cardIcon = isIconUrl
      ? `<img src="${esc(bot.icon)}" style="width:26px;height:26px;border-radius:50%;object-fit:cover" />`
      : (bot.icon || '🤖');
    return `
    <div class="chatbot-card" id="card-${bot.id}">
      <div class="card-header">
        <div class="card-icon">${cardIcon}</div>
        <div class="card-info">
          <h3 class="card-name">${esc(bot.name)}</h3>
          ${bot.website_url
            ? `<a class="card-url" href="${esc(bot.website_url)}" target="_blank" rel="noopener">${esc(bot.website_url)}</a>`
            : `<span class="card-no-url">No website URL</span>`}
        </div>
        <span class="card-badge">Live</span>
      </div>
      <div class="card-meta">
        <span>🕒 ${timeAgo(bot.created_at)}</span>
        <span class="card-divider"></span>
        <span>💬 ${msgCount} message${msgCount !== 1 ? 's' : ''}</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-ghost btn-sm" onclick="openEditModal('${bot.id}')">✏️ Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="showScript('${bot.id}','${esc(bot.name)}')">📋 Script</button>
        <button class="btn btn-ghost btn-sm" onclick="testWidget('${bot.id}')">🧪 Test</button>
        <button class="btn btn-ghost btn-sm" onclick="openConvos('${bot.id}','${esc(bot.name)}')">💬 History</button>
        <button class="btn btn-danger btn-sm" onclick="askDelete('${bot.id}','${esc(bot.name)}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

// ── ICON PICKER ────────────────────────────────
function renderIconGrid(currentIcon) {
  selectedIcon = currentIcon || '💬';
  const isUpload = selectedIcon.startsWith('/') || selectedIcon.startsWith('http');
  document.getElementById('icon-grid').innerHTML = PRESET_ICONS.map(ic =>
    `<button type="button" class="icon-opt${(!isUpload && ic === selectedIcon) ? ' selected' : ''}" onclick="pickIcon('${ic}')">${ic}</button>`
  ).join('');
  if (isUpload) {
    document.getElementById('f-icon-img').src = selectedIcon;
    document.getElementById('f-icon-preview').style.display = 'flex';
  }
}

function pickIcon(icon) {
  selectedIcon = icon;
  iconFileSelected = false;
  document.getElementById('f-icon').value = '';
  document.getElementById('f-icon-preview').style.display = 'none';
  document.querySelectorAll('.icon-opt').forEach(el =>
    el.classList.toggle('selected', el.textContent === icon)
  );
}

function onIconChosen(input) {
  const file = input.files[0];
  if (!file) return;
  iconFileSelected = true;
  selectedIcon = null;
  document.querySelectorAll('.icon-opt').forEach(el => el.classList.remove('selected'));
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('f-icon-img').src = e.target.result;
    document.getElementById('f-icon-preview').style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

function clearIconFile() {
  document.getElementById('f-icon').value = '';
  document.getElementById('f-icon-preview').style.display = 'none';
  document.getElementById('f-icon-img').src = '';
  iconFileSelected = false;
  selectedIcon = '💬';
  document.querySelectorAll('.icon-opt').forEach(el =>
    el.classList.toggle('selected', el.textContent === '💬')
  );
}

// ── CREATE ─────────────────────────────────────
function openCreateModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Create New Chatbot';
  document.getElementById('btn-save').textContent = 'Create Chatbot';
  document.getElementById('f-name').value = '';
  document.getElementById('f-url').value = '';
  document.getElementById('f-kb').value = '';
  document.getElementById('modal-error').style.display = 'none';
  clearFile();
  iconFileSelected = false;
  renderIconGrid('💬');
  document.getElementById('f-icon-preview').style.display = 'none';
  openModal('modal');
  setTimeout(() => document.getElementById('f-name').focus(), 120);
}

// ── EDIT ───────────────────────────────────────
async function openEditModal(id) {
  try {
    const bot = await authFetch('GET', `${BASE}/api/chatbots/${id}`);
    editingId = id;
    document.getElementById('modal-title').textContent = 'Edit Chatbot';
    document.getElementById('btn-save').textContent = 'Save Changes';
    document.getElementById('f-name').value = bot.name || '';
    document.getElementById('f-url').value = bot.website_url || '';
    document.getElementById('f-kb').value = bot.knowledge_base || '';
    document.getElementById('modal-error').style.display = 'none';
    clearFile();
    iconFileSelected = false;
    renderIconGrid(bot.icon || '💬');
    openModal('modal');
    setTimeout(() => document.getElementById('f-name').focus(), 120);
  } catch (err) { toast(err.message, 'error'); }
}

// ── SAVE ───────────────────────────────────────
async function saveChatbot() {
  const name = document.getElementById('f-name').value.trim();
  const url  = document.getElementById('f-url').value.trim();
  const kb   = document.getElementById('f-kb').value.trim();
  const file = document.getElementById('f-file').files[0];
  const errEl = document.getElementById('modal-error');
  const btn   = document.getElementById('btn-save');

  errEl.style.display = 'none';
  if (!name) { errEl.textContent = 'Business name is required.'; errEl.style.display = 'block'; return; }

  const saved = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>&nbsp; Saving…';

  try {
    const form = new FormData();
    form.append('name', name);
    if (url) form.append('websiteUrl', url);
    form.append('knowledgeBase', kb);
    if (file) form.append('file', file);
    if (iconFileSelected) {
      const iconFile = document.getElementById('f-icon').files[0];
      if (iconFile) form.append('iconFile', iconFile);
    } else {
      form.append('icon', selectedIcon || '💬');
    }

    const res = await fetch(editingId ? `${BASE}/api/chatbots/${editingId}` : BASE + '/api/chatbots', {
      method: editingId ? 'PUT' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    closeModal('modal');
    await loadChatbots();
    toast(editingId ? 'Chatbot updated!' : 'Chatbot created!', 'success');
    if (!editingId && data.id) setTimeout(() => showScript(data.id, name), 600);
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = saved;
  }
}

// ── DELETE ─────────────────────────────────────
function askDelete(id, name) {
  deleteTargetId = id;
  document.getElementById('delete-name').textContent = `"${name}"`;
  openModal('delete-modal');
}

async function confirmDelete() {
  const btn = document.getElementById('btn-confirm-delete');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>&nbsp; Deleting…';
  try {
    await authFetch('DELETE', `${BASE}/api/chatbots/${deleteTargetId}`);
    closeModal('delete-modal');
    await loadChatbots();
    toast('Chatbot deleted.', 'success');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
}

// ── SCRIPT ─────────────────────────────────────
let _baseUrl = window.location.origin;
fetch(BASE + '/api/config').then(r => r.json()).then(cfg => { _baseUrl = cfg.baseUrl; }).catch(() => {});

function showScript(id, name) {
  scriptTargetId = id;
  const code = `<!-- ${name} Chatbot Widget -->\n<script>(function(){var b='${_baseUrl}';window._cbQ=window._cbQ||[];window._cbQ.push({id:'${id}',base:b});if(!window._cbS){window._cbS=1;var s=document.createElement('script');s.src=b+'/chatbot.js';document.head.appendChild(s);}})();<\/script>`;
  document.getElementById('script-code').textContent = code;
  openModal('script-modal');
}

async function copyScript() {
  const text = document.getElementById('script-code').textContent;
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard!', 'success');
  } catch {
    toast('Select the code and copy manually.', 'info');
  }
}

async function downloadScript() {
  if (!scriptTargetId) return;
  try {
    const res = await fetch(`${BASE}/api/chatbots/${scriptTargetId}/script`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chatbot-widget.html';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Script downloaded!', 'success');
  } catch (err) { toast(err.message, 'error'); }
}

// ── CONVERSATIONS ──────────────────────────────
async function openConvos(id, name) {
  convoTargetId = id;
  document.getElementById('convo-title').textContent = `💬 ${name} — Chat History`;
  document.getElementById('convo-body').innerHTML = `<div class="page-loader"><div class="spin"></div> Loading…</div>`;
  openModal('convo-modal');
  try {
    const msgs = await authFetch('GET', `${BASE}/api/chatbots/${id}/messages`);
    renderConvos(msgs);
  } catch (err) {
    document.getElementById('convo-body').innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
  }
}

function renderConvos(msgs) {
  if (!msgs.length) {
    document.getElementById('convo-body').innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--muted)">
        <div style="font-size:32px;margin-bottom:12px">💬</div>
        <div>No conversations yet. Share your embed script to start receiving messages.</div>
      </div>`;
    return;
  }

  document.getElementById('convo-body').innerHTML = msgs.map(m => `
    <div style="border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <span style="font-size:12px;background:var(--primary-light);color:var(--primary);padding:2px 8px;border-radius:100px;font-weight:600">User</span>
        <span style="font-size:11px;color:#94a3b8">${timeAgo(m.created_at)}</span>
      </div>
      <p style="font-size:14px;margin:0 0 10px;color:var(--text)">${esc(m.user_message)}</p>
      <div style="display:flex;align-items:flex-start;gap:8px">
        <span style="font-size:12px;background:#f0fdf4;color:#15803d;padding:2px 8px;border-radius:100px;font-weight:600;white-space:nowrap">Bot</span>
        <p style="font-size:14px;margin:0;color:var(--muted)">${esc(m.bot_reply)}</p>
      </div>
    </div>`).join('');
}

async function clearHistory() {
  if (!confirm('Clear all chat history for this chatbot? This cannot be undone.')) return;
  try {
    await authFetch('DELETE', `${BASE}/api/chatbots/${convoTargetId}/messages`);
    document.getElementById('convo-body').innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--muted)">
        <div style="font-size:32px;margin-bottom:12px">✅</div>
        <div>History cleared.</div>
      </div>`;
    await loadChatbots();
    toast('Chat history cleared.', 'success');
  } catch (err) { toast(err.message, 'error'); }
}

// ── FILE UPLOAD ─────────────────────────────────
function onFileChosen(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('f-drop-zone').style.display = 'none';
  document.getElementById('f-file-name').textContent = file.name;
  document.getElementById('f-file-info').style.display = 'flex';
}

function clearFile() {
  document.getElementById('f-file').value = '';
  document.getElementById('f-drop-zone').style.display = 'block';
  document.getElementById('f-file-info').style.display = 'none';
}

function dragOver(e) { e.preventDefault(); document.getElementById('f-drop-zone').classList.add('dragover'); }
function dragLeave() { document.getElementById('f-drop-zone').classList.remove('dragover'); }

function dropFile(e) {
  e.preventDefault(); dragLeave();
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const input = document.getElementById('f-file');
  const dt = new DataTransfer(); dt.items.add(file);
  input.files = dt.files;
  onFileChosen(input);
}

// ── TEST WIDGET ────────────────────────────────
function testWidget(id) {
  window.open(`${BASE}/widget-test/${id}`, '_blank');
}

// ── AI STATUS ──────────────────────────────────
async function loadAIStatus() {
  try {
    const data = await authFetch('GET', BASE + '/api/settings');
    const el  = document.getElementById('stat-ai');
    const sub = document.getElementById('stat-ai-sub');
    if (data.ai_provider === 'openai' && data.has_ai_key) {
      el.textContent  = '🟢 OpenAI';
      sub.textContent = 'GPT-4o mini · active';
    } else if (data.ai_provider === 'gemini' && data.has_ai_key) {
      el.textContent  = '🔵 Gemini';
      sub.textContent = '2.0 Flash · active';
    } else {
      el.textContent  = '⚪ Echo Mode';
      sub.innerHTML   = `<a href="${BASE}/settings.html" style="color:var(--primary)">Configure in Settings →</a>`;
    }
  } catch {}
}

// ── INIT ───────────────────────────────────────
loadChatbots();
loadAIStatus();
