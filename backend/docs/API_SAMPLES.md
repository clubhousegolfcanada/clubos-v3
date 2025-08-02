# ClubOS V3 API Samples

## Task 1: SOP Tags

### Create SOP with Tags

**Request:**
```bash
POST /api/sops
Content-Type: application/json

{
  "title": "TrackMan Audio Issues",
  "category": "tech_issue",
  "trigger_phrases": ["no sound", "audio not working", "cant hear"],
  "primary_action": "reset_trackman",
  "fallback_action": "escalate",
  "status": "draft",
  "tags": ["audio", "trackman", "common-issue"]
}
```

**Response:**
```json
{
  "success": true,
  "sop": {
    "id": 8,
    "title": "TrackMan Audio Issues",
    "category": "tech_issue",
    "trigger_phrases": ["no sound", "audio not working", "cant hear"],
    "primary_action": "reset_trackman",
    "fallback_action": "escalate",
    "status": "draft",
    "timeout_seconds": 30,
    "max_retries": 2,
    "tags": ["audio", "trackman", "common-issue"],
    "created_at": "2024-02-01T12:00:00Z"
  }
}
```

### Get SOPs (includes tags)

**Request:**
```bash
GET /api/sops?category=tech_issue&status=live
```

**Response:**
```json
{
  "sops": [
    {
      "id": 1,
      "title": "TrackMan Frozen Screen",
      "category": "tech_issue",
      "tags": ["display", "trackman", "critical"],
      "trigger_phrases": ["trackman frozen", "screen stuck"],
      "primary_action": "reset_trackman",
      "status": "live",
      "usage_count": 45,
      "last_used_at": "2024-02-01T11:30:00Z"
    }
  ]
}
```

## Task 2: Input Events

### Log Device Alert

**Request:**
```bash
POST /api/input-events
Content-Type: application/json

{
  "source": "ninjaone",
  "payload": {
    "alert_type": "device_offline",
    "device_id": "TM-BAY-03",
    "severity": "high",
    "timestamp": "2024-02-01T12:00:00Z",
    "details": {
      "last_seen": "2024-02-01T11:55:00Z",
      "bay_number": 3,
      "device_type": "trackman_pc"
    }
  },
  "location_id": "bedford",
  "bay_id": "bay-3"
}
```

**Response:**
```json
{
  "success": true,
  "event_id": "550e8400-e29b-41d4-a716-446655440001",
  "source": "ninjaone",
  "received_at": "2024-02-01T12:00:01Z",
  "correlation_id": "clubos-1706792401000-a1b2c3d4"
}
```

### Log Access Control Event

**Request:**
```bash
POST /api/input-events
Content-Type: application/json
X-Correlation-Id: "booking-12345"

{
  "source": "ubiquiti",
  "payload": {
    "event": "door_unlock_attempt",
    "success": false,
    "reason": "invalid_code",
    "attempted_code": "****",
    "door_id": "front-entrance"
  },
  "location_id": "bedford",
  "linked_thread_id": 42
}
```

**Response:**
```json
{
  "success": true,
  "event_id": "550e8400-e29b-41d4-a716-446655440002",
  "source": "ubiquiti",
  "received_at": "2024-02-01T12:05:00Z",
  "correlation_id": "booking-12345"
}
```

### Query Recent Events

**Request:**
```bash
GET /api/input-events?source=ninjaone&location_id=bedford&limit=10
```

**Response:**
```json
{
  "events": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "source": "ninjaone",
      "payload": {
        "alert_type": "device_offline",
        "device_id": "TM-BAY-03"
      },
      "received_at": "2024-02-01T12:00:01Z",
      "location_id": "bedford",
      "bay_id": "bay-3",
      "correlation_id": "clubos-1706792401000-a1b2c3d4",
      "linked_thread_id": null
    }
  ],
  "count": 1
}
```

## Tag Validation

Tags must follow these rules:
- Alphanumeric characters only (a-z, A-Z, 0-9)
- Underscores and hyphens allowed
- 1-50 characters per tag
- Empty array is valid

Invalid tag examples:
- `"tag with spaces"` ❌
- `"tag@symbol"` ❌
- `""` (empty string) ❌
- `"this-tag-is-way-too-long-and-exceeds-fifty-characters"` ❌

Valid tag examples:
- `"audio"` ✅
- `"common-issue"` ✅
- `"trackman_v2"` ✅
- `"HIGH-PRIORITY"` ✅