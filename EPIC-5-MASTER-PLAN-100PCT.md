# Epic 5 → True 100% Research-Grade Completion - Master Plan

**Created:** 2025-10-17
**Goal:** World-class research-grade quality for all Epic 5 stories
**Resources:** 1 FTE + AI Agent Team
**Timeline:** 10-12 weeks
**Current Status:** 68% → Target: 100%

---

## Executive Summary

This plan takes Epic 5 from its current 68% actual completion to **true 100% research-grade quality** by:
1. **Week 1-2:** Fix critical blockers (Story 5.2 ML, Story 5.5 UI, Story 5.4 algorithm)
2. **Week 3-5:** Upgrade all algorithms to peer-review quality
3. **Week 6-8:** Achieve production quality (tests, security, performance)
4. **Week 9-12:** ML operations infrastructure + advanced features

**ROI Strategy:** Highest-value work first, leverage AI agents for parallel execution

---

## 📋 Complete Task Breakdown

### **PHASE 1: Critical Blockers** (Week 1-2) - 72h total

#### Week 1: Story 5.2 - ML Prediction System (40h)

**Task 1.1: ML Feature Extraction Pipeline** (8h)
- **Agent:** `data-engineering:data-engineer`
- **Deliverables:**
  - `StruggleFeatureExtractor` class (production TypeScript)
  - 15+ normalized features:
    - Performance: retention, decline rate, review lapses, session scores, validation
    - Prerequisites: gap count, mastery gaps
    - Complexity: content difficulty, mismatch with ability
    - Behavioral: historical struggles, content type mismatch, cognitive load
    - Contextual: days until exam, recency, workload
  - Feature scaling/normalization pipeline
  - Missing value handling (default to 0.5 neutral)
  - Data quality scoring
- **Files:** `src/subsystems/behavioral-analytics/struggle-feature-extractor.ts`
- **Tests:** Feature extraction unit tests (10 test cases)

**Task 1.2: Train Gradient Boosting Model** (10h)
- **Agent:** `machine-learning-ops:ml-engineer`
- **Deliverables:**
  - Historical data collection script (query last 6 months)
  - Train/test split (80/20, stratified by user)
  - XGBoost model training with hyperparameter tuning:
    - Max depth: 3-10
    - Learning rate: 0.01-0.3
    - N estimators: 100-500
  - Cross-validation (5-fold)
  - Model serialization (pickle + metadata JSON)
  - Performance metrics: precision, recall, F1, ROC-AUC
  - Target: 65%+ accuracy (MVP), 80%+ ideal
- **Files:**
  - `apps/ml-service/models/struggle_predictor.pkl`
  - `apps/ml-service/models/model_metadata.json`
  - `scripts/train_struggle_model.py`
- **Metrics:** Achieve F1 score ≥ 0.70

**Task 1.3: Struggle Prediction API Layer** (8h)
- **Agent:** `backend-development:backend-architect`
- **Deliverables:**
  - 7 API endpoints:
    1. `POST /api/analytics/predictions/generate` - Run batch predictions
    2. `GET /api/analytics/predictions` - List predictions for user
    3. `GET /api/analytics/predictions/:id` - Get single prediction
    4. `POST /api/analytics/predictions/:id/feedback` - User feedback on accuracy
    5. `GET /api/analytics/interventions` - List recommended interventions
    6. `POST /api/analytics/interventions/:id/apply` - Mark intervention applied
    7. `GET /api/analytics/model-performance` - Model accuracy metrics
  - Zod validation for all request bodies
  - Proper error handling (try-catch, user-friendly messages)
  - Rate limiting (3 predictions per day per user)
- **Files:** `src/app/api/analytics/predictions/**`
- **Tests:** API integration tests (7 endpoints × 3 scenarios = 21 tests)

**Task 1.4: Intervention Engine** (6h)
- **Agent:** `llm-application-dev:ai-engineer`
- **Deliverables:**
  - `InterventionEngine` class
  - 6 intervention types with generation logic:
    1. **Prerequisite Review** - if gap in foundational knowledge
    2. **Difficulty Progression** - if complexity mismatch detected
    3. **Cognitive Load Reduction** - if overload indicators
    4. **Spaced Repetition Boost** - if historical struggle pattern
    5. **Content Format Adjustment** - if learning style mismatch
    6. **Session Timing Optimization** - if suboptimal study time
  - Learning pattern tailoring (use UserLearningProfile)
  - Priority scoring (0-10, based on prediction confidence + severity)
  - Reasoning generation (explain why intervention recommended)
- **Files:** `src/subsystems/behavioral-analytics/intervention-engine.ts`
- **Tests:** Intervention generation tests (6 types × 2 scenarios)

**Task 1.5: Prediction UI Dashboard** (8h)
- **Agent:** `frontend-mobile-development:frontend-developer`
- **Deliverables:**
  - Page: `/app/analytics/struggle-predictions/page.tsx`
  - Components:
    - `StrugglePredictionCard` - Shows prediction with probability, factors, timeline
    - `InterventionPanel` - Displays recommended interventions with apply button
    - `PredictionAccuracyChart` - Model performance over time (Recharts)
    - `PredictionFeedbackDialog` - User marks if prediction was accurate
  - Accessibility: ARIA labels, keyboard navigation
  - Responsive: Mobile-first, 320px-768px+ breakpoints
  - Animations: Tailwind v4 fade-in, slide-in
- **Files:** `src/app/analytics/struggle-predictions/page.tsx` + 4 components
- **Tests:** Component smoke tests (4 components)

---

#### Week 2: Story 5.5 Personalization + Story 5.4 Polish (32h)

**Task 2.1: Personalization Dashboard UI** (12h)
- **Agent:** `frontend-mobile-development:frontend-developer`
- **Deliverables:**
  - Page: `/app/analytics/personalization/page.tsx`
  - 4 main sections:
    1. **Active Personalizations Panel** - Shows what's currently personalized:
       - Content difficulty adjustments
       - Session duration modifications
       - Content type preferences
       - Study timing recommendations
       - For each: show current setting, effectiveness score, toggle on/off
    2. **Manual Controls** - Sliders/toggles to adjust:
       - Difficulty preference (easier ← → harder)
       - Session length preference (shorter ← → longer)
       - Content type weights (visual/auditory/reading/kinesthetic)
       - Adaptation aggressiveness (conservative ← → aggressive)
    3. **A/B Test Results** - Shows experiments running:
       - Experiment name, variant assigned, current performance
       - Winner declared if statistically significant
       - Option to opt-out of experiments
    4. **Effectiveness Timeline** - Chart showing personalization impact:
       - Retention score before vs after
       - Session completion rate
       - User satisfaction ratings
  - State management: React Context for personalization settings
  - Real-time updates: Poll API every 30s for experiment status
- **Files:**
  - `src/app/analytics/personalization/page.tsx`
  - `src/components/personalization/ActivePersonalizationsPanel.tsx`
  - `src/components/personalization/ManualControlsSection.tsx`
  - `src/components/personalization/ABTestResultsPanel.tsx`
  - `src/components/personalization/EffectivenessChart.tsx`
- **APIs Used:**
  - `GET /api/personalization/config` - Current settings
  - `PATCH /api/personalization/preferences` - Update manual controls
  - `GET /api/personalization/experiments` - Active A/B tests
  - `GET /api/personalization/effectiveness` - Historical data

**Task 2.2: Multi-Armed Bandit for Personalization** (8h)
- **Agent:** `machine-learning-ops:ml-engineer`
- **Deliverables:**
  - Thompson Sampling implementation:
    - Beta distribution per personalization strategy
    - Reward = retention improvement (0-1)
    - Update beliefs after each session
    - Epsilon-greedy fallback (ε=0.1 for exploration)
  - Reward tracking system:
    - Session-level rewards (completion, accuracy, duration appropriateness)
    - Aggregate to strategy-level performance
    - Decay old rewards (exponential, half-life 30 days)
  - Automatic optimization:
    - Re-select best strategy every mission generation
    - Gradually shift traffic to winners
    - Ensure minimum exploration (10% random)
  - Bandit state persistence (database: `PersonalizationExperiment` table)
