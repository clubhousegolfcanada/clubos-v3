const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const axios = require('axios');
const healthMonitor = require('../services/healthMonitor');

/**
 * Comprehensive health check endpoints
 */

// Basic health check
router.get('/', async (req, res) => {
  const health = await healthMonitor.getBasicHealth();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Detailed health check with all metrics
router.get('/detailed', async (req, res) => {
  const health = await healthMonitor.getDetailedHealth();
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Liveness probe (for k8s)
router.get('/live', async (req, res) => {
  const probe = await healthMonitor.getLivenessProbe();
  res.json(probe);
});

// Readiness probe (for k8s/deployment)
router.get('/ready', async (req, res) => {
  const probe = await healthMonitor.getReadinessProbe();
  const statusCode = probe.ready ? 200 : 503;
  res.status(statusCode).json(probe);
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