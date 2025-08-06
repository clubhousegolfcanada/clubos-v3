const db = require('../db/pool');
const logger = require('../utils/logger');

class FixRegistryService {
  constructor() {
    this.fixCache = new Map();
    this.cacheExpiry = 300000; // 5 minutes
    this.fixClasses = {
      DEBOUNCE: 'debounce',
      TIMEOUT: 'timeout',
      VALIDATION: 'validation',
      RETRY: 'retry',
      PERMISSION: 'permission',
      RATE_LIMIT: 'rate_limit',
      CIRCUIT_BREAKER: 'circuit_breaker',
      FALLBACK: 'fallback'
    };
  }

  /**
   * Register a new fix pattern
   */
  async registerFix(fixDefinition) {
    const fix = {
      class: fixDefinition.class || this.detectFixClass(fixDefinition.logic),
      logic: this.standardizeFixLogic(fixDefinition.logic),
      metadata: {
        author: fixDefinition.author || 'system',
        description: fixDefinition.description,
        testCoverage: fixDefinition.testCoverage || false,
        dependencies: fixDefinition.dependencies || [],
        createdAt: new Date()
      }
    };
    
    // Validate fix before storing
    const validation = this.validateFix(fix);
    if (!validation.valid) {
      throw new Error(`Invalid fix: ${validation.errors.join(', ')}`);
    }
    
    // Store in registry
    return this.storeFix(fix);
  }

