-- Rollback for tags and events migration

-- Remove input_event table
DROP TABLE IF EXISTS input_event CASCADE;

-- Remove tags from SOPs
DROP INDEX IF EXISTS idx_sop_tags;
ALTER TABLE sop DROP COLUMN IF EXISTS tags;