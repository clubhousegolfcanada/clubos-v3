# 🤖 Automatic Assumptions for Claude

## Things Claude Should ALWAYS Assume

### 1. Naming Patterns (Never Ask)
```javascript
// Files
authService.js         // NOT: AuthService.js, auth-service.js
ThreadList.tsx         // NOT: threadList.tsx, thread-list.tsx
userAvatar.test.js     // NOT: user-avatar.test.js

// Variables  
const userId = '123';  // NOT: user_id, UserID
const isActive = true; // NOT: is_active, active

// Database
CREATE TABLE threads   // NOT: Thread, thread
phone_number VARCHAR   // NOT: phoneNumber
```

### 2. File Locations (Auto-Know)
```bash
# Backend services go here
/backend/src/services/newService.js

# API routes go here  
/backend/src/routes/newRoute.js

# React components go here
/frontend/src/components/NewComponent.tsx

# Database migrations go here
/backend/src/db/migrations/004_description.sql
```

### 3. Import Patterns
```javascript
// Backend - CommonJS
const express = require('express');
const { validateRequest } = require('../middleware/validation');

// Frontend - ES Modules
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
```

### 4. Error Handling
```javascript
// Always wrap in try/catch
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  throw error; // Let middleware handle
}
```

### 5. API Responses
```javascript
// Success format
res.json({
  success: true,
  data: result,
  metadata: { timestamp: new Date() }
});

// Error handled by middleware, not manual
```

### 6. Database Queries
```javascript
// Always parameterized
const query = 'SELECT * FROM threads WHERE id = $1';
const values = [threadId];
// NOT: `SELECT * FROM threads WHERE id = '${threadId}'`
```

### 7. Git Commits
```bash
# Always prefixed
git commit -m "feat: add user authentication"
git commit -m "fix: resolve timeout issue"
# NOT: "Added auth", "fixed bug"
```

### 8. Testing
```javascript
// Test structure
describe('Feature', () => {
  it('should do something', async () => {
    // Arrange
    // Act  
    // Assert
  });
});
```

### 9. Logging
```javascript
// Structured logs with context
logger.info('Action performed', {
  userId: user.id,
  action: 'feature_used',
  metadata: { extra: 'data' }
});
// NOT: console.log('did thing')
```

### 10. Environment Variables
```bash
# In code
process.env.DATABASE_URL
process.env.ENABLE_FEATURE

# In .env
DATABASE_URL=postgresql://...
ENABLE_FEATURE=true
```

---

## Never Ask About These

### Obvious Patterns
- ✅ API routes are RESTful
- ✅ IDs are UUIDs
- ✅ Timestamps are ISO 8601
- ✅ Passwords are hashed with bcrypt
- ✅ JWTs for authentication
- ✅ Correlation IDs for tracking

### Standard Libraries
- ✅ Express for backend
- ✅ React for frontend
- ✅ PostgreSQL for database
- ✅ Jest for testing
- ✅ Joi/Ajv for validation

### Project Structure
- ✅ Backend in `/backend`
- ✅ Frontend in `/frontend`
- ✅ Docs in `/docs`
- ✅ Monorepo with workspaces

### Deployment
- ✅ Railway for backend
- ✅ Vercel for frontend
- ✅ Docker for local dev
- ✅ GitHub for version control

---

## Auto-Corrections

If you see these, fix without asking:

| See This | Auto-Fix To |
|----------|-------------|
| `user_id` in JS | `userId` |
| `userId` in SQL | `user_id` |
| `thread-list.js` | `threadList.js` |
| `ThreadList.js` | `ThreadList.tsx` |
| `/components/threadList` | `/components/ThreadList` |
| `console.log()` | `logger.info()` |
| String concatenation in SQL | Parameterized query |
| `var` keyword | `const` or `let` |
| Callback style | `async/await` |
| `== ` comparison | `===` comparison |

---

## The Meta Rule

**If it matches existing patterns in the codebase, that's the correct assumption.**

When creating new code:
1. Look for similar code first
2. Match its patterns exactly
3. Only deviate with explicit reason

---
*These assumptions speed up development by eliminating obvious questions*