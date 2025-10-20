# Story 5.3: Optimal Study Timing and Session Orchestration

Status: Done

## Story

As a medical student,
I want the platform to recommend when and how long I should study,
So that I maximize my learning efficiency based on my personal patterns.

## Acceptance Criteria

1. Personalized recommendations for optimal study times based on performance patterns
2. Session duration suggestions adapted to user's attention span and capacity
3. Break timing recommendations to maintain cognitive performance
4. Content sequencing optimized for user's learning progression preferences
5. Study intensity modulation based on cognitive load and stress indicators
6. Integration with calendar systems for realistic scheduling
7. Adaptation to changing schedules and life circumstances
8. Effectiveness measured through improved study session outcomes

## Tasks / Subtasks

### Task 1: Design and Implement Study Timing Models (AC: #1, #6)
- [ ] 1.1: Create `StudyScheduleRecommendation` model
  - Fields: `id`, `userId`, `recommendedStartTime` (DateTime), `recommendedDuration` (minutes), `confidence` (0.0-1.0), `reasoningFactors` (JSON), `calendarIntegration` (Boolean), `createdAt`, `appliedAt`
  - Reasoning factors: optimal time score, calendar availability, recent performance, fatigue indicators
- [ ] 1.2: Create `SessionOrchestrationPlan` model
  - Fields: `id`, `missionId`, `userId`, `plannedStartTime`, `plannedEndTime`, `actualStartTime`, `actualEndTime`, `plannedBreaks` (JSON array), `actualBreaks` (JSON array), `intensityModulation` (LOW/MEDIUM/HIGH), `contentSequence` (JSON array), `createdAt`
  - Tracks planned vs. actual execution for adaptation learning
- [ ] 1.3: Create `CalendarIntegration` model
  - Fields: `id`, `userId`, `calendarProvider` (GOOGLE/OUTLOOK/ICAL), `accessToken` (encrypted), `refreshToken` (encrypted), `calendarId`, `syncEnabled` (Boolean), `lastSyncAt`, `createdAt`
  - Supports reading availability and optionally writing study sessions
- [ ] 1.4: Create `ScheduleAdaptation` model
  - Fields: `id`, `userId`, `adaptationType` (TIME_SHIFT/DURATION_CHANGE/INTENSITY_ADJUSTMENT), `reason`, `oldValue`, `newValue`, `appliedAt`, `effectivenessScore` (0-100), `createdAt`
  - Tracks how schedule recommendations evolve with changing circumstances
- [ ] 1.5: Run Prisma migration for scheduling models

### Task 2: Implement Optimal Study Time Recommender (AC: #1, #7)
- [ ] 2.1: Create `StudyTimeRecommender` class
  - Method: `generateRecommendations(userId, date): StudyScheduleRecommendation[]`
  - Method: `findOptimalTimeSlots(userId, duration, date): TimeSlot[]`
  - Method: `calculateConfidence(userId, timeSlot): number`
  - Method: `adaptToScheduleChange(userId, change): AdaptationResult`
- [ ] 2.2: Implement optimal time slot detection algorithm
  - Use UserLearningProfile.preferredStudyTimes as baseline (from Story 5.1)
  - Cross-reference with calendar availability (if integrated)
  - Factor in recent performance trends (last 7 days)
  - Consider time-of-day energy levels based on historical session quality
  - Generate 3-5 recommended time slots per day with confidence scores
- [ ] 2.3: Implement calendar availability integration
  - Fetch busy/free periods from calendar provider
  - Identify free blocks ≥30 minutes (minimum session duration)
  - Prioritize free blocks that align with optimal study times
  - Handle timezone conversions for accurate scheduling
- [ ] 2.4: Implement confidence scoring algorithm
  - Base confidence: Historical performance at this time (0.4 weight)
  - Calendar confidence: No conflicts (0.3 weight)
  - Recency confidence: Recent successful sessions at similar times (0.2 weight)
  - Consistency confidence: Regular pattern at this time (0.1 weight)
  - Formula: confidence = Σ(factor * weight), scale 0.0-1.0
- [ ] 2.5: Implement schedule adaptation logic
  - Detect schedule changes: exam date shifts, course schedule updates
  - Analyze impact on existing recommendations
  - Generate new recommendations based on updated constraints
  - Notify user of recommended adjustments with reasoning

### Task 3: Implement Session Duration Optimizer (AC: #2, #3)
- [ ] 3.1: Create `SessionDurationOptimizer` class
  - Method: `recommendDuration(userId, missionComplexity, timeOfDay): DurationRecommendation`
  - Method: `calculateBreakSchedule(userId, sessionDuration): BreakSchedule`
  - Method: `detectFatigueThreshold(userId): FatigueProfile`
  - Method: `adjustDurationDynamically(sessionId, performanceMetrics): DurationAdjustment`
- [ ] 3.2: Implement personalized duration recommendation
  - Use UserLearningProfile.optimalSessionDuration as baseline (from Story 5.1)
  - Adjust based on mission complexity: easy (-10 min), medium (baseline), hard (+15 min)
  - Adjust based on time-of-day: peak hours (can extend 20%), off-peak (reduce 10-15%)
  - Consider recent study load: back-to-back sessions (reduce), well-rested (can extend)
  - Return: { recommendedDuration, minDuration, maxDuration, confidence }
- [ ] 3.3: Implement break timing algorithm (Pomodoro-inspired, personalized)
  - Analyze user's attention cycle patterns (from Story 5.1 behavioral data)
  - Default break frequency: Every 25-45 minutes (personalized sweet spot)
  - Break duration: 5 min (short), 10 min (medium), 15 min (long after 90+ min sessions)
  - Break triggers: Performance degradation >15%, engagement drop, time threshold
  - Return: `{ breakIntervals: [25, 50, 75], breakDurations: [5, 5, 10] }`
