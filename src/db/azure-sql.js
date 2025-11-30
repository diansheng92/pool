const sql = require('mssql');
const config = require('../config');

let identityCredential = null;

// Initialize Azure AD credential if needed
if (config.db.azure.useAAD) {
  try {
    const { ManagedIdentityCredential } = require('@azure/identity');
    identityCredential = new ManagedIdentityCredential();
  } catch (e) {
    console.error('⚠ @azure/identity not available:', e.message);
  }
}

// Build connection config
async function buildConfig() {
  const { server, database, user, password, encrypt, useAAD } = config.db.azure;
  
  if (!server || !database) {
    throw new Error('AZURE_SQL_SERVER and AZURE_SQL_DATABASE required');
  }
  
  // Azure AD Managed Identity
  if (useAAD) {
    if (!identityCredential) {
      throw new Error('Managed Identity credential unavailable');
    }
    
    const token = await identityCredential.getToken('https://database.windows.net/.default');
    if (!token) {
      throw new Error('Failed to acquire AAD token');
    }
    
    return {
      server,
      database,
      options: { encrypt, trustServerCertificate: false },
      authentication: {
        type: 'azure-active-directory-access-token',
        options: { token: token.token }
      }
    };
  }
  
  // SQL Authentication
  if (!user || !password) {
    throw new Error('AZURE_SQL_USER and AZURE_SQL_PASSWORD required for SQL auth');
  }
  
  return {
    server,
    database,
    user,
    password,
    port: 1433,
    options: { encrypt, trustServerCertificate: false }
  };
}

// Connect
async function connect() {
  const sqlConfig = await buildConfig();
  const pool = await sql.connect(sqlConfig);
  return pool;
}

// Ensure schema exists
async function ensureSchema(pool) {
  const createUsers = `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
    CREATE TABLE users (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      email NVARCHAR(255) NOT NULL UNIQUE,
      password NVARCHAR(255) NOT NULL,
      created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );`;
  
  const createQuotes = `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quotes' AND xtype='U')
    CREATE TABLE quotes (
      id INT IDENTITY(1,1) PRIMARY KEY,
      company NVARCHAR(255) NOT NULL,
      tag_name NVARCHAR(255) NOT NULL,
      po_number NVARCHAR(255) NULL,
      delivery NVARCHAR(50) NULL,
      size_shape NVARCHAR(255) NULL,
      order_types NVARCHAR(255) NULL,
      grid_size NVARCHAR(50) NULL,
      colour NVARCHAR(50) NULL,
      comments NVARCHAR(MAX) NULL,
      measurements NVARCHAR(MAX) NULL,
      created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );`;
  
  await pool.request().query(createUsers);
  await pool.request().query(createQuotes);
  console.log('✓ Azure SQL tables ready');
}

// Close connection
async function close(pool) {
  await sql.close();
}

module.exports = {
  connect,
  ensureSchema,
  close,
  sql // Export for use in routes
};
