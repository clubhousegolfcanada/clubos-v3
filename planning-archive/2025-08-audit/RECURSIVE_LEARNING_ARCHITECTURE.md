# 📐 Recursive System Learning Architecture for ClubOS V3

> Design pattern for turning single-point errors into scalable, edge-case-resilient logic—without runtime bloat.

**Integration Date:** August 2, 2025  
**Status:** Architecture Design - Ready for Implementation

---

## 🧠 Core Principle: All Information Is Good

- Repetition ≠ noise. It's *friction potential.*
- Every error, even redundant, holds meta-signal: escalation rate, failure class, response gap.
- The fix is not the end. It's the *first data point* in a compounding loop.

---

## 🔄 Learning Loop (Recursive, Lean, Modular)

### 1. Event Surfaces
- Logged with full context
- Suppression logic applies after 1st instance (with traceability)
- `error_suppressed: true` flag + count preserved

### 2. Immediate Fix Applied
- Root issue patched
- Guardrails added (e.g., debounce, lockout, validation)
- Fix labeled with:
  - `fix_class:` (e.g., overflow, timeout, permissions)
  - `reusability: conditional | universal | never`
  - `edge_case_flag: true | false`

### 3. Claude/LLM Captures the Fix
- Abstracts fix logic to re-usable format
- Annotates system pattern signature:
  - `(symptom + trigger + resolution)`
  - Linked module(s)
  - Suppression policy

### 4. Latent Storage
- Fix logic **not** deployed globally
- Stored in internal pattern index (latent memory layer)
- Only recalled if future error matches signature

### 5. Conditional Reuse
- On similar future event:
  - Retrieve fix pattern
  - Compare trigger + context
  - Reuse, mutate, or fork logic based on proximity match
  - Optionally trigger Claude/LLM review

---

## 🧱 Structural Guardrails

| Mechanism                   | Description                                                             |
|-----------------------------|-------------------------------------------------------------------------|
| `error_suppressed: true`    | Repetition never erased—just logged once, with metadata                 |
| `fix_class`                 | Classifies type of safeguard logic (debounce, reauth, delay, etc.)      |
| `reusability`               | Prevents logic bloat by gating re-deployment                           |
| `edge_case_flag`            | Identifies if the fix only applies to a unique or rare case             |
| Latent Pattern Index        | Stores logic externally until explicitly needed                         |
| Similarity Threshold        | Must meet X% similarity before triggering stored logic                  |
| Relevance Decay             | Auto-downgrades fix if no match within X days                           |

---

## 🧬 Claude Prompt Template (Auto or Manual)

```markdown
### Fix Summary
- Error Type: [e.g. TrackMan Reset Flood]
- Fix Applied: [e.g. 30s cooldown]
- Related Module: [e.g. TechSupport]

### Request
- Classify this fix (debounce? reauth? validation?)
- Generate reusable pattern logic (if applicable)
- Identify other modules with same risk class but no guard
- Annotate edge-case conditions (user-specific? hardware anomaly?)
```

---

## 🔧 ClubOS V3 Integration Plan

### Database Schema Updates

```sql
-- New table for pattern storage
CREATE TABLE learning_patterns (
  id SERIAL PRIMARY KEY,
  error_signature VARCHAR(255) UNIQUE,
  fix_class VARCHAR(50), -- debounce, timeout, validation, etc.
  reusability VARCHAR(20), -- conditional, universal, never
  edge_case_flag BOOLEAN DEFAULT FALSE,
  pattern_logic JSONB, -- Stored fix logic
  module_context VARCHAR(100),
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  match_count INTEGER DEFAULT 1,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Error tracking with suppression
CREATE TABLE error_events (
  id SERIAL PRIMARY KEY,
  error_type VARCHAR(100),
  error_message TEXT,
  context JSONB,
  suppressed BOOLEAN DEFAULT FALSE,
  suppression_count INTEGER DEFAULT 0,
  pattern_id INTEGER REFERENCES learning_patterns(id),
  thread_id INTEGER REFERENCES threads(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_error_signature ON learning_patterns(error_signature);
CREATE INDEX idx_error_type ON error_events(error_type);
CREATE INDEX idx_pattern_relevance ON learning_patterns(relevance_score);
```

### Service Implementation

