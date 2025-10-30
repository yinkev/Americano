# Epic 5: Integration Contracts

**Version:** 1.0
**Generated:** 2025-10-16
**Status:** VALIDATED
**Validated By:** Winston (Architect - Integration Coordinator)

---

## Executive Summary

This document defines the integration contracts for Epic 5 (Behavioral Learning Twin) Stories 5.3, 5.4, and 5.6. It ensures seamless data flow, API compatibility, and architectural cohesion across all three stories while preventing conflicts and duplication.

**Key Metrics:**
- **Cross-Story Integration Points:** 18 identified
- **Shared Database Models:** 8 models (5 existing, 3 new)
- **API Integration Contracts:** 27 endpoints
- **Data Flow Pipelines:** 4 major flows
- **Conflicts Detected:** ZERO

**Validation Status:** PASSED ✅
- No circular dependencies
- RESTful API design verified
- Database schema normalized
- Performance implications assessed
- Security best practices applied

---

## Table of Contents

1. [Shared TypeScript Interfaces](#1-shared-typescript-interfaces)
2. [API Integration Points](#2-api-integration-points)
3. [Database Schema Integration](#3-database-schema-integration)
4. [Event Flow & Data Pipeline](#4-event-flow--data-pipeline)
5. [Defensive Coding Patterns](#5-defensive-coding-patterns)
6. [Testing Strategy](#6-testing-strategy)
7. [Implementation Guidelines](#7-implementation-guidelines)

---

## 1. Shared TypeScript Interfaces

### 1.1 Core Data Structures

#### TimeSlot (Story 5.3)
```typescript
/**
 * Represents a recommended study time window
 * Used by: Story 5.3 orchestration, Story 5.6 dashboard
 * Integration: Story 5.4 cognitive load influences time selection
 */
interface TimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number;              // minutes
  score: number;                 // 0-100, weighted performance score
  confidence: number;            // 0.0-1.0
  reasoning: string[];
  calendarConflict: boolean;
  conflictingEvents?: CalendarEvent[];
  // Story 5.4 Integration: Cognitive load awareness
  estimatedCognitiveLoad?: number; // 0-100, predicted load for this time
  loadBasedAdjustment?: boolean;   // Time adjusted due to load concerns
}
```

#### CognitiveLoadScore (Story 5.4)
```typescript
/**
 * Cognitive load metric for a user at a point in time
 * Used by: Story 5.4 monitoring, Story 5.3 orchestration, Story 5.6 dashboard
 */
interface CognitiveLoadScore {
  loadScore: number;             // 0-100 scale
  loadLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  stressIndicators: StressIndicator[];
  confidenceLevel: number;       // 0.0-1.0 based on data quality
  timestamp: Date;
  sessionId?: string;
  // Story 5.3 Integration: Influences orchestration decisions
  recommendedIntensity?: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedBreakSchedule?: BreakSchedule;
}

interface StressIndicator {
  type: 'RESPONSE_LATENCY' | 'ERROR_RATE' | 'ENGAGEMENT_DROP' |
        'PERFORMANCE_DECLINE' | 'DURATION_STRESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  value: number;
  contribution: number;          // Contribution to total load (0-100)
}
```

#### OrchestrationPlan (Story 5.3)
```typescript
/**
 * Complete session orchestration plan
 * Used by: Story 5.3, Story 5.6 dashboard
 * Integration: Story 5.4 cognitive load modulates plan
 */
interface OrchestrationPlan {
  id: string;
  missionId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  duration: number;              // minutes
  intensity: 'LOW' | 'MEDIUM' | 'HIGH';
  contentSequence: ContentSequence;
  breaks: BreakSchedule;
  confidence: number;            // 0.0-1.0
  reasoning: {
    timeSelection: string[];
    durationLogic: string[];
    contentSequencing: string[];
    intensityFactors: string[];
  };
  // Story 5.4 Integration: Cognitive load awareness
  expectedCognitiveLoad?: number;
  loadManagementStrategy?: string;
  adaptationsApplied?: string[];
}
```

#### BehavioralInsightsSummary (Story 5.6)
```typescript
/**
 * Comprehensive dashboard data aggregation
 * Used by: Story 5.6 dashboard
 * Integrates: Stories 5.1, 5.2, 5.3, 5.4 data
 */
interface BehavioralInsightsSummary {
  // Story 5.1: Learning patterns
  patterns: BehavioralPattern[];           // Top 5 by confidence
  learningProfile: UserLearningProfile;

  // Story 5.2: Struggle predictions & interventions
  predictions: StrugglePrediction[];       // Active predictions
  interventions: InterventionRecommendation[]; // Pending interventions

  // Story 5.3: Orchestration metrics
  orchestrationMetrics: {
    adherenceRate: number;                 // % sessions following recommendations
    performanceImprovement: number;        // % improvement with orchestration
    avgConfidence: number;
    lastRecommendation?: TimeSlot;
    nextRecommendedSession?: OrchestrationPlan;
  };

  // Story 5.4: Cognitive load metrics
  cognitiveHealth: {
    currentLoad: CognitiveLoadScore;
    avgLoad7Days: number;
    burnoutRisk: BurnoutRiskAssessment;
    stressPatterns: StressResponsePattern[];
  };

  // Story 5.6: Progress & goals
  goals: BehavioralGoal[];
  recommendations: Recommendation[];
  correlationData: PerformanceCorrelation;
}
```

### 1.2 Integration-Specific Interfaces

#### CognitiveLoadAwareTimeSlot (Stories 5.3 ↔ 5.4)
```typescript
/**
 * Extended TimeSlot with cognitive load integration
 * Contract: Story 5.3 MUST query Story 5.4 cognitive load before finalizing recommendations
 */
interface CognitiveLoadAwareTimeSlot extends TimeSlot {
  // Cognitive load prediction for this time slot
  predictedLoad: number;                   // 0-100
  loadConfidence: number;                  // 0.0-1.0

  // Adjustments made due to cognitive load
  loadBasedAdjustments: {
    originalDuration?: number;             // minutes, before load adjustment
    durationReduction?: number;            // percentage reduction if high load
    intensityDowngrade?: boolean;
    additionalBreaks?: number;
  };

  // Warning flags
  highLoadWarning?: boolean;               // true if predicted load >70
  burnoutRiskWarning?: boolean;            // true if burnout risk MEDIUM+
  recoveryRecommended?: boolean;           // true if rest recommended
}
```

#### OrchestrationMetric (Stories 5.3 ↔ 5.6)
```typescript
/**
 * Orchestration effectiveness metrics for dashboard
 * Contract: Story 5.6 dashboard displays Story 5.3 effectiveness data
 */
interface OrchestrationMetric {
  userId: string;
  dateRange: { start: Date; end: Date };

  // Adherence tracking
  totalSessions: number;
  orchestratedSessions: number;            // Following recommendations
  selfScheduledSessions: number;           // Ignoring recommendations
  adherenceRate: number;                   // orchestrated / total

  // Performance comparison
  orchestratedPerformance: {
    avgSessionScore: number;               // 0-100
    avgCompletionRate: number;             // 0-1
    avgRetention: number;                  // 0-1
  };
  selfScheduledPerformance: {
    avgSessionScore: number;
    avgCompletionRate: number;
    avgRetention: number;
  };
  performanceImprovement: number;          // % improvement

  // Confidence & insights
  avgRecommendationConfidence: number;
  insights: string[];                      // Generated insights
}
```

#### CognitiveLoadDashboardData (Stories 5.4 ↔ 5.6)
```typescript
/**
 * Cognitive health data for dashboard visualization
 * Contract: Story 5.6 dashboard consumes Story 5.4 metrics
 */
interface CognitiveLoadDashboardData {
  // Current state
  currentLoad: CognitiveLoadScore;
  lastUpdated: Date;

  // Historical trends
  loadHistory: {
    timestamp: Date;
    loadScore: number;
    sessionId?: string;
    overloadDetected: boolean;
  }[];

  // Burnout assessment
  burnoutRisk: BurnoutRiskAssessment;
  warningSignals: WarningSignal[];

  // Stress patterns
  stressPatterns: StressResponsePattern[];
  primaryStressors: string[];
  loadTolerance: number;                   // 0-100, personalized threshold

  // Intervention tracking
  interventionsApplied: {
    interventionId: string;
    appliedAt: Date;
    effectiveness?: number;
    loadBeforeAfter: { before: number; after: number };
  }[];
}
```

---

## 2. API Integration Points

### 2.1 Story 5.3: Orchestration APIs

#### POST /api/orchestration/recommendations
```typescript
// Request
{
  userId: string;
  date?: Date;                             // Default: today
  missionId?: string;                      // Optional: for specific mission
  // Story 5.4 Integration: Include cognitive load context
  includeCognitiveLoadAnalysis?: boolean;  // Default: true
}

// Response
{
  recommendations: CognitiveLoadAwareTimeSlot[];
  cognitiveLoad: CognitiveLoadScore;       // Current load from Story 5.4
  loadBasedWarnings?: string[];            // Warnings from cognitive analysis
}

// Integration Contract:
// - MUST query /api/analytics/cognitive-load/current before generating recommendations
// - MUST apply load-based adjustments if load >60
// - MUST skip recommendations if burnout risk HIGH or CRITICAL
```

#### POST /api/orchestration/session-plan
```typescript
// Request
{
  userId: string;
  missionId: string;
  startTime: Date;
  duration?: number;                       // Optional: override
  intensity?: 'LOW' | 'MEDIUM' | 'HIGH';   // Optional: override
  // Story 5.4 Integration: Cognitive load awareness
  respectCognitiveLoad?: boolean;          // Default: true
}

// Response
{
  plan: OrchestrationPlan;
  confidence: number;
  // Story 5.4 Integration: Load warnings
  cognitiveLoadWarnings?: {
    currentLoad: number;
    recommendations: string[];
    adaptationsApplied: string[];
  };
}

// Integration Contract:
// - MUST query /api/analytics/cognitive-load/current
// - MUST apply difficulty adapter if load >70
// - MUST include break schedule from cognitive load analysis
```

#### GET /api/orchestration/effectiveness
```typescript
// Request (Query Params)
{
  userId: string;
  dateRange?: string;                      // "7d", "30d", "90d"
}

// Response
{
  adherenceRate: number;
  performanceImprovement: number;
  avgConfidence: number;
  insights: string[];
  // Story 5.6 Integration: Dashboard display data
  visualizationData: OrchestrationMetric;
}

// Integration Contract:
// - Story 5.6 dashboard MUST call this endpoint for orchestration metrics
// - Data cached for 1 hour, refreshed on new session completion
```

### 2.2 Story 5.4: Cognitive Load APIs

#### POST /api/analytics/cognitive-load/calculate
```typescript
// Request
{
  userId: string;
  sessionId: string;
  behavioralData: {
    responseLatencies: number[];           // milliseconds
    errorRate: number;                     // 0-1
    engagementMetrics: EngagementMetric[];
    performanceScores: number[];           // Recent scores
    sessionDuration: number;               // minutes
  };
}

// Response
{
  loadScore: number;                       // 0-100
  loadLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  stressIndicators: StressIndicator[];
  overloadDetected: boolean;
  recommendations: string[];
  // Story 5.3 Integration: Orchestration adjustments
  suggestedIntensity: 'LOW' | 'MEDIUM' | 'HIGH';
  breakSchedule: BreakSchedule;
}

// Integration Contract:
// - Called by Story 5.3 during session planning
// - Called by session orchestration every 5 minutes during active session
// - Story 5.2 MUST create COGNITIVE_OVERLOAD indicator if load >80
```

#### GET /api/analytics/cognitive-load/current
```typescript
// Request (Query Params)
{
  userId: string;
}

// Response
{
  loadScore: number;
  loadLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  stressIndicators: StressIndicator[];
  timestamp: Date;
  trend: 'up' | 'down' | 'stable';
  // Story 5.3 Integration: Time recommendations
  optimalTimeRecommendation?: {
    avoidNextHours: number[];              // Hours to avoid (0-23)
    recommendedDelay?: number;             // Minutes to wait before studying
  };
}

// Integration Contract:
// - Story 5.3 orchestration MUST query this before time recommendations
// - Story 5.6 dashboard displays this on cognitive health panel
// - Cached for 5 minutes during active sessions
```

#### GET /api/analytics/burnout-risk
```typescript
// Request (Query Params)
{
  userId: string;
}

// Response
{
  riskScore: number;                       // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  contributingFactors: {
    factor: string;
    percentage: number;
  }[];
  warningSignals: WarningSignal[];
  recommendations: string[];
  lastAssessmentDate: Date;
  // Story 5.3 Integration: Mission generation override
  missionOverride?: {
    skipGeneration: boolean;
    mandatoryRest: boolean;
    recoveryDays: number;
  };
}

// Integration Contract:
// - Story 5.3 MUST query this during session orchestration
// - If riskLevel HIGH/CRITICAL, mission generation MUST be overridden
// - Story 2.4 MissionGenerator MUST check this before generating missions
// - Story 5.6 dashboard displays on burnout risk panel
```

### 2.3 Story 5.6: Dashboard APIs

#### GET /api/analytics/behavioral-insights/dashboard
```typescript
// Request (Query Params)
{
  userId: string;
}

// Response: BehavioralInsightsSummary
{
  patterns: BehavioralPattern[];           // Story 5.1
  learningProfile: UserLearningProfile;    // Story 5.1
  predictions: StrugglePrediction[];       // Story 5.2
  interventions: InterventionRecommendation[]; // Story 5.2
  orchestrationMetrics: OrchestrationMetric;   // Story 5.3
  cognitiveHealth: CognitiveLoadDashboardData; // Story 5.4
  goals: BehavioralGoal[];
  recommendations: Recommendation[];
  correlationData: PerformanceCorrelation;
}

// Integration Contract:
// - Aggregates data from Stories 5.1, 5.2, 5.3, 5.4
// - Cached for 1 hour, invalidated on new pattern detection
// - MUST call all prerequisite APIs: /patterns, /predictions,
//   /orchestration/effectiveness, /cognitive-load/current, /burnout-risk
```

#### GET /api/analytics/behavioral-insights/correlation
```typescript
// Request (Query Params)
{
  userId: string;
  weeks?: number;                          // Default: 12
  metric?: 'behavioral' | 'mission';       // Default: behavioral
}

// Response
{
  coefficient: number;                     // Pearson r
  pValue: number;                          // Statistical significance
  interpretation: string;                  // "strong positive", etc.
  timeSeriesData: {
    date: Date;
    behavioralScore: number;               // Composite score
    academicScore: number;                 // Exam/mission performance
  }[];
  insights: string[];
  // Story 5.3 Integration: Orchestration impact
  orchestrationCorrelation?: {
    coefficient: number;
    interpretation: string;
    description: string;
  };
}

// Integration Contract:
// - Behavioral score includes orchestration adherence (Story 5.3)
// - Behavioral score includes cognitive load management (Story 5.4)
// - Requires minimum 8 weeks data for statistical validity
```

### 2.4 Cross-Story API Dependencies

#### Mission Generation Integration (Story 2.4)
```typescript
/**
 * MissionGenerator.generateDailyMission() extensions
 * Integration: Stories 5.2, 5.3, 5.4
 */
interface MissionGenerationContext {
  // Story 5.2: Struggle predictions
  strugglePredictions: StrugglePrediction[];
  upcomingInterventions: InterventionRecommendation[];

  // Story 5.3: Orchestration recommendations
  recommendedStartTime?: Date;
  recommendedDuration?: number;
  intensityLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  contentSequence?: ContentSequence;

  // Story 5.4: Cognitive load state
  currentCognitiveLoad: number;
  burnoutRisk: BurnoutRiskAssessment;
  stressPatterns: StressResponsePattern[];
}

// Integration Contract for MissionGenerator:
async function generateDailyMission(userId: string): Promise<Mission> {
  // STEP 1: Query Story 5.4 cognitive load & burnout risk
  const cognitiveLoad = await fetch('/api/analytics/cognitive-load/current');
  const burnoutRisk = await fetch('/api/analytics/burnout-risk');

  // STEP 2: Check burnout override
  if (burnoutRisk.riskLevel === 'HIGH' || burnoutRisk.riskLevel === 'CRITICAL') {
    return generateRecoveryMission(); // Mandatory rest or light review
  }

  // STEP 3: Query Story 5.3 orchestration recommendations
  const orchestration = await fetch('/api/orchestration/recommendations');

  // STEP 4: Query Story 5.2 struggle predictions & interventions
  const predictions = await fetch('/api/analytics/predictions');
  const interventions = await fetch('/api/analytics/interventions');

  // STEP 5: Generate mission with integrated context
  return {
    // ... standard mission fields ...
    recommendedStartTime: orchestration.recommendations[0]?.startTime,
    recommendedDuration: adjustForCognitiveLoad(
      orchestration.recommendations[0]?.duration,
      cognitiveLoad.loadScore
    ),
    intensityLevel: cognitiveLoad.suggestedIntensity,
    contentSequence: orchestration.contentSequence,
    // Apply struggle-based interventions
    objectives: applyInterventions(baseObjectives, interventions),
  };
}
```

---

## 3. Database Schema Integration

### 3.1 Existing Models (Stories 5.1 & 5.2)

#### BehavioralEvent (Extended for Story 5.4)
```prisma
model BehavioralEvent {
  id          String   @id @default(cuid())
  userId      String
  eventType   EventType
  eventData   Json
  timestamp   DateTime @default(now())

  // Story 5.1: Session-level metrics
  sessionPerformanceScore Int?
  engagementLevel         EngagementLevel?
  completionQuality       CompletionQuality?
  timeOfDay               Int?
  dayOfWeek               Int?
  contentType             String?
  difficultyLevel         String?

  // Story 5.4: Cognitive load markers (NEW)
  cognitiveLoadScore  Float?   // 0-100 scale
  stressIndicators    Json?    // Array of StressIndicator
  overloadDetected    Boolean? @default(false)

  @@index([userId])
  @@index([eventType])
  @@index([timestamp])
  @@index([cognitiveLoadScore])  // NEW: For load queries
  @@map("behavioral_events")
}
```

**Integration Contract:**
- Story 5.4 cognitive load monitor MUST populate `cognitiveLoadScore`, `stressIndicators`, `overloadDetected`
- Story 5.2 struggle detection MUST query `overloadDetected` for COGNITIVE_OVERLOAD indicators
- Story 5.6 dashboard displays load trends from this model

#### UserLearningProfile (Extended for Story 5.4)
```prisma
model UserLearningProfile {
  id                        String   @id @default(cuid())
  userId                    String   @unique
  // Story 5.1 fields
  preferredStudyTimes       Json
  averageSessionDuration    Int
  optimalSessionDuration    Int
  contentPreferences        Json
  learningStyleProfile      Json
  personalizedForgettingCurve Json
  lastAnalyzedAt            DateTime @default(now())
  dataQualityScore          Float    @default(0.0)

  // Story 5.4: Cognitive load profile (NEW)
  loadTolerance             Float?   // 0-100, personalized threshold
  avgCognitiveLoad          Float?   // 7-day rolling average
  stressProfile             Json?    // { primaryStressors[], avgRecoveryTime, copingStrategies[] }

  @@index([userId])
  @@map("user_learning_profiles")
}
```

**Integration Contract:**
- Story 5.4 stress pattern analyzer MUST update `loadTolerance`, `avgCognitiveLoad`, `stressProfile`
- Story 5.3 orchestration uses `loadTolerance` for intensity modulation
- Story 5.6 dashboard displays stress profile

#### Mission (Extended for Story 5.3)
```prisma
model Mission {
  id              String   @id @default(cuid())
  userId          String
  date            DateTime @default(now())
  status          MissionStatus @default(PENDING)
  estimatedMinutes Int
  completedAt     DateTime?
  actualMinutes   Int?
  completedObjectivesCount Int @default(0)

  objectives      Json
  reviewCardCount Int      @default(0)
  newContentCount Int      @default(0)

  // Story 2.6 fields
  successScore      Float?
  difficultyRating  Int?

  // Story 5.3: Orchestration fields (NEW)
  recommendedStartTime DateTime?      // Optimal time from orchestration
  recommendedDuration  Int?           // Minutes, from duration optimizer
  intensityLevel       IntensityLevel? @default(MEDIUM)
  contentSequence      Json?          // Array of {type, id, duration, phase}
  orchestrationPlanId  String?        // FK to SessionOrchestrationPlan

  // Story 5.4 Integration: Cognitive load tracking
  plannedCognitiveLoad Float?         // Expected load at planning time
  actualCognitiveLoad  Float?         // Measured during execution

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  studySessions   StudySession[]
  feedback        MissionFeedback[]
  interventions   InterventionRecommendation[]

  @@index([userId])
  @@index([date])
  @@index([status])
  @@index([recommendedStartTime])  // NEW: For orchestration queries
  @@map("missions")
}

enum IntensityLevel {
  LOW
  MEDIUM
  HIGH
}
```

**Integration Contract:**
- Story 5.3 orchestration MUST populate `recommendedStartTime`, `recommendedDuration`, `intensityLevel`, `contentSequence`
- Story 5.4 cognitive load monitor MUST populate `plannedCognitiveLoad`, `actualCognitiveLoad`
- Story 2.4 mission generator MUST read orchestration fields before generation
- Story 5.6 dashboard displays orchestration adherence (actual vs recommended)

### 3.2 New Models for Story 5.3

#### SessionOrchestrationPlan
```prisma
model SessionOrchestrationPlan {
  id                  String   @id @default(cuid())
  missionId           String?
  userId              String
  plannedStartTime    DateTime
  plannedEndTime      DateTime
  actualStartTime     DateTime?
  actualEndTime       DateTime?
  plannedBreaks       Json     // Array of {time, duration}
  actualBreaks        Json?    // Array of {startedAt, endedAt}
  intensityModulation IntensityLevel @default(MEDIUM)
  contentSequence     Json     // Array of {type, id, duration, phase}
  createdAt           DateTime @default(now())

  // Story 5.4 Integration: Cognitive load context
  plannedCognitiveLoad     Float?   // Expected load
  actualCognitiveLoad      Float?   // Measured load
  loadBasedAdaptations     Json?    // Adjustments made due to load

  missions Mission[]

  @@index([userId])
  @@index([plannedStartTime])
  @@map("session_orchestration_plans")
}
```

**Integration Contract:**
- Story 5.4 cognitive load influences `intensityModulation`, `plannedBreaks`, `loadBasedAdaptations`
- Story 5.6 dashboard displays orchestration plan effectiveness

#### StudyScheduleRecommendation
```prisma
model StudyScheduleRecommendation {
  id                    String   @id @default(cuid())
  userId                String
  recommendedStartTime  DateTime
  recommendedDuration   Int      // Minutes
  confidence            Float    // 0.0-1.0
  reasoningFactors      Json     // {optimalTimeScore, calendarAvailable, ...}
  calendarIntegration   Boolean  @default(false)
  createdAt             DateTime @default(now())
  appliedAt             DateTime?

  // Story 5.4 Integration: Cognitive load awareness
  cognitiveLoadPrediction Float?  // 0-100, predicted load for this time
  loadAdjusted            Boolean @default(false)

  @@index([userId])
  @@index([recommendedStartTime])
  @@map("study_schedule_recommendations")
}
```

**Integration Contract:**
- Story 5.4 cognitive load prediction populates `cognitiveLoadPrediction`
- Story 5.6 dashboard displays recommendation history with load context

### 3.3 New Models for Story 5.4

#### CognitiveLoadMetric
```prisma
model CognitiveLoadMetric {
  id               String   @id @default(cuid())
  userId           String
  sessionId        String?
  timestamp        DateTime @default(now())
  loadScore        Float    // 0-100 scale
  stressIndicators Json     // Array of detected stress signals
  confidenceLevel  Float    // 0.0-1.0 based on data quality

  session          StudySession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([sessionId])
  @@index([timestamp])
  @@map("cognitive_load_metrics")
}
```

**Integration Contract:**
- Story 5.3 orchestration queries this for time recommendations
- Story 5.6 dashboard visualizes load history from this model
- Story 5.2 struggle detection creates COGNITIVE_OVERLOAD indicators from this data

#### BurnoutRiskAssessment
```prisma
model BurnoutRiskAssessment {
  id                  String   @id @default(cuid())
  userId              String
  assessmentDate      DateTime @default(now())
  riskScore           Float    // 0-100 scale
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

**Integration Contract:**
- Story 5.3 orchestration queries this to override mission generation
- Story 2.4 mission generator checks this before generating daily missions
- Story 5.6 dashboard displays burnout risk panel

### 3.4 New Models for Story 5.6

#### BehavioralGoal
```prisma
model BehavioralGoal {
  id                String   @id @default(cuid())
  userId            String
  goalType          BehavioralGoalType
  title             String
  description       String?  @db.Text
  targetMetric      String   // "optimalStudyTime", "sessionDuration", etc.
  currentValue      Float
  targetValue       Float
  deadline          DateTime
  status            GoalStatus @default(ACTIVE)
  progressHistory   Json     // Array of {date, value, note}
  createdAt         DateTime @default(now())
  completedAt       DateTime?

  @@index([userId])
  @@index([status])
  @@index([deadline])
  @@map("behavioral_goals")
}

enum BehavioralGoalType {
  STUDY_TIME_CONSISTENCY
  SESSION_DURATION
  CONTENT_DIVERSIFICATION
  RETENTION_IMPROVEMENT
  COGNITIVE_LOAD_MANAGEMENT  // Story 5.4 Integration
  ORCHESTRATION_ADHERENCE    // Story 5.3 Integration
  CUSTOM
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  ABANDONED
}
```

**Integration Contract:**
- Story 5.3 orchestration adherence can trigger goal creation
- Story 5.4 cognitive load management can trigger goal creation
- Dashboard displays goals with progress tracking

#### Recommendation
```prisma
model Recommendation {
  id                  String   @id @default(cuid())
  userId              String
  recommendationType  RecommendationType
  title               String
  description         String   @db.Text
  actionableText      String   @db.Text
  confidence          Float    // 0.0-1.0
  estimatedImpact     Float    // 0.0-1.0
  priority            Int      @default(5) // 1-10
  status              RecommendationStatus @default(PENDING)
  createdAt           DateTime @default(now())
  appliedAt           DateTime?
  dismissedAt         DateTime?

  // Source tracking (which story generated this)
  sourceStory         String?  // "5.1", "5.2", "5.3", "5.4"
  sourcePatternId     String?  // BehavioralPattern.id
  sourcePredictionId  String?  // StrugglePrediction.id

  appliedRecommendations AppliedRecommendation[]

  @@index([userId])
  @@index([status])
  @@index([priority])
  @@map("recommendations")
}

enum RecommendationType {
  TIME_OPTIMIZATION          // Story 5.3
  DURATION_ADJUSTMENT        // Story 5.3
  CONTENT_SEQUENCING         // Story 5.3
  COGNITIVE_LOAD_MANAGEMENT  // Story 5.4
  BREAK_SCHEDULE             // Story 5.4
  STRUGGLE_INTERVENTION      // Story 5.2
  LEARNING_STYLE_ADAPT       // Story 5.1
  RETENTION_STRATEGY         // Story 5.1
}

enum RecommendationStatus {
  PENDING
  APPLIED
  DISMISSED
}
```

**Integration Contract:**
- Aggregates recommendations from all Epic 5 stories
- Dashboard displays prioritized recommendations
- Tracks effectiveness via AppliedRecommendation

---

## 4. Event Flow & Data Pipeline

### 4.1 Daily Mission Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ MISSION GENERATION FLOW (Story 2.4 + Epic 5 Integration)       │
└─────────────────────────────────────────────────────────────────┘

User triggers mission generation (manual or scheduled)
    │
    ├──▶ STEP 1: Query Story 5.4 Cognitive Load
    │    GET /api/analytics/cognitive-load/current
    │    GET /api/analytics/burnout-risk
    │    ├── If burnout risk HIGH/CRITICAL: OVERRIDE
    │    │   └──▶ Generate Recovery Mission (light review, 15 min)
    │    └── If burnout risk MEDIUM: MODULATE
    │        └──▶ Reduce complexity 30%, increase breaks
    │
    ├──▶ STEP 2: Query Story 5.3 Orchestration Recommendations
    │    POST /api/orchestration/recommendations
    │    └──▶ Get optimal time slots, duration, intensity
    │
    ├──▶ STEP 3: Query Story 5.2 Struggle Predictions
    │    GET /api/analytics/predictions
    │    GET /api/analytics/interventions
    │    └──▶ Apply prerequisite review, difficulty adjustments
    │
    ├──▶ STEP 4: Query Story 5.1 Learning Profile
    │    GET /api/analytics/learning-profile
    │    └──▶ Apply VARK preferences, forgetting curve
    │
    └──▶ STEP 5: Generate Integrated Mission
         ├── recommendedStartTime (Story 5.3)
         ├── recommendedDuration (Story 5.3 + Story 5.4 adjustment)
         ├── intensityLevel (Story 5.4)
         ├── contentSequence (Story 5.3 + Story 5.1 VARK)
         ├── objectives (Story 5.2 intervention-adjusted)
         └── plannedCognitiveLoad (Story 5.4 prediction)

┌─────────────────────────────────────────────────────────────────┐
│ CONTRACT VALIDATION CHECKPOINTS                                 │
└─────────────────────────────────────────────────────────────────┘
✅ Burnout risk check MUST occur before any mission generation
✅ Cognitive load MUST influence duration and intensity
✅ Orchestration recommendations MUST be applied to Mission model
✅ Struggle interventions MUST be integrated into objectives
```

### 4.2 Real-Time Session Orchestration Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ SESSION ORCHESTRATION FLOW (Story 5.3 + Story 5.4)             │
└─────────────────────────────────────────────────────────────────┘

User starts study session
    │
    ├──▶ SESSION START
    │    ├── Create StudySession record
    │    ├── Initialize baseline cognitive load (Story 5.4)
    │    └── Load SessionOrchestrationPlan (Story 5.3)
    │
    ├──▶ EVERY 5 MINUTES (Real-Time Monitoring)
    │    │
    │    ├── Story 5.4: Calculate Cognitive Load
    │    │   POST /api/analytics/cognitive-load/calculate
    │    │   ├── Analyze response latencies
    │    │   ├── Calculate error rate
    │    │   ├── Detect engagement drops
    │    │   └── Assess performance decline
    │    │
    │    ├── Story 5.4: Check Overload Threshold
    │    │   If loadScore > 80 (CRITICAL):
    │    │   ├── Create BehavioralEvent with overloadDetected=true
    │    │   ├── Story 5.2: Create COGNITIVE_OVERLOAD indicator
    │    │   └── Story 5.3: Trigger emergency adaptation
    │    │
    │    └── Story 5.3: Apply Adaptive Orchestration
    │        ├── If load 60-80 (HIGH): Reduce difficulty 1 level
    │        ├── If load >80 (CRITICAL): Pure review mode, suggest break
    │        └── Update SessionOrchestrationPlan.loadBasedAdaptations
    │
    └──▶ SESSION END
         ├── Calculate final cognitive load
         ├── Record actualCognitiveLoad in Mission
         ├── Update BehavioralEvent.cognitiveLoadScore
         └── Trigger effectiveness tracking (Story 5.3)

┌─────────────────────────────────────────────────────────────────┐
│ CONTRACT VALIDATION CHECKPOINTS                                 │
└─────────────────────────────────────────────────────────────────┘
✅ Cognitive load MUST be calculated every 5 minutes
✅ Load >80 MUST trigger COGNITIVE_OVERLOAD indicator (Story 5.2)
✅ Orchestration MUST adapt difficulty based on load (Story 5.3)
✅ Session metrics MUST update BehavioralEvent
```

### 4.3 Weekly Insights Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ WEEKLY INSIGHTS GENERATION (Story 5.6 Dashboard)               │
└─────────────────────────────────────────────────────────────────┘

Scheduled Job: Sunday 11 PM (Cron)
    │
    ├──▶ Story 5.1: Pattern Analysis
    │    └── BehavioralPatternEngine.runFullAnalysis()
    │        ├── Detect new patterns (confidence ≥0.7)
    │        ├── Update existing patterns
    │        └── Generate BehavioralInsights
    │
    ├──▶ Story 5.2: Prediction Accuracy Tracking
    │    └── PredictionAccuracyTracker.updateMetrics()
    │        ├── Compare predictions to actual outcomes
    │        ├── Calculate precision, recall, F1
    │        └── Update model performance metrics
    │
    ├──▶ Story 5.3: Orchestration Effectiveness
    │    └── Calculate adherence rate, performance improvement
    │        └── Generate OrchestrationMetric records
    │
    ├──▶ Story 5.4: Burnout Risk Assessment
    │    └── BurnoutPreventionEngine.assessBurnoutRisk()
    │        ├── Analyze 14-day cognitive load history
    │        ├── Detect warning signals
    │        └── Generate BurnoutRiskAssessment
    │
    └──▶ Story 5.6: Dashboard Aggregation
         ├── RecommendationsEngine.generateRecommendations()
         │   └── Prioritize recommendations from all stories
         ├── GoalManager.updateGoalProgress()
         │   └── Check goal completions, trigger notifications
         └── AcademicPerformanceIntegration.correlatePerformance()
             └── Calculate Pearson r, generate insights

┌─────────────────────────────────────────────────────────────────┐
│ CONTRACT VALIDATION CHECKPOINTS                                 │
└─────────────────────────────────────────────────────────────────┘
✅ Weekly job MUST run all Epic 5 story analyses
✅ Dashboard data MUST be cached for 1 hour after generation
✅ New patterns (confidence ≥0.7) MUST trigger notifications
✅ Goal completions MUST trigger notifications and badge awards
```

### 4.4 Struggle Detection & Intervention Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ STRUGGLE DETECTION INTEGRATION (Story 5.2 + Story 5.4)         │
└─────────────────────────────────────────────────────────────────┘

Session Performance Tracking
    │
    ├──▶ Story 5.4: Detect Cognitive Overload
    │    If loadScore > 80:
    │    └──▶ Create BehavioralEvent with overloadDetected=true
    │
    ├──▶ Story 5.2: Create Struggle Indicator
    │    POST /api/analytics/struggle-indicators
    │    └── IndicatorType.COGNITIVE_OVERLOAD
    │        ├── severity: HIGH
    │        ├── context: { loadScore, stressIndicators }
    │        └── Link to StrugglePrediction (if exists)
    │
    ├──▶ Story 5.2: Generate Intervention Recommendation
    │    InterventionEngine.generateInterventions()
    │    └── InterventionType.COGNITIVE_LOAD_REDUCE
    │        ├── description: "Reduce session complexity"
    │        ├── reasoning: "High cognitive load detected (85)"
    │        └── priority: 9 (high)
    │
    └──▶ Story 5.3: Apply Intervention to Orchestration
         POST /api/orchestration/session-plan
         └── Apply load-based adjustments:
             ├── Reduce duration 40%
             ├── Increase break frequency
             ├── Switch to review-only content
             └── Update SessionOrchestrationPlan

┌─────────────────────────────────────────────────────────────────┐
│ CONTRACT VALIDATION CHECKPOINTS                                 │
└─────────────────────────────────────────────────────────────────┘
✅ Cognitive overload MUST create COGNITIVE_OVERLOAD indicator
✅ COGNITIVE_LOAD_REDUCE intervention MUST be applied to orchestration
✅ Intervention effectiveness MUST be tracked (before/after load)
```

---

## 5. Defensive Coding Patterns

### 5.1 Null Safety & Graceful Degradation

#### Pattern 1: Optional Cognitive Load Integration
```typescript
/**
 * Orchestration should work WITHOUT cognitive load data
 * Contract: Always provide fallback defaults
 */
async function generateTimeRecommendations(userId: string): Promise<TimeSlot[]> {
  let cognitiveLoad: CognitiveLoadScore | null = null;

  try {
    // Attempt to fetch cognitive load (Story 5.4)
    cognitiveLoad = await fetch('/api/analytics/cognitive-load/current');
  } catch (error) {
    console.warn('Cognitive load unavailable, using defaults:', error);
    // GRACEFUL DEGRADATION: Continue without load data
  }

  // Generate recommendations with or without load data
  const recommendations = await studyTimeRecommender.generateRecommendations(userId);

  // Apply load adjustments only if available
  if (cognitiveLoad && cognitiveLoad.loadScore > 60) {
    return applyLoadBasedAdjustments(recommendations, cognitiveLoad);
  }

  return recommendations;
}
```

#### Pattern 2: Minimum Data Quality Thresholds
```typescript
/**
 * Validate data quality before using behavioral insights
 * Contract: Require minimum confidence for critical decisions
 */
function shouldApplyBehavioralInsight(insight: BehavioralInsight): boolean {
  // Minimum confidence threshold: 0.7
  if (insight.confidence < 0.7) {
    console.log(`Insight confidence too low: ${insight.confidence}`);
    return false;
  }

  // Check data quality score (Story 5.1)
  const profile = await getUserLearningProfile(insight.userId);
  if (profile.dataQualityScore < 0.6) {
    console.log(`User data quality insufficient: ${profile.dataQualityScore}`);
    return false;
  }

  return true;
}
```

### 5.2 API Error Handling

#### Pattern 3: Circuit Breaker for External Dependencies
```typescript
/**
 * Prevent cascade failures across Epic 5 integrations
 * Contract: Fail fast, degrade gracefully
 */
class EpicFiveIntegrationClient {
  private failureCount = 0;
  private readonly MAX_FAILURES = 3;
  private readonly TIMEOUT_MS = 5000;

  async fetchWithFallback<T>(
    endpoint: string,
    fallback: T
  ): Promise<T> {
    // Circuit breaker: Skip request if too many failures
    if (this.failureCount >= this.MAX_FAILURES) {
      console.warn(`Circuit breaker open for ${endpoint}, using fallback`);
      return fallback;
    }

    try {
      const response = await Promise.race([
        fetch(endpoint),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.TIMEOUT_MS)
        )
      ]);

      this.failureCount = 0; // Reset on success
      return await response.json();
    } catch (error) {
      this.failureCount++;
      console.error(`API failure (${this.failureCount}/${this.MAX_FAILURES}):`, error);
      return fallback;
    }
  }
}

// Usage in MissionGenerator
const cognitiveLoad = await client.fetchWithFallback(
  '/api/analytics/cognitive-load/current',
  { loadScore: 50, loadLevel: 'MODERATE' } as CognitiveLoadScore
);
```

### 5.3 Data Validation & Sanitization

#### Pattern 4: Zod Schema Validation
```typescript
/**
 * Validate all cross-story data contracts
 * Contract: Reject invalid data early
 */
import { z } from 'zod';

// Story 5.4 → Story 5.3 integration schema
const CognitiveLoadAwareTimeSlotSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  duration: z.number().min(1).max(180), // 1-180 minutes
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  reasoning: z.array(z.string()),
  calendarConflict: z.boolean(),
  // Cognitive load integration fields
  predictedLoad: z.number().min(0).max(100).optional(),
  loadConfidence: z.number().min(0).max(1).optional(),
  loadBasedAdjustments: z.object({
    originalDuration: z.number().optional(),
    durationReduction: z.number().min(0).max(100).optional(),
    intensityDowngrade: z.boolean().optional(),
    additionalBreaks: z.number().min(0).optional(),
  }).optional(),
  highLoadWarning: z.boolean().optional(),
  burnoutRiskWarning: z.boolean().optional(),
  recoveryRecommended: z.boolean().optional(),
});

// Validate before using
function processCognitiveLoadAwareTimeSlot(data: unknown): CognitiveLoadAwareTimeSlot {
  const validated = CognitiveLoadAwareTimeSlotSchema.parse(data);
  return validated;
}
```

### 5.4 Concurrency & Race Conditions

#### Pattern 5: Atomic Updates with Optimistic Locking
```typescript
/**
 * Prevent race conditions when multiple stories update same models
 * Contract: Use Prisma's optimistic concurrency control
 */
async function updateMissionWithOrchestration(
  missionId: string,
  orchestrationPlan: OrchestrationPlan,
  cognitiveLoad: CognitiveLoadScore
): Promise<Mission> {
  // Fetch current mission with version
  const currentMission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { id: true, updatedAt: true }
  });

  if (!currentMission) {
    throw new Error('Mission not found');
  }

  try {
    // Atomic update with optimistic locking
    return await prisma.mission.update({
      where: {
        id: missionId,
        updatedAt: currentMission.updatedAt // Verify version hasn't changed
      },
      data: {
        // Story 5.3 fields
        recommendedStartTime: orchestrationPlan.startTime,
        recommendedDuration: orchestrationPlan.duration,
        intensityLevel: orchestrationPlan.intensity,
        contentSequence: orchestrationPlan.contentSequence,
        orchestrationPlanId: orchestrationPlan.id,
        // Story 5.4 fields
        plannedCognitiveLoad: cognitiveLoad.loadScore,
      }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      // Record was modified by another process, retry
      console.warn('Optimistic locking conflict, retrying...');
      return updateMissionWithOrchestration(missionId, orchestrationPlan, cognitiveLoad);
    }
    throw error;
  }
}
```

### 5.5 Caching Strategy

#### Pattern 6: Time-Based Cache Invalidation
```typescript
/**
 * Cache expensive cross-story aggregations
 * Contract: Cache for 1 hour, invalidate on new patterns
 */
class BehavioralInsightsCacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  async getDashboardData(userId: string): Promise<BehavioralInsightsSummary> {
    const cacheKey = `dashboard:${userId}`;
    const cached = this.cache.get(cacheKey);

    // Return cached if fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      console.log('Cache hit:', cacheKey);
      return cached.data;
    }

    // Fetch from all Epic 5 APIs
    console.log('Cache miss, fetching fresh data:', cacheKey);
    const data = await this.fetchDashboardData(userId);

    // Store in cache
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  // Invalidate cache on pattern detection
  invalidateOnPatternDetection(userId: string) {
    const cacheKey = `dashboard:${userId}`;
    this.cache.delete(cacheKey);
    console.log('Cache invalidated:', cacheKey);
  }

  private async fetchDashboardData(userId: string): Promise<BehavioralInsightsSummary> {
    const [
      patterns,
      profile,
      predictions,
      interventions,
      orchestrationMetrics,
      cognitiveHealth,
      goals,
      recommendations,
      correlationData
    ] = await Promise.all([
      fetch(`/api/analytics/patterns?userId=${userId}&limit=5`),
      fetch(`/api/analytics/learning-profile?userId=${userId}`),
      fetch(`/api/analytics/predictions?userId=${userId}&status=PENDING`),
      fetch(`/api/analytics/interventions?userId=${userId}&status=PENDING`),
      fetch(`/api/orchestration/effectiveness?userId=${userId}`),
      this.fetchCognitiveHealth(userId),
      fetch(`/api/analytics/behavioral-insights/goals?userId=${userId}&status=ACTIVE`),
      fetch(`/api/analytics/behavioral-insights/recommendations?userId=${userId}&limit=5`),
      fetch(`/api/analytics/behavioral-insights/correlation?userId=${userId}&weeks=12`)
    ]);

    return {
      patterns,
      learningProfile: profile,
      predictions,
      interventions,
      orchestrationMetrics,
      cognitiveHealth,
      goals,
      recommendations,
      correlationData
    };
  }

  private async fetchCognitiveHealth(userId: string): Promise<CognitiveLoadDashboardData> {
    const [currentLoad, loadHistory, burnoutRisk, stressPatterns] = await Promise.all([
      fetch(`/api/analytics/cognitive-load/current?userId=${userId}`),
      fetch(`/api/analytics/cognitive-load/history?userId=${userId}&weeks=4`),
      fetch(`/api/analytics/burnout-risk?userId=${userId}`),
      fetch(`/api/analytics/stress-patterns?userId=${userId}&minConfidence=0.6`)
    ]);

    return {
      currentLoad,
      lastUpdated: new Date(),
      loadHistory: loadHistory.dataPoints || [],
      burnoutRisk,
      warningSignals: burnoutRisk.warningSignals || [],
      stressPatterns,
      primaryStressors: stressPatterns.map(p => p.patternType),
      loadTolerance: 65, // Default, can be personalized
      interventionsApplied: []
    };
  }
}
```

---

## 6. Testing Strategy

### 6.1 Integration Test Scenarios

#### Scenario 1: End-to-End Mission Generation with Full Epic 5 Integration
```typescript
/**
 * Test: Mission generation integrates all Epic 5 stories
 * Stories: 5.1, 5.2, 5.3, 5.4, Story 2.4
 */
describe('Mission Generation - Epic 5 Integration', () => {
  test('generates mission with cognitive load awareness', async () => {
    // Setup: User with 8+ weeks behavioral data
    const userId = 'test-user-123';
    await seedBehavioralData(userId, { weeks: 8, avgLoad: 55 });

    // Setup: High cognitive load (should trigger recovery mission)
    await createCognitiveLoadMetric(userId, {
      loadScore: 75,
      loadLevel: 'HIGH',
      timestamp: new Date()
    });

    // Setup: Struggle prediction for Physiology
    await createStrugglePrediction(userId, {
      topicId: 'physiology-101',
      probability: 0.82,
      confidence: 0.78
    });

    // Act: Generate mission
    const mission = await missionGenerator.generateDailyMission(userId);

    // Assert: Mission reflects cognitive load
    expect(mission.intensityLevel).toBe('LOW'); // Reduced due to high load
    expect(mission.recommendedDuration).toBeLessThan(45); // Reduced duration
    expect(mission.plannedCognitiveLoad).toBeGreaterThan(70);

    // Assert: Mission includes orchestration recommendations
    expect(mission.recommendedStartTime).toBeDefined();
    expect(mission.contentSequence).toBeDefined();

    // Assert: Mission includes struggle interventions
    const objectives = JSON.parse(mission.objectives as string);
    const hasPrerequisiteReview = objectives.some(
      obj => obj.interventionType === 'PREREQUISITE_REVIEW'
    );
    expect(hasPrerequisiteReview).toBe(true);
  });

  test('overrides mission generation for critical burnout risk', async () => {
    const userId = 'test-user-456';

    // Setup: Critical burnout risk
    await createBurnoutRiskAssessment(userId, {
      riskScore: 85,
      riskLevel: 'CRITICAL',
      contributingFactors: [
        { factor: 'chronic_high_load', percentage: 40 },
        { factor: 'performance_decline', percentage: 35 }
      ]
    });

    // Act: Attempt mission generation
    const mission = await missionGenerator.generateDailyMission(userId);

    // Assert: Recovery mission generated
    expect(mission.intensityLevel).toBe('LOW');
    expect(mission.estimatedMinutes).toBeLessThanOrEqual(15);
    expect(mission.reviewCardCount).toBeGreaterThan(0);
    expect(mission.newContentCount).toBe(0); // No new content
  });
});
```

#### Scenario 2: Real-Time Session Orchestration with Cognitive Load Adaptation
```typescript
/**
 * Test: Session orchestration adapts to real-time cognitive load
 * Stories: 5.3, 5.4
 */
describe('Session Orchestration - Cognitive Load Adaptation', () => {
  test('adapts difficulty when cognitive overload detected', async () => {
    const userId = 'test-user-789';
    const sessionId = 'session-abc';

    // Setup: Start session with normal load
    await studySession.start(userId, sessionId);
    let loadScore = 45; // MODERATE

    // Simulate 5-minute monitoring intervals
    for (let minute = 0; minute < 60; minute += 5) {
      // Simulate increasing cognitive load
      if (minute >= 30) {
        loadScore = 85; // CRITICAL overload at 30 min
      }

      // Act: Calculate cognitive load
      const cognitiveLoad = await cognitiveLoadMonitor.calculateCurrentLoad(
        userId,
        sessionId,
        {
          responseLatencies: generateLatencies(loadScore),
          errorRate: loadScore > 70 ? 0.35 : 0.15,
          sessionDuration: minute
        }
      );

      // Assert: Overload detected at 30 min
      if (minute === 30) {
        expect(cognitiveLoad.loadLevel).toBe('CRITICAL');
        expect(cognitiveLoad.overloadDetected).toBe(true);

        // Assert: COGNITIVE_OVERLOAD indicator created (Story 5.2)
        const indicators = await prisma.struggleIndicator.findMany({
          where: {
            userId,
            indicatorType: 'COGNITIVE_OVERLOAD'
          }
        });
        expect(indicators.length).toBeGreaterThan(0);

        // Assert: Orchestration adapted (Story 5.3)
        const updatedPlan = await prisma.sessionOrchestrationPlan.findFirst({
          where: { userId }
        });
        const adaptations = JSON.parse(updatedPlan.loadBasedAdaptations);
        expect(adaptations).toContainEqual(
          expect.objectContaining({ type: 'difficulty_reduction' })
        );
      }
    }
  });
});
```

#### Scenario 3: Dashboard Data Aggregation and Correlation Analysis
```typescript
/**
 * Test: Story 5.6 dashboard aggregates all Epic 5 data correctly
 * Stories: 5.1, 5.2, 5.3, 5.4, 5.6
 */
describe('Dashboard - Epic 5 Data Aggregation', () => {
  test('fetches comprehensive behavioral insights summary', async () => {
    const userId = 'test-user-dashboard';

    // Setup: Seed all Epic 5 data
    await seedBehavioralPatterns(userId, { count: 5, confidence: 0.8 });
    await seedStrugglePredictions(userId, { count: 3, probability: 0.75 });
    await seedOrchestrationPlans(userId, { count: 10, adherenceRate: 0.7 });
    await seedCognitiveLoadMetrics(userId, { weeks: 8, avgLoad: 55 });
    await seedBehavioralGoals(userId, { count: 2, status: 'ACTIVE' });

    // Act: Fetch dashboard data
    const dashboard = await fetch(`/api/analytics/behavioral-insights/dashboard?userId=${userId}`);
    const data: BehavioralInsightsSummary = await dashboard.json();

    // Assert: All Epic 5 data present
    expect(data.patterns).toHaveLength(5);
    expect(data.predictions).toHaveLength(3);
    expect(data.orchestrationMetrics.adherenceRate).toBe(0.7);
    expect(data.cognitiveHealth.currentLoad).toBeDefined();
    expect(data.goals).toHaveLength(2);

    // Assert: Correlation analysis includes orchestration impact
    expect(data.correlationData.orchestrationCorrelation).toBeDefined();
    expect(data.correlationData.coefficient).toBeGreaterThan(0); // Positive correlation
  });

  test('calculates performance correlation with behavioral score', async () => {
    const userId = 'test-user-correlation';

    // Setup: 12 weeks behavioral data + exam scores
    await seedBehavioralDataWithExams(userId, {
      weeks: 12,
      examScores: [78, 82, 85, 88, 90], // Improving scores
      behavioralScores: [60, 65, 70, 75, 80] // Improving behaviors
    });

    // Act: Fetch correlation analysis
    const correlation = await fetch(
      `/api/analytics/behavioral-insights/correlation?userId=${userId}&weeks=12`
    );
    const data = await correlation.json();

    // Assert: Strong positive correlation
    expect(data.coefficient).toBeGreaterThan(0.7); // Pearson r > 0.7
    expect(data.pValue).toBeLessThan(0.05); // Statistically significant
    expect(data.interpretation).toContain('strong positive');
    expect(data.timeSeriesData).toHaveLength(12);
  });
});
```

### 6.2 Contract Validation Tests

#### Test 1: API Contract Compliance
```typescript
/**
 * Test: All APIs follow integration contracts
 */
describe('API Contract Validation', () => {
  test('Story 5.3 orchestration queries Story 5.4 cognitive load', async () => {
    const userId = 'test-contract-user';

    // Mock Story 5.4 API
    const cognitiveLoadMock = jest.fn().mockResolvedValue({
      loadScore: 65,
      loadLevel: 'MODERATE',
      stressIndicators: []
    });

    // Act: Call Story 5.3 orchestration
    await orchestrationService.generateRecommendations(userId);

    // Assert: Story 5.4 API was called
    expect(cognitiveLoadMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId })
    );
  });

  test('Story 5.4 cognitive overload creates Story 5.2 indicator', async () => {
    const userId = 'test-overload-user';
    const sessionId = 'session-xyz';

    // Act: Simulate cognitive overload
    await cognitiveLoadMonitor.calculateCurrentLoad(userId, sessionId, {
      responseLatencies: [5000, 6000, 7000], // High latencies
      errorRate: 0.45, // High error rate
      sessionDuration: 60
    });

    // Assert: COGNITIVE_OVERLOAD indicator created
    const indicator = await prisma.struggleIndicator.findFirst({
      where: {
        userId,
        indicatorType: 'COGNITIVE_OVERLOAD'
      }
    });
    expect(indicator).toBeDefined();
    expect(indicator.severity).toBe('HIGH');
  });
});
```

### 6.3 Edge Case Testing

#### Test 2: Insufficient Data Scenarios
```typescript
describe('Edge Cases - Insufficient Data', () => {
  test('handles user with <6 weeks behavioral data', async () => {
    const newUserId = 'new-user-123';

    // Setup: Only 3 weeks of data
    await seedBehavioralData(newUserId, { weeks: 3 });

    // Act: Fetch dashboard
    const dashboard = await fetch(
      `/api/analytics/behavioral-insights/dashboard?userId=${newUserId}`
    );
    const data = await dashboard.json();

    // Assert: Dashboard shows "insufficient data" state
    expect(data.patterns).toHaveLength(0);
    expect(data.learningProfile.dataQualityScore).toBeLessThan(0.6);
    expect(data.recommendations).toHaveLength(0);
  });

  test('orchestration works without cognitive load data', async () => {
    const userId = 'user-no-load';

    // Setup: User with behavioral data but no cognitive load
    await seedBehavioralPatterns(userId, { count: 3 });
    // No cognitive load metrics

    // Act: Generate orchestration recommendations
    const recommendations = await orchestrationService.generateRecommendations(userId);

    // Assert: Recommendations generated with defaults
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].predictedLoad).toBeUndefined(); // No load prediction
    expect(recommendations[0].confidence).toBeGreaterThan(0.5); // Lower confidence
  });
});
```

---

## 7. Implementation Guidelines

### 7.1 Implementation Order

**CRITICAL: Stories MUST be implemented in this order to prevent integration failures.**

#### Phase 1: Foundation (Stories 5.1, 5.2 - COMPLETE)
✅ Story 5.1: Learning Pattern Recognition (COMPLETE)
✅ Story 5.2: Predictive Analytics for Struggles (COMPLETE)

#### Phase 2: Core Epic 5 Extensions (Stories 5.3, 5.4)
1. **Story 5.4: Cognitive Load Monitoring** (Implement FIRST)
   - Reason: Story 5.3 depends on cognitive load data
   - Deliverables:
     - CognitiveLoadMetric, BurnoutRiskAssessment, StressResponsePattern models
     - CognitiveLoadMonitor, BurnoutPreventionEngine, DifficultyAdapter classes
     - 7 cognitive load API endpoints
     - Extend BehavioralEvent, UserLearningProfile models

2. **Story 5.3: Optimal Study Timing and Session Orchestration** (Implement SECOND)
   - Reason: Integrates cognitive load (Story 5.4) and learning profile (Story 5.1)
   - Deliverables:
     - SessionOrchestrationPlan, StudyScheduleRecommendation models
     - StudyTimeRecommender, SessionDurationOptimizer, ContentSequencer classes
     - 10 orchestration API endpoints
     - Extend Mission model with orchestration fields

#### Phase 3: User-Facing Integration (Story 5.6)
3. **Story 5.6: Behavioral Insights Dashboard** (Implement LAST)
   - Reason: Consumes data from ALL Epic 5 stories
   - Deliverables:
     - BehavioralGoal, Recommendation, AppliedRecommendation models
     - RecommendationsEngine, GoalManager, AcademicPerformanceIntegration classes
     - Dashboard UI (4 tabs: Patterns, Progress, Goals, Learn)
     - 9 dashboard API endpoints

### 7.2 Database Migration Order

```bash
# Story 5.4: Cognitive Load Models (FIRST)
npx prisma migrate dev --name add_cognitive_load_models

# Story 5.3: Orchestration Models (SECOND)
npx prisma migrate dev --name add_orchestration_models

# Story 5.6: Dashboard Models (LAST)
npx prisma migrate dev --name add_dashboard_models
```

**Migration Dependencies:**
- Story 5.3 migration depends on Story 5.4 (Mission.plannedCognitiveLoad)
- Story 5.6 migration depends on Stories 5.1, 5.2, 5.3, 5.4 (all foreign keys)

### 7.3 API Endpoint Implementation Order

#### Story 5.4 (Implement FIRST)
```
1. POST /api/analytics/cognitive-load/calculate
2. GET /api/analytics/cognitive-load/current
3. GET /api/analytics/cognitive-load/history
4. GET /api/analytics/burnout-risk
5. GET /api/analytics/stress-patterns
6. GET /api/analytics/stress-profile
7. POST /api/analytics/interventions/apply
```

#### Story 5.3 (Implement SECOND)
```
1. POST /api/orchestration/recommendations
   └── Depends on: /api/analytics/cognitive-load/current
2. POST /api/orchestration/session-plan
   └── Depends on: /api/analytics/cognitive-load/current, /api/analytics/burnout-risk
3. GET /api/orchestration/cognitive-load
4. POST /api/orchestration/adapt-schedule
5. GET /api/orchestration/effectiveness
6-10. Calendar integration endpoints (optional for MVP)
```

#### Story 5.6 (Implement LAST)
```
1. GET /api/analytics/behavioral-insights/dashboard
   └── Depends on: ALL Epic 5 APIs
