const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { validateSop } = require('../validators/sopSchema');

// GET /api/sops - List SOPs (only live by default)
router.get('/', async (req, res) => {
  try {
    const { category, status = 'live' } = req.query;
    
    let query = 'SELECT * FROM sop WHERE active = true AND status = $1';
    const params = [status];
    
    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }
    
    query += ' ORDER BY usage_count DESC, created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({ sops: result.rows });
  } catch (error) {
    console.error('SOP list error:', error);
    res.status(500).json({ error: 'Failed to fetch SOPs' });
  }
});

// POST /api/sops - Create SOP with validation
router.post('/', async (req, res) => {
  try {
    // Validate request against JSON schema
    const valid = validateSop(req.body);
    if (!valid) {
      return res.status(400).json({ 
        error: 'Invalid SOP data', 
        details: validateSop.errors 
      });
    }
    
    const { 
      title, 
      category, 
      trigger_phrases, 
      primary_action, 
      fallback_action = 'escalate',
      status = 'draft',
      timeout_seconds = 30,
      max_retries = 2,
      prerequisites = [],
      context = {},
      source_metadata = {},
      tags = []
    } = req.body;
    
    // Verify actions exist in valid_actions table
    const actionCheck = await pool.query(
      'SELECT action_type FROM valid_actions WHERE action_type = ANY($1::varchar[])',
      [[primary_action, fallback_action]]
    );
    
    const validActions = actionCheck.rows.map(r => r.action_type);
    if (!validActions.includes(primary_action)) {
      return res.status(400).json({ 
        error: `Invalid primary_action: ${primary_action}. Must be one of: reset_trackman, unlock_door, escalate, send_message` 
      });
    }
    if (!validActions.includes(fallback_action)) {
      return res.status(400).json({ 
        error: `Invalid fallback_action: ${fallback_action}. Must be one of: reset_trackman, unlock_door, escalate, send_message` 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO sop (title, category, trigger_phrases, primary_action, fallback_action,
                       status, timeout_seconds, max_retries, prerequisites, context, source_metadata, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [title, category, trigger_phrases, primary_action, fallback_action,
       status, timeout_seconds, max_retries, prerequisites, context, source_metadata, tags]
    );
    
    res.json({ 
      success: true,
      sop: result.rows[0]
    });
  } catch (error) {
    console.error('SOP creation error:', error);
    res.status(500).json({ error: 'Failed to create SOP' });
  }
});

// PUT /api/sops/:id - Update SOP (including tags)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;
    
    // If tags are provided, validate them
    if (tags !== undefined) {
      const tagPattern = /^[a-zA-Z0-9_-]+$/;
      for (const tag of tags) {
        if (!tagPattern.test(tag) || tag.length > 50) {
          return res.status(400).json({ 
            error: 'Invalid tag format. Tags must be alphanumeric with _ or -, max 50 chars' 
          });
        }
      }
      
      // Update tags
      const result = await pool.query(
        'UPDATE sop SET tags = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [tags, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'SOP not found' });
      }
      
      res.json({ 
        success: true,
        sop: result.rows[0]
      });
    } else {
      res.status(400).json({ error: 'No fields to update' });
    }
  } catch (error) {
    console.error('SOP update error:', error);
    res.status(500).json({ error: 'Failed to update SOP' });
  }
});

module.exports = router;