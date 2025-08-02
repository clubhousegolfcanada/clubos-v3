const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// GET /api/threads/:id - Get thread details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const threadResult = await pool.query(
      'SELECT * FROM thread WHERE id = $1',
      [id]
    );
    
    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // TODO: Get associated messages
    // TODO: Get action history
    
    res.json({
      thread: threadResult.rows[0],
      messages: [],
      actions: []
    });
  } catch (error) {
    console.error('Thread fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

// GET /api/threads - List all threads
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM thread ORDER BY created_at DESC LIMIT 50'
    );
    
    res.json({ threads: result.rows });
  } catch (error) {
    console.error('Thread list error:', error);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

module.exports = router;