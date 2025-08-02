require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const requestLogger = require('./middleware/requestLogger');
const { errorMiddleware } = require('./middleware/errorLogger');
const { securityHeaders, rateLimiters, additionalSecurity } = require('./middleware/security');

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

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
  });
  
  // Close database pool
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
  
  process.exit(0);
});

// Start server
const server = app.listen(config.port, () => {
  console.log('='.repeat(50));
  console.log(`🚀 ClubOS V3 Backend`);
  console.log(`📍 Environment: ${config.env}`);
  console.log(`🔌 Port: ${config.port}`);
  console.log(`🔗 Health: http://localhost:${config.port}/health`);
  console.log('='.repeat(50));
});