# Naming Conventions - Features

**📍 NOTE: See `/NAMING_CONVENTIONS.md` for complete guide**

This file contains feature-specific naming patterns.

## API Endpoints
```
POST   /api/resource          # Create
GET    /api/resource          # List
GET    /api/resource/:id      # Get one
PUT    /api/resource/:id      # Update
DELETE /api/resource/:id      # Delete

Examples:
/api/messages
/api/threads/:id
/api/sops
```

## JavaScript/TypeScript

### Variables & Functions
```javascript
// camelCase for variables and functions
const userId = '123';
const threadCount = 5;
function processMessage() {}
async function fetchUserData() {}
```

### Classes & Interfaces
```javascript
// PascalCase for classes
class MessageProcessor {}
class SOPMatcher {}

// Interfaces (TypeScript)
interface Thread {}
interface UserProfile {}
```

### Constants
```javascript
// UPPER_SNAKE_CASE for constants
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 30000;
const API_VERSION = 'v1';
```

## Database

### Tables
```sql
-- Plural, snake_case
CREATE TABLE threads (...);
CREATE TABLE messages (...);
CREATE TABLE action_logs (...);
```

### Columns
```sql
-- snake_case
thread_id UUID
created_at TIMESTAMP
is_active BOOLEAN
phone_number VARCHAR
```

## Files & Directories

### Backend
```
/src/
  /routes/
    messages.js      # Plural for collections
    auth.js          # Singular for concepts
  /services/
    messageProcessor.js    # camelCase files
    sopMatcher.js
  /utils/
    correlationId.js      # Feature name
```

### Frontend
```
/components/
  ThreadList.tsx         # PascalCase components
  ActionButton.tsx
/pages/
  threads/
    [id].tsx            # Dynamic routes
/hooks/
  useThread.ts          # use prefix for hooks
  useAuth.ts
```

## Git Branches
```
feat/user-authentication
fix/message-processing
chore/update-dependencies
docs/api-documentation
```

## Environment Variables
```
# UPPER_SNAKE_CASE
DATABASE_URL=
JWT_SECRET=
OPENAI_API_KEY=
NEXT_PUBLIC_API_URL=    # NEXT_PUBLIC_ prefix for client
```

## Test Files
```
messageProcessor.test.js    # .test.js suffix
ThreadList.test.tsx        # Match component name
api.integration.test.js    # .integration.test for integration
```

---
*Consistency is key - when in doubt, match existing patterns*