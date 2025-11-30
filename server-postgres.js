const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// PostgreSQL connection pool (works with Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Redirect root to safety covers template
app.get('/', (req, res) => {
  res.redirect('/safety-covers-template.html');
});

// Initialize database tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        company VARCHAR(255) NOT NULL,
        tag_name VARCHAR(255) NOT NULL,
        po_number VARCHAR(255),
        delivery VARCHAR(50),
        size_shape VARCHAR(255),
        order_types VARCHAR(255),
        grid_size VARCHAR(50),
        colour VARCHAR(50),
        comments TEXT,
        measurements JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Database tables ready');
  } catch (err) {
    console.error('Database init error:', err);
  }
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
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ characters' });

    const existing = await pool.query('SELECT email FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hashedPassword]
    );

    const token = jwt.sign({ id: result.rows[0].id, email, name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Account created', token, user: { id: result.rows[0].id, name, email } });
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

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List users
app.get('/api/users', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, created_at FROM users');
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create quote
app.post('/api/quote', authenticateToken, async (req, res) => {
  try {
    const { company, tagName, poNumber, delivery, sizeShape, orderTypes, gridSize, colour, comments, measurements } = req.body;
    if (!company || !tagName) return res.status(400).json({ error: 'company and tagName required' });

    const result = await pool.query(
      `INSERT INTO quotes (company, tag_name, po_number, delivery, size_shape, order_types, grid_size, colour, comments, measurements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [company, tagName, poNumber, delivery, sizeShape, Array.isArray(orderTypes) ? orderTypes.join(',') : orderTypes, gridSize, colour, comments, JSON.stringify(measurements)]
    );

    res.status(201).json({ message: 'Quote stored', id: result.rows[0].id });
  } catch (err) {
    console.error('Quote error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List quotes
app.get('/api/quotes', authenticateToken, async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, company, tag_name, grid_size, colour, created_at FROM quotes ORDER BY id DESC LIMIT 200');
    res.json({ quotes: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'PostgreSQL server running' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await initDatabase();
});

process.on('SIGINT', async () => {
  await pool.end();
  console.log('\n✓ Database connection closed');
  process.exit(0);
});
