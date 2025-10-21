# Epic 5 Production Deployment Guide

**Document Version**: 1.0.0
**Last Updated**: 2025-10-20
**Status**: Production-Ready
**Epic**: Epic 5 - Behavioral Twin Engine
**Target Environment**: Vercel (Next.js) + PostgreSQL + Redis + FastAPI ML Service

---

## Executive Summary

This guide provides step-by-step instructions for deploying Epic 5 (Behavioral Twin Engine) to production. The platform requires four main components: Next.js web app, PostgreSQL database, Redis cache, and FastAPI ML service.

**Deployment Architecture:**
```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Vercel    │─────▶│  PostgreSQL  │      │   Upstash   │
│  (Next.js)  │      │   (Neon/AWS) │      │   (Redis)   │
└──────┬──────┘      └──────────────┘      └─────────────┘
       │
       │ HTTP
       ▼
┌─────────────┐
│   FastAPI   │
│ ML Service  │
│ (Port 8000) │
└─────────────┘
```

**Estimated Deployment Time:** 2-3 hours (first time), 30 minutes (subsequent deploys)

---

## 1. Pre-Deployment Checklist

### 1.1 Code Quality Checks

- [ ] **TypeScript Build**: Run `pnpm run build` in `/apps/web` - verify 0 errors
- [ ] **Test Suite**: Run `pnpm test` - verify all Epic 5 tests pass
- [ ] **Linting**: Run `pnpm lint` - fix all errors and warnings
- [ ] **Type Check**: Run `pnpm typecheck` - verify no type errors
- [ ] **Bundle Analysis**: Check bundle size <10MB (run `pnpm analyze`)

**Commands:**
```bash
cd /apps/web

# 1. TypeScript build check
pnpm run build

# 2. Run test suite
pnpm test

# 3. Lint check
pnpm lint

# 4. Type check
pnpm typecheck

# 5. Bundle analysis (optional)
ANALYZE=true pnpm build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (XX/XX)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    XXX kB        XXX kB
├ ○ /analytics/behavioral-insights       XXX kB        XXX kB
...
Total: <10 MB
```

---

### 1.2 Database Readiness

- [ ] **Schema Validation**: Verify Prisma schema is up-to-date
- [ ] **Migrations Ready**: All migrations generated and tested
- [ ] **Seed Data**: Prepare production seed data (optional)
- [ ] **Indexes**: Verify 27 Epic 5 indexes are in migration files
- [ ] **Connection String**: Production DATABASE_URL ready (encrypted)

**Commands:**
```bash
cd /apps/web

# 1. Check Prisma schema
npx prisma validate

# 2. Generate migration (if schema changed)
npx prisma migrate dev --name epic5-production-ready

# 3. Check migration status
npx prisma migrate status

# 4. (Optional) Test migration on staging DB
DATABASE_URL="postgresql://staging..." npx prisma migrate deploy
```

---

### 1.3 Environment Variables Audit

**Required Environment Variables:**

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Redis (Upstash)
REDIS_URL="redis://default:xxx@xxx.upstash.io:6379"
REDIS_TOKEN="xxx"

# ML Service
ML_SERVICE_URL="https://ml-service.your-domain.com"

# Next.js
NEXT_PUBLIC_APP_URL="https://americano.app"
NODE_ENV="production"

# Optional: Monitoring
SENTRY_DSN="https://xxx@sentry.io/xxx"
VERCEL_ANALYTICS_ID="xxx"

