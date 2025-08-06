const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const db = require('../db/pool');

/**
 * Zero Trust security middleware
 * Validates every request, trusts nothing by default
 */
const zeroTrust = (options = {}) => {
  const config = {
    validateInternalCalls: options.validateInternalCalls !== false,
    requireSignatures: options.requireSignatures !== false,
    checkDataIntegrity: options.checkDataIntegrity !== false,
    enforceEncryption: options.enforceEncryption !== false,
    validateTokenScopes: options.validateTokenScopes !== false,
    maxTokenAge: options.maxTokenAge || 3600, // 1 hour default
    allowedServices: options.allowedServices || [],
    requiredHeaders: options.requiredHeaders || []
  };

  /**
   * Validate internal service calls
   */
  const validateInternalService = async (req) => {
    const serviceHeader = req.headers['x-internal-service'];
    const signature = req.headers['x-service-signature'];
    
    if (!serviceHeader) {
      return { valid: true }; // Not an internal call
    }

    if (!signature) {
      return {
        valid: false,
        reason: 'Missing service signature'
      };
    }

    // Check if service is allowed
    if (config.allowedServices.length > 0 && 
        !config.allowedServices.includes(serviceHeader)) {
      return {
        valid: false,
        reason: 'Service not allowed'
      };
    }

    // Verify signature
    const signatureValid = await verifyServiceSignature(req, signature);
    if (!signatureValid) {
      return {
        valid: false,
        reason: 'Invalid service signature'
      };
    }

    // Check service permissions
    const hasPermission = await checkServicePermissions(
      serviceHeader, 
      req.method, 
      req.path
    );
    
    if (!hasPermission) {
      return {
        valid: false,
        reason: 'Service lacks required permissions'
      };
    }

    return { valid: true, service: serviceHeader };
  };

  /**
   * Verify service signature
   */
  const verifyServiceSignature = async (req, signature) => {
    try {
      // Get service secret from secure store
      const serviceSecret = await getServiceSecret(req.headers['x-internal-service']);
      if (!serviceSecret) return false;

      // Create signature payload
      const payload = {
        service: req.headers['x-internal-service'],
        method: req.method,
        path: req.path,
        timestamp: req.headers['x-timestamp'],
        nonce: req.headers['x-nonce']
      };

      // Include body hash if present
      if (req.body && Object.keys(req.body).length > 0) {
        payload.bodyHash = crypto
          .createHash('sha256')
          .update(JSON.stringify(req.body))
          .digest('hex');
      }

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', serviceSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      // Constant-time comparison
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Error verifying service signature', error);
      return false;
    }
  };

  /**
   * Check data integrity
   */
  const checkDataIntegrity = (req) => {
    const contentHash = req.headers['x-content-hash'];
    if (!contentHash) {
      return { valid: true }; // No hash provided, skip check
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return {
        valid: false,
        reason: 'Content hash provided but no body'
      };
    }

    // Calculate actual hash
    const actualHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (contentHash !== actualHash) {
      return {
        valid: false,
        reason: 'Content integrity check failed'
      };
    }

    return { valid: true };
  };

  /**
   * Validate JWT token and scopes
   */
  const validateTokenScopes = async (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: true }; // No token, let auth middleware handle
    }

    try {
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token);
      
      if (!decoded) {
        return {
          valid: false,
          reason: 'Invalid token format'
        };
      }

      // Check token age
      const tokenAge = Date.now() / 1000 - decoded.iat;
      if (tokenAge > config.maxTokenAge) {
        return {
          valid: false,
          reason: 'Token too old'
        };
      }

      // Validate scopes for endpoint
      const requiredScopes = getRequiredScopes(req.method, req.path);
      const tokenScopes = decoded.scopes || [];
      
      const hasRequiredScopes = requiredScopes.every(scope => 
        tokenScopes.includes(scope)
      );

      if (!hasRequiredScopes) {
        return {
          valid: false,
          reason: 'Insufficient token scopes',
          required: requiredScopes,
          provided: tokenScopes
        };
      }

      // Check token binding
      if (decoded.boundTo) {
        const bindingValid = await validateTokenBinding(decoded.boundTo, req);
        if (!bindingValid) {
          return {
            valid: false,
            reason: 'Token binding validation failed'
          };
        }
      }

      return { valid: true, userId: decoded.id };
    } catch (error) {
      logger.error('Error validating token scopes', error);
      return {
        valid: false,
        reason: 'Token validation error'
      };
    }
  };

  /**
   * Enforce encryption requirements
   */
  const enforceEncryption = (req) => {
    // Skip in development
    if (process.env.NODE_ENV === 'development') {
      return { valid: true };
    }

    // Check if connection is encrypted
    const isEncrypted = req.secure || 
                       req.headers['x-forwarded-proto'] === 'https' ||
                       req.connection.encrypted;

    if (!isEncrypted) {
      return {
        valid: false,
        reason: 'Unencrypted connection not allowed'
      };
    }

    // Check TLS version
    const tlsVersion = req.connection.getCipher?.()?.version;
    if (tlsVersion && tlsVersion < 'TLSv1.2') {
      return {
        valid: false,
        reason: 'TLS version too old'
      };
    }

    return { valid: true };
  };

  /**
   * Validate required headers
   */
  const validateRequiredHeaders = (req) => {
    const missingHeaders = config.requiredHeaders.filter(header => 
      !req.headers[header.toLowerCase()]
    );

    if (missingHeaders.length > 0) {
      return {
        valid: false,
        reason: 'Missing required headers',
        missing: missingHeaders
      };
    }

    // Validate header formats
    for (const header of config.requiredHeaders) {
      const value = req.headers[header.toLowerCase()];
      if (!isValidHeaderValue(header, value)) {
        return {
          valid: false,
          reason: `Invalid ${header} header format`
        };
      }
    }

    return { valid: true };
  };

  /**
   * Check request freshness
   */
  const checkRequestFreshness = (req) => {
    const timestamp = req.headers['x-timestamp'];
    const nonce = req.headers['x-nonce'];

    if (!timestamp || !nonce) {
      return { valid: true }; // Optional check
    }

    // Check timestamp is recent (within 5 minutes)
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime);

    if (timeDiff > 5 * 60 * 1000) {
      return {
        valid: false,
        reason: 'Request timestamp too old'
      };
    }

    // Check nonce hasn't been used
    if (hasNonceBeenUsed(nonce)) {
      return {
        valid: false,
        reason: 'Request nonce already used'
      };
    }

    return { valid: true };
  };

  // Middleware function
  return async (req, res, next) => {
    try {
      const validations = [];

      // Run all validations
      if (config.enforceEncryption) {
        const encryptionResult = enforceEncryption(req);
        if (!encryptionResult.valid) {
          return res.status(403).json({
            error: 'Security requirement not met',
            reason: encryptionResult.reason
          });
        }
      }

      if (config.validateInternalCalls) {
        const serviceResult = await validateInternalService(req);
        if (!serviceResult.valid) {
          logger.warn('Invalid internal service call', {
            from: req.ip,
            service: req.headers['x-internal-service'],
            path: req.path,
            reason: serviceResult.reason
          });
          return res.status(403).json({
            error: 'Invalid service signature',
            reason: serviceResult.reason
          });
        }
        if (serviceResult.service) {
          req.internalService = serviceResult.service;
        }
      }

      if (config.checkDataIntegrity) {
        const integrityResult = checkDataIntegrity(req);
        if (!integrityResult.valid) {
          logger.warn('Data integrity check failed', {
            from: req.ip,
            path: req.path,
            reason: integrityResult.reason
          });
          return res.status(400).json({
            error: 'Content integrity check failed',
            reason: integrityResult.reason
          });
        }
      }

      if (config.validateTokenScopes) {
        const scopeResult = await validateTokenScopes(req);
        if (!scopeResult.valid) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            reason: scopeResult.reason,
            required: scopeResult.required,
            provided: scopeResult.provided
          });
        }
      }

      // Validate required headers
      const headerResult = validateRequiredHeaders(req);
      if (!headerResult.valid) {
        return res.status(400).json({
          error: 'Missing required headers',
          reason: headerResult.reason,
          missing: headerResult.missing
        });
      }

      // Check request freshness
      const freshnessResult = checkRequestFreshness(req);
      if (!freshnessResult.valid) {
        return res.status(400).json({
          error: 'Request validation failed',
          reason: freshnessResult.reason
        });
      }

      // Add zero-trust metadata to request
      req.zeroTrust = {
        validated: true,
        timestamp: new Date(),
        validations: {
          encryption: config.enforceEncryption,
          internalService: !!req.internalService,
          dataIntegrity: config.checkDataIntegrity,
          tokenScopes: config.validateTokenScopes
        }
      };

      // Log high-security requests
      if (req.internalService || req.path.includes('/admin')) {
        logger.info('Zero-trust validation passed', {
          service: req.internalService,
          path: req.path,
          method: req.method,
          ip: req.ip
        });
      }

      next();
    } catch (error) {
      logger.error('Error in zero-trust middleware', error);
      res.status(500).json({
        error: 'Security validation error'
      });
    }
  };
};

