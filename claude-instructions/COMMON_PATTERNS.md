# 📋 Common Patterns Library

## 1. Error Handling Pattern
```javascript
// Use everywhere
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error: error.message, stack: error.stack });
  throw error; // Let error middleware handle response
}
```

## 2. Database Transaction Pattern
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Multiple queries
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## 3. API Response Pattern
```javascript
// Success
res.json({
  success: true,
  data: result,
  metadata: { count, page }
});

// Error (handled by middleware)
next(new Error('Descriptive message'));
```

## 4. Service Method Pattern
```javascript
async processFeature(data) {
  // 1. Validate
  if (!data.requiredField) {
    throw new Error('Missing required field');
  }
  
  // 2. Process
  const result = await this.dependency.doWork(data);
  
  // 3. Log
  logger.info('Feature processed', { id: result.id });
  
  // 4. Return
  return result;
}
```

## 5. React Data Fetching Pattern
```tsx
function Component() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/endpoint')
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{/* Use data */}</div>;
}
```

## 6. SQL Query Pattern
```sql
-- Always use parameterized queries
const query = `
  SELECT t.*, 
         COUNT(m.id) as message_count
  FROM threads t
  LEFT JOIN messages m ON t.id = m.thread_id
  WHERE t.status = $1
  GROUP BY t.id
  ORDER BY t.created_at DESC
  LIMIT $2 OFFSET $3
`;
const values = [status, limit, offset];
```

## 7. Validation Pattern
```javascript
// Using Joi
const schema = Joi.object({
  email: Joi.string().email().required(),
  age: Joi.number().min(18).max(100)
});

const { error, value } = schema.validate(data);
if (error) throw new ValidationError(error.details[0].message);
```

## 8. Test Pattern
```javascript
describe('Feature', () => {
  let service;
  
  beforeEach(() => {
    service = new FeatureService(mockDeps);
  });

  it('should work correctly', async () => {
    // Arrange
    const input = { test: 'data' };
    
    // Act
    const result = await service.process(input);
    
    // Assert
    expect(result).toMatchObject({ success: true });
  });
});
```

## 9. Environment Config Pattern
```javascript
// config/index.js
module.exports = {
  port: process.env.PORT || 3001,
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost/dev'
  },
  features: {
    claude: process.env.ENABLE_CLAUDE === 'true'
  }
};
```

## 10. Logging Pattern
```javascript
// Structured logging
logger.info('Action performed', {
  userId: user.id,
  action: 'feature_used',
  duration: Date.now() - startTime,
  metadata: { extra: 'data' }
});
```

---
*Copy, paste, modify - don't reinvent*