# ClubOS V2 Assistant Architecture - 6 Specialized Assistants

## Revised Assistant Lineup

### 1. **Emergency Assistant** 
- **Purpose**: Safety and urgent situations
- **Keywords**: fire, medical, injured, hurt, evacuation, emergency, safety
- **Examples**: 
  - "There's smoke in bay 3"
  - "Customer fell and is injured"
  - "Fire alarm won't stop"

### 2. **Booking & Access Assistant**
- **Purpose**: Reservations, PINs, membership, internal access control
- **Keywords**: book, PIN, access, refund, credit, reservation, membership
- **Examples**:
  - "My PIN isn't working"
  - "Need to book bay for tomorrow"
  - "Process refund for John Smith"

### 3. **Tech Support Assistant**
- **Purpose**: Equipment and technical issues (internal)
- **Keywords**: TrackMan, projector, reset, HDMI, simulator, screen, computer
- **Examples**:
  - "TrackMan won't detect ball flight"
  - "Projector showing no signal"
  - "Need to reset bay 5"

### 4. **Brand Voice Assistant** (renamed from BrandTone)
- **Purpose**: Transform any text into Clubhouse/Mike voice
- **Keywords**: write, draft, email, message, announcement, tone, voice
- **Examples**:
  - "Write an email about holiday hours"
  - "Draft response to complaint"
  - "Make this sound more Clubhouse"
- **Special Feature**: Takes any input and rewrites it in brand voice

### 5. **Strategy Assistant** (NEW)
- **Purpose**: Business intelligence, competitors, financials, planning
- **Keywords**: competitor, revenue, strategy, plan, risk, forecast, Better Golf, X-Golf
- **Access**: Admin/Management only
- **Data Sources**:
  - Competitor analysis documents
  - Financial reports
  - Market research
  - Risk assessments
  - Strategic plans
- **Examples**:
  - "What's Better Golf's pricing model?"
  - "Show Q3 revenue breakdown"
  - "Risks for PEI expansion"

### 6. **Customer Info Assistant** (NEW)
- **Purpose**: Public-facing information for customers
- **Keywords**: hours, location, prices, lessons, membership, about, contact
- **Access**: Public/Kiosk mode
- **Safety**: No personal info, phone numbers, or internal data
- **Data Sources**:
  - Public website content
  - Approved FAQs
  - Service descriptions
  - Public pricing
- **Examples**:
  - "What are your hours?"
  - "How much for a birthday party?"
  - "Do you offer lessons?"

## Updated Routing Logic

```typescript
// Primary routing with 6 assistants
function routeQuery(query: string, userRole: string) {
  
  // Emergency always first
  if (detectEmergency(query)) {
    return { assistant: 'Emergency', confidence: 1.0 };
  }
  
  // Role-based access control
  if (containsStrategyKeywords(query)) {
    if (!['admin', 'management'].includes(userRole)) {
      return { assistant: 'BrandVoice', confidence: 0.3 }; // Deflect
    }
    return { assistant: 'Strategy', confidence: 0.85 };
  }
  
  // Check if it's a writing/tone request
  if (containsWritingKeywords(query)) {
    return { assistant: 'BrandVoice', confidence: 0.9 };
  }
  
  // Public information requests
  if (isPublicInfoQuery(query)) {
    return { assistant: 'CustomerInfo', confidence: 0.85 };
  }
  
  // Internal operations
  if (containsBookingKeywords(query)) {
    return { assistant: 'Booking', confidence: 0.8 };
  }
  
  if (containsTechKeywords(query)) {
    return { assistant: 'TechSupport', confidence: 0.8 };
  }
  
  // Default based on user type
  if (userRole === 'customer' || userRole === 'kiosk') {
    return { assistant: 'CustomerInfo', confidence: 0.6 };
  } else {
    return { assistant: 'BrandVoice', confidence: 0.5 };
  }
}
```

## Access Control Matrix

| Assistant | Admin | Manager | Operator | Support | Kiosk | Public |
|-----------|-------|---------|----------|---------|-------|--------|
| Emergency | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Booking | ✓ | ✓ | ✓ | ✓ | - | - |
| TechSupport | ✓ | ✓ | ✓ | ✓ | - | - |
| BrandVoice | ✓ | ✓ | ✓ | ✓ | - | - |
| Strategy | ✓ | ✓ | - | - | - | - |
| CustomerInfo | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Data Isolation

### Strategy Assistant Data
```sql
-- Separate schema for sensitive data
CREATE SCHEMA strategy;

CREATE TABLE strategy.competitors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  pricing JSONB,
  locations JSONB,
  strengths TEXT,
  weaknesses TEXT,
  market_share DECIMAL,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE strategy.financials (
  id SERIAL PRIMARY KEY,
  period VARCHAR(20),
  revenue DECIMAL,
  costs DECIMAL,
  profit DECIMAL,
  metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Customer Info Data
```sql
-- Public-safe information only
CREATE TABLE public_info (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100),
  question TEXT,
  answer TEXT,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Pre-approved responses only
INSERT INTO public_info (category, question, answer) VALUES
('hours', 'What are your hours?', 'Monday-Friday: 6am-11pm, Saturday-Sunday: 7am-10pm'),
('pricing', 'How much per hour?', 'Bay rental starts at $40/hour. Check our website for current pricing.'),
('contact', 'How do I contact you?', 'Visit our website or stop by any location.');
-- Note: NO phone numbers or personal info
```

## Brand Voice Assistant Special Features

```typescript
// Transform any input into Clubhouse voice
async function transformToBrandVoice(input: string) {
  const prompt = `
    Transform this message into Clubhouse/Mike's voice:
    - Friendly but professional
    - Confident and knowledgeable about golf
    - Slight Maritime Canadian warmth
    - Use "folks" not "guys"
    - Be concise but personable
    
    Input: ${input}
  `;
  
  return await gpt4o.complete(prompt);
}
```

## Updated Database Schema

```sql
-- Assistant configurations
CREATE TABLE assistant_configs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  assistant_id VARCHAR(100),
  purpose TEXT,
  access_roles TEXT[],
  keywords TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO assistant_configs (name, purpose, access_roles, is_public) VALUES
('Emergency', 'Safety and urgent situations', ARRAY['all'], true),
('Booking', 'Reservations and access control', ARRAY['admin','manager','operator','support'], false),
('TechSupport', 'Equipment and technical issues', ARRAY['admin','manager','operator','support'], false),
('BrandVoice', 'Transform text into brand voice', ARRAY['admin','manager','operator','support'], false),
('Strategy', 'Business intelligence and planning', ARRAY['admin','manager'], false),
('CustomerInfo', 'Public information for customers', ARRAY['all'], true);
```

This gives you:
1. **Clear separation** between internal and external assistants
2. **Role-based access** to sensitive data
3. **Brand Voice** for consistent communication
4. **Strategy** for business intelligence (no customer access)
5. **Customer Info** that's safe for public/kiosk use