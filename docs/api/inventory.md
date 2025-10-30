# Americano Backend API Inventory

**Generated:** 2025-10-29

This document provides a comprehensive inventory of the Americano backend API endpoints for frontend integration.

---

## Service Overview

Americano consists of two FastAPI microservices:

1. **Main API Service** (`apps/api`) - Port 8000
2. **ML Service** (`apps/ml-service`) - Port 8001

Both services are configured for Next.js frontend integration with CORS support.

---

## Main API Service (Port 8000)

**Base Path:** `/`
**Documentation:** `/docs` (Swagger UI), `/redoc` (ReDoc)
**Entry Point:** `apps/api/main.py`

### Core Configuration

- **Framework:** FastAPI 1.0.0
- **Environment:** Development/Staging/Production
- **Default Host:** `0.0.0.0:8000`
- **CORS:** Configured for `localhost:3000` (Next.js dev server)
- **Database:** PostgreSQL with async SQLAlchemy (`postgresql+asyncpg://`)
- **OpenAI Integration:** ChatMock/GPT-5 for evaluation
- **Logging:** Configurable levels (debug/info/warning/error)

### Global Middleware

- **CORS Middleware:** Allows all origins by default (configurable)
  - Origins: `http://localhost:3000`, `http://127.0.0.1:3000`
  - Credentials: Enabled
  - Methods: All (`*`)
  - Headers: All (`*`)

- **Global Exception Handler:**
  - Returns HTTP 500 for unhandled exceptions
  - Response format: `{"detail": "...", "error": "..."}`
  - Error details shown only in development mode

---

## API Router Summary

### 1. Health Check (`/health`)

**Method:** `GET /health`
**Tag:** health
**Response:** `HealthCheckResponse`

```json
{
  "status": "healthy"
}
```

---

### 2. Validation Router (`/validation`)

**Prefix:** `/validation`
**Tag:** validation
**Purpose:** Core validation engine (Stories 4.1-4.3)

#### 2.1 Generate Comprehension Prompt

```http
POST /validation/generate-prompt
Content-Type: application/json

{
  "objective_id": "string",
  "objective_text": "string"
}
```

**Response:** `PromptGenerationResponse`
- Generates varied "Explain to a patient" prompts
- Types: Direct Question, Clinical Scenario, Teaching Simulation
- Uses ChatMock/GPT-5 for prompt generation

#### 2.2 Evaluate User Comprehension

```http
POST /validation/evaluate
Content-Type: application/json

{
  "prompt_id": "string",
  "user_answer": "string",
  "confidence_level": 1-5,
  "objective_text": "string"
}
```

**Response:** `EvaluationResult`
- 4-dimensional scoring:
  - Terminology (20%)
  - Relationships (30%)
  - Application (30%)
  - Clarity (20%)
- Includes confidence calibration metrics

#### 2.3 Generate Clinical Scenario

```http
POST /validation/scenarios/generate
Content-Type: application/json

{
  "objective_id": "string",
  "objective_text": "string",
  "board_exam_tags": ["USMLE-1", "COMLEX-1"],
  "difficulty": "BASIC" | "INTERMEDIATE" | "ADVANCED"
}
```

**Response:** `ScenarioGenerationResponse`
- USMLE/COMLEX-style case vignettes
- Includes patient presentation, physical exam, labs
- Multi-stage decision questions

#### 2.4 Evaluate Clinical Reasoning

```http
POST /validation/scenarios/evaluate
Content-Type: application/json

{
  "scenario_id": "string",
  "user_choices": [],
  "user_reasoning": "string",
  "time_spent": 0-3600,
  "case_summary": "string"
}
```

**Response:** `ClinicalEvaluationResult`
- 4 competency domains:
  - Data Gathering (20%)
  - Diagnosis (30%)
  - Management (30%)
  - Clinical Reasoning (20%)
- Cognitive bias detection

#### 2.5 Get Clinical Metrics

```http
GET /validation/scenarios/metrics?dateRange=30days&scenarioType=DIAGNOSIS
```

**Response:** `dict`
- Aggregate performance metrics
- Competency score averages
- Weak competency identification
- Board exam topic coverage

#### 2.6 Get Scenario by ID

```http
GET /validation/scenarios/{scenario_id}
```

**Response:** `ScenarioGenerationResponse`
- Retrieve previously generated scenarios

#### 2.7 Identify Vulnerable Concepts

```http
POST /validation/challenge/identify
Content-Type: application/json

{
  "user_id": "string",
  "performance_data": [],
  "limit": 5
}
```

**Response:** `ChallengeIdentificationResult`
- Detects: Overconfidence, Partial Understanding, Recent Mistakes
- Returns top 5 vulnerable concepts

