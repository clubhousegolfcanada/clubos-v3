-- Migration: Pattern Automation Tracking Tables
-- Purpose: Support confidence-based automation with approval queues and tracking

-- Pattern approval queue for 50-75% confidence patterns
CREATE TABLE IF NOT EXISTS pattern_approval_queue (
  id SERIAL PRIMARY KEY,
  queue_id VARCHAR(100) UNIQUE NOT NULL,
  pattern_id INTEGER REFERENCES decision_patterns(id),
  trigger_event JSONB NOT NULL,
  execution_context JSONB,
  confidence_at_execution DECIMAL(3,2),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, timeout
  reasoning TEXT,
  module_name VARCHAR(100),
  
  -- Approval tracking
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  rejected_by VARCHAR(255),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pattern approvals tracking
CREATE TABLE IF NOT EXISTS pattern_approvals (
  id SERIAL PRIMARY KEY,
  pattern_id INTEGER REFERENCES decision_patterns(id),
  event_data JSONB,
  suggestion_id VARCHAR(100),
  approval_type VARCHAR(50) DEFAULT 'manual', -- manual, timeout
  approved_by VARCHAR(255),
  approved_at TIMESTAMP DEFAULT NOW()
);

-- Pattern rejections tracking
CREATE TABLE IF NOT EXISTS pattern_rejections (
  id SERIAL PRIMARY KEY,
  pattern_id INTEGER REFERENCES decision_patterns(id),
  event_data JSONB,
  rejection_reason TEXT,
  reference_id VARCHAR(100), -- suggestion_id or queue_id
  rejected_by VARCHAR(255),
  rejected_at TIMESTAMP DEFAULT NOW()
);

-- Pattern timeout executions
CREATE TABLE IF NOT EXISTS pattern_timeout_executions (
  id SERIAL PRIMARY KEY,
  suggestion_id VARCHAR(100),
  pattern_id INTEGER REFERENCES decision_patterns(id),
  result JSONB,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Anomaly escalations
CREATE TABLE IF NOT EXISTS anomaly_escalations (
  id SERIAL PRIMARY KEY,
  anomaly_id VARCHAR(100),
  escalation_type VARCHAR(50), -- automatic, manual
  escalation_level VARCHAR(50) DEFAULT 'immediate', -- immediate, high, medium
  notified_users TEXT[],
  actions_taken JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by VARCHAR(255),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  escalated_at TIMESTAMP DEFAULT NOW()
);

-- Update anomalies table to support new fields
ALTER TABLE anomalies 
  ADD COLUMN IF NOT EXISTS anomaly_id VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS detection_details JSONB,
  ADD COLUMN IF NOT EXISTS detected_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT FALSE;

-- Human override tracking
CREATE TABLE IF NOT EXISTS human_overrides (
  id SERIAL PRIMARY KEY,
  pattern_id INTEGER REFERENCES decision_patterns(id),
  event_context JSONB,
  original_decision JSONB,
  override_decision JSONB,
  override_reason TEXT,
  override_by VARCHAR(255),
  confidence_impact DECIMAL(3,2), -- How much to adjust pattern confidence
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pattern learning insights
CREATE TABLE IF NOT EXISTS pattern_learning_insights (
  id SERIAL PRIMARY KEY,
  source_pattern_id INTEGER REFERENCES decision_patterns(id),
  insight_type VARCHAR(50), -- success_pattern, failure_pattern, modification_pattern
  insight_data JSONB,
  applicable_domains TEXT[],
  confidence_boost DECIMAL(3,2),
  times_applied INTEGER DEFAULT 0,
  last_applied TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_queue_status ON pattern_approval_queue(status);
CREATE INDEX IF NOT EXISTS idx_approval_queue_created ON pattern_approval_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_anomaly_escalations_anomaly ON anomaly_escalations(anomaly_id);
CREATE INDEX IF NOT EXISTS idx_human_overrides_pattern ON human_overrides(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_learning_type ON pattern_learning_insights(insight_type);

-- Function to calculate pattern success rate (used by UnifiedPatternEngine)
CREATE OR REPLACE FUNCTION calculate_pattern_success_rate(p_pattern_id INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  success_rate DECIMAL;
BEGIN
  SELECT 
    CASE 
      WHEN execution_count > 0 THEN success_count::DECIMAL / execution_count::DECIMAL
      ELSE 0.5
    END INTO success_rate
  FROM decision_patterns
  WHERE id = p_pattern_id;
  
  RETURN COALESCE(success_rate, 0.5);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update pattern confidence based on human overrides
CREATE OR REPLACE FUNCTION update_pattern_confidence_on_override()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE decision_patterns
  SET confidence_score = GREATEST(0.1, LEAST(0.99, confidence_score + NEW.confidence_impact))
  WHERE id = NEW.pattern_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_confidence_on_override
AFTER INSERT ON human_overrides
FOR EACH ROW
EXECUTE FUNCTION update_pattern_confidence_on_override();

-- View for pending approvals dashboard
CREATE OR REPLACE VIEW pending_approvals AS
SELECT 
  paq.queue_id,
  paq.pattern_id,
  dp.decision_type,
  dp.trigger_signature,
  paq.confidence_at_execution,
  paq.reasoning,
  paq.module_name,
  paq.created_at,
  EXTRACT(EPOCH FROM (NOW() - paq.created_at)) AS waiting_seconds
FROM pattern_approval_queue paq
JOIN decision_patterns dp ON paq.pattern_id = dp.id
WHERE paq.status = 'pending'
ORDER BY paq.created_at ASC;

-- View for anomaly statistics
CREATE OR REPLACE VIEW anomaly_stats AS
SELECT 
  DATE_TRUNC('hour', detected_at) as hour,
  severity,
  COUNT(*) as count,
  COUNT(CASE WHEN escalated THEN 1 END) as escalated_count
FROM anomalies
WHERE detected_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', detected_at), severity
ORDER BY hour DESC;