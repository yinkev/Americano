# Epic 5 Multi-Agent Implementation Plan

**Date Created:** 2025-10-16
**Scrum Master:** Bob
**Epic:** Epic 5 - Behavioral Learning Twin
**Status:** Ready to Execute

---

## Executive Summary

**Objective:** Complete Epic 5 (Stories 5.3-5.6) using hierarchical multi-agent architecture with BMAD agents + Claude Code plugin agents.

**Timeline:** 5 weeks (vs 24 weeks sequential)
**ROI:** 79% time reduction, zero rework guarantee
**Strategy:** Test-First (ATDD) + Parallel Implementation + Integration Coordinator

---

## Story Context Files (Ready)

All story context XMLs generated and validated:

- ✅ `docs/stories/story-context-5.3.xml` - Optimal Study Timing & Session Orchestration
- ✅ `docs/stories/story-context-5.4.xml` - Cognitive Load Monitoring & Stress Detection
- ✅ `docs/stories/story-context-5.5.xml` - Adaptive Personalization Engine
- ✅ `docs/stories/story-context-5.6.xml` - Behavioral Insights Dashboard

---

## Multi-Agent Architecture

### Level 1: Bob (Scrum Master) - Orchestrator
**Role:** Coordinate all agents, monitor progress, ensure integration
**Session:** Primary Claude session
**Responsibilities:**
- Spawn all Level 2 agents
- Monitor progress across phases
- Handle cross-phase handoffs
- Final Epic validation

### Level 2: BMAD Agents (Specialists)

#### Winston (Architect) - Integration Coordinator
**Agent File:** `/Users/Kyin/Projects/Americano/bmad/bmm/agents/architect.md`
**Workflows:**
- `*solution-architecture`
- `*tech-spec`

**Responsibilities:**
- Review all 3 story contexts (5.3, 5.4, 5.6)
- Create integration contracts document
- Validate no API/model/route conflicts
- Spawn: `architect-review` agent for validation

**Output:** `docs/epic-5-integration-contracts.md`

#### Murat (Test Architect) × 3 - ATDD Test Generation
**Agent File:** `/Users/Kyin/Projects/Americano/bmad/bmm/agents/tea.md`
**Workflow:** `*atdd` (Acceptance Test-Driven Development)

**Instance 1: Story 5.3**
- Generate E2E tests for orchestration flows
- Google Calendar integration tests
- Session recommendation tests
- Spawns: `test-automator` agent

**Instance 2: Story 5.4**
- Generate E2E tests for cognitive load monitoring
- Burnout prevention tests
- Real-time monitoring tests
- Spawns: `test-automator` agent

**Instance 3: Story 5.6**
- Generate E2E tests for dashboard UI
- Recommendations engine tests
- Goal tracking tests
- Spawns: `test-automator` agent

**Output:** Failing E2E tests that define "done"

#### Amelia (Developer) × 3 - Parallel Implementation
**Agent File:** `/Users/Kyin/Projects/Americano/bmad/bmm/agents/dev.md`
**Workflow:** `*develop` (Dev Story)

**Instance 1: Story 5.3 - Study Session Orchestration**
- Load: `story-context-5.3.xml`
- Tasks: 13 tasks, 138 estimated hours
- Spawns:
  - `database-architect` (4 models: StudyScheduleRecommendation, SessionOrchestrationPlan, CalendarIntegration, ScheduleAdaptation)
  - `backend-architect` (5 subsystems: StudyTimeRecommender, SessionDurationOptimizer, ContentSequencer, StudyIntensityModulator, OrchestrationAdaptationEngine)
  - `frontend-developer` (10 API endpoints + UI components)
- Completion: All ACs ✅, all tests pass 100%

**Instance 2: Story 5.4 - Cognitive Load Monitoring**
- Load: `story-context-5.4.xml`
- Tasks: 11 tasks, ~100 estimated hours
- Spawns:
  - `database-architect` (3 models: CognitiveLoadMetric, StressResponsePattern, BurnoutRiskAssessment)
  - `backend-architect` (3 subsystems: CognitiveLoadMonitor, BurnoutPreventionEngine, DifficultyAdapter)
  - `performance-engineer` (real-time monitoring <100ms latency)
- Completion: All ACs ✅, all tests pass 100%

**Instance 3: Story 5.6 - Behavioral Insights Dashboard**
- Load: `story-context-5.6.xml`
- Tasks: 14 tasks, ~120 estimated hours
- Spawns:
  - `database-architect` (6 models: BehavioralGoal, Recommendation, AppliedRecommendation, InsightNotification, LearningArticle, ArticleRead)
  - `backend-architect` (RecommendationsEngine, GoalManager, AcademicPerformanceIntegration)
  - `frontend-developer` (Dashboard page + 6 components)
  - `data-engineer` (Performance correlation analysis, Pearson r calculations)
