# Recursive Learning Integration Guide

## Overview
The Recursive Learning Architecture has been implemented in ClubOS V3. This guide explains how to activate and use it.

## Files Created

### Core Services
1. **`src/services/recursiveLearning.js`** - Main learning engine
2. **`src/services/errorCapture.js`** - Enhanced error capture with context
3. **`src/services/patternMatcher.js`** - Similarity algorithms
4. **`src/services/fixRegistry.js`** - Fix storage and application

### Database
5. **`src/db/migrations/005_recursive_learning_patterns.sql`** - Schema for pattern storage

### Middleware
6. **`src/middleware/enhancedErrorLogger.js`** - Drop-in replacement for errorLogger

### Enhanced Services
7. **`src/services/enhancedActionExecutor.js`** - Action executor with learning

### Tests
8. **`tests/unit/services/recursiveLearning.test.js`** - Unit tests

## Activation Steps

### 1. Run Database Migration
```bash
cd backend
npm run db:migrate
```

### 2. Update Error Middleware in `src/index.js`
```javascript
// OLD:
const { errorMiddleware } = require('./middleware/errorLogger');

// NEW:
const { errorMiddleware } = require('./middleware/enhancedErrorLogger');
```

### 3. Update Action Executor Usage
```javascript
// In routes that use action executor
// OLD:
const { executeAction } = require('../services/actionExecutor');

// NEW:
const { executeAction } = require('../services/enhancedActionExecutor');
```

### 4. Update Async Handlers
```javascript
// OLD:
const { asyncHandler } = require('../middleware/errorLogger');

// NEW:
const { asyncHandler } = require('../middleware/enhancedErrorLogger');
```

## How It Works

### Automatic Error Learning
1. Every error is captured with full context
2. Patterns are detected and stored
3. Similar errors trigger stored fixes
4. Fixes are applied automatically

### Manual Fix Registration
```javascript
// After fixing an issue, register the fix
await recursiveLearning.captureFix(
  errorId,
  {
    implementation: 'your_fix_logic',
    parameters: { timeout: 5000 }
  },
  {
    type: 'timeout', // debounce, validation, retry, etc
    reusability: 'universal', // or 'conditional', 'never'
    module: 'your_module'
  }
);
```

### Fix Classes
- **debounce** - Prevents rapid repeated actions
- **timeout** - Adds timeout protection
- **validation** - Input validation fixes
- **retry** - Retry with backoff
- **rate_limit** - Rate limiting
- **circuit_breaker** - Circuit breaker pattern
- **fallback** - Fallback mechanisms

## Monitoring

### View Pattern Effectiveness
```sql
SELECT * FROM pattern_effectiveness
ORDER BY success_rate DESC;
```

### Check Recent Errors
```sql
SELECT * FROM error_events
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Pattern Matching History
```sql
SELECT pm.*, lp.fix_class, lp.pattern_logic
FROM pattern_matches pm
JOIN learning_patterns lp ON pm.pattern_id = lp.id
WHERE pm.created_at > NOW() - INTERVAL '7 days';
```

## Configuration

### Thresholds (in recursiveLearning.js)
```javascript
this.similarityThreshold = 0.85;  // High confidence
this.mediumThreshold = 0.70;     // Medium confidence
this.lowThreshold = 0.50;        // Low confidence
this.decayDays = 30;             // Pattern expiry
this.suppressionWindow = 300000;  // 5 minutes
```

### Memory Management
- Patterns decay over time (5% per week)
- Successful patterns boost relevance
- Failed patterns decrease relevance
- Old patterns auto-expire

## Benefits
1. **Reduced Repeat Errors** - Same errors don't happen twice
2. **Automatic Fixes** - Known issues resolve instantly
3. **Learning System** - Gets smarter over time
4. **No Code Bloat** - Fixes stored externally
5. **Full Transparency** - All decisions logged

## Next Steps
1. Run in production for 1 week
2. Review pattern effectiveness
3. Tune similarity thresholds
4. Add Claude analysis for complex patterns