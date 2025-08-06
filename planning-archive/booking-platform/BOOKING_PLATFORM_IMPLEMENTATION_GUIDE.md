# Booking Platform Implementation Guide

**Version**: 1.0.0  
**Created**: August 2, 2025  
**Purpose**: Step-by-step implementation guide for ClubOS Booking Platform

---

## Project Setup & Structure

### Recommended Directory Structure
```
clubos-booking-platform/
├── apps/
│   ├── api/                    # Main API Gateway
│   ├── booking-service/        # Core booking logic
│   ├── integration-service/    # External integrations
│   ├── access-service/         # Door access management
│   ├── notification-service/   # Multi-channel notifications
│   └── analytics-service/      # Business intelligence
├── packages/
│   ├── shared/                 # Shared utilities
│   ├── database/              # Database schemas & migrations
│   ├── types/                 # TypeScript types
│   └── ui/                    # Shared UI components
├── frontend/
│   ├── booking-app/           # Customer booking interface
│   ├── admin-dashboard/       # Staff management portal
│   └── kiosk-app/            # On-site check-in kiosk
├── infrastructure/
│   ├── docker/               # Docker configurations
│   ├── k8s/                  # Kubernetes manifests
│   └── terraform/            # Infrastructure as code
└── scripts/                  # Build & deployment scripts
```

### Technology Stack

```yaml
Backend:
  - Language: TypeScript (Node.js 20 LTS)
  - Framework: Express.js with decorators
  - API Gateway: Kong or Express Gateway
  - Database: PostgreSQL 15 with TimescaleDB
  - Cache: Redis 7
  - Message Queue: RabbitMQ or AWS SQS
  - Real-time: Socket.io

Frontend:
  - Framework: Next.js 14 (App Router)
  - UI Library: Tailwind CSS + Shadcn/ui
  - State Management: Zustand
  - Forms: React Hook Form + Zod
  - Charts: Recharts
  - Mobile: PWA with Capacitor

DevOps:
  - Containers: Docker
  - Orchestration: Kubernetes or Docker Swarm
  - CI/CD: GitHub Actions
  - Monitoring: Prometheus + Grafana
  - Logging: ELK Stack
  - APM: New Relic or Datadog
```

---

## Phase 1: Foundation (Weeks 1-4)

### Week 1: Project Setup

```bash
# 1. Initialize monorepo
npx create-turbo@latest clubos-booking-platform
cd clubos-booking-platform

# 2. Set up services
mkdir -p apps/{api,booking-service,integration-service}
mkdir -p packages/{shared,database,types}

# 3. Install core dependencies
npm install -D typescript @types/node eslint prettier
npm install express helmet cors compression
npm install @prisma/client prisma
npm install ioredis bull
npm install winston pino

# 4. Set up database
docker-compose up -d postgres redis
npx prisma init
```

### Week 2: Core Booking Service

```typescript
// apps/booking-service/src/index.ts
import express from 'express';
import { BookingController } from './controllers/BookingController';
import { AvailabilityService } from './services/AvailabilityService';
import { PricingEngine } from './services/PricingEngine';

const app = express();

// Core booking endpoints
app.post('/bookings', BookingController.create);
app.get('/bookings/:id', BookingController.get);
app.patch('/bookings/:id', BookingController.update);
app.delete('/bookings/:id', BookingController.cancel);

// Availability
app.get('/availability', AvailabilityService.getSlots);
app.post('/availability/check', AvailabilityService.checkConflicts);

// Pricing
app.post('/pricing/calculate', PricingEngine.calculate);
app.get('/pricing/rules', PricingEngine.getRules);
```

### Week 3: Database Schema Implementation

```sql
-- packages/database/migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Facilities table
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'America/Toronto',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Continue with all tables from architecture document...
```

### Week 4: API Gateway & Authentication

```typescript
// apps/api/src/gateway.ts
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

// Service routing
const serviceRoutes = {
  '/api/bookings': 'http://booking-service:3001',
  '/api/customers': 'http://customer-service:3002',
  '/api/integrations': 'http://integration-service:3003',
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

---

## Phase 2: Integrations (Weeks 5-8)

### Week 5: HubSpot Integration

```typescript
// apps/integration-service/src/hubspot/HubSpotClient.ts
import { Client } from '@hubspot/api-client';

