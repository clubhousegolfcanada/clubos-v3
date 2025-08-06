const db = require('../../../db/pool');
const logger = require('../../../utils/logger');

/**
 * Base class for all pattern modules
 * Provides common functionality for pattern matching and learning
 */
class BasePatternModule {
  constructor(name, config = {}) {
    this.name = name;
    this.config = {
      minConfidenceForSuggestion: config.minConfidenceForSuggestion || 0.5,
      learningEnabled: config.learningEnabled !== false,
      crossDomainLearning: config.crossDomainLearning !== false,
      patternDecayDays: config.patternDecayDays || 90,
      ...config
    };
    
    // Pattern matching weights
    this.weights = {
      exactMatch: 1.0,
      contextMatch: 0.3,
      semanticMatch: 0.2,
      temporalMatch: 0.1,
      outcomeHistory: 0.2
    };
  }

  /**
   * Check if this module can handle the event type
   */
  canHandle(eventType) {
    throw new Error('canHandle method must be implemented by subclass');
  }

  /**
   * Find patterns matching the event
   */
  async findPatterns(event) {
    try {
      // Get patterns from both decision_patterns and learning_patterns
      const patterns = await this.searchPatterns(event);
      
      // Calculate match scores
      const scoredPatterns = await Promise.all(
        patterns.map(async pattern => ({
          pattern,
          confidence: await this.calculateConfidence(pattern, event),
          matchDetails: await this.getMatchDetails(pattern, event)
        }))
      );
      
      // Filter by minimum confidence
      const validPatterns = scoredPatterns.filter(
        p => p.confidence >= this.config.minConfidenceForSuggestion
      );
      
      // Sort by confidence
      return validPatterns.sort((a, b) => b.confidence - a.confidence);
      
    } catch (error) {
      logger.error(`Error finding patterns in ${this.name}`, error);
      return [];
    }
  }

  /**
   * Search for relevant patterns in database
   */
  async searchPatterns(event) {
    const signature = await this.generateSignature(event);
    
    const query = `
      WITH combined_patterns AS (
        -- Decision patterns
        SELECT 
          'decision' as source,
          id,
          decision_type as pattern_type,
          trigger_signature as signature,
          decision_logic as logic,
          confidence_score,
          auto_executable,
          execution_count,
          success_count,
          last_seen
        FROM decision_patterns
        WHERE decision_type = $1
          OR trigger_signature LIKE $2
          OR decision_type = 'general'
        
        UNION ALL
        
        -- Learning patterns (for backward compatibility)
        SELECT 
          'learning' as source,
          id,
          fix_class as pattern_type,
          error_signature as signature,
          pattern_logic as logic,
          relevance_score as confidence_score,
          false as auto_executable,
          match_count as execution_count,
          success_count,
          last_seen
        FROM learning_patterns
        WHERE module_context = $1
          OR error_signature LIKE $2
      )
      SELECT * FROM combined_patterns
      WHERE last_seen > NOW() - INTERVAL '${this.config.patternDecayDays} days'
      ORDER BY confidence_score DESC, execution_count DESC
      LIMIT 20
    `;
    
    const result = await db.query(query, [this.name, `%${signature}%`]);
    return result.rows;
  }

