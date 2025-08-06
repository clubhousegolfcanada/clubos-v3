# ClubOS V3 Operations Manual

**Purpose:** Day-to-day operational procedures for ClubOS V3  
**Audience:** System Operators, Support Staff, Technical Team  
**Last Updated:** August 2, 2025

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [User Management](#user-management)
3. [SOP Management](#sop-management)
4. [Message Handling](#message-handling)
5. [System Monitoring](#system-monitoring)
6. [Incident Response](#incident-response)
7. [Maintenance Procedures](#maintenance-procedures)
8. [Reporting](#reporting)

---

## Daily Operations

### Morning Checklist (9:00 AM)

1. **System Health Check**
   ```bash
   # Check backend health
   curl https://api.clubos.com/health
   
   # Check frontend status
   curl https://app.clubos.com/api/health
   ```

2. **Review Overnight Activity**
   - Check Slack for any alerts
   - Review error logs from past 12 hours
   - Check escalated threads count
   - Verify all integrations are connected

3. **Database Metrics**
   ```sql
   -- Check thread volume
   SELECT COUNT(*) as thread_count,
          AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/60) as avg_resolution_minutes
   FROM threads 
   WHERE created_at > NOW() - INTERVAL '24 hours';
   
   -- Check SOP performance
   SELECT s.title, COUNT(ae.id) as uses, 
          AVG(CASE WHEN ae.success THEN 1 ELSE 0 END) as success_rate
   FROM sops s
   JOIN action_executions ae ON s.id = ae.sop_id
   WHERE ae.created_at > NOW() - INTERVAL '24 hours'
   GROUP BY s.id
   ORDER BY uses DESC;
   ```

### Shift Handover Procedure

1. **Document Active Issues**
   ```markdown
   ## Shift Handover - [Date] [Time]
   
   ### Active Escalations
   - Thread #123: Customer refund issue - awaiting manager approval
   - Thread #456: Technical problem - NinjaOne ticket created
   
   ### System Status
   - All systems operational
   - API response time: 145ms average
   - No planned maintenance
   
   ### Notes for Next Shift
   - Monitor customer John Doe - multiple password resets
   - Bedford location reporting intermittent network issues
   ```

2. **Update Team Channel**
   - Post handover notes in #clubos-operations
   - Tag incoming operator
   - Ensure all passwords/access transferred

---

## User Management

### Creating New Operator Account

1. **Access Admin Panel**
   ```
   Navigate to: https://app.clubos.com/admin/users
   ```

2. **Create User**
   ```json
   {
     "email": "newoperator@clubhouse.com",
     "name": "Operator Name",
     "role": "operator",
     "facilities": ["bedford", "toronto"],
     "permissions": ["view_threads", "send_messages", "execute_actions"]
   }
   ```

3. **First Login Setup**
   - Send temporary password via secure channel
   - Require password change on first login
   - Verify 2FA enrollment (when implemented)

### Permission Levels

| Role | View Threads | Send Messages | Execute Actions | Manage SOPs | Admin Panel |
|------|--------------|---------------|-----------------|-------------|-------------|
| Viewer | ✅ | ❌ | ❌ | ❌ | ❌ |
| Operator | ✅ | ✅ | ✅ | ❌ | ❌ |
| Supervisor | ✅ | ✅ | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |

### Deactivating User

```bash
# Via API
curl -X PATCH https://api.clubos.com/api/users/123 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

---

## SOP Management

### Adding New SOP

1. **Navigate to SOP Management**
   ```
   https://app.clubos.com/admin/sops
   ```

2. **Create SOP Structure**
   ```json
   {
     "title": "TrackMan Bay Reset Procedure",
     "intent_category": "technical_support",
     "keywords": ["trackman", "reset", "frozen", "not working"],
     "steps": [
       {
         "order": 1,
         "description": "Confirm customer's bay number",
         "action": "request_info"
       },
       {
         "order": 2,
         "description": "Initiate remote reset",
         "action": "execute_reset"
       },
       {
         "order": 3,
         "description": "Confirm functionality",
         "action": "confirm_success"
       }
     ],
     "estimated_time_saved": 15,
     "auto_execute": false
   }
   ```

3. **Test SOP**
   - Create test thread with matching intent
   - Verify SOP is matched correctly
   - Execute actions in test environment
   - Confirm expected outcome

### Updating Existing SOP

1. **Review Performance Metrics**
   ```sql
   SELECT * FROM sop_effectiveness 
   WHERE id = [SOP_ID] 
   AND last_used > NOW() - INTERVAL '7 days';
   ```

2. **Edit SOP**
   - Click "Edit" on SOP card
   - Update steps/actions as needed
   - Add version note explaining changes
   - Save and test

3. **Monitor After Update**
   - Track success rate for 24 hours
   - Review operator feedback
   - Rollback if issues arise

### Disabling Problematic SOP

```bash
# Quick disable via API
curl -X PATCH https://api.clubos.com/api/sops/123 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"enabled": false, "disable_reason": "High failure rate reported"}'
```

---

## Message Handling

### Standard Message Flow

1. **Customer Message Received**
   - System creates/updates thread
   - Intent classification runs
   - SOP matching attempted

2. **Automated Response**
   ```
   IF sop_matched AND confidence > 0.8:
     Execute SOP actions
     Send automated response
   ELSE:
     Flag for manual review
     Notify operator
   ```

3. **Manual Intervention**
   - Operator reviews flagged threads
   - Can override AI classification
   - Executes appropriate actions
   - Marks thread resolved

### Escalation Procedures

#### Level 1: Operator Escalation
- Complex issues beyond SOPs
- Customer requests human assistance
- Multiple failed resolution attempts

**Action**: Assign to senior operator

#### Level 2: Supervisor Escalation
- VIP customer issues
- Potential legal/compliance matters
- System-wide problems

**Action**: Notify supervisor via Slack

#### Level 3: Management Escalation
- Major service disruption
- Security incidents
- Media/PR concerns

**Action**: Call management directly

### Common Message Scenarios

#### Password Reset Request
```
Customer: "I forgot my TrackMan password"
System: Classifies as 'password_reset'
Action: Send reset link to registered email
Response: "I've sent a password reset link to your email."
```

#### Booking Modification
```
Customer: "Need to change my booking from 3pm to 5pm"
System: Classifies as 'booking_modification'
Action: Check availability, modify booking
Response: "I've updated your booking to 5:00 PM today."
```

#### Refund Request
```
Customer: "My session was cut short, I want a refund"
System: Classifies as 'refund_request'
Action: Flag for human review
Response: "I understand your concern. An operator will review your refund request shortly."
```

---

## System Monitoring

### Real-Time Monitoring

1. **Dashboard URLs**
   - System Status: https://app.clubos.com/admin/dashboard
   - Railway Metrics: https://railway.app/project/[id]/metrics
   - Vercel Analytics: https://vercel.com/[team]/[project]/analytics

2. **Key Metrics to Watch**
   - API response time (target: <200ms)
   - Message processing time (target: <3s)
   - SOP match rate (target: >80%)
   - Error rate (target: <1%)

3. **Alert Thresholds**
   ```yaml
   alerts:
     - name: high_error_rate
       condition: error_rate > 5%
       duration: 5 minutes
       action: slack_notification
       
     - name: slow_response
       condition: response_time > 1000ms
       duration: 10 minutes
       action: email_alert
       
     - name: database_connection_pool
       condition: active_connections > 18
       duration: 2 minutes
       action: auto_scale
   ```

### Log Analysis

#### Viewing Logs
```bash
# Backend logs
railway logs --service backend --tail 100

# Frontend logs
vercel logs --project clubos-frontend

# Filter for errors
railway logs --service backend | grep ERROR

# Search specific thread
railway logs --service backend | grep "thread_id=123"
```

#### Common Log Patterns
```
# Successful message processing
INFO: Message processed threadId=123 intent=password_reset confidence=0.95 duration=1250ms

# Failed SOP execution
ERROR: Action execution failed threadId=456 action=send_email error="SMTP timeout"

# Rate limit hit
WARN: Rate limit exceeded ip=1.2.3.4 endpoint=/api/messages
```

---

## Incident Response

### Incident Classification

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| P1 - Critical | Complete service outage | 15 minutes | Database down, API offline |
| P2 - High | Major feature broken | 1 hour | Cannot process messages, Auth broken |
| P3 - Medium | Partial degradation | 4 hours | Slow responses, Some SOPs failing |
| P4 - Low | Minor issues | Next business day | UI glitches, Non-critical errors |

### Incident Response Procedure

1. **Identify & Classify**
   - Determine severity level
   - Document initial symptoms
   - Check monitoring dashboards

2. **Notify**
   ```bash
   # P1/P2 Incidents
   - Post in #incident-response
   - Page on-call engineer
   - Update status page
   
   # P3/P4 Incidents
   - Post in #clubos-operations
   - Create tracking ticket
   ```

3. **Investigate**
   - Check recent deployments
   - Review error logs
   - Test affected functionality
   - Identify root cause

4. **Mitigate**
   - Apply immediate fix
   - Or rollback if needed
   - Verify resolution
   - Monitor for recurrence

5. **Document**
   ```markdown
   ## Incident Report - [INC-001]
   
   **Date**: 2025-08-02
   **Severity**: P2
   **Duration**: 45 minutes
   
   ### Summary
   Message processing failing due to OpenAI API timeout
   
   ### Timeline
   - 14:30 - First error detected
   - 14:35 - Incident declared
   - 14:45 - Root cause identified
   - 15:00 - Fix applied
   - 15:15 - Incident resolved
   
   ### Root Cause
   OpenAI API rate limit exceeded
   
   ### Resolution
   Implemented request queuing and retry logic
   
   ### Action Items
   - [ ] Add rate limit monitoring
   - [ ] Implement fallback to Claude
   - [ ] Update runbook
   ```

---

## Maintenance Procedures

### Routine Maintenance

#### Daily
- Clear old session data
- Rotate logs
- Check disk usage

#### Weekly
```bash
# Database maintenance
railway run npm run db:vacuum

# Cache cleanup
railway run npm run cache:clear

# Update SOP success rates
railway run npm run sops:update-metrics
```

#### Monthly
- Review and archive old threads
- Update API keys if needed
- Security patches
- Performance analysis

### Database Maintenance

```sql
-- Archive old threads (>90 days)
INSERT INTO threads_archive 
SELECT * FROM threads 
WHERE resolved_at < NOW() - INTERVAL '90 days';

DELETE FROM threads 
WHERE resolved_at < NOW() - INTERVAL '90 days';

-- Vacuum and analyze
VACUUM ANALYZE threads;
VACUUM ANALYZE messages;
VACUUM ANALYZE action_executions;

-- Update statistics
ANALYZE;
```

### Cache Management

```javascript
// Clear decision cache
await redis.flushdb();

// Clear specific patterns
await redis.del('cache:sop:*');
await redis.del('cache:intent:*');

// View cache stats
const info = await redis.info('stats');
console.log(info);
```

---

## Reporting

### Daily Reports

```sql
-- Daily summary
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_threads,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  COUNT(CASE WHEN status = 'escalated' THEN 1 END) as escalated,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/60) as avg_resolution_min
FROM threads
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE(created_at);

-- Top issues
SELECT 
  intent,
  COUNT(*) as occurrences
FROM threads
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY intent
ORDER BY occurrences DESC
LIMIT 10;
```

### Weekly Reports

1. **Performance Metrics**
   - Total messages processed
   - Average response time
   - SOP effectiveness rates
   - Escalation trends

2. **Operator Metrics**
   - Messages handled per operator
   - Average resolution time
   - Customer satisfaction (when implemented)

3. **System Health**
   - Uptime percentage
   - Error rates
   - API performance
   - Database growth

### Monthly Executive Summary

```markdown
## ClubOS Monthly Report - [Month Year]

### Key Metrics
- Messages Processed: 12,450 (+15% MoM)
- Automation Rate: 78% (target: 75%)
- Avg Resolution Time: 3.2 minutes (-18% MoM)
- System Uptime: 99.94%

### Highlights
- Implemented new refund SOP, saving 20 hours/month
- Reduced password reset time by 50%
- Zero P1 incidents

### Challenges
- Bedford location network issues causing delays
- Increased refund requests during tournament season

### Recommendations
- Add capacity for peak tournament times
- Implement Claude as fallback for OpenAI
- Enhanced monitoring for network issues
```

---

## Quick Reference

### Common Commands

```bash
# Check system status
curl https://api.clubos.com/health

# View recent errors
railway logs --service backend | grep ERROR | tail -20

# Find specific thread
railway run npm run db:console
> SELECT * FROM threads WHERE id = 123;

# Disable problematic SOP
curl -X PATCH https://api.clubos.com/api/sops/123 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"enabled": false}'

# Force cache clear
railway run npm run cache:clear
```

### Emergency Contacts

- **On-Call Engineer**: Check #on-call-schedule
- **Railway Support**: support@railway.app
- **Database Admin**: dba@clubhouse.com
- **Management Escalation**: [In password manager]

---

*This operations manual should be updated whenever procedures change or new patterns emerge.*