#!/bin/bash
echo "🚀 Setting up ClubOS V2..."

# Create core directory structure
mkdir -p Core UI LLM API DB Logs Scripts Notes Public Assistants SOPs Tests Config

# Initialize git
git init

# .gitignore for sensitive and non-tracked files
cat > .gitignore << EOF
node_modules/
.env
.env.local
Logs/
*.log
EOF

# Create base README
cat > Notes/README.md << EOF
# ClubOS V2

This repo contains the AI-powered infrastructure for autonomous 24/7 golf simulator operations.

## Quick Start
1. Run './Scripts/setup-v2.sh'
2. Configure environment variables in Config/env.template
3. Begin build with './Scripts/run_clubos_plan.sh'
EOF

echo "✅ Base structure and README created"