// Helper functions
const getServiceSecret = async (serviceName) => {
  // In production, retrieve from secure secret store
  const secrets = {
    'api-gateway': process.env.API_GATEWAY_SECRET,
    'worker-service': process.env.WORKER_SERVICE_SECRET,
    'admin-service': process.env.ADMIN_SERVICE_SECRET
  };
  return secrets[serviceName];
};

const checkServicePermissions = async (service, method, path) => {
  // Define service permissions
  const permissions = {
    'api-gateway': ['*'], // Full access
    'worker-service': [
      'GET:/api/messages',
      'POST:/api/messages/process',
      'GET:/api/sops'
    ],
    'admin-service': [
      'GET:/api/*',
      'POST:/api/*',
      'PUT:/api/*',
      'DELETE:/api/*'
    ]
  };

  const servicePerms = permissions[service] || [];
  
  // Check if service has wildcard permission
  if (servicePerms.includes('*')) return true;
  
  // Check specific permission
  const requiredPerm = `${method}:${path}`;
  return servicePerms.some(perm => {
    if (perm.endsWith('/*')) {
      const prefix = perm.slice(0, -2);
      return requiredPerm.startsWith(prefix);
    }
    return perm === requiredPerm;
  });
};

const getRequiredScopes = (method, path) => {
  // Define scope requirements by endpoint
  const scopeMap = {
    'GET:/api/messages': ['messages:read'],
    'POST:/api/messages': ['messages:write'],
    'GET:/api/users': ['users:read'],
    'POST:/api/users': ['users:write', 'admin'],
    'DELETE:/api/users': ['users:delete', 'admin']
  };

  const key = `${method}:${path}`;
  return scopeMap[key] || [];
};

