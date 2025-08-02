# 🎯 High-Leverage Execution Patterns

## 1. Copy-Paste Templates (90% of tasks)

### API Endpoint Template
```javascript
// Just copy, rename, modify
// backend/src/routes/FEATURE.js
const router = require('express').Router();
const { validateRequest } = require('../middleware/validation');
const FeatureService = require('../services/featureService');

router.post('/', validateRequest('createFeature'), async (req, res, next) => {
  try {
    const result = await FeatureService.create(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### React Component Template
```tsx
// frontend/src/components/COMPONENT.tsx
export default function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Fetch data
  }, []);

  return (
    <div className="p-4">
      {/* Component UI */}
    </div>
  );
}
```

### Database Migration Template
```sql
-- migrations/XXX_description.sql
BEGIN;

-- Add your changes
ALTER TABLE table_name ADD COLUMN column_name TYPE;

-- Add index if needed
CREATE INDEX idx_table_column ON table_name(column_name);

COMMIT;
```

## 2. Decision Shortcuts

### "Should I create a new service?"
- More than 50 lines of logic? → YES
- Used by multiple routes? → YES  
- External API calls? → YES
- Otherwise → Keep in route

### "Should I add to existing file?"
- Same feature area? → YES
- Under 500 lines? → YES
- Otherwise → New file

### "Do I need a test?"
- New endpoint? → YES (copy existing test)
- Bug fix? → YES (regression test)
- UI only? → NO (for now)

## 3. Common Tasks - One-Liners

### Find where something is used
```bash
grep -r "functionName" backend/src --include="*.js"
```

### Add new API endpoint
```bash
cp backend/src/routes/messages.js backend/src/routes/newfeature.js
# Then just modify
```

### Create migration
```bash
echo "-- $(date +%Y%m%d)_description.sql" > backend/src/db/migrations/next.sql
```

### Test specific endpoint
```bash
curl -X POST http://localhost:3001/api/feature -H "Content-Type: application/json" -d '{}'
```

## 4. Avoid These Time-Wasters

### ❌ DON'T
- Over-engineer for future needs
- Create abstractions for single use
- Write custom validators (use Joi/Ajv)
- Implement from scratch (check npm first)
- Optimize before measuring

### ✅ DO
- Copy working code and modify
- Use existing patterns
- npm install proven solutions
- Test the happy path first
- Ship, then iterate

## 5. Speed Patterns

### Batch Similar Changes
```bash
# Change all at once
grep -l "oldPattern" backend/src/**/*.js | xargs sed -i '' 's/oldPattern/newPattern/g'
```

### Quick Feature Toggle
```javascript
// Add to .env instead of code changes
if (process.env.FEATURE_X_ENABLED === 'true') {
  // New feature code
}
```

### Database Changes Without Migration
```sql
-- For development only
psql $DATABASE_URL -c "ALTER TABLE ..."
```

## 6. AI-Specific Speed Hacks

### For Claude
- "Copy the pattern from messages.js" → Faster than explaining
- "Same as threads but for X" → Reuse mental model
- Give file paths, not descriptions
- Show output format, not process

### Skip These Discussions
- "What should we name this?" → Use existing pattern
- "Should we refactor?" → Ship first
- "What's the best way?" → Use the working way
- "Should we add types?" → Not yet

## 7. The 80/20 Rules

### 80% of bugs are:
- Missing await
- Wrong property name  
- Missing error handling
- Incorrect SQL syntax

### 80% of features need:
- CRUD endpoints
- List + Detail views
- Basic validation
- Error messages

### 80% of performance issues:
- Missing database indexes
- N+1 queries
- Large payloads
- No caching

## ONE RULE ABOVE ALL

**If it works and follows the pattern, ship it.**

Perfection comes through iteration, not planning.

---
*Execute fast, iterate faster*