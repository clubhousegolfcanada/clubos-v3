# ClubOS V3 Structural Improvements

## 🎯 Overview

This document outlines the foundational improvements made to minimize debugging issues and ensure consistent deployments.

## 🔧 Key Improvements

### 1. **Automated Setup Script** (`scripts/setup.sh`)
- Validates prerequisites (Node.js, PostgreSQL)
- Creates and validates environment files
- Runs database migrations automatically
- Optional seed data and admin user creation
- Single command: `npm run setup`

### 2. **Environment Validation** (`scripts/validate-env.js`)
- Checks all required environment variables
- Validates format (e.g., PostgreSQL URLs, API keys)
- Warns about default/placeholder values
- Run with: `npm run validate-env`

### 3. **Database Migrations with Rollback** (`src/db/migrationRunner.js`)
- Tracks migration history with checksums
- Prevents modified migrations from running
- Supports rollback with `.down.sql` files
- Commands:
  ```bash
  npm run migrate:up      # Run pending migrations
  npm run migrate:down    # Rollback last migration
  npm run migrate:status  # Show migration status
  ```

### 4. **Comprehensive Error Logging** (`src/middleware/errorLogger.js`)
- Captures full error context with correlation IDs
- Sanitizes sensitive data (passwords, tokens)
- Writes to timestamped log files
- Custom error classes for proper status codes
- Development vs production error responses

### 5. **Request/Response Logging** (`src/middleware/requestLogger.js`)
- Tracks all API requests with timing
- Highlights slow requests (>1s)
- Correlation ID tracking across requests
- Pretty console output in development
- Structured JSON logs in production

### 6. **Git Commit & Deploy Script** (`scripts/deploy.sh`)
- Runs all tests before deployment
- Standardized commit messages with co-author
- Automated push to GitHub
- Railway deployment integration
- Post-deployment health checks
- Single command: `npm run deploy`

### 7. **Health Check Endpoints** (`src/routes/health.js`)
- `/health` - Basic status check
- `/health/detailed` - Full system diagnostics
- `/health/database` - Database-specific checks
- `/health/dependencies` - External service checks
- `/health/ready` - Kubernetes readiness probe

### 8. **Configuration Management** (`src/config/index.js`)
- Environment-specific configurations
- Deep merge of base + environment configs
- Validation of required settings
- Mock services for development
- Production security settings

## 📋 Deployment Checklist

1. **First Time Setup**:
   ```bash
   npm run setup
   ```

2. **Before Each Deploy**:
   ```bash
   npm run validate-env
   npm run migrate:status
   npm test
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Verify Deployment**:
   ```bash
   npm run health-check
   ```

## 🐛 Debugging Tools

### View Logs
```bash
# Error logs
npm run logs:errors

# All logs for today
ls -la logs/

# Search logs for correlation ID
grep "correlation-id-here" logs/*.log
```

### Database Inspection
```bash
# Check migration status
npm run migrate:status

# Connect to database
psql $DATABASE_URL

# Common queries
SELECT * FROM migrations ORDER BY executed_at DESC;
SELECT * FROM action_log WHERE outcome = 'failed' ORDER BY timestamp DESC LIMIT 10;
SELECT * FROM input_event WHERE source = 'ninjaone' ORDER BY received_at DESC;
```

### Health Monitoring
```bash
# Quick health check
curl localhost:3001/health

# Detailed diagnostics
curl localhost:3001/health/detailed | jq

# Check specific service
curl localhost:3001/health/database | jq
```

## 🚨 Common Issues & Solutions

### Issue: "Environment validation failed"
**Solution**: Check `.env` file has all required variables:
```bash
npm run validate-env
```

### Issue: "Migration checksum mismatch"
**Solution**: Never modify existing migrations. Create a new one:
```bash
# Create new migration file
touch src/db/migrations/003_your_change.sql
touch src/db/migrations/003_your_change.down.sql
```

### Issue: "Port already in use"
**Solution**: Find and kill the process:
```bash
lsof -i :3001
kill -9 <PID>
```

### Issue: "Database connection failed"
**Solution**: Verify PostgreSQL is running and URL is correct:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

## 🔒 Security Considerations

1. **Sensitive Data**: All passwords, tokens, and API keys are redacted in logs
2. **Error Details**: Stack traces only shown in development
3. **Rate Limiting**: Configured per environment
4. **CORS**: Restricted to configured origins
5. **Input Validation**: JSON schema validation on all inputs

## 📊 Monitoring

The system now provides comprehensive monitoring through:
- Correlation IDs for request tracing
- Slow request detection
- Error rate tracking
- Service dependency health checks
- Database pool statistics

## 🚀 Best Practices

1. **Always run setup after cloning**:
   ```bash
   git clone <repo>
   cd clubos-v3-backend
   npm run setup
   ```

2. **Use the deploy script for consistency**:
   ```bash
   npm run deploy  # Handles tests, commits, and deployment
   ```

3. **Check health after deployment**:
   ```bash
   npm run health-check
   ```

4. **Monitor logs in production**:
   - Set up log aggregation (e.g., Datadog, LogDNA)
   - Alert on error rate spikes
   - Track slow request patterns

5. **Database changes**:
   - Always create `.down.sql` files
   - Test rollbacks locally first
   - Never modify existing migrations

These improvements ensure consistent environments, easier debugging, and reliable deployments across all team members and environments.