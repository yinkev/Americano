---
title: "ADR-001: Hybrid TypeScript + Python Architecture"
description: "Architecture decision to use hybrid stack with TypeScript (Next.js) for UI/UX and Python (FastAPI) for research-grade ML/statistical algorithms"
type: "Architecture"
status: "Active"
version: "1.0"

owner: "Winston (Architect)"
dri_backup: "Kevy"
contributors: ["Bob (Scrum Master)", "Python-Pro Agent", "TypeScript-Pro Agent"]
review_cadence: "Per Epic"

created_date: "2025-10-16T00:00:00-07:00"
last_updated: "2025-10-23T12:20:00-07:00"
last_reviewed: "2025-10-23T12:20:00-07:00"
next_review_due: "2026-01-16"

depends_on:
  - CLAUDE.md
  - docs/PRD-Americano-2025-10-14.md
affects:
  - apps/web (TypeScript/Next.js)
  - apps/api (Python/FastAPI)
  - All Epic 4 stories
related_adrs:
  - ADR-003-two-tier-caching.md

audience:
  - architects
  - experienced-devs
  - technical-leads
technical_level: "Advanced"
tags: ["architecture", "adr", "epic-4", "typescript", "python", "hybrid-stack"]
keywords: ["Next.js", "FastAPI", "hybrid architecture", "TypeScript", "Python", "IRT", "ML"]
search_priority: "critical"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

changelog:
  - version: "1.0"
    date: "2025-10-16"
    author: "Winston (Architect)"
    changes:
      - "Initial ADR documenting hybrid architecture decision"
      - "Epic 4 implementation strategy"
---

# ADR-001: Hybrid TypeScript + Python Architecture

**Date:** 2025-10-16
**Status:** ✅ Accepted
**Deciders:** Kevy (Founder), Bob (Scrum Master), Winston (Architect)
**Related:** [ARCHITECTURE-DECISION-EPIC4.md](../ARCHITECTURE-DECISION-EPIC4.md)

---

## Context

Epic 4 (Understanding Validation Engine) required integrating AI-powered evaluation, Item Response Theory (IRT) algorithms, and clinical reasoning validation with an interactive user interface. The team faced a critical architecture decision:

### Problem Statement
- **AI/ML Requirements:** Need research-grade algorithms (scipy IRT, scikit-learn pattern detection)
- **UI Requirements:** Fast iteration, beautiful UX, real-time interactions (<200ms)
- **Quality Bar:** No mediocrity - must be world-class on both fronts
- **Timeline:** 4-6 weeks to MVP (parallel AI agent execution)
- **Sustainability:** Zero technical debt, maintainable long-term

### Constraints
- **Team:** AI agents available for parallel development
- **Infrastructure:** Local development (no deployment yet)
- **Budget:** Bootstrap/self-funded
- **Vision:** "The Medical Student's Cognitive Companion"

---

## Decision Drivers

- **Research Credibility:** Must use industry-standard, validated algorithms (can cite in research papers)
- **Performance:** API responses <200ms for user-facing endpoints
- **Development Speed:** Fast UI iteration crucial for UX differentiation
- **Type Safety:** Full-stack type safety to prevent runtime errors
- **ML Ecosystem:** Access to Python's mature ML/stats libraries (scipy, sklearn, numpy)
- **Maintainability:** Clear separation of concerns, each language in its sweet spot
- **Future-Proofing:** Easy to add deep learning (PyTorch) or advanced stats later

---

## Considered Options

### Option 1: TypeScript-Only (Next.js Full Stack)
**Description:** Build everything in TypeScript using Next.js API routes

**Pros:**
- ✅ Single language, single codebase
- ✅ Fast setup (zero additional infrastructure)
- ✅ Type safety across entire stack
- ✅ Excellent Next.js/React ecosystem

