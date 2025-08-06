const BasePatternModule = require('./BasePatternModule');
const recursiveLearning = require('../../recursiveLearning');

/**
 * Error Pattern Module
 * Handles error detection and resolution patterns
 */
class ErrorPatternModule extends BasePatternModule {
  constructor() {
    super('error', {
      minConfidenceForSuggestion: 0.6,
      learningEnabled: true,
      crossDomainLearning: true,
      // Error-specific config
      errorCategories: {
        technical: ['timeout', 'connection', 'database', 'api'],
        business: ['validation', 'authorization', 'conflict'],
        user: ['input', 'permission', 'notfound']
      }
    });
    
    // Ensure tables exist
    this.ensureModificationsTable();
  }

  /**
   * Check if this module can handle the event
   */
  canHandle(eventType) {
    return eventType === 'error' || 
           eventType === 'exception' || 
           eventType === 'failure';
  }

  /**
   * Find patterns - integrates with existing recursive learning
   */
  async findPatterns(event) {
    try {
      // First check recursive learning system
      if (event.error) {
        const recursiveMatch = await recursiveLearning.findSimilarFix(
          event.error,
          event.context
        );
        
        if (recursiveMatch) {
          // Convert to our pattern format
          const patterns = [{
            pattern: {
              id: recursiveMatch.pattern?.id,
              source: 'recursive_learning',
              logic: recursiveMatch.fix || recursiveMatch.pattern_logic,
              confidence_score: recursiveMatch.confidence || 0.7,
              auto_executable: recursiveMatch.confidence >= 0.9
            },
            confidence: recursiveMatch.confidence || 0.7,
            matchDetails: {
              type: 'error_fix',
              source: 'recursive_learning'
            }
          }];
          
          // Also search for decision patterns
          const decisionPatterns = await super.findPatterns(event);
          return [...patterns, ...decisionPatterns];
        }
      }
      
      // Fall back to base pattern search
      return await super.findPatterns(event);
      
    } catch (error) {
      logger.error('Error in ErrorPatternModule.findPatterns', error);
      return [];
    }
  }

  /**
   * Generate error-specific signature
   */
  async generateSignature(event) {
    const error = event.error || {};
    const components = [
      'error',
      error.type || error.name || 'unknown',
      error.code || '',
      this.categorizeError(error),
      event.context?.module || '',
      event.context?.action || ''
    ];
    
    return components.filter(Boolean).join(':').toLowerCase();
  }

  /**
   * Categorize error type
   */
  categorizeError(error) {
    const errorStr = (error.message || error.toString()).toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.config.errorCategories)) {
      if (keywords.some(keyword => errorStr.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  /**
   * Calculate semantic match for errors
   */
  async calculateSemanticMatch(pattern, event) {
    if (!event.error || !pattern.logic) return 0;
    
    const error = event.error;
    const patternError = pattern.logic.error || {};
    
    let score = 0;
    
    // Error type matching
    if (error.type === patternError.type) {
      score += 0.4;
    }
    
    // Error code matching
    if (error.code && error.code === patternError.code) {
      score += 0.3;
    }
    
    // Error message similarity
    if (error.message && patternError.message) {
      const similarity = this.calculateSimilarity(
        error.message.substring(0, 100),
        patternError.message.substring(0, 100)
      );
      score += similarity * 0.3;
    }
    
    return score;
  }

  /**
   * Extract key attributes for error patterns
   */
  extractKeyAttributes(event) {
    const error = event.error || {};
    return {
      errorType: error.type || error.name,
      errorCode: error.code,
      module: event.context?.module,
      endpoint: event.context?.endpoint,
      stackTrace: error.stack ? this.extractStackPattern(error.stack) : null
    };
  }

  /**
   * Extract pattern from stack trace
   */
  extractStackPattern(stack) {
    if (!stack) return null;
    
    const lines = stack.split('\n').slice(0, 5); // First 5 lines
    const pattern = lines
      .map(line => {
        // Extract file and function names
        const match = line.match(/at\s+(\S+)\s+\(([^)]+)\)/);
        if (match) {
          return `${match[1]}:${match[2].split('/').pop()}`;
        }
        return null;
      })
      .filter(Boolean)
      .join(' -> ');
    
    return pattern;
  }

  /**
   * Extract conditions specific to errors
   */
  extractConditions(event, outcome) {
    return {
      errorFrequency: event.context?.errorFrequency || 'single',
      userImpact: event.context?.userImpact || 'unknown',
      systemLoad: event.context?.systemLoad || 'normal',
      timeOfDay: new Date(event.timestamp).getHours(),
      recoveryAction: outcome.action?.type || 'unknown'
    };
  }

  /**
   * Learn from error resolution
   */
  async learnFromOutcome(patternId, event, outcome) {
    // Call base learning
    await super.learnFromOutcome(patternId, event, outcome);
    
    // Update recursive learning system if applicable
    if (event.error && outcome.success) {
      const fixLogic = {
        type: outcome.action?.type || 'manual_fix',
        steps: outcome.action?.steps || [],
        result: outcome.result
      };
      
      await recursiveLearning.captureFix(
        event.errorId,
        fixLogic,
        {
          type: this.categorizeError(event.error),
          reusability: outcome.reusable ? 'universal' : 'conditional',
          isEdgeCase: outcome.edgeCase || false,
          module: event.context?.module
        }
      );
    }
  }

  /**
   * Special handling for critical errors
   */
  async handleCriticalError(event) {
    // Check if this is a critical error
    const criticalKeywords = ['critical', 'fatal', 'emergency', 'security'];
    const isCritical = criticalKeywords.some(keyword => 
      JSON.stringify(event).toLowerCase().includes(keyword)
    );
    
    if (isCritical) {
      // Log to security events
      await this.logCriticalError(event);
      
      // Return high-priority pattern
      return {
        pattern: {
          id: 'critical-handler',
          logic: {
            type: 'escalate',
            priority: 'immediate',
            actions: [
              { type: 'notify_admin', immediate: true },
              { type: 'create_incident', severity: 'critical' },
              { type: 'enable_emergency_mode', duration: 300 }
            ]
          },
          confidence_score: 1.0,
          auto_executable: false // Always require human approval for critical
        },
        confidence: 1.0,
        matchDetails: {
          type: 'critical_error',
          requiresImmediate: true
        }
      };
    }
    
    return null;
  }

  /**
   * Log critical error
   */
  async logCriticalError(event) {
    try {
      const query = `
        INSERT INTO security_events (
          event_type, severity, endpoint, method,
          detection_method, detection_rule, action_taken,
          request_headers, request_body
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      await db.query(query, [
        'critical_error',
        'critical',
        event.context?.endpoint,
        event.context?.method,
        'error_pattern_module',
        'critical_error_detection',
        'escalated',
        JSON.stringify(event.context?.headers || {}),
        JSON.stringify(event.context?.body || {})
      ]);
    } catch (err) {
      logger.error('Failed to log critical error', err);
    }
  }
}

module.exports = ErrorPatternModule;