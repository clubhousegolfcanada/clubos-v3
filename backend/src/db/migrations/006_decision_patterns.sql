-- Migration: Adaptive Decision Memory System
-- Extends pattern learning beyond errors to all system decisions

-- Table for storing all types of decision patterns
CREATE TABLE IF NOT EXISTS decision_patterns (
  id SERIAL PRIMARY KEY,
  decision_type VARCHAR(50) NOT NULL, -- booking_conflict, access_issue, customer_request, etc.
  trigger_signature VARCHAR(255) UNIQUE NOT NULL,
  decision_logic JSONB NOT NULL, -- Complete decision logic and steps
  confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  auto_executable BOOLEAN DEFAULT FALSE, -- Can be executed without human approval
  requires_validation JSONB, -- Conditions that must be checked before execution
  side_effects JSONB, -- External actions required (notifications, API calls, etc.)
  
  -- Performance tracking
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  human_override_count INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER,
  
  -- Learning metadata
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  last_modified TIMESTAMP DEFAULT NOW(),
  last_human_override TIMESTAMP,
  created_by VARCHAR(100) DEFAULT 'system',
  
  -- Relationships
  parent_pattern_id INTEGER REFERENCES decision_patterns(id),
  related_sop_id INTEGER REFERENCES sops(id),
  
  CONSTRAINT valid_success_rate CHECK (success_count <= execution_count),
  CONSTRAINT valid_failure_rate CHECK (failure_count <= execution_count)
);

-- Link decision patterns to learning patterns for unified view
ALTER TABLE learning_patterns 
ADD COLUMN IF NOT EXISTS decision_pattern_id INTEGER REFERENCES decision_patterns(id);

