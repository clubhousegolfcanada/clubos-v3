const { v4: uuidv4 } = require('uuid');

/**
 * Generate a correlation ID for tracing requests through the system
 */
function generateCorrelationId() {
  return `clubos-${Date.now()}-${uuidv4().split('-')[0]}`;
}

/**
 * Extract correlation ID from request headers or generate new one
 */
function getCorrelationId(req) {
  return req.headers['x-correlation-id'] || 
         req.headers['x-request-id'] || 
         generateCorrelationId();
}

module.exports = {
  generateCorrelationId,
  getCorrelationId
};