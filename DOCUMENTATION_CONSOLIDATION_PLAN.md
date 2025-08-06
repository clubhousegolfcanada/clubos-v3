# Documentation Consolidation Plan

## Overview
This plan consolidates 40+ markdown files into a streamlined documentation structure that accurately reflects the current state of ClubOS V3.

## Current Problems
1. **Redundancy**: 5+ files about AI context
2. **Outdated Info**: Version mismatches, completed work shown as active
3. **Complexity**: Over-engineered breadcrumb system never used
4. **Confusion**: Planning docs mixed with current docs

## Proposed New Structure

### 1. Core Documentation (Keep & Update)
```
/CLUBOSV3/
├── README.md                    # Entry point, quick start
├── CHANGELOG.md                 # Version history
├── CONTRIBUTING.md              # Dev guide (NEW - consolidates 4 files)
├── DEPLOYMENT.md               # How to deploy
└── docs/
    ├── API.md                  # API reference
    ├── ARCHITECTURE.md         # System design
    ├── FEATURES.md            # Feature documentation
    └── TROUBLESHOOTING.md     # Common issues
```

### 2. Archive (Move to planning-archive/)
- V3_COMPREHENSIVE_AUDIT.md
- BREADCRUMB_SYSTEM.md
- HANDOFF_TEMPLATE.md
- All SESSION_LOG files
- HUSKY_SETUP.md
- Multiple planning documents

### 3. Delete (Redundant/Outdated)
- SETUP_VERIFICATION_REPORT.md (already deleted)
- SESSION_LOG_20250802.md (already deleted)
- NEW_CONTEXT_QUICKSTART.md
- CLAUDE_STARTUP_PROTOCOL.md

### 4. Consolidate

#### AI_CONTEXT.md (NEW - replaces 5 files)
Merge into one file with sections:
- Quick Reference (from CLAUDE.md)
- Project Context (from CLAUDE_MASTER_CONTEXT.md)
- Coding Standards (from AI_CODING_STANDARDS.md)
- Common Patterns (from AUTOMATIC_ASSUMPTIONS.md)

#### CONTRIBUTING.md (NEW - replaces 4 files)
Merge:
- NAMING_CONVENTIONS.md
- FLEXIBILITY_FRAMEWORK.md (simplified)
- Git workflow
- Testing requirements
- Code standards

### 5. Update These Files
- **CURRENT_WORK.md** - Mark completed work as done
- **ROADMAP_LIVE.md** - Update version to 0.7.0
- **PRODUCTION_READINESS_TODO.md** - Update completed items

## Implementation Steps

### Phase 1: Archive Old Files
```bash
mkdir -p planning-archive/2025-08-audit
mv V3_COMPREHENSIVE_AUDIT.md planning-archive/2025-08-audit/
mv BREADCRUMB_SYSTEM.md planning-archive/2025-08-audit/
mv HANDOFF_TEMPLATE.md planning-archive/2025-08-audit/
# ... etc
```

### Phase 2: Create Consolidated Files
1. Create AI_CONTEXT.md with all AI-related content
2. Create CONTRIBUTING.md with all dev guidelines
3. Update README.md to reference new structure

### Phase 3: Update Existing Files
1. Update version references to 0.7.0
2. Mark completed work as done
3. Remove references to deleted files

### Phase 4: Verify
1. Ensure all links work
2. No duplicate information
3. Clear navigation path

## Success Metrics
- Reduce from 40+ files to ~15 core files
- No conflicting version numbers
- Clear separation of current vs historical
- New developer can understand project in 30 minutes

## File Mapping

| Old Files | New Location |
|-----------|--------------|
| CLAUDE.md, CLAUDE_MASTER_CONTEXT.md, etc | → AI_CONTEXT.md |
| NAMING_CONVENTIONS.md, FLEXIBILITY_FRAMEWORK.md | → CONTRIBUTING.md |
| V3_COMPREHENSIVE_AUDIT.md | → planning-archive/ |
| BUILD_OPTIMIZATION.md | → docs/PERFORMANCE.md |
| TESTING_STRATEGY.md | → CONTRIBUTING.md (section) |

## Timeline
- Phase 1-2: 2 hours
- Phase 3-4: 1 hour
- Total: 3 hours

This consolidation will make the documentation match reality and be actually useful for development.