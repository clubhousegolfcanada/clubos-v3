-- Migration: Compliance and Audit Trail
-- GDPR compliance, data access logging, and audit trails

-- Table for comprehensive compliance logging
CREATE TABLE IF NOT EXISTS compliance_log (
  id SERIAL PRIMARY KEY,
  log_type VARCHAR(50) NOT NULL, -- data_access, data_modification, data_export, consent_change, etc.
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- What was accessed/modified
  resource_type VARCHAR(50) NOT NULL, -- customer, booking, message, operator, etc.
  resource_id INTEGER,
  resource_identifier VARCHAR(255), -- For when ID isn't available
  operation VARCHAR(50) NOT NULL, -- read, create, update, delete, export, anonymize
  
  -- Data details (for GDPR compliance)
  data_categories JSONB, -- personal_data, sensitive_data, financial_data, etc.
  fields_accessed TEXT[], -- Specific fields that were accessed
  data_volume INTEGER, -- Number of records affected
  
  -- Who performed the action
  user_id INTEGER REFERENCES users(id),
  user_role VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  
  -- Context
  request_id VARCHAR(255),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  purpose TEXT, -- Why the data was accessed
  legal_basis VARCHAR(50), -- consent, contract, legitimate_interest, etc.
  
  -- Compliance metadata
  retention_period_days INTEGER,
  should_anonymize_at TIMESTAMP,
  is_exported BOOLEAN DEFAULT FALSE,
  export_request_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table for data subject requests (GDPR Article 15-22)
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id SERIAL PRIMARY KEY,
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
    'access', 'rectification', 'erasure', 'portability', 
    'restriction', 'objection', 'automated_decision'
  )),
  
  -- Subject identification
  subject_email VARCHAR(255) NOT NULL,
  subject_phone VARCHAR(20),
  subject_name VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50),
  
  -- Request details
  request_details TEXT NOT NULL,
  data_categories JSONB,
  specific_data_requested JSONB,
  
  -- Processing
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'verifying', 'processing', 'completed', 'rejected', 'partially_completed'
  )),
  assigned_to INTEGER REFERENCES users(id),
  
  -- Timeline (GDPR requires response within 1 month)
  received_at TIMESTAMP DEFAULT NOW(),
  verification_completed_at TIMESTAMP,
  processing_started_at TIMESTAMP,
  completed_at TIMESTAMP,
  response_due_date TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Response
  response_summary TEXT,
  data_provided JSONB,
  rejection_reason TEXT,
  partial_completion_reason TEXT,
  
  -- Audit
  actions_taken JSONB,
  related_log_ids INTEGER[]
);

