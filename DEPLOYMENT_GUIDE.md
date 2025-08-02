# ClubOS V3 Deployment Guide

## 🚀 Quick Start

1. **Local Development**
   ```bash
   # Setup everything
   ./scripts/setup.sh
   
   # Start development
   npm run dev
   ```

2. **Deploy to Staging**
   ```bash
   ./scripts/deploy.sh staging
   ```

3. **Deploy to Production**
   ```bash
   ./scripts/deploy.sh production
   ```

## 📋 Prerequisites

### Required Accounts
- [ ] Railway account (backend hosting)
- [ ] Vercel account (frontend hosting)
- [ ] PostgreSQL database (Railway provides this)
- [ ] Redis instance (optional, Railway provides this)

### Required Environment Variables
```bash
# Copy .env.example to .env and fill in:
- DATABASE_URL (PostgreSQL connection string)
- JWT_SECRET (generate a secure random string)
- OPENAI_API_KEY (from OpenAI dashboard)
- ANTHROPIC_API_KEY (from Anthropic dashboard)
- SLACK_WEBHOOK_URL (from Slack app settings)
```

## 🏗️ Project Structure

```
/CLUBOSV3/
├── backend/          # Express.js API
├── frontend/         # Next.js 14 app
├── scripts/          # Deployment scripts
├── docs/            # Documentation
├── docker-compose.yml # Local development
├── railway.toml     # Railway config
└── vercel.json      # Vercel config
```

## 🔧 Setup Instructions

### 1. Database Setup

**Option A: Local PostgreSQL (Docker)**
```bash
# Start PostgreSQL and Redis
npm run docker:up

# Run migrations
npm run migrate
```

**Option B: Railway PostgreSQL**
1. Create new Railway project
2. Add PostgreSQL service
3. Copy DATABASE_URL to .env

### 2. Backend Deployment (Railway)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Create Railway Project**
   ```bash
   railway init
   ```

4. **Add Environment Variables**
   ```bash
   railway variables set DATABASE_URL="..."
   railway variables set JWT_SECRET="..."
   railway variables set OPENAI_API_KEY="..."
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### 3. Frontend Deployment (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Configure Project**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   ```

5. **Deploy**
   ```bash
   vercel --prod
   ```

## 🔄 CI/CD Setup

### GitHub Actions
1. Add these secrets to your GitHub repository:
   - `RAILWAY_TOKEN` - From Railway dashboard
   - `RAILWAY_TOKEN_STAGING` - For staging environment
   - `VERCEL_TOKEN` - From Vercel dashboard
   - `SLACK_WEBHOOK` - For deployment notifications

2. Push to branches:
   - `staging` - Deploys to staging
   - `main` - Deploys to production

## 📊 Monitoring

### Health Checks
- Backend: `https://your-backend.railway.app/health`
- Frontend: `https://your-frontend.vercel.app`

### Logs
- Railway: `railway logs`
- Vercel: `vercel logs`

### Database
- Connect: `railway run psql $DATABASE_URL`
- Migrations: `railway run npm run migrate`

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Check network/firewall rules

2. **Build Failures**
   - Check Node.js version (18+)
   - Clear node_modules and reinstall
   - Check for missing environment variables

3. **CORS Errors**
   - Update NEXT_PUBLIC_API_URL in frontend
   - Check backend CORS configuration
   - Ensure protocols match (http/https)

### Rollback Procedure
```bash
# Railway
railway rollback

# Vercel
vercel rollback
```

## 🔐 Security Checklist

- [ ] Strong JWT_SECRET (min 32 characters)
- [ ] API keys stored in environment variables
- [ ] HTTPS enabled on all endpoints
- [ ] Database credentials not in code
- [ ] Rate limiting configured
- [ ] CORS properly configured

## 📝 Post-Deployment

1. **Verify Services**
   - [ ] Backend health check passing
   - [ ] Frontend loading correctly
   - [ ] Database migrations complete
   - [ ] API endpoints responding

2. **Test Critical Flows**
   - [ ] Message processing
   - [ ] SOP matching
   - [ ] Action execution
   - [ ] Error handling

3. **Monitor First Hour**
   - [ ] Check error logs
   - [ ] Monitor response times
   - [ ] Verify integrations working

---
*For questions, check /docs or create an issue*