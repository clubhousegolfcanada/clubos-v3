-- Rollback for initial schema

DROP INDEX IF EXISTS idx_system_status_location;
DROP INDEX IF EXISTS idx_ticket_status;
DROP INDEX IF EXISTS idx_action_thread;
DROP INDEX IF EXISTS idx_sop_category;
DROP INDEX IF EXISTS idx_thread_customer;
DROP INDEX IF EXISTS idx_thread_status;

DROP TABLE IF EXISTS operators CASCADE;
DROP TABLE IF EXISTS change_log CASCADE;
DROP TABLE IF EXISTS learning_event CASCADE;
DROP TABLE IF EXISTS system_status CASCADE;
DROP TABLE IF EXISTS ticket CASCADE;
DROP TABLE IF EXISTS action_log CASCADE;
DROP TABLE IF EXISTS sop CASCADE;
DROP TABLE IF EXISTS thread CASCADE;