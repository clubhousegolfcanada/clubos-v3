#!/bin/bash
# ClubOS V3 Setup Script - Ensures consistent environment setup

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🚀 ClubOS V3 Setup Script"
echo "========================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command_exists psql; then
    echo -e "${RED}❌ PostgreSQL client is not installed${NC}"
    echo "Install with: brew install postgresql (Mac) or apt-get install postgresql-client (Linux)"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2)
MIN_NODE_VERSION="18.0.0"

if [ "$(printf '%s\n' "$MIN_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$MIN_NODE_VERSION" ]; then
    echo -e "${RED}❌ Node.js version must be >= 18.0.0 (found: $NODE_VERSION)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $NODE_VERSION${NC}"

# Setup environment file
echo -e "\n${YELLOW}Setting up environment...${NC}"

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env from .env.example${NC}"
    else
        # Create .env.example if it doesn't exist
        cat > .env.example << 'EOF'
# ClubOS V3 Environment Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/clubos_v3

# Authentication
JWT_SECRET=your-secret-key-here

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Anthropic (future use)
ANTHROPIC_API_KEY=sk-ant-your-claude-key
EOF
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env and .env.example${NC}"
    fi
    echo -e "${YELLOW}⚠️  Please update .env with your actual values${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Validate environment variables
echo -e "\n${YELLOW}Validating environment...${NC}"
node scripts/validate-env.js || {
    echo -e "${RED}❌ Environment validation failed${NC}"
    echo "Please check your .env file"
    exit 1
}

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Database setup
echo -e "\n${YELLOW}Setting up database...${NC}"

# Check if we can connect to the database
if [ -z "${DATABASE_URL:-}" ]; then
    source .env
fi

# Test database connection
psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1 || {
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo "Please ensure PostgreSQL is running and DATABASE_URL is correct"
    exit 1
}

echo -e "${GREEN}✓ Database connection successful${NC}"

# Run migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
npm run migrate
echo -e "${GREEN}✓ Migrations completed${NC}"

# Seed data (optional)
read -p "Do you want to seed test SOPs? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    psql "$DATABASE_URL" -f src/db/seed-sops.sql
    echo -e "${GREEN}✓ Test SOPs seeded${NC}"
fi

# Create admin user (optional)
read -p "Do you want to create an admin user? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    node scripts/create-admin.js
fi

# Final checks
echo -e "\n${YELLOW}Running final checks...${NC}"

# Test the server can start
timeout 5s npm start >/dev/null 2>&1 || true

# Check if port is available
if lsof -Pi :${PORT:-3001} -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Port ${PORT:-3001} is already in use${NC}"
fi

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "\nTo start the development server:"
echo -e "  ${YELLOW}npm run dev${NC}"
echo -e "\nTo run tests:"
echo -e "  ${YELLOW}npm test${NC}"
echo -e "\nTo check system health:"
echo -e "  ${YELLOW}npm run health-check${NC}"