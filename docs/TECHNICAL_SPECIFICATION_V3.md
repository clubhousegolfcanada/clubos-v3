# ClubOS V3 Technical Specification

**Version:** 3.0.0  
**Last Updated:** August 2, 2025  
**Status:** Production Ready

---

## 1. System Architecture

### 1.1 High-Level Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Customer      │     │   ClubOS V3     │     │   Operators     │
│   Channels      │────▶│   Platform      │────▶│   Dashboard     │
│ (SMS/Email/Web) │     │ (AI Processing) │     │   (Next.js)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         │                       ▼                        │
         │              ┌─────────────────┐              │
         │              │   PostgreSQL    │              │
         │              │   Database      │              │
         │              └─────────────────┘              │
         │                       │                        │
         │                       ▼                        │
         │              ┌─────────────────┐              │
         └─────────────▶│  External APIs  │◀─────────────┘
                        │ - OpenAI GPT-4  │
                        │ - Anthropic     │
                        │ - OpenPhone     │
                        │ - NinjaOne      │
                        └─────────────────┘
```

### 1.2 Component Architecture

#### Backend Services
```
backend/
├── API Layer (Express.js)
│   ├── RESTful endpoints
│   ├── JWT authentication
│   └── Rate limiting
│
├── Business Logic Layer
│   ├── Intent Classification (GPT-4)
│   ├── SOP Matching Engine
│   ├── Action Executor
│   └── Notification Service
│
├── Data Access Layer
│   ├── PostgreSQL connection pool
│   ├── Query builders
│   └── Migration system
│
└── Integration Layer
    ├── OpenAI client
    ├── Anthropic client
    └── External API clients
```

#### Frontend Architecture
```
frontend/
├── Next.js 14 App Router
│   ├── Server Components
│   ├── Client Components
│   └── API Routes
│
├── State Management
│   ├── React Context
│   └── Local state
│
├── UI Components
│   ├── Atomic design
│   ├── Tailwind CSS
│   └── Headless UI
│
└── API Integration
    ├── Axios client
    └── Error handling
```

---

## 2. Data Models

### 2.1 Database Schema

#### Threads Table
```sql
CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'open',
    intent VARCHAR(100),
    confidence_score DECIMAL(3,2),
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_customer_id (customer_id),
    INDEX idx_created_at (created_at)
);
```

#### Messages Table
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'customer', 'system', 'operator'
    channel VARCHAR(50), -- 'sms', 'email', 'web'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_thread_id (thread_id),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
);
```

#### SOPs Table
```sql
CREATE TABLE sops (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    intent_category VARCHAR(100) NOT NULL,
    keywords TEXT[],
    steps JSONB NOT NULL,
    actions JSONB,
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    estimated_time_saved INTEGER DEFAULT 5,
    success_rate DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_intent_category (intent_category),
    INDEX idx_enabled (enabled),
    INDEX idx_priority (priority)
);
```

### 2.2 Data Flow

```
1. Message Received
   └─> Create/Update Thread
       └─> Store Message
           └─> Classify Intent
               └─> Match SOP
                   └─> Execute Actions
                       └─> Store Response
                           └─> Update Thread Status
```

---

## 3. API Specification

### 3.1 Authentication

#### Login Endpoint
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "operator@clubhouse.com",
  "password": "securepassword"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "operator@clubhouse.com",
    "role": "operator"
  }
}
```

### 3.2 Core Endpoints

#### Message Processing
```http
POST /api/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "I need to reset my TrackMan password",
  "customerId": "cust_123",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+14165551234",
  "channel": "sms"
}

Response 200:
{
  "threadId": 456,
  "messageId": 789,
  "intent": {
    "category": "password_reset",
    "confidence": 0.95
  },
  "sopMatched": true,
  "actions": [
    {
      "type": "send_reset_link",
      "status": "completed"
    }
  ],
  "response": "I've sent a password reset link to john@example.com. Please check your email."
}
```

#### Thread Management
```http
GET /api/threads
  Query params:
  - status: open|closed|escalated
  - assignedTo: userId
  - page: number
  - limit: number

GET /api/threads/:id
  Returns full thread with messages

PATCH /api/threads/:id
  Update thread status/assignment

POST /api/threads/:id/messages
  Add message to thread
```

#### SOP Management
```http
GET /api/sops
  Query params:
  - category: string
  - enabled: boolean

POST /api/sops
  Create new SOP

PATCH /api/sops/:id
  Update SOP

DELETE /api/sops/:id
  Soft delete SOP
```

### 3.3 Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "content",
        "message": "Content is required"
      }
    ]
  }
}
```

