# 📐 Universal Naming Conventions - ClubOS V3

## The One Rule
**Match what exists in the codebase. When creating new, follow these patterns:**

---

## 🗂️ Files & Directories

### JavaScript/TypeScript Files
```bash
# Services, utilities, configs - camelCase
authService.js
correlationId.js
sopMatcher.js
messageProcessor.js

# React components - PascalCase
ThreadList.tsx
ActionButton.tsx
UserAvatar.tsx

# Test files - match source + .test
authService.test.js
ThreadList.test.tsx

# Config files - lowercase with hyphens if needed
jest.config.js
next.config.js
docker-compose.yml

# Scripts - lowercase with hyphens
deploy-staging.sh
run-migrations.sh
```

### Directories
```bash
# All lowercase, plural for collections
/routes/
/services/
/components/
/utils/
/hooks/
/migrations/

# Compound names - hyphens
/claude-instructions/
/planning-archive/
```

---

## 💾 Database

### Tables
```sql
-- Plural, snake_case
CREATE TABLE threads
CREATE TABLE messages  
CREATE TABLE action_logs
CREATE TABLE merge_proposals

-- Join tables: table1_table2
CREATE TABLE threads_sops
CREATE TABLE users_roles
```

### Columns
```sql
-- snake_case for all columns
id UUID PRIMARY KEY
thread_id UUID
created_at TIMESTAMP
is_active BOOLEAN
phone_number VARCHAR
usage_count INTEGER
override_rate DECIMAL

-- JSON columns - descriptive
trigger_conditions JSONB
step_details JSONB
```

### Indexes
```sql
-- idx_table_column
CREATE INDEX idx_threads_phone_number
CREATE INDEX idx_sops_status
CREATE INDEX idx_action_logs_thread_id

-- Compound indexes
CREATE INDEX idx_messages_thread_id_created_at
```

---

## 🌐 API Endpoints

### RESTful Routes
```javascript
// Plural resources, kebab-case for compound
POST   /api/messages
GET    /api/threads
GET    /api/threads/:id
POST   /api/input-events      // kebab-case
GET    /api/sops/:id/effectiveness
POST   /api/claude/analyze-sop

// Actions on resources
POST   /api/threads/:id/escalate
PUT    /api/sops/:id/approve
POST   /api/messages/:id/retry
```

### Query Parameters
```javascript
// camelCase for JavaScript land
?includeArchived=true
?pageSize=20
?sortBy=createdAt

// But match database for filters
?status=active
?phone_number=+1234567890
```

---

## 🏗️ Code

### Variables & Functions
```javascript
// camelCase always
const userId = '123';
const phoneNumber = '+1234567890';
const isActive = true;
const retryCount = 3;

function processMessage() {}
async function fetchThreadData() {}
const handleButtonClick = () => {};
```

### Classes & Types
```typescript
// PascalCase
class MessageProcessor {}
class SOPMatcher {}
interface ThreadData {}
type ActionResult = 'success' | 'failed';
enum ThreadStatus {}
```

### Constants
```javascript
// UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 30000;
const API_VERSION = 'v1';
const THREAD_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved'
};
```

### React Components & Props
```typescript
// Components: PascalCase
function ThreadList() {}
const ActionButton: React.FC = () => {};

// Props: camelCase
<ThreadList 
  threads={threads}
  onThreadClick={handleClick}
  isLoading={loading}
/>

// Prop interfaces: ComponentNameProps
interface ThreadListProps {
  threads: Thread[];
  onThreadClick: (id: string) => void;
}
```

---

## 🌿 Git

### Branches
```bash
# feature/description
feature/user-authentication
feature/sop-tagging
feature/claude-integration

# fix/description
fix/message-timeout
fix/database-connection

# chore/description
chore/update-dependencies
chore/improve-logging
```

### Commits
```bash
# type(scope): description
feat(api): add user authentication endpoints
fix(sop): resolve matching algorithm bug
docs(readme): update setup instructions
refactor(db): optimize query performance
test(auth): add integration tests
chore(deps): update to React 18
```

---

## 🔤 Environment Variables

```bash
# UPPER_SNAKE_CASE always
DATABASE_URL=
JWT_SECRET=
OPENAI_API_KEY=

# Prefixes for context
NEXT_PUBLIC_API_URL=      # Next.js public
REACT_APP_API_URL=        # CRA public
ENABLE_FEATURE_X=         # Feature flags
SLACK_WEBHOOK_URL=        # Service-specific
```

---

## 📝 Documentation

### Markdown Files
```bash
# UPPER_SNAKE_CASE for primary docs
README.md
CHANGELOG.md
CONTRIBUTING.md
LICENSE.md

# Title Case with underscores for guides
Development_Guide.md
API_Reference.md

# kebab-case for dated files
2025-08-01-decision-title.md
```

### Code Comments
```javascript
// Single line for brief comments
const result = process(); // Process the message

/**
 * Multi-line for functions
 * @param {string} message - The message to process
 * @returns {Object} Processing result
 */

// [TAGS] for breadcrumbs
// [SESSION: 2025-08-01-001] Added feature
// [DECISION: timestamp] Chose X over Y
```

---

## 🏷️ Special Patterns

### Feature Flags
```javascript
// camelCase in code
if (features.draftGate.enabled) {}
if (features.realtimeUpdates.enabled) {}

// UPPER_SNAKE in env
ENABLE_DRAFT_GATE=true
ENABLE_REALTIME_UPDATES=true
```

### Error Codes
```javascript
// UPPER_SNAKE_CASE
const ERROR_CODES = {
  INVALID_INPUT: 'ERR_001',
  DATABASE_ERROR: 'ERR_002',
  AUTH_FAILED: 'ERR_003'
};
```

### Event Names
```javascript
// kebab-case for events
socket.emit('message-received', data);
socket.on('thread-updated', handler);
eventBus.emit('sop-executed', result);
```

---

## ✅ Quick Reference

| Context | Pattern | Example |
|---------|---------|---------|
| JS files | camelCase | `authService.js` |
| React components | PascalCase | `ThreadList.tsx` |
| Directories | lowercase | `/services/` |
| Database tables | snake_case plural | `action_logs` |
| API routes | kebab-case | `/api/input-events` |
| Variables | camelCase | `phoneNumber` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Git branches | type/description | `feature/user-auth` |
| Env vars | UPPER_SNAKE | `DATABASE_URL` |

---

## 🚨 The Override Rule

**If you see an established pattern that differs from this guide, follow the existing pattern in that specific context.**

---
*When in doubt, grep the codebase and match what's there*