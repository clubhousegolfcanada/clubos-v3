const request = require('supertest');
const express = require('express');

// Mock OpenAI before requiring services
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

// Mock dependencies
jest.mock('../../src/db/pool', () => ({
  pool: {
    query: jest.fn(),
    end: jest.fn()
  }
}));

jest.mock('../../src/services/intentClassifier');
jest.mock('../../src/services/sopMatcher');

const { pool } = require('../../src/db/pool');
const { classifyIntent } = require('../../src/services/intentClassifier');
const { findMatchingSOP } = require('../../src/services/sopMatcher');

// Create test app
const app = express();
app.use(express.json());

// Import routes after mocks
const messageRoutes = require('../../src/routes/messages');
app.use('/api/messages', messageRoutes);

describe('Messages API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/messages', () => {
    it('should create a new message and thread successfully', async () => {
      // Mock intent classification
      classifyIntent.mockResolvedValueOnce({
        intent: 'tech_issue',
        confidence: 0.85
      });

      // Mock database queries
      pool.query
        .mockResolvedValueOnce({ // Thread creation
          rows: [{
            id: 1,
            customer_id: 123,
            intent: 'tech_issue',
            confidence_score: 0.85,
            status: 'pending'
          }]
        })
        .mockResolvedValueOnce({ // Message creation
          rows: [{ id: 1 }]
        })
        .mockResolvedValueOnce({ // Status update
          rows: []
        });

      // Mock SOP matching
      findMatchingSOP.mockResolvedValueOnce({
        id: 1,
        title: 'Tech Support SOP',
        response_template: 'I can help with that...'
      });

      const response = await request(app)
        .post('/api/messages')
        .send({
          customer_id: 123,
          content: 'My TrackMan is not working'
        })
        .expect(200);

      expect(response.body).toHaveProperty('thread');
      expect(response.body.thread.status).toBe('in_progress');
      expect(response.body).toHaveProperty('sop');
      expect(classifyIntent).toHaveBeenCalledWith('My TrackMan is not working');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({
          content: 'Test message'
        })
        .expect(400);

      expect(response.body.error).toBe('customer_id and content are required');
    });

    it('should handle no SOP match by setting status to awaiting_human', async () => {
      classifyIntent.mockResolvedValueOnce({
        intent: 'faq',
        confidence: 0.7
      });

      pool.query
        .mockResolvedValueOnce({ // Thread creation
          rows: [{
            id: 2,
            customer_id: 456,
            intent: 'faq',
            status: 'pending'
          }]
        })
        .mockResolvedValueOnce({ // Message creation
          rows: [{ id: 2 }]
        })
        .mockResolvedValueOnce({ // Status update
          rows: []
        });

      findMatchingSOP.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/messages')
        .send({
          customer_id: 456,
          content: 'What are your hours?'
        })
        .expect(200);

      expect(response.body.thread.status).toBe('awaiting_human');
      expect(response.body.sop).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      classifyIntent.mockResolvedValueOnce({
        intent: 'tech_issue',
        confidence: 0.9
      });

      pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/messages')
        .send({
          customer_id: 789,
          content: 'Help needed'
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle intent classification errors', async () => {
      classifyIntent.mockRejectedValueOnce(new Error('OpenAI API error'));

      const response = await request(app)
        .post('/api/messages')
        .send({
          customer_id: 999,
          content: 'Test message'
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });
});