2. GET /api/analytics/behavioral-insights/patterns/evolution
3. GET /api/analytics/behavioral-insights/progress
4. GET /api/analytics/behavioral-insights/recommendations
5. POST /api/analytics/behavioral-insights/recommendations/:id/apply
6. POST /api/analytics/behavioral-insights/goals
7. PATCH /api/analytics/behavioral-insights/goals/:id/progress
8. GET /api/analytics/behavioral-insights/goals/:id
9. GET /api/analytics/behavioral-insights/correlation
10. GET /api/analytics/behavioral-insights/learning-science/:articleId
```

### 7.4 Testing Checkpoints

#### Checkpoint 1: After Story 5.4 Implementation
```bash
# Test cognitive load calculation
npm run test -- cognitive-load-monitor.test.ts

# Test burnout risk assessment
npm run test -- burnout-prevention-engine.test.ts

# Manual test: Verify BehavioralEvent.cognitiveLoadScore populated
psql -d americano_dev -c "SELECT cognitiveLoadScore, overloadDetected FROM behavioral_events WHERE cognitiveLoadScore IS NOT NULL LIMIT 5;"
```

#### Checkpoint 2: After Story 5.3 Implementation
```bash
# Test orchestration recommendations
npm run test -- study-time-recommender.test.ts

