# Americano - Project Documentation

## Critical Development Standards

### Analytics Implementation Standards
**Status:** ACTIVE | **Date Established:** 2025-10-16

**Quality Bar:**
- **World-class excellence** - Research-grade quality standards
- **Technology Stack:** Python
- All analytics features, subsystems, and components must meet this standard

**Application Scope:**
- Behavioral analytics subsystems
- Machine learning models
- Data analysis pipelines
- Prediction engines
- Statistical analysis components

---

## Project Context

This is the Americano adaptive learning platform, integrating Epic 4 (Understanding Validation Engine) and Epic 5 (Behavioral Twin Engine) with advanced analytics capabilities.

---

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

#### Epic 4: Understanding Validation Engine (HYBRID ARCHITECTURE - UPDATED 2025-10-16)

**Decision:** Setup Python FastAPI service NOW (Story 4.1) to serve ALL Epic 4 AI evaluation needs

**Rationale:**
- **One-time setup cost:** ~30 minutes to scaffold Python service
- **Reused across:** All 6 Epic 4 stories (4.1-4.6)
- **ROI:** Setup once, eliminates reimplementation across 6 stories
- **Future-proof:** Easy to add scipy, scikit-learn, instructor as needed

**Story Breakdown:**
- **Story 4.1:** **HYBRID** - Python (AI evaluation, prompt generation with `instructor`) + TypeScript (UI, session integration, API proxy)
- **Story 4.2:** **HYBRID** - Python (clinical reasoning evaluation, competency scoring) + TypeScript (scenario UI, session flow)
- **Story 4.3:** **HYBRID** - Python (failure pattern detection, challenge generation) + TypeScript (UI, retry scheduling)
- **Story 4.4:** **HYBRID** - Python (scipy Pearson correlation, calibration analytics) + TypeScript (UI, charts)
- **Story 4.5:** **Python primary** - Python (IRT algorithms via scipy, adaptive difficulty) + TypeScript (UI integration)
- **Story 4.6:** **HYBRID** - Python (ML-based insights, predictive analytics) + TypeScript (dashboard UI, charts)

**Python Service Responsibilities:**
- All ChatMock/GPT-5 AI evaluation (structured outputs via `instructor` + Pydantic)
- Prompt generation with variation
- Scoring calculations (rubric-based, statistical)
- Pattern detection and analytics
- Future ML/statistical analysis (scipy, scikit-learn)

**TypeScript Responsibilities:**
- All UI components (Dialogs, Charts, Forms)
- Next.js API routes (proxy to Python service)
- Session orchestration and state management
- Prisma database operations
- Real-time user interactions

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

### Python Service → TypeScript API

**Architecture Overview:**
```
User → Next.js UI (TypeScript) → Next.js API Route (TypeScript proxy) → Python FastAPI Service → ChatMock/GPT-5
                                                                              ↓
                                                                         Pydantic Models
                                                                              ↓
                                                                    TypeScript Interfaces (Zod)
```

**Example: Story 4.1 Comprehension Evaluation (EPIC 4 PATTERN)**

```typescript
// TypeScript API Route (Next.js) - Proxy to Python service
// apps/web/app/api/validation/evaluate/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { promptId, userAnswer, confidenceLevel } = body;

  // Call Python FastAPI service
  const response = await fetch('http://localhost:8000/validation/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt_id: promptId,
      user_answer: userAnswer,
      confidence_level: confidenceLevel,
    }),
  });

  if (!response.ok) {
    throw new Error('Python service evaluation failed');
  }

  const result = await response.json();

  // Save to database via Prisma
  await prisma.validationResponse.create({
    data: {
      promptId,
      userAnswer,
      aiEvaluation: result,
      score: result.overall_score,
      confidence: confidenceLevel,
    },
  });

  return NextResponse.json(result);
}
```

