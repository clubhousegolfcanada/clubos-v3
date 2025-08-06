-- Down migration for decision patterns

DROP VIEW IF EXISTS pattern_effectiveness_dashboard;
DROP TRIGGER IF EXISTS update_confidence_after_execution ON pattern_execution_history;
DROP FUNCTION IF EXISTS update_pattern_confidence();
DROP FUNCTION IF EXISTS calculate_pattern_success_rate(INTEGER);

DROP TABLE IF EXISTS anomalies;
DROP TABLE IF EXISTS pattern_execution_history;
DROP TABLE IF EXISTS decision_patterns CASCADE;

-- Remove column from learning_patterns if it exists
ALTER TABLE learning_patterns 
DROP COLUMN IF EXISTS decision_pattern_id;