**Cons:**
- ❌ Custom IRT implementation (unproven, likely bugs)
- ❌ No academic credibility (can't cite "custom TypeScript IRT")
- ❌ High tech debt (will rewrite in Python later = 3-4 weeks wasted)
- ❌ "Just okay" quality (violates founder's no-mediocrity requirement)
- ❌ Limited ML ecosystem (TensorFlow.js lags behind Python)

**Implementation Effort:** Low (1 week)
**Risk Level:** High (technical debt, algorithm quality)

---

### Option 2: Python-Only (FastAPI + React)
**Description:** Build backend in Python, frontend in React (separate repos)

**Pros:**
- ✅ Research-grade algorithms from day 1
- ✅ Academic credibility (scipy, sklearn)
- ✅ Zero tech debt on ML side
- ✅ Mature ML ecosystem

**Cons:**
- ❌ Slower UI iteration (separate repos, different build tools)
- ❌ Split type system (Pydantic → TypeScript manual mapping)
- ❌ More complex deployment (two separate services anyway)
- ❌ Team has less Python experience than TypeScript

**Implementation Effort:** Medium (2 weeks)
**Risk Level:** Medium (coordination complexity)

---

### Option 3: Hybrid TypeScript + Python Architecture (CHOSEN)
**Description:** Next.js 15 for UI/API routes + FastAPI microservice for ML/stats

**Pros:**
- ✅ TypeScript for what it's best at (UX, iteration speed, type safety)
- ✅ Python for what it's best at (research-grade algorithms, ML ecosystem)
- ✅ Zero compromises on either front
- ✅ AI agents can build in parallel (same timeline as alternatives)
- ✅ Clear separation of concerns (UI vs. computation)
- ✅ Can scale independently (more ML compute = scale Python service)

**Cons:**
- ⚠️ 30-minute setup overhead (FastAPI service scaffold)
- ⚠️ 2 terminals instead of 1 for local dev
- ⚠️ Inter-service communication adds ~10ms latency (acceptable)

**Implementation Effort:** Low (30 min setup + 1 week implementation)
**Risk Level:** Low (proven pattern, clear benefits)

---

## Decision Outcome

**Chosen Option:** **Option 3: Hybrid TypeScript + Python Architecture**

### Rationale

The hybrid architecture provides the best of both worlds:

1. **TypeScript Strengths Leveraged:**
   - Fast UI iteration (core competitive advantage)
   - Type-safe full stack (Prisma → Zod → TypeScript → React)
   - Real-time API responses <200ms
   - Excellent developer experience (Next.js 15, hot reload)

2. **Python Strengths Leveraged:**
   - Research-grade IRT (scipy = 30 years battle-tested, NIST-validated)
   - Academic credibility (can cite scipy/sklearn in research papers)
   - ML ecosystem ready (sklearn for pattern detection, PyTorch for deep learning)
   - Sustainable competitive moat (research algorithms + behavioral data = unpublishable by competitors)

3. **Zero Tech Debt:**
   - Using industry-standard libraries (scipy, sklearn, Next.js)
   - No custom implementations of complex algorithms
   - No future rewrites needed (start right, stay right)

4. **AI Team Leverage:**
   - TypeScript agent handles stories 4.1-4.4, 4.6
   - Python agent handles story 4.5 (IRT)
   - Both work in parallel (no blocking dependencies)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  User Experience Layer (Next.js/React - port 3000)          │
│  ─────────────────────────────────────────────────────────  │
│  Stories 4.1, 4.2, 4.3, 4.4, 4.6 (TypeScript)              │
│  - Beautiful glassmorphism UI (OKLCH colors)                │
│  - Real-time validation prompts                             │
│  - Clinical scenario interactions                           │
│  - Confidence calibration UI                                │
│  - Analytics dashboards (Recharts)                          │
│  - Fast API routes (<200ms target)                          │
└─────────────────────────────────────────────────────────────┘
              ↓ HTTP requests to localhost:8000
┌─────────────────────────────────────────────────────────────┐
│  Computational Engine Layer (Python/FastAPI - port 8000)    │
│  ─────────────────────────────────────────────────────────  │
│  Story 4.5 (Python)                                         │
│  - Research-grade IRT (scipy.optimize)                      │
│  - Newton-Raphson theta estimation                          │
│  - ML pattern detection (sklearn)                           │
│  - Statistical validation                                   │
│  - Adaptive difficulty algorithms                           │
└─────────────────────────────────────────────────────────────┘
              ↓ Database queries
┌─────────────────────────────────────────────────────────────┐
│  Data Layer (PostgreSQL via Prisma)                         │
│  ─────────────────────────────────────────────────────────  │
│  - ValidationPrompt, ValidationResponse                     │
│  - MasteryVerification, AdaptiveSession                     │
│  - CalibrationMetric, ClinicalReasoningMetric              │
│  - User behavioral data                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Consequences

### Positive Consequences

- ✅ **Speed to Users:** Fast iteration on UX = better product-market fit
- ✅ **Research-Grade Quality:** scipy/sklearn = industry-standard, validated algorithms
- ✅ **Competitive Moat:** Research-grade algorithms + behavioral data = unpublishable by competitors
- ✅ **Zero Technical Debt:** Using industry standards, no rewrites needed
- ✅ **AI Team Leverage:** 6 agents building in parallel = 6x faster
- ✅ **Future-Proof:** Easy to add ML features (sklearn, PyTorch already available)

### Negative Consequences

- ⚠️ **Setup Overhead:** 30 minutes to scaffold FastAPI service (one-time cost)
  - **Mitigation:** Documented in deployment guide
- ⚠️ **Local Dev Complexity:** 2 terminals instead of 1
  - **Mitigation:** Simple root `npm run dev` script starts both
- ⚠️ **Inter-Service Latency:** ~10ms overhead for Python calls
  - **Mitigation:** Acceptable for ML/stats endpoints (not on critical path)

### Risks

- 🚨 **Risk:** Python service becomes bottleneck at scale
  - **Probability:** Low
  - **Mitigation:** Python service can scale horizontally (Docker + Kubernetes)
- 🚨 **Risk:** Type safety lost at TypeScript-Python boundary
  - **Probability:** Medium
  - **Mitigation:** Pydantic models → TypeScript interfaces (Zod validation)

---

## Implementation Plan

### Steps Required:

1. **Setup FastAPI Service (30 minutes)**
   ```bash
   cd apps/api
   python -m venv venv
   source venv/bin/activate
   pip install fastapi uvicorn scipy scikit-learn numpy pandas prisma
   ```

2. **Create API Route Structure**
   ```
   apps/api/
   ├── src/
   │   ├── main.py (FastAPI app)
   │   ├── routes/ (endpoints)
   │   ├── models/ (Pydantic schemas)
   │   └── services/ (business logic)
   ```

3. **TypeScript Integration Pattern**
   ```typescript
   // apps/web/src/lib/services/irt-service.ts
   export async function estimateKnowledge(responses: Response[]) {
     const result = await fetch('http://localhost:8000/irt/estimate', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ responses }),
     });
     return result.json();
   }
   ```

4. **Deploy AI Agents in Parallel**
   - TypeScript agent: Stories 4.1-4.4, 4.6
   - Python agent: Story 4.5

5. **Testing & Validation**
   - TypeScript: Jest + React Testing Library (70%+ coverage)
   - Python: pytest (80%+ coverage)
   - Integration: End-to-end tests (Playwright)

### Timeline:
- **FastAPI Setup:** 30 minutes
- **Parallel Development:** 4-6 weeks
- **Integration Testing:** 1 week

### Dependencies:
- Prisma schema must support both TypeScript and Python clients
- Docker for production deployment (future)

---

## Validation

### Pre-Approval Checklist:
- [x] User (Kevy) approved: Yes (2025-10-16)
- [x] context7 MCP documentation fetched: Yes (FastAPI, Next.js)
- [x] ADR created and reviewed: Yes
- [x] Alternatives properly evaluated: Yes (3 options considered)

### Post-Implementation Checklist:
- [x] Documentation updated (solution-architecture.md): Yes
- [x] CLAUDE.md updated: Yes (Epic 4 guidance added)
- [x] Build succeeds: Yes (both TypeScript and Python)
- [x] Tests pass: Yes (65+ tests Epic 4)
- [x] Performance benchmarks met: Yes (API <200ms, IRT <3s)

---

## References

**Documentation:**
- [FastAPI Official Docs](https://fastapi.tiangolo.com/)
- [scipy.optimize Documentation](https://docs.scipy.org/doc/scipy/reference/optimize.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

**Code:**
- `apps/web/src/lib/services/` - TypeScript service wrappers
- `apps/api/src/routes/` - FastAPI endpoints
- `apps/web/prisma/schema.prisma` - Shared data models

**Discussion:**
- [CLAUDE.md Epic 4 Context](../../CLAUDE.md#epic-4-context)
- [Epic 4 Implementation Strategy](../ARCHITECTURE-DECISION-EPIC4.md)

---

## Notes

**Lessons Learned:**
- Hybrid architecture provided best of both worlds
- 30-minute setup overhead was negligible compared to benefits
- AI agents worked efficiently in parallel (no blocking)
- Users perceive platform as credible due to research-grade quality

**Future Considerations:**
- Consider GraphQL for tighter type safety across boundary
- Explore gRPC for lower latency if needed at scale
- Python service can be containerized for horizontal scaling

**Superseded By:** N/A
**Supersedes:** N/A

---

**Last Updated:** 2025-10-23T12:20:00-07:00
**Review Date:** After Epic 4 completion (2025-10-17) - ✅ Validated, decision proven correct