#### 2.8 Generate Challenge Question

```http
POST /validation/challenge/generate
Content-Type: application/json

{
  "objective_id": "string",
  "objective_text": "string",
  "vulnerability_type": "string"
}
```

**Response:** `ChallengeQuestionResponse`
- Creates "near-miss" distractors
- Tailored to vulnerability type

---

### 3. Challenge Router (`/challenge`)

**Prefix:** `/challenge`
**Tag:** challenge
**Purpose:** Corrective feedback and failure patterns (Story 4.3)

#### 3.1 Generate Corrective Feedback

```http
POST /challenge/feedback
Content-Type: application/json

{
  "challenge_id": "string",
  "correct_answer": "string",
  "user_answer": "string",
  "explanation": "string"
}
```

**Response:** `FeedbackResponse`
- Explains misconceptions
- Provides clinical context
- Creates memory anchors (mnemonics, analogies)

#### 3.2 Schedule Spaced Repetition Retries

```http
POST /challenge/schedule-retries
Content-Type: application/json

{
  "failure_id": "string",
  "failure_date": "datetime",
  "concept_id": "string"
}
```

**Response:** `RetryScheduleResponse`
- Spaced repetition intervals: +1, +3, +7, +14, +30 days
- Includes variation strategy

#### 3.3 Detect Failure Patterns

```http
POST /challenge/detect-patterns
Content-Type: application/json

{
  "user_id": "string",
  "min_frequency": 3
}
```

**Response:** `PatternDetectionResponse`
- Groups failures by category/topic/board tag
- Frequency analysis (>= 3 occurrences)
- Returns top 10 patterns

#### 3.4 Detect Patterns with Data

```http
POST /challenge/detect-patterns-with-data?user_id=string&min_frequency=3
Content-Type: application/json

{
  "failures": []
}
```

**Response:** `PatternDetectionResponse`
- Testing endpoint with direct data input

---

### 4. Adaptive Router (`/adaptive`)

**Prefix:** `/adaptive`
**Tag:** adaptive
**Purpose:** Adaptive questioning with IRT (Story 4.5)

#### 4.1 Get Next Adaptive Question

```http
POST /adaptive/question/next
Content-Type: application/json

{
  "session_id": "string",
  "objective_id": "string",
  "question_id": "string",
  "user_answer": "string",
  "current_difficulty": 0-100
}
```

**Response:** `NextQuestionResponse`
- IRT-based question selection
- Maximum information principle
- Early stopping (CI < 0.3)
- Includes efficiency metrics

#### 4.2 Get Session Metrics

```http
GET /adaptive/session/{session_id}/metrics?objective_id=string
```

**Response:** `SessionMetricsResponse`
- IRT theta estimates
- Convergence history
- Efficiency metrics
- Baseline comparison

---

### 5. Analytics Router (`/analytics`)

**Prefix:** `/analytics`
**Tag:** analytics
**Purpose:** Comprehensive understanding analytics (Story 4.6)

#### 5.1 Get Daily Insight

```http
POST /analytics/daily-insight
Content-Type: application/json

{
  "user_id": "string"
}
```

**Response:** `DailyInsight`
- Single highest-priority recommendation
- Priority scoring algorithm
- 2-4 action items

#### 5.2 Get Weekly Summary

```http
POST /analytics/weekly-summary
Content-Type: application/json

{
  "user_id": "string"
}
```

**Response:** `List[WeeklyTopObjective]`
- Top 3 objectives for the week
- ChatMock-generated rationale
- Estimated study hours

#### 5.3 Get Intervention Suggestions

```http
POST /analytics/interventions
Content-Type: application/json

{
  "user_id": "string"
}
```

**Response:** `List[InterventionSuggestion]`
- Pattern-based recommendations
- Detects: Overconfidence, Weak Reasoning, Poor Retention, Bottlenecks, Regression

#### 5.4 Estimate Time to Mastery

```http
GET /analytics/time-to-mastery/{objective_id}?user_id=string
```

**Response:** `TimeToMasteryEstimate | null`
- Linear extrapolation from trends
- Returns None if mastery unlikely
- Includes weeks estimate

#### 5.5 Predict Success Probability

```http
GET /analytics/success-probability/{objective_id}?user_id=string&planned_hours=10
```

**Response:** `dict`
```json
{
  "objective_id": "string",
  "planned_study_hours": 10,
  "success_probability": 0.75,
  "confidence_level": "high" // high (>=75%), medium (50-74%), low (<50%)
}
```

#### 5.6 Get Comprehensive Recommendations

```http
POST /analytics/recommendations
Content-Type: application/json

{
  "user_id": "string"
}
```

**Response:** `RecommendationData`
- All-in-one endpoint
- Daily insight, weekly top 3, interventions, time estimates, exam probability

