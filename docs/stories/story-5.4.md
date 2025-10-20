# Story 5.4: Cognitive Load Monitoring and Stress Detection

Status: Done

## Story

As a medical student,
I want the platform to detect when I'm cognitively overloaded,
So that it can adjust difficulty and prevent burnout through intelligent workload modulation.

## Acceptance Criteria

1. Cognitive load estimation based on user behavior during study sessions
2. Stress indicators identified through interaction patterns and performance changes
3. Automatic difficulty adjustment when cognitive overload detected
4. Burnout prevention through workload modulation and break recommendations
5. Stress response patterns tracked over time for personalization
6. Integration with understanding assessment to balance challenge and support
7. User awareness of cognitive state through dashboard indicators
8. Correlation between cognitive load management and academic performance

## Tasks / Subtasks

### Task 1: Design and Implement Cognitive Load Data Models (AC: #1, #2, #5)
- [ ] 1.1: Create `CognitiveLoadMetric` model for tracking real-time cognitive state
  - Fields: `id`, `userId`, `sessionId`, `timestamp`, `loadScore` (0-100), `stressIndicators` (JSON), `confidenceLevel` (0.0-1.0)
  - Stress indicators JSON: `{ responseLatency, errorRate, engagementDrop, repeatPatterns, fatigueMarkers }`
  - Load score calculation: Weighted combination of behavioral indicators
- [ ] 1.2: Create `StressResponsePattern` model for longitudinal tracking
  - Fields: `id`, `userId`, `patternType` (ENUM), `triggerConditions` (JSON), `responseProfile` (JSON), `detectedAt`, `lastOccurrence`, `frequency`
  - Pattern types: DIFFICULTY_INDUCED, TIME_PRESSURE, FATIGUE_BASED, EXAM_PROXIMITY, TOPIC_SPECIFIC
  - Response profile: `{ recoveryTime, impactSeverity, copingEffectiveness }`
- [ ] 1.3: Create `BurnoutRiskAssessment` model for proactive intervention
  - Fields: `id`, `userId`, `assessmentDate`, `riskScore` (0-100), `riskLevel` (ENUM: LOW/MEDIUM/HIGH/CRITICAL), `contributingFactors` (JSON), `recommendations` (JSON)
  - Contributing factors: Study intensity, performance decline, engagement drop, session irregularity
  - Risk levels: LOW (<25), MEDIUM (25-50), HIGH (50-75), CRITICAL (>75)
- [ ] 1.4: Extend `BehavioralEvent` model with cognitive load markers
  - Add fields: `cognitiveLoadScore` (0-100), `stressIndicators` (JSON array), `overloadDetected` (Boolean)
  - Track behavioral markers: Response time variance, error clustering, pause frequency, session abandonment
- [ ] 1.5: Run Prisma migration for cognitive load models

### Task 2: Implement Real-Time Cognitive Load Monitor (AC: #1, #2)
- [ ] 2.1: Create `CognitiveLoadMonitor` class
  - Method: `calculateCurrentLoad(userId, sessionId): CognitiveLoadScore`
  - Method: `detectStressIndicators(sessionData): StressIndicator[]`
  - Method: `assessOverloadRisk(loadScore, indicators): OverloadRisk`
  - Method: `recordLoadMetric(userId, sessionId, loadData): void`
- [ ] 2.2: Implement cognitive load calculation algorithm
  - Response latency analysis: Track time-to-answer trends, detect slowdowns (>30% increase = +15 load)
  - Error rate tracking: Calculate rolling error rate over last 10 interactions (>40% errors = +25 load)
  - Engagement degradation: Measure attention markers (pauses, off-task behavior) (+10 load per disengagement)
  - Performance decline: Compare current vs. baseline performance (20%+ drop = +20 load)
  - Session duration stress: Account for time-in-session fatigue (>60 min = +10 load, >90 min = +25 load)
  - Weighted formula: `loadScore = (responseLatency * 0.3) + (errorRate * 0.25) + (engagementDrop * 0.2) + (performanceDecline * 0.15) + (durationStress * 0.1)`
- [ ] 2.3: Implement stress indicator detection
  - **Response latency spikes:** Calculate rolling average response time, flag outliers (>2 SD from mean)
  - **Error clustering:** Detect consecutive incorrect responses (3+ in a row = stress marker)
  - **Repeat attempts:** Track same-card review failures (3+ attempts without progress)
  - **Engagement drops:** Monitor pause duration and frequency (>5 pauses in 10 min)
  - **Abandonment signals:** Detect partial session completion or abrupt exits
  - **Interaction variability:** High variance in response times indicates cognitive instability
- [ ] 2.4: Implement overload risk assessment
  - Threshold levels: Moderate load (40-60), High load (60-80), Critical overload (>80)
  - Risk classification: Combine current load + recent load trend + session context
  - Confidence scoring: Based on data quality and indicator consistency
  - Trigger criteria: 2 consecutive high-load measurements OR 1 critical overload measurement

