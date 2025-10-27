# Frontend-Backend Integration Guide

**Status:** Active | **Last Updated:** 2025-10-26 | **Owner:** Kevy

## Overview

The Americano platform uses a **hybrid TypeScript + Python architecture** with a mature, battle-tested integration layer connecting Next.js frontend to FastAPI backend services.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Client)                                               │
│  ├─ React Components                                            │
│  └─ TanStack React Query (Data Fetching)                       │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTP Requests
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│  Next.js 15 (TypeScript)                    Port: 3000          │
│  ├─ App Router Pages & Layouts                                  │
│  ├─ API Routes (Proxy Layer): /app/api/**                      │
│  │  └─ Handle validation, caching, auth                        │
│  ├─ Server Components & Actions                                │
│  └─ Database (Prisma ORM)                                      │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTP Requests
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│  Python FastAPI Services                                        │
│  ├─ Validation API (Epic 4)         Port: 8000                 │
│  │  ├─ src/validation/routes.py                                │
│  │  ├─ src/challenge/routes.py                                 │
│  │  ├─ src/analytics/routes.py                                 │
│  │  └─ src/adaptive/routes.py                                  │
│  └─ ML Service (Epic 5)             Port: 8001                 │
│     └─ Behavioral analytics                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## What's Already In Place ✅

### 1. **Type Generation System** (Pydantic → TypeScript)
- **Script:** `apps/api/scripts/generate_types.py`
- **Output:** `apps/web/src/types/api-generated.ts` (2954 lines, 70KB)
- **Status:** ✅ Working and up-to-date
- **Models Generated:** 76 Pydantic models automatically converted to TypeScript interfaces

**How it works:**
```bash
# Automatic (on build)
npm run build

# Or manual
npm run generate-types
```

### 2. **API Client Utilities**
- **File:** `apps/web/src/lib/api/orchestration-client.ts` (633 lines)
- **Status:** ✅ Comprehensive Zod-based type validation
- **Contains:** 20+ endpoint type definitions with request/response schemas

**Key exports:**
```typescript
- ApiResponseSchema<T>           // Wrapper for all API responses
- RecommendationsRequest        // Request types
- RecommendationsResponse       // Response types
- SessionPlanRequest/Response
- FeedbackRequest/Response
- // ... 20+ more types
```

### 3. **Error Handling & Response Formatting**
- **Files:**
  - `apps/web/src/lib/api-error.ts` - Error handler HOC
  - `apps/web/src/lib/api-response.ts` - Response formatter
- **Status:** ✅ Production-ready with proper HTTP status codes

### 4. **Custom Hooks for Data Fetching**
Hooks in `apps/web/src/hooks/`:
- ✅ `use-study-orchestration.ts` - Core learning data
- ✅ `use-feedback-collection.ts` - User feedback collection
- ✅ `use-search.ts` - Search functionality
- ✅ `use-understanding-analytics.ts` - Analytics data
- ✅ `use-performance-monitoring.ts` - Performance metrics
- ✅ `use-optimistic-mutation.ts` - Optimistic updates
- ✅ `use-first-aid-context.ts` - First Aid content
- ✅ `use-speech-recognition.ts` - Voice input

### 5. **API Route Structure**
Next.js proxy routes in `apps/web/src/app/api/`:
- ✅ `/adaptive/*` - Adaptive learning routes
- ✅ `/analytics/*` - Analytics endpoints
- ✅ `/calendar/*` - Calendar integration
- ✅ `/calibration/*` - Calibration data
- ✅ `/personalization/*` - Personalization engine
- ✅ `/validation/*` - Understanding validation
- ✅ `... 20+ more route groups`

### 6. **Python FastAPI Backend**
- **Status:** ✅ Running on port 8000
- **Routers:**
  - Validation (Epic 4)
  - Challenge (Epic 4)
  - Analytics (Epic 5)
  - Adaptive (Epic 5)
- **Database:** PostgreSQL via SQLAlchemy async
- **CORS:** Configured for Next.js integration

### 7. **Environment Configuration**
- **Frontend:** `apps/web/.env.local`
  ```env
  DATABASE_URL=postgresql://kyin@localhost:5432/americano
  CHATMOCK_URL=http://localhost:8801
  GEMINI_API_KEY=...
  ```
- **Backend:** Uses src/config.py with environment variables

---

## How to Use the Integration

### Phase 1: Starting Both Services

**Terminal 1 - Python FastAPI Backend:**
```bash
cd /Users/kyin/Projects/Americano/apps/api
python -m venv venv  # First time only
source venv/bin/activate
pip install -r requirements.txt  # First time only
python main.py
# → API running on http://localhost:8000
# → Swagger docs: http://localhost:8000/docs
```

**Terminal 2 - Next.js Frontend:**
```bash
cd /Users/kyin/Projects/Americano/apps/web
npm install  # First time only
npm run dev
# → Frontend running on http://localhost:3000
```

**Terminal 3 - Database (Optional):**
```bash
cd /Users/kyin/Projects/Americano/apps/web
npx prisma studio
# → Prisma Studio on http://localhost:5555
```

---

### Phase 2: Using Generated Types in React Components

#### Example 1: Simple Data Fetching with React Query

```typescript
// apps/web/src/components/learning-dashboard.tsx
import { useQuery } from '@tanstack/react-query'
import type { DashboardSummary } from '@/types/api-generated'

export function LearningDashboard({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: async (): Promise<DashboardSummary> => {
      const res = await fetch(`/api/analytics/dashboard?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch dashboard')
      return res.json()
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{data?.summary.learningObjective}</h1>
      <p>Progress: {data?.metrics.overall_progress}%</p>
    </div>
  )
}
```

#### Example 2: Mutation with POST Request

```typescript
// apps/web/src/components/submit-answer.tsx
import { useMutation } from '@tanstack/react-query'
import type { EvaluationResult, EvaluationRequest } from '@/types/api-generated'

export function SubmitAnswer({ promptId }: { promptId: string }) {
  const mutation = useMutation({
    mutationFn: async (answer: string): Promise<EvaluationResult> => {
      const res = await fetch('/api/validation/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id: promptId,
          user_answer: answer,
          confidence_level: 4,
        } as EvaluationRequest),
      })
      if (!res.ok) throw new Error('Evaluation failed')
      return res.json()
    },
    onSuccess: (data) => {
      console.log(`Score: ${data.overall_score}`)
      console.log(`Strengths: ${data.strengths.join(', ')}`)
      console.log(`Gaps: ${data.gaps.join(', ')}`)
    },
  })

  return (
    <div>
      <textarea
        onBlur={(e) => mutation.mutate(e.currentTarget.value)}
        placeholder="Type your answer..."
      />
      {mutation.isPending && <p>Evaluating...</p>}
      {mutation.error && <p>Error: {mutation.error.message}</p>}
    </div>
  )
}
```

#### Example 3: Using Custom Hooks

```typescript
// apps/web/src/components/orchestration-view.tsx
import { useStudyOrchestration } from '@/hooks/use-study-orchestration'

export function OrchestrationView() {
  const { currentMission, nextRecommendations, isLoading } =
    useStudyOrchestration()

  if (isLoading) return <div>Loading orchestration...</div>

  return (
    <div>
      <h2>{currentMission?.title}</h2>
      <ul>
        {nextRecommendations?.map((rec) => (
          <li key={rec.startTime}>
            {rec.startTime} - {rec.reason} (Confidence: {rec.confidence})
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

### Phase 3: Creating New API Endpoints

#### Step 1: Define Pydantic Model (Python Backend)

```python
# apps/api/src/validation/models.py
from pydantic import BaseModel, Field

class CustomEvaluationRequest(BaseModel):
    """Request for custom evaluation endpoint."""
    prompt_id: str = Field(..., description="ID of the prompt")
    user_answer: str = Field(..., min_length=10)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class CustomEvaluationResponse(BaseModel):
    """Response from custom evaluation endpoint."""
    evaluation_id: str
    score: float = Field(..., ge=0, le=100)
    feedback: str
```

#### Step 2: Create FastAPI Route (Python Backend)

```python
# apps/api/src/validation/routes.py
from fastapi import APIRouter, HTTPException
from .models import CustomEvaluationRequest, CustomEvaluationResponse

router = APIRouter(prefix="/validation", tags=["validation"])

@router.post("/custom-evaluate", response_model=CustomEvaluationResponse)
async def custom_evaluate(request: CustomEvaluationRequest) -> CustomEvaluationResponse:
    """Custom evaluation endpoint."""
    # Your logic here
    return CustomEvaluationResponse(
        evaluation_id="eval_123",
        score=85.5,
        feedback="Great answer!",
    )
```

#### Step 3: Regenerate TypeScript Types

```bash
cd /Users/kyin/Projects/Americano/apps/web
npm run generate-types
# → Automatically creates TypeScript interfaces in src/types/api-generated.ts
```

#### Step 4: Create Next.js API Route (Proxy)

```typescript
// apps/web/src/app/api/validation/custom-evaluate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import type {
  CustomEvaluationRequest,
  CustomEvaluationResponse,
} from '@/types/api-generated'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json() as CustomEvaluationRequest

  // Forward to Python backend
  const response = await fetch('http://localhost:8000/validation/custom-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Python API error: ${response.statusText}`)
  }

  const result: CustomEvaluationResponse = await response.json()

  return NextResponse.json(successResponse(result))
})
```

#### Step 5: Use in React Component

```typescript
// apps/web/src/components/custom-evaluation.tsx
import { useMutation } from '@tanstack/react-query'
import type { CustomEvaluationResponse } from '@/types/api-generated'

export function CustomEvaluation() {
  const mutation = useMutation({
    mutationFn: async (answer: string): Promise<CustomEvaluationResponse> => {
      const res = await fetch('/api/validation/custom-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id: 'prompt_123',
          user_answer: answer,
        }),
      })
      return res.json()
    },
  })

  return (
    <div>
      <button onClick={() => mutation.mutate('My answer')}>
        {mutation.isPending ? 'Evaluating...' : 'Submit'}
      </button>
      {mutation.data && (
        <div>
          <p>Score: {mutation.data.score}</p>
          <p>Feedback: {mutation.data.feedback}</p>
        </div>
      )}
    </div>
  )
}
```

---

## Key Files Reference

### Frontend (TypeScript/Next.js)

| File | Purpose | Lines |
|------|---------|-------|
| `apps/web/src/lib/api/orchestration-client.ts` | Zod schemas for all API types | 633 |
| `apps/web/src/types/api-generated.ts` | Auto-generated TypeScript interfaces | 2,954 |
| `apps/web/src/lib/api-error.ts` | Error handling middleware | - |
| `apps/web/src/lib/api-response.ts` | Response formatting | - |
| `apps/web/src/hooks/use-*.ts` | Custom data fetching hooks | 10+ files |
| `apps/web/src/app/api/**` | Next.js proxy routes | 20+ folders |

### Backend (Python/FastAPI)

| File | Purpose |
|------|---------|
| `apps/api/main.py` | FastAPI app setup with CORS |
| `apps/api/src/validation/models.py` | Pydantic models (Story 4.1-4.6) |
| `apps/api/src/validation/routes.py` | API endpoints |
| `apps/api/src/analytics/routes.py` | Analytics endpoints |
| `apps/api/src/challenge/routes.py` | Challenge endpoints |
| `apps/api/src/adaptive/routes.py` | Adaptive learning endpoints |
| `apps/api/scripts/generate_types.py` | Type generation script |

---

## Testing Integration

### Unit Tests (React Components)

```bash
cd apps/web
npm run test:unit
```

### Integration Tests (API + Database)

```bash
cd apps/web
RUN_DB_INTEGRATION=1 npm run test:integration
```

### E2E Tests

```bash
cd apps/web
npm run test:e2e  # Requires Playwright
```

### Manual API Testing

```bash
# Test Python backend directly
curl -X POST http://localhost:8000/validation/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_id": "p1",
    "user_answer": "My answer...",
    "confidence_level": 4
  }'

# Test Next.js proxy
curl -X POST http://localhost:3000/api/validation/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_id": "p1",
    "user_answer": "My answer...",
    "confidence_level": 4
  }'
```

---

## Troubleshooting

### Issue: TypeScript Types Outdated

**Solution:**
```bash
cd apps/web
npm run generate-types
npm run typecheck  # Verify no errors
```

### Issue: "Cannot find module '@/types/api-generated'"

**Solution:**
```bash
# Regenerate types
npm run generate-types

# Check file exists
ls -la src/types/api-generated.ts
```

### Issue: Python Backend Not Responding

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# Restart backend
pkill -f "python main.py"  # Kill old process
python main.py            # Start fresh
```

### Issue: CORS Errors in Browser Console

**Solution:** Backend CORS is configured in `apps/api/main.py`. Check:
1. Frontend is on `http://localhost:3000`
2. Backend CORS origins include `http://localhost:3000`
3. Restart backend after changes

---

## Next Steps

### Immediate (Foundation)

- [ ] Regenerate types: `npm run generate-types`
- [ ] Verify backend health: `curl http://localhost:8000/health`
- [ ] Test a simple query with React Query
- [ ] Create example component using existing hooks

### Short Term (Feature Development)

- [ ] Add new Python Pydantic models
- [ ] Generate TypeScript types
- [ ] Create Next.js proxy routes
- [ ] Build React components with hooks
- [ ] Write integration tests

### Medium Term (Production Readiness)

- [ ] Add request/response logging
- [ ] Implement request retry logic
- [ ] Set up request caching strategies
- [ ] Add performance monitoring
- [ ] Configure rate limiting

---

## Performance Guidelines

### Frontend
- API route responses should be < 200ms
- React Query cache TTL: 5 minutes for most data
- Use `staleTime` for frequently accessed data
- Implement pagination for large datasets

### Backend (Python)
- FastAPI endpoint latency target: < 1 second
- Database queries optimized with indexes
- Use connection pooling (AsyncPG)
- Cache expensive computations

---

## References

- **Type Generation:** `apps/api/scripts/README_TYPE_GENERATION.md`
- **Architecture Decisions:** `docs/architecture/ADR-001-hybrid-typescript-python.md`
- **API Contracts:** `docs/api-contracts.md`
- **Data Models:** `docs/data-models.md`

---

**Status:** Active | **Last Updated:** 2025-10-26 | **Owner:** Kevy

---

## Quick Command Reference

```bash
# Start development environment
cd /Users/kyin/Projects/Americano/apps/api && python main.py &
cd /Users/kyin/Projects/Americano/apps/web && npm run dev &

# Regenerate types after API changes
npm run generate-types

# Run tests
npm run test:unit              # Unit tests
npm run test:integration       # Integration tests
npm run typecheck             # TypeScript check

# Build for production
npm run build
npm run start

# Database operations
npx prisma migrate dev         # Create migration
npx prisma studio             # GUI database browser
npx prisma db seed            # Seed database
```
