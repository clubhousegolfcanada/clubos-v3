const os = require('os');
const logger = require('../../utils/logger');
const db = require('../../db/pool');

class PerformanceGuard {
  constructor(options = {}) {
    this.config = {
      cpuThreshold: options.cpuThreshold || 80, // percentage
      memoryThreshold: options.memoryThreshold || 85, // percentage
      memoryLimitMB: options.memoryLimitMB || 1024, // absolute limit
      responseTimeThreshold: options.responseTimeThreshold || 5000, // ms
      checkInterval: options.checkInterval || 5000, // ms
      enableAutoScaling: options.enableAutoScaling !== false,
      enableCircuitBreaker: options.enableCircuitBreaker !== false,
      circuitBreakerThreshold: options.circuitBreakerThreshold || 0.5, // 50% failure rate
      circuitBreakerTimeout: options.circuitBreakerTimeout || 60000 // 1 minute
    };
    
    // Performance tracking
    this.metrics = {
      cpu: [],
      memory: [],
      responseTimes: new Map(),
      requestCounts: new Map(),
      errorCounts: new Map()
    };
    
    // Circuit breaker state
    this.circuitBreakers = new Map();
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Middleware to guard against performance issues
   */
  middleware() {
    return async (req, res, next) => {
      const startTime = Date.now();
      const requestId = req.id || `${Date.now()}-${Math.random()}`;
      
      // Check system health before processing
      const healthCheck = await this.checkSystemHealth();
      if (!healthCheck.healthy) {
        return this.handleUnhealthySystem(req, res, healthCheck);
      }
      
      // Check circuit breaker for endpoint
      if (this.config.enableCircuitBreaker) {
        const circuitOpen = this.isCircuitOpen(req.path);
        if (circuitOpen) {
          return this.handleCircuitOpen(req, res);
        }
      }
      
      // Set request timeout
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          logger.warn('Request timeout', {
            path: req.path,
            duration: Date.now() - startTime
          });
          res.status(408).json({
            error: 'Request timeout',
            message: 'The request took too long to process'
          });
        }
      }, this.config.responseTimeThreshold);
      
      // Track request
      this.trackRequest(req.path, requestId, startTime);
      
      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = (...args) => {
        clearTimeout(timeout);
        
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Track response metrics
        this.trackResponse(req.path, requestId, duration, statusCode);
        
        // Check for performance anomalies
        this.checkPerformanceAnomalies(req.path, duration);
        
        // Call original end
        originalEnd.apply(res, args);
      };
      