  /**
   * Retrieve fix by pattern ID
   */
  async getFix(patternId) {
    // Check cache first
    const cached = this.fixCache.get(patternId);
    if (cached && cached.expiry > Date.now()) {
      return cached.fix;
    }
    
    // Fetch from database
    const query = `
      SELECT * FROM learning_patterns
      WHERE id = $1 AND pattern_logic IS NOT NULL
    `;
    
    const result = await db.query(query, [patternId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const fix = this.parseFix(result.rows[0]);
    
    // Cache the fix
    this.fixCache.set(patternId, {
      fix,
      expiry: Date.now() + this.cacheExpiry
    });
    
    return fix;
  }

  /**
   * Apply fix to error context
   */
  async applyFix(fix, errorContext) {
    logger.info('Applying fix', {
      fixClass: fix.fix_class,
      context: errorContext
    });
    
    try {
      switch (fix.fix_class) {
        case this.fixClasses.DEBOUNCE:
          return this.applyDebounceFix(fix, errorContext);
          
        case this.fixClasses.TIMEOUT:
          return this.applyTimeoutFix(fix, errorContext);
          
        case this.fixClasses.VALIDATION:
          return this.applyValidationFix(fix, errorContext);
          
        case this.fixClasses.RETRY:
          return this.applyRetryFix(fix, errorContext);
          
        case this.fixClasses.RATE_LIMIT:
          return this.applyRateLimitFix(fix, errorContext);
          
        case this.fixClasses.CIRCUIT_BREAKER:
          return this.applyCircuitBreakerFix(fix, errorContext);
          
        case this.fixClasses.FALLBACK:
          return this.applyFallbackFix(fix, errorContext);
          
        default:
          return this.applyGenericFix(fix, errorContext);
      }
    } catch (err) {
      logger.error('Failed to apply fix', err);
      throw err;
    }
  }

  /**
   * Detect fix class from logic
   */
  detectFixClass(logic) {
    if (logic.debounceMs || logic.cooldownPeriod) {
      return this.fixClasses.DEBOUNCE;
    }
    
    if (logic.timeout || logic.maxExecutionTime) {
      return this.fixClasses.TIMEOUT;
    }
    
    if (logic.validation || logic.schema) {
      return this.fixClasses.VALIDATION;
    }
    
    if (logic.retryCount || logic.retryStrategy) {
      return this.fixClasses.RETRY;
    }
    
    if (logic.rateLimit || logic.maxRequests) {
      return this.fixClasses.RATE_LIMIT;
    }
    
    if (logic.circuitBreaker || logic.failureThreshold) {
      return this.fixClasses.CIRCUIT_BREAKER;
    }
    
    if (logic.fallback || logic.alternative) {
      return this.fixClasses.FALLBACK;
    }
    
    return 'generic';
  }

  /**
   * Standardize fix logic format
   */
  standardizeFixLogic(logic) {
    return {
      // Core logic
      implementation: logic.implementation || logic.code || logic.fn,
      
      // Parameters
      parameters: {
        ...logic.parameters,
        ...logic.config,
        ...logic.options
      },
      
      // Conditions
      conditions: {
        applies: logic.conditions?.applies || logic.when || 'always',
        excludes: logic.conditions?.excludes || logic.except || [],
        requires: logic.conditions?.requires || logic.dependencies || []
      },
      
      // Monitoring
      monitoring: {
        metrics: logic.monitoring?.metrics || [],
        alerts: logic.monitoring?.alerts || [],
        logging: logic.monitoring?.logging || 'info'
      }
    };
  }

  /**
   * Validate fix structure
   */
  validateFix(fix) {
    const errors = [];
    
    // Required fields
    if (!fix.class) {
      errors.push('Fix class is required');
    }
    
    if (!fix.logic || !fix.logic.implementation) {
      errors.push('Fix implementation is required');
    }
    
    // Validate fix class
    if (!Object.values(this.fixClasses).includes(fix.class) && fix.class !== 'generic') {
      errors.push(`Invalid fix class: ${fix.class}`);
    }
    
    // Validate parameters based on class
    const classValidation = this.validateClassSpecificParams(fix);
    if (!classValidation.valid) {
      errors.push(...classValidation.errors);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate class-specific parameters
   */
  validateClassSpecificParams(fix) {
    const errors = [];
    
    switch (fix.class) {
      case this.fixClasses.DEBOUNCE:
        if (!fix.logic.parameters.debounceMs) {
          errors.push('Debounce fix requires debounceMs parameter');
        }
        break;
        
      case this.fixClasses.TIMEOUT:
        if (!fix.logic.parameters.timeout) {
          errors.push('Timeout fix requires timeout parameter');
        }
        break;
        
      case this.fixClasses.RETRY:
        if (!fix.logic.parameters.retryCount) {
          errors.push('Retry fix requires retryCount parameter');
        }
        break;
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Store fix in database
   */
  async storeFix(fix) {
    // This would typically update the learning_patterns table
    // For now, return the fix with an ID
    return {
      id: Date.now(),
      ...fix
    };
  }

  /**
   * Parse fix from database record
   */
  parseFix(record) {
    return {
      id: record.id,
      fix_class: record.fix_class,
      pattern_logic: record.pattern_logic,
      reusability: record.reusability,
      edge_case_flag: record.edge_case_flag,
      success_rate: this.calculateSuccessRate(record),
      metadata: {
        created: record.created_at,
        lastUsed: record.last_seen,
        useCount: record.match_count
      }
    };
  }

  /**
   * Calculate fix success rate
   */
  calculateSuccessRate(record) {
    if (!record.match_count || record.match_count === 0) {
      return 0;
    }
    
    return (record.success_count / record.match_count) * 100;
  }

  /**
   * Apply debounce fix
   */
  async applyDebounceFix(fix, context) {
    const debounceMs = fix.pattern_logic.parameters?.debounceMs || 1000;
    const key = `${context.userId}:${context.action}`;
    
    // Check if already debounced
    const lastAction = this.getLastAction(key);
    if (lastAction && (Date.now() - lastAction) < debounceMs) {
      return {
        applied: true,
        blocked: true,
        reason: `Action debounced for ${debounceMs}ms`,
        remainingTime: debounceMs - (Date.now() - lastAction)
      };
    }
    
    // Record action
    this.recordAction(key);
    
    return {
      applied: true,
      blocked: false,
      proceeded: true
    };
  }

  /**
   * Apply timeout fix
   */
  async applyTimeoutFix(fix, context) {
    const timeout = fix.pattern_logic.parameters?.timeout || 5000;
    
    return {
      applied: true,
      timeout,
      instruction: 'Apply timeout to operation',
      code: `
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), ${timeout})
        );
        
        return Promise.race([operation, timeoutPromise]);
      `
    };
  }

  /**
   * Apply validation fix
   */
  async applyValidationFix(fix, context) {
    const validation = fix.pattern_logic.parameters?.validation || {};
    
    return {
      applied: true,
      validation,
      instruction: 'Add input validation',
      code: `
        const schema = ${JSON.stringify(validation.schema || {})};
        const validated = validateInput(input, schema);
        if (!validated.valid) {
          throw new ValidationError(validated.errors);
        }
      `
    };
  }

  /**
   * Apply retry fix
   */
  async applyRetryFix(fix, context) {
    const retryCount = fix.pattern_logic.parameters?.retryCount || 3;
    const backoffMs = fix.pattern_logic.parameters?.backoffMs || 1000;
    
    return {
      applied: true,
      retryCount,
      backoffMs,
      instruction: 'Implement retry logic',
      code: `
        let lastError;
        for (let i = 0; i < ${retryCount}; i++) {
          try {
            return await operation();
          } catch (err) {
            lastError = err;
            if (i < ${retryCount - 1}) {
              await new Promise(resolve => setTimeout(resolve, ${backoffMs} * (i + 1)));
            }
          }
        }
        throw lastError;
      `
    };
  }

  /**
   * Apply rate limit fix
   */
  async applyRateLimitFix(fix, context) {
    const maxRequests = fix.pattern_logic.parameters?.maxRequests || 10;
    const windowMs = fix.pattern_logic.parameters?.windowMs || 60000;
    
    return {
      applied: true,
      maxRequests,
      windowMs,
      instruction: 'Apply rate limiting',
      middleware: 'rateLimit',
      config: { max: maxRequests, windowMs }
    };
  }

  /**
   * Apply circuit breaker fix
   */
  async applyCircuitBreakerFix(fix, context) {
    const failureThreshold = fix.pattern_logic.parameters?.failureThreshold || 5;
    const resetTimeout = fix.pattern_logic.parameters?.resetTimeout || 60000;
    
    return {
      applied: true,
      failureThreshold,
      resetTimeout,
      instruction: 'Implement circuit breaker pattern',
      state: 'closed',
      monitoring: true
    };
  }

  /**
   * Apply fallback fix
   */
  async applyFallbackFix(fix, context) {
    const fallback = fix.pattern_logic.parameters?.fallback;
    
    return {
      applied: true,
      fallback,
      instruction: 'Use fallback mechanism',
      code: `
        try {
          return await primaryOperation();
        } catch (err) {
          logger.warn('Primary operation failed, using fallback', err);
          return ${JSON.stringify(fallback)};
        }
      `
    };
  }

  /**
   * Apply generic fix
   */
  async applyGenericFix(fix, context) {
    return {
      applied: true,
      logic: fix.pattern_logic,
      instruction: 'Apply custom fix logic',
      requiresImplementation: true
    };
  }

  /**
   * Track action for debouncing
   */
  recordAction(key) {
    // In production, use Redis or similar
    if (!this.actionTracker) {
      this.actionTracker = new Map();
    }
    
    this.actionTracker.set(key, Date.now());
    
    // Clean old entries
    if (this.actionTracker.size > 1000) {
      this.cleanActionTracker();
    }
  }

  /**
   * Get last action time
   */
  getLastAction(key) {
    return this.actionTracker?.get(key);
  }

  /**
   * Clean old action entries
   */
  cleanActionTracker() {
    const cutoff = Date.now() - 3600000; // 1 hour
    
    for (const [key, time] of this.actionTracker.entries()) {
      if (time < cutoff) {
        this.actionTracker.delete(key);
      }
    }
  }

  /**
   * Get fix statistics
   */
  async getFixStats() {
    const query = `
      SELECT 
        fix_class,
        COUNT(*) as total_fixes,
        AVG(success_count::float / NULLIF(match_count, 0)) as avg_success_rate,
        SUM(match_count) as total_applications
      FROM learning_patterns
      WHERE pattern_logic IS NOT NULL
      GROUP BY fix_class
      ORDER BY total_applications DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = new FixRegistryService();