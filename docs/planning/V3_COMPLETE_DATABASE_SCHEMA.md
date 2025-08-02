# ClubOS V2 Complete Database Schema

## Overview
This is the comprehensive database schema for ClubOS V2, combining all planning documents into a single source of truth.

## Core Tables

### 1. Routing & Tracing
```sql
-- Every query gets traced through the system
CREATE TABLE routing_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    user_id INTEGER,
    session_id VARCHAR(100),
    location VARCHAR(100),
    
    -- Routing decision
    assistant_selected VARCHAR(50) NOT NULL,
    routing_confidence FLOAT NOT NULL,
    routing_method VARCHAR(20), -- 'keyword', 'semantic', 'hybrid'
    alternative_routes JSONB, -- [{assistant, confidence}]
    
    -- Response tracking
    response TEXT,
    response_time_ms INTEGER,
    success BOOLEAN,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_traces_created (created_at DESC),
    INDEX idx_traces_assistant (assistant_selected)
);
```

### 2. Assistant Configuration
```sql
-- 7 Assistants from V3 Architecture
CREATE TABLE assistant_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    assistant_id VARCHAR(100), -- OpenAI Assistant ID
    purpose TEXT NOT NULL,
    access_roles TEXT[] NOT NULL,
    keywords TEXT[] NOT NULL,
    is_public BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 100, -- Emergency = 1
    
    -- Configuration
    model VARCHAR(50) DEFAULT 'gpt-4o',
    temperature FLOAT DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 500,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert 7 assistants
INSERT INTO assistant_configs (name, purpose, access_roles, keywords, is_public, priority) VALUES
('Emergency', 'Safety and urgent situations', ARRAY['all'], ARRAY['fire', 'medical', 'injured', 'hurt', 'evacuation', 'emergency', 'safety'], true, 1),
('Booking', 'Reservations and access control', ARRAY['admin','manager','operator','support'], ARRAY['book', 'PIN', 'access', 'refund', 'credit', 'reservation', 'membership'], false, 10),
('TechSupport', 'Equipment and technical issues', ARRAY['admin','manager','operator','support'], ARRAY['TrackMan', 'projector', 'reset', 'HDMI', 'simulator', 'screen', 'computer'], false, 20),
('BrandVoice', 'Transform text into brand voice', ARRAY['admin','manager','operator','support'], ARRAY['write', 'draft', 'email', 'message', 'announcement', 'tone', 'voice'], false, 30),
('Strategy', 'Business intelligence and planning', ARRAY['admin','manager'], ARRAY['competitor', 'revenue', 'strategy', 'plan', 'risk', 'forecast', 'Better Golf'], false, 40),
('CustomerInfo', 'Public information for customers', ARRAY['all'], ARRAY['hours', 'location', 'prices', 'lessons', 'membership', 'about', 'contact'], true, 50),
('General', 'Catch-all knowledge base', ARRAY['admin','manager','operator','support'], ARRAY[], false, 100);
```

### 3. Knowledge Management
```sql
-- SOPs as structured data (from V2_DATABASE_FIRST_ARCHITECTURE)
CREATE TABLE sops (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL, -- maps to assistant name
    section VARCHAR(200) NOT NULL,
    content TEXT NOT NULL, -- Markdown
    version INTEGER DEFAULT 1,
    sha256_hash VARCHAR(64) NOT NULL, -- For integrity checks
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    
    UNIQUE(category, section),
    INDEX idx_sops_category (category)
);

-- Version history with diffs
CREATE TABLE sop_versions (
    id SERIAL PRIMARY KEY,
    sop_id INTEGER REFERENCES sops(id),
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    diff_summary TEXT,
    changed_by VARCHAR(100) NOT NULL, -- 'claude', 'human', 'system'
    change_reason TEXT,
    ticket_ids INTEGER[], -- Related tickets that triggered change
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_versions_sop (sop_id, version DESC)
);

-- Knowledge items for quick lookup
CREATE TABLE knowledge_items (
    id SERIAL PRIMARY KEY,
    assistant VARCHAR(50) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    source VARCHAR(50), -- 'sop', 'manual', 'learned', 'claude'
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    success_rate FLOAT GENERATED ALWAYS AS 
        (CASE WHEN usage_count > 0 THEN success_count::FLOAT / usage_count ELSE 0 END) STORED,
    
    -- For semantic search (optional)
    embeddings vector(1536),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(assistant, topic, question),
    INDEX idx_knowledge_assistant (assistant),
    INDEX idx_knowledge_usage (usage_count DESC)
);
```

