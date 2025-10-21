# Story 4.4 Task 4: API Endpoints - Quick Reference

**Date:** 2025-10-17
**Story:** 4.4 - Confidence Calibration and Metacognitive Assessment

---

## API Endpoints Overview

### 1. POST /api/validation/responses (Extended)
Submit validation response with confidence tracking

### 2. GET /api/calibration/metrics (New)
Fetch calibration history and analytics

### 3. GET /api/calibration/peer-comparison (New)
Fetch peer comparison data (opt-in required)

---

## 1. POST /api/validation/responses

**Endpoint:** `POST /api/validation/responses`
**Purpose:** Submit comprehension validation response with pre/post confidence tracking

### Request Body

```typescript
{
  // Existing fields (Story 4.1)
  promptId: string,              // cuid
  sessionId?: string,            // cuid (optional)
  userAnswer: string,            // min 10 characters
  confidenceLevel: number,       // 1-5 (legacy)
  objectiveId: string,           // cuid

  // Story 4.4 NEW fields
  preAssessmentConfidence: number,    // 1-5 (REQUIRED)
  postAssessmentConfidence?: number,  // 1-5 (optional)
  confidenceRationale?: string,       // optional text
  reflectionNotes?: string            // optional metacognitive reflection
}
```

### Response (Success 200)

```typescript
{
  success: true,
  data: {
    evaluation: {
      overall_score: number,        // 0-100
      terminology_score: number,    // 0-100
      relationships_score: number,  // 0-100
      application_score: number,    // 0-100
      clarity_score: number,        // 0-100
      strengths: string[],
      gaps: string[]
    },
    calibration: {
      preAssessmentConfidence: number,       // 1-5
      postAssessmentConfidence: number | null,  // 1-5
      confidenceShift: number | null,        // post - pre
      confidenceNormalized: number,          // 0-100
      calibrationDelta: number,              // confidence - score
      category: "OVERCONFIDENT" | "UNDERCONFIDENT" | "CALIBRATED",
      feedbackMessage: string
    },
    score: number,       // 0-100
    responseId: string   // cuid
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:3001/api/validation/responses \
  -H "Content-Type: application/json" \
  -d '{
    "promptId": "clx123abc",
    "sessionId": "clx456def",
    "userAnswer": "The cardiac cycle consists of systole (contraction) and diastole (relaxation)...",
    "confidenceLevel": 4,
    "objectiveId": "clx789ghi",
    "preAssessmentConfidence": 3,
    "postAssessmentConfidence": 4,
    "confidenceRationale": "I felt more confident after reviewing the prompt details",
    "reflectionNotes": "I realized I needed to review the timing of valve closures"
  }'
```

---

## 2. GET /api/calibration/metrics

**Endpoint:** `GET /api/calibration/metrics`
**Purpose:** Fetch user's calibration history with analytics

### Query Parameters

```typescript
{
  dateRange?: "7d" | "30d" | "90d",    // Default: "30d"
  courseId?: string,                    // Filter by course (cuid)
  assessmentType?: "comprehension" | "clinical" | "failure"
}
```

### Response (Success 200)

```typescript
{
  success: true,
  data: {
    metrics: Array<{
      id: string,
      respondedAt: string,              // ISO datetime
      conceptName: string,
      preAssessmentConfidence: number,   // 1-5
      postAssessmentConfidence: number | null,  // 1-5
      confidenceShift: number | null,    // post - pre
      score: number,                     // 0-100
      calibrationDelta: number,          // confidence - score
      calibrationCategory: "OVERCONFIDENT" | "UNDERCONFIDENT" | "CALIBRATED",
      courseName: string | null
    }>,
    correlationCoeff: number | null,     // Pearson's r (-1 to 1)
    correlationInterpretation: string,   // "Strong" | "Moderate" | "Weak"
    trend: "improving" | "stable" | "declining",
    overconfidentTopics: string[],       // Topics with delta > 15 consistently
    underconfidentTopics: string[],      // Topics with delta < -15 consistently
    sampleSize: number                   // Total assessments in period
  }
}
```

