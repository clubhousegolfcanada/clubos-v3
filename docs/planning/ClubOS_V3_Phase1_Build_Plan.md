# ClubOS V3 - Phase 1 Build Plan: Clean Core Implementation

## 🎯 Goal
Build the minimum viable ClubOS V3 with a functioning human-in-the-loop AI agent, transparent actions, and one-click escalation. This delivers 80% of operational utility while maintaining forward compatibility.

## 🏗️ Phase 1 Scope (2-3 weeks)

### Core Stack
- **LLM**: Single OperatorGPT using OpenAI GPT-4
- **Frontend**: Next.js 14 on Vercel (mobile-first)
- **Backend**: Node.js/Express on Railway
- **Database**: PostgreSQL on Railway
- **Integrations**: Slack (webhooks only)

### Must-Have Features
1. ✅ Message ingestion + intent classification
2. ✅ Thread state tracking
3. ✅ Single action execution (reset, unlock)
4. ✅ Basic SOP lookup (category + keywords)
5. ✅ Slack escalation (simple webhook)
6. ✅ Manual ticket creation
7. ✅ Basic SOP editor (admin only)

---

## 📊 Database Schema (Phase 1)

```sql
-- 1. Operators (simplified from V1)
CREATE TABLE operators (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'operator', -- admin, operator, tech
    location_access TEXT[], -- ['Bedford', 'Dartmouth']
    created_at TIMESTAMP DEFAULT NOW(),
    -- Future fields (add now, use later)
    theme_preference VARCHAR(20),
    notification_preferences JSONB,
    last_login TIMESTAMP
);

-- 2. Message Threads
CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    thread_id VARCHAR(50) UNIQUE NOT NULL,
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, awaiting_ai, ai_resolved, escalated, resolved
    intent VARCHAR(50), -- tech_issue, booking, access, faq
    confidence DECIMAL(3,2),
    location VARCHAR(50),
    bay VARCHAR(10),
    booking_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Future fields
    priority VARCHAR(20) DEFAULT 'normal',
    correlation_id VARCHAR(50),
    merged_with VARCHAR(50)
);

-- 3. Messages
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    thread_id VARCHAR(50) REFERENCES threads(thread_id),
    sender_type VARCHAR(20), -- customer, ai, operator
    sender_id VARCHAR(50),
    content TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    -- Future fields
    redacted BOOLEAN DEFAULT FALSE,
    learning_flag BOOLEAN DEFAULT FALSE
);

-- 4. SOPs (Standard Operating Procedures)
CREATE TABLE sops (
    id SERIAL PRIMARY KEY,
    sop_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255),
    category VARCHAR(50), -- tech, booking, access, faq
    trigger_phrases TEXT[], -- ['screen stuck', 'trackman frozen']
    primary_action VARCHAR(50),
    fallback_action VARCHAR(50) DEFAULT 'escalate',
    status VARCHAR(20) DEFAULT 'active',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    -- Future fields (add now, use later)
    version INTEGER DEFAULT 1,
    dependencies TEXT[],
    prerequisites TEXT[],
    context JSONB,
    metrics JSONB,
    mergeable BOOLEAN DEFAULT TRUE,
    priority_weight DECIMAL(3,2) DEFAULT 0.5
);

-- 5. Action Log
CREATE TABLE action_log (
    id SERIAL PRIMARY KEY,
    action_id VARCHAR(50) UNIQUE NOT NULL,
    action VARCHAR(50), -- reset_trackman, unlock_door
    thread_id VARCHAR(50),
    booking_id VARCHAR(50),
    triggered_by VARCHAR(50), -- OperatorGPT, mike@clubhouse.com
    location VARCHAR(50),
    bay VARCHAR(10),
    outcome VARCHAR(50), -- success, failed, timeout
    sop_id VARCHAR(50),
    timestamp TIMESTAMP DEFAULT NOW(),
    -- Future fields
    prerequisites_met BOOLEAN,
    duration_ms INTEGER,
    correlation_id VARCHAR(50)
);

-- 6. Tickets
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(50) UNIQUE NOT NULL,
    thread_id VARCHAR(50),
    category VARCHAR(50), -- tech, facilities
    priority VARCHAR(20), -- low, medium, high, critical
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved
    title VARCHAR(255),
    description TEXT,
    location VARCHAR(50),
    created_by VARCHAR(50),
    assigned_to VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    -- Future fields
    sla JSONB,
    relationships JSONB,
    template_used VARCHAR(50)
);

-- Basic indexes for performance
CREATE INDEX idx_threads_status ON threads(status);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_sops_category ON sops(category);
CREATE INDEX idx_tickets_status ON tickets(status, priority);
```

---

## 🔧 Backend API Endpoints (Phase 1)

```javascript
// Core endpoints only
POST   /api/messages          // Receive new message
GET    /api/threads/:id       // Get thread + messages
PATCH  /api/threads/:id       // Update thread status

POST   /api/actions          // Execute action
GET    /api/actions/:thread  // Get actions for thread

GET    /api/sops             // List SOPs (filtered)
POST   /api/sops             // Create SOP (admin)
PATCH  /api/sops/:id         // Update SOP (admin)

POST   /api/tickets          // Create ticket
GET    /api/tickets          // List tickets
PATCH  /api/tickets/:id      // Update ticket

POST   /api/escalate         // Send to Slack
POST   /api/auth/login       // Operator login
```