const validateTokenBinding = async (binding, req) => {
  // Validate token is bound to correct context
  if (binding.ip && binding.ip !== req.ip) {
    return false;
  }
  
  if (binding.userAgent && binding.userAgent !== req.headers['user-agent']) {
    return false;
  }
  
  if (binding.sessionId && binding.sessionId !== req.session?.id) {
    return false;
  }
  
  return true;
};

const isValidHeaderValue = (header, value) => {
  // Validate header formats
  const validators = {
    'X-API-Version': /^\d+\.\d+$/,
    'X-Request-ID': /^[a-zA-Z0-9-]{36}$/,
    'X-Client-ID': /^[a-zA-Z0-9-]+$/
  };
  
  const validator = validators[header];
  return !validator || validator.test(value);
};

// Nonce tracking (in production, use Redis)
const usedNonces = new Set();
const hasNonceBeenUsed = (nonce) => {
  if (usedNonces.has(nonce)) {
    return true;
  }
  
  usedNonces.add(nonce);
  
  // Clean old nonces periodically
  if (usedNonces.size > 10000) {
    usedNonces.clear();
  }
  
  return false;
};

/**
 * Create strict zero-trust validator
 */
const strictZeroTrust = (options = {}) => {
  return zeroTrust({
    ...options,
    validateInternalCalls: true,
    requireSignatures: true,
    checkDataIntegrity: true,
    enforceEncryption: true,
    validateTokenScopes: true,
    requiredHeaders: ['X-Request-ID', 'X-Client-ID']
  });
};

/**
 * Create internal service validator
 */
const internalServiceValidator = (allowedServices) => {
  return zeroTrust({
    validateInternalCalls: true,
    requireSignatures: true,
    allowedServices,
    requiredHeaders: ['X-Internal-Service', 'X-Service-Signature']
  });
};

module.exports = {
  zeroTrust,
  strictZeroTrust,
  internalServiceValidator
};