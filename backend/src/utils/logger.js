const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Store for async local storage of correlation ID
let currentCorrelationId = 'system';

// Custom format to include correlation ID
const correlationFormat = winston.format((info) => {
  info.correlationId = currentCorrelationId;
  return info;
});

// Helper to set correlation ID
const setCorrelationId = (id) => {
  currentCorrelationId = id || 'system';
};

const getCorrelationId = () => currentCorrelationId;

// Development format with colors
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  correlationFormat(),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${correlationId}] ${level}: ${message} ${metaStr}`;
  })
);

// Production format (JSON)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  correlationFormat(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { 
    service: 'clubos-v3',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: []
});

// Console transport (always enabled)
logger.add(new winston.transports.Console({
  handleExceptions: true,
  handleRejections: true
}));

// File transports (production only)
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || 'logs';
  
  // Daily rotate file for all logs
  logger.add(new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info'
  }));
  
  // Separate error log
  logger.add(new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error'
  }));
}

// Add performance logging
logger.time = (label) => {
  const start = Date.now();
  return {
    end: (meta = {}) => {
      const duration = Date.now() - start;
      logger.info(`${label} completed`, { duration, ...meta });
      return duration;
    }
  };
};

// Add structured logging helpers
logger.logRequest = (req, res, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    code: error.code,
    ...context
  });
};

logger.logDatabaseQuery = (query, params, duration) => {
  logger.debug('Database Query', {
    query: query.substring(0, 200), // Truncate long queries
    params: params?.length > 5 ? `[${params.length} params]` : params,
    duration
  });
};

logger.logPatternMatch = (pattern, input, confidence, result) => {
  logger.info('Pattern Match', {
    pattern,
    inputPreview: input.substring(0, 100),
    confidence,
    matched: result.matched,
    action: result.action
  });
};

logger.logCacheHit = (type, key, hit) => {
  logger.debug('Cache Access', {
    type,
    key: key.substring(0, 50),
    hit,
    result: hit ? 'HIT' : 'MISS'
  });
};

logger.logActionExecution = (action, params, result, duration) => {
  logger.info('Action Execution', {
    action,
    params: Object.keys(params).length > 5 ? '[complex params]' : params,
    success: result.success,
    duration,
    error: result.error
  });
};

logger.logIntegration = (service, operation, success, duration, details = {}) => {
  const level = success ? 'info' : 'error';
  logger[level]('External Integration', {
    service,
    operation,
    success,
    duration,
    ...details
  });
};

// Audit logging for compliance
logger.audit = (action, userId, resource, outcome, details = {}) => {
  logger.info('AUDIT', {
    action,
    userId,
    resource,
    outcome,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Security logging
logger.security = (event, severity, details = {}) => {
  const level = severity === 'critical' ? 'error' : 'warn';
  logger[level]('SECURITY', {
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Export logger with helper functions
logger.setCorrelationId = setCorrelationId;
logger.getCorrelationId = getCorrelationId;

module.exports = logger;