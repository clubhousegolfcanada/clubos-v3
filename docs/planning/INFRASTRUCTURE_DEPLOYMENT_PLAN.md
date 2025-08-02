# ClubOS V2 Infrastructure & Deployment Plan

## New Requirements from Architecture Review

### 1. Environment Separation
```yaml
Environments:
  - Local (development)
  - Staging (testing)
  - Production (live)
```

### 2. Database Setup
```sql
-- Staging database (mirrors production)
CREATE DATABASE clubos_staging;

-- Production database
CREATE DATABASE clubos_production;

-- Each environment has full schema
```

### 3. CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/clubos-ci.yml
name: ClubOS V2 CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run TypeScript check
        run: npm run type-check
        
      - name: Run tests
        run: npm test
        
      - name: Validate database migrations
        run: npm run migrate:validate
        
      - name: Check Claude prompts
        run: npm run validate:prompts

  staging-deploy:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          # Deploy to Railway staging
          railway up -e staging
          
  production-deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          # Requires manual approval
          railway up -e production
```

### 4. Structured Feedback Pipeline

Replace JSONL with structured JSON:

```typescript
// Before: Unstructured JSONL
{"query": "...", "response": "...", "rating": 1}

// After: Structured JSON with validation
interface FeedbackData {
  id: string;
  timestamp: string;
  query: string;
  response: string;
  assistant: string;
  confidence: number;
  feedback: {
    rating: 'helpful' | 'unhelpful';
    reason?: string;
    correction?: string;
  };
  context: {
    userId: string;
    location?: string;
    sessionId: string;
  };
}
```

### 5. Configuration Management

```typescript
// config/environments.ts
export const config = {
  development: {
    database: process.env.DATABASE_URL || 'postgresql://localhost/clubos_dev',
    claudeAutoApprove: false,
    slackNotifications: false,
    apiRateLimit: 1000
  },
  staging: {
    database: process.env.STAGING_DATABASE_URL,
    claudeAutoApprove: false,
    slackNotifications: true,
    apiRateLimit: 100,
    requireApprovals: 1
  },
  production: {
    database: process.env.PRODUCTION_DATABASE_URL,
    claudeAutoApprove: false,
    slackNotifications: true,
    apiRateLimit: 50,
    requireApprovals: 2 // Two approvals for production changes
  }
};
```

### 6. Monitoring & Alerting Setup

```typescript
// monitoring/setup.ts
import * as Sentry from '@sentry/node';
import { StatsD } from 'node-statsd';

// Error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Metrics
const metrics = new StatsD({
  host: 'localhost',
  port: 8125
});

// Track routing decisions
export function trackRouting(route: string, confidence: number) {
  metrics.increment(`routing.${route}`);
  metrics.gauge('routing.confidence', confidence);
}

// Alert on failures
export function alertOnFailure(error: Error, context: any) {
  Sentry.captureException(error, { extra: context });
  
  if (error.severity === 'high') {
    // Send to Slack immediately
    sendSlackAlert({
      text: `🚨 High severity error: ${error.message}`,
      context
    });
  }
}
```

### 7. Migration Safety

```typescript
// migrations/runner.ts
export class MigrationRunner {
  async run(direction: 'up' | 'down') {
    const connection = await this.getConnection();
    
    try {
      await connection.query('BEGIN');
      
      if (direction === 'up') {
        await this.runUpMigrations(connection);
      } else {
        await this.runDownMigrations(connection);
      }
      
      await connection.query('COMMIT');
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    }
  }
  
  // Dry run for validation
  async validate() {
    const testDb = await this.createTestDatabase();
    try {
      await this.run('up');
      console.log('✅ Migrations valid');
    } finally {
      await this.dropTestDatabase(testDb);
    }
  }
}
```

### 8. Git-Based Backup for Claude Changes

```typescript
// services/claudeGitBackup.ts
export class ClaudeGitBackup {
  async backupChange(change: SOPChange) {
    // Create branch
    await git.checkout('-b', `claude-sop-${change.id}`);
    
    // Write change
    await fs.writeFile(
      `sops/${change.category}/${change.section}.md`,
      change.newContent
    );
    
    // Commit
    await git.add('.');
    await git.commit(`Claude SOP Update: ${change.summary}`);
    
    // Push for backup (not PR)
    await git.push('origin', `claude-sop-${change.id}`);
    
    // Return to main
    await git.checkout('main');
  }
}
```

## Updated Deployment Checklist

- [ ] Set up staging database
- [ ] Configure GitHub Actions
- [ ] Add environment configs
- [ ] Set up Sentry monitoring
- [ ] Create migration validation
- [ ] Test rollback procedures
- [ ] Document deployment process

This addresses the infrastructure concerns while keeping our simpler approval flow!