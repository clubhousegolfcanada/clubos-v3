# Decision Memory Alignment Plan

**Purpose**: Align ClubOS V3 with the Decision Memory System architecture  
**Core Principle**: Never make the same decision twice  
**Status**: Planning Document  

---

## 🎯 Executive Summary

The new architecture introduces a fundamental shift from "SOP-driven automation" to a "Decision Memory System." This document outlines how to evolve our current V3 implementation to embrace this vision while maintaining what works.

---

## 🔄 Key Philosophy Shift

### From: Automated SOP Execution
```
Event → Classify → Match SOP → Execute Automatically
```

### To: Decision Memory with Human Approval
```
Event → Find Similar Past Events → Suggest Previous Solution → Human Approves → Execute → Remember Decision
```

---

## 📋 Implementation Phases

### Phase 1: Add Decision Memory Layer (2 weeks)

#### Database Schema
```sql
-- Store every human decision with full context
CREATE TABLE decision_memory (
  id SERIAL PRIMARY KEY,
  event_id UUID,
  event_type VARCHAR(255),
  event_description TEXT,
  event_context JSONB, -- Full context: customer, equipment, time, etc.
  
  -- Human decision details
  human_decision TEXT NOT NULL,
  human_reasoning TEXT,
  approved_by INTEGER REFERENCES users(id),
  
  -- Execution details
  action_taken JSONB,
  outcome VARCHAR(50), -- success, partial, failed
  outcome_details TEXT,
  
  -- Learning metadata
  confidence_score FLOAT DEFAULT 0.5,
  times_reused INTEGER DEFAULT 0,
  pattern_signature VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for similarity searches
CREATE INDEX idx_decision_event_type ON decision_memory(event_type);
CREATE INDEX idx_decision_pattern ON decision_memory(pattern_signature);
CREATE INDEX idx_decision_context ON decision_memory USING GIN(event_context);
```

#### Service Implementation
```javascript
// services/decisionMemory.js
class DecisionMemoryService {
  // Store a new decision
  async storeDecision(event, decision, outcome) {
    const pattern = await this.generatePattern(event);
    return await db.query(
      `INSERT INTO decision_memory 
       (event_type, event_description, event_context, human_decision, 
        human_reasoning, approved_by, action_taken, outcome, pattern_signature)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [event.type, event.description, event.context, decision.action,
       decision.reasoning, decision.approvedBy, decision.actionDetails,
       outcome.status, pattern]
    );
  }

  // Find similar past decisions
  async findSimilarDecisions(event, limit = 5) {
    // Start with exact type matches
    const exactMatches = await db.query(
      `SELECT * FROM decision_memory 
       WHERE event_type = $1 
       ORDER BY confidence_score DESC, created_at DESC 
       LIMIT $2`,
      [event.type, limit]
    );

    // If not enough, expand to pattern matching
    if (exactMatches.rows.length < limit) {
      const pattern = await this.generatePattern(event);
      const patternMatches = await db.query(
        `SELECT * FROM decision_memory 
         WHERE pattern_signature = $1 
         AND event_type != $2
         ORDER BY confidence_score DESC 
         LIMIT $3`,
        [pattern, event.type, limit - exactMatches.rows.length]
      );
      exactMatches.rows.push(...patternMatches.rows);
    }

    return exactMatches.rows;
  }

  // Update confidence based on outcome
  async updateConfidence(decisionId, wasSuccessful) {
    const adjustment = wasSuccessful ? 0.1 : -0.2;
    await db.query(
      `UPDATE decision_memory 
       SET confidence_score = LEAST(0.95, GREATEST(0.1, confidence_score + $1)),
           times_reused = times_reused + 1,
           updated_at = NOW()
       WHERE id = $2`,
      [adjustment, decisionId]
    );
  }
}
```

### Phase 2: Add Human Approval Workflow (2 weeks)

#### Modify Action Execution Flow
```javascript
// services/enhancedActionExecutor.js
class EnhancedActionExecutor {
  async suggestAction(message, intent, sop) {
    // First, check decision memory
    const similarDecisions = await decisionMemory.findSimilarDecisions({
      type: intent.category,
      description: message.content,
      context: {
        customerId: message.customer_id,
        threadId: message.thread_id,
        location: message.location,
        timestamp: new Date()
      }
    });

    if (similarDecisions.length > 0) {
      // Found similar past decision
      const bestMatch = similarDecisions[0];
      return {
        suggested: true,
        action: bestMatch.action_taken,
        reasoning: bestMatch.human_reasoning,
        confidence: bestMatch.confidence_score,
        previousOutcome: bestMatch.outcome,
        requiresApproval: true,
        basedOn: {
          decisionId: bestMatch.id,
          eventDescription: bestMatch.event_description,
          decidedAt: bestMatch.created_at
        }
      };
    }

    // Fall back to SOP suggestion
    if (sop) {
      return {
        suggested: true,
        action: sop.action,
        reasoning: 'Based on SOP: ' + sop.title,
        confidence: 0.5,
        requiresApproval: true,
        basedOn: { sopId: sop.id }
      };
    }

    // No suggestion available
    return {
      suggested: false,
      requiresApproval: true
    };
  }

