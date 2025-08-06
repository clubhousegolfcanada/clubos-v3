const logger = require('../utils/logger');
const securityEvents = require('../services/security/SecurityEventLogger');

/**
 * Automatic input sanitization middleware
 * Prevents injection attacks by cleaning all user inputs
 */
const autoSanitize = (options = {}) => {
  const config = {
    removeHtmlTags: options.removeHtmlTags !== false,
    escapeTemplates: options.escapeTemplates !== false,
    blockSqlKeywords: options.blockSqlKeywords !== false,
    trimInputs: options.trimInputs !== false,
    maxFieldLength: options.maxFieldLength || 10000,
    allowedHtmlTags: options.allowedHtmlTags || [],
    customPatterns: options.customPatterns || []
  };

  // Dangerous patterns to detect and sanitize
  const dangerousPatterns = [
    // SQL Injection patterns
    {
      pattern: /(\b|')(OR|AND|UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\s+/gi,
      replacement: '',
      type: 'sql_injection'
    },
    // Script injection patterns
    {
      pattern: /<script[^>]*>[\s\S]*?<\/script>/gi,
      replacement: '',
      type: 'xss_script'
    },
    // Event handler injection
    {
      pattern: /on\w+\s*=\s*["'][^"']*["']/gi,
      replacement: '',
      type: 'xss_event'
    },
    // Template injection patterns
    {
      pattern: /\$\{[^}]*\}/g,
      replacement: (match) => config.escapeTemplates ? `\\${match}` : match,
      type: 'template_injection'
    },
    // Command injection patterns
    {
      pattern: /[;&|`]|\$\(/g,
      replacement: '',
      type: 'command_injection'
    },
    // Path traversal patterns
    {
      pattern: /\.\.\/|\.\.\\|\%2e\%2e\%2f/gi,
      replacement: '',
      type: 'path_traversal'
    },
    // Null byte injection
    {
      pattern: /\x00|\%00/g,
      replacement: '',
      type: 'null_byte'
    },
    // MongoDB injection patterns
    {
      pattern: /\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$exists|\$regex/g,
      replacement: '',
      type: 'nosql_injection'
    },
    // Prototype pollution
    {
      pattern: /__proto__|constructor|prototype/g,
      replacement: '',
      type: 'prototype_pollution'
    },
    ...config.customPatterns
  ];

  /**
   * Sanitize a single value
   */
  const sanitizeValue = (value, path = '') => {
    if (value === null || value === undefined) {
      return value;
    }

    // Handle strings
    if (typeof value === 'string') {
      let sanitized = value;
      const detectedThreats = [];

      // Trim if configured
      if (config.trimInputs) {
        sanitized = sanitized.trim();
      }

      // Check length
      if (sanitized.length > config.maxFieldLength) {
        logger.warn('Input exceeds maximum length', {
          path,
          length: sanitized.length,
          maxLength: config.maxFieldLength
        });
        sanitized = sanitized.substring(0, config.maxFieldLength);
      }

      // Apply dangerous pattern sanitization
      for (const patternDef of dangerousPatterns) {
        if (patternDef.pattern.test(sanitized)) {
          detectedThreats.push(patternDef.type);
          sanitized = sanitized.replace(
            patternDef.pattern,
            typeof patternDef.replacement === 'function' 
              ? patternDef.replacement 
              : patternDef.replacement
          );
        }
      }

      // Remove HTML tags if configured (unless whitelisted)
      if (config.removeHtmlTags) {
        sanitized = removeHtmlTags(sanitized, config.allowedHtmlTags);
      }

      // Escape special characters
      sanitized = escapeSpecialChars(sanitized);

      // Log threats if detected
      if (detectedThreats.length > 0) {
        logger.warn('Potential injection attempt detected', {
          path,
          threats: detectedThreats,
          originalLength: value.length,
          sanitizedLength: sanitized.length
        });
      }

      return sanitized;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item, index) => 
        sanitizeValue(item, `${path}[${index}]`)
      );
    }

    // Handle objects
    if (typeof value === 'object') {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        // Sanitize the key itself
        const sanitizedKey = sanitizeValue(key, `${path}.${key}`);
        if (typeof sanitizedKey === 'string') {
          sanitized[sanitizedKey] = sanitizeValue(val, `${path}.${key}`);
        }
      }
      return sanitized;
    }

    // Return other types as-is (numbers, booleans, etc.)
    return value;
  };

  /**
   * Remove HTML tags except allowed ones
   */
  const removeHtmlTags = (str, allowedTags) => {
    if (allowedTags.length === 0) {
      // Remove all HTML tags
      return str.replace(/<[^>]*>/g, '');
    }

    // Create regex for allowed tags
    const allowedPattern = allowedTags.join('|');
    const regex = new RegExp(`<(?!\/?(?:${allowedPattern})\\s*\/?)[^>]+>`, 'gi');
    return str.replace(regex, '');
  };

  /**
   * Escape special characters
   */
  const escapeSpecialChars = (str) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    // Only escape if not already escaped
    return str.replace(/[&<>"'\/]/g, (char) => {
      // Check if already escaped
      const escaped = escapeMap[char];
      const alreadyEscaped = str.indexOf(escaped) !== -1;
      return alreadyEscaped ? char : escaped;
    });
  };

  /**
   * Check if request might be malicious
   */
  const detectMaliciousRequest = (req) => {
    const indicators = [];

    // Check for suspicious headers
    if (req.headers['x-forwarded-for'] && 
        req.headers['x-forwarded-for'].split(',').length > 5) {
      indicators.push('excessive_proxy_chain');
    }

    // Check for suspicious user agents
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.includes('sqlmap') || 
        userAgent.includes('nikto') ||
        userAgent.includes('scanner')) {
      indicators.push('known_scanner_tool');
    }

    // Check request size
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
      indicators.push('excessive_request_size');
    }

    return indicators;
  };

  // Middleware function
  return async (req, res, next) => {
    try {
      const startTime = Date.now();
      const maliciousIndicators = detectMaliciousRequest(req);

      // Log suspicious requests
      if (maliciousIndicators.length > 0) {
        logger.warn('Suspicious request detected', {
          indicators: maliciousIndicators,
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        // Log security event
        if (securityEvents) {
          await securityEvents.logSecurityEvent({
            eventType: 'suspicious_request',
            severity: 'medium',
            sourceIp: req.ip,
            userAgent: req.headers['user-agent'],
            endpoint: req.path,
            method: req.method,
            detectionMethod: 'autoSanitize',
            detectionRule: maliciousIndicators.join(', ')
          });
        }
      }

      // Sanitize all inputs
      const originalBody = JSON.stringify(req.body);
      const originalQuery = JSON.stringify(req.query);
      const originalParams = JSON.stringify(req.params);

      req.body = sanitizeValue(req.body, 'body');
      req.query = sanitizeValue(req.query, 'query');
      req.params = sanitizeValue(req.params, 'params');

      // Sanitize headers (selective)
      const headersToSanitize = ['referer', 'x-custom-header'];
      for (const header of headersToSanitize) {
        if (req.headers[header]) {
          req.headers[header] = sanitizeValue(req.headers[header], `headers.${header}`);
        }
      }

      // Check if any data was modified
      const wasModified = 
        JSON.stringify(req.body) !== originalBody ||
        JSON.stringify(req.query) !== originalQuery ||
        JSON.stringify(req.params) !== originalParams;

      if (wasModified) {
        logger.info('Request sanitized', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          sanitizationTime: Date.now() - startTime
        });

        // Add header to indicate sanitization occurred
        req.headers['x-sanitized'] = 'true';
      }

      // Add sanitization metadata to request
      req.sanitization = {
        wasModified,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      next();
    } catch (error) {
      logger.error('Error in autoSanitize middleware', error);
      // Don't block the request on sanitization error
      next();
    }
  };
};

/**
 * Create a strict sanitizer for specific endpoints
 */
const strictSanitize = (options = {}) => {
  return autoSanitize({
    ...options,
    removeHtmlTags: true,
    escapeTemplates: true,
    blockSqlKeywords: true,
    maxFieldLength: 1000,
    customPatterns: [
      {
        pattern: /system\.|process\.|require\(/gi,
        replacement: '',
        type: 'code_execution'
      }
    ]
  });
};

/**
 * Create a lenient sanitizer for trusted endpoints
 */
const lenientSanitize = (options = {}) => {
  return autoSanitize({
    ...options,
    removeHtmlTags: false,
    allowedHtmlTags: ['p', 'b', 'i', 'u', 'a', 'br'],
    maxFieldLength: 50000
  });
};

module.exports = {
  autoSanitize,
  strictSanitize,
  lenientSanitize
};