- Completion: All ACs ✅, all tests pass 100%

#### Amelia (Developer) × 1 - Story 5.5 Implementation
**Executed After:** Stories 5.3, 5.4 complete (needs behavioral data)

- Load: `story-context-5.5.xml`
- Tasks: 17 tasks
- Spawns:
  - `backend-architect` (PersonalizationEngine, multi-armed bandit algorithm)
  - `ml-engineer` (A/B testing framework, strategy optimization)
  - `database-architect` (PersonalizationConfig, PersonalizationPreferences models)
- Completion: All ACs ✅, all tests pass 100%

### Level 3: Claude Code Plugin Agents (Specialized)

Available in: `~/.claude/plugins/marketplaces/claude-code-workflows/plugins/`

**Backend Development:**
- `backend-development:backend-architect` - API design, subsystems
- `backend-development:graphql-architect` - GraphQL (if needed)
- `backend-development:tdd-orchestrator` - TDD enforcement

**Database:**
- `database-design:database-architect` - Schema design, migrations
- `database-design:sql-pro` - SQL optimization
- `observability-monitoring:database-optimizer` - Performance tuning

**Frontend:**
- `frontend-mobile-development:frontend-developer` - React, Next.js components
- `frontend-mobile-development:mobile-developer` - Mobile optimization

**Data & Analytics:**
- `data-engineering:data-engineer` - Data pipelines, analytics
- `machine-learning-ops:data-scientist` - Statistical analysis
- `machine-learning-ops:ml-engineer` - ML model implementation

**Quality Assurance:**
- `unit-testing:test-automator` - Automated test generation
- `unit-testing:debugger` - Debugging specialist
- `code-review-ai:architect-review` - Architecture validation
- `tdd-workflows:code-reviewer` - Code quality assurance

**Performance:**
- `observability-monitoring:performance-engineer` - Performance optimization
- `observability-monitoring:observability-engineer` - Monitoring systems

---

## Execution Phases

### Phase 1: Architecture & Integration Contracts
**Duration:** Week 1, Day 1-2 (2 days)
**Owner:** Winston (Architect)

**Tasks:**
1. Load all 3 story contexts (5.3, 5.4, 5.6)
2. Analyze integration points:
   - 5.3 ↔ 5.4: Cognitive load data for intensity modulation
   - 5.3 ↔ 5.6: Orchestration metrics for dashboard
   - 5.4 ↔ 5.6: Cognitive load visualizations
3. Create shared contracts document
4. Validate no conflicts:
   - Database models (unique names, no column conflicts)
   - API routes (unique namespaces)
   - Subsystem classes (unique file paths)
5. Spawn `architect-review` agent for validation
6. Get approval from Bob (Scrum Master)

**Output:**
- `docs/epic-5-integration-contracts.md` (approved)
- Shared TypeScript interfaces for cross-story data

**Acceptance Criteria:**
- [ ] All 3 story architectures reviewed
- [ ] Integration contracts documented
- [ ] Zero API/model/route conflicts
- [ ] Architect-review validation passed

---

### Phase 2: ATDD Test Generation (Test-First)
**Duration:** Week 1, Day 3-5 (3 days)
**Owner:** Murat × 3 (Test Architects)

**Parallel Execution:**

**Murat 1: Story 5.3 Tests**
1. Load `story-context-5.3.xml`
2. Run `*atdd` workflow
3. Generate E2E tests for:
   - Optimal time slot recommendations
   - Session duration optimization
   - Content sequencing (warm-up → peak → wind-down)
   - Google Calendar OAuth flow
   - Orchestration plan generation
4. Spawn `test-automator` for comprehensive coverage
5. Output: `apps/web/__tests__/e2e/story-5.3-orchestration.spec.ts`

**Murat 2: Story 5.4 Tests**
1. Load `story-context-5.4.xml`
2. Run `*atdd` workflow
3. Generate E2E tests for:
   - Cognitive load calculation (5-factor algorithm)
   - Burnout risk assessment (6-factor formula)
   - Automatic difficulty adjustment
   - Real-time session monitoring (<100ms)
   - Stress pattern detection
4. Spawn `test-automator` for comprehensive coverage
5. Output: `apps/web/__tests__/e2e/story-5.4-cognitive-load.spec.ts`

**Murat 3: Story 5.6 Tests**
1. Load `story-context-5.6.xml`
2. Run `*atdd` workflow
3. Generate E2E tests for:
   - Dashboard rendering (4 tabs)
   - Recommendations engine (top 5 prioritization)
   - Goal creation and tracking
   - Performance correlation (Pearson r)
   - Learning science articles
