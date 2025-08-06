# ClubOS V3 Deployment Runbook

**Purpose:** Step-by-step procedures for deploying ClubOS V3 to production  
**Audience:** DevOps Engineers, Technical Leads  
**Last Updated:** August 2, 2025

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment (Railway)](#backend-deployment-railway)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Emergency Contacts](#emergency-contacts)

---

## Pre-Deployment Checklist

### Code Readiness
- [ ] All tests passing (`npm test`)
- [ ] Code coverage meets requirements (>80%)
- [ ] No linting errors (`npm run lint`)
- [ ] Build successful (`npm run build`)
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json

### Environment Preparation
- [ ] Database migrations reviewed
- [ ] Environment variables documented
- [ ] API keys valid and not expiring soon
- [ ] Backup of current production database
- [ ] Deployment window scheduled
- [ ] Team notified of deployment

### Access Verification
- [ ] Railway account access
- [ ] Vercel account access
- [ ] GitHub repository access
- [ ] Database access (read-only for verification)
- [ ] Monitoring dashboard access
- [ ] Slack channel access

---

## Backend Deployment (Railway)

### Step 1: Prepare Environment

```bash
# Navigate to backend directory
cd /path/to/clubos-v3/backend

# Ensure you're on the correct branch
git checkout main
git pull origin main

# Verify Railway CLI is installed
railway --version

# Login to Railway
railway login
```

### Step 2: Verify Environment Variables

```bash
# Check current variables
railway variables

# Required variables:
# - NODE_ENV=production
# - DATABASE_URL (auto-set by Railway)
# - JWT_SECRET
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY
# - SLACK_WEBHOOK_URL
# - CORS_ORIGIN (frontend URL)
```

### Step 3: Run Database Migrations

```bash
# Connect to production database
railway run npm run db:migrate

# Verify migrations
railway run npm run db:status
```

### Step 4: Deploy Backend

```bash
# Deploy to Railway
railway up

# Monitor deployment
railway logs --tail

# Expected output:
# - Build successful
# - Dependencies installed
# - Server started on port 8080
# - Database connected
# - Health check passing
```

### Step 5: Verify Backend Deployment

```bash
# Get deployment URL
railway domain

# Test health endpoint
curl https://your-backend-url.railway.app/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-08-02T...",
#   "version": "3.0.0"
# }
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

```bash
# Navigate to frontend directory
cd /path/to/clubos-v3/frontend

# Ensure correct branch
git checkout main
git pull origin main

# Build locally to verify
npm run build
```

### Step 2: Set Environment Variables

```bash
# List current variables
vercel env ls

# Required variables:
# - NEXT_PUBLIC_API_URL (Railway backend URL)
# - NEXT_PUBLIC_APP_NAME=ClubOS

# Add/update if needed
vercel env add NEXT_PUBLIC_API_URL production
```

### Step 3: Deploy to Vercel

```bash
# Deploy to production
vercel --prod

# Monitor deployment
vercel logs --follow

# Expected output:
# - Build successful
# - Static optimization completed
# - Functions created
# - Edge network updated
```

### Step 4: Verify Frontend Deployment

```bash
# Get deployment URL
# Visit in browser: https://clubos-v3.vercel.app

# Check:
# - Login page loads
# - No console errors
# - API connection works
# - Static assets load
```

---

## Post-Deployment Verification

### 1. Functional Testing

```bash
# Test authentication flow
curl -X POST https://api.clubos.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@clubos.com","password":"testpass"}'

# Test message processing
curl -X POST https://api.clubos.com/api/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message","customerId":"test123"}'
```

### 2. Database Verification

```sql
-- Check recent threads
SELECT COUNT(*) FROM threads WHERE created_at > NOW() - INTERVAL '1 hour';

-- Verify migrations
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;

-- Check SOP availability
SELECT COUNT(*) FROM sops WHERE enabled = true;
```

### 3. Monitoring Checks

- [ ] Health endpoints returning 200
- [ ] No error spikes in logs
- [ ] Response times within SLA
- [ ] Database connections stable
- [ ] External API connections working

### 4. User Acceptance Testing

- [ ] Operator can login
- [ ] Messages are processed correctly
- [ ] SOPs are matched appropriately
- [ ] Actions execute successfully
- [ ] Escalations work as expected

---

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

```bash
# Backend rollback
railway rollback

# Frontend rollback
vercel rollback

# Verify rollback
curl https://api.clubos.com/health
```

### Database Rollback

```bash
# Only if migrations were run
railway run npm run db:rollback

# Verify schema
railway run npm run db:status
```

### Full Rollback Procedure

1. **Stop incoming traffic** (if critical issue)
2. **Rollback frontend** first (user-facing)
3. **Rollback backend** 
4. **Rollback database** (if needed)
5. **Verify all services**
6. **Notify team** of rollback
7. **Document issue** for post-mortem

---

## Troubleshooting Guide

### Common Issues

#### Backend Won't Start
```bash
# Check logs
railway logs --tail 100

# Common causes:
# - Missing environment variables
# - Database connection failed
# - Port already in use
# - Dependencies not installed
```

#### Frontend Build Fails
```bash
# Check build logs
vercel logs

# Common causes:
# - TypeScript errors
# - Missing environment variables
# - Dependency conflicts
# - Next.js configuration issues
```

#### Database Connection Issues
```bash
# Test connection
railway run npm run db:test

# Check:
# - DATABASE_URL is correct
# - Database is running
# - Network connectivity
# - SSL requirements
```

#### API Integration Failures
```bash
# Check API keys
railway variables | grep API_KEY

# Verify:
# - Keys are not expired
# - Correct environment
# - Rate limits not exceeded
# - API service status
```

### Debug Commands

```bash
# Backend debugging
railway logs --tail 100
railway run npm run debug
railway ssh  # If available

# Frontend debugging
vercel logs --follow
vercel inspect [deployment-id]

# Database debugging
railway run npm run db:console
```

---

## Emergency Contacts

### Primary Contacts
- **Technical Lead**: Michael Belair
  - Email: michael@clubhouse.com
  - Phone: [Encrypted in password manager]

- **Backup Contact**: Jason
  - Email: jason@clubhouse.com
  - Phone: [Encrypted in password manager]

### Service Contacts
- **Railway Support**: support@railway.app
- **Vercel Support**: support@vercel.com
- **OpenAI Status**: status.openai.com
- **Anthropic Status**: status.anthropic.com

### Internal Channels
- **Slack Channel**: #clubos-prod
- **Emergency Channel**: #incident-response
- **Status Page**: status.clubos.com

---

## Post-Deployment Tasks

### Within 1 Hour
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all integrations
- [ ] Test critical user paths
- [ ] Update status page

### Within 24 Hours
- [ ] Review deployment metrics
- [ ] Document any issues
- [ ] Update runbook if needed
- [ ] Schedule post-mortem (if issues)
- [ ] Notify stakeholders of success

### Within 1 Week
- [ ] Analyze usage patterns
- [ ] Review performance data
- [ ] Plan next improvements
- [ ] Update documentation
- [ ] Archive deployment logs

---

## Deployment Log Template

```markdown
## Deployment: [Date]

**Version**: 3.0.0 → 3.0.1
**Deployer**: [Name]
**Start Time**: [Time]
**End Time**: [Time]
**Duration**: [Minutes]

### Changes
- Feature: [Description]
- Fix: [Description]
- Update: [Description]

### Issues Encountered
- None / [Description]

### Resolution
- N/A / [Actions taken]

### Verification
- [ ] Health checks passing
- [ ] Functional tests passing
- [ ] No errors in logs
- [ ] Performance normal

### Notes
[Any additional observations]
```

---

*This runbook should be reviewed and updated after each deployment to incorporate lessons learned.*