# Changelog

All notable changes to ClubOS V3 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2025-08-02

### Added
- **GitHub Repository** - Code now hosted at https://github.com/clubhousegolfcanada/clubos-v3
- **CI/CD Pipeline** - GitHub Actions workflows for automated testing and deployment
- **Security Scanning** - Automated vulnerability scanning with CodeQL and dependency checks
- **Backend Service Tests** - Added unit tests for actionExecutor and notifications services
- **Test Coverage** - Backend now at 95.9% test coverage (exceeding 80% target)
- **Documentation** - GitHub secrets setup guide for deployment configuration

### Changed
- **Next.js Security Update** - Upgraded from 14.0.4 to 14.2.31 to fix critical vulnerabilities
- **Production Readiness** - Multiple infrastructure improvements for deployment

### Fixed
- **Security Vulnerabilities** - Resolved 1 critical severity vulnerability in Next.js

## [0.1.0] - 2024-01-31

### Added

#### Core Message Loop
- **Message Processing** - POST /api/messages endpoint that classifies intent using OpenAI GPT-4
- **Intent Classification** - Automatic categorization into tech_issue, booking, access, or faq
- **Thread Management** - Database tracking of all customer conversations with status updates
- **SOP Matching** - Keyword-based matching of messages to Standard Operating Procedures

#### Action Execution
- **Action Framework** - Modular action execution system with logging
- **Reset TrackMan** - Mocked implementation with 90% success rate simulation
- **Unlock Door** - Access control with booking validation
- **Slack Escalation** - Webhook integration for human handoff
- **Message Sending** - Placeholder for OpenPhone integration

#### Database
- **Complete Schema** - 8 tables supporting the full V3 vision
- **Migration System** - Automated database setup
- **Seed Data** - 7 starter SOPs for common scenarios

#### API Endpoints
- `POST /api/messages` - Process incoming messages
- `GET /api/threads` - List conversation threads
- `GET /api/threads/:id` - Thread details
- `POST /api/actions` - Execute actions
- `GET /api/actions/:thread_id` - Action history
- `GET /api/sops` - List SOPs with filtering
- `POST /api/sops` - Create new SOPs
- `GET /health` - Health check

#### Frontend Skeleton
- Next.js 14 with TypeScript
- Mobile-first responsive design
- Thread list and detail views
- Action buttons for operators
- Ticket creation flow
- Admin SOP management page

### Infrastructure
- Railway deployment configuration
- Vercel deployment configuration
- Environment variable templates
- Health check endpoints
- JWT authentication setup

## [Unreleased]

### Planned
- Claude SOP ingestion endpoint
- Claude merge suggestion system
- Learning event tracking
- Feedback dashboard
- System status monitoring
- Real NinjaOne integration
- Real Ubiquiti integration
- OpenPhone messaging
- Dark mode UI
- PWA support