-- Migration: Add SOP outcomes tracking for mike-brain pattern learning
-- This enables tracking which SOPs are successful and learning from patterns

CREATE TABLE IF NOT EXISTS sop_outcomes (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
  sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  time_saved INTEGER, -- in minutes
  operator_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sop_outcomes_sop_id ON sop_outcomes(sop_id);
CREATE INDEX idx_sop_outcomes_timestamp ON sop_outcomes(timestamp);
CREATE INDEX idx_sop_outcomes_success ON sop_outcomes(success);

-- Add time impact columns to SOPs
ALTER TABLE sops 
ADD COLUMN IF NOT EXISTS estimated_time_saved INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS success_rate DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS last_outcome_check TIMESTAMP;

-- View for SOP effectiveness
CREATE OR REPLACE VIEW sop_effectiveness AS
SELECT 
  s.id,
  s.title,
  s.intent_category,
  COUNT(o.id) as total_uses,
  SUM(CASE WHEN o.success THEN 1 ELSE 0 END) as successful_uses,
  CASE 
    WHEN COUNT(o.id) > 0 
    THEN ROUND(SUM(CASE WHEN o.success THEN 1 ELSE 0 END)::decimal / COUNT(o.id), 2)
    ELSE 0 
  END as success_rate,
  SUM(o.time_saved) as total_time_saved,
  MAX(o.timestamp) as last_used
FROM sops s
LEFT JOIN sop_outcomes o ON s.id = o.sop_id
WHERE o.timestamp > NOW() - INTERVAL '30 days'
GROUP BY s.id, s.title, s.intent_category;

-- Function to update SOP success rates (run periodically)
CREATE OR REPLACE FUNCTION update_sop_success_rates()
RETURNS void AS $$
BEGIN
  UPDATE sops s
  SET 
    success_rate = e.success_rate,
    last_outcome_check = NOW()
  FROM sop_effectiveness e
  WHERE s.id = e.id;
END;
$$ LANGUAGE plpgsql;

-- Comment on the new table
COMMENT ON TABLE sop_outcomes IS 'Tracks the success/failure of SOP applications for pattern learning (mike-brain integration)';