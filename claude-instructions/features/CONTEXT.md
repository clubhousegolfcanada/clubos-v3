# Feature Development Context

## Current State
Last Updated: 2025-08-01

### Implemented Features
- ✅ Message processing (POST /api/messages)
- ✅ Thread management system
- ✅ SOP matching with tags
- ✅ Action execution framework
- ✅ Basic auth (JWT)

### UI Components Built
- ✅ Thread list view
- ✅ Thread detail view
- ✅ Action buttons
- ✅ SOP management page
- ✅ Login page

### In Progress
- 🚧 None currently

### Planned Features
- 📋 Claude SOP ingestion
- 📋 Learning metrics
- 📋 Push notifications (PWA)
- 📋 Real-time updates (WebSocket)

## Patterns We Follow

### API Patterns
- RESTful endpoints
- Correlation IDs for tracking
- Consistent error responses
- Request logging

### Service Patterns
```javascript
class FeatureService {
  constructor(dependencies) {}
  async process(data) {}
}
```

### Database Patterns
- Timestamps on all tables
- Soft deletes where appropriate
- Correlation IDs for tracking

## Key Decisions
- Using services for business logic
- Controllers stay thin
- Database transactions for consistency
- Extensive logging for debugging

---
*Update this when patterns change or features are added*