### Task 3: Implement Automatic Difficulty Adjustment System (AC: #3, #6)
- [ ] 3.1: Create `DifficultyAdapter` class
  - Method: `adjustDifficulty(userId, currentLoad): DifficultyAdjustment`
  - Method: `recommendContentModification(sessionContext): ContentRecommendation`
  - Method: `calculateOptimalChallenge(userProfile, loadState): ChallengeLevel`
  - Method: `applyAdaptation(sessionId, adjustment): void`
- [ ] 3.2: Implement difficulty adjustment decision logic
  - **Moderate load (40-60):** Maintain current difficulty, add minor scaffolding (hints, examples)
  - **High load (60-80):** Reduce difficulty by 1 level, simplify validation prompts, increase review card ratio
  - **Critical overload (>80):** Emergency adaptation: Switch to easiest content, pure review mode, suggest break
  - **Low load (<30):** Gradually increase challenge, introduce harder validation prompts
  - Adjustment constraints: Max 2-level difficulty shift per session to avoid jarring transitions
- [ ] 3.3: Implement content modification strategies
  - **Review-to-new ratio adjustment:** Overload → 80% review, 20% new; Normal → 60% review, 40% new
  - **Validation prompt complexity:** Overload → Skip "explain to patient", use simple recall; Normal → Full validation suite
  - **Session length modulation:** Overload → Recommend 15-min micro-sessions; Normal → Standard 45-60 min
  - **Break insertion:** Overload → Force 5-min breaks every 20 min; High load → Suggest breaks every 30 min
- [ ] 3.4: Integrate with Understanding Validation Engine (Story 4.1-4.6)
  - Query current validation difficulty from ValidationPromptGenerator
  - Adjust prompt complexity based on cognitive load: `promptComplexity = baseComplexity * (1 - loadScore/100)`
  - Skip controlled failure scenarios when load >70 (avoid compounding stress)
  - Provide extra scaffolding in feedback when load >60

### Task 4: Implement Burnout Prevention System (AC: #4, #5)
- [ ] 4.1: Create `BurnoutPreventionEngine` class
  - Method: `assessBurnoutRisk(userId): BurnoutRiskAssessment`
  - Method: `detectWarningSignals(userId, timeWindow): WarningSignal[]`
  - Method: `recommendIntervention(riskAssessment): InterventionPlan`
  - Method: `trackRecoveryProgress(userId, interventionId): RecoveryMetrics`
- [ ] 4.2: Implement burnout risk assessment algorithm
  - **Study intensity analysis:** Track hours/week, detect unsustainable pace (>40 hrs = risk factor)
  - **Performance decline trends:** Calculate 2-week rolling average, detect >20% drop
  - **Chronic high load:** Count days with avgLoad >60 over 14 days (>7 days = high risk)
  - **Session irregularity:** Detect erratic study patterns (missed 3+ scheduled sessions)
  - **Engagement decay:** Track motivation signals (skipped missions, incomplete sessions, low ratings)
  - **Recovery deficit:** Measure days since last low-load day (<40 load), flag if >7 days
  - Risk formula: `riskScore = (intensity * 0.2) + (performanceDecline * 0.25) + (chronicLoad * 0.25) + (irregularity * 0.15) + (engagementDecay * 0.1) + (recoveryDeficit * 0.05)`
- [ ] 4.3: Implement early warning signal detection
  - **Performance plateau/decline:** 2+ weeks without improvement despite consistent effort
  - **Emotional distress markers:** Negative feedback ratings, frustrated validation responses
  - **Avoidance behavior:** Repeatedly skipping difficult topics, mission deferrals
  - **Physical symptoms (proxy):** Irregular session times, late-night studying (>11 PM), shortened sessions
  - **Social withdrawal (proxy):** Lack of help-seeking behavior (no AI chat usage during struggles)
- [ ] 4.4: Design intervention recommendation system
  - **Low risk (0-25):** Continue current routine, maintain awareness
  - **Medium risk (25-50):** Suggest rest day, reduce mission complexity, increase breaks
  - **High risk (50-75):** Mandatory rest day, alert user, reduce study hours by 30%, lighter content only
  - **Critical risk (>75):** Emergency intervention: 2-3 day mandatory break, alert user with supportive message, disable new content, focus on review and consolidation only
  - Interventions include: Workload reduction targets, rest recommendations, content adjustments, support resources

### Task 5: Build Stress Pattern Tracking and Personalization (AC: #5)
- [ ] 5.1: Create `StressPatternAnalyzer` class
  - Method: `identifyRecurringPatterns(userId): StressResponsePattern[]`
  - Method: `analyzeStressTriggers(userId): TriggerAnalysis`
  - Method: `buildPersonalizedStressProfile(userId): StressProfile`
  - Method: `predictStressResponse(context, stressProfile): StressPrediction`
