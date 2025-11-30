const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Azure SQL configuration from environment variables
const sqlConfig = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  port: 1433,
  options: {
    encrypt: process.env.AZURE_SQL_ENCRYPT === 'false' ? false : true,
    trustServerCertificate: false
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let pool; // SQL connection pool

async function initAzureSql() {
  try {
    pool = await sql.connect(sqlConfig);
    console.log('✓ Connected to Azure SQL');
    await ensureSchema();
  } catch (err) {
    console.error('Azure SQL connection error:', err);
    process.exit(1);
  }
}

async function ensureSchema() {
  const createUsers = `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
    CREATE TABLE users (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      email NVARCHAR(255) NOT NULL UNIQUE,
      password NVARCHAR(255) NOT NULL,
      created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );`;
  await pool.request().query(createUsers);
  console.log('✓ Users table ready (Azure SQL)');
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
  await pool.request().query(createQuotes);
  console.log('✓ Quotes table ready (Azure SQL)');
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await pool.request().input('email', sql.NVarChar, email).query('SELECT email FROM users WHERE email = @email');
    if (existing.recordset.length) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const insert = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .query('INSERT INTO users (name, email, password) OUTPUT INSERTED.id VALUES (@name, @email, @password)');

    const newId = insert.recordset[0].id;
    const token = jwt.sign({ id: newId, email, name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Account created successfully', token, user: { id: newId, name, email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await pool.request().input('email', sql.NVarChar, email).query('SELECT * FROM users WHERE email = @email');
    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Current user
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.request().input('id', sql.Int, req.user.id).query('SELECT id, name, email, created_at FROM users WHERE id = @id');
    const user = result.recordset[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('User fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List users (dev only)
app.get('/api/users', async (_req, res) => {
  try {
    const result = await pool.request().query('SELECT id, name, email, created_at FROM users');
    res.json({ users: result.recordset });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Azure SQL server running' });
});

// Create quote (no auth required initially)
app.post('/api/quote', authenticateToken, async (req, res) => {
  try {
    const {
      company,
      tagName,
      poNumber,
      delivery,
      sizeShape,
      orderTypes,
      gridSize,
      colour,
      comments,
      measurements
    } = req.body;

    if (!company || !tagName) return res.status(400).json({ error: 'company and tagName are required' });

    const insert = await pool.request()
      .input('company', sql.NVarChar, company)
      .input('tag_name', sql.NVarChar, tagName)
      .input('po_number', sql.NVarChar, poNumber || null)
      .input('delivery', sql.NVarChar, delivery || null)
      .input('size_shape', sql.NVarChar, sizeShape || null)
      .input('order_types', sql.NVarChar, Array.isArray(orderTypes) ? orderTypes.join(',') : (orderTypes || null))
      .input('grid_size', sql.NVarChar, gridSize || null)
      .input('colour', sql.NVarChar, colour || null)
      .input('comments', sql.NVarChar, comments || null)
      .input('measurements', sql.NVarChar, measurements ? JSON.stringify(measurements) : null)
      .query(`INSERT INTO quotes (company, tag_name, po_number, delivery, size_shape, order_types, grid_size, colour, comments, measurements)
              OUTPUT INSERTED.id VALUES (@company, @tag_name, @po_number, @delivery, @size_shape, @order_types, @grid_size, @colour, @comments, @measurements)`);

    const newId = insert.recordset[0].id;
    res.status(201).json({ message: 'Quote stored', id: newId });
  } catch (err) {
    console.error('Quote create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List quotes (dev only)
app.get('/api/quotes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.request().query('SELECT TOP 200 id, company, tag_name, grid_size, colour, created_at FROM quotes ORDER BY id DESC');
    res.json({ quotes: result.recordset });
  } catch (err) {
    console.error('Quotes list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, async () => {
  console.log(`\nAzure Server starting on http://localhost:${PORT}`);
  await initAzureSql();
  console.log('API Endpoints:\n  POST /api/register\n  POST /api/login\n  GET  /api/user\n  GET  /api/users (dev)\n  GET  /api/health');
});

process.on('SIGINT', async () => {
  try { await sql.close(); console.log('\n✓ Azure SQL connection closed'); } catch (e) { console.error('Close error:', e); }
  process.exit(0);
});