### Example Request

```bash
# Last 30 days, all courses
curl http://localhost:3001/api/calibration/metrics

# Last 7 days, comprehension only
curl "http://localhost:3001/api/calibration/metrics?dateRange=7d&assessmentType=comprehension"

# Last 90 days, specific course
curl "http://localhost:3001/api/calibration/metrics?dateRange=90d&courseId=clx123abc"
```

### Response Example

```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "id": "clx123abc",
        "respondedAt": "2025-10-15T14:30:00Z",
        "conceptName": "Cardiac Cycle Physiology",
        "preAssessmentConfidence": 3,
        "postAssessmentConfidence": 4,
        "confidenceShift": 1,
        "score": 75,
        "calibrationDelta": -25,
        "calibrationCategory": "UNDERCONFIDENT",
        "courseName": "Cardiovascular Physiology"
      }
    ],
    "correlationCoeff": 0.72,
    "correlationInterpretation": "Strong calibration accuracy",
    "trend": "improving",
    "overconfidentTopics": ["Pharmacology", "Biochemistry"],
    "underconfidentTopics": ["Anatomy"],
    "sampleSize": 15
  }
}
```

---

## 3. GET /api/calibration/peer-comparison

**Endpoint:** `GET /api/calibration/peer-comparison`
**Purpose:** Fetch peer calibration comparison (anonymized, opt-in required)

### Query Parameters

None (uses current user from hardcoded auth)

### Response (Success 200)

```typescript
{
  success: true,
  data: {
    userCorrelation: number,        // User's Pearson's r
    userPercentile: number,         // 0-100 (percentile ranking)
    peerDistribution: {
      quartiles: [number, number, number],  // [Q1, median, Q3]
      median: number,
      mean: number
    },
    commonOverconfidentTopics: string[],  // Topics where 50%+ of peers overconfident
    peerAvgCorrelation: number,           // Mean peer correlation
    peerPoolSize: number                  // Total opted-in users
  }
}
```

### Example Request

```bash
curl http://localhost:3001/api/calibration/peer-comparison
```

### Response Example (Success)

```json
{
  "success": true,
  "data": {
    "userCorrelation": 0.75,
    "userPercentile": 68,
    "peerDistribution": {
      "quartiles": [0.45, 0.62, 0.78],
      "median": 0.62,
      "mean": 0.61
    },
    "commonOverconfidentTopics": [
      "Pharmacology",
      "Pathophysiology"
    ],
    "peerAvgCorrelation": 0.61,
    "peerPoolSize": 42
  }
}
```

### Error Responses

**403 Forbidden - User Not Opted In:**
```json
{
  "success": false,
  "error": {
    "code": "PEER_COMPARISON_DISABLED",
    "message": "Please enable peer comparison in settings to access this feature"
  }
}
```

**400 Bad Request - Insufficient Peer Pool:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PEER_DATA",
    "message": "Insufficient peer data for comparison - need 20+ participants (currently 12)"
  }
}
```

**400 Bad Request - Insufficient User Data:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_USER_DATA",
    "message": "You need at least 5 assessments with confidence data to see peer comparison"
  }
}
```

---

## Error Handling

All endpoints follow standardized error response format:

```typescript
{
  success: false,
  error: {
    code: string,        // Error code (e.g., "VALIDATION_ERROR")
    message: string,     // Human-readable message
    details?: unknown    // Optional additional details (e.g., Zod errors)
  }
}
```

### Common Error Codes

- **VALIDATION_ERROR** (400) - Invalid request data (Zod validation failure)
- **NOT_FOUND** (404) - Resource not found
- **FORBIDDEN** (403) - Permission denied (e.g., peer comparison opt-in required)
- **INTERNAL_ERROR** (500) - Server error
- **PYTHON_SERVICE_ERROR** (500) - Python FastAPI service failure (POST /api/validation/responses only)