  async executeWithApproval(suggestion, approval) {
    // Store the decision
    const decision = await decisionMemory.storeDecision(
      suggestion.event,
      {
        action: approval.action || suggestion.action,
        reasoning: approval.reasoning || suggestion.reasoning,
        approvedBy: approval.userId,
        actionDetails: approval.modifications || suggestion.action
      },
      { status: 'pending' }
    );

    // Execute the action
    try {
      const result = await this.execute(approval.action || suggestion.action);
      
      // Update with outcome
      await decisionMemory.updateOutcome(decision.id, {
        status: 'success',
        details: result
      });

      // Update confidence if reusing a decision
      if (suggestion.basedOn?.decisionId) {
        await decisionMemory.updateConfidence(suggestion.basedOn.decisionId, true);
      }

      return result;
    } catch (error) {
      await decisionMemory.updateOutcome(decision.id, {
        status: 'failed',
        details: error.message
      });
      
      if (suggestion.basedOn?.decisionId) {
        await decisionMemory.updateConfidence(suggestion.basedOn.decisionId, false);
      }
      
      throw error;
    }
  }
}
```

#### Add Approval UI Components
```typescript
// frontend/src/components/DecisionApproval.tsx
interface DecisionSuggestion {
  action: string;
  reasoning: string;
  confidence: number;
  previousOutcome?: string;
  basedOn?: {
    decisionId?: number;
    sopId?: number;
    eventDescription?: string;
  };
}

export function DecisionApproval({ suggestion, onApprove, onModify, onReject }) {
  return (
    <div className="decision-approval">
      <h3>Suggested Action</h3>
      <div className="suggestion-details">
        <p><strong>Action:</strong> {suggestion.action}</p>
        <p><strong>Reasoning:</strong> {suggestion.reasoning}</p>
        <p><strong>Confidence:</strong> {(suggestion.confidence * 100).toFixed(0)}%</p>
        
        {suggestion.basedOn?.eventDescription && (
          <div className="based-on">
            <p><strong>Based on similar event:</strong></p>
            <p>{suggestion.basedOn.eventDescription}</p>
            <p><strong>Previous outcome:</strong> {suggestion.previousOutcome}</p>
          </div>
        )}
      </div>
      
      <div className="approval-actions">
        <button onClick={() => onApprove(suggestion)} className="approve">
          Apply Solution
        </button>
        <button onClick={() => onModify(suggestion)} className="modify">
          Modify Solution
        </button>
        <button onClick={() => onReject(suggestion)} className="reject">
          Different Issue
        </button>
      </div>
    </div>
  );
}
```

### Phase 3: Pattern Recognition Enhancement (3 weeks)

#### Pattern Generation
```javascript
// services/patternGenerator.js
class PatternGenerator {
  async generatePattern(event) {
    // Create a pattern signature from event characteristics
    const components = [
      event.type,
      this.extractKeyTerms(event.description),
      this.categorizeTimeContext(event.context.timestamp),
      this.extractLocationContext(event.context.location)
    ].filter(Boolean);
    
    return components.join(':').toLowerCase();
  }

