const db = require('../../db/pool');
const logger = require('../../utils/logger');
const recursiveLearning = require('../recursiveLearning');
const EventEmitter = require('events');

// Import pattern modules
const ErrorPatternModule = require('./modules/ErrorPatternModule');
const DecisionPatternModule = require('./modules/DecisionPatternModule');
const BookingPatternModule = require('./modules/BookingPatternModule');
const AccessPatternModule = require('./modules/AccessPatternModule');

class UnifiedPatternEngine extends EventEmitter {
  constructor() {
    super();
    this.modules = new Map();
    this.confidenceThresholds = {
      autoExecute: parseFloat(process.env.PATTERN_CONFIDENCE_HIGH || '0.95'),
      suggestWithTimeout: parseFloat(process.env.PATTERN_CONFIDENCE_MEDIUM || '0.75'),
      requireApproval: parseFloat(process.env.PATTERN_CONFIDENCE_LOW || '0.50')
    };
    this.timeoutDuration = parseInt(process.env.PATTERN_TIMEOUT_MS || '30000'); // 30 seconds default
    this.pendingTimeouts = new Map();
    this.approvalQueue = new Map();
    this.executionHandlers = new Map();
    
    // Initialize pattern modules
    this.initializeModules();
  }

  /**
   * Initialize all pattern modules
   */
  initializeModules() {
    // Register core modules
    this.registerModule('error', new ErrorPatternModule());
    this.registerModule('decision', new DecisionPatternModule());
    this.registerModule('booking', new BookingPatternModule());
    this.registerModule('access', new AccessPatternModule());
    
    logger.info('Pattern modules initialized', {
      modules: Array.from(this.modules.keys())
    });
  }

  /**
   * Register a pattern module
   */
  registerModule(name, module) {
    this.modules.set(name, module);
    logger.info(`Registered pattern module: ${name}`);
  }

