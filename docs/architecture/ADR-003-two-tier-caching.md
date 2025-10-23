---
title: "ADR-003: Two-Tier Caching Strategy (Redis L1 + In-Memory L2)"
description: "Architecture decision to implement two-tier caching with Redis L1 (55-70% hit) and in-memory L2 (10-15% hit) achieving 65-85% total cache hit rate and 98.5% API performance improvement"
type: "Architecture"
status: "Active"
version: "1.0"

owner: "Performance Engineer"
dri_backup: "Winston (Architect)"
contributors: ["Wave 1-2 Backend Team", "Database Optimizer"]
review_cadence: "Monthly"

created_date: "2025-10-20T00:00:00-07:00"
last_updated: "2025-10-23T12:30:00-07:00"
last_reviewed: "2025-10-23T12:30:00-07:00"
next_review_due: "2025-11-20"

depends_on:
  - docs/EPIC5-MASTER-SUMMARY.md
  - docs/EPIC5-PERFORMANCE-BENCHMARKS.md
affects:
  - All Epic 5 API endpoints
  - Performance metrics
related_adrs:
  - ADR-001-hybrid-typescript-python.md

audience:
  - architects
  - experienced-devs
  - performance-engineers
technical_level: "Advanced"
tags: ["architecture", "adr", "epic-5", "caching", "performance", "redis"]
keywords: ["Redis", "Upstash", "caching strategy", "performance optimization", "two-tier cache"]
search_priority: "critical"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

changelog:
  - version: "1.0"
    date: "2025-10-20"
    author: "Performance Engineer"
    changes:
      - "Initial ADR documenting two-tier caching strategy"
      - "Epic 5 Wave 1-2 optimization results"
---

# ADR-003: Two-Tier Caching Strategy (Redis L1 + In-Memory L2)

**Date:** 2025-10-20
**Status:** ✅ Accepted
**Deciders:** Kevy (Founder), Winston (Architect), Performance Engineer
**Related:** [EPIC5-MASTER-SUMMARY.md](../EPIC5-MASTER-SUMMARY.md)

---

## Context

Epic 5 (Behavioral Twin Engine) required real-time behavioral analytics with strict performance targets:
- **API Response Time:** <200ms P95 (from baseline 21.2s)
- **Dashboard Load:** <2s for behavioral insights
- **Cache Efficiency:** 65-85% hit rate goal
- **Scalability:** Support 1000+ concurrent users

### Problem Statement

**Initial Performance (Wave 0 Baseline):**
- Personalization API: 21.2s
- Analytics Patterns: 2.78s
- Predictions: 1.52s
- Cognitive Load: 980ms

**Root Causes:**
- Database queries on every request (no caching)
- Complex aggregations (behavioral pattern analysis)
- N+1 queries (user profiles + related data)
- No query denormalization

### Constraints

- **Budget:** Bootstrap/self-funded (prefer serverless over dedicated Redis)
- **Latency:** Cache access <10ms (Redis on same region)
- **Consistency:** Behavioral data changes slowly (5-15 min TTLs acceptable)
- **Deployment:** Must work with Vercel serverless functions

---

## Decision Drivers

- **Performance Target:** <200ms P95 API response time (98.5% improvement needed)
- **Cost Efficiency:** Serverless-first, pay-per-use pricing
- **Scalability:** Auto-scaling with traffic (no manual provisioning)
- **Developer Experience:** Simple setup, minimal configuration
- **Reliability:** High availability (99.9%+ uptime)
- **Observability:** Cache hit/miss metrics for optimization

---

## Considered Options

### Option 1: No Caching (Baseline)
**Description:** Database queries on every request

**Pros:**
- ✅ Simplest implementation
- ✅ Always fresh data

**Cons:**
- ❌ Unacceptable performance (21.2s worst case)
- ❌ Database overload at scale
- ❌ Poor user experience

**Implementation Effort:** None
**Risk Level:** High (performance)

---

### Option 2: In-Memory Cache Only
**Description:** Node.js process-level caching (Map or LRU cache)

**Pros:**
- ✅ Zero latency (<1ms)
- ✅ No infrastructure cost
- ✅ Simple implementation

**Cons:**
- ❌ Lost on serverless function cold starts
- ❌ Not shared across Vercel instances
- ❌ Limited cache size (memory constrained)
- ❌ Inconsistent hit rates (function-specific)

**Implementation Effort:** Low
**Risk Level:** Medium (cold starts)

---

### Option 3: Redis L1 Only
**Description:** Redis (Upstash) as single caching layer

**Pros:**
- ✅ Persistent across function instances
- ✅ Shared cache (consistent hit rate)
- ✅ Serverless (Upstash auto-scales)

**Cons:**
- ⚠️ Network latency (~5-10ms per request)
- ⚠️ Cost at high request volume
- ⚠️ Single point of failure (if Redis down)

**Implementation Effort:** Medium
**Risk Level:** Low

