const pool = require('../db/pool');
const redisClient = require('./cache/redisClient');
const cacheService = require('./cache/cacheService');
const logger = require('../utils/logger');
const os = require('os');

class HealthMonitor {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.lastError = null;
    this.serviceChecks = new Map();
  }

  incrementRequestCount() {
    this.requestCount++;
  }

  incrementErrorCount(error) {
    this.errorCount++;
    this.lastError = {
      message: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack?.substring(0, 500)
    };
  }

  async checkDatabase() {
    const start = Date.now();
    try {
      const result = await pool.query('SELECT NOW() as time, version() as version');
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime: duration,
        version: result.rows[0].version.split(' ')[1],
        timestamp: result.rows[0].time,
        connections: {
          active: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }

  async checkRedis() {
    const start = Date.now();
    try {
      const status = redisClient.getStatus();
      const stats = await cacheService.getCacheStats();
      
      return {
        status: status.connected ? 'healthy' : 'degraded',
        responseTime: Date.now() - start,
        ...stats
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }

  async checkExternalAPIs() {
    const apis = {
      openai: await this.checkOpenAI(),
      slack: await this.checkSlack()
    };

    const allHealthy = Object.values(apis).every(api => api.status === 'healthy');
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      services: apis
    };
  }

  async checkOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
      return { status: 'not_configured' };
    }

    const start = Date.now();
    try {
      // Simple API key validation
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - start,
        statusCode: response.status
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }

  async checkSlack() {
    if (!process.env.SLACK_WEBHOOK_URL) {
      return { status: 'not_configured' };
    }

    return {
      status: 'healthy',
      configured: true
    };
  }

  async checkPatternEngine() {
    try {
      const UnifiedPatternEngine = require('./patterns/UnifiedPatternEngine');
      const stats = UnifiedPatternEngine.getStatistics ? 
        UnifiedPatternEngine.getStatistics() : 
        { status: 'not_implemented' };
      
      return {
        status: 'healthy',
        ...stats
      };
    } catch (error) {
      return {
        status: 'degraded',
        error: 'Pattern engine not available'
      };
    }
  }

  getSystemMetrics() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();
    
    return {
      uptime: {
        seconds: uptime,
        formatted: this.formatUptime(uptime)
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      cpu: {
        usage: process.cpuUsage(),
        cores: os.cpus().length,
        model: os.cpus()[0].model
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
        loadAverage: os.loadavg()
      },
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate: this.requestCount > 0 ? 
          ((this.errorCount / this.requestCount) * 100).toFixed(2) + '%' : '0%',
        lastError: this.lastError
      }
    };
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    
    return parts.join(' ');
  }

  async getBasicHealth() {
    const dbHealth = await this.checkDatabase();
    const isHealthy = dbHealth.status === 'healthy';
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: this.formatUptime(Math.floor((Date.now() - this.startTime) / 1000)),
      version: process.env.npm_package_version || '0.7.0'
    };
  }

  async getDetailedHealth() {
    const [database, redis, apis, patterns] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs(),
      this.checkPatternEngine()
    ]);

    const metrics = this.getSystemMetrics();
    
    // Determine overall status
    let overallStatus = 'healthy';
    if (database.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (redis.status === 'unhealthy' || apis.status === 'degraded') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.7.0',
      services: {
        database,
        redis,
        apis,
        patterns
      },
      metrics
    };
  }

  async getLivenessProbe() {
    // Simple check - is the process alive?
    return {
      status: 'alive',
      timestamp: new Date().toISOString()
    };
  }

  async getReadinessProbe() {
    // Check if we're ready to serve traffic
    const dbHealth = await this.checkDatabase();
    const isReady = dbHealth.status === 'healthy';
    
    return {
      ready: isReady,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealth.status === 'healthy'
      }
    };
  }
}

module.exports = new HealthMonitor();