export class HubSpotClient {
  private client: Client;
  
  constructor() {
    this.client = new Client({
      accessToken: process.env.HUBSPOT_ACCESS_TOKEN
    });
  }
  
  async syncCustomer(customer: Customer): Promise<void> {
    try {
      // Search for existing contact
      const searchResponse = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: customer.email
          }]
        }]
      });
      
      const contactData = {
        properties: {
          email: customer.email,
          firstname: customer.firstName,
          lastname: customer.lastName,
          phone: customer.phone,
          clubos_total_bookings: customer.totalBookings,
          clubos_lifetime_value: customer.totalSpent,
          clubos_vip_status: customer.vipStatus
        }
      };
      
      if (searchResponse.results.length > 0) {
        // Update existing contact
        await this.client.crm.contacts.basicApi.update(
          searchResponse.results[0].id,
          contactData
        );
      } else {
        // Create new contact
        await this.client.crm.contacts.basicApi.create(contactData);
      }
    } catch (error) {
      logger.error('HubSpot sync error:', error);
      throw new IntegrationError('Failed to sync with HubSpot');
    }
  }
  
  async createBookingActivity(booking: Booking): Promise<void> {
    const engagement = {
      engagement: {
        active: true,
        type: 'NOTE',
        timestamp: Date.now()
      },
      associations: {
        contactIds: [booking.customer.hubspotId],
        companyIds: [],
        dealIds: []
      },
      metadata: {
        body: `Booking created for ${booking.simulator.name} on ${booking.startTime}`
      }
    };
    
    await this.client.crm.timeline.eventsApi.create(engagement);
  }
}
```

### Week 6: Ubiquiti UniFi Integration

```typescript
// apps/integration-service/src/unifi/UniFiAccessClient.ts
import axios from 'axios';
import https from 'https';

export class UniFiAccessClient {
  private apiUrl: string;
  private cookie: string;
  
  constructor() {
    this.apiUrl = `https://${process.env.UNIFI_HOST}:${process.env.UNIFI_PORT}`;
  }
  
  async login(): Promise<void> {
    const agent = new https.Agent({
      rejectUnauthorized: false // UniFi uses self-signed certs
    });
    
    const response = await axios.post(
      `${this.apiUrl}/api/login`,
      {
        username: process.env.UNIFI_USERNAME,
        password: process.env.UNIFI_PASSWORD
      },
      { httpsAgent: agent }
    );
    
    this.cookie = response.headers['set-cookie'][0];
  }
  
  async createTemporaryAccess(params: {
    userId: string;
    doorId: string;
    startTime: Date;
    endTime: Date;
    code: string;
  }): Promise<void> {
    await this.makeRequest('POST', '/api/s/default/rest/access', {
      user_id: params.userId,
      door_id: params.doorId,
      start_time: params.startTime.getTime() / 1000,
      end_time: params.endTime.getTime() / 1000,
      access_code: params.code,
      type: 'temporary'
    });
  }
  
  async unlockDoor(doorId: string, duration: number = 5): Promise<void> {
    await this.makeRequest('POST', `/api/s/default/cmd/access`, {
      cmd: 'unlock-door',
      door_id: doorId,
      duration: duration
    });
  }
  
  private async makeRequest(method: string, path: string, data?: any) {
    const agent = new https.Agent({ rejectUnauthorized: false });
    
    return await axios({
      method,
      url: `${this.apiUrl}${path}`,
      data,
      headers: {
        'Cookie': this.cookie,
        'Content-Type': 'application/json'
      },
      httpsAgent: agent
    });
  }
}
```

### Week 7: NinjaOne Integration

```typescript
// apps/integration-service/src/ninjaone/NinjaOneClient.ts
import axios from 'axios';