- **Files:**
  - `src/subsystems/behavioral-analytics/multi-armed-bandit.ts`
  - Database migration: Add `rewardHistory` JSON field to `PersonalizationExperiment`
- **Algorithm:** Thompson Sampling with Beta priors
- **Tests:** Bandit selection tests (reward scenarios, exploration/exploitation balance)

**Task 2.3: Research-Grade Cognitive Load Algorithm** (12h)
- **Agent:** `machine-learning-ops:data-scientist`
- **Deliverables:**
  - Implement **Sweller's Cognitive Load Theory**:
    - **Intrinsic Load** (IL): Element interactivity
      - Count: prerequisite relationships per objective
      - Formula: IL = log₂(1 + element_interactivity)
      - Normalize: 0-1 scale
    - **Extraneous Load** (EL): Design factors
      - Content presentation quality (0-1)
      - Instruction clarity (measured via validation responses)
      - Formula: EL = 1 - avg(presentation_quality, instruction_clarity)
    - **Germane Load** (GL): Desirable difficulty
      - Schema construction effort
      - Formula: GL = retrieval_difficulty × learning_benefit
    - **Total Cognitive Load**: CL = IL + EL (minimize) + GL (optimize)
  - **Working Memory Capacity Modeling**:
    - Miller's 7±2 chunks
    - Individual capacity estimation from performance
    - Adjust difficulty to stay within capacity
  - **Real-time Thresholds**:
    - Overload: CL > 0.85 → Intervention (break, simplify)
    - Optimal: 0.5 < CL < 0.75 → Continue
    - Underload: CL < 0.4 → Increase difficulty
  - Replace simple weighted average in `cognitive-load-monitor.ts`
- **Files:**
  - `src/subsystems/behavioral-analytics/cognitive-load-monitor.ts` (refactor)
  - `src/subsystems/behavioral-analytics/cognitive-load-theory.ts` (new)
- **Research Citations:** Sweller (1988), Kalyuga et al. (2003)
- **Tests:** CLT calculation tests (element interactivity scenarios)

---

### **PHASE 2: Research-Grade Algorithms** (Week 3-5) - 84h total

#### Week 3: Story 5.1 Algorithm Upgrades (32h)

**Task 3.1: Ebbinghaus Forgetting Curve** (10h)
- **Agent:** `machine-learning-ops:data-scientist`
- **Deliverables:**
  - Replace basic exponential decay with **Ebbinghaus model**:
    - Formula: R(t) = R₀ × e^(-kt)
    - R₀ = initial retention (from first review)
    - k = decay constant (personalized per user per topic)
    - t = time since last review (days)
  - **Personalized Decay Constants**:
    - Fit k from historical review data (non-linear regression)
    - Separate k per content type (lecture vs practice)
    - Update k as new review data arrives
  - **Spacing Effect Integration**:
    - Optimal review intervals: t₁, t₂, t₃... where R(tₙ) ≈ 0.7
    - Expanding intervals (1d, 3d, 7d, 14d, 30d, ...)
  - **Confidence Intervals**:
    - Bootstrap sampling for k estimation
    - Report 95% CI on predicted retention
- **Files:** `src/subsystems/behavioral-analytics/forgetting-curve-analyzer.ts` (refactor)
- **Research:** Ebbinghaus (1885), Cepeda et al. (2006)
- **Validation:** R² ≥ 0.75 on historical data

**Task 3.2: Advanced Study-Time Statistical Modeling** (12h)
- **Agent:** `data-engineering:data-engineer`
- **Deliverables:**
  - **Time-Series Analysis**:
    - ARIMA model for session performance over time
    - Detect trends, seasonality, anomalies
    - Forecast optimal study windows
  - **Circadian Rhythm Integration**:
    - Two-process model (Process C + Process S)
    - Process C: Circadian rhythm (24h cycle, peaks ~10 AM, 6 PM)
    - Process S: Sleep homeostasis (degrades during day, resets with sleep)
    - Combine for alertness prediction
  - **Bayesian Optimization**:
    - Gaussian Process for time-of-day → performance mapping
    - Acquisition function: Expected Improvement
    - Recommend study times that maximize expected performance
  - **Multi-armed Bandit for Time Windows**:
    - Treat each hour as an arm
    - Reward = session performance
    - Thompson Sampling to balance exploration/exploitation
- **Files:**
  - `src/subsystems/behavioral-analytics/study-time-analyzer.ts` (major refactor)
  - `src/subsystems/behavioral-analytics/circadian-rhythm-model.ts` (new)
- **Libraries:** (Python backend recommended): `scipy.stats`, `statsmodels`, `sklearn.gaussian_process`
- **Validation:** Compare recommendations to user's actual best times (accuracy ≥ 70%)

**Task 3.3: ML-Based Content Preference Clustering** (10h)
- **Agent:** `machine-learning-ops:ml-engineer`
- **Deliverables:**
  - Replace rule-based VARK with **ML clustering**:
    - Features: content type engagement (time, completions, scores)
    - Algorithm: K-Means → DBSCAN (handles outliers better)
    - K=4 (visual, auditory, reading, kinesthetic)
  - **Dimensionality Reduction**:
    - PCA for visualization (2D projection)
    - t-SNE for cluster separation validation
  - **VARK Reinforcement**:
    - Initial cluster assignment from VARK quiz (if available)
    - Refine with actual usage data
    - Hybrid: 30% quiz, 70% behavior
  - **Cluster Interpretation**:
    - Extract top features per cluster (feature importance)
    - Generate natural language descriptions
    - Example: "You prefer visual diagrams (72%) with some hands-on practice (28%)"
- **Files:** `src/subsystems/behavioral-analytics/content-preference-analyzer.ts` (refactor)
- **Validation:** Silhouette score ≥ 0.5 (good cluster separation)

---

#### Week 4: Story 5.3 - Optimal Timing Completion (28h)

**Task 4.1: Google Calendar OAuth 2.0 Full Implementation** (8h)
- **Agent:** `backend-development:backend-architect`
- **Deliverables:**
  - **OAuth 2.0 Authorization Code Flow**:
    1. **Initiate:** `GET /api/calendar/connect` → Redirect to Google consent screen
    2. **Callback:** `GET /api/calendar/callback?code=...` → Exchange code for tokens
    3. **Token Storage:** Encrypt access_token + refresh_token (AES-256)
    4. **Token Refresh:** Auto-refresh when access_token expires (<60s before expiry)
    5. **Revocation:** `POST /api/calendar/disconnect` → Revoke tokens, delete from DB
  - **Google Calendar API Integration**:
    - Fetch events: `GET https://www.googleapis.com/calendar/v3/calendars/primary/events`
    - Query params: `timeMin`, `timeMax`, `singleEvents=true`
    - Parse response: extract `summary`, `start`, `end`, `status`
  - **Error Handling**:
    - Token expired → Auto-refresh → Retry request
    - User revoked access → Clear tokens, notify user
    - API rate limit → Exponential backoff, cache results
  - **Security**:
    - CSRF protection (state parameter)
    - HTTPS only
    - Encrypt tokens at rest (prisma field-level encryption)
- **Files:**
  - `src/app/api/calendar/connect/route.ts`
  - `src/app/api/calendar/callback/route.ts`
  - `src/app/api/calendar/disconnect/route.ts`
  - `src/lib/calendar/google-oauth.ts`
  - `src/lib/encryption.ts` (AES-256 utilities)
- **Tests:** OAuth flow integration test (mock Google API)

