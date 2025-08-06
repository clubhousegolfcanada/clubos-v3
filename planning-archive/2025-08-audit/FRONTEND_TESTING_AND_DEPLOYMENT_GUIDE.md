# Frontend Testing & Deployment Step-by-Step Guide

## Part 1: Frontend Testing Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Backend running locally (for integration tests)

### Step 1: Install Testing Dependencies
```bash
cd frontend
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest \
  jest-environment-jsdom \
  @types/jest \
  eslint-plugin-testing-library \
  eslint-plugin-jest-dom
```

### Step 2: Configure Jest for Next.js
Create `frontend/jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
}

module.exports = createJestConfig(customJestConfig)
```

### Step 3: Create Jest Setup File
Create `frontend/jest.setup.js`:
```javascript
import '@testing-library/jest-dom'
```

### Step 4: Update package.json Scripts
Add to `frontend/package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Step 5: Create First Test
Create `frontend/src/app/__tests__/page.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home', () => {
  it('renders the home page', () => {
    render(<Home />)
    expect(screen.getByText(/ClubOS/i)).toBeInTheDocument()
  })
})
```

### Step 6: Run Tests
```bash
npm test
```

## Part 2: Railway Backend Deployment

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 2: Install Railway CLI
```bash
# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# Windows (PowerShell)
irm https://railway.app/install.ps1 | iex
```

### Step 3: Login to Railway
```bash
railway login
```

### Step 4: Create New Project
```bash
cd backend
railway init
# Select "Empty Project"
# Name it: clubos-v3-backend
```

### Step 5: Configure PostgreSQL Database
```bash
# Add PostgreSQL plugin
railway add

# Select PostgreSQL
# This creates a database service
```

### Step 6: Set Environment Variables
```bash
# Copy all variables from .env
railway variables set NODE_ENV=production
railway variables set PORT=8080
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set JWT_SECRET=your-production-secret
railway variables set OPENAI_API_KEY=your-openai-key
railway variables set ANTHROPIC_API_KEY=your-anthropic-key
railway variables set SLACK_WEBHOOK_URL=your-slack-webhook
```

### Step 7: Deploy Backend
```bash
# From backend directory
railway up

# This will:
# 1. Build your Docker image
# 2. Deploy to Railway
# 3. Run migrations automatically
# 4. Start the server
```

### Step 8: Get Deployment URL
```bash
railway domain
# Copy this URL - you'll need it for frontend
```

## Part 3: Vercel Frontend Deployment

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 2: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 3: Login to Vercel
```bash
vercel login
```

### Step 4: Configure Frontend Environment
Create `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
NEXT_PUBLIC_APP_NAME=ClubOS
```

### Step 5: Deploy to Vercel
```bash
cd frontend
vercel

# Answer prompts:
# ? Set up and deploy? Yes
# ? Which scope? Your account
# ? Link to existing project? No
# ? Project name? clubos-v3-frontend
# ? Directory? ./
# ? Build Command? (default)
# ? Output Directory? (default)
# ? Development Command? (default)
```

### Step 6: Configure Production Environment Variables
```bash
# Add environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter your Railway backend URL

vercel env add NEXT_PUBLIC_APP_NAME production
# Enter: ClubOS
```

### Step 7: Deploy Production Build
```bash
vercel --prod
```

## Part 4: GitHub Secrets Setup (For CI/CD)

### Step 1: Get Deployment Tokens

#### Railway Token
1. Go to https://railway.app/account/tokens
2. Create new token named "GitHub Actions"
3. Copy the token

#### Vercel Token
1. Go to https://vercel.com/account/tokens
2. Create new token named "GitHub Actions"
3. Copy the token

### Step 2: Get Vercel Project Info
```bash
cd frontend
vercel project ls
# Note the Project ID

vercel team ls
# Note the Team/Org ID
```

### Step 3: Add GitHub Secrets
1. Go to https://github.com/clubhousegolfcanada/clubos-v3/settings/secrets/actions
2. Add these secrets:

```
RAILWAY_TOKEN = your-railway-token
VERCEL_TOKEN = your-vercel-token
VERCEL_ORG_ID = your-vercel-org-id
VERCEL_PROJECT_ID = your-vercel-project-id
SLACK_WEBHOOK = your-slack-webhook (optional)
```

## Part 5: Verify Deployments

### Backend Health Check
```bash
curl https://your-railway-url.railway.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Frontend Check
1. Visit your Vercel URL
2. Should see ClubOS login page
3. Check browser console for errors

### Test Full Flow
1. Try logging in
2. Create a test message
3. Verify it appears in the thread list

## Part 6: Set Up Staging Environment

### Railway Staging
```bash
cd backend
railway environment create staging
railway link
# Select staging environment

# Deploy to staging
railway up
```

### Vercel Staging
```bash
cd frontend
vercel --prod
# This creates a preview deployment

# Or use git branches
git checkout -b staging
git push origin staging
# Vercel auto-deploys branches
```

## Troubleshooting

### Railway Issues
- **Build fails**: Check Dockerfile and package.json
- **Database connection**: Verify DATABASE_URL is set
- **Port issues**: Ensure PORT env var is used

### Vercel Issues
- **Build fails**: Check Next.js version compatibility
- **API calls fail**: Verify NEXT_PUBLIC_API_URL
- **CORS errors**: Check backend CORS settings

### Common Commands
```bash
# Railway
railway logs          # View deployment logs
railway status       # Check deployment status
railway variables    # List all env vars

# Vercel
vercel logs          # View function logs
vercel env ls        # List env vars
vercel alias         # Manage domains
```

## Next Steps
1. Set up monitoring (Sentry, LogRocket)
2. Configure custom domains
3. Set up SSL certificates (automatic on both platforms)
4. Configure auto-scaling rules
5. Set up database backups

## Support Resources
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment