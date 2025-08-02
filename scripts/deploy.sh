#!/bin/bash

echo "🚀 Deploying ClubOS V3..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check environment
if [ -z "$1" ]; then
    echo -e "${RED}❌ Please specify environment: ./deploy.sh [staging|production]${NC}"
    exit 1
fi

ENV=$1

# Validate environment
if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
    echo -e "${RED}❌ Invalid environment. Use 'staging' or 'production'${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Building applications...${NC}"

# Build backend
echo -e "${YELLOW}🔧 Building backend...${NC}"
cd backend
npm run build 2>/dev/null || echo "No build step for backend"
cd ..

# Build frontend
echo -e "${YELLOW}🎨 Building frontend...${NC}"
cd frontend
npm run build
cd ..

# Deploy based on environment
if [ "$ENV" = "production" ]; then
    echo -e "${YELLOW}🚂 Deploying backend to Railway (production)...${NC}"
    railway up -e production
    
    echo -e "${YELLOW}▲ Deploying frontend to Vercel (production)...${NC}"
    vercel --prod
else
    echo -e "${YELLOW}🚂 Deploying backend to Railway (staging)...${NC}"
    railway up -e staging
    
    echo -e "${YELLOW}▲ Deploying frontend to Vercel (staging)...${NC}"
    vercel
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Post-deployment checklist:"
echo "1. Check Railway logs: railway logs"
echo "2. Check Vercel deployment: vercel ls"
echo "3. Run health check on deployed backend"
echo "4. Test critical user flows"
echo "5. Monitor error logs for first 30 minutes"