### 4. Intelligence Engine
```sql
-- Failed interactions for Claude to analyze
CREATE TABLE failed_interactions (
    id SERIAL PRIMARY KEY,
    trace_id UUID REFERENCES routing_traces(id),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    assistant VARCHAR(50) NOT NULL,
    confidence_score FLOAT,
    
    -- Feedback
    feedback_type VARCHAR(50), -- 'unhelpful', 'wrong', 'incomplete', 'slow'
    user_correction TEXT,
    user_id INTEGER,
    
    -- Processing status
    analyzed BOOLEAN DEFAULT FALSE,
    analyzed_at TIMESTAMP,
    improvement_id INTEGER, -- Links to improvement_suggestions
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_failed_unanalyzed (analyzed, created_at)
);

-- Claude's improvement suggestions
CREATE TABLE improvement_suggestions (
    id SERIAL PRIMARY KEY,
    
    -- What failed
    failed_interaction_ids INTEGER[], -- Can group multiple failures
    failure_pattern TEXT, -- Claude's analysis of the pattern
    
    -- Suggested fix
    suggestion_type VARCHAR(50), -- 'sop_update', 'new_knowledge', 'routing_fix'
    target_sop_id INTEGER REFERENCES sops(id),
    suggested_content TEXT, -- New content
    current_content_hash VARCHAR(64), -- SHA of current content for validation
    reasoning TEXT, -- Why this would help
    
    -- Approval workflow
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'applied'
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Application
    applied_at TIMESTAMP,
    applied_version INTEGER, -- SOP version created
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_suggestions_pending (status, created_at)
);

-- Write-ahead log for changes
CREATE TABLE wal_entries (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR(50), -- 'sop_update', 'knowledge_add', 'config_change'
    target_table VARCHAR(50),
    target_id INTEGER,
    
    -- Change details
    before_state JSONB,
    after_state JSONB,
    change_reason TEXT,
    
    -- Validation
    sha_before VARCHAR(64),
    sha_after VARCHAR(64),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'committed', 'rolled_back'
    committed_at TIMESTAMP,
    rolled_back_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    INDEX idx_wal_pending (status, created_at)
);
```

### 5. Response Caching (Fast Response Architecture)
```sql
-- L3 Cache: Database cache for responses
CREATE TABLE response_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(64) NOT NULL, -- Hash of query + context
    query TEXT NOT NULL,
    assistant VARCHAR(50) NOT NULL,
    response TEXT NOT NULL,
    
    -- Cache metadata
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMP,
    ttl_seconds INTEGER DEFAULT 3600, -- 1 hour default
    expires_at TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(cache_key),
    INDEX idx_cache_expires (expires_at),
    INDEX idx_cache_hits (hit_count DESC)
);

-- Semantic similarity cache
CREATE TABLE semantic_cache (
    id SERIAL PRIMARY KEY,
    query_embedding vector(1536) NOT NULL,
    query_text TEXT NOT NULL,
    response TEXT NOT NULL,
    assistant VARCHAR(50) NOT NULL,
    
    similarity_threshold FLOAT DEFAULT 0.95,
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    INDEX idx_semantic_embedding (query_embedding vector_cosine_ops)
);
```

