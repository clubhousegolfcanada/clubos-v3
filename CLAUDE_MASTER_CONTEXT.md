# 🧠 Claude Master Context - ClubOS V3

## Project State
- **Version**: 0.4.1
- **Status**: Development (Ready for deployment)
- **Last Updated**: 2025-08-02
- **Last Major Change**: GitHub repository setup & CI/CD pipelines
- **GitHub**: https://github.com/clubhousegolfcanada/clubos-v3

## System Overview
```
ClubOS V3: AI-powered customer service system for The Clubhouse
├── Processes customer messages via SMS/chat
├── Matches to SOPs (Standard Operating Procedures)  
├── Executes automated actions
└── Escalates to humans when needed
```

## Active Development
- **Current Sprint**: Production readiness & deployment setup
- **Recently Completed**: 
  - ✅ GitHub repository created and code pushed
  - ✅ CI/CD pipelines (GitHub Actions)
  - ✅ Backend testing (95.9% coverage)
  - ✅ Security vulnerability fixes
  - ✅ Documentation updates
- **Next Priority**: 
  - 🔴 Add GitHub secrets for deployment
  - 🔴 Set up Railway & Vercel accounts
  - 🔴 Frontend testing setup

## Blocked Items
- 🔴 Need real API keys (OpenAI, Anthropic, Slack)
- 🔴 Need production database URL
- 🔴 Waiting on NinjaOne/Ubiquiti credentials

## Architecture Summary
```javascript
Backend:  Express.js + PostgreSQL
Frontend: Next.js 14 + TypeScript + Tailwind
APIs:     OpenAI GPT-4 (intent), Anthropic Claude (SOPs)
Deploy:   Railway (backend) + Vercel (frontend)
Local:    Docker Compose (PostgreSQL + Redis)
```

## Key Patterns Established
1. **API Pattern**: Thin controllers → Services → Database
2. **Error Handling**: Try/catch → Logger → Error middleware
3. **Database**: Correlation IDs, timestamps, JSON fields
4. **Frontend**: Server components, API routes, mobile-first
5. **Testing**: Jest, supertest, integration focus

## Recent Significant Changes
1. **2025-08-02**: GitHub repo setup & CI/CD pipelines created
2. **2025-08-02**: Fixed Next.js security vulnerabilities
3. **2025-08-02**: Backend tests added (95.9% coverage)
4. **2025-08-01**: Created Claude instruction decision tree
5. **2025-08-01**: Set up comprehensive audit system

## Quick Navigation
- 🎯 **Start Here**: `CURRENT_WORK.md`
- 📚 **Instructions**: `/claude-instructions/README.md`
- 🚀 **Deploy Guide**: `DEPLOYMENT_GUIDE.md`
- 📁 **Structure**: `PROJECT_STRUCTURE.md`
- 🧪 **Logic Improvements**: `/claude-instructions/LOGIC_IMPROVEMENTS.md`

## Core Principles
1. **Structured Clarity** > Rigid minimalism
2. **Ship Working Code** > Perfect architecture  
3. **Human-Tagged Features** > Speculative additions
4. **Breadcrumb Everything** > Assume memory
5. **Flexible Implementation** > Dogmatic rules

## Session Handoff Protocol
When starting a new session, Claude should:
1. Read `.ai-rules` first (6 simple rules)
2. Read this file for context
3. Check `CURRENT_WORK.md` for active tasks
4. Look for `[HANDOFF]` tags
5. Navigate to specific task docs if needed

## Quick Navigation From Here
- Working on feature? → `/claude-instructions/features/START.md`
- Fixing bug? → `/claude-instructions/fixes/START.md`  
- Deploying? → `/claude-instructions/deployment/START.md`
- Lost? → `/NEW_CONTEXT_QUICKSTART.md`

## Human Decisions Log
- **PWA Support**: Requested, planned, not urgent
- **Logic Improvements**: Available but implement only when needed
- **Dashboard**: Not requested yet, don't build speculatively

---
*This is the source of truth for Claude context across sessions*