- [ ] 5.2: Implement stress pattern identification
  - Group cognitive load spikes by trigger type (topic difficulty, time pressure, exam proximity)
  - Detect recurring patterns: "User always struggles with physiology at night" or "High stress on Mondays"
  - Calculate pattern frequency and consistency (patterns need 3+ occurrences to be saved)
  - Assign confidence scores based on data quality and recurrence rate
- [ ] 5.3: Implement trigger analysis
  - **Topic-specific triggers:** Correlate high load with specific courses/subjects (e.g., anatomy → low load, physiology → high load)
  - **Time-based triggers:** Detect time-of-day or day-of-week stress patterns (morning vs. evening, weekday vs. weekend)
  - **Exam proximity triggers:** Track load increase as exam approaches (>7 days out vs. <3 days out)
  - **Difficulty-level triggers:** Identify if user struggles with specific difficulty tiers
  - **Session-length triggers:** Determine if prolonged sessions induce stress (>75 min → load spike)
- [ ] 5.4: Build personalized stress profile
  - Aggregate all detected patterns into user-specific profile
  - Profile components: Primary stressors, typical recovery time, effective coping strategies, load tolerance threshold
  - Example profile: `{ primaryStressors: ["physiology", "time-pressure"], avgRecoveryTime: 24hrs, loadTolerance: 65, effectiveCopingStrategies: ["shorter-sessions", "visual-aids"] }`
  - Update profile monthly with new pattern data

### Task 6: Integrate Cognitive Load with Mission Generation (AC: #3, #4)
- [ ] 6.1: Extend `MissionGenerator` (Story 2.4) to consume cognitive load data
  - Query recent cognitive load history before generating mission (last 7 days)
  - Check current burnout risk level from BurnoutPreventionEngine
  - Query personalized stress profile for user
- [ ] 6.2: Implement load-aware mission generation
  - **Normal load (<50):** Standard mission generation, follow normal prioritization
  - **Elevated load (50-70):** Reduce mission complexity by 20%, favor easier objectives, add review-heavy content
  - **High load (>70):** Generate recovery mission: Review-only content, familiar topics, no new concepts
  - **Burnout risk (medium/high):** Override mission generation with mandatory rest mission: Minimal expectations, optional light review
  - **Critical burnout risk:** Skip mission generation entirely, display supportive message: "Take a break day - your learning will be better for it"
- [ ] 6.3: Implement workload modulation
  - Adjust `estimatedMinutes` based on load: Normal 45-60 min → High load 30 min → Recovery mode 15 min
  - Modify content distribution: Normal 60/40 review/new → High load 80/20 → Recovery 100/0
  - Set mission difficulty ceiling based on load tolerance from stress profile
- [ ] 6.4: Add break recommendations to mission briefing
  - Display cognitive state indicator: "You're operating at high cognitive load - this mission includes extra breaks"
  - Suggest pre-mission break if previous session ended with high load
  - Include in-mission break timers if load detected during generation

### Task 7: Build Cognitive State Dashboard (AC: #7)
- [ ] 7.1: Create `/analytics/cognitive-health` page
  - Header: Current Cognitive State summary (load level, burnout risk, recommended action)
  - Section 1: Real-time load meter with visual indicator
  - Section 2: Stress patterns timeline (7-day and 30-day views)
  - Section 3: Burnout risk assessment with contributing factors
  - Section 4: Stress response profile visualization
  - Section 5: Intervention recommendations and recovery progress
- [ ] 7.2: Design `CognitiveLoadMeter` component
  - Circular gauge: 0-100 scale with color zones (Green <40, Yellow 40-60, Orange 60-80, Red >80)
  - Real-time indicator updates every 5 minutes during active session
  - Current load value displayed prominently with trend arrow (↑/↓/→)
  - Contextual message: "Your cognitive load is moderate - you're in the learning zone"
- [ ] 7.3: Create `StressPatternsTimeline` component
  - Line chart: Time (x-axis) vs. Load score (y-axis)
  - Color-coded sessions by load level
  - Annotate significant events: Overload episodes, interventions, recovery periods
  - Hoverable data points showing session details and stress indicators
  - Toggle between 7-day (detailed) and 30-day (trend) views
- [ ] 7.4: Build `BurnoutRiskPanel` component
  - Risk level indicator with icon and color (Low/Medium/High/Critical)
  - Breakdown of contributing factors with percentages
  - Visual representation: Stacked bar chart or pie chart
  - Actionable recommendations based on current risk level
  - "Days since last rest" counter and recovery progress bar
- [ ] 7.5: Design `StressProfileCard` component
  - Radar chart: Dimensions = stress trigger types (topic, time, difficulty, duration, exam-pressure)
  - Highlight primary stressors with annotations
  - Display load tolerance threshold as reference line
  - Show effective coping strategies as bulleted list
