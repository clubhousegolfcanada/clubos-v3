const logger = require('../utils/logger');
const db = require('../db/pool');

/**
 * Adaptive Rate Limiter
 * Self-adjusting rate limits based on behavior patterns
 */
class AdaptiveRateLimiter {
  constructor(options = {}) {
    this.config = {
      windowMs: options.windowMs || 60000, // 1 minute default
      baseLimit: options.baseLimit || 100,
      minLimit: options.minLimit || 10,
      maxLimit: options.maxLimit || 1000,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      enablePatternLearning: options.enablePatternLearning !== false,
      suspiciousThreshold: options.suspiciousThreshold || 0.7,
      blockDuration: options.blockDuration || 3600000, // 1 hour
      trustProxy: options.trustProxy !== false
    };
    
    // In-memory stores (use Redis in production)
    this.patterns = new Map();
    this.violations = new Map();
    this.blocked = new Map();
    this.trustScores = new Map();
    
    // ML thresholds
    this.anomalyThreshold = 3; // Standard deviations
    this.learningRate = 0.1;
    
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Main middleware function
   */
  middleware() {
    return async (req, res, next) => {
      try {
        const key = this.getKey(req);
        const now = Date.now();
        
        // Check if blocked
        if (this.isBlocked(key, now)) {
          return this.handleBlocked(req, res, key);
        }
        
        // Get or create pattern
        const pattern = this.getOrCreatePattern(key);
        
        // Analyze request
        const analysis = await this.analyzeRequest(req, pattern);
        
        // Check if request should be allowed
        const decision = this.makeDecision(pattern, analysis, now);
        
        if (!decision.allow) {
          return this.handleRateLimit(req, res, key, decision);
        }
        
        // Track successful request
        this.trackRequest(key, pattern, analysis, now);
        
        // Attach rate limit info to request
        req.rateLimit = {
          limit: decision.limit,
          remaining: decision.remaining,
          resetTime: pattern.windowStart + this.config.windowMs,
          trustScore: pattern.trustScore
        };
        
        // Set rate limit headers
        this.setHeaders(res, req.rateLimit);
        
        next();
      } catch (error) {
        logger.error('Error in adaptive rate limiter', error);
        next(); // Don't block on errors
      }
    };
  }

  /**
   * Get key for rate limiting
   */
  getKey(req) {
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    
    const ip = this.config.trustProxy 
      ? req.headers['x-forwarded-for']?.split(',')[0] || req.ip
      : req.ip;
      
    return `ip:${ip}`;
  }

  /**
   * Get or create pattern for key
   */
  getOrCreatePattern(key) {
    if (!this.patterns.has(key)) {
      this.patterns.set(key, {
        requests: [],
        violations: 0,
        trustScore: 0.5,
        adaptiveLimit: this.config.baseLimit,
        windowStart: Date.now(),
        behavior: {
          avgTimeBetweenRequests: null,
          burstiness: 0,
          errorRate: 0,
          uniqueEndpoints: new Set(),
          userAgent: null
        }
      });
    }
    
    return this.patterns.get(key);
  }

  /**
   * Analyze request for suspicious patterns
   */
  async analyzeRequest(req, pattern) {
    const analysis = {
      suspicious: false,
      reasons: [],
      score: 0
    };
    
    // Check request frequency
    const frequency = this.analyzeFrequency(pattern);
    if (frequency.suspicious) {
      analysis.suspicious = true;
      analysis.reasons.push('high_frequency');
      analysis.score += 0.3;
    }
    
    // Check for pattern anomalies
    const anomalies = this.detectAnomalies(req, pattern);
    if (anomalies.length > 0) {
      analysis.suspicious = true;
      analysis.reasons.push(...anomalies);
      analysis.score += anomalies.length * 0.2;
    }
    
    // Check endpoint patterns
    const endpointAnalysis = this.analyzeEndpointPattern(req, pattern);
    if (endpointAnalysis.suspicious) {
      analysis.suspicious = true;
      analysis.reasons.push('endpoint_scanning');
      analysis.score += 0.3;
    }
    
    // Check user agent consistency
    if (pattern.behavior.userAgent && 
        pattern.behavior.userAgent !== req.headers['user-agent']) {
      analysis.suspicious = true;
      analysis.reasons.push('user_agent_change');
      analysis.score += 0.2;
    }
    
    // Check for known attack patterns
    if (await this.checkAttackPatterns(req)) {
      analysis.suspicious = true;
      analysis.reasons.push('attack_pattern');
      analysis.score += 0.5;
    }
    
    // Cap score at 1.0
    analysis.score = Math.min(1.0, analysis.score);
    
    return analysis;
  }

  /**
   * Analyze request frequency
   */
  analyzeFrequency(pattern) {
    const now = Date.now();
    const recentRequests = pattern.requests.filter(r => 
      now - r.timestamp < this.config.windowMs
    );
    
    if (recentRequests.length < 3) {
      return { suspicious: false };
    }
    
    // Calculate time between requests
    const intervals = [];
    for (let i = 1; i < recentRequests.length; i++) {
      intervals.push(recentRequests[i].timestamp - recentRequests[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const minInterval = Math.min(...intervals);
    
    // Suspicious if requests are too fast or too regular
    const tooFast = minInterval < 100; // Less than 100ms between requests
    const tooRegular = intervals.every(i => Math.abs(i - avgInterval) < 50);
    
    return {
      suspicious: tooFast || tooRegular,
      avgInterval,
      minInterval
    };
  }

  /**
   * Detect anomalies in request pattern
   */
  detectAnomalies(req, pattern) {
    const anomalies = [];
    
    // Sudden burst after quiet period
    if (pattern.requests.length > 0) {
      const lastRequest = pattern.requests[pattern.requests.length - 1];
      const timeSinceLastRequest = Date.now() - lastRequest.timestamp;
      
      if (timeSinceLastRequest > 300000 && pattern.requests.length > 10) {
        anomalies.push('burst_after_quiet');
      }
    }
    
    // Request size anomaly
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 1048576) { // 1MB
      anomalies.push('large_request');
    }
    
    // Unusual headers
    const suspiciousHeaders = [
      'x-forwarded-host', 'x-original-url', 'x-rewrite-url',
      'x-originating-ip', 'x-remote-ip', 'x-remote-addr'
    ];
    
    for (const header of suspiciousHeaders) {
      if (req.headers[header]) {
        anomalies.push(`suspicious_header_${header}`);
      }
    }
    
    return anomalies;
  }

  /**
   * Analyze endpoint access patterns
   */
  analyzeEndpointPattern(req, pattern) {
    pattern.behavior.uniqueEndpoints.add(req.path);
    
    // Suspicious if accessing many different endpoints rapidly
    const endpointCount = pattern.behavior.uniqueEndpoints.size;
    const requestCount = pattern.requests.length;
    
    if (requestCount > 20 && endpointCount / requestCount > 0.8) {
      return { suspicious: true, reason: 'endpoint_scanning' };
    }
    
    // Check for sequential endpoint access (e.g., /api/users/1, /api/users/2, ...)
    const paths = Array.from(pattern.behavior.uniqueEndpoints);
    const sequential = this.detectSequentialAccess(paths);
    
    if (sequential) {
      return { suspicious: true, reason: 'sequential_scanning' };
    }
    
    return { suspicious: false };
  }

  /**
   * Detect sequential access patterns
   */
  detectSequentialAccess(paths) {
    if (paths.length < 5) return false;
    
    // Extract numbers from paths
    const numbers = paths.map(path => {
      const match = path.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }).filter(n => n !== null);
    
    if (numbers.length < 5) return false;
    
    // Check if numbers are sequential
    numbers.sort((a, b) => a - b);
    let sequential = true;
    
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] - numbers[i-1] !== 1) {
        sequential = false;
        break;
      }
    }
    
    return sequential;
  }

