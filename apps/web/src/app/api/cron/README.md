# Cron Jobs

This directory contains automated background jobs for the Americano platform.

## Weekly Pattern Analysis

**File:** `weekly-pattern-analysis/route.ts`
**Story:** 5.1 Task 10
**Schedule:** Every Sunday at 11 PM (23:00 UTC)

### Purpose

Automatically analyzes behavioral learning patterns for all users who have:
- Enabled behavioral analysis (`behavioralAnalysisEnabled = true`)
- Sufficient data (6+ weeks, 20+ sessions, 50+ reviews)
- Not been analyzed in the last 7 days

### How It Works

1. **User Selection:**
   - Queries all users with `behavioralAnalysisEnabled = true`
   - Checks `lastAnalyzedAt` timestamp
   - Skips users analyzed within last 7 days

2. **Data Sufficiency Check:**
   - Counts study sessions in last 6 weeks (minimum: 20)
   - Counts card reviews in last 6 weeks (minimum: 50)
   - Skips users with insufficient data

3. **Pattern Analysis:**
   - Triggers `BehavioralPatternEngine.runFullAnalysis(userId)`
   - Uses incremental mode (analyzes new data since `lastAnalyzedAt`)
   - Generates patterns and insights

4. **Notifications (TODO):**
   - Email: "We've discovered {count} new insights about your learning patterns"
   - In-app: Badge count on analytics nav item
   - Toast on next login

### Configuration

**Vercel Cron Schedule:**
```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-pattern-analysis",
      "schedule": "0 23 * * 0"
    }
  ]
}
```

**Cron Expression:** `0 23 * * 0`
- Minute: 0
- Hour: 23 (11 PM)
- Day of Month: * (every day)
- Month: * (every month)
- Day of Week: 0 (Sunday)

### Security

The cron job can be protected with a secret token:

1. Set environment variable: `CRON_SECRET=your-secret-token`
2. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` header
3. Route validates the header before processing

### Manual Triggering

For testing or manual execution:

```bash
# GET request
curl https://your-domain.com/api/cron/weekly-pattern-analysis \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# POST request (same behavior)
curl -X POST https://your-domain.com/api/cron/weekly-pattern-analysis \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Response Format

```json
{
  "success": true,
  "message": "Weekly pattern analysis completed",
  "timestamp": "2025-10-16T23:00:00.000Z",
  "results": {
    "totalUsers": 150,
    "analyzed": 45,
    "skipped": 30,
    "insufficientData": 60,
    "rateLimited": 10,
    "errors": 5,
    "notifications": 40
  }
}
```

### Local Development

For local development without Vercel Cron, you can use `node-cron`:

```typescript
// In a separate local development file (not committed)
import cron from 'node-cron'

// Run every Sunday at 11 PM
cron.schedule('0 23 * * 0', async () => {
  const response = await fetch('http://localhost:3000/api/cron/weekly-pattern-analysis', {
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })
  console.log(await response.json())
})
```

Or manually trigger via:
```bash
curl http://localhost:3000/api/cron/weekly-pattern-analysis
```

### Rate Limiting

- **Per User:** Max 1 analysis per day (24-hour cooldown)
- **Job Frequency:** Weekly (7 days between runs)
- **Reason:** Pattern analysis is computationally intensive and requires sufficient new data

### Error Handling

- Individual user errors don't stop the entire job
- Errors are logged and counted in results
- Job returns 200 OK even with partial failures
- Critical errors return 500 with error details

### Monitoring

Check logs for:
- `[Cron] Starting weekly pattern analysis job...`
- `[Cron] Found X users with behavioral analysis enabled`
- `[Cron] User {id} data: X sessions, Y reviews`
- `[Cron] Analysis complete for user {id}: X patterns, Y insights`
- `[Cron] Weekly pattern analysis job complete: {results}`

### Future Enhancements

1. **Email Notifications:** Integrate with email service (SendGrid, Resend)
2. **In-App Notifications:** Create notification records in database
3. **Progress Tracking:** Real-time job progress dashboard
4. **Retry Logic:** Exponential backoff for failed analyses
5. **Batch Processing:** Process users in batches to avoid timeouts
6. **Custom Schedules:** Per-user analysis frequency preferences
