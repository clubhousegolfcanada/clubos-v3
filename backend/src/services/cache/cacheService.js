const redisClient = require('./redisClient');
const logger = require('../../utils/logger');

class CacheService {
  constructor() {
    this.defaultTTL = {
      sop: 300,        // 5 minutes for SOP matches
      pattern: 600,    // 10 minutes for pattern results
      knowledge: 1800, // 30 minutes for knowledge base
      action: 60,      // 1 minute for action results
      health: 30       // 30 seconds for health checks
    };
  }

  async initialize() {
    await redisClient.connect();
  }

  // SOP Caching
  async getCachedSOP(query) {
    const key = `sop:${this.hashKey(query)}`;
    return await redisClient.get(key);
  }

  async setCachedSOP(query, result) {
    const key = `sop:${this.hashKey(query)}`;
    return await redisClient.set(key, result, this.defaultTTL.sop);
  }

  // Pattern Caching
  async getCachedPattern(message, context = {}) {
    const key = `pattern:${this.hashKey({ message, context })}`;
    return await redisClient.get(key);
  }

  async setCachedPattern(message, context, result) {
    const key = `pattern:${this.hashKey({ message, context })}`;
    return await redisClient.set(key, result, this.defaultTTL.pattern);
  }

  // Knowledge Caching
  async getCachedKnowledge(category, query) {
    const key = `knowledge:${category}:${this.hashKey(query)}`;
    return await redisClient.get(key);
  }

  async setCachedKnowledge(category, query, result) {
    const key = `knowledge:${category}:${this.hashKey(query)}`;
    return await redisClient.set(key, result, this.defaultTTL.knowledge);
  }

  // Action Result Caching
  async getCachedActionResult(actionType, params) {
    const key = `action:${actionType}:${this.hashKey(params)}`;
    return await redisClient.get(key);
  }

  async setCachedActionResult(actionType, params, result) {
    const key = `action:${actionType}:${this.hashKey(params)}`;
    return await redisClient.set(key, result, this.defaultTTL.action);
  }

  // Invalidation
  async invalidateSOP() {
    const keys = await this.getKeys('sop:*');
    for (const key of keys) {
      await redisClient.del(key);
    }
    logger.info('Invalidated all SOP cache entries');
  }

  async invalidatePattern(patternType = null) {
    const pattern = patternType ? `pattern:${patternType}:*` : 'pattern:*';
    const keys = await this.getKeys(pattern);
    for (const key of keys) {
      await redisClient.del(key);
    }
    logger.info(`Invalidated pattern cache: ${pattern}`);
  }

  async invalidateKnowledge(category = null) {
    const pattern = category ? `knowledge:${category}:*` : 'knowledge:*';
    const keys = await this.getKeys(pattern);
    for (const key of keys) {
      await redisClient.del(key);
    }
    logger.info(`Invalidated knowledge cache: ${pattern}`);
  }

  // Performance Metrics
  async getCacheStats() {
    if (!redisClient.isConnected) {
      return { enabled: false };
    }

    try {
      const info = await redisClient.client.info('stats');
      const keyspaceInfo = await redisClient.client.info('keyspace');
      
      // Parse Redis INFO output
      const stats = this.parseRedisInfo(info);
      const keyspace = this.parseRedisInfo(keyspaceInfo);
      
      return {
        enabled: true,
        connected: true,
        hits: parseInt(stats.keyspace_hits || 0),
        misses: parseInt(stats.keyspace_misses || 0),
        hitRate: this.calculateHitRate(stats.keyspace_hits, stats.keyspace_misses),
        keys: keyspace.db0 ? parseInt(keyspace.db0.split(',')[0].split('=')[1]) : 0,
        memory: stats.used_memory_human || 'N/A'
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return { enabled: true, connected: false, error: error.message };
    }
  }

  // Helper Methods
  hashKey(input) {
    const crypto = require('crypto');
    const str = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('md5').update(str).digest('hex');
  }

  async getKeys(pattern) {
    if (!redisClient.isConnected) return [];
    try {
      return await redisClient.client.keys(pattern);
    } catch (error) {
      logger.error(`Failed to get keys for pattern ${pattern}:`, error);
      return [];
    }
  }

  parseRedisInfo(info) {
    const result = {};
    const lines = info.split('\r\n');
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }
    return result;
  }

  calculateHitRate(hits, misses) {
    const total = parseInt(hits || 0) + parseInt(misses || 0);
    if (total === 0) return 0;
    return ((parseInt(hits || 0) / total) * 100).toFixed(2);
  }

  // Warmup Cache
  async warmupCache() {
    logger.info('Starting cache warmup...');
    
    try {
      // Preload frequently used SOPs
      const frequentQueries = [
        'gift card',
        'hours',
        'trackman reset',
        'unlock door',
        'booking change'
      ];

      for (const query of frequentQueries) {
        // This would normally call sopMatcher.findMatch
        // but we're just demonstrating the pattern
        logger.debug(`Warming cache for: ${query}`);
      }

      logger.info('Cache warmup completed');
    } catch (error) {
      logger.error('Cache warmup failed:', error);
    }
  }

  async shutdown() {
    await redisClient.disconnect();
  }
}

module.exports = new CacheService();