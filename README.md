# ClubOS V3

AI-powered customer service system for The Clubhouse.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys and database URL

# Run database migrations
npm run migrate

# Run development
npm run dev

# Run tests (required before build/deploy)
npm test
```

## 🧪 Testing & Quality

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only changed tests
npm run test:changed

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

**Current Status**: 
- ✅ Backend: 95.9% test coverage
- ⏳ Frontend: Testing setup pending

**Note**: Tests run automatically before commits (Husky) and deploys (GitHub Actions).

## 🤖 For AI Assistants
**START HERE:**
1. `AI_CONTEXT.md` - Everything you need to know (consolidated guide)
2. `CURRENT_WORK.md` - What's active right now
3. `CONTRIBUTING.md` - Coding standards and conventions

**For specific tasks:**
- `/claude-instructions/` - Task-specific guidance
- `ACTION_FRAMEWORK_GUIDE.md` - Device control documentation

## 📁 Project Structure
```
/CLUBOSV3/
├── src/
│   ├── services/     # Business logic
│   ├── routes/       # API endpoints
│   ├── models/       # Database models
│   └── utils/        # Helpers
├── docs/             # Documentation
├── tests/            # Test files
└── migrations/       # Database migrations
```

## 🔧 Key Features
- **AI-Powered Operations**: GPT-4 message classification and intent routing
- **Pattern Learning System**: Learns from every interaction with confidence-based automation
- **Action Execution Framework**: Comprehensive device control with retry logic
  - BenQ projector control
  - NinjaOne PC/TrackMan management
  - Ubiquiti door access
  - OpenPhone SMS messaging
  - HubSpot CRM integration
  - Slack notifications
- **Knowledge Management**: Natural language updates with conflict resolution
- **SOP System**: Dynamic standard operating procedures with version control
- **Thread Management**: Conversation tracking with status updates

## 📚 Documentation
- [API Docs](./docs/API/README.md)
- [Architecture](./docs/ARCHITECTURE/)
- [Development Guide](./docs/DEVELOPMENT/)

## 🛠️ Tech Stack
- Node.js + Express
- PostgreSQL
- OpenAI GPT-4
- Next.js 14 (frontend)
- Railway + Vercel (deployment)

## 📈 Version & Status
- Current: **0.8.0** (See [CHANGELOG.md](./CHANGELOG.md))
- GitHub: https://github.com/clubhousegolfcanada/clubos-v3
- CI/CD: Ready (needs secrets configuration)
- Deployment: Pending Railway/Vercel setup

## 🚀 New Architecture Enhancements (v0.8.0)

### Performance & Reliability
- **Redis Caching**: 50-80% faster SOP matching with intelligent caching
- **Message Queues**: Async processing prevents timeouts on heavy operations
- **Structured Logging**: Complete request tracing with correlation IDs
- **Enhanced Health Checks**: `/health/detailed` for full system observability

### Monitoring
- **Queue Dashboard**: `/admin/queues` - Visual queue monitoring (dev only)
- **Cache Statistics**: Real-time hit rates and performance metrics
- **System Metrics**: CPU, memory, and request tracking

### Required Services
- Redis (optional but recommended): `brew install redis && redis-server`
- PostgreSQL (required): See deployment guide

## 🎯 Action Framework

Execute any device action through the unified framework:

```javascript
const actionFramework = require('./services/actionFramework');

// Control projector
await actionFramework.execute('projector_on', {
  location: 'bedford',
  bay_id: 'bay1'
});

// Reset TrackMan
await actionFramework.execute('reset_trackman', {
  location: 'dartmouth',
  bay_id: 'bay3'
});

// Send SMS
await actionFramework.execute('send_sms', {
  to: '+1234567890',
  message: 'Your booking is confirmed!'
});
```

See [ACTION_FRAMEWORK_GUIDE.md](./ACTION_FRAMEWORK_GUIDE.md) for full documentation.

---
*For detailed setup and contribution guidelines, see /docs*