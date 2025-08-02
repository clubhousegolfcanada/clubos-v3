const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const axios = require('axios');

/**
 * Comprehensive health check endpoints
 */

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'clubos-v3-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    version: require('../../package.json').version,
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {}
  };
  
  // Database check
  try {
    const start = Date.now();
    const result = await pool.query('SELECT COUNT(*) FROM sop WHERE active = true');
    checks.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - start,
      activeSops: parseInt(result.rows[0].count)
    };
  } catch (error) {
    checks.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
    checks.status = 'degraded';
  }
  
  // OpenAI check
  if (process.env.OPENAI_API_KEY) {
    try {
      const start = Date.now();
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        timeout: 5000
      });
      checks.checks.openai = {
        status: 'healthy',
        responseTime: Date.now() - start,
        available: response.status === 200
      };
    } catch (error) {
      checks.checks.openai = {
        status: 'unhealthy',
        error: error.message
      };
      checks.status = 'degraded';
    }
  }
  
  // Slack webhook check (optional)
  if (process.env.SLACK_WEBHOOK_URL) {
    checks.checks.slack = {
      status: 'configured',
      webhook: 'present'
    };
  }
  
  // Check recent errors
  try {
    const errorResult = await pool.query(
      `SELECT COUNT(*) as error_count 
       FROM action_log 
       WHERE outcome = 'failed' 
       AND timestamp > NOW() - INTERVAL '1 hour'`
    );
    checks.checks.recentErrors = {
      lastHour: parseInt(errorResult.rows[0].error_count)
    };
  } catch (error) {
    // Table might not exist yet
    checks.checks.recentErrors = {
      status: 'unknown'
    };
  }
  
  // Overall status
  const statusCode = checks.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(checks);
});

// Database-specific health check
router.get('/database', async (req, res) => {
  try {
    // Test basic connectivity
    await pool.query('SELECT 1');
    
    // Get table stats
    const tables = ['thread', 'sop', 'action_log', 'ticket', 'input_event'];
    const stats = {};
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        stats[table] = parseInt(result.rows[0].count);
      } catch (error) {
        stats[table] = 'not found';
      }
    }
    
    // Check connection pool
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tables: stats,
      pool: poolStats
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Service dependencies check
router.get('/dependencies', async (req, res) => {
  const dependencies = {
    timestamp: new Date().toISOString(),
    services: {}
  };
  
  // Check each dependency
  const checks = [
    {
      name: 'postgresql',
      check: async () => {
        await pool.query('SELECT 1');
        return { status: 'connected' };
      }
    },
    {
      name: 'openai',
      check: async () => {
        if (!process.env.OPENAI_API_KEY) {
          return { status: 'not configured' };
        }
        const response = await axios.head('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
          timeout: 3000
        });
        return { status: 'available', responseCode: response.status };
      }
    },
    {
      name: 'slack',
      check: async () => {
        if (!process.env.SLACK_WEBHOOK_URL) {
          return { status: 'not configured' };
        }
        return { status: 'configured' };
      }
    }
  ];
  
  // Run all checks
  for (const { name, check } of checks) {
    try {
      dependencies.services[name] = await check();
    } catch (error) {
      dependencies.services[name] = {
        status: 'error',
        message: error.message
      };
    }
  }
  
  // Determine overall status
  const hasErrors = Object.values(dependencies.services).some(
    service => service.status === 'error'
  );
  
  res.status(hasErrors ? 503 : 200).json(dependencies);
});

// Readiness check (for k8s/deployment)
router.get('/ready', async (req, res) => {
  try {
    // Check database is accessible
    await pool.query('SELECT 1');
    
    // Check required env vars
    const required = ['DATABASE_URL', 'JWT_SECRET', 'OPENAI_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      return res.status(503).json({
        ready: false,
        reason: 'Missing required environment variables',
        missing
      });
    }
    
    res.json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      reason: 'Database not accessible',
      error: error.message
    });
  }
});

module.exports = router;