- [ ] 3.4: Implement fatigue detection for duration adjustment
  - Monitor within-session performance metrics
  - Track review accuracy, response times, engagement level
  - Detect inflection point: When performance drops 20%+ from session start
  - Recommend session end or extended break when fatigue detected
  - Update UserLearningProfile with fatigue thresholds for future sessions
- [ ] 3.5: Implement dynamic duration adjustment during sessions
  - Real-time monitoring: If user completing tasks faster than expected → suggest extending
  - If performance declining → suggest concluding or taking break
  - Calculate ROI: Diminishing returns threshold (productivity drops below 60% of peak)
  - Provide in-session notification: "You're 20% past your optimal duration. Consider wrapping up."

### Task 4: Implement Content Sequencing Engine (AC: #4)
- [ ] 4.1: Create `ContentSequencer` class
  - Method: `generateSequence(userId, mission, sessionDuration): ContentSequence`
  - Method: `optimizeForLearningProgression(userId, objectives): SequenceOptimization`
  - Method: `balanceContentTypes(userId, availableContent): BalancedSequence`
  - Method: `adaptSequenceInSession(sessionId, performanceMetrics): SequenceAdjustment`
- [ ] 4.2: Implement learning progression-based sequencing
  - Warm-up phase (first 10-15 min): Review familiar content, build confidence
  - Peak phase (middle 40-60%): New challenging content, validation prompts
  - Wind-down phase (last 15-20%): Lighter review, consolidation, easier tasks
  - Prerequisite ordering: Ensure foundational concepts before advanced topics
  - Difficulty progression: Gradual increase, avoid sharp jumps
- [ ] 4.3: Implement content type balancing
  - Use learningStyleProfile (from Story 5.1) for content type preferences
  - Sequence: Flashcards → Lecture review → Validation prompts → Clinical reasoning
  - Balance ratio example: 40% flashcards, 30% validation, 20% clinical, 10% lecture
  - Adjust based on user preferences: If kinesthetic (high) → more clinical scenarios earlier
  - Avoid monotony: Alternate content types, max 3 consecutive items of same type
- [ ] 4.4: Implement spaced repetition integration in sequencing
  - Interleave due cards throughout session (not all at start/end)
  - Space reviews of same concept ≥10 minutes apart within session
  - Prioritize high-priority reviews in peak phase
  - Mix old (reviews) and new (learning) content: 60% reviews, 40% new (adaptive ratio)
- [ ] 4.5: Implement in-session sequence adaptation
  - Monitor performance on current content type
  - If struggling with validation prompts → switch to flashcards for confidence
  - If breezing through reviews → introduce new content earlier
  - Maintain mission objectives coverage while optimizing flow

### Task 5: Implement Study Intensity Modulator (AC: #5)
- [ ] 5.1: Create `StudyIntensityModulator` class
  - Method: `calculateIntensity(userId, recentLoad, stressIndicators): IntensityRecommendation`
  - Method: `detectCognitiveOverload(userId, sessionMetrics): OverloadAssessment`
  - Method: `modulateSessionIntensity(sessionPlan, targetIntensity): ModulatedPlan`
  - Method: `recommendRecoveryPeriod(userId, burnoutRisk): RecoveryPlan`
- [ ] 5.2: Implement cognitive load assessment
  - Recent study volume: Hours studied last 7 days vs. baseline
  - Session performance trend: Average accuracy last 5 sessions
  - Validation scores: Recent "explain to patient" performance
  - Stress indicators: Session abandonment rate, pause frequency, response times
  - Calculate cognitive load score: 0-100 (0=fresh, 100=overloaded)
- [ ] 5.3: Implement intensity level calculation
  - LOW intensity: cognitiveLoad <30, recent performance >80%, well-rested
    - Characteristics: More new content, challenging validation, clinical reasoning
  - MEDIUM intensity: cognitiveLoad 30-60, recent performance 60-80%, normal state
    - Characteristics: Balanced new+review, moderate challenges, standard mission
  - HIGH intensity: cognitiveLoad >60, recent performance <60%, fatigue signals
    - Characteristics: Mostly review, easier content, shorter sessions, more breaks
  - Return: { intensity: 'MEDIUM', confidence: 0.8, reasoning: [...] }
- [ ] 5.4: Implement session plan modulation based on intensity
  - LOW intensity: Standard mission, full duration, challenging content
  - MEDIUM intensity: Reduce mission scope 20%, add 1-2 extra breaks
  - HIGH intensity: Reduce mission scope 40%, focus on review only, shorten duration 30%
  - Burnout protection: If cognitiveLoad >80 for 3+ consecutive days → recommend rest day
- [ ] 5.5: Implement recovery period recommendations
  - Detect burnout risk: cognitiveLoad >70 for 5+ days, performance declining
  - Recommend: Light review day (30 min, easy content) or full rest day
  - Track recovery: Monitor performance rebound after reduced intensity
  - Generate insights: "Taking a rest day improved your performance 25% the next week"

### Task 6: Implement Calendar Integration System (AC: #6)
- [ ] 6.1: Create calendar provider abstraction layer
  - Interface: `CalendarProvider` with methods: `authenticate()`, `fetchEvents()`, `createEvent()`, `updateEvent()`, `deleteEvent()`
  - Implementations: `GoogleCalendarProvider`, `OutlookCalendarProvider`, `ICalProvider`
  - Handle OAuth 2.0 flows for Google/Outlook, basic auth for iCal