**Task 4.2: Constraint Satisfaction Solver for Scheduling** (12h)
- **Agent:** `data-engineering:backend-architect`
- **Deliverables:**
  - **Constraint Optimization Model**:
    - Library: Google OR-Tools (CP-SAT solver)
    - Variables: study_slot[hour] ∈ {0, 1} (binary: study or not)
    - Objective: Maximize Σ(performance_score[hour] × study_slot[hour])
    - Constraints:
      1. Total study time = user's target (e.g., 2h/day)
      2. No calendar conflicts (if busy[hour] = 1, study_slot[hour] = 0)
      3. Minimum session length (e.g., ≥30min continuous)
      4. Maximum sessions per day (e.g., ≤3 to avoid fatigue)
      5. Respect user blackout hours (e.g., no study midnight-6am)
  - **Conflict Resolution**:
    - If no feasible solution (over-scheduled day):
      - Relax constraints (allow shorter sessions)
      - Suggest moving low-priority calendar events
      - Propose multi-day distribution
  - **Optimization Algorithm**:
    - CP-SAT solver (Google OR-Tools)
    - Timeout: 5 seconds
    - If timeout, return best-so-far solution
- **Files:**
  - `src/subsystems/behavioral-analytics/schedule-optimizer.ts` (new)
  - Install: `pnpm add google-or-tools` (or use Python backend)
- **Alternative:** If OR-Tools too heavy, use greedy algorithm with backtracking
- **Tests:** Scheduling scenarios (various constraints, conflict handling)

**Task 4.3: Real-Time Session Orchestration** (8h)
- **Agent:** `observability-monitoring:observability-engineer`
- **Deliverables:**
  - **WebSocket Integration**:
    - Endpoint: `ws://localhost:3000/api/orchestration/session-live`
    - Events:
      - `session.start` → Initialize monitoring
      - `session.progress` → Every 5 min, send metrics
      - `session.alert` → Real-time cognitive load warning
      - `session.complete` → Finalize, store analytics
  - **Live Adaptation Logic**:
    - Monitor: performance score, time on task, error rate
    - If cognitive load >0.85 → Send alert: "You're showing signs of fatigue. Take a 5-min break?"
    - If performance drop >20% → Suggest easier content
    - If too fast completion → Suggest harder content
  - **Energy Tracking**:
    - Estimate: alertness = circadian_model(time_of_day) × (1 - fatigue)
    - Fatigue accumulates: Δfatigue = session_duration / optimal_duration
    - Break resets fatigue: fatigue *= 0.5
  - **Architecture**:
    - Next.js API route with WebSocket upgrade
    - Redis for session state (if scaling needed)
    - Client: React hook `useSessionOrchestration`
- **Files:**
  - `src/app/api/orchestration/session-live/route.ts`
  - `src/hooks/use-session-orchestration.ts`
  - `src/subsystems/behavioral-analytics/energy-tracker.ts` (new)
- **Tests:** WebSocket integration test (mock session, verify alerts)

---

#### Week 5: Close the Loop - Integration (24h)

**Task 5.1: Epic 5 → Epic 3 Mission Generation Integration** (8h)
- **Agent:** `backend-development:backend-architect`
- **Deliverables:**
  - **Modify `MissionGenerator.ts`** to query Epic 5 data:
    ```typescript
    async generatePersonalizedMission(userId: string): Promise<Mission> {
      // 1. Query behavioral data
      const learningProfile = await getUserLearningProfile(userId);
      const burnoutRisk = await assessBurnoutRisk(userId);
      const strugglePredictions = await getStrugglePredictions(userId);
      const personalizedConfig = await getPersonalizationConfig(userId);
      const optimalTime = await getOptimalStudyTime(userId, new Date());

      // 2. Adjust mission timing
      mission.recommendedStartTime = optimalTime.startTime;
      mission.estimatedDuration = learningProfile.optimalSessionDuration;

      // 3. Adjust mission difficulty
      if (burnoutRisk.score > 0.7 || strugglePredictions.some(p => p.probability > 0.8)) {
        mission.difficultyRating = Math.max(1, mission.difficultyRating - 1); // Easier
      }

      // 4. Adjust content selection
      const learningStyle = learningProfile.learningStyleProfile;
      mission.objectives = selectObjectives(learningStyle, personalizedConfig);

      // 5. Adjust session structure
      if (personalizedConfig.sessionDurationPreference === 'SHORTER') {
        mission.objectives = mission.objectives.slice(0, 3); // Fewer objectives
      }

      return mission;
    }
    ```
  - **Integration Points**:
    - Timing: Use `StudyTimeRecommender.generateRecommendations()`
    - Difficulty: Use `DifficultyAdapter.adjustDifficulty()`
    - Content: Use `ContentSequencer.sequenceObjectives()`
    - Duration: Use `SessionDurationOptimizer.optimizeDuration()`
  - **Validation**:
    - Compare missions before/after Epic 5 integration
    - Ensure personalization actually applied
    - Test edge cases (no Epic 5 data yet, disabled personalization)
- **Files:**
  - `src/lib/mission-generator.ts` (major refactor)
  - Add type: `PersonalizedMissionContext` interface
- **Tests:** Mission generation integration tests (various behavioral states)

**Task 5.2: Closed-Loop Personalization System** (10h)
- **Agent:** `machine-learning-ops:mlops-engineer`
- **Deliverables:**
  - **Feedback Loop Architecture**:
    ```
    BehavioralPatterns (Story 5.1)
      ↓ (inform)
    PersonalizationStrategies (Story 5.5)
      ↓ (applied in)
    Missions & Sessions (Story 5.3)
      ↓ (measured by)
    PersonalizationEffectiveness (Story 5.5)
      ↓ (updates)
    BehavioralPatterns (loop closed)
    ```
  - **Effectiveness Tracking**:
    - Before: Measure baseline (retention, completion, satisfaction)
    - After: Measure with personalization active
    - Attribution: Use matched cohorts or propensity scores
    - Metrics: Δ retention, Δ completion, Δ time-to-mastery
  - **Pattern Refinement**:
    - If personalization effective (Δ >10%) → Increase confidence in pattern
    - If ineffective (Δ <5%) → Decrease confidence, try alternative
    - If harmful (Δ <0%) → Disable, investigate root cause
  - **Automatic Tuning**:
    - Hyperparameters: difficulty step size, session duration range
    - Use Bayesian optimization (Optuna library)
    - Objective: Maximize user retention × engagement
  - **Database Schema**:
    - Add `PersonalizationFeedbackLoop` table:
      - pattern_id, personalization_id, outcome_id
      - baseline_metric, personalized_metric, improvement
      - feedback_timestamp
- **Files:**
  - `src/subsystems/behavioral-analytics/personalization-feedback-loop.ts` (new)
  - Database migration: `PersonalizationFeedbackLoop` table
- **Validation:** Simulate feedback loop, verify pattern confidence adjusts

**Task 5.3: A/B Test Automation with Statistical Significance** (6h)
- **Agent:** `machine-learning-ops:data-scientist`
- **Deliverables:**
  - **Experiment Framework**:
    - Random assignment: 50/50 split (control vs treatment)
    - Stratification: Balance by user experience level
    - Sample size calculation: Power analysis (80% power, α=0.05)
  - **Statistical Tests**:
    - Continuous outcomes (retention score): t-test
    - Binary outcomes (completed mission): chi-square test
    - Survival analysis (time to mastery): log-rank test
  - **Winner Selection**:
    - Declare winner if p-value <0.05 AND effect size >10%
    - If no winner after 2 weeks or 100 samples → Extend or conclude no difference
    - Bayesian alternative: If P(treatment > control) >95% → Winner
  - **Auto-Rollout**:
    - Winner declared → Gradually shift traffic (10%/day)
    - Monitor for regression (if performance drops, rollback)
    - Update default strategy in `PersonalizationConfig`
  - **Safety Checks**:
    - Min sample size: 30 per group
    - Max experiment duration: 4 weeks
    - Stop early if one variant clearly harmful (p<0.01 worse)
- **Files:**
  - `src/subsystems/behavioral-analytics/ab-testing-framework.ts` (refactor)
  - `src/subsystems/behavioral-analytics/statistical-tests.ts` (new)
- **Libraries:** Consider Python backend: `scipy.stats`, `statsmodels`
- **Tests:** Statistical test scenarios (various outcomes, sample sizes)

---

### **PHASE 3: Production Quality** (Week 6-8) - 96h total

#### Week 6: Comprehensive Testing (40h)

