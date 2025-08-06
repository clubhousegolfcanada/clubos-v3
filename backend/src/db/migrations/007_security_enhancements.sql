-- Migration: Security Enhancements
-- API key rotation, security monitoring, and protection features

-- Table for API key lifecycle management
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the actual key
  key_prefix VARCHAR(8) NOT NULL, -- First 8 chars for identification
  service_name VARCHAR(50) NOT NULL, -- openai, anthropic, slack, etc.
  environment VARCHAR(20) DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  
  -- Lifecycle management
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'rotating', 'expired', 'compromised', 'revoked')),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  rotated_at TIMESTAMP,
  revoked_at TIMESTAMP,
  last_used_at TIMESTAMP,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error_at TIMESTAMP,
  estimated_cost DECIMAL(10,2) DEFAULT 0.00,
  
  -- Security metadata
  created_by INTEGER REFERENCES users(id),
  rotation_reason TEXT,
  compromise_details TEXT,
  ip_whitelist JSONB, -- Optional IP restrictions
  
  CONSTRAINT unique_active_key UNIQUE(service_name, environment, status) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Table for API key rotation history
CREATE TABLE IF NOT EXISTS api_key_rotation_log (
  id SERIAL PRIMARY KEY,
  old_key_id INTEGER REFERENCES api_keys(id),
  new_key_id INTEGER REFERENCES api_keys(id),
  rotation_reason VARCHAR(50) NOT NULL, -- scheduled, manual, compromised, error_rate
  rotation_type VARCHAR(20) DEFAULT 'gradual' CHECK (rotation_type IN ('immediate', 'gradual', 'emergency')),
  
  -- Rotation process tracking
  initiated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  rollback_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'rolled_back')),
  
  -- Metadata
  initiated_by INTEGER REFERENCES users(id),
  error_details TEXT,
  affected_services JSONB
);

-- Table for security event monitoring
CREATE TABLE IF NOT EXISTS security_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- rate_limit_exceeded, injection_attempt, auth_failure, etc.
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Event details
  source_ip INET,
  user_agent TEXT,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  request_headers JSONB,
  request_body JSONB, -- Sanitized
  
  -- Detection details
  detection_method VARCHAR(50), -- rate_limiter, sanitizer, validator, etc.
  detection_rule TEXT,
  confidence_score DECIMAL(3,2),
  
  -- Response taken
  action_taken VARCHAR(50), -- blocked, logged, alerted, rate_limited
  response_code INTEGER,
  
  -- Related entities
  user_id INTEGER REFERENCES users(id),
  thread_id INTEGER REFERENCES threads(id),
  api_key_id INTEGER REFERENCES api_keys(id),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table for performance metrics and DOS protection
CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL, -- cpu, memory, response_time, throughput
  endpoint VARCHAR(255),
  
  -- Metric values
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- percentage, mb, ms, requests_per_second
  threshold_value DECIMAL(10,2),
  is_anomaly BOOLEAN DEFAULT FALSE,
  
  -- Context
  server_id VARCHAR(50),
  process_id INTEGER,
  
  -- Time window
  measured_at TIMESTAMP DEFAULT NOW(),
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL
);

-- Table for blocked IPs and rate limiting
CREATE TABLE IF NOT EXISTS ip_restrictions (
  id SERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  restriction_type VARCHAR(20) NOT NULL CHECK (restriction_type IN ('rate_limit', 'blocked', 'suspicious')),
  reason TEXT NOT NULL,
  
  -- Duration
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_permanent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  violation_count INTEGER DEFAULT 1,
  last_violation_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'system',
  
  CONSTRAINT unique_active_restriction UNIQUE(ip_address, restriction_type)
);

-- Indexes for performance
CREATE INDEX idx_api_keys_service ON api_keys(service_name);
CREATE INDEX idx_api_keys_status ON api_keys(status);
CREATE INDEX idx_api_keys_expires ON api_keys(expires_at);
CREATE INDEX idx_api_keys_last_used ON api_keys(last_used_at DESC);

CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_ip ON security_events(source_ip);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX idx_security_events_user ON security_events(user_id);

CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX idx_performance_metrics_anomaly ON performance_metrics(is_anomaly);
CREATE INDEX idx_performance_metrics_measured ON performance_metrics(measured_at DESC);

CREATE INDEX idx_ip_restrictions_ip ON ip_restrictions(ip_address);
CREATE INDEX idx_ip_restrictions_type ON ip_restrictions(restriction_type);
CREATE INDEX idx_ip_restrictions_expires ON ip_restrictions(expires_at);

