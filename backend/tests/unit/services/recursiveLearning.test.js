const recursiveLearning = require('../../../src/services/recursiveLearning');
const db = require('../../../src/db/pool');

// Mock database
jest.mock('../../../src/db/pool');

describe('Recursive Learning Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any in-memory caches
    recursiveLearning.suppressionCounts.clear();
  });

  describe('captureError', () => {
    it('should capture new error and return error ID', async () => {
      const mockError = {
        type: 'TestError',
        code: 'TEST_001',
        message: 'Test error message'
      };
      
      const mockContext = {
        endpoint: '/api/test',
        method: 'POST',
        userId: 123
      };

      // Mock database responses
      db.query.mockResolvedValueOnce({ rows: [] }); // No existing pattern
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert error
      db.query.mockResolvedValueOnce({ rows: [{ error_count: 2 }] }); // Flood check

      const result = await recursiveLearning.captureError(mockError, mockContext);

      expect(result).toMatchObject({
        errorId: 1,
        isNew: true,
        floodDetected: false
      });
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO error_events'),
        expect.any(Array)
      );
    });

    it('should suppress repeated errors within window', async () => {
      const mockError = {
        type: 'TestError',
        code: 'TEST_001',
        message: 'Test error message'
      };
      
      const mockContext = {
        endpoint: '/api/test',
        method: 'POST'
      };

      // First error
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      db.query.mockResolvedValueOnce({ rows: [{ error_count: 1 }] });
      
      await recursiveLearning.captureError(mockError, mockContext);

      // Second error (should be suppressed)
      const result = await recursiveLearning.captureError(mockError, mockContext);

      expect(result).toMatchObject({
        suppressed: true,
        suppressionCount: 1,
        message: 'Error suppressed due to recent occurrence'
      });
    });

    it('should return existing fix if pattern matches', async () => {
      const mockError = {
        type: 'TimeoutError',
        code: 'TIMEOUT',
        message: 'Operation timed out'
      };
      
      const mockPattern = {
        id: 42,
        pattern_logic: {
          fix_class: 'timeout',
          implementation: 'increase_timeout',
          parameters: { timeout: 10000 }
        },
        relevance_score: 0.9
      };

      db.query.mockResolvedValueOnce({ rows: [mockPattern] }); // Find pattern
      db.query.mockResolvedValueOnce({ rows: [] }); // Update usage

      const result = await recursiveLearning.captureError(mockError, {});

      expect(result).toMatchObject({
        hasFix: true,
        pattern: mockPattern,
        fix: mockPattern.pattern_logic,
        confidence: 0.9
      });
    });
  });

  describe('captureFix', () => {
    it('should store new fix pattern', async () => {
      const mockErrorEvent = {
        id: 1,
        error_type: 'ValidationError',
        error_code: 'INVALID_INPUT',
        error_message: 'Missing required field',
        context: { endpoint: '/api/users' }
      };

      const fixLogic = {
        implementation: 'add_validation',
        parameters: { requiredFields: ['email', 'name'] }
      };

      const classification = {
        type: 'validation',
        reusability: 'universal',
        module: 'users',
        symptom: 'Missing required fields'
      };

      // Mock getting error event
      db.query.mockResolvedValueOnce({ rows: [mockErrorEvent] });
      
      // Mock storing pattern
      db.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 100,
          error_signature: 'test-signature',
          fix_class: 'validation'
        }] 
      });
      
      // Mock updating error event
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await recursiveLearning.captureFix(1, fixLogic, classification);

      expect(result).toMatchObject({
        id: 100,
        error_signature: expect.any(String),
        fix_class: 'validation'
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO learning_patterns'),
        expect.any(Array)
      );
    });
  });

  describe('findSimilarFix', () => {
    it('should find and adapt similar fix', async () => {
      const mockError = {
        type: 'APIError',
        code: 'RATE_LIMIT'
      };

      const mockPattern = {
        id: 10,
        error_signature: 'apierror:rate_limit:api::/api/data:get',
        pattern_logic: {
          fix_class: 'rate_limit',
          implementation: 'add_backoff',
          parameters: { backoffMs: 1000 }
        },
        trigger_conditions: { endpoint: '/api/data' },
        reusability: 'conditional',
        relevance_score: 0.85,
        last_seen: new Date()
      };

      // Mock search patterns
      db.query.mockResolvedValueOnce({ rows: [mockPattern] });
      
      // Mock record match
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await recursiveLearning.findSimilarFix(
        mockError,
        { endpoint: '/api/data', module: 'api' }
      );

      expect(result).toMatchObject({
        fix_class: 'rate_limit',
        implementation: 'add_backoff',
        parameters: { backoffMs: 1000 },
        requiresValidation: true,
        originalPattern: 10
      });
    });

    it('should return null if no similar pattern found', async () => {
      const mockError = {
        type: 'UnknownError',
        code: 'UNKNOWN'
      };

      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await recursiveLearning.findSimilarFix(mockError, {});

      expect(result).toBeNull();
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1.0 for exact signature match', () => {
      const current = { signature: 'error:timeout:api::/api/test:post' };
      const stored = { signature: 'error:timeout:api::/api/test:post' };

      const similarity = recursiveLearning.calculateSimilarity(current, stored);

      expect(similarity).toBe(1.0);
    });

    it('should calculate partial similarity for similar signatures', () => {
      const current = { 
        signature: 'error:timeout:api::/api/test:post',
        context: { userId: 123, action: 'create' }
      };
      
      const stored = { 
        signature: 'error:timeout:api::/api/test:get',
        context: { userId: 456, action: 'create' }
      };

      const similarity = recursiveLearning.calculateSimilarity(current, stored);

      expect(similarity).toBeGreaterThan(0.5);
      expect(similarity).toBeLessThan(1.0);
    });
  });

  describe('detectErrorFlood', () => {
    it('should detect error flooding', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ error_count: 10 }] });

      const isFlood = await recursiveLearning.detectErrorFlood('TestError', {});

      expect(isFlood).toBe(true);
    });

    it('should not detect flood for few errors', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ error_count: 3 }] });

      const isFlood = await recursiveLearning.detectErrorFlood('TestError', {});

      expect(isFlood).toBe(false);
    });
  });

  describe('updatePatternOutcome', () => {
    it('should update pattern success and boost relevance', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await recursiveLearning.updatePatternOutcome(1, 100, true);

      expect(db.query).toHaveBeenCalledWith('BEGIN');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE pattern_matches'),
        [true, 100]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('success_count = success_count + 1'),
        [1]
      );
      expect(db.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should decrease relevance on failure', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await recursiveLearning.updatePatternOutcome(1, 100, false);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('relevance_score = GREATEST'),
        [1]
      );
    });
  });
});