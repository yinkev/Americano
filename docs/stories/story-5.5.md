# Story 5.5: Adaptive Personalization Engine

Status: Draft

## Story

As a medical student,
I want all platform features to adapt to my individual learning characteristics,
So that my study experience becomes increasingly personalized and effective over time.

## Acceptance Criteria

1. Personalization engine integrates insights from all behavioral analysis components (Stories 5.1-5.4)
2. Daily missions adapted based on individual learning patterns and predictions
3. Content recommendations personalized to learning style and performance history
4. Assessment difficulty and frequency optimized for individual learning progression
5. Study session structure adapted to personal attention patterns and preferences
6. Personalization effectiveness tracked through improved learning outcomes
7. User control over personalization levels and feature adaptation
8. Continuous improvement through feedback and performance correlation

## Tasks / Subtasks

### Task 1: Design Adaptive Personalization Framework (AC: #1, #7, #8)
- [ ] 1.1: Create `PersonalizationEngine` orchestrator class
  - Method: `applyPersonalization(userId, context): PersonalizationConfig`
  - Method: `aggregateInsights(userId): AggregatedInsights`
  - Method: `calculatePersonalizationScore(userId): EffectivenessScore`
  - Method: `updatePersonalizationSettings(userId, preferences): void`
- [ ] 1.2: Design `PersonalizationConfig` data structure
  - Fields: `missionPersonalization`, `contentPersonalization`, `assessmentPersonalization`, `sessionPersonalization`
  - Each subsection includes: enabled (Boolean), strategy (String), parameters (JSON), confidence (0.0-1.0)
- [ ] 1.3: Create `PersonalizationPreferences` model for user control
  - Fields: `userId`, `personalizationLevel` (NONE/LOW/MEDIUM/HIGH), `enabledFeatures[]`, `disabledFeatures[]`, `autoAdaptEnabled` (Boolean, default true)
  - Preferences override: User can disable specific personalization features
- [ ] 1.4: Run Prisma migration for personalization models

### Task 2: Integrate Learning Pattern Insights (AC: #1, Story 5.1 Integration)
- [ ] 2.1: Create `PatternInsightsAggregator` class
  - Method: `getOptimalStudyTimeInsights(userId): StudyTimeInsights`
  - Method: `getSessionDurationInsights(userId): SessionDurationInsights`
  - Method: `getLearningStyleInsights(userId): LearningStyleInsights`
  - Method: `getForgettingCurveInsights(userId): ForgettingCurveInsights`
- [ ] 2.2: Implement insight aggregation logic
  - Query `UserLearningProfile` for latest pattern analysis
  - Query `BehavioralPattern` records with confidence ≥ 0.7
  - Query `BehavioralInsight` records (active, not acknowledged)
  - Aggregate into unified insights object
- [ ] 2.3: Implement confidence weighting
  - Weight insights by pattern confidence score
  - Prioritize recent patterns (last 4 weeks) over older patterns
  - Require minimum data quality score (≥ 0.6) from UserLearningProfile

### Task 3: Integrate Predictive Analytics (AC: #1, Story 5.2 Integration)
- [ ] 3.1: Create `PredictiveAnalyticsIntegration` class
  - Method: `getStrugglePredictions(userId): StrugglePrediction[]`
  - Method: `getOptimalTimingPredictions(userId): TimingPrediction[]`
  - Method: `getPerformanceForecasts(userId, objective): PerformanceForecast`
- [ ] 3.2: Implement prediction aggregation
  - Query `PerformancePrediction` records for upcoming predictions
  - Filter by prediction confidence (≥ 0.7)
  - Sort by predicted impact (high-impact struggles prioritized)
- [ ] 3.3: Implement proactive intervention triggers
  - If struggle likelihood > 80% → Flag for personalized support
  - If optimal time window detected → Recommend mission scheduling adjustment
  - If performance forecast shows decline → Suggest difficulty reduction

### Task 4: Integrate Session Orchestration Patterns (AC: #1, #5, Story 5.3 Integration)
- [ ] 4.1: Create `SessionOrchestrationPersonalizer` class
  - Method: `personalizeSessionStructure(userId, mission): SessionStructure`
  - Method: `calculateOptimalBreakTiming(userId, sessionDuration): BreakSchedule`
  - Method: `adaptContentMixing(userId, sessionGoals): ContentMix`
- [ ] 4.2: Implement session structure personalization
  - Use optimal session duration from UserLearningProfile
  - Apply attention cycle patterns for break timing
  - Adjust warm-up/peak/wind-down phases based on personal performance peaks
- [ ] 4.3: Implement content mixing personalization
  - Use learning style profile to prioritize content types
  - Balance new content vs. review based on forgetting curve
  - Adjust difficulty progression based on cognitive load patterns
- [ ] 4.4: Implement break scheduling
  - Calculate break intervals from attention cycle patterns
  - Suggest break duration based on session length
  - Detect fatigue indicators during session → recommend early break