- [ ] 7.6: Create `InterventionRecommendations` component
  - Card-based layout: Current recommendations prioritized by importance
  - Each card: Intervention type, rationale, expected benefit, "Apply Now" button
  - Track acceptance rate: User applies recommendations or dismisses
  - Show past interventions and effectiveness (recovery time after intervention)

### Task 8: Build Cognitive Load APIs (AC: All)
- [ ] 8.1: Create POST `/api/analytics/cognitive-load/calculate` endpoint
  - Calculates cognitive load for current or specific session
  - Body: `{ userId, sessionId, behavioralData }`
  - Runs CognitiveLoadMonitor.calculateCurrentLoad()
  - Returns: `{ loadScore, stressIndicators, overloadDetected, recommendations }`
- [ ] 8.2: Create GET `/api/analytics/cognitive-load/current` endpoint
  - Returns user's current cognitive load state
  - Query params: `userId` (from auth context)
  - Response: `{ loadScore, loadLevel, stressIndicators, timestamp, trend }`
- [ ] 8.3: Create GET `/api/analytics/cognitive-load/history` endpoint
  - Query params: `userId`, `startDate`, `endDate`, `granularity` (hour/day/week)
  - Returns time-series cognitive load data for timeline visualization
  - Response: `{ dataPoints: [{ timestamp, loadScore, sessionId, stressIndicators }] }`
- [ ] 8.4: Create GET `/api/analytics/burnout-risk` endpoint
  - Returns current burnout risk assessment
  - Response: `{ riskScore, riskLevel, contributingFactors, warningSignals, recommendations, lastAssessmentDate }`
- [ ] 8.5: Create GET `/api/analytics/stress-patterns` endpoint
  - Returns identified stress response patterns
  - Query params: `minConfidence` (default 0.6), `patternType?`
  - Response: `{ patterns: [{ patternType, triggerConditions, responseProfile, frequency, confidence }] }`
- [ ] 8.6: Create GET `/api/analytics/stress-profile` endpoint
  - Returns personalized stress profile
  - Response: `{ primaryStressors, loadTolerance, avgRecoveryTime, effectiveCopingStrategies, profileConfidence }`
- [ ] 8.7: Create POST `/api/analytics/interventions/apply` endpoint
  - Applies recommended intervention
  - Body: `{ interventionId, accepted: boolean }`
  - Tracks user response to interventions
  - Returns: `{ success, updatedMission?, recoveryPlan? }`

### Task 9: Implement Session-Level Load Monitoring (AC: #1, #2, #3)
- [ ] 9.1: Integrate CognitiveLoadMonitor with StudySession lifecycle
  - Hook into session start: Establish baseline cognitive state
  - Monitor continuously during session: Calculate load every 5 minutes
  - Track behavioral events: Response times, errors, engagement markers
  - Trigger overload detection: Check thresholds after each calculation
- [ ] 9.2: Implement in-session difficulty adjustment
  - When overload detected during session:
    1. Pause current activity
    2. Calculate appropriate difficulty adjustment
    3. Modify upcoming content (switch to easier cards, skip validation prompts)
    4. Notify user: "We've detected high cognitive load - adjusting session to support you"
    5. Apply modifications to remaining session content
  - Track adjustment effectiveness: Measure load reduction post-adjustment
- [ ] 9.3: Implement adaptive break suggestions
  - Trigger break suggestion when load >70 for 10+ minutes
  - Display non-intrusive notification: "Consider taking a 5-minute break"
  - Provide timer-based break with optional mindfulness prompts
  - Track break acceptance and effectiveness (load reduction after break)
- [ ] 9.4: Record cognitive load metrics to BehavioralEvent
  - Emit BehavioralEvent on load calculation: `eventType: COGNITIVE_LOAD_MEASURED`
  - Include load score, stress indicators, and context in eventData
  - Use for retrospective analysis and pattern detection

### Task 10: Implement Performance Correlation Analysis (AC: #8)
- [ ] 10.1: Create `CognitivePerformanceAnalyzer` class
  - Method: `analyzeLoadPerformanceCorrelation(userId): CorrelationAnalysis`
  - Method: `calculateOptimalLoadZone(userId): LoadZoneRecommendation`
  - Method: `compareLoadManagedVsUnmanaged(userId): ComparisonMetrics`
  - Method: `generateLoadPerformanceReport(userId): PerformanceReport`
- [ ] 10.2: Implement correlation analysis
  - Collect paired data: (cognitiveLoad, performanceScore) for all sessions
  - Calculate Pearson correlation coefficient between load and performance
  - Statistical significance testing (p-value < 0.05 for meaningful correlation)
  - Identify optimal load range: Load level with highest performance scores
  - Typical hypothesis: Inverted-U curve (moderate load = peak performance, low/high load = lower performance)
