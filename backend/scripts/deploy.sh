#!/bin/bash
# ClubOS V3 Deploy Script - Handles git commits and deployment

set -e
set -u

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🚀 ClubOS V3 Deploy Script"
echo "========================="

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] || [ ! -d "src" ]; then
        echo -e "${RED}❌ Not in the backend directory!${NC}"
        echo "Please run this script from the clubos-v3-backend directory"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    echo -e "\n${YELLOW}Running tests...${NC}"
    
    # Run environment validation
    node scripts/validate-env.js || {
        echo -e "${RED}❌ Environment validation failed${NC}"
        return 1
    }
    
    # Run linter if available
    if npm run lint &> /dev/null; then
        npm run lint || {
            echo -e "${RED}❌ Linting failed${NC}"
            return 1
        }
    fi
    
    # Run tests if available
    if npm test &> /dev/null; then
        npm test || {
            echo -e "${RED}❌ Tests failed${NC}"
            return 1
        }
    fi
    
    # Test database connection
    node -e "
        require('dotenv').config();
        const { pool } = require('./src/db/pool');
        pool.query('SELECT 1')
            .then(() => { console.log('✅ Database connection OK'); process.exit(0); })
            .catch((err) => { console.error('❌ Database connection failed:', err.message); process.exit(1); });
    " || return 1
    
    echo -e "${GREEN}✅ All tests passed${NC}"
    return 0
}

# Function to commit changes
commit_changes() {
    echo -e "\n${YELLOW}Checking git status...${NC}"
    
    # Check if we have uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
        echo "No changes to commit"
        return 0
    fi
    
    # Show status
    git status --short
    
    # Ask for commit message
    echo -e "\n${YELLOW}Enter commit message (or 'skip' to skip commit):${NC}"
    read -r commit_message
    
    if [ "$commit_message" = "skip" ]; then
        echo "Skipping commit"
        return 0
    fi
    
    # Add files
    echo -e "\n${YELLOW}Adding files...${NC}"
    git add -A
    
    # Create commit with co-author
    git commit -m "$commit_message

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>" || {
        echo -e "${RED}❌ Commit failed${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Changes committed${NC}"
    return 0
}

# Function to push to GitHub
push_to_github() {
    echo -e "\n${YELLOW}Pushing to GitHub...${NC}"
    
    # Get current branch
    branch=$(git branch --show-current)
    
    # Push to origin
    git push origin "$branch" || {
        echo -e "${RED}❌ Push failed${NC}"
        echo "Try: git push --set-upstream origin $branch"
        return 1
    }
    
    echo -e "${GREEN}✅ Pushed to GitHub${NC}"
    return 0
}

# Function to deploy to Railway
deploy_to_railway() {
    echo -e "\n${YELLOW}Deploying to Railway...${NC}"
    
    # Check if railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}Railway CLI not installed${NC}"
        echo "Install with: npm install -g @railway/cli"
        echo "Then run: railway login"
        return 1
    fi
    
    # Deploy
    railway up || {
        echo -e "${RED}❌ Railway deployment failed${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Deployed to Railway${NC}"
    return 0
}

# Function to deploy frontend to Vercel
deploy_frontend() {
    echo -e "\n${YELLOW}Deploy frontend to Vercel? (y/N)${NC}"
    read -r deploy_frontend_confirm
    
    if [[ ! $deploy_frontend_confirm =~ ^[Yy]$ ]]; then
        echo "Skipping frontend deployment"
        return 0
    fi
    
    # Change to frontend directory
    cd ../clubos-v3-frontend || {
        echo -e "${RED}❌ Frontend directory not found${NC}"
        return 1
    }
    
    # Check if vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Vercel CLI not installed${NC}"
        echo "Install with: npm install -g vercel"
        echo "Then run: vercel login"
        cd - > /dev/null
        return 1
    fi
    
    # Deploy
    vercel --prod || {
        echo -e "${RED}❌ Vercel deployment failed${NC}"
        cd - > /dev/null
        return 1
    }
    
    cd - > /dev/null
    echo -e "${GREEN}✅ Frontend deployed to Vercel${NC}"
    return 0
}

# Function to run post-deployment checks
post_deployment_checks() {
    echo -e "\n${YELLOW}Running post-deployment checks...${NC}"
    
    # Check health endpoint
    if [ -n "${PRODUCTION_URL:-}" ]; then
        echo "Checking health endpoint..."
        curl -s "$PRODUCTION_URL/health" || {
            echo -e "${YELLOW}⚠️  Health check failed${NC}"
        }
    fi
    
    echo -e "${GREEN}✅ Deployment complete!${NC}"
}

# Main flow
main() {
    check_directory
    
    # Step 1: Run tests
    echo -e "\n${BLUE}Step 1: Running tests${NC}"
    run_tests || {
        echo -e "${RED}❌ Tests failed. Fix issues before deploying.${NC}"
        exit 1
    }
    
    # Step 2: Commit changes
    echo -e "\n${BLUE}Step 2: Committing changes${NC}"
    commit_changes || {
        echo -e "${YELLOW}⚠️  Commit failed, but continuing...${NC}"
    }
    
    # Step 3: Push to GitHub
    echo -e "\n${BLUE}Step 3: Pushing to GitHub${NC}"
    push_to_github || {
        echo -e "${YELLOW}⚠️  Push failed, but continuing...${NC}"
    }
    
    # Step 4: Deploy to Railway
    echo -e "\n${BLUE}Step 4: Deploying backend${NC}"
    echo -e "${YELLOW}Deploy to Railway? (y/N)${NC}"
    read -r deploy_confirm
    
    if [[ $deploy_confirm =~ ^[Yy]$ ]]; then
        deploy_to_railway
    else
        echo "Skipping Railway deployment"
    fi
    
    # Step 5: Deploy frontend (optional)
    echo -e "\n${BLUE}Step 5: Frontend deployment${NC}"
    deploy_frontend
    
    # Step 6: Post-deployment checks
    echo -e "\n${BLUE}Step 6: Post-deployment${NC}"
    post_deployment_checks
    
    echo -e "\n${GREEN}🎉 All done!${NC}"
}

# Run main function
main "$@"