# 🚀 ClubOS V3 Deployment Instructions

## Current Status
✅ Local database setup complete
✅ Railway project linked (clubos-v3-backend)
✅ PostgreSQL database provisioned on Railway
✅ Basic configuration ready

## 🔧 Required Environment Variables

You need to add these variables to Railway via the dashboard:

### 1. Go to Railway Dashboard
```
https://railway.app/project/21671649-654d-4240-ad6e-a51d2c410035
```

### 2. Add These Variables
Click on the Postgres service, then go to Variables tab and add:

**Essential (Required for startup):**
```
OPENAI_API_KEY=<your-openai-api-key>
```

**Optional Services (Add as needed):**
```
SLACK_WEBHOOK_URL=<your-slack-webhook>
ANTHROPIC_API_KEY=<your-anthropic-key>
REDIS_URL=<optional-redis-url>

# Device Control APIs
NINJAONE_CLIENT_ID=<if-using-ninjaone>
NINJAONE_CLIENT_SECRET=<if-using-ninjaone>
UBIQUITI_HOST=<if-using-ubiquiti>
UBIQUITI_USERNAME=<if-using-ubiquiti>
UBIQUITI_PASSWORD=<if-using-ubiquiti>

# Communication APIs
OPENPHONE_API_KEY=<if-using-openphone>
HUBSPOT_API_KEY=<if-using-hubspot>
```

## 📦 Deploy Backend to Railway

### Option 1: Deploy via CLI (Recommended)
```bash
cd /Users/michaelbelairch1/Desktop/Clubhouse\ OS\ \(Root\)/CLUBOSV3/backend

# Deploy to Railway
railway up

# Check deployment logs
railway logs
```

### Option 2: Deploy via GitHub
1. Push your code to GitHub
2. Connect GitHub repo in Railway dashboard
3. Enable automatic deployments on push to main

## 🧪 Test Deployment

### 1. Check Health Endpoint
```bash
# Replace with your Railway URL
curl https://clubos-v3-backend-production.up.railway.app/health
```

### 2. Check Detailed Health
```bash
curl https://clubos-v3-backend-production.up.railway.app/health/detailed
```

### 3. Run Database Migrations on Railway
```bash
cd backend
railway run npm run migrate
```

## 🎯 Next Steps

### Frontend Deployment (Vercel)
1. Create Vercel account if needed
2. Install Vercel CLI: `npm i -g vercel`
3. Deploy frontend:
```bash
cd /Users/michaelbelairch1/Desktop/Clubhouse\ OS\ \(Root\)/CLUBOSV3/frontend
vercel

# Set environment variable when prompted:
NEXT_PUBLIC_API_URL=https://clubos-v3-backend-production.up.railway.app
```

### Production Checklist
- [ ] Add real OpenAI API key to Railway
- [ ] Configure Slack webhook for notifications
- [ ] Set up custom domain (optional)
- [ ] Enable SSL certificate (Railway provides this)
- [ ] Configure CORS for your frontend domain
- [ ] Set up monitoring (optional)
- [ ] Configure backup strategy

## 🚨 Important Notes

1. **Database**: Railway PostgreSQL is already set up with DATABASE_URL
2. **Port**: Railway uses PORT=8080 by default (already configured)
3. **SSL**: Railway provides SSL certificates automatically
4. **Scaling**: Can add more dynos via Railway dashboard
5. **Logs**: Use `railway logs` to monitor deployment

## 📊 Architecture Summary

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Frontend       │────▶│  Backend API    │
│  (Vercel)       │     │  (Railway)      │
│                 │     │                 │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │                 │
                        │  PostgreSQL     │
                        │  (Railway)      │
                        │                 │
                        └─────────────────┘

Optional Services:
- Redis (for caching)
- OpenAI API
- Slack Webhooks
- Device Control APIs
```

## 🔍 Troubleshooting

### Database Connection Issues
- DATABASE_URL is automatically set by Railway
- Use internal URL for production: `postgres-v20y.railway.internal`
- Use public URL for external connections

### Build Failures
- Check Node version (requires 18+)
- Ensure all dependencies are in package.json
- Check build logs: `railway logs`

### CORS Errors
- Update CORS_ORIGIN in Railway variables
- Should match your frontend URL

## 📞 Support

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- Create issue in GitHub repo for app-specific problems

---

Last Updated: August 6, 2025
Status: Ready for deployment pending API keys