- [ ] 10.3: Calculate optimal cognitive load zone
  - Analyze performance scores across load ranges: <30, 30-50, 50-70, >70
  - Identify "peak performance zone" (typically 40-60 load for most users)
  - Personalize zone based on user's performance data
  - Example result: "Your optimal load zone is 45-65. Performance drops 20% above 70."
- [ ] 10.4: Compare managed vs. unmanaged periods
  - Identify periods before cognitive load monitoring was active (unmanaged)
  - Compare performance metrics: Retention rate, completion rate, mission success rate
  - Calculate improvement attribution: "Since cognitive load monitoring, your retention improved 15%"
  - Track long-term trends: Sustained performance improvement, reduced burnout incidents
- [ ] 10.5: Generate performance report
  - Report components:
    - Load-performance correlation summary with statistical significance
    - Optimal load zone identification
    - Before/after cognitive monitoring comparison
    - Burnout incidents prevented (estimated)
    - Recommended strategies for maintaining optimal load
  - Visualizations: Scatter plot (load vs. performance), bar chart (zone comparison)
  - Export functionality for academic discussions or self-reflection

### Task 11: Testing and Validation (AC: All)
- [ ] 11.1: Manual testing with simulated cognitive overload
  - Deliberately create overload scenarios: Rapid-fire difficult questions, extended sessions (>90 min), fatigue simulation
  - Verify load score increases appropriately (should reach >70)
  - Confirm stress indicators detected (response latency, error clustering)
  - Test automatic difficulty adjustment triggers and effectiveness
- [ ] 11.2: Test burnout prevention system
  - Simulate 2-week intensive study period with high daily load (>60 avg)
  - Verify burnout risk assessment increases to HIGH or CRITICAL
  - Confirm warning signals detected (performance decline, engagement drop)
  - Test intervention recommendations appropriateness and effectiveness
- [ ] 11.3: Validate stress pattern detection
  - Create known stress patterns: Always study physiology at night, struggle on Mondays
  - Trigger pattern analysis after sufficient data collection (3+ weeks)
  - Verify patterns correctly identified with accurate trigger conditions
  - Check stress profile reflects detected patterns
- [ ] 11.4: Test dashboard visualizations
  - Load meter displays accurate current state
  - Timeline shows historical load trends correctly
  - Burnout risk panel reflects current assessment
  - Stress profile visualization matches detected patterns
  - Intervention recommendations are actionable and relevant
- [ ] 11.5: Integration testing with mission generation
  - Test mission generation under various load states (normal, high, recovery)
  - Verify mission complexity adjusts appropriately
  - Confirm break recommendations included when needed
  - Test critical burnout risk scenario (mission generation skipped)
- [ ] 11.6: Validate performance correlation analysis
  - Generate sufficient data across load ranges (4+ weeks, 40+ sessions)
  - Run correlation analysis, verify statistical calculations
  - Check optimal load zone identification makes sense (typically 40-60 range)
  - Validate before/after comparison shows meaningful improvement

## Dev Notes

### Architecture References

- **Solution Architecture:** `/Users/kyin/Projects/Americano-epic5/docs/solution-architecture.md`
  - Subsystem 5: Behavioral Analytics & Personalization (lines 604-648)
  - Cognitive Load Monitoring components (mentioned in context)
  - Database Schema: `BehavioralEvent`, `LearningPattern`, `PerformancePrediction` models (lines 1073-1134)
  - API Architecture: `/api/analytics/*` endpoints (lines 1399-1433)

- **PRD:** `/Users/kyin/Projects/Americano-epic5/docs/PRD-Americano-2025-10-14.md`
  - FR8: Adaptive Difficulty and Cognitive Load Management (lines 115-120)
  - Epic 5: Behavioral Learning Twin (lines 450-468)
  - NFR4: User Experience and cognitive overhead minimization (lines 186-189)

- **Epic Breakdown:** `/Users/kyin/Projects/Americano-epic5/docs/epics-Americano-2025-10-14.md`
  - Story 5.4 Details: Lines 764-785
  - Epic 5 Goals: Cognitive load monitoring and stress response analysis (lines 674-695)

### Database Schema Extensions

**Create `CognitiveLoadMetric` model:**
```prisma
model CognitiveLoadMetric {
  id               String   @id @default(cuid())
  userId           String
  sessionId        String?
  timestamp        DateTime @default(now())
  loadScore        Float    // 0-100
  stressIndicators Json     // Array of detected stress signals
  confidenceLevel  Float    // 0.0-1.0

  // Relations
  session          StudySession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([sessionId])
  @@index([timestamp])
  @@map("cognitive_load_metrics")
}
```

