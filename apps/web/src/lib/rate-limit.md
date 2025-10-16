# Rate Limiting - Deferred for MVP

**Status:** DEFERRED
**Date:** 2025-10-14
**Reason:** Single-user local development - no abuse risk

## Decision Rationale

Rate limiting is **deferred for MVP** per solution architecture guidance:
- Single user (Kevy) local development environment
- No public exposure or abuse risk
- Authentication deferred (Story 1.1)
- Adds unnecessary complexity for current scope

## When to Implement

Implement rate limiting when:
1. Deploying for multiple users
2. Exposing APIs publicly
3. Moving to production environment

## Recommended Implementation

When needed, use one of these approaches:

### Option A: Upstash Rate Limit (Recommended)
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function rateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  if (!success) {
    throw ApiError.forbidden("Rate limit exceeded");
  }
}
```

### Option B: Vercel Edge Config
```typescript
import { get } from "@vercel/edge-config";

// Configure rate limits via Edge Config dashboard
const limit = await get("rate_limit_per_hour");
```

### Option C: Custom In-Memory (Dev Only)
```typescript
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (record.count >= maxRequests) {
    throw ApiError.forbidden("Rate limit exceeded");
  }

  record.count++;
}
```

## Rate Limit Recommendations

When implementing, use these limits:

- **Authentication endpoints:** 5 requests / 15 minutes
- **Upload endpoints:** 10 requests / hour
- **Read endpoints:** 100 requests / minute
- **Write endpoints:** 30 requests / minute

## References

- [Source: docs/stories/story-1.5.md - Task 7 (lines 72-79)]
- [Source: docs/solution-architecture.md - Authentication deferred for MVP]
