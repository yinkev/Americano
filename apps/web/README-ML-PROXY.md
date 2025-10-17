# ML Service Proxy Architecture

## Overview

The Next.js application now proxies all ML-related requests to a FastAPI service running on port 8000. This allows us to use Python's superior ML/data science ecosystem while maintaining the Next.js frontend and API layer.

## Architecture

```
User → Next.js API Route (Port 3000) → FastAPI ML Service (Port 8000) → Database
```

### Why This Architecture?

1. **Separation of Concerns**: ML logic in Python, UI/API in TypeScript
2. **Technology Excellence**: Python excels at ML/data science, Next.js excels at web apps
3. **Independent Scaling**: Scale ML service separately from web app
4. **Easy Development**: Run ML service independently for testing

## Environment Configuration

### Required Environment Variables

Add to `/apps/web/.env` and `.env.local`:

```bash
# ML Service (FastAPI)
ML_SERVICE_URL=http://localhost:8000
```

### Example `.env.local` (for local development)

```bash
# Database
DATABASE_URL="postgresql://your_username@localhost:5432/americano"

# Storage
STORAGE_MODE=local
LOCAL_STORAGE_PATH=~/americano-data/pdfs

# AI Services
CHATMOCK_URL=http://localhost:8801
GEMINI_API_KEY=your_gemini_api_key_here

# ML Service (FastAPI)
ML_SERVICE_URL=http://localhost:8000
```

## API Routes Updated

All 7 analytics API routes now proxy to FastAPI:

1. **POST /api/analytics/predictions/generate** → `http://localhost:8000/predictions/generate`
2. **GET /api/analytics/predictions** → `http://localhost:8000/predictions`
3. **GET /api/analytics/interventions** → `http://localhost:8000/interventions`
4. **POST /api/analytics/interventions/[id]/apply** → `http://localhost:8000/interventions/{id}/apply`
5. **POST /api/analytics/predictions/[id]/feedback** → `http://localhost:8000/predictions/{id}/feedback`
6. **GET /api/analytics/model-performance** → `http://localhost:8000/model-performance`
7. **GET /api/analytics/struggle-reduction** → `http://localhost:8000/struggle-reduction`

## Proxy Pattern

