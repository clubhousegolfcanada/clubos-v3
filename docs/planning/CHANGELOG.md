# Changelog

All notable changes to ClubOS V3 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-31

### Added

#### Core Message Loop
- **Message Processing** - POST /api/messages endpoint that classifies intent using OpenAI GPT-4
- **Intent Classification** - Automatic categorization into tech_issue, booking, access, or faq
- **Thread Management** - Database tracking of all customer conversations with status updates
- **SOP Matching** - Keyword-based matching of messages to Standard Operating Procedures

#### Action Execution
- **Action Framework** - Modular action execution system with logging
- **Reset TrackMan** - Mocked implementation with 90% success rate simulation
- **Unlock Door** - Access control with booking validation
- **Slack Escalation** - Webhook integration for human handoff
- **Message Sending** - Placeholder for OpenPhone integration

#### Database
- **Complete Schema** - 8 tables supporting the full V3 vision
- **Migration System** - Automated database setup
- **Seed Data** - 7 starter SOPs for common scenarios

#### API Endpoints
- `POST /api/messages` - Process incoming messages
- `GET /api/threads` - List conversation threads
- `GET /api/threads/:id` - Thread details
- `POST /api/actions` - Execute actions
- `GET /api/actions/:thread_id` - Action history
- `GET /api/sops` - List SOPs with filtering
- `POST /api/sops` - Create new SOPs
- `GET /health` - Health check

#### Frontend Skeleton
- Next.js 14 with TypeScript
- Mobile-first responsive design
- Thread list and detail views
- Action buttons for operators
- Ticket creation flow
- Admin SOP management page

### Infrastructure
- Railway deployment configuration
- Vercel deployment configuration
- Environment variable templates
- Health check endpoints
- JWT authentication setup

## [0.2.0] - 2024-02-01

### Added

#### Logic Improvements
- **JSON Schema Validation** - All SOPs validated against strict schema before creation
- **SOP Status Field** - Draft/live status prevents untested SOPs from being used
- **Correlation IDs** - Request tracing across thread, action_log, ticket, and change_log tables
- **Action Timeouts** - Configurable timeout_seconds per SOP (default 30s)
- **Retry Logic** - Automatic retries with max_retries per SOP (default 2)
- **Enhanced Outcomes** - Action outcomes now support success, partial, failed, unconfirmed
- **Valid Actions Table** - Enforces only known actions can be used in SOPs
- **Usage Tracking** - SOPs track usage_count, last_used_at, and override_count

### Changed
- SOP matcher now only returns live SOPs
- Action executor supports timeout and retry configuration
- Thread status updates based on action outcomes (partial → awaiting_human)
- Human overrides of failed SOPs are tracked

### Security
- SOPs cannot be created with invalid primary_action
- All actions validated against valid_actions table

## [0.3.0] - 2024-02-01

### Added

#### SOP Tagging System
- **Tags Field** - SOPs now support tags array for lightweight categorization
- **Tag Validation** - Tags must be alphanumeric with underscores/hyphens, max 50 chars
- **Tag Updates** - PUT /api/sops/:id endpoint to update SOP tags
- **Tag Indexing** - GIN index on tags array for future query performance

#### Input Event Logging
- **Input Event Table** - Tracks external system inputs for observability
- **POST /api/input-events** - Log events from NinjaOne, Ubiquiti, etc.
- **Event Querying** - GET endpoint with filters by source, location, time
- **Correlation Support** - Links events to threads via correlation_id

### Changed
- SOP creation/response now includes tags field
- Seed SOPs updated with example tags (display, sensors, booking, etc.)

## [0.4.0] - 2024-02-01

### Added

#### V1 Service Migration
- **Booking Service** - Customer booking validation and permission checks
- **Remote Actions** - TrackMan reset, door unlock, PC reboot handlers
- **Notifications** - Slack alerts and escalation system
- **Claude Integration** - SOP suggestion and merge analysis
- **Retry Utilities** - Error handling, retry logic, circuit breaker

### Changed
- Action executor now uses migrated V1 services
- Door unlock validates active bookings before execution
- Escalations use proper Slack notification formatting
- All services support demo mode when APIs not configured

### Technical Debt
- Placeholder API implementations for NinjaOne and Ubiquiti
- Need to update device IDs with production values

## [Unreleased]

### Planned
- Claude SOP ingestion endpoint (with tag validation)
- Claude merge suggestion system (using tags for grouping)
- Learning metrics table implementation
- Weekly SOP cleanup cron job
- Feedback dashboard
- System status monitoring
- Real NinjaOne integration (using input_event)
- Real Ubiquiti integration (using input_event)
- OpenPhone messaging
- Dark mode UI
- PWA support