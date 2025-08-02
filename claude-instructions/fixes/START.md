# 🐛 Fixing Bugs - START HERE

## First: Understand the Problem
```bash
# Check logs
tail -50 backend/logs/error.log | grep ERROR

# Check recent changes
git log --oneline -10

# Check if known issue
grep -r "error_message" --include="*.md"
```

## Bug Categories

### 1. Backend Errors
→ Read: [`backend-errors.md`](./backend-errors.md)
- API failures
- Database errors
- Service crashes

### 2. Frontend Issues
→ Read: [`frontend-issues.md`](./frontend-issues.md)
- UI bugs
- State problems
- Rendering errors

### 3. Database Problems
→ Read: [`database-problems.md`](./database-problems.md)
- Query failures
- Migration issues
- Connection problems

### 4. Integration Failures
→ Read: [`integration-failures.md`](./integration-failures.md)
- Third-party API errors
- Webhook failures
- Auth problems

## Universal Debug Process

### 1. Reproduce
- [ ] Confirm the bug exists
- [ ] Document steps to reproduce
- [ ] Note environment details

### 2. Investigate
- [ ] Check relevant logs
- [ ] Review recent changes
- [ ] Test in isolation

### 3. Fix
- [ ] Create bug branch: `git checkout -b fix/issue-name`
- [ ] Write failing test first
- [ ] Implement fix
- [ ] Verify test passes

### 4. Verify
- [ ] Test the fix locally
- [ ] Check for side effects
- [ ] Run full test suite

### 5. Document
- [ ] Update CHANGELOG.md
- [ ] Add regression test
- [ ] Document in SESSION_LOG.md

## Quick Fixes Reference
- **500 errors**: Check `/backend/src/middleware/errorLogger.js`
- **CORS issues**: Check `/backend/src/index.js` CORS config
- **Auth failures**: Check JWT token expiry
- **DB connection**: Check `DATABASE_URL` in `.env`

---
*Choose your bug type above for specific debugging steps*