---

## 🎨 Frontend Pages (Phase 1)

```
/login              - Simple email/password
/                   - Message inbox (default view)
/thread/:id         - Thread detail + actions
/tickets            - Ticket list
/tickets/create     - Create ticket form
/admin/sops         - SOP editor (admin only)
```

---

## 🔌 Integration Points (Phase 1)

### OpenPhone Webhook
```javascript
POST /api/webhooks/openphone
{
    from: "+1234567890",
    to: "+19999999999",
    text: "TrackMan isn't working",
    conversationId: "conv-123"
}
```

### Slack Webhook (Outbound Only)
```javascript
// Simple POST to Slack webhook URL
{
    text: "🚨 Escalation: Bay 2 TrackMan issue",
    channel: "#ops-alerts",
    thread_id: "msg-123",
    location: "Bedford"
}
```

---

## 🧠 LLM Integration (Phase 1)

### Simple Intent Classification
```javascript
async function classifyIntent(message) {
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: `Classify customer message into one of these intents:
                - tech_issue: Equipment problems
                - booking: Reservation questions
                - access: Door/entry issues
                - faq: General questions
                
                Respond with JSON: {"intent": "...", "confidence": 0.95}`
            },
            { role: "user", content: message }
        ],
        temperature: 0.3
    });
    
    return JSON.parse(response.choices[0].message.content);
}
```

### Basic SOP Matching
```javascript
async function findMatchingSOP(intent, message) {
    // Phase 1: Simple keyword matching
    const sops = await db.query(
        `SELECT * FROM sops 
         WHERE category = $1 
         AND status = 'active'
         ORDER BY priority_weight DESC`,
        [intent]
    );
    
    // Check trigger phrases
    for (const sop of sops) {
        for (const trigger of sop.trigger_phrases) {
            if (message.toLowerCase().includes(trigger.toLowerCase())) {
                return sop;
            }
        }
    }
    
    return null; // Escalate if no match
}
```

---

## 📱 Mobile UI Components (Phase 1)

### Thread List Item
```jsx
<div className="border-b p-4">
    <div className="flex justify-between">
        <div>
            <p className="font-medium">{customer_name}</p>
            <p className="text-sm text-gray-600">{location} - Bay {bay}</p>
        </div>
        <span className={`badge ${getStatusColor(status)}`}>
            {status}
        </span>
    </div>
    <p className="text-sm mt-2 truncate">{last_message}</p>
</div>
```

### Action Buttons
```jsx
<div className="fixed bottom-0 bg-white border-t p-4">
    <div className="grid grid-cols-2 gap-2">
        <button onClick={() => executeAction('reset_trackman')} 
                className="btn-primary">
            Reset TrackMan
        </button>
        <button onClick={() => executeAction('unlock_door')} 
                className="btn-secondary">
            Unlock Door
        </button>
    </div>
    <button onClick={escalateToSlack} 
            className="btn-danger w-full mt-2">
        Escalate to Slack
    </button>
</div>
```

---

## 🚦 Implementation Order

### Week 1: Foundation
1. Set up repositories and deployment pipeline
2. Create database schema (all tables, even with unused fields)
3. Basic auth system (login/logout)
4. Message webhook endpoint
5. Thread creation and display

### Week 2: Core Loop
1. LLM intent classification
2. SOP matching logic
3. Action execution (mocked initially)
4. Slack escalation
5. Basic ticket creation

### Week 3: Polish & Deploy
1. Mobile UI optimization
2. Admin SOP editor
3. Error handling
4. Basic monitoring
5. Production deployment

---

## ⚡ What We're NOT Building (Yet)

❌ Multi-location switching UI
❌ Claude integration
❌ Learning/feedback system  
❌ Advanced SOP matching (vector/semantic)
❌ Automated monitoring
❌ Priority queuing
❌ SLA tracking
❌ Cost analytics
❌ Dark mode
❌ PWA/offline support

All these features have database fields ready but no implementation. This keeps Phase 1 focused while maintaining upgrade paths.

---

## 🎯 Success Metrics (Phase 1)

- ✅ Can receive OpenPhone messages
- ✅ Can classify intent with >80% accuracy
- ✅ Can execute basic actions
- ✅ Can escalate to Slack when needed
- ✅ Operators can create tickets
- ✅ Admins can manage SOPs
- ✅ Mobile-friendly UI
- ✅ <3 second response time

---

## 🔑 Environment Variables (Phase 1)

```bash
# Backend (.env)
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
JWT_SECRET=...
OPENPHONE_WEBHOOK_SECRET=...

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.clubos.app
```

---

## 🚀 Next Steps

1. **Validate** this plan with the team
2. **Create** GitHub repos with this structure
3. **Deploy** empty shells to Railway/Vercel
4. **Start** with Week 1 tasks

This clean core gives you a working system in 2-3 weeks that solves real problems while setting up for the full V3 vision.