  /**
   * Check for known attack patterns
   */
  async checkAttackPatterns(req) {
    const path = req.path.toLowerCase();
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    
    // Common attack paths
    const attackPaths = [
      'wp-admin', 'phpmyadmin', '.env', '.git',
      'admin', 'backup', '.sql', 'config'
    ];
    
    if (attackPaths.some(ap => path.includes(ap))) {
      return true;
    }
    
    // Known attack tools
    const attackTools = [
      'sqlmap', 'nikto', 'nmap', 'masscan',
      'burp', 'havij', 'acunetix'
    ];
    
    if (attackTools.some(tool => userAgent.includes(tool))) {
      return true;
    }
    
    return false;
  }

  /**
   * Make decision based on pattern and analysis
   */
  makeDecision(pattern, analysis, now) {
    // Reset window if needed
    if (now - pattern.windowStart > this.config.windowMs) {
      this.resetWindow(pattern, now);
    }
    
    // Calculate adaptive limit based on trust score
    const adaptiveLimit = this.calculateAdaptiveLimit(pattern, analysis);
    
    // Count recent requests
    const recentRequests = pattern.requests.filter(r => 
      now - r.timestamp < this.config.windowMs
    ).length;
    
    // Make decision
    const allow = recentRequests < adaptiveLimit;
    
    // Update trust score
    this.updateTrustScore(pattern, analysis, allow);
    
    return {
      allow,
      limit: adaptiveLimit,
      remaining: Math.max(0, adaptiveLimit - recentRequests),
      reason: allow ? null : this.getRateLimitReason(analysis)
    };
  }

  /**
   * Calculate adaptive limit based on behavior
   */
  calculateAdaptiveLimit(pattern, analysis) {
    let limit = this.config.baseLimit;
    
    // Adjust based on trust score
    const trustMultiplier = 0.5 + (pattern.trustScore * 1.5); // 0.5x to 2x
    limit = Math.round(limit * trustMultiplier);
    
    // Reduce limit if suspicious
    if (analysis.suspicious) {
      const suspicionReduction = 1 - (analysis.score * 0.8); // Up to 80% reduction
      limit = Math.round(limit * suspicionReduction);
    }
    
    // Apply bounds
    limit = Math.max(this.config.minLimit, Math.min(this.config.maxLimit, limit));
    
    // Exponential backoff for repeat violators
    if (pattern.violations > 0) {
      limit = Math.round(limit / Math.pow(2, Math.min(pattern.violations, 4)));
    }
    
    return limit;
  }

