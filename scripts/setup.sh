#!/bin/bash

echo "🚀 Setting up ClubOS V3..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version check passed${NC}"

# Install root dependencies
echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
npm install

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend && npm install && cd ..

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd frontend && npm install && cd ..

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update .env with your actual values${NC}"
fi

# Setup git hooks
echo -e "${YELLOW}🔗 Setting up git hooks...${NC}"
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run linting before commit
npm run lint
EOF
chmod +x .git/hooks/pre-commit

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
    echo -e "${YELLOW}🐳 Starting PostgreSQL and Redis...${NC}"
    docker-compose up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    sleep 5
    
    # Run migrations
    echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
    cd backend && npm run migrate && cd ..
else
    echo -e "${YELLOW}⚠️  Docker not found. Please install Docker to run PostgreSQL locally${NC}"
    echo -e "${YELLOW}   Or update DATABASE_URL in .env to use a remote database${NC}"
fi

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env with your API keys and configuration"
echo "2. Run 'npm run dev' to start both backend and frontend"
echo "3. Visit http://localhost:3000 for the frontend"
echo "4. Visit http://localhost:3001/health for the backend health check"
echo ""
echo "Useful commands:"
echo "- npm run dev          # Start development servers"
echo "- npm run docker:up    # Start PostgreSQL and Redis"
echo "- npm run migrate      # Run database migrations"
echo "- npm test            # Run tests"
echo "- npm run lint        # Run linting"