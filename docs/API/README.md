# ClubOS V3 API Documentation

## Overview
ClubOS V3 provides a RESTful API for managing customer service operations at The Clubhouse.

## Base URL
- Development: `http://localhost:3001/api`
- Production: `https://api.clubos.example.com/api`

## Authentication
All API requests require JWT authentication:
```
Authorization: Bearer <token>
```

## Available Endpoints

### Core Operations
- [Messages](./endpoints/messages.md) - Process customer messages
- [Threads](./endpoints/threads.md) - Manage conversation threads
- [Actions](./endpoints/actions.md) - Execute and track actions
- [SOPs](./endpoints/sops.md) - Manage Standard Operating Procedures

### System
- [Health](./endpoints/health.md) - System health checks
- [Input Events](./endpoints/input-events.md) - Log external system events

## Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": { },
  "error": null,
  "metadata": {
    "timestamp": "2025-08-01T10:00:00Z",
    "version": "0.4.0"
  }
}
```

## Error Handling
Errors return appropriate HTTP status codes:
- 400 - Bad Request
- 401 - Unauthorized
- 404 - Not Found
- 500 - Internal Server Error

## Rate Limiting
- 100 requests per minute per API key
- 429 status code when exceeded

## Postman Collection
Import our [Postman collection](./postman/clubos-v3.json) for easy testing.