# GitHub Secrets Setup Guide

## Required Secrets for CI/CD

Add these secrets to your GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret" for each:

### Deployment Secrets

#### Railway (Backend)
- `RAILWAY_TOKEN` - Production Railway API token
- `RAILWAY_TOKEN_STAGING` - Staging Railway API token

Get these from Railway:
1. Go to Railway dashboard
2. Account Settings → Tokens
3. Create tokens for each environment

#### Vercel (Frontend)
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Production project ID
- `VERCEL_PROJECT_ID_STAGING` - Staging project ID

Get these from Vercel:
1. Account Settings → Tokens → Create
2. Project Settings → General → Project ID
3. Team Settings → General → Team ID

### Monitoring & Notifications
- `SLACK_WEBHOOK` - Slack webhook URL for deployment notifications
- `SNYK_TOKEN` - (Optional) Snyk token for security scanning

### Environment-Specific Secrets

These are set in Railway/Vercel, not GitHub:
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- Other API keys from .env

## Quick Setup Commands

After adding secrets, test the workflow:

```bash
# Create a test branch
git checkout -b test-ci
git push origin test-ci

# Open a PR to see checks run
```

## Verification

Check that workflows are running:
1. Go to Actions tab in GitHub
2. You should see:
   - CI/CD Pipeline (on every push/PR)
   - Security Scan (on push + weekly)