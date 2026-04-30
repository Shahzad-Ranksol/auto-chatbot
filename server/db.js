const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH  = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(DB_PATH)) return { users: [], chatbots: [], messages: [] };
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { users: [], chatbots: [], messages: [] }; }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function nextUserId(data) {
  return data.users.length ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
}

function nextMsgId(data) {
  return data.messages.length ? Math.max(...data.messages.map(m => m.id)) + 1 : 1;
}

const db = {

  // ── Users ───────────────────────────────────────────────────────────────────

  users: {
    count() {
      return load().users.length;
    },
    findById(id) {
      return load().users.find(u => u.id === Number(id)) || null;
    },
    findByEmail(email) {
      return load().users.find(u => u.email === email.toLowerCase().trim()) || null;
    },
    emailTaken(email, excludeId) {
      return load().users.some(u => u.email === email.toLowerCase() && u.id !== Number(excludeId));
    },
    create({ name, email, password_hash, is_admin = 0 }) {
      const data = load();
      if (data.users.some(u => u.email === email.toLowerCase().trim())) {
        const err = new Error('UNIQUE constraint failed: users.email');
        err.code = 'SQLITE_CONSTRAINT_UNIQUE';
        throw err;
      }
      const id = nextUserId(data);
      data.users.push({
        id,
        name: name || '',
        email: email.toLowerCase().trim(),
        password_hash,
        ai_provider: 'none',
        ai_key: null,
        is_admin: is_admin ? 1 : 0,
        created_at: new Date().toISOString()
      });
      save(data);
      return { id };
    },
    update(id, fields) {
      const data = load();
      const i = data.users.findIndex(u => u.id === Number(id));
      if (i === -1) return;
      data.users[i] = { ...data.users[i], ...fields };
      save(data);
    },
    delete(id) {
      const data = load();
      const chatbotIds = data.chatbots.filter(c => c.user_id === Number(id)).map(c => c.id);
      data.users    = data.users.filter(u => u.id !== Number(id));
      data.chatbots = data.chatbots.filter(c => c.user_id !== Number(id));
      data.messages = data.messages.filter(m => !chatbotIds.includes(m.chatbot_id));
      save(data);
    },
    all() {
      const data = load();
      return data.users
        .map(u => {
          const bots    = data.chatbots.filter(c => c.user_id === u.id);
          const botIds  = bots.map(c => c.id);
          const msgCnt  = data.messages.filter(m => botIds.includes(m.chatbot_id)).length;
          const { password_hash, ...rest } = u;
          return { ...rest, has_ai_key: u.ai_key ? 1 : 0, chatbot_count: bots.length, message_count: msgCnt };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },

  // ── Chatbots ─────────────────────────────────────────────────────────────────

  chatbots: {
    findByUser(userId) {
      const data = load();
      return data.chatbots
        .filter(c => c.user_id === Number(userId))
        .map(c => ({ ...c, message_count: data.messages.filter(m => m.chatbot_id === c.id).length }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    findById(id) {
      return load().chatbots.find(c => c.id === id) || null;
    },
    findByIdAndUser(id, userId) {
      return load().chatbots.find(c => c.id === id && c.user_id === Number(userId)) || null;
    },
    findByIdWithOwner(id) {
      const data = load();
      const chatbot = data.chatbots.find(c => c.id === id);
      if (!chatbot) return null;
      const user = data.users.find(u => u.id === chatbot.user_id);
      // Still return chatbot even if user record is missing — falls back to echoBot
      return { ...chatbot, ai_provider: user?.ai_provider || 'none', ai_key: user?.ai_key || null };
    },
    create({ id, user_id, name, website_url, knowledge_base, icon }) {
      const data = load();
      const now = new Date().toISOString();
      data.chatbots.push({
        id,
        user_id: Number(user_id),
        name,
        website_url: website_url || null,
        knowledge_base: knowledge_base || null,
        icon: icon || '💬',
        created_at: now,
        updated_at: now
      });
      save(data);
    },
    update(id, fields) {
      const data = load();
      const i = data.chatbots.findIndex(c => c.id === id);
      if (i === -1) return false;
      data.chatbots[i] = { ...data.chatbots[i], ...fields, updated_at: new Date().toISOString() };
      save(data);
      return true;
    },
    delete(id, userId) {
      const data = load();
      const before = data.chatbots.length;
      data.chatbots = userId !== undefined
        ? data.chatbots.filter(c => !(c.id === id && c.user_id === Number(userId)))
        : data.chatbots.filter(c => c.id !== id);
      if (data.chatbots.length === before) return false;
      data.messages = data.messages.filter(m => m.chatbot_id !== id);
      save(data);
      return true;
    }
  },

  // ── Messages ─────────────────────────────────────────────────────────────────

  messages: {
    findByChatbot(chatbotId, limit = 100) {
      const data = load();
      return data.messages
        .filter(m => m.chatbot_id === chatbotId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)
        .map(({ id, user_message, bot_reply, created_at }) => ({ id, user_message, bot_reply, created_at }));
    },
    create({ chatbot_id, user_message, bot_reply }) {
      const data = load();
      data.messages.push({ id: nextMsgId(data), chatbot_id, user_message, bot_reply, created_at: new Date().toISOString() });
      save(data);
    },
    deleteByChatbot(chatbotId) {
      const data = load();
      data.messages = data.messages.filter(m => m.chatbot_id !== chatbotId);
      save(data);
    }
  }
};

module.exports = db;
