# ClubOS V3

AI-powered customer service system for The Clubhouse.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

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

**Note**: Tests run automatically before build/deploy to ensure code quality. See [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) for details.

## 🤖 For AI Coders
**START HERE (in order):**
1. `.ai-rules` - 6 simple execution rules (30 sec read)
2. `CURRENT_WORK.md` - What's active right now
3. `CLAUDE_MASTER_CONTEXT.md` - Project state & navigation

**Then, based on task:**
- `claude-instructions/README.md` - Decision tree for specific work
- `NEW_CONTEXT_QUICKSTART.md` - If you're lost

**Automatic Patterns:**
- `NAMING_CONVENTIONS.md` - Never ask about naming
- `AUTOMATIC_ASSUMPTIONS.md` - Things to assume

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
- Message classification (GPT-4)
- SOP matching and execution
- Action framework with retries
- Thread management
- Claude integration (in progress)

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

## 📈 Version
Current: **0.4.0** (See [CHANGELOG.md](./CHANGELOG.md))

---
*For detailed setup and contribution guidelines, see /docs*