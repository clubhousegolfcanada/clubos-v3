require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const requestLogger = require('./middleware/requestLogger');
const { errorMiddleware } = require('./middleware/errorLogger');
const { securityHeaders, rateLimiters, additionalSecurity } = require('./middleware/security');
const logger = require('./utils/logger');
const cacheService = require('./services/cache/cacheService');
const queueManager = require('./services/queue/queueManager');
const healthMonitor = require('./services/healthMonitor');

const app = express();

// Security middleware (should be first)
app.use(securityHeaders);
app.use(additionalSecurity);

// CORS middleware
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// General rate limiting
app.use(rateLimiters.general);

// Request logging (before routes)
app.use(requestLogger.middleware());

// Health checks (no auth required)
app.use('/health', require('./routes/health'));

// API Routes
const apiRouter = express.Router();

// Apply specific rate limiters to sensitive endpoints
apiRouter.use('/messages', rateLimiters.messages, require('./routes/messages'));
apiRouter.use('/threads', require('./routes/threads'));
apiRouter.use('/actions', require('./routes/actions'));
apiRouter.use('/tickets', require('./routes/tickets'));
apiRouter.use('/sops', rateLimiters.sop, require('./routes/sops'));
apiRouter.use('/auth', rateLimiters.auth, require('./routes/auth'));
apiRouter.use('/claude', rateLimiters.sop, require('./routes/claude'));
apiRouter.use('/input-events', require('./routes/inputEvents'));

app.use('/api', apiRouter);

// Admin routes (temporary for setup)
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// Bull Board for queue monitoring (admin only)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_QUEUE_UI === 'true') {
  app.use('/admin/queues', queueManager.getRouter());
}

// Track requests for health monitoring
app.use((req, res, next) => {
  healthMonitor.incrementRequestCount();
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Error handler (must be last)
app.use(errorMiddleware);

// Initialize services
async function initializeServices() {
  try {
    // Initialize cache
    await cacheService.initialize();
    logger.info('Cache service initialized');
    
    // Initialize queue manager
    queueManager.initialize();
    logger.info('Queue manager initialized');
    
    // Warm up cache with common queries
    if (process.env.NODE_ENV === 'production') {
      await cacheService.warmupCache();
    }
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    // Continue anyway - app should work without cache/queues
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Shutdown services
  try {
    await queueManager.shutdown();
    await cacheService.shutdown();
    logger.info('Services shutdown complete');
  } catch (error) {
    logger.error('Error during service shutdown:', error);
  }
  
  // Close database pool
  try {
    const { pool } = require('./db/pool');
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool:', error);
  }
  
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  healthMonitor.incrementErrorCount(error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  healthMonitor.incrementErrorCount(new Error(String(reason)));
});

// Start server
const server = app.listen(config.port, async () => {
  logger.info('='.repeat(50));
  logger.info('🚀 ClubOS V3 Backend Starting...');
  logger.info(`📍 Environment: ${config.env}`);
  logger.info(`🔌 Port: ${config.port}`);
  logger.info(`🔗 Health: http://localhost:${config.port}/health`);
  logger.info(`📊 Queue UI: http://localhost:${config.port}/admin/queues`);
  
  // Initialize services after server starts
  await initializeServices();
  
  logger.info('✅ Server ready to accept requests');
  logger.info('='.repeat(50));
});