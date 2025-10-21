# Story 5.4: Cognitive Load Monitoring - Integration Guide

**Phase 2 Complete** | **Date:** 2025-10-16 | **Status:** Ready for Phase 3

---

## Quick Start

### API Endpoints (7 Routes)

```typescript
// 1. Calculate cognitive load for session
POST /api/analytics/cognitive-load/calculate
{
  "userId": "user_123",
  "sessionId": "session_456",
  "behavioralData": {
    "responseLatencies": [2500, 3200, 2800], // milliseconds
    "errorRate": 0.25, // 0.0-1.0
    "engagementMetrics": {
      "pauseCount": 3,
      "pauseDurationMs": 45000,
      "cardInteractions": 20
    },
    "performanceScores": [0.7, 0.65, 0.6], // 0.0-1.0
    "sessionDuration": 45, // minutes
    "baselineData": {
      "avgResponseLatency": 2000,
      "baselinePerformance": 0.75
    }
  }
}
// Response: { loadScore: 72, loadLevel: "HIGH", stressIndicators: [...], recommendations: [...] }

// 2. Get current cognitive load
GET /api/analytics/cognitive-load/current?userId=user_123
// Response: { loadScore: 65, loadLevel: "HIGH", trend: "up", sessionActive: true }

// 3. Get load history
GET /api/analytics/cognitive-load/history?userId=user_123&startDate=2025-10-09&endDate=2025-10-16
// Response: { dataPoints: [...], summary: { avgLoad: 58, maxLoad: 85 } }

// 4. Get burnout risk
GET /api/analytics/burnout-risk?userId=user_123
// Response: { riskScore: 45, riskLevel: "MEDIUM", contributingFactors: [...], interventionPlan: {...} }

// 5. Get stress patterns
GET /api/analytics/stress-patterns?userId=user_123&minConfidence=0.6
// Response: { patterns: [...], summary: { totalPatterns: 3, avgConfidence: 0.75 } }

// 6. Get stress profile
GET /api/analytics/stress-profile?userId=user_123
// Response: { primaryStressors: [...], loadTolerance: 65, copingStrategies: [...] }

// 7. Apply intervention
POST /api/analytics/interventions/apply
{
  "userId": "user_123",
  "interventionType": "WORKLOAD_REDUCTION",
  "accepted": true,
  "sessionId": "session_456",
  "metadata": { "currentLoad": 75 }
}
// Response: { applied: true, updatedMission: {...}, recoveryPlan: {...} }
```

---

## Subsystem Usage

### CognitiveLoadMonitor

```typescript
import { cognitiveLoadMonitor } from '@/subsystems/behavioral-analytics/cognitive-load-monitor';

// Calculate cognitive load
const result = await cognitiveLoadMonitor.calculateCurrentLoad(
  userId,
  sessionId,
  {
    responseLatencies: [2500, 3200],
    errorRate: 0.30,
    sessionDuration: 45,
    performanceScores: [0.7, 0.65],
    // ...
  }
);

// result.loadScore: 0-100
// result.loadLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
// result.stressIndicators: [...] (type, severity, contribution)
// result.recommendations: [...] (actionable suggestions)
// result.overloadDetected: boolean
```

### BurnoutPreventionEngine

```typescript
import { burnoutPreventionEngine } from '@/subsystems/behavioral-analytics/burnout-prevention-engine';

// Assess burnout risk (14-day analysis)
const assessment = await burnoutPreventionEngine.assessBurnoutRisk(userId);

// assessment.riskScore: 0-100
// assessment.riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
// assessment.contributingFactors: 6 factors with scores/percentages
// assessment.warningSignals: 5 warning signal types
// assessment.recommendations: [...] (actionable interventions)

// Generate intervention plan
const intervention = burnoutPreventionEngine.recommendIntervention(assessment);

// intervention.interventionType: 'MANDATORY_REST' | 'WORKLOAD_REDUCTION' | 'SCHEDULE_ADJUSTMENT' | 'CONTENT_SIMPLIFICATION'
// intervention.recommendedActions: [...] (specific steps)
// intervention.estimatedRecoveryDays: number

// Track recovery progress
const recovery = await burnoutPreventionEngine.trackRecoveryProgress(userId, interventionId);

// recovery.recoveryProgress: 0.0-1.0
// recovery.isRecovered: boolean
// recovery.riskScoreChange: negative = improvement
```

