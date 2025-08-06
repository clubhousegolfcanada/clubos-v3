# AI Coding Standards for ClubOS V3

## 🤖 Auto-Documentation Rules for AI Assistants

### ALWAYS Do These (Without Being Asked)

#### 1. After ANY Code Change
```bash
# AI should automatically:
1. Update CHANGELOG.md if feature/fix is significant
2. Add inline comments for complex logic
3. Update relevant API docs if endpoints changed
4. Create/update test files
```

#### 2. Start of Every Session
```markdown
# AI should immediately:
1. Read CLAUDE.md for context
2. Check CHANGELOG.md for recent changes
3. Review any TODO.md or CURRENT_WORK.md files
4. Create session log entry with timestamp
```

#### 3. End of Every Session
```markdown
# AI should automatically:
1. Update CLAUDE_CONTEXT.md with session summary
2. List all files changed in session log
3. Update TODO.md with next steps
4. Commit with descriptive message
```

## 📁 Auto-Maintained Files

### CLAUDE.md (Primary AI Context)
AI should update when:
- New patterns are established
- Major decisions are made
- Important context changes

### CURRENT_WORK.md
```markdown
# Current Work Status
Last Updated: [AI updates timestamp]

## Active Task
[AI describes what they're working on]

## Files Being Modified
- file1.js (reason)
- file2.ts (reason)

## Blockers
[AI lists any blockers encountered]

## Next Steps
[AI lists logical next steps]
```

### SESSION_LOG.md
```markdown
# Session Log: [Date]

## Work Completed
- [AI lists everything done]

## Decisions Made
- [AI documents any architectural/design decisions]

## Code Changes
- [AI lists all modified files with brief description]

## Tests
- [AI notes tests added/modified/run]
```

## 🔄 AI Workflow Patterns

### Pattern 1: Feature Implementation
```
1. Read relevant docs → 2. Update TODO.md → 3. Implement → 
4. Add tests → 5. Update docs → 6. Update CHANGELOG → 7. Commit
```

### Pattern 2: Bug Fix
```
1. Document bug in SESSION_LOG → 2. Fix → 3. Add regression test → 
4. Update CHANGELOG → 5. Check for similar issues → 6. Commit
```

### Pattern 3: Refactoring
```
1. Document reason in DECISIONS/ → 2. Update CURRENT_WORK.md → 
3. Refactor → 4. Ensure tests pass → 5. Update docs → 6. Commit
```

## 📝 Auto-Documentation Triggers

### Trigger → Action Mapping
- **New function** → Add JSDoc/TSDoc
- **New endpoint** → Update API docs
- **DB change** → Update schema docs
- **New service** → Create service readme
- **Config change** → Update .env.example
- **Major decision** → Create decision doc
- **Complex logic** → Add explanatory comments

## 🏷️ Smart Commit Messages

AI should generate commits like:
```bash
feat(sop): add validation for JSON schema
fix(auth): resolve token expiration issue
docs(api): update endpoint documentation
refactor(db): optimize query performance
test(actions): add retry logic tests
```

## 📊 Auto-Logging Format

### For Code Operations
```javascript
// AI adds logging automatically
logger.info('Feature: Starting SOP validation', {
  sopId: id,
  timestamp: new Date(),
  context: 'sop-validator'
});

try {
  // code
  logger.debug('SOP validated successfully', { sopId: id });
} catch (error) {
  logger.error('SOP validation failed', { 
    sopId: id, 
    error: error.message,
    stack: error.stack 
  });
}
```

### For Session Progress
```markdown
<!-- In SESSION_LOG.md -->
[10:32] Starting work on Claude integration
[10:45] Created new endpoint /api/claude/ingest
[11:02] Added validation middleware
[11:15] Tests passing, updating documentation
[11:20] Work complete, 4 files modified
```

## 🎯 AI Checklist (Run Automatically)

### Before Starting Task
- [ ] Read CLAUDE.md
- [ ] Check CURRENT_WORK.md
- [ ] Review related docs
- [ ] Create session entry

### During Task
- [ ] Comment complex code
- [ ] Update CURRENT_WORK.md when switching context
- [ ] Log important decisions
- [ ] Create tests alongside code

### After Completing Task
- [ ] Update documentation
- [ ] Update CHANGELOG.md if needed
- [ ] Clear CURRENT_WORK.md
- [ ] Commit with clear message
- [ ] Update CLAUDE_CONTEXT.md

## 🚨 AI Red Flags (Stop and Document)

1. **Breaking Change** → Create migration guide
2. **Security Issue** → Document in SECURITY.md
3. **Performance Problem** → Log metrics and solution
4. **External Dependency** → Update dependency docs
5. **Unclear Requirement** → Ask user and document answer

## 📋 File Templates for AI

### When Creating New Service
```javascript
/**
 * Service: [Name]
 * Purpose: [What it does]
 * Dependencies: [List external deps]
 * Created: [Date] by AI Session
 */

// AI adds comprehensive logging
const logger = require('../utils/logger');

class ServiceName {
  constructor() {
    logger.info('ServiceName initialized');
  }
  
  // AI adds JSDoc for all methods
  /**
   * Brief description
   * @param {Type} param - Description
   * @returns {Type} Description
   */
  method(param) {
    logger.debug('method called', { param });
    // implementation
  }
}
```

## 🔄 Version Management

AI automatically:
1. Increments version in package.json for releases
2. Tags commits with version when appropriate
3. Updates CHANGELOG.md with version sections
4. Creates release notes when asked to deploy

## 📍 Context Preservation

### Files AI Should Never Delete
- CLAUDE.md
- CLAUDE_CONTEXT.md
- CHANGELOG.md
- Any .env files
- Documentation files
- Test files

### Files AI Updates Every Session
- SESSION_LOG.md (create if missing)
- CURRENT_WORK.md (create if missing)
- CLAUDE_CONTEXT.md (append session notes)

---
*These standards ensure AI assistants maintain comprehensive documentation automatically, making the codebase self-documenting and easily understandable.*