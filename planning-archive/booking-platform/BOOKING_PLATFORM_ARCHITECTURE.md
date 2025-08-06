# ClubOS Booking Platform Architecture

**Version**: 1.0.0  
**Created**: August 2, 2025  
**Purpose**: World-class booking platform integrated with ClubOS V3

---

## Executive Summary

This document outlines the architecture for a standalone booking platform that leverages ClubOS V3's core intelligence while integrating seamlessly with HubSpot CRM, Ubiquiti Access Control, and NinjaOne RMM. The platform is designed to be modular, scalable, and maintainable without creating technical debt in the main ClubOS system.

---

## Core Architecture Principles

### 1. Microservices Architecture
- **Booking Service**: Core booking logic, availability management
- **Integration Service**: HubSpot, Ubiquiti, NinjaOne connectors
- **Access Control Service**: Door access management and verification
- **Notification Service**: Multi-channel alerts and confirmations
- **Analytics Service**: Booking patterns and business intelligence

### 2. Event-Driven Design
```
Customer Action → Event Bus → Multiple Services → Coordinated Response
```

### 3. API-First Development
- RESTful APIs for all services
- GraphQL gateway for frontend optimization
- WebSocket support for real-time updates

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                              │
├─────────────────────────────────────────────────────────────────────┤
│  Next.js 14 App      │  Mobile PWA        │  Kiosk Interface       │
│  - Booking UI        │  - iOS/Android     │  - Touch Optimized    │
│  - Admin Dashboard   │  - QR Code Access  │  - Self Check-in      │
│  - Analytics         │  - Push Notifs     │  - Walk-in Booking    │
└──────────────────────┬──────────────────┴──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────────────┐
│                        API Gateway (Kong/Express)                    │
│  - Authentication    - Rate Limiting    - Request Routing           │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────────────┐
│                         Core Services Layer                          │
├──────────────────────┬──────────────────┬──────────────────────────┤
│   Booking Service    │  Integration Hub │   Access Service         │
│   ---------------    │  --------------- │   --------------         │
│   - Availability     │  - HubSpot CRM   │   - Door Control         │
│   - Reservations     │  - Calendar Sync │   - QR Generation        │
│   - Cancellations    │  - Contact Mgmt  │   - Time Windows         │
│   - Waitlist         │  - Deal Pipeline │   - Entry Logs           │
│   - Pricing Engine   │  - Automation    │   - Security Alerts      │
├──────────────────────┼──────────────────┼──────────────────────────┤
│  Notification Svc    │  Analytics Svc   │   ClubOS V3 Bridge       │
│  ----------------    │  --------------  │   ----------------       │
│  - Email (SendGrid)  │  - Usage Stats   │   - Intent Analysis      │
│  - SMS (Twilio)      │  - Revenue       │   - SOP Matching         │
│  - Push Notifs       │  - Occupancy     │   - Action Execution     │
│  - In-App Messages   │  - Forecasting   │   - Learning Loop        │
└──────────────────────┴──────────────────┴──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────────────┐
│                        Data Layer (PostgreSQL)                       │
├──────────────────────┬──────────────────┬──────────────────────────┤
│   Bookings DB        │  Customers DB    │   Analytics DB           │
│   - Reservations     │  - Profiles      │   - Time Series Data     │
│   - Availability     │  - Preferences   │   - Aggregations         │
│   - Pricing Rules    │  - History       │   - Reports              │
└──────────────────────┴──────────────────┴──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────────────┐
│                     External Integrations                            │
├──────────────────────┬──────────────────┬──────────────────────────┤
│   HubSpot API        │  Ubiquiti UniFi  │   NinjaOne RMM          │
│   - Contacts         │  - Access Control │   - Remote Actions       │
│   - Deals            │  - Door Unlock   │   - System Health        │
│   - Activities       │  - Camera Feed   │   - Automation           │
└──────────────────────┴──────────────────┴──────────────────────────┘
```

---

## Key Features & Capabilities

### 1. Smart Booking Engine
- **Real-time Availability**: Live bay/simulator availability
- **Dynamic Pricing**: Time-based, demand-based pricing
- **Conflict Resolution**: Automatic detection and resolution
- **Waitlist Management**: Automatic notifications for cancellations
- **Recurring Bookings**: Weekly/monthly reservations
- **Group Bookings**: Multi-bay coordination

### 2. HubSpot CRM Integration
```javascript
// Contact Enrichment Flow
Booking Created → Fetch HubSpot Contact → Enrich Booking Data → Create Activity

