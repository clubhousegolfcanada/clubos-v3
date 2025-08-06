-- Migration: Knowledge Management System
-- Enables natural language knowledge updates with conflict resolution

-- Knowledge entities table (what we're storing knowledge about)
CREATE TABLE IF NOT EXISTS knowledge_entities (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL, -- 'location', 'contact', 'policy', 'hours', etc.
    entity_key VARCHAR(255) NOT NULL UNIQUE, -- 'bedford_clubhouse', 'dartmouth_clubhouse', etc.
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge facts table (the actual knowledge)
CREATE TABLE IF NOT EXISTS knowledge_facts (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES knowledge_entities(id) ON DELETE CASCADE,
    fact_type VARCHAR(100) NOT NULL, -- 'phone_number', 'address', 'hours', 'email', etc.
    fact_value TEXT NOT NULL,
    fact_metadata JSONB DEFAULT '{}', -- Additional structured data
    confidence_score DECIMAL(3,2) DEFAULT 1.00,
    source VARCHAR(100) DEFAULT 'manual', -- 'manual', 'imported', 'learned', 'api'
    source_details JSONB DEFAULT '{}',
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    superseded_at TIMESTAMP,
    superseded_by INTEGER REFERENCES knowledge_facts(id)
);

-- Knowledge updates log (track all changes)
CREATE TABLE IF NOT EXISTS knowledge_updates (
    id SERIAL PRIMARY KEY,
    raw_input TEXT NOT NULL, -- Original natural language input
    parsed_intent JSONB NOT NULL, -- What the system understood
    entity_id INTEGER REFERENCES knowledge_entities(id),
    fact_id INTEGER REFERENCES knowledge_facts(id),
    action_taken VARCHAR(50) NOT NULL, -- 'created', 'updated', 'confirmed', 'rejected'
    conflict_detected BOOLEAN DEFAULT false,
    conflict_resolution VARCHAR(50), -- 'user_approved', 'auto_approved', 'rejected'
    previous_value TEXT,
    new_value TEXT,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- Common knowledge types for quick reference
CREATE TABLE IF NOT EXISTS knowledge_types (
    id SERIAL PRIMARY KEY,
    fact_type VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    validation_regex TEXT,
    example_values TEXT[],
    requires_confirmation BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX idx_knowledge_facts_entity ON knowledge_facts(entity_id);
CREATE INDEX idx_knowledge_facts_type ON knowledge_facts(fact_type);
CREATE INDEX idx_knowledge_facts_current ON knowledge_facts(is_current);
CREATE INDEX idx_knowledge_entities_key ON knowledge_entities(entity_key);
CREATE INDEX idx_knowledge_updates_entity ON knowledge_updates(entity_id);

-- Insert common knowledge types
INSERT INTO knowledge_types (fact_type, description, validation_regex, example_values, requires_confirmation) VALUES
('phone_number', 'Contact phone number', '^[0-9-+() ]+$', ARRAY['902-555-1234', '1-800-GOLF'], false),
('email', 'Email address', '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', ARRAY['info@clubhouse.ca'], false),
('address', 'Physical address', NULL, ARRAY['123 Main St, Halifax, NS'], false),
('hours', 'Operating hours', NULL, ARRAY['Mon-Fri 9am-5pm', 'Daily 8am-10pm'], false),
('wifi_password', 'WiFi network password', NULL, ARRAY['GolfClub2024'], true),
('door_code', 'Access door code', '^[0-9]+$', ARRAY['1234'], true),
('capacity', 'Maximum capacity', '^[0-9]+$', ARRAY['4', '6'], false),
('price', 'Pricing information', NULL, ARRAY['$50/hour', '$200/month'], false),
('policy', 'Rules and policies', NULL, ARRAY['No outside food', '48hr cancellation'], false);

-- Insert common entities
INSERT INTO knowledge_entities (entity_type, entity_key, display_name) VALUES
('location', 'bedford_clubhouse', 'Bedford Clubhouse'),
('location', 'dartmouth_clubhouse', 'Dartmouth Clubhouse'),
('location', 'all_locations', 'All Locations'),
('service', 'trackman', 'TrackMan System'),
('service', 'booking_system', 'Booking System'),
('policy', 'general_policies', 'General Policies'),
('policy', 'membership_policies', 'Membership Policies');

-- Function to get current knowledge
CREATE OR REPLACE FUNCTION get_current_knowledge(
    p_entity_key VARCHAR,
    p_fact_type VARCHAR DEFAULT NULL
) RETURNS TABLE (
    entity_name VARCHAR,
    fact_type VARCHAR,
    fact_value TEXT,
    fact_metadata JSONB,
    last_updated TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.display_name,
        f.fact_type,
        f.fact_value,
        f.fact_metadata,
        f.created_at
    FROM knowledge_entities e
    JOIN knowledge_facts f ON e.id = f.entity_id
    WHERE e.entity_key = p_entity_key
    AND f.is_current = true
    AND (p_fact_type IS NULL OR f.fact_type = p_fact_type)
    ORDER BY f.fact_type, f.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check for conflicts
CREATE OR REPLACE FUNCTION check_knowledge_conflict(
    p_entity_key VARCHAR,
    p_fact_type VARCHAR,
    p_new_value TEXT
) RETURNS TABLE (
    has_conflict BOOLEAN,
    current_value TEXT,
    fact_id INTEGER,
    confidence_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE WHEN f.id IS NOT NULL THEN true ELSE false END,
        f.fact_value,
        f.id,
        f.confidence_score
    FROM knowledge_entities e
    LEFT JOIN knowledge_facts f ON e.id = f.entity_id 
        AND f.fact_type = p_fact_type 
        AND f.is_current = true
    WHERE e.entity_key = p_entity_key
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE knowledge_entities IS 'Entities we store knowledge about (locations, services, policies)';
COMMENT ON TABLE knowledge_facts IS 'Actual knowledge facts with versioning and confidence';
COMMENT ON TABLE knowledge_updates IS 'Audit log of all knowledge updates';
COMMENT ON TABLE knowledge_types IS 'Valid knowledge types with validation rules';