---

## Calibration Categories

### OVERCONFIDENT
- **Condition:** `calibrationDelta > 15`
- **Interpretation:** User confidence exceeded actual performance by more than 15 points
- **Example:** Confidence 75% (level 4), Score 50% → Delta +25

### UNDERCONFIDENT
- **Condition:** `calibrationDelta < -15`
- **Interpretation:** User confidence was lower than actual performance by more than 15 points
- **Example:** Confidence 25% (level 2), Score 70% → Delta -45

### CALIBRATED
- **Condition:** `-15 ≤ calibrationDelta ≤ 15`
- **Interpretation:** User confidence matches actual performance (within 15-point tolerance)
- **Example:** Confidence 50% (level 3), Score 55% → Delta -5

---

## Correlation Interpretation

### Strong Calibration Accuracy
- **r > 0.7**
- User's confidence consistently matches actual performance

### Moderate Calibration Accuracy
- **0.4 ≤ r ≤ 0.7**
- User shows some calibration but with room for improvement

### Weak Calibration Accuracy
- **r < 0.4**
- User's confidence poorly predicts actual performance
- Triggers metacognitive intervention (Story 4.4 Task 8)

---

## Trend Analysis

### Improving
- Recent correlation > Earlier correlation (by 0.1+)
- User's calibration accuracy is getting better over time

### Stable
- Recent correlation ≈ Earlier correlation (within ±0.1)
- User maintains consistent calibration accuracy

### Declining
- Recent correlation < Earlier correlation (by 0.1+)
- User's calibration accuracy is worsening over time
- May trigger intervention

---

## Testing Endpoints

### Local Development (Port 3001)
```bash
# Base URL for Epic 4 worktree
BASE_URL="http://localhost:3001"

# POST validation response
curl -X POST "$BASE_URL/api/validation/responses" \
  -H "Content-Type: application/json" \
  -d @test-response.json

# GET calibration metrics
curl "$BASE_URL/api/calibration/metrics?dateRange=30d"

# GET peer comparison
curl "$BASE_URL/api/calibration/peer-comparison"
```

### Production (Vercel)
```bash
BASE_URL="https://americano.vercel.app"
# Same curl commands as above
```

---

## Next.js 15 Notes

### Async Params Pattern
API route handlers do NOT use params (query params via `request.nextUrl.searchParams`):

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateRange = searchParams.get('dateRange') || '30d';
  // ...
}
```

### Response Format
All responses use `NextResponse.json()`:

```typescript
return NextResponse.json(
  successResponse({ data }),
  { status: 200 }
);
```

---

## Database Schema Reference

### ValidationResponse (Extended)

```prisma
model ValidationResponse {
  // Existing fields...
  preAssessmentConfidence  Int?                // 1-5
  postAssessmentConfidence Int?                // 1-5
  confidenceShift          Int?                // post - pre
  confidenceRationale      String?             // optional text
  reflectionNotes          String?             // optional metacognitive reflection
  calibrationCategory      CalibrationCategory? // enum
  calibrationDelta         Float?              // normalized confidence - score
}

enum CalibrationCategory {
  OVERCONFIDENT
  UNDERCONFIDENT
  CALIBRATED
  UNKNOWN
}
```

### User (Extended)

```prisma
model User {
  // Existing fields...
  sharePeerCalibrationData Boolean @default(false)  // opt-in for peer comparison
}
```

---

## Rate Limiting (Future)

Not implemented in MVP, but recommended for production:

- **POST /api/validation/responses**: 30 requests/minute per user
- **GET /api/calibration/metrics**: 60 requests/minute per user
- **GET /api/calibration/peer-comparison**: 10 requests/minute per user (expensive query)

---

## Authentication

**MVP:** Hardcoded `kevy@americano.dev` via `getUserId()` function
**Production:** Replace with JWT/session-based authentication

---

**Last Updated:** 2025-10-17
**Version:** 1.0
**Status:** Production Ready