# Optional: Calendar Integration (Story 5.3)
GOOGLE_CLIENT_ID="xxx"
GOOGLE_CLIENT_SECRET="xxx"
GOOGLE_REDIRECT_URI="https://americano.app/api/calendar/callback"
```

**Security Checklist:**
- [ ] No sensitive values committed to git
- [ ] All secrets stored in Vercel Environment Variables (encrypted)
- [ ] DATABASE_URL uses SSL (`?sslmode=require`)
- [ ] Redis connection uses TLS
- [ ] Calendar OAuth credentials stored securely

---

## 2. Database Deployment (PostgreSQL)

### 2.1 Recommended Providers

**Option 1: Neon (Serverless PostgreSQL) - RECOMMENDED**
- **Pros**: Serverless, auto-scaling, branch preview DBs
- **Pricing**: $19/month (Pro plan, 10 GB included)
- **Setup Time**: 5 minutes

**Option 2: AWS RDS (Managed PostgreSQL)**
- **Pros**: Enterprise-grade, full control, snapshots
- **Pricing**: ~$25/month (db.t4g.micro + storage)
- **Setup Time**: 15 minutes

**Option 3: Supabase (PostgreSQL + Realtime)**
- **Pros**: PostgreSQL + auth + storage in one
- **Pricing**: $25/month (Pro plan)
- **Setup Time**: 10 minutes

---

### 2.2 Neon Setup (Recommended)

**Step 1: Create Neon Project**
1. Go to https://console.neon.tech/
2. Click "New Project"
3. Name: `americano-production`
4. Region: Choose closest to your users (e.g., `us-east-1`)
5. PostgreSQL version: 16 (latest)
6. Click "Create Project"

**Step 2: Get Connection String**
```sql
-- Neon provides connection string in format:
postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

-- Copy this to Vercel Environment Variables as DATABASE_URL
```

**Step 3: Enable Connection Pooling** (Important for serverless)
```sql
-- In Neon console, go to "Connection pooling"
-- Enable pooling with these settings:
-- Mode: Transaction
-- Pool size: 10
-- Connection timeout: 30s

-- Use pooling connection string for Prisma:
postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech:5432/neondb?sslmode=require&pgbouncer=true&connection_limit=10
```

**Step 4: Create Database Schema**
```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://xxx"

# Deploy migrations
npx prisma migrate deploy

# (Optional) Seed initial data
npx prisma db seed
```

**Verification:**
```bash
# Connect to production DB
psql "$DATABASE_URL"

# Check tables
\dt

# Expected tables (40+):
#  users, courses, lectures, learning_objectives, missions,
#  behavioral_patterns, behavioral_insights, struggle_predictions,
#  cognitive_load_metrics, burnout_risk_assessments, ...

# Check Epic 5 indexes (should be 27)
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%behavioral%'
   OR indexname LIKE '%prediction%'
   OR indexname LIKE '%cognitive%'
   OR indexname LIKE '%personalization%';
```

---

## 3. Redis Deployment (Upstash)

### 3.1 Upstash Setup

**Step 1: Create Upstash Database**
1. Go to https://console.upstash.com/
2. Click "Create Database"
3. Name: `americano-cache`
4. Region: Choose closest to Next.js deployment (e.g., `us-east-1`)
5. Type: "Regional" (for low latency)
6. TLS: Enable
7. Click "Create"

**Step 2: Get Redis Connection Details**
```bash
# Upstash provides two endpoints:
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"

# For traditional Redis clients (Prisma, Node.js):
REDIS_URL="redis://default:xxx@xxx.upstash.io:6379"
```

**Step 3: Configure Environment Variables**
```bash
# Add to Vercel Environment Variables:
REDIS_URL="redis://default:xxx@xxx.upstash.io:6379"
REDIS_TOKEN="xxx"  # For REST API access
```

**Verification:**
```bash
# Test connection
redis-cli -u "$REDIS_URL"

# Check connectivity
> PING
PONG

# Check cache keys (should be empty initially)
> KEYS *
(empty array)

# Exit
> EXIT
```

---

### 3.2 Redis Configuration

**Cache Strategy:**
```typescript
// /apps/web/src/lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

// Cache TTLs (Time To Live)
export const CACHE_TTL = {
  patterns: 15 * 60,           // 15 minutes
  predictions: 10 * 60,         // 10 minutes
  dashboard: 5 * 60,            // 5 minutes
  cognitiveLoad: 5 * 60,        // 5 minutes
  burnoutRisk: 15 * 60,         // 15 minutes
  personalizationConfig: 15 * 60, // 15 minutes
}
```

---

## 4. ML Service Deployment (FastAPI)

### 4.1 ML Service Requirements

**Tech Stack:**
- **Framework**: FastAPI (Python 3.11+)
- **ML Libraries**: scikit-learn, numpy, pandas
- **Server**: Uvicorn (ASGI server)
- **Deployment**: Docker container on AWS ECS / Google Cloud Run / fly.io

**Minimum Resources:**
- **CPU**: 1 vCPU
- **Memory**: 2 GB RAM
- **Storage**: 5 GB (for model artifacts)

---

### 4.2 Docker Deployment (Recommended)

**Dockerfile** (`/apps/ml-service/Dockerfile`):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app ./app

# Expose port
EXPOSE 8000

# Run FastAPI with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

**Build and Deploy:**
```bash
cd /apps/ml-service

