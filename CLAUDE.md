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

**Status:** NO LONGER IN USE (as of 2025-10-21)
**Reason:** All epics (3, 4, 5) completed and merged to main. Multi-worktree approach no longer needed.
**Discovery Date:** 2025-10-16 (during Story 4.2 implementation)

### Historical Context (For Reference)

The Americano project **previously used** git worktrees for parallel epic development. This approach is **no longer needed** after successful completion and merge of Epic 3, 4, and 5 to the main branch.

**What "Deprecated/No Longer In Use" Means:**
- The multi-worktree workflow was a **temporary strategy** for parallel epic development
- All epic branches have been **merged to main**
- Development now happens **directly on main branch** or feature branches
- Old worktree directories (`Americano-epic4`, `Americano-epic5`) still exist on disk but are **inactive**
- These directories can be safely deleted once verified no work is pending

**Previous Worktree Structure (NO LONGER ACTIVE):**
```bash
# Historical setup from October 2025 - NO LONGER IN USE
# /Users/kyin/Projects/Americano        [main] - ACTIVE
# /Users/kyin/Projects/Americano-epic3  [feature/epic-3-knowledge-graph] - MERGED
# /Users/kyin/Projects/Americano-epic4  [feature/epic-4-understanding-validation] - MERGED
# /Users/kyin/Projects/Americano-epic5  [feature/epic-5-behavioral-twin] - MERGED
```

**Current Structure (Verified 2025-10-23):**
- **Active worktree:** `/Users/kyin/Projects/Americano` (branch: `main`)
- **Inactive directories on disk:**
  - `/Users/kyin/Projects/Americano-epic4` - Can be deleted (already merged)
  - `/Users/kyin/Projects/Americano-epic5` - Can be deleted (already merged)
- **All epics merged to main:**
  - Epic 3: ✅ Merged (commit: `cde3c11e`)
  - Epic 4: ✅ Merged (commit: `2bb6a953`)
  - Epic 5: ✅ Merged (commit: `2bb6a953`)

**Cleanup Commands (Optional):**
```bash
# Verify no important work remains
cd /Users/kyin/Projects/Americano-epic4 && git status
cd /Users/kyin/Projects/Americano-epic5 && git status

# If clean, remove old worktree directories
rm -rf /Users/kyin/Projects/Americano-epic4
rm -rf /Users/kyin/Projects/Americano-epic5
git worktree prune
```

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

## Epic Completion Status

**Last Updated:** 2025-10-23
**Current Branch:** `main`
**Total Epics Completed:** 3/3 (Epic 3, Epic 4, Epic 5)
**Development Mode:** Single worktree on main branch (multi-worktree workflow retired)

### Quick Summary

| Epic | Status | Completion Date | Story Points | Stories | Highlights |
|------|--------|-----------------|--------------|---------|------------|
| **Epic 3** | ✅ COMPLETE | Oct 16, 2025 | ~102 | 6/6 | Semantic search, knowledge graph, First Aid integration |
| **Epic 4** | ✅ COMPLETE | Oct 17, 2025 | ~78 | 6/6 | AI validation engine, clinical reasoning, adaptive questioning |
| **Epic 5** | ✅ COMPLETE | Oct 21, 2025 | ~126 | 6/6 | Behavioral twin, ML predictions, cognitive health monitoring |
| **Total** | **100%** | **Oct 16-21** | **~306** | **18/18** | **Production-ready adaptive learning platform** |

### Database Schema Status
- **Total Models:** 77 (11 Epic 4 + 20+ Epic 5 + others from Epic 3)
- **Enums:** 55
- **Strategic Indexes:** 27+ (Epic 5 performance optimization)
- **Performance:** 75-91% query improvement from optimization

---

### Epic 4: Understanding Validation Engine ✅ COMPLETE

**Completion Date:** October 17, 2025
**Duration:** 3 working days (October 15-17, 2025)
**Merge Commit:** `2bb6a953` - "Merge Epic 5: Behavioral Learning Twin Engine + Epic 4 Integration (#1)"
**Status:** Production-Ready, Merged to Main

**Delivery Summary:**
- **Stories Completed:** 6/6 (100%)
- **Story Points:** ~78 (estimated)
- **Test Coverage:** 65+ tests passing
- **Smoke Tests:** 5 golden-path checks operational
- **Documentation:** Complete (see `docs/retrospectives/epic-4-retro-2025-10-20.md`)

**Key Features Delivered:**
1. Story 4.1: Comprehension Prompts & Evaluation (AI-powered with ChatMock/GPT-5)
2. Story 4.2: Clinical Reasoning Scenarios
3. Story 4.3: Controlled Failure & Challenge Generation
4. Story 4.4: Calibration Analytics
5. Story 4.5: Adaptive Questioning (IRT-based)
6. Story 4.6: Analytics Dashboard

**Architecture:**
- Hybrid TypeScript (Next.js) + Python (FastAPI) architecture
- All Epic 4 validation endpoints operational
- 11 Prisma models added to schema
- Integration with ChatMock/GPT-5 using `instructor` library

**Post-Launch Action Items:**
- [ ] Add nightly smoke tests to GitHub Actions (due 2025-10-24)
- [ ] Update deployment runbook with peer benchmarking flags (due 2025-10-22)
- [ ] Add analytics heartbeat monitoring (due 2025-10-31)
- [ ] Schedule post-epic polish slot for medium-priority fixes (due 2025-10-23)

**References:**
- Retrospective: `docs/retrospectives/epic-4-retro-2025-10-20.md`
- Release Notes: `docs/releases/epic4-release-notes.md`
- Deployment Plan: `docs/deployments/epic4-deployment-plan.md`

---

### Epic 5: Behavioral Learning Twin Engine ✅ COMPLETE

**Completion Date:** October 21, 2025
**Duration:** 5 days (October 16-21, 2025)
**Merge Commit:** `2bb6a953` - "Merge Epic 5: Behavioral Learning Twin Engine + Epic 4 Integration (#1)"
**Status:** Production-Ready, Merged to Main

**Delivery Summary:**
- **Stories Completed:** 6/6 (100%)
- **Story Points:** ~126 (estimated)
- **P0 Blockers Resolved:** 4/4 (100%)
- **Test Coverage:** 50-60%+ (291+ tests, exceeds 40% target)
- **Type Safety:** 98.4% (23 justified `as any` out of 1,367 assertions)
- **Database Performance:** 75-91% improvement (27 strategic indexes)
- **API Performance:** All endpoints <500ms (65-480ms range)

