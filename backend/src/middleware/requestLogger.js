const { getCorrelationId } = require('../utils/correlationId');

/**
 * Request/Response logging middleware for debugging
 */
class RequestLogger {
  constructor() {
    this.skipPaths = ['/health', '/favicon.ico'];
    this.slowRequestThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 1000; // 1 second
  }

  shouldLog(req) {
    // Skip certain paths
    if (this.skipPaths.includes(req.path)) {
      return false;
    }
    
    // Skip in test environment
    if (process.env.NODE_ENV === 'test') {
      return false;
    }
    
    return true;
  }

  formatRequest(req) {
    return {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      body: this.sanitizeBody(req.body),
      headers: {
        'content-type': req.get('content-type'),
        'user-agent': req.get('user-agent'),
        'x-correlation-id': req.get('x-correlation-id')
      },
      ip: req.ip || req.connection.remoteAddress
    };
  }

  formatResponse(res, duration) {
    return {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      slow: duration > this.slowRequestThreshold,
      headers: {
        'content-type': res.get('content-type'),
        'content-length': res.get('content-length')
      }
    };
  }

  sanitizeBody(body) {
    if (!body) return null;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'api_key', 'secret', 'content'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        if (field === 'content' && sanitized[field].length > 200) {
          // Truncate long content
          sanitized[field] = sanitized[field].substring(0, 200) + '... [truncated]';
        } else if (field !== 'content') {
          sanitized[field] = '[REDACTED]';
        }
      }
    }
    
    return sanitized;
  }

  middleware() {
    return (req, res, next) => {
      if (!this.shouldLog(req)) {
        return next();
      }
      
      const startTime = Date.now();
      const correlationId = getCorrelationId(req);
      
      // Add correlation ID to request
      req.correlationId = correlationId;
      
      // Log request
      const requestData = {
        timestamp: new Date().toISOString(),
        correlationId,
        type: 'request',
        request: this.formatRequest(req)
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`→ ${req.method} ${req.path}`, req.query);
      } else {
        console.log(JSON.stringify(requestData));
      }
      
      // Capture response
      const originalSend = res.send;
      res.send = function(body) {
        res.send = originalSend;
        
        const duration = Date.now() - startTime;
        const responseData = {
          timestamp: new Date().toISOString(),
          correlationId,
          type: 'response',
          response: this.formatResponse(res, duration)
        };
        
        // Log slow requests with more detail
        if (responseData.response.slow) {
          responseData.warning = 'Slow request detected';
          responseData.request = requestData.request;
        }
        
        if (process.env.NODE_ENV === 'development') {
          const emoji = res.statusCode >= 400 ? '✗' : '✓';
          const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
          console.log(`${color}← ${emoji} ${res.statusCode} ${duration}ms\x1b[0m`);
          
          if (duration > this.slowRequestThreshold) {
            console.warn(`⚠️  Slow request: ${duration}ms`);
          }
        } else {
          console.log(JSON.stringify(responseData));
        }
        
        return res.send(body);
      }.bind(this);
      
      next();
    };
  }
}

module.exports = new RequestLogger();