**Task 6.1: Unit Tests for All Analyzers** (20h)
- **Agent:** `unit-testing:test-automator` (run in parallel)
- **Deliverables:**
  - **Test Coverage Target: 80%**
  - **Test Structure** (per analyzer):
    ```typescript
    describe('StudyTimeAnalyzer', () => {
      describe('analyzeOptimalStudyTimes', () => {
        it('should identify peak performance times', ...)
        it('should handle insufficient data gracefully', ...)
        it('should weight recent sessions higher', ...)
        it('should filter outliers', ...)
        it('should calculate confidence correctly', ...)
      });
    });
    ```
  - **Analyzers to Test** (12 files):
    1. `study-time-analyzer.ts` (10 tests)
    2. `session-duration-analyzer.ts` (8 tests)
    3. `forgetting-curve-analyzer.ts` (12 tests - complex)
    4. `content-preference-analyzer.ts` (10 tests)
    5. `behavioral-pattern-engine.ts` (15 tests - orchestrator)
    6. `cognitive-load-monitor.ts` (12 tests - CLT complex)
    7. `burnout-prevention-engine.ts` (8 tests)
    8. `difficulty-adapter.ts` (8 tests)
    9. `personalization-engine.ts` (15 tests)
    10. `study-time-recommender.ts` (10 tests)
    11. `orchestration-adaptation-engine.ts` (10 tests)
    12. `struggle-prediction-model.ts` (12 tests)
  - **Mock Data Generators**:
    - `mockUserLearningProfile()`
    - `mockBehavioralEvents(count, pattern)`
    - `mockStudySessions(count, performanceRange)`
  - **Edge Cases**:
    - No historical data (new user)
    - Sparse data (only 2-3 sessions)
    - Conflicting patterns (morning vs evening performance)
    - Extreme values (100% error rate, 0% retention)
- **Files:** `src/subsystems/behavioral-analytics/__tests__/*.test.ts` (12 files)
- **Tools:** Jest, `@testing-library/react` for UI tests
- **Metrics:** Run `pnpm test:coverage`, verify ≥80%

**Task 6.2: Integration Tests for Epic 5 Workflows** (12h)
- **Agent:** `unit-testing:test-automator`
- **Deliverables:**
  - **End-to-End Workflows** (6 scenarios):
    1. **Pattern Analysis → Personalization**:
       - Setup: User with 6 weeks of session data
       - Trigger: Weekly pattern analysis cron job
       - Assert: BehavioralPattern created, PersonalizationConfig updated
    2. **Prediction → Intervention**:
       - Setup: User struggling with prerequisite gaps
       - Trigger: Prediction generation
       - Assert: StrugglePrediction created, InterventionRecommendation generated
    3. **Personalization → Mission**:
       - Setup: User with personalized difficulty setting (EASIER)
       - Trigger: Generate mission
       - Assert: Mission difficulty adjusted down, optimal timing applied
    4. **Cognitive Load → Alert**:
       - Setup: Active study session, increasing error rate
       - Trigger: Real-time cognitive load calculation
       - Assert: Alert sent when load >0.85, recommends break
    5. **A/B Test → Winner Selection**:
       - Setup: Experiment with 100 samples, significant difference
       - Trigger: Statistical test runner
       - Assert: Winner declared, traffic shifted, experiment closed
    6. **Calendar Integration → Schedule Recommendation**:
       - Setup: User with Google Calendar events
       - Trigger: Request study time recommendations
       - Assert: No conflicts, optimal time within free slots
  - **Test Database**:
    - Separate test DB (Prisma test environment)
    - Seed script with realistic data
    - Teardown after each test (clean state)
- **Files:**
  - `__tests__/integration/pattern-to-personalization.test.ts`
  - `__tests__/integration/prediction-to-intervention.test.ts`
  - `__tests__/integration/personalization-to-mission.test.ts`
  - `__tests__/integration/cognitive-load-alerting.test.ts`
  - `__tests__/integration/ab-test-winner-selection.test.ts`
  - `__tests__/integration/calendar-schedule-recommendation.test.ts`
- **Tools:** Jest, Supertest (API testing), Prisma test client

**Task 6.3: ML Model Evaluation Suite** (8h)
- **Agent:** `machine-learning-ops:ml-engineer`
- **Deliverables:**
  - **Evaluation Metrics**:
    - **Confusion Matrix**: TP, TN, FP, FN
    - **Classification Metrics**:
      - Precision = TP / (TP + FP) → "When we predict struggle, how often correct?"
      - Recall = TP / (TP + FN) → "Of actual struggles, how many did we catch?"
      - F1 Score = 2 × (Precision × Recall) / (Precision + Recall)
      - ROC-AUC → Overall discriminative ability
    - **Calibration**: Predicted probability vs actual rate
    - **Feature Importance**: SHAP values or Gini importance
  - **Cross-Validation**:
    - 5-fold stratified CV
    - Report mean ± std of metrics
  - **Model Drift Detection**:
    - Monitor feature distributions (KL divergence)
    - If drift >0.1 → Alert for retraining
    - Track prediction accuracy over time (rolling window)
  - **Comparison Baseline**:
    - Compare to rule-based model
    - Compare to naive baseline (always predict majority class)
    - Report improvement: "ML model +15% F1 over rule-based"
- **Files:**
  - `apps/ml-service/evaluation/evaluate_struggle_model.py`
  - `apps/ml-service/monitoring/model_drift_detector.py`
- **Tools:** `sklearn.metrics`, `scikit-plot`, `shap`
- **Deliverable:** Model evaluation report (JSON + visual HTML)

---

#### Week 7: Performance & Security (32h)

**Task 7.1: Analytics Query Optimization** (10h)
- **Agent:** `observability-monitoring:database-optimizer`
- **Deliverables:**
  - **Fix N+1 Queries** (identified in architecture review):
    - Pattern engine fetching insights in loop → Single query with `hasSome`
    - Recommendation engine loading users in loop → Batch query
  - **Add Pagination** to all list endpoints:
    ```typescript
    // Add to all GET /api/analytics/* endpoints:
    const { page = 1, limit = 50 } = query;
    const patterns = await prisma.behavioralPattern.findMany({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { confidence: 'desc' }
    });
    ```
  - **Implement Caching Layer**:
    - Redis for hot data (user learning profiles, recent patterns)
    - TTL: UserLearningProfile (1h), BehavioralPattern (12h)
    - Cache invalidation: On pattern analysis completion
  - **Database Query Review**:
    - Analyze slow query log (Prisma query time >100ms)
    - Add indices where missing (identified 3-5 queries)
    - Rewrite inefficient queries (use aggregate functions)
  - **Performance Targets**:
    - API response time: p50 <100ms, p95 <500ms, p99 <1s
    - Pattern analysis: <5s for 6 months of data
    - Prediction generation: <2s per objective
- **Files:**
  - All API routes (add pagination)
  - `src/lib/cache.ts` (Redis client)
  - `prisma/schema.prisma` (add indices)
- **Tools:** Redis, Prisma query analyzer, `npx prisma studio`
- **Validation:** Run load test before/after, measure improvement

**Task 7.2: Input Validation & Security Hardening** (8h)
- **Agent:** `data-validation-suite:backend-security-coder`
- **Deliverables:**
  - **Zod Schemas for All Endpoints** (40+ endpoints):
    ```typescript
    // Example: POST /api/analytics/predictions/generate
    const GeneratePredictionsSchema = z.object({
      userId: z.string().cuid(),
      objectiveIds: z.array(z.string().cuid()).min(1).max(20),
      options: z.object({
        includeInterventions: z.boolean().default(true),
        minConfidence: z.number().min(0).max(1).default(0.5)
      }).optional()
    });

    export async function POST(request: Request) {
      const body = GeneratePredictionsSchema.parse(await request.json());
      // ... rest of endpoint
    }
    ```
  - **Calendar Token Encryption**:
    - Encrypt `CalendarIntegration.accessToken` and `.refreshToken`
    - Use AES-256-GCM with app-level secret key
    - Decrypt on read, re-encrypt on write
    - Field-level encryption in Prisma middleware
  - **Rate Limiting** (compute-heavy endpoints):
    - Pattern analysis: 1 request per 24h per user
    - Prediction generation: 3 requests per day per user
    - A/B test creation: 5 requests per day per user
    - Use Redis: `SET rate:${userId}:${action} 1 EX ${ttl} NX`
  - **Security Checklist**:
    - ✅ SQL injection: Prevented by Prisma (parameterized queries)
    - ✅ XSS: Sanitize user inputs (use DOMPurify on frontend)
    - ✅ CSRF: Next.js built-in protection
    - ✅ Sensitive data in logs: Redact userId, tokens, scores
    - ✅ HTTPS only: Enforce in production