#### 5.7 Get Predictive Analytics

```http
POST /analytics/predictions
Content-Type: application/json

{
  "user_id": "string",
  "date_range": "30days",
  "exam_type": "USMLE-1"
}
```

**Response:** `UnderstandingPrediction`
- Exam success prediction (logistic regression)
- Forgetting risk (Ebbinghaus curve)
- Mastery date predictions
- Model accuracy metrics

#### 5.8 Analyze Comprehension Patterns

```http
POST /analytics/patterns
Content-Type: application/json

{
  "user_id": "string",
  "date_range": "90days"
}
```

**Response:** `ComprehensionPattern`
- Strengths (top 10%)
- Weaknesses (bottom 10%)
- Calibration issues
- AI-generated insights

#### 5.9 Track Longitudinal Progress

```http
POST /analytics/longitudinal
Content-Type: application/json

{
  "user_id": "string",
  "date_range": "1y",
  "dimensions": ["terminology", "relationships"]
}
```

**Response:** `LongitudinalMetric`
- Time series metrics
- Milestones and regressions
- Growth trajectories
- Improvement rates

#### 5.10 Analyze Cross-Objective Correlations

```http
POST /analytics/correlations
Content-Type: application/json

{
  "user_id": "string"
}
```

**Response:** `CorrelationMatrix`
- Pearson correlation coefficients
- Foundational objectives (high positive correlation)
- Bottleneck objectives
- Recommended study sequence

#### 5.11 Peer Benchmarking

```http
POST /analytics/peer-benchmark
Content-Type: application/json

{
  "user_id": "string",
  "objective_id": "string (optional)"
}
```

**Response:** `PeerBenchmark`
- Compare with anonymized peers (min 50 users)
- Percentile rankings
- Box plot visualization data

#### 5.12 Dashboard Summary

```http
GET /analytics/understanding/dashboard?user_id=string&time_range=7d
```

**Response:** `DashboardSummary`
- Overall score (weighted average)
- Total sessions/questions
- Mastery breakdown (beginner < 60, proficient 60-85, expert > 85)
- Recent trends (7 days)
- Calibration status
- Top 3 strengths/improvement areas

#### 5.13 Comparison Analytics

```http
GET /analytics/analytics/understanding/comparison?user_id=string&peer_group=all
```

**Response:** `ComparisonResult`
- Overall percentile rank
- Per-dimension comparisons
- Strengths vs peers
- Gaps vs peers (requires 50+ peer users)

#### 5.14 Analytics Health Check

```http
GET /analytics/health
```

**Response:** `dict`
```json
{
  "status": "healthy",
  "service": "understanding-analytics",
  "version": "1.0.0",
  "timestamp": "2025-10-29T00:00:00"
}
```

---

## ML Service (Port 8001)

**Base Path:** `/`
**Entry Point:** `apps/ml-service/app/main.py`

### Core Configuration

- **Framework:** FastAPI 1.0.0
- **Environment:** Development/Staging/Production
- **Default Host:** `0.0.0.0:8001`
- **CORS:** Configured for `localhost:3000` (Next.js dev server)
- **Database:** Prisma Python client
- **Cache:** Redis (graceful degradation if unavailable)
- **Lifespan Management:** Async startup/shutdown events

### Global Middleware

- **CORS Middleware:**
  - Origins: Configurable via `CORS_ORIGINS` env var
  - Credentials: Enabled
  - Methods: GET, POST, PUT, DELETE, OPTIONS
  - Headers: All (`*`)
  - Exposes: `X-Process-Time`

---

### ML Service Routers

### 1. Root Endpoint

```http
GET /
```

**Response:** `dict`
```json
{
  "service": "Americano ML Service",
  "description": "Predictive Analytics for Learning Struggles (Story 5.2)",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/health"
}
```

### 2. Health Check

```http
GET /health
```

**Response:** `dict`
```json
{
  "status": "healthy",
  "service": "ml-service",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected"
}
```

### 3. Predictions Router (`/predictions`)

#### 3.1 Generate Predictions

```http
POST /predictions/generate
Content-Type: application/json

{
  "user_id": "string",
  "days_ahead": 7
}
```

**Response:** `PredictionResponse`
- Triggers prediction analysis
- Returns struggle probability predictions
- Generates alerts for high-risk cases
- Risk levels: HIGH (>=70%), MEDIUM (40-69%), LOW (<40%)
- Timeout: 10 seconds

#### 3.2 Get Predictions

```http
GET /predictions?user_id=string&status=PENDING&min_probability=0.5
```

**Response:** `PredictionResponse`
- Query stored predictions
- Filter by status/minimum probability
- Includes learning objective and course names

