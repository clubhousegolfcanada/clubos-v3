const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

// Admin migration endpoint - temporary for initial setup
router.post('/migrate', async (req, res) => {
  try {
    // Check for admin token
    const adminToken = req.headers['x-admin-token'];
    if (adminToken !== process.env.JWT_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create new pool with DATABASE_URL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    await pool.query(schemaSQL);
    
    // Get created tables
    const result = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    
    await pool.end();
    
    res.json({
      success: true,
      message: 'Database migrations completed',
      tables: result.rows.map(r => r.tablename)
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message 
    });
  }
});

// Health check for admin
router.get('/status', (req, res) => {
  res.json({
    status: 'admin routes active',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;