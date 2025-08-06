const logger = require('../utils/logger');
const recursiveLearning = require('./recursiveLearning');

class ErrorCaptureService {
  constructor() {
    this.errorBuffer = [];
    this.flushInterval = 5000; // 5 seconds
    this.startPeriodicFlush();
  }

  /**
   * Capture error with full context
   */
  async capture(error, req, additionalContext = {}) {
    const errorInfo = this.extractErrorInfo(error);
    const context = this.buildContext(req, additionalContext);
    
    // Add to buffer for batch processing
    this.errorBuffer.push({
      error: errorInfo,
      context,
      timestamp: new Date()
    });
    
    // Immediate capture for critical errors
    if (errorInfo.severity === 'critical') {
      return this.processImmediate(errorInfo, context);
    }
    
    // Check buffer size
    if (this.errorBuffer.length >= 10) {
      this.flushBuffer();
    }
    
    return { buffered: true, bufferSize: this.errorBuffer.length };
  }

  /**
   * Extract structured error information
   */
  extractErrorInfo(error) {
    // Handle different error types
    if (error instanceof Error) {
      return {
        type: error.constructor.name,
        code: error.code || 'UNKNOWN',
        message: error.message,
        stack: error.stack,
        severity: this.determineSeverity(error),
        ...this.extractCustomFields(error)
      };
    }
    
    // Handle non-Error objects
    return {
      type: 'UnknownError',
      code: 'UNKNOWN',
      message: String(error),
      severity: 'error'
    };
  }

  /**
   * Build comprehensive context
   */
  buildContext(req, additional = {}) {
    const context = {
      // Request info
      endpoint: req?.path || req?.url,
      method: req?.method,
      headers: this.sanitizeHeaders(req?.headers),
      query: req?.query,
      body: this.sanitizeBody(req?.body),
      
      // User info
      userId: req?.user?.id,
      userRole: req?.user?.role,
      sessionId: req?.sessionID,
      
      // System info
      threadId: req?.body?.threadId || req?.params?.threadId,
      module: this.detectModule(req),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      
      // Additional context
      ...additional
    };
    
    return context;
  }

  /**
   * Determine error severity
   */
  determineSeverity(error) {
    // Critical errors
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' ||
        error.message?.includes('Database') ||
        error.message?.includes('Authentication failed')) {
      return 'critical';
    }
    
    // High severity
    if (error.statusCode >= 500 ||
        error.message?.includes('timeout') ||
        error.message?.includes('rate limit')) {
      return 'high';
    }
    
    // Medium severity
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Extract custom error fields
   */
  extractCustomFields(error) {
    const fields = {};
    
    // Common HTTP error fields
    if (error.statusCode) fields.statusCode = error.statusCode;
    if (error.response) fields.response = error.response;
    
    // API error fields
    if (error.apiName) fields.apiName = error.apiName;
    if (error.endpoint) fields.endpoint = error.endpoint;
    
    // Database error fields
    if (error.query) fields.query = this.sanitizeQuery(error.query);
    if (error.table) fields.table = error.table;
    
    return fields;
  }

  /**
   * Detect module from request
   */
  detectModule(req) {
    if (!req?.path) return 'unknown';
    
    const path = req.path.toLowerCase();
    
    if (path.includes('/messages')) return 'messaging';
    if (path.includes('/threads')) return 'threads';
    if (path.includes('/sops')) return 'sops';
    if (path.includes('/auth')) return 'authentication';
    if (path.includes('/actions')) return 'actions';
    
    return 'general';
  }

  /**
   * Sanitize headers (remove sensitive data)
   */
  sanitizeHeaders(headers) {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    const sensitive = ['authorization', 'cookie', 'x-api-key'];
    
    sensitive.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize request body
   */
  sanitizeBody(body) {
    if (!body) return {};
    
    const sanitized = { ...body };
    const sensitive = ['password', 'token', 'apiKey', 'secret'];
    
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (sensitive.some(s => key.toLowerCase().includes(s))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Sanitize SQL queries
   */
  sanitizeQuery(query) {
    if (!query) return '';
    
    // Replace actual values with placeholders
    return query
      .replace(/= '[^']*'/g, "= '[VALUE]'")
      .replace(/= \d+/g, '= [NUMBER]')
      .replace(/IN \([^)]*\)/g, 'IN ([VALUES])');
  }

  /**
   * Process error immediately
   */
  async processImmediate(error, context) {
    try {
      const result = await recursiveLearning.captureError(error, context);
      
      // Log based on result
      if (result.suppressed) {
        logger.debug('Error suppressed', {
          type: error.type,
          count: result.suppressionCount
        });
      } else if (result.hasFix) {
        logger.info('Error captured with existing fix', {
          type: error.type,
          patternId: result.pattern.id,
          confidence: result.confidence
        });
      } else {
        logger.error('New error captured', {
          type: error.type,
          errorId: result.errorId,
          floodDetected: result.floodDetected
        });
      }
      
      return result;
    } catch (err) {
      logger.error('Failed to process error', err);
      return { error: 'Processing failed' };
    }
  }

  /**
   * Flush error buffer
   */
  async flushBuffer() {
    if (this.errorBuffer.length === 0) return;
    
    const errors = [...this.errorBuffer];
    this.errorBuffer = [];
    
    // Process errors in parallel
    const promises = errors.map(({ error, context }) => 
      recursiveLearning.captureError(error, context).catch(err => {
        logger.error('Failed to capture error from buffer', err);
        return null;
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * Start periodic buffer flush
   */
  startPeriodicFlush() {
    setInterval(() => {
      if (this.errorBuffer.length > 0) {
        this.flushBuffer();
      }
    }, this.flushInterval);
  }

  /**
   * Create error with context
   */
  createError(message, code, additionalInfo = {}) {
    const error = new Error(message);
    error.code = code;
    error.timestamp = new Date();
    
    Object.assign(error, additionalInfo);
    
    return error;
  }
}

module.exports = new ErrorCaptureService();