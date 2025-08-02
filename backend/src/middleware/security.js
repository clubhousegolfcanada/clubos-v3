const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true,
});

// Rate limiting configurations
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to max requests per windowMs
    message: options.message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        error: options.message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000) || 60
      });
    }
  });
};

// Different rate limiters for different endpoints
const rateLimiters = {
  // General API rate limit
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per 15 minutes
  }),
  
  // Stricter limit for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: 'Too many authentication attempts, please try again later.'
  }),
  
  // Message processing endpoint
  messages: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: 'Message rate limit exceeded, please slow down.'
  }),
  
  // SOP creation/update endpoints
  sop: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 SOP operations per hour
    message: 'SOP operation limit reached, please try again later.'
  })
};

// Additional security middleware
const additionalSecurity = (req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Prevent clickjacking
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  
  next();
};

module.exports = {
  securityHeaders,
  rateLimiters,
  additionalSecurity,
  createRateLimiter
};