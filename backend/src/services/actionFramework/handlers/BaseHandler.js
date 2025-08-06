/**
 * Base Handler Class
 * All device handlers must extend this class
 */

const EventEmitter = require('events');

class BaseHandler extends EventEmitter {
  constructor(name, config = {}) {
    super();
    this.name = name;
    this.config = {
      timeout: 30000,
      retryable: true,
      ...config
    };
    
    // API credentials and endpoints
    this.credentials = this.loadCredentials();
    
    // Handler state
    this.isHealthy = true;
    this.lastHealthCheck = null;
    this.stats = {
      requests: 0,
      successes: 0,
      failures: 0
    };
  }

  /**
   * Load credentials from environment
   */
  loadCredentials() {
    // Override in child classes
    return {};
  }

  /**
   * Validate context has required fields
   */
  validateContext(context, requiredFields = []) {
    const missing = requiredFields.filter(field => !context[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Standard result format
   */
  createResult(outcome, notes, details = {}) {
    return {
      outcome, // success, partial, failed, unconfirmed
      notes,
      handler: this.name,
      timestamp: new Date().toISOString(),
      ...details
    };
  }

  /**
   * Log and emit success
   */
  handleSuccess(method, result) {
    this.stats.successes++;
    this.emit('success', {
      handler: this.name,
      method,
      result
    });
    return result;
  }

  /**
   * Log and emit failure
   */
  handleFailure(method, error, context = {}) {
    this.stats.failures++;
    this.emit('failure', {
      handler: this.name,
      method,
      error: error.message,
      context
    });
    
    return this.createResult('failed', error.message, {
      error: error.message,
      errorCode: error.code,
      retryable: this.isRetryableError(error)
    });
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    // Network errors, timeouts, and 5xx errors are retryable
    const retryableCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'];
    const retryableStatus = [500, 502, 503, 504];
    
    return retryableCodes.includes(error.code) || 
           retryableStatus.includes(error.response?.status);
  }

  /**
   * Health check (override in child classes)
   */
  async checkHealth() {
    return {
      healthy: true,
      message: 'Handler operational'
    };
  }

  /**
   * Get handler statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.requests > 0 
        ? (this.stats.successes / this.stats.requests * 100).toFixed(2) + '%'
        : '0%',
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck
    };
  }
}

module.exports = BaseHandler;