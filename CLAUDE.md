# Claude Code Guidelines for Americano Project

## Technology Stack Decisions

### Python vs TypeScript Strategy

**Decision Date:** 2025-10-16
**Context:** Epic 4 (Understanding Validation Engine) implementation planning

#### When to Use Python

**Use Python for:**
1. **Research-grade computational analysis**
   - ML-based pattern detection (Story 4.3: Failure Pattern Detector)
   - Statistical analysis with scipy/numpy (Story 4.4: Performance correlation)
   - Natural language processing (Story 4.5: Evidence analysis)

2. **AI/LLM integration requiring structured outputs**
   - instructor library for Pydantic-validated Claude responses
   - Complex prompt engineering with type safety
   - Example: Story 4.5 synthesis validator

3. **Heavy data processing pipelines**
   - Batch analytics jobs
   - Historical data aggregation
   - Performance metrics calculation

4. **Scientific computing**
   - Spaced repetition algorithms (FSRS)
   - Cognitive load modeling
   - Learning curve analysis

**Architecture Pattern:**
- Python services run as **separate FastAPI microservices**
- Communicate with Next.js via REST APIs
- Default port: 8000 (Python), 3000 (Next.js)
- Type safety: Pydantic models serialize to TypeScript interfaces

#### When to Use TypeScript

**Use TypeScript for:**
1. **All web application code**
   - Next.js App Router pages and layouts
   - React components and UI logic
   - Client-side state management (Zustand)
   - Form handling (React Hook Form)

2. **API routes with immediate response requirements**
   - Real-time user interactions (< 200ms)
   - Database CRUD operations (Prisma ORM)
   - Authentication and authorization
   - Session management

3. **Business logic with tight UI integration**
   - Validation schemas (Zod)
   - Client-side calculations
   - Real-time feedback
   - Optimistic updates

**Architecture Pattern:**
- Next.js 15 App Router with TypeScript
- Server Components for data fetching
- Client Components for interactivity
- tRPC for type-safe API layer (if needed)

### Epic-Specific Guidance

#### Epic 3: Adaptive Content Delivery
- **Primary:** Python for recommendation engine, content personalization algorithms
- **Secondary:** TypeScript for API layer, UI components

#### Epic 4: Understanding Validation Engine
- **Story 4.1:** TypeScript (real-time comprehension prompts)
- **Story 4.2:** TypeScript (clinical scenario UI)
- **Story 4.3:** TypeScript (challenge generation) + Python option for pattern detection
- **Story 4.4:** TypeScript (confidence calibration) + Python option for ML-based metacognitive analysis
- **Story 4.5:** **Python primary** (synthesis validator with instructor library)
- **Story 4.6:** TypeScript (quality monitoring dashboard)

#### Epic 5: Advanced Analytics & Insights
- **Primary:** Python for analytics pipeline, ML models, statistical analysis
- **Secondary:** TypeScript for dashboard UI, real-time visualizations

### Rationale

**Why this hybrid approach:**
1. **Python strengths:** Research-grade libraries (scipy, numpy, scikit-learn, instructor), robust ML ecosystem, scientific computing
2. **TypeScript strengths:** Type safety across full stack, excellent Next.js integration, React ecosystem, faster iteration for UI
3. **Reduce tech debt:** Using Python where it excels (ML/stats) prevents reinventing the wheel in TypeScript
4. **Maintainability:** Clear separation of concerns, each language in its sweet spot

---

## Code Quality Standards

### TypeScript Standards
- **Strict mode:** `"strict": true` in tsconfig.json
- **No explicit any:** Use proper types or `unknown`
- **Naming:** camelCase for variables/functions, PascalCase for components/classes
- **File structure:** Group by feature, not by type
- **Async patterns:** Prefer async/await over promises

### Python Standards
- **Type hints:** Required for all function signatures
- **Pydantic models:** All data structures with validation
- **Naming:** snake_case for variables/functions, PascalCase for classes
- **Docstrings:** Google-style for all public functions
- **Async:** Use asyncio for I/O-bound operations

---

## Testing Strategy

