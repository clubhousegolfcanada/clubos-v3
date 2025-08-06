# Contributing to ClubOS V3

Welcome! This guide covers coding standards, naming conventions, and development workflows for ClubOS V3.

## 🚀 Getting Started

1. **Setup Environment**
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with required values
   npm run migrate
   npm run dev
   ```

2. **Before You Code**
   - Read AI_CONTEXT.md for project overview
   - Check CURRENT_WORK.md for active tasks
   - Review recent changes in CHANGELOG.md

## 📐 Naming Conventions

### Files & Directories
```bash
# JavaScript/TypeScript
authService.js          # Services: camelCase
ThreadList.tsx          # Components: PascalCase
authService.test.js     # Tests: match source + .test

# Directories  
/services/              # Lowercase, plural
/components/
/utils/
```

### Database
```sql
-- Tables: plural, snake_case
CREATE TABLE threads
CREATE TABLE action_logs

-- Columns: snake_case
id UUID PRIMARY KEY
thread_id UUID
created_at TIMESTAMP
phone_number VARCHAR
```

### API Endpoints
```javascript
// RESTful, plural resources
POST   /api/messages
GET    /api/threads/:id
POST   /api/input-events    // kebab-case for compound

// Actions on resources
POST   /api/threads/:id/escalate
PUT    /api/sops/:id/approve
```

### Code
```javascript
// Variables & functions: camelCase
const userId = '123';
function processMessage() {}

// Classes & types: PascalCase
class MessageProcessor {}
interface ThreadData {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 30000;

// React props: camelCase
<ThreadList 
  threads={threads}
  onThreadClick={handleClick}
  isLoading={loading}
/>
```

## 🔧 Development Standards

### Git Workflow

1. **Branch Naming**
   ```bash
   feature/user-authentication
   fix/message-timeout
   chore/update-dependencies
   ```

2. **Commit Messages**
   ```bash
   feat(api): add user authentication endpoints
   fix(sop): resolve matching algorithm bug
   docs(readme): update setup instructions
   test(auth): add integration tests
   chore(deps): update to React 18
   ```

3. **Pull Requests**
   - Clear description of changes
   - Link to related issues
   - Include test coverage
   - Update documentation

### Code Quality

1. **Linting & Formatting**
   ```bash
   npm run lint        # Check for issues
   npm run lint:fix    # Auto-fix issues
   ```

2. **Testing Requirements**
   - Write tests for new features
   - Maintain 80%+ coverage
   - Run tests before committing
   - Tests must pass in CI

3. **Error Handling**
   ```javascript
   // Always handle errors properly
   try {
     const result = await riskyOperation();
     return { success: true, data: result };
   } catch (error) {
     logger.error('Operation failed', { 
       error: error.message,
       context: { userId, operation: 'riskyOperation' }
     });
     throw error;
   }
   ```

4. **Logging**
   ```javascript
   // Use structured logging
   logger.info('User action', {
     userId: user.id,
     action: 'login',
     timestamp: new Date()
   });
   
   // Never use console.log in production code
   ```

## 🎯 Feature Development

### Adding New Features

1. **Decision Framework** - Before adding any feature, ask:
   - Is there a clear user need?
   - Can it be implemented cleanly?
   - Is it testable and reversible?
   - Does it align with core vision?

2. **Implementation Steps**
   - Update CURRENT_WORK.md
   - Write tests first (TDD encouraged)
   - Implement feature
   - Update documentation
   - Add to CHANGELOG.md

3. **Feature Flags**
   ```javascript
   // New features should be flaggable
   if (features.newFeature.enabled) {
     // New behavior
   } else {
     // Original behavior
   }
   ```

### Code Organization

```
/backend/src/
├── routes/     # Thin controllers
├── services/   # Business logic
├── utils/      # Shared utilities
├── middleware/ # Express middleware
└── db/         # Database layer

/frontend/src/
├── app/        # Next.js pages
├── components/ # React components
├── hooks/      # Custom hooks
└── utils/      # Frontend utilities
```

## 📋 Testing Strategy

### Test Structure
```javascript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should handle normal case', async () => {
      // Arrange
      const input = { /* test data */ };
      
      // Act
      const result = await service.method(input);
      
      // Assert
      expect(result).toEqual(expected);
    });

    it('should handle error case', async () => {
      // Test error scenarios
    });
  });
});
```

### Test Coverage Requirements
- New code: 80% minimum
- Critical paths: 95% minimum
- Run coverage: `npm run test:coverage`

## 🚨 Pre-Commit Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if significant)
- [ ] No commented-out code
- [ ] No console.log statements
- [ ] Error handling in place

## 📚 Additional Resources

- **Architecture**: See PROJECT_STRUCTURE.md
- **Deployment**: See DEPLOYMENT_GUIDE.md
- **AI Development**: See AI_CONTEXT.md
- **API Documentation**: See /docs/API/

## 🤝 Code Review Guidelines

### Reviewers Check For
- Adherence to naming conventions
- Proper error handling
- Test coverage
- Documentation updates
- Performance considerations
- Security implications

### Authors Should
- Self-review before requesting
- Respond to feedback constructively
- Update based on feedback
- Ensure CI passes

---
*These guidelines ensure consistent, maintainable code across the ClubOS V3 project.*