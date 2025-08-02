const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// POST /api/tickets - Create a ticket
router.post('/', async (req, res) => {
  try {
    const { type, priority, title, description, linked_thread_id, created_by } = req.body;
    
    const result = await pool.query(
      `INSERT INTO ticket (type, priority, title, description, linked_thread_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [type, priority, title, description, linked_thread_id, created_by]
    );
    
    res.json({ 
      success: true,
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Ticket creation error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// GET /api/tickets - List tickets
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ticket ORDER BY created_at DESC'
    );
    
    res.json({ tickets: result.rows });
  } catch (error) {
    console.error('Ticket list error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

module.exports = router;