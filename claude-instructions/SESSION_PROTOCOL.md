# 📋 Claude Session Protocol

## 🚀 Starting a Session

### 1. Context Loading (5 min)
```bash
# Read in this exact order:
cat CLAUDE_MASTER_CONTEXT.md    # Project state
cat CURRENT_WORK.md              # Active tasks
cat .ai-rules                    # Execution rules

# If specific work area:
cat claude-instructions/README.md # Navigate to right docs
```

### 2. Look for Handoffs
Search for `[HANDOFF]` tags in:
- CURRENT_WORK.md
- Recent SESSION_LOG.md
- Category CHANGELOG.md files

### 3. Verify Understanding
Before coding, state:
- "I see we're working on: [task]"
- "Last session ended with: [status]"
- "I'll continue by: [next step]"

---

## 🔄 During Session

### Progress Updates (Every 30 min)
```markdown
[TIME] Progress Update:
- Working on: [current task]
- Completed: [what's done]
- Next: [what's next]
- Blockers: [if any]
```

### Decision Tagging
```markdown
[DECISION]: Chose X over Y because Z
[BLOCKED]: Cannot proceed - need human input on X
[QUESTION]: Should I implement X or Y?
[ASSUMPTION]: Proceeding with X based on pattern Y
```

### Breadcrumb Format
```javascript
// Add to relevant files
// [SESSION: 2025-08-01-001] Added user authentication
// [REASON: human_request] Operators need individual accounts
// [NEXT: Add role-based permissions]
```

---

## 🏁 Ending a Session

### 1. Update Master Context
```markdown
## Last Major Change
- Created user authentication system
- Session: 2025-08-01-001
- Files: /backend/src/routes/auth.js, /frontend/src/hooks/useAuth.ts
```

### 2. Create Handoff Section
```markdown
# In CURRENT_WORK.md

[HANDOFF] Session 2025-08-01-001 Summary
- Completed: User auth endpoints, JWT integration
- In Progress: Frontend auth forms (50% done)
- Blocked: Need decision on password requirements
- Next Steps:
  1. Complete frontend forms
  2. Add password validation
  3. Test auth flow
- Files Modified:
  - /backend/src/routes/auth.js (new)
  - /backend/src/services/authService.js (new)
  - /frontend/src/hooks/useAuth.ts (new)
```

### 3. Update Category Logs
```bash
# Add to relevant category
echo "- $(date): [What was done]" >> claude-instructions/features/CHANGELOG.md

# Update context if patterns changed
# Update integrations if connections added
```

### 4. Final Checklist
- [ ] All changes committed with clear messages
- [ ] Tests written for new features
- [ ] Documentation updated
- [ ] Handoff notes complete
- [ ] No [TEMP] or [TODO] without explanation

---

## 📊 Quality Markers

### Good Session
- Clear handoff for next Claude
- All decisions documented
- Breadcrumbs in modified files
- Progress tracked throughout
- Questions clearly marked

### Bad Session  
- No handoff notes
- Decisions made without tags
- Files modified without breadcrumbs
- Blockers not documented
- Context lost for next session

---

## 🎯 Special Protocols

### For Complex Features
```markdown
[FEATURE_START: feature-name]
- Description: What we're building
- Requested by: Who asked for it
- Complexity: Simple|Medium|Complex
- Approach: How we'll build it

[FEATURE_CHECKPOINT]
- Progress: X% complete
- Working: [what works]
- Issues: [any problems]

[FEATURE_END: feature-name]
- Result: What was built
- Testing: How to verify
- Docs: Where documented
```

### For Debugging
```markdown
[DEBUG_START: issue-description]
- Symptom: What's broken
- Hypothesis: Why it might be broken
- Approach: How to fix

[DEBUG_FINDING]
- Found: Root cause
- Fixed: What was changed

[DEBUG_END]
- Solution: Final fix
- Prevention: How to avoid
```

---

## 🔄 Continuous Improvement

After each session, consider:
1. Was the handoff clear enough?
2. Did breadcrumbs help or hinder?
3. Were decisions well-documented?
4. Any patterns to add to guides?

Update this protocol based on what works!

---
*Follow this protocol for seamless Claude-to-Claude handoffs*