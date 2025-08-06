/**
 * Pattern Automation Demo
 * Demonstrates the confidence-based automation system
 */

const PatternIntegration = require('../src/services/patterns/PatternIntegration');
const logger = require('../src/utils/logger');

async function demonstratePatternAutomation() {
  console.log('\n=== ClubOS V3 Pattern Automation Demo ===\n');

  // Setup event listeners
  PatternIntegration.on('pattern:processed', ({ event, result }) => {
    console.log(`✓ Pattern processed: ${event.type} -> ${result.type}`);
  });

  PatternIntegration.on('suggestion:pending', (suggestion) => {
    console.log(`💡 Suggestion created (${suggestion.confidence * 100}% confidence)`);
    console.log(`   Will auto-execute in ${suggestion.timeoutSeconds} seconds...`);
  });

  PatternIntegration.on('approval:required', (approval) => {
    console.log(`⏸  Approval required (${approval.confidence * 100}% confidence)`);
    console.log(`   Queue ID: ${approval.id}`);
  });

  PatternIntegration.on('anomaly:alert', (anomaly) => {
    console.log(`⚠️  Anomaly detected: ${anomaly.severity} severity`);
    console.log(`   Reason: ${anomaly.reason}`);
  });

  // Example 1: High confidence booking (95%+ auto-executes)
  console.log('\n1. High Confidence Booking (Auto-Execute):');
  const bookingEvent = {
    type: 'booking',
    action: 'create',
    resource: 'bay_1',
    timeSlot: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    duration: 60,
    customerId: 'regular_customer_123',
    context: {
      customerHistory: 'excellent',
      previousBookings: 50,
      noShows: 0
    }
  };

  const bookingResult = await PatternIntegration.processEvent(bookingEvent);
  console.log('Result:', bookingResult.type);

  // Example 2: Medium confidence decision (75% suggest with timeout)
  console.log('\n2. Medium Confidence Decision (Suggest with Timeout):');
  const decisionEvent = {
    type: 'decision',
    category: 'operational',
    action: 'allocate_staff',
    context: {
      dayOfWeek: 'Saturday',
      expectedOccupancy: 'high',
      staffAvailable: 5,
      confidence: 0.8
    }
  };

  const decisionResult = await PatternIntegration.processEvent(decisionEvent);
  console.log('Result:', decisionResult.type);
  
  if (decisionResult.type === 'suggestion') {
    console.log('Suggestion can be:');
    console.log('  - Approved: result.approve()');
    console.log('  - Rejected: result.reject("reason")');
    console.log('  - Modified: result.modify({...changes})');
    
    // Simulate approval
    setTimeout(async () => {
      console.log('\nApproving suggestion...');
      const approved = await decisionResult.approve();
      console.log('Approved:', approved.success);
    }, 2000);
  }

  // Example 3: Low confidence access (50% requires approval)
  console.log('\n3. Low Confidence Access (Requires Approval):');
  const accessEvent = {
    type: 'access',
    action: 'grant',
    location: 'equipment_room',
    userId: 'new_member_456',
    method: 'pin_code',
    context: {
      firstTimeAccess: true,
      membershipDays: 3,
      confidence: 0.6
    }
  };

  const accessResult = await PatternIntegration.processEvent(accessEvent);
  console.log('Result:', accessResult.type);

  // Example 4: Anomaly detection
  console.log('\n4. Anomaly Detection:');
  const anomalousEvent = {
    type: 'unknown',
    suspiciousContent: 'SELECT * FROM users; DROP TABLE bookings;',
    sourceIp: '192.168.1.100',
    timestamp: new Date()
  };

  const anomalyResult = await PatternIntegration.processEvent(anomalousEvent);
  console.log('Result:', anomalyResult.type);
  console.log('Severity:', anomalyResult.severity);
  console.log('Escalated:', anomalyResult.escalated);

  // Example 5: Human override tracking
  console.log('\n5. Human Override Example:');
  const overrideExample = {
    patternId: 1,
    event: { type: 'booking', resource: 'court_1' },
    originalDecision: { action: 'approve', timeSlot: '10:00' },
    overrideDecision: { action: 'modify', timeSlot: '11:00' },
    reason: 'Court maintenance at 10:00'
  };

  const overrideId = await PatternIntegration.recordHumanOverride(
    overrideExample.patternId,
    overrideExample.event,
    overrideExample.originalDecision,
    overrideExample.overrideDecision,
    overrideExample.reason,
    'admin_user'
  );
  console.log('Override recorded with ID:', overrideId);

  // Show metrics
  console.log('\n6. Pattern Metrics:');
  const metrics = await PatternIntegration.getPatternMetrics();
  console.table(metrics);

  // Show pending approvals
  console.log('\n7. Pending Approvals:');
  const approvals = await PatternIntegration.getPendingApprovals();
  console.log(`Total pending: ${approvals.length}`);

  // Show anomaly stats
  console.log('\n8. Anomaly Statistics (last 24h):');
  const anomalyStats = await PatternIntegration.getAnomalyStats(24);
  console.table(anomalyStats);

  console.log('\n=== Demo Complete ===\n');
}

// Run demo
if (require.main === module) {
  demonstratePatternAutomation()
    .then(() => {
      console.log('Demo finished successfully');
      // Give time for async operations to complete
      setTimeout(() => process.exit(0), 5000);
    })
    .catch(error => {
      console.error('Demo error:', error);
      process.exit(1);
    });
}

module.exports = { demonstratePatternAutomation };