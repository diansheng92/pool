const config = require('../config');

let dbModule;
let pool = null;
let isReconnecting = false;

// Initialize database based on environment
async function initDatabase() {
  if (config.dbType === 'azure') {
    dbModule = require('./azure-sql');
  } else {
    dbModule = require('./sqlite');
  }
  
  pool = await dbModule.connect();
  await dbModule.ensureSchema(pool);
  
  console.log(`✓ Connected to ${config.dbType.toUpperCase()} database`);
  return pool;
}

// Get or reconnect pool (handles token expiry for Azure AD)
async function getPool() {
  if (pool && (pool.connected || pool.open)) {
    return pool;
  }
  
  if (isReconnecting) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return pool;
  }
  
  isReconnecting = true;
  try {
    console.log('⚠ Reconnecting to database...');
    if (pool && dbModule.close) {
      try { await dbModule.close(pool); } catch (e) { /* ignore */ }
    }
    pool = await dbModule.connect();
    console.log('✓ Reconnected successfully');
    return pool;
  } catch (err) {
    console.error('Reconnection failed:', err);
    pool = null;
    throw err;
  } finally {
    isReconnecting = false;
  }
}

// Close connection
async function closeDatabase() {
  if (pool && dbModule.close) {
    await dbModule.close(pool);
    pool = null;
  }
}

module.exports = {
  initDatabase,
  getPool,
  closeDatabase,
  get dbType() { return config.dbType; }
};