### 6. Access Control & Security
```sql
-- User roles and permissions
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- 'admin', 'manager', 'operator', 'support', 'kiosk', 'customer'
    
    -- Auth
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    INDEX idx_users_role (role)
);

-- Audit log for all sensitive operations
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'sop_update', 'approval', 'config_change'
    target_type VARCHAR(50),
    target_id INTEGER,
    
    -- Details
    before_value JSONB,
    after_value JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_user (user_id, created_at DESC),
    INDEX idx_audit_action (action, created_at DESC)
);
```

### 7. Business Intelligence (Strategy Assistant)
```sql
-- Separate schema for sensitive data
CREATE SCHEMA strategy;

-- Competitor analysis
CREATE TABLE strategy.competitors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100), -- 'direct', 'indirect', 'potential'
    
    -- Data points
    pricing JSONB,
    locations JSONB,
    services TEXT[],
    strengths TEXT,
    weaknesses TEXT,
    market_share DECIMAL(5,2),
    
    -- Metadata
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    
    UNIQUE(name)
);

-- Financial metrics
CREATE TABLE strategy.financials (
    id SERIAL PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'quarterly'
    
    -- Metrics
    revenue DECIMAL(12,2),
    costs DECIMAL(12,2),
    profit DECIMAL(12,2),
    
    -- Breakdown
    revenue_by_location JSONB,
    revenue_by_service JSONB,
    costs_breakdown JSONB,
    
    -- KPIs
    metrics JSONB, -- {bookings: 100, avg_duration: 1.5, ...}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(period_start, period_end, period_type)
);
```

### 8. Public Information (Customer Info Assistant)
```sql
-- Safe, approved public information
CREATE TABLE public_info (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL, -- 'hours', 'pricing', 'services', 'policies'
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    -- Control
    is_active BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_until DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(100),
    
    INDEX idx_public_active (is_active, category)
);

-- Pre-load safe responses
INSERT INTO public_info (category, question, answer) VALUES
('hours', 'What are your hours?', 'We''re open Monday-Friday 6am-11pm, and Saturday-Sunday 7am-10pm.'),
('pricing', 'How much does it cost?', 'Bay rental starts at $40/hour. Visit our website for current pricing and packages.'),
('services', 'Do you offer lessons?', 'Yes! We offer individual and group lessons with PGA professionals.'),
('contact', 'How do I book?', 'Book online at our website or visit us in person at any location.');
```

## Indexes for Performance

```sql
-- Performance indexes
CREATE INDEX idx_traces_user_recent ON routing_traces(user_id, created_at DESC);
CREATE INDEX idx_traces_session ON routing_traces(session_id, created_at DESC);
CREATE INDEX idx_knowledge_search ON knowledge_items USING gin(to_tsvector('english', question || ' ' || answer));
CREATE INDEX idx_sops_search ON sops USING gin(to_tsvector('english', content));

-- Monitoring indexes
CREATE INDEX idx_failed_by_assistant ON failed_interactions(assistant, created_at DESC);
CREATE INDEX idx_cache_cleanup ON response_cache(expires_at) WHERE expires_at < NOW();
```

## Migration from V1

```sql
-- Import V1 data
INSERT INTO sops (category, section, content, sha256_hash)
SELECT 
    'imported_v1',
    'general',
    'Content from V1 assistants...',
    encode(sha256('Content from V1 assistants...'::bytea), 'hex')
FROM v1_assistant_data;

-- Import conversation history
INSERT INTO routing_traces (query, assistant_selected, routing_confidence, response, created_at)
SELECT 
    query,
    'General',
    0.5,
    response,
    created_at
FROM v1_conversations;
```

## Benefits of This Schema

1. **Complete Traceability**: Every query traced with UUID
2. **Version Control**: Full history of all changes
3. **Performance**: Proper indexes for fast lookups
4. **Security**: Row-level security ready, audit logging
5. **Intelligence**: Failed interactions → improvements
6. **Caching**: Multi-tier cache support
7. **Scalability**: Partitioning ready for large tables
8. **Analytics**: Rich data for business intelligence

This schema supports all V2 features while maintaining V1 compatibility during migration.