- **Files:**
  - All API routes (add Zod validation)
  - `src/lib/encryption.ts` (AES-256 utilities)
  - `src/lib/rate-limit.ts` (Redis rate limiter)
  - `prisma/middleware.ts` (field encryption)
- **Tools:** `zod`, `crypto` (Node.js built-in), Redis
- **Tests:** Security tests (invalid inputs, rate limit, encryption)

**Task 7.3: Load Testing & Performance Benchmarks** (8h)
- **Agent:** `observability-monitoring:performance-engineer`
- **Deliverables:**
  - **k6 Load Test Scripts** (6 scenarios):
    1. **Pattern Analysis** (compute-heavy):
       - Virtual users: 10 concurrent
       - Duration: 5 minutes
       - Target: p95 <5s, no errors
    2. **Prediction Generation** (ML inference):
       - Virtual users: 50 concurrent
       - Duration: 10 minutes
       - Target: p95 <2s, no errors
    3. **Mission Generation with Personalization**:
       - Virtual users: 100 concurrent
       - Duration: 10 minutes
       - Target: p95 <500ms, no errors
    4. **API Endpoint Mix** (realistic traffic):
       - Virtual users: 200 concurrent
       - Duration: 30 minutes
       - Mix: 70% reads, 20% writes, 10% analytics
       - Target: p95 <500ms, error rate <0.1%
    5. **WebSocket Session Orchestration**:
       - Virtual users: 50 concurrent sessions
       - Duration: 15 minutes
       - Target: No dropped connections, latency <100ms
    6. **Database Stress Test** (max throughput):
       - Ramp up to 1000 VUs
       - Find breaking point
       - Measure: Queries/sec at p99 <1s
  - **Performance Benchmarks**:
    - Document baseline metrics (before optimization)
    - Document after optimization
    - Report improvement %
  - **Thresholds**:
    - API: p50 <100ms, p95 <500ms, p99 <1s
    - Analytics: p95 <5s
    - Database: Queries/sec >500 at p99 <1s
- **Files:**
  - `load-tests/pattern-analysis.js`
  - `load-tests/prediction-generation.js`
  - `load-tests/mission-generation.js`
  - `load-tests/api-mix.js`
  - `load-tests/websocket-session.js`
  - `load-tests/database-stress.js`
- **Tools:** k6, Grafana (visualization)
- **Deliverable:** Performance benchmark report (Markdown + graphs)

**Task 7.4: Observability & Monitoring Setup** (6h)
- **Agent:** `observability-monitoring:observability-engineer`
- **Deliverables:**
  - **Structured Logging**:
    - Use Pino logger (structured JSON logs)
    - Log levels: DEBUG, INFO, WARN, ERROR
    - Context: userId, requestId, endpoint, duration
    - Redact sensitive fields: tokens, passwords, PII
  - **Distributed Tracing**:
    - OpenTelemetry instrumentation
    - Trace: API request → Subsystem → Database
    - Span attributes: userId, objectiveId, duration
    - Export to: Jaeger (local) or Honeycomb (production)
  - **Metrics**:
    - Prometheus metrics:
      - API request rate, latency (histogram), error rate
      - Pattern analysis duration, success rate
      - Prediction accuracy (gauge, updated daily)
      - Database query time (histogram)
    - Custom metrics:
      - `epic5_pattern_analysis_duration_seconds`
      - `epic5_prediction_accuracy`
      - `epic5_personalization_effectiveness`
  - **Alerting**:
    - Alert on: Error rate >1%, p95 latency >1s, prediction accuracy drop >10%
    - Slack webhook or PagerDuty
  - **Dashboards**:
    - Grafana dashboard: "Epic 5 Analytics Health"
      - Panels: API latency, error rate, throughput
      - Pattern analysis queue depth, success rate
      - Prediction model accuracy over time
- **Files:**
  - `src/lib/logger.ts` (Pino setup)
  - `src/lib/telemetry.ts` (OpenTelemetry)
  - `monitoring/prometheus.yml` (scrape config)
  - `monitoring/grafana-dashboard.json`
- **Tools:** Pino, OpenTelemetry, Prometheus, Grafana, Jaeger
- **Deliverable:** Monitoring dashboard + alerting rules

---

#### Week 8: Code Quality & Documentation (24h)

**Task 8.1: Remove TODO/FIXME, Eliminate `any` Types** (8h)
- **Agent:** `tdd-workflows:code-reviewer`
- **Deliverables:**
  - **Systematic Code Cleanup**:
    - Search: `grep -r "TODO\|FIXME\|XXX\|HACK" src/` (found 23)
    - Address each:
      - Implement: If straightforward (e.g., "TODO: Add error handling")
      - Create task: If complex (e.g., "TODO: Implement advanced ML model")
      - Remove: If obsolete (e.g., "FIXME: This was fixed in PR #123")
  - **Type Safety**:
    - Search: `grep -r "any" src/` (found 15+)
    - Replace with proper types:
      - `any[]` → Typed array (e.g., `BehavioralPattern[]`)
      - `any` function param → Interface (e.g., `features: FeatureVector`)
      - JSON fields → Type with `as` assertion (e.g., `as UserPreferences`)
  - **ESLint Rules**:
    - Enable: `@typescript-eslint/no-explicit-any` (error)
    - Enable: `@typescript-eslint/no-unsafe-assignment` (warn)
    - Run: `pnpm run lint --fix`
  - **Code Quality Metrics**:
    - Before: 23 TODOs, 15 `any` types
    - After: 0 TODOs, 0 `any` types
    - TSLint score: 100/100
- **Files:** All TypeScript files in `src/`
- **Tools:** grep, ESLint, TypeScript compiler
- **Validation:** `pnpm run lint` passes, `pnpm run typecheck` passes

**Task 8.2: Comprehensive API Documentation** (8h)
- **Agent:** `bmm-api-documenter`
- **Deliverables:**
  - **OpenAPI 3.0 Specification**:
    - Document all 40+ Epic 5 endpoints
    - For each endpoint:
      - Path, method, summary, description
      - Request body schema (Zod → JSON Schema)
      - Response schemas (success, error)
      - Example requests/responses (realistic data)
      - Authentication (session cookie)
      - Rate limits, error codes
  - **Integration Guides**:
    - "How to Integrate Epic 5 Analytics" (Markdown)
    - Code examples: Fetch patterns, generate predictions, apply personalizations
    - Common workflows: "New user onboarding", "Weekly pattern analysis"
  - **API Reference Website**:
    - Use Swagger UI or Redoc
    - Host at `/api-docs` in Next.js app
    - Searchable, interactive (try API calls)
  - **Postman Collection**:
    - Export OpenAPI → Import to Postman
    - Pre-configured environment (localhost, staging, production)
    - Example requests for all endpoints
- **Files:**
  - `docs/api/openapi.yaml` (or JSON)
  - `docs/api/integration-guide.md`
  - `src/app/api-docs/page.tsx` (Swagger UI)
  - `postman/epic5-collection.json`
- **Tools:** OpenAPI Generator, Swagger UI, Redoc
- **Deliverable:** Live API docs at `/api-docs`

