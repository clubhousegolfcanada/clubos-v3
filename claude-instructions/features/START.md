# 🚀 Adding New Features - START HERE

## Quick Check First
```bash
cat CURRENT_WORK.md  # Any active work?
tail -20 CHANGELOG.md  # Recent changes?
```

## What Type of Feature?

### 1. API Endpoint
→ Read: [`api-endpoints.md`](./api-endpoints.md)
- REST endpoints
- GraphQL queries
- WebSocket handlers

### 2. UI Component  
→ Read: [`ui-components.md`](./ui-components.md)
- Pages
- Components
- Forms

### 3. Database Feature
→ Read: [`database-changes.md`](./database-changes.md)
- New tables
- Schema changes
- Migrations

### 4. External Integration
→ Read: [`integrations.md`](./integrations.md)
- Third-party APIs
- Webhooks
- OAuth

## Universal Feature Checklist

### Before Starting
- [ ] Update `CURRENT_WORK.md` with feature name
- [ ] Create feature branch: `git checkout -b feat/feature-name`
- [ ] Check if similar code exists: `grep -r "similar_function"`

### During Development
- [ ] Write code with tests
- [ ] Add logging for debugging
- [ ] Handle errors gracefully
- [ ] Update relevant documentation

### After Completion
- [ ] Update `CHANGELOG.md`
- [ ] Clear `CURRENT_WORK.md`
- [ ] Create PR with clear description
- [ ] Update API docs if needed

## Common Patterns

### Feature Branch Naming
- `feat/user-authentication`
- `feat/sop-automation`
- `feat/claude-integration`

### Commit Messages
- `feat(api): add user authentication endpoint`
- `feat(ui): create SOP management dashboard`
- `feat(db): add learning_events table`

---
*Pick your feature type above for specific instructions*