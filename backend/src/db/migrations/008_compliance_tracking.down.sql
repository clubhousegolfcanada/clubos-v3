-- Down migration for compliance tracking

DROP VIEW IF EXISTS compliance_dashboard;
DROP FUNCTION IF EXISTS process_data_export_request(INTEGER);
DROP FUNCTION IF EXISTS log_data_access();
DROP FUNCTION IF EXISTS check_retention_compliance();

DROP TABLE IF EXISTS compliance_violations;
DROP TABLE IF EXISTS data_retention_policies;
DROP TABLE IF EXISTS consent_records;
DROP TABLE IF EXISTS data_subject_requests;
DROP TABLE IF EXISTS compliance_log;