  /**
   * Update trust score based on behavior
   */
  updateTrustScore(pattern, analysis, allowed) {
    const delta = allowed ? 0.01 : -0.05;
    const suspicionPenalty = analysis.suspicious ? -0.1 : 0;
    
    pattern.trustScore += (delta + suspicionPenalty) * this.learningRate;
    pattern.trustScore = Math.max(0, Math.min(1, pattern.trustScore));
    
    // Update behavior metrics
    if (pattern.requests.length > 1) {
      const intervals = [];
      for (let i = 1; i < pattern.requests.length; i++) {
        intervals.push(pattern.requests[i].timestamp - pattern.requests[i-1].timestamp);
      }
      pattern.behavior.avgTimeBetweenRequests = 
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }
  }

  /**
   * Track request in pattern
   */
  trackRequest(key, pattern, analysis, timestamp) {
    pattern.requests.push({
      timestamp,
      endpoint: this.currentRequest?.path,
      method: this.currentRequest?.method,
      suspicious: analysis.suspicious
    });
    
    // Keep only recent requests
    const cutoff = timestamp - (this.config.windowMs * 5); // Keep 5 windows
    pattern.requests = pattern.requests.filter(r => r.timestamp > cutoff);
    
    // Update user agent if not set
    if (!pattern.behavior.userAgent && this.currentRequest) {
      pattern.behavior.userAgent = this.currentRequest.headers['user-agent'];
    }
  }

  /**
   * Handle rate limited request
   */
  async handleRateLimit(req, res, key, decision) {
    const pattern = this.patterns.get(key);
    pattern.violations++;
    
    // Log violation
    await this.logViolation(req, key, decision);
    
    // Check if should block
    if (pattern.violations >= 5 || decision.reason === 'attack_pattern') {
      this.blockKey(key);
    }
    
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(this.config.windowMs / 1000),
      reason: decision.reason
    });
  }

  /**
   * Handle blocked request
   */
  handleBlocked(req, res, key) {
    const blockInfo = this.blocked.get(key);
    const remainingTime = Math.ceil((blockInfo.until - Date.now()) / 1000);
    
    res.status(429).json({
      error: 'Temporarily blocked',
      retryAfter: remainingTime,
      reason: 'Repeated violations'
    });
  }

  /**
   * Block a key
   */
  blockKey(key) {
    const until = Date.now() + this.config.blockDuration;
    this.blocked.set(key, {
      until,
      timestamp: Date.now()
    });
    
    logger.warn('Key blocked due to violations', { key, until: new Date(until) });
  }

  /**
   * Check if key is blocked
   */
  isBlocked(key, now) {
    const blockInfo = this.blocked.get(key);
    if (!blockInfo) return false;
    
    if (blockInfo.until > now) {
      return true;
    }
    
    // Remove expired block
    this.blocked.delete(key);
    return false;
  }

  /**
   * Reset window for pattern
   */
  resetWindow(pattern, now) {
    pattern.windowStart = now;
    pattern.requests = pattern.requests.filter(r => 
      now - r.timestamp < this.config.windowMs
    );
    
    // Decay violations
    if (pattern.violations > 0) {
      pattern.violations = Math.max(0, pattern.violations - 1);
    }
  }

  /**
   * Set rate limit headers
   */
  setHeaders(res, rateLimit) {
    res.setHeader('X-RateLimit-Limit', rateLimit.limit);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
    res.setHeader('X-RateLimit-Trust', rateLimit.trustScore.toFixed(2));
  }

  /**
   * Get rate limit reason
   */
  getRateLimitReason(analysis) {
    if (analysis.suspicious) {
      return analysis.reasons[0] || 'suspicious_activity';
    }
    return 'rate_limit_exceeded';
  }

  /**
   * Log violation to database
   */
  async logViolation(req, key, decision) {
    try {
      // Log to security events
      const query = `
        INSERT INTO security_events (
          event_type, severity, source_ip, user_agent,
          endpoint, method, detection_method, detection_rule,
          action_taken
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      await db.query(query, [
        'rate_limit_violation',
        decision.reason === 'attack_pattern' ? 'high' : 'medium',
        req.ip,
        req.headers['user-agent'],
        req.path,
        req.method,
        'adaptive_rate_limiter',
        decision.reason,
        'rate_limited'
      ]);
    } catch (error) {
      logger.error('Error logging violation', error);
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      
      // Clean old patterns
      for (const [key, pattern] of this.patterns.entries()) {
        if (pattern.requests.length === 0 && 
            now - pattern.windowStart > this.config.windowMs * 10) {
          this.patterns.delete(key);
        }
      }
      
      // Clean expired blocks
      for (const [key, blockInfo] of this.blocked.entries()) {
        if (blockInfo.until < now) {
          this.blocked.delete(key);
        }
      }
    }, 60000); // Every minute
  }
}

// Export factory function
module.exports = (options) => {
  const limiter = new AdaptiveRateLimiter(options);
  return limiter.middleware();
};