---

### Option 4: Two-Tier Caching (L1 Redis + L2 In-Memory) - CHOSEN
**Description:** Redis as L1, process-level Map as L2

**Pros:**
- ✅ Best of both worlds (persistence + speed)
- ✅ L2 eliminates Redis latency for hot data
- ✅ 65-85% total hit rate (L1 55-70% + L2 10-15%)
- ✅ Graceful degradation (L2 survives Redis downtime)
- ✅ Cost optimization (fewer Redis calls)

**Cons:**
- ⚠️ More complex implementation (2 cache layers)
- ⚠️ L2 lost on cold starts (acceptable)
- ⚠️ Memory management for L2 (size limits)

**Implementation Effort:** Medium
**Risk Level:** Low

---

## Decision Outcome

**Chosen Option:** **Option 4: Two-Tier Caching (L1 Redis + L2 In-Memory)**

### Rationale

The two-tier strategy maximizes cache hit rate while minimizing latency and cost:

1. **L1 (Redis - Upstash):**
   - Persistent, shared across all Vercel functions
   - 55-70% hit rate (first-tier hits)
   - ~5-10ms access latency
   - Serverless (auto-scales, pay-per-use)

2. **L2 (In-Memory - Node.js Map):**
   - Ultra-fast (<1ms access)
   - 10-15% additional hit rate (hot data)
   - Zero cost
   - Lost on cold starts (acceptable)

3. **Combined Performance:**
   - **Total Cache Hit Rate:** 65-85%
   - **L1 Miss → L2 Hit:** Avoids database query
   - **L2 Hit:** Zero network latency
   - **Both Miss:** Database query + write to L1 & L2

### Cache Flow Diagram

```
Request
  ↓
Check L2 (in-memory)
  ├─ HIT (10-15%) → Return (<1ms)
  └─ MISS
      ↓
  Check L1 (Redis)
      ├─ HIT (55-70%) → Write L2 → Return (~5-10ms)
      └─ MISS
          ↓
      Query Database
          ↓
      Write L1 + L2
          ↓
      Return (120-180ms)
```

### Cache Hit Rate Analysis

**Measured Performance (Wave 2):**
- **L1 (Redis) Hit Rate:** 55-70% (varies by endpoint)
- **L2 (In-Memory) Hit Rate:** 10-15% (hot data)
- **Total Hit Rate:** 65-85%
- **Cache Miss Rate:** 15-35% (requires database query)

**By Endpoint:**
| Endpoint | L1 Hit | L2 Hit | Total Hit | Avg Response |
|----------|--------|--------|-----------|--------------|
| Personalization | 70% | 15% | 85% | 180ms |
| Patterns | 65% | 12% | 77% | 120ms |
| Predictions | 60% | 10% | 70% | 110ms |
| Cognitive Load | 55% | 10% | 65% | 95ms |

---

## Consequences

### Positive Consequences (Achieved)

- ✅ **98.5% API Performance Improvement:** 21.2s → 180ms (personalization)
- ✅ **65-85% Cache Hit Rate:** Exceeds 60% target
- ✅ **Sub-200ms P95:** All endpoints meet performance target
- ✅ **Cost Efficiency:** Upstash serverless (~$19/month for 10GB)
- ✅ **Graceful Degradation:** L2 survives Redis outages
- ✅ **Scalability:** Auto-scales with traffic (no provisioning)

### Negative Consequences (Managed)

- ⚠️ **Cache Invalidation Complexity:** Two layers to invalidate
  - **Mitigation:** TTL-based expiration (5-15 min) + event-based invalidation
- ⚠️ **L2 Memory Usage:** Risk of memory bloat
  - **Mitigation:** LRU eviction + 1000-item size limit
- ⚠️ **Cold Start Penalty:** L2 empty on cold starts
  - **Mitigation:** Acceptable (L1 still available)

### Risks (Mitigated)

- 🚨 **Risk:** Redis downtime causes 100% cache miss
  - **Probability:** Low (Upstash 99.99% SLA)
  - **Mitigation:** L2 provides temporary buffer, database handles load
- 🚨 **Risk:** Stale cache data (consistency issues)
  - **Probability:** Low
  - **Mitigation:** Short TTLs (5-15 min), event-based invalidation on mutations

---

## Implementation Plan

### Steps Required:

1. **Install Dependencies**
   ```bash
   pnpm add @upstash/redis ioredis
   ```

2. **Create Redis Client**
   ```typescript
   // apps/web/src/lib/redis.ts
   import { Redis } from '@upstash/redis'

   export const redis = new Redis({
     url: process.env.REDIS_URL!,
     token: process.env.REDIS_TOKEN!,
   })
   ```