  /**
   * Calculate confidence score for pattern match
   */
  async calculateConfidence(pattern, event) {
    let confidence = 0;
    
    // Exact signature match
    const signature = await this.generateSignature(event);
    if (pattern.signature === signature) {
      confidence += this.weights.exactMatch;
    } else {
      // Partial match
      const similarity = this.calculateSimilarity(pattern.signature, signature);
      confidence += similarity * this.weights.exactMatch * 0.5;
    }
    
    // Context matching
    const contextScore = await this.calculateContextMatch(pattern, event);
    confidence += contextScore * this.weights.contextMatch;
    
    // Semantic matching (domain-specific)
    const semanticScore = await this.calculateSemanticMatch(pattern, event);
    confidence += semanticScore * this.weights.semanticMatch;
    
    // Temporal matching (time-based patterns)
    const temporalScore = this.calculateTemporalMatch(pattern, event);
    confidence += temporalScore * this.weights.temporalMatch;
    
    // Historical success rate
    if (pattern.execution_count > 0) {
      const successRate = pattern.success_count / pattern.execution_count;
      confidence += successRate * this.weights.outcomeHistory;
    }
    
    // Apply pattern's own confidence score
    confidence *= pattern.confidence_score;
    
    // Normalize to 0-1 range
    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Generate signature for pattern matching
   */
  async generateSignature(event) {
    // Override in subclasses for specific signature generation
    const components = [
      this.name,
      event.type || event.eventType || '',
      event.category || '',
      event.action || ''
    ].filter(Boolean);
    
    return components.join(':').toLowerCase();
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0 || len2 === 0) return 0.0;
    
    // Calculate Levenshtein distance
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    
    return 1 - (distance / maxLen);
  }

  /**
   * Calculate context match score
   */
  async calculateContextMatch(pattern, event) {
    // Override in subclasses for specific context matching
    if (!pattern.logic?.context || !event.context) return 0;
    
    const patternContext = pattern.logic.context;
    const eventContext = event.context;
    
    let matches = 0;
    let total = 0;
    
    for (const key in patternContext) {
      total++;
      if (eventContext[key] === patternContext[key]) {
        matches++;
      }
    }
    
    return total > 0 ? matches / total : 0;
  }

  /**
   * Calculate semantic match score (override in subclasses)
   */
  async calculateSemanticMatch(pattern, event) {
    // Default implementation - override for domain-specific logic
    return 0.5;
  }

  /**
   * Calculate temporal match score
   */
  calculateTemporalMatch(pattern, event) {
    const now = new Date();
    const eventTime = new Date(event.timestamp || now);
    const hour = eventTime.getHours();
    const dayOfWeek = eventTime.getDay();
    
    // Check if pattern has temporal context
    if (!pattern.logic?.temporalContext) return 0.5;
    
    const temporalContext = pattern.logic.temporalContext;
    let score = 0;
    
    // Hour matching
    if (temporalContext.typicalHours) {
      if (temporalContext.typicalHours.includes(hour)) {
        score += 0.5;
      }
    }
    
    // Day of week matching
    if (temporalContext.typicalDays) {
      if (temporalContext.typicalDays.includes(dayOfWeek)) {
        score += 0.5;
      }
    }
    
    return score;
  }

  /**
   * Get detailed match information
   */
  async getMatchDetails(pattern, event) {
    return {
      signature: pattern.signature,
      type: pattern.pattern_type,
      source: pattern.source,
      executionCount: pattern.execution_count,
      successRate: pattern.execution_count > 0 
        ? pattern.success_count / pattern.execution_count 
        : 0,
      lastSeen: pattern.last_seen,
      autoExecutable: pattern.auto_executable
    };
  }

  /**
   * Learn from execution outcome
   */
  async learnFromOutcome(patternId, event, outcome) {
    try {
      // Update pattern statistics
      await this.updatePatternStats(patternId, outcome.success);
      
      // If outcome was modified by human, capture the learning
      if (outcome.humanModified && this.config.learningEnabled) {
        await this.captureHumanKnowledge(patternId, event, outcome);
      }
      
      // Cross-domain learning
      if (this.config.crossDomainLearning && outcome.success) {
        await this.shareLearning(patternId, event, outcome);
      }
      
    } catch (error) {
      logger.error(`Error learning from outcome in ${this.name}`, error);
    }
  }

  /**
   * Update pattern statistics
   */
  async updatePatternStats(patternId, success) {
    const query = `
      UPDATE decision_patterns
      SET execution_count = execution_count + 1,
          ${success ? 'success_count = success_count + 1' : 'failure_count = failure_count + 1'},
          last_seen = NOW()
      WHERE id = $1
    `;
    
    await db.query(query, [patternId]);
  }

