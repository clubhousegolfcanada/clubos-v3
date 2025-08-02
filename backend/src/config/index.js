/**
 * Centralized configuration management
 * Separates development and production configs
 */

const path = require('path');

// Load environment variables
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const configs = {
  // Base configuration (shared)
  base: {
    env,
    port: parseInt(process.env.PORT) || 3001,
    apiVersion: 'v3',
    
    // Database
    database: {
      url: process.env.DATABASE_URL,
      pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000
      }
    },
    
    // Authentication
    auth: {
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiry: '24h',
      bcryptRounds: 10
    },
    
    // External services
    services: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 150
      },
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY
      }
    },
    
    // CORS
    cors: {
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id']
    },
    
    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      slowRequestThreshold: 1000
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    }
  },
  
  // Development configuration
  development: {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    },
    
    database: {
      logQueries: true
    },
    
    logging: {
      level: 'debug',
      prettyPrint: true
    },
    
    // Development tools
    debug: true,
    stackTraces: true,
    
    // Mock services in development
    mockServices: {
      ninjaone: true,
      ubiquiti: true,
      openphone: true
    }
  },
  
  // Production configuration
  production: {
    cors: {
      origin: process.env.FRONTEND_URL || 'https://clubos.app',
      credentials: true
    },
    
    database: {
      logQueries: false,
      ssl: {
        rejectUnauthorized: false // For Railway PostgreSQL
      }
    },
    
    logging: {
      level: 'error',
      prettyPrint: false
    },
    
    // Security
    debug: false,
    stackTraces: false,
    
    // Production services
    mockServices: {
      ninjaone: false,
      ubiquiti: false,
      openphone: false
    },
    
    // Monitoring
    monitoring: {
      sentry: process.env.SENTRY_DSN
    }
  },
  
  // Test configuration
  test: {
    database: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/clubos_test'
    },
    
    logging: {
      level: 'error',
      silent: true
    },
    
    auth: {
      jwtSecret: 'test-secret-key'
    },
    
    mockServices: {
      ninjaone: true,
      ubiquiti: true,
      openphone: true,
      openai: true
    }
  }
};

// Merge configurations
function getConfig() {
  const baseConfig = configs.base;
  const envConfig = configs[env] || {};
  
  // Deep merge
  return deepMerge(baseConfig, envConfig);
}

// Deep merge utility
function deepMerge(target, source) {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Validate configuration
function validateConfig(config) {
  const required = [
    'database.url',
    'auth.jwtSecret',
    'services.openai.apiKey'
  ];
  
  const missing = [];
  
  for (const path of required) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], config);
    if (!value) {
      missing.push(path);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
  
  return config;
}

// Export configuration
const config = getConfig();

// Only validate in non-test environments
if (env !== 'test') {
  validateConfig(config);
}

module.exports = config;