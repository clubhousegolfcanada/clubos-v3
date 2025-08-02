#!/bin/bash

# ClubOS V2 Directory Organization Script
# This script reorganizes the current V2 files into a clean structure

echo "🏗️ ClubOS V2 Directory Reorganization"
echo "====================================="
echo ""

# Create new directory structure
echo "📁 Creating organized directory structure..."

# Documentation directories
mkdir -p docs/architecture
mkdir -p docs/planning
mkdir -p docs/api
mkdir -p docs/deployment

# Backend directories
mkdir -p backend/src/{config,controllers,middleware,services,models,routes,utils}
mkdir -p backend/src/services/{routing,knowledge,assistants,intelligence}
mkdir -p backend/{tests,migrations}

# Frontend directories
mkdir -p frontend/src/app/{login,tickets,messages,intelligence,operations}
mkdir -p frontend/src/components/{ui,features,layouts}
mkdir -p frontend/src/{hooks,services,state,styles}
mkdir -p frontend/public

# Shared directories
mkdir -p shared/{types,constants,utils}

# Scripts directories
mkdir -p scripts/{setup,migration,deployment,testing}

# Infrastructure directories
mkdir -p infrastructure/{docker,kubernetes,terraform}

echo "✅ Directory structure created"
echo ""

# Move existing planning documents
echo "📄 Organizing planning documents..."

# Move architecture docs
mv ASSISTANT_ARCHITECTURE_V3_WITH_GENERAL.md docs/architecture/assistants.md 2>/dev/null || echo "  - assistants.md already moved"
mv ENHANCED_ROUTING_ARCHITECTURE.md docs/architecture/routing.md 2>/dev/null || echo "  - routing.md already moved"
mv CENTRAL_KNOWLEDGE_PROCESSOR.md docs/architecture/knowledge.md 2>/dev/null || echo "  - knowledge.md already moved"
mv CLAUDE_INTELLIGENCE_ENGINE_ENHANCED.md docs/architecture/intelligence.md 2>/dev/null || echo "  - intelligence.md already moved"

# Move planning docs
mv V2_DATABASE_FIRST_ARCHITECTURE.md docs/planning/database-design.md 2>/dev/null || echo "  - database-design.md already moved"
mv INFRASTRUCTURE_DEPLOYMENT_PLAN.md docs/planning/infrastructure.md 2>/dev/null || echo "  - infrastructure.md already moved"
mv SAFE_EXECUTION_FRAMEWORK.md docs/planning/safe-execution.md 2>/dev/null || echo "  - safe-execution.md already moved"
mv STRATEGIC_IMPLEMENTATION_SAFEGUARDS.md docs/planning/strategy.md 2>/dev/null || echo "  - strategy.md already moved"
mv V1_TO_V2_UI_MIGRATION_PLAN.md docs/planning/ui-migration.md 2>/dev/null || echo "  - ui-migration.md already moved"
mv FAST_RESPONSE_ARCHITECTURE.md docs/planning/performance.md 2>/dev/null || echo "  - performance.md already moved"
mv CLUBOS_ROUTING_LOGIC.md docs/planning/routing-logic.md 2>/dev/null || echo "  - routing-logic.md already moved"
mv GPT4O_ARCHITECTURE_REVIEW.md docs/planning/architecture-review.md 2>/dev/null || echo "  - architecture-review.md already moved"
mv PRE_LAUNCH_REQUIREMENTS.md docs/planning/requirements.md 2>/dev/null || echo "  - requirements.md already moved"
mv MASTER_PLAN.md docs/planning/master-plan.md 2>/dev/null || echo "  - master-plan.md already moved"

echo "✅ Planning documents organized"
echo ""

# Create essential base files
echo "📝 Creating base configuration files..."

