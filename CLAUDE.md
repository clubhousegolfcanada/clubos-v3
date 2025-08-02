# CLAUDE.md - Quick Start for AI

## 🎯 NEW: Use Decision Tree Navigation
For specific tasks, use our new instruction system:
```bash
cat claude-instructions/README.md
```
It will guide you to the exact instructions you need!

## 🎯 Start Here (Every Session)
```bash
# 1. Check what we're working on
cat CURRENT_WORK.md

# 2. For specific tasks, use decision tree
cat claude-instructions/README.md

# 3. If starting fresh, check changelog
tail -20 CHANGELOG.md
```

## 📍 Current Project Status
- **Version**: 0.4.0 (V3 with V1 code integration)
- **Working**: Core message processing, SOPs, actions
- **Next**: Claude integration, real API connections

## 🔧 Before Coding
1. **Read CURRENT_WORK.md** - Shows active task
2. **Auto-create SESSION_LOG.md** - Track your work
3. **Follow AI_CODING_STANDARDS.md** - But here's the summary:
   - Comment complex code
   - Update docs when changing APIs
   - Commit with feat/fix/docs prefixes
   - Update CHANGELOG.md for significant changes

## 📁 Key Files
- `CURRENT_WORK.md` - What's being worked on NOW
- `SESSION_LOG.md` - Today's work log
- `CHANGELOG.md` - Recent changes
- `AI_CODING_STANDARDS.md` - Full AI rules (if needed)

## 🚀 Quick Commands
```bash
# See project structure
ls -la

# Check recent commits
git log --oneline -10

# Find specific functionality
grep -r "function_name" --include="*.js" --include="*.ts"

# Run tests
npm test

# Start development
npm run dev
```

## ⚡ Common Tasks

### Adding a Feature
1. Update CURRENT_WORK.md
2. Write code + tests
3. Update CHANGELOG.md
4. Clear CURRENT_WORK.md

### Fixing a Bug
1. Note in SESSION_LOG.md
2. Fix + add test
3. Update CHANGELOG.md
4. Commit with "fix:" prefix

### Updating Documentation
1. Change relevant /docs files
2. Update this file if needed
3. Commit with "docs:" prefix

## 🔴 Stop and Ask If
- Breaking changes needed
- Security concerns found
- External API keys required
- Unclear requirements

## 📝 End of Session
1. Update SESSION_LOG.md with summary
2. Clear or update CURRENT_WORK.md
3. Commit all changes
4. Note any blockers

---
*Keep this file under 100 lines so AI reads it fully*