  /**
   * Process any type of event through the unified engine
   */
  async processEvent(event) {
    const startTime = Date.now();
    
    try {
      // Add event metadata
      event._metadata = {
        receivedAt: new Date(),
        processId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Emit event received
      this.emit('event:received', event);
      
      // Classify event type
      const eventType = await this.classifyEvent(event);
      
      // Check for anomalies first
      const anomalyCheck = await this.detectAnomaly(event, eventType);
      if (anomalyCheck.isAnomaly) {
        return await this.handleAnomaly(event, anomalyCheck.reason, anomalyCheck.details);
      }
      
      // Find matching patterns across all modules
      const matches = await this.findPatterns(event, eventType);
      
      if (!matches || matches.length === 0) {
        // New anomaly - escalate immediately
        return await this.handleAnomaly(event, 'no_matching_pattern');
      }
      
      // Get best match
      const bestMatch = matches[0];
      
      // Apply confidence-based automation
      const result = await this.applyAutomation(bestMatch, event);
      
      // Track processing time
      result.processingTime = Date.now() - startTime;
      
      // Emit event processed
      this.emit('event:processed', { event, result });
      
      return result;
      
    } catch (error) {
      logger.error('Error in UnifiedPatternEngine', error);
      
      // Emit error event
      this.emit('event:error', { event, error });
      
      throw error;
    }
  }

  /**
   * Classify event into categories
   */
  async classifyEvent(event) {
    // Determine event type based on content and context
    if (event.error) {
      return 'error';
    } else if (event.type) {
      return event.type;
    } else if (event.content) {
      // Analyze content to determine type
      const content = event.content.toLowerCase();
      if (content.includes('book') || content.includes('reservation')) {
        return 'booking';
      } else if (content.includes('door') || content.includes('access')) {
        return 'access';
      } else if (content.includes('trackman') || content.includes('equipment')) {
        return 'equipment';
      }
    }
    
    return 'general';
  }

  /**
   * Find matching patterns across all modules
   */
  async findPatterns(event, eventType) {
    const allMatches = [];
    
    // Search in module-specific patterns first (they have better domain understanding)
    const modulePromises = [];
    for (const [moduleName, module] of this.modules) {
      if (module.canHandle && module.canHandle(eventType)) {
        modulePromises.push(
          module.findPatterns(event)
            .then(matches => matches.map(match => ({
              ...match,
              source: moduleName,
              module: module
            })))
            .catch(error => {
              logger.error(`Error in ${moduleName} module`, error);
              return [];
            })
        );
      }
    }
    
    // Execute all module searches in parallel
    const moduleResults = await Promise.all(modulePromises);
    for (const matches of moduleResults) {
      allMatches.push(...matches);
    }
    
    // Also search in decision patterns table for general patterns
    const decisionMatches = await this.searchDecisionPatterns(event, eventType);
    allMatches.push(...decisionMatches);
    
    // Remove duplicates and sort by confidence
    const uniqueMatches = this.deduplicateMatches(allMatches);
    return uniqueMatches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Deduplicate pattern matches
   */
  deduplicateMatches(matches) {
    const seen = new Map();
    const unique = [];
    
    for (const match of matches) {
      const key = `${match.pattern?.id || 'unknown'}_${match.source}`;
      if (!seen.has(key) || seen.get(key).confidence < match.confidence) {
        seen.set(key, match);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Search decision patterns in database
   */
  async searchDecisionPatterns(event, eventType) {
    try {
      const signature = await this.generateEventSignature(event, eventType);
      
      const query = `
        SELECT 
          dp.*,
          calculate_pattern_success_rate(dp.id) as success_rate,
          COUNT(peh.id) as recent_executions,
          MAX(peh.created_at) as last_execution
        FROM decision_patterns dp
        LEFT JOIN pattern_execution_history peh ON dp.id = peh.pattern_id
          AND peh.created_at > NOW() - INTERVAL '7 days'
        WHERE dp.decision_type = $1
          OR dp.trigger_signature = $2
          OR dp.decision_type = 'general'
        GROUP BY dp.id
        ORDER BY 
          CASE WHEN dp.trigger_signature = $2 THEN 0 ELSE 1 END,
          dp.confidence_score DESC,
          dp.execution_count DESC
        LIMIT 10
      `;
      
      const result = await db.query(query, [eventType, signature]);
      
      return result.rows.map(row => ({
        pattern: row,
        confidence: parseFloat(row.confidence_score),
        source: 'decision_patterns',
        successRate: parseFloat(row.success_rate),
        recentExecutions: parseInt(row.recent_executions)
      }));
      
    } catch (error) {
      logger.error('Error searching decision patterns', error);
      return [];
    }
  }

  /**
   * Apply confidence-based automation rules
   */
  async applyAutomation(match, event) {
    const { pattern, confidence, source } = match;
    
    // Log pattern match
    await this.logPatternMatch(pattern, event, confidence);
    
    if (confidence >= this.confidenceThresholds.autoExecute && pattern.auto_executable) {
      // Auto-execute with logging
      logger.info('Auto-executing high confidence pattern', {
        patternId: pattern.id,
        confidence,
        source
      });
      return await this.autoExecute(pattern, event);
      
    } else if (confidence >= this.confidenceThresholds.suggestWithTimeout) {
      // Suggest and auto-execute if no response
      logger.info('Suggesting pattern with timeout', {
        patternId: pattern.id,
        confidence,
        timeout: this.timeoutDuration
      });
      return await this.suggestWithTimeout(pattern, event, confidence);
      
    } else if (confidence >= this.confidenceThresholds.requireApproval) {
      // Queue for human review
      logger.info('Queueing pattern for approval', {
        patternId: pattern.id,
        confidence
      });
      return await this.queueForApproval(pattern, event, confidence);
      
    } else {
      // Too low confidence - treat as anomaly
      return await this.handleAnomaly(event, 'low_confidence', match);
    }
  }

  /**
   * Auto-execute a pattern
   */
  async autoExecute(pattern, event, module = null) {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Emit execution start
      this.emit('execution:start', { executionId, pattern, event });
      
      // Validate pre-conditions if any
      if (pattern.requires_validation || pattern.conditions) {
        const validationResult = await this.validateConditions(
          pattern.requires_validation || pattern.conditions,
          event
        );
        if (!validationResult.valid) {
          throw new Error(`Validation failed: ${validationResult.reason}`);
        }
      }
      
      // Execute the pattern logic
      const logic = pattern.decision_logic || pattern.logic || pattern;
      const result = await this.executePatternLogic(logic, event, module);
      
      // Handle side effects
      if (pattern.side_effects || logic.side_effects) {
        await this.handleSideEffects(
          pattern.side_effects || logic.side_effects,
          result,
          event
        );
      }
      
      // Record successful execution
      const executionRecord = {
        status: 'success',
        executionTime: Date.now() - startTime,
        wasAutoExecuted: true,
        confidence: pattern.confidence_score || 1.0,
        result
      };
      
      await this.recordExecution(pattern.id, event, executionRecord);
      
      // Update pattern statistics
      await this.updatePatternStats(pattern.id, true);
      
      // Learn from successful execution
      if (module && module.learnFromOutcome) {
        await module.learnFromOutcome(pattern.id, event, {
          success: true,
          result,
          executionTime: executionRecord.executionTime
        });
      }
      
      // Emit execution success
      this.emit('execution:success', { executionId, result });
      
      return {
        success: true,
        patternId: pattern.id,
        executionId,
        result,
        executionTime: Date.now() - startTime,
        wasAutoExecuted: true
      };
      
    } catch (error) {
      logger.error('Error during auto-execution', error);
      
      // Record failed execution
      await this.recordExecution(pattern.id, event, {
        status: 'failure',
        executionTime: Date.now() - startTime,
        wasAutoExecuted: true,
        error: error.message
      });
      
      // Update pattern statistics
      await this.updatePatternStats(pattern.id, false);
      
      // Reduce confidence on failure
      await this.adjustPatternConfidence(pattern.id, -0.05);
      
      // Learn from failure
      if (module && module.learnFromOutcome) {
        await module.learnFromOutcome(pattern.id, event, {
          success: false,
          error: error.message,
          failureReason: 'execution_error'
        });
      }
      
      // Emit execution failure
      this.emit('execution:failure', { executionId, error });
      
      throw error;
    }
  }

  /**
   * Suggest pattern with automatic execution after timeout
   */
  async suggestWithTimeout(pattern, event, confidence, module = null) {
    const suggestionId = `suggest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create suggestion
    const suggestion = {
      id: suggestionId,
      patternId: pattern.id,
      pattern: pattern.decision_logic || pattern.logic || pattern,
      confidence,
      reasoning: pattern.decision_logic?.reasoning || pattern.logic?.reasoning || 
                 'Based on previous similar decisions',
      timeoutSeconds: this.timeoutDuration / 1000,
      requiresApproval: true,
      suggestedAt: new Date()
    };
    
    // Store suggestion for tracking
    this.pendingTimeouts.set(suggestionId, {
      pattern,
      event,
      module,
      suggestion
    });
    
    // Emit suggestion created
    this.emit('suggestion:created', suggestion);
    
    // Set timeout for auto-execution
    const timeoutId = setTimeout(async () => {
      logger.info('Auto-executing pattern after timeout', {
        suggestionId,
        patternId: pattern.id
      });
      
      try {
        const result = await this.autoExecute(pattern, event, module);
        
        // Record timeout execution
        await this.recordTimeoutExecution(suggestionId, result);
        
        // Emit timeout execution
        this.emit('suggestion:timeout_executed', { suggestionId, result });
        
      } catch (error) {
        logger.error('Error in timeout auto-execution', error);
        
        // Emit timeout execution error
        this.emit('suggestion:timeout_error', { suggestionId, error });
      }
      
      this.pendingTimeouts.delete(suggestionId);
    }, this.timeoutDuration);
    
    // Store timeout ID for cancellation
    this.pendingTimeouts.get(suggestionId).timeoutId = timeoutId;
    
    return {
      type: 'suggestion_with_timeout',
      suggestionId,
      suggestion,
      approve: async () => {
        // Cancel timeout
        clearTimeout(timeoutId);
        
        // Execute immediately with approval
        const result = await this.executeWithApproval(pattern, event, module, suggestionId);
        
        // Clean up
        this.pendingTimeouts.delete(suggestionId);
        
        return result;
      },
      reject: async (reason) => {
        // Cancel timeout
        clearTimeout(timeoutId);
        
        // Record rejection
        await this.recordRejection(pattern.id, event, reason, suggestionId);
        
        // Clean up
        this.pendingTimeouts.delete(suggestionId);
        
        // Emit rejection
        this.emit('suggestion:rejected', { suggestionId, reason });
        
        return { type: 'rejected', reason };
      },
      modify: async (modifications) => {
        // Cancel timeout
        clearTimeout(timeoutId);
        
        // Execute with modifications
        const result = await this.executeWithModifications(
          pattern, event, modifications, module, suggestionId
        );
        
        // Clean up
        this.pendingTimeouts.delete(suggestionId);
        
        return result;
      }
    };
  }

  /**
   * Queue pattern for human approval
   */
  async queueForApproval(pattern, event, confidence, module = null) {
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create approval request
    const approvalRequest = {
      id: queueId,
      patternId: pattern.id,
      pattern: pattern.decision_logic || pattern.logic || pattern,
      event,
      confidence,
      reasoning: pattern.decision_logic?.reasoning || pattern.logic?.reasoning ||
                 'Requires human approval due to confidence level',
      queuedAt: new Date(),
      status: 'pending',
      module: module?.name || 'unknown'
    };
    
    // Store in approval queue
    this.approvalQueue.set(queueId, {
      pattern,
      event,
      module,
      approvalRequest
    });
    
    // Persist to database
    const query = `
      INSERT INTO pattern_approval_queue (
        queue_id, pattern_id, trigger_event, execution_context,
        confidence_at_execution, status, reasoning, module_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    
    await db.query(query, [
      queueId,
      pattern.id,
      JSON.stringify(event),
      JSON.stringify({ timestamp: new Date(), source: 'unified_engine' }),
      confidence,
      'pending',
      approvalRequest.reasoning,
      approvalRequest.module
    ]);
    
    // Emit queued event
    this.emit('approval:queued', approvalRequest);
    
    return {
      type: 'requires_approval',
      queueId,
      approvalRequest,
      approve: async (userId) => {
        return await this.approveQueuedPattern(queueId, userId);
      },
      reject: async (userId, reason) => {
        return await this.rejectQueuedPattern(queueId, userId, reason);
      },
      modify: async (userId, modifications) => {
        return await this.modifyQueuedPattern(queueId, userId, modifications);
      }
    };
  }

  /**
   * Detect anomalies in events
   */
  async detectAnomaly(event, eventType) {
    try {
      // Check multiple anomaly factors
      const anomalyFactors = [];
      
      // 1. Unusual event structure
      if (!event.type && !event.eventType && !event.error && !event.content) {
        anomalyFactors.push('unusual_structure');
      }
      
      // 2. Suspicious patterns
      const suspiciousPatterns = [
        /script.*>/i,
        /onclick/i,
        /javascript:/i,
        /drop\s+table/i,
        /union\s+select/i
      ];
      
      const eventStr = JSON.stringify(event).toLowerCase();
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(eventStr)) {
          anomalyFactors.push('suspicious_content');
          break;
        }
      }
      
      // 3. Rate anomaly (if we're tracking rates)
      if (event.sourceIp || event.userId) {
        const rateAnomaly = await this.checkRateAnomaly(event.sourceIp || event.userId);
        if (rateAnomaly) {
          anomalyFactors.push('rate_anomaly');
        }
      }
      
      // 4. Time-based anomaly
      const hour = new Date().getHours();
      if (eventType === 'critical_operation' && (hour < 6 || hour > 22)) {
        anomalyFactors.push('unusual_time');
      }
      
      // 5. Context anomaly
      if (event.context && event.context.anomalyScore > 0.7) {
        anomalyFactors.push('context_anomaly');
      }
      
      if (anomalyFactors.length > 0) {
        return {
          isAnomaly: true,
          reason: 'anomaly_detected',
          details: {
            factors: anomalyFactors,
            severity: anomalyFactors.length >= 3 ? 'high' : 
                     anomalyFactors.includes('suspicious_content') ? 'high' : 'medium'
          }
        };
      }
      
      return { isAnomaly: false };
      
    } catch (error) {
      logger.error('Error in anomaly detection', error);
      return { isAnomaly: false };
    }
  }

  /**
   * Handle anomalous events
   */
  async handleAnomaly(event, reason, details = {}) {
    try {
      const anomalyId = `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const anomalyData = {
        id: anomalyId,
        type: details.type || 'new_pattern',
        severity: details.severity || this.calculateAnomalySeverity(event, reason),
        eventData: event,
        reason,
        details,
        detectedAt: new Date(),
        similarPatterns: details.similarPatterns || [],
        confidenceGap: details.confidenceGap || null
      };
      
      // Store in database
      const query = `
        INSERT INTO anomalies (
          anomaly_id, anomaly_type, severity, event_data, 
          detection_reason, detection_details, similar_patterns, 
          confidence_gap, detected_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;
      
      const result = await db.query(query, [
        anomalyId,
        anomalyData.type,
        anomalyData.severity,
        JSON.stringify(anomalyData.eventData),
        anomalyData.reason,
        JSON.stringify(anomalyData.details),
        JSON.stringify(anomalyData.similarPatterns),
        anomalyData.confidenceGap,
        anomalyData.detectedAt
      ]);
      
      // Emit anomaly event
      this.emit('anomaly:detected', anomalyData);
      
      // Log with appropriate level
      const logLevel = anomalyData.severity === 'high' ? 'error' : 'warn';
      logger[logLevel]('Anomaly detected and logged', {
        anomalyId,
        severity: anomalyData.severity,
        reason,
        factors: details.factors
      });
      
      // For high severity, trigger immediate escalation
      if (anomalyData.severity === 'high') {
        await this.escalateAnomaly(anomalyData);
      }
      
      return {
        type: 'anomaly',
        anomalyId,
        severity: anomalyData.severity,
        requiresHumanIntervention: true,
        reason,
        details,
        escalated: anomalyData.severity === 'high'
      };
      
    } catch (error) {
      logger.error('Error handling anomaly', error);
      throw error;
    }
  }

  /**
   * Generate event signature for pattern matching
   */
  async generateEventSignature(event, eventType) {
    const components = [
      eventType,
      event.category || '',
      event.action || '',
      event.module || '',
      event.intent || ''
    ].filter(Boolean);
    
    return components.join(':').toLowerCase();
  }

  /**
   * Execute pattern logic
   */
  async executePatternLogic(logic, event, module = null) {
    // Handle different logic formats
    if (!logic) {
      throw new Error('No logic provided for execution');
    }
    
    // If logic is a function (from module patterns)
    if (typeof logic === 'function') {
      return await logic(event);
    }
    
    // Extract the actual logic object
    const logicObj = logic.logic || logic;
    
    if (logicObj.type === 'function' && logicObj.handler) {
      // Execute predefined function
      const handler = this.getHandler(logicObj.handler);
      return await handler(event, logicObj.parameters);
      
    } else if (logicObj.type === 'sequence' && logicObj.steps) {
      // Execute sequence of steps
      const results = [];
      for (const step of logicObj.steps) {
        const stepResult = await this.executeStep(step, event);
        results.push(stepResult);
      }
      return results;
      
    } else if (logicObj.type === 'api_call') {
      // Make API call
      return await this.executeApiCall(logicObj, event);
      
    } else if (logicObj.type === 'action' && logicObj.action) {
      // Execute action
      return await this.executeAction(logicObj.action, event, logicObj.parameters);
      
    } else if (logicObj.actions && Array.isArray(logicObj.actions)) {
      // Execute multiple actions
      const results = [];
      for (const action of logicObj.actions) {
        const actionResult = await this.executeAction(action, event);
        results.push(actionResult);
      }
      return results;
      
    } else if (module && logicObj.type) {
      // Let module handle its specific logic types
      return await this.executeModuleLogic(module, logicObj, event);
      
    } else {
      // Default execution - return the logic as the result
      return {
        type: 'pattern_result',
        logic: logicObj,
        message: logicObj.message || 'Pattern executed successfully'
      };
    }
  }

  /**
   * Validate conditions before execution
   */
  async validateConditions(conditions, event) {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, event);
      if (!result) {
        return { valid: false, reason: condition.failureMessage };
      }
    }
    return { valid: true };
  }

  /**
   * Handle side effects after pattern execution
   */
  async handleSideEffects(sideEffects, result, event) {
    for (const effect of sideEffects) {
      try {
        await this.executeSideEffect(effect, result, event);
      } catch (error) {
        logger.error('Error executing side effect', { effect, error });
        // Continue with other side effects
      }
    }
  }

  /**
   * Record pattern execution
   */
  async recordExecution(patternId, event, execution) {
    const query = `
      INSERT INTO pattern_execution_history (
        pattern_id, trigger_event, execution_context,
        confidence_at_execution, was_auto_executed,
        execution_status, execution_time_ms, result_details,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    await db.query(query, [
      patternId,
      JSON.stringify(event),
      JSON.stringify({ timestamp: new Date() }),
      execution.confidence || 1.0,
      execution.wasAutoExecuted,
      execution.status,
      execution.executionTime,
      JSON.stringify(execution.result),
      execution.error || null
    ]);
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
   * Adjust pattern confidence
   */
  async adjustPatternConfidence(patternId, adjustment) {
    const query = `
      UPDATE decision_patterns
      SET confidence_score = GREATEST(0.1, LEAST(0.99, confidence_score + $1))
      WHERE id = $1
    `;
    
    await db.query(query, [adjustment, patternId]);
  }

  /**
   * Calculate anomaly severity
   */
  calculateAnomalySeverity(event, reason) {
    // Determine severity based on event characteristics
    if (event.urgent || event.priority === 'high') {
      return 'high';
    } else if (reason === 'no_matching_pattern') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Log pattern match for analysis
   */
  async logPatternMatch(pattern, event, confidence) {
    logger.info('Pattern matched', {
      patternId: pattern.id,
      eventType: event.type,
      confidence,
      autoExecutable: pattern.auto_executable
    });
  }
}

// Create singleton instance
const unifiedPatternEngine = new UnifiedPatternEngine();

// Additional methods for Phase 2.2 implementation

/**
 * Execute with user approval
 */
unifiedPatternEngine.executeWithApproval = async function(pattern, event, module, suggestionId) {
  try {
    // Record approval
    await this.recordApproval(pattern.id, event, suggestionId);
    
    // Execute pattern
    const result = await this.autoExecute(pattern, event, module);
    
    // Update result with approval info
    result.wasApproved = true;
    result.approvalMethod = 'manual';
    
    return result;
  } catch (error) {
    logger.error('Error in approved execution', error);
    throw error;
  }
};

/**
 * Execute with modifications
 */
unifiedPatternEngine.executeWithModifications = async function(pattern, event, modifications, module, suggestionId) {
  try {
    // Apply modifications to pattern
    const modifiedPattern = {
      ...pattern,
      decision_logic: {
        ...pattern.decision_logic,
        ...modifications
      },
      wasModified: true
    };
    
    // Record modification
    await this.recordModification(pattern.id, event, modifications, suggestionId);
    
    // Execute modified pattern
    const result = await this.autoExecute(modifiedPattern, event, module);
    
    // Learn from modification
    if (module && module.learnFromOutcome) {
      await module.learnFromOutcome(pattern.id, event, {
        success: true,
        humanModified: true,
        originalAction: pattern.decision_logic,
        modifiedAction: modifiedPattern.decision_logic,
        modificationReason: modifications.reason || 'User modification'
      });
    }
    
    return result;
  } catch (error) {
    logger.error('Error in modified execution', error);
    throw error;
  }
};

/**
 * Approve queued pattern
 */
unifiedPatternEngine.approveQueuedPattern = async function(queueId, userId) {
  const queuedItem = this.approvalQueue.get(queueId);
  if (!queuedItem) {
    throw new Error('Queue item not found');
  }
  
  const { pattern, event, module } = queuedItem;
  
  // Update queue status
  await db.query(
    'UPDATE pattern_approval_queue SET status = $1, approved_by = $2, approved_at = NOW() WHERE queue_id = $3',
    ['approved', userId, queueId]
  );
  
  // Execute pattern
  const result = await this.autoExecute(pattern, event, module);
  
  // Clean up
  this.approvalQueue.delete(queueId);
  
  // Emit approval event
  this.emit('approval:approved', { queueId, userId, result });
  
  return result;
};

/**
 * Reject queued pattern
 */
unifiedPatternEngine.rejectQueuedPattern = async function(queueId, userId, reason) {
  const queuedItem = this.approvalQueue.get(queueId);
  if (!queuedItem) {
    throw new Error('Queue item not found');
  }
  
  // Update queue status
  await db.query(
    'UPDATE pattern_approval_queue SET status = $1, rejected_by = $2, rejection_reason = $3, rejected_at = NOW() WHERE queue_id = $4',
    ['rejected', userId, reason, queueId]
  );
  
  // Record rejection for learning
  await this.recordRejection(queuedItem.pattern.id, queuedItem.event, reason, queueId);
  
  // Clean up
  this.approvalQueue.delete(queueId);
  
  // Emit rejection event
  this.emit('approval:rejected', { queueId, userId, reason });
  
  return { type: 'rejected', reason };
};

/**
 * Check rate anomaly
 */
unifiedPatternEngine.checkRateAnomaly = async function(identifier) {
  // Simple rate check - in production this would be more sophisticated
  const recentEvents = await db.query(
    'SELECT COUNT(*) FROM pattern_execution_history WHERE trigger_event::jsonb->>$1 = $2 AND created_at > NOW() - INTERVAL \'1 minute\'',
    [identifier.includes('@') ? 'userId' : 'sourceIp', identifier]
  );
  
  return parseInt(recentEvents.rows[0].count) > 10;
};

/**
 * Escalate anomaly
 */
unifiedPatternEngine.escalateAnomaly = async function(anomalyData) {
  // Create escalation record
  await db.query(
    'INSERT INTO anomaly_escalations (anomaly_id, escalation_type, escalated_at) VALUES ($1, $2, NOW())',
    [anomalyData.id, 'automatic']
  );
  
  // Emit escalation event
  this.emit('anomaly:escalated', anomalyData);
  
  // In production, this would trigger notifications, alerts, etc.
  logger.error('CRITICAL ANOMALY ESCALATED', {
    anomalyId: anomalyData.id,
    severity: anomalyData.severity,
    factors: anomalyData.details.factors
  });
};

/**
 * Execute action
 */
unifiedPatternEngine.executeAction = async function(action, event, parameters = {}) {
  const actionType = action.type || action;
  
  // Map of action handlers
  const actionHandlers = {
    'send_message': async () => ({
      type: 'message_sent',
      recipient: action.recipient || event.userId,
      message: action.message || parameters.message
    }),
    
    'update_database': async () => ({
      type: 'database_updated',
      table: action.table,
      updates: action.updates
    }),
    
    'call_api': async () => ({
      type: 'api_called',
      endpoint: action.endpoint,
      method: action.method || 'GET'
    }),
    
    'log_event': async () => {
      logger.info('Pattern action logged', {
        action: action,
        event: event
      });
      return { type: 'logged' };
    }
  };
  
  const handler = actionHandlers[actionType];
  if (handler) {
    return await handler();
  }
  
  return {
    type: 'action_executed',
    action: actionType,
    parameters
  };
};

/**
 * Get handler for function execution
 */
unifiedPatternEngine.getHandler = function(handlerName) {
  // In production, this would map to actual handler functions
  return async (event, parameters) => ({
    type: 'handler_executed',
    handler: handlerName,
    event,
    parameters
  });
};

/**
 * Execute module-specific logic
 */
unifiedPatternEngine.executeModuleLogic = async function(module, logic, event) {
  // Let the module handle its own logic execution
  if (module.executeLogic) {
    return await module.executeLogic(logic, event);
  }
  
  // Default module logic execution
  return {
    type: 'module_logic_executed',
    module: module.name,
    logic: logic
  };
};

/**
 * Record various tracking methods
 */
unifiedPatternEngine.recordApproval = async function(patternId, event, suggestionId) {
  await db.query(
    'INSERT INTO pattern_approvals (pattern_id, event_data, suggestion_id, approved_at) VALUES ($1, $2, $3, NOW())',
    [patternId, JSON.stringify(event), suggestionId]
  );
};

unifiedPatternEngine.recordModification = async function(patternId, event, modifications, suggestionId) {
  await db.query(
    'INSERT INTO pattern_modifications (pattern_id, event_context, original_action, modified_action, modification_reason, suggestion_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
    [patternId, JSON.stringify(event), JSON.stringify({}), JSON.stringify(modifications), modifications.reason || 'User modification', suggestionId]
  );
};

unifiedPatternEngine.recordRejection = async function(patternId, event, reason, referenceId) {
  await db.query(
    'INSERT INTO pattern_rejections (pattern_id, event_data, rejection_reason, reference_id, rejected_at) VALUES ($1, $2, $3, $4, NOW())',
    [patternId, JSON.stringify(event), reason, referenceId]
  );
  
  // Reduce pattern confidence on rejection
  await this.adjustPatternConfidence(patternId, -0.02);
};

unifiedPatternEngine.recordTimeoutExecution = async function(suggestionId, result) {
  await db.query(
    'INSERT INTO pattern_timeout_executions (suggestion_id, result, executed_at) VALUES ($1, $2, NOW())',
    [suggestionId, JSON.stringify(result)]
  );
};

module.exports = unifiedPatternEngine;