(function () {
  // Queue-based loader (bundling-proof) takes priority over script tag data-id
  const q = window._cbQ && window._cbQ.length ? window._cbQ.shift() : null;
  let chatbotId, BASE_URL;

  if (q) {
    chatbotId = q.id;
    BASE_URL = q.base;
  } else {
    const script = document.currentScript || (function () {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();
    chatbotId = script.getAttribute('data-id');
    const src = script.src;
    BASE_URL = src.substring(0, src.lastIndexOf('/'));
  }

  if (!chatbotId) return;

  const style = document.createElement('style');
  style.textContent = `
    #cb-root * { box-sizing: border-box; margin: 0; padding: 0; }
    #cb-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

    /* ── Floating button ── */
    #cb-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 60px; height: 60px; border-radius: 50%;
      background: #1e40af; color: #fff; border: none; cursor: pointer;
      font-size: 26px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(30,64,175,.40), 0 1px 4px rgba(0,0,0,.12);
      transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
      overflow: hidden;
    }
    #cb-btn:hover { transform: scale(1.08); box-shadow: 0 8px 28px rgba(30,64,175,.50); }
    #cb-btn img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }

    /* ── Chat window ── */
    #cb-window {
      position: fixed; bottom: 96px; right: 24px; z-index: 9998;
      width: 380px; max-height: 580px;
      border-radius: 20px; background: #fff;
      box-shadow: 0 16px 56px rgba(0,0,0,.16), 0 2px 8px rgba(0,0,0,.06);
      display: flex; flex-direction: column; overflow: hidden;
      transition: opacity .22s ease, transform .22s cubic-bezier(.4,0,.2,1);
    }
    #cb-window.cb-hidden { opacity: 0; pointer-events: none; transform: translateY(18px) scale(0.97); }

    /* ── Header ── */
    #cb-head {
      background: #1e40af; padding: 14px 16px;
      display: flex; align-items: center; gap: 11px; flex-shrink: 0;
    }
    #cb-avatar {
      width: 42px; height: 42px; min-width: 42px; border-radius: 50%;
      background: rgba(255,255,255,.18);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; overflow: hidden; flex-shrink: 0;
    }
    #cb-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    #cb-head-text { flex: 1; min-width: 0; }
    #cb-head-name {
      font-size: 15px; font-weight: 600; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    #cb-head-status { display: flex; align-items: center; gap: 5px; margin-top: 2px; }
    #cb-status-dot {
      width: 7px; height: 7px; background: #4ade80;
      border-radius: 50%; flex-shrink: 0;
      box-shadow: 0 0 0 2px rgba(74,222,128,.3);
    }
    #cb-status-label { font-size: 11px; color: rgba(255,255,255,.72); letter-spacing: .01em; }
    #cb-close-btn {
      width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
      background: rgba(255,255,255,.15); color: rgba(255,255,255,.9);
      font-size: 15px; display: flex; align-items: center; justify-content: center;
      transition: background .15s; flex-shrink: 0; line-height: 1;
    }
    #cb-close-btn:hover { background: rgba(255,255,255,.28); }

    /* ── Messages ── */
    #cb-msgs {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
      background: #f8fafc;
    }
    #cb-msgs::-webkit-scrollbar { width: 4px; }
    #cb-msgs::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

    .cb-bubble {
      max-width: 80%; padding: 10px 14px;
      font-size: 14px; line-height: 1.55; word-break: break-word;
    }
    .cb-bubble.user {
      background: #1e40af; color: #fff;
      border-radius: 18px 18px 4px 18px; align-self: flex-end;
    }
    .cb-bubble.bot {
      background: #fff; color: #1e293b;
      border-radius: 18px 18px 18px 4px; align-self: flex-start;
      box-shadow: 0 1px 6px rgba(0,0,0,.08);
    }

    /* ── Typing indicator ── */
    .cb-typing {
      display: flex; gap: 5px; align-items: center;
      padding: 12px 16px; background: #fff;
      border-radius: 18px 18px 18px 4px; align-self: flex-start;
      box-shadow: 0 1px 6px rgba(0,0,0,.08);
    }
    .cb-typing span {
      width: 7px; height: 7px; background: #94a3b8; border-radius: 50%;
      animation: cb-bounce 1.3s infinite ease-in-out; display: block;
    }
    .cb-typing span:nth-child(2) { animation-delay: .18s; }
    .cb-typing span:nth-child(3) { animation-delay: .36s; }
    @keyframes cb-bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: .4; }
      30% { transform: translateY(-5px); opacity: 1; }
    }

    /* ── Input area ── */
    #cb-foot {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; border-top: 1px solid #f1f5f9;
      background: #fff; flex-shrink: 0;
    }
    #cb-input {
      flex: 1; border: 1.5px solid #e8edf3; border-radius: 22px;
      padding: 9px 16px; font-size: 14px; outline: none;
      background: #f8fafc; color: #1e293b; font-family: inherit;
      transition: border-color .18s, background .18s;
    }
    #cb-input:focus { border-color: #1e40af; background: #fff; }
    #cb-input::placeholder { color: #94a3b8; }
    #cb-send {
      width: 38px; height: 38px; min-width: 38px; border-radius: 50%;
      background: #1e40af; color: #fff; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .18s, transform .15s; flex-shrink: 0;
    }
    #cb-send:hover:not(:disabled) { background: #1d4ed8; transform: scale(1.06); }
    #cb-send:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; }

    /* ── Branding footer ── */
    #cb-brand {
      text-align: center; padding: 5px 12px 7px;
      font-size: 11px; color: #c8d3df; background: #fff;
      border-top: 1px solid #f8fafc; flex-shrink: 0;
    }

    @media (max-width: 440px) {
      #cb-window { width: calc(100vw - 16px); right: 8px; bottom: 88px; }
    }
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'cb-root';
  root.innerHTML = `
    <div id="cb-window" class="cb-hidden">
      <div id="cb-head">
        <div id="cb-avatar"></div>
        <div id="cb-head-text">
          <div id="cb-head-name">Support</div>
          <div id="cb-head-status">
            <span id="cb-status-dot"></span>
            <span id="cb-status-label">Online · ready to help</span>
          </div>
        </div>
        <button id="cb-close-btn" title="Close chat">✕</button>
      </div>
      <div id="cb-msgs"></div>
      <div id="cb-foot">
        <input id="cb-input" type="text" placeholder="Type a message…" autocomplete="off" />
        <button id="cb-send" title="Send">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div id="cb-brand">Powered by ChatBot Pro</div>
    </div>
    <button id="cb-btn" title="Chat with us"></button>
  `;
  document.body.appendChild(root);

  const win      = document.getElementById('cb-window');
  const btn      = document.getElementById('cb-btn');
  const msgs     = document.getElementById('cb-msgs');
  const input    = document.getElementById('cb-input');
  const send     = document.getElementById('cb-send');
  const nameEl   = document.getElementById('cb-head-name');
  const avatarEl = document.getElementById('cb-avatar');
  const closeBtn = document.getElementById('cb-close-btn');

  let open = false;
  let botIcon = '💬';

  function applyIcon(icon) {
    botIcon = icon || '💬';
    if (botIcon.startsWith('/')) botIcon = BASE_URL + botIcon;
    const isUrl = botIcon.startsWith('http');
    const imgTag = `<img src="${botIcon}" alt="" />`;
    avatarEl.innerHTML = isUrl ? imgTag : botIcon;
    if (!open) btn.innerHTML = isUrl ? imgTag : botIcon;
  }

  fetch(`${BASE_URL}/chatbot/${chatbotId}`)
    .then(r => r.json())
    .then(cfg => {
      if (cfg.name) nameEl.textContent = cfg.name;
      applyIcon(cfg.icon);
      addMsg('bot', `Hi! I'm the ${cfg.name || 'support'} assistant. How can I help you today?`);
    })
    .catch(() => {
      applyIcon('💬');
      addMsg('bot', 'Hi! How can I help you today?');
    });

  function toggleOpen(forceClose) {
    open = forceClose ? false : !open;
    win.classList.toggle('cb-hidden', !open);
    if (open) {
      btn.innerHTML = '✕';
      btn.style.fontSize = '20px';
      input.focus();
    } else {
      btn.style.fontSize = '';
      applyIcon(botIcon);
    }
  }

  btn.addEventListener('click', () => toggleOpen());
  closeBtn.addEventListener('click', () => toggleOpen(true));

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });
  send.addEventListener('click', sendMsg);

  function renderText(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function addMsg(role, text) {
    const el = document.createElement('div');
    el.className = `cb-bubble ${role}`;
    el.innerHTML = renderText(text);
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'cb-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  async function sendMsg() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    send.disabled = true;
    addMsg('user', text);
    const typing = showTyping();
    try {
      const res = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatbotId, message: text })
      });
      const data = await res.json();
      typing.remove();
      addMsg('bot', data.reply || 'Sorry, something went wrong.');
    } catch {
      typing.remove();
      addMsg('bot', 'Connection error. Please try again.');
    }
    send.disabled = false;
    input.focus();
  }
})();
