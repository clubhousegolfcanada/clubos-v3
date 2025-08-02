const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { executeAction } = require('../services/actionExecutor');
const { getCorrelationId } = require('../utils/correlationId');

// POST /api/actions - Execute an action
router.post('/', async (req, res) => {
  try {
    const { action_type, thread_id, sop_id, performed_by = 'OperatorGPT' } = req.body;
    
    // Validate input
    if (!action_type || !thread_id) {
      return res.status(400).json({ error: 'action_type and thread_id are required' });
    }
    
    // Get thread context
    const threadResult = await pool.query(
      'SELECT * FROM thread WHERE id = $1',
      [thread_id]
    );
    
    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    const thread = threadResult.rows[0];
    
    // Get SOP details if provided
    let sop = null;
    if (sop_id) {
      const sopResult = await pool.query(
        'SELECT * FROM sop WHERE id = $1',
        [sop_id]
      );
      if (sopResult.rows.length > 0) {
        sop = sopResult.rows[0];
      }
    }
    
    // Execute the action
    const executionResult = await executeAction(action_type, {
      thread,
      sop,
      sop_id,
      booking_id: thread.booking_id
    });
    
    // Log the action with correlation ID
    const correlationId = thread.correlation_id || getCorrelationId(req);
    const actionLogResult = await pool.query(
      `INSERT INTO action_log (action_type, sop_id, thread_id, outcome, performed_by, notes, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        action_type, 
        sop_id, 
        thread_id, 
        executionResult.outcome,
        performed_by,
        executionResult.notes,
        correlationId
      ]
    );
    
    // Update thread status based on outcome
    let newStatus = thread.status;
    switch (executionResult.outcome) {
      case 'success':
        newStatus = 'resolved';
        break;
      case 'failed':
        newStatus = 'escalated';
        // Track override if human performed action after SOP failed
        if (sop_id && performed_by !== 'OperatorGPT') {
          await pool.query(
            'UPDATE sop SET override_count = override_count + 1 WHERE id = $1',
            [sop_id]
          );
        }
        break;
      case 'partial':
        newStatus = 'awaiting_human';
        break;
      case 'unconfirmed':
        newStatus = 'in_progress';
        break;
    }
    
    if (newStatus !== thread.status) {
      await pool.query(
        'UPDATE thread SET status = $1, updated_at = NOW() WHERE id = $2',
        [newStatus, thread_id]
      );
    }
    
    res.json({ 
      success: true,
      action: actionLogResult.rows[0],
      execution_details: executionResult
    });
  } catch (error) {
    console.error('Action execution error:', error);
    res.status(500).json({ error: 'Failed to execute action' });
  }
});

// GET /api/actions/:thread_id - Get actions for a thread
router.get('/:thread_id', async (req, res) => {
  try {
    const { thread_id } = req.params;
    
    const result = await pool.query(
      `SELECT al.*, s.title as sop_title
       FROM action_log al
       LEFT JOIN sop s ON al.sop_id = s.id
       WHERE al.thread_id = $1
       ORDER BY al.timestamp DESC`,
      [thread_id]
    );
    
    res.json({ actions: result.rows });
  } catch (error) {
    console.error('Action fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

module.exports = router;