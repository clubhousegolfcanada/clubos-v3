const express = require('express');
const router = express.Router();
const knowledgeManager = require('../services/knowledgeManager');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/knowledge/update
 * Process natural language knowledge update
 * 
 * Body: {
 *   "input": "The new phone number for Bedford Clubhouse is 902-555-1234"
 * }
 */
router.post('/update', async (req, res) => {
  try {
    const { input } = req.body;
    
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return res.status(400).json({
        error: 'Please provide a knowledge update statement'
      });
    }

    // Process the natural language input
    const result = await knowledgeManager.processKnowledgeUpdate(
      input,
      req.user?.id || 'api'
    );

    // If conflict detected, return with confirmation request
    if (result.requires_confirmation) {
      return res.status(200).json({
        success: false,
        action: 'confirmation_required',
        ...result
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Knowledge update error:', error);
    res.status(500).json({
      error: 'Failed to process knowledge update',
      details: error.message
    });
  }
});

/**
 * POST /api/knowledge/confirm
 * Confirm a knowledge update after conflict detection
 * 
 * Body: {
 *   "update_id": 123,
 *   "fact_id": 456
 * }
 */
router.post('/confirm', async (req, res) => {
  try {
    const { update_id, fact_id } = req.body;
    
    if (!update_id || !fact_id) {
      return res.status(400).json({
        error: 'Missing update_id or fact_id'
      });
    }

    const result = await knowledgeManager.confirmKnowledgeUpdate(
      update_id,
      fact_id,
      req.user?.id || 'api'
    );

    res.json(result);
  } catch (error) {
    console.error('Knowledge confirmation error:', error);
    res.status(500).json({
      error: 'Failed to confirm knowledge update',
      details: error.message
    });
  }
});

/**
 * GET /api/knowledge/:entity/:factType?
 * Get current knowledge for an entity
 * 
 * Examples:
 * - /api/knowledge/bedford_clubhouse
 * - /api/knowledge/bedford_clubhouse/phone_number
 */
router.get('/:entity/:factType?', async (req, res) => {
  try {
    const { entity, factType } = req.params;
    
    const knowledge = await knowledgeManager.getKnowledge(entity, factType);
    
    res.json({
      entity: entity,
      fact_type: factType || 'all',
      facts: knowledge
    });
  } catch (error) {
    console.error('Knowledge retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve knowledge',
      details: error.message
    });
  }
});

/**
 * GET /api/knowledge/search
 * Search knowledge base
 * 
 * Query params:
 * - q: search query
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters'
      });
    }

    const results = await knowledgeManager.searchKnowledge(q);
    
    res.json({
      query: q,
      count: results.length,
      results: results
    });
  } catch (error) {
    console.error('Knowledge search error:', error);
    res.status(500).json({
      error: 'Failed to search knowledge',
      details: error.message
    });
  }
});

module.exports = router;