-- Migration: Action Framework Logging and Monitoring
-- Comprehensive logging for all external action executions

-- Action logs table - tracks every action execution
CREATE TABLE IF NOT EXISTS action_logs (
    id SERIAL PRIMARY KEY,
    action_id VARCHAR(100) UNIQUE NOT NULL,
    correlation_id VARCHAR(100),
    thread_id INTEGER REFERENCES thread(id),
    action_type VARCHAR(100) NOT NULL, -- projector_on, reset_trackman, unlock_door, etc.
    handler VARCHAR(50) NOT NULL, -- benq, ninjaone, ubiquiti, etc.
    method VARCHAR(100) NOT NULL, -- powerOn, resetTrackMan, etc.
    context JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'started', -- started, completed, failed
    outcome VARCHAR(50), -- success, partial, failed, unconfirmed
    result JSONB, -- Full result object from handler
    duration_ms INTEGER,
    retries INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Handler statistics table - tracks performance per handler
CREATE TABLE IF NOT EXISTS handler_statistics (
    id SERIAL PRIMARY KEY,
    handler_name VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour < 24),
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    partial_requests INTEGER DEFAULT 0,
    unconfirmed_requests INTEGER DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    avg_duration_ms INTEGER GENERATED ALWAYS AS (
        CASE WHEN total_requests > 0 
        THEN total_duration_ms / total_requests 
        ELSE 0 END
    ) STORED,
    circuit_breaker_trips INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(handler_name, date, hour)
);

