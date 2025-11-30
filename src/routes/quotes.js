const express = require('express');
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

// Create quote
router.post('/quote', authenticateToken, async (req, res) => {
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
    
    if (!company || !tagName) {
      return res.status(400).json({ error: 'company and tagName are required' });
    }
    
    const orderTypesStr = Array.isArray(orderTypes) ? orderTypes.join(',') : (orderTypes || null);
    const measurementsStr = measurements ? JSON.stringify(measurements) : null;
    
    const newId = await executeQuery(async (pool, dbHelper) => {
      if (dbType === 'azure') {
        const insert = await pool.request()
          .input('company', dbHelper.NVarChar, company)
          .input('tag_name', dbHelper.NVarChar, tagName)
          .input('po_number', dbHelper.NVarChar, poNumber || null)
          .input('delivery', dbHelper.NVarChar, delivery || null)
          .input('size_shape', dbHelper.NVarChar, sizeShape || null)
          .input('order_types', dbHelper.NVarChar, orderTypesStr)
          .input('grid_size', dbHelper.NVarChar, gridSize || null)
          .input('colour', dbHelper.NVarChar, colour || null)
          .input('comments', dbHelper.NVarChar, comments || null)
          .input('measurements', dbHelper.NVarChar, measurementsStr)
          .query(`INSERT INTO quotes (company, tag_name, po_number, delivery, size_shape, order_types, grid_size, colour, comments, measurements)
                  OUTPUT INSERTED.id VALUES (@company, @tag_name, @po_number, @delivery, @size_shape, @order_types, @grid_size, @colour, @comments, @measurements)`);
        return insert.recordset[0].id;
      } else {
        const insert = await dbHelper(pool, 
          `INSERT INTO quotes (company, tag_name, po_number, delivery, size_shape, order_types, grid_size, colour, comments, measurements)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [company, tagName, poNumber, delivery, sizeShape, orderTypesStr, gridSize, colour, comments, measurementsStr]
        );
        return insert.lastID;
      }
    });
    
    res.status(201).json({ message: 'Quote stored', id: newId });
    
  } catch (err) {
    console.error('Quote create error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// List quotes
router.get('/quotes', authenticateToken, async (req, res) => {
  try {
    const quotes = await executeQuery(async (pool, dbHelper) => {
      if (dbType === 'azure') {
        const result = await pool.request()
          .query('SELECT TOP 200 id, company, tag_name, grid_size, colour, created_at FROM quotes ORDER BY id DESC');
        return result.recordset;
      } else {
        return await dbHelper(pool, 
          'SELECT id, company, tag_name, grid_size, colour, created_at FROM quotes ORDER BY id DESC LIMIT 200'
        );
      }
    });
    
    res.json({ quotes });
    
  } catch (err) {
    console.error('Quotes list error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