**Create `StressResponsePattern` model:**
```prisma
model StressResponsePattern {
  id                String   @id @default(cuid())
  userId            String
  patternType       StressPatternType
  triggerConditions Json     // Conditions that trigger this stress response
  responseProfile   Json     // How user typically responds to this stressor
  detectedAt        DateTime @default(now())
  lastOccurrence    DateTime @default(now())
  frequency         Int      @default(1)
  confidence        Float    @default(0.5) // 0.0-1.0

  @@index([userId])
  @@index([patternType])
  @@map("stress_response_patterns")
}

enum StressPatternType {
  DIFFICULTY_INDUCED    // Triggered by challenging content
  TIME_PRESSURE         // Triggered by deadline proximity
  FATIGUE_BASED        // Triggered by prolonged study
  EXAM_PROXIMITY       // Triggered by upcoming exam
  TOPIC_SPECIFIC       // Triggered by specific subject matter
}
```

**Create `BurnoutRiskAssessment` model:**
```prisma
model BurnoutRiskAssessment {
  id                  String   @id @default(cuid())
  userId              String
  assessmentDate      DateTime @default(now())
  riskScore           Float    // 0-100
  riskLevel           BurnoutRiskLevel
  contributingFactors Json     // Array of factors with scores
  recommendations     Json     // Array of intervention recommendations

  @@index([userId])
  @@index([assessmentDate])
  @@map("burnout_risk_assessments")
}

enum BurnoutRiskLevel {
  LOW       // <25
  MEDIUM    // 25-50
  HIGH      // 50-75
  CRITICAL  // >75
}
```

**Extend `BehavioralEvent` model:**
```prisma
model BehavioralEvent {
  // ... existing fields ...

  // Cognitive load markers (NEW)
  cognitiveLoadScore  Float?            // 0-100
  stressIndicators    Json?             // Array of stress signals
  overloadDetected    Boolean?          @default(false)
}
```

### Key Algorithms

**Cognitive Load Calculation:**
```typescript
function calculateCognitiveLoad(sessionData: SessionData): number {
  const responseLatency = calculateResponseLatencyScore(sessionData.responseTimes)  // 0-100
  const errorRate = (sessionData.errors / sessionData.totalAttempts) * 100
  const engagementDrop = calculateEngagementDrop(sessionData.pauses, sessionData.duration)
  const performanceDecline = calculatePerformanceDecline(sessionData.currentScore, sessionData.baselineScore)
  const durationStress = calculateDurationStress(sessionData.sessionDuration)

  const loadScore = (
    responseLatency * 0.30 +
    errorRate * 0.25 +
    engagementDrop * 0.20 +
    performanceDecline * 0.15 +
    durationStress * 0.10
  )

  return Math.min(100, Math.max(0, loadScore))
}

function calculateResponseLatencyScore(responseTimes: number[]): number {
  const baseline = calculateBaseline(responseTimes.slice(0, 5))  // First 5 responses
  const current = calculateRollingAverage(responseTimes.slice(-5))  // Last 5 responses
  const percentageIncrease = ((current - baseline) / baseline) * 100

  if (percentageIncrease > 50) return 100
  if (percentageIncrease > 30) return 75
  if (percentageIncrease > 15) return 50
  if (percentageIncrease > 5) return 25
  return 0
}
```

**Burnout Risk Assessment:**
```typescript
function assessBurnoutRisk(userId: string, timeWindow: number = 14): BurnoutRiskScore {
  const intensity = calculateStudyIntensity(userId, timeWindow)  // Hours/week
  const performanceDecline = calculatePerformanceTrend(userId, timeWindow)  // Percentage drop
  const chronicLoad = countHighLoadDays(userId, timeWindow, threshold=60)  // Days with load >60
  const irregularity = calculateSessionIrregularity(userId, timeWindow)  // Missed sessions
  const engagementDecay = calculateEngagementTrend(userId, timeWindow)  // Motivation decline
  const recoveryDeficit = daysSinceLastLowLoad(userId, threshold=40)  // Days since rest

  const riskScore = (
    (intensity / 40) * 20 +                    // Max 20 points (40hrs = 100%)
    (performanceDecline / 100) * 25 +           // Max 25 points
    (chronicLoad / timeWindow) * 25 +           // Max 25 points (every day high load)
    (irregularity / 10) * 15 +                  // Max 15 points (10 missed sessions)
    (engagementDecay / 100) * 10 +              // Max 10 points
    (recoveryDeficit / 14) * 5                  // Max 5 points (14+ days no rest)
  ) * 100

  const riskLevel =
    riskScore >= 75 ? 'CRITICAL' :
    riskScore >= 50 ? 'HIGH' :
    riskScore >= 25 ? 'MEDIUM' : 'LOW'

  return { riskScore: Math.min(100, riskScore), riskLevel }
}
```

