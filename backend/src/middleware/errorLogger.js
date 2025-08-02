const fs = require('fs').promises;
const path = require('path');
const { getCorrelationId } = require('../utils/correlationId');

/**
 * Comprehensive error logging middleware
 */
class ErrorLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  formatError(error, req) {
    const correlationId = getCorrelationId(req);
    const timestamp = new Date().toISOString();
    
    return {
      timestamp,
      correlationId,
      level: 'error',
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      body: this.sanitizeBody(req.body),
      headers: this.sanitizeHeaders(req.headers),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode || 500
      },
      context: {
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
  }

  sanitizeBody(body) {
    if (!body) return null;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'api_key', 'secret'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  sanitizeHeaders(headers) {
    if (!headers) return null;
    
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  async writeToFile(errorData) {
    if (process.env.NODE_ENV === 'test') return;
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `errors-${date}.log`;
    const filepath = path.join(this.logDir, filename);
    
    try {
      const line = JSON.stringify(errorData) + '\n';
      await fs.appendFile(filepath, line);
    } catch (error) {
      console.error('Failed to write error log:', error);
    }
  }

  middleware() {
    return async (error, req, res, next) => {
      // Format error data
      const errorData = this.formatError(error, req);
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('='.repeat(80));
        console.error('ERROR:', error.message);
        console.error('Stack:', error.stack);
        console.error('Request:', {
          method: req.method,
          url: req.url,
          body: errorData.body
        });
        console.error('='.repeat(80));
      } else {
        // Production: structured logging
        console.error(JSON.stringify({
          timestamp: errorData.timestamp,
          correlationId: errorData.correlationId,
          error: error.message,
          path: req.path
        }));
      }
      
      // Write to file
      await this.writeToFile(errorData);
      
      // Send response
      const statusCode = error.statusCode || 500;
      const response = {
        error: {
          message: error.message || 'Internal Server Error',
          correlationId: errorData.correlationId
        }
      };
      
      // Add details in development
      if (process.env.NODE_ENV === 'development') {
        response.error.stack = error.stack;
        response.error.details = error.details;
      }
      
      res.status(statusCode).json(response);
    };
  }

  // Async error wrapper for routes
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

// Custom error classes
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

const logger = new ErrorLogger();

module.exports = {
  errorLogger: logger,
  errorMiddleware: logger.middleware.bind(logger),
  asyncHandler: logger.asyncHandler.bind(logger),
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
};