/**
 * One-time migration: MySQL → data/db.json
 * Run this BEFORE `npm install` so mysql2 is still available in node_modules.
 *
 * Usage:  node scripts/migrate-mysql-to-json.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const DB_PATH  = path.join(__dirname, '../data/db.json');
const DATA_DIR = path.dirname(DB_PATH);

async function main() {
  if (fs.existsSync(DB_PATH)) {
    console.log('data/db.json already exists — skipping migration.');
    console.log('Delete it first if you want to re-run.');
    process.exit(0);
  }

  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'autochatbot',
  });

  console.log('Exporting users...');
  const [users] = await conn.execute('SELECT * FROM users ORDER BY id ASC');

  console.log('Exporting chatbots...');
  const [chatbots] = await conn.execute('SELECT * FROM chatbots ORDER BY created_at ASC');

  console.log('Exporting messages...');
  const [messages] = await conn.execute('SELECT * FROM messages ORDER BY id ASC');

  await conn.end();

  // Normalise types to match the JSON db format
  const normUsers = users.map(u => ({
    id:            Number(u.id),
    name:          u.name || '',
    email:         u.email,
    password_hash: u.password_hash,
    ai_provider:   u.ai_provider || 'none',
    ai_key:        u.ai_key || null,
    is_admin:      Number(u.is_admin),
    created_at:    u.created_at instanceof Date ? u.created_at.toISOString() : String(u.created_at),
  }));

  const normChatbots = chatbots.map(c => ({
    id:             c.id,
    user_id:        Number(c.user_id),
    name:           c.name,
    website_url:    c.website_url  || null,
    knowledge_base: c.knowledge_base || null,
    icon:           c.icon || '💬',
    created_at:     c.created_at instanceof Date ? c.created_at.toISOString() : String(c.created_at),
    updated_at:     c.updated_at instanceof Date ? c.updated_at.toISOString() : String(c.updated_at),
  }));

  const normMessages = messages.map(m => ({
    id:           Number(m.id),
    chatbot_id:   m.chatbot_id,
    user_message: m.user_message,
    bot_reply:    m.bot_reply,
    created_at:   m.created_at instanceof Date ? m.created_at.toISOString() : String(m.created_at),
  }));

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: normUsers, chatbots: normChatbots, messages: normMessages }, null, 2));

  console.log(`\nMigration complete!`);
  console.log(`  Users:    ${normUsers.length}`);
  console.log(`  Chatbots: ${normChatbots.length}`);
  console.log(`  Messages: ${normMessages.length}`);
  console.log(`  Written:  data/db.json`);
}

main().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