-- Function to check if API key needs rotation
CREATE OR REPLACE FUNCTION check_api_key_rotation()
RETURNS TABLE(
  key_id INTEGER,
  service_name VARCHAR,
  days_until_expiry INTEGER,
  usage_count INTEGER,
  error_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.id,
    ak.service_name,
    EXTRACT(DAY FROM ak.expires_at - NOW())::INTEGER as days_until_expiry,
    ak.usage_count,
    CASE 
      WHEN ak.usage_count > 0 
      THEN ROUND((ak.error_count::DECIMAL / ak.usage_count) * 100, 2)
      ELSE 0
    END as error_rate
  FROM api_keys ak
  WHERE ak.status = 'active'
  AND (
    ak.expires_at < NOW() + INTERVAL '7 days' -- Expiring soon
    OR (ak.usage_count > 0 AND ak.error_count::DECIMAL / ak.usage_count > 0.1) -- High error rate
    OR ak.last_error_at > NOW() - INTERVAL '1 hour' -- Recent errors
  );
END;
$$ LANGUAGE plpgsql;

-- Function to detect anomalous performance
CREATE OR REPLACE FUNCTION detect_performance_anomaly()
RETURNS TRIGGER AS $$
DECLARE
  avg_value DECIMAL;
  std_dev DECIMAL;
BEGIN
  -- Calculate average and standard deviation for this metric type
  SELECT 
    AVG(value),
    STDDEV(value)
  INTO avg_value, std_dev
  FROM performance_metrics
  WHERE metric_type = NEW.metric_type
  AND endpoint = NEW.endpoint
  AND measured_at > NOW() - INTERVAL '1 hour';
  
  -- Mark as anomaly if value is more than 3 standard deviations from mean
  IF std_dev > 0 AND ABS(NEW.value - avg_value) > (3 * std_dev) THEN
    NEW.is_anomaly := TRUE;
    
    -- Insert security event for high severity anomalies
    IF NEW.metric_type IN ('cpu', 'memory') AND NEW.value > NEW.threshold_value THEN
      INSERT INTO security_events (
        event_type, severity, endpoint, method,
        detection_method, detection_rule, action_taken
      ) VALUES (
        'performance_anomaly', 'high', NEW.endpoint, 'SYSTEM',
        'performance_monitor', 
        FORMAT('%s exceeded threshold: %.2f > %.2f', NEW.metric_type, NEW.value, NEW.threshold_value),
        'alerted'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for performance anomaly detection
CREATE TRIGGER detect_anomaly_on_metric
  BEFORE INSERT ON performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION detect_performance_anomaly();

-- Function to automatically block suspicious IPs
CREATE OR REPLACE FUNCTION auto_block_suspicious_ip()
RETURNS TRIGGER AS $$
DECLARE
  recent_violations INTEGER;
  should_block BOOLEAN := FALSE;
BEGIN
  -- Count recent security events from this IP
  SELECT COUNT(*) INTO recent_violations
  FROM security_events
  WHERE source_ip = NEW.source_ip
  AND severity IN ('high', 'critical')
  AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Block if too many violations
  IF recent_violations >= 5 THEN
    should_block := TRUE;
  END IF;
  
  -- Also check for specific attack patterns
  IF NEW.event_type IN ('injection_attempt', 'auth_brute_force', 'api_abuse') 
     AND NEW.severity IN ('high', 'critical') THEN
    should_block := TRUE;
  END IF;
  
  IF should_block THEN
    INSERT INTO ip_restrictions (
      ip_address, restriction_type, reason, expires_at
    ) VALUES (
      NEW.source_ip, 
      'blocked',
      FORMAT('Auto-blocked due to %s (severity: %s)', NEW.event_type, NEW.severity),
      NOW() + INTERVAL '24 hours'
    )
    ON CONFLICT (ip_address, restriction_type) 
    DO UPDATE SET
      violation_count = ip_restrictions.violation_count + 1,
      last_violation_at = NOW(),
      expires_at = GREATEST(ip_restrictions.expires_at, NOW() + INTERVAL '24 hours');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-blocking IPs
CREATE TRIGGER auto_block_on_security_event
  AFTER INSERT ON security_events
  FOR EACH ROW
  WHEN (NEW.severity IN ('high', 'critical'))
  EXECUTE FUNCTION auto_block_suspicious_ip();

-- View for security dashboard
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
  'api_keys' as category,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE expires_at < NOW() + INTERVAL '7 days') as expiring_soon,
  COUNT(*) FILTER (WHERE status = 'compromised') as compromised,
  NULL as last_24h_count
FROM api_keys
UNION ALL
SELECT 
  'security_events' as category,
  COUNT(*) FILTER (WHERE severity = 'critical') as active_count,
  COUNT(*) FILTER (WHERE severity = 'high') as expiring_soon,
  COUNT(*) FILTER (WHERE action_taken = 'blocked') as compromised,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h_count
FROM security_events
UNION ALL
SELECT 
  'blocked_ips' as category,
  COUNT(*) FILTER (WHERE restriction_type = 'blocked' AND (expires_at > NOW() OR is_permanent)) as active_count,
  COUNT(*) FILTER (WHERE restriction_type = 'rate_limit') as expiring_soon,
  COUNT(*) FILTER (WHERE is_permanent) as compromised,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h_count
FROM ip_restrictions;

-- Comments
COMMENT ON TABLE api_keys IS 'Manages API key lifecycle with automatic rotation and compromise detection';
COMMENT ON TABLE security_events IS 'Logs all security-relevant events for monitoring and response';
COMMENT ON TABLE performance_metrics IS 'Tracks system performance for DOS protection and anomaly detection';
COMMENT ON TABLE ip_restrictions IS 'Manages IP-based access restrictions and rate limiting';
COMMENT ON FUNCTION check_api_key_rotation IS 'Identifies API keys that need rotation based on age, errors, or usage';
COMMENT ON FUNCTION detect_performance_anomaly IS 'Automatically detects abnormal performance metrics that might indicate attacks';