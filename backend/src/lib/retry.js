/**
 * Retry and Error Handling Utilities
 * Migrated from V1 - Provides retry logic and error wrapping
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} retries - Number of retries (default: 2)
 * @param {number} delay - Initial delay in ms (default: 1000)
 * @returns {*} Result of the function
 */
async function withRetry(fn, retries = 2, delay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Call the function
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.statusCode === 400 || // Bad request
          error.statusCode === 401 || // Unauthorized
          error.statusCode === 403 || // Forbidden
          error.statusCode === 404) { // Not found
        throw error;
      }
      
      // If we have retries left, wait and try again
      if (attempt < retries) {
        const waitTime = delay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Retry attempt ${attempt + 1}/${retries} after ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // All retries failed
  const enhancedError = new Error(`Failed after ${retries + 1} attempts: ${lastError.message}`);
  enhancedError.originalError = lastError;
  enhancedError.attempts = retries + 1;
  throw enhancedError;
}

/**
 * Wrap a function with error handling
 * @param {Function} fn - Function to wrap
 * @param {string} context - Context for error messages
 * @returns {Function} Wrapped function
 */
function wrapWithErrorHandler(fn, context = 'Operation') {
  return async function wrappedFunction(...args) {
    const startTime = Date.now();
    
    try {
      const result = await fn.apply(this, args);
      
      // Log success if it took a while
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.log(`${context} completed in ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Enhance error with context
      const enhancedError = new Error(`${context} failed: ${error.message}`);
      enhancedError.context = context;
      enhancedError.originalError = error;
      enhancedError.duration = duration;
      enhancedError.timestamp = new Date().toISOString();
      
      // Add request details if available
      if (args[0] && typeof args[0] === 'object') {
        enhancedError.requestData = {
          // Sanitize sensitive data
          ...args[0],
          password: args[0].password ? '[REDACTED]' : undefined,
          apiKey: args[0].apiKey ? '[REDACTED]' : undefined
        };
      }
      
      // Log the error
      console.error(`${context} error after ${duration}ms:`, {
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode
      });
      
      throw enhancedError;
    }
  };
}

/**
 * Create a timeout wrapper for promises
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operation - Operation name for error message
 * @returns {Promise} Promise that rejects on timeout
 */
async function withTimeout(promise, timeoutMs, operation = 'Operation') {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Batch operations with concurrency control
 * @param {Array} items - Items to process
 * @param {Function} fn - Function to apply to each item
 * @param {number} concurrency - Max concurrent operations (default: 5)
 * @returns {Array} Results
 */
async function batchProcess(items, fn, concurrency = 5) {
  const results = [];
  const errors = [];
  
  // Process in chunks
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    
    const chunkResults = await Promise.allSettled(
      chunk.map((item, index) => fn(item, i + index))
    );
    
    chunkResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results[i + index] = result.value;
      } else {
        errors.push({
          index: i + index,
          item: chunk[index],
          error: result.reason
        });
      }
    });
  }
  
  return {
    results,
    errors,
    succeeded: results.filter(r => r !== undefined).length,
    failed: errors.length
  };
}

/**
 * Circuit breaker pattern implementation
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.requestCount = 0;
  }
  
  async execute(fn) {
    this.requestCount++;
    
    // Check if circuit should be reset
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.failures = 0;
      } else {
        throw new Error(`Circuit breaker is OPEN. Service unavailable. Retry after ${Math.ceil((this.resetTimeout - timeSinceLastFailure) / 1000)}s`);
      }
    }
    
    try {
      const result = await fn();
      
      // Success
      this.successCount++;
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        console.error(`Circuit breaker opened after ${this.failures} failures`);
      }
      
      throw error;
    }
  }
  
  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      successRate: this.requestCount > 0 ? this.successCount / this.requestCount : 0,
      requestCount: this.requestCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

module.exports = {
  withRetry,
  wrapWithErrorHandler,
  withTimeout,
  batchProcess,
  CircuitBreaker
};