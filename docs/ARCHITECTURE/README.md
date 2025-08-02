# ClubOS V3 Architecture

## Overview
ClubOS V3 is an AI-powered customer service system built with a modular, event-driven architecture.

## Core Components

### 1. Message Processing Pipeline
- **Intent Classification**: Uses GPT-4 to classify incoming messages
- **SOP Matching**: Matches intents to Standard Operating Procedures
- **Action Execution**: Executes automated actions based on SOPs

### 2. Backend Architecture
- **Framework**: Node.js + Express
- **Database**: PostgreSQL with migration system
- **Authentication**: JWT-based
- **APIs**: RESTful with OpenAPI documentation

### 3. Frontend Architecture
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **UI Components**: Headless UI + Custom components

### 4. AI Integration
- **OpenAI GPT-4**: Intent classification
- **Anthropic Claude**: SOP learning and optimization (planned)

### 5. External Integrations
- **Slack**: Notifications and alerts
- **OpenPhone**: SMS/Call management (planned)
- **NinjaOne**: Device management (planned)
- **Ubiquiti**: Network control (planned)

## Data Flow

```
Customer Message → Intent Classification → SOP Matching → Action Execution → Response
                                        ↓
                                  Human Escalation (if needed)
```

## Security Architecture
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based (admin, operator, viewer)
- **API Security**: Rate limiting, CORS, Helmet.js
- **Data Protection**: Parameterized queries, input validation

## Deployment Architecture
- **Backend**: Railway (containerized)
- **Frontend**: Vercel (serverless)
- **Database**: Railway PostgreSQL
- **Monitoring**: Sentry (planned)

## Scalability Considerations
- Stateless API design
- Database connection pooling
- Caching strategy (Redis planned)
- Horizontal scaling ready

For detailed technical specifications, see `/docs/planning/` directory.