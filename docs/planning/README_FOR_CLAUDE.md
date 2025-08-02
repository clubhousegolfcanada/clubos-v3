# 🤖 README for Claude - ClubOS V3 Development (Evolved from V2)

## Start Here EVERY Time

When you (Claude) start a new chat session for ClubOS V3 development:

### 1. First Words to User
```
"I'll help with ClubOS V3. Let me check the current progress..."
```

### 2. Read These Files (In Order)
```bash
# 1. Current progress
cat /Users/michaelbelairch1/Desktop/Clubhouse\ OS\ \(Root\)/CLUBOSV2/CLAUDE_CONTEXT.md

# 2. Active chunk details  
cat /Users/michaelbelairch1/Desktop/Clubhouse\ OS\ \(Root\)/CLUBOSV2/CURRENT_CHUNK_STATUS.md

# 3. If unclear, check build order
cat /Users/michaelbelairch1/Desktop/Clubhouse\ OS\ \(Root\)/CLUBOSV2/V2_BUILD_ORDER.md
```

### 3. Tell User Current Status
```
"I see we're on Chunk [X]: [Name]. 
The current status is: [status from files]
Should I continue with [specific next task]?"
```

## 🎯 Key Context You Need

### Project Location
```
Root: /Users/michaelbelairch1/Desktop/Clubhouse OS (Root)/
V1: /Users/michaelbelairch1/Desktop/Clubhouse OS (Root)/CLUBOSV1/ (source for ported code)
V2: /Users/michaelbelairch1/Desktop/Clubhouse OS (Root)/CLUBOSV2/ (planning docs)
V3: /Users/michaelbelairch1/Desktop/Clubhouse OS (Root)/CLUBOSV3/ (current implementation)
```

### Architecture Decisions (Already Made)
- 7 assistants architecture from V2 planning
- Database for SOPs (implemented in V3)
- Technical approach with V1's practical experience
- V3 now operational at version 0.4.0
- PostgreSQL for everything (8 tables implemented)
- Ported valuable V1 services (booking, actions, notifications)

### Your Job
1. Enhance V3 with remaining features
2. Update progress files after each session
3. V3 is now the active version (V1 can be referenced)
4. Test new features thoroughly
5. Focus on Claude integration and real API connections

## 📁 File Reference Guide

### If Working On...

**Database Tasks** → Read:
- `V2_COMPLETE_DATABASE_SCHEMA.md`
- `V2_DATABASE_FIRST_ARCHITECTURE.md`

**Routing/Assistants** → Read:
- `ASSISTANT_ARCHITECTURE_V3_WITH_GENERAL.md`
- `ENHANCED_ROUTING_ARCHITECTURE.md`
- `CLUBOS_ROUTING_LOGIC.md`

**Intelligence/Claude Integration** → Read:
- `CLAUDE_INTELLIGENCE_ENGINE_ENHANCED.md`
- `SAFE_EXECUTION_FRAMEWORK.md`

**Performance** → Read:
- `FAST_RESPONSE_ARCHITECTURE.md`

**Frontend** → Read:
- `V1_TO_V2_UI_MIGRATION_PLAN.md`

**Assistant Training Data** → Read from:
- `/Updated and Organized Data for OpenAI/` folder

## 🚨 Common Pitfalls to Avoid

1. **Don't Archive Active Planning Docs** - Keep them accessible
2. **Don't Modify V1** - It needs to keep running
3. **Don't Skip Chunks** - They have dependencies
4. **Don't Forget to Update Progress** - Future Claude needs context
5. **Don't Make Up API Keys** - Ask user for real ones

## 💡 Helpful Patterns

### Working on V3 Features
```bash
# 1. Create feature branch
git checkout -b feat/v3-feature-name

# 2. Update CLAUDE_CONTEXT.md with current work

# 3. Implement the feature

# 4. Test thoroughly

# 5. Update CHANGELOG.md if significant

# 6. Commit
git add .
git commit -m "feat(v3): [description of what you did]"
```

### When Blocked
1. Document the blocker in CLAUDE_CONTEXT.md
2. Tell the user exactly what's needed
3. Move to next non-dependent task if possible

### End of Session
Always:
1. Update CLAUDE_CONTEXT.md session notes
2. Update CURRENT_CHUNK_STATUS.md progress
3. Commit all changes
4. Tell user exact status for next session

## 🎯 Example First Message

```
I'll help with ClubOS V3. Let me check the current progress...

I see V3 is now at version 0.4.0 with core functionality operational. 
We've successfully evolved from V2 planning and ported valuable V1 code.

Current priorities include:
- Claude SOP ingestion endpoint
- Learning metrics tracking
- Real API integrations (NinjaOne, Ubiquiti)

What would you like to focus on today?
```

---
*This file helps Claude maintain context across chat sessions. Don't delete or move it.*