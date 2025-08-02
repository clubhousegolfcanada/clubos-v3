-- Logic Improvements Migration
-- Focus: Logic density, not feature expansion

BEGIN;

-- 1. SOP Draft Gate
ALTER TABLE sops 
  ADD COLUMN status VARCHAR(10) DEFAULT 'draft' CHECK (status IN ('draft', 'live'));

-- Index for performance (only live SOPs are queried)
CREATE INDEX idx_sops_live ON sops(status) WHERE status = 'live';

-- Set existing SOPs to live
UPDATE sops SET status = 'live' WHERE status IS NULL;

-- 2. Correlation IDs (already in tables, just documenting)
-- Verify correlation_id exists in: threads, action_logs, tickets, change_logs

-- 3. Merge Proposals Table
CREATE TABLE merge_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_ids UUID[] NOT NULL,
  reason TEXT NOT NULL,
  conflicts JSONB,
  proposed_result JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'suggested' CHECK (status IN ('suggested', 'approved', 'rejected')),
  created_by VARCHAR(50) DEFAULT 'claude',
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Learning Metrics Table
CREATE TABLE learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  sops_created INTEGER DEFAULT 0,
  sops_merged INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0,
  operator_approvals INTEGER DEFAULT 0,
  override_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. SOP Override Tracking
ALTER TABLE sops 
  ADD COLUMN usage_count INTEGER DEFAULT 0,
  ADD COLUMN override_count INTEGER DEFAULT 0,
  ADD COLUMN last_used_at TIMESTAMP,
  ADD COLUMN is_locked BOOLEAN DEFAULT false;

-- View for effectiveness
CREATE VIEW sop_effectiveness AS
SELECT *, 
  CASE 
    WHEN usage_count > 0 THEN ROUND((override_count::numeric / usage_count) * 100, 2)
    ELSE 0 
  END as override_rate
FROM sops;

-- 6. Add input_type to existing SOPs (stored in trigger JSON)
-- This is handled in application code since trigger is JSONB

-- 7. Audit improvements
ALTER TABLE change_logs
  ADD COLUMN correlation_id UUID,
  ADD COLUMN reason TEXT;

-- Index for performance
CREATE INDEX idx_change_logs_correlation ON change_logs(correlation_id);
CREATE INDEX idx_sops_last_used ON sops(last_used_at);
CREATE INDEX idx_merge_proposals_status ON merge_proposals(status);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_merge_proposals_updated_at BEFORE UPDATE ON merge_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;