export class NinjaOneClient {
  private accessToken: string;
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.NINJAONE_API_URL;
  }
  
  async authenticate(): Promise<void> {
    const response = await axios.post(
      `${this.baseUrl}/oauth/token`,
      {
        grant_type: 'client_credentials',
        client_id: process.env.NINJAONE_CLIENT_ID,
        client_secret: process.env.NINJAONE_CLIENT_SECRET,
        scope: 'monitoring management'
      }
    );
    
    this.accessToken = response.data.access_token;
  }
  
  async runScript(deviceId: string, scriptId: string, parameters: any): Promise<void> {
    const response = await axios.post(
      `${this.baseUrl}/v2/devices/${deviceId}/scripts/${scriptId}/run`,
      {
        parameters: parameters
      },
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Monitor script execution
    const jobId = response.data.jobId;
    await this.waitForJobCompletion(jobId);
  }
  
  async prepareSimulator(booking: Booking): Promise<void> {
    const script = {
      name: 'SIMULATOR_PREP',
      parameters: {
        booking_id: booking.id,
        customer_name: `${booking.customer.firstName} ${booking.customer.lastName}`,
        start_time: booking.startTime.toISOString(),
        preferences: JSON.stringify(booking.customer.preferences),
        actions: [
          'reset_to_defaults',
          'set_customer_preferences',
          'start_session_recording',
          'enable_climate_control',
          'display_welcome_message'
        ]
      }
    };
    
    await this.runScript(
      booking.simulator.ninjaoneDeviceId,
      script.name,
      script.parameters
    );
  }
}
```

### Week 8: Notification Service

```typescript
// apps/notification-service/src/NotificationService.ts
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import webpush from 'web-push';

export class NotificationService {
  private emailClient: typeof sgMail;
  private smsClient: twilio.Twilio;
  