### DifficultyAdapter

```typescript
import { difficultyAdapter } from '@/subsystems/behavioral-analytics/difficulty-adapter';

// Adjust difficulty based on load
const adjustment = await difficultyAdapter.adjustDifficulty(userId, currentLoad);

// adjustment.action: 'INCREASE' | 'MAINTAIN' | 'REDUCE' | 'EMERGENCY'
// adjustment.difficultyChange: -2 to +1 levels
// adjustment.reviewRatio: 0.0-1.0 (1.0 = 100% review)
// adjustment.sessionModifications: [...] (content, validation, breaks, scaffolding)

// Get content recommendations
const contentRec = await difficultyAdapter.recommendContentModification(sessionContext);

// contentRec.preferredContentTypes: ['review', 'familiar'] | ['new', 'challenging']
// contentRec.maxComplexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
// contentRec.scaffoldingLevel: 'NONE' | 'MINIMAL' | 'MODERATE' | 'EXTENSIVE'
// contentRec.validationPromptComplexity: 0.0-1.0 multiplier

// Calculate optimal challenge
const challenge = difficultyAdapter.calculateOptimalChallenge(userProfile, loadState);

// challenge.difficulty: 'EASY' | 'MODERATE' | 'CHALLENGING' | 'ADVANCED'
// challenge.newContentRatio: 0.0-1.0
// challenge.sessionDurationMinutes: 15-60
// challenge.breakFrequencyMinutes: 0-30
```

---

## Story 5.2 Integration (Struggle Prediction)

### COGNITIVE_OVERLOAD Indicator Creation

When cognitive load exceeds threshold, automatically create struggle indicators:

```typescript
// In cognitive-load-monitor.ts (lines 285-301)
if (loadData.loadScore > 80) {
  await prisma.behavioralEvent.create({
    data: {
      userId,
      eventType: 'SESSION_ENDED',
      cognitiveLoadScore: loadData.loadScore,
      stressIndicators: loadData.stressIndicators,
      overloadDetected: true, // Triggers Story 5.2 detection
      timestamp: new Date(),
    },
  });
}

// Story 5.2 StruggleDetectionEngine will:
// 1. Detect overloadDetected = true in BehavioralEvent
// 2. Create StruggleIndicator with indicatorType = 'COGNITIVE_OVERLOAD'
// 3. Create StrugglePrediction with high probability
// 4. Trigger InterventionRecommendation with type = 'COGNITIVE_LOAD_REDUCE'
```

### InterventionType.COGNITIVE_LOAD_REDUCE

Apply cognitive load interventions through Story 5.2 framework:

```typescript
// From /api/analytics/interventions/apply
const interventionRec = await prisma.interventionRecommendation.create({
  data: {
    predictionId: strugglePrediction.id,
    userId,
    interventionType: 'COGNITIVE_LOAD_REDUCE',
    description: 'Reduce cognitive load through difficulty adjustment',
    reasoning: 'High load detected (75/100) - reducing difficulty',
    priority: 8,
    status: 'APPLIED',
    appliedAt: new Date(),
  },
});

// Track effectiveness
await prisma.interventionRecommendation.update({
  where: { id: interventionRec.id },
  data: {
    effectiveness: 0.85, // Measured post-intervention
  },
});
```

---

## Story 5.3 Integration (Orchestration)

### Mission Generation Integration

Cognitive load informs mission generation and content selection:

