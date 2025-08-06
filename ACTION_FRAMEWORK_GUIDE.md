# 🎯 Action Framework Guide

## Overview

The Action Execution Framework is ClubOS V3's centralized system for controlling all external devices and services. It provides a unified interface for executing actions with built-in retry logic, monitoring, and fault tolerance.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│ Action Request  │────▶│   Framework  │────▶│   Handler   │
│  (from SOP)     │     │   Core       │     │  (Device)   │
└─────────────────┘     └──────────────┘     └─────────────┘
                               │                     │
                               ▼                     ▼
                        ┌──────────────┐     ┌─────────────┐
                        │   Logging    │     │   Device    │
                        │   & Stats    │     │   API       │
                        └──────────────┘     └─────────────┘
```

## Quick Start

### Execute an Action

```javascript
const actionFramework = require('./services/actionFramework');

// Basic usage
const result = await actionFramework.execute('projector_on', {
  location: 'bedford',
  bay_id: 'bay1'
});

// With booking context
const result = await actionFramework.execute('reset_trackman', {
  location: 'dartmouth',
  bay_id: 'bay3',
  thread_id: 123,
  booking_id: 'abc123',
  correlation_id: 'req-456'
});
```

### Result Format

All actions return a standardized result:

```javascript
{
  outcome: 'success',  // 'success', 'partial', 'failed', 'unconfirmed'
  notes: 'Projector powered on successfully',
  timestamp: '2025-08-05T12:00:00Z',
  handler: 'benq',
  actionId: 'action_123456_abc',
  details: {
    // Handler-specific details
  }
}
```

## Available Actions

### 🎥 Projector Control (BenQ)

```javascript
// Power on projector
await actionFramework.execute('projector_on', {
  location: 'bedford',
  bay_id: 'bay1'
});

// Power off projector
await actionFramework.execute('projector_off', {
  location: 'bedford',
  bay_id: 'bay1'
});

// Change input
await actionFramework.execute('projector_input', {
  location: 'bedford',
  bay_id: 'bay1',
  input: 'hdmi'  // 'hdmi', 'hdmi2', 'vga'
});
```

### 💻 PC/TrackMan Control (NinjaOne)

```javascript
// Reset TrackMan
await actionFramework.execute('reset_trackman', {
  location: 'dartmouth',
  bay_id: 'bay2'
});

// Reboot PC
await actionFramework.execute('reboot_pc', {
  location: 'bedford',
  bay_id: 'bay1'
});

// Wake PC
await actionFramework.execute('wake_pc', {
  location: 'bedford',
  bay_id: 'bay1'
});

// Lock PC
await actionFramework.execute('lock_pc', {
  location: 'bedford',
  bay_id: 'bay1'
});
```

### 🚪 Door Access (Ubiquiti)

```javascript
// Unlock door
await actionFramework.execute('unlock_door', {
  location: 'bedford',
  door: 'main_entrance',  // Optional, defaults to main
  duration: 600  // Seconds, optional
});

// Lock door
await actionFramework.execute('lock_door', {
  location: 'dartmouth',
  door: 'bay_access'
});

// Check door status
await actionFramework.execute('check_door_status', {
  location: 'bedford',
  door: 'office'
});
```

### 📱 SMS Messaging (OpenPhone)

```javascript
// Send SMS
await actionFramework.execute('send_sms', {
  to: '+19024441234',
  message: 'Your TrackMan has been reset. Please try again!'
});

// Send with template
await actionFramework.execute('send_message', {
  to: '+19024441234',
  template: 'booking_confirmation',
  variables: {
    name: 'John Doe',
    date: '2025-08-10',
    time: '3:00 PM',
    location: 'Bedford'
  }
});
```

### 📊 CRM Operations (HubSpot)

```javascript
// Update contact
await actionFramework.execute('update_contact', {
  email: 'customer@example.com',
  properties: {
    last_booking: '2025-08-05',
    total_bookings: 25,
    preferred_location: 'Bedford'
  }
});

// Create support ticket
await actionFramework.execute('create_ticket', {
  subject: 'TrackMan Issue - Bay 3',
  description: 'Customer reported frozen screen',
  priority: 'high',
  contact_email: 'customer@example.com'
});

// Log activity
await actionFramework.execute('log_activity', {
  contact_email: 'customer@example.com',
  type: 'support_interaction',
  notes: 'Helped customer with TrackMan reset'
});
```

### 💬 Notifications (Slack)

```javascript
// Escalate to team
await actionFramework.execute('escalate', {
  thread_id: 123,
  reason: 'Multiple failed reset attempts',
  priority: 'high',
  context: {
    customer_id: 'cust_456',
    location: 'bedford',
    attempts: 3
  }
});

