# Backend Fixes - Quick Reference Guide

## Three Critical Issues Fixed

### 1. Prisma Client Error: `__assign is not a function`

**Problem:** TypeScript helper library missing from dependencies
**Solution:**
```bash
cd apps/web
pnpm add -D tslib@latest
npx prisma generate
```
**Files Changed:**
- `apps/web/package.json` - Added `tslib@^2.8.1`

**Verification:**
```bash
npm run build  # Should succeed
```

---

### 2. HTTP 405 Errors on GET Endpoints

**Problem:** Missing HTTP method exports in route handlers

**Affected Routes:**
- `GET /api/analytics/patterns/all` - Missing GET export
- `GET /api/analytics/behavioral-insights/goals` - Missing GET export

**Solution:** Added GET export handlers to both files

**Files Changed:**
- `apps/web/src/app/api/analytics/patterns/all/route.ts` - Added GET handler
- `apps/web/src/app/api/analytics/behavioral-insights/goals/route.ts` - Added GET handler

**Pattern for adding GET handler:**
```typescript
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    throw ApiError.badRequest('userId query parameter is required')
  }

  const data = await prisma.model.findMany({
    where: { userId },
  })

  return Response.json(successResponse({ data, count: data.length }))
})
```

---

### 3. ML Service Not Running

**Problem:** FastAPI service failing to start due to configuration error

**Root Cause:** CORS_ORIGINS field type mismatch in Pydantic settings

**Solution:**

Files Changed:
- `apps/ml-service/app/utils/config.py` - Changed CORS_ORIGINS to string with property
- `apps/ml-service/app/main.py` - Updated middleware configuration
- `apps/ml-service/.env` - Ensured correct format

**Start ML Service:**
```bash
cd apps/ml-service
chmod +x start-ml-service.sh
./start-ml-service.sh
```

Or manually:
```bash
cd apps/ml-service
source venv/bin/activate
python -m uvicorn app.main:app --port 8000 --host 0.0.0.0
```

**Verify:**
```bash
curl http://localhost:8000/health
# Expected response:
# {"status":"healthy","service":"ml-service","version":"1.0.0","environment":"development","database":"connected"}
```

---

## How to Verify All Fixes

### 1. Check Prisma Client Compilation
```bash
cd apps/web
npm run build
# Should complete without __assign errors
```

### 2. Check HTTP Methods
```bash
# Test GET endpoints (should return 200 or appropriate error)
curl "http://localhost:3000/api/analytics/patterns/all?userId=user-kevy"
curl "http://localhost:3000/api/analytics/behavioral-insights/goals?userId=user-kevy"

# Test POST endpoints
curl -X POST http://localhost:3000/api/orchestration/recommendations \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-kevy"}'
```

### 3. Check ML Service
```bash
# Health check
curl http://localhost:8000/health

# Should return (all connected):
# {
#   "status": "healthy",
#   "service": "ml-service",
#   "version": "1.0.0",
#   "environment": "development",
#   "database": "connected"
# }
```

---

## Running Local Development

### Terminal 1: ML Service
```bash
cd /Users/kyin/Projects/Americano-epic5/apps/ml-service
chmod +x start-ml-service.sh
./start-ml-service.sh
# Listens on http://localhost:8000
```

### Terminal 2: Next.js App
```bash
cd /Users/kyin/Projects/Americano-epic5/apps/web
pnpm run dev
# Listens on http://localhost:3000 or http://localhost:3001
```

### Terminal 3: Testing
```bash
# Test the endpoints
curl "http://localhost:3000/api/analytics/patterns?userId=user-kevy"
curl "http://localhost:8000/health"
```

---

## Key Files Changed

| File | Change | Status |
|------|--------|--------|
| `apps/web/package.json` | Added tslib devDependency | ✅ |
| `apps/web/src/app/api/analytics/patterns/all/route.ts` | Added GET export | ✅ |
| `apps/web/src/app/api/analytics/behavioral-insights/goals/route.ts` | Added GET export | ✅ |
| `apps/ml-service/app/utils/config.py` | Fixed CORS_ORIGINS parsing | ✅ |
| `apps/ml-service/app/main.py` | Updated CORS middleware | ✅ |
| `apps/ml-service/start-ml-service.sh` | Created startup script | ✅ |

---

## Troubleshooting

### Issue: Prisma Client Still Shows `__assign` Error
**Solution:**
```bash
cd apps/web
rm -rf node_modules/.bin node_modules
pnpm install
npx prisma generate
```

### Issue: ML Service Port 8000 in Use
**Solution:**
```bash
# Find and kill process on port 8000
lsof -i :8000
kill -9 <PID>

# Or use different port
python -m uvicorn app.main:app --port 8001
```

### Issue: Database Connection Failed in ML Service
**Solution:** Verify `.env` file has correct `DATABASE_URL`:
```bash
cat apps/ml-service/.env
# Should show:
# DATABASE_URL=postgresql://kyin@localhost:5432/americano?schema=public
```

### Issue: Next.js 405 Error Still Appears
**Solution:** Clear Next.js cache and rebuild:
```bash
cd apps/web
rm -rf .next
pnpm run build
pnpm run dev
```

---

## Next Steps (Wave 2)

1. **Database Schema Sync**
   - Fix `behavioral_patterns.patternName` mismatch
   - Run `npx prisma migrate dev`

2. **End-to-End Testing**
   - Test all 25+ endpoints with real data
   - Load testing

3. **Performance Optimization**
   - Profile database queries
   - Optimize Prisma queries

---

## Support

For detailed information, see: `EPIC-5-BACKEND-FIXES-WAVE-1.md`

All fixes verified and tested on: **October 20, 2025**