```javascript
// src/services/recursiveLearning.js
class RecursiveLearningService {
  constructor() {
    this.similarityThreshold = 0.85;
    this.decayDays = 30;
  }

  async captureError(error, context) {
    const signature = this.generateSignature(error, context);
    
    // Check for existing pattern
    const existingPattern = await this.findPattern(signature);
    
    if (existingPattern) {
      await this.updatePattern(existingPattern, error);
      return this.applySuppression(error, existingPattern);
    }
    
    // New error - log and await fix
    return this.logNewError(error, context, signature);
  }

  async captureFix(errorId, fixLogic, classification) {
    const fix = {
      fix_class: classification.type,
      reusability: classification.reusability,
      edge_case_flag: classification.isEdgeCase,
      pattern_logic: fixLogic,
      module_context: classification.module
    };
    
    // Store in latent memory
    await this.storePattern(errorId, fix);
    
    // Trigger Claude analysis if needed
    if (classification.requiresAnalysis) {
      await this.requestClaudeAnalysis(fix);
    }
  }

  async findSimilarFix(error, context) {
    const signature = this.generateSignature(error, context);
    const patterns = await this.searchPatterns(signature);
    
    for (const pattern of patterns) {
      const similarity = this.calculateSimilarity(signature, pattern.error_signature);
      
      if (similarity >= this.similarityThreshold) {
        // Check relevance decay
        if (this.isRelevant(pattern)) {
          return this.adaptPattern(pattern, context);
        }
      }
    }
    
    return null;
  }

  generateSignature(error, context) {
    // Create unique signature from error + context
    return `${error.type}:${error.module}:${JSON.stringify(context)}`;
  }

  calculateSimilarity(sig1, sig2) {
    // Implement similarity algorithm (Levenshtein, cosine, etc.)
    // For now, simple string comparison
    return sig1 === sig2 ? 1.0 : 0.0;
  }

  isRelevant(pattern) {
    const daysSince = (Date.now() - pattern.last_seen) / (1000 * 60 * 60 * 24);
    return daysSince < this.decayDays;
  }
}
```

### Integration Points

```javascript
// In errorLogger.js
const recursiveLearning = require('./services/recursiveLearning');

const enhancedErrorLogger = async (error, req, res, next) => {
  // Existing error logging
  logger.error(error.message, { ...context });
  
  // NEW: Capture for learning
  const learningResult = await recursiveLearning.captureError(error, {
    endpoint: req.path,
    method: req.method,
    userId: req.user?.id,
    threadId: req.body?.threadId
  });
  
  // Check for existing fix
  if (learningResult.hasFix) {
    return res.status(500).json({
      error: 'Known issue - applying fix',
      fixApplied: learningResult.fix
    });
  }
  
  next(error);
};

// In actionExecutor.js
async executeAction(action, context) {
  try {
    // Existing execution logic
    const result = await this.performAction(action, context);
    return result;
  } catch (error) {
    // Check for learned fix
    const fix = await recursiveLearning.findSimilarFix(error, context);
    
    if (fix) {
      logger.info('Applying learned fix', { fix });
      return this.applyFix(fix, action, context);
    }
    
    throw error;
  }
}
```

### Trigger Conditions

1. **Automatic Triggers**
   - Error rate spike (>5 similar errors in 5 minutes)
   - Repeated SOP failures (same SOP fails 3+ times)
   - API timeout patterns
   - Database connection issues

2. **Manual Triggers**
   - Operator flags issue as recurring
   - Post-incident analysis
   - Weekly pattern review

3. **Memory Sync Schedule**
   - Real-time: Error capture and suppression
   - Hourly: Pattern relevance scoring
   - Daily: Decay calculation and cleanup
   - Weekly: Claude analysis of high-value patterns

### Match Thresholds

```javascript
const THRESHOLDS = {
  exact_match: 1.0,      // Same error, same context
  high_confidence: 0.85, // Same error, similar context
  medium_confidence: 0.70, // Similar error, similar context
  low_confidence: 0.50,  // Review needed
  no_match: 0.0         // New pattern
};
```

---

## 🔍 Gap Analysis with Current ClubOS V3

### What's Missing
1. **Error Pattern Storage** - No current mechanism for storing learned fixes
2. **Suppression Logic** - Errors are logged but not intelligently suppressed
3. **Fix Classification** - No taxonomy for types of fixes
4. **Reusability Assessment** - Fixes are one-off, not abstracted

### What Overlaps
1. **Error Logging** - Already comprehensive, just needs enhancement
2. **SOP Outcome Tracking** - Can extend for error patterns
3. **Claude Integration** - Ready for pattern analysis

### Refactoring Needed

1. **Split errorLogger.js**
   ```
   errorLogger.js → 
     - errorCapture.js (logging)
     - errorLearning.js (patterns)
     - errorSuppression.js (dedup)
   ```

2. **Enhance actionExecutor.js**
   - Add fix detection before execution
   - Implement fix application logic
   - Track fix success rates

3. **Create New Services**
   - `recursiveLearning.js` - Core learning engine
   - `patternMatcher.js` - Similarity calculations
   - `fixRegistry.js` - Fix storage and retrieval

---

## 📊 Expected Benefits

1. **Reduced Repeat Errors** - 70% fewer duplicate issues
2. **Faster Resolution** - Known fixes applied in <100ms
3. **Proactive Prevention** - Patterns prevent issues before they occur
4. **Operator Trust** - System learns from their fixes
5. **No Runtime Bloat** - Fixes stored externally until needed

---

## 🚀 Implementation Timeline

### Phase 1: Foundation (Week 1)
- Database schema creation
- Basic error capture enhancement
- Pattern storage service

### Phase 2: Learning Loop (Week 2)
- Fix classification system
- Similarity matching
- Suppression logic

### Phase 3: Integration (Week 3)
- Claude analysis integration
- Operator feedback loop
- Performance optimization

### Phase 4: Monitoring (Week 4)
- Pattern effectiveness dashboard
- Decay and cleanup automation
- Success metrics tracking

---

*This architecture enables ClubOS to evolve from reactive to predictive, learning from every error to prevent future occurrences.*