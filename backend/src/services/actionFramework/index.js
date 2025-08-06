/**
 * Enhanced Action Execution Framework
 * Centralized system for executing all external actions with retry logic,
 * logging, monitoring, and extensible handler architecture
 */

const { pool } = require('../../db/pool');
const { getCorrelationId } = require('../../utils/correlationId');
const EventEmitter = require('events');

// Import all handlers
const BenQHandler = require('./handlers/BenQHandler');
const NinjaOneHandler = require('./handlers/NinjaOneHandler');
const UbiquitiHandler = require('./handlers/UbiquitiHandler');
const OpenPhoneHandler = require('./handlers/OpenPhoneHandler');
const HubSpotHandler = require('./handlers/HubSpotHandler');
const SlackHandler = require('./handlers/SlackHandler');

class ActionFramework extends EventEmitter {
  constructor() {
    super();
    this.handlers = new Map();
    this.actionTypes = new Map();
    this.executionStats = new Map();
    
    // Configuration
    this.config = {
      defaultTimeout: parseInt(process.env.ACTION_TIMEOUT || '30000'),
      defaultMaxRetries: parseInt(process.env.ACTION_MAX_RETRIES || '2'),
      retryDelay: parseInt(process.env.ACTION_RETRY_DELAY || '1000'),
      circuitBreakerThreshold: parseInt(process.env.ACTION_CIRCUIT_BREAKER || '5'),
      circuitBreakerTimeout: parseInt(process.env.ACTION_CIRCUIT_TIMEOUT || '60000')
    };
    
    // Circuit breaker state
    this.circuitBreakers = new Map();
    
    // Initialize handlers
    this.initializeHandlers();
  }

  /**
   * Initialize all device handlers
   */
  initializeHandlers() {
    // Register handlers
    this.registerHandler('benq', new BenQHandler());
    this.registerHandler('ninjaone', new NinjaOneHandler());
    this.registerHandler('ubiquiti', new UbiquitiHandler());
    this.registerHandler('openphone', new OpenPhoneHandler());
    this.registerHandler('hubspot', new HubSpotHandler());
    this.registerHandler('slack', new SlackHandler());
    
    // Map action types to handlers
    this.mapActionTypes();
    
    console.log('Action Framework initialized with handlers:', Array.from(this.handlers.keys()));
  }

  /**
   * Register a new handler
   */
  registerHandler(name, handler) {
    this.handlers.set(name, handler);
    
    // Initialize circuit breaker for this handler
    this.circuitBreakers.set(name, {
      failures: 0,
      lastFailure: null,
      state: 'closed' // closed, open, half-open
    });
    
    // Set up handler events
    handler.on('success', (data) => this.handleSuccess(name, data));
    handler.on('failure', (data) => this.handleFailure(name, data));
  }

  /**
   * Map action types to their handlers
   */
  mapActionTypes() {
    // Device control actions
    this.actionTypes.set('projector_on', { handler: 'benq', method: 'powerOn' });
    this.actionTypes.set('projector_off', { handler: 'benq', method: 'powerOff' });
    this.actionTypes.set('projector_input', { handler: 'benq', method: 'changeInput' });
    
    // TrackMan/PC control
    this.actionTypes.set('reset_trackman', { handler: 'ninjaone', method: 'resetTrackMan' });
    this.actionTypes.set('reboot_pc', { handler: 'ninjaone', method: 'rebootPC' });
    this.actionTypes.set('wake_pc', { handler: 'ninjaone', method: 'wakePC' });
    this.actionTypes.set('lock_pc', { handler: 'ninjaone', method: 'lockPC' });
    
    // Door access
    this.actionTypes.set('unlock_door', { handler: 'ubiquiti', method: 'unlockDoor' });
    this.actionTypes.set('lock_door', { handler: 'ubiquiti', method: 'lockDoor' });
    this.actionTypes.set('check_door_status', { handler: 'ubiquiti', method: 'checkDoorStatus' });
    
    // Communications
    this.actionTypes.set('send_sms', { handler: 'openphone', method: 'sendSMS' });
    this.actionTypes.set('send_message', { handler: 'openphone', method: 'sendMessage' });
    
    // CRM actions
    this.actionTypes.set('update_contact', { handler: 'hubspot', method: 'updateContact' });
    this.actionTypes.set('create_ticket', { handler: 'hubspot', method: 'createTicket' });
    this.actionTypes.set('log_activity', { handler: 'hubspot', method: 'logActivity' });
    
    // Notifications
    this.actionTypes.set('escalate', { handler: 'slack', method: 'escalate' });
    this.actionTypes.set('notify_team', { handler: 'slack', method: 'notifyTeam' });
  }

