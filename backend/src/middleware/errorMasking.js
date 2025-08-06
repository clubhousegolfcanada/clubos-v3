const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Smart error masking middleware
 * Prevents information leakage while maintaining debuggability
 */
const errorMasking = (options = {}) => {
  const config = {
    enableStackTraces: options.enableStackTraces || process.env.NODE_ENV === 'development',
    logErrors: options.logErrors !== false,
    includeRequestId: options.includeRequestId !== false,
    customErrorMessages: options.customErrorMessages || {},
    sensitiveFields: options.sensitiveFields || [
      'password', 'token', 'secret', 'key', 'authorization',
      'cookie', 'session', 'credit', 'ssn', 'pin'
    ],
    errorCodeMapping: options.errorCodeMapping || {}
  };

  // Standard safe error messages
  const safeErrorMessages = {
    400: 'Invalid request',
    401: 'Authentication required',
    403: 'Access denied',
    404: 'Resource not found',
    405: 'Method not allowed',
    409: 'Conflict',
    413: 'Request too large',
    422: 'Invalid input',
    429: 'Too many requests',
    500: 'An error occurred',
    502: 'Service temporarily unavailable',
    503: 'Service unavailable',
    504: 'Request timeout',
    ...config.customErrorMessages
  };

  /**
   * Generate error code for tracking
   */
  const generateErrorCode = () => {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
  };

  /**
   * Clean sensitive data from error objects
   */
  const cleanSensitiveData = (obj, depth = 0) => {
    if (depth > 10) return '[Nested too deep]'; // Prevent infinite recursion
    
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      // Mask sensitive patterns in strings
      return maskSensitivePatterns(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => cleanSensitiveData(item, depth + 1));
    }
    
    if (typeof obj === 'object') {
      const cleaned = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        // Check if key contains sensitive field name
        const isSensitive = config.sensitiveFields.some(field => 
          lowerKey.includes(field)
        );
        
        if (isSensitive) {
          cleaned[key] = '[REDACTED]';
        } else if (key === 'stack' && !config.enableStackTraces) {
          cleaned[key] = '[Stack trace hidden]';
        } else {
          cleaned[key] = cleanSensitiveData(value, depth + 1);
        }
      }
      
      return cleaned;
    }
    
    return obj;
  };

  /**
   * Mask sensitive patterns in strings
   */
  const maskSensitivePatterns = (str) => {
    if (typeof str !== 'string') return str;
    
    const patterns = [
      // API Keys
      { regex: /([A-Za-z0-9]{32,})/g, mask: '[API_KEY]' },
      // JWTs
      { regex: /(eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+)/g, mask: '[JWT]' },
      // Credit card numbers
      { regex: /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g, mask: '[CARD]' },
      // SSN
      { regex: /\b(\d{3}-\d{2}-\d{4})\b/g, mask: '[SSN]' },
      // Email in certain contexts
      { regex: /password.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, mask: 'password for [EMAIL]' },
      // File paths that might leak structure
      { regex: /(\/[a-zA-Z0-9/_.-]+\/(config|secrets|private|keys)\/[a-zA-Z0-9/_.-]+)/g, mask: '[SENSITIVE_PATH]' }
    ];
    
    let masked = str;
    for (const pattern of patterns) {
      masked = masked.replace(pattern.regex, pattern.mask);
    }
    
    return masked;
  };

  /**
   * Categorize error for appropriate handling
   */
  const categorizeError = (err) => {
    // Check for known error types
    if (err.name === 'ValidationError' || err.isJoi) {
      return { status: 422, category: 'validation' };
    }
    
    if (err.name === 'UnauthorizedError' || err.code === 'UNAUTHORIZED') {
      return { status: 401, category: 'auth' };
    }
    
    if (err.name === 'ForbiddenError' || err.code === 'FORBIDDEN') {
      return { status: 403, category: 'permission' };
    }
    
    if (err.name === 'NotFoundError' || err.code === 'ENOENT') {
      return { status: 404, category: 'not_found' };
    }
    
    if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
      return { status: 504, category: 'timeout' };
    }
    
    if (err.code === 'ECONNREFUSED') {
      return { status: 502, category: 'service_down' };
    }
    
    // Database errors
    if (err.code && err.code.startsWith('23')) {
      if (err.code === '23505') {
        return { status: 409, category: 'duplicate' };
      }
      return { status: 400, category: 'database' };
    }
    
    // Default to internal error
    return { status: err.status || 500, category: 'internal' };
  };

  /**
   * Create safe error response
   */
  const createSafeError = (err, req, errorCode) => {
    const { status, category } = categorizeError(err);
    
    const safeError = {
      error: safeErrorMessages[status] || 'An error occurred',
      code: config.errorCodeMapping[err.code] || err.code || category.toUpperCase(),
      status
    };
    
    // Add request ID for tracking
    if (config.includeRequestId && (req.id || errorCode)) {
      safeError.requestId = req.id || errorCode;
    }
    
    // Add timestamp
    safeError.timestamp = new Date().toISOString();
    
    // In development, include more details
    if (config.enableStackTraces) {
      safeError.details = {
        message: err.message,
        type: err.name,
        category
      };
      
      // Include validation errors detail
      if (err.isJoi && err.details) {
        safeError.validation = err.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
      }
      
      // Include safe stack trace
      if (err.stack) {
        safeError.stack = cleanSensitiveData(err.stack);
      }
    }
    
    return safeError;
  };

  /**
   * Log detailed error information
   */
  const logDetailedError = (err, req, errorCode) => {
    const { status, category } = categorizeError(err);
    
    const errorDetails = {
      errorCode,
      status,
      category,
      message: err.message,
      type: err.name,
      code: err.code,
      stack: err.stack,
      request: {
        method: req.method,
        path: req.path,
        query: cleanSensitiveData(req.query),
        body: cleanSensitiveData(req.body),
        headers: cleanSensitiveData({
          ...req.headers,
          authorization: req.headers.authorization ? '[PRESENT]' : undefined,
          cookie: req.headers.cookie ? '[PRESENT]' : undefined
        }),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      user: req.user ? {
        id: req.user.id,
        role: req.user.role
      } : undefined,
      timestamp: new Date().toISOString()
    };
    
    // Log based on severity
    if (status >= 500) {
      logger.error('Server error occurred', errorDetails);
    } else if (status >= 400) {
      logger.warn('Client error occurred', errorDetails);
    } else {
      logger.info('Error handled', errorDetails);
    }
    
    return errorDetails;
  };

  // Error handling middleware
  return (err, req, res, next) => {
    // Skip if response already sent
    if (res.headersSent) {
      return next(err);
    }
    
    const errorCode = generateErrorCode();
    
    // Log the full error details
    if (config.logErrors) {
      logDetailedError(err, req, errorCode);
    }
    
    // Create safe error response
    const safeError = createSafeError(err, req, errorCode);
    
    // Send response
    res.status(safeError.status).json(safeError);
    
    // For critical errors, trigger alerts
    if (safeError.status >= 500) {
      triggerErrorAlert(err, req, errorCode);
    }
  };
};

/**
 * Trigger alerts for critical errors
 */
const triggerErrorAlert = async (err, req, errorCode) => {
  try {
    // In production, this would send alerts to monitoring systems
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service (e.g., Sentry)
      // Send to alerting service (e.g., PagerDuty)
      // Log to centralized logging
    }
  } catch (alertError) {
    logger.error('Failed to send error alert', alertError);
  }
};

/**
 * Create development error handler with full details
 */
const developmentErrorHandler = (options = {}) => {
  return errorMasking({
    ...options,
    enableStackTraces: true,
    includeRequestId: true
  });
};

/**
 * Create production error handler with minimal info
 */
const productionErrorHandler = (options = {}) => {
  return errorMasking({
    ...options,
    enableStackTraces: false,
    includeRequestId: true,
    logErrors: true
  });
};

/**
 * Async error wrapper for route handlers
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorMasking,
  developmentErrorHandler,
  productionErrorHandler,
  asyncErrorHandler
};