**Automatic Difficulty Adjustment:**
```typescript
function adjustDifficulty(currentLoad: number, sessionContext: SessionContext): DifficultyAdjustment {
  if (currentLoad < 30) {
    // Low load - increase challenge
    return {
      difficultyShift: +1,
      reviewRatio: 0.50,  // 50% review, 50% new
      validationComplexity: 'FULL',
      breakFrequency: 'STANDARD',
      recommendation: 'Increasing challenge - you can handle more'
    }
  } else if (currentLoad >= 30 && currentLoad < 60) {
    // Optimal load - maintain
    return {
      difficultyShift: 0,
      reviewRatio: 0.60,  // 60% review, 40% new
      validationComplexity: 'FULL',
      breakFrequency: 'STANDARD',
      recommendation: 'You\'re in the learning zone - maintaining difficulty'
    }
  } else if (currentLoad >= 60 && currentLoad < 80) {
    // High load - reduce challenge
    return {
      difficultyShift: -1,
      reviewRatio: 0.80,  // 80% review, 20% new
      validationComplexity: 'SIMPLIFIED',
      breakFrequency: 'FREQUENT',
      recommendation: 'High cognitive load detected - adjusting to support you'
    }
  } else {
    // Critical overload - emergency adaptation
    return {
      difficultyShift: -2,
      reviewRatio: 1.0,  // 100% review, 0% new
      validationComplexity: 'NONE',
      breakFrequency: 'IMMEDIATE',
      recommendation: 'Cognitive overload - switching to easy review mode. Consider taking a break.'
    }
  }
}
```

**Stress Pattern Identification:**
```typescript
function identifyStressPatterns(userId: string): StressResponsePattern[] {
  const loadHistory = getCognitiveLoadHistory(userId, days=90)
  const patterns: StressResponsePattern[] = []

  // Topic-specific stress
  const topicStress = groupBy(loadHistory, 'topicStudied')
  for (const [topic, sessions] of topicStress) {
    const avgLoad = mean(sessions.map(s => s.loadScore))
    if (avgLoad > 65 && sessions.length >= 3) {
      patterns.push({
        patternType: 'TOPIC_SPECIFIC',
        triggerConditions: { topic },
        responseProfile: { avgLoad, frequency: sessions.length },
        confidence: Math.min(0.95, sessions.length / 10)
      })
    }
  }

  // Time-of-day stress
  const hourStress = groupBy(loadHistory, 'hourOfDay')
  for (const [hour, sessions] of hourStress) {
    const avgLoad = mean(sessions.map(s => s.loadScore))
    if (avgLoad > 60 && sessions.length >= 5) {
      patterns.push({
        patternType: 'TIME_PRESSURE',
        triggerConditions: { hourOfDay: hour },
        responseProfile: { avgLoad, frequency: sessions.length },
        confidence: Math.min(0.90, sessions.length / 15)
      })
    }
  }

  // Exam proximity stress
  const examStress = loadHistory.filter(s => s.daysToExam <= 7)
  if (examStress.length >= 3) {
    const avgLoad = mean(examStress.map(s => s.loadScore))
    if (avgLoad > 70) {
      patterns.push({
        patternType: 'EXAM_PROXIMITY',
        triggerConditions: { daysToExam: '<=7' },
        responseProfile: { avgLoad, frequency: examStress.length },
        confidence: Math.min(0.85, examStress.length / 10)
      })
    }
  }

  return patterns.filter(p => p.confidence >= 0.6)
}
```

### Integration Points

**With Story 5.1 (Learning Pattern Recognition):**
- Uses `BehavioralEvent` model extended with cognitive load markers
- Integrates with `UserLearningProfile` for load tolerance thresholds
- Leverages pattern analysis framework for stress pattern detection

**With Story 5.3 (Session Orchestration):**
- Cognitive load monitoring runs during study sessions
- Session composition adjusted based on load state
- Break recommendations integrated into session flow

**With Story 2.4 (Mission Generation):**
- `MissionGenerator` consumes burnout risk assessment
- Mission complexity and duration adjusted based on cognitive load
- Recovery missions generated when high burnout risk detected

**With Story 4.1-4.6 (Understanding Validation):**
- Validation prompt complexity adjusted based on cognitive load
- Controlled failure scenarios skipped during high load
- Feedback scaffolding increased during overload states

**With Story 2.6 (Mission Analytics):**
- Mission performance correlated with cognitive load during execution
- Adaptation effectiveness measured through load-performance changes
- Insights generated on optimal load zones for mission completion

### Technical Constraints

1. **Real-Time Monitoring:** Cognitive load calculated every 5 minutes during active session. Avoid excessive computation overhead (<100ms per calculation).
2. **Threshold Calibration:** Default thresholds (40/60/80) may need personalization. Collect 4+ weeks data before personalizing thresholds.
3. **Intervention Timing:** Avoid interrupting flow state. Only trigger interventions during natural breaks (between cards, end of section).
4. **Privacy and Stress:** Cognitive load monitoring may induce meta-cognitive stress ("Am I too stressed?"). Provide opt-out in settings.
5. **Statistical Validity:** Correlation analysis requires minimum 30 data points (sessions) for meaningful results. Show "insufficient data" message if below threshold.
6. **Burnout Assessment Frequency:** Run full assessment once per week (Sunday night). Provide on-demand assessment but rate-limit to 1/day.

