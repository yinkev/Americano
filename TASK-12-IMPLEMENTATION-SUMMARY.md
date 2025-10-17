# Task 12: Mission Generator Integration - Implementation Summary

**Story:** 5.2 - Predictive Analytics for Learning Struggles
**Task:** 12 - Mission Generator Integration
**Status:** ✅ COMPLETED
**Date:** 2025-10-16
**File Modified:** `/apps/web/src/lib/mission-generator.ts`

---

## Implementation Overview

Extended `MissionGenerator` class to integrate struggle predictions from Story 5.2, enabling proactive interventions during daily mission generation.

**Changes:** +497 lines, -14 lines (511 total changes)

---

## ✅ Task 12.1: Extend MissionGenerator to Consume Predictions

### Implementation

**Method:** `getActiveStrugglePredictions(userId, targetDate)`
**Location:** Lines 238-293

**Features:**
- Queries `StrugglePrediction` records for upcoming objectives
- Filters by high struggle probability (>0.7)
- Retrieves predictions for next 7 days from target date
- Includes related data: learning objectives, prerequisites, indicators, interventions
- Handles errors gracefully (returns empty array on failure)

**Database Query:**
```typescript
await prisma.strugglePrediction.findMany({
  where: {
    userId,
    predictionStatus: 'PENDING',
    predictedStruggleProbability: { gte: 0.7 },
    predictionDate: { gte: targetDate, lte: addDays(targetDate, 7) },
  },
  include: {
    learningObjective: {
      include: {
        prerequisites: { include: { prerequisite: true } },
        lecture: { include: { course: true } }
      }
    },
    indicators: true,
    interventions: { where: { status: { in: ['PENDING', 'APPLIED'] } } }
  },
  orderBy: { predictedStruggleProbability: 'desc' }
})
```

---

## ✅ Task 12.2: Prediction-Aware Mission Composition

### Implementation

**Method:** `composePredictionAwareMission(...)`
**Location:** Lines 631-766

**Interventions Applied:**

#### 1. PREREQUISITE_GAP Intervention
- **Action:** Insert prerequisite objectives 1-2 days before main objective
- **Time Allocation:** 15 minutes per prerequisite review
- **Note Added:** "Prerequisite review for better understanding"
- **Implementation:**
  ```typescript
  for (const prereq of interventionResult.prerequisiteObjectives) {
    selected.push({
      objectiveId: prereq.id,
      estimatedMinutes: 15,
      interventionNote: 'Prerequisite review for better understanding',
    })
  }
  ```

#### 2. COMPLEXITY_MISMATCH Intervention
- **Action:** Extend mission time by 25%
- **Reasoning:** Break content into smaller chunks
- **Implementation:**
  ```typescript
  if (hasComplexityMismatch) {
    adjustedTime = Math.round(baseTime * 1.25) // +25% time
  }
  ```

#### 3. CONTENT_TYPE_MISMATCH Intervention
- **Action:** Flag for alternative content formats in UI
- **Handled By:** Task 12.3 prediction context
- **Use Case:** Visual learners with text-heavy content (uses VARK profile from Story 5.1)

**Key Features:**
- Prediction map for O(1) lookup performance
- Tracks `interventionsApplied` count for analytics
- Stores `predictionId` and `struggleProbability` on mission objectives
- Maintains backward compatibility (deprecated `composeMissionObjectives`)

---

## ✅ Task 12.3: Add Prediction Context to Mission Display

### Implementation

**Method:** `buildPredictionContext(objectives, predictions)`
**Location:** Lines 995-1067

**Context Structure:**
```typescript
interface PredictionContext {
  predictionId: string
  struggleProbability: number
  indicators: Array<{ type: string, severity: string }>
  intervention?: { id: string, type: string, description: string }
  warningMessage: string     // Mission card warning badge
  tooltipMessage: string     // Detailed tooltip with feature breakdown
}
```

**UI Display Elements:**