# 1. Build Docker image
docker build -t americano-ml-service:latest .

# 2. Test locally
docker run -p 8000:8000 \
  -e DATABASE_URL="$DATABASE_URL" \
  americano-ml-service:latest

# 3. Tag for deployment (example: AWS ECR)
docker tag americano-ml-service:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/americano-ml:latest

# 4. Push to registry
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/americano-ml:latest
```

---

### 4.3 fly.io Deployment (Easiest)

**Setup:**
```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Launch app
cd /apps/ml-service
flyctl launch

# Follow prompts:
# App name: americano-ml-service
# Region: us-east-1 (or closest to Next.js)
# Create Postgres DB: No (we already have one)
# Deploy now: Yes

# 4. Set environment variables
flyctl secrets set DATABASE_URL="$DATABASE_URL"

# 5. Scale resources
flyctl scale vm shared-cpu-2x --memory 2048
```

**Verification:**
```bash
# Check deployment status
flyctl status

# View logs
flyctl logs

# Test health endpoint
curl https://americano-ml-service.fly.dev/health

# Expected response:
# {"status": "healthy", "version": "1.0.0"}
```

**Update ML_SERVICE_URL in Next.js:**
```bash
# Add to Vercel Environment Variables:
ML_SERVICE_URL="https://americano-ml-service.fly.dev"
```

---

## 5. Next.js Deployment (Vercel)

### 5.1 Vercel Setup

**Step 1: Connect Repository**
1. Go to https://vercel.com/
2. Click "Add New Project"
3. Import Git Repository (GitHub/GitLab/Bitbucket)
4. Select `Americano-epic5` repository
5. Framework Preset: "Next.js"
6. Root Directory: `apps/web`

**Step 2: Configure Build Settings**
```bash
# Build Command (auto-detected):
cd apps/web && pnpm run build

# Output Directory (auto-detected):
.next

# Install Command:
pnpm install --frozen-lockfile

# Node.js Version: 20.x
```

**Step 3: Add Environment Variables**

Go to "Settings" → "Environment Variables" and add:

```bash
# Production Environment
DATABASE_URL="postgresql://xxx"             # Neon connection string
REDIS_URL="redis://xxx"                     # Upstash Redis
REDIS_TOKEN="xxx"                           # Upstash token
ML_SERVICE_URL="https://americano-ml-service.fly.dev"
NEXT_PUBLIC_APP_URL="https://americano.app"
NODE_ENV="production"

# Optional: Monitoring
SENTRY_DSN="https://xxx@sentry.io/xxx"
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="xxx"

# Optional: Calendar OAuth (Story 5.3)
GOOGLE_CLIENT_ID="xxx"
GOOGLE_CLIENT_SECRET="xxx"
GOOGLE_REDIRECT_URI="https://americano.app/api/calendar/callback"
```

**Step 4: Deploy**
```bash
# Option 1: Deploy via Vercel Dashboard
# Click "Deploy" button

# Option 2: Deploy via CLI
vercel --prod

# Option 3: Auto-deploy on git push
# (Already configured if connected via dashboard)
git push origin main
```

**Deployment Process:**
```
1. Cloning repository...
2. Running `pnpm install`...
3. Running `pnpm run build`...
4. Uploading build output...
5. Assigning domain...
6. Deployment ready: https://americano.vercel.app
```

---

### 5.2 Custom Domain Setup

**Step 1: Add Domain in Vercel**
1. Go to "Settings" → "Domains"
2. Add domain: `americano.app`
3. Vercel provides DNS records

**Step 2: Configure DNS**

Add these records to your DNS provider (e.g., Cloudflare, Namecheap):

```
Type    Name    Value                       TTL
----------------------------------------------
A       @       76.76.21.21                 Auto
CNAME   www     cname.vercel-dns.com        Auto
```

**Step 3: Enable HTTPS**
- Vercel automatically provisions SSL certificate (Let's Encrypt)
- HTTPS enforced by default

**Verification:**
```bash
# Check DNS propagation
dig americano.app

