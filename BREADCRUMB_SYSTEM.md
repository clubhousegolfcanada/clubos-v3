# 🍞 Breadcrumb System Architecture

## Purpose
Create a trail that any Claude session can follow to understand exactly what happened, why, and what's next.

---

## 📍 Breadcrumb Levels

### Level 1: File-Level Breadcrumbs
```javascript
// backend/src/routes/newFeature.js
// [SESSION: 2025-08-01-001] Created new feature endpoint
// [REASON: human_request] Operators need X functionality  
// [DEPENDS: authService.js, featureService.js]
// [NEXT: Add frontend integration]

const router = require('express').Router();
// ... code ...
```

### Level 2: Decision Breadcrumbs
```javascript
// [DECISION: 2025-08-01-14:30] Chose PostgreSQL array over junction table
// [REASON: Simpler queries, tags rarely change]
// [ALTERNATIVES: Junction table (more complex), JSON field (less queryable)]
// [IMPACT: Easier implementation, slight denormalization]

ALTER TABLE sops ADD COLUMN tags TEXT[];
```

### Level 3: Integration Breadcrumbs
```javascript
// [INTEGRATION: auth-system]
// [CONNECTED: 2025-08-01] This service now depends on auth
// [USAGE: Validates user tokens before processing]
// [BREAKING: Requires AUTH_SECRET in env]

const { validateToken } = require('../services/authService');
```

### Level 4: Problem Breadcrumbs
```javascript
// [PROBLEM: 2025-08-01] Race condition in concurrent updates
// [SYMPTOM: Duplicate SOPs created]
// [SOLUTION: Added transaction with row lock]
// [PREVENTION: Always use transactions for multi-step operations]

await client.query('BEGIN');
await client.query('SELECT * FROM sops WHERE id = $1 FOR UPDATE', [id]);
```

---

## 🏷️ Breadcrumb Tags Reference

### Session Tags
- `[SESSION: date-number]` - Links work to specific session
- `[HANDOFF]` - Critical info for next session
- `[INCOMPLETE]` - Work that needs finishing

### Decision Tags  
- `[DECISION: timestamp]` - Architecture/implementation choice
- `[REASON: category]` - Why (human_request, performance, bug_fix)
- `[ALTERNATIVES: list]` - What else was considered

### Status Tags
- `[BLOCKED: reason]` - Cannot proceed without input
- `[QUESTION: text]` - Needs human answer
- `[ASSUMPTION: text]` - Proceeding based on assumption

### Integration Tags
- `[DEPENDS: files]` - What this code needs
- `[BREAKING: change]` - What might break
- `[MIGRATION: needed]` - Database changes required

---

## 📁 Where to Leave Breadcrumbs

### Always Breadcrumb These:
1. **New Files** - Why created, what it does
2. **Major Functions** - Purpose, dependencies
3. **Database Changes** - Reason, impact
4. **API Changes** - Breaking changes, versioning
5. **Complex Logic** - Why this approach
6. **Bug Fixes** - What was wrong, how fixed
7. **Integration Points** - What connects where

### Breadcrumb Locations
```
/backend/
  *.js files         → Top of file + major functions
  /migrations/       → Top of each migration
  
/frontend/
  *.tsx files        → Component purpose + major hooks
  /api/              → Endpoint documentation
  
/docs/
  CHANGELOG.md       → Session summaries
  /DECISIONS/        → Detailed decision docs
  
/claude-instructions/
  */CHANGELOG.md     → Category-specific changes
  */CONTEXT.md       → Updated patterns
```

---

## 🔄 Breadcrumb Flow

### 1. Start of Feature
```javascript
// [FEATURE_START: user-avatars]
// [SESSION: 2025-08-01-001]  
// [REQUESTED: @john, support ticket #123]
// [APPROACH: S3 upload, CDN delivery, 5MB limit]
```

### 2. During Development
```javascript
// [PROGRESS: 60%] Upload endpoint complete, testing S3
// [DECISION: Use pre-signed URLs over direct upload]
// [BLOCKED: Need AWS credentials]
```

### 3. End of Feature
```javascript
// [FEATURE_END: user-avatars]
// [COMPLETE: Upload, storage, and display working]
// [TESTING: See /tests/avatar.test.js]
// [DOCS: Updated API.md with new endpoint]
```

---

## 📊 Breadcrumb Templates

### New Service Template
```javascript
/**
 * [SERVICE: ServiceName]
 * [SESSION: date-id] Created by Claude
 * [PURPOSE: What this service does]
 * [DEPENDS: List of dependencies]
 * [USED_BY: What will use this]
 * [PATTERNS: Follows X pattern from Y]
 */
class ServiceName {
  // Implementation
}
```

### API Endpoint Template
```javascript
/**
 * [ENDPOINT: POST /api/feature]
 * [SESSION: date-id] Added new endpoint
 * [PURPOSE: What this endpoint does]
 * [REQUEST: Expected payload structure]
 * [RESPONSE: What it returns]
 * [ERRORS: Possible error codes]
 * [BREAKING: Any breaking changes]
 */
router.post('/feature', async (req, res) => {
  // Implementation
});
```

### Database Migration Template
```sql
-- [MIGRATION: Add feature table]
-- [SESSION: date-id] Created migration
-- [REASON: human_request - feature X needs data storage]
-- [IMPACT: New table, no breaking changes]
-- [ROLLBACK: DROP TABLE feature;]

CREATE TABLE feature (
  -- Schema
);
```

---

## 🎯 Best Practices

### DO ✅
- Keep breadcrumbs concise but complete
- Include timestamp for time-sensitive decisions
- Link to tickets/issues when relevant
- Update breadcrumbs if understanding changes
- Use consistent tag format

### DON'T ❌
- Leave vague breadcrumbs like "fixed bug"
- Forget to mark blocking issues
- Skip breadcrumbs for "obvious" code
- Remove old breadcrumbs (they're history)
- Write novels - aim for clarity

### Quality Check
Good breadcrumb answers:
1. What was done?
2. Why was it done?
3. When was it done?
4. What depends on it?
5. What's next?

---

## 🔍 Finding Breadcrumbs

### Search Commands
```bash
# Find all handoffs
grep -r "\[HANDOFF\]" .

# Find decisions from specific date
grep -r "\[DECISION: 2025-08-01" .

# Find blocked items
grep -r "\[BLOCKED:" .

# Find specific session work
grep -r "\[SESSION: 2025-08-01-001\]" .

# Find integration points
grep -r "\[INTEGRATION:" backend/
```

---

## 📈 Breadcrumb Metrics

Track monthly:
- Average breadcrumbs per file
- Handoff clarity (next session startup time)
- Decision traceability (can find reasoning)
- Blocker resolution time
- Pattern emergence (repeated breadcrumbs)

---

*Good breadcrumbs make every Claude session feel like a continuation, not a restart*