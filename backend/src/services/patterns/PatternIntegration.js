const unifiedPatternEngine = require('./UnifiedPatternEngine');
const logger = require('../../utils/logger');
const EventEmitter = require('events');

/**
 * Pattern Integration Module
 * Bridges the UnifiedPatternEngine with the rest of the application
 */
class PatternIntegration extends EventEmitter {
  constructor() {
    super();
    this.setupEventListeners();
    this.pendingSuggestions = new Map();
    this.approvalHandlers = new Map();
  }

  /**
   * Setup event listeners for the pattern engine
   */
  setupEventListeners() {
    // Event received
    unifiedPatternEngine.on('event:received', (event) => {
      logger.info('Pattern engine received event', {
        eventType: event.type,
        processId: event._metadata?.processId
      });
    });

    // Event processed
    unifiedPatternEngine.on('event:processed', ({ event, result }) => {
      logger.info('Pattern engine processed event', {
        eventType: event.type,
        resultType: result.type,
        processingTime: result.processingTime
      });
      
      // Emit for application handling
      this.emit('pattern:processed', { event, result });
    });

    // Suggestion created
    unifiedPatternEngine.on('suggestion:created', (suggestion) => {
      logger.info('Pattern suggestion created', {
        suggestionId: suggestion.id,
        confidence: suggestion.confidence,
        timeoutSeconds: suggestion.timeoutSeconds
      });
      
      // Store suggestion for UI display
      this.pendingSuggestions.set(suggestion.id, suggestion);
      
      // Emit for UI notification
      this.emit('suggestion:pending', suggestion);
    });

    // Approval queued
    unifiedPatternEngine.on('approval:queued', (approvalRequest) => {
      logger.info('Pattern queued for approval', {
        queueId: approvalRequest.id,
        confidence: approvalRequest.confidence
      });
      
      // Emit for approval UI
      this.emit('approval:required', approvalRequest);
    });

    // Anomaly detected
    unifiedPatternEngine.on('anomaly:detected', (anomaly) => {
      logger.warn('Anomaly detected by pattern engine', {
        anomalyId: anomaly.id,
        severity: anomaly.severity,
        factors: anomaly.details?.factors
      });
      
      // Emit for monitoring/alerting
      this.emit('anomaly:alert', anomaly);
    });

    // Anomaly escalated
    unifiedPatternEngine.on('anomaly:escalated', (anomaly) => {
      logger.error('Critical anomaly escalated', {
        anomalyId: anomaly.id,
        severity: anomaly.severity
      });
      
      // Emit for immediate action
      this.emit('anomaly:critical', anomaly);
    });

    // Execution events
    unifiedPatternEngine.on('execution:start', ({ executionId, pattern }) => {
      logger.debug('Pattern execution started', {
        executionId,
        patternId: pattern.id
      });
    });

    unifiedPatternEngine.on('execution:success', ({ executionId, result }) => {
      logger.info('Pattern execution succeeded', {
        executionId,
        resultType: result.type
      });
    });

    unifiedPatternEngine.on('execution:failure', ({ executionId, error }) => {
      logger.error('Pattern execution failed', {
        executionId,
        error: error.message
      });
    });
  }

  /**
   * Process an event through the pattern engine
   */
  async processEvent(event) {
    try {
      const result = await unifiedPatternEngine.processEvent(event);
      
      // Handle different result types
      switch (result.type) {
        case 'suggestion_with_timeout':
          return this.handleSuggestionResult(result);
          
        case 'requires_approval':
          return this.handleApprovalResult(result);
          
        case 'anomaly':
          return this.handleAnomalyResult(result);
          
        default:
          return result;
      }
    } catch (error) {
      logger.error('Error processing event through patterns', error);
      throw error;
    }
  }

  /**
   * Handle suggestion with timeout result
   */
  handleSuggestionResult(result) {
    const { suggestionId, suggestion } = result;
    
    // Create response object with control methods
    return {
      type: 'suggestion',
      suggestionId,
      suggestion,
      confidence: suggestion.confidence,
      timeoutSeconds: suggestion.timeoutSeconds,
      
      // Control methods
      approve: async () => {
        this.pendingSuggestions.delete(suggestionId);
        return await result.approve();
      },
      
      reject: async (reason) => {
        this.pendingSuggestions.delete(suggestionId);
        return await result.reject(reason);
      },
      
      modify: async (modifications) => {
        this.pendingSuggestions.delete(suggestionId);
        return await result.modify(modifications);
      }
    };
  }

  /**
   * Handle approval required result
   */
  handleApprovalResult(result) {
    const { queueId, approvalRequest } = result;
    
    // Register approval handlers
    this.approvalHandlers.set(queueId, {
      approve: result.approve,
      reject: result.reject,
      modify: result.modify
    });
    
    return {
      type: 'approval_required',
      queueId,
      approvalRequest,
      confidence: approvalRequest.confidence,
      pattern: approvalRequest.pattern,
      reasoning: approvalRequest.reasoning
    };
  }

