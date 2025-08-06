const db = require('../../db/pool');
const logger = require('../../utils/logger');

class ConfidenceEvolution {
  constructor() {
    this.promotionThresholds = {
      executionCount: 20,
      successRate: 0.90,
      minConfidence: 0.95
    };
    
    this.adjustmentRates = {
      success: {
        noModification: 0.05,
        withModification: 0.02
      },
      failure: {
        minor: -0.05,
        major: -0.15,
        critical: -0.30
      }
    };
    
    this.decayRate = 0.01; // Daily decay for unused patterns
  }

  /**
   * Update pattern confidence based on execution outcome
   */
  async updateConfidence(patternId, outcome) {
    try {
      const pattern = await this.getPattern(patternId);
      if (!pattern) {
        throw new Error(`Pattern ${patternId} not found`);
      }
      
      let newConfidence = pattern.confidence_score;
      let autoExecutable = pattern.auto_executable;
      
      // Calculate new confidence based on outcome
      if (outcome.success) {
        newConfidence = await this.handleSuccessfulExecution(
          pattern, 
          outcome, 
          newConfidence
        );
      } else {
        newConfidence = await this.handleFailedExecution(
          pattern, 
          outcome, 
          newConfidence
        );
      }
      
      // Check for auto-execution promotion
      if (!autoExecutable && await this.shouldPromoteToAutoExecutable(pattern)) {
        autoExecutable = true;
        logger.info(`Pattern ${patternId} promoted to auto-executable`);
      }
      
      // Check for demotion
      if (autoExecutable && await this.shouldDemoteFromAutoExecutable(pattern)) {
        autoExecutable = false;
        logger.warn(`Pattern ${patternId} demoted from auto-executable`);
      }
      
      // Update pattern
      await this.updatePattern(patternId, {
        confidence: newConfidence,
        autoExecutable,
        lastModified: outcome.humanModified ? new Date() : pattern.last_modified
      });
      
      // Log confidence evolution
      await this.logConfidenceChange(patternId, pattern.confidence_score, newConfidence, outcome);
      
      return {
        oldConfidence: pattern.confidence_score,
        newConfidence,
        autoExecutable,
        changed: newConfidence !== pattern.confidence_score
      };
      
    } catch (error) {
      logger.error('Error updating confidence', { patternId, error });
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  async handleSuccessfulExecution(pattern, outcome, currentConfidence) {
    let adjustment = 0;
    
    if (outcome.humanModified) {
      // Learn from modification
      await this.captureModification(pattern.id, outcome.modifications);
      adjustment = this.adjustmentRates.success.withModification;
    } else {
      // Pure success
      adjustment = this.adjustmentRates.success.noModification;
    }
    
    // Bonus for consistent success
    const recentSuccessRate = await this.getRecentSuccessRate(pattern.id);
    if (recentSuccessRate > 0.95) {
      adjustment *= 1.5;
    }
    
    return Math.min(0.99, currentConfidence + adjustment);
  }

  /**
   * Handle failed execution
   */
  async handleFailedExecution(pattern, outcome, currentConfidence) {
    let adjustment = 0;
    
    // Determine failure severity
    const severity = this.classifyFailureSeverity(outcome);
    adjustment = this.adjustmentRates.failure[severity];
    
    // Additional penalty for repeated failures
    const recentFailures = await this.getRecentFailureCount(pattern.id);
    if (recentFailures > 3) {
      adjustment *= 2;
    }
    
    return Math.max(0.1, currentConfidence + adjustment);
  }

  /**
   * Capture human modifications for learning
   */
  async captureModification(patternId, modifications) {
    try {
      // Store modification details for pattern evolution
      const query = `
        INSERT INTO pattern_modifications (
          pattern_id, modifications, modification_type,
          created_at
        ) VALUES ($1, $2, $3, NOW())
      `;
      
      await db.query(query, [
        patternId,
        JSON.stringify(modifications),
        this.classifyModificationType(modifications)
      ]);
      
      // Check if modifications form a new pattern
      const shouldFork = await this.shouldForkPattern(patternId, modifications);
      if (shouldFork) {
        await this.createForkedPattern(patternId, modifications);
      }
      
    } catch (error) {
      logger.error('Error capturing modification', { patternId, error });
    }
  }

  /**
   * Check if pattern should be promoted to auto-executable
   */
  async shouldPromoteToAutoExecutable(pattern) {
    // Get recent performance metrics
    const metrics = await this.getPatternMetrics(pattern.id, 30); // Last 30 days
    
    return (
      pattern.confidence_score >= this.promotionThresholds.minConfidence &&
      metrics.executionCount >= this.promotionThresholds.executionCount &&
      metrics.successRate >= this.promotionThresholds.successRate &&
      metrics.recentFailures === 0
    );
  }

  /**
   * Check if pattern should be demoted from auto-executable
   */
  async shouldDemoteFromAutoExecutable(pattern) {
    const metrics = await this.getPatternMetrics(pattern.id, 7); // Last 7 days
    
    return (
      pattern.confidence_score < 0.80 ||
      metrics.successRate < 0.70 ||
      metrics.recentFailures > 5 ||
      metrics.criticalFailures > 0
    );
  }

  /**
   * Apply time-based confidence decay
   */
  async applyConfidenceDecay() {
    try {
      // Decay confidence for patterns not used in 7+ days
      const query = `
        UPDATE decision_patterns
        SET confidence_score = GREATEST(
          0.5, 
          confidence_score - $1
        )
        WHERE last_seen < NOW() - INTERVAL '7 days'
        AND confidence_score > 0.5
        RETURNING id, confidence_score
      `;
      
      const result = await db.query(query, [this.decayRate]);
      
      if (result.rows.length > 0) {
        logger.info(`Applied confidence decay to ${result.rows.length} patterns`);
      }
      
      return result.rows;
      
    } catch (error) {
      logger.error('Error applying confidence decay', error);
      throw error;
    }
  }

  /**
   * Evolve patterns based on collective learning
   */
  async evolvePatterns() {
    try {
      // Find patterns with high modification rates
      const query = `
        WITH pattern_mods AS (
          SELECT 
            dp.id,
            dp.decision_type,
            COUNT(DISTINCT pm.id) as mod_count,
            COUNT(DISTINCT peh.id) as exec_count
          FROM decision_patterns dp
          LEFT JOIN pattern_modifications pm ON dp.id = pm.pattern_id
          LEFT JOIN pattern_execution_history peh ON dp.id = peh.pattern_id
          WHERE peh.created_at > NOW() - INTERVAL '30 days'
          GROUP BY dp.id
        )
        SELECT * FROM pattern_mods
        WHERE mod_count::float / NULLIF(exec_count, 0) > 0.2
      `;
      
      const candidates = await db.query(query);
      
      for (const candidate of candidates.rows) {
        await this.analyzePatternEvolution(candidate.id);
      }
      
      return candidates.rows.length;
      
    } catch (error) {
      logger.error('Error evolving patterns', error);
      throw error;
    }
  }

  /**
   * Analyze pattern for potential evolution
   */
  async analyzePatternEvolution(patternId) {
    // Get all modifications
    const modifications = await this.getPatternModifications(patternId);
    
    // Find common modification patterns
    const commonChanges = this.findCommonModifications(modifications);
    
    if (commonChanges.length > 0) {
      // Create evolved version
      await this.createEvolvedPattern(patternId, commonChanges);
    }
  }

  /**
   * Get pattern from database
   */
  async getPattern(patternId) {
    const result = await db.query(
      'SELECT * FROM decision_patterns WHERE id = $1',
      [patternId]
    );
    return result.rows[0];
  }

  /**
   * Update pattern confidence and status
   */
  async updatePattern(patternId, updates) {
    const query = `
      UPDATE decision_patterns
      SET confidence_score = $2,
          auto_executable = $3,
          last_modified = $4
      WHERE id = $1
    `;
    
    await db.query(query, [
      patternId,
      updates.confidence,
      updates.autoExecutable,
      updates.lastModified
    ]);
  }

  /**
   * Get pattern performance metrics
   */
  async getPatternMetrics(patternId, days) {
    const query = `
      SELECT 
        COUNT(*) as execution_count,
        SUM(CASE WHEN execution_status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN execution_status = 'failure' THEN 1 ELSE 0 END) as failure_count,
        SUM(CASE WHEN execution_status = 'failure' 
            AND created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as recent_failures,
        SUM(CASE WHEN execution_status = 'failure' 
            AND error_message LIKE '%critical%' THEN 1 ELSE 0 END) as critical_failures
      FROM pattern_execution_history
      WHERE pattern_id = $1
      AND created_at > NOW() - INTERVAL '${days} days'
    `;
    
    const result = await db.query(query, [patternId]);
    const metrics = result.rows[0];
    
    return {
      executionCount: parseInt(metrics.execution_count),
      successCount: parseInt(metrics.success_count),
      failureCount: parseInt(metrics.failure_count),
      successRate: metrics.execution_count > 0 ? 
        metrics.success_count / metrics.execution_count : 0,
      recentFailures: parseInt(metrics.recent_failures),
      criticalFailures: parseInt(metrics.critical_failures)
    };
  }

  /**
   * Get recent success rate
   */
  async getRecentSuccessRate(patternId) {
    const metrics = await this.getPatternMetrics(patternId, 7);
    return metrics.successRate;
  }

  /**
   * Get recent failure count
   */
  async getRecentFailureCount(patternId) {
    const metrics = await this.getPatternMetrics(patternId, 7);
    return metrics.failureCount;
  }

  /**
   * Classify failure severity
   */
  classifyFailureSeverity(outcome) {
    if (outcome.error && outcome.error.includes('critical')) {
      return 'critical';
    } else if (outcome.error && outcome.error.includes('timeout')) {
      return 'major';
    } else {
      return 'minor';
    }
  }

  /**
   * Classify modification type
   */
  classifyModificationType(modifications) {
    // Analyze modifications to determine type
    if (modifications.steps && modifications.steps.length > 0) {
      return 'workflow_change';
    } else if (modifications.parameters) {
      return 'parameter_adjustment';
    } else if (modifications.conditions) {
      return 'condition_change';
    } else {
      return 'other';
    }
  }

  /**
   * Log confidence changes for analysis
   */
  async logConfidenceChange(patternId, oldConfidence, newConfidence, outcome) {
    const change = newConfidence - oldConfidence;
    
    logger.info('Pattern confidence updated', {
      patternId,
      oldConfidence,
      newConfidence,
      change,
      reason: outcome.success ? 'success' : 'failure',
      humanModified: outcome.humanModified
    });
  }

  /**
   * Create table for pattern modifications if it doesn't exist
   */
  async ensureModificationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS pattern_modifications (
        id SERIAL PRIMARY KEY,
        pattern_id INTEGER REFERENCES decision_patterns(id),
        modifications JSONB NOT NULL,
        modification_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    try {
      await db.query(query);
    } catch (error) {
      // Table might already exist
    }
  }
}

module.exports = new ConfidenceEvolution();