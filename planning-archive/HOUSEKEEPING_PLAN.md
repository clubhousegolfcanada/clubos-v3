# Housekeeping Plan for ClubOS V3 Root Folder

## Files to Consolidate/Archive

### Booking Platform Documents (Now consolidated into BOOKING_PLATFORM_COMPREHENSIVE_PLAN.md)
These files can be moved to an archive folder since their content is now in the comprehensive plan:
- V3_BOOKING_COMPONENTS_BREAKDOWN.md
- V3_BOOKING_DECISION_MATRIX.md
- V3_BOOKING_PLATFORM_ANALYSIS.md
- V3_BOOKING_REVISED_STRATEGY.md
- BOOKING_PLATFORM_ARCHITECTURE.md
- BOOKING_PLATFORM_IMPLEMENTATION_GUIDE.md
- BOOKING_PLATFORM_MASTER_PLAN.md

### Mike Brain Files (Experimental features not in current scope)
These can be moved to planning-archive:
- mike-brain-api.js
- mike-brain-engine.js
- mike-brain-examples.md
- mike-brain-implementation.js
- MIKE-BELIEF-TO-CODE.md
- MIKE-COMPLETE-DECISION-FRAMEWORK.md
- MIKE-LLM-IMPLEMENTATION-GUIDE.md
- MIKE-LLM-SYSTEM-PROMPT.md
- MIKE-LLM-TRAINING-EXAMPLES.jsonl
- MIKE-REAL-EXAMPLES.md
- MIKE-STEP-BY-STEP-THINKING.md
- MIKE_BRAIN_INTEGRATION_PLAN.md

### Session Logs (Keep current, archive old)
- SESSION_LOG_20250802.md → Can be archived after today
- SESSION_LOG.md → Keep as active

### Frontend Test Examples
- FRONTEND_TEST_EXAMPLES.md → Move to frontend/docs/

### Deployment/Operations Duplicates
Check if these have overlapping content:
- DEPLOYMENT_CHECKLIST.md
- DEPLOYMENT_GUIDE.md
- docs/DEPLOYMENT_RUNBOOK.md
- docs/OPERATIONS_MANUAL.md

## Files to Keep in Root
Essential files that should remain:
- README.md
- CHANGELOG.md
- CLAUDE.md (AI instructions)
- CURRENT_WORK.md
- ROADMAP_LIVE.md
- BOOKING_PLATFORM_COMPREHENSIVE_PLAN.md (future reference)
- Core configuration files (package.json, docker-compose.yml, etc.)

## Recommended Actions
1. Create `planning-archive/booking-platform/` folder
2. Move old booking documents there
3. Create `planning-archive/mike-brain/` folder
4. Move Mike brain files there
5. Update any references in remaining documents

Would you like me to proceed with this housekeeping?