### Task 5: Integrate Cognitive Load Management (AC: #1, #4, Story 5.4 Integration)
- [ ] 5.1: Create `CognitiveLoadPersonalizer` class
  - Method: `assessCurrentCognitiveLoad(userId, sessionContext): LoadLevel`
  - Method: `recommendDifficultyAdjustment(userId, currentDifficulty): DifficultyRecommendation`
  - Method: `detectBurnoutRisk(userId): BurnoutRiskScore`
- [ ] 5.2: Implement real-time load assessment integration
  - Use cognitive load monitoring from Story 5.4
  - Apply stress detection patterns
  - Factor in recent performance trends
- [ ] 5.3: Implement dynamic difficulty adjustment
  - If cognitive load HIGH → reduce mission complexity
  - If burnout risk elevated → suggest rest day or lighter mission
  - If load LOW + high performance → increase challenge level
- [ ] 5.4: Implement workload balancing
  - Track weekly study volume
  - Recommend lighter/heavier days based on patterns
  - Prevent overcommitment (mission duration vs. available capacity)

### Task 6: Personalize Daily Mission Generation (AC: #2)
- [ ] 6.1: Update `MissionGenerator` with personalization integration
  - Method: `generatePersonalizedMission(userId, date): Mission`
  - Inject `PersonalizationEngine.applyPersonalization()` into generation flow
- [ ] 6.2: Implement optimal time recommendation
  - Use study time insights to set `Mission.recommendedStartTime`
  - Display optimal time window in mission briefing
  - Allow user to override recommendation
- [ ] 6.3: Implement duration personalization
  - Adjust `estimatedMinutes` to match optimalSessionDuration
  - Account for break time in total duration estimate
  - Warn if mission too long/short for user's patterns
- [ ] 6.4: Implement objective selection personalization
  - Prioritize content matching learning style preferences
  - Include predicted struggle areas with extra support
  - Balance high-yield content with personalized weak areas
- [ ] 6.5: Implement difficulty calibration
  - Use cognitive load insights to adjust mission complexity
  - Reduce difficulty if recent burnout indicators detected
  - Increase difficulty if user consistently completing missions easily

### Task 7: Personalize Content Recommendations (AC: #3)
- [ ] 7.1: Create `ContentRecommendationPersonalizer` class
  - Method: `recommendContent(userId, currentTopic): ContentRecommendation[]`
  - Method: `rankRecommendations(userId, candidates): RankedContent[]`
  - Method: `explainRecommendation(recommendation): Explanation`
- [ ] 7.2: Implement learning style-based recommendations
  - If visual learner (≥40%) → prioritize knowledge graph, diagrams, visual cards
  - If kinesthetic learner (≥40%) → prioritize clinical reasoning scenarios
  - If reading/writing (≥40%) → prioritize text lectures, note-taking prompts
  - If auditory (≥40%) → prioritize "explain to patient" validation prompts
- [ ] 7.3: Implement performance history-based recommendations
  - Recommend review content for weak areas (low retention)
  - Suggest advanced content for strong areas (high mastery)
  - Fill gaps in prerequisite knowledge before advanced topics
- [ ] 7.4: Implement contextual recommendations
  - During study session: recommend related content matching current topic
  - After validation failure: recommend foundational content for gap
  - Before exam: recommend high-yield content for predicted weak areas
- [ ] 7.5: Implement recommendation explanations
  - Show WHY content recommended: "Based on your visual learning preference" or "You struggled with similar topics last week"
  - Include confidence score for recommendation relevance
  - Allow user to provide feedback (helpful/not helpful)

### Task 8: Personalize Assessment Strategy (AC: #4)
- [ ] 8.1: Create `AssessmentPersonalizer` class
  - Method: `recommendAssessmentDifficulty(userId, objective): DifficultyLevel`
  - Method: `calculateOptimalAssessmentFrequency(userId): FrequencySchedule`
  - Method: `selectAssessmentType(userId, topic): AssessmentType`
- [ ] 8.2: Implement difficulty personalization
  - Use confidence calibration data to set appropriate challenge level
  - If user overconfident → introduce harder questions
  - If user underconfident → start with moderate questions, build confidence
  - Adapt based on recent assessment performance
- [ ] 8.3: Implement frequency optimization
  - Use forgetting curve to calculate optimal assessment intervals
  - If steep forgetting curve → more frequent assessments
  - If shallow curve → less frequent, spaced assessments
  - Factor in topic difficulty and user's topic-specific retention
- [ ] 8.4: Implement assessment type selection
  - Match assessment type to learning style:
    - Visual: diagram-based questions
    - Kinesthetic: clinical scenario assessments
    - Reading/Writing: essay-style explanations
    - Auditory: "explain to patient" prompts
  - Balance type variety to prevent monotony

### Task 9: Multi-Armed Bandit Optimization (AC: #8)
- [ ] 9.1: Create `PersonalizationOptimizer` class using Multi-Armed Bandit (MAB) algorithm
  - Method: `selectPersonalizationStrategy(userId, context): Strategy`
  - Method: `recordOutcome(userId, strategy, outcome): void`
  - Method: `updateStrategyWeights(userId): void`
