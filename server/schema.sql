CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  ai_provider TEXT DEFAULT 'none',
  ai_key TEXT DEFAULT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chatbots (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  website_url TEXT DEFAULT NULL,
  knowledge_base TEXT DEFAULT NULL,
  icon TEXT NOT NULL DEFAULT '💬',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chatbot_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  bot_reply TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chatbots_user ON chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chatbot ON messages(chatbot_id);