// Features:
- Automatic contact creation/update
- Deal pipeline for high-value bookings
- Marketing automation triggers
- Customer lifetime value tracking
- Segmentation for targeted campaigns
```

### 3. Ubiquiti Access Control
```javascript
// Access Flow
Booking Confirmed → Generate Access Token → Time Window Created → Door Unlock

// Features:
- QR code generation for door access
- Time-based access windows (15 min before/after)
- Emergency override capabilities
- Access audit trail
- Integration with cameras for security
```

### 4. NinjaOne Automation
```javascript
// Automation Flow
Booking Event → Trigger NinjaOne Script → Execute Actions → Report Status

// Features:
- Automatic bay setup (lights, screens, equipment)
- Post-session cleanup routines
- Equipment health monitoring
- Predictive maintenance alerts
- Remote troubleshooting capabilities
```

### 5. ClubOS V3 Intelligence
```javascript
// AI Enhancement Flow
Customer Message → ClubOS Intent → Booking Action → Learning Feedback

// Features:
- Natural language booking requests
- Intelligent rebooking suggestions
- Pattern recognition for preferences
- Automated customer service
- SOP-based booking assistance
```

---

## Database Schema

### Core Tables

```sql
-- Facilities & Resources
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'America/Toronto',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE simulators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- 'trackman', 'foresight', etc.
    bay_number INTEGER,
    features JSONB DEFAULT '[]',
    hourly_rate DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active',
    unifi_door_id VARCHAR(255),
    ninjaone_device_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES facilities(id),
    simulator_id UUID REFERENCES simulators(id),
    customer_id UUID REFERENCES customers(id),
    hubspot_deal_id VARCHAR(255),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL, -- minutes
    status VARCHAR(50) DEFAULT 'pending',
    type VARCHAR(50) DEFAULT 'single', -- single, recurring
    recurrence_rule JSONB,
    price DECIMAL(10,2),
    payment_status VARCHAR(50),
    payment_method VARCHAR(50),
    access_code VARCHAR(20),
    qr_code_url TEXT,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT
);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    hubspot_contact_id VARCHAR(255),
    preferences JSONB DEFAULT '{}',
    tags TEXT[],
    vip_status BOOLEAN DEFAULT false,
    total_bookings INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_booking_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Access Control
CREATE TABLE access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'qr', -- qr, pin, nfc
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    device_id VARCHAR(255), -- Unifi door reader ID
    created_at TIMESTAMP DEFAULT NOW()
);