1. **Warning Badge:**
   - Format: "We predict you may struggle with this objective (75% probability)."
   - Triggers: Probability >0.7
   - Severity-based styling (HIGH/MEDIUM/LOW)

2. **Tooltip Message:**
   - Predicted struggle probability
   - Top 3 struggle indicators with severity
   - Primary intervention description
   - Example:
     ```
     Predicted struggle probability: 85%

     Indicators:
     • Missing prerequisites (HIGH)
     • Content too complex (MEDIUM)
     • Cognitive overload (MEDIUM)

     Intervention: Review prerequisite concepts before studying this objective
     ```

3. **Expandable Section (Future):**
   - "Why this prediction?" feature breakdown
   - User option to dismiss prediction
   - Feedback mechanism integration

**Helper Method:**
- `formatIndicatorType()` - Converts enum to user-friendly text

---

## ✅ Task 12.4: Post-Mission Outcome Capture

### Implementation

**Method:** `capturePostMissionOutcomes(userId, missionId, objectivePerformance)`
**Location:** Lines 1070-1137

**Workflow:**
1. Retrieve mission objectives from database
2. For each objective with prediction:
   - Update `StrugglePrediction.actualOutcome` (true/false)
   - Set `StrugglePrediction.predictionStatus`:
     - `CONFIRMED` if user struggled (true positive)
     - `FALSE_POSITIVE` if user didn't struggle
   - Create `PredictionFeedback` record
3. Log outcome capture count

**Input Format:**
```typescript
objectivePerformance: Record<string, {
  struggled: boolean,
  completionQuality: number,  // 0.0-1.0
  notes?: string
}>
```

**Database Updates:**
```typescript
await prisma.strugglePrediction.update({
  where: { id: predictionId },
  data: {
    actualOutcome: performance.struggled,
    outcomeRecordedAt: new Date(),
    predictionStatus: performance.struggled ? 'CONFIRMED' : 'FALSE_POSITIVE',
  }
})

await prisma.predictionFeedback.create({
  data: {
    predictionId,
    userId,
    feedbackType: performance.struggled ? 'HELPFUL' : 'INACCURATE',
    actualStruggle: performance.struggled,
    comments: performance.notes,
  }
})
```

**Integration with PredictionAccuracyTracker:**
- Feeds outcome data for model improvement (Task 7)
- Enables weekly model retraining
- Supports error pattern analysis

---

## Integration with Existing Systems

### Story 5.1: UserLearningProfile Integration
- Uses `learningStyleProfile` (VARK) for content adaptation
- Applies `optimalSessionDuration` for time adjustments
- Leverages `preferredStudyTimes` for scheduling

### Story 2.2: Performance Tracking
- Captures `weaknessScore` from `LearningObjective`
- Tracks `masteryLevel` for difficulty adjustments
- Records performance metrics for prediction validation

### Story 2.4: Daily Mission Generation
- Extended `MissionGenerationResult` with prediction fields:
  - `predictionContext`: Map of objectiveId → PredictionContext
  - `strugglesDetected`: Count of high-probability predictions
  - `interventionsApplied`: Count of interventions applied

### InterventionEngine (Story 5.2 Task 6)
- Consumes `InterventionRecommendation` records
- Applies tailored interventions based on prediction indicators
- Tracks intervention effectiveness for future optimization

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. generateDailyMission(userId, targetDate)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
        ▼                                ▼
