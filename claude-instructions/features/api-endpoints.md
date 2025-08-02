# 📡 Adding API Endpoints

## File Locations
- Routes: `/backend/src/routes/`
- Services: `/backend/src/services/`
- Validators: `/backend/src/validators/`
- Tests: `/backend/tests/`

## Step-by-Step Guide

### 1. Create Route File
```javascript
// backend/src/routes/feature.js
const express = require('express');
const router = express.Router();

router.post('/feature', async (req, res) => {
  // Implementation
});

module.exports = router;
```

### 2. Add Business Logic
```javascript
// backend/src/services/featureService.js
class FeatureService {
  async process(data) {
    // Validate
    // Process
    // Return result
  }
}
```

### 3. Register Route
```javascript
// backend/src/index.js
app.use('/api/feature', require('./routes/feature'));
```

### 4. Add Tests
```javascript
// backend/tests/feature.test.js
describe('POST /api/feature', () => {
  it('should process successfully', async () => {
    // Test implementation
  });
});
```

## Checklist
- [ ] Route created in `/routes/`
- [ ] Service logic in `/services/`
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] Tests written
- [ ] API docs updated
- [ ] Postman collection updated

## Common Patterns
- Use `correlationId` for tracking
- Log all operations
- Return consistent response format
- Handle errors with proper status codes

---
*Remember to test with: `npm test backend/tests/feature.test.js`*