// Notify team
await actionFramework.execute('notify_team', {
  channel: '#tech-support',
  message: 'All systems operational after maintenance',
  priority: 'low'
});
```

## Advanced Features

### Circuit Breaker

The framework includes circuit breaker protection for each handler:

```javascript
// Check handler health
const stats = actionFramework.getStats();
console.log(stats);
// {
//   benq: { total: 100, success: 95, failed: 5, successRate: '95.00%' },
//   ninjaone: { total: 50, success: 48, failed: 2, successRate: '96.00%' }
// }

// Reset circuit breaker if needed
actionFramework.resetCircuitBreaker('ninjaone');
```

### Custom Retry Configuration

```javascript
await actionFramework.execute('reset_trackman', {
  location: 'bedford',
  bay_id: 'bay1',
  maxRetries: 3,  // Override default
  timeout: 45000  // 45 seconds
});
```

### Event Monitoring

```javascript
// Listen for action events
actionFramework.on('action:complete', (data) => {
  console.log(`Action ${data.actionType} completed in ${data.duration}ms`);
});

// Handler-specific events
const benqHandler = actionFramework.handlers.get('benq');
benqHandler.on('success', (data) => {
  console.log('BenQ action successful:', data);
});
```

## Configuration

### Environment Variables

```bash
# BenQ Projectors
BENQ_BEDFORD_BAY1_IP=192.168.1.101
BENQ_API_PORT=4661
BENQ_PASSWORD=admin123

# NinjaOne
NINJAONE_CLIENT_ID=your-client-id
NINJAONE_CLIENT_SECRET=your-secret
NINJAONE_ORG_ID=your-org-id

# Ubiquiti
UBIQUITI_CONTROLLER_URL=https://unifi.clubhouse.local
UBIQUITI_USERNAME=admin
UBIQUITI_PASSWORD=secure-password

# OpenPhone
OPENPHONE_API_KEY=your-api-key
OPENPHONE_PHONE_NUMBER=+19024441234

# HubSpot
HUBSPOT_API_KEY=your-api-key
HUBSPOT_PORTAL_ID=12345678

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Runtime Configuration

Configuration can be updated without restarting:

```javascript
// Update via database
UPDATE handler_configuration 
SET config_value = '20000' 
WHERE handler_name = 'benq' 
AND config_key = 'default_timeout';
```

## Adding New Handlers

1. Create a new handler extending BaseHandler:

```javascript
const BaseHandler = require('./BaseHandler');

class MyDeviceHandler extends BaseHandler {
  constructor() {
    super('mydevice', {
      timeout: 15000,
      retryable: true
    });
  }

  loadCredentials() {
    return {
      apiKey: process.env.MYDEVICE_API_KEY,
      baseUrl: process.env.MYDEVICE_URL
    };
  }

  async doSomething(context) {
    try {
      this.validateContext(context, ['required_field']);
      
      // Your logic here
      
      return this.handleSuccess('doSomething',
        this.createResult('success', 'Action completed', {
          // Details
        })
      );
    } catch (error) {
      return this.handleFailure('doSomething', error, context);
    }
  }
}

module.exports = MyDeviceHandler;
```

2. Register in actionFramework/index.js:

```javascript
const MyDeviceHandler = require('./handlers/MyDeviceHandler');

// In initializeHandlers()
this.registerHandler('mydevice', new MyDeviceHandler());

// Map action types
this.actionTypes.set('my_action', { handler: 'mydevice', method: 'doSomething' });
```

## Monitoring & Debugging

### Check Action Logs

```sql
-- Recent actions
SELECT * FROM action_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Failed actions
SELECT * FROM action_logs 
WHERE outcome = 'failed' 
AND created_at > NOW() - INTERVAL '1 hour';

-- Handler performance
SELECT * FROM get_handler_performance();
```

### Debug Mode

```javascript
// Enable debug logging
process.env.ACTION_FRAMEWORK_DEBUG = 'true';

// Test handler directly
const handler = actionFramework.handlers.get('benq');
const result = await handler.powerOn({
  location: 'bedford',
  bay_id: 'bay1'
});
```

## Error Handling

The framework handles various error scenarios:

- **Network errors**: Automatic retry with exponential backoff
- **Timeout errors**: Configurable timeout per handler
- **API errors**: Proper error messages and codes
- **Circuit breaker**: Prevents cascading failures

Example error result:
```javascript
{
  outcome: 'failed',
  notes: 'Connection timeout after 3 attempts',
  timestamp: '2025-08-05T12:00:00Z',
  error: 'ETIMEDOUT',
  retryable: true,
  retries: 3
}
```

## Best Practices

1. **Always include location and bay_id** for device-specific actions
2. **Use correlation_id** for request tracing
3. **Check handler health** before critical operations
4. **Monitor circuit breaker state** for production systems
5. **Log context** in action requests for debugging
6. **Handle all outcome types** (success, partial, failed, unconfirmed)

## Support

For issues or questions:
- Check action logs for detailed error information
- Review handler statistics for performance issues
- Monitor circuit breaker state for systemic problems
- Check handler health endpoints for connectivity