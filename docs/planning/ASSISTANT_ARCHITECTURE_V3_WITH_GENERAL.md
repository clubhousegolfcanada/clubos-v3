# ClubOS V2 Assistant Architecture - 7 Specialized Assistants

## Complete Assistant Lineup (Updated)

### 1. **Emergency Assistant** 
- **Purpose**: Safety and urgent situations
- **Priority**: ALWAYS FIRST
- **Keywords**: fire, medical, injured, hurt, evacuation, emergency, safety

### 2. **Booking & Access Assistant**
- **Purpose**: Reservations, PINs, membership, internal access control
- **Keywords**: book, PIN, access, refund, credit, reservation, membership

### 3. **Tech Support Assistant**
- **Purpose**: Equipment and technical issues (internal)
- **Keywords**: TrackMan, projector, reset, HDMI, simulator, screen, computer

### 4. **Brand Voice Assistant**
- **Purpose**: Transform any text into Clubhouse/Mike voice
- **Keywords**: write, draft, email, message, announcement, tone, voice

### 5. **Strategy Assistant**
- **Purpose**: Business intelligence, competitors, financials, planning
- **Access**: Admin/Management only
- **Keywords**: competitor, revenue, strategy, plan, risk, forecast, Better Golf

### 6. **Customer Info Assistant**
- **Purpose**: Public-facing information for customers
- **Access**: Public/Kiosk mode
- **Keywords**: hours, location, prices, lessons, membership, about, contact

### 7. **Clubhouse General Assistant** (NEW)
- **Purpose**: Catch-all knowledge base for everything else
- **Access**: All internal staff
- **Data Sources**:
  - General golf knowledge
  - Clubhouse culture & history
  - Staff procedures
  - Edge cases from other assistants
  - Learned responses from Slack fallbacks
- **Examples**:
  - "What's a good drill for slice correction?"
  - "Who invented TrackMan?"
  - "What's our company culture like?"
  - "How do I handle an angry customer?"

## Improved Routing Logic with Smart Fallback

```typescript
async function routeQueryV2(query: string, userRole: string) {
  
  // Step 1: Emergency check (always first)
  if (detectEmergency(query)) {
    return { assistant: 'Emergency', confidence: 1.0 };
  }
  
  // Step 2: Try specialized assistants
  const specializedRoute = findBestSpecializedAssistant(query, userRole);
  
  if (specializedRoute.confidence >= 0.7) {
    return specializedRoute;
  }
  
  // Step 3: Clubhouse General (NEW FALLBACK LAYER)
  if (specializedRoute.confidence < 0.7 && userRole !== 'public') {
    const generalResponse = await tryClubhouseGeneral(query);
    
    if (generalResponse.confidence >= 0.6) {
      return {
        assistant: 'ClubhouseGeneral',
        confidence: generalResponse.confidence,
        note: 'Handled by general knowledge base'
      };
    }
  }
  
  // Step 4: Slack fallback (only if General can't handle)
  return {
    assistant: 'SlackFallback',
    confidence: specializedRoute.confidence,
    reason: 'No assistant could confidently handle this query'
  };
}
```

## The New Fallback Hierarchy

```
Customer Query
    ↓
1. Emergency Check (always first)
    ↓
2. Specialized Assistant (confidence >= 0.7)
    ↓
3. Clubhouse General (confidence >= 0.6) ← NEW!
    ↓
4. Slack Fallback (human intervention)
```

## Clubhouse General Knowledge Base

```sql
-- General knowledge that doesn't fit other assistants
CREATE TABLE general_knowledge (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100),
  topic VARCHAR(200),
  question_pattern TEXT,
  answer TEXT,
  source VARCHAR(100), -- 'manual', 'learned_from_slack', 'imported'
  usage_count INTEGER DEFAULT 0,
  success_rate FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Learn from Slack responses
CREATE TABLE slack_learnings (
  id SERIAL PRIMARY KEY,
  original_query TEXT,
  slack_response TEXT,
  processed BOOLEAN DEFAULT false,
  added_to_general BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## How Clubhouse General Learns

```typescript
// Daily job: Process Slack responses
async function processSlackLearnings() {
  const unprocessed = await db.query(`
    SELECT * FROM slack_learnings 
    WHERE processed = false
  `);
  
  for (const learning of unprocessed) {
    // Claude analyzes if this should become general knowledge
    const analysis = await claude.analyze({
      query: learning.original_query,
      response: learning.slack_response,
      instruction: 'Should this become general knowledge?'
    });
    
    if (analysis.shouldAdd) {
      await db.query(`
        INSERT INTO general_knowledge 
        (category, topic, question_pattern, answer, source)
        VALUES ($1, $2, $3, $4, 'learned_from_slack')
      `, [
        analysis.category,
        analysis.topic,
        analysis.pattern,
        analysis.answer
      ]);
    }
  }
}
```

## Benefits of Clubhouse General

1. **Reduces Slack Noise**: Catches 60-70% of edge cases
2. **Learning System**: Gets smarter from every Slack response
3. **Cultural Knowledge**: Stores "how we do things here"
4. **Golf Expertise**: General golf knowledge not specific to operations
5. **Flexibility**: Handles questions that don't fit neat categories

## Example Queries for General

- "What's the history of Clubhouse?"
- "Tips for teaching kids golf?"
- "How should I handle a difficult customer?"
- "What's the difference between TrackMan and Toptracer?"
- "Why do we call it Clubhouse?"
- "Best practice for closing procedures?"

## Updated Metrics

```sql
-- Track where queries are handled
CREATE TABLE routing_metrics (
  id SERIAL PRIMARY KEY,
  date DATE,
  emergency_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  tech_count INTEGER DEFAULT 0,
  brand_count INTEGER DEFAULT 0,
  strategy_count INTEGER DEFAULT 0,
  customer_info_count INTEGER DEFAULT 0,
  general_count INTEGER DEFAULT 0,      -- NEW
  slack_fallback_count INTEGER DEFAULT 0,
  total_queries INTEGER DEFAULT 0
);
```

## The Learning Loop

```
Failed Specialized Assistant
    ↓
Try Clubhouse General
    ↓
If fails → Slack
    ↓
Human responds
    ↓
Claude analyzes response
    ↓
Adds to General Knowledge
    ↓
Next time: General handles it!
```

This creates a self-improving middle layer that reduces human workload while maintaining quality!