- [ ] 6.2: Implement Google Calendar integration
  - OAuth 2.0 authentication flow using Google Calendar API
  - Fetch events: GET `/calendars/primary/events` with time range filters
  - Identify free/busy periods from event list
  - Create study session events: POST `/calendars/primary/events` with mission details
  - Handle API rate limits, token refresh, error handling
- [ ] 6.3: Implement Outlook Calendar integration (optional for MVP, document for future)
  - OAuth 2.0 via Microsoft Graph API
  - Endpoints: `/me/calendar/events`, `/me/calendarView`
  - Similar free/busy parsing and event creation
  - Document implementation pattern for future addition
- [ ] 6.4: Create Settings UI for calendar integration
  - Section: "Calendar Integration" in Settings page
  - Connect buttons: "Connect Google Calendar", "Connect Outlook" (future)
  - Authorization flow: Redirect to provider OAuth, handle callback
  - Display connected calendar: Email, calendar name, last sync time
  - Disconnect button: Revoke tokens, clear stored credentials
  - Privacy notice: "We only read availability and optionally write study sessions"
- [ ] 6.5: Implement calendar sync service
  - Scheduled job: Sync calendar events daily (or before mission generation)
  - Parse events into availability windows
  - Store availability in BehavioralEvent or separate AvailabilityWindow model
  - Use availability in StudyTimeRecommender for conflict-free scheduling
  - Handle sync errors gracefully, notify user if sync fails

### Task 7: Build Session Orchestration Dashboard (AC: #1, #2, #3, #4, #5)
- [ ] 7.1: Create `/study/orchestration` page
  - Header: Today's Recommended Study Schedule
  - Section 1: Optimal Time Recommendations (3-5 time slots with confidence)
  - Section 2: Session Plan Preview (duration, breaks, content sequence)
  - Section 3: Intensity Adjustment (current cognitive load, recommended intensity)
  - Section 4: Calendar Integration status (connected/not connected)
  - Action buttons: "Start Recommended Session", "Customize Schedule", "Settings"
- [ ] 7.2: Design `OptimalTimeSlotsPanel` component
  - Display 3-5 recommended time slots for today
  - Each slot: Start time, duration, confidence indicator (★★★★☆)
  - Reasoning tooltip: "Based on your 85% performance at this time last week"
  - Visual indicators: Green (available + optimal), Yellow (available but suboptimal), Red (busy)
  - Calendar conflicts shown: "Busy: Anatomy Lab 2-4 PM"
  - "Select" button: Load session plan for this time slot
- [ ] 7.3: Create `SessionPlanPreview` component
  - Timeline visualization: 60-minute session breakdown
  - Phases: Warm-up (10 min) → Peak (35 min) → Wind-down (15 min)
  - Content sequence: Cards (flashcards, validation, clinical) with durations
  - Break indicators: 5-min breaks at 25 min and 50 min marks
  - Intensity badge: "MEDIUM intensity - Balanced challenge"
  - "Customize" button: Open sequence editor
- [ ] 7.4: Build `CognitiveLoadIndicator` component
  - Gauge visualization: 0-100 scale (green <30, yellow 30-70, red >70)
  - Current load: 45 (MEDIUM)
  - Recent trend: Line chart last 7 days
  - Recommendation: "Your cognitive load is moderate. Standard intensity recommended."
  - Warning if high: "You're showing fatigue signs. Consider a lighter session or rest day."
- [ ] 7.5: Design `CalendarStatusWidget` component
  - Connected state: ✓ Google Calendar connected, Last sync: 10 min ago
  - Not connected state: "Connect calendar for smarter scheduling" + Connect button
  - Sync status: "Next sync in 50 min" or "Syncing..." spinner
  - Settings link: "Manage calendar settings"
- [ ] 7.6: Implement session plan customization UI
  - Modal/panel: Customize Session Plan
  - Adjust duration: Slider 30-120 minutes
  - Adjust intensity: Radio buttons (LOW/MEDIUM/HIGH)
  - Content preferences: Checkboxes for content types to include/exclude
  - Break frequency: Dropdown (Every 25/45/60 min) + duration (5/10/15 min)
  - Preview updated sequence in real-time
  - Save as template: "Save this plan for future sessions"

### Task 8: Build Orchestration APIs (AC: #1, #2, #3, #4, #5, #6)
- [ ] 8.1: Create POST `/api/orchestration/recommendations` endpoint
  - Body: `{ userId, date, missionId? }`
  - Runs StudyTimeRecommender.generateRecommendations()
  - Returns: `{ recommendations: [{ startTime, duration, confidence, reasoning, calendarConflict }], cognitiveLoad }`
- [ ] 8.2: Create POST `/api/orchestration/session-plan` endpoint
  - Body: `{ userId, missionId, startTime, duration?, intensity? }`
  - Generates complete SessionOrchestrationPlan
  - Runs: SessionDurationOptimizer + ContentSequencer + StudyIntensityModulator
  - Returns: `{ plan: { startTime, endTime, breaks, contentSequence, intensity }, confidence }`
- [ ] 8.3: Create GET `/api/orchestration/cognitive-load` endpoint
  - Calculates current cognitive load for user
  - Query params: `userId`, `includeTrend?` (last 7 days)
  - Returns: `{ load: 45, level: 'MEDIUM', trend: [...], recommendation }`
- [ ] 8.4: Create POST `/api/orchestration/adapt-schedule` endpoint
  - Body: `{ userId, adaptationType, reason, oldValue, newValue }`
  - Records schedule adaptation in ScheduleAdaptation model
  - Regenerates recommendations based on new constraints
  - Returns: `{ updatedRecommendations: [...], adaptationId }`
