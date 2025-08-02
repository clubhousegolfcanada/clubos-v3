# 🧭 Context & Breadcrumb System

## Overview
Each category maintains its own changelog, context, and integration map to ensure Claude never loses track of the bigger picture.

## Structure Per Category

```
/claude-instructions/features/
├── CHANGELOG.md          # What's been built here
├── CONTEXT.md           # Current state & patterns
├── INTEGRATIONS.md      # What connects to what
├── NAMING.md            # Naming conventions
└── *.md                 # Specific instructions
```

## How Claude Should Work

### 1. Before ANY Task
```bash
# Check category context
cat claude-instructions/{category}/CONTEXT.md
cat claude-instructions/{category}/INTEGRATIONS.md
```

### 2. During Task
```bash
# Follow naming conventions
cat claude-instructions/{category}/NAMING.md

# Check what might be affected
grep -r "feature_name" claude-instructions/*/INTEGRATIONS.md
```

### 3. After Task
```bash
# Update category changelog
echo "- $(date): Added [feature]" >> claude-instructions/{category}/CHANGELOG.md

# Update integrations if needed
# Update context if patterns change
```

## The Breadcrumb Trail

### Level 1: Project Context
- `CLAUDE.md` - Entry point
- `CURRENT_WORK.md` - Active work

### Level 2: Category Context  
- `{category}/CONTEXT.md` - Area state
- `{category}/CHANGELOG.md` - Area history

### Level 3: Feature Context
- `{category}/INTEGRATIONS.md` - Connections
- `{category}/NAMING.md` - Conventions

### Level 4: Task Execution
- Specific instruction files

## Example Flow

User: "Add user avatar upload"

Claude thinks:
1. Feature → `/features/CONTEXT.md` (understand current UI state)
2. Check → `/features/INTEGRATIONS.md` (auth system, storage)
3. Check → `/database/CONTEXT.md` (need new column?)
4. Check → `/features/NAMING.md` (userAvatar or user_avatar?)
5. Execute with full context
6. Update all affected CHANGELOGs

## Benefits
- Never lose context between sessions
- Always know what integrates with what
- Consistent naming across codebase
- Clear history of what's been done
- Easy to see impact of changes

---
*This system ensures quality over speed*