-- Table for consent management
CREATE TABLE IF NOT EXISTS consent_records (
  id SERIAL PRIMARY KEY,
  subject_identifier VARCHAR(255) NOT NULL, -- email, phone, or customer_id
  
  -- Consent details
  consent_type VARCHAR(50) NOT NULL, -- marketing, data_processing, third_party_sharing, etc.
  consent_given BOOLEAN NOT NULL,
  consent_scope JSONB, -- Specific details about what was consented to
  
  -- Legal requirements
  purpose TEXT NOT NULL,
  controller_identity VARCHAR(255) DEFAULT 'The Clubhouse Golf',
  retention_period TEXT,
  third_parties JSONB, -- List of third parties data may be shared with
  
  -- Consent lifecycle
  given_at TIMESTAMP,
  withdrawn_at TIMESTAMP,
  expires_at TIMESTAMP,
  reminder_sent_at TIMESTAMP,
  
  -- How consent was obtained
  collection_method VARCHAR(50), -- form, email, phone, in_person
  collection_point VARCHAR(255), -- Which form/page/location
  consent_text TEXT, -- Exact text shown to user
  
  -- Verification
  ip_address INET,
  user_agent TEXT,
  double_opt_in BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table for data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id SERIAL PRIMARY KEY,
  data_category VARCHAR(50) NOT NULL UNIQUE,
  resource_type VARCHAR(50) NOT NULL,
  
  -- Retention rules
  retention_days INTEGER NOT NULL,
  retention_reason TEXT NOT NULL,
  legal_requirement BOOLEAN DEFAULT FALSE,
  
  -- Actions after retention period
  action_after_retention VARCHAR(50) NOT NULL CHECK (action_after_retention IN (
    'delete', 'anonymize', 'archive', 'review'
  )),
  anonymization_fields TEXT[], -- Which fields to anonymize
  
  -- Exceptions
  exception_criteria JSONB, -- Conditions that extend retention
  max_extension_days INTEGER,
  
  -- Metadata
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

-- Table for automated compliance checks
CREATE TABLE IF NOT EXISTS compliance_violations (
  id SERIAL PRIMARY KEY,
  violation_type VARCHAR(50) NOT NULL, -- unauthorized_access, retention_exceeded, missing_consent, etc.
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Violation details
  resource_type VARCHAR(50),
  resource_id INTEGER,
  violation_details TEXT NOT NULL,
  regulation_reference VARCHAR(255), -- e.g., "GDPR Article 6"
  
  -- Detection
  detected_by VARCHAR(50) NOT NULL, -- automated_scan, user_report, audit
  detection_time TIMESTAMP DEFAULT NOW(),
  
  -- Resolution
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  assigned_to INTEGER REFERENCES users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  
  -- Impact
  affected_subjects INTEGER,
  data_at_risk JSONB,
  requires_notification BOOLEAN DEFAULT FALSE,
  notification_sent BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_compliance_log_type ON compliance_log(log_type);
CREATE INDEX idx_compliance_log_resource ON compliance_log(resource_type, resource_id);
CREATE INDEX idx_compliance_log_user ON compliance_log(user_id);
CREATE INDEX idx_compliance_log_created ON compliance_log(created_at DESC);
CREATE INDEX idx_compliance_log_retention ON compliance_log(should_anonymize_at);

CREATE INDEX idx_data_subject_requests_email ON data_subject_requests(subject_email);
CREATE INDEX idx_data_subject_requests_status ON data_subject_requests(status);
CREATE INDEX idx_data_subject_requests_due ON data_subject_requests(response_due_date);

CREATE INDEX idx_consent_records_subject ON consent_records(subject_identifier);
CREATE INDEX idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX idx_consent_records_given ON consent_records(consent_given);

CREATE INDEX idx_compliance_violations_type ON compliance_violations(violation_type);
CREATE INDEX idx_compliance_violations_status ON compliance_violations(status);
CREATE INDEX idx_compliance_violations_severity ON compliance_violations(severity);

-- Function to check retention policy compliance
CREATE OR REPLACE FUNCTION check_retention_compliance()
RETURNS TABLE(
  resource_type VARCHAR,
  resource_id INTEGER,
  age_days INTEGER,
  retention_limit INTEGER,
  action_required VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  WITH retention_check AS (
    SELECT 
      cl.resource_type,
      cl.resource_id,
      EXTRACT(DAY FROM NOW() - MIN(cl.created_at))::INTEGER as age_days,
      drp.retention_days,
      drp.action_after_retention
    FROM compliance_log cl
    JOIN data_retention_policies drp ON cl.resource_type = drp.resource_type
    WHERE drp.active = TRUE
    GROUP BY cl.resource_type, cl.resource_id, drp.retention_days, drp.action_after_retention
  )
  SELECT * FROM retention_check
  WHERE age_days > retention_days;
END;
$$ LANGUAGE plpgsql;

-- Function to log data access automatically
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called from application code, not as a trigger
  -- Provided here as a template
  INSERT INTO compliance_log (
    log_type, resource_type, operation, user_id, fields_accessed
  ) VALUES (
    'data_access', TG_TABLE_NAME, TG_OP, current_user, '{}'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle data subject requests
CREATE OR REPLACE FUNCTION process_data_export_request(request_id INTEGER)
RETURNS JSONB AS $$
DECLARE
  request data_subject_requests;
  exported_data JSONB := '{}';
  customer_data JSONB;
BEGIN
  -- Get request details
  SELECT * INTO request FROM data_subject_requests WHERE id = request_id;
  
  -- Gather all data for the subject
  -- This is a template - actual implementation would query all relevant tables
  SELECT jsonb_build_object(
    'profile', row_to_json(c.*),
    'bookings', (SELECT jsonb_agg(b.*) FROM bookings b WHERE b.customer_email = request.subject_email),
    'messages', (SELECT jsonb_agg(m.*) FROM messages m 
                 JOIN threads t ON m.thread_id = t.id 
                 WHERE t.customer_email = request.subject_email)
  ) INTO customer_data
  FROM customers c
  WHERE c.email = request.subject_email;
  
  -- Log the export
  INSERT INTO compliance_log (
    log_type, resource_type, operation, 
    data_categories, purpose, legal_basis
  ) VALUES (
    'data_export', 'customer', 'export',
    '["personal_data", "transaction_data"]',
    'Data subject request - Article 15 GDPR',
    'legal_obligation'
  );
  
  -- Update request
  UPDATE data_subject_requests
  SET status = 'completed',
      completed_at = NOW(),
      data_provided = customer_data
  WHERE id = request_id;
  
  RETURN customer_data;
END;
$$ LANGUAGE plpgsql;

-- View for compliance dashboard
CREATE OR REPLACE VIEW compliance_dashboard AS
SELECT 
  'data_access_today' as metric,
  COUNT(*) as value
FROM compliance_log
WHERE log_type = 'data_access'
AND created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'pending_requests' as metric,
  COUNT(*) as value
FROM data_subject_requests
WHERE status IN ('pending', 'processing')
UNION ALL
SELECT 
  'active_consents' as metric,
  COUNT(*) as value
FROM consent_records
WHERE consent_given = TRUE
AND (withdrawn_at IS NULL)
AND (expires_at IS NULL OR expires_at > NOW())
UNION ALL
SELECT 
  'compliance_violations' as metric,
  COUNT(*) as value
FROM compliance_violations
WHERE status = 'open'
AND severity IN ('high', 'critical');

-- Comments
COMMENT ON TABLE compliance_log IS 'Comprehensive audit trail for all data access and modifications for regulatory compliance';
COMMENT ON TABLE data_subject_requests IS 'Manages GDPR data subject requests (access, deletion, portability, etc.)';
COMMENT ON TABLE consent_records IS 'Tracks all consent given by data subjects with full lifecycle management';
COMMENT ON TABLE data_retention_policies IS 'Defines how long different types of data should be retained';
COMMENT ON TABLE compliance_violations IS 'Tracks detected compliance issues for investigation and resolution';
COMMENT ON FUNCTION check_retention_compliance IS 'Identifies data that has exceeded retention policies';
COMMENT ON FUNCTION process_data_export_request IS 'Handles GDPR Article 15 data portability requests';