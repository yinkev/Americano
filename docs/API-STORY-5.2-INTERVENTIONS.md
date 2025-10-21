# Story 5.2: Predictive Analytics for Learning Struggles - API Documentation

**Status:** ✅ Complete
**Date:** 2025-10-16
**Tasks:** 5, 6, 11, 12

## Overview

This document describes the 7 API endpoints for the Struggle Prediction and Intervention system, which enables proactive learning support through machine learning predictions and tailored interventions.

## Table of Contents

1. [POST /api/analytics/predictions/generate](#1-post-apianalyticspredictionsgenerate)
2. [GET /api/analytics/predictions](#2-get-apianalyticspredictions)
3. [GET /api/analytics/interventions](#3-get-apianalyticsinterventions)
4. [POST /api/analytics/interventions/:id/apply](#4-post-apianalyticsinterventionsidapply)
5. [POST /api/analytics/predictions/:id/feedback](#5-post-apianalyticspredictionsidfeedback)
6. [GET /api/analytics/model-performance](#6-get-apianalyticsmodel-performance)
7. [GET /api/analytics/struggle-reduction](#7-get-apianalyticsstruggle-reduction)

---

## API Endpoints

### 1. POST /api/analytics/predictions/generate

**Purpose:** Trigger struggle prediction analysis for upcoming objectives

**Request:**
```typescript
POST /api/analytics/predictions/generate
Content-Type: application/json

{
  "userId": "string",         // Required
  "daysAhead": number         // Optional, default: 7 (range: 1-30)
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "predictions": StrugglePrediction[],  // Array of predictions with probability >0.5
    "alerts": StruggleAlert[],            // Top 5 prioritized alerts
    "summary": {
      "totalPredictions": number,
      "highRiskCount": number,            // Probability >= 0.7
      "mediumRiskCount": number,          // Probability 0.5-0.7
      "interventionsGenerated": number
    }
  }
}
```

**Example Request:**
```bash
curl -X POST https://americano.dev/api/analytics/predictions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "daysAhead": 14
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "id": "pred_abc123",
        "userId": "user_123",
        "learningObjectiveId": "obj_456",
        "predictedStruggleProbability": 0.85,
        "predictionConfidence": 0.78,
        "predictionStatus": "PENDING",
        "predictionDate": "2025-10-18T00:00:00Z",
        "featureVector": {
          "retentionScore": 0.42,
          "prerequisiteGapCount": 0.67,
          "complexityMismatch": 0.71
        }
      }
    ],
    "alerts": [
      {
        "id": "pred_abc123",
        "type": "PROACTIVE_WARNING",
        "title": "Potential struggle predicted: Cardiac electrophysiology...",
        "message": "You may struggle with this topic in 2 days. 85% probability.",
        "severity": "HIGH",
        "priority": 82,
        "createdAt": "2025-10-16T10:30:00Z"
      }
    ],
    "summary": {
      "totalPredictions": 5,
      "highRiskCount": 2,
      "mediumRiskCount": 3,
      "interventionsGenerated": 4
    }
  }
}
```

**Alert Types:**
- `PROACTIVE_WARNING` - General struggle prediction
- `PREREQUISITE_ALERT` - Missing prerequisite knowledge
- `REAL_TIME_ALERT` - Detected during active study session
- `INTERVENTION_SUGGESTION` - Specific intervention recommended

**Priority Calculation:**
```
priority = urgency(0.4) + confidence(0.3) + severity(0.2) + cognitiveLoad(0.1)
```

---

### 2. GET /api/analytics/predictions

**Purpose:** Query stored predictions with filtering

**Request:**
```
GET /api/analytics/predictions?userId={userId}&status={status}&minProbability={minProbability}
```

**Query Parameters:**
- `userId` (string, default: "kevy@americano.dev") - User ID
- `status` (enum, optional) - Filter by prediction status
  - `PENDING` - Not yet studied
  - `CONFIRMED` - User did struggle (true positive)
  - `FALSE_POSITIVE` - User didn't struggle
  - `MISSED` - User struggled but not predicted
- `minProbability` (float, optional, default: 0.5) - Minimum probability (0.0-1.0)

**Response:**
```typescript
{
  "success": true,
  "data": {
    "predictions": Array<{
      id: string,
      userId: string,
      learningObjectiveId: string,
      predictedStruggleProbability: number,
      predictionConfidence: number,
      predictionStatus: PredictionStatus,
      actualOutcome: boolean | null,
      predictionDate: string,
      learningObjective: {
        objective: string,
        complexity: "BASIC" | "INTERMEDIATE" | "ADVANCED",
        lecture: {
          title: string,
          course: {
            name: string
          }
        }
      },
      indicators: StruggleIndicator[],
      interventions: InterventionRecommendation[],
      feedbacks: PredictionFeedback[]
    }>,
    "stats": {
      "total": number,
      "pending": number,
      "confirmed": number,
      "falsePositives": number,
      "missed": number,
      "avgProbability": number,
      "avgConfidence": number
    }
  }
}
```

**Example Request:**
```bash
curl "https://americano.dev/api/analytics/predictions?userId=user_123&status=PENDING&minProbability=0.7"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "id": "pred_abc123",
        "userId": "user_123",
        "learningObjectiveId": "obj_456",
        "predictedStruggleProbability": 0.85,
        "predictionConfidence": 0.78,
        "predictionStatus": "PENDING",
        "actualOutcome": null,
        "predictionDate": "2025-10-18T00:00:00Z",
        "learningObjective": {
          "objective": "Understand cardiac action potential mechanisms",
          "complexity": "ADVANCED",
          "lecture": {
            "title": "Cardiac Physiology",
            "course": {
              "name": "Cardiovascular System"
            }
          }
        },
        "indicators": [
          {
            "indicatorType": "PREREQUISITE_GAP",
            "severity": "HIGH",
            "context": {
              "featureName": "Prerequisite gaps",
              "featureValue": 0.67
            }
          }
        ],
        "interventions": [
          {
            "interventionType": "PREREQUISITE_REVIEW",
            "description": "Review prerequisite concepts before studying this objective",
            "priority": 9,
            "status": "PENDING"
          }
        ],
        "feedbacks": []
      }
    ],
    "stats": {
      "total": 5,
      "pending": 5,
      "confirmed": 0,
      "falsePositives": 0,
      "missed": 0,
      "avgProbability": 0.72,
      "avgConfidence": 0.75
    }
  }
}
```

---

### 3. GET /api/analytics/interventions

**Purpose:** Retrieve active intervention recommendations

**Request:**
```
GET /api/analytics/interventions?userId={userId}
```

**Query Parameters:**
- `userId` (string, default: "kevy@americano.dev") - User ID

**Response:**
```typescript
{
  "success": true,
  "data": {
    "interventions": InterventionRecommendation[],
    "grouped": Record<InterventionType, InterventionRecommendation[]>,
    "effectivenessByType": Record<InterventionType, {
      avg: number,
      count: number,
      total: number
    }>,
    "summary": {
      "totalActive": number,
      "pending": number,
      "applied": number,
      "avgPriority": number
    }
  }
}
```

**Intervention Types:**
1. `PREREQUISITE_REVIEW` - Review prerequisites (priority: 9)
2. `DIFFICULTY_PROGRESSION` - Start with easier content (priority: 8)
3. `CONTENT_FORMAT_ADAPT` - Alternative content formats (priority: 7)
4. `COGNITIVE_LOAD_REDUCE` - Break into smaller chunks (priority: 8)
5. `SPACED_REPETITION_BOOST` - Increase review frequency (priority: 6)
6. `BREAK_SCHEDULE_ADJUST` - More frequent breaks (priority: 5)

**Example Request:**
```bash
curl "https://americano.dev/api/analytics/interventions?userId=user_123"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "interventions": [
      {
        "id": "int_789",
        "predictionId": "pred_abc123",
        "userId": "user_123",
        "interventionType": "PREREQUISITE_REVIEW",
        "description": "Review prerequisite concepts before studying this objective",
        "reasoning": "You have 2 prerequisite concepts that need review. Mastering these first will improve understanding.",
        "priority": 9,
        "status": "PENDING",
        "typeEffectiveness": 0.83
      }
    ],
    "grouped": {
      "PREREQUISITE_REVIEW": [
        { /* intervention details */ }
      ],
      "COGNITIVE_LOAD_REDUCE": [
        { /* intervention details */ }
      ]
    },
    "effectivenessByType": {
      "PREREQUISITE_REVIEW": {
        "avg": 0.83,
        "count": 12,
        "total": 9.96
      }
    },
    "summary": {
      "totalActive": 4,
      "pending": 3,
      "applied": 1,
      "avgPriority": 7.5
    }
  }
}
```

---

### 4. POST /api/analytics/interventions/:id/apply

**Purpose:** Apply intervention recommendation to mission queue

**Request:**
```typescript
POST /api/analytics/interventions/:id/apply
Content-Type: application/json

{
  "applyToMissionId": "string"  // Optional - specific mission or next available
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "intervention": InterventionRecommendation,  // Updated with status: APPLIED
    "mission": Mission,                          // Modified mission with intervention
    "result": {
      "success": true,
      "interventionId": string,
      "missionId": string,
      "message": string,
      "appliedActions": string[]                // List of modifications made
    }
  }
}
```

**Intervention Actions by Type:**

**PREREQUISITE_REVIEW:**
- Inserts prerequisite objectives before main objective
- Estimated time: 15 minutes per prerequisite
- Adds intervention note: "Prerequisite review for better understanding"

**DIFFICULTY_PROGRESSION:**
- Enables "start with basics" mode
- Extends time by 25%
- Reduces initial complexity

**COGNITIVE_LOAD_REDUCE:**
- Reduces mission duration by 50%
- Reduces each objective time by 50%
- Adds break reminders

**SPACED_REPETITION_BOOST:**
- Marks objective for increased review frequency
- Sets custom intervals: [1, 3, 7] days

**BREAK_SCHEDULE_ADJUST:**
- Inserts 5-minute breaks every 25 minutes (Pomodoro-style)

**Example Request:**
```bash
curl -X POST https://americano.dev/api/analytics/interventions/int_789/apply \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "intervention": {
      "id": "int_789",
      "interventionType": "PREREQUISITE_REVIEW",
      "status": "APPLIED",
      "appliedAt": "2025-10-16T11:00:00Z",
      "appliedToMissionId": "mission_xyz"
    },
    "mission": {
      "id": "mission_xyz",
      "estimatedMinutes": 45,
      "objectives": [
        {
          "objectiveId": "obj_prereq1",
          "estimatedMinutes": 15,
          "interventionNote": "Prerequisite review for better understanding"
        },
        {
          "objectiveId": "obj_456",
          "estimatedMinutes": 30
        }
      ]
    },
    "result": {
      "success": true,
      "interventionId": "int_789",
      "missionId": "mission_xyz",
      "message": "Intervention applied successfully to mission mission_xyz",
      "appliedActions": [
        "Created new mission for intervention",
        "Inserted 2 prerequisite reviews"
      ]
    }
  }
}
```

**Error Responses:**
- `404 NOT_FOUND` - Intervention not found
- `409 CONFLICT` - Intervention already applied
- `500 INTERNAL_ERROR` - Application failed

---

### 5. POST /api/analytics/predictions/:id/feedback

**Purpose:** Record user feedback on prediction accuracy

**Request:**
```typescript
POST /api/analytics/predictions/:id/feedback
Content-Type: application/json

{
  "actualStruggle": boolean,     // Required - Did you actually struggle?
  "feedbackType": FeedbackType,  // Required
  "comments": string             // Optional - Additional feedback
}
```

**Feedback Types:**
- `HELPFUL` - Prediction was helpful
- `NOT_HELPFUL` - Prediction wasn't helpful
- `INACCURATE` - Prediction was wrong
- `INTERVENTION_GOOD` - Intervention worked well
- `INTERVENTION_BAD` - Intervention didn't help

**Response:**
```typescript
{
  "success": true,
  "data": {
    "feedbackRecorded": true,
    "feedbackId": string,
    "prediction": StrugglePrediction,  // Updated with actualOutcome
    "modelAccuracyUpdate": number,     // New accuracy (0-1)
    "metrics": {
      "accuracy": number,
      "precision": number,
      "recall": number,
      "f1Score": number,
      "calibration": number,
      "truePositives": number,
      "trueNegatives": number,
      "falsePositives": number,
      "falseNegatives": number,
      "totalPredictions": number
    },
    "message": string
  }
}
```

**Prediction Status Updates:**
- If `actualStruggle = true` and `probability >= 0.5` → `CONFIRMED` (True Positive)
- If `actualStruggle = true` and `probability < 0.5` → `MISSED` (False Negative)
- If `actualStruggle = false` and `probability >= 0.5` → `FALSE_POSITIVE`
- If `actualStruggle = false` and `probability < 0.5` → `CONFIRMED` (True Negative)

**Example Request:**
```bash
curl -X POST https://americano.dev/api/analytics/predictions/pred_abc123/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "actualStruggle": true,
    "feedbackType": "HELPFUL",
    "comments": "The prediction was accurate and the prerequisite review helped a lot!"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "feedbackRecorded": true,
    "feedbackId": "feedback_123",
    "prediction": {
      "id": "pred_abc123",
      "predictedStruggleProbability": 0.85,
      "actualOutcome": true,
      "predictionStatus": "CONFIRMED",
      "outcomeRecordedAt": "2025-10-16T11:15:00Z"
    },
    "modelAccuracyUpdate": 0.78,
    "metrics": {
      "accuracy": 0.78,
      "precision": 0.82,
      "recall": 0.85,
      "f1Score": 0.835,
      "calibration": 0.88,
      "truePositives": 17,
      "trueNegatives": 15,
      "falsePositives": 4,
      "falseNegatives": 3,
      "totalPredictions": 39
    },
    "message": "Thank you for your feedback! Model accuracy is now 78%."
  }
}
```

**Model Improvement Trigger:**
- Accuracy < 70% → Immediate retraining recommended
- Weekly retraining cycle with new feedback data
- Feature importance recalculation

---

### 6. GET /api/analytics/model-performance

**Purpose:** Retrieve current model accuracy metrics

**Request:**
```
GET /api/analytics/model-performance?userId={userId}
```

**Query Parameters:**
- `userId` (string, default: "kevy@americano.dev") - User ID

**Response:**
```typescript
{
  "success": true,
  "data": {
    "accuracy": number,           // Overall accuracy (0-1)
    "precision": number,          // TP / (TP + FP)
    "recall": number,             // TP / (TP + FN)
    "f1Score": number,            // Harmonic mean of precision & recall
    "calibration": number,        // Calibration score (0-1)
    "lastUpdated": string | null, // ISO date of last feedback
    "dataPoints": number,         // Total predictions with feedback
    "confusionMatrix": {
      "truePositives": number,
      "trueNegatives": number,
      "falsePositives": number,
      "falseNegatives": number
    },
    "trends": Array<{
      week: string,
      weekStart: string,
      weekEnd: string,
      accuracy: number,
      dataPoints: number
    }>,
    "featureImportance": Array<{
      feature: string,
      importance: number,
      occurrences: number
    }>,
    "summary": {
      "overallHealth": "Excellent" | "Good" | "Fair" | "Needs Improvement",
      "recommendation": string
    }
  }
}
```

**Health Status Thresholds:**
- **Excellent:** accuracy >= 80%
- **Good:** accuracy >= 70%
- **Fair:** accuracy >= 60%
- **Needs Improvement:** accuracy < 60%

**Example Request:**
```bash
curl "https://americano.dev/api/analytics/model-performance?userId=user_123"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "accuracy": 0.78,
    "precision": 0.82,
    "recall": 0.85,
    "f1Score": 0.835,
    "calibration": 0.88,
    "lastUpdated": "2025-10-16T11:15:00Z",
    "dataPoints": 39,
    "confusionMatrix": {
      "truePositives": 17,
      "trueNegatives": 15,
      "falsePositives": 4,
      "falseNegatives": 3
    },
    "trends": [
      {
        "week": "Week 1",
        "weekStart": "2025-09-18",
        "weekEnd": "2025-09-25",
        "accuracy": 0.65,
        "dataPoints": 8
      },
      {
        "week": "Week 8",
        "weekStart": "2025-10-09",
        "weekEnd": "2025-10-16",
        "accuracy": 0.82,
        "dataPoints": 11
      }
    ],
    "featureImportance": [
      {
        "feature": "prerequisiteGapCount",
        "importance": 0.78,
        "occurrences": 39
      },
      {
        "feature": "retentionScore",
        "importance": 0.72,
        "occurrences": 39
      },
      {
        "feature": "complexityMismatch",
        "importance": 0.65,
        "occurrences": 35
      }
    ],
    "summary": {
      "overallHealth": "Good",
      "recommendation": "Model is performing well. Continue collecting feedback to maintain accuracy."
    }
  }
}
```

---

### 7. GET /api/analytics/struggle-reduction

**Purpose:** Measure reduction in learning struggles since predictive system activation

**Request:**
```
GET /api/analytics/struggle-reduction?userId={userId}&period={period}
```

**Query Parameters:**
- `userId` (string, default: "kevy@americano.dev") - User ID
- `period` (enum, default: "month") - Time period
  - `week` - Last 7 days
  - `month` - Last 30 days
  - `all` - Since predictive system activated

**Response:**
```typescript
{
  "success": true,
  "data": {
    "baselineRate": number,          // Struggle rate before predictions (0-1)
    "currentRate": number,           // Recent struggle rate (0-1)
    "reductionPercentage": number,   // % improvement
    "timeline": Array<{
      period: string,
      date: string,
      struggleRate: number | null,
      reviewCount: number
    }>,
    "interventionEffectiveness": Array<{
      interventionType: string,
      count: number,
      avgEffectiveness: number,
      description: string
    }>,
    "summary": {
      "improvementStatus": "Excellent" | "Good" | "Moderate" | "Minimal",
      "message": string,
      "baselineContext": string,
      "currentContext": string
    }
  }
}
```

**Struggle Rate Calculation:**
```
struggleRate = (AGAIN + HARD reviews) / Total reviews
```

**Reduction Percentage:**
```
reduction = ((baselineRate - currentRate) / baselineRate) × 100
```

**Improvement Status Thresholds:**
- **Excellent:** reduction >= 25%
- **Good:** reduction >= 15%
- **Moderate:** reduction >= 5%
- **Minimal:** reduction < 5%

**Example Request:**
```bash
curl "https://americano.dev/api/analytics/struggle-reduction?userId=user_123&period=month"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "baselineRate": 0.42,
    "currentRate": 0.28,
    "reductionPercentage": 33.33,
    "timeline": [
      {
        "period": "Oct 02",
        "date": "2025-10-02",
        "struggleRate": 0.45,
        "reviewCount": 22
      },
      {
        "period": "Oct 09",
        "date": "2025-10-09",
        "struggleRate": 0.35,
        "reviewCount": 31
      },
      {
        "period": "Oct 16",
        "date": "2025-10-16",
        "struggleRate": 0.25,
        "reviewCount": 28
      }
    ],
    "interventionEffectiveness": [
      {
        "interventionType": "PREREQUISITE_REVIEW",
        "count": 8,
        "avgEffectiveness": 0.85,
        "description": "Review prerequisite concepts before studying"
      },
      {
        "interventionType": "COGNITIVE_LOAD_REDUCE",
        "count": 5,
        "avgEffectiveness": 0.72,
        "description": "Break topics into smaller chunks with breaks"
      }
    ],
    "summary": {
      "improvementStatus": "Excellent",
      "message": "Your struggle rate has decreased by 33% since using predictive analytics!",
      "baselineContext": "Baseline period: Aug 15, 2025 - Sep 26, 2025",
      "currentContext": "Current period: Sep 16, 2025 - Oct 16, 2025"
    }
  }
}
```

---

## Integration with Mission Generator

The `MissionGenerator` class (Task 12) has been enhanced to consume struggle predictions:

### Prediction-Aware Mission Composition

**File:** `/Users/kyin/Projects/Americano-epic5/apps/web/src/lib/mission-generator.ts`

**Key Features:**

1. **Query Active Predictions** (lines 245-293)
   - Retrieves predictions with probability >0.7 in next 7 days
   - Includes learning objectives, indicators, and interventions

2. **Proactive Prerequisite Insertion** (lines 956-964)
   - Adds prerequisite reviews 1-2 days before predicted struggle
   - 15-minute time allocation per prerequisite
   - Intervention note added to mission objectives

3. **Difficulty Modulation** (lines 966-974)
   - Extends time by 25% for COMPLEXITY_MISMATCH
   - Reduces mission complexity appropriately

4. **Content Format Adaptation** (lines 976-983)
   - Suggests alternative content formats for CONTENT_TYPE_MISMATCH
   - VARK-based recommendations from Story 5.1

5. **Prediction Context Display** (lines 1002-1067)
   - Warning badges on mission cards
   - Tooltips with prediction probability and indicators
   - Intervention descriptions and reasoning

6. **Post-Mission Outcome Capture** (lines 1077-1137)
   - Records actual struggle outcomes after mission completion
   - Updates prediction status (CONFIRMED/FALSE_POSITIVE)
   - Creates feedback for model improvement

### Mission Display Enhancements

**Prediction Context Structure:**
```typescript
interface PredictionContext {
  predictionId: string
  struggleProbability: number
  indicators: Array<{
    type: string
    severity: string
  }>
  intervention?: {
    id: string
    type: string
    description: string
  }
  warningMessage: string
  tooltipMessage: string
}
```

**Example Mission with Prediction:**
```json
{
  "objectives": [
    {
      "objectiveId": "obj_456",
      "estimatedMinutes": 37,
      "predictionId": "pred_abc123",
      "struggleProbability": 0.85
    }
  ],
  "predictionContext": {
    "obj_456": {
      "predictionId": "pred_abc123",
      "struggleProbability": 0.85,
      "indicators": [
        { "type": "PREREQUISITE_GAP", "severity": "HIGH" }
      ],
      "intervention": {
        "id": "int_789",
        "type": "PREREQUISITE_REVIEW",
        "description": "Review prerequisite concepts first"
      },
      "warningMessage": "We predict you may struggle with this objective (85% probability).",
      "tooltipMessage": "Predicted struggle probability: 85%\n\nIndicators:\n• Missing prerequisites (HIGH)\n\nIntervention: Review prerequisite concepts first"
    }
  },
  "strugglesDetected": 1,
  "interventionsApplied": 1
}
```

---

## Error Handling

All endpoints use the standardized error response format:

```typescript
{
  "success": false,
  "error": {
    "code": string,          // Error code (e.g., "NOT_FOUND", "VALIDATION_ERROR")
    "message": string,       // Human-readable error message
    "details": any           // Additional error details (optional)
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Invalid request parameters
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource state conflict (e.g., already applied)
- `INTERNAL_ERROR` - Server error

**Example Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "field": "daysAhead",
      "error": "Number must be less than or equal to 30"
    }
  }
}
```

---

## Testing Examples

### End-to-End Workflow

**1. Generate Predictions:**
```bash
curl -X POST http://localhost:3000/api/analytics/predictions/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "kevy@americano.dev", "daysAhead": 7}'
```

**2. View Predictions:**
```bash
curl "http://localhost:3000/api/analytics/predictions?userId=kevy@americano.dev&status=PENDING"
```

**3. Check Interventions:**
```bash
curl "http://localhost:3000/api/analytics/interventions?userId=kevy@americano.dev"
```

**4. Apply Intervention:**
```bash
curl -X POST http://localhost:3000/api/analytics/interventions/{interventionId}/apply \
  -H "Content-Type: application/json" \
  -d '{}'
```

**5. Submit Feedback:**
```bash
curl -X POST http://localhost:3000/api/analytics/predictions/{predictionId}/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "actualStruggle": true,
    "feedbackType": "HELPFUL",
    "comments": "The prediction was accurate!"
  }'
```

**6. Check Model Performance:**
```bash
curl "http://localhost:3000/api/analytics/model-performance?userId=kevy@americano.dev"
```

**7. View Struggle Reduction:**
```bash
curl "http://localhost:3000/api/analytics/struggle-reduction?userId=kevy@americano.dev&period=month"
```

---

## Performance Targets

As specified in Story 5.2:

- **Prediction Generation:** <2s (background job)
- **Query Endpoints:** <200ms (cached)
- **Feedback Submission:** <100ms
- **Model Accuracy:** >75% (target: 80%)
- **Recall:** >70% (prioritize catching struggles)
- **Precision:** >65% (minimize false alarms)

---

## Notes

1. **Next.js 15 Async Params:** All route handlers use `await params` pattern for dynamic segments
2. **Zod Validation:** All request bodies and query parameters are validated with Zod schemas
3. **Error Handling:** Wrapped with `withErrorHandler` for standardized error responses
4. **Caching:** GET endpoints support caching with appropriate cache headers
5. **Model Improvement:** Weekly retraining triggered automatically when feedback accumulates

---

## References

- **Story Definition:** `/Users/kyin/Projects/Americano-epic5/docs/stories/story-5.2.md`
- **MissionGenerator:** `/Users/kyin/Projects/Americano-epic5/apps/web/src/lib/mission-generator.ts`
- **StruggleDetectionEngine:** `/Users/kyin/Projects/Americano-epic5/apps/web/src/subsystems/behavioral-analytics/struggle-detection-engine.ts`
- **InterventionEngine:** `/Users/kyin/Projects/Americano-epic5/apps/web/src/subsystems/behavioral-analytics/intervention-engine.ts`
- **Database Schema:** `/Users/kyin/Projects/Americano-epic5/apps/web/prisma/schema.prisma` (lines 628-762)