  constructor() {
    // Email setup
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.emailClient = sgMail;
    
    // SMS setup
    this.smsClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Push notification setup
    webpush.setVapidDetails(
      'mailto:support@clubos.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
  
  async sendBookingConfirmation(booking: Booking): Promise<void> {
    const customer = booking.customer;
    
    // Email
    if (customer.preferences.notifications.email) {
      await this.sendEmail({
        to: customer.email,
        templateId: 'booking_confirmation',
        dynamicTemplateData: {
          firstName: customer.firstName,
          bookingDate: booking.startTime,
          simulator: booking.simulator.name,
          duration: booking.duration,
          accessCode: booking.accessCode,
          qrCodeUrl: booking.qrCodeUrl
        }
      });
    }
    
    // SMS
    if (customer.preferences.notifications.sms && customer.phone) {
      await this.sendSMS({
        to: customer.phone,
        body: `Your booking at ClubHouse is confirmed for ${booking.startTime}. ` +
              `Access code: ${booking.accessCode}. Reply STOP to unsubscribe.`
      });
    }
    
    // Push notification
    if (customer.pushSubscription) {
      await this.sendPushNotification({
        subscription: customer.pushSubscription,
        title: 'Booking Confirmed!',
        body: `See you at ${booking.startTime}`,
        data: {
          bookingId: booking.id,
          action: 'view_booking'
        }
      });
    }
  }
}
```

---

## Phase 3: Intelligence (Weeks 9-12)

### Week 9: ClubOS V3 Bridge

```typescript
// apps/integration-service/src/clubos/ClubOSBridge.ts
import axios from 'axios';

export class ClubOSBridge {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = process.env.CLUBOS_V3_API_URL;
  }
  
  async processBookingIntent(message: string, context: any): Promise<any> {
    const response = await axios.post(
      `${this.apiUrl}/api/messages`,
      {
        content: message,
        customerId: context.customerId,
        channel: 'booking_platform',
        metadata: {
          context: 'booking_request',
          session: context.sessionId
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLUBOS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Parse ClubOS response and extract booking intent
    const intent = response.data.intent;
    const actions = response.data.actions;
    
    if (intent.category === 'booking_request') {
      return {
        action: 'create_booking',
        parameters: this.extractBookingParameters(actions),
        confidence: intent.confidence
      };
    }
    
    return {
      action: 'clarification_needed',
      message: response.data.response
    };
  }
  
  private extractBookingParameters(actions: any[]): any {
    // Extract booking details from ClubOS actions
    const params = {};
    
    actions.forEach(action => {
      switch (action.type) {
        case 'set_date':
          params.date = action.value;
          break;
        case 'set_time':
          params.time = action.value;
          break;
        case 'set_duration':
          params.duration = action.value;
          break;
        case 'set_simulator':
          params.simulatorId = action.value;
          break;
      }
    });
    
    return params;
  }
}
```

### Week 10: Analytics Service

```typescript
// apps/analytics-service/src/AnalyticsEngine.ts
import { TimescaleDB } from './TimescaleDB';
import { PredictiveModel } from './PredictiveModel';

export class AnalyticsEngine {
  private db: TimescaleDB;
  private model: PredictiveModel;
  
  async calculateMetrics(facilityId: string, timeframe: TimeFrame): Promise<Metrics> {
    const metrics = await this.db.query(`
      SELECT
        COUNT(*) as total_bookings,
        AVG(price) as avg_booking_value,
        SUM(price) as total_revenue,
        COUNT(DISTINCT customer_id) as unique_customers,
        AVG(duration) as avg_duration,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::float / COUNT(*) as cancellation_rate
      FROM bookings
      WHERE facility_id = $1
        AND start_time >= $2
        AND start_time < $3
    `, [facilityId, timeframe.start, timeframe.end]);
    
    // Calculate occupancy
    const occupancy = await this.calculateOccupancy(facilityId, timeframe);
    
    // Get peak hours
    const peakHours = await this.db.query(`
      SELECT
        EXTRACT(HOUR FROM start_time) as hour,
        COUNT(*) as bookings
      FROM bookings
      WHERE facility_id = $1
        AND start_time >= $2
        AND start_time < $3
      GROUP BY hour
      ORDER BY bookings DESC
      LIMIT 3
    `, [facilityId, timeframe.start, timeframe.end]);
    
    return {
      ...metrics[0],
      occupancy,
      peakHours: peakHours.map(h => h.hour)
    };
  }
  
  async predictDemand(facilityId: string, date: Date): Promise<DemandPrediction> {
    // Get historical data
    const historicalData = await this.getHistoricalData(facilityId, date);
    
    // Run prediction model
    const prediction = await this.model.predict({
      dayOfWeek: date.getDay(),
      month: date.getMonth(),
      historicalAverage: historicalData.average,
      trend: historicalData.trend,
      seasonality: this.getSeasonalityFactor(date),
      specialEvents: await this.getSpecialEvents(date)
    });
    
    return {
      expectedBookings: prediction.bookings,
      confidence: prediction.confidence,
      recommendations: this.generateRecommendations(prediction)
    };
  }
}
```

### Week 11: Dynamic Pricing Engine

```typescript
// apps/booking-service/src/services/DynamicPricingEngine.ts
export class DynamicPricingEngine {
  async calculatePrice(params: PricingParams): Promise<PricingResult> {
    const basePrice = await this.getBasePrice(params.simulatorId);
    let finalPrice = basePrice;
    
    // Apply time-based pricing
    const timeMultiplier = this.getTimeMultiplier(params.startTime);
    finalPrice *= timeMultiplier;
    
    // Apply demand-based pricing
    const demandMultiplier = await this.getDemandMultiplier(
      params.simulatorId,
      params.startTime
    );
    finalPrice *= demandMultiplier;
    
    // Apply customer-specific pricing
    if (params.customerId) {
      const customerDiscount = await this.getCustomerDiscount(params.customerId);
      finalPrice *= (1 - customerDiscount);
    }
    
    // Apply promotional pricing
    const promoDiscount = await this.getPromoDiscount(params.promoCode);
    finalPrice *= (1 - promoDiscount);
    
    // Apply duration-based pricing
    const durationMultiplier = this.getDurationMultiplier(params.duration);
    finalPrice *= durationMultiplier;
    
    return {
      basePrice,
      finalPrice: Math.round(finalPrice * 100) / 100,
      breakdown: {
        timeAdjustment: (timeMultiplier - 1) * basePrice,
        demandAdjustment: (demandMultiplier - 1) * basePrice,
        customerDiscount: customerDiscount * basePrice,
        promoDiscount: promoDiscount * basePrice,
        durationAdjustment: (durationMultiplier - 1) * basePrice
      },
      validUntil: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    };
  }
  
  private getTimeMultiplier(startTime: Date): number {
    const hour = startTime.getHours();
    const dayOfWeek = startTime.getDay();
    
    // Weekend premium
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (hour >= 10 && hour < 20) return 1.25; // 25% premium
      return 1.15; // 15% premium
    }
    
    // Weekday pricing
    if (hour >= 17 && hour < 21) return 1.20; // Peak hours 20% premium
    if (hour >= 6 && hour < 9) return 0.85; // Early bird 15% discount
    if (hour >= 21 || hour < 6) return 0.75; // Late night 25% discount
    
    return 1.0; // Standard pricing
  }
}
```

### Week 12: Reporting & Insights

```typescript
// apps/analytics-service/src/ReportGenerator.ts
export class ReportGenerator {
  async generateDailyReport(facilityId: string, date: Date): Promise<Report> {
    const report = {
      date: date,
      summary: await this.getDailySummary(facilityId, date),
      bookings: await this.getBookingDetails(facilityId, date),
      revenue: await this.getRevenueBreakdown(facilityId, date),
      occupancy: await this.getOccupancyAnalysis(facilityId, date),
      customers: await this.getCustomerAnalysis(facilityId, date),
      issues: await this.getOperationalIssues(facilityId, date),
      recommendations: await this.generateRecommendations(facilityId, date)
    };
    
    // Generate PDF
    const pdf = await this.generatePDF(report);
    
    // Send to stakeholders
    await this.distributeReport(report, pdf);
    
    return report;
  }
  
  private async generateRecommendations(facilityId: string, date: Date): Promise<Recommendation[]> {
    const recommendations = [];
    
    // Analyze occupancy patterns
    const occupancy = await this.getOccupancyAnalysis(facilityId, date);
    if (occupancy.average < 0.6) {
      recommendations.push({
        type: 'pricing',
        priority: 'high',
        title: 'Consider promotional pricing',
        description: 'Occupancy is below 60%. Consider offering discounts during off-peak hours.',
        expectedImpact: 'Increase occupancy by 15-20%'
      });
    }
    
    // Analyze cancellations
    const cancellations = await this.getCancellationAnalysis(facilityId, date);
    if (cancellations.rate > 0.15) {
      recommendations.push({
        type: 'policy',
        priority: 'medium',
        title: 'Review cancellation policy',
        description: 'Cancellation rate exceeds 15%. Consider implementing deposit requirements.',
        expectedImpact: 'Reduce cancellations by 30%'
      });
    }
    
    return recommendations;
  }
}
```

---

## Phase 4: Frontend Development (Weeks 13-16)

### Week 13: Customer Booking Interface

```typescript
// frontend/booking-app/app/booking/page.tsx
'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { SimulatorCard } from '@/components/SimulatorCard';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { BookingSummary } from '@/components/BookingSummary';
import { useBookingStore } from '@/store/booking';

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const { booking, setDate, setSimulator, setTimeSlot } = useBookingStore();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['Date', 'Simulator', 'Time', 'Confirm'].map((label, index) => (
              <div
                key={label}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`rounded-full h-10 w-10 flex items-center justify-center ${
                    step > index
                      ? 'bg-green-500 text-white'
                      : step === index + 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300'
                  }`}
                >
                  {step > index ? '✓' : index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > index + 1 ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Step content */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Select Date</h2>
            <Calendar
              mode="single"
              selected={booking.date}
              onSelect={(date) => {
                setDate(date);
                setStep(2);
              }}
              disabled={(date) =>
                date < new Date() || date > addDays(new Date(), 30)
              }
              className="rounded-md border"
            />
          </div>
        )}
        
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Choose Simulator</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {simulators.map((simulator) => (
                <SimulatorCard
                  key={simulator.id}
                  simulator={simulator}
                  onSelect={() => {
                    setSimulator(simulator);
                    setStep(3);
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Select Time</h2>
            <TimeSlotPicker
              date={booking.date}
              simulator={booking.simulator}
              onSelect={(slot) => {
                setTimeSlot(slot);
                setStep(4);
              }}
            />
          </div>
        )}
        
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Confirm Booking</h2>
            <BookingSummary
              booking={booking}
              onConfirm={handleBookingConfirm}
              onEdit={(step) => setStep(step)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

### Week 14: Admin Dashboard

```typescript
// frontend/admin-dashboard/app/dashboard/page.tsx
import { Suspense } from 'react';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { UpcomingBookings } from '@/components/dashboard/UpcomingBookings';
import { SimulatorStatus } from '@/components/dashboard/SimulatorStatus';

export default async function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Key metrics */}
      <Suspense fallback={<div>Loading stats...</div>}>
        <StatsCards />
      </Suspense>
      
      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={<div>Loading occupancy...</div>}>
          <OccupancyChart />
        </Suspense>
        
        <Suspense fallback={<div>Loading revenue...</div>}>
          <RevenueChart />
        </Suspense>
      </div>
      
      {/* Live status */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={<div>Loading bookings...</div>}>
          <UpcomingBookings />
        </Suspense>
        
        <Suspense fallback={<div>Loading simulator status...</div>}>
          <SimulatorStatus />
        </Suspense>
      </div>
    </div>
  );
}
```

### Week 15: Mobile PWA

```typescript
// frontend/booking-app/app/manifest.ts
export default function manifest() {
  return {
    name: 'ClubHouse Booking',
    short_name: 'ClubHouse',
    description: 'Book your golf simulator session',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

// Service worker for offline support
// frontend/booking-app/public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/booking',
        '/my-bookings',
        '/offline.html',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch(() => {
      return caches.match('/offline.html');
    })
  );
});
```

### Week 16: Kiosk Interface

```typescript
// frontend/kiosk-app/app/checkin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { QrScanner } from '@/components/QrScanner';
import { PinPad } from '@/components/PinPad';
import { CheckInSuccess } from '@/components/CheckInSuccess';

export default function KioskCheckIn() {
  const [mode, setMode] = useState<'qr' | 'pin'>('qr');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  
  // Reset after successful check-in
  useEffect(() => {
    if (isCheckedIn) {
      const timer = setTimeout(() => {
        setIsCheckedIn(false);
      }, 10000); // Reset after 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isCheckedIn]);
  
  const handleCheckIn = async (code: string) => {
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, method: mode }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Trigger door unlock
        await unlockDoor(data.booking.simulator.unifiDoorId);
        setIsCheckedIn(true);
      } else {
        // Show error message
        toast.error('Invalid code or booking not found');
      }
    } catch (error) {
      toast.error('Check-in failed. Please try again.');
    }
  };
  
  if (isCheckedIn) {
    return <CheckInSuccess />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to ClubHouse
        </h1>
        
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setMode('qr')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              mode === 'qr'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Scan QR Code
          </button>
          <button
            onClick={() => setMode('pin')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              mode === 'pin'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Enter PIN
          </button>
        </div>
        
        {mode === 'qr' ? (
          <QrScanner onScan={handleCheckIn} />
        ) : (
          <PinPad onSubmit={handleCheckIn} />
        )}
      </div>
    </div>
  );
}
```

---

## Phase 5: Production & Deployment (Weeks 17-20)

### Week 17: Testing & Quality Assurance

```typescript
// Testing strategy
describe('Booking Platform E2E Tests', () => {
  test('Complete booking flow', async () => {
    // 1. User lands on booking page
    await page.goto('/booking');
    
    // 2. Select date
    await page.click('[data-date="2025-08-10"]');
    
    // 3. Choose simulator
    await page.click('[data-simulator="trackman-1"]');
    
    // 4. Select time slot
    await page.click('[data-timeslot="14:00"]');
    
    // 5. Enter customer details
    await page.fill('#email', 'test@example.com');
    await page.fill('#firstName', 'John');
    await page.fill('#lastName', 'Doe');
    await page.fill('#phone', '+1234567890');
    
    // 6. Confirm booking
    await page.click('#confirm-booking');
    
    // 7. Verify success
    await expect(page).toHaveURL(/\/booking\/success/);
    await expect(page.locator('.booking-code')).toBeVisible();
  });
  
  test('Access control integration', async () => {
    // Create booking
    const booking = await createTestBooking();
    
    // Simulate check-in
    const checkInResponse = await api.post('/checkin', {
      code: booking.accessCode
    });
    
    expect(checkInResponse.status).toBe(200);
    
    // Verify door unlock was triggered
    const doorLogs = await unifi.getAccessLogs(booking.simulator.doorId);
    expect(doorLogs).toContainEqual(
      expect.objectContaining({
        event: 'door_unlock',
        bookingId: booking.id
      })
    );
  });
});
```

### Week 18: Performance Optimization

```typescript
// Caching strategy implementation
import { Redis } from 'ioredis';
import { LRUCache } from 'lru-cache';

class CacheManager {
  private redis: Redis;
  private memoryCache: LRUCache<string, any>;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.memoryCache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 5 // 5 minutes
    });
  }
  
  async get(key: string): Promise<any> {
    // Check memory cache first
    const memResult = this.memoryCache.get(key);
    if (memResult) return memResult;
    
    // Check Redis
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const parsed = JSON.parse(redisResult);
      this.memoryCache.set(key, parsed);
      return parsed;
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    
    // Set in both caches
    this.memoryCache.set(key, value);
    
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.match(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear from Redis
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Database query optimization
class OptimizedBookingRepository {
  async getAvailableSlots(simulatorId: string, date: Date): Promise<TimeSlot[]> {
    // Use materialized view for fast availability queries
    const query = `
      SELECT 
        time_slot,
        available
      FROM availability_matrix
      WHERE simulator_id = $1
        AND date = $2::date
        AND available = true
      ORDER BY time_slot
    `;
    
    const result = await db.query(query, [simulatorId, date]);
    return result.rows;
  }
  
  async createBookingWithOptimisticLocking(data: CreateBookingDto): Promise<Booking> {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Check availability with row lock
      const availCheck = await client.query(`
        SELECT available
        FROM availability_matrix
        WHERE simulator_id = $1
          AND date = $2::date
          AND time_slot = $3
        FOR UPDATE
      `, [data.simulatorId, data.date, data.timeSlot]);
      
      if (!availCheck.rows[0]?.available) {
        throw new ConflictError('Time slot no longer available');
      }
      
      // Create booking
      const booking = await client.query(`
        INSERT INTO bookings (...)
        VALUES (...)
        RETURNING *
      `, [...values]);
      
      // Update availability
      await client.query(`
        UPDATE availability_matrix
        SET available = false
        WHERE simulator_id = $1
          AND date = $2::date
          AND time_slot = $3
      `, [data.simulatorId, data.date, data.timeSlot]);
      
      await client.query('COMMIT');
      return booking.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

### Week 19: Security Hardening

```typescript
// Security middleware implementation
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { sanitize } from 'express-mongo-sanitize';

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting by endpoint
const createAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many accounts created from this IP'
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 bookings per minute
  keyGenerator: (req) => req.user?.id || req.ip
});

// Input sanitization
app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
});

// JWT security
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { 
      expiresIn: '15m',
      issuer: 'clubos-booking',
      audience: 'clubos-api'
    }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'clubos-booking'
    }
  );
  
