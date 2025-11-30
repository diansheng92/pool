require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
  
  // Database Configuration (auto-detects from environment)
  db: {
    // Azure SQL (production)
    azure: {
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      user: process.env.AZURE_SQL_USER,
      password: process.env.AZURE_SQL_PASSWORD,
      encrypt: process.env.AZURE_SQL_ENCRYPT !== 'false',
      useAAD: process.env.AZURE_SQL_AUTH === 'AAD'
    },
    
    // SQLite (local development)
    sqlite: {
      filename: process.env.SQLITE_DB || './users.db'
    }
  },
  
  // Auto-detect database type
  get dbType() {
    if (process.env.AZURE_SQL_SERVER) return 'azure';
    return 'sqlite';
  },
  
  // Environment
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production'
};
