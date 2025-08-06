const { pool } = require('../db/pool');
const OpenAI = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class KnowledgeManager {
  constructor() {
    this.extractionPrompt = `Extract knowledge update information from natural language.
    
Categories of entities:
- location: bedford_clubhouse, dartmouth_clubhouse, all_locations
- service: trackman, booking_system
- policy: general_policies, membership_policies

Common fact types:
- phone_number, email, address, hours, wifi_password, door_code, capacity, price, policy

Return JSON: {
  "entity_key": "extracted entity key",
  "entity_type": "location/service/policy",
  "fact_type": "type of fact",
  "fact_value": "the new value",
  "confidence": 0.0-1.0
}

If you can't extract clear information, return null.`;
  }

  /**
   * Process natural language knowledge update
   */
  async processKnowledgeUpdate(input, userId = 'system') {
    try {
      // Extract intent from natural language
      const extracted = await this.extractKnowledge(input);
      
      if (!extracted) {
        return {
          success: false,
          error: 'Could not understand the knowledge update request',
          suggestion: 'Try being more specific, e.g., "The phone number for Bedford Clubhouse is 902-555-1234"'
        };
      }

      // Check for existing knowledge and conflicts
      const conflict = await this.checkForConflict(
        extracted.entity_key, 
        extracted.fact_type
      );

      // Log the update attempt
      const updateLog = await this.logUpdate(input, extracted, userId);

      // If no conflict, create new knowledge
      if (!conflict.has_conflict) {
        const result = await this.createKnowledge(extracted, userId, updateLog.id);
        return {
          success: true,
          action: 'created',
          entity: extracted.entity_key,
          fact_type: extracted.fact_type,
          value: extracted.fact_value,
          message: `Successfully added ${extracted.fact_type} for ${extracted.entity_key}`
        };
      }

      // If conflict exists, return for user confirmation
      return {
        success: false,
        action: 'conflict_detected',
        entity: extracted.entity_key,
        fact_type: extracted.fact_type,
        current_value: conflict.current_value,
        new_value: extracted.fact_value,
        fact_id: conflict.fact_id,
        update_id: updateLog.id,
        requires_confirmation: true,
        message: `${extracted.entity_key} already has a ${extracted.fact_type}: "${conflict.current_value}". Replace with "${extracted.fact_value}"?`
      };

    } catch (error) {
      logger.error('Knowledge update error:', error);
      return {
        success: false,
        error: 'Failed to process knowledge update',
        details: error.message
      };
    }
  }

  /**
   * Confirm a knowledge update after conflict detection
   */
  async confirmKnowledgeUpdate(updateId, factId, userId = 'system') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get the update details
      const updateResult = await client.query(
        'SELECT * FROM knowledge_updates WHERE id = $1',
        [updateId]
      );

      if (updateResult.rows.length === 0) {
        throw new Error('Update not found');
      }

      const update = updateResult.rows[0];
      const parsed = update.parsed_intent;

      // Mark old fact as superseded
      await client.query(
        `UPDATE knowledge_facts 
         SET is_current = false, superseded_at = NOW(), superseded_by = $1
         WHERE id = $2`,
        [factId, factId]
      );

      // Create new fact
      const newFactResult = await client.query(
        `INSERT INTO knowledge_facts 
         (entity_id, fact_type, fact_value, fact_metadata, source, created_by)
         VALUES ($1, $2, $3, $4, 'manual', $5)
         RETURNING id`,
        [update.entity_id, parsed.fact_type, parsed.fact_value, parsed.fact_metadata || {}, userId]
      );

      // Update the log
      await client.query(
        `UPDATE knowledge_updates 
         SET action_taken = 'updated', 
             conflict_resolution = 'user_approved',
             fact_id = $1
         WHERE id = $2`,
        [newFactResult.rows[0].id, updateId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        action: 'updated',
        message: `Successfully updated ${parsed.fact_type} for ${parsed.entity_key}`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Extract knowledge from natural language using GPT-4
   */
  async extractKnowledge(input) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.extractionPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const content = response.choices[0].message.content;
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(content);
        if (parsed && parsed.entity_key && parsed.fact_type && parsed.fact_value) {
          return parsed;
        }
      } catch (e) {
        // If not valid JSON or missing fields
        return null;
      }

      return null;
    } catch (error) {
      logger.error('Knowledge extraction error:', error);
      return null;
    }
  }

  /**
   * Check for existing knowledge conflicts
   */
  async checkForConflict(entityKey, factType) {
    const result = await pool.query(
      `SELECT * FROM check_knowledge_conflict($1, $2, $3)`,
      [entityKey, factType, '']
    );

    return result.rows[0] || { has_conflict: false };
  }

  /**
   * Create new knowledge entry
   */
  async createKnowledge(extracted, userId, updateId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get or create entity
      let entityResult = await client.query(
        'SELECT id FROM knowledge_entities WHERE entity_key = $1',
        [extracted.entity_key]
      );

      if (entityResult.rows.length === 0) {
        // Create new entity
        entityResult = await client.query(
          `INSERT INTO knowledge_entities (entity_type, entity_key, display_name)
           VALUES ($1, $2, $3) RETURNING id`,
          [
            extracted.entity_type || 'custom',
            extracted.entity_key,
            extracted.entity_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          ]
        );
      }

      const entityId = entityResult.rows[0].id;

      // Create fact
      const factResult = await client.query(
        `INSERT INTO knowledge_facts 
         (entity_id, fact_type, fact_value, fact_metadata, confidence_score, source, created_by)
         VALUES ($1, $2, $3, $4, $5, 'manual', $6)
         RETURNING id`,
        [
          entityId, 
          extracted.fact_type, 
          extracted.fact_value, 
          extracted.fact_metadata || {},
          extracted.confidence || 1.0,
          userId
        ]
      );

      // Update the log
      await client.query(
        `UPDATE knowledge_updates 
         SET entity_id = $1, fact_id = $2, action_taken = 'created'
         WHERE id = $3`,
        [entityId, factResult.rows[0].id, updateId]
      );

      await client.query('COMMIT');

      return {
        entity_id: entityId,
        fact_id: factResult.rows[0].id
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Log knowledge update attempt
   */
  async logUpdate(input, parsed, userId) {
    const result = await pool.query(
      `INSERT INTO knowledge_updates 
       (raw_input, parsed_intent, action_taken, created_by, confidence_score)
       VALUES ($1, $2, 'pending', $3, $4)
       RETURNING id`,
      [input, JSON.stringify(parsed), userId, parsed?.confidence || 0]
    );

    return result.rows[0];
  }

  /**
   * Get current knowledge for an entity
   */
  async getKnowledge(entityKey, factType = null) {
    const result = await pool.query(
      'SELECT * FROM get_current_knowledge($1, $2)',
      [entityKey, factType]
    );

    return result.rows;
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(query) {
    const result = await pool.query(
      `SELECT 
         e.display_name as entity,
         e.entity_key,
         f.fact_type,
         f.fact_value,
         f.fact_metadata,
         f.created_at
       FROM knowledge_entities e
       JOIN knowledge_facts f ON e.id = f.entity_id
       WHERE f.is_current = true
       AND (
         e.display_name ILIKE $1 OR
         e.entity_key ILIKE $1 OR
         f.fact_type ILIKE $1 OR
         f.fact_value ILIKE $1
       )
       ORDER BY e.display_name, f.fact_type`,
      [`%${query}%`]
    );

    return result.rows;
  }
}

module.exports = new KnowledgeManager();