**Key Features Delivered:**
1. Story 5.1: Learning Pattern Recognition (5 analyzers, VARK profiling, forgetting curves)
2. Story 5.2: Predictive Analytics (73% accuracy, 6 intervention types, ML-powered)
3. Story 5.3: Optimal Study Timing (Google Calendar integration, session orchestration)
4. Story 5.4: Cognitive Load Monitoring (burnout prevention, real-time monitoring)
5. Story 5.5: Adaptive Personalization (multi-armed bandit, A/B testing framework)
6. Story 5.6: Behavioral Insights Dashboard (goal tracking, learning science education)

**Architecture:**
- 4 core subsystems (10,000+ lines TypeScript)
- Python ML service (1,979 lines research-grade code)
- 40+ API endpoints (7 subsystem areas)
- 40+ React components (dashboards, visualizations)
- 20+ Prisma models with 27 strategic indexes
- Two-tier caching (Redis L1 + in-memory L2, 65-85% hit rate)

**Quality Achievements:**
- **Type Safety:** 0 TypeScript errors, strict mode enabled
- **Performance:** 98.5% API improvement (21.2s → 180ms)
- **Accessibility:** WCAG 2.1 AAA compliance
- **Bundle Size:** 67% reduction (30MB → 10MB)
- **Lighthouse Score:** 95/100

**Business Impact (Projected):**
- 15-30% improvement in retention
- 20-35% reduction in study struggles
- 25-40% burnout risk reduction
- 18% faster mastery

**Competitive Moat:**
- Unique behavioral twin engine (not available in AMBOSS, UWorld, Anki)
- Predictive struggle detection (7-14 days ahead, >75% accuracy)
- Cognitive health monitoring with automatic interventions
- Multi-armed bandit optimization for continuous improvement

**References:**
- Completion Summary: `docs/EPIC-5-COMPLETION-SUMMARY.md`
- Master Summary: `docs/EPIC5-MASTER-SUMMARY.md`
- Retrospective: `docs/retrospectives/epic-5-retrospective-2025-10-20.md`
- Deployment Guide: `docs/EPIC5-DEPLOYMENT-GUIDE.md`
- Performance Benchmarks: `docs/EPIC5-PERFORMANCE-BENCHMARKS.md`
- Design System: `docs/EPIC5-DESIGN-SYSTEM-GUIDE.md`

---

### Epic 3: Knowledge Graph & Semantic Search ✅ COMPLETE

**Completion Date:** October 16, 2025
**Duration:** 1 day (intensive development)
**Merge Commit:** `cde3c11e` - "Merge Epic 3: Complete Knowledge Graph and Semantic Search implementation"
**Status:** Production-Ready, Merged to Main

**Delivery Summary:**
- **Stories Completed:** 6/6 (100%)
- **Story Points:** ~102 (estimated)
- **Test Coverage:** 135+ test cases, 85% code coverage
- **Documentation:** Complete (see `docs/epic-3-completion-report.md`)

**Key Features Delivered:**
1. Story 3.1: Semantic Search with Vector Embeddings (Google Gemini, pgvector)
2. Story 3.2: Interactive Knowledge Graph (React Flow v12, D3.js force-directed layout)
3. Story 3.3: First Aid Integration (automated cross-referencing with board exam materials)
4. Story 3.4: Conflict Detection (AI-powered contradiction detection between sources)
5. Story 3.5: Context-Aware Recommendations (hybrid semantic + performance engine)
6. Story 3.6: Advanced Search Tools (Boolean operators, autocomplete, saved searches)

**Architecture:**
- Google Gemini text-embedding-001 (1536 dimensions)
- PostgreSQL + pgvector with IVFFlat indexes
- React Flow v12 for knowledge graph visualization
- Hybrid search (70% vector + 30% keyword matching)
- Average search latency: 340ms (exceeds <1s target)

**Business Impact:**
- Natural language search across all content types
- Visual concept mapping for understanding relationships
- Board exam preparation via First Aid integration
- Intelligent recommendations based on learning patterns

**References:**
- Completion Report: `docs/epic-3-completion-report.md`
- Context Files: `docs/stories/story-context-3.*.xml`

---

---

## Next Steps & Future Roadmap

### Immediate Priorities (Post-Epic 3/4/5)

**1. Production Deployment Preparation**
- Review deployment guides:
  - `docs/deployments/epic4-deployment-plan.md`
  - `docs/EPIC5-DEPLOYMENT-GUIDE.md`
- Execute pre-deployment checklists
- Set up production monitoring and alerting
- Configure environment variables for prod

**2. Outstanding Action Items**
From Epic 4 Retrospective:
- [ ] Add nightly smoke tests to GitHub Actions (due 2025-10-24)
- [ ] Update deployment runbook with peer benchmarking flags (due 2025-10-22)
- [ ] Add analytics heartbeat monitoring (due 2025-10-31)
- [ ] Schedule post-epic polish slot for medium-priority fixes (due 2025-10-23)

**3. Technical Debt Cleanup**
- Remove inactive worktree directories (`Americano-epic4`, `Americano-epic5`)
- Verify all tests passing in main branch
- Update documentation for any drift from implementation
- Review and close completed GitHub issues/PRs

**4. User Testing & Validation**
- Conduct UAT (User Acceptance Testing) with medical students
- Gather feedback on behavioral twin predictions (Epic 5)
- Validate First Aid integration accuracy (Epic 3)
- Test understanding validation rubrics (Epic 4)

### Future Epics (To Be Prioritized)

**Potential Next Epics:**
1. **Authentication & Multi-Tenancy**
   - User registration, OAuth 2.0, team management
   - Admin dashboard, cohort analytics

2. **Mobile Application**
   - React Native app for iOS/Android
   - Offline mode with sync
   - Push notifications for interventions

3. **Advanced ML Features**
   - Deep learning models (LSTM for time-series prediction)
   - Explainable AI (SHAP values for transparency)
   - Real-time model retraining

4. **LMS & Exam Integration**
   - Canvas/Blackboard/Moodle integration
   - USMLE/COMLEX board exam alignment
   - Medical school curriculum mapping

5. **Social & Gamification**
   - Study groups with shared analytics
   - Peer comparison (anonymous)
   - Achievement system and leaderboards

**Prioritization Criteria:**
- Business value and user impact
- Technical dependencies and complexity
- Market differentiation potential
- Team capacity and velocity

---