**Task 8.3: Architecture Decision Records (ADRs)** (8h)
- **Agent:** `bmm-technical-decisions-curator`
- **Deliverables:**
  - **ADR Template**:
    ```markdown
    # ADR-XXX: Title

    ## Status
    Accepted / Proposed / Deprecated

    ## Context
    What problem are we solving?

    ## Decision
    What did we decide?

    ## Consequences
    - Pros: ...
    - Cons: ...
    - Risks: ...
    ```
  - **Epic 5 ADRs** (10 decisions):
    1. **ADR-001: Use TypeScript for Behavioral Analytics Subsystems**
       - Decision: Keep TypeScript despite Python recommendation
       - Reason: Existing codebase, team expertise, type safety
    2. **ADR-002: XGBoost for Struggle Prediction**
       - Decision: XGBoost over Neural Networks
       - Reason: Interpretability, smaller data, faster training
    3. **ADR-003: Thompson Sampling for Multi-Armed Bandit**
       - Decision: Thompson Sampling over UCB or Epsilon-Greedy
       - Reason: Bayesian reasoning, better exploration
    4. **ADR-004: Sweller's CLT for Cognitive Load**
       - Decision: Sweller's theory over custom heuristic
       - Reason: Research-validated, peer-reviewed, industry standard
    5. **ADR-005: Google Calendar OAuth 2.0**
       - Decision: Support Google Calendar only (MVP)
       - Reason: Most popular, OAuth well-documented, future: add Outlook
    6. **ADR-006: WebSocket for Real-Time Orchestration**
       - Decision: WebSocket over Server-Sent Events (SSE)
       - Reason: Bidirectional, lower latency, better for interactive sessions
    7. **ADR-007: Redis for Caching**
       - Decision: Redis over in-memory cache
       - Reason: Persistence, scalability, shared across instances
    8. **ADR-008: Prisma for Database ORM**
       - Decision: Continue with Prisma (established in Epic 1)
       - Reason: Type safety, migrations, existing investment
    9. **ADR-009: Zod for Input Validation**
       - Decision: Zod over Joi or Yup
       - Reason: TypeScript-first, inferred types, smaller bundle
    10. **ADR-010: Weekly Batch Pattern Analysis**
        - Decision: Automated analysis every Sunday 11 PM
        - Reason: Sufficient data accumulation, off-peak hours, user habit
- **Files:**
  - `docs/adr/001-typescript-for-analytics.md`
  - `docs/adr/002-xgboost-for-prediction.md`
  - ... (10 total)
- **Tools:** Markdown, ADR template
- **Deliverable:** 10 ADRs documenting key Epic 5 decisions

---

### **PHASE 4: MLOps Infrastructure** (Week 9-10) - 56h total

#### Week 9: MLOps Infrastructure (32h)

**Task 9.1: Model Versioning & Registry** (8h)
- **Agent:** `machine-learning-ops:mlops-engineer`
- **Deliverables:**
  - **MLflow Setup**:
    - Install: `pip install mlflow`
    - Start MLflow server: `mlflow server --host 0.0.0.0 --port 5000`
    - Storage: SQLite (local) or PostgreSQL (production)
  - **Model Tracking**:
    - Log every training run:
      - Hyperparameters (max_depth, learning_rate, etc.)
      - Metrics (F1, precision, recall, ROC-AUC)
      - Artifacts (model.pkl, feature_importance.png)
    - Tag models: `production`, `staging`, `experimental`
  - **Model Registry**:
    - Register model: `mlflow.register_model(model_uri, "StrugglePrediction")`
    - Versions: v1, v2, v3...
    - Transitions: None → Staging → Production → Archived
  - **Deployment Pipeline**:
    - Staging: Automatically deploy latest model to staging environment
    - Production: Manual approval → Deploy → Canary rollout (10% traffic)
    - Rollback: If performance degrades, revert to previous version
- **Files:**
  - `apps/ml-service/mlflow_config.py`
  - `apps/ml-service/training/train_with_mlflow.py`
  - `scripts/deploy_model.sh` (CI/CD integration)
- **Tools:** MLflow, PostgreSQL
- **Deliverable:** MLflow UI at `http://localhost:5000`

**Task 9.2: Automated Model Retraining Pipeline** (12h)
- **Agent:** `machine-learning-ops:mlops-engineer`
- **Deliverables:**
  - **Trigger Conditions**:
    - **Data Drift**: KL divergence >0.1 on feature distributions
    - **Concept Drift**: Prediction accuracy drop >10% over 2 weeks
    - **Scheduled**: Every 30 days (minimum)
  - **Pipeline Steps**:
    1. **Data Collection**: Query last 90 days of sessions, predictions, outcomes
    2. **Feature Extraction**: Run StruggleFeatureExtractor on all data
    3. **Data Validation**: Check for data quality issues (missing values, outliers)
    4. **Model Training**: Train new XGBoost model with same hyperparameters
    5. **Model Evaluation**: Compare to current production model (F1 score)
    6. **Automated Deployment**: If new model F1 > current + 0.03 → Deploy to staging
    7. **Notification**: Slack message with training results
  - **Safe Rollout**:
    - Deploy to staging first (manual testing)
    - Canary: 10% production traffic for 24h
    - If no issues: Ramp to 100% over 3 days
    - If issues: Automatic rollback, alert engineer
  - **Monitoring**:
    - Track: Retraining frequency, model performance over time
    - Alert: If retraining fails or new model worse than old
- **Files:**
  - `apps/ml-service/training/automated_retraining_pipeline.py`
  - `apps/ml-service/monitoring/drift_detector.py`
  - `scripts/retrain_cron.sh` (cron job wrapper)
- **CI/CD:** GitHub Actions workflow: `.github/workflows/model-retraining.yml`
- **Deliverable:** Automated retraining pipeline (end-to-end test)

**Task 9.3: Model Performance Monitoring Dashboard** (8h)
- **Agent:** `observability-monitoring:observability-engineer`
- **Deliverables:**
  - **Grafana Dashboard: "Epic 5 ML Model Performance"**
    - Panels:
      1. **Prediction Accuracy Over Time** (line chart):
         - X-axis: Date, Y-axis: F1 score
         - Compare: Production model vs baseline (rule-based)
      2. **Confusion Matrix** (heatmap):
         - TP, TN, FP, FN counts
         - Updated daily
      3. **Feature Drift** (line chart):
         - X-axis: Date, Y-axis: KL divergence per feature
         - Alert threshold: 0.1
      4. **Prediction Volume** (bar chart):
         - Predictions generated per day
         - Segmented by: confidence level (low, medium, high)
      5. **Intervention Success Rate** (line chart):
         - % of interventions that prevented struggles
         - Segmented by: intervention type
      6. **A/B Test Results** (table):
         - Experiment name, variant, sample size, winner
  - **Data Sources**:
    - Prometheus metrics (exported from Next.js API)
    - PostgreSQL (direct query for historical data)
  - **Refresh Rate**: Every 5 minutes (real-time-ish)
- **Files:**
  - `monitoring/grafana-dashboards/ml-model-performance.json`
  - `src/lib/metrics.ts` (export prediction metrics to Prometheus)
- **Tools:** Grafana, Prometheus, PostgreSQL
- **Deliverable:** Live Grafana dashboard

**Task 9.4: Feature Store Implementation (Optional)** (4h)
- **Agent:** `machine-learning-ops:mlops-engineer`
- **Deliverables:**
  - **Feature Store Architecture**:
    - Centralized feature computation (avoid recomputing same features)
    - Storage: Redis (online features) + PostgreSQL (offline features)
    - API: `GET /features/:userId/:featureSet` → Returns computed features
  - **Feature Sets**:
    - `user_performance_features`: retention, review lapses, session scores
    - `user_behavioral_features`: study times, session durations, learning style
    - `objective_complexity_features`: difficulty, prerequisites, content type
  - **Caching Strategy**:
    - TTL: 1 hour for fast-changing features, 24h for slow-changing
    - Invalidation: On session completion, pattern analysis
  - **Consistency**:
    - Ensure feature computation same for training and inference
    - Use same code path (avoid training-serving skew)
  - **Alternative**: If full feature store too heavy, use simple caching in Redis
- **Files:**
  - `src/lib/feature-store.ts` (if implementing)
  - Or: Enhance `src/lib/cache.ts` with feature-specific methods
