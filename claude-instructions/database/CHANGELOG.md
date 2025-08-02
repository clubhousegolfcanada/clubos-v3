# Database Changelog

## Format: `- DATE: [Action] Description (migration file)`

### 2025-08-01
- Created: Database context documentation system

### 2024-02-01
- Added: tags array field to sops table (002_tags_and_events.sql)
- Added: input_events table for external system logging (002_tags_and_events.sql)
- Added: GIN index on sops.tags for performance
- Updated: Seed data with example tags

### 2024-01-31
- Created: Initial schema with 8 tables (001_initial_schema.sql)
- Added: threads table with status tracking
- Added: messages table with direction field
- Added: sops table with JSON steps
- Added: action_logs for execution tracking
- Added: tickets table for escalations
- Added: change_logs for audit trail
- Added: valid_actions for action validation
- Added: Correlation ID pattern across tables

## Design Decisions

### Why PostgreSQL?
- JSON support for flexible fields
- Strong consistency guarantees
- Array types for tags
- Excellent performance

### Why Correlation IDs?
- Track requests across tables
- Debug complex flows
- Link external events

### Why JSON for Steps?
- Flexible action definitions
- Easy to extend
- No schema migrations for new fields

---
*Add entry for every schema change*