#### 3.3 Submit Prediction Feedback

```http
POST /predictions/{prediction_id}/feedback
Content-Type: application/json

{
  "feedback_type": "CONFIRMED" | "FALSE_POSITIVE" | "INCORRECT",
  "actual_struggle": true,
  "comments": "string"
}
```

**Response:** `FeedbackResponse`
- Record user feedback on predictions
- Updates prediction status
- Timeout: 10 seconds

---

### 4. Interventions Router (`/interventions`)

**Purpose:** Intervention recommendations based on predictions

### 5. Analytics Router (`/analytics`)

**Purpose:** ML-powered analytics

### 6. ITS Analysis Router (`/its`)

**Purpose:** Intelligent Tutoring System analysis

### 7. ABAB Analysis Router (`/abab`)

**Purpose:** ABAB experimental design analysis

---

## Database Configuration

### Main API Service

- **URL:** `postgresql+asyncpg://{user}@{host}:{port}/{database}`
- **Default:** `postgresql://kyin@localhost:5432/americano`
- **Async Driver:** `asyncpg`
- **Connection Pool:** 10 base, 20 max overflow
- **Pool Pre-Ping:** Enabled
- **Session Management:** Async context manager

### ML Service

- **Client:** Prisma Python
- **URL:** Configured via `DATABASE_URL` environment variable
- **Connection:** Lifecycle managed via lifespan context

---

## Error Handling

### Standard Error Response Format

**400 Bad Request:**
```json
{
  "error": "error_type",
  "message": "Human readable message",
  "details": {}
}
```

**422 Unprocessable Entity:**
```json
{
  "detail": "Invalid data - unable to process query"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "An unexpected error occurred",
  "error": "Internal server error" // or actual error in development
}
```

**503 Service Unavailable:**
```json
{
  "detail": "Database service unavailable"
}
```

**504 Gateway Timeout:**
```json
{
  "detail": "Request timeout - prediction generation took too long"
}
```

### Validation Exceptions

- **Invalid Objective:** 400 with field validation details
- **Missing Board Tags:** 400 with count requirements
- **Invalid Time Spent:** 400 (0-3600 seconds)
- **Insufficient Reasoning:** 400 (min 10 characters)

---

## CORS Configuration

### Main API Service

**Configured Origins:**
- `http://localhost:3000`
- `http://127.0.0.1:3000`

**Settings:** `/apps/api/src/config.py`
```python
cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
```

### ML Service

**Configured Origins:**
- `http://localhost:3000` (default)
- `http://localhost:3001` (default)

**Settings:** `/apps/ml-service/app/utils/config.py`
```python
CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
```

---

## Integration Notes for Frontend

### OpenAPI Documentation

Both services provide automatic OpenAPI documentation:

- **Swagger UI:** `/docs`
- **ReDoc:** `/redoc`

### Authentication

**Current Status:** No authentication middleware implemented

**Recommendation for Production:**
1. Add JWT-based authentication
2. Implement OAuth 2.0 or OpenID Connect
3. Add rate limiting middleware
4. Add request validation middleware

### Performance Considerations

1. **Timeouts:** ML service has 10-second timeouts on predictions
2. **Database Queries:** Analytics endpoints execute complex SQL queries
3. **Async Operations:** All endpoints are async/await
4. **Connection Pooling:** Database connections are pooled

### Response Sizes

- Analytics endpoints can return large datasets
- Dashboard summary aggregates multiple queries
- Peer benchmarking requires minimum 50 users

---

## File Locations

### Main API Service

- **Entry:** `/apps/api/main.py`
- **Config:** `/apps/api/src/config.py`
- **Database:** `/apps/api/src/database.py`
- **Routers:**
  - `/apps/api/src/validation/routes.py`
  - `/apps/api/src/challenge/routes.py`
  - `/apps/api/src/analytics/routes.py`
  - `/apps/api/src/adaptive/routes.py`

### ML Service

- **Entry:** `/apps/ml-service/app/main.py`
- **Config:** `/apps/ml-service/app/utils/config.py`
- **Routers:**
  - `/apps/ml-service/app/routes/predictions.py`
  - `/apps/ml-service/app/routes/interventions.py`
  - `/apps/ml-service/app/routes/analytics.py`
  - `/apps/ml-service/app/routes/its_routes.py`
  - `/apps/ml-service/app/routes/abab_routes.py`

---

## Versioning

- **API Version:** 1.0.0 (both services)
- **Documentation URLs:** `/docs`, `/redoc` (dev/staging only)
- **Version Header:** Not currently implemented

---

**Note:** This inventory reflects the current state of the API as of 2025-10-29. For the most up-to-date information, consult the OpenAPI documentation at `/docs` when the services are running.