```python
# Python FastAPI Service - AI Evaluation Engine
# apps/api/src/validation/routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from instructor import from_openai
from openai import OpenAI

router = APIRouter()
client = from_openai(OpenAI())

class EvaluationRequest(BaseModel):
    prompt_id: str
    user_answer: str
    confidence_level: int = Field(..., ge=1, le=5)

class EvaluationResult(BaseModel):
    overall_score: int = Field(..., ge=0, le=100)
    terminology_score: int = Field(..., ge=0, le=100)
    relationships_score: int = Field(..., ge=0, le=100)
    application_score: int = Field(..., ge=0, le=100)
    clarity_score: int = Field(..., ge=0, le=100)
    strengths: list[str]
    gaps: list[str]
    calibration_delta: float
    calibration_note: str

@router.post("/validation/evaluate")
async def evaluate_comprehension(request: EvaluationRequest) -> EvaluationResult:
    """
    Evaluate user's explanation using ChatMock/GPT-5 with structured output.
    Uses instructor library for Pydantic-validated responses.
    """
    system_prompt = """You are a medical education expert evaluating a medical student's explanation.
    Evaluate on 4 dimensions:
    1. Terminology (20%): Correct medical terms used appropriately
    2. Relationships (30%): Demonstrates connections between concepts
    3. Application (30%): Applies knowledge to clinical scenarios
    4. Clarity (20%): Patient-friendly language without losing accuracy

    Provide scores (0-100), strengths (2-3 points), and gaps (2-3 points).
    """

    try:
        # Use instructor for structured output
        evaluation = client.chat.completions.create(
            model="gpt-4",  # GPT-5 when available
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Evaluate this explanation:\n\n{request.user_answer}"}
            ],
            response_model=EvaluationResult,
            temperature=0.3,
            max_tokens=2000,
        )

        # Calculate calibration
        confidence_normalized = (request.confidence_level - 1) * 25  # 1-5 → 0-100
        calibration_delta = confidence_normalized - evaluation.overall_score

        if calibration_delta > 15:
            calibration_note = "You felt more confident than your explanation showed - beware overconfidence!"
        elif calibration_delta < -15:
            calibration_note = "Your understanding is stronger than you think - trust yourself!"
        else:
            calibration_note = "Your confidence matches your comprehension - well calibrated!"

        evaluation.calibration_delta = calibration_delta
        evaluation.calibration_note = calibration_note

        return evaluation

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
```

### Type Safety Across Boundary

**Pydantic → TypeScript:**
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
1. **Start Python FastAPI service:** `cd apps/api && uvicorn main:app --reload --port 8000`
2. **Start Next.js:** `cd apps/web && npm run dev` (port 3000)
3. **Database:** `npx prisma studio` for DB inspection

**Quick Start (Both Services):**
```bash
# Terminal 1 - Python service
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 - Next.js
cd apps/web
npm run dev

# Terminal 3 - Database (optional)
npx prisma studio
```

### Testing Workflow
1. **TypeScript tests:** `npm run test` (Vitest)
2. **Python tests:** `pytest` with coverage
3. **E2E tests:** `npx playwright test` (when ready)

### Deployment
- **Next.js:** Vercel (automatic)
- **Python services:** Docker → Cloud Run / Lambda
- **Database:** PostgreSQL on managed service (e.g., Supabase, Neon)

---

## Multi-Worktree Development Strategy

**Discovery Date:** 2025-10-16 (during Story 4.2 implementation)

### Active Git Worktrees

The Americano project uses **git worktrees** for parallel epic development:

```bash
git worktree list
# Output:
# /Users/kyin/Projects/Americano        9edf263c [main]
# /Users/kyin/Projects/Americano-epic3  7ccf0451 [feature/epic-3-knowledge-graph]
# /Users/kyin/Projects/Americano-epic4  e98a2124 [feature/epic-4-understanding-validation]
# /Users/kyin/Projects/Americano-epic5  a619dd1c [feature/epic-5-behavioral-twin]
```

**Current Structure:**
- **Main worktree:** `/Users/kyin/Projects/Americano` (branch: `main`)
- **Epic 3 worktree:** `/Users/kyin/Projects/Americano-epic3` (branch: `feature/epic-3-knowledge-graph`)
- **Epic 4 worktree:** `/Users/kyin/Projects/Americano-epic4` (branch: `feature/epic-4-understanding-validation`)
- **Epic 5 worktree:** `/Users/kyin/Projects/Americano-epic5` (branch: `feature/epic-5-behavioral-twin`)

### Shared Database Constraints

**Critical Finding:** All worktrees share the **same PostgreSQL database** (`postgresql://kyin@localhost:5432/americano`)

**Implications:**

1. **Schema Drift Detection**
   - Prisma migrations detect drift when multiple worktrees modify schema
   - Error: "Your database schema is not in sync with your migration history"
   - Cause: Epic 3, 4, and 5 all adding models simultaneously