-- Table for tracking pattern execution history
CREATE TABLE IF NOT EXISTS pattern_execution_history (
  id SERIAL PRIMARY KEY,
  pattern_id INTEGER REFERENCES decision_patterns(id),
  trigger_event JSONB NOT NULL, -- What triggered this execution
  execution_context JSONB NOT NULL, -- Full context at execution time
  
  -- Execution details
  confidence_at_execution DECIMAL(3,2) NOT NULL,
  was_auto_executed BOOLEAN DEFAULT FALSE,
  human_approved BOOLEAN,
  human_modified BOOLEAN DEFAULT FALSE,
  modifications JSONB, -- What was changed by human
  
  -- Results
  execution_status VARCHAR(20) CHECK (execution_status IN ('success', 'failure', 'partial', 'cancelled')),
  execution_time_ms INTEGER,
  result_details JSONB,
  error_message TEXT,
  
  -- Who and when
  executed_by INTEGER REFERENCES users(id),
  thread_id INTEGER REFERENCES threads(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table for anomaly detection
CREATE TABLE IF NOT EXISTS anomalies (
  id SERIAL PRIMARY KEY,
  anomaly_type VARCHAR(50) NOT NULL, -- new_pattern, edge_case, unusual_context, etc.
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Anomaly details
  event_data JSONB NOT NULL,
  detection_reason TEXT NOT NULL,
  similar_patterns JSONB, -- Patterns that were close but didn't match
  confidence_gap DECIMAL(3,2), -- How far below threshold
  
  -- Resolution
  resolution_status VARCHAR(20) DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'ignored', 'escalated')),
  resolution_pattern_id INTEGER REFERENCES decision_patterns(id),
  resolved_by INTEGER REFERENCES users(id),
  resolution_notes TEXT,
  
  -- Tracking
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  escalated_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_decision_patterns_type ON decision_patterns(decision_type);
CREATE INDEX idx_decision_patterns_confidence ON decision_patterns(confidence_score DESC);
CREATE INDEX idx_decision_patterns_auto ON decision_patterns(auto_executable);
CREATE INDEX idx_decision_patterns_signature ON decision_patterns(trigger_signature);

CREATE INDEX idx_pattern_execution_pattern ON pattern_execution_history(pattern_id);
CREATE INDEX idx_pattern_execution_status ON pattern_execution_history(execution_status);
CREATE INDEX idx_pattern_execution_created ON pattern_execution_history(created_at DESC);

CREATE INDEX idx_anomalies_type ON anomalies(anomaly_type);
CREATE INDEX idx_anomalies_severity ON anomalies(severity);
CREATE INDEX idx_anomalies_status ON anomalies(resolution_status);
CREATE INDEX idx_anomalies_detected ON anomalies(detected_at DESC);

-- Function to calculate pattern success rate
CREATE OR REPLACE FUNCTION calculate_pattern_success_rate(pattern_id INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  total_executions INTEGER;
  successful_executions INTEGER;
BEGIN
  SELECT execution_count, success_count 
  INTO total_executions, successful_executions
  FROM decision_patterns 
  WHERE id = pattern_id;
  
  IF total_executions = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((successful_executions::DECIMAL / total_executions) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update pattern confidence based on outcomes
CREATE OR REPLACE FUNCTION update_pattern_confidence()
RETURNS TRIGGER AS $$
DECLARE
  success_rate DECIMAL;
  recent_failures INTEGER;
BEGIN
  -- Calculate success rate
  success_rate := calculate_pattern_success_rate(NEW.pattern_id);
  
  -- Count recent failures
  SELECT COUNT(*) INTO recent_failures
  FROM pattern_execution_history
  WHERE pattern_id = NEW.pattern_id
  AND execution_status = 'failure'
  AND created_at > NOW() - INTERVAL '7 days';
  
  -- Update confidence based on performance
  UPDATE decision_patterns
  SET confidence_score = CASE
    WHEN success_rate >= 95 AND execution_count >= 10 THEN LEAST(confidence_score + 0.05, 0.99)
    WHEN success_rate >= 80 AND execution_count >= 5 THEN LEAST(confidence_score + 0.02, 0.95)
    WHEN success_rate < 50 OR recent_failures > 3 THEN GREATEST(confidence_score - 0.1, 0.1)
    ELSE confidence_score
  END,
  auto_executable = CASE
    WHEN confidence_score >= 0.95 AND success_rate >= 90 AND execution_count >= 20 THEN TRUE
    WHEN success_rate < 80 OR recent_failures > 5 THEN FALSE
    ELSE auto_executable
  END,
  last_seen = NOW()
  WHERE id = NEW.pattern_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update confidence after each execution
CREATE TRIGGER update_confidence_after_execution
  AFTER INSERT ON pattern_execution_history
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_confidence();

-- View for pattern effectiveness dashboard
CREATE OR REPLACE VIEW pattern_effectiveness_dashboard AS
SELECT 
  dp.id,
  dp.decision_type,
  dp.confidence_score,
  dp.auto_executable,
  dp.execution_count,
  calculate_pattern_success_rate(dp.id) as success_rate,
  dp.human_override_count,
  CASE 
    WHEN dp.execution_count > 0 
    THEN ROUND((dp.human_override_count::DECIMAL / dp.execution_count) * 100, 2)
    ELSE 0 
  END as override_rate,
  dp.avg_execution_time_ms,
  dp.last_seen,
  COUNT(DISTINCT peh.id) FILTER (WHERE peh.created_at > NOW() - INTERVAL '24 hours') as executions_last_24h,
  COUNT(DISTINCT a.id) FILTER (WHERE a.resolution_status = 'pending') as pending_anomalies
FROM decision_patterns dp
LEFT JOIN pattern_execution_history peh ON dp.id = peh.pattern_id
LEFT JOIN anomalies a ON dp.id = a.resolution_pattern_id
GROUP BY dp.id
ORDER BY dp.confidence_score DESC, dp.execution_count DESC;

-- Comments
COMMENT ON TABLE decision_patterns IS 'Stores all decision patterns learned from system operations, not just errors';
COMMENT ON TABLE pattern_execution_history IS 'Tracks every execution of a pattern for learning and audit';
COMMENT ON TABLE anomalies IS 'Captures unusual events that dont match existing patterns for human review';
COMMENT ON FUNCTION calculate_pattern_success_rate IS 'Calculates the success percentage of a pattern';
COMMENT ON FUNCTION update_pattern_confidence IS 'Automatically adjusts pattern confidence based on execution outcomes';