### TypeScript Testing
- **Framework:** Vitest (fast, compatible with Next.js 15)
- **Component tests:** React Testing Library
- **E2E tests:** Playwright (when needed)
- **Coverage target:** 70%+ for critical paths

### Python Testing
- **Framework:** pytest
- **Async tests:** pytest-asyncio
- **Coverage target:** 80%+ for ML/analytics code
- **Fixtures:** Shared test data in conftest.py

---

## Integration Patterns

### Python Service ’ TypeScript API

**Example: Story 4.5 Synthesis Validator**

```typescript
// TypeScript API Route (Next.js)
// apps/web/app/api/validation/synthesis/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Call Python service
  const response = await fetch('http://localhost:8000/synthesis/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  return NextResponse.json(result);
}
```

```python
# Python FastAPI Service
# apps/api/src/synthesis/routes.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

@router.post("/synthesis/validate")
async def validate_synthesis(request: SynthesisRequest) -> SynthesisResponse:
    validator = SynthesisValidator()
    result = await validator.validate(request)
    return result
```

### Type Safety Across Boundary

**Pydantic ’ TypeScript:**
1. Define Pydantic model in Python
2. Generate TypeScript interface from Pydantic schema
3. Use Zod on TypeScript side for runtime validation

```python
# Python: Pydantic model
class SynthesisValidationResult(BaseModel):
    is_valid: bool
    confidence: float
    issues: List[ValidationIssue]
```

```typescript
// TypeScript: Generated interface
interface SynthesisValidationResult {
  is_valid: boolean;
  confidence: number;
  issues: ValidationIssue[];
}

// Zod schema for runtime validation
const SynthesisValidationSchema = z.object({
  is_valid: z.boolean(),
  confidence: z.number(),
  issues: z.array(ValidationIssueSchema),
});
```

---

## Performance Guidelines

### TypeScript Performance
- **Database:** Index foreign keys, use Prisma query optimization
- **API routes:** Keep < 200ms for user-facing endpoints
- **Caching:** Redis for frequently accessed data (5-min TTL)
- **Batching:** Use Prisma transactions for multiple operations

### Python Performance
- **ML inference:** < 3 seconds for single prediction
- **Batch processing:** Use async for I/O-bound, multiprocessing for CPU-bound
- **Caching:** functools.lru_cache for pure functions
- **Database:** Connection pooling, read replicas for analytics

---

## Development Workflow

### Local Development
1. **Start Python services:** `cd apps/api && uvicorn main:app --reload --port 8000`
2. **Start Next.js:** `cd apps/web && npm run dev`
3. **Database:** `npx prisma studio` for DB inspection

### Testing Workflow
1. **TypeScript tests:** `npm run test` (Vitest)
2. **Python tests:** `pytest` with coverage
3. **E2E tests:** `npx playwright test` (when ready)

### Deployment
- **Next.js:** Vercel (automatic)
- **Python services:** Docker ’ Cloud Run / Lambda
- **Database:** PostgreSQL on managed service (e.g., Supabase, Neon)

---

## Epic 4 Context Files Generated

All Epic 4 stories now have complete context XMLs:
-  `docs/stories/story-context-4.1.xml` (30KB, TypeScript)
-  `docs/stories/story-context-4.2.xml` (23KB, TypeScript)
-  `docs/stories/story-context-4.3.xml` (9.5KB, TypeScript + Python option)
-  `docs/stories/story-context-4.4.xml` (36KB, TypeScript + Python option)
-  `docs/stories/story-context-4.5.xml` (48KB, Python primary + TypeScript integration)
-  `docs/stories/story-context-4.6.xml` (32KB, TypeScript)

**Next Steps:**
1. Review context XMLs for accuracy
2. Run `*story-ready` workflow to mark stories ready for development
3. Begin implementation with Story 4.1 (foundation)

---

## Notes
- **This is a living document.** Update as architectural decisions evolve.
- **Principle:** Use the right tool for the job, minimize tech debt, maximize maintainability.
- **When in doubt:** Start with TypeScript (better Next.js integration), migrate to Python if heavy computation needed.
