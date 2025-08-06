#!/bin/bash

# This script sets up all Railway environment variables
# Run with: bash setup-railway-env.sh

echo "Setting up Railway environment variables..."

# Basic configuration
railway variables --set "NODE_ENV=production" --set "PORT=8080"

# Database (Railway provides this automatically)
echo "DATABASE_URL will be set automatically by Railway PostgreSQL plugin"

# JWT Secret (generate a secure one)
JWT_SECRET=$(openssl rand -base64 32)
railway variables --set "JWT_SECRET=$JWT_SECRET"
echo "Generated JWT_SECRET: $JWT_SECRET"

# API Keys (you'll need to add these)
echo ""
echo "Please add your API keys:"
echo "1. OPENAI_API_KEY from https://platform.openai.com/api-keys"
echo "2. ANTHROPIC_API_KEY from https://console.anthropic.com"
echo "3. SLACK_WEBHOOK_URL from your Slack app settings"
echo ""
echo "Run these commands with your actual keys:"
echo 'railway variables --set "OPENAI_API_KEY=your-openai-key"'
echo 'railway variables --set "ANTHROPIC_API_KEY=your-anthropic-key"'
echo 'railway variables --set "SLACK_WEBHOOK_URL=your-slack-webhook"'

# CORS settings
railway variables --set "CORS_ORIGIN=https://your-frontend.vercel.app"
echo ""
echo "Remember to update CORS_ORIGIN with your actual Vercel frontend URL"

echo ""
echo "Environment setup complete! Run 'railway variables' to see all vars"