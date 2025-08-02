# 🚀 Claude Startup Protocol

## When You Type `claude` in Warp

### What Happens Automatically:
1. **Claude reads key context files** (built into the system)
   - Project type, version, current state
   - Recent work and handoffs
   - Active tasks and blockers

2. **Claude is ready with:**
   - Full project context (ClubOS V3, v0.4.0)
   - Knowledge of what was last worked on
   - Understanding of patterns and conventions
   - Ready to continue or start new work

### Your First Message Options:

#### Option 1: Continue Previous Work
```
"Continue"
```
Claude will:
- Check CURRENT_WORK.md for HANDOFF
- Resume exactly where last session ended
- Update SESSION_LOG.md automatically

#### Option 2: Start Specific Task
```
"Add user authentication"
"Fix the login timeout"
"Deploy to staging"
```
Claude will:
- Navigate to appropriate docs
- Check for existing patterns
- Start implementation
- Log everything in SESSION_LOG.md

#### Option 3: Status Check
```
"Status"
"What's the current state?"
```
Claude will:
- Summarize from CLAUDE_MASTER_CONTEXT.md
- Show active work from CURRENT_WORK.md
- List any blockers

---

## 📊 Automatic Logging

### Claude Automatically Logs:

1. **Session Start**
   ```markdown
   [SESSION: 2025-08-01-001] Started at 14:30
   [CONTEXT] Read CURRENT_WORK.md, found active task: user auth
   ```

2. **During Work** (every 30 min)
   ```markdown
   [PROGRESS: 14:45] Completed auth endpoints, testing
   [DECISION] Chose JWT over sessions for stateless auth
   ```

3. **File Changes**
   ```markdown
   [MODIFIED] /backend/src/routes/auth.js - Added login endpoint
   [CREATED] /backend/src/services/authService.js - Auth logic
   ```

4. **Session End**
   ```markdown
   [HANDOFF] Session 2025-08-01-001 Summary
   - Completed: Auth endpoints, JWT integration
   - Blocked: Need password requirements decision
   - Next: Frontend auth forms
   ```

---

## 🎯 The Complete Picture

### You Get:
1. **Instant Context** - Claude knows everything immediately
2. **Automatic Logging** - Every action tracked
3. **Perfect Handoffs** - Next session continues seamlessly
4. **Full Traceability** - Can trace any decision back

### Claude Has:
1. **Project Knowledge** - Architecture, patterns, conventions
2. **Historical Context** - What's been done, why
3. **Current State** - Active work, blockers
4. **Navigation Skills** - Knows where to find everything

---

## 📝 What Gets Logged Where

### SESSION_LOG.md
- Daily work summary
- Decisions made
- Files changed
- Progress markers

### Category CHANGELOG.md
- Feature additions
- Pattern changes
- Integration updates

### CURRENT_WORK.md
- Active task (updated live)
- Handoff notes
- Blockers

### Breadcrumbs in Code
```javascript
// [SESSION: 2025-08-01-001] Added auth endpoints
// [REASON: human_request] Users need individual accounts
// [NEXT: Add role permissions]
```

---

## ✅ Success Metrics

You know it's working when:
1. Claude starts coding within 60 seconds
2. No context questions needed
3. Logs are automatically updated
4. Handoffs are seamless
5. You can trace any decision

---

## 🔑 The Key Insight

**The system front-loads context so you can focus on building, not explaining.**

When you open Warp and type `claude`:
- Context is loaded ✓
- Patterns are known ✓
- Work is logged ✓
- Progress is tracked ✓

You just say what you want done!

---
*This protocol ensures maximum context with minimum friction*