# Create root package.json
cat > package.json << 'EOF'
{
  "name": "clubos-v2",
  "version": "2.0.0",
  "description": "ClubOS V2 - AI-Powered Golf Facility Management",
  "private": true,
  "workspaces": [
    "backend",
    "frontend",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend",
    "build:shared": "cd shared && npm run build",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "eslint": "^8.57.0",
    "typescript": "^5.3.0"
  }
}
EOF

# Create README
cat > README.md << 'EOF'
# ClubOS V2

AI-Powered Golf Facility Management System with Self-Improving Intelligence

## Architecture

- **7 Specialized AI Assistants** with hybrid routing
- **<2 second response time** through tiered caching
- **Self-improving system** through Claude intelligence engine
- **Full trace visibility** with unique trace IDs
- **PostgreSQL-first** architecture

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run migrations
npm run migrate

# Start development
npm run dev
```

## Documentation

See `/docs` for comprehensive documentation:
- `/docs/architecture` - System design
- `/docs/planning` - Implementation plans
- `/docs/api` - API documentation
- `/docs/deployment` - Deployment guides

## Directory Structure

```
CLUBOSV2/
├── backend/     # Express API
├── frontend/    # Next.js App
├── shared/      # Shared types
├── scripts/     # Automation
└── docs/        # Documentation
```
EOF

# Create CHANGELOG
cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to ClubOS V2 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planning Phase - 2024-07-30
#### Added
- Master plan and directory structure
- 7-assistant architecture design
- Hybrid routing system (keyword + semantic)
- Central knowledge processor
- Fast response architecture (<2s target)
- Claude intelligence engine
- Safe execution framework
- Infrastructure and deployment planning

#### Changed
- Moved from file-based to PostgreSQL-first approach
- Enhanced routing with trace IDs throughout
- Split BrandTone into specialized assistants

#### Security
- Implemented Write-Ahead Logging (WAL)
- Added SHA validation for all changes
- Created git branch isolation for Claude
- Structured reasoning logs required
EOF

# Create gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Production
build/
dist/
.next/
out/

# Environment
.env
.env.local
.env.production

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store
*.swp
.thumbs.db

# IDE
.vscode/
.idea/
*.sublime-*

# Testing
coverage/
.nyc_output/

# Misc
.cache/
.temp/
*.backup
*.tmp
EOF

echo "✅ Base configuration files created"
echo ""

# Create organization summary
cat > docs/planning/current-status.md << 'EOF'
# ClubOS V2 Current Status

## Planning Phase Complete ✅

### Architecture Decisions
1. **7 AI Assistants**: Emergency, Booking, Tech, Strategy, CustomerInfo, BrandVoice, General
2. **Hybrid Routing**: Keywords for speed + Semantic for accuracy
3. **Database-First**: PostgreSQL with vector embeddings
4. **Fast Response**: 4-tier caching strategy
5. **Self-Improving**: Claude analyzes failures → suggests improvements

### Key Innovations
- **Trace IDs**: Full request tracking
- **Central Knowledge Processor**: All knowledge classified before routing
- **Smart Slack Routing**: Different channels for different teams
- **Recursive Learning**: Every interaction improves the system

### Safety Measures
- Write-Ahead Logging (WAL)
- SHA validation
- Git branch isolation
- Structured reasoning logs
- Manual approval gates

## Next Steps
1. Set up development environment
2. Initialize databases
3. Begin Phase 1 implementation
4. Migrate V1 components

## File Organization
All planning documents have been organized into:
- `/docs/architecture/` - System design documents
- `/docs/planning/` - Implementation plans
- Original files backed up if needed
EOF

echo ""
echo "📊 Organization Summary:"
echo "----------------------"
echo "✅ Created organized directory structure"
echo "✅ Moved planning documents to /docs"
echo "✅ Created base configuration files"
echo "✅ Set up workspace structure"
echo ""
echo "📋 Next Steps:"
echo "1. Review /docs/planning/master-plan.md"
echo "2. Set up development environment"
echo "3. Initialize backend and frontend packages"
echo "4. Begin Phase 1 implementation"
echo ""
echo "🎉 V2 directory organization complete!"