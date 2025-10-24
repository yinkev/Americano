# Gemini API Rate Limits - Monitoring Guide

**API Key:** `AIzaSyAOY9miGJxSBI0Gv4fM2j3Phr3RWurfvxc`
**Model:** `text-embedding-001`
**Date Configured:** 2025-10-16

---

## 📊 Rate Limits

| Limit Type | Value | Enforced By |
|------------|-------|-------------|
| **RPM** (Requests Per Minute) | 100 | EmbeddingService |
| **TPM** (Tokens Per Minute) | 30,000 | GeminiClient |
| **RPD** (Requests Per Day) | 1,000 | EmbeddingService |

---

## 🔔 Notification System

The `EmbeddingService` will **automatically notify you** via console warnings when:

### Warning Thresholds:
- **80% of daily quota used** (800 requests)
- **90% of per-minute quota used** (90 requests in last minute)
- **100% of daily quota reached** (blocks further requests until reset)

### Example Notifications:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 GEMINI API RATE LIMIT WARNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Approaching daily quota: 850/1000 requests used (85.0%)
Daily: 850/1000 (85.0%)
Per-Minute: 45/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📈 Monitoring Usage

### Check Current Usage:
```typescript
import { embeddingService } from '@/lib/embedding-service'

const status = embeddingService.getRateLimitStatus()

console.log(`Daily: ${status.requestsInLastDay}/${status.maxRequestsPerDay}`)
console.log(`Daily Usage: ${status.dailyQuotaUsedPercent.toFixed(1)}%`)
console.log(`Per-Minute: ${status.requestsInLastMinute}/${status.maxRequestsPerMinute}`)
```

### Output Example:
```
Daily: 425/1000
Daily Usage: 42.5%
Per-Minute: 12/100
```

---

## 🚦 Usage Scenarios

### Scenario 1: Normal PDF Upload (1 lecture)
**Typical Usage:**
- 1 PDF = ~50 content chunks
- 50 chunks = 50 embedding requests
- Time: ~30 seconds (with rate limiting)
- Daily quota consumed: 5%

### Scenario 2: Bulk Upload (10 lectures)
**Typical Usage:**
- 10 PDFs = ~500 content chunks
- 500 chunks = 500 embedding requests
- Time: ~5 minutes
- Daily quota consumed: 50%

### Scenario 3: Backfill Existing Content
**Example:**
```bash
# Conservative backfill (prevents quota exhaustion)
pnpm tsx scripts/backfill-embeddings.ts --rate-limit 30 --parallel 2
```
- Max 30 embeddings/minute
- Takes longer but safer for large datasets
- Recommended for 20+ lectures

---

## ⚠️ What Happens When Quota Is Reached?

### Per-Minute Limit (100 RPM):
- **Automatic wait:** Service pauses until next minute window
- **Console message:** "Rate limit reached. Waiting Xs..."
- **Impact:** Minimal - adds seconds to processing

### Daily Limit (1000 RPD):
- **Automatic wait:** Service pauses until 24 hours from oldest request
- **Console message:** "DAILY QUOTA REACHED! Waiting Xh..."
- **Impact:** Major - could wait hours
- **Recommendation:** Stop processing, resume tomorrow

---

## 🎯 Best Practices

### 1. Monitor Usage Before Large Operations
```typescript
const status = embeddingService.getRateLimitStatus()

if (status.dailyQuotaUsedPercent > 70) {
  console.warn(`⚠️ Already used ${status.dailyQuotaUsedPercent}% of daily quota`)
  console.warn('Consider deferring large backfill operations')
}
```

### 2. Use Conservative Rate Limiting for Backfills
```bash
# Good: 30 embeddings/minute (leaves headroom)
pnpm tsx scripts/backfill-embeddings.ts --rate-limit 30

# Risky: 90 embeddings/minute (close to limit)
pnpm tsx scripts/backfill-embeddings.ts --rate-limit 90
```

### 3. Schedule Large Operations During Off-Hours
- Run backfills overnight when no users are uploading
- Prevents quota exhaustion during business hours

### 4. Estimate Before Running
```bash
# Dry run shows how many embeddings needed
pnpm tsx scripts/backfill-embeddings.ts --dry-run

# Example output:
# Total lectures: 50
# Total chunks: 2500
# Estimated time: 25 minutes
# Daily quota needed: 250% ⚠️ EXCEEDS LIMIT
```

---

## 📊 Usage Tracking Dashboard (Future)

**Planned Enhancement:**
- Add `/admin/api-usage` page
- Real-time usage graphs
- Daily quota visualization
- Predictive alerts ("At current rate, quota exhausted in 4 hours")

---

## 🔧 Configuration

### Update Rate Limits (if Google changes them):

**File:** `/Users/kyin/Projects/Americano-epic3/apps/web/src/lib/embedding-service.ts`

```typescript
export const embeddingService = new EmbeddingService({
  maxRequestsPerMinute: 100,  // Update here
  maxRequestsPerDay: 1000,     // Update here
  onRateLimitWarning: consoleRateLimitNotification,
})
```

### Custom Notification Handler:

```typescript
import { embeddingService, type RateLimitUsage } from '@/lib/embedding-service'

// Example: Send Slack notification
function slackRateLimitNotification(usage: RateLimitUsage) {
  if (usage.warning) {
    fetch('https://hooks.slack.com/...', {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 ${usage.warning}`,
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Daily:* ${usage.requestsInLastDay}/${usage.maxRequestsPerDay} (${usage.dailyQuotaUsedPercent.toFixed(1)}%)`
          }
        }]
      })
    })
  }
}

// Replace default handler
const customService = new EmbeddingService({
  onRateLimitWarning: slackRateLimitNotification
})
```

---

## 📝 Notes

- **Token limits (TPM: 30,000)** are handled by `GeminiClient`, not `EmbeddingService`
- **Reset time:** 24 hours from oldest request in window
- **Shared quota:** All worktrees (Epic 3, Epic 5) share the same API key quota
- **Safety margin:** Service enforces limits before hitting API errors

---

**Last Updated:** 2025-10-16 by Amelia (DEV Agent)
**Owner:** Kevy
**Security Note:** This API key should be rotated after sharing in plain text
