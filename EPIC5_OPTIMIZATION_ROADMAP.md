# Epic 5 Performance Optimization Roadmap

**Status:** CRITICAL - Epic 5 NOT production-ready
**Overall Success Rate:** 4% (1/25 endpoints functional)
**Estimated Total Remediation:** 150-200 hours to production-ready

---

## Phase 1: Critical Blockers (P0) - 0-48 hours

**Goal:** Restore basic functionality to all endpoints

### 1.1 Infrastructure Dependencies (5 minutes)

**Issue:** ML Service not running
**Impact:** 4 endpoints failing with 503
**Urgency:** IMMEDIATE

```bash
# Start ML Service
cd apps/ml-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Verify health
curl http://localhost:8000/health
```

**Success Criteria:**
- ✅ ML service responds to health checks
- ✅ All prediction endpoints return 200 status codes

---

### 1.2 Fix Prisma Client Error (2-4 hours)

**Issue:** `TypeError: (0 , _tslib.__assign) is not a function`
**Impact:** 16 endpoints failing with 500
**Urgency:** CRITICAL

**Investigation Steps:**
```bash
# Check tslib version
cd apps/web
pnpm list tslib

# Check for version conflicts
pnpm why tslib

# Regenerate Prisma client
pnpm prisma generate

# Clear Next.js cache
rm -rf .next
pnpm build
```

**Potential Root Causes:**
1. Prisma client generated with different Node/TypeScript version
2. tslib version mismatch between dependencies
3. Next.js build cache corruption

**Success Criteria:**
- ✅ No tslib errors in server logs
- ✅ All 16 affected endpoints return valid responses
- ✅ Prisma queries execute successfully

---

### 1.3 Fix HTTP 405 Method Not Allowed (1-2 hours)

**Issue:** 4 endpoints returning 405
**Impact:** Endpoints non-functional
**Urgency:** HIGH

**Affected Endpoints:**
- `/api/analytics/patterns/all`
- `/api/orchestration/recommendations`
- `/api/orchestration/session-plan`
- `/api/analytics/behavioral-insights/goals`

**Fix Steps:**
1. Review each route handler file
2. Verify HTTP method exports (GET, POST, PUT, DELETE)
3. Check Next.js App Router route handler syntax

**Example Fix:**
```typescript
// ❌ WRONG - Missing export
async function GET(request: Request) {
  // ...
}

// ✅ CORRECT
export async function GET(request: Request) {
  // ...
}
```

**Success Criteria:**
- ✅ All 4 endpoints return 200/201 status codes
- ✅ No 405 errors in logs

---

### 1.4 Optimize Catastrophic Endpoints (8-16 hours)

**Issue:** Personalization Effectiveness taking 21 seconds
**Impact:** Completely unusable endpoint
**Urgency:** CRITICAL

**Target Endpoints:**
1. `/api/personalization/effectiveness` (21.2s → <200ms)
2. `/api/analytics/behavioral-insights/patterns/evolution` (2.78s → <200ms)
3. `/api/analytics/behavioral-insights/recommendations` (1.84s → <200ms)

**Optimization Strategy:**

**Step 1: Enable Query Logging**
```typescript
// apps/web/src/lib/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

**Step 2: Identify N+1 Queries**
```bash
# Run endpoint and watch logs
curl http://localhost:3000/api/personalization/effectiveness?userId=user-kevy

# Count queries in logs
grep "prisma:query" /tmp/nextjs-epic5.log | wc -l
# If >10 queries, likely N+1 pattern
```

**Step 3: Fix N+1 with Prisma Includes**
```typescript
// ❌ BAD - N+1 pattern
const configs = await prisma.personalizationConfig.findMany({
  where: { userId }
})

for (const config of configs) {
  const effectiveness = await prisma.personalizationEffectiveness.findFirst({
    where: { configId: config.id }
  })
  // This runs N queries for N configs!
}

// ✅ GOOD - Single query with includes
const configs = await prisma.personalizationConfig.findMany({
  where: { userId },
  include: {
    effectiveness: true  // Eager load related data
  }
})
```

**Step 4: Add Result Caching**
```typescript
import { cache } from 'react'

