# ClubOS V2 Enhanced Routing Architecture

## Hybrid Routing: Keywords + Semantic Understanding

### 1. Trace ID Implementation
```typescript
// Every request gets a unique trace ID
import { v4 as uuidv4 } from 'uuid';

interface RoutingContext {
  traceId: string;
  timestamp: Date;
  userId: string;
  location?: string;
  sessionId: string;
  previousQueries?: string[];
}

// Flows through entire system
async function handleQuery(query: string, context: Partial<RoutingContext>) {
  const traceId = uuidv4();
  const fullContext = {
    traceId,
    timestamp: new Date(),
    ...context
  };
  
  logger.info('Query received', { traceId, query });
  
  try {
    // Route with trace ID
    const route = await router.route(query, fullContext);
    
    // Assistant processes with same ID
    const response = await assistant.process(route, fullContext);
    
    // Log complete chain
    await logRoutingDecision(traceId, route, response);
    
    return response;
  } catch (error) {
    // Fallback keeps trace ID
    await slackFallback(query, fullContext, error);
  }
}
```

### 2. Hybrid Routing Engine
```typescript
// services/hybridRouter.ts
export class HybridRouter {
  private embeddings: EmbeddingService;
  private keywordMatcher: KeywordMatcher;
  
  async route(query: string, context: RoutingContext): Promise<RouteDecision> {
    // 1. Emergency override (keywords only for speed)
    if (this.detectEmergency(query)) {
      return {
        assistant: 'Emergency',
        confidence: 1.0,
        method: 'keyword_override',
        traceId: context.traceId
      };
    }
    
    // 2. Parallel routing strategies
    const [keywordRoute, semanticRoute] = await Promise.all([
      this.keywordRoute(query),
      this.semanticRoute(query, context)
    ]);
    
    // 3. Combine strategies
    const hybridDecision = this.combineRoutes(keywordRoute, semanticRoute);
    
    // 4. Context boost (user history)
    const contextualRoute = this.applyContextBoost(hybridDecision, context);
    
    return {
      ...contextualRoute,
      traceId: context.traceId,
      method: 'hybrid'
    };
  }
  
  private async semanticRoute(query: string, context: RoutingContext) {
    // Generate embedding for query
    const queryEmbedding = await this.embeddings.generate(query);
    
    // Compare against assistant embeddings
    const similarities = await this.compareToAssistants(queryEmbedding);
    
    // Find best match
    const bestMatch = similarities.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return {
      assistant: bestMatch.assistant,
      confidence: bestMatch.score,
      method: 'semantic'
    };
  }
  
  private combineRoutes(keyword: RouteResult, semantic: RouteResult): RouteResult {
    // If keyword confidence is very high, trust it
    if (keyword.confidence > 0.9) return keyword;
    
    // If semantic confidence is high and keyword is low
    if (semantic.confidence > 0.8 && keyword.confidence < 0.6) return semantic;
    
    // Otherwise, weighted average
    const combinedConfidence = (keyword.confidence * 0.4) + (semantic.confidence * 0.6);
    
    // Use semantic choice if scores are close
    return {
      assistant: semantic.assistant,
      confidence: combinedConfidence,
      method: 'hybrid'
    };
  }
}
```

### 3. Enhanced 7-Assistant Architecture with Proper Scoping

```typescript
// config/assistants.ts
export const ASSISTANT_CONFIG = {
  Emergency: {
    keywords: ['fire', 'injury', 'emergency', 'hurt', 'safety'],
    embedding: 'embeddings/emergency.json',
    slackChannel: '#alerts-emergency',
    priority: 'URGENT'
  },
  
  Booking: {
    keywords: ['book', 'reservation', 'PIN', 'access', 'cancel'],
    embedding: 'embeddings/booking.json',
    slackChannel: '#support-booking',
    priority: 'HIGH'
  },
  
  TechSupport: {
    keywords: ['TrackMan', 'projector', 'reset', 'broken', 'fix'],
    embedding: 'embeddings/tech.json',
    slackChannel: '#support-technical',
    priority: 'MEDIUM'
  },
  
  // SPLIT BrandTone into specialized assistants
  Pricing: {
    keywords: ['price', 'cost', 'rate', 'discount', 'package'],
    embedding: 'embeddings/pricing.json',
    slackChannel: '#ops-pricing',
    priority: 'MEDIUM'
  },
  
  Locations: {
    keywords: ['location', 'address', 'directions', 'where', 'map'],
    embedding: 'embeddings/locations.json',
    slackChannel: '#info-locations',
    priority: 'LOW'
  },
  
  BrandVoice: {
    keywords: ['write', 'draft', 'tone', 'message', 'announcement'],
    embedding: 'embeddings/brand.json',
    slackChannel: '#marketing-content',
    priority: 'LOW'
  },
  
  Strategy: {
    keywords: ['competitor', 'revenue', 'forecast', 'plan', 'analysis'],
    embedding: 'embeddings/strategy.json',
    slackChannel: '#leadership-strategy',
    priority: 'LOW',
    restricted: true
  },
  
  CustomerInfo: {
    keywords: ['hours', 'open', 'close', 'birthday', 'party'],
    embedding: 'embeddings/customer.json',
    slackChannel: '#public-inquiries',
    priority: 'LOW'
  },
  
  ClubhouseGeneral: {
    keywords: [], // Catch-all, no specific keywords
    embedding: 'embeddings/general.json',
    slackChannel: '#support-general',
    priority: 'LOW'
  }
};
```