  /**
   * Handle anomaly result
   */
  handleAnomalyResult(result) {
    return {
      type: 'anomaly',
      anomalyId: result.anomalyId,
      severity: result.severity,
      reason: result.reason,
      requiresHumanIntervention: true,
      escalated: result.escalated
    };
  }

  /**
   * Approve a queued pattern
   */
  async approvePattern(queueId, userId) {
    const handlers = this.approvalHandlers.get(queueId);
    if (!handlers) {
      throw new Error('Approval request not found');
    }
    
    const result = await handlers.approve(userId);
    this.approvalHandlers.delete(queueId);
    
    return result;
  }

  /**
   * Reject a queued pattern
   */
  async rejectPattern(queueId, userId, reason) {
    const handlers = this.approvalHandlers.get(queueId);
    if (!handlers) {
      throw new Error('Approval request not found');
    }
    
    const result = await handlers.reject(userId, reason);
    this.approvalHandlers.delete(queueId);
    
    return result;
  }

  /**
   * Modify a queued pattern
   */
  async modifyPattern(queueId, userId, modifications) {
    const handlers = this.approvalHandlers.get(queueId);
    if (!handlers) {
      throw new Error('Approval request not found');
    }
    
    const result = await handlers.modify(userId, modifications);
    this.approvalHandlers.delete(queueId);
    
    return result;
  }

  /**
   * Get pending suggestions
   */
  getPendingSuggestions() {
    return Array.from(this.pendingSuggestions.values());
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals() {
    const db = require('../../db/pool');
    const query = `
      SELECT 
        paq.*,
        dp.decision_type,
        dp.trigger_signature,
        dp.decision_logic
      FROM pattern_approval_queue paq
      JOIN decision_patterns dp ON paq.pattern_id = dp.id
      WHERE paq.status = 'pending'
      ORDER BY paq.created_at ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Get anomaly statistics
   */
  async getAnomalyStats(hours = 24) {
    const db = require('../../db/pool');
    const query = `
      SELECT 
        severity,
        COUNT(*) as count,
        COUNT(CASE WHEN escalated THEN 1 END) as escalated_count,
        array_agg(DISTINCT detection_reason) as reasons
      FROM anomalies
      WHERE detected_at > NOW() - INTERVAL '${hours} hours'
      GROUP BY severity
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Get pattern performance metrics
   */
  async getPatternMetrics() {
    const db = require('../../db/pool');
    const query = `
      SELECT 
        dp.decision_type,
        COUNT(DISTINCT dp.id) as pattern_count,
        AVG(dp.confidence_score) as avg_confidence,
        SUM(dp.execution_count) as total_executions,
        AVG(CASE WHEN dp.execution_count > 0 
          THEN dp.success_count::FLOAT / dp.execution_count 
          ELSE 0 END) as avg_success_rate,
        COUNT(DISTINCT paq.id) as pending_approvals,
        COUNT(DISTINCT ho.id) as human_overrides
      FROM decision_patterns dp
      LEFT JOIN pattern_approval_queue paq ON dp.id = paq.pattern_id AND paq.status = 'pending'
      LEFT JOIN human_overrides ho ON dp.id = ho.pattern_id
      GROUP BY dp.decision_type
      ORDER BY total_executions DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Record human override
   */
  async recordHumanOverride(patternId, event, originalDecision, overrideDecision, reason, userId) {
    const db = require('../../db/pool');
    
    // Calculate confidence impact based on override severity
    const confidenceImpact = this.calculateConfidenceImpact(originalDecision, overrideDecision);
    
    const query = `
      INSERT INTO human_overrides (
        pattern_id, event_context, original_decision,
        override_decision, override_reason, override_by,
        confidence_impact
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const result = await db.query(query, [
      patternId,
      JSON.stringify(event),
      JSON.stringify(originalDecision),
      JSON.stringify(overrideDecision),
      reason,
      userId,
      confidenceImpact
    ]);
    
    // Emit override event for learning
    this.emit('pattern:overridden', {
      overrideId: result.rows[0].id,
      patternId,
      confidenceImpact
    });
    
    return result.rows[0].id;
  }

  /**
   * Calculate confidence impact from override
   */
  calculateConfidenceImpact(original, override) {
    // Simple heuristic - can be made more sophisticated
    if (override.action === 'reject' && original.action === 'approve') {
      return -0.1; // Major disagreement
    } else if (override.action === 'modify') {
      return -0.05; // Minor adjustment needed
    } else {
      return -0.02; // General override
    }
  }
}

// Create singleton instance
const patternIntegration = new PatternIntegration();

module.exports = patternIntegration;