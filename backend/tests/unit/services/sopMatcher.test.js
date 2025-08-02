const { findMatchingSOP, checkPrerequisites } = require('../../../src/services/sopMatcher');
const { pool } = require('../../../src/db/pool');

// Mock the database pool
jest.mock('../../../src/db/pool', () => ({
  pool: {
    query: jest.fn(),
    end: jest.fn()
  }
}));

describe('SOP Matcher Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findMatchingSOP', () => {
    it('should return null when no SOPs exist for the intent', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      const result = await findMatchingSOP('support_request', 'I need help');
      
      expect(result).toBeNull();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM sop'),
        ['support_request']
      );
    });

    it('should find SOP with matching trigger phrases', async () => {
      const mockSOP = {
        id: 1,
        title: 'Password Reset',
        category: 'support_request',
        trigger_phrases: ['reset my password please', 'forgot my password and need help'],
        response_template: 'I can help you reset your password...',
        usage_count: 10
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [mockSOP] })
        .mockResolvedValueOnce({ rows: [] }); // For usage update
      
      const result = await findMatchingSOP('support_request', 'I forgot my password and need help');
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.match_confidence).toBeGreaterThanOrEqual(0.5); // Must be above threshold
      expect(result.matched_phrases).toBe(1);
    });

    it('should prioritize SOPs with higher match scores', async () => {
      const mockSOPs = [
        {
          id: 1,
          title: 'General Support',
          trigger_phrases: ['help'],
          usage_count: 5
        },
        {
          id: 2,
          title: 'Password Support',
          trigger_phrases: ['password help with my account', 'reset my password'],
          usage_count: 3
        }
      ];
      
      pool.query
        .mockResolvedValueOnce({ rows: mockSOPs })
        .mockResolvedValueOnce({ rows: [] }); // For usage update
      
      const result = await findMatchingSOP('support_request', 'I need password help with my account');
      
      expect(result.id).toBe(2); // Should match the more specific SOP
      expect(result.matched_phrases).toBe(1);
    });

    it('should handle SOPs without trigger phrases', async () => {
      const mockSOP = {
        id: 1,
        title: 'Default Response',
        category: 'support_request',
        trigger_phrases: null,
        response_template: 'How can I help you?'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockSOP] });
      
      const result = await findMatchingSOP('support_request', 'Random message');
      
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database connection failed'));
      
      const result = await findMatchingSOP('support_request', 'Test message');
      
      expect(result).toBeNull();
    });
  });

  describe('checkPrerequisites', () => {
    it('should return true when no prerequisites exist', async () => {
      const sop = { prerequisites: null };
      const context = {};
      
      const result = await checkPrerequisites(sop, context);
      
      expect(result).toBe(true);
    });

    it('should check booking_active prerequisite', async () => {
      const sop = { prerequisites: ['booking_active'] };
      
      const resultWithBooking = await checkPrerequisites(sop, { booking_id: 123 });
      expect(resultWithBooking).toBe(true);
      
      const resultWithoutBooking = await checkPrerequisites(sop, {});
      expect(resultWithoutBooking).toBe(false);
    });
  });
});