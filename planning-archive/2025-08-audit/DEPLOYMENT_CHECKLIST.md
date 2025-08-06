# ClubOS Deployment Checklist

## Pre-Deployment Requirements

### Environment Setup
- [ ] Railway account created
- [ ] Vercel account created
- [ ] GitHub repository access confirmed
- [ ] Local development environment working

### API Keys & Secrets
- [ ] OpenAI API key obtained
- [ ] Anthropic API key obtained
- [ ] Slack webhook URL created
- [ ] JWT secret generated (use: `openssl rand -base64 32`)

## Frontend Testing Setup Checklist

### 1. Install Dependencies
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

### 2. Configuration Files
- [ ] Create `jest.config.js`
- [ ] Create `jest.setup.js`
- [ ] Update `package.json` with test scripts

### 3. Write Tests
- [ ] Home page test
- [ ] Login component test
- [ ] Thread list test
- [ ] Thread detail test

### 4. Run Tests
- [ ] `npm test` passes
- [ ] `npm run test:coverage` shows good coverage

## Backend Deployment Checklist

### 1. Railway Setup
- [ ] Railway CLI installed
- [ ] Logged in to Railway (`railway login`)
- [ ] Project created (`railway init`)

### 2. Database Setup
- [ ] PostgreSQL added to Railway project
- [ ] Database URL noted

### 3. Environment Variables
- [ ] NODE_ENV=production
- [ ] PORT=8080
- [ ] DATABASE_URL set
- [ ] JWT_SECRET set
- [ ] OPENAI_API_KEY set
- [ ] ANTHROPIC_API_KEY set
- [ ] SLACK_WEBHOOK_URL set

### 4. Deploy Backend
- [ ] Run `railway up` from backend directory
- [ ] Deployment successful
- [ ] Get deployment URL (`railway domain`)
- [ ] Test health endpoint: `curl https://your-url.railway.app/health`

## Frontend Deployment Checklist

### 1. Vercel Setup
- [ ] Vercel CLI installed (`npm i -g vercel`)
- [ ] Logged in to Vercel (`vercel login`)

### 2. Environment Configuration
- [ ] Create `.env.production` with:
  - [ ] NEXT_PUBLIC_API_URL (Railway backend URL)
  - [ ] NEXT_PUBLIC_APP_NAME=ClubOS

### 3. Deploy Frontend
- [ ] Run `vercel` from frontend directory
- [ ] Project linked correctly
- [ ] Environment variables added
- [ ] Run `vercel --prod` for production

### 4. Verify Deployment
- [ ] Visit Vercel URL
- [ ] Login page loads
- [ ] No console errors
- [ ] API connection works

## GitHub Secrets Setup Checklist

### 1. Get Tokens
- [ ] Railway token created
- [ ] Vercel token created
- [ ] Vercel org ID obtained
- [ ] Vercel project ID obtained

### 2. Add to GitHub
Go to: https://github.com/clubhousegolfcanada/clubos-v3/settings/secrets/actions

- [ ] RAILWAY_TOKEN added
- [ ] VERCEL_TOKEN added
- [ ] VERCEL_ORG_ID added
- [ ] VERCEL_PROJECT_ID added
- [ ] SLACK_WEBHOOK added (optional)

## Post-Deployment Verification

### 1. Backend Health Checks
- [ ] `/health` returns 200 OK
- [ ] Database migrations ran successfully
- [ ] Can create a test thread via API

### 2. Frontend Functionality
- [ ] Login works
- [ ] Thread list loads
- [ ] Can view thread details
- [ ] Can send messages
- [ ] Actions execute properly

### 3. CI/CD Pipeline
- [ ] Push a small change to trigger pipeline
- [ ] Tests run successfully
- [ ] Deployment completes
- [ ] Both staging and production work

## Production Readiness

### Security
- [ ] HTTPS enabled (automatic on Railway/Vercel)
- [ ] Environment variables secure
- [ ] CORS configured correctly
- [ ] Rate limiting enabled

### Monitoring
- [ ] Error tracking setup (optional: Sentry)
- [ ] Uptime monitoring configured
- [ ] Slack notifications working

### Documentation
- [ ] README updated with production URLs
- [ ] API documentation current
- [ ] Deployment guide complete

## Common Issues & Solutions

### Railway
- **Build fails**: Check `railway logs`
- **Database connection**: Verify DATABASE_URL
- **Port binding**: Must use PORT env var

### Vercel
- **Build fails**: Check Next.js version
- **API 404s**: Verify NEXT_PUBLIC_API_URL
- **CORS errors**: Check backend CORS config

### Quick Debug Commands
```bash
# Railway
railway logs
railway status
railway variables

# Vercel
vercel logs
vercel env ls
```

## Next Steps After Deployment

1. **Custom Domain Setup**
   - Add custom domain in Vercel
   - Configure DNS records
   - Update backend CORS

2. **Scaling Configuration**
   - Set Railway scaling rules
   - Configure Vercel functions

3. **Backup Strategy**
   - Enable Railway database backups
   - Set backup retention policy

4. **Monitoring Setup**
   - Add error tracking
   - Set up performance monitoring
   - Configure alerts

---

**Remember**: Always test in staging before production!