# Booking Platform Master Plan - ClubOS V3 Integration

**Version:** 1.0  
**Status:** Ready for Implementation  
**Architecture:** Standalone Microservice with Event-Driven Integration

---

## 🎯 Executive Summary

Booking is the gateway to your business. This plan delivers a world-class booking platform that works seamlessly with ClubOS V3 while maintaining architectural independence.

**Key Decisions:**
- **Standalone microservice** (not embedded in V3)
- **Event-driven integration** via message bus
- **20-week implementation** with parallel V3 development
- **Deep integrations** with HubSpot, Ubiquiti, NinjaOne

---

## 🏗️ System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Customer Apps   │     │ Admin Dashboard │     │ Kiosk/Walk-in   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Booking Platform API  │
                    │  (Node.js/PostgreSQL)   │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐
│ Booking Engine │     │ Rules Engine    │     │ Availability    │
│                │     │                 │     │ Service         │
└────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Event Bus          │
                    │   (Kafka/RabbitMQ)      │
                    └────────────┬────────────┘
                                 │
    ┌────────────────┬───────────┴───────────┬────────────────┐
    │                │                       │                │
┌───▼───┐     ┌─────▼─────┐         ┌──────▼──────┐   ┌─────▼─────┐
│HubSpot│     │ Ubiquiti  │         │  NinjaOne   │   │ClubOS V3  │
│  CRM  │     │  Access   │         │ Automation  │   │  Bridge   │
└───────┘     └───────────┘         └─────────────┘   └───────────┘
```

---

## 📅 20-Week Implementation Timeline

### Weeks 1-2: Foundation
```yaml
Infrastructure:
  - Event bus setup (Kafka/RabbitMQ)
  - Database schema
  - CI/CD pipelines
  - Development environments
  
Team: 2 backend engineers
```

### Weeks 3-6: Core Engine
```yaml
Booking Engine:
  - CRUD operations
  - Availability algorithm
  - Resource management
  - Basic rules (duration, advance booking)
  
Team: 3 backend engineers
```

### Weeks 7-10: Integrations
```yaml
External Systems:
  - HubSpot user sync & events
  - Ubiquiti access control & QR codes
  - NinjaOne automation
  - ClubOS V3 bridge service
  
Team: 2 backend, 1 integration engineer
```

### Weeks 11-14: User Experience
```yaml
Applications:
  - Customer PWA (React)
  - Admin dashboard (React)
  - Kiosk app (React)
  - Mobile optimization
  
Team: 2 frontend, 1 UX designer
```

### Weeks 15-17: Intelligence
```yaml
AI Features:
  - Natural language booking
  - Smart recommendations
  - Predictive maintenance
  - Dynamic availability
  
Team: 1 AI engineer, 1 backend
```

### Weeks 18-20: Launch
```yaml
Production:
  - Load testing
  - Security audit
  - Migration tools
  - Staff training
  - Soft launch
  
Team: Full team
```

---

## 🔧 Technical Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: NestJS (microservices)
- **Database**: PostgreSQL 15+
- **Cache**: Redis
- **Queue**: Bull/BullMQ
- **Event Bus**: Kafka or RabbitMQ

### Frontend
- **Framework**: React 18 with TypeScript
- **State**: Zustand/TanStack Query
- **UI**: Tailwind CSS + Headless UI
- **Mobile**: PWA with offline support
- **Real-time**: Socket.io

### Infrastructure
- **Hosting**: Railway (backend) + Vercel (frontend)
- **Monitoring**: Datadog/New Relic
- **Logging**: LogDNA/Papertrail
- **CDN**: Cloudflare

---

## 🔌 Integration Specifications

### HubSpot CRM
```typescript
interface HubSpotSync {
  // User data sync
  syncInterval: '5 minutes';
  fields: ['tier', 'tags', 'credits', 'preferences'];
  
  // Event tracking
  events: ['booking.created', 'booking.cancelled', 'no.show'];
  
  // Marketing automation
  triggers: ['first.booking', 'frequent.booker', 'win.back'];
}
```

### Ubiquiti Access
```typescript
interface UbiquitiAccess {
  // Time-based access
  accessWindow: booking.time ± 15 minutes;
  
  // QR code generation
  qrCode: {
    format: 'dynamic',
    validity: booking.duration + 30 minutes,
    encryption: 'AES-256'
  };
  
  // Door control
  doors: location.accessPoints;
}
```

### NinjaOne Automation
```typescript
interface NinjaOneAutomation {
  // Pre-arrival
  setup: {
    trigger: booking.time - 10 minutes,
    actions: ['power.on', 'launch.software', 'load.profile']
  };
  
