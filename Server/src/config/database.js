const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// SQLITE_DB_PATH opsional untuk pengujian tanpa menyentuh data proyek asli.
const dbPath = process.env.SQLITE_DB_PATH
  ? path.resolve(process.env.SQLITE_DB_PATH)
  : path.resolve(__dirname, '../../database.sqlite');
const initSQL = fs.readFileSync(
  path.join(__dirname, '../sql_scripts/init.sql'),
  'utf8'
);
//tes
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Gagal terhubung ke SQLite:', err.message);
    process.exit(1);
  }
  console.log('Terhubung ke SQLite:', dbPath);
});

const initializeDatabase = () =>
  new Promise((resolve, reject) => {
    db.exec(initSQL, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

module.exports = { db, initializeDatabase };