4. Spawn `test-automator` for comprehensive coverage
5. Output: `apps/web/__tests__/e2e/story-5.6-dashboard.spec.ts`

**Output:**
- 3 E2E test suites (initially failing)
- Test coverage reports
- Acceptance criteria → test mapping

**Acceptance Criteria:**
- [ ] All acceptance criteria mapped to tests
- [ ] E2E test suites generated for 5.3, 5.4, 5.6
- [ ] Tests run and fail (no implementation yet)
- [ ] Test coverage meets BMM standards

---

### Phase 3: Parallel Implementation
**Duration:** Week 2-3 (2 weeks)
**Owner:** Amelia × 3 (Developers)

**Parallel Execution:**

#### Amelia 1: Story 5.3 Implementation

**Week 2:**
1. Load `story-context-5.3.xml`
2. Run `*develop` workflow (#yolo mode - continuous execution)
3. Spawn `database-architect`:
   - Create migration: StudyScheduleRecommendation, SessionOrchestrationPlan, CalendarIntegration, ScheduleAdaptation models
   - Extend Mission model (5 orchestration fields)
   - Run migration, verify schema
4. Spawn `backend-architect`:
   - Implement StudyTimeRecommender (optimal time slot detection algorithm)
   - Implement SessionDurationOptimizer (context-aware duration adjustment)
   - Implement ContentSequencer (VARK-based progression)
   - Implement StudyIntensityModulator (cognitive load integration)
   - Implement OrchestrationAdaptationEngine (real-time adaptation)
5. Spawn `backend-architect` (APIs):
   - POST `/api/orchestration/recommendations`
   - POST `/api/orchestration/session-plan`
   - GET `/api/orchestration/cognitive-load`
   - POST `/api/orchestration/adapt-schedule`
   - GET `/api/orchestration/effectiveness`
6. Integrate Google Calendar:
   - POST `/api/calendar/connect` (OAuth flow)
   - GET `/api/calendar/callback`
   - GET `/api/calendar/status`
   - POST `/api/calendar/sync`
   - DELETE `/api/calendar/disconnect`

**Week 3:**
7. Spawn `frontend-developer`:
   - OptimalTimeSlotsPanel component
   - SessionPlanPreview component
   - CognitiveLoadIndicator component
   - CalendarStatusWidget component
   - Dashboard page: `/orchestration`
8. Integrate with Mission Generator (from Story 2.4)
9. Run E2E tests (from Phase 2)
10. Fix failures until 100% pass
11. Run `*story-approved` workflow

**Completion Criteria:**
- [ ] All 13 tasks completed
- [ ] All E2E tests pass 100%
- [ ] Code review passed
- [ ] Story status: Approved

---

#### Amelia 2: Story 5.4 Implementation

**Week 2:**
1. Load `story-context-5.4.xml`
2. Run `*develop` workflow (#yolo mode)
3. Spawn `database-architect`:
   - Create migration: CognitiveLoadMetric, StressResponsePattern, BurnoutRiskAssessment models
   - Extend BehavioralEvent (3 cognitive load fields)
   - Run migration, verify schema
4. Spawn `backend-architect`:
   - Implement CognitiveLoadMonitor (5-factor weighted algorithm)
   - Implement BurnoutPreventionEngine (6-factor risk formula)
   - Implement DifficultyAdapter (automatic adjustment logic)
5. Spawn `performance-engineer`:
   - Optimize cognitive load calculation (<100ms)
   - Implement real-time monitoring (every 5 minutes)
   - Set up caching strategy (1-hour TTL)
6. Spawn `backend-architect` (APIs):
   - POST `/api/analytics/cognitive-load/calculate`
   - GET `/api/analytics/cognitive-load/current`
   - GET `/api/analytics/cognitive-load/history`
   - GET `/api/analytics/burnout-risk`
   - GET `/api/analytics/stress-patterns`
   - GET `/api/analytics/stress-profile`
   - POST `/api/analytics/interventions/apply`

**Week 3:**
7. Spawn `frontend-developer`:
   - CognitiveLoadMeter component (real-time gauge)
   - StressPatternsTimeline component (historical trends)
   - BurnoutRiskPanel component (risk assessment + recommendations)
   - Dashboard integration: `/analytics/cognitive-health`
8. Integrate with Mission Generator (high load → recovery missions)
9. Integrate with Story 5.2 (feed COGNITIVE_OVERLOAD to StruggleDetectionEngine)
10. Run E2E tests (from Phase 2)
11. Fix failures until 100% pass
12. Run `*story-approved` workflow

**Completion Criteria:**
- [ ] All 11 tasks completed
- [ ] All E2E tests pass 100%
- [ ] <100ms performance validated
- [ ] Code review passed
- [ ] Story status: Approved

---

#### Amelia 3: Story 5.6 Implementation

**Week 2:**
1. Load `story-context-5.6.xml`
2. Run `*develop` workflow (#yolo mode)
3. Spawn `database-architect`:
   - Create migration: BehavioralGoal, Recommendation, AppliedRecommendation, InsightNotification, LearningArticle, ArticleRead models
   - Run migration, verify schema
   - Seed 5 LearningArticle records (Spaced Repetition, Active Recall, VARK, Cognitive Load, Circadian Rhythms)
4. Spawn `backend-architect`:
   - Implement RecommendationsEngine (prioritization algorithm: confidence 30% + impact 40% + ease 20% + readiness 10%)
   - Implement GoalManager (template-based + custom goals, automated progress tracking)
   - Implement AcademicPerformanceIntegration (behavioral score composite formula)
5. Spawn `data-engineer`:
   - Implement Pearson correlation analysis (behavioral score vs exam scores)
   - Statistical significance (p-value calculation)
   - Minimum 8 weeks data validation
6. Spawn `backend-architect` (APIs):
   - GET `/api/analytics/behavioral-insights/dashboard`
   - GET `/api/analytics/behavioral-insights/patterns/evolution`
   - GET `/api/analytics/behavioral-insights/progress`
   - GET `/api/analytics/behavioral-insights/recommendations`
   - POST `/api/analytics/behavioral-insights/recommendations/:id/apply`
   - POST `/api/analytics/behavioral-insights/goals`
   - PATCH `/api/analytics/behavioral-insights/goals/:id/progress`
   - GET `/api/analytics/behavioral-insights/goals/:id`
   - GET `/api/analytics/behavioral-insights/correlation`
   - GET `/api/analytics/behavioral-insights/learning-science/:articleId`

**Week 3:**
7. Spawn `frontend-developer`:
   - Dashboard page: `/analytics/behavioral-insights` (4 tabs: Patterns/Progress/Goals/Learn)
   - LearningPatternsGrid component (2×2 pattern cards)
   - PatternEvolutionTimeline component (horizontal timeline)
   - PerformanceCorrelationChart component (dual-axis Recharts)
   - BehavioralGoalsSection component (active goals grid)
   - RecommendationsPanel component (top 5 recommendations)
   - Notification system (InsightNotification model → in-app toasts)
8. Integrate with Stories 5.1 & 5.2 APIs (consume existing endpoints)
9. Implement data export & privacy controls (FERPA-compliant JSON, cascading deletion)
10. Run E2E tests (from Phase 2)
11. Fix failures until 100% pass
12. Run `*story-approved` workflow

**Completion Criteria:**
- [ ] All 14 tasks completed
- [ ] All E2E tests pass 100%
- [ ] Dashboard renders all 4 tabs
- [ ] Pearson correlation validated (p < 0.05 for significance)
- [ ] Code review passed
- [ ] Story status: Approved

---

**Phase 3 Summary:**
- 3 stories implemented in parallel
- 38 total tasks completed (13 + 11 + 14)
- ~358 estimated hours of work (completed in 2 weeks via parallelization)
- All E2E tests passing 100%
- Integration contracts validated

---

### Phase 4: Story 5.5 Implementation
**Duration:** Week 4 (1 week)
**Owner:** Amelia (Developer)

**Prerequisites:**
- ✅ Story 5.1 complete (UserLearningProfile, BehavioralPattern, BehavioralInsight)
- ✅ Story 5.2 complete (StrugglePrediction, InterventionRecommendation)
- ✅ Story 5.3 complete (session orchestration data)
- ✅ Story 5.4 complete (cognitive load data)

**Implementation:**
1. Load `story-context-5.5.xml`
2. Run `*develop` workflow (#yolo mode)
3. Spawn `database-architect`:
   - Create migration: PersonalizationConfig, PersonalizationPreferences models
   - Run migration, verify schema
4. Spawn `backend-architect`:
   - Implement PersonalizationEngine (orchestrator: aggregates insights from 5.1-5.4)
   - Multi-armed bandit algorithm (epsilon-greedy: 90% exploit, 10% explore)
   - 4 strategy variants for A/B testing
5. Spawn `ml-engineer`:
   - A/B testing framework (min 20 users/variant, 2 weeks duration, p < 0.05)
   - Statistical significance validation
   - Effectiveness tracking (before/after metrics)
6. Integrate with existing systems:
   - Mission Generator (personalized mission generation)
   - Content Recommendation Engine (VARK-based)
   - Validation Prompt Generator (difficulty optimization)
   - Session Orchestrator (attention pattern adaptation)
7. Spawn `frontend-developer`:
   - Personalization settings page (NONE/LOW/MEDIUM/HIGH levels)
   - Feature-level disable toggles
   - Effectiveness dashboard (correlation metrics)
8. Implement privacy controls (opt-out, data export, complete deletion)
9. Run E2E tests
10. Fix failures until 100% pass
11. Run `*story-approved` workflow

**Completion Criteria:**
- [ ] All 17 tasks completed
- [ ] All E2E tests pass 100%
- [ ] Personalization works with real behavioral data (no mocks)
- [ ] Multi-armed bandit validated (strategy selection working)
- [ ] Code review passed
- [ ] Story status: Approved

---

### Phase 5: Final Quality Gate
**Duration:** Week 5 (1 week)
**Owner:** Murat (Master Test Architect)

**Quality Validation:**
1. Run `*trace` workflow:
   - Map all Epic 5 acceptance criteria → tests
   - Verify 100% coverage
   - Generate traceability matrix
2. Run `*nfr-assess` workflow:
   - Performance validation (cognitive load <100ms, orchestration <1s)
   - Privacy compliance (FERPA/GDPR, data export, deletion)
   - Accessibility (WCAG 2.1 AA)
   - Security (OAuth token encryption, API authentication)
3. Run `*gate` workflow:
   - Quality gate decision assessment
   - Production readiness checklist
   - Risk analysis
4. Integration testing:
   - End-to-end flow: 5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6
   - Cross-story scenarios (cognitive load → orchestration → dashboard)
   - Data flow validation (behavioral events → patterns → personalization)
5. Performance testing:
   - Load testing (100 concurrent users)
   - Response time validation (p95 < 500ms)
   - Database query optimization (N+1 elimination)
6. Final approval:
   - Code review complete
   - Documentation complete
   - Deployment checklist ready

**Acceptance Criteria:**
- [ ] All acceptance criteria mapped to passing tests
- [ ] NFR requirements validated
- [ ] Quality gate PASS
- [ ] Integration tests 100% pass
- [ ] Performance benchmarks met
- [ ] Epic 5 production-ready ✅

---

## Integration Contracts (To Be Created by Winston)

**File:** `docs/epic-5-integration-contracts.md`

**Contents:**
1. **Shared TypeScript Interfaces:**
   - `CognitiveLoadData` (5.4 → 5.3, 5.6)
   - `OrchestrationRecommendation` (5.3 → 5.5, 5.6)
   - `PersonalizationContext` (5.5 → all)
   - `BehavioralInsight` (5.1 → 5.6)

2. **API Integration Points:**
   - 5.3 `/api/orchestration/cognitive-load` ← 5.4 cognitive load data
   - 5.4 `/api/analytics/cognitive-load/current` → 5.3 intensity modulation
   - 5.6 `/api/analytics/behavioral-insights/dashboard` ← consumes 5.1, 5.2, 5.3, 5.4 APIs
   - 5.5 `PersonalizationEngine.applyPersonalization()` → orchestrates all

3. **Database Relationships:**
   - Mission (5.3 extends) ← UserLearningProfile (5.1)
   - CognitiveLoadMetric (5.4) → StrugglePrediction (5.2) via COGNITIVE_OVERLOAD
   - BehavioralGoal (5.6) → BehavioralPattern (5.1) via pattern references
   - PersonalizationConfig (5.5) → all behavioral models

4. **Event Flow:**
   - BehavioralEvent (session metrics) → CognitiveLoadMonitor → StruggleDetectionEngine → InterventionEngine
   - StudyScheduleRecommendation → Mission generation → Session execution → BehavioralEvent (closes loop)

---

## Success Metrics

**Epic 5 Complete:**
- [ ] All 4 stories (5.3, 5.4, 5.5, 5.6) status: Approved
- [ ] 55 total tasks completed (13 + 11 + 17 + 14)
- [ ] ~500+ hours of work completed in 5 weeks
- [ ] All E2E tests passing 100%
- [ ] Integration tests passing 100%
- [ ] Quality gate: PASS
- [ ] Production deployment ready

**Quality Bar:**
- [ ] Python analytics: Research-grade quality (per CLAUDE.md)
- [ ] TypeScript: Strict type safety, no `any` types
- [ ] Test coverage: >90% for subsystems, 100% for APIs
- [ ] Performance: All latency requirements met
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Security: OAuth tokens encrypted, API authenticated

**Business Value:**
- [ ] Users can see optimal study times (5.3)
- [ ] Users receive personalized session schedules (5.3)
- [ ] System detects cognitive overload automatically (5.4)
- [ ] Burnout prevention interventions active (5.4)
- [ ] All platform features adapt to individual learners (5.5)
- [ ] Users gain self-awareness via behavioral insights dashboard (5.6)

---

## Risk Management

**High Risks:**
1. **Google Calendar API Rate Limits (Story 5.3)**
   - Mitigation: Implement caching (1-hour TTL), throttling, graceful degradation
   - Fallback: Use behavioral patterns only (no calendar)

2. **Insufficient Behavioral Data (Story 5.5)**
   - Mitigation: Graceful degradation when <6 weeks data, clear messaging
   - Fallback: Template-based personalization (no ML predictions)

3. **Real-Time Performance (<100ms for Story 5.4)**
   - Mitigation: Client-side tracking, server aggregation, aggressive caching
   - Validation: Performance engineer runs load tests

**Medium Risks:**
1. **Integration Conflicts (3 parallel stories)**
   - Mitigation: Winston creates contracts FIRST, architect-review validates
   - Detection: Daily integration tests

2. **Test Coverage Gaps**
   - Mitigation: ATDD approach (tests first), Murat enforces 100% AC coverage
   - Validation: Trace workflow maps all ACs → tests

**Low Risks:**
1. **Privacy Compliance (FERPA/GDPR)**
   - Mitigation: All stories include privacy controls, NFR assessment validates
   - Audit: Story 5.6 implements comprehensive data export/deletion

---

## Agent Communication Protocol

**Status Updates:**
- Each Amelia reports to Bob daily (progress %, blockers, next steps)
- Each Murat reports test coverage metrics
- Winston reports integration conflicts immediately

**Blocker Escalation:**
- Agent encounters blocker → Notify Bob
- Bob evaluates: Can another agent help? Need user input?
- Resolve within 24 hours

**Integration Coordination:**
- All agents read `docs/epic-5-integration-contracts.md`
- API changes → Update contracts, notify dependent agents
- Database schema changes → Run migration in shared dev DB

---

## 🚨 CRITICAL AGENT PROTOCOLS (MANDATORY)

### **Every Agent MUST Follow These Rules:**

#### 1. **Document Loading (REQUIRED)**
**BEFORE starting ANY work, EVERY agent must:**

```
STEP 1: Load CLAUDE.md
- Path: /Users/kyin/Projects/Americano-epic5/CLAUDE.md
- Contains: Analytics quality standards (Python research-grade excellence)
- Action: Read complete file, apply standards to ALL implementation

STEP 2: Load AGENTS.md (if exists)
- Path: /Users/Kyin/Projects/Americano/bmad/bmm/AGENTS.md
- Contains: Agent coordination protocols
- Action: Read if present, understand agent hierarchy

STEP 3: Use Context7 for Latest Documentation
- For EVERY library/framework used:
  - Call: mcp__context7__resolve-library-id (get library ID)
  - Call: mcp__context7__get-library-docs (get latest docs)
- Examples: Next.js, React, Prisma, TypeScript, Recharts, scikit-learn
- Action: Use LATEST documentation (not training data)
```

#### 2. **Agent Delegation (REQUIRED)**
**All Level 2 agents (Winston, Murat, Amelia) MUST delegate to specialized agents:**

**Delegation Protocol:**
- Identify task requiring specialization (database design, API development, testing, etc.)
- Select appropriate specialized agent from:
  - BMAD agents: `/Users/Kyin/Projects/Americano/bmad/bmm/agents/*.md`
  - Claude Code plugins: `~/.claude/plugins/marketplaces/claude-code-workflows/plugins/*`
- Spawn agent using Task tool with:
  - Complete task description
  - Required context (story context XML, integration contracts, etc.)
  - CRITICAL instruction: "Read CLAUDE.md and use Context7 before starting"
  - Expected output format
- Monitor agent progress
- Validate agent output before proceeding

**Example Delegation (Amelia → backend-architect):**
```
Task: Implement StudyTimeRecommender subsystem for Story 5.3
Agent: backend-architect (Claude Code plugin)
Instructions:
- CRITICAL: Read /Users/kyin/Projects/Americano-epic5/CLAUDE.md for quality standards
- CRITICAL: Use Context7 to get latest Next.js and TypeScript documentation
- Load story context: docs/stories/story-context-5.3.xml
- Implement: apps/web/src/subsystems/behavioral-analytics/study-time-recommender.ts
- Algorithm: Optimal time slot detection (performance-based scoring)
- Output: TypeScript class with full implementation, unit tests, JSDoc
```

#### 3. **Nested Agent Spawning (ALLOWED)**
**Level 3 agents (specialized Claude Code plugins) CAN spawn their own sub-agents:**

**Example:**
```
backend-architect (spawned by Amelia)
  └── Can spawn:
      ├── tdd-orchestrator (for test-first development)
      ├── code-reviewer (for quality validation)
      └── debugger (for troubleshooting)
```

**Protocol:**
- Level 3 agents follow same CRITICAL rules (load CLAUDE.md, use Context7)
- Level 3 agents report back to their Level 2 parent
- Nesting depth limit: 3 levels maximum (Bob → BMAD agent → Plugin agent → Sub-plugin agent)

#### 4. **Workflow Adherence (REQUIRED)**
**All BMAD agents (Winston, Murat, Amelia) MUST follow BMAD workflow system:**

**Workflow Execution:**
1. Load workflow engine: `/Users/Kyin/Projects/Americano/bmad/core/tasks/workflow.xml`
2. Load workflow config: `{workflow-path}/workflow.yaml`
3. Execute workflow steps in EXACT order
4. Follow all workflow rules:
   - #yolo mode: Skip optional steps, no user prompts (for continuous execution)
   - Normal mode: Ask user at decision points
   - Template-output tags: Save after EACH step
   - Elicit tags: Execute immediately (unless #yolo)
5. Report completion status

**Example (Amelia running *develop workflow):**
```
1. Load: /Users/Kyin/Projects/Americano/bmad/core/tasks/workflow.xml
2. Load: /Users/Kyin/Projects/Americano/bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml
3. Mode: #yolo (continuous execution, no pauses)
4. Execute all steps until story complete (all ACs ✅, all tests pass 100%)
5. Report: Task completion summary to Bob
```

#### 5. **Quality Standards Enforcement (REQUIRED)**
**All agents MUST enforce quality standards from CLAUDE.md:**

**Python/Analytics Quality Bar:**
- Research-grade excellence
- Statistical rigor (p-values, confidence intervals, effect sizes)
- Proper error handling
- Comprehensive testing
- Clear documentation

**TypeScript Quality Bar:**
- Strict type safety (no `any` types)
- Interface-first design
- Error handling with proper types
- Unit tests for all functions
- JSDoc for all public APIs

**Testing Standards:**
- 100% acceptance criteria coverage
- E2E tests for user flows
- Integration tests for cross-story dependencies
- Unit tests for subsystems (>90% coverage)
- Performance tests for latency requirements

#### 6. **Context7 Usage (REQUIRED)**
**All agents MUST use Context7 for library documentation:**

**Why:**
- Training data is outdated (knowledge cutoff: January 2025)
- Libraries have new versions, APIs, best practices
- Context7 provides LATEST official documentation

**How:**
```typescript
// STEP 1: Resolve library ID
const libraryId = await mcp__context7__resolve-library-id({ libraryName: "Next.js" });
// Result: "/vercel/next.js"

// STEP 2: Get latest docs for specific topic
const docs = await mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "API routes",
  tokens: 5000
});
// Result: Latest Next.js API routes documentation
```

**Required for:**
- Next.js (routing, API routes, server components)
- React (hooks, components, state management)
- Prisma (schema, migrations, queries)
- TypeScript (advanced types, generics)
- Recharts (data visualization)
- scikit-learn (ML algorithms)
- Any other library used in implementation

---

## Validation Checklist (Bob Reviews Before Each Phase)

**Phase 1 Start (Winston):**
- [ ] Winston loaded CLAUDE.md
- [ ] Winston using Context7 for architecture patterns
- [ ] Winston following *solution-architecture workflow

**Phase 2 Start (Murat × 3):**
- [ ] All 3 Murat instances loaded CLAUDE.md
- [ ] All using Context7 for test framework docs (Playwright, Jest)
- [ ] All following *atdd workflow
- [ ] All spawning test-automator agents correctly

**Phase 3 Start (Amelia × 3):**
- [ ] All 3 Amelia instances loaded CLAUDE.md
- [ ] All using Context7 for Next.js/React/Prisma docs
- [ ] All following *develop workflow (#yolo mode)
- [ ] All delegating to specialized agents (backend-architect, database-architect, frontend-developer)
- [ ] All specialized agents loading CLAUDE.md and using Context7

**Phase 4 Start (Amelia for 5.5):**
- [ ] Amelia loaded CLAUDE.md
- [ ] Using Context7 for ML libraries (scikit-learn)
- [ ] Following *develop workflow (#yolo mode)
- [ ] Delegating to ml-engineer, backend-architect

**Phase 5 Start (Murat - Quality Gate):**
- [ ] Murat loaded CLAUDE.md
- [ ] Following *trace, *nfr-assess, *gate workflows
- [ ] All quality standards validated

---

## Agent Spawn Template (For Bob)

**When spawning ANY agent, use this template:**

```
Agent: {agent_name}
Role: {specialized_role}

🚨 CRITICAL INSTRUCTIONS (Read First):

1. Load Project Standards:
   - Read /Users/kyin/Projects/Americano-epic5/CLAUDE.md completely
   - Apply Python/analytics research-grade quality bar to ALL work
   - Apply TypeScript strict type safety standards

2. Use Context7 for Latest Documentation:
   - Call mcp__context7__resolve-library-id for each library
   - Call mcp__context7__get-library-docs for latest docs
   - Use LATEST documentation, NOT training data

3. Workflow Execution (for BMAD agents only):
   - Load /Users/Kyin/Projects/Americano/bmad/core/tasks/workflow.xml
   - Load workflow config: {workflow_path}
   - Follow workflow steps in EXACT order
   - Mode: {#yolo | normal}

4. Agent Delegation (REQUIRED):
   - Delegate specialized tasks to Claude Code plugin agents
   - Each delegated agent MUST also read CLAUDE.md and use Context7
   - Monitor delegated agent progress
   - Validate outputs before proceeding

5. Task Context:
   {specific_task_description}
   {required_files_to_load}
   {expected_outputs}
   {acceptance_criteria}

6. Report Format:
   - Task completion status
   - Outputs generated (file paths)
   - Tests run (pass/fail)
   - Blockers encountered (if any)
   - Next steps recommended
```

---

## Execution Checklist

### Pre-Launch (Bob)
- [x] Story context XMLs generated (5.3, 5.4, 5.5, 5.6)
- [x] Implementation plan documented
- [ ] User approval to execute
- [ ] Git branch created: `feature/epic-5-full-implementation`

### Phase 1: Architecture (Winston)
- [ ] Integration contracts created
- [ ] Architect-review validation passed
- [ ] Bob approval received

### Phase 2: ATDD (Murat × 3)
- [ ] Story 5.3 E2E tests generated
- [ ] Story 5.4 E2E tests generated
- [ ] Story 5.6 E2E tests generated
- [ ] All tests run and fail (no implementation yet)

### Phase 3: Implementation (Amelia × 3)
- [ ] Story 5.3 complete, tests 100% pass
- [ ] Story 5.4 complete, tests 100% pass
- [ ] Story 5.6 complete, tests 100% pass
- [ ] Integration tests pass

### Phase 4: Story 5.5 (Amelia)
- [ ] Story 5.5 complete, tests 100% pass
- [ ] Personalization works with real data

### Phase 5: Quality Gate (Murat)
- [ ] Trace workflow complete
- [ ] NFR assessment complete
- [ ] Quality gate PASS
- [ ] Production deployment checklist complete

### Final (Bob)
- [ ] All 4 stories approved
- [ ] Epic 5 merged to main
- [ ] Retrospective completed
- [ ] Documentation updated

---

## Agent Spawn Commands

**Phase 1: Winston (Integration Coordinator)**
```
Load agent: /Users/Kyin/Projects/Americano/bmad/bmm/agents/architect.md

Task: Create Epic 5 integration contracts
- Review story contexts: 5.3, 5.4, 5.6
- Identify integration points (API, database, events)
- Create shared interfaces document
- Validate no conflicts
- Spawn architect-review for validation
- Output: docs/epic-5-integration-contracts.md
```

**Phase 2: Murat × 3 (ATDD Test Generation)**
```
Murat 1: Load agent, run *atdd for Story 5.3
Murat 2: Load agent, run *atdd for Story 5.4
Murat 3: Load agent, run *atdd for Story 5.6
```

**Phase 3: Amelia × 3 (Parallel Implementation)**
```
Amelia 1: Load agent, run *develop for Story 5.3 (#yolo mode)
Amelia 2: Load agent, run *develop for Story 5.4 (#yolo mode)
Amelia 3: Load agent, run *develop for Story 5.6 (#yolo mode)
```

**Phase 4: Amelia (Story 5.5)**
```
Amelia 4: Load agent, run *develop for Story 5.5 (#yolo mode)
```

**Phase 5: Murat (Quality Gate)**
```
Murat: Load agent, run *trace, *nfr-assess, *gate
```

---

## Notes

- All agents MUST read CLAUDE.md for quality standards
- All agents MUST use Context7 for latest library documentation
- All database migrations run on shared dev database
- All code committed to `feature/epic-5-full-implementation` branch
- Daily standup: All agents report status to Bob
- Weekly retrospective: Adjust strategy based on progress

---

**Plan Status:** READY TO EXECUTE
**Awaiting:** User approval to launch Phase 1 (Winston)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-16 by Bob (Scrum Master)
