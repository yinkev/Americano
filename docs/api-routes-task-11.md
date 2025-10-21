# Story 5.2 - Task 11: Struggle Prediction API Endpoints

**Status**: ✅ Complete
**Date**: 2025-10-16
**Developer**: Claude (Backend System Architect)

## Summary

Successfully implemented all 7 API routes for the Struggle Prediction system in Story 5.2. All routes follow Next.js 15 App Router patterns with async params, Zod validation, proper error handling, and standardized response formats.

## Files Created

### 1. POST /api/analytics/predictions/generate
**File**: `/apps/web/src/app/api/analytics/predictions/generate/route.ts`

**Purpose**: Generate struggle predictions for upcoming objectives

**Request Body**:
```typescript
{
  userId: string,
  daysAhead?: number (default: 7, max: 30)
}
```

**Response**:
```typescript
{
  predictions: StrugglePrediction[],
  alerts: StruggleAlert[],
  summary: {
    totalPredictions: number,
    highRiskCount: number,
    mediumRiskCount: number,
    interventionsGenerated: number
  }
}
```

**Features**:
- Runs `StruggleDetectionEngine.runPredictions()`
- Generates alerts for high-priority predictions (>70% probability)
- Calculates priority using formula: urgency(40%) + confidence(30%) + probability(30%)
- Identifies intervention opportunities
- Returns top 5 alerts sorted by priority

---

### 2. GET /api/analytics/predictions
**File**: `/apps/web/src/app/api/analytics/predictions/route.ts`

**Purpose**: Retrieve stored predictions with filtering

**Query Parameters**:
```typescript
{
  userId?: string (default: "kevy@americano.dev"),
  status?: PredictionStatus (PENDING | CONFIRMED | FALSE_POSITIVE | MISSED),
  minProbability?: number (default: 0.5)
}
```

**Response**:
```typescript
{
  predictions: StrugglePrediction[],
  stats: {
    total: number,
    pending: number,
    confirmed: number,
    falsePositives: number,
    missed: number,
    avgProbability: number,
    avgConfidence: number
  }
}
```

**Features**:
- Returns predictions sorted by prediction date ASC
- Includes associated interventions and alerts
- Provides comprehensive statistics
- Supports status filtering

---

### 3. GET /api/analytics/interventions
**File**: `/apps/web/src/app/api/analytics/interventions/route.ts`

**Purpose**: Retrieve active intervention recommendations

**Query Parameters**:
```typescript
{
  userId?: string (default: "kevy@americano.dev")
}
```

**Response**:
```typescript
{
  interventions: InterventionRecommendation[],
  grouped: Record<InterventionType, InterventionRecommendation[]>,
  effectivenessByType: Record<InterventionType, {
    avg: number,
    count: number,
    total: number
  }>,
  summary: {
    totalActive: number,
    pending: number,
    applied: number,
    avgPriority: number
  }
}
```

**Features**:
- Filters by user's upcoming missions (next 14 days)
- Groups interventions by type
- Calculates effectiveness scores from completed interventions
- Includes mission context

---

### 4. POST /api/analytics/interventions/[id]/apply
**File**: `/apps/web/src/app/api/analytics/interventions/[id]/apply/route.ts`

**Purpose**: Apply intervention to mission queue

**Request Body**:
```typescript
{
  applyToMissionId?: string
}
```

**Response**:
```typescript
{
  intervention: InterventionRecommendation,
  mission: Mission,
  result: {
    success: boolean,
    interventionId: string,
    missionId?: string,
    message: string,
    appliedActions: string[]
  }
}
```

**Features**:
- Uses Next.js 15 async params pattern
- Applies intervention via `InterventionEngine.applyIntervention()`
- Updates MissionGenerator with intervention logic
- Returns updated mission with intervention details
- Validates intervention status (prevents double-apply)

---

### 5. POST /api/analytics/predictions/[id]/feedback
**File**: `/apps/web/src/app/api/analytics/predictions/[id]/feedback/route.ts`

**Purpose**: Submit user feedback on prediction accuracy

**Request Body**:
```typescript
{
  actualStruggle: boolean,
  feedbackType: FeedbackType,
  comments?: string
}
```

**Response**:
```typescript
{
  feedbackRecorded: boolean,
  feedbackId: string,
  prediction: StrugglePrediction,
  modelAccuracyUpdate: number,
  metrics: {
    accuracy: number,
    precision: number,
    recall: number,
    f1Score: number,
    calibration: number,
    truePositives: number,
    trueNegatives: number,
    falsePositives: number,
    falseNegatives: number,
    totalPredictions: number
  },
  message: string
}
```

**Features**:
- Updates `prediction.actualOutcome`
- Creates `PredictionFeedback` record
- Triggers model improvement workflow
- Calculates real-time accuracy metrics:
  - Accuracy: (TP + TN) / Total
  - Precision: TP / (TP + FP)
  - Recall: TP / (TP + FN)
  - F1 Score: 2 * (Precision * Recall) / (Precision + Recall)
  - Calibration: 1 - avg(|predicted - actual|)
- Warns if accuracy drops below 70%

---

### 6. GET /api/analytics/model-performance
**File**: `/apps/web/src/app/api/analytics/model-performance/route.ts`

**Purpose**: Retrieve current model accuracy metrics

**Query Parameters**:
```typescript
{
  userId?: string (default: "kevy@americano.dev")
}
```

**Response**:
```typescript
{
  accuracy: number,
  precision: number,
  recall: number,
  f1Score: number,
  calibration: number,
  lastUpdated: DateTime,
  dataPoints: number,
  confusionMatrix: {
    truePositives: number,
    trueNegatives: number,
    falsePositives: number,
    falseNegatives: number
  },
  trends: Array<{
    week: string,
    weekStart: string,
    weekEnd: string,
    accuracy: number,
    dataPoints: number
  }>,
  featureImportance: Array<{
    feature: string,
    importance: number,
    occurrences: number
  }>,
  summary: {
    overallHealth: "Excellent" | "Good" | "Fair" | "Needs Improvement",
    recommendation: string
  }
}
```

**Features**:
- Calculates comprehensive model metrics
- Provides 8-week accuracy trend data
- Analyzes feature importance via correlation
- Returns top 10 most important features
- Provides actionable recommendations

---

### 7. GET /api/analytics/struggle-reduction
**File**: `/apps/web/src/app/api/analytics/struggle-reduction/route.ts`

**Purpose**: Measure reduction in learning struggles

**Query Parameters**:
```typescript
{
  userId?: string (default: "kevy@americano.dev"),
  period?: "week" | "month" | "all" (default: "month")
}
```

**Response**:
```typescript
{
  baselineRate: number,
  currentRate: number,
  reductionPercentage: number,
  timeline: Array<{
    period: string,
    date: string,
    struggleRate: number,
    reviewCount: number
  }>,
  interventionEffectiveness: Array<{
    interventionType: string,
    count: number,
    avgEffectiveness: number,
    description: string
  }>,
  summary: {
    improvementStatus: "Excellent" | "Good" | "Moderate" | "Minimal",
    message: string,
    baselineContext: string,
    currentContext: string
  }
}
```

**Features**:
- Calculates baseline rate (first 6 weeks)
- Calculates current rate based on period
- Computes reduction percentage
- Provides daily/weekly timeline
- Analyzes intervention effectiveness by type
- Struggle detection: AGAIN or HARD review ratings

---

## Technical Implementation Details

### Next.js 15 Patterns Used

1. **Async Params** (Routes with dynamic segments):
```typescript
export const POST = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    // ...
  }
)
```

2. **Zod Validation**:
```typescript
const Schema = z.object({
  userId: z.string().min(1, 'userId is required'),
  // ...
})

const params = Schema.parse(body)
```

3. **Response.json() Wrapper**:
```typescript
return Response.json(
  successResponse({ data })
)
```

4. **Error Handling**:
```typescript
export const GET = withErrorHandler(async (request: NextRequest) => {
  // ... throws ApiError if validation fails
})
```

### Error Handling

All routes use:
- `withErrorHandler` HOC for consistent error responses
- `ApiError` class for structured errors
- Zod validation with clear error messages
- Proper HTTP status codes

### Database Access

- Uses `prisma` from `@/lib/db` (singleton client)
- Proper includes for related data
- Optimized queries with indexes
- Transaction-safe operations

### Security

- Hardcoded userId: "kevy@americano.dev" (auth deferred)
- All queries scoped to userId
- Input validation via Zod
- No SQL injection vulnerabilities (Prisma ORM)

## Integration Points

### With Subsystems

1. **StruggleDetectionEngine**:
   - `/predictions/generate` calls `runPredictions()`
   - `/predictions/generate` calls `identifyInterventionOpportunities()`

2. **InterventionEngine**:
   - `/interventions/[id]/apply` calls `applyIntervention()`

3. **Prisma Models**:
   - StrugglePrediction
   - StruggleIndicator
   - InterventionRecommendation
   - PredictionFeedback
   - Mission
   - Review
   - StudySession

### With Mission System

- Interventions modify mission objectives
- Predictions filtered by upcoming missions
- Post-mission outcome capture

## Testing Strategy

### Manual Testing Checklist

1. **Generate Predictions**:
   - POST `/api/analytics/predictions/generate`
   - Verify predictions created for upcoming objectives
   - Check alerts prioritization (top 5)
   - Confirm intervention generation

2. **Retrieve Predictions**:
   - GET `/api/analytics/predictions?status=PENDING`
   - Verify filtering works
   - Check includes (objective, indicators, interventions)

3. **Apply Intervention**:
   - POST `/api/analytics/interventions/[id]/apply`
   - Verify mission modified
   - Check intervention actions applied