```typescript
// In apps/web/src/lib/mission-generator.ts

// 1. Query recent cognitive load before generating mission
const recentLoad = await fetch(`/api/analytics/cognitive-load/current?userId=${userId}`);
const { loadScore, loadLevel } = await recentLoad.json();

// 2. Check burnout risk
const burnoutRisk = await fetch(`/api/analytics/burnout-risk?userId=${userId}`);
const { riskLevel } = await burnoutRisk.json();

// 3. Adjust mission based on load and risk
if (riskLevel === 'CRITICAL') {
  // Skip mission generation - mandatory rest
  return null;
}

if (loadScore > 70 || riskLevel === 'HIGH') {
  // Generate recovery mission (review-only, familiar topics)
  return generateRecoveryMission(userId);
}

if (loadScore > 50 || riskLevel === 'MEDIUM') {
  // Reduce mission complexity by 20%, 80% review ratio
  return generateLightMission(userId);
}

// Normal mission generation
return generateStandardMission(userId);
```

### Session Intensity Modulation

Cognitive load drives real-time session intensity adjustments:

```typescript
// In study session controller

// Every 5 minutes during session
const loadResult = await cognitiveLoadMonitor.calculateCurrentLoad(userId, sessionId, sessionData);

if (loadResult.overloadDetected) {
  // Apply emergency difficulty reduction
  const adjustment = await difficultyAdapter.adjustDifficulty(userId, loadResult.loadScore);
  await difficultyAdapter.applyAdaptation(sessionId, adjustment);

  // Suggest immediate break
  showBreakSuggestion({
    duration: 10,
    message: 'High cognitive load detected - take a 10-minute break',
    urgency: 'CRITICAL',
  });
}
```

---

## Database Schema Reference

### CognitiveLoadMetric

```prisma
model CognitiveLoadMetric {
  id               String   @id @default(cuid())
  userId           String
  sessionId        String?
  timestamp        DateTime @default(now())
  loadScore        Float    // 0-100 scale
  stressIndicators Json     // StressIndicator[]
  confidenceLevel  Float    // 0.0-1.0

  session          StudySession? @relation(fields: [sessionId], references: [id])

  @@index([userId])
  @@index([sessionId])
  @@index([timestamp])
  @@index([loadScore])
}
```

### BurnoutRiskAssessment

```prisma
model BurnoutRiskAssessment {
  id                  String   @id @default(cuid())
  userId              String
  assessmentDate      DateTime @default(now())
  riskScore           Float    // 0-100
  riskLevel           BurnoutRiskLevel // LOW, MEDIUM, HIGH, CRITICAL
  contributingFactors Json     // ContributingFactor[]
  recommendations     Json     // string[]

  @@index([userId])
  @@index([assessmentDate])
}

enum BurnoutRiskLevel {
  LOW       // <25
  MEDIUM    // 25-50
  HIGH      // 50-75
  CRITICAL  // >75
}
```

### StressResponsePattern

```prisma
model StressResponsePattern {
  id                String   @id @default(cuid())
  userId            String
  patternType       StressPatternType
  triggerConditions Json     // { topic?, time?, difficulty? }
  responseProfile   Json     // { recoveryTime, impactSeverity }
  detectedAt        DateTime @default(now())
  lastOccurrence    DateTime @default(now())
  frequency         Int      @default(1)
  confidence        Float    @default(0.5) // 0.0-1.0

  @@index([userId])
  @@index([patternType])
}

enum StressPatternType {
  DIFFICULTY_INDUCED
  TIME_PRESSURE
  FATIGUE_BASED
  EXAM_PROXIMITY
  TOPIC_SPECIFIC
}
```

### BehavioralEvent (Extended)

```prisma
model BehavioralEvent {
  // ... existing fields ...

  // Story 5.4: Cognitive load markers
  cognitiveLoadScore  Float?   // 0-100 scale
  stressIndicators    Json?    // StressIndicator[]
  overloadDetected    Boolean? @default(false)

  @@index([cognitiveLoadScore])
}
```