### Testing Strategy

**Manual Testing (MVP Approach):**
1. **Overload Scenario Testing:**
   - Rapid-fire difficult questions → Verify load score >70
   - Extended session (>90 min) → Confirm duration stress increases
   - Intentional errors (>40% error rate) → Check stress indicators detected
2. **Difficulty Adjustment Testing:**
   - Trigger overload (load >80) → Verify automatic difficulty reduction
   - Confirm content switches to easier cards and review-heavy ratio
   - Check user notification: "High cognitive load detected - adjusting session"
3. **Burnout Prevention Testing:**
   - Simulate 2-week high-intensity period (daily high load) → Verify risk level increases to HIGH/CRITICAL
   - Confirm intervention recommendations appropriate and actionable
   - Test recovery period tracking (load returns to normal after rest)
4. **Dashboard Validation:**
   - Load meter displays real-time load accurately
   - Timeline shows historical trends correctly
   - Burnout risk assessment reflects simulation results
5. **Performance Correlation Testing:**
   - Generate diverse load-performance data (4+ weeks) → Run correlation analysis
   - Verify optimal load zone identification (should be ~40-60 for most users)
   - Check statistical significance reporting (p-value, confidence intervals)

**Edge Cases:**
- User with consistently low load (<30) → No overload prevention needed, focus on challenge increase
- User with chronic high load (>70 for 14+ days) → Critical burnout risk, emergency intervention
- User opts out of cognitive monitoring → Disable load calculation, use default difficulty progression
- Insufficient data (<3 weeks) → Display "Still learning your patterns" message, use conservative thresholds

### UI/UX Considerations

**Design System Compliance:**
- Cognitive load meter uses OKLCH colors: Green oklch(0.7 0.15 145), Yellow oklch(0.8 0.15 90), Orange oklch(0.7 0.15 50), Red oklch(0.6 0.20 30)
- NO gradients - Use solid color zones with transitions
- Glassmorphism for dashboard cards: bg-white/80 backdrop-blur-md
- Timeline chart uses line thickness and opacity to convey load intensity

**Accessibility:**
- Load meter includes text labels and ARIA live region for screen readers
- Color zones supplemented with icons (✓ low, ⚠ moderate, ⚡ high, 🚨 critical)
- Keyboard navigation for intervention recommendation cards
- Dashboard supports high-contrast mode for visual accessibility

**User Messaging:**
- **Supportive, not judgmental:** "You're working hard - let's adjust to support you" (NOT "You're too stressed")
- **Actionable guidance:** "Try 15-minute sessions instead of 60-minute sessions" (specific recommendations)
- **Positive framing:** "Your cognitive load management improved retention by 15%" (celebrate progress)
- **Opt-out transparency:** "Cognitive load monitoring helps prevent burnout. You can disable this in Settings."

**User Flow:**
1. User starts study session (normal load)
2. 30 minutes in, cognitive load increases to 75 (high load detected)
3. System automatically adjusts: Switches to easier cards, reduces validation complexity
4. Notification: "We've detected high cognitive load - adjusting session to support you"
5. Break suggestion appears: "Consider taking a 5-minute break"
6. User takes break (load decreases to 55)
7. Session resumes with adjusted difficulty
8. Session ends - load data recorded for pattern analysis
9. User navigates to `/analytics/cognitive-health` → Sees load timeline, burnout risk assessment
10. System generates weekly insight: "You perform best with 45-minute sessions. Sessions >75 minutes increase load by 40%."

### Performance Optimizations

1. **Incremental Load Calculation:** Calculate load every 5 minutes (not every interaction) to reduce overhead
2. **Caching:** Cache burnout risk assessment for 24 hours (recalculate only once daily unless forced)
3. **Background Analysis:** Stress pattern identification runs as background job (weekly), never blocks user requests
4. **Lazy Loading:** Cognitive load history loaded on-demand when user opens analytics dashboard
5. **Threshold Caching:** Cache personalized load thresholds in UserLearningProfile (avoid recalculation every session)

### References

- **Source:** Epic 5, Story 5.4 (epics-Americano-2025-10-14.md:764-785)
- **Source:** Solution Architecture, Subsystem 5 - Cognitive Load Monitoring (solution-architecture.md:604-648)
- **Source:** Database Schema, Behavioral Analytics Models (solution-architecture.md:1073-1134)
- **Source:** PRD FR8, Epic 5 (PRD-Americano-2025-10-14.md:115-120, 450-468)
- **Source:** Cognitive Load Theory (external: Sweller, 1988, 2011)
- **Source:** Inverted-U Hypothesis (external: Yerkes-Dodson Law, 1908)
- **Source:** Burnout Prevention Research (external: Maslach & Leiter, 2016)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
