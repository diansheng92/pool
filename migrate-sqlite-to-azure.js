// Migration script: copy users from local SQLite to Azure SQL users table
// Usage: node migrate-sqlite-to-azure.js (ensure env vars are set for Azure SQL)

const sqlite3 = require('sqlite3').verbose();
const sql = require('mssql');
require('dotenv').config();

const sqlConfig = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  port: 1433,
  options: { encrypt: process.env.AZURE_SQL_ENCRYPT === 'false' ? false : true, trustServerCertificate: false }
};

(async () => {
  if (!sqlConfig.server) {
    console.error('Azure SQL env vars missing. Check .env');
    process.exit(1);
  }
  console.log('Connecting to Azure SQL...');
  await sql.connect(sqlConfig);
  console.log('Connected. Opening SQLite...');
  const db = new sqlite3.Database('./users.db');

  db.all('SELECT id, name, email, password FROM users', async (err, rows) => {
    if (err) {
      console.error('SQLite read error:', err);
      process.exit(1);
    }
    console.log(`Found ${rows.length} users to migrate.`);
    let migrated = 0;
    for (const row of rows) {
      try {
        const exists = await sql.request().input('email', sql.NVarChar, row.email).query('SELECT id FROM users WHERE email = @email');
        if (exists.recordset.length) {
          continue; // skip existing
        }
        await sql.request()
          .input('name', sql.NVarChar, row.name)
          .input('email', sql.NVarChar, row.email)
          .input('password', sql.NVarChar, row.password)
          .query('INSERT INTO users (name, email, password) VALUES (@name, @email, @password)');
        migrated++;
      } catch (e) {
        console.error('Failed to migrate user', row.email, e.message);
      }
    }
    console.log(`Migration complete. Migrated ${migrated} new users.`);
    db.close();
    await sql.close();
  });
})();
