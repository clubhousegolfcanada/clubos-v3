# 🔗 Integration Check Protocol

## Before ANY Change, Claude Should:

### 1. Check Cross-Category Impact
```bash
# If adding a UI feature
cat claude-instructions/ui/INTEGRATIONS.md          # What APIs needed?
cat claude-instructions/features/INTEGRATIONS.md    # What backend changes?
cat claude-instructions/database/CONTEXT.md         # New fields needed?

# If adding an API
cat claude-instructions/features/INTEGRATIONS.md    # What depends on this?
cat claude-instructions/ui/INTEGRATIONS.md          # What UI uses this?
cat claude-instructions/database/CONTEXT.md         # Schema changes?

# If changing database
cat claude-instructions/database/INTEGRATIONS.md    # What breaks?
grep -r "table_name" claude-instructions/*/CONTEXT.md
```

### 2. Check Naming Consistency
```bash
# Before naming anything new
cat claude-instructions/features/NAMING.md   # API naming
cat claude-instructions/database/NAMING.md   # DB naming  
cat claude-instructions/ui/NAMING.md         # Component naming

# Check if name exists
grep -r "proposed_name" backend/
grep -r "proposed_name" frontend/
```

### 3. Update ALL Affected Categories
```bash
# After making change
echo "- $(date): [Change]" >> claude-instructions/{category}/CHANGELOG.md
# Update CONTEXT.md if patterns change
# Update INTEGRATIONS.md if connections change
```

## Example: Adding User Avatars

Claude would check:
1. `ui/CONTEXT.md` - Current UI components
2. `features/INTEGRATIONS.md` - Auth system integration
3. `database/CONTEXT.md` - Need avatar_url column?
4. `features/NAMING.md` - avatarUrl or avatar_url?
5. `ui/INTEGRATIONS.md` - File upload needed?

Then update:
- `database/CHANGELOG.md` - Added avatar_url column
- `features/CHANGELOG.md` - Added avatar upload endpoint
- `ui/CHANGELOG.md` - Added AvatarUpload component
- `features/INTEGRATIONS.md` - New storage dependency

## Red Flags 🚩
- Name doesn't match existing patterns
- Integration not documented
- Category changelog not updated
- Cross-category impact not checked
- No breadcrumb trail for future Claude

---
*Quality through context, not speed*