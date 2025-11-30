const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

// Connect
function connect() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.db.sqlite.filename, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

// Ensure schema exists
async function ensureSchema(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) return reject(err);
      });
      
      db.run(`CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        tag_name TEXT NOT NULL,
        po_number TEXT,
        delivery TEXT,
        size_shape TEXT,
        order_types TEXT,
        grid_size TEXT,
        colour TEXT,
        comments TEXT,
        measurements TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) return reject(err);
        console.log('✓ SQLite tables ready');
        resolve();
      });
    });
  });
}

// Close connection
function close(db) {
  return new Promise((resolve) => {
    db.close(() => resolve());
  });
}

// Helper to promisify queries
function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
}

module.exports = {
  connect,
  ensureSchema,
  close,
  query
};
