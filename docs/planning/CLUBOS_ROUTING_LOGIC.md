# ClubOS Routing Logic & Fallback Decision Tree

## Core Routing Architecture

### 1. Primary Router (GPT-4o)
```
Customer Query
    ↓
GPT-4o Routing Engine
    ↓
Analyzes Intent & Confidence
    ↓
Routes to Specialized Assistant
```

### 2. Four Specialized Assistants

1. **Emergency Assistant** (`asst_jOWRzC9eOMRsupRqMWR5hc89`)
   - Fire, medical, security, evacuations
   - Keywords: emergency, fire, injured, hurt, safety

2. **Booking & Access Assistant** (`asst_E2CrYEtb5CKJGPZYdE7z7VAq`)
   - Reservations, PINs, refunds, membership
   - Keywords: book, PIN, access, refund, credit

3. **Tech Support Assistant** (`asst_Xax6THdGRHYJwPbRi9OoQrRF`)
   - TrackMan, simulators, hardware issues
   - Keywords: projector, TrackMan, reset, HDMI

4. **Brand Tone Assistant** (`asst_1vMUEQ7oTIYrCFG1BhgpwMkw`)
   - Company info, pricing, competitors
   - Keywords: price, competitor, about, location

## Routing Decision Logic

### Primary Decision Tree
```typescript
if (query.contains(emergencyKeywords)) {
  route = 'Emergency';
  confidence = 0.95;
} else if (query.contains(bookingKeywords)) {
  route = 'Booking & Access';
  confidence = calculateConfidence(query);
} else if (query.contains(techKeywords)) {
  route = 'TechSupport';
  confidence = calculateConfidence(query);
} else {
  route = 'BrandTone'; // Default catch-all
  confidence = 0.6;
}
```

### Confidence Scoring
- **High Confidence (>0.8)**: Direct keyword match
- **Medium Confidence (0.6-0.8)**: Partial match or context clues
- **Low Confidence (<0.6)**: Ambiguous or unknown

## Fallback Logic

### Level 1: AI Assistant Response
```
If confidence >= 0.7:
  → Route to specialized assistant
  → Get response
  → Check if response.status === 'success'
```

### Level 2: Slack Fallback
```
If confidence < 0.7 OR assistant.response.failed:
  → Send to Slack channel
  → Include:
    - Original query
    - Attempted route
    - Confidence score
    - Context (user, location)
  → Wait for human response
```

### Level 3: Direct Human Intervention
```
If Slack no response in 5 minutes:
  → Flag as urgent
  → Send notification to on-call
  → Log for follow-up
```

## Audit Trail & Logging

### Every Request Logged
```sql
INSERT INTO routing_decisions (
  id,
  query,
  route_chosen,
  confidence_score,
  assistant_response,
  fallback_used,
  human_intervention,
  resolution_time,
  feedback_rating,
  created_at
) VALUES (...);
```

### Failed Response Analysis
```sql
-- Queries that went to fallback
SELECT * FROM routing_decisions 
WHERE confidence_score < 0.7 
   OR fallback_used = true;

-- Pattern analysis for Claude
SELECT route_chosen, COUNT(*) as failures
FROM routing_decisions
WHERE feedback_rating = 'unhelpful'
GROUP BY route_chosen;
```

## The Intelligence Loop

### 1. Real-time Routing (GPT-4o)
- Analyzes query intent
- Calculates confidence
- Routes to assistant
- Monitors response quality

### 2. Fallback Decision Tree
```
Assistant Response
    ↓
Success Check
    ├─ Success → Return to user
    └─ Failure → Slack Fallback
                    ↓
                Human Response
                    ↓
                Log for Analysis
```

### 3. Continuous Improvement (Claude)
```
Daily/Hourly Batch:
  1. Export failed responses
  2. Claude analyzes patterns
  3. Identifies routing improvements
  4. Suggests SOP updates
  5. Human approves
  6. System immediately smarter
```

## Key Routing Rules

### Emergency Override
```typescript
// Always route to Emergency if detected
if (detectEmergencyKeywords(query)) {
  return {
    route: 'Emergency',
    confidence: 1.0,
    priority: 'URGENT'
  };
}
```

### Business Hours Routing
```typescript
if (!isBusinessHours() && route !== 'Emergency') {
  // Add after-hours context
  context.afterHours = true;
  context.expectDelayedResponse = true;
}
```

### Location-Based Routing
```typescript
if (query.includes(locationKeywords)) {
  context.location = extractLocation(query);
  // Route to location-specific knowledge
}
```

## Fallback Triggers

1. **Low Confidence** (<0.7)
2. **No Assistant Response** (timeout 30s)
3. **Error Response** from assistant
4. **"I don't know"** responses
5. **User marks as "Unhelpful"**
6. **Rate limit exceeded**

## Metrics Tracked

### Routing Performance
- Routes per assistant per day
- Average confidence scores
- Fallback rate by route
- Human intervention rate

### Quality Metrics
- "Helpful" vs "Unhelpful" by route
- Resolution time by type
- Repeat queries (user asking again)

## V2 Improvements

### Better Confidence Calculation
```typescript
// V1: Simple keyword matching
// V2: Semantic understanding
const confidence = await calculateSemanticConfidence(query, route);
```

### Predictive Routing
```typescript
// Learn from patterns
if (user.previousQueries.includes('PIN issue')) {
  boostConfidence('Booking & Access', 0.2);
}
```

### Smart Fallback
```typescript
// Don't always go to Slack
if (similarQueryResolvedRecently(query)) {
  return cachedResponse;
}
```

This routing logic ensures:
1. **Fast responses** for clear queries
2. **Human backup** for edge cases
3. **Continuous learning** from failures
4. **Full auditability** of decisions