const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { classifyIntent } = require('../services/intentClassifier');
const { findMatchingSOP } = require('../services/sopMatcher');
const { getCorrelationId } = require('../utils/correlationId');
const { getValidator } = require('../middleware/validation');

// POST /api/messages - Receive new message
router.post('/', getValidator('messages', 'create'), async (req, res) => {
  try {
    const { customer_id, booking_id, content } = req.body;
    const correlationId = getCorrelationId(req);
    
    // Classify intent using LLM
    const { intent, confidence } = await classifyIntent(content);
    
    // Create or update thread with correlation ID
    const threadResult = await pool.query(
      `INSERT INTO thread (customer_id, booking_id, intent, confidence_score, status, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [customer_id, booking_id, intent, confidence, 'pending', correlationId]
    );
    
    const thread = threadResult.rows[0];
    
    // Store the message
    await pool.query(
      `INSERT INTO messages (thread_id, sender_type, sender_id, content)
       VALUES ($1, $2, $3, $4)`,
      [thread.id, 'customer', customer_id, content]
    );
    
    // Try to match SOP
    const matchedSOP = await findMatchingSOP(intent, content);
    
    // Update thread status based on SOP match
    if (matchedSOP) {
      await pool.query(
        `UPDATE thread SET status = 'in_progress' WHERE id = $1`,
        [thread.id]
      );
    } else {
      await pool.query(
        `UPDATE thread SET status = 'awaiting_human' WHERE id = $1`,
        [thread.id]
      );
    }
    
    res.json({ 
      success: true, 
      thread_id: thread.id,
      correlation_id: correlationId,
      intent,
      confidence,
      sop_matched: !!matchedSOP,
      sop: matchedSOP
    });
  } catch (error) {
    console.error('Message processing error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

module.exports = router;