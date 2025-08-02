# 🏗️ Architecture Changes - START HERE

## Before Any Architecture Change
```bash
# Review current architecture
cat docs/ARCHITECTURE/*.md

# Check for similar patterns
grep -r "pattern_name" backend/src/

# Document decision
echo "Decision: [title]" > docs/DECISIONS/$(date +%Y-%m-%d)-decision.md
```

## Architecture Tasks

### 1. Adding New Services
→ Read: [`new-services.md`](./new-services.md)
- Service patterns
- Integration points
- Testing strategy

### 2. Refactoring Code
→ Read: [`refactoring.md`](./refactoring.md)
- Safe refactoring
- Incremental changes
- Testing approach

### 3. Performance Optimization
→ Read: [`performance.md`](./performance.md)
- Profiling first
- Optimization strategies
- Measuring impact

### 4. Security Improvements
→ Read: [`security.md`](./security.md)
- Security patterns
- Auth improvements
- Data protection

## Architecture Principles

### 1. Document First
- Write ADR (Architecture Decision Record)
- Explain why, not just what
- Consider alternatives

### 2. Incremental Changes
- Small, testable chunks
- Feature flags for big changes
- Rollback plan ready

### 3. Maintain Compatibility
- Don't break existing APIs
- Deprecate gracefully
- Version appropriately

## Decision Template
```markdown
# [Short Title]
Date: YYYY-MM-DD
Status: Proposed

## Context
[Why we need this change]

## Decision
[What we're going to do]

## Consequences
[What happens as a result]
```

---
*Choose your architecture task above*