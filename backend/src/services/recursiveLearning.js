const db = require('../db/pool');
const logger = require('../utils/logger');

class RecursiveLearningService {
  constructor() {
    this.similarityThreshold = 0.85;
    this.mediumThreshold = 0.70;
    this.lowThreshold = 0.50;
    this.decayDays = 30;
    this.suppressionWindow = 300000; // 5 minutes
    this.suppressionCounts = new Map();
  }

  /**
   * Capture and process an error for learning
   */
  async captureError(error, context) {
    try {
      // Generate error signature
      const signature = await this.generateSignature(error, context);
      
      // Check for suppression
      if (this.shouldSuppress(signature)) {
        this.incrementSuppression(signature);
        return {
          suppressed: true,
          suppressionCount: this.suppressionCounts.get(signature),
          message: 'Error suppressed due to recent occurrence'
        };
      }
      
      // Check for existing pattern
      const existingPattern = await this.findPattern(signature);
      
      if (existingPattern) {
        // Update pattern usage
        await this.updatePatternUsage(existingPattern.id);
        
        // Check if we have a fix
        if (existingPattern.pattern_logic) {
          return {
            hasFix: true,
            pattern: existingPattern,
            fix: existingPattern.pattern_logic,
            confidence: existingPattern.relevance_score
          };
        }
      }
      
      // Log new error
      const errorEvent = await this.logError(error, context, signature, existingPattern?.id);
      
      // Check for error flooding
      const floodDetected = await this.detectErrorFlood(error.type, context);
      if (floodDetected) {
        logger.warn('Error flood detected', { errorType: error.type, context });
      }
      
      return {
        errorId: errorEvent.id,
        isNew: !existingPattern,
        floodDetected
      };
      
    } catch (err) {
      logger.error('Failed to capture error for learning', err);
      return { error: 'Learning capture failed' };
    }
  }

  /**
   * Capture a fix and create reusable pattern
   */
  async captureFix(errorId, fixLogic, classification) {
    try {
      // Get error details
      const errorResult = await db.query(
        'SELECT * FROM error_events WHERE id = $1',
        [errorId]
      );
      
      if (errorResult.rows.length === 0) {
        throw new Error('Error event not found');
      }
      
      const errorEvent = errorResult.rows[0];
      
      // Create or update pattern
      const pattern = {
        error_signature: await this.generateSignature(
          { type: errorEvent.error_type, code: errorEvent.error_code },
          errorEvent.context
        ),
        fix_class: classification.type,
        reusability: classification.reusability || 'conditional',
        edge_case_flag: classification.isEdgeCase || false,
        pattern_logic: fixLogic,
        module_context: classification.module || errorEvent.context.module,
        symptom_description: classification.symptom || errorEvent.error_message,
        trigger_conditions: classification.triggers || errorEvent.context,
        resolution_steps: classification.steps || fixLogic.steps
      };
      
      // Store pattern
      const storedPattern = await this.storePattern(pattern);
      
      // Link error to pattern
      await db.query(
        'UPDATE error_events SET pattern_id = $1 WHERE id = $2',
        [storedPattern.id, errorId]
      );
      
      // Analyze for cross-module application
      if (classification.requiresAnalysis) {
        await this.requestPatternAnalysis(storedPattern);
      }
      
      return storedPattern;
      
    } catch (err) {
      logger.error('Failed to capture fix', err);
      throw err;
    }
  }

  /**
   * Find similar fix for an error
   */
  async findSimilarFix(error, context) {
    try {
      const signature = await this.generateSignature(error, context);
      
      // Search for matching patterns
      const patterns = await this.searchPatterns(signature, context.module);
      
      for (const pattern of patterns) {
        const similarity = this.calculateSimilarity(
          { signature, context },
          { 
            signature: pattern.error_signature, 
            context: pattern.trigger_conditions 
          }
        );
        
        if (similarity >= this.similarityThreshold) {
          // Check relevance
          if (this.isRelevant(pattern)) {
            // Record match attempt
            await this.recordMatch(error, pattern.id, similarity);
            
            // Return adapted pattern
            return this.adaptPattern(pattern, context);
          }
        } else if (similarity >= this.mediumThreshold) {
          // Flag for operator review
          logger.info('Medium confidence pattern match', {
            patternId: pattern.id,
            similarity
          });
        }
      }
      
      return null;
      
    } catch (err) {
      logger.error('Failed to find similar fix', err);
      return null;
    }
  }

