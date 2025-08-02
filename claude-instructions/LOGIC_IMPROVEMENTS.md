# 🧠 Logic Improvements Implementation Guide

## Quick Reference
These improvements focus on **logic density**, not feature expansion.
**IMPORTANT**: Implement only when needed, not just because they exist.

## 1. SOP Draft Gate Implementation

### Database Change
```sql
-- Add to sops table
ALTER TABLE sops ADD COLUMN status VARCHAR(10) DEFAULT 'draft' CHECK (status IN ('draft', 'live'));
CREATE INDEX idx_sops_live ON sops(status) WHERE status = 'live';
```

### Code Changes
```javascript
// sopMatcher.js - Only match live SOPs
const query = `SELECT * FROM sops WHERE status = 'live' AND ...`;

// claude.js - Only create drafts
const newSOP = { ...sopData, status: 'draft' };
```

### Update Points
- `backend/src/services/sopMatcher.js`
- `backend/src/routes/claude.js`
- `backend/src/validators/sopSchema.js`

---

## 2. Correlation ID Implementation

### Already Exists! Just Enforce Usage
```javascript
// Current pattern in correlationId.js
const correlationId = req.headers['x-correlation-id'] || uuidv4();

// Ensure it flows through:
- thread creation
- action_log entries  
- ticket creation
- change_log entries
```

### Enforcement Checklist
- [ ] All service methods accept correlationId
- [ ] All database inserts include it
- [ ] Claude traces use it for context

---

## 3. Claude Proposal Structure

### New Table
```sql
CREATE TABLE merge_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_ids UUID[] NOT NULL,
  reason TEXT NOT NULL,
  conflicts JSONB,
  proposed_result JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'suggested',
  created_by VARCHAR(50) DEFAULT 'claude',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Proposal Format
```javascript
const proposal = {
  sopIds: [id1, id2],
  reason: "Both handle display issues with 90% overlap",
  conflicts: { keywords: ["display", "screen"] },
  proposedResult: { ...mergedSOP }
};
```

---

## 4. Learning Metrics Table

### Create Table
```sql
CREATE TABLE learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  sops_created INTEGER DEFAULT 0,
  sops_merged INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0,
  operator_approvals INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Weekly Cron
```javascript
// backend/src/jobs/weeklyMetrics.js
async function captureWeeklyMetrics() {
  const metrics = await calculateMetrics();
  await db.query('INSERT INTO learning_metrics ...', metrics);
}
```

---

## 5. SOP Override Tracking

### Database Change
```sql
ALTER TABLE sops 
  ADD COLUMN usage_count INTEGER DEFAULT 0,
  ADD COLUMN override_count INTEGER DEFAULT 0;

-- Add computed column or view
CREATE VIEW sop_effectiveness AS
SELECT *, 
  CASE 
    WHEN usage_count > 0 THEN override_count::float / usage_count 
    ELSE 0 
  END as override_rate
FROM sops;
```

### Track Usage
```javascript
// When SOP executes successfully
await db.query('UPDATE sops SET usage_count = usage_count + 1 WHERE id = $1', [sopId]);

// When operator overrides
await db.query('UPDATE sops SET override_count = override_count + 1 WHERE id = $1', [sopId]);
```

---

## 6. Stale SOP Detection

### Query for Weekly Review
```sql
-- Unused SOPs
SELECT * FROM sops 
WHERE status = 'live' 
  AND last_used_at < NOW() - INTERVAL '30 days'
  AND is_locked = false;

-- Low-value SOPs  
SELECT * FROM sop_effectiveness
WHERE usage_count < 3 
  AND status = 'draft'
  AND created_at < NOW() - INTERVAL '7 days';
```

---

## 7. Input Type on Triggers

### Update SOP Schema
```javascript
// sopSchema.js
const sopSchema = Joi.object({
  trigger: Joi.object({
    input_type: Joi.string()
      .valid('customer_message', 'system_event', 'operator_flag')
      .required(),
    conditions: Joi.object()
  })
});
```

### Migration for Existing
```sql
UPDATE sops 
SET trigger = jsonb_set(trigger, '{input_type}', '"customer_message"')
WHERE trigger->>'input_type' IS NULL;
```

---

## 8. Self-Contained Claude Logic

### Enforcement Rules
```javascript
// In claude-instructions/
// ❌ BAD: "See section 3.2 of architecture.md"
// ✅ GOOD: Complete logic included in instruction

// All instructions must be complete
// No external file references
// Exception: main_index.md for navigation only
```

---

## 9. Claude Self-Awareness Rules

### Add to `.ai-rules`
```markdown
## Claude Boundaries
- NEVER modify claude-instructions/ files
- NEVER execute without explicit approval  
- NEVER suggest "optional" features
- ALWAYS log actions in category CHANGELOG
- ALWAYS have clear reason for changes
```

---

## Pragmatic Implementation

### When to Actually Implement

1. **SOP Status Field**: When bad SOPs cause issues
2. **Correlation IDs**: When debugging becomes hard
3. **Override Tracking**: When operators complain
4. **Learning Metrics**: When you need to prove value
5. **Stale SOP Detection**: When database gets cluttered

### Simple Switches
```javascript
// .env controls
ENABLE_DRAFT_GATE=false  // Turn on when needed
ENABLE_METRICS=false     // Turn on for reporting
ENABLE_OVERRIDE_TRACKING=false  // Turn on if issues
```

---

## Files to Update

### Immediate
- `/backend/src/db/migrations/003_logic_improvements.sql`
- `/backend/src/services/sopMatcher.js` 
- `/backend/src/validators/sopSchema.js`
- `/.ai-rules`

### Follow-up
- `/backend/src/jobs/weeklyMetrics.js`
- `/backend/src/routes/claude.js`
- `/claude-instructions/features/CONTEXT.md`

---
*Logic density > Feature bloat*