# ClubOS V3 Backend

Clean core backend for ClubOS V3 - AI-powered operator assistant system for golf simulator facilities.

## 🚀 Quick Start

1. Copy `.env.example` to `.env` and fill in values:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run database migrations:
   ```bash
   npm run migrate
   ```

4. Seed test SOPs (optional):
   ```bash
   psql $DATABASE_URL -f src/db/seed-sops.sql
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## 🔧 Core Features

### Message Processing
- **Intent Classification**: Uses OpenAI GPT-4 to classify messages into tech_issue, booking, access, or faq
- **SOP Matching**: Matches messages to Standard Operating Procedures using keyword matching
- **Thread Management**: Tracks conversation state and confidence scores

### Action Execution
- **reset_trackman**: Resets TrackMan equipment (mocked with 90% success rate)
- **unlock_door**: Unlocks facility door (requires active booking)
- **escalate**: Sends notification to Slack webhook
- **send_message**: Queues message for sending (placeholder)

### Logging & Auditing
- All actions logged with outcomes
- Thread status tracking (pending, in_progress, resolved, escalated, awaiting_human)
- Complete audit trail in database

## 📡 API Endpoints

### Messages
- `POST /api/messages` - Process incoming customer message
  ```json
  {
    "customer_id": "phone_number",
    "booking_id": "optional_booking_id",
    "content": "TrackMan screen is frozen"
  }
  ```

### Threads
- `GET /api/threads` - List all threads
- `GET /api/threads/:id` - Get thread details

### Actions
- `POST /api/actions` - Execute an action
  ```json
  {
    "action_type": "reset_trackman",
    "thread_id": 1,
    "sop_id": 1
  }
  ```
- `GET /api/actions/:thread_id` - Get actions for a thread

### SOPs
- `GET /api/sops` - List SOPs (with optional category filter)
- `POST /api/sops` - Create new SOP

### Other
- `POST /api/tickets` - Create support ticket
- `GET /api/tickets` - List tickets
- `POST /api/auth/login` - Operator authentication
- `POST /api/claude/ingest-sop` - Claude SOP ingestion (placeholder)
- `GET /health` - Health check endpoint

## 🗄️ Database Schema

Key tables:
- `thread` - Customer conversation threads
- `sop` - Standard Operating Procedures
- `action_log` - All executed actions
- `ticket` - Support tickets
- `operators` - System users

See `src/db/schema.sql` for complete schema.

## 🚀 Deployment

### Railway
1. Connect GitHub repository
2. Set environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `OPENAI_API_KEY` - OpenAI API key
   - `JWT_SECRET` - Authentication secret
   - `SLACK_WEBHOOK_URL` - Slack webhook for escalations
3. Deploy (migrations run automatically)

## 🧪 Testing

Test the core loop:
```bash
# 1. Send a message
curl -X POST http://localhost:3001/api/messages \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "+1234567890", "content": "TrackMan screen is frozen"}'}

# 2. Execute the matched action
curl -X POST http://localhost:3001/api/actions \
  -H "Content-Type: application/json" \
  -d '{"action_type": "reset_trackman", "thread_id": 1, "sop_id": 1}'}
```

## 📝 Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key for intent classification
- `SLACK_WEBHOOK_URL` - Slack webhook URL for escalations
- `ANTHROPIC_API_KEY` - Claude API key (future use)