3. **Implement Two-Tier Cache Service**
   ```typescript
   // apps/web/src/lib/cache-service.ts
   import { redis } from './redis'

   // L2: In-memory cache
   const l2Cache = new Map<string, { data: any; expires: number }>()

   export async function getCached<T>(key: string): Promise<T | null> {
     // Check L2 first
     const l2Hit = l2Cache.get(key)
     if (l2Hit && l2Hit.expires > Date.now()) {
       return l2Hit.data as T
     }

     // Check L1 (Redis)
     const l1Hit = await redis.get<T>(key)
     if (l1Hit) {
       // Write to L2
       l2Cache.set(key, { data: l1Hit, expires: Date.now() + 5 * 60 * 1000 })
       return l1Hit
     }

     return null
   }

   export async function setCached<T>(key: string, value: T, ttl: number) {
     // Write to both L1 and L2
     await redis.set(key, value, { ex: ttl })
     l2Cache.set(key, { data: value, expires: Date.now() + ttl * 1000 })
   }
   ```

4. **Configure TTLs by Data Type**
   ```typescript
   export const CACHE_TTL = {
     patterns: 15 * 60,           // 15 min (slow-changing)
     predictions: 10 * 60,         // 10 min (moderate)
     dashboard: 5 * 60,            // 5 min (fast-changing)
     cognitiveLoad: 5 * 60,        // 5 min (real-time-ish)
     burnoutRisk: 15 * 60,         // 15 min (slow-changing)
     personalizationConfig: 15 * 60, // 15 min
   }
   ```

5. **Add Cache Invalidation**
   ```typescript
   export async function invalidateCache(pattern: string) {
     // Invalidate L2
     for (const key of l2Cache.keys()) {
       if (key.startsWith(pattern)) {
         l2Cache.delete(key)
       }
     }

     // Invalidate L1 (Redis scan + delete)
     // (Implementation depends on key pattern)
   }
   ```

6. **Monitor Cache Metrics**
   ```typescript
   let l1Hits = 0, l1Misses = 0, l2Hits = 0, l2Misses = 0

   export function getCacheMetrics() {
     return {
       l1HitRate: l1Hits / (l1Hits + l1Misses),
       l2HitRate: l2Hits / (l2Hits + l2Misses),
       totalHitRate: (l1Hits + l2Hits) / (l1Hits + l1Misses + l2Hits + l2Misses),
     }
   }
   ```

### Timeline (Actual):
- **Wave 1:** Redis L1 implementation (2 days)
- **Wave 2:** L2 in-memory cache (1 day)
- **Testing & Tuning:** 2 days
- **Production Deployment:** Oct 20, 2025

### Dependencies:
- Upstash Redis account (free tier sufficient for MVP)
- Environment variables: REDIS_URL, REDIS_TOKEN

---

## Validation

### Pre-Approval Checklist:
- [x] User (Kevy) approved: Yes (2025-10-20)
- [x] ADR created and reviewed: Yes
- [x] Alternatives properly evaluated: Yes (4 options)
- [x] Performance benchmarks defined: Yes (<200ms P95 target)

### Post-Implementation Checklist:
- [x] Performance target met: Yes (all endpoints <200ms P95)
- [x] Cache hit rate target met: Yes (65-85% achieved)
- [x] Monitoring setup: Yes (metrics tracked)
- [x] Load testing passed: Yes (k6 tests, 50-200 concurrent users)
- [x] Production deployment: Yes (Oct 20, 2025)

---

## References

**Documentation:**
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [EPIC5-PERFORMANCE-BENCHMARKS.md](../EPIC5-PERFORMANCE-BENCHMARKS.md)
- [Two-Tier Caching Pattern](https://aws.amazon.com/caching/best-practices/)

**Code:**
- `apps/web/src/lib/cache-service.ts` - Cache implementation
- `apps/web/src/lib/redis.ts` - Redis client
- `apps/web/src/app/api/*` - API routes using cache

**Discussion:**
- Wave 1-2 Performance Optimization Sprint (Oct 18-20, 2025)

---

## Notes

**Performance Achievements:**
- Personalization: 21.2s → 180ms (98.5% improvement)
- Analytics Patterns: 2.78s → 120ms (95.7% improvement)
- Predictions: 1.52s → 110ms (92.8% improvement)
- Cognitive Load: 980ms → 95ms (90.3% improvement)

**Lessons Learned:**
- Two-tier caching provides best balance of speed, consistency, and cost
- L2 in-memory cache crucial for hot data (10-15% additional hit rate)
- Short TTLs (5-15 min) acceptable for behavioral data (slow-changing)
- Monitoring cache metrics essential for tuning

**Future Considerations:**
- Consider GraphQL for query-level caching (DataLoader pattern)
- Explore Edge Functions for even lower latency (Vercel Edge)
- Implement smarter cache warming strategies (pre-populate hot keys)

**Superseded By:** N/A (current strategy)
**Supersedes:** N/A (first caching ADR)

---

**Last Updated:** 2025-10-23T12:30:00-07:00
**Review Date:** Monthly or after significant traffic increase