### UserLearningProfile (Extended)

```prisma
model UserLearningProfile {
  // ... existing fields ...

  // Story 5.4: Cognitive load profile
  loadTolerance             Float?   // 0-100, personalized threshold
  avgCognitiveLoad          Float?   // 7-day rolling average
  stressProfile             Json?    // { primaryStressors[], avgRecoveryTime, copingStrategies[] }
}
```

---

## Algorithm Reference

### Cognitive Load Calculation (5 Factors)

```typescript
loadScore = (responseLatency * 0.30) +
            (errorRate * 0.25) +
            (engagementDrop * 0.20) +
            (performanceDecline * 0.15) +
            (durationStress * 0.10)

// Component Calculations:
// 1. Response Latency (30%): avg vs baseline, >50% increase = 100
// 2. Error Rate (25%): (errors / total) * 100
// 3. Engagement Drop (20%): pause ratio + disengagement events
// 4. Performance Decline (15%): current vs baseline, >20% drop flagged
// 5. Duration Stress (10%): >60 min = +10, >90 min = +25
```

### Burnout Risk Assessment (6 Factors)

```typescript
riskScore = (intensity * 0.20) +
            (performanceDecline * 0.25) +
            (chronicLoad * 0.25) +
            (irregularity * 0.15) +
            (engagementDecay * 0.10) +
            (recoveryDeficit * 0.05)

// Factor Definitions:
// 1. Intensity (20%): Study hours/week, >40 hrs = 100%
// 2. Performance Decline (25%): 2-week comparison, >20% drop
// 3. Chronic Load (25%): Days with avgLoad >60, >7 days = high
// 4. Irregularity (15%): Missed sessions, >3 = risk
// 5. Engagement Decay (10%): Skipped missions, low ratings
// 6. Recovery Deficit (5%): Days since last low-load day (<40)
```

### Difficulty Adjustment Logic

```typescript
// Critical (>80): EMERGENCY
//   - Difficulty: -2 levels
//   - Review Ratio: 100% (pure review)
//   - Urgency: CRITICAL
//   - Actions: Switch to easiest content, immediate break

// High (60-80): REDUCE
//   - Difficulty: -1 level
//   - Review Ratio: 80%
//   - Urgency: HIGH
//   - Actions: Reduce difficulty, simplify validation, breaks every 20 min

// Moderate (40-60): MAINTAIN
//   - Difficulty: 0 (maintain)
//   - Review Ratio: 60%
//   - Urgency: MEDIUM
//   - Actions: Add minor scaffolding, breaks every 30 min

// Low (<40): INCREASE
//   - Difficulty: +1 level (if <30)
//   - Review Ratio: 50%
//   - Urgency: LOW
//   - Actions: Increase challenge, enable full validation
```

---

## Performance Guidelines

### <100ms Requirement (Cognitive Load Calculation)

```typescript
// In cognitive-load-monitor.ts
const startTime = performance.now();
// ... calculation ...
const endTime = performance.now();

if (endTime - startTime > 100) {
  console.warn(`Exceeded 100ms: ${(endTime - startTime).toFixed(2)}ms`);
}

// Optimizations Applied:
// 1. Parallel factor computation
// 2. Incremental updates (not full recalculation)
// 3. Asynchronous database writes
// 4. Indexed database queries
```

### Caching Strategy

```typescript
// Burnout Risk Assessment: 24-hour cache
const recentAssessment = await prisma.burnoutRiskAssessment.findFirst({
  where: {
    userId,
    assessmentDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  },
});

if (recentAssessment) {
  return recentAssessment; // Return cached
}

// Perform new assessment
const assessment = await burnoutPreventionEngine.assessBurnoutRisk(userId);
```

### Database Query Optimization

