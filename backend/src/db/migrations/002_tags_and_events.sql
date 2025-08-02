-- Migration 002: Add tags to SOPs and create input_event table

-- Task 1: Add tags field to SOPs
ALTER TABLE sop ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for future tag-based queries
CREATE INDEX IF NOT EXISTS idx_sop_tags ON sop USING GIN(tags);

-- Task 2: Create input_event table for system observability
CREATE TABLE IF NOT EXISTS input_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    payload JSONB NOT NULL,
    received_at TIMESTAMP DEFAULT NOW(),
    location_id TEXT, -- Using TEXT to match existing pattern
    bay_id TEXT,
    correlation_id TEXT,
    linked_thread_id INTEGER REFERENCES thread(id),
    
    -- Indexes for common queries
    INDEX idx_input_event_received (received_at DESC),
    INDEX idx_input_event_source (source),
    INDEX idx_input_event_location (location_id),
    INDEX idx_input_event_correlation (correlation_id)
);

-- Add comment for documentation
COMMENT ON TABLE input_event IS 'Tracks external system inputs for observability and future automation';
COMMENT ON COLUMN input_event.source IS 'Source system (e.g., ninjaone, ubiquiti, trackman)';
COMMENT ON COLUMN input_event.payload IS 'Raw event data as JSON';

-- Update existing SOPs with empty tags array
UPDATE sop SET tags = '{}' WHERE tags IS NULL;