// Cache for 5 minutes
const getCachedPersonalizationEffectiveness = cache(async (userId: string) => {
  return await prisma.personalizationConfig.findMany({
    where: { userId },
    include: { effectiveness: true }
  })
})
```

**Success Criteria:**
- ✅ Personalization Effectiveness: <200ms
- ✅ Pattern Evolution: <200ms
- ✅ Recommendations: <200ms
- ✅ Query count per endpoint: <10

---

## Phase 2: Performance Optimization (48-120 hours)

**Goal:** Bring all endpoints under performance targets

### 2.1 Database Query Optimization (16-24 hours)

**Slow Endpoints:**
- Cognitive Load History: 961ms (target: 200ms)
- Personalization Preferences: 1095ms (target: 200ms)
- Mission Summary: 393ms (target: 200ms)
- Goals List: 483ms (target: 200ms)
- Performance Correlation: 535ms (target: 200ms)

**Optimization Steps:**

1. **Add Composite Indexes**
```sql
-- For userId + timestamp queries
CREATE INDEX idx_behavioral_patterns_user_time
ON behavioral_patterns (userId, timestamp DESC);

-- For userId + type queries
CREATE INDEX idx_cognitive_load_user_type
ON cognitive_load (userId, type, timestamp DESC);
```

2. **Implement Query Result Caching**
```typescript
// Use Redis for aggregate queries
import Redis from 'ioredis'
const redis = new Redis()

async function getCachedMissionSummary(userId: string) {
  const cacheKey = `mission_summary:${userId}`
  const cached = await redis.get(cacheKey)

  if (cached) return JSON.parse(cached)

  const summary = await computeMissionSummary(userId)
  await redis.setex(cacheKey, 300, JSON.stringify(summary)) // 5 min TTL

  return summary
}
```

3. **Optimize Aggregate Queries**
```typescript
// Use Prisma aggregations instead of client-side computation
const summary = await prisma.mission.aggregate({
  where: { userId },
  _count: { id: true },
  _avg: { completionRate: true },
  _sum: { totalPoints: true }
})
```

**Success Criteria:**
- ✅ All endpoints <200ms response time
- ✅ p95 latency <500ms
- ✅ Cache hit rate >70%

---

### 2.2 Bundle Size Optimization (16-24 hours)

**Issue:** 30MB+ JavaScript bundle (target: <500KB)
**Impact:** 30+ second load times

**Optimization Plan:**

**Step 1: Fix Tree-Shaking for Icon Library (2-4 hours)**
```typescript
// ❌ BAD - Imports entire library (9.2MB)
import * as Icons from 'lucide-react'

// ✅ GOOD - Import only needed icons
import { User, Settings, Calendar } from 'lucide-react'

// OR: Use dynamic imports
const Icon = dynamic(() => import('lucide-react').then(mod => ({ default: mod.User })))
```

**Expected Reduction:** 9.2MB → <500KB

**Step 2: Optimize Recharts Bundle (4-8 hours)**
```typescript
// ❌ BAD - Full recharts import
import { LineChart, Line, XAxis, YAxis } from 'recharts'

// ✅ GOOD - Dynamic import for chart components
import dynamic from 'next/dynamic'

const DynamicLineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
```

**Alternative:** Evaluate lightweight chart libraries
- Victory Charts: ~2MB
- Chart.js + react-chartjs-2: ~300KB
- Nivo: ~1.5MB

**Expected Reduction:** 11MB → <2MB

**Step 3: Remove Dev Dependencies from Production (2-4 hours)**
```json
// next.config.js
module.exports = {
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Remove React Refresh in production
      config.plugins = config.plugins.filter(
        plugin => plugin.constructor.name !== 'ReactRefreshPlugin'
      )
    }
    return config
  }
}
```

**Expected Reduction:** 10MB removed

**Step 4: Implement Route-Based Code Splitting (4-8 hours)**
```typescript
// Use Next.js dynamic imports for heavy pages
import dynamic from 'next/dynamic'

const AnalyticsDashboard = dynamic(
  () => import('@/components/analytics/Dashboard'),
  { loading: () => <DashboardSkeleton /> }
)
```

**Success Criteria:**
- ✅ Total bundle size: <2MB (stretch: <500KB)
- ✅ Largest chunk: <500KB
- ✅ Initial page load: <3s on 3G

---

### 2.3 Implement Performance Monitoring (8-16 hours)

**Goal:** Continuous performance tracking and alerting

**Step 1: Add OpenTelemetry Tracing**
```bash
pnpm add @opentelemetry/api @opentelemetry/sdk-node
```

```typescript
// instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()
```

**Step 2: Add API Response Time Middleware**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const start = Date.now()

  return NextResponse.next({
    headers: {
      'X-Response-Time': `${Date.now() - start}ms`
    }
  })
}
```

**Step 3: Implement Performance Budgets in CI/CD**
```json
// .lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "interactive": ["error", { "maxNumericValue": 3000 }],
        "total-byte-weight": ["error", { "maxNumericValue": 512000 }]
      }
    }
  }
}
```