2. **Migration Strategy**
   - ❌ **DON'T:** Run `prisma migrate dev` in multi-worktree setup (fails with drift errors)
   - ✅ **DO:** Use `prisma db push --skip-generate` to apply schema changes directly
   - ⚠️ **COORDINATE:** Communicate schema changes across epic teams to avoid conflicts

3. **Best Practices**
   - Each worktree runs its own Next.js dev server (different ports)
   - Each worktree can run its own Python FastAPI service (different ports)
   - **Database schema changes require coordination** between epics
   - Consider using separate databases per epic for true isolation (e.g., `americano_epic3`, `americano_epic4`)

### Port Allocation

**Recommended port strategy for parallel development:**

| Service | Epic 3 | Epic 4 | Epic 5 |
|---------|--------|--------|--------|
| Next.js | 3000 | 3001 | 3002 |
| Python FastAPI | 8000 | 8001 | 8002 |
| Prisma Studio | 5555 | 5556 | 5557 |

**Example commands:**
```bash
# Epic 4 - Next.js on port 3001
cd /Users/kyin/Projects/Americano-epic4/apps/web
PORT=3001 npm run dev

# Epic 4 - Python on port 8001
cd /Users/kyin/Projects/Americano-epic4/apps/api
uvicorn main:app --reload --port 8001

# Epic 4 - Prisma Studio on port 5556
cd /Users/kyin/Projects/Americano-epic4/apps/web
npx prisma studio --port 5556
```

### Alternative: Separate Databases Per Epic

**Setup separate databases for true isolation:**

```bash
# Create databases
createdb americano_epic3
createdb americano_epic4
createdb americano_epic5

# Epic 4 .env
DATABASE_URL="postgresql://kyin@localhost:5432/americano_epic4"

# Run migrations independently
npx prisma migrate dev
```

**Trade-offs:**
- ✅ **Pro:** No schema conflicts, independent migration history
- ✅ **Pro:** Each epic can evolve schema independently
- ❌ **Con:** Data not shared across epics (may need seed scripts)
- ❌ **Con:** More complex to merge back to main (schema conflicts at merge time)

---

## Epic 4 Context Files Generated

All Epic 4 stories now have complete context XMLs:
- ✅ `docs/stories/story-context-4.1.xml` (30KB, TypeScript)
- ✅ `docs/stories/story-context-4.2.xml` (23KB, TypeScript)
- ✅ `docs/stories/story-context-4.3.xml` (9.5KB, TypeScript + Python option)
- ✅ `docs/stories/story-context-4.4.xml` (36KB, TypeScript + Python option)
- ✅ `docs/stories/story-context-4.5.xml` (48KB, Python primary + TypeScript integration)
- ✅ `docs/stories/story-context-4.6.xml` (32KB, TypeScript)

---

## Notes
- **This is a living document.** Update as architectural decisions evolve.
- **Principle:** Use the right tool for the job, minimize tech debt, maximize maintainability.
- **When in doubt:** Start with TypeScript (better Next.js integration), migrate to Python if heavy computation needed.

---

## Epic 4 Implementation Strategy (ADDED 2025-10-16)

### Architecture Decision: Hybrid TypeScript + Python with Parallel AI Agent Execution

**See `docs/ARCHITECTURE-DECISION-EPIC4.md` for complete rationale**

**Status**: ✅ All 6 Epic 4 stories marked Ready (100% preparation complete)

**Agent Assignment for Parallel Execution** (UPDATED for Hybrid Architecture):

**Story 4.1 - Two Agents in Parallel:**
1. `python-development:fastapi-pro` - Setup FastAPI service + validation evaluation endpoints
2. `javascript-typescript:typescript-pro` - TypeScript UI + API proxy + session integration

**Stories 4.2-4.6 - Same Pattern:**
- Each story uses BOTH agents (Python for AI/ML logic, TypeScript for UI/integration)
- Python service already exists from Story 4.1 setup (just add new endpoints)
- TypeScript handles all UI components and Prisma database operations

**Critical Workflow Reminders for AI Agents**:
- ✅ ALWAYS read CLAUDE.md first (technology decisions)
- ✅ ALWAYS read AGENTS.md (agent protocols)
- ✅ ALWAYS use context7 for updated documentation
- ✅ ALWAYS load story-context-4.X.xml for implementation guidance

**Timeline**: 4-6 weeks (parallel execution)