- [ ] 8.5: Create GET `/api/orchestration/effectiveness` endpoint
  - Measures effectiveness of orchestration recommendations
  - Compares planned vs. actual session outcomes
  - Query params: `userId`, `dateRange?`
  - Returns: `{ adherenceRate, performanceImprovement, avgConfidence, insights: [...] }`
- [ ] 8.6: Create calendar integration endpoints
  - POST `/api/calendar/connect`: Initiate OAuth flow, return authorization URL
  - GET `/api/calendar/callback`: Handle OAuth callback, store tokens
  - GET `/api/calendar/status`: Check integration status, last sync time
  - POST `/api/calendar/sync`: Trigger manual sync
  - DELETE `/api/calendar/disconnect`: Revoke tokens, remove integration

### Task 9: Integrate Orchestration with Mission Generation (AC: #1, #2, #4)
- [ ] 9.1: Update `MissionGenerator` to use orchestration recommendations
  - Query StudyTimeRecommender for optimal time before generating mission
  - Set Mission.recommendedStartTime field (NEW field to add to Mission model)
  - Adjust Mission.estimatedMinutes based on SessionDurationOptimizer output
  - Populate Mission.contentSequence field with optimized sequence (NEW field)
- [ ] 9.2: Extend Mission model with orchestration fields
  - Add `recommendedStartTime` (DateTime, nullable)
  - Add `recommendedDuration` (Int, minutes)
  - Add `intensityLevel` (LOW/MEDIUM/HIGH, enum)
  - Add `contentSequence` (JSON array of content IDs with types)
  - Add `orchestrationPlanId` (String, FK to SessionOrchestrationPlan)
- [ ] 9.3: Update mission briefing UI to show orchestration details
  - Display: "Best time to study: 7:00-8:00 AM (85% confidence)"
  - Display: "Recommended duration: 45 minutes with 2 breaks"
  - Display: "Intensity: MEDIUM - Balanced challenge"
  - Show content sequence preview: "5 flashcards → 3 validations → 2 clinical scenarios"
  - "Start Now" vs. "Schedule for Later" buttons
- [ ] 9.4: Implement flexible mission scheduling
  - Allow user to override recommended time: Select from alternative time slots
  - If user starts mission at non-recommended time, track adherence
  - Calculate performance delta: Recommended time vs. actual time chosen
  - Generate insight: "Sessions at recommended times perform 30% better"

### Task 10: Implement Adaptive Orchestration (AC: #7, #8)
- [ ] 10.1: Create `OrchestrationAdaptationEngine` class
  - Method: `detectScheduleChanges(userId): ScheduleChange[]`
  - Method: `assessImpact(userId, scheduleChange): ImpactAssessment`
  - Method: `generateAdaptation(userId, scheduleChange): AdaptationPlan`
  - Method: `measureEffectiveness(userId, dateRange): EffectivenessReport`
- [ ] 10.2: Implement schedule change detection
  - Monitor calendar events for changes: new conflicts, cancelled events
  - Detect exam date updates from user input or syllabus changes
  - Identify life events: travel, illness, schedule disruptions
  - Parse user feedback: "I can't study mornings anymore" → adapt recommendations
- [ ] 10.3: Implement impact assessment algorithm
  - Analyze how schedule change affects current recommendations
  - Identify conflicts: Optimal time now has calendar conflict
  - Calculate disruption severity: MINOR (single day), MODERATE (week), MAJOR (ongoing)
  - Generate impact report: "Your optimal 7 AM slot now conflicts with clinic. Alternative: 8 PM."
- [ ] 10.4: Implement adaptation plan generation
  - If optimal time unavailable: Find next-best alternative from UserLearningProfile
  - If duration constraints change: Adjust to shorter sessions + more frequency
  - If intensity needs reduction: Modulate content difficulty, extend timeline
  - Generate new SessionOrchestrationPlans aligned with constraints
- [ ] 10.5: Implement effectiveness measurement
  - Compare session outcomes: Orchestrated vs. non-orchestrated sessions
  - Metrics: Completion rate, performance scores, user satisfaction, adherence
  - Calculate improvement: "Orchestrated sessions show 22% better retention"
  - Statistical analysis: Pearson correlation, p-values for confidence
  - Generate weekly effectiveness report for user review

### Task 11: Build Effectiveness Analytics Dashboard (AC: #8)
- [ ] 11.1: Create `/analytics/orchestration-effectiveness` page
  - Header: Session Orchestration Impact Analysis
  - Section 1: Adherence Metrics (how often user follows recommendations)
  - Section 2: Performance Comparison (orchestrated vs. self-scheduled)
  - Section 3: Optimal Time Validation (performance at recommended times)
  - Section 4: Duration Optimization Results (optimal vs. actual durations)
  - Section 5: Adaptation Effectiveness (impact of schedule changes)
- [ ] 11.2: Design `AdherenceMetricsPanel` component
  - Adherence rate: 75% (user follows recommendations 3 out of 4 sessions)
  - Breakdown: Time adherence (80%), Duration adherence (70%), Intensity adherence (90%)
  - Trend chart: Last 4 weeks adherence patterns
  - Insight: "Higher adherence weeks correlate with 18% better performance"
- [ ] 11.3: Create `PerformanceComparisonChart` component
  - Bar chart comparison:
    - Orchestrated sessions: Avg performance 82%, completion 90%
    - Self-scheduled sessions: Avg performance 68%, completion 75%
  - Statistical significance: p-value <0.05 (if sufficient data)
  - Recommendation: "Following orchestration improves outcomes by 20%"
