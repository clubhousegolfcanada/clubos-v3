const Bull = require('bull');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const logger = require('../../utils/logger');

class QueueManager {
  constructor() {
    this.queues = new Map();
    this.serverAdapter = new ExpressAdapter();
    this.serverAdapter.setBasePath('/admin/queues');
    this.boardAdapters = [];
  }

  initialize() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    // Create queues
    this.createQueue('pattern-processing', {
      redis: redisUrl,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    this.createQueue('action-execution', {
      redis: redisUrl,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 2,
        timeout: 30000
      }
    });

    this.createQueue('notifications', {
      redis: redisUrl,
      defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 50,
        attempts: 3
      }
    });

    this.createQueue('sop-learning', {
      redis: redisUrl,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 10,
        attempts: 1
      }
    });

    // Set up Bull Board for monitoring
    createBullBoard({
      queues: this.boardAdapters,
      serverAdapter: this.serverAdapter
    });

    // Set up processors
    this.setupProcessors();
    
    // Set up error handlers
    this.setupErrorHandlers();

    logger.info('Queue manager initialized', {
      queues: Array.from(this.queues.keys())
    });
  }

  createQueue(name, options) {
    const queue = new Bull(name, options);
    this.queues.set(name, queue);
    this.boardAdapters.push(new BullAdapter(queue));
    return queue;
  }

  setupProcessors() {
    // Pattern Processing Queue
    const patternQueue = this.queues.get('pattern-processing');
    patternQueue.process(async (job) => {
      const timer = logger.time('pattern-processing');
      try {
        const { message, context } = job.data;
        
        // Import pattern engine
        const UnifiedPatternEngine = require('../patterns/UnifiedPatternEngine');
        const result = await UnifiedPatternEngine.processMessage(message, context);
        
        timer.end({ jobId: job.id, confidence: result.confidence });
        return result;
      } catch (error) {
        logger.error('Pattern processing failed', {
          jobId: job.id,
          error: error.message
        });
        throw error;
      }
    });

    // Action Execution Queue
    const actionQueue = this.queues.get('action-execution');
    actionQueue.process(async (job) => {
      const timer = logger.time('action-execution');
      try {
        const { action, params } = job.data;
        
        // Import action framework
        const actionFramework = require('../actionFramework');
        const result = await actionFramework.execute(action, params);
        
        timer.end({ jobId: job.id, action, success: result.success });
        return result;
      } catch (error) {
        logger.error('Action execution failed', {
          jobId: job.id,
          action: job.data.action,
          error: error.message
        });
        throw error;
      }
    });

    // Notifications Queue
    const notificationQueue = this.queues.get('notifications');
    notificationQueue.process(async (job) => {
      const timer = logger.time('notification');
      try {
        const { type, recipient, message, channel } = job.data;
        
        // Import notification service
        const notifications = require('../notifications');
        const result = await notifications.send(type, recipient, message, channel);
        
        timer.end({ jobId: job.id, type, channel });
        return result;
      } catch (error) {
        logger.error('Notification failed', {
          jobId: job.id,
          type: job.data.type,
          error: error.message
        });
        throw error;
      }
    });

    // SOP Learning Queue
    const sopQueue = this.queues.get('sop-learning');
    sopQueue.process(async (job) => {
      const timer = logger.time('sop-learning');
      try {
        const { query, response, confidence, success } = job.data;
        
        // Import recursive learning service
        const recursiveLearning = require('../recursiveLearning');
        await recursiveLearning.learn(query, response, confidence, success);
        
        timer.end({ jobId: job.id });
        return { learned: true };
      } catch (error) {
        logger.error('SOP learning failed', {
          jobId: job.id,
          error: error.message
        });
        // Don't throw - learning failures shouldn't break the system
        return { learned: false, error: error.message };
      }
    });
  }

  setupErrorHandlers() {
    this.queues.forEach((queue, name) => {
      queue.on('error', (error) => {
        logger.error(`Queue error: ${name}`, { error: error.message });
      });

      queue.on('failed', (job, error) => {
        logger.error(`Job failed: ${name}`, {
          jobId: job.id,
          attemptsMade: job.attemptsMade,
          error: error.message
        });
      });

      queue.on('stalled', (job) => {
        logger.warn(`Job stalled: ${name}`, {
          jobId: job.id,
          data: job.data
        });
      });
    });
  }

  // Public methods for adding jobs
  async addPatternJob(message, context, options = {}) {
    const queue = this.queues.get('pattern-processing');
    const job = await queue.add({ message, context }, options);
    logger.debug('Pattern job added', { jobId: job.id });
    return job;
  }

  async addActionJob(action, params, options = {}) {
    const queue = this.queues.get('action-execution');
    const job = await queue.add({ action, params }, options);
    logger.debug('Action job added', { jobId: job.id, action });
    return job;
  }

  async addNotificationJob(type, recipient, message, channel = 'slack', options = {}) {
    const queue = this.queues.get('notifications');
    const job = await queue.add({ type, recipient, message, channel }, options);
    logger.debug('Notification job added', { jobId: job.id, type, channel });
    return job;
  }

  async addLearningJob(query, response, confidence, success, options = {}) {
    const queue = this.queues.get('sop-learning');
    const job = await queue.add({ query, response, confidence, success }, options);
    logger.debug('Learning job added', { jobId: job.id });
    return job;
  }

  // Queue statistics
  async getQueueStats() {
    const stats = {};
    
    for (const [name, queue] of this.queues) {
      const counts = await queue.getJobCounts();
      const isPaused = await queue.isPaused();
      
      stats[name] = {
        ...counts,
        paused: isPaused
      };
    }
    
    return stats;
  }

  // Clean up old jobs
  async cleanQueues(grace = 3600000) { // 1 hour default
    const results = {};
    
    for (const [name, queue] of this.queues) {
      try {
        const jobs = await queue.clean(grace, 'completed');
        const failed = await queue.clean(grace, 'failed');
        
        results[name] = {
          completed: jobs.length,
          failed: failed.length
        };
        
        logger.info(`Cleaned queue: ${name}`, results[name]);
      } catch (error) {
        logger.error(`Failed to clean queue: ${name}`, { error: error.message });
      }
    }
    
    return results;
  }

  // Graceful shutdown
  async shutdown() {
    logger.info('Shutting down queue manager...');
    
    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.debug(`Queue closed: ${name}`);
    }
    
    logger.info('Queue manager shutdown complete');
  }

  // Get Express router for Bull Board
  getRouter() {
    return this.serverAdapter.getRouter();
  }
}

module.exports = new QueueManager();