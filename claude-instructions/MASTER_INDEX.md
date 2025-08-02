# 🗂️ Master Index - Claude Navigation

## Start Here Every Time
1. **Project State**: `/CLAUDE_MASTER_CONTEXT.md`
2. **Active Work**: `/CURRENT_WORK.md`
3. **Quick Rules**: `/.ai-rules`

---

## 📚 Core Documentation

### Project Level
- `/README.md` - Project overview
- `/CHANGELOG.md` - Version history  
- `/ROADMAP_LIVE.md` - What's planned
- `/PROJECT_STRUCTURE.md` - Directory layout
- `/DEPLOYMENT_GUIDE.md` - How to deploy

### Claude-Specific
- `/CLAUDE_MASTER_CONTEXT.md` - Source of truth
- `/claude-instructions/README.md` - Decision tree
- `/claude-instructions/SESSION_PROTOCOL.md` - How to work
- `/BREADCRUMB_SYSTEM.md` - How to document
- `/HANDOFF_TEMPLATE.md` - Session endings

### Planning & Decisions
- `/V3_COMPREHENSIVE_AUDIT.md` - System audit plan
- `/FLEXIBILITY_FRAMEWORK.md` - When to add features
- `/docs/DECISIONS/` - All major decisions
- `/planning-archive/` - Historical context

---

## 🧭 Navigation by Task

### Adding Features
→ `/claude-instructions/features/START.md`

### Fixing Bugs  
→ `/claude-instructions/fixes/START.md`

### Deployment
→ `/claude-instructions/deployment/START.md`

### Testing
→ `/claude-instructions/testing/START.md`

### Architecture
→ `/claude-instructions/architecture/START.md`

---

## 🔍 Quick Lookups

### Patterns & Standards
- `/NAMING_CONVENTIONS.md` - **Universal naming guide**
- `/claude-instructions/COMMON_PATTERNS.md` - Copy-paste code
- `/claude-instructions/*/NAMING.md` - Category-specific naming
- `/claude-instructions/HIGH_LEVERAGE.md` - Speed patterns
- `/claude-instructions/QUICK_WINS.md` - Productivity tips

### Context by Category
- `/claude-instructions/features/CONTEXT.md`
- `/claude-instructions/database/CONTEXT.md`
- `/claude-instructions/ui/CONTEXT.md`
- `/claude-instructions/*/INTEGRATIONS.md`

### Logic & Rules
- `/claude-instructions/LOGIC_IMPROVEMENTS.md` - Available improvements
- `/claude-instructions/REVISED_LOGIC_PRINCIPLES.md` - Flexible approach
- `/claude-instructions/FLEXIBLE_APPROACH.md` - When to break rules

---

## 📊 Status Tracking

### Work Progress
- `/CURRENT_WORK.md` - What's active now
- `/SESSION_LOG.md` - Today's work
- `/claude-instructions/*/CHANGELOG.md` - Category histories

### System Health
- `/backend/src/db/migrations/` - Database state
- `/docs/API/` - API documentation
- `/.env.example` - Required configuration

---

## 🚨 Important Files

### Never Delete
- `CLAUDE_MASTER_CONTEXT.md`
- `.ai-rules`
- Any `CHANGELOG.md`
- Any `CONTEXT.md`

### Always Update
- `CURRENT_WORK.md` - During work
- Category `CHANGELOG.md` - After changes
- `CLAUDE_MASTER_CONTEXT.md` - Major changes only

---

## 🔄 Daily Workflow

### Morning
1. Read `CLAUDE_MASTER_CONTEXT.md`
2. Check `CURRENT_WORK.md`
3. Look for `[HANDOFF]` tags

### During Work
1. Follow `/claude-instructions/SESSION_PROTOCOL.md`
2. Leave breadcrumbs per `/BREADCRUMB_SYSTEM.md`
3. Update progress every 30 minutes

### End of Day
1. Use `/HANDOFF_TEMPLATE.md`
2. Update relevant `CHANGELOG.md` files
3. Clear or update `CURRENT_WORK.md`

---

## 🆘 When Stuck

### Can't find something?
```bash
grep -r "search term" . --include="*.md"
```

### Don't understand context?
1. Check `/planning-archive/` for history
2. Look for `[DECISION]` tags
3. Review `/docs/DECISIONS/`

### Need patterns?
1. `/claude-instructions/COMMON_PATTERNS.md`
2. Find similar code: `grep -r "pattern"`
3. Copy and modify

---
*This index is the map to everything Claude needs*