Each route follows this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Proxy to FastAPI ML service
    const response = await fetch(`${ML_SERVICE_URL}/endpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'ML service error' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('ML service error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'ML service unavailable',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
```

## Error Handling

The proxy includes graceful degradation:

- **ML Service Down**: Returns 503 with user-friendly error message
- **ML Service Error**: Forwards FastAPI error response with appropriate status code
- **Network Error**: Catches and logs, returns 503
- **Malformed Response**: Fallback error object

## Local Development Setup

### Prerequisites

1. PostgreSQL running on port 5432
2. Next.js app configured (port 3000)
3. FastAPI ML service (port 8000) - **See FastAPI setup guide**

### Step 1: Start Database

```bash
# Ensure PostgreSQL is running
pg_isready

# Verify database exists
psql -l | grep americano
```

### Step 2: Start FastAPI ML Service

```bash
# Navigate to ML service directory
cd /path/to/ml-service

# Install dependencies (first time only)
pip install -r requirements.txt

# Start FastAPI
uvicorn main:app --reload --port 8000
```

**FastAPI should show:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Step 3: Start Next.js App

```bash
# In the web app directory
cd apps/web

# Install dependencies (if needed)
pnpm install

# Start development server
pnpm dev
```

**Next.js should show:**
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
```

### Step 4: Verify ML Service Connection

```bash
# Test ML service directly
curl http://localhost:8000/health

# Test through Next.js proxy
curl http://localhost:3000/api/analytics/model-performance?userId=kevy@americano.dev
```

## Mission Generator Integration

The mission generator (`/apps/web/src/lib/mission-generator.ts`) queries struggle predictions directly from the database (lines 245-293). This is intentional:

- **FastAPI**: Generates predictions, stores in database
- **Mission Generator**: Reads predictions from database, composes missions
- **Benefit**: Mission generation doesn't depend on ML service being online

### Flow:

1. FastAPI generates predictions → Stores in `struggle_predictions` table
2. Mission generator queries `struggle_predictions` → Uses data for mission composition
3. User completes mission → Outcomes captured via FastAPI proxy

## Deprecated TypeScript Subsystems

The following TypeScript files are **no longer used** (replaced by FastAPI):

- `/apps/web/src/subsystems/behavioral-analytics/struggle-detection-engine.ts`
- `/apps/web/src/subsystems/behavioral-analytics/struggle-feature-extractor.ts`
- `/apps/web/src/subsystems/behavioral-analytics/struggle-prediction-model.ts`
- `/apps/web/src/subsystems/behavioral-analytics/intervention-engine.ts`
- `/apps/web/src/subsystems/behavioral-analytics/prediction-accuracy-tracker.ts`
- `/apps/web/src/subsystems/behavioral-analytics/struggle-reduction-analyzer.ts`

**Action**: These can be removed or archived. All ML logic is now in FastAPI.

## Testing

### Test ML Service Directly

```bash
# Health check
curl http://localhost:8000/health

# Generate predictions
curl -X POST http://localhost:8000/predictions/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "kevy@americano.dev", "daysAhead": 7}'

# Get predictions
curl http://localhost:8000/predictions?userId=kevy@americano.dev

# Model performance
curl http://localhost:8000/model-performance?userId=kevy@americano.dev
```

### Test Through Next.js Proxy

```bash
# Generate predictions (via proxy)
curl -X POST http://localhost:3000/api/analytics/predictions/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "kevy@americano.dev", "daysAhead": 7}'

# Get predictions (via proxy)
curl http://localhost:3000/api/analytics/predictions?userId=kevy@americano.dev

# Model performance (via proxy)
curl http://localhost:3000/api/analytics/model-performance?userId=kevy@americano.dev
```

### Test Error Handling

```bash
# Stop FastAPI service, then:
curl http://localhost:3000/api/analytics/predictions?userId=kevy@americano.dev

# Should return:
# {
#   "success": false,
#   "error": "ML service unavailable",
#   "detail": "fetch failed"
# }
```

## Production Deployment

### Environment Variables (Production)

```bash
# Update for production FastAPI URL
ML_SERVICE_URL=https://ml-service.your-domain.com
```

### Deployment Checklist

- [ ] FastAPI deployed and accessible
- [ ] `ML_SERVICE_URL` environment variable set in Next.js deployment
- [ ] Health check endpoint accessible: `https://ml-service.your-domain.com/health`
- [ ] Database accessible from both Next.js and FastAPI services
- [ ] API routes tested through proxy
- [ ] Error handling verified (simulate FastAPI downtime)

### Scaling Considerations

1. **FastAPI Service**: Scale horizontally with load balancer
2. **Next.js App**: Scale independently
3. **Database**: Shared resource, ensure sufficient connections
4. **Monitoring**: Track proxy latency, ML service uptime

## Monitoring

### Key Metrics to Track

1. **ML Service Availability**: Uptime percentage
2. **Proxy Latency**: Time from Next.js → FastAPI → Response
3. **Error Rate**: 503 errors (service unavailable)
4. **Request Volume**: Requests per endpoint
5. **ML Model Performance**: Accuracy, precision, recall (from FastAPI)

### Logging

All proxy errors are logged with:
```typescript
console.error('ML service error:', error)
```

**Recommended**: Integrate with logging service (DataDog, LogRocket, etc.)

## Troubleshooting

### Issue: "ML service unavailable"

**Causes:**
1. FastAPI not running
2. Wrong `ML_SERVICE_URL` in environment
3. Network connectivity issue
4. FastAPI crashed

**Solutions:**
```bash
# Check if FastAPI is running
curl http://localhost:8000/health

# Verify environment variable
echo $ML_SERVICE_URL

# Restart FastAPI
uvicorn main:app --reload --port 8000

# Check FastAPI logs for errors
```

### Issue: "502 Bad Gateway" or "504 Gateway Timeout"

**Causes:**
1. FastAPI processing too slow
2. Database query timeout
3. Deadlock in ML processing

**Solutions:**
```bash
# Check FastAPI logs
# Increase timeout in proxy (if needed)
# Optimize ML model inference
# Check database query performance
```

### Issue: "CORS errors" (if accessing from different origin)

**Solution**: Update FastAPI CORS settings:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Future Enhancements

1. **Request Retry**: Automatic retry for failed requests
2. **Circuit Breaker**: Stop requests if ML service is down
3. **Response Caching**: Cache predictions for faster response
4. **Request Queuing**: Queue ML requests during high load
5. **A/B Testing**: Route % of traffic to experimental ML models

---

## Quick Reference

| Service | Port | URL |
|---------|------|-----|
| Next.js | 3000 | http://localhost:3000 |
| FastAPI | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | localhost:5432 |

**Main Config File**: `/apps/web/.env`

**Proxy Routes**: `/apps/web/src/app/api/analytics/**/*.ts`

**Mission Generator**: `/apps/web/src/lib/mission-generator.ts` (reads DB directly)

---

**Last Updated**: 2025-10-16
**Story**: 5.2 - Predictive Analytics for Learning Struggles
**Architecture**: Next.js (Proxy) → FastAPI (ML) → PostgreSQL