-- Action outcomes by type - for pattern analysis
CREATE TABLE IF NOT EXISTS action_outcomes (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    location VARCHAR(50),
    bay_id VARCHAR(50),
    outcome VARCHAR(50) NOT NULL,
    outcome_count INTEGER DEFAULT 1,
    last_occurrence TIMESTAMP DEFAULT NOW(),
    success_rate DECIMAL(5,2),
    avg_duration_ms INTEGER,
    common_errors JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Circuit breaker state - tracks handler health
CREATE TABLE IF NOT EXISTS circuit_breaker_state (
    id SERIAL PRIMARY KEY,
    handler_name VARCHAR(50) UNIQUE NOT NULL,
    state VARCHAR(20) NOT NULL DEFAULT 'closed', -- closed, open, half-open
    failure_count INTEGER DEFAULT 0,
    last_failure_at TIMESTAMP,
    last_success_at TIMESTAMP,
    opened_at TIMESTAMP,
    will_retry_at TIMESTAMP,
    failure_reasons JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Handler configuration - runtime config storage
CREATE TABLE IF NOT EXISTS handler_configuration (
    id SERIAL PRIMARY KEY,
    handler_name VARCHAR(50) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    value_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(100),
    UNIQUE(handler_name, config_key)
);

-- Indexes for performance
CREATE INDEX idx_action_logs_action_type ON action_logs(action_type);
CREATE INDEX idx_action_logs_handler ON action_logs(handler);
CREATE INDEX idx_action_logs_status ON action_logs(status);
CREATE INDEX idx_action_logs_outcome ON action_logs(outcome);
CREATE INDEX idx_action_logs_created_at ON action_logs(created_at);
CREATE INDEX idx_action_logs_correlation ON action_logs(correlation_id);
CREATE INDEX idx_action_logs_thread ON action_logs(thread_id);

CREATE INDEX idx_handler_statistics_handler_date ON handler_statistics(handler_name, date);
CREATE INDEX idx_action_outcomes_type_location ON action_outcomes(action_type, location);

-- Functions for statistics

-- Update handler statistics
CREATE OR REPLACE FUNCTION update_handler_statistics(
    p_handler VARCHAR,
    p_outcome VARCHAR,
    p_duration INTEGER
) RETURNS VOID AS $$
DECLARE
    v_hour INTEGER;
BEGIN
    v_hour := EXTRACT(HOUR FROM NOW());
    
    INSERT INTO handler_statistics (
        handler_name, date, hour, 
        total_requests, 
        successful_requests,
        failed_requests,
        partial_requests,
        unconfirmed_requests,
        total_duration_ms
    ) VALUES (
        p_handler, CURRENT_DATE, v_hour,
        1,
        CASE WHEN p_outcome = 'success' THEN 1 ELSE 0 END,
        CASE WHEN p_outcome = 'failed' THEN 1 ELSE 0 END,
        CASE WHEN p_outcome = 'partial' THEN 1 ELSE 0 END,
        CASE WHEN p_outcome = 'unconfirmed' THEN 1 ELSE 0 END,
        p_duration
    )
    ON CONFLICT (handler_name, date, hour) DO UPDATE SET
        total_requests = handler_statistics.total_requests + 1,
        successful_requests = handler_statistics.successful_requests + 
            CASE WHEN p_outcome = 'success' THEN 1 ELSE 0 END,
        failed_requests = handler_statistics.failed_requests + 
            CASE WHEN p_outcome = 'failed' THEN 1 ELSE 0 END,
        partial_requests = handler_statistics.partial_requests + 
            CASE WHEN p_outcome = 'partial' THEN 1 ELSE 0 END,
        unconfirmed_requests = handler_statistics.unconfirmed_requests + 
            CASE WHEN p_outcome = 'unconfirmed' THEN 1 ELSE 0 END,
        total_duration_ms = handler_statistics.total_duration_ms + p_duration,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Get handler performance summary
CREATE OR REPLACE FUNCTION get_handler_performance(
    p_handler VARCHAR DEFAULT NULL,
    p_days INTEGER DEFAULT 7
) RETURNS TABLE (
    handler VARCHAR,
    total_requests BIGINT,
    success_rate DECIMAL,
    avg_duration_ms INTEGER,
    failure_rate DECIMAL,
    last_24h_requests INTEGER,
    is_healthy BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hs.handler_name,
        SUM(hs.total_requests)::BIGINT,
        CASE WHEN SUM(hs.total_requests) > 0 
            THEN ROUND(SUM(hs.successful_requests)::DECIMAL / SUM(hs.total_requests) * 100, 2)
            ELSE 0 
        END,
        CASE WHEN SUM(hs.total_requests) > 0
            THEN (SUM(hs.total_duration_ms) / SUM(hs.total_requests))::INTEGER
            ELSE 0
        END,
        CASE WHEN SUM(hs.total_requests) > 0 
            THEN ROUND(SUM(hs.failed_requests)::DECIMAL / SUM(hs.total_requests) * 100, 2)
            ELSE 0 
        END,
        COALESCE(SUM(CASE WHEN hs.date >= CURRENT_DATE - INTERVAL '1 day' 
            THEN hs.total_requests ELSE 0 END), 0)::INTEGER,
        COALESCE(cbs.state = 'closed', true)
    FROM handler_statistics hs
    LEFT JOIN circuit_breaker_state cbs ON hs.handler_name = cbs.handler_name
    WHERE hs.date >= CURRENT_DATE - INTERVAL '%s days' % p_days
    AND (p_handler IS NULL OR hs.handler_name = p_handler)
    GROUP BY hs.handler_name, cbs.state;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update statistics after action completion
CREATE OR REPLACE FUNCTION action_log_completion_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status = 'started' THEN
        PERFORM update_handler_statistics(
            NEW.handler,
            NEW.outcome,
            NEW.duration_ms
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER action_log_completion
    AFTER UPDATE ON action_logs
    FOR EACH ROW
    EXECUTE FUNCTION action_log_completion_trigger();

-- Insert default handler configurations
INSERT INTO handler_configuration (handler_name, config_key, config_value, value_type, description) VALUES
('benq', 'default_timeout', '10000', 'number', 'Default timeout for BenQ projector commands in ms'),
('benq', 'warmup_delay', '3000', 'number', 'Delay after power on before checking status'),
('ninjaone', 'default_timeout', '30000', 'number', 'Default timeout for NinjaOne operations'),
('ninjaone', 'trackman_restart_delay', '5000', 'number', 'Delay after killing TrackMan before restart'),
('ubiquiti', 'default_unlock_duration', '600', 'number', 'Default door unlock duration in seconds'),
('ubiquiti', 'max_unlock_duration', '3600', 'number', 'Maximum allowed unlock duration'),
('openphone', 'rate_limit_per_hour', '100', 'number', 'Maximum SMS messages per hour'),
('openphone', 'delivery_check_delay', '5000', 'number', 'Delay before checking delivery status'),
('slack', 'rate_limit_per_minute', '20', 'number', 'Maximum Slack messages per minute'),
('all', 'circuit_breaker_threshold', '5', 'number', 'Failures before opening circuit'),
('all', 'circuit_breaker_timeout', '60000', 'number', 'Time before retrying after circuit open');

-- Comments for documentation
COMMENT ON TABLE action_logs IS 'Comprehensive log of all action executions through the framework';
COMMENT ON TABLE handler_statistics IS 'Hourly statistics for handler performance monitoring';
COMMENT ON TABLE action_outcomes IS 'Aggregated outcomes by action type for pattern analysis';
COMMENT ON TABLE circuit_breaker_state IS 'Circuit breaker state for each handler';
COMMENT ON TABLE handler_configuration IS 'Runtime configuration for action handlers';