- [ ] 11.4: Build `OptimalTimeValidationPanel` component
  - Heatmap: Recommended times vs. actual session performance
  - Validate recommendations: Do sessions at recommended times actually perform better?
  - Confidence intervals: "7-9 AM sessions: 82±5% avg performance (95% CI)"
  - Adjustments: If recommendations not correlating → recalibrate algorithm
- [ ] 11.5: Design `DurationOptimizationResults` component
  - Scatter plot: Actual duration vs. performance score
  - Overlay recommended duration band (e.g., 40-50 min optimal zone)
  - Mark sessions: Green (within optimal), Yellow (slightly off), Red (way off)
  - Insight: "Sessions within ±10 min of recommended duration perform 15% better"
- [ ] 11.6: Create `AdaptationImpactAnalysis` component
  - List schedule adaptations with effectiveness scores
  - Example: "Shifted 7 AM → 8 PM: -12% performance impact, but 95% adherence"
  - Identify successful adaptations vs. suboptimal compromises
  - Recommendation: "Consider splitting long sessions to maintain optimal timing"

### Task 12: Implement Real-Time Session Orchestration (AC: #3, #4, #5)
- [ ] 12.1: Extend Study Session component with real-time orchestration
  - Display session timeline: Current phase, time remaining, upcoming breaks
  - Break notifications: "Break in 5 minutes. Current performance: 85%"
  - Dynamic adjustments: "You're ahead of schedule. Ready for challenging content?"
  - Fatigue warnings: "Performance dropping. Consider taking a break now."
- [ ] 12.2: Implement in-session performance monitoring
  - Track metrics every 5 minutes: Accuracy, response times, engagement
  - Calculate real-time performance score: 0-100
  - Detect trends: Improving (upward), stable, declining (downward)
  - Trigger orchestration adjustments based on trends
- [ ] 12.3: Implement intelligent break prompts
  - Scheduled breaks: Notify 2 minutes before planned break
  - Performance-triggered breaks: "Your accuracy dropped 20%. Take a break?"
  - Optional breaks: User can skip, postpone (5 min), or take now
  - Track break effectiveness: Performance rebound after breaks
- [ ] 12.4: Implement content sequence adaptation during session
  - If user struggling with current content type → suggest switch
  - If user excelling → introduce more challenging content earlier
  - Maintain mission objectives while optimizing flow
  - User override: "Skip to clinical reasoning" option
- [ ] 12.5: Implement session extension/early completion logic
  - Performance exceeding expectations + time available → suggest extension
  - Objectives completed early + high performance → offer early completion
  - Fatigue detected + objectives not critical → suggest wrapping up
  - User choice: Accept recommendation or continue as planned

### Task 13: Testing and Validation (AC: All)
- [ ] 13.1: Manual testing with real scheduling scenarios
  - Test optimal time recommendations with different user patterns (morning/evening learners)
  - Validate calendar integration: Google Calendar (connect, sync, disconnect)
  - Test schedule adaptations: Introduce exam date change, observe recommendation updates
  - Verify intensity modulation: Simulate high cognitive load, confirm lighter sessions recommended
- [ ] 13.2: Verify session orchestration quality
  - Start orchestrated session, follow recommended plan
  - Validate content sequencing: Warm-up → Peak → Wind-down flow feels natural
  - Test break prompts: Confirm breaks occur at recommended intervals
  - Measure session outcomes vs. non-orchestrated sessions
- [ ] 13.3: Test adaptive features
  - Introduce schedule conflict in calendar → verify alternative time recommendations
  - Simulate life event (exam week) → confirm intensity modulation
  - Test adherence tracking: Follow/ignore recommendations, verify tracking accuracy
  - Validate effectiveness measurement: Compare orchestrated vs. self-scheduled performance
- [ ] 13.4: Test real-time orchestration
  - During session: Verify timeline displays correctly
  - Trigger fatigue: Perform poorly intentionally → confirm break prompt
  - Test content switching: Request content type change during session
  - Validate session extension: Complete objectives early → confirm early completion option
- [ ] 13.5: Integration testing
  - Verify MissionGenerator uses orchestration recommendations
  - Test UserLearningProfile integration (Story 5.1 data)
  - Validate BehavioralEvent tracking for orchestration activities
  - Test effectiveness analytics calculations with real session data
- [ ] 13.6: Edge case testing
  - User with no calendar integration: Recommendations still work
  - User with very irregular schedule: Graceful degradation
  - User with high cognitive load for extended period: Burnout protection triggers
  - User ignores all recommendations: System continues learning and adapting

## Dev Notes

### Architecture References

- **Solution Architecture:** `/Users/kyin/Projects/Americano-epic5/docs/solution-architecture.md`
  - Subsystem 5: Behavioral Analytics & Personalization (lines 604-648)
  - Subsystem 2: Learning Engine - Session Orchestration (lines 524-548, FR9)
  - API Architecture: `/api/learning/sessions`, `/api/analytics/*` endpoints
  - Real-time features: SSE for in-session updates (lines 399-400)

- **PRD:** `/Users/kyin/Projects/Americano-epic5/docs/PRD-Americano-2025-10-14.md`
  - FR9: Smart Study Session Orchestration (lines 122-128)
  - FR6: Behavioral Learning Pattern Analysis (lines 103-108)
  - NFR1: Performance requirements (<1s recommendations)
  - UX Design Principles: UX2 Study Flow Preservation (lines 348-349)