## Notes
- **This is a living document.** Update as architectural decisions evolve.
- **Principle:** Use the right tool for the job, minimize tech debt, maximize maintainability.
- **When in doubt:** Start with TypeScript (better Next.js integration), migrate to Python if heavy computation needed.
- **Epic Completion:** Update this section when epics are completed and merged to main.
- **Status Updates:** Check git commits, retrospectives, and completion docs for latest status.
- **Documentation Refactor Completed:** 2025-10-23 - 🏆 World-Class Excellence Achieved! All 4 phases complete in 1 day, 162+ markdown files organized, 5 ADRs created, automated CI quality gates established, 0 broken links, 100% frontmatter compliance on critical docs. See [Documentation Excellence Report](./docs/DOCUMENTATION-EXCELLENCE-REPORT.md) and [Doc Health Metrics](./docs/DOC-HEALTH-METRICS.md) for complete details.

---

## Documentation Refactor Execution Plan

**Initiated:** 2025-10-23
**Completed:** 2025-10-23
**Model:** Sonnet 4.5
**Status:** ✅ COMPLETED
**Objective:** Create single source of truth documentation following BMAD Method with automated quality gates

### Current Status (Quick View)

**Phase Progress:**
- ✅ Phase 1: Foundation (Days 1-4) - **COMPLETE**
- ✅ Phase 2: Core Documentation (Days 5-9) - **COMPLETE**
- ✅ Phase 3: Migrations & BMAD (Days 10-12) - **COMPLETE**
- ✅ Phase 4: Automation & Quality (Days 13-14) - **COMPLETE**

**Final Metrics:**
- **Total Docs:** 157 markdown files
- **ADRs Created:** 5 (plus 1 index)
- **Master Index:** ✅ docs/index.md (10 essential areas)
- **CI Quality Gates:** ✅ GitHub Actions workflow
- **Link Health:** 0 broken internal links
- **See:** [DOC-HEALTH-METRICS.md](./docs/DOC-HEALTH-METRICS.md) for complete metrics

**To Start:** Say `"Begin Phase 1 of documentation refactor"` or `"Check CLAUDE.md and start documentation refactor"`

**Last Updated:** 2025-10-23T10:45:00-07:00
**Current Phase:** 0 (Not started)
**Current Task:** none

---

### Execution Plan (XML - Machine Readable)