**Success Criteria:**
- ✅ API response times tracked in APM
- ✅ Frontend performance monitored with RUM
- ✅ Performance budgets enforced in CI/CD
- ✅ Alerts for p95 latency >500ms

---

## Phase 3: Scalability & Advanced Optimization (120-200 hours)

**Goal:** Research-grade performance for production deployment

### 3.1 Implement Redis Caching Layer (16-24 hours)

**Caching Strategy:**
- API response caching (TTL: 5-15 min)
- Session data caching (TTL: 30 min)
- User preferences caching (TTL: 1 hour)
- Aggregate analytics caching (TTL: 15 min)

**Cache Invalidation:**
- On data mutation (POST/PUT/DELETE)
- Time-based TTL expiration
- Manual cache bust endpoint

---

### 3.2 Database Scalability (24-40 hours)

**Improvements:**
1. Read replica for analytics queries
2. Connection pooling optimization (pgBouncer)
3. Materialized views for expensive aggregations
4. Partition large tables by date/userId

---

### 3.3 CDN Integration & Edge Computing (16-24 hours)

**Strategy:**
- Deploy static assets to CDN
- Implement Edge Runtime for API routes
- Use ISR (Incremental Static Regeneration) for dashboards
- Add service worker for offline functionality

---

### 3.4 Load Testing & Capacity Planning (16-24 hours)

**Load Testing Plan:**
```bash
# k6 load test script
import http from 'k6/http'
import { check } from 'k6'

export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp-up
    { duration: '5m', target: 50 },   // Sustained load
    { duration: '2m', target: 100 },  // Peak load
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'],   // <1% errors
  }
}

export default function () {
  let response = http.get('http://localhost:3000/api/analytics/patterns')
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
}
```

**Capacity Planning:**
- Target: 1000 concurrent users
- p95 latency: <500ms
- Error rate: <0.1%
- Auto-scaling triggers at 70% CPU

---

## Success Metrics

### Phase 1 (Critical Blockers)
- [ ] API success rate: 100% (25/25 endpoints)
- [ ] All endpoints return valid HTTP status codes
- [ ] No Prisma client errors
- [ ] ML service operational

### Phase 2 (Performance Optimization)
- [ ] Average API response time: <200ms
- [ ] p95 API response time: <500ms
- [ ] Bundle size: <2MB
- [ ] Lighthouse Performance score: >90

### Phase 3 (Research-Grade Excellence)
- [ ] Load test: 1000 concurrent users
- [ ] p99 latency: <1s
- [ ] Uptime: >99.9%
- [ ] Cache hit rate: >80%
- [ ] APM monitoring: Full coverage

---

## Timeline Summary

| Phase | Duration | Deliverable | Status |
|-------|----------|-------------|--------|
| Phase 1.1 | 5 min | ML Service running | ⏳ TODO |
| Phase 1.2 | 2-4 hrs | Prisma errors fixed | ⏳ TODO |
| Phase 1.3 | 1-2 hrs | HTTP 405 errors fixed | ⏳ TODO |
| Phase 1.4 | 8-16 hrs | Catastrophic endpoints optimized | ⏳ TODO |
| Phase 2.1 | 16-24 hrs | All endpoints <200ms | ⏳ TODO |
| Phase 2.2 | 16-24 hrs | Bundle size <2MB | ⏳ TODO |
| Phase 2.3 | 8-16 hrs | Performance monitoring live | ⏳ TODO |
| Phase 3.1 | 16-24 hrs | Redis caching implemented | ⏳ TODO |
| Phase 3.2 | 24-40 hrs | Database scalability | ⏳ TODO |
| Phase 3.3 | 16-24 hrs | CDN & Edge deployed | ⏳ TODO |
| Phase 3.4 | 16-24 hrs | Load testing validated | ⏳ TODO |

**Total Estimated Time:** 150-200 hours

---

## Next Immediate Actions (Today)

1. ✅ **START ML SERVICE** (5 minutes)
   ```bash
   cd apps/ml-service
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **FIX PRISMA CLIENT** (2-4 hours)
   ```bash
   cd apps/web
   pnpm prisma generate
   rm -rf .next
   pnpm build
   pnpm dev
   ```

3. **RE-RUN PERFORMANCE TESTS** (30 minutes)
   ```bash
   ./performance-test.sh
   ```

4. **VERIFY IMPROVEMENT**
   - Target: 25/25 endpoints functional
   - Target: No 500/503 errors
   - Target: ML predictions working

---

**Status:** ROADMAP ACTIVE
**Owner:** Development Team
**Next Review:** After Phase 1 completion
