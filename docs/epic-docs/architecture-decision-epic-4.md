---
title: "Architecture Decision Record: Epic 4 Implementation Strategy"
description: "ADR documenting hybrid TypeScript + Python architecture for Epic 4 Understanding Validation Engine with parallel AI agent execution strategy"
type: "Architecture"
status: "Active"
version: "1.1"

owner: "Kevy"
dri_backup: "Bob (Scrum Master)"
contributors: ["Winston (Architect)", "Python-Pro Agent", "TypeScript-Pro Agent"]
review_cadence: "Per Epic"

created_date: "2025-10-16T00:00:00-07:00"
last_updated: "2025-10-23T11:45:00-07:00"
last_reviewed: "2025-10-23T11:45:00-07:00"
next_review_due: "2026-01-16"

depends_on:
  - CLAUDE.md
  - docs/PRD-Americano-2025-10-14.md
  - docs/stories/story-context-4.1.xml
  - docs/stories/story-context-4.2.xml
  - docs/stories/story-context-4.3.xml
  - docs/stories/story-context-4.4.xml
  - docs/stories/story-context-4.5.xml
  - docs/stories/story-context-4.6.xml
affects:
  - apps/web/src/app/api/validation/**
  - apps/api/src/validation/**
  - apps/web/prisma/schema.prisma
related_adrs:
  - docs/architecture/ADR-001-hybrid-typescript-python.md

audience:
  - experienced-devs
  - architects
  - epic-4-team
technical_level: "Advanced"
tags: ["epic-4", "architecture", "adr", "hybrid-architecture", "typescript", "python", "irt", "adaptive-assessment"]
keywords: ["FastAPI", "Next.js", "scipy", "sklearn", "IRT", "parallel-execution", "AI-agents"]
search_priority: "critical"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

metrics:
  word_count: 2845
  reading_time_min: 14
  code_examples: 3
  last_link_check: "2025-10-23T11:45:00-07:00"
  broken_links: 0

changelog:
  - version: "1.1"
    date: "2025-10-23"
    author: "Kevy"
    changes:
      - "Added enhanced frontmatter for documentation refactor"
      - "Updated to reflect Epic 4 completion status"
  - version: "1.0"
    date: "2025-10-16"
    author: "Kevy"
    changes:
      - "Initial ADR documenting hybrid architecture decision"
      - "Defined parallel AI agent execution strategy"
      - "Stakeholder approval from Kevy and Bob"
---

# Architecture Decision Record: Epic 4 Implementation Strategy

**Date:** 2025-10-16
**Status:** Approved
**Decision Makers:** Kevy (Founder), Bob (Scrum Master)
**Context:** Epic 4 (Understanding Validation Engine) implementation planning

---

## Decision Summary

**Hybrid TypeScript + Python Architecture with Parallel AI Agent Execution**

Epic 4 will be implemented using a hybrid architecture that leverages TypeScript for user-facing features and Python for research-grade computational algorithms, with all 6 stories built in parallel by specialized AI agents.

---

## Context and Problem Statement

### The Challenge
Epic 4 (Understanding Validation Engine) requires:
1. **Fast time-to-market**: Users need "immediate relief" from decision fatigue (core value prop)
2. **Research-grade quality**: No mediocrity or "just okay" algorithms (founder requirement)
3. **Academic credibility**: Must support future research publication and validation
4. **Sustainable architecture**: Zero technical debt, maintainable long-term
5. **AI team leverage**: Multiple AI agents available for parallel development

### Key Constraints
- **Timeline**: 4-6 weeks to working MVP (6-month target: 500 users)
- **Resources**: Bootstrap/self-funded, local development only (no deployment yet)
- **Quality bar**: Refuse mediocrity - must be excellent on all fronts
- **Vision**: "The Medical Student's Cognitive Companion" - eliminate "what to study" anxiety

---

## Decision

### Hybrid Architecture: TypeScript + Python

#### TypeScript Stack (Stories 4.1, 4.2, 4.3, 4.4, 4.6)
**Purpose**: User-facing features, UI/UX, real-time interactions

**Technology**:
- Next.js 15 App Router
- React 19 (Server + Client Components)
- Prisma ORM (PostgreSQL)
- Zod validation
- Zustand state management
- Recharts visualization

**Rationale**:
- ✅ Fast iteration on UX (core differentiator: eliminate decision fatigue)
- ✅ Type-safe full-stack (Prisma → Zod → TypeScript → React)
- ✅ Single codebase simplicity for rapid prototyping
- ✅ Excellent Next.js/React ecosystem for medical education UI
- ✅ Real-time API responses <200ms (user experience critical)

#### Python Stack (Story 4.5)
**Purpose**: Research-grade computational algorithms, statistical analysis

**Technology**:
- FastAPI (async web framework)
- Pydantic V2 (data validation)
- scipy (Newton-Raphson IRT optimization)
- numpy (numerical computation)
- scikit-learn (ML pattern detection)
- instructor (structured LLM outputs)

**Rationale**:
- ✅ Research-grade IRT (scipy = 30 years battle-tested, NIST-validated)
- ✅ Academic credibility (can cite scipy/sklearn in research papers)
- ✅ ML ecosystem (sklearn for pattern detection, clustering, anomaly detection)
- ✅ Future-proof (add 2PL/3PL IRT, deep learning with PyTorch)
- ✅ Zero tech debt (industry-standard libraries, millions of developers)
- ✅ Behavioral data moat (research-grade algorithms + your data = unpublishable by competitors)

---

## Architecture Diagram

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

## Story-by-Story Technology Mapping

| Story | Title | Technology | Agent Type | Rationale |
|-------|-------|-----------|------------|-----------|
| **4.1** | Natural Language Comprehension | TypeScript | typescript-pro | Real-time prompts, tight UI integration, foundation for all |
| **4.2** | Clinical Reasoning Scenarios | TypeScript | frontend-developer | Interactive case progression, UI-heavy, ChatMock in TS |
| **4.3** | Controlled Failure | TypeScript | typescript-pro | Challenge generation, UI feedback, optional Python for ML later |
| **4.4** | Confidence Calibration | TypeScript | typescript-pro | Calibration UI, Pearson correlation (simple math), optional Python for ML later |
| **4.5** | Adaptive Questioning (IRT) | **Python** | fastapi-pro/python-pro | **Research-grade IRT**, scipy Newton-Raphson, ML pattern detection |
| **4.6** | Understanding Analytics | TypeScript | frontend-developer | Dashboard UI, Recharts visualization, consolidates all data |

---

## Parallel AI Agent Execution Strategy

### Week 1-6: All Stories Built Simultaneously

**Python Service Setup** (1 agent, Day 1):
- Agent: `python-development:fastapi-pro`
- Task: Setup FastAPI service with scipy IRT (Story 4.5)
- Time: 15 minutes setup + 1 week implementation
- Output: Research-grade adaptive assessment engine

**TypeScript Stories** (5 agents, parallel):
1. Agent: `javascript-typescript:typescript-pro` → Story 4.1 (foundation)
2. Agent: `frontend-mobile-development:frontend-developer` → Story 4.2 (clinical UI)
3. Agent: `javascript-typescript:typescript-pro` → Story 4.3 (failure patterns)
4. Agent: `javascript-typescript:typescript-pro` → Story 4.4 (calibration)
5. Agent: `frontend-mobile-development:frontend-developer` → Story 4.6 (analytics)

**Timeline**: 4-6 weeks total (NOT 18-24 weeks sequential)

**Coordination**: Next.js API routes orchestrate Python calls transparently to user

---

## Benefits of This Decision

### 1. Speed to Users (Goal 2: 40+ satisfied users in 1 year)
- ✅ TypeScript UX = Fast iteration, beautiful UI
- ✅ Single Next.js app = Simple for early users (no microservice complexity)
- ✅ Parallel execution = All features ready in 4-6 weeks

### 2. Research-Grade Quality (Founder requirement: No mediocrity)
- ✅ Python scipy/sklearn = Industry-standard, validated algorithms
- ✅ Can publish research papers citing scipy (academic credibility)
- ✅ ML ecosystem ready (sklearn for future pattern detection)

### 3. Sustainable Competitive Moat (Goal 4: Behavioral data advantage)
- ✅ Research-grade algorithms + your behavioral data = unpublishable by competitors
- ✅ Academic validation = user trust = justifies $75-100/year pricing
- ✅ Can hire Python ML engineers at scale (millions available)

### 4. Zero Technical Debt
- ✅ TypeScript: Next.js best practices, Prisma ORM, modern stack
- ✅ Python: scipy/sklearn (30 years of validation), no reinventing wheel
- ✅ No future rewrites needed (start right, stay right)

### 5. AI Team Leverage
- ✅ 6 agents building in parallel = 6x faster than sequential
- ✅ Each agent uses optimal tech stack (TypeScript or Python)
- ✅ Specialized agents (fastapi-pro, typescript-pro, frontend-developer)

---

## Local Development Workflow

### Terminal 1: Python Service
```bash
cd apps/python-api
uvicorn src.main:app --reload --port 8000
# Running on http://localhost:8000
```

### Terminal 2: Next.js
```bash
cd apps/web
npm run dev
# Running on http://localhost:3000
```

### Integration Pattern
```typescript
// apps/web/src/lib/services/irt-service.ts
export async function estimateKnowledge(responses: Response[]) {
  // TypeScript calls Python for research-grade IRT
  const result = await fetch('http://localhost:8000/irt/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ responses }),
  });
  return result.json();
}
```

**User Experience**: Seamless (never knows two services exist)
**Developer Experience**: Clear separation of concerns

---

## Alternatives Considered

### Alternative 1: TypeScript-Only
**Pros**:
- Zero setup time
- Single codebase

**Cons**:
- ❌ Custom IRT implementation (unproven, likely bugs)
- ❌ No academic credibility (can't cite "custom TypeScript IRT")
- ❌ High tech debt (will rewrite in Python later = 3-4 weeks wasted)
- ❌ "Just okay" quality (violates founder's no-mediocrity requirement)

**Decision**: Rejected (violates quality bar)

### Alternative 2: Python-Only
**Pros**:
- Research-grade from day 1
- Zero tech debt

**Cons**:
- ❌ Slower UI iteration (Python not ideal for React/Next.js)
- ❌ Split ecosystem (Python backend + TypeScript frontend anyway)
- ❌ Less TypeScript expertise in team

**Decision**: Rejected (hybrid is better)

### Alternative 3: Hybrid Architecture (CHOSEN)
**Pros**:
- ✅ TypeScript for what it's best at (UX, iteration speed)
- ✅ Python for what it's best at (research-grade algorithms)
- ✅ Zero compromises on either front
- ✅ AI agents can build in parallel (same timeline as alternatives)

**Cons**:
- 15-minute setup overhead (negligible)
- 2 terminals instead of 1 (acceptable for local dev)

**Decision**: ✅ APPROVED (best of both worlds)

---

## Success Metrics

### Technical Metrics
- [ ] Setup complete in 30 minutes (Python + TypeScript integration)
- [ ] All 6 stories implemented in 4-6 weeks (parallel execution)
- [ ] API latency <200ms (TypeScript routes)
- [ ] IRT calculation accuracy matches scipy validation tests (Python)

### User Metrics (aligns with PRD goals)
- [ ] 40+ users "very satisfied" within 1 year (Goal 2)
- [ ] 85% weekly retention rate (Goal 2)
- [ ] 25% reduction in "what to study" decision time (Goal 1)
- [ ] Measurable correlation with improved grades (Goal 5)

### Quality Metrics
- [ ] Can cite scipy/sklearn in research papers (academic credibility)
- [ ] Zero algorithm rewrites needed (sustainable architecture)
- [ ] 70%+ test coverage TypeScript, 80%+ Python (quality bar)

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Python FastAPI service setup (15 min)
- [ ] TypeScript integration patterns (15 min)
- [ ] AI agents assigned to stories 4.1-4.6
- [ ] All agents start in parallel

### Phase 2: Parallel Development (Weeks 1-6)
- [ ] Story 4.1: TypeScript foundation (ValidationPrompt/Response models)
- [ ] Story 4.2: TypeScript clinical scenarios (interactive UI)
- [ ] Story 4.3: TypeScript controlled failure (challenge generation)
- [ ] Story 4.4: TypeScript calibration (confidence tracking)
- [ ] Story 4.5: Python adaptive assessment (scipy IRT)
- [ ] Story 4.6: TypeScript analytics (dashboard consolidation)

### Phase 3: Integration & Testing (Weeks 5-6)
- [ ] Next.js API routes call Python service seamlessly
- [ ] End-to-end testing of adaptive assessment flow
- [ ] User acceptance testing with founder
- [ ] Performance optimization (<200ms API, <3s IRT)

### Phase 4: User Validation (Month 2+)
- [ ] Deploy to first users (founder + medical school peers)
- [ ] Collect behavioral data (Goal 4: competitive moat)
- [ ] Iterate based on user feedback
- [ ] Measure success metrics (satisfaction, retention, grade correlation)

---

## Future Evolution

### Near-Term (Months 2-6)
- Add ML-based pattern detection to Story 4.3 (sklearn already installed)
- Enhance Story 4.4 with ML-based metacognitive analysis (optional)
- Upgrade IRT from 1PL to 2PL/3PL models (scipy supports it)

### Long-Term (Year 2+)
- Publish research papers on adaptive assessment efficacy
- Deploy Python service to Cloud Run (Docker containerization)
- Add deep learning with PyTorch (Python ecosystem ready)
- Institutional partnerships citing academic validation

---

## Stakeholder Sign-Off

**Founder (Kevy)**: ✅ Approved
**Reasoning**:
- Aligns with vision ("eliminate what to study anxiety")
- Refuses mediocrity (research-grade Python + beautiful TypeScript)
- Leverages AI team for parallel execution
- Zero compromises on speed OR quality

**Scrum Master (Bob)**: ✅ Approved
**Reasoning**:
- All 6 Epic 4 stories ready for development
- Context files generated (4.1-4.6 complete)
- Clear technology mapping per story
- AI agent orchestration strategy defined

---

## References

- **PRD**: docs/PRD-Americano-2025-10-14.md
- **CLAUDE.md**: Technology stack decisions (Epic 4 guidance)
- **Workflow Status**: docs/bmm-workflow-status.md
- **Story Context Files**: docs/stories/story-context-4.*.xml

---

**Status**: Ready for implementation
**Next Step**: Setup Python service (30 min) → Deploy AI agents in parallel
**Timeline**: 4-6 weeks to working Epic 4 MVP

---

_This architecture decision ensures Epic 4 delivers on the core promise: eliminate "what to study" anxiety through research-grade personalized learning, with zero compromises on quality or speed._
