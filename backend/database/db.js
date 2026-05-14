const Database = require('better-sqlite3');
const path = require('path');
const DB_PATH = path.join(__dirname, '../../database/bingo.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME
    );
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      numbers TEXT NOT NULL,
      has_bingo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (round_id) REFERENCES rounds(id)
    );
    CREATE TABLE IF NOT EXISTS drawn_numbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round_id INTEGER NOT NULL,
      number INTEGER NOT NULL,
      drawn_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (round_id) REFERENCES rounds(id)
    );
  `);
  require('../../../../shared/users-db').getUsersDb();
  console.log('✅ Banco Bingo Juninas inicializado');
  return db;
}

module.exports = { getDb, initDb };