  /**
   * Generate deterministic signature for error
   */
  async generateSignature(error, context) {
    const components = [
      error.type || 'unknown',
      error.code || '',
      context.module || '',
      context.endpoint || '',
      context.action || ''
    ];
    
    return components.join(':').toLowerCase();
  }

  /**
   * Calculate similarity between error signatures
   */
  calculateSimilarity(current, stored) {
    // Simple implementation - can be enhanced with better algorithms
    if (current.signature === stored.signature) {
      return 1.0;
    }
    
    // Check component matches
    const currentParts = current.signature.split(':');
    const storedParts = stored.signature.split(':');
    
    let matches = 0;
    for (let i = 0; i < Math.min(currentParts.length, storedParts.length); i++) {
      if (currentParts[i] === storedParts[i]) {
        matches++;
      }
    }
    
    const componentScore = matches / Math.max(currentParts.length, storedParts.length);
    
    // Context similarity (if available)
    let contextScore = 0;
    if (current.context && stored.context) {
      const currentKeys = Object.keys(current.context);
      const storedKeys = Object.keys(stored.context);
      const commonKeys = currentKeys.filter(k => storedKeys.includes(k));
      
      if (commonKeys.length > 0) {
        const matchingValues = commonKeys.filter(k => 
          current.context[k] === stored.context[k]
        );
        contextScore = matchingValues.length / commonKeys.length;
      }
    }
    
    // Weighted average
    return (componentScore * 0.7) + (contextScore * 0.3);
  }

