const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { getPool, dbType } = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Helper to execute queries based on DB type
async function executeQuery(queryFn) {
  const pool = await getPool();
  
  if (dbType === 'azure') {
    const { sql } = require('../db/azure-sql');
    return await queryFn(pool, sql);
  } else {
    const { query } = require('../db/sqlite');
    return await queryFn(pool, query);
  }
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const result = await executeQuery(async (pool, dbHelper) => {
      // Check existing user
      let existing;
      if (dbType === 'azure') {
        existing = await pool.request()
          .input('email', dbHelper.NVarChar, email)
          .query('SELECT email FROM users WHERE email = @email');
        existing = existing.recordset;
      } else {
        existing = await dbHelper(pool, 'SELECT email FROM users WHERE email = ?', [email]);
      }
      
      if (existing.length > 0) {
        throw new Error('EMAIL_EXISTS');
      }
      
      // Hash password and insert
      const hashedPassword = await bcrypt.hash(password, 10);
      
      if (dbType === 'azure') {
        const insert = await pool.request()
          .input('name', dbHelper.NVarChar, name)
          .input('email', dbHelper.NVarChar, email)
          .input('password', dbHelper.NVarChar, hashedPassword)
          .query('INSERT INTO users (name, email, password) OUTPUT INSERTED.id VALUES (@name, @email, @password)');
        return insert.recordset[0].id;
      } else {
        const insert = await dbHelper(pool, 
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          [name, email, hashedPassword]
        );
        return insert.lastID;
      }
    });
    
    const token = jwt.sign({ id: result, email, name }, config.jwtSecret, { expiresIn: '7d' });
    res.status(201).json({ 
      message: 'Account created successfully', 
      token, 
      user: { id: result, name, email } 
    });
    
  } catch (err) {
    console.error('Register error:', err);
    if (err.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = await executeQuery(async (pool, dbHelper) => {
      if (dbType === 'azure') {
        const result = await pool.request()
          .input('email', dbHelper.NVarChar, email)
          .query('SELECT * FROM users WHERE email = @email');
        return result.recordset[0];
      } else {
        const result = await dbHelper(pool, 'SELECT * FROM users WHERE email = ?', [email]);
        return result[0];
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name }, 
      config.jwtSecret, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      message: 'Login successful', 
      token, 
      user: { id: user.id, name: user.name, email: user.email } 
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get current user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const user = await executeQuery(async (pool, dbHelper) => {
      if (dbType === 'azure') {
        const result = await pool.request()
          .input('id', dbHelper.Int, req.user.id)
          .query('SELECT id, name, email, created_at FROM users WHERE id = @id');
        return result.recordset[0];
      } else {
        const result = await dbHelper(pool, 
          'SELECT id, name, email, created_at FROM users WHERE id = ?', 
          [req.user.id]
        );
        return result[0];
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
    
  } catch (err) {
    console.error('User fetch error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// List all users (dev only)
router.get('/users', async (req, res) => {
  try {
    const users = await executeQuery(async (pool, dbHelper) => {
      if (dbType === 'azure') {
        const result = await pool.request()
          .query('SELECT id, name, email, created_at FROM users');
        return result.recordset;
      } else {
        return await dbHelper(pool, 'SELECT id, name, email, created_at FROM users');
      }
    });
    
    res.json({ users });
    
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