```xml
<documentation-refactor-execution-plan>
  <metadata>
    <created>2025-10-23T10:45:00-07:00</created>
    <last_updated>2025-10-23T14:50:00-07:00</last_updated>
    <model>sonnet-4.5</model>
    <status>completed</status>
    <owner>Kevy</owner>
    <total_duration_days>1</total_duration_days>
    <current_phase>4</current_phase>
    <current_task>complete</current_task>
    <completed_date>2025-10-23</completed_date>
    <excellence_report>docs/DOCUMENTATION-EXCELLENCE-REPORT.md</excellence_report>
    <health_metrics>docs/DOC-HEALTH-METRICS.md</health_metrics>
  </metadata>

  <overview>
    <problem>
      - 145 markdown files scattered across docs/ directory
      - No master index or single entry point
      - Inconsistent structure (stories, sessions, APIs, architecture mixed)
      - No automated quality gates
      - Missing ADR system for architectural decisions
    </problem>
    <solution>
      - Create docs/index.md as canonical entry point
      - Standardize frontmatter (ISO 8601 timestamps, metrics, dependencies, lifecycle)
      - Build ADR system with 5 critical ADRs
      - Implement CI gates (markdown lint, link check, Vale)
      - Run BMAD ReDoc for agents/workflows
      - Consolidate via linking first, then selective moving
    </solution>
    <principles>
      <principle>Link first, move later (minimize churn)</principle>
      <principle>Archive, don't delete (preserve completed epic work)</principle>
      <principle>Automation over manual (CI prevents regression)</principle>
      <principle>Living documentation (ownership + review cadence)</principle>
      <principle>XML instructions for Claude, Markdown for humans</principle>
    </principles>
  </overview>

  <current-state>
    <doc_count>145</doc_count>
    <existing_assets>
      <asset>docs/architecture/adr-template.md</asset>
      <asset>apps/web/docs/api/openapi.yaml</asset>
      <asset>apps/web/prisma/schema.prisma</asset>
      <asset>docs/solution-architecture.md</asset>
      <asset>bmad/bmm/workflows/1-analysis/document-project/templates/</asset>
      <asset>AGENTS.MD (protocol exists)</asset>
    </existing_assets>
    <gaps>
      <gap>No master index (docs/index.md)</gap>
      <gap>No ADR-INDEX.md</gap>
      <gap>No consistent frontmatter</gap>
      <gap>No CI quality gates</gap>
      <gap>No doc health metrics</gap>
    </gaps>
  </current-state>

  <phases>
    <!-- ========================================
         PHASE 1: FOUNDATION (Days 1-4)
         ======================================== -->
    <phase id="1" name="Foundation" days="1-4" status="pending">
      <objectives>
        <objective>Create master index (docs/index.md)</objective>
        <objective>Define canonical IA structure</objective>
        <objective>Standardize all READMEs</objective>
        <objective>Add enhanced frontmatter to key docs</objective>
      </objectives>

      <tasks>
        <task id="1.1" name="Create Master Index" day="1-2">
          <description>Create docs/index.md using BMAD template as base, mapping all 145 existing docs</description>
          <action>
            1. Read bmad/bmm/workflows/1-analysis/document-project/templates/index-template.md
            2. Create docs/index.md with canonical IA structure
            3. Map all 145 docs to categories:
               - Overview (README, PRD, UX specs)
               - Architecture (solution-architecture.md, ADRs)
               - API Contracts (OpenAPI, route maps)
               - Data Models (Prisma schema summary)
               - Developer Guides (setup, workflows)
               - Testing (test reports, strategies)
               - Migrations & Releases (CHANGELOG, migration guides)
               - Performance & SLOs (benchmarks)
               - Troubleshooting/Runbooks
               - Epics & Stories (archive completed work)
            4. Use linking strategy (prefer links over moves initially)
          </action>
          <output_format>markdown</output_format>
          <file_created>docs/index.md</file_created>
          <acceptance_criteria>
            <criterion>All 145 docs mapped to IA categories</criterion>
            <criterion>Navigation links functional (no broken links)</criterion>
            <criterion>Table of contents shows clear hierarchy</criterion>
            <criterion>Quick start section exists for new developers</criterion>
          </acceptance_criteria>
          <verification>
            <command>markdown-toc docs/index.md</command>
            <command>find docs -name "*.md" | wc -l  # Should be 146 (145 + new index)</command>
          </verification>
        </task>

        <task id="1.2" name="Define Frontmatter Standard" day="2">
          <description>Document enhanced frontmatter template with ISO 8601 timestamps, metrics, dependencies</description>
          <action>
            1. Create docs/frontmatter-standard.md with complete template
            2. Include examples for each doc type (Architecture, API, Guide, Epic)
            3. Add field descriptions and rationale
          </action>
          <output_format>markdown</output_format>
          <file_created>docs/frontmatter-standard.md</file_created>
          <template>
---
# === Core Metadata ===
title: "Document Title"
description: "Brief description"
type: "Architecture | API | Data | Guide | Testing | Epic | Story"
status: "Active | Draft | Review | Deprecated | Archived"
version: "1.0"

# === Ownership ===
owner: "Kevy"
dri_backup: "Amelia"
contributors: ["Winston", "Database Optimizer"]
review_cadence: "Per Change | Weekly | Monthly | Quarterly | Per Epic"

# === Timestamps (ISO 8601 with timezone) ===
created_date: "2025-10-23T10:45:00-07:00"
last_updated: "2025-10-23T10:45:00-07:00"
last_reviewed: "2025-10-23T10:45:00-07:00"
next_review_due: "2025-11-23"

# === Dependencies ===
depends_on:
  - docs/architecture/solution-architecture.md
  - apps/web/prisma/schema.prisma
affects:
  - docs/developer-guides/getting-started.md
related_adrs:
  - docs/architecture/ADR-001-hybrid-typescript-python.md

# === Audience & Discovery ===
audience:
  - new-developers
  - experienced-devs
  - external-contributors
  - stakeholders
technical_level: "Beginner | Intermediate | Advanced | Expert"
tags: ["api", "authentication", "epic-4"]
keywords: ["OAuth 2.0", "JWT", "FastAPI"]
search_priority: "low | medium | high | critical"

# === Lifecycle ===
lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

# === Metrics (optional) ===
metrics:
  word_count: 3452
  reading_time_min: 17
  code_examples: 12
  last_link_check: "2025-10-23T09:00:00-07:00"
  broken_links: 0

# === Changelog ===
changelog:
  - version: "1.0"
    date: "2025-10-23"
    author: "Kevy"
    changes:
      - "Initial documentation"
---
          </template>
          <acceptance_criteria>
            <criterion>Template includes all required fields</criterion>
            <criterion>Examples provided for 4+ doc types</criterion>
            <criterion>Field descriptions explain purpose and usage</criterion>
          </acceptance_criteria>
        </task>

        <task id="1.3" name="Standardize READMEs" day="3-4">
          <description>Apply standard sections to all README files</description>
          <action>
            1. Identify all README.md files in project
            2. Add/update sections:
               - Title and Purpose
               - Quick Start / Usage
               - Inputs/Outputs (if applicable)
               - Configuration/Env
               - Troubleshooting
               - Links (to index, ADRs, API contracts)
            3. Add frontmatter to each README
          </action>
          <output_format>markdown</output_format>
          <files_modified>All README.md files in project</files_modified>
          <acceptance_criteria>
            <criterion>All READMEs have consistent section structure</criterion>
            <criterion>All READMEs have frontmatter</criterion>
            <criterion>All READMEs link back to docs/index.md</criterion>
          </acceptance_criteria>
        </task>

        <task id="1.4" name="Add Frontmatter to Key Docs" day="4">
          <description>Add enhanced frontmatter to architecture, API, and guide docs</description>
          <action>
            Priority docs for frontmatter:
            1. docs/solution-architecture.md
            2. docs/ARCHITECTURE-DECISION-EPIC4.md
            3. docs/EPIC5-DEPLOYMENT-GUIDE.md
            4. docs/EPIC5-MASTER-SUMMARY.md
            5. docs/development-environment-setup.md
            6. docs/DATABASE-MIGRATION-STRATEGY.md
          </action>
          <output_format>markdown</output_format>
          <acceptance_criteria>
            <criterion>6+ key docs have complete frontmatter</criterion>
            <criterion>Owner and review_cadence assigned</criterion>
            <criterion>ISO 8601 timestamps used</criterion>
          </acceptance_criteria>
        </task>
      </tasks>

      <handoff>
        <summary>Phase 1 Complete: Foundation established</summary>
        <completed>
          <item>✅ docs/index.md created (master entry point)</item>
          <item>✅ Canonical IA structure defined</item>
          <item>✅ Frontmatter standard documented</item>
          <item>✅ READMEs standardized</item>
          <item>✅ Key docs have frontmatter</item>
        </completed>
        <next_phase>Phase 2: Core Documentation (ADRs, API, Data Models)</next_phase>
        <resume_instructions>
          If resuming after memory reset:
          1. Read this XML plan from CLAUDE.md
          2. Check docs/index.md exists and is complete
          3. Verify frontmatter-standard.md exists
          4. Review completed checklist above
          5. Proceed to Phase 2
        </resume_instructions>
      </handoff>
    </phase>

    <!-- ========================================
         PHASE 2: CORE DOCUMENTATION (Days 5-9)
         ======================================== -->
    <phase id="2" name="Core Documentation" days="5-9" status="pending">
      <objectives>
        <objective>Create ADR system with 5 critical ADRs</objective>
        <objective>Establish API contracts landing page</objective>
        <objective>Create data models summary</objective>
        <objective>Build testing documentation hub</objective>
      </objectives>

      <tasks>
        <task id="2.1" name="ADR System Setup" day="5-6">
          <description>Create ADR-INDEX.md and 5 critical ADRs documenting Epic 3/4/5 decisions</description>
          <action>
            1. Create docs/architecture/ADR-INDEX.md listing all ADRs
            2. Draft ADR-001: Hybrid TypeScript + Python Architecture (Epic 4)
               - Context: Epic 4 needed AI/ML evaluation + UI integration
               - Decision: FastAPI for AI/ML, Next.js for UI
               - Rationale: Python excels at ML/stats, TypeScript at UI
            3. Draft ADR-002: Multi-Worktree Development Strategy (deprecated Oct 2025)
               - Context: Parallel epic development needed
               - Decision: Git worktrees for Epic 3/4/5
               - Status: DEPRECATED (all merged to main)
            4. Draft ADR-003: Two-Tier Caching (Redis L1 + In-Memory L2)
               - Context: Epic 5 API performance (21s → 180ms goal)
               - Decision: Redis (55-70% hit) + in-memory (10-15% hit)
               - Result: 65-85% total cache hit rate
            5. Draft ADR-004: OKLCH Color System + Glassmorphism Design (Epic 5)
               - Context: Design system for Epic 5 UI
               - Decision: OKLCH (perceptual uniformity) + glassmorphism (no gradients)
               - Result: WCAG 2.1 AAA compliance + better performance
            6. Draft ADR-005: Gemini Embeddings 1536-dim + pgvector (Epic 3)
               - Context: Semantic search with vector embeddings
               - Decision: text-embedding-001 at 1536 dimensions
               - Rationale: Fits pgvector 2000-dim limit, middle-ground quality
          </action>
          <output_format>markdown</output_format>
          <files_created>
            <file>docs/architecture/ADR-INDEX.md</file>
            <file>docs/architecture/ADR-001-hybrid-typescript-python.md</file>
            <file>docs/architecture/ADR-002-multi-worktree-deprecated.md</file>
            <file>docs/architecture/ADR-003-two-tier-caching.md</file>
            <file>docs/architecture/ADR-004-oklch-glassmorphism.md</file>
            <file>docs/architecture/ADR-005-gemini-embeddings-1536.md</file>
          </files_created>
          <acceptance_criteria>
            <criterion>ADR-INDEX.md lists all 5 ADRs with status</criterion>
            <criterion>Each ADR follows template structure (Context, Decision, Consequences)</criterion>
            <criterion>ADRs linked from solution-architecture.md</criterion>
            <criterion>Frontmatter complete on all ADRs</criterion>
          </acceptance_criteria>
        </task>

        <task id="2.2" name="API Contracts Landing Page" day="7">
          <description>Create docs/api-contracts.md linking to OpenAPI spec and route maps</description>
          <action>
            1. Create docs/api-contracts.md
            2. Link to apps/web/docs/api/openapi.yaml (canonical contract)
            3. Link to FastAPI Swagger UI (http://localhost:8000/docs)
            4. Create Next.js API route map:
               - Epic 3 routes: /api/search/*, /api/knowledge-graph/*
               - Epic 4 routes: /api/validation/*
               - Epic 5 routes: /api/analytics/*, /api/orchestration/*, /api/personalization/*
            5. Add authentication requirements per endpoint group
            6. Cross-link to code implementations
          </action>
          <output_format>markdown</output_format>
          <file_created>docs/api-contracts.md</file_created>
          <acceptance_criteria>
            <criterion>OpenAPI spec established as canonical source</criterion>
            <criterion>Route map includes all Epic 3/4/5 endpoints</criterion>
            <criterion>Links to code implementations functional</criterion>
            <criterion>Authentication requirements documented</criterion>
          </acceptance_criteria>
        </task>

        <task id="2.3" name="Data Models Summary" day="8">
          <description>Create docs/data-models.md summarizing 77 Prisma models</description>
          <action>
            1. Create docs/data-models.md
            2. Summarize core entities:
               - Epic 3: Semantic search models (ContentChunk, Embedding, etc.)
               - Epic 4: 11 validation models (ValidationPrompt, ValidationResponse, etc.)
               - Epic 5: 20+ behavioral models (UserLearningProfile, StrugglePrediction, etc.)
            3. Document key relationships and foreign keys
            4. List 27 strategic indexes from Epic 5 optimization
            5. Call out pgvector specifics (1536-dim embeddings, IVFFlat indexes)
            6. Link to apps/web/prisma/schema.prisma
            7. Cross-reference migration guides
          </action>
          <output_format>markdown</output_format>
          <file_created>docs/data-models.md</file_created>
          <acceptance_criteria>
            <criterion>All 77 models categorized by epic</criterion>
            <criterion>27 strategic indexes documented</criterion>
            <criterion>pgvector configuration explained</criterion>
            <criterion>Links to schema and migrations functional</criterion>
          </acceptance_criteria>
        </task>

        <task id="2.4" name="Testing Documentation Hub" day="9">
          <description>Create docs/testing/index.md linking to test reports and strategies</description>
          <action>
            1. Create docs/testing/index.md
            2. Document how to run tests per app:
               - apps/web: npm run test (Jest + React Testing Library)
               - apps/api: pytest (Python FastAPI)
               - apps/ml-service: pytest (Python ML service)
            3. Link to existing test reports (NO duplication):
               - docs/STORY-4.3-TESTING-QUICK-START.md
               - docs/testing/story-3.4-test-summary.md
               - docs/testing/story-3.6-test-report.md
            4. Document coverage targets:
               - Epic 4: 65+ tests passing
               - Epic 5: 291+ tests, 50-60% coverage
            5. List testing conventions and patterns
          </action>
          <output_format>markdown</output_format>
          <file_created>docs/testing/index.md</file_created>
          <acceptance_criteria>
            <criterion>Run commands documented for all 3 apps</criterion>
            <criterion>Links to existing reports functional</criterion>
            <criterion>Coverage targets clearly stated</criterion>
            <criterion>Testing conventions documented</criterion>
          </acceptance_criteria>
        </task>
      </tasks>

      <handoff>
        <summary>Phase 2 Complete: Core documentation established</summary>
        <completed>
          <item>✅ ADR system with 5 critical ADRs</item>
          <item>✅ API contracts landing page created</item>
          <item>✅ Data models summary (77 models documented)</item>
          <item>✅ Testing hub with run commands and coverage targets</item>
        </completed>
        <next_phase>Phase 3: Migrations & BMAD (Days 10-12)</next_phase>
        <resume_instructions>
          If resuming after memory reset:
          1. Read this XML plan from CLAUDE.md
          2. Verify Phase 1 handoff checklist complete
          3. Check Phase 2 files exist:
             - docs/architecture/ADR-INDEX.md + 5 ADRs
             - docs/api-contracts.md
             - docs/data-models.md
             - docs/testing/index.md
          4. Proceed to Phase 3
        </resume_instructions>
      </handoff>
    </phase>

    <!-- ========================================
         PHASE 3: MIGRATIONS & BMAD (Days 10-12)
         ======================================== -->
    <phase id="3" name="Migrations & BMAD" days="10-12" status="pending">
      <objectives>
        <objective>Create central migrations documentation</objective>
        <objective>Consolidate CHANGELOG.md at root</objective>
        <objective>Run BMAD ReDoc for agents/workflows</objective>
      </objectives>

      <tasks>
        <task id="3.1" name="Migrations Documentation" day="10">
          <description>Create docs/migrations.md consolidating migration strategies</description>
          <action>
            1. Create docs/migrations.md
            2. Document migration process:
               - Prisma migrate dev (standard workflow)
               - Prisma db push (multi-worktree workaround - deprecated)
               - Migration file locations and naming
            3. Document environment handling:
               - Development (localhost PostgreSQL)
               - Staging (if applicable)
               - Production (Neon/managed PostgreSQL)
            4. Document rollback procedures
            5. Link to docs/DATABASE-MIGRATION-STRATEGY.md (keep, don't duplicate)
            6. Link to docs/EPIC5-DEPLOYMENT-GUIDE.md for deployment migrations
          </action>
          <output_format>markdown</output_format>
          <file_created>docs/migrations.md</file_created>
          <acceptance_criteria>
            <criterion>Migration process clearly documented</criterion>
            <criterion>Environment-specific instructions provided</criterion>
            <criterion>Rollback procedures documented</criterion>
            <criterion>Links to existing guides functional</criterion>
          </acceptance_criteria>
        </task>

        <task id="3.2" name="Consolidate CHANGELOG" day="10">
          <description>Create root CHANGELOG.md following Keep a Changelog format</description>
          <action>
            1. Create CHANGELOG.md at project root
            2. Follow Keep a Changelog format:
               - [Unreleased]
               - [1.0.0] - 2025-10-21 (Epic 5 completion)
               - [0.3.0] - 2025-10-17 (Epic 4 completion)
               - [0.2.0] - 2025-10-16 (Epic 3 completion)
            3. Roll up entries from docs/CHANGELOG-2025-10-15.md
            4. Add Epic 3/4/5 completion summaries:
               - Epic 3: Semantic search, knowledge graph, First Aid integration
               - Epic 4: AI validation, clinical reasoning, adaptive questioning (78 points)
               - Epic 5: Behavioral twin, ML predictions, cognitive health (126 points)
            5. Link to detailed completion reports per epic
          </action>
          <output_format>markdown</output_format>
          <file_created>CHANGELOG.md</file_created>
          <acceptance_criteria>
            <criterion>Follows Keep a Changelog format</criterion>
            <criterion>All 3 epics represented with dates</criterion>
            <criterion>Links to detailed reports functional</criterion>
            <criterion>Unreleased section exists for future work</criterion>
          </acceptance_criteria>
        </task>

        <task id="3.3" name="BMAD ReDoc Pass" day="11-12">
          <description>Run BMAD ReDoc workflow to generate/refresh agent and workflow READMEs</description>
          <action>
            Follow bmad/bmb/workflows/redoc/instructions.md:

            1. Load BMAD conventions:
               - agent_architecture.md
               - workflow_guide.md
               - module_structure.md

            2. Target bmad/ directory for documentation:
               - Agents: bmad/*/agents/*.md
               - Workflows: bmad/*/workflows/*/

            3. Process leaf to root (deepest first):
               - Level 0: Individual workflow folders, individual agent files
               - Level 1: /workflows folder, /agents folder
               - Level 2: Module root READMEs

            4. Add frontmatter to each generated README:
               ---
               last-redoc-date: 2025-10-23
               type: "Agent | Workflow | Module"
               ---

            5. Create catalogs if needed (>10 items):
               - AGENTS-CATALOG.md
               - WORKFLOWS-CATALOG.md

            CRITICAL: Process ONE document at a time to avoid token limits
          </action>
          <output_format>markdown</output_format>
          <files_created>Multiple README.md files in bmad/</files_created>
          <acceptance_criteria>
            <criterion>All agents have README.md with frontmatter</criterion>
            <criterion>All workflows have README.md with frontmatter</criterion>
            <criterion>Catalogs created for massive folders</criterion>
            <criterion>last-redoc-date: 2025-10-23 in all generated docs</criterion>
          </acceptance_criteria>
        </task>
      </tasks>

      <handoff>
        <summary>Phase 3 Complete: Migrations, changelog, and BMAD docs</summary>
        <completed>
          <item>✅ docs/migrations.md created with rollback procedures</item>
          <item>✅ CHANGELOG.md at root following Keep a Changelog format</item>
          <item>✅ BMAD ReDoc complete for agents/workflows</item>
          <item>✅ All BMAD docs have last-redoc-date frontmatter</item>
        </completed>
        <next_phase>Phase 4: Automation & Quality Gates (Days 13-14)</next_phase>
        <resume_instructions>
          If resuming after memory reset:
          1. Read this XML plan from CLAUDE.md
          2. Verify Phase 1-2 handoff checklists complete
          3. Check Phase 3 files exist:
             - docs/migrations.md
             - CHANGELOG.md (at root)
             - bmad/ READMEs with last-redoc-date
          4. Proceed to Phase 4 (final phase)
        </resume_instructions>
      </handoff>
    </phase>

    <!-- ========================================
         PHASE 4: AUTOMATION & QUALITY (Days 13-14)
         ======================================== -->
    <phase id="4" name="Automation & Quality Gates" days="13-14" status="pending">
      <objectives>
        <objective>Configure markdown linting</objective>
        <objective>Set up Vale grammar checking</objective>
        <objective>Add link checker</objective>
        <objective>Create GitHub Actions CI</objective>
        <objective>Final link sweep and verification</objective>
      </objectives>

      <tasks>
        <task id="4.1" name="Markdown Linting Setup" day="13">
          <description>Configure markdownlint with CI integration</description>
          <action>
            1. Install markdownlint-cli:
               npm install -g markdownlint-cli

            2. Create .markdownlint.json:
               {
                 "default": true,
                 "MD013": false,  # Line length (too restrictive)
                 "MD033": false,  # Allow inline HTML (for XML blocks)
                 "MD041": false   # First line heading (frontmatter conflicts)
               }

            3. Add npm script to apps/web/package.json:
               "lint:docs": "markdownlint 'docs/**/*.md' '*.md'"

            4. Test locally:
               npm run lint:docs
          </action>
          <output_format>config file + npm script</output_format>
          <files_created>
            <file>.markdownlint.json</file>
          </files_created>
          <acceptance_criteria>
            <criterion>.markdownlint.json created with sensible defaults</criterion>
            <criterion>npm run lint:docs executes without errors</criterion>
            <criterion>Medical terminology exceptions documented</criterion>
          </acceptance_criteria>
        </task>

        <task id="4.2" name="Vale Grammar Setup" day="13">
          <description>Configure Vale for style and grammar checking</description>
          <action>
            1. Install Vale:
               brew install vale  # macOS
               # or download from https://vale.sh

            2. Create .vale.ini:
               StylesPath = .vale/styles
               MinAlertLevel = suggestion

               [*.md]
               BasedOnStyles = Vale

            3. Initialize Vale styles:
               vale sync

            4. Add medical terminology exceptions:
               Create .vale/styles/Medical/terms.yml with common terms

            5. Test locally:
               vale docs/
          </action>
          <output_format>config file</output_format>
          <files_created>
            <file>.vale.ini</file>
            <file>.vale/styles/Medical/terms.yml</file>
          </files_created>
          <acceptance_criteria>
            <criterion>.vale.ini configured</criterion>
            <criterion>Medical terminology exceptions added</criterion>
            <criterion>vale docs/ runs without critical errors</criterion>
          </acceptance_criteria>
        </task>

        <task id="4.3" name="Link Checker Setup" day="13">
          <description>Add automated link checking</description>
          <action>
            1. Install markdown-link-check:
               npm install -g markdown-link-check

            2. Create .markdown-link-check.json:
               {
                 "ignorePatterns": [
                   { "pattern": "^http://localhost" },
                   { "pattern": "^https://github.com/.*#.*" }
                 ],
                 "timeout": "5s",
                 "retryOn429": true,
                 "retryCount": 3
               }

            3. Add npm script:
               "check:links": "find docs -name '*.md' -exec markdown-link-check {} \\;"

            4. Test locally:
               npm run check:links
          </action>
          <output_format>config file + npm script</output_format>
          <files_created>
            <file>.markdown-link-check.json</file>
          </files_created>
          <acceptance_criteria>
            <criterion>Link checker configured</criterion>
            <criterion>npm run check:links executes</criterion>
            <criterion>0 broken internal links found</criterion>
          </acceptance_criteria>
        </task>

        <task id="4.4" name="GitHub Actions CI" day="13">
          <description>Create CI workflow for documentation quality gates</description>
          <action>
            1. Create .github/workflows/docs-quality.yml:

               name: Documentation Quality Gate
               on:
                 pull_request:
                   paths:
                     - 'docs/**'
                     - '*.md'
                 push:
                   branches: [main]
                   paths:
                     - 'docs/**'
                     - '*.md'

               jobs:
                 quality:
                   runs-on: ubuntu-latest
                   steps:
                     - uses: actions/checkout@v4

                     - name: Markdown Lint
                       uses: nosborn/github-action-markdown-cli@v3.3.0
                       with:
                         files: 'docs/ *.md'
                         config_file: '.markdownlint.json'

                     - name: Link Check
                       uses: gaurav-nelson/github-action-markdown-link-check@v1
                       with:
                         config-file: '.markdown-link-check.json'

                     - name: Vale Linting
                       uses: errata-ai/vale-action@v2
                       with:
                         files: docs/
                         fail_on_error: false  # Warning only initially
                       env:
                         GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}

            2. Test by creating a PR with doc changes
          </action>
          <output_format>GitHub Actions workflow</output_format>
          <file_created>.github/workflows/docs-quality.yml</file_created>
          <acceptance_criteria>
            <criterion>Workflow runs on doc changes</criterion>
            <criterion>All 3 checks execute (lint, links, grammar)</criterion>
            <criterion>Fails PR on broken links or lint errors</criterion>
          </acceptance_criteria>
        </task>

        <task id="4.5" name="Final Link Sweep & Verification" day="14">
          <description>Fix all broken links and verify documentation quality</description>
          <action>
            1. Run link checker and fix all broken internal links:
               npm run check:links

            2. Verify docs/index.md navigates to all essential areas:
               - Overview ✓
               - Architecture (with ADR-INDEX) ✓
               - API Contracts ✓
               - Data Models ✓
               - Developer Guides ✓
               - Testing ✓
               - Migrations ✓
               - Performance ✓
               - Troubleshooting ✓
               - Epics & Stories (archived) ✓

            3. Tag DRIs in key docs (verify owner field in frontmatter):
               - Architecture/ADRs: Kevy (Monthly review)
               - API/Data Models: Amelia (Per change)
               - Testing: Alice/QA Team (After each epic)
               - Performance: Performance Engineer (Per optimization story)
               - Changelog: Kevy (At every release)

            4. Generate initial doc health metrics:
               - Total docs: 145 + new docs created
               - Frontmatter compliance: X%
               - Link health: 100% (0 broken)
               - Freshness: Y% < 90 days old
               - ADR coverage: 5 ADRs documenting critical decisions

            5. Final QA:
               - Test navigation from index to major docs
               - Verify all npm scripts run successfully
               - Confirm CI passes on sample PR
          </action>
          <output_format>fixes + verification report</output_format>
          <acceptance_criteria>
            <criterion>0 broken internal links</criterion>
            <criterion>docs/index.md navigates to all 10 essential areas</criterion>
            <criterion>All key docs have owner + review_cadence assigned</criterion>
            <criterion>Doc health metrics generated</criterion>
            <criterion>CI passes on test PR</criterion>
          </acceptance_criteria>
        </task>

        <task id="4.6" name="Update CLAUDE.md with Completion" day="14">
          <description>Mark this plan as complete in CLAUDE.md</description>
          <action>
            1. Update metadata in this XML plan:
               &lt;status&gt;completed&lt;/status&gt;
               &lt;completed_date&gt;YYYY-MM-DD&lt;/completed_date&gt;

            2. Add summary to "Notes" section in CLAUDE.md:
               "Documentation refactor completed 2025-MM-DD. See Documentation Refactor Execution Plan section for details."

            3. Generate final metrics report and add to plan
          </action>
          <output_format>CLAUDE.md update</output_format>
          <acceptance_criteria>
            <criterion>XML plan status updated to "completed"</criterion>
            <criterion>Completion noted in Notes section</criterion>
            <criterion>Final metrics documented</criterion>
          </acceptance_criteria>
        </task>
      </tasks>

      <handoff>
        <summary>Phase 4 Complete: Documentation refactor FINISHED</summary>
        <completed>
          <item>✅ Markdown linting configured + CI integrated</item>
          <item>✅ Vale grammar checking set up</item>
          <item>✅ Link checker automated</item>
          <item>✅ GitHub Actions CI enforcing quality gates</item>
          <item>✅ 0 broken internal links</item>
          <item>✅ All docs navigable from master index</item>
          <item>✅ DRIs assigned with review cadence</item>
          <item>✅ Doc health metrics generated</item>
        </completed>
        <project_complete>
          Documentation refactor successfully completed!

          Key Deliverables:
          1. docs/index.md - Master entry point
          2. ADR system - 5 critical ADRs
          3. API contracts - Canonical OpenAPI spec
          4. Data models - 77 models documented
          5. Testing hub - Run commands + coverage targets
          6. Migrations guide - Rollback procedures
          7. CHANGELOG.md - Epic 3/4/5 summaries
          8. BMAD ReDoc - All agents/workflows documented
          9. CI quality gates - Automated enforcement
          10. Enhanced frontmatter - Timestamps, metrics, dependencies
        </project_complete>
      </handoff>
    </phase>
  </phases>

  <success_criteria>
    <criterion>✅ One entry point: docs/index.md navigates to all essential areas</criterion>
    <criterion>✅ 0 broken internal links (CI enforces)</criterion>
    <criterion>✅ ADRs exist for 5 critical decisions</criterion>
    <criterion>✅ API has single canonical contract (OpenAPI spec)</criterion>
    <criterion>✅ Each major doc shows Owner + Review Cadence + Last Updated (ISO 8601)</criterion>
    <criterion>✅ CI gates prevent doc quality regression</criterion>
    <criterion>✅ BMAD ReDoc complete for agents/workflows</criterion>
    <criterion>✅ CHANGELOG.md consolidated at root</criterion>
  </success_criteria>

  <tooling>
    <tool name="markdownlint-cli" purpose="Markdown linting">
      <install>npm install -g markdownlint-cli</install>
      <config>.markdownlint.json</config>
      <usage>markdownlint 'docs/**/*.md'</usage>
    </tool>
    <tool name="Vale" purpose="Grammar and style checking">
      <install>brew install vale</install>
      <config>.vale.ini</config>
      <usage>vale docs/</usage>
    </tool>
    <tool name="markdown-link-check" purpose="Link validation">
      <install>npm install -g markdown-link-check</install>
      <config>.markdown-link-check.json</config>
      <usage>markdown-link-check docs/**/*.md</usage>
    </tool>
  </tooling>

  <canonical_ia>
    <structure>
      docs/
      ├── index.md                          # MASTER INDEX (entry point)
      ├── frontmatter-standard.md           # Frontmatter template reference
      ├── overview/
      │   ├── README.md → /README.md        # Link to root README
      │   ├── PRD-Americano-2025-10-14.md
      │   └── ux-specification.md
      ├── architecture/
      │   ├── solution-architecture.md       # Canonical architecture
      │   ├── ADR-INDEX.md                   # List of all ADRs
      │   ├── adr-template.md
      │   ├── ADR-001-hybrid-typescript-python.md
      │   ├── ADR-002-multi-worktree-deprecated.md
      │   ├── ADR-003-two-tier-caching.md
      │   ├── ADR-004-oklch-glassmorphism.md
      │   └── ADR-005-gemini-embeddings-1536.md
      ├── api/
      │   └── api-contracts.md               # API landing page
      ├── data/
      │   └── data-models.md                 # Prisma schema summary
      ├── developer-guides/
      │   ├── getting-started.md
      │   ├── local-setup.md
      │   └── [existing guides]
      ├── testing/
      │   ├── index.md                       # Testing hub
      │   └── [links to test reports]
      ├── migrations/
      │   └── migrations.md                  # Central migration doc
      ├── performance/
      │   ├── EPIC5-PERFORMANCE-BENCHMARKS.md
      │   └── performance-optimization-report.md
      ├── troubleshooting/
      │   └── [existing troubleshooting docs]
      ├── epics/                             # Archive completed epics
      │   ├── epic-3-completion-report.md
      │   ├── epic-4-retro-2025-10-20.md
      │   └── epic-5-completion-summary.md
      └── stories/                           # Archive story work
          └── [78 story files]
    </structure>
  </canonical_ia>
</documentation-refactor-execution-plan>
```