### 4. Slack Channel Strategy
```typescript
// services/slackRouter.ts
export class SlackRouter {
  async routeToSlack(
    query: string, 
    context: RoutingContext,
    failureReason: string
  ) {
    const assistant = context.attemptedAssistant;
    const config = ASSISTANT_CONFIG[assistant];
    
    // Determine channel based on context
    let channel = config.slackChannel;
    
    // Override for urgent/emergency
    if (config.priority === 'URGENT') {
      channel = '#alerts-emergency';
      await this.pageOnCall(context);
    }
    
    // Route by time of day
    if (!isBusinessHours() && config.priority !== 'URGENT') {
      channel = '#after-hours-support';
    }
    
    // Send with full context
    await slack.send({
      channel,
      text: `🔔 Assistance needed (${config.priority})`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Trace ID:* ${context.traceId}\n*Query:* ${query}\n*Attempted:* ${assistant}\n*Confidence:* ${context.confidence}\n*Reason:* ${failureReason}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Claim' },
              action_id: `claim_${context.traceId}`
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Escalate' },
              action_id: `escalate_${context.traceId}`,
              style: 'danger'
            }
          ]
        }
      ]
    });
  }
}
```

### 5. Semantic Training Pipeline
```typescript
// scripts/trainAssistantEmbeddings.ts
export async function trainAssistantEmbeddings() {
  for (const [name, config] of Object.entries(ASSISTANT_CONFIG)) {
    console.log(`Training embeddings for ${name}...`);
    
    // Gather training data
    const trainingQueries = await db.query(`
      SELECT query FROM routing_decisions 
      WHERE route_chosen = $1 
      AND feedback_rating = 'helpful'
      LIMIT 1000
    `, [name]);
    
    // Generate embeddings
    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: trainingQueries.rows.map(r => r.query)
    });
    
    // Calculate centroid
    const centroid = calculateCentroid(embeddings.data);
    
    // Save for runtime comparison
    await fs.writeFile(
      config.embedding,
      JSON.stringify({ name, centroid, samples: embeddings.data })
    );
  }
}
```

### 6. Complete Trace Chain
```sql
-- Trace through entire system
CREATE TABLE routing_traces (
  trace_id UUID PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Request
  query TEXT,
  user_id VARCHAR(100),
  context JSONB,
  
  -- Routing
  keyword_route VARCHAR(50),
  keyword_confidence FLOAT,
  semantic_route VARCHAR(50),
  semantic_confidence FLOAT,
  final_route VARCHAR(50),
  final_confidence FLOAT,
  
  -- Processing
  assistant_response TEXT,
  response_time_ms INTEGER,
  success BOOLEAN,
  
  -- Fallback
  fallback_triggered BOOLEAN,
  slack_channel VARCHAR(50),
  slack_message_id VARCHAR(100),
  human_responder VARCHAR(100),
  human_response TEXT,
  
  -- Learning
  marked_unhelpful BOOLEAN,
  claude_analyzed BOOLEAN,
  sop_update_suggested BOOLEAN,
  sop_update_applied BOOLEAN
);

-- Index for analysis
CREATE INDEX idx_traces_unhelpful ON routing_traces(marked_unhelpful) 
WHERE marked_unhelpful = true;
```

## Benefits of Enhanced Routing

1. **Synonym Resilience**: Semantic routing handles "I'm hurt" = "injury" = "medical emergency"
2. **Trace Everything**: One ID follows query through entire lifecycle
3. **Smart Slack Routing**: Right team gets right alerts
4. **Learns from Success**: Embeddings improve from helpful responses
5. **Granular Assistants**: No more overloaded BrandTone
6. **Context Aware**: Boosts confidence based on user history

## Channel Strategy Summary

- `#alerts-emergency` - Urgent/safety (pages on-call)
- `#support-booking` - Reservation issues  
- `#support-technical` - Equipment problems
- `#ops-pricing` - Pricing questions
- `#marketing-content` - Content creation
- `#leadership-strategy` - Business intelligence (restricted)
- `#support-general` - Catch-all
- `#after-hours-support` - Non-urgent after hours

This creates a production-ready routing system that scales with language variation!