  return { accessToken, refreshToken };
};
```

### Week 20: Deployment & Monitoring

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api-gateway
      - booking-app
      - admin-dashboard

  api-gateway:
    build: ./apps/api
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G

  booking-service:
    build: ./apps/booking-service
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  # Frontend services
  booking-app:
    build: ./frontend/booking-app
    environment:
      - NEXT_PUBLIC_API_URL=https://api.clubos.com
    deploy:
      replicas: 2

  # Monitoring
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  prometheus_data:
  grafana_data:
```

```typescript
// Monitoring setup
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Metrics
const bookingCounter = new Counter({
  name: 'bookings_total',
  help: 'Total number of bookings',
  labelNames: ['status', 'simulator']
});

const bookingDuration = new Histogram({
  name: 'booking_duration_seconds',
  help: 'Time to complete booking',
  buckets: [0.1, 0.5, 1, 2, 5]
});

const activeBookings = new Gauge({
  name: 'active_bookings',
  help: 'Number of active bookings',
  labelNames: ['simulator']
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      integrations: {
        hubspot: await checkHubSpot(),
        unifi: await checkUniFi(),
        ninjaone: await checkNinjaOne()
      }
    }
  };
  
  const allHealthy = Object.values(checks.checks).every(v => v === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json(checks);
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

---

## Launch Checklist

### Pre-Launch (1 week before)
- [ ] Load testing completed (1000+ concurrent users)
- [ ] Security audit passed
- [ ] Disaster recovery tested
- [ ] Staff training completed
- [ ] Documentation finalized
- [ ] Monitoring dashboards configured
- [ ] Backup procedures verified
- [ ] SSL certificates installed
- [ ] DNS configured

### Launch Day
- [ ] Database migrations executed
- [ ] Services deployed in sequence
- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Support team ready
- [ ] Communication plan executed
- [ ] Rollback plan ready

### Post-Launch (First week)
- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Gather user feedback
- [ ] Address critical issues
- [ ] Plan first iteration
- [ ] Celebrate success! 🎉

---

*This implementation guide provides a practical roadmap for building a world-class booking platform integrated with ClubOS V3.*