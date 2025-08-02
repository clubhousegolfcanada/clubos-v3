-- ClubOS V3 Clean Core Schema

-- 1. Thread: Core conversation tracking
CREATE TABLE thread (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    booking_id VARCHAR(50),
    intent VARCHAR(50), -- tech_issue, booking, access, faq
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, resolved, escalated
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. SOP: Structured operating procedures
CREATE TABLE sop (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- tech, booking, access, faq
    trigger_phrases TEXT[] NOT NULL, -- ['screen frozen', 'trackman stuck']
    primary_action VARCHAR(100) NOT NULL, -- reset_trackman, unlock_door, escalate
    fallback_action VARCHAR(100) DEFAULT 'escalate',
    version INTEGER DEFAULT 1,
    mergeable BOOLEAN DEFAULT true,
    valid_until TIMESTAMP, -- NULL = no expiration
    prerequisites JSONB DEFAULT '[]', -- ["booking_active", "within_time_window"]
    context JSONB DEFAULT '{}', -- {"location": ["all"], "time_restrictions": null}
    source_metadata JSONB DEFAULT '{}', -- {"created_by": "mike", "source": "operator_experience"}
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Action Log: Every action attempted
CREATE TABLE action_log (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL, -- reset_trackman, unlock_door, escalate
    sop_id INTEGER REFERENCES sop(id),
    thread_id INTEGER REFERENCES thread(id),
    outcome VARCHAR(50) NOT NULL, -- success, failed, timeout
    performed_by VARCHAR(100) NOT NULL, -- OperatorGPT, mike@clubhouse.com
    timestamp TIMESTAMP DEFAULT NOW(),
    notes TEXT -- Optional context or error details
);

-- 4. Ticket: Manual issue tracking
CREATE TABLE ticket (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- tech, facilities
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    linked_thread_id INTEGER REFERENCES thread(id),
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    title VARCHAR(255),
    description TEXT
);

-- 5. System Status: Device health snapshots
CREATE TABLE system_status (
    id SERIAL PRIMARY KEY,
    bay_id VARCHAR(20) NOT NULL,
    location_id VARCHAR(50) NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- trackman_pc, door_controller, projector
    status VARCHAR(50) NOT NULL, -- online, offline, degraded, unknown
    last_checked_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}', -- Additional device-specific info
    UNIQUE(bay_id, location_id, device_type)
);

-- 6. Learning Event: Operator feedback signals
CREATE TABLE learning_event (
    id SERIAL PRIMARY KEY,
    sop_id INTEGER REFERENCES sop(id),
    source_thread_id INTEGER REFERENCES thread(id),
    tagged_by VARCHAR(100) NOT NULL,
    confidence_boost DECIMAL(3,2) DEFAULT 0.1, -- How much to boost this SOP
    created_at TIMESTAMP DEFAULT NOW(),
    notes TEXT -- Why this was tagged as good
);

-- 7. Change Log: Complete audit trail
CREATE TABLE change_log (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- sop, ticket, thread
    entity_id INTEGER NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- created, updated, merged, archived
    summary TEXT NOT NULL,
    approved_by VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    before_state JSONB, -- Previous values
    after_state JSONB -- New values
);

-- 8. Operators: Simple auth
CREATE TABLE operators (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'operator', -- admin, operator
    created_at TIMESTAMP DEFAULT NOW()
);

-- Essential indexes for performance
CREATE INDEX idx_thread_status ON thread(status);
CREATE INDEX idx_thread_customer ON thread(customer_id);
CREATE INDEX idx_sop_category ON sop(category, active);
CREATE INDEX idx_action_thread ON action_log(thread_id);
CREATE INDEX idx_ticket_status ON ticket(status);
CREATE INDEX idx_system_status_location ON system_status(location_id, status);