Error Codes:
- `VALIDATION_ERROR` - Invalid input
- `AUTHENTICATION_ERROR` - Invalid/missing token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_ERROR` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## 4. AI Integration

### 4.1 Intent Classification

#### GPT-4 Integration
```javascript
const classifyIntent = async (message) => {
  const prompt = `
    Classify the following customer message into one of these categories:
    - password_reset
    - booking_modification
    - technical_support
    - refund_request
    - general_inquiry
    
    Message: "${message}"
    
    Return JSON: { "intent": "category", "confidence": 0.0-1.0 }
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(response.choices[0].message.content);
};
```

### 4.2 Claude Integration (Planned)

```javascript
const analyzeSOP = async (conversation, currentSOP) => {
  const response = await anthropic.messages.create({
    model: "claude-3-opus-20240229",
    messages: [{
      role: "user",
      content: `Analyze this conversation and suggest SOP improvements...`
    }],
    max_tokens: 1000
  });
  
  return response.content;
};
```

---

## 5. Security Specification

### 5.1 Authentication & Authorization

- **JWT Tokens**: RS256 algorithm, 24-hour expiry
- **Role-Based Access**: operator, admin, system
- **API Key Management**: Environment variables only

### 5.2 Data Protection

- **Encryption at Rest**: PostgreSQL transparent encryption
- **Encryption in Transit**: TLS 1.3 minimum
- **PII Handling**: Customer data sanitized in logs

### 5.3 Security Headers

```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});
```

---

## 6. Performance Specifications

### 6.1 Response Time Targets

- **Message Classification**: < 2 seconds
- **SOP Matching**: < 100ms (with cache)
- **Action Execution**: < 5 seconds
- **API Response**: < 200ms (p95)

### 6.2 Scalability

- **Concurrent Users**: 100+ operators
- **Messages/Hour**: 1000+
- **Database Connections**: 20 pool size
- **Memory Usage**: < 512MB per instance

### 6.3 Caching Strategy

```javascript
// Decision cache (from mike-brain integration)
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

// Redis implementation (future)
const redis = new Redis({
  host: process.env.REDIS_HOST,
  ttl: 3600
});
```

---

## 7. Testing Specifications

### 7.1 Test Coverage Requirements

- **Overall**: Minimum 80%
- **Critical Paths**: 95%+
- **New Code**: 90%+

### 7.2 Test Categories

#### Unit Tests
```javascript
describe('IntentClassifier', () => {
  it('should classify password reset intent correctly', async () => {
    const result = await classifier.classify('I forgot my password');
    expect(result.intent).toBe('password_reset');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

#### Integration Tests
```javascript
describe('POST /api/messages', () => {
  it('should process message and return response', async () => {
    const response = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Reset my password' });
      
    expect(response.status).toBe(200);
    expect(response.body.sopMatched).toBe(true);
  });
});
```

---

## 8. Deployment Specifications

### 8.1 Infrastructure

#### Backend (Railway)
- **Runtime**: Node.js 18 LTS
- **Database**: PostgreSQL 15
- **Memory**: 512MB - 2GB
- **CPU**: 1-2 vCPU
- **Scaling**: Horizontal (2+ instances)

#### Frontend (Vercel)
- **Framework**: Next.js 14
- **Regions**: US East, US West
- **Cache**: Edge caching enabled
- **Functions**: Serverless

### 8.2 Environment Variables

#### Required
```bash
# Backend
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<secure-random-string>
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Frontend
NEXT_PUBLIC_API_URL=https://api.clubos.com
NEXT_PUBLIC_APP_NAME=ClubOS
```

### 8.3 CI/CD Pipeline

```yaml
# GitHub Actions
on:
  push:
    branches: [main, develop]

jobs:
  test:
    - npm install
    - npm run lint
    - npm test
    - npm run build
    
  deploy:
    - railway up (backend)
    - vercel --prod (frontend)
```

---

## 9. Monitoring Specifications

### 9.1 Health Checks

```javascript
// Backend health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    database: await checkDatabase(),
    external: await checkExternalAPIs()
  });
});
```

### 9.2 Logging Standards

```javascript
// Structured logging
logger.info('Message processed', {
  threadId: thread.id,
  intent: result.intent,
  confidence: result.confidence,
  sopMatched: !!sop,
  duration: Date.now() - startTime,
  userId: req.user.id
});
```

### 9.3 Metrics to Track

- **Business Metrics**
  - Messages processed/hour
  - SOP match rate
  - Average resolution time
  - Escalation rate

- **Technical Metrics**
  - API response times
  - Error rates
  - Database query times
  - External API latency

---

## 10. Maintenance Specifications

### 10.1 Backup Strategy

- **Database**: Daily automated backups (30-day retention)
- **Code**: Git repository with tags for releases
- **Configurations**: Version controlled in repository

### 10.2 Update Procedures

1. **Minor Updates**: Deploy to staging first
2. **Major Updates**: Blue-green deployment
3. **Database Changes**: Reversible migrations
4. **API Changes**: Version with deprecation notices

### 10.3 Disaster Recovery

- **RTO**: 4 hours
- **RPO**: 1 hour
- **Backup Locations**: Railway automated backups
- **Restore Process**: Documented in runbooks

---

*This technical specification is a living document and should be updated as the system evolves.*