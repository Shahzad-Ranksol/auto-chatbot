const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(path.join(dataDir, 'autochatbot.db'));
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

function execute(sql, params = []) {
  try {
    const stmt = sqlite.prepare(sql);
    const upper = sql.trimStart().toUpperCase();
    if (upper.startsWith('SELECT') || upper.startsWith('PRAGMA')) {
      return Promise.resolve([stmt.all(...params)]);
    }
    const result = stmt.run(...params);
    return Promise.resolve([{ affectedRows: result.changes, insertId: result.lastInsertRowid }]);
  } catch (err) {
    return Promise.reject(err);
  }
}

function getConnection() {
  return Promise.resolve({
    query: (sql, params = []) => execute(sql, params),
    release: () => {}
  });
}

function executeSync(sql) {
  sqlite.prepare(sql).run();
}

module.exports = { execute, getConnection, executeSync };
