# Claude Instructions Navigation Tree

## 🎯 START HERE: What are you working on?

### 1. 🚀 **Adding a New Feature**
   → Read: [`/features/START.md`](./features/START.md)
   - API endpoints → `/features/api-endpoints.md`
   - UI components → `/features/ui-components.md`
   - Database changes → `/features/database-changes.md`
   - Integration work → `/features/integrations.md`

### 2. 🐛 **Fixing a Bug**
   → Read: [`/fixes/START.md`](./fixes/START.md)
   - Backend errors → `/fixes/backend-errors.md`
   - Frontend issues → `/fixes/frontend-issues.md`
   - Database problems → `/fixes/database-problems.md`
   - Integration failures → `/fixes/integration-failures.md`

### 3. 📦 **Deployment & DevOps**
   → Read: [`/deployment/START.md`](./deployment/START.md)
   - Local setup → `/deployment/local-setup.md`
   - Staging deploy → `/deployment/staging-deploy.md`
   - Production deploy → `/deployment/production-deploy.md`
   - Troubleshooting → `/deployment/troubleshooting.md`

### 4. 🧪 **Testing**
   → Read: [`/testing/START.md`](./testing/START.md)
   - Unit tests → `/testing/unit-tests.md`
   - Integration tests → `/testing/integration-tests.md`
   - E2E tests → `/testing/e2e-tests.md`
   - Performance tests → `/testing/performance-tests.md`

### 5. 🏗️ **Architecture Changes**
   → Read: [`/architecture/START.md`](./architecture/START.md)
   - Adding services → `/architecture/new-services.md`
   - Refactoring → `/architecture/refactoring.md`
   - Performance → `/architecture/performance.md`
   - Security → `/architecture/security.md`

## 📋 Quick Decision Rules

**If the user says:**
- "add", "create", "implement", "build" → Go to Features
- "fix", "broken", "error", "not working" → Go to Fixes
- "deploy", "ship", "release", "push" → Go to Deployment
- "test", "verify", "check" → Go to Testing
- "refactor", "optimize", "redesign" → Go to Architecture

## 🔄 Always Remember
1. Check `CURRENT_WORK.md` first
2. **NEW**: Check category CONTEXT.md for current state
3. **NEW**: Check INTEGRATIONS.md for connections
4. **NEW**: Update category CHANGELOG.md after changes
5. Follow the specific instructions in your chosen path
6. Each file is < 100 lines for easy reading

## 🧩 Context System
- Each category has its own changelog
- Each category tracks its integrations
- Each category defines its naming conventions
- Always check impact across categories
- Read [`INTEGRATION_CHECK.md`](./INTEGRATION_CHECK.md) for protocol

---
*This tree structure ensures you always know exactly what to do*