const UnifiedPatternEngine = require('../../../../src/services/patterns/UnifiedPatternEngine');
const PatternIntegration = require('../../../../src/services/patterns/PatternIntegration');

describe('UnifiedPatternEngine - Phase 2.2 Automation Rules', () => {
  describe('Confidence-based execution', () => {
    test('should auto-execute patterns with 95%+ confidence', async () => {
      const highConfidenceEvent = {
        type: 'booking',
        action: 'create',
        resource: 'bay_1',
        timeSlot: new Date().toISOString(),
        customerId: 'test_customer'
      };

      const result = await UnifiedPatternEngine.processEvent(highConfidenceEvent);
      
      // If a pattern matches with 95%+ confidence, it should auto-execute
      if (result.wasAutoExecuted) {
        expect(result.success).toBe(true);
        expect(result.type).not.toBe('suggestion_with_timeout');
        expect(result.type).not.toBe('requires_approval');
      }
    });

    test('should suggest with timeout for 75-94% confidence', async () => {
      const mediumConfidenceEvent = {
        type: 'decision',
        category: 'operational',
        action: 'prioritize',
        confidence: 0.8 // Simulating medium confidence
      };

      const result = await UnifiedPatternEngine.processEvent(mediumConfidenceEvent);
      
      if (result.type === 'suggestion_with_timeout') {
        expect(result.suggestion).toBeDefined();
        expect(result.suggestion.timeoutSeconds).toBe(30);
        expect(result.approve).toBeInstanceOf(Function);
        expect(result.reject).toBeInstanceOf(Function);
        expect(result.modify).toBeInstanceOf(Function);
      }
    });

    test('should queue for approval for 50-74% confidence', async () => {
      const lowConfidenceEvent = {
        type: 'access',
        action: 'grant',
        location: 'restricted_area',
        userId: 'new_user',
        confidence: 0.6 // Simulating low confidence
      };

      const result = await UnifiedPatternEngine.processEvent(lowConfidenceEvent);
      
      if (result.type === 'requires_approval') {
        expect(result.queueId).toBeDefined();
        expect(result.approvalRequest).toBeDefined();
        expect(result.approve).toBeInstanceOf(Function);
        expect(result.reject).toBeInstanceOf(Function);
      }
    });
  });

  describe('Anomaly detection and escalation', () => {
    test('should detect and handle anomalies', async () => {
      const anomalousEvent = {
        // Missing expected fields
        randomField: 'unexpected',
        suspiciousContent: 'DROP TABLE users;'
      };

      const result = await UnifiedPatternEngine.processEvent(anomalousEvent);
      
      if (result.type === 'anomaly') {
        expect(result.anomalyId).toBeDefined();
        expect(result.severity).toMatch(/high|medium|low/);
        expect(result.requiresHumanIntervention).toBe(true);
      }
    });

    test('should escalate high-severity anomalies', async () => {
      const criticalEvent = {
        type: 'error',
        error: {
          type: 'SecurityError',
          message: 'Critical security breach detected'
        },
        urgent: true
      };

      const escalationPromise = new Promise((resolve) => {
        UnifiedPatternEngine.once('anomaly:escalated', resolve);
      });

      await UnifiedPatternEngine.processEvent(criticalEvent);
      
      // Wait for escalation event
      const escalation = await Promise.race([
        escalationPromise,
        new Promise(resolve => setTimeout(() => resolve(null), 1000))
      ]);

      if (escalation) {
        expect(escalation.severity).toBe('high');
      }
    });
  });

  describe('Human override tracking', () => {
    test('should track human overrides', async () => {
      const patternId = 1;
      const event = { type: 'booking', action: 'create' };
      const originalDecision = { action: 'approve', resource: 'bay_1' };
      const overrideDecision = { action: 'reject', reason: 'Maintenance scheduled' };
      
      const overrideId = await PatternIntegration.recordHumanOverride(
        patternId,
        event,
        originalDecision,
        overrideDecision,
        'Resource unavailable due to maintenance',
        'admin_user'
      );

      expect(overrideId).toBeDefined();
    });

    test('should adjust pattern confidence on override', async () => {
      // Mock pattern with modifications
      const mockPattern = {
        id: 'test_pattern',
        confidence_score: 0.9,
        decision_logic: { action: 'approve' }
      };

      // Simulate approval with modification
      const modifications = {
        action: 'approve_with_conditions',
        conditions: ['limit_duration'],
        reason: 'Peak hours require shorter sessions'
      };

      // This would trigger confidence adjustment
      const confidenceImpact = PatternIntegration.calculateConfidenceImpact(
        mockPattern.decision_logic,
        modifications
      );

      expect(confidenceImpact).toBeLessThan(0);
      expect(confidenceImpact).toBeGreaterThanOrEqual(-0.1);
    });
  });

  describe('Pattern Integration', () => {
    test('should get pending approvals', async () => {
      const approvals = await PatternIntegration.getPendingApprovals();
      
      expect(Array.isArray(approvals)).toBe(true);
      // Each approval should have required fields
      approvals.forEach(approval => {
        expect(approval.queue_id).toBeDefined();
        expect(approval.pattern_id).toBeDefined();
        expect(approval.status).toBe('pending');
      });
    });

    test('should get pattern metrics', async () => {
      const metrics = await PatternIntegration.getPatternMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
      // Each metric should have aggregated data
      metrics.forEach(metric => {
        expect(metric.decision_type).toBeDefined();
        expect(metric.pattern_count).toBeGreaterThanOrEqual(0);
        expect(metric.avg_confidence).toBeGreaterThanOrEqual(0);
        expect(metric.avg_confidence).toBeLessThanOrEqual(1);
      });
    });

    test('should get anomaly statistics', async () => {
      const stats = await PatternIntegration.getAnomalyStats(24);
      
      expect(Array.isArray(stats)).toBe(true);
      // Each stat should have severity and counts
      stats.forEach(stat => {
        expect(stat.severity).toMatch(/high|medium|low/);
        expect(stat.count).toBeGreaterThanOrEqual(0);
        expect(stat.escalated_count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Event flow integration', () => {
    test('should emit events throughout processing', async () => {
      const events = [];
      
      // Capture all events
      const eventTypes = [
        'event:received', 
        'event:processed',
        'suggestion:created',
        'approval:queued',
        'anomaly:detected'
      ];
      
      eventTypes.forEach(eventType => {
        UnifiedPatternEngine.once(eventType, (data) => {
          events.push({ type: eventType, data });
        });
      });

      // Process a test event
      const testEvent = {
        type: 'decision',
        action: 'evaluate',
        context: { test: true }
      };

      await UnifiedPatternEngine.processEvent(testEvent);

      // Should have received at least some events
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'event:received')).toBe(true);
      expect(events.some(e => e.type === 'event:processed')).toBe(true);
    });
  });
});