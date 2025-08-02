# ClubOS V2 Fast Response Architecture

## Problem: OpenAI Assistant Latency
- Current: 5-15 seconds for vector search + generation
- Target: <2 seconds for 95% of queries

## Solution: Local Knowledge Cache + Smart Retrieval

### 1. Three-Tier Response Strategy

```typescript
// services/fastResponseEngine.ts
export class FastResponseEngine {
  private cache: ResponseCache;
  private db: PostgresDB;
  private openai: OpenAI;
  
  async handleQuery(query: string, context: RoutingContext): Promise<Response> {
    const startTime = Date.now();
    
    // Tier 1: Exact Match Cache (<100ms)
    const cached = await this.checkExactCache(query);
    if (cached) {
      return this.respond(cached, 'cache_exact', startTime);
    }
    
    // Tier 2: Semantic Cache (<500ms)
    const semantic = await this.checkSemanticCache(query);
    if (semantic && semantic.confidence > 0.9) {
      return this.respond(semantic, 'cache_semantic', startTime);
    }
    
    // Tier 3: Database Knowledge (<1s)
    const dbResult = await this.queryKnowledgeDB(query);
    if (dbResult && dbResult.confidence > 0.8) {
      return this.respond(dbResult, 'database', startTime);
    }
    
    // Tier 4: Generate New (1-3s)
    const generated = await this.generateResponse(query, context);
    
    // Cache for next time
    await this.cacheResponse(query, generated);
    
    return this.respond(generated, 'generated', startTime);
  }
}
```

### 2. In-Memory Response Cache

```typescript
// services/responseCache.ts
export class ResponseCache {
  private exactMatch: Map<string, CachedResponse> = new Map();
  private semanticCache: VectorCache;
  private maxSize = 10000;
  
  constructor() {
    // Pre-load common queries
    this.preloadCommonQueries();
    
    // Initialize vector cache
    this.semanticCache = new VectorCache({
      dimensions: 384, // Using MiniLM for speed
      maxVectors: 5000
    });
  }
  
  async checkExact(query: string): Promise<CachedResponse | null> {
    const normalized = this.normalize(query);
    const cached = this.exactMatch.get(normalized);
    
    if (cached && !this.isExpired(cached)) {
      cached.hitCount++;
      return cached;
    }
    
    return null;
  }
  
  async checkSemantic(query: string): Promise<SemanticMatch | null> {
    // Generate embedding using fast model
    const embedding = await this.getFastEmbedding(query);
    
    // Find similar in cache
    const matches = await this.semanticCache.search(embedding, 5);
    
    if (matches[0]?.score > 0.9) {
      return {
        response: matches[0].response,
        confidence: matches[0].score,
        source: 'semantic_cache'
      };
    }
    
    return null;
  }
  
  private async getFastEmbedding(text: string): Promise<number[]> {
    // Use MiniLM locally for speed (50ms vs 500ms for OpenAI)
    return await this.miniLM.encode(text);
  }
}
```

### 3. PostgreSQL Knowledge Tables (Optimized)