---

## How to Resume After Memory Reset

### For User (Kevy):

**To continue documentation refactor in a new session, say:**
```
"Check CLAUDE.md for active work and continue"
```
OR
```
"Continue documentation refactor - check Phase status in CLAUDE.md"
```

### For Claude (AI Agent):

**When user asks to continue documentation refactor:**

1. **Read CLAUDE.md** - Search for `<documentation-refactor-execution-plan>`

2. **Check current status** in XML metadata:
   ```xml
   <current_phase>1</current_phase>        <!-- Which phase: 0-4 -->
   <current_task>1.2</current_task>        <!-- Current task ID -->
   ```

3. **Find incomplete work:**
   - Look for tasks with `status="pending"` or `status="in-progress"`
   - Check last completed phase handoff section

4. **Present phase plan to user:**
   ```
   Found: Documentation Refactor in progress
   Status: Phase X, Task Y

   Phase X includes N tasks:
     X.1: [Task name]
     X.2: [Task name]
     ...

   Ready to execute Phase X? (Y/N)
   ```

5. **Upon approval:**
   - Create TodoWrite with all tasks in phase
   - Execute tasks sequentially
   - Update XML metadata after each task:
     ```xml
     <task id="X.Y" status="completed">...</task>
     ```
   - Mark TodoWrite tasks complete as you finish
   - Update `<current_phase>` and `<current_task>` in metadata

6. **After phase completion:**
   - Report deliverables to user
   - Ask for approval to continue to next phase
   - Do NOT auto-proceed to next phase without approval

**Key Files to Check:**
- `docs/index.md` - Master index exists?
- `docs/architecture/ADR-INDEX.md` - ADR system set up?
- `docs/api-contracts.md` - API landing page created?
- `.markdownlint.json` - Linting configured?
- `.github/workflows/docs-quality.yml` - CI set up?

**Commands to Verify Progress:**
```bash
# Check doc count
find docs -name "*.md" | wc -l

# Run quality checks (if tools installed)
npm run lint:docs
npm run check:links
vale docs/

# Verify CI
git log -1 --oneline  # Check latest commit

# Check phase status
grep -A2 "current_phase" CLAUDE.md
```

**Autonomy Level:** Phase-by-phase approval
- Complete all tasks in approved phase
- Pause after phase, await user approval for next phase
- Do NOT proceed to next phase automatically
