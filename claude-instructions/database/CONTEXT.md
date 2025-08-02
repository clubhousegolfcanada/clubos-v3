# Database Context

## Current Schema
Last Updated: 2025-08-01

### Tables Overview
```sql
threads (id, phone_number, status, intent, created_at, updated_at)
messages (id, thread_id, content, direction, created_at)
sops (id, title, description, keywords, primary_action, steps, tags, status)
action_logs (id, thread_id, action_type, status, details, created_at)
tickets (id, thread_id, title, description, priority, status)
change_logs (id, entity_type, entity_id, field_name, old_value, new_value)
valid_actions (id, action_name, description)
input_events (id, source, event_type, location, details, correlation_id)
```

### Key Relationships
- threads ← messages (1:many)
- threads ← action_logs (1:many)  
- threads ← tickets (1:many)
- sops → valid_actions (many:1)

### Indexes
- threads(phone_number)
- threads(status)
- messages(thread_id)
- sops(status) WHERE status = 'live'
- sops(tags) - GIN index
- action_logs(thread_id)

### Migration Status
- ✅ 001_initial_schema.sql
- ✅ 002_tags_and_events.sql
- 📋 Next: Add learning_events table

## Patterns

### All Tables Have
```sql
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP -- via trigger
```

### Soft Deletes
- Currently: Hard deletes only
- Planned: Add deleted_at for soft deletes

### JSON Fields
- sops.steps - JSON array
- sops.tags - TEXT array
- action_logs.details - JSON
- input_events.details - JSON

---
*Update when schema changes*