- [ ] 9.2: Implement MAB strategy variants (arms)
  - **Arm 1: Pattern-heavy personalization** - Heavily weight behavioral patterns
  - **Arm 2: Prediction-heavy personalization** - Heavily weight predictive analytics
  - **Arm 3: Balanced personalization** - Equal weight to all insights
  - **Arm 4: Conservative personalization** - Minimal changes, gradual adaptation
- [ ] 9.3: Implement MAB selection algorithm (epsilon-greedy)
  - 90% of time: Select best-performing strategy (exploit)
  - 10% of time: Select random strategy (explore)
  - Track performance metrics: retention improvement, completion rate, user satisfaction
- [ ] 9.4: Implement outcome tracking
  - After each mission/session: Record performance metrics
  - Attribute improvement to active personalization strategy
  - Update strategy weights using Bayesian update
- [ ] 9.5: Create `PersonalizationStrategy` model
  - Fields: `userId`, `strategyType` (ENUM), `successCount`, `failureCount`, `avgImprovement`, `lastUsedAt`, `confidence` (0.0-1.0)

### Task 10: A/B Testing Framework (AC: #6, #8)
- [ ] 10.1: Create `PersonalizationExperiment` model
  - Fields: `id`, `name`, `description`, `variantA` (JSON), `variantB` (JSON), `startDate`, `endDate`, `targetUserCount`, `successMetric`
- [ ] 10.2: Create `ExperimentAssignment` model
  - Fields: `userId`, `experimentId`, `variant` (A/B), `assignedAt`, `metrics` (JSON)
- [ ] 10.3: Implement experiment assignment logic
  - Random 50/50 split for new experiments
  - Consistent assignment (same user always gets same variant)
  - Track user throughout experiment duration
- [ ] 10.4: Implement metrics collection
  - Track success metrics per variant: retention rate, performance improvement, satisfaction score
  - Collect sufficient sample size (minimum 20 users per variant)
  - Run statistical significance tests (t-test, p-value < 0.05)
- [ ] 10.5: Implement experiment analysis dashboard
  - Display variant performance comparison
  - Show statistical significance
  - Recommend winning variant when significant difference detected
  - Allow manual experiment conclusion and rollout

### Task 11: Track Personalization Effectiveness (AC: #6)
- [ ] 11.1: Create `PersonalizationEffectiveness` model
  - Fields: `userId`, `date`, `personalizationLevel`, `retentionImprovement` (%), `performanceImprovement` (%), `completionRateChange` (%), `userSatisfaction` (1-5), `adaptationAccuracy` (0-1.0)
- [ ] 11.2: Create effectiveness tracking job (daily)
  - Compare metrics before/after personalization activation
  - Calculate improvement percentages
  - Attribute changes to specific personalization features
- [ ] 11.3: Implement correlation analysis
  - Pearson correlation: personalization level vs. retention improvement
  - Statistical significance testing (p-value, confidence intervals)
  - Identify which personalization features drive most improvement
- [ ] 11.4: Create `PersonalizationImpactReport` generator
  - Weekly report: "Personalization improved your retention by 18% this week"
  - Monthly summary: Long-term trends, feature impact breakdown
  - Display in analytics dashboard

### Task 12: User Control Over Personalization (AC: #7)
- [ ] 12.1: Create Settings page section: "Personalization Settings"
  - **Personalization Level slider:** NONE → LOW → MEDIUM → HIGH
    - NONE: No personalization, default recommendations
    - LOW: Basic pattern-based adjustments (study time, duration)
    - MEDIUM: Pattern + prediction-based (content, difficulty)
    - HIGH: Full adaptive personalization (all features)
- [ ] 12.2: Implement feature-level toggles
  - Toggle: "Adapt mission timing" (default ON if level ≥ LOW)
  - Toggle: "Adapt session duration" (default ON if level ≥ LOW)
  - Toggle: "Personalize content recommendations" (default ON if level ≥ MEDIUM)
  - Toggle: "Adapt assessment difficulty" (default ON if level ≥ MEDIUM)
  - Toggle: "Auto-adjust based on cognitive load" (default ON if level ≥ HIGH)
- [ ] 12.3: Implement manual override capabilities
  - Button: "Reset all personalizations" → Clear learning profile, restart from defaults
  - Button: "Pause personalization for 1 week" → Temporarily disable while keeping data
  - Option: "Prefer standard missions" → Disable mission personalization only
- [ ] 12.4: Implement transparency dashboard
  - Section: "How We're Personalizing Your Experience"
  - Display active personalization features with explanations
  - Show data used for each personalization decision
  - Provide examples: "We're recommending 45-min sessions because your average is 47 min"
- [ ] 12.5: Update PersonalizationPreferences enforcement
  - Check preferences before applying any personalization
  - Respect feature-level disables
  - Gracefully degrade if personalization disabled (fall back to defaults)