  /**
   * Check if pattern is still relevant
   */
  isRelevant(pattern) {
    const daysSince = (Date.now() - new Date(pattern.last_seen).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < this.decayDays && pattern.relevance_score > 0.3;
  }

  /**
   * Adapt pattern to current context
   */
  adaptPattern(pattern, currentContext) {
    const adapted = {
      ...pattern.pattern_logic,
      context: {
        ...pattern.pattern_logic.context,
        ...currentContext
      }
    };
    
    // Apply context-specific modifications
    if (pattern.reusability === 'conditional') {
      adapted.requiresValidation = true;
      adapted.originalPattern = pattern.id;
    }
    
    return adapted;
  }

  /**
   * Store new pattern
   */
  async storePattern(pattern) {
    const query = `
      INSERT INTO learning_patterns (
        error_signature, fix_class, reusability, edge_case_flag,
        pattern_logic, module_context, symptom_description,
        trigger_conditions, resolution_steps
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (error_signature) 
      DO UPDATE SET
        match_count = learning_patterns.match_count + 1,
        last_seen = NOW(),
        pattern_logic = EXCLUDED.pattern_logic,
        updated_at = NOW()
      RETURNING *
    `;
    
    const result = await db.query(query, [
      pattern.error_signature,
      pattern.fix_class,
      pattern.reusability,
      pattern.edge_case_flag,
      JSON.stringify(pattern.pattern_logic),
      pattern.module_context,
      pattern.symptom_description,
      JSON.stringify(pattern.trigger_conditions),
      JSON.stringify(pattern.resolution_steps)
    ]);
    
    return result.rows[0];
  }

  /**
   * Log error event
   */
  async logError(error, context, signature, patternId = null) {
    const query = `
      INSERT INTO error_events (
        error_type, error_code, error_message, stack_trace,
        context, severity, pattern_id, thread_id, user_id,
        endpoint, method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const result = await db.query(query, [
      error.type || 'unknown',
      error.code || null,
      error.message || error.toString(),
      error.stack || null,
      JSON.stringify(context),
      error.severity || 'error',
      patternId,
      context.threadId || null,
      context.userId || null,
      context.endpoint || null,
      context.method || null
    ]);
    
    return result.rows[0];
  }

  /**
   * Check for error flooding
   */
  async detectErrorFlood(errorType, context) {
    const query = `
      SELECT COUNT(*) as error_count
      FROM error_events
      WHERE error_type = $1
      AND created_at > NOW() - INTERVAL '5 minutes'
      AND NOT suppressed
    `;
    
    const result = await db.query(query, [errorType]);
    const count = parseInt(result.rows[0].error_count);
    
    return count > 5; // More than 5 errors in 5 minutes
  }

  /**
   * Check if error should be suppressed
   */
  shouldSuppress(signature) {
    const lastSeen = this.suppressionCounts.get(signature + '_time');
    if (!lastSeen) return false;
    
    return (Date.now() - lastSeen) < this.suppressionWindow;
  }

  /**
   * Increment suppression count
   */
  incrementSuppression(signature) {
    const count = this.suppressionCounts.get(signature) || 0;
    this.suppressionCounts.set(signature, count + 1);
    this.suppressionCounts.set(signature + '_time', Date.now());
    
    // Clean old entries periodically
    if (this.suppressionCounts.size > 1000) {
      this.cleanSuppressionCache();
    }
  }

  /**
   * Clean old suppression entries
   */
  cleanSuppressionCache() {
    const now = Date.now();
    for (const [key, value] of this.suppressionCounts.entries()) {
      if (key.endsWith('_time') && (now - value) > this.suppressionWindow * 2) {
        const signature = key.replace('_time', '');
        this.suppressionCounts.delete(key);
        this.suppressionCounts.delete(signature);
      }
    }
  }

  /**
   * Update pattern usage stats
   */
  async updatePatternUsage(patternId) {
    await db.query(`
      UPDATE learning_patterns 
      SET match_count = match_count + 1,
          last_seen = NOW()
      WHERE id = $1
    `, [patternId]);
  }

  /**
   * Record pattern match attempt
   */
  async recordMatch(error, patternId, similarity) {
    await db.query(`
      INSERT INTO pattern_matches (
        error_event_id, pattern_id, similarity_score
      ) VALUES ($1, $2, $3)
    `, [error.id || null, patternId, similarity]);
  }

  /**
   * Search for relevant patterns
   */
  async searchPatterns(signature, module) {
    const query = `
      SELECT * FROM learning_patterns
      WHERE (
        error_signature = $1
        OR module_context = $2
        OR similarity(error_signature, $1) > 0.5
      )
      AND relevance_score > 0.3
      ORDER BY 
        CASE WHEN error_signature = $1 THEN 0 ELSE 1 END,
        relevance_score DESC,
        match_count DESC
      LIMIT 10
    `;
    
    const result = await db.query(query, [signature, module]);
    return result.rows;
  }

  /**
   * Request Claude analysis of pattern
   */
  async requestPatternAnalysis(pattern) {
    // Queue for Claude analysis
    logger.info('Pattern queued for Claude analysis', {
      patternId: pattern.id,
      fixClass: pattern.fix_class
    });
    
    // This would integrate with Claude service
    // For now, just log the request
  }

  /**
   * Update pattern success/failure
   */
  async updatePatternOutcome(patternId, matchId, success) {
    await db.query('BEGIN');
    
    try {
      // Update match record
      await db.query(`
        UPDATE pattern_matches 
        SET fix_applied = true, fix_successful = $1
        WHERE id = $2
      `, [success, matchId]);
      
      // Update pattern stats
      if (success) {
        await db.query(`
          UPDATE learning_patterns 
          SET success_count = success_count + 1,
              relevance_score = LEAST(relevance_score + 0.05, 1.0)
          WHERE id = $1
        `, [patternId]);
      } else {
        await db.query(`
          UPDATE learning_patterns 
          SET relevance_score = GREATEST(relevance_score - 0.1, 0.1)
          WHERE id = $1
        `, [patternId]);
      }
      
      await db.query('COMMIT');
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  }
}

module.exports = new RecursiveLearningService();