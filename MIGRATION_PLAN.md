# ClubOS V3 Repository Split Plan
## Zero Tech Debt Migration

### Current Structure Analysis
```
CLUBOSV3/ (monorepo)
├── backend/         → Will become: clubos-v3-backend
├── frontend/        → Will become: clubos-v3-frontend
├── Root files       → Split appropriately
└── package.json     → Each gets their own
```

### Migration Steps

#### Phase 1: Backend Repository
1. Create new repo: `clubos-v3-backend`
2. Copy backend/* preserving structure
3. Add backend-specific root files:
   - README.md (backend specific)
   - .gitignore (Node.js focused)
   - .env.example
   - package.json (standalone)
   - DEPLOYMENT_GUIDE.md

#### Phase 2: Frontend Repository
1. Create new repo: `clubos-v3-frontend`
2. Copy frontend/* preserving structure
3. Add frontend-specific root files:
   - README.md (frontend specific)
   - .gitignore (Next.js focused)
   - .env.example
   - package.json (standalone)
   - vercel.json

#### Phase 3: Shared Documentation
Create `clubos-v3-docs` repo for:
- AI_CONTEXT.md
- ROADMAP_LIVE.md
- System architecture docs
- API documentation

### What Gets Removed (No Tech Debt)
- Root package.json with workspaces
- Husky from root (each repo gets its own)
- Concurrently scripts
- docker-compose.yml (unless needed)

### Environment Variables Update

#### Backend (.env)
```
DATABASE_URL=<from Railway>
REDIS_URL=<from Railway>
JWT_SECRET=<keep same>
OPENAI_API_KEY=<keep same>
NODE_ENV=production
PORT=8080
```

#### Frontend (.env)
```
NEXT_PUBLIC_API_URL=https://clubos-v3-production.up.railway.app
```

### Deployment Updates
1. Railway: Point to new backend repo
2. Vercel: Point to new frontend repo
3. Both get automatic deployments on push

### Verification Checklist
- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Railway deployment works
- [ ] Vercel deployment works
- [ ] No orphaned files
- [ ] No broken imports
- [ ] Git history preserved
- [ ] All secrets migrated

### Archive Plan
After 30 days of stable operation:
1. Archive CLUBOSV3 monorepo
2. Update all documentation
3. Update team bookmarks