# ⚡ Quick Wins Checklist

## Before Starting ANY Feature

### 1. Does it already exist?
```bash
# Check if similar code exists
grep -r "feature_keyword" backend/src frontend/src

# Check if someone built it
ls backend/src/routes/
ls frontend/src/components/
```

### 2. Can I copy-modify?
- Find similar endpoint → Copy file → Modify
- Find similar component → Copy file → Modify
- Find similar test → Copy file → Modify

### 3. Is there an npm package?
```bash
npm search keyword
# Examples: date formatting, validation, auth, file upload
```

## Speed Shortcuts by Task Type

### Adding CRUD Endpoint (15 min)
1. Copy `backend/src/routes/sops.js` → rename
2. Change table name and fields
3. Copy test file → update
4. Register in `index.js`
5. Done

### Adding UI List/Detail (20 min)
1. Copy `frontend/src/app/threads/page.tsx` → rename
2. Change API endpoint
3. Update fields displayed
4. Add to navigation
5. Done

### Adding Background Job (10 min)
1. Create `backend/src/jobs/jobName.js`
2. Copy pattern from `actionExecutor.js`
3. Add to cron or queue
4. Done

### Database Field (5 min)
```sql
-- Just run in dev:
ALTER TABLE table_name ADD COLUMN field_name TYPE DEFAULT value;
-- Add migration file later
```

## Instant Productivity Boosters

### 1. Use AI for Boilerplate
"Generate a Joi schema for user registration with email, password, name"

### 2. Database GUI
- Use TablePlus/DBeaver instead of psql
- Faster to see data and test queries

### 3. API Testing
- Use Postman/Insomnia with saved requests
- Faster than writing curl commands

### 4. Hot Reload Everything
```json
// package.json
"dev": "nodemon --watch src"
```

### 5. Snippet Library
```javascript
// VS Code snippets for common patterns
"api-route": {
  "prefix": "apiroute",
  "body": [
    "router.${1:post}('/${2:path}', async (req, res, next) => {",
    "  try {",
    "    const result = await ${3:Service}.${4:method}(req.body);",
    "    res.json({ success: true, data: result });",
    "  } catch (error) {",
    "    next(error);",
    "  }",
    "});"
  ]
}
```

## Don't Get Blocked By

### "What's the best practice?"
→ Use what's already in the codebase

### "Should I refactor this?"
→ Not if it works

### "This could be more elegant"
→ Elegant comes in v2

### "Should I add TypeScript?"
→ Not mid-project

### "What about edge cases?"
→ Handle the 80%, document the 20%

## Time Savers

### Git Aliases
```bash
alias gs='git status'
alias ga='git add .'
alias gc='git commit -m'
alias gp='git push'
```

### NPM Scripts
```json
"db:reset": "psql $DATABASE_URL < schema.sql",
"db:seed": "psql $DATABASE_URL < seed.sql",
"logs": "tail -f logs/*.log | grep -v DEBUG"
```

### Docker Commands
```bash
# Reset everything
docker-compose down -v && docker-compose up

# Quick DB access
docker exec -it postgres psql -U clubos clubos_v3
```

## The Meta Rule

**Time spent planning > 10 minutes = Too much**

Start coding with what you know, adjust as you learn.

---
*Ship features, not frameworks*