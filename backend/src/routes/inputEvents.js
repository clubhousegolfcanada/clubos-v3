const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { getCorrelationId } = require('../utils/correlationId');

// POST /api/input-events - Log external system events
router.post('/', async (req, res) => {
  try {
    const { 
      source, 
      payload, 
      location_id, 
      bay_id, 
      linked_thread_id 
    } = req.body;
    
    // Validate required fields
    if (!source || !payload) {
      return res.status(400).json({ 
        error: 'source and payload are required' 
      });
    }
    
    // Get correlation ID from request or generate new one
    const correlationId = getCorrelationId(req);
    
    // Insert event
    const result = await pool.query(
      `INSERT INTO input_event 
       (source, payload, location_id, bay_id, correlation_id, linked_thread_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, source, received_at, correlation_id`,
      [source, payload, location_id, bay_id, correlationId, linked_thread_id]
    );
    
    const event = result.rows[0];
    
    res.status(201).json({
      success: true,
      event_id: event.id,
      source: event.source,
      received_at: event.received_at,
      correlation_id: event.correlation_id
    });
  } catch (error) {
    console.error('Input event logging error:', error);
    res.status(500).json({ error: 'Failed to log input event' });
  }
});

// GET /api/input-events - Query events (admin use)
router.get('/', async (req, res) => {
  try {
    const { 
      source, 
      location_id, 
      since, 
      limit = 100 
    } = req.query;
    
    let query = 'SELECT * FROM input_event WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (source) {
      query += ` AND source = $${++paramCount}`;
      params.push(source);
    }
    
    if (location_id) {
      query += ` AND location_id = $${++paramCount}`;
      params.push(location_id);
    }
    
    if (since) {
      query += ` AND received_at >= $${++paramCount}`;
      params.push(since);
    }
    
    query += ` ORDER BY received_at DESC LIMIT $${++paramCount}`;
    params.push(Math.min(limit, 1000)); // Cap at 1000
    
    const result = await pool.query(query, params);
    
    res.json({
      events: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Input event query error:', error);
    res.status(500).json({ error: 'Failed to query input events' });
  }
});

module.exports = router;