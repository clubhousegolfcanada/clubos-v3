# Feature Integration Map

## Core Integration Points

### Message Processing
```
Incoming Message → POST /api/messages
    ↓
Intent Classifier (OpenAI GPT-4)
    ↓
Thread Creation/Update
    ↓
SOP Matcher → Action Executor
    ↓
External Services → Response
```

### Database Relationships
```
threads
  ├── messages (1:many)
  ├── action_logs (1:many)
  ├── tickets (1:many)
  └── sops (many:many via matches)

sops
  ├── valid_actions (many:1)
  └── tags (array field)
```

### Service Dependencies

#### MessageProcessor
- Depends on: IntentClassifier, ThreadService, SOPMatcher
- Updates: threads, messages tables
- Emits: correlation_id for tracking

#### ActionExecutor  
- Depends on: RemoteActions, Notifications, Booking
- Updates: action_logs table
- Integrates: Slack, OpenPhone (future), NinjaOne (future)

#### SOPMatcher
- Depends on: Database queries
- Reads: sops table (live only)
- Returns: Ranked matches by score

### External Integrations

#### Currently Active
- OpenAI API (intent classification)
- Slack Webhooks (escalations)
- PostgreSQL (all data)

#### Planned
- Anthropic API (Claude - SOP analysis)
- OpenPhone API (SMS/calls)
- NinjaOne API (device management)
- Ubiquiti API (network control)

### Frontend ↔ Backend

#### API Calls
- Auth: POST /api/auth/login → JWT token
- Messages: POST /api/messages → Process
- Threads: GET /api/threads → List view
- Actions: POST /api/actions → Execute

#### State Management
- NextAuth for authentication
- React Query for API cache
- Local state for UI

---
*Update when adding new integrations*