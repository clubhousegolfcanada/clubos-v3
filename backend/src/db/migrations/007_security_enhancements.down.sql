-- Down migration for security enhancements

DROP VIEW IF EXISTS security_dashboard;
DROP TRIGGER IF EXISTS auto_block_on_security_event ON security_events;
DROP TRIGGER IF EXISTS detect_anomaly_on_metric ON performance_metrics;
DROP FUNCTION IF EXISTS auto_block_suspicious_ip();
DROP FUNCTION IF EXISTS detect_performance_anomaly();
DROP FUNCTION IF EXISTS check_api_key_rotation();

DROP TABLE IF EXISTS ip_restrictions;
DROP TABLE IF EXISTS performance_metrics;
DROP TABLE IF EXISTS security_events;
DROP TABLE IF EXISTS api_key_rotation_log;
DROP TABLE IF EXISTS api_keys;