# 🧪 Testing Guide - START HERE

## Quick Test Commands
```bash
# Run all tests
npm test

# Run specific test file
npm test backend/tests/sops.test.js

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Testing Categories

### 1. Unit Tests
→ Read: [`unit-tests.md`](./unit-tests.md)
- Service tests
- Utility tests
- Component tests

### 2. Integration Tests
→ Read: [`integration-tests.md`](./integration-tests.md)
- API tests
- Database tests
- Service integration

### 3. E2E Tests
→ Read: [`e2e-tests.md`](./e2e-tests.md)
- User flows
- Critical paths
- Cross-service

### 4. Performance Tests
→ Read: [`performance-tests.md`](./performance-tests.md)
- Load testing
- Stress testing
- Benchmarking

## Testing Checklist

### Before Writing Code
- [ ] Write test first (TDD)
- [ ] Define expected behavior
- [ ] Consider edge cases

### While Writing Tests
- [ ] Test happy path
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Mock external dependencies

### After Writing Tests
- [ ] Verify coverage > 80%
- [ ] Check test performance
- [ ] Document complex tests
- [ ] Run full suite

## Test Structure
```javascript
describe('Feature', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', async () => {
    // Arrange
    // Act
    // Assert
  });

  afterEach(() => {
    // Cleanup
  });
});
```

---
*Choose your test type above*