  // Post-session
  cleanup: {
    trigger: booking.end + 5 minutes,
    actions: ['save.data', 'reset.defaults', 'diagnostics']
  };
}
```

### ClubOS V3 Bridge
```typescript
interface ClubOSBridge {
  // Context sharing
  events: ['booking.created', 'booking.modified', 'booking.cancelled'];
  
  // Natural language
  actions: ['create.booking', 'check.availability', 'modify.booking'];
  
  // Support context
  enrichment: ['upcoming.bookings', 'booking.history', 'preferences'];
}
```

---

## 💾 Database Schema (Core Tables)

```sql
-- Users (synced from HubSpot)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  hubspot_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  tier VARCHAR(50),
  tags TEXT[],
  booking_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Locations & Resources
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  address TEXT,
  timezone VARCHAR(50),
  operating_hours JSONB
);

CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id),
  name VARCHAR(255),
  type VARCHAR(50), -- 'simulator', 'meeting_room', etc
  ubiquiti_door_id VARCHAR(255),
  ninjaone_device_id VARCHAR(255),
  capacity INTEGER DEFAULT 1
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  resource_id INTEGER REFERENCES resources(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed',
  qr_code VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT no_overlap EXCLUDE USING gist (
    resource_id WITH =,
    tsrange(start_time, end_time) WITH &&
  ) WHERE (status != 'cancelled')
);

-- Rules & Restrictions
CREATE TABLE booking_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(50), -- 'user', 'resource', 'time'
  conditions JSONB,
  actions JSONB,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);
```

---

## 🚀 Quick Start Implementation

### Week 1 Deliverables
1. **Event bus running** (Kafka/RabbitMQ)
2. **Database schema deployed**
3. **Basic API scaffold** (health check, basic CRUD)
4. **CI/CD pipeline** (GitHub Actions → Railway)

### Week 2 Deliverables
1. **HubSpot webhook receiver**
2. **ClubOS V3 bridge skeleton**
3. **Development data seeding**
4. **API documentation** (OpenAPI)

### First Integration Test (End of Week 2)
```javascript
// Test flow: ClubOS V3 → Booking Platform → HubSpot
const testBooking = {
  message: "Book me a simulator tomorrow at 2pm",
  userId: "test-user-123"
};

// Expected flow:
// 1. ClubOS V3 parses intent
// 2. Bridge service translates to booking request
// 3. Booking platform checks availability
// 4. Creates booking if available
// 5. Sends event to HubSpot
// 6. Returns confirmation to ClubOS V3
```

---

## 📊 Success Metrics

### Technical KPIs
- **Uptime**: 99.9% (43 minutes downtime/month max)
- **Response Time**: <100ms p95
- **Concurrent Users**: 1000+
- **Booking Completion**: <2 seconds

### Business KPIs
- **Self-Service Rate**: 90%+ bookings without human help
- **Double-Booking Rate**: <0.1%
- **Customer Satisfaction**: 4.5+ stars
- **Support Ticket Reduction**: 50%

### Launch Criteria
- [ ] Load test passed (1000 concurrent users)
- [ ] Security audit completed
- [ ] 99.9% uptime in staging for 2 weeks
- [ ] Staff trained and confident
- [ ] Rollback plan tested

---

## 🎯 Critical Success Factors

1. **Architecture Independence**: Keep booking platform separate from ClubOS V3
2. **Event-Driven Design**: Loose coupling via event bus
3. **Performance First**: Every decision optimized for speed
4. **Integration Depth**: Not just API calls, but business logic alignment
5. **User Experience**: Customer-first design, mobile-first implementation

---

## 💡 Key Decisions Made

1. **Microservice over Monolith**: Scalability and maintainability
2. **PostgreSQL over NoSQL**: ACID compliance for bookings critical
3. **Event Bus over Direct Calls**: Decoupling and reliability
4. **PWA over Native Apps**: Faster deployment, easier maintenance
5. **TypeScript over JavaScript**: Type safety for complex domain

---

## 🚦 Go/No-Go Checkpoints

### Week 4: Core Engine
- [ ] Can create/read/update/delete bookings
- [ ] Availability algorithm working
- [ ] Basic rules enforced

### Week 10: Integrations
- [ ] HubSpot sync operational
- [ ] Ubiquiti access control tested
- [ ] ClubOS V3 bridge functioning

### Week 14: User Experience  
- [ ] Customer app usable
- [ ] Admin dashboard functional
- [ ] Real-time updates working

### Week 20: Launch
- [ ] All KPIs meeting targets
- [ ] No critical bugs
- [ ] Rollback plan ready

---

*"Book smart, build smarter. The gateway to your business deserves excellence."*