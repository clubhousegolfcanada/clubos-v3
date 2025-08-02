# ClubOS V2 Architecture - Revised Database-First Approach

## Critical Architecture Change: PostgreSQL for Everything

### Why This is Better
1. **Single Source of Truth**: All data in PostgreSQL
2. **ACID Compliance**: Transactional updates to SOPs
3. **Version Control Built-in**: Every SOP change tracked with diffs
4. **Instant Updates**: No file sync delays
5. **Queryable**: Can analyze SOP usage patterns
6. **Rollback**: Easy reversion to previous versions

## Revised Database Schema

```sql
-- SOPs as structured data
CREATE TABLE sops (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL, -- 'booking', 'tech_support', etc
    section VARCHAR(200) NOT NULL,   -- 'pin_failures', 'projector_issues'
    content TEXT NOT NULL,           -- Markdown content
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    UNIQUE(category, section)
);

-- SOP version history
CREATE TABLE sop_versions (
    id SERIAL PRIMARY KEY,
    sop_id INTEGER REFERENCES sops(id),
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    diff_summary TEXT,
    changed_by VARCHAR(100) NOT NULL, -- 'claude', 'human', 'system'
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Failed responses for analysis
CREATE TABLE failed_responses (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    assistant_id VARCHAR(100),
    confidence_score FLOAT,
    feedback_type VARCHAR(50), -- 'unhelpful', 'wrong', 'incomplete'
    user_correction TEXT,
    analyzed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claude's improvement suggestions
CREATE TABLE improvement_queue (
    id SERIAL PRIMARY KEY,
    failed_response_id INTEGER REFERENCES failed_responses(id),
    suggested_sop_update JSONB, -- {sop_id, section, new_content, reasoning}
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by VARCHAR(100),
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System knowledge (replaces vector stores)
CREATE TABLE knowledge_base (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    source VARCHAR(100), -- 'sop', 'manual_entry', 'learned'
    usage_count INTEGER DEFAULT 0,
    success_rate FLOAT,
    embeddings vector(1536), -- pgvector for similarity search
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, topic, question)
);
```

## Revised Flow

### 1. Real-time Customer Support
```
Customer Query 
    ↓
GPT-4o Router
    ↓
Query PostgreSQL SOPs + Knowledge Base
    ↓
Generate Response
    ↓
Track Success/Failure
```

### 2. Intelligence Engine Flow
```
Failed Responses Table
    ↓
Claude Batch Analysis (hourly/daily)
    ↓
Pattern Recognition
    ↓
Generate SOP Updates → improvement_queue
    ↓
Human Reviews Queue in UI
    ↓
One-Click Approve
    ↓
PostgreSQL Transaction:
  - Update sops table
  - Insert into sop_versions
  - Update knowledge_base
    ↓
GPT-4o immediately uses new knowledge
```

### 3. Knowledge Building
```sql
-- When response marked helpful
INSERT INTO knowledge_base (category, topic, question, answer, source)
VALUES ('booking', 'pin_issues', $1, $2, 'learned')
ON CONFLICT (category, topic, question) 
DO UPDATE SET 
  usage_count = knowledge_base.usage_count + 1,
  success_rate = (calculate new rate);
```

## Benefits of Database-First

1. **Instant Updates**: No file sync delays
2. **Atomic Operations**: Can't corrupt SOPs mid-update  
3. **Rich Queries**: "Show me all PIN-related failures last week"
4. **Performance**: Indexed searches vs file parsing
5. **Audit Trail**: Every change tracked with who/when/why
6. **A/B Testing**: Can serve different SOP versions to test improvements
7. **Analytics**: Which SOPs are most used? Most failed?

## Migration from V1

```sql
-- Import existing assistant knowledge
INSERT INTO sops (category, section, content)
VALUES 
  ('emergency', 'general', '<content from Emergency assistant>'),
  ('booking', 'general', '<content from Booking assistant>'),
  ('tech_support', 'general', '<content from Tech assistant>'),
  ('brand', 'general', '<content from Brand assistant>');
```

## Google Drive Integration (Optional)

Now Google Drive becomes:
1. **Backup System**: Daily exports of SOPs
2. **Human-Friendly Viewer**: Read-only markdown files
3. **Documentation**: Architecture docs, not operational data

```typescript
// Daily backup job
async function backupSOPsToGoogleDrive() {
  const sops = await db.query('SELECT * FROM sops');
  for (const sop of sops) {
    await googleDrive.uploadFile(
      `${sop.category}/${sop.section}.md`,
      sop.content
    );
  }
}
```

## This Solves

1. **Race Conditions**: No file sync issues
2. **Performance**: Millisecond lookups
3. **Consistency**: ACID guarantees
4. **Scalability**: Can handle millions of SOPs
5. **Security**: Row-level security possible
6. **Integration**: Everything speaks SQL

## Updated V2 Architecture

```
PostgreSQL (Single Source of Truth)
    ├── SOPs (versioned, markdown)
    ├── Failed Responses 
    ├── Improvement Queue
    ├── Knowledge Base (vector embeddings)
    ├── Users, Tickets, Messages, etc.
    │
    ├── GPT-4o reads in real-time
    ├── Claude analyzes and suggests updates
    └── UI for human approval
```

Way cleaner, faster, and more reliable than file-based systems!