4. **Submit Feedback**:
   - POST `/api/analytics/predictions/[id]/feedback`
   - Verify outcome recorded
   - Check accuracy metrics updated

5. **Model Performance**:
   - GET `/api/analytics/model-performance`
   - Verify metrics calculation
   - Check trends and feature importance

6. **Struggle Reduction**:
   - GET `/api/analytics/struggle-reduction?period=month`
   - Verify baseline vs current calculation
   - Check timeline data

### Edge Cases Covered

- No predictions: Returns empty arrays with helpful messages
- No feedback yet: Returns null metrics with explanation
- Invalid intervention ID: 404 error
- Already applied intervention: 409 conflict error
- Insufficient data: Graceful degradation with messages

## Database Schema Usage

All routes use the Story 5.2 database schema:

```prisma
model StrugglePrediction {
  id                          String
  userId                      String
  learningObjectiveId         String?
  topicId                     String?
  predictionDate              DateTime
  predictedStruggleProbability Float
  predictionConfidence        Float
  predictionStatus            PredictionStatus
  actualOutcome               Boolean?
  outcomeRecordedAt           DateTime?
  featureVector               Json

  learningObjective           LearningObjective?
  indicators                  StruggleIndicator[]
  interventions               InterventionRecommendation[]
  feedbacks                   PredictionFeedback[]
}

model InterventionRecommendation {
  id                  String
  predictionId        String
  userId              String
  interventionType    InterventionType
  description         String
  reasoning           String
  priority            Int
  status              InterventionStatus
  appliedAt           DateTime?
  appliedToMissionId  String?
  effectiveness       Float?

  prediction          StrugglePrediction
  mission             Mission?
}

model PredictionFeedback {
  id              String
  predictionId    String
  userId          String
  feedbackType    FeedbackType
  actualStruggle  Boolean
  helpfulness     Int?
  comments        String?
  submittedAt     DateTime

  prediction      StrugglePrediction
}
```

## Performance Considerations

1. **Caching**: Feature extraction has 1-hour TTL (handled in StruggleFeatureExtractor)
2. **Batch Operations**: Predictions generated in batch (daily 11 PM cron)
3. **Query Optimization**:
   - Indexes on userId, predictionDate, predictionStatus
   - Limited includes to necessary relations
   - Top N queries (alerts limited to 5)
4. **Model Inference**: <100ms per prediction target

## Next Steps

1. **Frontend Integration**:
   - Create `/analytics/struggle-predictions` page (Task 10)
   - Build UI components for displaying predictions
   - Implement intervention application flow

2. **Mission Integration** (Task 12):
   - Extend MissionGenerator to consume predictions
   - Implement prediction-aware composition
   - Add prediction context to mission display

3. **Testing** (Task 13):
   - Manual testing with synthetic data
   - Integration testing across stories
   - Validation of prediction accuracy

4. **Production Deployment**:
   - Add authentication (Clerk/Auth.js)
   - Set up daily cron job for predictions
   - Configure monitoring and alerting

## API Route Summary

| Route | Method | Purpose | Key Features |
|-------|--------|---------|--------------|
| `/api/analytics/predictions/generate` | POST | Generate predictions | Runs detection engine, creates alerts |
| `/api/analytics/predictions` | GET | List predictions | Filtering, stats, includes |
| `/api/analytics/interventions` | GET | List interventions | Effectiveness scores, grouping |
| `/api/analytics/interventions/[id]/apply` | POST | Apply intervention | Modifies mission queue |
| `/api/analytics/predictions/[id]/feedback` | POST | Submit feedback | Updates model metrics |
| `/api/analytics/model-performance` | GET | Model metrics | Accuracy, trends, features |
| `/api/analytics/struggle-reduction` | GET | Measure improvement | Baseline vs current |

## Acceptance Criteria Met

✅ All 7 routes implemented with proper validation
✅ Next.js 15 App Router patterns (async params)
✅ Zod validation for all request bodies
✅ ApiError class for error handling
✅ Response.json() wrappers
✅ Hardcoded userId for MVP
✅ Prisma client from @/lib/db
✅ Proper includes for related data
✅ Comprehensive response formats

## Files Modified/Created

**Created** (7 files):
1. `/apps/web/src/app/api/analytics/predictions/generate/route.ts`
2. `/apps/web/src/app/api/analytics/predictions/route.ts`
3. `/apps/web/src/app/api/analytics/interventions/route.ts`
4. `/apps/web/src/app/api/analytics/interventions/[id]/apply/route.ts`
5. `/apps/web/src/app/api/analytics/predictions/[id]/feedback/route.ts`
6. `/apps/web/src/app/api/analytics/model-performance/route.ts`
7. `/apps/web/src/app/api/analytics/struggle-reduction/route.ts`

**No schema changes required** - All models from Story 5.2 database schema already exist.

---

**Task 11 Status**: ✅ COMPLETE
