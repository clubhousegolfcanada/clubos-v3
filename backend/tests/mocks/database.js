// Mock database pool for testing
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn()
};

// Mock query builder
const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  execute: jest.fn()
};

// Common mock responses
const mockResponses = {
  // User responses
  user: {
    id: 1,
    username: 'testuser',
    email: 'test@clubos.com',
    role: 'admin',
    is_active: true,
    created_at: new Date()
  },
  
  // Thread responses
  thread: {
    id: 1,
    customer_id: 123,
    booking_id: null,
    intent: 'tech_issue',
    confidence_score: 0.85,
    status: 'pending',
    created_at: new Date()
  },
  
  // Message responses
  message: {
    id: 1,
    thread_id: 1,
    sender_type: 'customer',
    sender_id: 123,
    content: 'Test message',
    created_at: new Date()
  },
  
  // SOP responses
  sop: {
    id: 1,
    title: 'Test SOP',
    category: 'tech_issue',
    trigger_phrases: ['test', 'demo'],
    response_template: 'Test response',
    requires_action: false,
    action_type: null,
    action_config: null,
    version: 1,
    status: 'live',
    active: true,
    usage_count: 0,
    created_at: new Date()
  },
  
  // Action responses
  action: {
    id: 1,
    thread_id: 1,
    action_type: 'email',
    payload: { to: 'test@example.com', subject: 'Test' },
    status: 'pending',
    retry_count: 0,
    created_at: new Date()
  }
};

// Helper to reset all mocks
const resetMocks = () => {
  mockPool.query.mockReset();
  mockPool.connect.mockReset();
  mockPool.end.mockReset();
  Object.values(mockQueryBuilder).forEach(fn => {
    if (typeof fn.mockReset === 'function') {
      fn.mockReset();
    }
  });
};

module.exports = {
  mockPool,
  mockQueryBuilder,
  mockResponses,
  resetMocks
};