-- Seed SOPs for testing ClubOS V3
-- Run after migrations: psql $DATABASE_URL -f src/db/seed-sops.sql

-- Ensure valid_actions table exists and has entries
INSERT INTO valid_actions (action_type, description, requires_booking) VALUES
    ('reset_trackman', 'Reset TrackMan equipment', false),
    ('unlock_door', 'Unlock facility door', true),
    ('escalate', 'Escalate to human operator', false),
    ('send_message', 'Send message to customer', false)
ON CONFLICT (action_type) DO NOTHING;

-- Tech Issues
INSERT INTO sop (title, category, trigger_phrases, primary_action, fallback_action, status, timeout_seconds, max_retries, source_metadata, tags)
VALUES 
('TrackMan Frozen Screen', 'tech_issue', 
 ARRAY['trackman frozen', 'screen stuck', 'trackman not working', 'screen freeze'], 
 'reset_trackman', 'escalate', 'live', 30, 2,
 '{"created_by": "system", "source": "common_issue"}'::jsonb,
 ARRAY['display', 'trackman', 'critical']),

('TrackMan No Ball Detection', 'tech_issue',
 ARRAY['no ball detection', 'not tracking balls', 'ball not registering'],
 'reset_trackman', 'escalate', 'live', 45, 3,
 '{"created_by": "system", "source": "common_issue"}'::jsonb,
 ARRAY['sensors', 'trackman', 'common']);

-- Booking Issues  
INSERT INTO sop (title, category, trigger_phrases, primary_action, fallback_action, status, timeout_seconds, max_retries, source_metadata, tags)
VALUES
('Booking Not Found', 'booking',
 ARRAY['booking not found', 'no reservation', 'cant find booking'],
 'escalate', 'escalate', 'live', 10, 1,
 '{"created_by": "system", "source": "common_issue"}'::jsonb,
 ARRAY['booking', 'urgent']),

('Cancel Booking Request', 'booking',
 ARRAY['cancel booking', 'cancel reservation', 'cancel my session'],
 'escalate', 'escalate', 'live', 10, 1,
 '{"created_by": "system", "source": "common_issue"}'::jsonb,
 ARRAY['booking', 'customer-service']);

-- Access Issues
INSERT INTO sop (title, category, trigger_phrases, primary_action, fallback_action, status, timeout_seconds, max_retries, source_metadata, prerequisites)
VALUES
('Door Won''t Open', 'access',
 ARRAY['door wont open', 'cant get in', 'door locked', 'access denied'],
 'unlock_door', 'escalate', 'live', 20, 2,
 '{"created_by": "system", "source": "common_issue"}'::jsonb,
 '["booking_active"]'::jsonb);

-- FAQ
INSERT INTO sop (title, category, trigger_phrases, primary_action, fallback_action, status, timeout_seconds, max_retries, source_metadata)
VALUES
('Guest Policy Question', 'faq',
 ARRAY['bring a guest', 'bring friend', 'how many people', 'guest policy'],
 'send_message', 'escalate', 'live', 5, 1,
 '{"created_by": "system", "source": "faq"}'::jsonb),

('Hours of Operation', 'faq',
 ARRAY['what time open', 'hours', 'when open', 'closing time'],
 'send_message', 'escalate', 'live', 5, 1,
 '{"created_by": "system", "source": "faq"}'::jsonb);