- **Epic Breakdown:** `/Users/kyin/Projects/Americano-epic5/docs/epics-Americano-2025-10-14.md`
  - Story 5.3 Details: Lines 742-763
  - Epic 5 Goals and Success Criteria: Lines 674-695
  - Prerequisites: Story 5.1 (Learning Patterns), Story 5.2 (Struggle Prediction)

### Database Schema Extensions

**Extend `Mission` model with orchestration fields:**
```prisma
model Mission {
  // ... existing fields ...

  // Session Orchestration (NEW - Story 5.3)
  recommendedStartTime  DateTime?
  recommendedDuration   Int?                    // Minutes
  intensityLevel        IntensityLevel?         @default(MEDIUM)
  contentSequence       Json?                   // Array of {type, id, duration}
  orchestrationPlanId   String?
  orchestrationPlan     SessionOrchestrationPlan? @relation(fields: [orchestrationPlanId], references: [id])

  @@index([recommendedStartTime])
}

enum IntensityLevel {
  LOW       // Light cognitive load, mostly review
  MEDIUM    // Balanced new + review
  HIGH      // Intensive, challenging content
}
```

**Create `StudyScheduleRecommendation` model:**
```prisma
model StudyScheduleRecommendation {
  id                    String   @id @default(cuid())
  userId                String
  recommendedStartTime  DateTime
  recommendedDuration   Int      // Minutes
  confidence            Float    // 0.0-1.0
  reasoningFactors      Json     // { optimalTimeScore, calendarAvailable, recentPerformance, ... }
  calendarIntegration   Boolean  @default(false)
  createdAt             DateTime @default(now())
  appliedAt             DateTime?

  @@index([userId])
  @@index([recommendedStartTime])
  @@map("study_schedule_recommendations")
}
```

**Create `SessionOrchestrationPlan` model:**
```prisma
model SessionOrchestrationPlan {
  id                  String        @id @default(cuid())
  missionId           String?
  userId              String
  plannedStartTime    DateTime
  plannedEndTime      DateTime
  actualStartTime     DateTime?
  actualEndTime       DateTime?
  plannedBreaks       Json          // [{ time: 25, duration: 5 }, ...]
  actualBreaks        Json?         // [{ startedAt, endedAt }, ...]
  intensityModulation IntensityLevel @default(MEDIUM)
  contentSequence     Json          // [{ type, id, duration, phase }, ...]
  createdAt           DateTime      @default(now())

  // Relations
  missions            Mission[]

  @@index([userId])
  @@index([plannedStartTime])
  @@map("session_orchestration_plans")
}
```

**Create `CalendarIntegration` model:**
```prisma
model CalendarIntegration {
  id               String   @id @default(cuid())
  userId           String   @unique
  calendarProvider CalendarProvider
  accessToken      String   // Encrypted
  refreshToken     String?  // Encrypted
  calendarId       String
  syncEnabled      Boolean  @default(true)
  lastSyncAt       DateTime?
  createdAt        DateTime @default(now())

  @@index([userId])
  @@map("calendar_integrations")
}

enum CalendarProvider {
  GOOGLE
  OUTLOOK
  ICAL
}
```

**Create `ScheduleAdaptation` model:**
```prisma
model ScheduleAdaptation {
  id                 String         @id @default(cuid())
  userId             String
  adaptationType     AdaptationType
  reason             String         @db.Text
  oldValue           String?
  newValue           String?
  appliedAt          DateTime       @default(now())
  effectivenessScore Int?           // 0-100, measured post-adaptation

  @@index([userId])
  @@index([appliedAt])
  @@map("schedule_adaptations")
}

enum AdaptationType {
  TIME_SHIFT           // Optimal time changed
  DURATION_CHANGE      // Session duration adjusted
  INTENSITY_ADJUSTMENT // Cognitive load modulation
  FREQUENCY_CHANGE     // More/fewer sessions per week
}
```

### Key Algorithms

**Optimal Time Slot Detection:**
```typescript
function findOptimalTimeSlots(
  userId: string,
  duration: number,
  date: Date
): TimeSlot[] {
  // 1. Get user's learning profile (from Story 5.1)
  const profile = await getUserLearningProfile(userId);
  const preferredTimes = profile.preferredStudyTimes; // [{ day, startHour, endHour }]

  // 2. Fetch calendar availability (if integrated)
  const calendarEvents = await fetchCalendarEvents(userId, date);
  const busyPeriods = parseBusyPeriods(calendarEvents);

  // 3. Generate candidate time slots (every 30 min throughout day)
  const candidates = generateTimeSlots(date, 30); // 6 AM - 11 PM

  // 4. Score each candidate
  const scoredSlots = candidates.map(slot => {
    // Historical performance at this time (0-100)
    const performanceScore = getHistoricalPerformance(userId, slot.startHour);

    // Calendar availability (0/100: busy/free)
    const availabilityScore = isAvailable(slot, busyPeriods) ? 100 : 0;

    // Alignment with preferred times (0-100)
    const preferenceScore = matchesPreferredTime(slot, preferredTimes) ? 100 : 50;

    // Recent success at similar times (0-100)
    const recencyScore = getRecentSuccessScore(userId, slot.startHour);

    // Weighted total
    const totalScore = (
      performanceScore * 0.4 +
      availabilityScore * 0.3 +
      preferenceScore * 0.2 +
      recencyScore * 0.1
    );

    return {
      ...slot,
      score: totalScore,
      confidence: calculateConfidence(performanceScore, availabilityScore),
      reasoning: generateReasoning(performanceScore, availabilityScore, preferenceScore)
    };
  });

  // 5. Return top 5 slots, sorted by score
  return scoredSlots
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
```

