# ClubOS V3 - Professional Handover Documentation

**Prepared for:** Jason  
**Prepared by:** Michael Belair  
**Date:** August 2, 2025  
**Version:** 3.0.0  
**Repository:** https://github.com/clubhousegolfcanada/clubos-v3

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Technical Architecture](#technical-architecture)
4. [Getting Started](#getting-started)
5. [Deployment Guide](#deployment-guide)
6. [Development Workflow](#development-workflow)
7. [API Documentation](#api-documentation)
8. [Database Schema](#database-schema)
9. [Testing Strategy](#testing-strategy)
10. [Monitoring & Maintenance](#monitoring-maintenance)
11. [Security Considerations](#security-considerations)
12. [Future Enhancements](#future-enhancements)
13. [Support & Resources](#support-resources)

---

## Executive Summary

ClubOS V3 is an AI-powered customer service system designed specifically for The Clubhouse golf simulator facilities. It automates routine customer inquiries while maintaining human oversight for complex issues.

### Key Features
- **Automated Intent Classification** - Uses GPT-4 to understand customer messages
- **SOP-Driven Responses** - Matches intents to Standard Operating Procedures
- **Action Execution Framework** - Performs automated actions with retry logic
- **Human Escalation** - Seamlessly hands off to operators when needed
- **Learning System** - Tracks patterns and improves over time

### Current Status
- Backend: Production-ready with 95.9% test coverage
- Frontend: Basic UI implemented, testing framework ready
- Deployment: Railway (backend) + Vercel (frontend) infrastructure prepared
- APIs: OpenAI integrated, Anthropic ready, external APIs pending

---

## System Overview

### Business Context
The Clubhouse operates multiple golf simulator facilities across Canada. ClubOS reduces operator workload by:
- Handling routine inquiries (password resets, booking changes)
- Providing 24/7 first-line support
- Escalating complex issues to human operators
- Learning from patterns to improve responses

### Technical Stack
```
Backend:  Node.js 18+ / Express / PostgreSQL
Frontend: Next.js 14 / React 18 / TypeScript
AI/ML:    OpenAI GPT-4 / Anthropic Claude
Deploy:   Railway (backend) / Vercel (frontend)
Monitor:  Health checks / Structured logging
Testing:  Jest / React Testing Library
```

### System Flow
```
Customer Message → Intent Classification → SOP Matching → Action Execution → Response
                                              ↓
                                    Human Escalation (if needed)
```

---

## Technical Architecture

### Backend Structure
```
/backend/
├── src/
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic
│   ├── middleware/     # Security, validation
│   ├── validators/     # Input schemas
│   └── utils/          # Helpers
├── migrations/         # Database schemas
└── tests/             # Test suites
```

### Frontend Structure
```
/frontend/
├── src/
│   ├── app/           # Next.js 14 app directory
│   ├── components/    # Reusable UI components
│   └── lib/           # Utilities and API client
└── tests/             # Component tests
```

### Key Services

1. **Intent Classifier** (`intentClassifier.js`)
   - Analyzes messages using GPT-4
   - Returns structured intent + confidence score
   - Handles classification errors gracefully

2. **SOP Matcher** (`sopMatcher.js` / `enhancedSopMatcher.js`)
   - Matches classified intents to SOPs
   - Includes caching and pattern learning
   - Prioritizes by time impact

3. **Action Executor** (`actionExecutor.js`)
   - Executes SOP-defined actions
   - Implements retry logic
   - Tracks success/failure

4. **Notification Service** (`notifications.js`)
   - Sends Slack alerts
   - Handles escalations
   - Provides system alerts

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+
- Git
- Railway CLI (for deployment)
- Vercel CLI (for deployment)

### Local Development Setup

1. **Clone Repository**
```bash
git clone https://github.com/clubhousegolfcanada/clubos-v3.git
cd clubos-v3
```

2. **Install Dependencies**
```bash
# Root dependencies
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

3. **Environment Configuration**
```bash
# Backend (.env)
cp backend/.env.example backend/.env
# Edit with your values:
# - DATABASE_URL
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY
# - JWT_SECRET
```

4. **Database Setup**
```bash
cd backend
npm run db:migrate
npm run db:seed  # Optional: Load sample SOPs
```

5. **Start Development Servers**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

6. **Access Applications**
- Backend API: http://localhost:3001
- Frontend UI: http://localhost:3000

---

## Deployment Guide

### Backend Deployment (Railway)

1. **Login to Railway**
```bash
railway login
```

2. **Link Project**
```bash
cd backend
railway link
# Select: clubos-v3-backend
```

3. **Set Environment Variables**
```bash
railway variables --set "OPENAI_API_KEY=sk-..."
railway variables --set "ANTHROPIC_API_KEY=sk-ant-..."
railway variables --set "JWT_SECRET=..."
railway variables --set "SLACK_WEBHOOK_URL=..."
```

4. **Deploy**
```bash
railway up
```

### Frontend Deployment (Vercel)

1. **Login to Vercel**
```bash
vercel login
```

2. **Deploy**
```bash
cd frontend
vercel --prod
```

3. **Set Environment Variables**
```bash
vercel env add NEXT_PUBLIC_API_URL production
# Enter Railway backend URL
```

### Post-Deployment Checklist
- [ ] Verify health endpoints
- [ ] Test authentication flow
- [ ] Confirm database connectivity
- [ ] Check API integrations
- [ ] Monitor error logs

---

## Development Workflow

### Git Workflow
```bash
# Feature branch
git checkout -b feature/your-feature

# Make changes and test
npm test

# Commit with conventional commits
git commit -m "feat: add new SOP matching logic"

# Push and create PR
git push origin feature/your-feature
```

### Commit Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `test:` Test additions
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

### Code Standards
- ESLint configuration enforced
- Prettier for formatting
- TypeScript for frontend
- Jest for all tests
- 80%+ code coverage required

### Pre-commit Hooks
Husky runs automatically:
1. Linting
2. Tests
3. Type checking
4. Commit message validation

---

## API Documentation

### Core Endpoints

#### Messages
```http
POST /api/messages
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "I need to reset my password",
  "customerId": "12345",
  "channel": "sms"
}

Response: {
  "threadId": 1,
  "intent": "password_reset",
  "confidence": 0.95,
  "sopMatched": true,
  "response": "I'll help you reset your password..."
}
```

#### Threads
```http
GET /api/threads
GET /api/threads/:id
POST /api/threads/:id/messages
PATCH /api/threads/:id/status
```

#### SOPs
```http
GET /api/sops
POST /api/sops
PATCH /api/sops/:id
DELETE /api/sops/:id
```

#### Authentication
```http
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user
- Configurable in middleware

---

## Database Schema

### Core Tables

1. **threads** - Conversation containers
2. **messages** - Individual messages
3. **sops** - Standard Operating Procedures
4. **actions** - Executable actions
5. **action_executions** - Execution history
6. **users** - System operators
7. **tags** - Message categorization
8. **sop_outcomes** - Performance tracking

### Key Relationships
```sql
threads (1) ← → (N) messages
sops (1) ← → (N) actions
threads (1) ← → (N) action_executions
messages (N) ← → (N) tags
```

### Migration Management
```bash
# Run migrations
npm run db:migrate

# Rollback
npm run db:rollback

# Create new migration
npm run db:migration:create -- --name your_migration_name
```

---

## Testing Strategy

### Backend Testing
```bash
cd backend

# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Current Coverage: **95.9%**

### Frontend Testing
```bash
cd frontend

# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Categories
1. **Unit Tests** - Individual functions/components
2. **Integration Tests** - API endpoints
3. **E2E Tests** - Full user flows (planned)

### Key Test Files
- `intentClassifier.test.js` - AI classification
- `sopMatcher.test.js` - SOP matching logic
- `messages.test.js` - API integration

---

## Monitoring & Maintenance

### Health Checks
- Backend: `GET /health`
- Frontend: `GET /api/health`
- Database: Connection pool monitoring

### Logging
```javascript
// Structured logging
logger.info('Message processed', {
  threadId,
  intent,
  duration: Date.now() - start
});
```

### Error Tracking
- Console logs in development
- Structured JSON in production
- Slack alerts for critical errors
- Sentry integration (planned)

### Performance Metrics
- Response time: < 3 seconds target
- SOP match rate: > 78%
- Escalation rate: < 22%
- Uptime: 99.9% target

---

## Security Considerations

### Current Implementation
- JWT authentication
- Helmet.js security headers
- Rate limiting
- Input validation (Joi)
- SQL injection prevention
- XSS protection

### API Keys Management
- Environment variables only
- Never commit secrets
- Rotate periodically
- Use separate keys for environments

### CORS Configuration
```javascript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
})
```

---

## Future Enhancements

### Phase 1 (In Progress)
- Claude integration for SOP analysis
- Real API connections (OpenPhone, NinjaOne)
- Frontend testing completion

### Phase 2 (Planned)
- PWA mobile support
- Real-time WebSocket updates
- Advanced analytics dashboard

### Phase 3 (Proposed)
- Pattern recognition system
- Automated SOP evolution
- Predictive issue resolution
- Multi-location heuristics

See `ROADMAP_LIVE.md` for detailed planning.

---

## Support & Resources

### Key Documentation
- `/README.md` - Quick start guide
- `/docs/` - Detailed documentation
- `/CHANGELOG.md` - Version history
- `/claude-instructions/` - AI coding guides

### Development Resources
- GitHub: https://github.com/clubhousegolfcanada/clubos-v3
- Railway Dashboard: https://railway.app/project/[project-id]
- Vercel Dashboard: https://vercel.com/[team]/clubos-v3

### Contact
- Technical Lead: Michael Belair
- Handover To: Jason
- Slack Channel: #clubos-dev

### Critical Information
1. **Database Backups** - Daily automated via Railway
2. **API Keys** - Stored in password manager
3. **Deployment Access** - Ensure Jason has:
   - GitHub repository access
   - Railway project access
   - Vercel team access
   - Environment variables

---

## Appendix

### Common Issues & Solutions

**Issue:** Tests failing locally
**Solution:** Ensure PostgreSQL is running and migrations are current

**Issue:** API rate limits hit
**Solution:** Check for loops in code, implement caching

**Issue:** Deployment fails
**Solution:** Check environment variables and build logs

### Useful Commands
```bash
# Check system status
npm run status

# View recent logs
railway logs --tail 100

# Database console
npm run db:console

# Clear cache
npm run cache:clear
```

---

*This document is version controlled. Last updated: August 2, 2025*