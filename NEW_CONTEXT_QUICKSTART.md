# 🚀 New Context Window Quick Start

## For You (Human) - Just Say:

```
"Continue" - Resume previous work
"Fix [issue]" - Debug something
"Add [feature]" - Build new feature
"Deploy" - Ship to staging/prod
"Status" - Get project state
```

Claude already read the README and knows to check the key files.

---

## For Claude - Automatic Execution Path

### Step 1: Check Rules & Current State (30 seconds)
```bash
cat .ai-rules                    # 6 simple rules
cat CURRENT_WORK.md             # What's active?
```

### Step 2: Get Project Context (30 seconds)
```bash
cat CLAUDE_MASTER_CONTEXT.md    # Project state
grep -n "HANDOFF" CURRENT_WORK.md  # Previous work
```

### Step 3: Navigate to Task (if specific)
```bash
# Based on user request:
# "add X" → cat claude-instructions/features/START.md
# "fix Y" → cat claude-instructions/fixes/START.md
# "deploy" → cat claude-instructions/deployment/START.md
```

### Step 4: Confirm Understanding
Claude should say something like:
```
"I see we're working on ClubOS V3, currently at version 0.4.0. 
The last session [completed X/was working on Y]. 
Should I [continue with Y/start something new]?"
```

---

## 🎯 Quick Reference Card

### If You Want Claude To:

**Continue previous work:**
```
"Continue where we left off"
```
→ Claude reads HANDOFF section

**Start new feature:**
```
"Add [feature name]"
```
→ Claude navigates to `/features/START.md`

**Fix something:**
```
"Fix [problem]"
```
→ Claude navigates to `/fixes/START.md`

**Deploy:**
```
"Deploy to staging"
```
→ Claude navigates to `/deployment/START.md`

**Check project status:**
```
"What's the current status?"
```
→ Claude summarizes from CLAUDE_MASTER_CONTEXT.md

---

## 🔥 Speed Run (< 1 minute)

### Fastest Possible Start:
```
Human: "Add user avatars feature"

Claude will:
1. cat .ai-rules (10s)
2. cat CURRENT_WORK.md (10s)
3. cat claude-instructions/features/START.md (10s)
4. grep -r "avatar" . --include="*.js" --include="*.ts" (10s)
5. Start coding within 60 seconds
```

---

## 📋 What Claude Gets From Each File

| File | Claude Learns | Time |
|------|---------------|------|
| README.md | Project overview, where to look next | 10s |
| .ai-rules | 6 execution principles | 10s |
| CURRENT_WORK.md | Active tasks, blockers | 20s |
| CLAUDE_MASTER_CONTEXT.md | System state, architecture | 30s |
| category/START.md | Specific task instructions | 20s |

**Total: ~90 seconds to full context**

---

## 🚨 If Claude Seems Lost

You can say:
```
"Check CLAUDE_MASTER_CONTEXT.md for project state"
```

Or more specific:
```
"Check the handoff in CURRENT_WORK.md"
"Look at the breadcrumbs in [filename]"
"Check the last SESSION_LOG.md"
```

---

## ✅ Success Indicators

Claude is properly oriented when it:
1. ✓ Knows the version (0.4.0)
2. ✓ Knows what was last worked on
3. ✓ Asks relevant follow-up questions
4. ✓ References specific files/patterns
5. ✓ Starts working within 2 minutes

---

## 🎪 The Magic Words

**Just the task:**
```
"Add user authentication"
"Fix the timeout bug"
"Deploy to staging"
"Continue"
```

**With context:**
```
"Continue working on [feature]"
"Debug the [specific issue]"
```

**Status check:**
```
"What's the current status?"
"What was the last handoff?"
```

---
*This system means you never need to explain context - just point Claude to the README*