**Session Duration Optimization:**
```typescript
function recommendDuration(
  userId: string,
  missionComplexity: 'easy' | 'medium' | 'hard',
  timeOfDay: number // hour 0-23
): DurationRecommendation {
  // 1. Get baseline optimal duration (from Story 5.1)
  const profile = await getUserLearningProfile(userId);
  let baseDuration = profile.optimalSessionDuration; // e.g., 45 min

  // 2. Adjust for mission complexity
  const complexityAdjustment = {
    easy: -10,    // Shorter for easy content
    medium: 0,    // Baseline
    hard: +15     // Longer for challenging content
  };
  baseDuration += complexityAdjustment[missionComplexity];

  // 3. Adjust for time of day
  const isPeakHour = isPeakPerformanceTime(userId, timeOfDay);
  if (isPeakHour) {
    baseDuration *= 1.2; // Can extend 20% during peak hours
  } else {
    baseDuration *= 0.9; // Reduce 10% during off-peak
  }

  // 4. Adjust for recent study load
  const recentLoad = await getRecentStudyLoad(userId, 7); // last 7 days
  if (recentLoad > 20) { // Back-to-back sessions
    baseDuration *= 0.85; // Reduce to prevent fatigue
  }

  // 5. Calculate break schedule
  const breakSchedule = calculateBreakSchedule(userId, baseDuration);

  return {
    recommendedDuration: Math.round(baseDuration),
    minDuration: Math.round(baseDuration * 0.8),
    maxDuration: Math.round(baseDuration * 1.2),
    breaks: breakSchedule,
    confidence: 0.85
  };
}
```

**Content Sequencing for Learning Progression:**
```typescript
function generateSequence(
  userId: string,
  mission: Mission,
  sessionDuration: number
): ContentSequence {
  const profile = await getUserLearningProfile(userId);
  const learningStyle = profile.learningStyleProfile; // { visual, auditory, kinesthetic, reading }

  // 1. Divide session into phases
  const warmUpDuration = Math.min(15, sessionDuration * 0.2);
  const peakDuration = sessionDuration * 0.6;
  const windDownDuration = sessionDuration * 0.2;

  // 2. Get available content
  const reviewCards = await getDueCards(userId, mission.id);
  const newContent = await getNewContent(userId, mission.objectives);
  const validationPrompts = await getValidationPrompts(userId, mission.objectives);
  const clinicalScenarios = await getClinicalScenarios(userId, mission.objectives);

  // 3. Sequence by phase
  const sequence = [];

  // WARM-UP: Familiar review content, build confidence
  const warmUpCards = reviewCards
    .filter(c => c.difficulty < 5) // Easy reviews
    .slice(0, 5);
  sequence.push(...warmUpCards.map(c => ({
    type: 'flashcard',
    id: c.id,
    duration: 2,
    phase: 'warmup'
  })));

  // PEAK: New challenging content + validation
  const peakContent = [];

  // Prioritize by learning style
  if (learningStyle.kinesthetic > 0.5) {
    // Kinesthetic learners: Clinical scenarios first
    peakContent.push(...clinicalScenarios.slice(0, 2).map(s => ({
      type: 'clinical',
      id: s.id,
      duration: 8,
      phase: 'peak'
    })));
  }

  // Mix new content and validation
  peakContent.push(...newContent.slice(0, 3).map(c => ({
    type: 'new_flashcard',
    id: c.id,
    duration: 3,
    phase: 'peak'
  })));

  peakContent.push(...validationPrompts.slice(0, 2).map(p => ({
    type: 'validation',
    id: p.id,
    duration: 5,
    phase: 'peak'
  })));

  // Interleave content types (avoid monotony)
  sequence.push(...interleaveContent(peakContent));

  // WIND-DOWN: Lighter review, consolidation
  const windDownCards = reviewCards
    .filter(c => c.difficulty >= 5 && c.difficulty < 8) // Medium reviews
    .slice(0, 4);
  sequence.push(...windDownCards.map(c => ({
    type: 'flashcard',
    id: c.id,
    duration: 2,
    phase: 'winddown'
  })));

  return {
    sequence,
    totalDuration: sequence.reduce((sum, item) => sum + item.duration, 0),
    phases: { warmUp: warmUpDuration, peak: peakDuration, windDown: windDownDuration }
  };
}
```

**Cognitive Load Assessment:**
```typescript
async function calculateCognitiveLoad(userId: string): Promise<number> {
  // 1. Recent study volume (last 7 days)
  const recentHours = await getStudyHours(userId, 7);
  const baselineHours = await getBaselineStudyHours(userId); // User's typical weekly hours
  const volumeLoad = Math.min(100, (recentHours / baselineHours) * 50);

  // 2. Performance trend (last 5 sessions)
  const recentSessions = await getRecentSessions(userId, 5);
  const avgPerformance = mean(recentSessions.map(s => s.performanceScore));
  const performanceLoad = 100 - avgPerformance; // Lower performance = higher load

  // 3. Validation scores (comprehension depth)
  const validationScores = await getRecentValidationScores(userId, 7);
  const avgValidation = mean(validationScores);
  const comprehensionLoad = 100 - avgValidation;

  // 4. Stress indicators
  const abandonmentRate = await getAbandonmentRate(userId, 7);
  const pauseFrequency = await getPauseFrequency(userId, 7);
  const stressLoad = (abandonmentRate * 50) + (pauseFrequency * 50);

  // 5. Weighted cognitive load score
  const cognitiveLoad = (
    volumeLoad * 0.3 +
    performanceLoad * 0.3 +
    comprehensionLoad * 0.2 +
    stressLoad * 0.2
  );

  return Math.round(cognitiveLoad);
}
```

### Integration Points

