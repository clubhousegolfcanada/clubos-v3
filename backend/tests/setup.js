// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/clubos_test';
process.env.OPENAI_API_KEY = 'test-api-key';

// Global test utilities
global.testHelpers = {
  // Generate test JWT token
  generateToken: (userId = 1) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  },
  
  // Create test user object
  createTestUser: (overrides = {}) => ({
    id: 1,
    username: 'testuser',
    email: 'test@clubos.com',
    role: 'admin',
    isActive: true,
    ...overrides
  }),
  
  // Create test message object
  createTestMessage: (overrides = {}) => ({
    id: 1,
    threadId: 1,
    content: 'Test message content',
    senderType: 'customer',
    intent: 'support_request',
    confidence: 0.95,
    ...overrides
  }),
  
  // Create test SOP object
  createTestSOP: (overrides = {}) => ({
    id: 1,
    title: 'Test SOP',
    triggerKeywords: ['test', 'demo'],
    responseTemplate: 'Test response template',
    requiresAction: false,
    isActive: true,
    ...overrides
  })
};

// Mock console methods in test environment
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress expected error logs in tests
  if (args[0]?.includes?.('Expected error')) return;
  originalConsoleError(...args);
};

// Clean up after all tests
afterAll(async () => {
  // Close database connections
  const { pool } = require('../src/config/database');
  if (pool) {
    await pool.end();
  }
});