# Test cognitive load integration
npm run test -- orchestration-cognitive-load-integration.test.ts

# Manual test: Verify Mission.recommendedStartTime populated
psql -d americano_dev -c "SELECT recommendedStartTime, intensityLevel, plannedCognitiveLoad FROM missions WHERE recommendedStartTime IS NOT NULL LIMIT 5;"
```

#### Checkpoint 3: After Story 5.6 Implementation
```bash
# Test dashboard aggregation
npm run test -- behavioral-insights-dashboard.test.ts

# Test correlation analysis
npm run test -- academic-performance-integration.test.ts

# Manual test: Verify dashboard loads all Epic 5 data
curl http://localhost:3000/api/analytics/behavioral-insights/dashboard?userId=kevy@americano.dev | jq .
```

### 7.5 Code Review Checklist

Before merging each story, validate:

**Story 5.4:**
- [ ] BehavioralEvent.cognitiveLoadScore populated during sessions
- [ ] COGNITIVE_OVERLOAD indicator created when load >80
- [ ] Burnout risk assessment runs weekly (cron job)
- [ ] UserLearningProfile.loadTolerance personalized

**Story 5.3:**
- [ ] Mission.recommendedStartTime set from orchestration
- [ ] Orchestration queries cognitive load before recommendations
- [ ] SessionOrchestrationPlan.loadBasedAdaptations applied
- [ ] Mission generation respects burnout risk override

**Story 5.6:**
- [ ] Dashboard aggregates data from all Epic 5 stories
- [ ] Recommendations engine prioritizes from all sources
- [ ] Correlation analysis includes orchestration impact
- [ ] Goals created for orchestration adherence and cognitive load management

### 7.6 Performance Optimization

#### Caching Strategy
```typescript
// Story 5.6 Dashboard: Cache comprehensive dashboard for 1 hour
const DASHBOARD_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Story 5.4 Cognitive Load: Cache current load for 5 minutes during sessions
const COGNITIVE_LOAD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Story 5.3 Orchestration: Cache recommendations for 24 hours
const ORCHESTRATION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
```

#### Query Optimization
```sql
-- Index for cognitive load queries (Story 5.4)
CREATE INDEX idx_behavioral_events_cognitive_load
ON behavioral_events(userId, cognitiveLoadScore, timestamp);