- **Tools:** Redis (existing), Feast (if full feature store)
- **Decision:** Evaluate if needed based on feature computation complexity

---

#### Week 10: UI/UX Polish & Accessibility (24h)

**Task 10.1: Mobile Responsive Layouts Fine-Tuning** (8h)
- **Agent:** `frontend-mobile-development:frontend-developer`
- **Deliverables:**
  - **Breakpoint Testing** (4 sizes):
    - Mobile (320px-480px): iPhone SE, Galaxy S8
    - Phablet (481px-768px): iPhone Pro Max, Pixel 7
    - Tablet (769px-1024px): iPad, Galaxy Tab
    - Desktop (1025px+): Laptop, monitor
  - **Layout Adjustments**:
    - Charts: Stack vertically on mobile, side-by-side on desktop
    - Tables: Horizontal scroll on mobile, full width on desktop
    - Navigation: Hamburger menu on mobile, full nav on desktop
    - Forms: Single column on mobile, two columns on desktop
  - **Touch Targets**:
    - Minimum size: 44×44px (iOS HIG), 48×48px (Material Design)
    - Spacing: ≥8px between interactive elements
    - No hover-only interactions (use tap instead)
  - **Performance**:
    - Images: Lazy loading, srcset for responsive sizes
    - Fonts: Subset fonts, preload critical fonts
    - JS: Code-split by route, defer non-critical scripts
  - **Testing**:
    - Use Chrome DevTools device emulation
    - Test on real devices (iOS Safari, Android Chrome)
    - Check: scrolling smoothness, input usability, readability
- **Files:** All page components (`src/app/*/page.tsx`)
- **Tools:** Chrome DevTools, Lighthouse, BrowserStack (optional)
- **Validation:** Lighthouse mobile score ≥90

**Task 10.2: Animation Polish & Loading States** (8h)
- **Agent:** `frontend-mobile-development:frontend-developer`
- **Deliverables:**
  - **Skeleton Loaders** (Suspense boundaries):
    - Replace: Generic "Loading..." text
    - With: Content-shaped skeletons (gray rectangles pulsing)
    - Use: `@shadcn/ui` Skeleton component
    - Locations: All data-fetching components (charts, tables, cards)
  - **Staggered Entrances**:
    - Animate: List items entering one-by-one
    - Use: Tailwind `animate-in fade-in slide-in-from-bottom`
    - Delay: `style={{ animationDelay: `${index * 100}ms` }}`
    - Example: Prediction cards, recommendation panels
  - **Micro-Interactions**:
    - Buttons: `hover:scale-105 active:scale-95 transition-transform`
    - Switches: `transition-all duration-300` for smooth toggle
    - Tooltips: `animate-in fade-in slide-in-from-top-2`
  - **Page Transitions** (Next.js App Router):
    - Use: `<motion.div>` from Framer Motion (if adopting)
    - Or: CSS transitions on route change
    - Effect: Fade out → Fade in (subtle)
  - **Progress Indicators**:
    - Long operations: Show progress bar (0-100%)
    - Pattern analysis: "Analyzing 6 weeks of data... 45%"
    - Model training: "Training model... Step 3 of 5"
  - **Design Constraints**:
    - NO gradients (per design system)
    - OKLCH colors only
    - Tailwind v4 built-in animations preferred
- **Files:** All UI components (especially `src/components/analytics/`)
- **Tools:** Tailwind CSS, Framer Motion (optional), `@shadcn/ui`
- **Validation:** Animations feel smooth, no janky transitions

**Task 10.3: WCAG 2.1 AAA Compliance Audit** (8h)
- **Agent:** `frontend-mobile-development:frontend-developer`
- **Deliverables:**
  - **Extended Accessibility** (beyond AA):
    - **Color Contrast**: 7:1 for normal text, 4.5:1 for large text (AAA)
      - Current: Likely AA (4.5:1), upgrade to AAA where possible
      - Use: WebAIM Contrast Checker
    - **Text Spacing**: Allow user to override
      - Line height ≥1.5× font size
      - Paragraph spacing ≥2× font size
      - Letter spacing ≥0.12× font size
    - **No Time Limits**: Remove or allow users to extend
      - Session timeout warnings: "Extend session" button
    - **Focus Indicators**: Enhanced (not just browser default)
      - Use: `ring-2 ring-offset-2 ring-blue-500` (Tailwind)
      - Visible on all interactive elements
  - **Keyboard-Only Navigation**:
    - Test: Can complete all tasks without mouse
    - Tab order: Logical, follows visual flow
    - Shortcuts: Document keyboard shortcuts (e.g., `?` for help)
  - **Screen Reader Testing**:
    - Use: VoiceOver (macOS), NVDA (Windows)
    - Check: All content announced correctly
    - Landmarks: `<main>`, `<nav>`, `<aside>`, `<article>`
    - Headings: Proper hierarchy (h1 → h2 → h3, no skips)
  - **Accessibility Audit Report**:
    - Use: axe DevTools, WAVE, Lighthouse
    - Document: Issues found, fixes applied
    - Target: 0 violations, 0 serious issues
- **Files:** All pages and components
- **Tools:** axe DevTools, WAVE, Lighthouse, VoiceOver, NVDA
- **Deliverable:** Accessibility audit report (Markdown)

---

### **PHASE 5: Advanced Features (OPTIONAL)** (Week 11-12) - 56h total

#### Week 11: Advanced ML Models (32h)

**Task 11.1: Ensemble Model for Predictions** (12h)
- **Agent:** `machine-learning-ops:ml-engineer`
- **Deliverables:**
  - **Ensemble Architecture**:
    - Combine 3 models:
      1. XGBoost (current)
      2. Random Forest (diversity)
      3. Logistic Regression (baseline, interpretable)
    - Ensemble method: Weighted average or stacking
  - **Weight Optimization**:
    - Use validation set to find optimal weights
    - Grid search or Bayesian optimization
    - Constraint: Weights sum to 1.0
  - **Expected Improvement**:
    - Target: +3-5% F1 score over single model
    - If no improvement, keep XGBoost alone (simpler)
  - **Implementation**:
    ```python
    def ensemble_predict(features):
      xgb_pred = xgb_model.predict_proba(features)[:, 1]
      rf_pred = rf_model.predict_proba(features)[:, 1]
      lr_pred = lr_model.predict_proba(features)[:, 1]

      # Weighted average (weights from optimization)
      final_pred = 0.5 * xgb_pred + 0.3 * rf_pred + 0.2 * lr_pred
      return final_pred
    ```
- **Files:**
  - `apps/ml-service/models/ensemble_model.py`
  - `apps/ml-service/training/train_ensemble.py`
- **Validation:** Ensemble F1 ≥ XGBoost F1 + 0.03

**Task 11.2: LSTM for Temporal Pattern Recognition** (12h)
- **Agent:** `machine-learning-ops:ml-engineer`
- **Deliverables:**
  - **LSTM Architecture**:
    - Input: Sequence of sessions (e.g., last 10 sessions)
    - Features per session: performance, duration, time-of-day, content
    - LSTM layers: 2 layers, 64 hidden units
    - Output: Struggle probability (sigmoid)
  - **Attention Mechanism** (optional):
    - Attend to most relevant sessions
    - Helps interpretability: "Session 3 and 7 most predictive"
  - **Training**:
    - Sequence length: 10 sessions
    - Loss: Binary cross-entropy
    - Optimizer: Adam, learning rate 0.001
    - Regularization: Dropout 0.3, early stopping
  - **Comparison to XGBoost**:
    - Hypothesis: LSTM better captures temporal dependencies
    - Evaluation: F1 score, ROC-AUC
    - If LSTM > XGBoost: Use LSTM, else keep XGBoost
  - **Libraries**: PyTorch or TensorFlow/Keras
- **Files:**
  - `apps/ml-service/models/lstm_model.py`
  - `apps/ml-service/training/train_lstm.py`
- **Deliverable:** LSTM model (if outperforms XGBoost)