  /**
   * Execute an action with full retry logic and monitoring
   */
  async execute(actionType, context = {}) {
    const startTime = Date.now();
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const correlationId = context.correlationId || getCorrelationId({ headers: {} });
    
    // Get action configuration
    const actionConfig = this.actionTypes.get(actionType);
    if (!actionConfig) {
      return this.createResult('failed', `Unknown action type: ${actionType}`, { actionId });
    }
    
    const { handler: handlerName, method } = actionConfig;
    const handler = this.handlers.get(handlerName);
    
    if (!handler) {
      return this.createResult('failed', `Handler not found: ${handlerName}`, { actionId });
    }
    
    // Check circuit breaker
    const circuitBreaker = this.circuitBreakers.get(handlerName);
    if (circuitBreaker.state === 'open') {
      const timeSinceFailure = Date.now() - circuitBreaker.lastFailure;
      if (timeSinceFailure < this.config.circuitBreakerTimeout) {
        return this.createResult('failed', 
          `Circuit breaker open for ${handlerName}. Too many recent failures.`, 
          { actionId, circuitBreaker: true }
        );
      } else {
        // Try half-open state
        circuitBreaker.state = 'half-open';
      }
    }
    
    // Prepare execution context
    const executionContext = {
      ...context,
      actionId,
      correlationId,
      actionType,
      handler: handlerName,
      method,
      startTime,
      retries: 0
    };
    
    // Log action start
    await this.logActionStart(executionContext);
    
    // Execute with retry logic
    const result = await this.executeWithRetry(handler, method, executionContext);
    
    // Log action completion
    await this.logActionComplete(executionContext, result);
    
    // Update statistics
    this.updateStats(handlerName, result.outcome === 'success');
    
    // Emit events
    this.emit('action:complete', {
      actionType,
      outcome: result.outcome,
      duration: Date.now() - startTime,
      actionId
    });
    
    return result;
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry(handler, method, context) {
    const maxRetries = context.maxRetries || this.config.defaultMaxRetries;
    const timeout = context.timeout || this.config.defaultTimeout;
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        context.retries = attempt;
        
        // Execute with timeout
        const result = await this.executeWithTimeout(
          handler[method](context),
          timeout
        );
        
        // Validate result
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid handler response');
        }
        
        // Ensure outcome is valid
        if (!['success', 'partial', 'failed', 'unconfirmed'].includes(result.outcome)) {
          result.outcome = 'unconfirmed';
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        console.error(`Action attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Calculate backoff delay
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    return this.createResult('failed', 
      `Action failed after ${maxRetries + 1} attempts: ${lastError.message}`,
      { error: lastError.message, retries: maxRetries }
    );
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      )
    ]);
  }

  /**
   * Create standardized result object
   */
  createResult(outcome, notes, details = {}) {
    return {
      outcome,
      notes,
      timestamp: new Date().toISOString(),
      ...details
    };
  }

  /**
   * Log action start
   */
  async logActionStart(context) {
    try {
      await pool.query(
        `INSERT INTO action_logs 
         (action_id, correlation_id, action_type, handler, method, context, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'started')`,
        [
          context.actionId,
          context.correlationId,
          context.actionType,
          context.handler,
          context.method,
          JSON.stringify(context)
        ]
      );
    } catch (error) {
      console.error('Failed to log action start:', error);
    }
  }

  /**
   * Log action completion
   */
  async logActionComplete(context, result) {
    try {
      const duration = Date.now() - context.startTime;
      
      await pool.query(
        `UPDATE action_logs 
         SET status = $1, outcome = $2, result = $3, duration_ms = $4, 
             completed_at = NOW(), retries = $5
         WHERE action_id = $6`,
        [
          'completed',
          result.outcome,
          JSON.stringify(result),
          duration,
          context.retries,
          context.actionId
        ]
      );
    } catch (error) {
      console.error('Failed to log action completion:', error);
    }
  }

  /**
   * Handle successful action
   */
  handleSuccess(handlerName, data) {
    const circuitBreaker = this.circuitBreakers.get(handlerName);
    if (circuitBreaker) {
      circuitBreaker.failures = 0;
      circuitBreaker.state = 'closed';
    }
  }

  /**
   * Handle failed action
   */
  handleFailure(handlerName, data) {
    const circuitBreaker = this.circuitBreakers.get(handlerName);
    if (circuitBreaker) {
      circuitBreaker.failures++;
      circuitBreaker.lastFailure = Date.now();
      
      if (circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
        circuitBreaker.state = 'open';
        console.error(`Circuit breaker opened for ${handlerName} after ${circuitBreaker.failures} failures`);
      }
    }
  }

  /**
   * Update execution statistics
   */
  updateStats(handlerName, success) {
    if (!this.executionStats.has(handlerName)) {
      this.executionStats.set(handlerName, {
        total: 0,
        success: 0,
        failed: 0
      });
    }
    
    const stats = this.executionStats.get(handlerName);
    stats.total++;
    if (success) {
      stats.success++;
    } else {
      stats.failed++;
    }
  }

  /**
   * Get handler statistics
   */
  getStats() {
    const stats = {};
    this.executionStats.forEach((value, key) => {
      stats[key] = {
        ...value,
        successRate: value.total > 0 ? (value.success / value.total * 100).toFixed(2) + '%' : '0%'
      };
    });
    return stats;
  }

  /**
   * Reset circuit breaker for a handler
   */
  resetCircuitBreaker(handlerName) {
    const circuitBreaker = this.circuitBreakers.get(handlerName);
    if (circuitBreaker) {
      circuitBreaker.failures = 0;
      circuitBreaker.state = 'closed';
      circuitBreaker.lastFailure = null;
      console.log(`Circuit breaker reset for ${handlerName}`);
    }
  }
}

// Export singleton instance
module.exports = new ActionFramework();