**With Story 5.1 (Learning Pattern Analysis):**
- Uses `UserLearningProfile` for optimal study times, session durations, learning styles
- Leverages attention cycle patterns for break timing
- Integrates content preferences for sequence optimization

**With Story 5.2 (Struggle Prediction):**
- Uses predicted struggle areas to modulate session intensity
- Adjusts content difficulty based on struggle likelihood
- Sequences content to avoid compounding predicted difficulties

**With Story 2.4 (Mission Generation):**
- `MissionGenerator` consumes orchestration recommendations
- Sets `Mission.recommendedStartTime`, `recommendedDuration`, `contentSequence`
- Mission briefing displays orchestration details

**With Story 2.5 (Study Session Management):**
- Session execution follows `SessionOrchestrationPlan`
- Real-time monitoring adapts sequence and break timing
- Session performance feeds back into orchestration effectiveness

**With Story 1.6 (Basic Study Sessions):**
- Extends session tracking with orchestration metrics
- Records adherence to recommendations
- Compares orchestrated vs. non-orchestrated outcomes

### Technical Constraints

1. **Calendar API Rate Limits:** Google Calendar API: 1,000,000 queries/day (sufficient). Implement caching and sync throttling.
2. **Real-Time Performance:** In-session monitoring <1s latency for break prompts and content switches.
3. **Recommendation Freshness:** Regenerate recommendations daily or when significant schedule changes detected.
4. **Privacy:** Calendar tokens encrypted at rest (AES-256). User can revoke access anytime.
5. **Offline Fallback:** Orchestration works without calendar integration, using behavioral patterns only.
6. **Session Adaptation:** Real-time adjustments must maintain mission objective coverage (don't skip critical content).

### Testing Strategy

**Manual Testing (MVP Approach):**
1. **Optimal Time Recommendations:**
   - User with morning preference (7-9 AM historical peak) → Verify 7-9 AM recommended
   - User with calendar conflict at optimal time → Verify alternative recommended
   - User with no preference data → Graceful degradation, default recommendations

2. **Session Duration:**
   - Mission complexity easy/medium/hard → Verify duration adjusts (30/45/60 min)
   - Peak vs. off-peak time → Verify duration modulation (extend/reduce)
   - High cognitive load → Verify shorter session recommended

3. **Break Timing:**
   - 45-min session → Verify break at ~25 min mark
   - User with 20-min attention span (from Story 5.1) → Verify break at 20 min
   - Performance drop during session → Verify break prompt triggered

4. **Content Sequencing:**
   - Kinesthetic learner → Verify clinical scenarios prioritized
   - Verify warm-up → peak → wind-down flow
   - Verify content type variety (no 5 flashcards in a row)

5. **Calendar Integration:**
   - Connect Google Calendar → Verify OAuth flow completes
   - Sync events → Verify conflicts detected and avoided
   - Disconnect calendar → Verify tokens revoked

6. **Adaptive Orchestration:**
   - Introduce exam date change → Verify recommendations update
   - High cognitive load for 5 days → Verify burnout protection triggers
   - User ignores recommendations → Verify system continues learning

**Edge Cases:**
- User with no calendar integration: Orchestration works using behavioral data only
- User with chaotic schedule: Recommendations adapt, lower confidence scores
- User always studies at suboptimal times: System learns new "optimal" based on actual performance
- Calendar API down: Graceful fallback, notify user sync failed

### UI/UX Considerations

**Design System Compliance:**
- Glassmorphism for all cards and panels (bg-white/80 backdrop-blur-md)
- OKLCH colors for confidence indicators, cognitive load gauge
- Timeline visualization: Linear gradient-free, solid color phases
- Responsive: Desktop (full orchestration details), mobile (simplified timeline)

**Accessibility:**
- Screen reader announcements for break prompts: "Break recommended in 5 minutes"
- Keyboard shortcuts: Space to start session, B to take break, Esc to pause
- High contrast mode for cognitive load gauge
- Focus indicators on all interactive elements

**User Flow:**
1. User opens Dashboard → Sees "Optimal study time: 7:00 AM (85% confidence)"
2. User clicks "View Schedule" → Navigates to `/study/orchestration`
3. Reviews 3 recommended time slots, selects 7:00 AM
4. Reviews session plan: 45 min, 2 breaks, content sequence preview
5. Clicks "Start Session" → Session begins with orchestration
6. At 25 min: Break prompt appears → User takes 5-min break
7. Session continues, performance monitored in real-time
8. At 45 min: Session completes → Effectiveness tracked
9. Weekly: User reviews effectiveness analytics → Sees 20% improvement with orchestration

### Performance Optimizations

1. **Recommendation Caching:** Cache daily recommendations for 24 hours, invalidate on schedule changes
2. **Calendar Sync Throttling:** Sync max once per hour, or on-demand via manual trigger
3. **In-Session Monitoring:** Aggregate performance metrics every 5 minutes (not per-action)
4. **Background Jobs:** Generate recommendations daily at 2 AM (off-peak)
5. **Lazy Loading:** Load session plan details only when user expands preview

### References

- **Source:** Epic 5, Story 5.3 (epics-Americano-2025-10-14.md:742-763)
- **Source:** Solution Architecture, Subsystem 2 + 5 (solution-architecture.md:524-548, 604-648)
- **Source:** PRD FR9, UX2 (PRD-Americano-2025-10-14.md:122-128, 348-349)
- **Source:** Google Calendar API Documentation (external: developers.google.com/calendar)
- **Source:** Pomodoro Technique (external: Francesco Cirillo, 1980s)
- **Source:** Cognitive Load Theory (external: Sweller, 1988)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