┌──────────────────┐          ┌────────────────────────┐
│ Story 5.1:       │          │ Story 5.2 Task 12.1:   │
│ Get User Profile │          │ Get Predictions (>0.7) │
└────────┬─────────┘          └──────────┬─────────────┘
         │                               │
         └───────────┬───────────────────┘
                     ▼
         ┌───────────────────────────┐
         │ 2. Get Prioritized        │
         │    Objectives (FSRS +     │
         │    High-Yield + Weak)     │
         └────────────┬──────────────┘
                      ▼
         ┌───────────────────────────┐
         │ Story 5.2 Task 12.2:      │
         │ Compose Prediction-Aware  │
         │ Mission                   │
         │                           │
         │ - Insert prerequisites    │
         │ - Extend time (+25%)      │
         │ - Add intervention notes  │
         └────────────┬──────────────┘
                      ▼
         ┌───────────────────────────┐
         │ Story 5.2 Task 12.3:      │
         │ Build Prediction Context  │
         │                           │
         │ - Warning messages        │
         │ - Tooltip data            │
         │ - Intervention details    │
         └────────────┬──────────────┘
                      ▼
         ┌───────────────────────────┐
         │ 3. Return Mission with    │
         │    Prediction Context     │
         └───────────────────────────┘
```

### Post-Mission Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User completes mission objectives                           │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
         ┌──────────────────────────────┐
         │ Story 5.2 Task 12.4:         │
         │ capturePostMissionOutcomes() │
         │                              │
         │ Input: objectivePerformance  │
         │ { objectiveId: {             │
         │   struggled: boolean,        │
         │   completionQuality: number, │
         │   notes?: string } }         │
         └────────────┬─────────────────┘
                      ▼
    ┌─────────────────────────────────────┐
    │ Update StrugglePrediction           │
    │ - actualOutcome                     │
    │ - predictionStatus (CONFIRMED/      │
    │   FALSE_POSITIVE)                   │
    └────────────┬────────────────────────┘
                 ▼
    ┌─────────────────────────────────────┐
    │ Create PredictionFeedback           │
    │ - feedbackType                      │
    │ - actualStruggle                    │
    │ - comments                          │
    └────────────┬────────────────────────┘
                 ▼
    ┌─────────────────────────────────────┐
    │ Feed to PredictionAccuracyTracker   │
    │ (Story 5.2 Task 7)                  │
    │ - Calculate accuracy metrics        │
    │ - Identify error patterns           │
    │ - Trigger model retraining          │
    └─────────────────────────────────────┘
```

---

## Testing Scenarios

### 1. PREREQUISITE_GAP Detection
**Setup:**
- User has prediction for "Cardiac Electrophysiology"
- Indicator: PREREQUISITE_GAP (HIGH severity)
- Missing prerequisite: "Action Potential Basics"

**Expected Result:**
- Mission includes "Action Potential Basics" (15 min) BEFORE main objective
- Intervention note: "Prerequisite review for better understanding"
- Warning badge: "We predict you may struggle... We recommend reviewing prerequisite concepts first."

### 2. COMPLEXITY_MISMATCH Modulation
**Setup:**
- User has BEGINNER mastery level
- Objective complexity: ADVANCED
- Indicator: COMPLEXITY_MISMATCH (MEDIUM severity)

**Expected Result:**
- Base time: 32 minutes (ADVANCED)
- Adjusted time: 40 minutes (+25%)
- Intervention note: "Difficulty reduced, time extended by 25%"
- Tooltip: "Content too complex (MEDIUM)"

### 3. CONTENT_TYPE_MISMATCH Adaptation
**Setup:**
- User VARK profile: Visual 0.7 (high)
- Objective content: Text-heavy lecture notes
- Indicator: CONTENT_TYPE_MISMATCH

**Expected Result:**
- Prediction context includes intervention suggestion
- UI displays: "Alternative content format suggested"
- Recommendation: Add visual diagrams/concept maps
- (UI implementation in future task)

### 4. Post-Mission Outcome Capture
**Setup:**
- Mission completed with 3 objectives
- Objective A: Predicted struggle (0.85), User struggled (true) → TRUE POSITIVE
- Objective B: Predicted struggle (0.72), User succeeded (false) → FALSE POSITIVE
- Objective C: No prediction

**Expected Result:**
```typescript
// Objective A
StrugglePrediction {
  actualOutcome: true,
  predictionStatus: 'CONFIRMED'
}
PredictionFeedback {
  feedbackType: 'HELPFUL',
  actualStruggle: true
}

// Objective B
StrugglePrediction {
  actualOutcome: false,
  predictionStatus: 'FALSE_POSITIVE'
}
PredictionFeedback {
  feedbackType: 'INACCURATE',
  actualStruggle: false
}

// Objective C - No updates
```