### Task 13: Build Personalization Dashboard UI (AC: #6, #7)
- [ ] 13.1: Create `/analytics/personalization` page
  - Header: Personalization Overview (level, active features)
  - Section 1: Effectiveness Metrics (retention improvement, performance improvement, completion rate)
  - Section 2: Active Personalizations (what's being adapted, why)
  - Section 3: Personalization History (timeline of adaptations)
  - Section 4: Settings (quick access to personalization preferences)
- [ ] 13.2: Design `PersonalizationEffectivenessChart` component
  - Line chart: Date (x-axis) vs. Improvement percentage (y-axis)
  - Multiple lines: Retention, Performance, Completion Rate
  - Annotations: Major personalization changes (e.g., "Difficulty reduced on 10/12")
  - Baseline marker: Pre-personalization average
- [ ] 13.3: Create `ActivePersonalizationsPanel` component
  - Card-based layout: Each active personalization as a card
  - Card content: Feature name, description, data used, confidence score
  - Example: "Mission Timing (7-9 AM recommended)" with explanation "Based on 8 weeks of data showing 30% better retention during morning sessions"
  - Action: "Disable" button per personalization
- [ ] 13.4: Design `PersonalizationHistoryTimeline` component
  - Vertical timeline showing personalization events
  - Events: "Optimal study time detected", "Session duration adjusted", "Difficulty increased"
  - Each event: Date, description, outcome (positive/neutral/negative)
  - Filter by event type, date range
- [ ] 13.5: Create personalization settings widget
  - Embedded in dashboard for quick access
  - Personalization level slider
  - Feature toggles (expand/collapse)
  - Link to full settings page

### Task 14: Build Personalization APIs (AC: #1-8)
- [ ] 14.1: Create GET `/api/personalization/config` endpoint
  - Returns active PersonalizationConfig for user
  - Includes: enabled features, strategy parameters, confidence scores
  - Response: `{ missionPersonalization, contentPersonalization, assessmentPersonalization, sessionPersonalization }`
- [ ] 14.2: Create GET `/api/personalization/insights` endpoint
  - Returns aggregated insights from all behavioral analysis components
  - Response: `{ patterns[], predictions[], sessionInsights, cognitiveLoadInsights }`
- [ ] 14.3: Create POST `/api/personalization/apply` endpoint
  - Triggers personalization engine for specific context
  - Body: `{ context: "mission" | "content" | "assessment" | "session", params: {} }`
  - Returns: PersonalizationConfig for requested context
- [ ] 14.4: Create GET `/api/personalization/effectiveness` endpoint
  - Query params: `startDate`, `endDate`, `metric` (retention/performance/completion)
  - Returns effectiveness metrics over time period
  - Response: `{ metrics[], baseline, improvement, correlation, pValue }`
- [ ] 14.5: Create PATCH `/api/personalization/preferences` endpoint
  - Updates user personalization preferences
  - Body: `{ personalizationLevel?, enabledFeatures[]?, disabledFeatures[]?, autoAdaptEnabled? }`
  - Returns updated PersonalizationPreferences
- [ ] 14.6: Create GET `/api/personalization/experiments` endpoint
  - Returns active A/B experiments user is enrolled in
  - Response: `{ experiments[], assignments[] }`
- [ ] 14.7: Create POST `/api/personalization/feedback` endpoint
  - Allows user to provide feedback on personalization
  - Body: `{ featureType, helpful: boolean, comment? }`
  - Used to improve future personalizations

### Task 15: Implement Continuous Improvement Loop (AC: #8)
- [ ] 15.1: Create `PersonalizationFeedbackCollector` class
  - Method: `collectImplicitFeedback(userId, action): void` (e.g., user dismissed recommendation)
  - Method: `collectExplicitFeedback(userId, featureType, rating): void`
  - Method: `aggregateFeedback(userId): FeedbackSummary`
- [ ] 15.2: Implement implicit feedback signals
  - Mission skipped → Personalization may be too demanding
  - Recommendation dismissed → Content not relevant
  - Settings changed → User disagrees with personalization
  - High performance after personalization → Validation of strategy
- [ ] 15.3: Implement explicit feedback collection
  - After personalized mission: "Was this mission well-timed?" (Yes/No)
  - After content recommendation: "Was this helpful?" (thumbs up/down)
  - After difficulty adjustment: "Was this the right difficulty level?" (Too easy/Just right/Too hard)
- [ ] 15.4: Implement feedback-driven adaptation
  - If multiple negative signals for feature → Reduce confidence, adjust strategy
  - If positive signals → Increase confidence, continue strategy
  - Update MAB strategy weights based on feedback
- [ ] 15.5: Create feedback analysis job (weekly)
  - Aggregate all feedback signals
  - Identify personalization features with low satisfaction
  - Trigger A/B experiments to test alternative strategies
  - Update PersonalizationEngine parameters

### Task 16: Integration with Mission, Content, and Assessment Systems (AC: #2, #3, #4, #5)
- [ ] 16.1: Update `MissionGenerator` to call PersonalizationEngine
  - Before generating mission: `const config = await PersonalizationEngine.applyPersonalization(userId, 'mission')`
  - Apply config to mission parameters: timing, duration, objectives, difficulty
  - Store personalization context in Mission record for tracking
- [ ] 16.2: Update `ContentRecommendationEngine` integration
  - When recommending content: Use `ContentRecommendationPersonalizer.recommendContent()`
  - Apply learning style filtering before presenting recommendations
  - Track which recommendations were accepted/dismissed
- [ ] 16.3: Update `ValidationPromptGenerator` integration
  - When generating validation prompts: Use `AssessmentPersonalizer.selectAssessmentType()`
  - Adjust difficulty using `AssessmentPersonalizer.recommendAssessmentDifficulty()`
  - Schedule frequency via `AssessmentPersonalizer.calculateOptimalAssessmentFrequency()`
- [ ] 16.4: Update `SessionOrchestrator` integration
  - When starting session: Use `SessionOrchestrationPersonalizer.personalizeSessionStructure()`
  - Apply break timing recommendations
  - Adjust content mixing based on personalization config
- [ ] 16.5: Update `CognitiveLoadMonitor` integration
  - Real-time cognitive load updates trigger `CognitiveLoadPersonalizer.recommendDifficultyAdjustment()`
  - If adjustment recommended: Apply mid-session (reduce mission scope, suggest break)
  - Track user response to adjustments (accepted/ignored)

### Task 17: Testing and Validation (AC: All)
- [ ] 17.1: Manual testing with real user data (6+ weeks, post-Stories 5.1-5.4)
  - Enable personalization (HIGH level)
  - Complete missions over 2 weeks
  - Verify missions adapted to optimal study times
  - Check content recommendations match learning style
  - Confirm assessment difficulty appropriate
  - Validate session structure personalized
- [ ] 17.2: Verify personalization integration
  - Pattern insights from Story 5.1 correctly aggregated
  - Predictions from Story 5.2 correctly applied
  - Session orchestration from Story 5.3 correctly personalized
  - Cognitive load from Story 5.4 correctly managed
- [ ] 17.3: Test user control mechanisms
  - Change personalization level: NONE → LOW → MEDIUM → HIGH
  - Disable specific features, verify they stop adapting
  - Reset personalization, verify clean slate
  - Pause personalization, verify temporary suspension
- [ ] 17.4: Test effectiveness tracking
  - Trigger effectiveness calculation after 2 weeks
  - Verify improvement metrics calculated correctly
  - Check correlation analysis with statistical significance
  - Validate impact reports show meaningful insights
- [ ] 17.5: Test MAB optimization
  - Run multiple sessions with different strategies
  - Verify strategy selection follows epsilon-greedy
  - Check outcome tracking and weight updates
  - Validate best strategy emerges over time
- [ ] 17.6: Test A/B experimentation
  - Create test experiment (variant A vs. B)
  - Assign users to variants
  - Collect metrics over experiment period
  - Verify statistical significance calculation
  - Conclude experiment, validate rollout
- [ ] 17.7: Test continuous improvement loop
  - Provide implicit feedback (dismiss recommendation)
  - Provide explicit feedback (rate personalization)
  - Verify feedback aggregation
  - Check personalization adapts based on feedback
- [ ] 17.8: Integration testing
  - Generate personalized mission, complete it
  - Verify content recommendations during session
  - Check assessment difficulty adapted
  - Validate session structure personalized
  - Confirm effectiveness tracked end-to-end

## Dev Notes

### Architecture References

- **Solution Architecture:** `/Users/kyin/Projects/Americano-epic5/docs/solution-architecture.md`
  - Subsystem 5: Behavioral Analytics & Personalization (lines 604-648)
  - Subsystem 2: Learning Engine (Mission Generation) integration (lines 524-548)
  - API Architecture: `/api/personalization/*` endpoints (NEW - not yet in architecture)
  - Database Schema: PersonalizationConfig, PersonalizationPreferences models (NEW)

- **PRD:** `/Users/kyin/Projects/Americano-epic5/docs/PRD-Americano-2025-10-14.md`
  - Epic 5: Behavioral Learning Twin (lines 450-468)
  - Epic 5 Success Criteria: 80% prediction accuracy, improving personalization (lines 464-467)
  - NFR5: Maintainability - Modular architecture (lines 185-189)

- **Epic Breakdown:** `/Users/kyin/Projects/Americano-epic5/docs/epics-Americano-2025-10-14.md`
  - Story 5.5 Details: Lines 786-807
  - Epic 5 Goals and Success Criteria: Lines 674-695

### Integration Context (Stories 5.1-5.4)

**Story 5.1: Learning Pattern Recognition and Analysis**
- Provides: `UserLearningProfile`, `BehavioralPattern`, `BehavioralInsight` models
- Key outputs: Optimal study times, session duration preferences, learning style profile, forgetting curves
- Integration: PersonalizationEngine aggregates these patterns for mission/content/session personalization

**Story 5.2: Predictive Analytics for Learning Struggles** (NOT YET IMPLEMENTED)
- Will provide: `PerformancePrediction` model, struggle detection, optimal timing predictions
- Expected integration: PersonalizationEngine uses predictions for proactive interventions
- Status: Placeholder integration - fully implement when Story 5.2 available

**Story 5.3: Optimal Study Timing and Session Orchestration** (NOT YET IMPLEMENTED)
- Will provide: Session structure optimization, break timing, content mixing strategies
- Expected integration: SessionOrchestrationPersonalizer consumes these recommendations
- Status: Placeholder integration - fully implement when Story 5.3 available

**Story 5.4: Cognitive Load Monitoring and Stress Detection** (NOT YET IMPLEMENTED)
- Will provide: Real-time cognitive load assessment, burnout risk detection, difficulty adjustment
- Expected integration: CognitiveLoadPersonalizer uses monitoring data for dynamic adjustments
- Status: Placeholder integration - fully implement when Story 5.4 available

### Database Schema Extensions

**Create `PersonalizationConfig` model:**
```prisma
model PersonalizationConfig {
  id                         String   @id @default(cuid())
  userId                     String   @unique

  // Mission personalization
  missionPersonalization     Json     // { enabled, strategy, parameters, confidence }

  // Content personalization
  contentPersonalization     Json     // { enabled, strategy, parameters, confidence }

  // Assessment personalization
  assessmentPersonalization  Json     // { enabled, strategy, parameters, confidence }

  // Session personalization
  sessionPersonalization     Json     // { enabled, strategy, parameters, confidence }

  lastUpdatedAt              DateTime @default(now())

  @@index([userId])
  @@map("personalization_configs")
}
```

**Create `PersonalizationPreferences` model:**
```prisma
model PersonalizationPreferences {
  id                   String   @id @default(cuid())
  userId               String   @unique
  personalizationLevel PersonalizationLevel @default(HIGH)
  enabledFeatures      String[] // Array of feature names
  disabledFeatures     String[] // Array of feature names
  autoAdaptEnabled     Boolean  @default(true)
  updatedAt            DateTime @default(now())

  @@index([userId])
  @@map("personalization_preferences")
}

enum PersonalizationLevel {
  NONE     // No personalization
  LOW      // Basic pattern-based
  MEDIUM   // Pattern + prediction
  HIGH     // Full adaptive
}
```

**Create `PersonalizationStrategy` model (MAB):**
```prisma
model PersonalizationStrategy {
  id              String       @id @default(cuid())
  userId          String
  strategyType    StrategyType
  successCount    Int          @default(0)
  failureCount    Int          @default(0)
  avgImprovement  Float        @default(0.0)
  lastUsedAt      DateTime?
  confidence      Float        @default(0.5) // 0.0-1.0

  @@unique([userId, strategyType])
  @@index([userId])
  @@map("personalization_strategies")
}

enum StrategyType {
  PATTERN_HEAVY      // Heavily weight patterns
  PREDICTION_HEAVY   // Heavily weight predictions
  BALANCED           // Equal weights
  CONSERVATIVE       // Minimal changes
}
```

**Create `PersonalizationEffectiveness` model:**
```prisma
model PersonalizationEffectiveness {
  id                      String   @id @default(cuid())
  userId                  String
  date                    DateTime @default(now())
  personalizationLevel    PersonalizationLevel
  retentionImprovement    Float    // Percentage change
  performanceImprovement  Float    // Percentage change
  completionRateChange    Float    // Percentage change
  userSatisfaction        Int?     // 1-5 scale
  adaptationAccuracy      Float    // 0.0-1.0

  @@unique([userId, date])
  @@index([userId])
  @@map("personalization_effectiveness")
}
```

**Create `PersonalizationExperiment` model (A/B testing):**
```prisma
model PersonalizationExperiment {
  id               String   @id @default(cuid())
  name             String
  description      String   @db.Text
  variantA         Json     // Personalization config variant A
  variantB         Json     // Personalization config variant B
  startDate        DateTime @default(now())
  endDate          DateTime?
  targetUserCount  Int      @default(20)
  successMetric    String   // "retention" | "performance" | "satisfaction"

  assignments      ExperimentAssignment[]

  @@map("personalization_experiments")
}

model ExperimentAssignment {
  id           String   @id @default(cuid())
  userId       String
  experimentId String
  variant      String   // "A" or "B"
  assignedAt   DateTime @default(now())
  metrics      Json     // Collected metrics during experiment

  experiment   PersonalizationExperiment @relation(fields: [experimentId], references: [id], onDelete: Cascade)

  @@unique([userId, experimentId])
  @@index([experimentId])
  @@map("experiment_assignments")
}
```

**Create `PersonalizationFeedback` model:**
```prisma
model PersonalizationFeedback {
  id          String   @id @default(cuid())
  userId      String
  featureType String   // "mission_timing", "content_recommendation", "assessment_difficulty", "session_structure"
  helpful     Boolean  // User feedback: helpful or not
  comment     String?  @db.Text
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([featureType])
  @@map("personalization_feedback")
}
```

### Key Algorithms

**Multi-Armed Bandit (Epsilon-Greedy) for Strategy Selection:**
```
epsilon = 0.1  // 10% exploration rate

strategies = getPersonalizationStrategies(userId)

if random() < epsilon:
  // Explore: Select random strategy
  selectedStrategy = strategies[randomIndex]
else:
  // Exploit: Select best-performing strategy
  selectedStrategy = strategies.sortBy(avgImprovement).first()

// Record strategy usage
selectedStrategy.lastUsedAt = now()
selectedStrategy.update()

return selectedStrategy
```

**Personalization Effectiveness Calculation:**
```
// Calculate improvement vs. baseline (pre-personalization period)
baselineRetention = getAverageRetention(userId, baselinePeriod)
currentRetention = getAverageRetention(userId, currentPeriod)
retentionImprovement = ((currentRetention - baselineRetention) / baselineRetention) * 100

baselinePerformance = getAveragePerformance(userId, baselinePeriod)
currentPerformance = getAveragePerformance(userId, currentPeriod)
performanceImprovement = ((currentPerformance - baselinePerformance) / baselinePerformance) * 100

baselineCompletionRate = getCompletionRate(userId, baselinePeriod)
currentCompletionRate = getCompletionRate(userId, currentPeriod)
completionRateChange = ((currentCompletionRate - baselineCompletionRate) / baselineCompletionRate) * 100

// Correlation analysis
correlation = pearsonCorrelation(personalizationLevel, [retentionScores])
pValue = calculatePValue(correlation, sampleSize)
significant = (pValue < 0.05)

return {
  retentionImprovement,
  performanceImprovement,
  completionRateChange,
  correlation,
  pValue,
  significant
}
```

**Insight Aggregation Logic:**
```
insights = {
  patterns: [],
  predictions: [],
  sessionInsights: {},
  cognitiveLoadInsights: {}
}

// From Story 5.1: Pattern Recognition
learningProfile = getUserLearningProfile(userId)
if (learningProfile && learningProfile.dataQualityScore >= 0.6) {
  insights.patterns.push({
    optimalStudyTimes: learningProfile.preferredStudyTimes,
    sessionDuration: learningProfile.optimalSessionDuration,
    learningStyle: learningProfile.learningStyleProfile,
    forgettingCurve: learningProfile.personalizedForgettingCurve
  })
}

behavioralPatterns = getBehavioralPatterns(userId, minConfidence: 0.7)
insights.patterns.push(...behavioralPatterns)

// From Story 5.2: Predictive Analytics (when available)
predictions = getPerformancePredictions(userId, predictedFor: upcoming)
insights.predictions.push(...predictions.filter(p => p.confidence >= 0.7))

// From Story 5.3: Session Orchestration (when available)
// sessionOrchestrationData = getSessionOrchestrationInsights(userId)
// insights.sessionInsights = sessionOrchestrationData

// From Story 5.4: Cognitive Load (when available)
// cognitiveLoadData = getCognitiveLoadInsights(userId)
// insights.cognitiveLoadInsights = cognitiveLoadData

return insights
```

### Integration Points

**With Story 2.4 (Mission Generation):**
- `MissionGenerator` calls `PersonalizationEngine.applyPersonalization(userId, 'mission')`
- PersonalizationConfig applied to:
  - Mission timing (recommendedStartTime)
  - Mission duration (estimatedMinutes)
  - Objective selection (content matching learning style)
  - Difficulty level (based on cognitive load)

**With Story 3.5 (Content Recommendations):**
- `ContentRecommendationEngine` calls `ContentRecommendationPersonalizer.recommendContent()`
- Learning style profile filters content types
- Performance history prioritizes weak/strong areas
- Contextual recommendations based on current topic

**With Story 4.5 (Adaptive Assessment):**
- `ValidationPromptGenerator` calls `AssessmentPersonalizer` methods
- Difficulty adjusted based on confidence calibration
- Frequency optimized using forgetting curve
- Assessment type matched to learning style

**With Story 2.5 (Session Orchestration):**
- `SessionOrchestrator` calls `SessionOrchestrationPersonalizer.personalizeSessionStructure()`
- Session duration adapted to optimal length
- Break timing based on attention cycles
- Content mixing based on learning style

**With Story 5.1 (Pattern Recognition):**
- Consumes `UserLearningProfile`, `BehavioralPattern`, `BehavioralInsight`
- Aggregates pattern data for personalization decisions
- Updates patterns based on personalization feedback

**With Stories 5.2, 5.3, 5.4 (Future Integration):**
- Placeholder integrations ready for when these stories implemented
- PersonalizationEngine designed to consume their outputs
- Integration points documented for future implementation

### Technical Constraints

1. **Data Requirements:** Personalization requires Stories 5.1-5.4 data. Story 5.1 is implemented; 5.2-5.4 are placeholders. Engine should gracefully degrade if data unavailable.
2. **Performance:** Personalization calculations run asynchronously. Mission generation should not be blocked by personalization (use cached config if needed).
3. **User Control:** All personalization can be disabled at feature level or global level. Respect user preferences strictly.
4. **Privacy:** Personalization data never shared. A/B experiments anonymized. User can export or delete all personalization data.
5. **Confidence Thresholds:** Only use patterns/predictions with confidence ≥ 0.7. Lower confidence = less aggressive personalization.
6. **Feedback Loop:** Continuous improvement requires tracking outcomes. Every personalization decision should be trackable to outcome.
7. **Experimentation:** A/B tests require minimum 20 users per variant + 2 weeks duration. Statistical significance required before rollout.

### Testing Strategy

**Unit Tests (Deferred to Production):**
- Test PersonalizationEngine aggregation logic
- Validate MAB epsilon-greedy selection
- Test effectiveness calculation formulas
- Verify feedback-driven adaptation

**Manual Testing (MVP Approach):**
1. Complete Stories 5.1-5.4 (or use Story 5.1 data only)
2. Enable personalization (HIGH level)
3. Generate personalized mission → verify timing/duration/content adapted
4. Request content recommendations → verify learning style filtering
5. Complete assessment → verify difficulty appropriate
6. Start study session → verify session structure personalized
7. Check effectiveness dashboard → verify improvement metrics calculated
8. Disable personalization → verify features stop adapting
9. Provide feedback → verify personalization adjusts based on feedback

**Integration Testing:**
- End-to-end: Mission generation → session → assessment → effectiveness tracking
- Verify all subsystems (mission, content, assessment, session) use PersonalizationEngine
- Test graceful degradation when Stories 5.2-5.4 data unavailable
- Validate user control over all personalization features

**Edge Cases to Test:**
- User with no behavioral data (fresh account) → No personalization, default recommendations
- User disables all personalization → System falls back to default behavior
- User provides conflicting feedback → System prioritizes recent feedback
- A/B experiment with insufficient data → System does not conclude experiment
- Personalization strategy performs poorly → MAB switches to better strategy

### UI/UX Considerations

**Design System Compliance:**
- All charts use glassmorphism (bg-white/80 backdrop-blur-md)
- OKLCH colors for data visualization (NO gradients)
- Effectiveness chart: oklch(0.7 0.15 145) for positive improvements, oklch(0.7 0.15 30) for declines
- Timeline component: Vertical timeline with event cards
- Responsive layouts: Desktop (full dashboard), tablet (stacked sections), mobile (prioritize metrics + settings)

**Accessibility:**
- Personalization level slider includes ARIA labels and keyboard support
- Feature toggles keyboard accessible
- Effectiveness chart includes screen reader descriptions
- Timeline events have clear semantic structure
- Focus states on all interactive elements

**User Flow:**
1. User completes 6+ weeks of study (Stories 5.1-5.4 data collected)
2. Personalization auto-enabled at MEDIUM level (gradual introduction)
3. User generates first personalized mission → sees optimal time recommendation
4. User completes mission → system tracks effectiveness
5. After 2 weeks → user receives notification: "Personalization improved your retention by 15%"
6. User navigates to `/analytics/personalization` → sees effectiveness dashboard
7. User reviews active personalizations → understands what's being adapted and why
8. User adjusts personalization level or disables specific features if desired
9. System continues adapting based on feedback and performance
10. Continuous improvement loop: Better personalization → Better outcomes → Higher confidence

### Performance Optimizations

1. **Caching:** Cache PersonalizationConfig in memory for 1 hour (reduce DB queries during mission generation)
2. **Async Processing:** Effectiveness calculation and MAB updates run as background jobs
3. **Lazy Loading:** Load personalization dashboard data on-demand (not on page load)
4. **Incremental Updates:** Update strategy weights incrementally after each session (not batch)
5. **Pre-computation:** Pre-compute personalization configs during off-peak hours (nightly job)

### Security and Privacy

1. **Data Ownership:** User owns all personalization data. Can export or delete anytime.
2. **Anonymization:** A/B experiments use anonymized user IDs in analysis.
3. **Transparency:** User can see exactly what data used for each personalization decision.
4. **Control:** User has granular control over all personalization features.
5. **No External Sharing:** Personalization data never shared with third parties.

### Future Enhancements (Post-MVP)

1. **Cross-User Learning:** Aggregate anonymized patterns across users to improve personalization for new users (cohort-based personalization)
2. **Explainable AI:** Advanced explanations for personalization decisions using SHAP values or similar
3. **Predictive Personalization:** Forecast user needs 1-2 weeks ahead, pre-adapt platform
4. **Multi-Objective Optimization:** Balance multiple goals (retention, satisfaction, time efficiency) simultaneously
5. **Contextual Bandits:** Upgrade MAB to contextual bandits for more nuanced strategy selection

### References

- **Source:** Epic 5, Story 5.5 (epics-Americano-2025-10-14.md:786-807)
- **Source:** Solution Architecture, Subsystem 5 (solution-architecture.md:604-648)
- **Source:** PRD FR6, Epic 5 (PRD-Americano-2025-10-14.md:103-108, 450-468)
- **Source:** Multi-Armed Bandit Algorithm (external: Sutton & Barto, Reinforcement Learning)
- **Source:** A/B Testing Best Practices (external: Kohavi et al., Trustworthy Online Controlled Experiments)
- **Source:** Epsilon-Greedy Exploration (external: Auer et al., Finite-time Analysis of MAB)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
