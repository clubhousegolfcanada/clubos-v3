# ClubOS V2 System Requirements Checklist

## Before Running the Autonomous Build

### 1. External Services Setup
- [ ] OpenAI Account
  - [ ] API key with GPT-4o access
  - [ ] 4 Assistant IDs from V1 (or plan to create new)
  - [ ] Organization ID

- [ ] Anthropic Account  
  - [ ] API key for Claude
  
- [ ] PostgreSQL Database
  - [ ] Railway project created (or local)
  - [ ] Connection string ready
  
- [ ] OpenPhone
  - [ ] API credentials
  - [ ] Webhook URL planned
  - [ ] Default phone number
  
- [ ] Slack
  - [ ] App created
  - [ ] Bot token
  - [ ] Webhook URL
  
- [ ] NinjaOne
  - [ ] Client ID/Secret
  - [ ] API endpoint configured

- [ ] Google Drive
  - [ ] API key (if using)
  - [ ] Folder ID for syncing

### 2. Local Environment
- [ ] Node.js 18+ installed
- [ ] Git initialized
- [ ] `.env` file created from template

### 3. Architecture Decisions
- [ ] Confirm: GPT-4o for routing, Claude for improvements
- [ ] Confirm: PostgreSQL for all data
- [ ] Confirm: Railway + Vercel deployment
- [ ] Confirm: Google Drive for SOP storage

### 4. Data Migration Plan
- [ ] Export V1 assistants configuration
- [ ] Export V1 database schema
- [ ] Export V1 conversation logs
- [ ] Backup all V1 data

### 5. Folder Structure Ready
```
CLUBOSV2/
├── Core/          (routing engine)
├── UI/            (web interface)
├── LLM/           (AI connections)
├── API/           (endpoints)
├── DB/            (schemas/migrations)
├── Logs/          (system logs)
├── Scripts/       (utilities)
├── Notes/         (documentation)
├── Public/        (static assets)
└── Assistants/    (GPT configs)
```

### 6. Critical Questions
- [ ] Keep V1 running during V2 build? (recommended: yes)
- [ ] Test environment separate from production?
- [ ] Gradual migration or hard cutover?

### 7. Success Metrics
- [ ] Define: What makes V2 "ready"?
- [ ] Define: Rollback criteria
- [ ] Define: Performance benchmarks

## Ready to Launch?

Once all items checked:
```bash
cd /CLUBOSV2
chmod +x v2-pre-launch-checklist.sh
./v2-pre-launch-checklist.sh
```

Then:
```bash
./run_clubos_plan.sh
```

Claude will take over from there!