# Test HTTPS
curl -I https://americano.app

# Expected: 200 OK with SSL certificate
```

---

## 6. Database Migration Execution

### 6.1 Backup Staging Database (if applicable)

```bash
# Export staging data
pg_dump $STAGING_DATABASE_URL > staging-backup.sql

# (Optional) Import to production if needed
psql $PRODUCTION_DATABASE_URL < staging-backup.sql
```

---

### 6.2 Run Production Migrations

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://production-xxx"

# Deploy all pending migrations
npx prisma migrate deploy

# Output:
# Applying migration `20251001120000_init`
# Applying migration `20251015140000_epic5-schema`
# Applying migration `20251018090000_epic5-indexes`
# ...
# The following migrations have been applied:
# migrations/
#   └─ 20251001120000_init/
#       └─ migration.sql
#   └─ 20251015140000_epic5-schema/
#       └─ migration.sql
#   └─ 20251018090000_epic5-indexes/
#       └─ migration.sql
# All migrations have been successfully applied.
```

---

### 6.3 Verify Schema

```bash
# Connect to production DB
psql "$DATABASE_URL"

# Check table count (should be 40+)
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';

# Check Epic 5 specific tables
\dt *behavioral*
\dt *prediction*
\dt *cognitive*
\dt *personalization*

# Check indexes (should be 27+ for Epic 5)
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

# Exit
\q
```

---

## 7. Post-Deployment Verification

### 7.1 Health Checks

**Next.js App:**
```bash
# 1. Homepage loads
curl -I https://americano.app/
# Expected: 200 OK

# 2. API health check
curl https://americano.app/api/user/profile
# Expected: JSON response (or 404 if no user seeded)

# 3. Static assets load
curl -I https://americano.app/_next/static/xxx
# Expected: 200 OK
```

**ML Service:**
```bash
# Health endpoint
curl https://americano-ml-service.fly.dev/health
# Expected: {"status": "healthy"}

# Predictions endpoint (test)
curl -X POST https://americano-ml-service.fly.dev/predictions/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "objectiveIds": []}'
# Expected: JSON response with predictions
```

**Database:**
```bash
# Connection test
psql "$DATABASE_URL" -c "SELECT 1;"
# Expected: 1 row returned

# Table count
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
# Expected: 40+
```

**Redis:**
```bash
# Ping test
redis-cli -u "$REDIS_URL" PING
# Expected: PONG

# Set/get test
redis-cli -u "$REDIS_URL" SET test-key "test-value" EX 60
redis-cli -u "$REDIS_URL" GET test-key
# Expected: "test-value"
```

---

### 7.2 Feature Verification

**Test Critical Paths:**

1. **User Flow**:
   - [ ] Visit homepage
   - [ ] Navigate to `/analytics/behavioral-insights`
   - [ ] Verify skeleton states show immediately
   - [ ] Verify data loads within 2 seconds

2. **Analytics Features**:
   - [ ] Load behavioral patterns dashboard
   - [ ] Generate struggle predictions
   - [ ] View cognitive load metrics
   - [ ] Apply intervention recommendation

3. **Performance**:
   - [ ] Run Lighthouse audit (target: 95+ performance score)
   - [ ] Check Core Web Vitals (FCP <1s, LCP <2s, CLS 0.0)
   - [ ] Verify API response times <200ms (check browser Network tab)

4. **Accessibility**:
   - [ ] Test keyboard navigation (Tab through all interactive elements)
   - [ ] Test screen reader (NVDA/VoiceOver)
   - [ ] Verify WCAG contrast ratios with axe DevTools

---

### 7.3 Monitoring Setup