  extractKeyTerms(description) {
    // Extract key technical terms
    const technicalTerms = [
      'trackman', 'reset', 'unlock', 'door', 'booking',
      'cancel', 'reschedule', 'payment', 'scanner'
    ];
    
    const found = technicalTerms.filter(term => 
      description.toLowerCase().includes(term)
    );
    
    return found.sort().join('-') || 'general';
  }

  categorizeTimeContext(timestamp) {
    const hour = new Date(timestamp).getHours();
    if (hour < 9) return 'early';
    if (hour < 17) return 'business';
    if (hour < 21) return 'evening';
    return 'late';
  }

  extractLocationContext(location) {
    return location ? `loc-${location}` : null;
  }
}
```

### Phase 4: Progressive Automation (4 weeks)

#### Confidence-Based Automation
```javascript
// Only after patterns prove highly reliable
class ProgressiveAutomation {
  async shouldAutomate(decision) {
    // Criteria for automation
    return (
      decision.confidence_score >= 0.95 &&
      decision.times_reused >= 10 &&
      decision.failure_rate < 0.05 &&
      decision.last_failure_days_ago > 30
    );
  }

  async suggestAutomation(pattern) {
    const decisions = await db.query(
      `SELECT * FROM decision_memory 
       WHERE pattern_signature = $1 
       AND confidence_score >= 0.95 
       AND times_reused >= 10`,
      [pattern]
    );

    if (decisions.rows.length >= 5) {
      // Pattern is highly consistent
      return {
        pattern,
        suggestAutomate: true,
        confidence: this.calculateAverageConfidence(decisions.rows),
        commonAction: this.extractCommonAction(decisions.rows)
      };
    }

    return { suggestAutomate: false };
  }
}
```

---

## 🔧 Migration Strategy

### 1. Maintain Backward Compatibility
- Keep existing SOP system working
- Decisions create new SOPs automatically
- SOPs seed initial decision memory

### 2. Gradual Rollout
- Start with read-only decision suggestions
- Require approval for all actions initially
- Gradually increase automation for high-confidence patterns

### 3. Data Migration
```sql
-- Convert existing SOPs to decision memory
INSERT INTO decision_memory (
  event_type, 
  event_description, 
  human_decision, 
  action_taken,
  confidence_score,
  pattern_signature
)
SELECT 
  intent_category as event_type,
  title as event_description,
  action_description as human_decision,
  action_config as action_taken,
  0.7 as confidence_score, -- SOPs get moderate initial confidence
  LOWER(intent_category || ':' || keywords[1]) as pattern_signature
FROM sops
WHERE active = true;
```

---

## 📊 Success Metrics

### Phase 1 Metrics
- Number of decisions captured
- Decision reuse rate
- Time saved by suggestions

### Phase 2 Metrics
- Approval rate of suggestions
- Modification rate
- Operator satisfaction

### Phase 3 Metrics
- Pattern match accuracy
- Cross-domain learning rate
- New pattern discovery rate

### Phase 4 Metrics
- Automation confidence levels
- Error reduction rate
- Operator intervention frequency

---

## ⚠️ Risks & Mitigations

### Risk: Operator Resistance
**Mitigation**: 
- Start with suggestions only
- Show time saved metrics
- Allow easy overrides
- Celebrate operator expertise

### Risk: Decision Quality Degradation
**Mitigation**:
- Require reasoning for all decisions
- Track outcome metrics
- Regular decision audits
- Confidence decay over time

### Risk: System Complexity
**Mitigation**:
- Phase implementation carefully
- Keep UI simple
- Clear documentation
- Operator training

---

## 🚀 Next Steps

1. **Review & Approval**: Get stakeholder buy-in on this approach
2. **Phase 1 Start**: Implement decision memory schema and basic capture
3. **Pilot Program**: Test with subset of operators
4. **Iterate**: Refine based on operator feedback
5. **Scale**: Roll out to all operators once proven

---

## 💡 Key Insight

This isn't about replacing human judgment—it's about making every human decision count forever. Each decision teaches the system, reducing repetitive work while maintaining human oversight where it matters.

---

*"Never make the same decision twice" - The heart of ClubOS V3's evolution*