```sql
-- Pre-computed responses with embeddings
CREATE TABLE knowledge_responses (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50),
  question_pattern TEXT,
  answer TEXT,
  embedding vector(384), -- Smaller, faster embeddings
  confidence FLOAT,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_embedding USING ivfflat (embedding vector_cosine_ops)
);

-- Common variations pre-computed
CREATE TABLE question_variations (
  id SERIAL PRIMARY KEY,
  knowledge_id INTEGER REFERENCES knowledge_responses(id),
  variation TEXT,
  normalized TEXT,
  INDEX idx_normalized (normalized),
  INDEX idx_knowledge (knowledge_id)
);

-- Fast exact lookup
CREATE TABLE faq_exact (
  query_hash VARCHAR(64) PRIMARY KEY,
  response TEXT,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Pre-computation Strategy

```typescript
// scripts/precomputeResponses.ts
export async function precomputeCommonResponses() {
  // 1. Analyze historical queries
  const commonQueries = await db.query(`
    SELECT query, COUNT(*) as count
    FROM routing_traces
    WHERE success = true
    GROUP BY query
    ORDER BY count DESC
    LIMIT 1000
  `);
  
  // 2. Generate responses for common patterns
  for (const record of commonQueries.rows) {
    const variations = generateVariations(record.query);
    
    for (const variation of variations) {
      const response = await generateOptimalResponse(variation);
      
      // Store with embeddings
      await storePrecomputed(variation, response);
    }
  }
  
  // 3. Create response templates
  const templates = [
    {
      pattern: /PIN.*(not|isn't|won't).*work/i,
      template: "I can help with your PIN issue. First, please confirm you're at the correct location. Your PIN is typically the last 4 digits of your phone number. If that doesn't work, I can look up your booking."
    },
    {
      pattern: /hours|open|close/i,
      template: "Our hours are: Monday-Friday 6am-11pm, Saturday-Sunday 7am-10pm. Holiday hours may vary."
    }
  ];
  
  await storeTemplates(templates);
}
```

### 5. Local Assistant Architecture

```typescript
// services/localAssistant.ts
export class LocalAssistant {
  private knowledgeDB: KnowledgeDB;
  private responseCache: ResponseCache;
  private templates: TemplateEngine;
  
  async process(query: string, route: string): Promise<AssistantResponse> {
    // 1. Check templates (instant)
    const template = this.templates.match(query);
    if (template) {
      return this.formatResponse(template, 'template');
    }
    
    // 2. Query local knowledge
    const knowledge = await this.knowledgeDB.query(`
      SELECT answer, confidence
      FROM knowledge_responses
      WHERE category = $1
      ORDER BY embedding <=> $2
      LIMIT 1
    `, [route, await this.getEmbedding(query)]);
    
    if (knowledge.rows[0]?.confidence > 0.8) {
      return this.formatResponse(knowledge.rows[0].answer, 'local_kb');
    }
    
    // 3. Only use OpenAI for complex/unknown
    return this.fallbackToOpenAI(query);
  }
}
```

### 6. Response Time Optimization

```typescript
// middleware/responseOptimizer.ts
export class ResponseOptimizer {
  // Stream response as it's generated
  async streamResponse(query: string, res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Send immediate acknowledgment
    res.write('data: {"type": "ack", "message": "Processing..."}\n\n');
    
    // Check cache while user sees "Processing..."
    const cached = await this.checkAllCaches(query);
    
    if (cached) {
      res.write(`data: {"type": "response", "message": "${cached.response}", "confidence": ${cached.confidence}}\n\n`);
      res.end();
      return;
    }
    
    // Stream GPT response token by token
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: query }],
      stream: true
    });
    
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      res.write(`data: {"type": "token", "content": "${token}"}\n\n`);
    }
    
    res.end();
  }
}
```

### 7. Performance Metrics

```typescript
// monitoring/performance.ts
export const PERFORMANCE_TARGETS = {
  cache_exact: 100,      // ms
  cache_semantic: 500,   // ms
  database: 1000,        // ms
  generated: 3000,       // ms
  p95_target: 2000      // 95% under 2 seconds
};

// Track and optimize
async function trackResponseTime(method: string, duration: number) {
  metrics.gauge('response_time', duration, { method });
  
  if (duration > PERFORMANCE_TARGETS[method]) {
    logger.warn('Slow response detected', { method, duration });
  }
}
```

## Implementation Priority

1. **Week 1**: Implement exact match cache + FAQ table
2. **Week 2**: Add semantic cache with MiniLM
3. **Week 3**: Pre-compute common responses
4. **Week 4**: Add streaming responses
5. **Week 5**: Optimize database queries
6. **Week 6**: Load test and tune

## Expected Performance

| Query Type | Current (OpenAI Assistants) | New Architecture |
|------------|---------------------------|------------------|
| FAQ/Common | 5-8 seconds | <100ms |
| Semantic Match | 6-10 seconds | <500ms |
| Database Lookup | 7-12 seconds | <1 second |
| Generated | 8-15 seconds | 2-3 seconds |
| **P95 Overall** | **10 seconds** | **<2 seconds** |

This gives you 5-10x speed improvement while maintaining quality!