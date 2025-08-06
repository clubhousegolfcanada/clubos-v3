-- Migration: Recursive System Learning Architecture
-- Enables intelligent error pattern learning and fix reuse

-- Table for storing learned patterns and fixes
CREATE TABLE IF NOT EXISTS learning_patterns (
  id SERIAL PRIMARY KEY,
  error_signature VARCHAR(255) UNIQUE NOT NULL,
  fix_class VARCHAR(50) NOT NULL, -- debounce, timeout, validation, retry, permission
  reusability VARCHAR(20) NOT NULL CHECK (reusability IN ('conditional', 'universal', 'never')),
  edge_case_flag BOOLEAN DEFAULT FALSE,
  pattern_logic JSONB NOT NULL, -- Stored fix logic and conditions
  module_context VARCHAR(100),
  symptom_description TEXT,
  trigger_conditions JSONB,
  resolution_steps JSONB,
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  match_count INTEGER DEFAULT 1,
  success_count INTEGER DEFAULT 0,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  decay_rate DECIMAL(3,2) DEFAULT 0.05, -- 5% decay per week
  created_by VARCHAR(100) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Error tracking with suppression and pattern linking
CREATE TABLE IF NOT EXISTS error_events (
  id SERIAL PRIMARY KEY,
  error_type VARCHAR(100) NOT NULL,
  error_code VARCHAR(50),
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB NOT NULL, -- Request context, user info, etc.
  severity VARCHAR(20) DEFAULT 'error',
  suppressed BOOLEAN DEFAULT FALSE,
  suppression_count INTEGER DEFAULT 0,
  pattern_id INTEGER REFERENCES learning_patterns(id),
  thread_id INTEGER REFERENCES threads(id),
  user_id INTEGER REFERENCES users(id),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pattern matching history for analysis
CREATE TABLE IF NOT EXISTS pattern_matches (
  id SERIAL PRIMARY KEY,
  error_event_id INTEGER REFERENCES error_events(id),
  pattern_id INTEGER REFERENCES learning_patterns(id),
  similarity_score DECIMAL(3,2) NOT NULL,
  fix_applied BOOLEAN DEFAULT FALSE,
  fix_successful BOOLEAN,
  operator_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_learning_patterns_signature ON learning_patterns(error_signature);
CREATE INDEX idx_learning_patterns_module ON learning_patterns(module_context);
CREATE INDEX idx_learning_patterns_relevance ON learning_patterns(relevance_score DESC);
CREATE INDEX idx_learning_patterns_last_seen ON learning_patterns(last_seen DESC);

CREATE INDEX idx_error_events_type ON error_events(error_type);
CREATE INDEX idx_error_events_created ON error_events(created_at DESC);
CREATE INDEX idx_error_events_pattern ON error_events(pattern_id);
CREATE INDEX idx_error_events_suppressed ON error_events(suppressed);

CREATE INDEX idx_pattern_matches_pattern ON pattern_matches(pattern_id);
CREATE INDEX idx_pattern_matches_similarity ON pattern_matches(similarity_score DESC);

-- Function to update pattern relevance scores
CREATE OR REPLACE FUNCTION update_pattern_relevance()
RETURNS void AS $$
BEGIN
  UPDATE learning_patterns
  SET relevance_score = GREATEST(0.1, relevance_score - decay_rate)
  WHERE last_seen < NOW() - INTERVAL '7 days';
  
  -- Boost relevance for recently used patterns
  UPDATE learning_patterns
  SET relevance_score = LEAST(1.0, relevance_score + 0.1)
  WHERE last_seen > NOW() - INTERVAL '24 hours'
  AND success_count > match_count * 0.7;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate error signature
CREATE OR REPLACE FUNCTION generate_error_signature(
  error_type VARCHAR,
  error_code VARCHAR,
  module_context VARCHAR,
  context JSONB
)
RETURNS VARCHAR AS $$
DECLARE
  signature VARCHAR;
BEGIN
  -- Create deterministic signature from error components
  signature := MD5(
    COALESCE(error_type, '') || ':' ||
    COALESCE(error_code, '') || ':' ||
    COALESCE(module_context, '') || ':' ||
    COALESCE(context->>'endpoint', '') || ':' ||
    COALESCE(context->>'action', '')
  );
  
  RETURN signature;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE TRIGGER update_learning_patterns_timestamp
  BEFORE UPDATE ON learning_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View for pattern effectiveness
CREATE OR REPLACE VIEW pattern_effectiveness AS
SELECT 
  lp.id,
  lp.error_signature,
  lp.fix_class,
  lp.module_context,
  lp.match_count,
  lp.success_count,
  CASE 
    WHEN lp.match_count > 0 
    THEN ROUND((lp.success_count::decimal / lp.match_count) * 100, 2)
    ELSE 0 
  END as success_rate,
  lp.relevance_score,
  lp.last_seen,
  COUNT(DISTINCT ee.id) as recent_occurrences
FROM learning_patterns lp
LEFT JOIN error_events ee ON lp.id = ee.pattern_id
  AND ee.created_at > NOW() - INTERVAL '7 days'
GROUP BY lp.id;

-- Comments
COMMENT ON TABLE learning_patterns IS 'Stores reusable error resolution patterns learned from system operations';
COMMENT ON TABLE error_events IS 'Tracks all errors with context for pattern matching and suppression';
COMMENT ON TABLE pattern_matches IS 'History of pattern matching attempts and their outcomes';
COMMENT ON FUNCTION generate_error_signature IS 'Creates deterministic signature for error deduplication and pattern matching';