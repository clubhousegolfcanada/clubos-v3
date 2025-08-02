# ClubOS V2 Knowledge Flow & Assistant Architecture (Revised)

## Critical Architecture Change: Central Knowledge Processing

### The Problem You Identified
- Not all Slack responses belong in General assistant
- Some info is sensitive (partner's kids names, license plates)
- Slack responses might be updates for ANY assistant
- Need central processing before routing knowledge

## Revised Knowledge Flow

```
All Interactions (Customer queries, Slack responses, manual entries)
                    ↓
        CENTRAL KNOWLEDGE PROCESSOR
                    ↓
        Claude Analyzes & Classifies
                    ↓
    Routes to Appropriate Assistant
```

## Central Knowledge Database

```sql
-- Master knowledge intake table
CREATE TABLE knowledge_intake (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(50), -- 'slack', 'customer_query', 'manual_entry', 'failed_response'
  source_id VARCHAR(100),
  query TEXT,
  response TEXT,
  context JSONB, -- user, location, timestamp, etc
  processed BOOLEAN DEFAULT false,
  sensitive BOOLEAN DEFAULT false,
  classification VARCHAR(50), -- 'emergency', 'booking', 'tech', etc
  target_assistant VARCHAR(50),
  added_to_assistant BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sensitive information vault (restricted access)
CREATE TABLE sensitive_knowledge (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100), -- 'personal', 'vehicle', 'family', 'financial'
  entity VARCHAR(200), -- 'John Smith', 'Partner Mike'
  key VARCHAR(200), -- 'kids_names', 'license_plate'
  value TEXT ENCRYPTED, -- Encrypted sensitive data
  access_level VARCHAR(50), -- 'admin_only', 'management', 'never_expose'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assistant-specific knowledge tables
CREATE TABLE assistant_knowledge (
  id SERIAL PRIMARY KEY,
  assistant_name VARCHAR(50),
  category VARCHAR(100),
  knowledge TEXT,
  source_intake_id INTEGER REFERENCES knowledge_intake(id),
  confidence FLOAT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Claude's Knowledge Classification Logic

```typescript
async function processKnowledgeIntake() {
  const unprocessed = await db.query(`
    SELECT * FROM knowledge_intake WHERE processed = false
  `);
  
  for (const item of unprocessed) {
    // Claude analyzes the knowledge
    const analysis = await claude.analyze({
      query: item.query,
      response: item.response,
      context: item.context,
      instruction: `
        Classify this knowledge:
        1. Is it sensitive? (names, personal info, license plates, etc)
        2. Which assistant should have this? (emergency/booking/tech/brand/strategy/customer/general)
        3. Should it be stored at all? (maybe it's too specific)
        4. If multiple assistants need it, list all
      `
    });
    
    // Handle sensitive information
    if (analysis.sensitive) {
      await storeSensitiveKnowledge(item, analysis);
      continue; // Don't add to regular assistants
    }
    
    // Route to appropriate assistant(s)
    for (const targetAssistant of analysis.targetAssistants) {
      if (analysis.shouldStore) {
        await addToAssistant(targetAssistant, item, analysis);
      }
    }
    
    // Mark as processed
    await markProcessed(item.id, analysis);
  }
}
```

## Examples of Smart Classification

### Example 1: License Plate
```
Slack: "Mike's truck license plate is ABC-123 if you need to move it"
Claude Classification:
- Sensitive: YES
- Store in: sensitive_knowledge (encrypted)
- Target: NONE (never expose to assistants)
```

### Example 2: Refund Policy Update
```
Slack: "New policy: Refunds require manager approval over $100"
Claude Classification:
- Sensitive: NO
- Target: Booking assistant
- Category: Policy update
```

### Example 3: General Golf Tip
```
Slack: "Tell customers the alignment stick drill helps with slices"
Claude Classification:
- Sensitive: NO
- Target: General assistant AND Customer Info
- Category: Golf instruction
```

### Example 4: Emergency Procedure
```
Slack: "If fire alarm goes off, evacuate to parking lot B"
Claude Classification:
- Sensitive: NO
- Target: Emergency assistant
- Priority: HIGH
- Also add to: General (for awareness)
```

## Clubhouse General Assistant (Refined Role)

Now serves as:
1. **Catch-all for uncategorized** questions
2. **Cross-functional knowledge** that doesn't fit one category
3. **Cultural/historical** information
4. **General procedures** not specific to one area

But NOT:
- Sensitive personal information
- Specific operational procedures (those go to specialized)
- Financial or strategic data

## Security Layers

```typescript
// Three-tier access control
enum AccessLevel {
  PUBLIC = 'public',          // Customer Info assistant
  INTERNAL = 'internal',      // All staff assistants  
  RESTRICTED = 'restricted',  // Strategy assistant
  SENSITIVE = 'sensitive'     // Human-only access
}

// Query sanitization
function sanitizeResponse(response: string, userRole: string): string {
  if (userRole === 'public' || userRole === 'kiosk') {
    // Remove any phone numbers, emails, names
    return removeSensitiveData(response);
  }
  return response;
}
```

## The Complete Flow

```
1. Knowledge Intake (all sources)
        ↓
2. Central Processor logs everything
        ↓
3. Claude classifies (hourly batch)
        ↓
4. Routes to correct assistant(s)
        ↓
5. Sensitive data encrypted separately
        ↓
6. Assistants only see appropriate knowledge
```

## Benefits of Central Processing

1. **No knowledge leaks** - Sensitive info never reaches wrong assistant
2. **Multi-assistant updates** - One Slack response can update multiple bots
3. **Audit trail** - Every piece of knowledge tracked from source
4. **Smart classification** - Claude ensures knowledge goes to right place
5. **Security** - Sensitive data encrypted and access-controlled

This is how enterprise knowledge management systems work - central intake, smart classification, secure routing!