**Task 11.3: Causal Inference for Interventions** (8h)
- **Agent:** `machine-learning-ops:data-scientist`
- **Deliverables:**
  - **Propensity Score Matching**:
    - Objective: Measure true intervention effect (not just correlation)
    - Treatment: User received intervention
    - Control: User did not receive intervention
    - Match: Users with similar propensity scores (covariates)
    - Compare: Struggle rate in matched pairs
  - **Counterfactual Analysis**:
    - Question: "Would user have struggled WITHOUT intervention?"
    - Method: Predict counterfactual outcome using ML
    - Estimate: ATE (Average Treatment Effect)
  - **Instrumental Variables** (if applicable):
    - If randomization not possible, use IV approach
    - Example: Day-of-week as instrument (random assignment)
  - **Causal Graph**:
    - Draw DAG (Directed Acyclic Graph):
      - Nodes: Intervention, Struggle, Performance, Effort
      - Edges: Causal relationships
    - Identify confounders, adjust in analysis
  - **Libraries**: `dowhy`, `econml` (Python)
- **Files:**
  - `apps/ml-service/analysis/causal_inference.py`
  - `docs/analysis/intervention-causal-effect.md` (report)
- **Deliverable:** Causal effect estimate (ATE with 95% CI)

---

#### Week 12: Final Polish & Validation (24h)

**Task 12.1: User Acceptance Testing** (8h)
- **Manual testing, no agent**
- **Deliverables:**
  - **Test Scenarios** (20 scenarios):
    - New user onboarding: Sign up → Upload lectures → First mission
    - Pattern recognition: Complete 10 sessions → Check pattern analysis
    - Struggle prediction: Trigger prediction → Receive alert → Apply intervention
    - Personalization: Adjust difficulty → Verify mission adapted
    - Cognitive load: Start session → Get overload alert → Take break
    - Calendar sync: Connect Google Calendar → Get conflict-free recommendations
    - A/B test: Join experiment → See variant → Provide feedback
    - etc. (13 more scenarios)
  - **Edge Cases**:
    - New user (no data): All features gracefully degrade
    - Disabled personalization: System respects user preference
    - Conflicting patterns: System handles ambiguity
    - API errors: Proper error messages, no crashes
  - **Browser Testing**:
    - Chrome, Firefox, Safari, Edge
    - Mobile: iOS Safari, Android Chrome
  - **Bug Tracking**:
    - Document bugs in GitHub Issues
    - Prioritize: Critical (blocks core flow) vs Nice-to-have
    - Fix critical bugs before launch
- **Tools:** Manual testing, browser DevTools
- **Deliverable:** UAT report (bugs found, fixed, deferred)

**Task 12.2: Performance Optimization Final Pass** (8h)
- **Agent:** `observability-monitoring:performance-engineer`
- **Deliverables:**
  - **Database Query Review**:
    - Analyze slow query log (queries >100ms)
    - Optimize: Add indices, rewrite queries, denormalize if needed
    - Target: p99 query time <500ms
  - **Caching Strategy Review**:
    - Identify: Hot data (accessed frequently)
    - Cache: User learning profiles, recent patterns, predictions
    - Invalidation: On data update (pattern analysis, personalization change)
  - **Bundle Size Optimization**:
    - Analyze: `pnpm run build`, check bundle sizes
    - Code-split: Lazy load heavy components (charts, modals)
    - Tree-shake: Remove unused imports
    - Target: Initial JS <200KB, total <500KB
  - **Image Optimization**:
    - Use: Next.js Image component (auto-optimization)
    - Format: WebP (modern browsers), JPEG fallback
    - Sizes: Responsive srcset
  - **Final Load Test**:
    - Run k6 scripts from Week 7
    - Compare: Before vs after optimization
    - Report: % improvement
- **Files:** Various (queries, components, configs)
- **Tools:** Prisma Studio, Chrome DevTools, k6
- **Deliverable:** Performance optimization report

**Task 12.3: Production Deployment Preparation** (8h)
- **Agent:** `backend-development:backend-architect`
- **Deliverables:**
  - **Database Migration Scripts**:
    - Review all Prisma migrations (Epic 5)
    - Test: Run migrations on staging database
    - Rollback plan: Down migrations (if needed)
    - Backup: Full database backup before migration
  - **Environment Variables**:
    - Document: All Epic 5 env vars (README.md)
    - Examples: `.env.example` file
    - Secrets: Use secret manager (not .env in production)
  - **Deployment Checklist**:
    - ✅ All tests pass (unit, integration, load)
    - ✅ Security review completed (Zod, encryption, rate limits)
    - ✅ Observability setup (logs, traces, metrics, alerts)
    - ✅ Database migrations tested
    - ✅ Rollback plan documented
    - ✅ On-call runbook created
  - **Monitoring Alerts**:
    - Configure: PagerDuty or Slack alerts
    - Triggers: Error rate >1%, latency >1s, model accuracy drop >10%
  - **Rollback Plan**:
    - If critical bug: Revert to previous deployment (git tag)
    - If database issue: Restore from backup
    - If ML model issue: Switch to previous version (MLflow)
  - **Runbook**:
    - "Epic 5 Production Runbook" (Markdown)
    - Sections: Architecture, common issues, troubleshooting, escalation
- **Files:**
  - `docs/deployment/production-checklist.md`
  - `docs/deployment/rollback-plan.md`
  - `docs/operations/runbook.md`
  - `.env.example`
- **Deliverable:** Production-ready deployment plan

---

## Success Criteria

### Phase 1 Complete (Week 2):
- [x] TypeScript 0 errors, build passes
- [ ] Struggle predictions working (≥60% accuracy)
- [ ] Personalization dashboard live, functional
- [ ] Cognitive load algorithm research-validated (Sweller CLT)

### Phase 2 Complete (Week 5):
- [ ] All 6 stories algorithmically sound (research-grade)
- [ ] Epic 5 → Epic 3 integration working
- [ ] Closed-loop personalization active
- [ ] A/B testing automated

### Phase 3 Complete (Week 8):
- [ ] 80% test coverage
- [ ] Security hardened (Zod, encryption, rate limits)
- [ ] Performance targets met (p95 <500ms)
- [ ] Production-ready

### Phase 4-5 Complete (Week 12):
- [ ] MLOps infrastructure live (MLflow, retraining pipeline)
- [ ] Advanced ML models deployed (ensemble, LSTM)
- [ ] WCAG 2.1 AAA compliant
- [ ] **TRUE 100% RESEARCH-GRADE QUALITY**

---

## Timeline Summary

| Phase | Duration | Focus | Completion |
|-------|----------|-------|------------|
| Phase 1 | Week 1-2 (72h) | Critical Blockers | 68% → 85% |
| Phase 2 | Week 3-5 (84h) | Research-Grade Algorithms | 85% → 92% |
| Phase 3 | Week 6-8 (96h) | Production Quality | 92% → 97% |
| Phase 4 | Week 9-10 (56h) | MLOps Infrastructure | 97% → 99% |
| Phase 5 | Week 11-12 (56h) | Advanced Features | 99% → **100%** |
| **TOTAL** | **12 weeks (364h)** | **Complete Epic 5** | **68% → 100%** |

---

## Execution Notes

### Parallel Agent Strategy:
- **Week 1-2**: 3-4 agents in parallel (ML + Backend + Frontend)
- **Week 3-5**: 2-3 agents per week
- **Week 6-8**: Test automation runs async overnight
- **Week 9-12**: 1-2 agents for specialized work

### Risk Management:
- **ML model underperforms**: Keep rule-based fallback, iterate
- **Calendar OAuth issues**: Mock first, implement OAuth after
- **Timeline slips**: Drop Phase 5, focus on Phase 1-3

### Checkpoints:
- **End of Week 2**: Go/no-go for continuing to Phase 2
- **End of Week 5**: Assess if Phase 4-5 needed or defer
- **End of Week 8**: Final production go/no-go

---

## Contact & Collaboration

- **Project Lead**: [Your Name]
- **Epic 5 Stories**: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
- **Target Launch**: Week 8 (production-ready) or Week 12 (research-grade)

---

**Last Updated**: 2025-10-17
**Version**: 1.0
**Status**: Ready for Execution 🚀
