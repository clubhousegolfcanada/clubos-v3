# 📦 Deployment Guide - START HERE

## Pre-Deployment Checklist
```bash
# All tests passing?
npm test

# Lint clean?
npm run lint

# Environment variables set?
cat .env | grep -E "API_KEY|DATABASE_URL"
```

## Deployment Paths

### 1. Local Development
→ Read: [`local-setup.md`](./local-setup.md)
- Docker setup
- Database init
- First run

### 2. Staging Deployment
→ Read: [`staging-deploy.md`](./staging-deploy.md)
- Railway staging
- Vercel preview
- Testing

### 3. Production Deployment
→ Read: [`production-deploy.md`](./production-deploy.md)
- Final checks
- Deploy process
- Monitoring

### 4. Troubleshooting
→ Read: [`troubleshooting.md`](./troubleshooting.md)
- Common issues
- Rollback procedures
- Debug tips

## Quick Deploy Commands

### Local
```bash
npm run docker:up
npm run dev
```

### Staging
```bash
./scripts/deploy.sh staging
```

### Production
```bash
./scripts/deploy.sh production
```

## Deployment Flow
1. **Test Locally** → All features work
2. **Deploy Staging** → Team testing
3. **Deploy Production** → Live users

## Key Files
- `/scripts/deploy.sh` - Main deploy script
- `/.github/workflows/deploy.yml` - CI/CD
- `/railway.toml` - Backend config
- `/vercel.json` - Frontend config

---
*Choose your deployment target above*