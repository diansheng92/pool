const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./src/config');
const { initDatabase, closeDatabase, dbType } = require('./src/db/connection');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./src/routes/auth');
const quoteRoutes = require('./src/routes/quotes');

app.use('/api', authRoutes);
app.use('/api', quoteRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: dbType.toUpperCase(),
    environment: config.isProd ? 'production' : 'development'
  });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Start server
async function start() {
  try {
    await initDatabase();
    
    app.listen(config.port, () => {
      console.log(`\n🚀 Server running on http://localhost:${config.port}`);
      console.log(`📊 Database: ${dbType.toUpperCase()}`);
      console.log(`🌍 Environment: ${config.isProd ? 'Production' : 'Development'}`);
      console.log('\nAPI Endpoints:');
      console.log('  POST /api/register');
      console.log('  POST /api/login');
      console.log('  GET  /api/user');
      console.log('  GET  /api/users');
      console.log('  POST /api/quote');
      console.log('  GET  /api/quotes');
      console.log('  GET  /api/health\n');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⏸ Shutting down gracefully...');
  try {
    await closeDatabase();
    console.log('✓ Database connection closed');
  } catch (e) {
    console.error('Error closing database:', e);
  }
  process.exit(0);
});

start();