-- Availability Rules
CREATE TABLE availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulator_id UUID REFERENCES simulators(id),
    day_of_week INTEGER, -- 0-6
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 60, -- minutes
    buffer_time INTEGER DEFAULT 0, -- minutes between bookings
    max_advance_days INTEGER DEFAULT 30,
    min_advance_hours INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pricing Rules
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulator_id UUID REFERENCES simulators(id),
    name VARCHAR(255),
    type VARCHAR(50), -- 'time_based', 'demand_based', 'member'
    conditions JSONB NOT NULL,
    price_modifier DECIMAL(5,2), -- percentage or fixed amount
    priority INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_simulator ON bookings(simulator_id, start_time);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_access_tokens_booking ON access_tokens(booking_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_hubspot ON customers(hubspot_contact_id);
```

---

## Integration Specifications

### HubSpot Integration

```javascript
// API Configuration
const hubspotConfig = {
  apiKey: process.env.HUBSPOT_API_KEY,
  portalId: process.env.HUBSPOT_PORTAL_ID,
  endpoints: {
    contacts: '/crm/v3/objects/contacts',
    deals: '/crm/v3/objects/deals',
    activities: '/crm/v3/objects/activities'
  }
};

// Contact Sync
async function syncContactWithHubSpot(customer) {
  // Search for existing contact
  const existing = await hubspot.searchContacts(customer.email);
  
  // Create or update
  const contactData = {
    properties: {
      email: customer.email,
      firstname: customer.first_name,
      lastname: customer.last_name,
      phone: customer.phone,
      total_bookings: customer.total_bookings,
      lifetime_value: customer.total_spent,
      last_booking_date: customer.last_booking_at,
      vip_status: customer.vip_status
    }
  };
  
  return existing 
    ? await hubspot.updateContact(existing.id, contactData)
    : await hubspot.createContact(contactData);
}

// Booking Activity
async function createBookingActivity(booking, contact) {
  return await hubspot.createEngagement({
    type: 'BOOKING',
    contactId: contact.id,
    properties: {
      booking_id: booking.id,
      simulator: booking.simulator.name,
      start_time: booking.start_time,
      duration: booking.duration,
      price: booking.price,
      status: booking.status
    }
  });
}
```

### Ubiquiti UniFi Integration

```javascript
// UniFi Access Configuration
const unifiConfig = {
  host: process.env.UNIFI_HOST,
  username: process.env.UNIFI_USERNAME,
  password: process.env.UNIFI_PASSWORD,
  site: process.env.UNIFI_SITE_ID
};

// Door Access Management
class UniFiAccessManager {
  async createAccessWindow(booking) {
    const accessWindow = {
      userId: booking.customer_id,
      doorId: booking.simulator.unifi_door_id,
      startTime: moment(booking.start_time).subtract(15, 'minutes'),
      endTime: moment(booking.end_time).add(15, 'minutes'),
      accessCode: this.generateAccessCode()
    };
    
    // Create temporary access
    const response = await unifi.access.createTemporaryAccess(accessWindow);
    
    // Generate QR code
    const qrCode = await this.generateQRCode({
      bookingId: booking.id,
      accessCode: accessWindow.accessCode,
      validUntil: accessWindow.endTime
    });
    
    return { accessCode: accessWindow.accessCode, qrCode };
  }
  
  async unlockDoor(doorId, duration = 5) {
    return await unifi.access.unlockDoor(doorId, duration);
  }
  
  async getAccessLog(doorId, timeframe) {
    return await unifi.access.getEvents({
      doorId,
      startTime: timeframe.start,
      endTime: timeframe.end,
      eventTypes: ['door_unlock', 'door_forced', 'access_denied']
    });
  }
}
```

### NinjaOne Integration

```javascript
// NinjaOne Configuration
const ninjaConfig = {
  clientId: process.env.NINJAONE_CLIENT_ID,
  clientSecret: process.env.NINJAONE_CLIENT_SECRET,
  instanceUrl: process.env.NINJAONE_INSTANCE_URL
};

// Automation Scripts
class NinjaOneAutomation {
  async prepareSimulator(booking) {
    const device = booking.simulator.ninjaone_device_id;
    
    // Run preparation script
    await ninjaone.runScript(device, 'SIMULATOR_PREP', {
      bookingId: booking.id,
      customerName: `${booking.customer.first_name} ${booking.customer.last_name}`,
      startTime: booking.start_time,
      simulatorType: booking.simulator.type,
      preferences: booking.customer.preferences
    });
    
    // Set up monitoring
    await ninjaone.createMonitor(device, {
      name: `Booking ${booking.id}`,
      duration: booking.duration + 30, // Extra time for cleanup
      alerts: ['equipment_failure', 'temperature_anomaly', 'network_issue']
    });
  }
  
  async cleanupSimulator(booking) {
    const device = booking.simulator.ninjaone_device_id;
    
    // Run cleanup script
    await ninjaone.runScript(device, 'SIMULATOR_CLEANUP', {
      bookingId: booking.id,
      resetToDefaults: true,
      logUsageStats: true
    });
  }
  
  async getDeviceHealth(deviceId) {
    return await ninjaone.getDeviceStatus(deviceId);
  }
}
```

---

## API Endpoints

### Booking Management

```yaml
# Create Booking
POST /api/v1/bookings
Body:
  {
    "simulator_id": "uuid",
    "start_time": "2025-08-03T14:00:00Z",
    "duration": 60,
    "customer": {
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890"
    },
    "preferences": {
      "equipment": ["driver", "irons"],
      "climate": "moderate"
    }
  }

# Get Available Slots
GET /api/v1/availability
Query:
  - simulator_id: uuid
  - date: 2025-08-03
  - duration: 60
  - timezone: America/Toronto

# Cancel Booking
POST /api/v1/bookings/{id}/cancel
Body:
  {
    "reason": "Customer request",
    "refund": true
  }

# Check-in
POST /api/v1/bookings/{id}/checkin
Body:
  {
    "method": "qr_code",
    "code": "ABC123"
  }
```

### Customer Management

```yaml
# Get Customer Profile
GET /api/v1/customers/{id}
Response:
  {
    "id": "uuid",
    "email": "john@example.com",
    "profile": {...},
    "preferences": {...},
    "booking_history": [...],
    "upcoming_bookings": [...],
    "loyalty_points": 250
  }

# Update Preferences
PATCH /api/v1/customers/{id}/preferences
Body:
  {
    "preferred_simulator": "uuid",
    "preferred_times": ["evening", "weekend"],
    "notifications": {
      "email": true,
      "sms": true,
      "push": false
    }
  }
```

### Admin Operations

```yaml
# Dashboard Stats
GET /api/v1/admin/dashboard
Response:
  {
    "today": {
      "bookings": 45,
      "revenue": 3825.00,
      "occupancy": 78.5,
      "cancellations": 3
    },
    "trends": {...},
    "alerts": [...]
  }

# Simulator Management
PATCH /api/v1/admin/simulators/{id}
Body:
  {
    "status": "maintenance",
    "maintenance_until": "2025-08-03T18:00:00Z",
    "reason": "Software update"
  }
```

---

## Security & Compliance

### Authentication & Authorization
- **JWT-based authentication** with refresh tokens
- **Role-based access control** (Customer, Staff, Admin, System)
- **API key management** for external integrations
- **OAuth2 support** for third-party apps

### Data Protection
- **End-to-end encryption** for sensitive data
- **PCI DSS compliance** for payment processing
- **GDPR compliance** with data retention policies
- **Audit logging** for all data access

### Access Control Security
- **Time-limited access tokens**
- **Geofencing** for mobile app access
- **Biometric authentication** support
- **Emergency override procedures**

---

## Performance Specifications

### Scalability Targets
- **Concurrent bookings**: 1000+ per minute
- **API response time**: < 100ms (p95)
- **Database queries**: < 50ms
- **Real-time updates**: < 500ms latency

### Caching Strategy
```javascript
// Multi-tier caching
const cacheConfig = {
  redis: {
    availability: { ttl: 60 }, // 1 minute
    pricing: { ttl: 300 }, // 5 minutes
    customer: { ttl: 3600 } // 1 hour
  },
  cdn: {
    static: { ttl: 86400 }, // 1 day
    images: { ttl: 604800 } // 1 week
  }
};
```

### Load Balancing
- **Geographic distribution** with edge servers
- **Auto-scaling** based on demand
- **Circuit breakers** for external services
- **Graceful degradation** strategies

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up microservices architecture
- [ ] Implement core booking engine
- [ ] Basic database schema and APIs
- [ ] Authentication system
- [ ] Basic admin dashboard

### Phase 2: Integrations (Weeks 5-8)
- [ ] HubSpot CRM integration
- [ ] Ubiquiti Access Control
- [ ] NinjaOne automation
- [ ] Payment processing
- [ ] Notification system

### Phase 3: Intelligence (Weeks 9-12)
- [ ] ClubOS V3 bridge
- [ ] AI-powered recommendations
- [ ] Predictive analytics
- [ ] Dynamic pricing engine
- [ ] Advanced reporting

### Phase 4: Polish (Weeks 13-16)
- [ ] Mobile app development
- [ ] Kiosk interface
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Beta testing

### Phase 5: Launch (Weeks 17-20)
- [ ] Production deployment
- [ ] Staff training
- [ ] Customer onboarding
- [ ] Monitoring setup
- [ ] Go-live support

---

## Monitoring & Analytics

### Key Metrics
```javascript
// Business Metrics
- Booking conversion rate
- Average booking value
- Occupancy rate by time/day
- Customer lifetime value
- Cancellation rate

// Technical Metrics
- API response times
- Error rates
- Database performance
- Integration health
- System uptime
```

### Dashboards
- **Operations Dashboard**: Real-time facility status
- **Business Dashboard**: Revenue and trends
- **Technical Dashboard**: System health
- **Customer Dashboard**: Satisfaction metrics

---

## Disaster Recovery

### Backup Strategy
- **Database**: Continuous replication, hourly snapshots
- **File storage**: Daily backups to S3
- **Configuration**: Version controlled in Git
- **Recovery time objective**: < 1 hour
- **Recovery point objective**: < 15 minutes

### Failover Procedures
- **Automatic failover** for critical services
- **Manual failover** procedures documented
- **Regular disaster recovery drills**
- **Multi-region deployment** capability

---

## Future Enhancements

### Planned Features
1. **AI-Powered Scheduling**: Optimize facility utilization
2. **Virtual Reality Tours**: Pre-booking facility preview
3. **Social Features**: Group bookings, leagues, tournaments
4. **Loyalty Program**: Points, rewards, tiers
5. **Equipment Rental**: Integrated with booking flow
6. **Food & Beverage**: Pre-order for arrival
7. **Coaching Integration**: Book lessons with pros
8. **Weather Integration**: Suggest indoor times during bad weather

### Technology Roadmap
- **Blockchain**: For loyalty points and rewards
- **IoT Integration**: Smart equipment tracking
- **Voice Assistants**: Alexa/Google booking
- **AR Wayfinding**: Navigate to booked bay
- **Predictive Maintenance**: ML-based equipment care

---

*This architecture is designed to scale with your business while maintaining the simplicity and effectiveness that ClubOS V3 embodies.*