  /**
   * Capture human knowledge from modifications
   */
  async captureHumanKnowledge(patternId, event, outcome) {
    const query = `
      INSERT INTO pattern_modifications (
        pattern_id, 
        event_context,
        original_action,
        modified_action,
        modification_reason,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    
    await db.query(query, [
      patternId,
      JSON.stringify(event),
      JSON.stringify(outcome.originalAction),
      JSON.stringify(outcome.modifiedAction),
      outcome.modificationReason || 'User modification'
    ]);
    
    // Check if we should create a new pattern variant
    await this.checkForPatternEvolution(patternId);
  }

  /**
   * Share learning across domains
   */
  async shareLearning(patternId, event, outcome) {
    // Store cross-domain insight
    const query = `
      INSERT INTO cross_domain_learnings (
        source_module,
        pattern_id,
        event_type,
        insight,
        applicability_score,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    
    const insight = this.extractInsight(event, outcome);
    
    await db.query(query, [
      this.name,
      patternId,
      event.type,
      JSON.stringify(insight),
      this.calculateApplicabilityScore(insight)
    ]);
  }

  /**
   * Check if pattern should evolve based on modifications
   */
  async checkForPatternEvolution(patternId) {
    const query = `
      SELECT COUNT(*) as mod_count
      FROM pattern_modifications
      WHERE pattern_id = $1
      AND created_at > NOW() - INTERVAL '30 days'
    `;
    
    const result = await db.query(query, [patternId]);
    const modCount = parseInt(result.rows[0].mod_count);
    
    // If pattern has been modified frequently, consider evolution
    if (modCount >= 5) {
      await this.evolvePattern(patternId);
    }
  }

  /**
   * Evolve pattern based on modifications
   */
  async evolvePattern(patternId) {
    // This would analyze modifications and create improved pattern
    logger.info(`Pattern ${patternId} ready for evolution in ${this.name}`);
  }

  /**
   * Extract reusable insight from outcome
   */
  extractInsight(event, outcome) {
    return {
      trigger: this.extractTriggerPattern(event),
      action: outcome.action,
      conditions: this.extractConditions(event, outcome),
      outcome: outcome.result
    };
  }

  /**
   * Extract trigger pattern from event
   */
  extractTriggerPattern(event) {
    // Override in subclasses for domain-specific extraction
    return {
      type: event.type,
      key_attributes: this.extractKeyAttributes(event)
    };
  }

  /**
   * Extract key attributes from event
   */
  extractKeyAttributes(event) {
    // Override in subclasses
    return {};
  }

  /**
   * Extract conditions that led to successful outcome
   */
  extractConditions(event, outcome) {
    // Override in subclasses
    return {};
  }

  /**
   * Calculate how applicable an insight is to other domains
   */
  calculateApplicabilityScore(insight) {
    // Simple scoring - override for better logic
    let score = 0.5;
    
    if (insight.conditions && Object.keys(insight.conditions).length > 0) {
      score += 0.2;
    }
    
    if (insight.outcome && insight.outcome.success) {
      score += 0.3;
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Create the pattern modifications table if it doesn't exist
   */
  async ensureModificationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS pattern_modifications (
        id SERIAL PRIMARY KEY,
        pattern_id INTEGER REFERENCES decision_patterns(id),
        event_context JSONB,
        original_action JSONB,
        modified_action JSONB,
        modification_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS cross_domain_learnings (
        id SERIAL PRIMARY KEY,
        source_module VARCHAR(100),
        pattern_id INTEGER REFERENCES decision_patterns(id),
        event_type VARCHAR(100),
        insight JSONB,
        applicability_score DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    try {
      await db.query(query);
    } catch (error) {
      // Tables might already exist
    }
  }
}

module.exports = BasePatternModule;