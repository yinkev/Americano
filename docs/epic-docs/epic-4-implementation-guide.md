# Epic 4 Implementation Guide
**Quick Reference for AI Agents and Future Development**

---

## 🎯 **Current Status**

✅ **ALL 6 EPIC 4 STORIES READY FOR DEVELOPMENT**

**Commit**: `ce23a6b` - feat(epic4): Complete story-ready workflow + hybrid architecture

---

## 📋 **Story Overview**

| Story | Title | Tech | Size | Status | Context File |
|-------|-------|------|------|--------|--------------|
| **4.1** | Natural Language Comprehension | TypeScript | 13pts | ✅ Ready | story-context-4.1.xml (30KB) |
| **4.2** | Clinical Reasoning Scenarios | TypeScript | 13pts | ✅ Ready | story-context-4.2.xml (23KB) |
| **4.3** | Controlled Failure & Memory | TypeScript | 13pts | ✅ Ready | story-context-4.3.xml (9.5KB) |
| **4.4** | Confidence Calibration | TypeScript | 10pts | ✅ Ready | story-context-4.4.xml (59KB) |
| **4.5** | Adaptive Questioning (IRT) | **Python** | 13pts | ✅ Ready | story-context-4.5.xml (36KB) |
| **4.6** | Understanding Analytics | TypeScript | 13pts | ✅ Ready | story-context-4.6.xml (48KB) |

**Total**: ~75 points | **Timeline**: 4-6 weeks (parallel execution)

---

## 🏗️ **Architecture: Hybrid TypeScript + Python**

### TypeScript Stack (Stories 4.1, 4.2, 4.3, 4.4, 4.6)
```
Next.js 15 + React 19 + Prisma + Zod + Zustand + Recharts
Purpose: User-facing features, UI/UX, real-time interactions
Port: 3000 (localhost)
```

### Python Stack (Story 4.5)
```
FastAPI + Pydantic + scipy + numpy + scikit-learn + instructor
Purpose: Research-grade IRT algorithms, ML pattern detection
Port: 8000 (localhost)
```

**See**: `docs/ARCHITECTURE-DECISION-EPIC4.md` for full rationale

---

## 🤖 **AI Agent Assignment (Parallel Execution)**

### Setup Phase (Day 1 - 30 minutes)

**Python Service** (15 min):
```bash
cd /Users/kyin/Projects/Americano-epic4
mkdir -p apps/python-api/src
cd apps/python-api
uv init
uv add fastapi uvicorn pydantic scipy numpy scikit-learn instructor python-dotenv
```

**TypeScript Integration** (15 min):
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

### Development Phase (Weeks 1-6 - Parallel)

**Agent 1**: `javascript-typescript:typescript-pro` → **Story 4.1**
- ValidationPrompt/ValidationResponse models (Prisma)
- Comprehension prompt UI (React)
- ChatMock (GPT-5) evaluation integration
- ComprehensionPromptDialog component

**Agent 2**: `frontend-mobile-development:frontend-developer` → **Story 4.2**
- ClinicalCaseDialog component (multi-stage)
- Interactive case progression UI
- Clinical reasoning evaluation
- ClinicalFeedbackPanel component

**Agent 3**: `javascript-typescript:typescript-pro` → **Story 4.3**
- Challenge identification engine
- Vulnerability scoring algorithm
- ChallengeModeDialog component
- Retry scheduler (spaced intervals)

**Agent 4**: `javascript-typescript:typescript-pro` → **Story 4.4**
- Confidence capture UI (pre/post assessment)
- Calibration calculation (Pearson correlation)
- CalibrationFeedbackPanel component
- Calibration trends dashboard

**Agent 5**: `python-development:fastapi-pro` → **Story 4.5**
- **Python FastAPI service setup**
- scipy-based IRT (Newton-Raphson optimization)
- sklearn ML pattern detection
- TypeScript integration layer (Next.js API routes)

**Agent 6**: `frontend-mobile-development:frontend-developer` → **Story 4.6**
- UnderstandingDashboard component
- Multi-dimensional analytics (Recharts)
- Understanding vs Memorization comparison
- AI-powered insights panel (ChatMock)

---

## 📝 **Critical Workflow for AI Agents**

### Before Starting ANY Story:

1. ✅ **Read CLAUDE.md** (`/Users/kyin/Projects/Americano-epic4/CLAUDE.md`)
   - Technology stack decisions
   - Epic-specific guidance
   - Integration patterns

2. ✅ **Read AGENTS.md** (`/Users/kyin/Projects/Americano-epic4/bmad/bmm/AGENTS.md`)
   - Agent protocols
   - Workflow requirements
   - Quality standards

3. ✅ **Use context7** for updated documentation
   - Next.js 15, React 19, Prisma (TypeScript)
   - FastAPI, Pydantic, scipy, sklearn (Python)

4. ✅ **Load story-context-4.X.xml** (`/Users/kyin/Projects/Americano-epic4/docs/stories/`)
   - Complete implementation guidance
   - Acceptance criteria
   - Interface specifications
   - Test ideas

5. ✅ **Follow workflow.xml patterns**
   - Proper error handling
   - API response standards
   - Design system compliance (glassmorphism, OKLCH colors)

---

## 🚀 **Development Workflow**

### Local Development (2 Terminals)