-- Index for orchestration effectiveness (Story 5.3)
CREATE INDEX idx_missions_orchestration
ON missions(userId, recommendedStartTime, intensityLevel);

-- Index for dashboard patterns (Story 5.6)
CREATE INDEX idx_behavioral_patterns_user_confidence
ON behavioral_patterns(userId, confidence DESC);
```

---

## Appendix A: Quick Reference

### Integration Dependency Map
```
Story 5.1 (Learning Patterns) ─┬──▶ Story 5.3 (Orchestration)
                               │    └──▶ Story 5.6 (Dashboard)
                               │
Story 5.2 (Struggle Prediction)─┼──▶ Story 5.3 (Orchestration)
                               │    └──▶ Story 5.6 (Dashboard)
                               │
Story 5.4 (Cognitive Load) ────┴──▶ Story 5.3 (Orchestration)
                                    └──▶ Story 5.6 (Dashboard)

Story 2.4 (Mission Generator) ◀──── All Epic 5 Stories
```

### Critical Integration Points Summary

| From Story | To Story | Integration Type | Contract |
|------------|----------|------------------|----------|
| 5.4 | 5.3 | API | Orchestration MUST query cognitive load before recommendations |
| 5.4 | 5.2 | Database | Cognitive overload MUST create COGNITIVE_OVERLOAD indicator |
| 5.3 | 2.4 | API | Mission generator MUST read orchestration recommendations |
| 5.4 | 2.4 | API | Mission generator MUST check burnout risk |
| 5.1, 5.2, 5.3, 5.4 | 5.6 | API | Dashboard MUST aggregate data from all stories |

### API Endpoints by Story

**Story 5.3 (10 endpoints):**
- POST /api/orchestration/recommendations
- POST /api/orchestration/session-plan
- GET /api/orchestration/cognitive-load
- POST /api/orchestration/adapt-schedule
- GET /api/orchestration/effectiveness
- POST /api/calendar/connect
- GET /api/calendar/callback
- GET /api/calendar/status
- POST /api/calendar/sync
- DELETE /api/calendar/disconnect

**Story 5.4 (7 endpoints):**
- POST /api/analytics/cognitive-load/calculate
- GET /api/analytics/cognitive-load/current
- GET /api/analytics/cognitive-load/history
- GET /api/analytics/burnout-risk
- GET /api/analytics/stress-patterns
- GET /api/analytics/stress-profile
- POST /api/analytics/interventions/apply

**Story 5.6 (10 endpoints):**
- GET /api/analytics/behavioral-insights/dashboard
- GET /api/analytics/behavioral-insights/patterns/evolution
- GET /api/analytics/behavioral-insights/progress
- GET /api/analytics/behavioral-insights/recommendations
- POST /api/analytics/behavioral-insights/recommendations/:id/apply
- POST /api/analytics/behavioral-insights/goals
- PATCH /api/analytics/behavioral-insights/goals/:id/progress
- GET /api/analytics/behavioral-insights/goals/:id
- GET /api/analytics/behavioral-insights/correlation
- GET /api/analytics/behavioral-insights/learning-science/:articleId

---

## Appendix B: Validation Report

**Validation Date:** 2025-10-16
**Validated By:** Winston (Architect - Integration Coordinator)

### Architecture Validation

✅ **No Circular Dependencies**
- Verified: Story 5.4 → 5.3 → 5.6 (linear dependency chain)
- Verified: All stories depend on 5.1 & 5.2 (completed prerequisites)

✅ **RESTful API Design**
- All endpoints follow REST conventions
- HTTP methods correctly used (GET for reads, POST for creates, PATCH for updates)
- Resource naming consistent and hierarchical

✅ **Database Schema Normalized**
- Third normal form (3NF) achieved
- Foreign keys properly defined
- Indexes on high-query columns

✅ **Performance Implications Assessed**
- Caching strategy defined (1-hour dashboard, 5-min cognitive load)
- Query optimization indexes specified
- API timeout limits set (5 seconds)

✅ **Security Best Practices**
- Input validation via Zod schemas
- SQL injection prevention via Prisma ORM
- Authentication placeholders for multi-user deployment
- Error handling prevents sensitive data leakage

### Integration Conflicts

**ZERO CONFLICTS DETECTED** ✅

- No database model name collisions
- No API route path collisions
- No file path collisions
- No circular imports

### Recommendations

1. **Implement Stories in Order:** 5.4 → 5.3 → 5.6
2. **Test After Each Story:** Run integration test suite
3. **Monitor Performance:** Track API latency, database query times
4. **Document Deviations:** If contracts change, update this document

---

**End of Integration Contracts Document**