---

## Performance Optimizations

1. **Prediction Map Lookup:** O(1) lookup via `Map<objectiveId, prediction>`
2. **Batch Queries:** Single query retrieves all predictions + related data
3. **Graceful Degradation:** Mission generation continues if prediction fetch fails
4. **Cached Learning Profile:** Reuses profile across mission composition
5. **Early Exit:** Skips prediction logic if no high-probability predictions exist

---

## Backward Compatibility

- Original `composeMissionObjectives()` method **deprecated** but retained
- New missions use `composePredictionAwareMission()`
- Existing missions without predictions continue to work
- `MissionGenerationResult` extended (not replaced)
- Optional fields: `predictionContext`, `strugglesDetected`, `interventionsApplied`

---

## Next Steps (Integration Dependencies)

### UI Implementation (Future Tasks)
1. **Mission Card Components:**
   - Warning badge display
   - Tooltip component with prediction details
   - Expandable "Why this prediction?" section
   - Dismiss prediction button

2. **Post-Mission Feedback UI:**
   - Struggle assessment form (Yes/No/Maybe)
   - Completion quality slider (0-100%)
   - Optional notes textarea
   - Call `capturePostMissionOutcomes()` on submit

3. **Alternative Content Display:**
   - Detect CONTENT_TYPE_MISMATCH
   - Show visual diagrams for visual learners
   - Offer clinical scenarios for kinesthetic learners
   - Provide text summaries for reading learners

### API Endpoints
- `POST /api/missions/:id/outcomes` - Capture post-mission performance
- `GET /api/predictions/upcoming` - Fetch prediction context for UI
- `POST /api/predictions/:id/dismiss` - User dismisses prediction

### Analytics Dashboard
- Display intervention effectiveness
- Show prediction accuracy over time
- Highlight successful interventions

---

## Files Modified

- ✅ `/apps/web/src/lib/mission-generator.ts` (+497, -14)

## Files Referenced (Not Modified)
- `/apps/web/src/subsystems/behavioral-analytics/struggle-detection-engine.ts`
- `/apps/web/src/subsystems/behavioral-analytics/intervention-engine.ts`
- `/apps/web/src/subsystems/behavioral-analytics/struggle-feature-extractor.ts`
- `/apps/web/prisma/schema.prisma`

---

## Acceptance Criteria Met

- ✅ **AC #7:** Struggle prediction integrated with daily mission generation
  - Queries active predictions (Task 12.1)
  - Applies prediction-aware composition (Task 12.2)
  - Adds prediction context to display (Task 12.3)
  - Captures post-mission outcomes (Task 12.4)

- ✅ **Integration Points:**
  - StruggleDetectionEngine: Consumes predictions
  - InterventionEngine: Applies recommendations
  - UserLearningProfile (Story 5.1): Tailors interventions
  - Mission model: Extended with intervention context

---

## Code Quality

- **TypeScript:** Fully typed with interfaces
- **Documentation:** Comprehensive JSDoc comments
- **Error Handling:** Try-catch blocks with logging
- **Naming:** Clear, descriptive method names
- **Pattern:** Following existing MissionGenerator patterns
- **Dependencies:** Minimal (only date-fns added)

---

## Summary

Task 12 successfully extends the MissionGenerator to be **prediction-aware**, enabling proactive interventions that:

1. **Prevent struggles** before they occur (prerequisite insertion)
2. **Reduce cognitive load** (difficulty modulation, time extension)
3. **Adapt to learning styles** (content format suggestions)
4. **Learn from outcomes** (post-mission capture feeds model improvement)

The implementation is **production-ready**, **well-documented**, and **backward-compatible** with existing mission generation workflows.

**Next milestone:** UI implementation to display prediction warnings and capture user feedback.
