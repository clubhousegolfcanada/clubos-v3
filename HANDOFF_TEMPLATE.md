# 🤝 Session Handoff Template

Copy this template to CURRENT_WORK.md when ending a session:

```markdown
[HANDOFF] Session YYYY-MM-DD-XXX Summary
========================================

## What I Accomplished
- ✅ [Specific task completed]
- ✅ [Another task completed]
- 🚧 [Task partially done - X% complete]

## Current State
- System status: [Working/Broken/Partial]
- Active feature: [What's being built]
- Branch: [branch-name]
- Last commit: [hash or message]

## Blockers & Questions
- 🔴 [BLOCKED]: Need [specific thing] because [reason]
- ❓ [QUESTION]: Should we [option A] or [option B]?
- ⚠️ [ASSUMPTION]: Proceeded with [X] assuming [Y]

## Next Steps (Priority Order)
1. [Most important next task]
   - File: [where to work]
   - Approach: [how to do it]
2. [Second task]
3. [Third task]

## Files Modified
- `/path/to/file1.js` - [what changed]
- `/path/to/file2.tsx` - [what changed]
- `/path/to/file3.sql` - [what changed]

## Decisions Made
- [DECISION]: Chose [X] over [Y] because [reason]
- [PATTERN]: Established [pattern] for [use case]

## Context for Next Session
- Key understanding: [Important insight]
- Watch out for: [Potential issue]
- Reference: [Helpful doc or file]

## Commands to Run
```bash
# Get back to where I was
git checkout [branch]
npm install  # if dependencies changed
npm run migrate  # if DB changed
```

---
Time worked: X hours
Session health: Good/Challenging/Blocked
```

---

## 🎯 Quick Handoff (Minimal)

If short on time, at least include:

```markdown
[HANDOFF-QUICK] Session YYYY-MM-DD-XXX
- Did: [what you accomplished]
- Blocked: [what's stopping progress]
- Next: [immediate next step]
- Files: [main files touched]
```