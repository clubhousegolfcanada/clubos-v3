-- ClubOS V3 Logic Improvements
-- Apply these updates to strengthen the core system

-- 1. Add status field to SOPs (draft/live)
ALTER TABLE sop ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'live' CHECK (status IN ('draft', 'live'));

-- 2. Add correlation_id to all log tables
ALTER TABLE thread ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(50);
ALTER TABLE action_log ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(50);
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(50);
ALTER TABLE change_log ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(50);

-- 3. Add timeout and retry configuration to SOPs
ALTER TABLE sop ADD COLUMN IF NOT EXISTS timeout_seconds INTEGER DEFAULT 30;
ALTER TABLE sop ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 2;

-- 4. Update action_log outcome to support more states
ALTER TABLE action_log DROP CONSTRAINT IF EXISTS action_log_outcome_check;
ALTER TABLE action_log ADD CONSTRAINT action_log_outcome_check 
  CHECK (outcome IN ('success', 'partial', 'failed', 'unconfirmed', 'timeout'));

-- 5. Add valid actions constraint
CREATE TABLE IF NOT EXISTS valid_actions (
    action_type VARCHAR(100) PRIMARY KEY,
    description TEXT,
    requires_booking BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert known valid actions
INSERT INTO valid_actions (action_type, description, requires_booking) VALUES
    ('reset_trackman', 'Reset TrackMan equipment', false),
    ('unlock_door', 'Unlock facility door', true),
    ('escalate', 'Escalate to human operator', false),
    ('send_message', 'Send message to customer', false)
ON CONFLICT (action_type) DO NOTHING;

-- Add foreign key constraint to ensure SOPs only use valid actions
ALTER TABLE sop ADD CONSTRAINT fk_sop_primary_action 
  FOREIGN KEY (primary_action) REFERENCES valid_actions(action_type);
ALTER TABLE sop ADD CONSTRAINT fk_sop_fallback_action 
  FOREIGN KEY (fallback_action) REFERENCES valid_actions(action_type);

-- 6. Create learning_metrics table for background tracking
CREATE TABLE IF NOT EXISTS learning_metrics (
    id SERIAL PRIMARY KEY,
    sop_id INTEGER REFERENCES sop(id),
    suggestion_type VARCHAR(50), -- merge, archive, refactor
    confidence DECIMAL(3,2),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    suggested_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(100)
);

-- 7. Add usage tracking to SOPs
ALTER TABLE sop ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE sop ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;
ALTER TABLE sop ADD COLUMN IF NOT EXISTS override_count INTEGER DEFAULT 0;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_thread_correlation ON thread(correlation_id);
CREATE INDEX IF NOT EXISTS idx_action_correlation ON action_log(correlation_id);
CREATE INDEX IF NOT EXISTS idx_sop_status ON sop(status, active);
CREATE INDEX IF NOT EXISTS idx_sop_usage ON sop(last_used_at, usage_count);
CREATE INDEX IF NOT EXISTS idx_learning_metrics_status ON learning_metrics(status);

-- Update existing SOPs to have valid status
UPDATE sop SET status = 'live' WHERE status IS NULL;