      // Continue with request
      next();
    };
  }

  /**
   * Check overall system health
   */
  async checkSystemHealth() {
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    
    // Update metrics history
    this.updateMetrics('cpu', cpuUsage.percentage);
    this.updateMetrics('memory', memoryUsage.percentage);
    
    // Log metrics to database
    await this.logPerformanceMetrics({
      cpu: cpuUsage,
      memory: memoryUsage
    });
    
    // Determine health status
    const issues = [];
    
    if (cpuUsage.percentage > this.config.cpuThreshold) {
      issues.push({
        type: 'cpu',
        message: `CPU usage at ${cpuUsage.percentage}%`,
        severity: cpuUsage.percentage > 90 ? 'critical' : 'high'
      });
    }
    
    if (memoryUsage.percentage > this.config.memoryThreshold) {
      issues.push({
        type: 'memory',
        message: `Memory usage at ${memoryUsage.percentage}%`,
        severity: memoryUsage.percentage > 95 ? 'critical' : 'high'
      });
    }
    
    if (memoryUsage.usedMB > this.config.memoryLimitMB) {
      issues.push({
        type: 'memory_limit',
        message: `Memory usage exceeds limit: ${memoryUsage.usedMB}MB > ${this.config.memoryLimitMB}MB`,
        severity: 'critical'
      });
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      metrics: {
        cpu: cpuUsage,
        memory: memoryUsage
      }
    };
  }

  /**
   * Get CPU usage
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();
      
      setTimeout(() => {
        const endTime = process.hrtime(startTime);
        const endUsage = process.cpuUsage(startUsage);
        
        const totalTime = endTime[0] * 1e6 + endTime[1] / 1e3; // microseconds
        const totalUsage = endUsage.user + endUsage.system;
        
        const percentage = Math.round((totalUsage / totalTime) * 100);
        
        resolve({
          percentage,
          user: endUsage.user,
          system: endUsage.system,
          cores: os.cpus().length
        });
      }, 100);
    });
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    const used = process.memoryUsage();
    const total = os.totalmem();
    const free = os.freemem();
    const processMemory = used.heapUsed + used.external;
    
    return {
      percentage: Math.round(((total - free) / total) * 100),
      usedMB: Math.round(processMemory / 1024 / 1024),
      totalMB: Math.round(total / 1024 / 1024),
      freeMB: Math.round(free / 1024 / 1024),
      heapUsedMB: Math.round(used.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(used.heapTotal / 1024 / 1024)
    };
  }

  /**
   * Handle unhealthy system
   */
  handleUnhealthySystem(req, res, healthCheck) {
    const criticalIssue = healthCheck.issues.find(i => i.severity === 'critical');
    
    if (criticalIssue) {
      logger.error('Critical system health issue', {
        issue: criticalIssue,
        metrics: healthCheck.metrics
      });
      
      // Enable emergency mode
      if (this.config.enableAutoScaling) {
        this.triggerAutoScaling(criticalIssue);
      }
      
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'System is under high load',
        retryAfter: 30
      });
    }
    
    // For non-critical issues, allow request but log warning
    logger.warn('System health issues detected', {
      issues: healthCheck.issues,
      metrics: healthCheck.metrics
    });
    
    // Add warning header
    res.setHeader('X-System-Health', 'degraded');
  }

  /**
   * Circuit breaker implementation
   */
  isCircuitOpen(endpoint) {
    const breaker = this.circuitBreakers.get(endpoint);
    if (!breaker) return false;
    
    if (breaker.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - breaker.openedAt > this.config.circuitBreakerTimeout) {
        // Move to half-open state
        breaker.state = 'half-open';
        breaker.halfOpenRequests = 0;
      } else {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Handle circuit open
   */
  handleCircuitOpen(req, res) {
    logger.warn('Circuit breaker open', {
      endpoint: req.path,
      method: req.method
    });
    
    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'This endpoint is experiencing issues',
      retryAfter: Math.ceil(this.config.circuitBreakerTimeout / 1000)
    });
  }

  /**
   * Track request
   */
  trackRequest(endpoint, requestId, startTime) {
    if (!this.metrics.requestCounts.has(endpoint)) {
      this.metrics.requestCounts.set(endpoint, new Map());
    }
    
    const requests = this.metrics.requestCounts.get(endpoint);
    requests.set(requestId, { startTime });
    
    // Clean old entries
    if (requests.size > 1000) {
      const oldestKey = requests.keys().next().value;
      requests.delete(oldestKey);
    }
  }

  /**
   * Track response
   */
  trackResponse(endpoint, requestId, duration, statusCode) {
    // Update response times
    if (!this.metrics.responseTimes.has(endpoint)) {
      this.metrics.responseTimes.set(endpoint, []);
    }
    
    const times = this.metrics.responseTimes.get(endpoint);
    times.push({
      duration,
      timestamp: Date.now(),
      statusCode
    });
    
    // Keep only recent data (last 5 minutes)
    const cutoff = Date.now() - 300000;
    this.metrics.responseTimes.set(
      endpoint,
      times.filter(t => t.timestamp > cutoff)
    );
    
    // Track errors
    if (statusCode >= 500) {
      if (!this.metrics.errorCounts.has(endpoint)) {
        this.metrics.errorCounts.set(endpoint, 0);
      }
      this.metrics.errorCounts.set(
        endpoint,
        this.metrics.errorCounts.get(endpoint) + 1
      );
      
      // Update circuit breaker
      this.updateCircuitBreaker(endpoint, false);
    } else {
      // Update circuit breaker for success
      this.updateCircuitBreaker(endpoint, true);
    }
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreaker(endpoint, success) {
    if (!this.config.enableCircuitBreaker) return;
    
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, {
        state: 'closed',
        failures: 0,
        successes: 0,
        totalRequests: 0
      });
    }
    
    const breaker = this.circuitBreakers.get(endpoint);
    breaker.totalRequests++;
    
    if (success) {
      breaker.successes++;
      
      // Reset failures on success in half-open state
      if (breaker.state === 'half-open') {
        breaker.halfOpenRequests++;
        if (breaker.halfOpenRequests >= 5) {
          // Close circuit after successful requests
          breaker.state = 'closed';
          breaker.failures = 0;
          logger.info('Circuit breaker closed', { endpoint });
        }
      }
    } else {
      breaker.failures++;
      
      // Check failure rate
      const failureRate = breaker.failures / breaker.totalRequests;
      
      if (failureRate >= this.config.circuitBreakerThreshold && 
          breaker.totalRequests >= 10) {
        if (breaker.state !== 'open') {
          breaker.state = 'open';
          breaker.openedAt = Date.now();
          logger.error('Circuit breaker opened', {
            endpoint,
            failureRate,
            failures: breaker.failures
          });
        }
      }
    }
    
    // Reset counters periodically
    if (breaker.totalRequests > 100) {
      breaker.failures = Math.floor(breaker.failures / 2);
      breaker.successes = Math.floor(breaker.successes / 2);
      breaker.totalRequests = Math.floor(breaker.totalRequests / 2);
    }
  }

  /**
   * Check for performance anomalies
   */
  checkPerformanceAnomalies(endpoint, duration) {
    const times = this.metrics.responseTimes.get(endpoint) || [];
    if (times.length < 10) return;
    
    // Calculate statistics
    const durations = times.map(t => t.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const stdDev = Math.sqrt(
      durations.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / durations.length
    );
    
    // Check if current request is anomalous
    if (duration > avg + (stdDev * 3)) {
      logger.warn('Performance anomaly detected', {
        endpoint,
        duration,
        average: Math.round(avg),
        stdDev: Math.round(stdDev)
      });
      
      // Log to database
      this.logPerformanceAnomaly({
        endpoint,
        duration,
        average: avg,
        stdDev,
        threshold: avg + (stdDev * 3)
      });
    }
  }

  /**
   * Update metrics history
   */
  updateMetrics(type, value) {
    const metrics = this.metrics[type];
    metrics.push({
      value,
      timestamp: Date.now()
    });
    
    // Keep only last hour
    const cutoff = Date.now() - 3600000;
    this.metrics[type] = metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Log performance metrics to database
   */
  async logPerformanceMetrics(metrics) {
    try {
      const query = `
        INSERT INTO performance_metrics (
          metric_type, value, unit, threshold_value,
          window_start, window_end, server_id
        ) VALUES 
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14)
      `;
      
      const now = new Date();
      const windowStart = new Date(now - this.config.checkInterval);
      
      await db.query(query, [
        // CPU metric
        'cpu', metrics.cpu.percentage, 'percentage', this.config.cpuThreshold,
        windowStart, now, os.hostname(),
        // Memory metric
        'memory', metrics.memory.percentage, 'percentage', this.config.memoryThreshold,
        windowStart, now, os.hostname()
      ]);
    } catch (error) {
      logger.error('Error logging performance metrics', error);
    }
  }

  /**
   * Log performance anomaly
   */
  async logPerformanceAnomaly(anomaly) {
    try {
      const query = `
        INSERT INTO performance_metrics (
          metric_type, endpoint, value, unit, 
          threshold_value, is_anomaly, window_start, window_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      await db.query(query, [
        'response_time',
        anomaly.endpoint,
        anomaly.duration,
        'ms',
        anomaly.threshold,
        true,
        new Date(Date.now() - anomaly.duration),
        new Date()
      ]);
    } catch (error) {
      logger.error('Error logging performance anomaly', error);
    }
  }

  /**
   * Trigger auto-scaling
   */
  triggerAutoScaling(issue) {
    logger.info('Triggering auto-scaling', { issue });
    
    // In production, this would:
    // - Signal orchestrator to scale up
    // - Adjust load balancer
    // - Notify operations team
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    setInterval(async () => {
      const health = await this.checkSystemHealth();
      
      // Log health status
      if (!health.healthy) {
        logger.warn('System health check failed', {
          issues: health.issues,
          metrics: health.metrics
        });
      }
      
      // Clean up old circuit breakers
      for (const [endpoint, breaker] of this.circuitBreakers.entries()) {
        if (breaker.totalRequests === 0 && 
            Date.now() - (breaker.openedAt || 0) > 3600000) {
          this.circuitBreakers.delete(endpoint);
        }
      }
    }, this.config.checkInterval);
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    const endpointMetrics = {};
    
    for (const [endpoint, times] of this.metrics.responseTimes.entries()) {
      const durations = times.map(t => t.duration);
      if (durations.length > 0) {
        endpointMetrics[endpoint] = {
          avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
          min: Math.min(...durations),
          max: Math.max(...durations),
          count: durations.length,
          errors: this.metrics.errorCounts.get(endpoint) || 0
        };
      }
    }
    
    return {
      system: {
        cpu: this.metrics.cpu[this.metrics.cpu.length - 1]?.value || 0,
        memory: this.metrics.memory[this.metrics.memory.length - 1]?.value || 0
      },
      endpoints: endpointMetrics,
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([k, v]) => [k, v.state])
      )
    };
  }
}

module.exports = new PerformanceGuard();