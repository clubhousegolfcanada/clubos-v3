# AI Context Guide - ClubOS V3

This consolidated guide provides everything AI assistants need to work effectively on ClubOS V3.

## 🚀 Quick Start (Read First!)

1. **Check Active Work**: Read `CURRENT_WORK.md` 
2. **Review Changes**: Check recent commits in `CHANGELOG.md`
3. **Find Your Task**: 
   - Features → `/claude-instructions/features/`
   - Fixes → `/claude-instructions/fixes/`
   - Deploy → `/claude-instructions/deployment/`

## 📊 Project Context

### Current State
- **Version**: 0.7.0
- **Status**: Development (needs environment setup)
- **GitHub**: https://github.com/clubhousegolfcanada/clubos-v3

### System Overview
```
ClubOS V3: AI-powered customer service for The Clubhouse
├── Message Processing (GPT-4 intent classification)
├── SOP Matching (keyword-based routing)
├── Action Execution (device control framework)
└── Human Escalation (Slack integration)
```

### Tech Stack
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + Tailwind
- **APIs**: OpenAI GPT-4, Anthropic Claude (planned)
- **Deploy**: Railway (backend) + Vercel (frontend)

## 🔧 Common Patterns & Assumptions

### File Naming (Never Ask!)
```javascript
// Services & utils: camelCase
authService.js
sopMatcher.js

// React components: PascalCase  
ThreadList.tsx
ActionButton.tsx

// Database: snake_case
CREATE TABLE threads
phone_number VARCHAR
```

### Code Patterns
```javascript
// Backend: CommonJS
const express = require('express');

// Frontend: ES Modules
import React from 'react';

// Error handling: Always wrap
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  throw error;
}

// API responses: Consistent format
res.json({
  success: true,
  data: result,
  metadata: { timestamp: new Date() }
});
```

### File Locations (Auto-Know)
```
/backend/src/services/      → Business logic
/backend/src/routes/        → API endpoints
/frontend/src/components/   → React components
/backend/src/db/migrations/ → Database changes
```

## 📝 Coding Standards

### Git Commits
```bash
feat: add user authentication
fix: resolve timeout issue
docs: update API documentation
test: add auth service tests
chore: update dependencies
```

### Documentation
- Comment complex logic
- Update API docs when changing endpoints
- Add breadcrumbs for decisions: `// [DECISION: 2025-08-05] Chose X because Y`
- Update CHANGELOG.md for significant changes

### Testing
- Write tests alongside features
- Test file naming: `service.test.js`
- Minimum 80% coverage target
- Run tests before committing

### Code Quality
- ESLint + Prettier configured
- Fix linting errors immediately
- No `console.log()` - use `logger.info()`
- Handle all Promise rejections

## 🚨 Current Issues & Blockers

### Critical
- No .env file configured (46 variables needed)
- Tests failing due to missing database
- 20+ linting errors need fixing

### Needs Real API Keys
- OpenAI GPT-4
- Anthropic Claude  
- Slack webhooks
- Device control APIs (NinjaOne, Ubiquiti, etc.)

## 🎯 Key Features

### Implemented
1. **Core Message Loop** - Intent classification and routing
2. **Action Framework** - Extensible device control (6 handlers)
3. **Pattern Learning** - Confidence-based automation system
4. **Knowledge Management** - Natural language updates

### Not Integrated
- Pattern system built but not connected to main app
- Complex features exist in isolation
- Frontend is minimal skeleton

## 📋 Development Workflow

1. **Starting Work**
   - Check CURRENT_WORK.md
   - Create/update relevant tests
   - Follow existing patterns

2. **Making Changes**
   - Fix linting errors in files you touch
   - Update tests for changes
   - Document decisions inline

3. **Before Committing**
   - Run `npm test` (when working)
   - Run `npm run lint:fix`
   - Update CHANGELOG.md if significant

## 🔗 Quick Links

- **Architecture**: See PROJECT_STRUCTURE.md
- **Deployment**: See DEPLOYMENT_GUIDE.md  
- **Contributing**: See CONTRIBUTING.md
- **API Docs**: See /docs/API/
- **Action Framework**: See ACTION_FRAMEWORK_GUIDE.md

---
*This is the single source of truth for AI context. Other context files have been archived.*