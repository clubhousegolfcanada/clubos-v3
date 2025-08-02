# Feature Development Changelog

## Format: `- DATE: [Action] Description (files affected)`

### 2025-08-01
- Initial context system created

### 2024-02-01  
- Added: V1 service migration (booking, remoteActions, notifications)
- Added: Input event logging system (POST /api/input-events)
- Added: SOP tagging system (tags array with validation)
- Updated: SOP creation with JSON schema validation

### 2024-01-31
- Added: Core message processing loop (/api/messages)
- Added: Intent classification using GPT-4
- Added: Thread management system (8 tables)
- Added: SOP matching with keywords
- Added: Action execution framework
- Added: Frontend skeleton with Next.js 14

## Naming Decisions Made
- camelCase for JavaScript/API: `userId`, `threadId`
- snake_case for database: `user_id`, `thread_id`
- Kebab-case for URLs: `/api/input-events`
- PascalCase for components: `ThreadList`, `ActionButton`

## Integration Points Established
- Message → Intent Classifier → Thread
- Thread → SOP Matcher → Actions
- Actions → External Services → Results
- Results → Thread Status Update

---
*Add entry for every feature addition or change*