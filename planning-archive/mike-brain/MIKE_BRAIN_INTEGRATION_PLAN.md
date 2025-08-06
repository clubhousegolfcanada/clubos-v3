# Mike-Brain Integration Plan for ClubOS V3

## Overview
Simple, high-value integrations from mike-brain system without adding complexity.

## Phase 1: Enhanced SOP Matcher (2 hours)

### 1. Add Decision Caching
```javascript
// In sopMatcher.js - Add caching for repeated queries
const decisionCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

async findMatchingSOP(intent, content) {
  const cacheKey = `${intent}-${content.slice(0, 50)}`;
  const cached = decisionCache.get(cacheKey);
  
  if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
    return cached.sop;
  }
  
  // Existing logic...
  const sop = await this.findBestSOP(intent, content);
  
  if (sop) {
    decisionCache.set(cacheKey, {
      sop,
      timestamp: Date.now()
    });
  }
  
  return sop;
}
```

### 2. Time Impact Assessment
```javascript
// Add to each SOP
assessTimeImpact(content, sop) {
  // Mike-brain logic
  const timeFactors = {
    'password_reset': 5, // minutes saved
    'trackman_reset': 15,
    'booking_change': 10,
    'refund_process': 20
  };
  
  sop.timeSaved = timeFactors[sop.category] || 5;
  
  // Urgency multiplier
  if (content.includes('urgent') || content.includes('now')) {
    sop.priority = 'high';
  }
  
  return sop;
}
```

### 3. Pattern Tracking
```javascript
// Add to actionExecutor.js
async trackOutcome(threadId, sopId, success) {
  await db.query(
    'INSERT INTO sop_outcomes (thread_id, sop_id, success, timestamp) VALUES ($1, $2, $3, NOW())',
    [threadId, sopId, success]
  );
  
  // Update SOP effectiveness score
  const stats = await this.getSOPStats(sopId);
  if (stats.successRate < 0.5 && stats.attempts > 10) {
    // Flag for review
    await this.flagSOPForReview(sopId);
  }
}
```

## Phase 2: Learning Patterns (Future)

### Database Changes
```sql
-- Add to migrations
CREATE TABLE sop_outcomes (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER REFERENCES threads(id),
  sop_id INTEGER REFERENCES sops(id),
  success BOOLEAN,
  time_saved INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sop_outcomes_sop_id ON sop_outcomes(sop_id);
```

### Weekly Pattern Analysis
```javascript
// Run weekly to identify patterns
async analyzePatterns() {
  const patterns = await db.query(`
    SELECT 
      s.title,
      COUNT(*) as uses,
      AVG(CASE WHEN o.success THEN 1 ELSE 0 END) as success_rate,
      SUM(o.time_saved) as total_time_saved
    FROM sops s
    JOIN sop_outcomes o ON s.id = o.sop_id
    WHERE o.timestamp > NOW() - INTERVAL '7 days'
    GROUP BY s.id
    ORDER BY total_time_saved DESC
  `);
  
  return patterns;
}
```

## What NOT to Integrate

1. **Full mike-brain API** - V3 already has comprehensive API
2. **Business strategy engine** - Not relevant to golf operations
3. **Complex decision trees** - Keep SOP matching simple
4. **Multiple decision engines** - One intent classifier is enough

## Implementation Priority

1. **NOW**: Decision caching (immediate 5x speed improvement)
2. **THIS WEEK**: Time impact scoring (better SOP prioritization)
3. **NEXT MONTH**: Pattern tracking (data for improvements)
4. **FUTURE**: Learning system (after data collection)

## Benefits

- **Faster responses** through intelligent caching
- **Better prioritization** with time impact scores
- **Continuous improvement** through pattern tracking
- **No architectural changes** required
- **Mike's principles** applied (time-focused, simple, builds on existing)

## Next Steps

1. Add caching to sopMatcher.js (30 mins)
2. Add time scoring to SOPs (30 mins)
3. Create sop_outcomes table (15 mins)
4. Add outcome tracking to actionExecutor (45 mins)
5. Test and deploy

Total time: ~2 hours for Phase 1