```typescript
// Use indexes for time-series queries
const metrics = await prisma.cognitiveLoadMetric.findMany({
  where: {
    userId, // Indexed
    timestamp: { gte: startDate, lte: endDate }, // Indexed
  },
  orderBy: { timestamp: 'asc' },
});

// Batch queries for efficiency
const [sessions, loadMetrics, missions] = await Promise.all([
  prisma.studySession.findMany({ where: { userId } }),
  prisma.cognitiveLoadMetric.findMany({ where: { userId } }),
  prisma.mission.findMany({ where: { userId } }),
]);
```

---

## Testing Guide

### Manual Test Scenarios

```bash
# 1. Test Cognitive Load Calculation
curl -X POST http://localhost:3000/api/analytics/cognitive-load/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "sessionId": "test_session",
    "behavioralData": {
      "responseLatencies": [3000, 3500, 4000],
      "errorRate": 0.35,
      "sessionDuration": 60,
      "performanceScores": [0.5, 0.45, 0.4]
    }
  }'

# Expected: loadScore > 70, loadLevel = "HIGH", overloadDetected = true

# 2. Test Current Load Retrieval
curl http://localhost:3000/api/analytics/cognitive-load/current?userId=test_user

# Expected: { loadScore, loadLevel, trend, sessionActive }

# 3. Test Burnout Risk Assessment
curl http://localhost:3000/api/analytics/burnout-risk?userId=test_user

# Expected: { riskScore, riskLevel, contributingFactors, interventionPlan }

# 4. Test Intervention Application
curl -X POST http://localhost:3000/api/analytics/interventions/apply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "interventionType": "WORKLOAD_REDUCTION",
    "accepted": true,
    "metadata": { "currentLoad": 75 }
  }'

# Expected: { applied: true, updatedMission, recoveryPlan }
```

### Integration Test Checklist

- [ ] Cognitive load calculation completes in <100ms
- [ ] COGNITIVE_OVERLOAD BehavioralEvent created when load > 80
- [ ] Story 5.2 StruggleIndicator created from overload event
- [ ] Burnout risk assessment caches for 24 hours
- [ ] Difficulty adjustment applies to active session
- [ ] Mission generation respects high load override
- [ ] API routes validate request data with Zod
- [ ] Error handling returns proper status codes

---

## Next Steps

### Phase 3: UI + Dashboard (Tasks 7-11)

1. **UI Components** (Task 7):
   - CognitiveLoadMeter (circular gauge)
   - StressPatternsTimeline (line chart)
   - BurnoutRiskPanel (risk indicator)
   - StressProfileCard (radar chart)
   - InterventionRecommendations (card layout)

2. **Dashboard Page** (Task 8):
   - `/analytics/cognitive-health`
   - Real-time load updates (every 5 minutes)
   - Responsive design with glassmorphism

3. **Session Integration** (Task 9):
   - Hook into StudySession lifecycle
   - 5-minute load monitoring
   - Adaptive break suggestions

4. **Performance Analysis** (Task 10):
   - CognitivePerformanceAnalyzer subsystem
   - Load-performance correlation
   - Optimal zone calculation

5. **Privacy Controls** (Task 11):
   - Opt-out functionality
   - Data deletion (cascade)
   - Data export (JSON)

### Performance Validation

Delegate to **performance-engineer** for:
- [ ] <100ms cognitive load calculation verification
- [ ] Burnout assessment performance benchmark
- [ ] API endpoint load testing
- [ ] Database query optimization review

---

## Support & Documentation

- **Story Context**: `/docs/stories/story-context-5.4.xml`
- **Phase 1 Progress**: `/STORY-5.4-PHASE1-PROGRESS.md`
- **Phase 2 Complete**: `/STORY-5.4-PHASE2-COMPLETE.md`
- **This Guide**: `/STORY-5.4-INTEGRATION-GUIDE.md`

For questions or issues, refer to Story 5.4 specification (lines 1-710).