**Vercel Analytics** (Built-in):
- Automatically enabled on Vercel
- View in "Analytics" tab on dashboard
- Tracks Web Vitals, errors, page views

**Sentry (Error Tracking):**
```bash
# 1. Install Sentry
pnpm add @sentry/nextjs

# 2. Initialize Sentry
npx @sentry/wizard@latest -i nextjs

# 3. Configure DSN in environment variables
SENTRY_DSN="https://xxx@sentry.io/xxx"

# 4. Deploy
vercel --prod
```

**Custom Metrics:**
```typescript
// /apps/web/src/lib/monitoring.ts
export async function trackApiPerformance(endpoint: string, duration: number) {
  // Log to Vercel Analytics
  console.log(`[PERF] ${endpoint}: ${duration}ms`)

  // Send to Sentry (if enabled)
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(`API Performance: ${endpoint}`, {
      level: 'info',
      extra: { duration, endpoint }
    })
  }
}
```

---

## 8. Performance Optimization (Post-Launch)

### 8.1 Vercel Edge Functions

**Convert High-Traffic Endpoints to Edge:**
```typescript
// /apps/web/src/app/api/analytics/patterns/route.ts
export const runtime = 'edge'  // Deploy to Vercel Edge Network

export async function GET(request: Request) {
  // Edge-compatible code (no Node.js APIs)
  const patterns = await fetchFromRedis('patterns:...')
  return Response.json({ patterns })
}
```

**Benefits:**
- 50% lower latency (geo-distributed)
- Unlimited requests (no cold starts)
- <50ms P50 response time

---

### 8.2 Image Optimization

**Next.js Image Component:**
```tsx
import Image from 'next/image'

<Image
  src="/images/hero.webp"
  alt="Americano Platform"
  width={1200}
  height={600}
  loading="lazy"
  quality={80}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**Automatic Optimizations:**
- WebP format with JPEG fallback
- Responsive srcset generation
- Lazy loading
- Blur-up placeholder

---

### 8.3 Database Query Optimization

**Monitor Slow Queries:**
```sql
-- Enable PostgreSQL slow query logging (Neon)
ALTER SYSTEM SET log_min_duration_statement = 200;  -- Log queries >200ms

-- Check slow queries
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 200
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Add Missing Indexes:**
```sql
-- If queries are slow, add indexes
CREATE INDEX CONCURRENTLY idx_slow_table_column
ON slow_table (column_name);
```

---

## 9. Rollback Procedure

### 9.1 Vercel Rollback

**Option 1: Vercel Dashboard**
1. Go to "Deployments" tab
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"
4. Confirm

**Option 2: Vercel CLI**
```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

---

### 9.2 Database Rollback

**Option 1: Revert Last Migration**
```bash
# Revert last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Re-apply previous state
npx prisma migrate deploy
```

**Option 2: Restore from Backup**
```bash
# Download backup
pg_dump $DATABASE_URL > current-backup.sql

# Restore previous backup
psql $DATABASE_URL < previous-backup.sql
```

---

## 10. Production Maintenance

### 10.1 Regular Maintenance Tasks

**Daily:**
- [ ] Check Vercel deployment status
- [ ] Monitor error rates in Sentry
- [ ] Review Redis cache hit rates

**Weekly:**
- [ ] Review slow query logs
- [ ] Check database storage usage
- [ ] Update dependencies (security patches)

**Monthly:**
- [ ] Database vacuum and analyze
- [ ] Review and archive old behavioral events
- [ ] Performance audit (Lighthouse)
- [ ] Update this deployment guide

---

### 10.2 Scaling Strategy

**Horizontal Scaling:**

**Next.js (Vercel):**
- Auto-scales automatically
- No configuration needed
- Handles 1000+ concurrent users

**Database (Neon):**
- Enable read replicas for analytics queries
- Connection pooling (already configured)
- Upgrade to larger tier if CPU/memory >80%

**Redis (Upstash):**
- Automatically scales (serverless)
- Monitor memory usage in dashboard
- Upgrade tier if approaching limits

**ML Service (fly.io):**
```bash
# Scale to multiple instances
flyctl scale count 3