**Terminal 1: Python Service** (Story 4.5 only)
```bash
cd apps/python-api
uvicorn src.main:app --reload --port 8000
# Running on http://localhost:8000
```

**Terminal 2: Next.js** (All stories)
```bash
cd apps/web
npm run dev
# Running on http://localhost:3000
```

### Database Migrations
```bash
cd apps/web
npx prisma migrate dev --name add_epic4_models
npx prisma generate
```

### Testing
```bash
# TypeScript tests
npm run test

# Python tests (if Story 4.5 implemented)
cd apps/python-api
pytest
```

---

## 🎯 **Recommended Implementation Order**

### Option 1: Foundation-First (Sequential within parallel)
1. **Story 4.1** (foundation) → Enables 4.2, 4.3, 4.4
2. **Stories 4.2 + 4.3 + 4.4** (parallel) → Build on 4.1
3. **Story 4.5** (Python IRT) → Can start anytime
4. **Story 4.6** (analytics) → Consolidates all data

### Option 2: Quick Wins (Highest user impact first)
1. **Story 4.1** (foundation) → Core validation
2. **Story 4.3** (failure) → Emotional impact
3. **Story 4.6** (analytics) → Showcase value
4. **Stories 4.2 + 4.4 + 4.5** (fill in rest)

---

## 📊 **Key Integration Points**

### Story Dependencies
- **4.1 → 4.2, 4.3, 4.4, 4.5, 4.6** (all depend on ValidationPrompt/Response)
- **4.4 → 4.5** (calibration data informs difficulty adjustment)
- **4.1-4.5 → 4.6** (analytics consolidates all validation data)

### Database Schema
```prisma
// Shared models (Story 4.1 foundation)
model ValidationPrompt { }
model ValidationResponse { }

// Story-specific extensions
model ClinicalScenario { }        // Story 4.2
model ChallengeAttempt { }        // Story 4.3
model CalibrationMetric { }       // Story 4.4
model AdaptiveSession { }         // Story 4.5
model UnderstandingPrediction { } // Story 4.6
```

### API Patterns
```typescript
// TypeScript API routes (Stories 4.1-4.4, 4.6)
apps/web/src/app/api/validation/**/*.ts

// Python service (Story 4.5)
apps/python-api/src/routes/**/*.py

// Integration (TypeScript calls Python)
apps/web/src/lib/services/irt-service.ts
```

---

## 🎨 **Design System Compliance**

All Epic 4 stories must follow:
- **Glassmorphism**: `bg-white/95 backdrop-blur-xl` (NO gradients)
- **OKLCH Colors**: Green (strength), Red (weakness), Yellow (warning), Blue (info)
- **Typography**: Inter (body), DM Sans (headings)
- **Touch Targets**: Minimum 44px for interactive elements
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

---

## 📈 **Success Metrics**

### Technical Metrics
- API latency <200ms (TypeScript routes)
- IRT calculation <500ms (Python scipy)
- Dashboard load <2s (Story 4.6)
- Test coverage: TypeScript 70%+, Python 80%+

### User Metrics (from PRD)
- 60%+ users show improved comprehension
- Correlation between validation performance and exam outcomes
- User reports increased confidence in knowledge application

---

## 📚 **Key Documentation**

- **Architecture Decision**: `docs/ARCHITECTURE-DECISION-EPIC4.md`
- **Technology Stack**: `CLAUDE.md`
- **Agent Protocols**: `bmad/bmm/AGENTS.md`
- **Workflow Status**: `docs/bmm-workflow-status.md`
- **Story Files**: `docs/stories/story-4.*.md`
- **Context Files**: `docs/stories/story-context-4.*.xml`

---

## ⚡ **Quick Start Commands**

### 1. Setup Python Service (30 min)
```bash
cd /Users/kyin/Projects/Americano-epic4
mkdir -p apps/python-api/src
cd apps/python-api
uv init && uv add fastapi uvicorn scipy numpy scikit-learn pydantic instructor
```

### 2. Start Development (2 terminals)
```bash
# Terminal 1: Python
cd apps/python-api && uvicorn src.main:app --reload --port 8000

# Terminal 2: Next.js
cd apps/web && npm run dev
```

### 3. Deploy AI Agents (Parallel)
```bash
# Use Claude Code Task tool to launch 6 agents:
# - javascript-typescript:typescript-pro (Stories 4.1, 4.3, 4.4)
# - frontend-mobile-development:frontend-developer (Stories 4.2, 4.6)
# - python-development:fastapi-pro (Story 4.5)
```

---

## 🎉 **Vision Alignment**

**Core Promise**: "Eliminate 'what to study' anxiety"

**Epic 4 Delivers**:
- ✅ Comprehension validation (not just memorization)
- ✅ Clinical reasoning practice (real-world application)
- ✅ Controlled failure (emotional memory anchoring)
- ✅ Confidence calibration (metacognitive awareness)
- ✅ Adaptive assessment (efficient, research-grade IRT)
- ✅ Understanding analytics (data-driven insights)

**Result**: Alex opens app at 7 AM, gets daily mission, feels "immediate relief" - backed by research-grade algorithms validating genuine understanding.

---

**Status**: Ready for parallel AI agent deployment
**Timeline**: 4-6 weeks to working Epic 4 MVP
**Next Step**: Setup Python service (30 min) → Launch 6 AI agents

---

_Last Updated: 2025-10-16 | Commit: ce23a6b_
