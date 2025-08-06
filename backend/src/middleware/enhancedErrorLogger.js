const fs = require('fs').promises;
const path = require('path');
const { getCorrelationId } = require('../utils/correlationId');
const errorCapture = require('../services/errorCapture');
const recursiveLearning = require('../services/recursiveLearning');
const fixRegistry = require('../services/fixRegistry');
const logger = require('../utils/logger');

/**
 * Enhanced error logging with recursive learning integration
 */
class EnhancedErrorLogger {
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

  /**
   * Enhanced middleware with recursive learning
   */
  middleware() {
    return async (error, req, res, next) => {
      // Format error data
      const errorData = this.formatError(error, req);
      
      // Capture error for learning
      const captureResult = await errorCapture.capture(error, req, {
        correlationId: errorData.correlationId,
        userAgent: errorData.userAgent
      });
      
      // Check if we have a fix available
      let fixApplied = false;
      let fixResult = null;
      
      if (captureResult.hasFix) {
        try {
          // Apply the fix
          fixResult = await fixRegistry.applyFix(
            captureResult.fix,
            {
              ...errorData.context,
              request: req,
              error: error
            }
          );
          
          fixApplied = true;
          
          // Log fix application
          logger.info('Applied automatic fix', {
            patternId: captureResult.pattern.id,
            fixClass: captureResult.fix.fix_class,
            confidence: captureResult.confidence
          });
          
        } catch (fixError) {
          logger.error('Failed to apply fix', fixError);
        }
      }
      
      // Log based on environment
      if (process.env.NODE_ENV === 'development') {
        console.error('='.repeat(80));
        console.error('ERROR:', error.message);
        
        if (captureResult.suppressed) {
          console.error('SUPPRESSED: Count =', captureResult.suppressionCount);
        }
        
        if (fixApplied) {
          console.error('FIX APPLIED:', fixResult);
        }
        
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
          path: req.path,
          suppressed: captureResult.suppressed,
          fixApplied,
          errorId: captureResult.errorId
        }));
      }
      
      // Write to file unless suppressed
      if (!captureResult.suppressed) {
        await this.writeToFile({
          ...errorData,
          learning: {
            errorId: captureResult.errorId,
            patternMatched: !!captureResult.pattern,
            fixAvailable: captureResult.hasFix,
            fixApplied
          }
        });
      }
      
      // Prepare response
      const statusCode = error.statusCode || 500;
      const response = {
        error: {
          message: error.message || 'Internal Server Error',
          correlationId: errorData.correlationId
        }
      };
      
      // Add fix information if available
      if (fixApplied && fixResult) {
        response.fixApplied = true;
        
        // Add user-friendly fix description
        if (fixResult.instruction) {
          response.resolution = fixResult.instruction;
        }
        
        // If fix requires user action
        if (fixResult.userAction) {
          response.userAction = fixResult.userAction;
        }
      }
      
      // Add details in development
      if (process.env.NODE_ENV === 'development') {
        response.error.stack = error.stack;
        response.error.details = error.details;
        
        if (captureResult.pattern) {
          response.debug = {
            patternId: captureResult.pattern.id,
            similarity: captureResult.confidence,
            fixClass: captureResult.pattern.fix_class
          };
        }
      }
      
      // Handle specific fix results
      if (fixResult?.blocked) {
        // For debounce/rate limit fixes
        response.error.message = fixResult.reason;
        
        if (fixResult.remainingTime) {
          response.retryAfter = Math.ceil(fixResult.remainingTime / 1000);
          res.set('Retry-After', response.retryAfter.toString());
        }
      }
      
      res.status(statusCode).json(response);
    };
  }

  /**
   * Async error wrapper with learning
   */
  asyncHandler(fn) {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        // Check for similar fixes before passing to error handler
        const similarFix = await recursiveLearning.findSimilarFix(
          error,
          {
            endpoint: req.path,
            method: req.method,
            module: this.detectModule(req)
          }
        );
        
        if (similarFix) {
          try {
            // Attempt to apply fix preemptively
            const fixResult = await fixRegistry.applyFix(similarFix, {
              request: req,
              error: error
            });
            
            if (fixResult.handled) {
              // Fix handled the error completely
              return res.status(200).json(fixResult.response);
            }
          } catch (fixError) {
            // Fix failed, continue with normal error handling
            logger.warn('Preemptive fix failed', fixError);
          }
        }
        
        next(error);
      }
    };
  }

  detectModule(req) {
    const path = req.path?.toLowerCase() || '';
    
    if (path.includes('/messages')) return 'messaging';
    if (path.includes('/threads')) return 'threads';
    if (path.includes('/sops')) return 'sops';
    if (path.includes('/auth')) return 'authentication';
    if (path.includes('/actions')) return 'actions';
    
    return 'general';
  }
}

// Enhanced error classes with fix hints
class ValidationError extends Error {
  constructor(message, details, fixHint) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
    this.fixHint = fixHint || 'Check input validation rules';
  }
}

class NotFoundError extends Error {
  constructor(message, resource) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.resource = resource;
  }
}

class UnauthorizedError extends Error {
  constructor(message, reason) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
    this.reason = reason;
  }
}

class ForbiddenError extends Error {
  constructor(message, requiredPermission) {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
    this.requiredPermission = requiredPermission;
  }
}

class ConflictError extends Error {
  constructor(message, conflictingResource) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.conflictingResource = conflictingResource;
  }
}

class RateLimitError extends Error {
  constructor(message, retryAfter) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
    this.retryAfter = retryAfter;
  }
}

class ExternalAPIError extends Error {
  constructor(message, service, originalError) {
    super(message);
    this.name = 'ExternalAPIError';
    this.statusCode = 502;
    this.service = service;
    this.originalError = originalError;
  }
}

const enhancedLogger = new EnhancedErrorLogger();

module.exports = {
  errorLogger: enhancedLogger,
  errorMiddleware: enhancedLogger.middleware.bind(enhancedLogger),
  asyncHandler: enhancedLogger.asyncHandler.bind(enhancedLogger),
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ExternalAPIError
};