# Scale memory
flyctl scale vm shared-cpu-4x --memory 4096
```

---

### 10.3 Backup Strategy

**Database Backups:**
```bash
# Automated daily backups (Neon)
# - Neon: Automatic daily backups (7-day retention)
# - Manual backup before migrations:
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Test restore periodically
psql $DATABASE_URL < backup-YYYYMMDD.sql
```

**Redis Backups:**
- Upstash: Automatic snapshots
- No manual backups needed (cache layer)

---

## 11. Troubleshooting

### 11.1 Common Issues

**Issue 1: Build Fails on Vercel**

**Symptoms:**
```
Error: Type error: Property 'xxx' does not exist on type 'yyy'
```

**Solution:**
```bash
# Run locally first
pnpm typecheck
pnpm build

# Fix TypeScript errors
# Then push to trigger re-deployment
```

---

**Issue 2: Database Connection Errors**

**Symptoms:**
```
Error: P1001: Can't reach database server
```

**Solution:**
1. Check DATABASE_URL is correct (copy-paste error?)
2. Verify SSL mode: `?sslmode=require`
3. Check firewall rules (Neon allows all by default)
4. Test connection locally: `psql "$DATABASE_URL"`

---

**Issue 3: ML Service Timeout**

**Symptoms:**
```
Error: ML service unavailable (503)
```

**Solution:**
1. Check ML service health: `curl https://ml-service.fly.dev/health`
2. View logs: `flyctl logs`
3. Restart service: `flyctl apps restart americano-ml-service`
4. Check DATABASE_URL is set: `flyctl secrets list`

---

**Issue 4: Redis Connection Fails**

**Symptoms:**
```
Error: ECONNREFUSED
```

**Solution:**
1. Verify REDIS_URL format: `redis://default:token@host:6379`
2. Check TLS is NOT in URL (Upstash handles automatically)
3. Test connection: `redis-cli -u "$REDIS_URL" PING`

---

**Issue 5: Slow API Performance**

**Symptoms:**
```
API response times >500ms
```

**Solution:**
1. Check Redis cache hit rate (should be 65-85%)
2. Enable query logging: `npx prisma studio` → Check slow queries
3. Verify 27 Epic 5 indexes are present: `SELECT * FROM pg_indexes;`
4. Scale database if CPU >80%

---

## 12. Security Hardening

### 12.1 Environment Variables

- [ ] All secrets in Vercel Environment Variables (encrypted)
- [ ] No `.env` files committed to git
- [ ] Rotate secrets quarterly
- [ ] Use separate environments (preview, production)

---

### 12.2 Database Security

- [ ] SSL/TLS enforced (`?sslmode=require`)
- [ ] Firewall rules (Neon: IP allowlist if needed)
- [ ] Least-privilege user accounts
- [ ] Regular security updates

---

### 12.3 API Security

- [ ] Rate limiting (implement in Phase 2)
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints (Zod schemas)
- [ ] Authentication enabled (deferred for MVP, required for multi-user)

---

## 13. Final Production Checklist

### 13.1 Pre-Launch

- [ ] All 5 Epic 5 stories deployed (5.1-5.6)
- [ ] TypeScript build: 0 errors
- [ ] Test suite: All tests pass
- [ ] Performance: Lighthouse 95+ score
- [ ] Accessibility: WCAG AAA (axe DevTools)
- [ ] Database: All 27 indexes present
- [ ] Redis: Cache hit rate 65-85%
- [ ] ML Service: Health check passes
- [ ] Environment variables: All set correctly
- [ ] Custom domain: DNS configured, HTTPS working

---

### 13.2 Post-Launch

- [ ] Monitor errors in Sentry (first 24 hours)
- [ ] Check API response times (target: <200ms P95)
- [ ] Verify cache performance (Redis hit rate)
- [ ] Test on mobile devices (iOS, Android)
- [ ] User acceptance testing (UAT)
- [ ] Create incident response plan
- [ ] Schedule first maintenance window

---

**Document Maintained By**: Wave 4 Deployment Team
**Review Cycle**: After major releases
**Last Deployment**: TBD (Initial production deploy pending)
**Next Review**: After first production deployment
