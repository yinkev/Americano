# API Endpoints Reference

**Base URL**: `http://localhost:3000/api`

**Authentication**: Deferred for MVP - All endpoints use hardcoded Kevy user (`kevy@americano.dev`)

**Response Format**: All endpoints return JSON with standardized structure:

**Success Response**:
```json
{
  "success": true,
  "data": { /* response payload */ }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional additional details */ }
  }
}
```

---

## User Endpoints

### GET /api/user/profile
Get current user's profile with stats.

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cuid",
      "email": "kevy@americano.dev",
      "name": "Kevy",
      "createdAt": "2025-10-14T...",
      "updatedAt": "2025-10-14T...",
      "stats": {
        "courseCount": 3,
        "lectureCount": 15,
        "sessionCount": 5
      }
    }
  }
}
```

### PATCH /api/user/profile
Update current user's profile.

**Request Body**:
```json
{
  "name": "Updated Name",         // optional, 1-100 chars
  "email": "new@email.com"        // optional, valid email
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { /* updated user object */ }
  }
}
```

---

## Course Endpoints

### GET /api/content/courses
List all courses for current user.

**Query Parameters**: None

**Response**: `200 OK`
```json
{
  "success": true,
  "courses": [
    {
      "id": "cuid",
      "name": "Gross Anatomy",
      "code": "ANAT 505",
      "term": "Fall 2025",
      "color": "oklch(0.7 0.15 230)",
      "createdAt": "2025-10-14T...",
      "lectureCount": 12
    }
  ]
}
```

### POST /api/content/courses
Create a new course.

**Request Body**:
```json
{
  "name": "Course Name",          // required, 1-100 chars
  "code": "COURSE-101",           // optional, max 20 chars
  "term": "Fall 2025",            // optional, max 50 chars
  "color": "oklch(0.7 0.15 230)"  // optional, OKLCH format
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "course": { /* created course object */ }
}
```

### PATCH /api/content/courses/:id
Update an existing course.

**Request Body**: Same as POST (all fields optional)

**Response**: `200 OK`

### DELETE /api/content/courses/:id
Delete a course (prevents deletion if lectures exist).

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

---

## Lecture Endpoints

### GET /api/content/lectures
List lectures with filtering, sorting, and pagination.

**Query Parameters**:
- `courseId` (optional): Filter by course ID
- `status` (optional): Filter by processing status (`PENDING` | `PROCESSING` | `COMPLETED` | `FAILED`)
- `tags` (optional): Comma-separated tags to filter by
- `sortBy` (optional): Sort field (`uploadedAt` | `title` | `processedAt` | `processingStatus`, default: `uploadedAt`)
- `sortOrder` (optional): Sort direction (`asc` | `desc`, default: `desc`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (1-100, default: 50)

**Response**: `200 OK`
```json
{
  "success": true,
  "lectures": [
    {
      "id": "cuid",
      "title": "Lecture 1: Introduction",
      "fileName": "lecture1.pdf",
      "fileUrl": "/path/to/file",
      "fileSize": 1024000,
      "processingStatus": "COMPLETED",
      "uploadedAt": "2025-10-14T...",
      "processedAt": "2025-10-14T...",
      "weekNumber": 1,
      "topicTags": ["anatomy", "introduction"],
      "course": {
        "id": "cuid",
        "name": "Gross Anatomy",
        "code": "ANAT 505",
        "color": "oklch(...)"
      },
      "chunkCount": 45,
      "objectiveCount": 12,
      "cardCount": 8
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 123,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### GET /api/content/lectures/:id
Get single lecture with full details (chunks and objectives).

**Response**: `200 OK`
```json
{
  "success": true,
  "lecture": {
    "id": "cuid",
    /* lecture fields */,
    "contentChunks": [
      {
        "id": "cuid",
        "content": "...",
        "chunkIndex": 0,
        "pageNumber": 1
      }
    ],
    "learningObjectives": [
      {
        "id": "cuid",
        "objective": "Understand...",
        "isHighYield": true,
        "extractedBy": "gpt-5"
      }
    ]
  }
}
```

### PATCH /api/content/lectures/:id
Update lecture metadata.

**Request Body**:
```json
{
  "title": "Updated Title",      // optional, 1-200 chars
  "courseId": "cuid",             // optional, must exist
  "weekNumber": 2,                // optional, 1-52
  "topicTags": ["tag1", "tag2"]   // optional, max 10 tags, each 1-30 chars
}
```

**Response**: `200 OK`

### DELETE /api/content/lectures/:id
Delete lecture with cascades (content chunks, learning objectives, PDF file).

**Restrictions:**
- Only allows deletion of lectures with status `PENDING` or `FAILED`
- Prevents deletion of `PROCESSING` or `COMPLETED` lectures to protect processed content
- Use bulk actions to delete processed lectures if needed

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Lecture deleted successfully",
  "deletedLecture": {
    "id": "cuid",
    "title": "Deleted Lecture"
  }
}
```

**Error Response** (if trying to delete processed lecture): `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_DELETE",
    "message": "Cannot delete lectures that have been processed or are currently processing. Please use the bulk actions to manage processed lectures."
  }
}
```

---

## Mission Analytics Endpoints

### GET /api/analytics/missions/summary
Get mission completion statistics and insights for a time period.

**Query Parameters**:
- `period` (optional): Time period (`7d` | `30d` | `90d` | `all`, default: `7d`)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "completionRate": 0.86,
    "streak": {
      "current": 7,
      "longest": 14
    },
    "successScore": 0.72,
    "missions": {
      "completed": 6,
      "skipped": 1,
      "total": 7
    },
    "insights": [
      "85% mission completion correlates with 23% faster mastery",
      "You complete 92% of morning missions vs. 68% evening"
    ]
  }
}
```

**Implementation**: `apps/web/src/app/api/analytics/missions/summary/route.ts`
- Uses `MissionAnalyticsEngine.calculateCompletionRate()`
- Retrieves current streak from `MissionStreak` model
- Aggregates mission statistics for specified period

---

### GET /api/analytics/missions/trends
Get time-series data for mission performance trends.

**Query Parameters**:
- `metric` (required): Metric to retrieve (`completion_rate` | `avg_duration` | `success_score`)
- `granularity` (optional): Time granularity (`daily` | `weekly` | `monthly`, default: `daily`)
- `startDate` (optional): ISO 8601 start date (defaults to 30 days ago)
- `endDate` (optional): ISO 8601 end date (defaults to today)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "data": [
      { "date": "2025-10-08", "value": 0.75 },
      { "date": "2025-10-09", "value": 0.80 }
    ],
    "metadata": {
      "metric": "completion_rate",
      "granularity": "daily",
      "period": { "start": "2025-10-01", "end": "2025-10-15" }
    }
  }
}
```

**Implementation**: `apps/web/src/app/api/analytics/missions/trends/route.ts`
- Queries `MissionAnalytics` aggregates for efficient time-series data
- Falls back to real-time calculation from `Mission` table if aggregates don't exist

---

### GET /api/analytics/missions/correlation
Analyze correlation between mission completion and performance improvement.

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "correlationCoefficient": 0.78,
    "pValue": 0.003,
    "sampleSize": 30,
    "confidence": "HIGH",
    "dataPoints": [
      { "completionRate": 0.75, "masteryImprovement": 0.18 },
      { "completionRate": 0.90, "masteryImprovement": 0.25 }
    ],
    "insight": "Mission completion rate shows strong positive correlation (r=0.78, p<0.01) with mastery improvement. Users with 85%+ completion improve 23% faster."
  }
}
```

**Implementation**: `apps/web/src/app/api/analytics/missions/correlation/route.ts`
- Uses `MissionAnalyticsEngine.detectPerformanceCorrelation()`
- Calculates Pearson correlation coefficient
- Requires minimum 7 missions for statistical significance
- Integrates with review performance data from study sessions

---

### GET /api/analytics/missions/recommendations
Get personalized mission adjustment recommendations.

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "adjustments": {
      "duration": {
        "current": 60,
        "recommended": 52,
        "reason": "Completion rate 68.5% is below optimal 70-90% range. Shorter missions may improve completion."
      },
      "complexity": {
        "current": "MODERATE",
        "recommended": "CHALLENGING",
        "reason": "Completion rate 92.3% is above optimal 70-90% range. Increase challenge for better engagement."
      }
    },
    "confidence": 0.6
  }
}
```

**Implementation**: `apps/web/src/app/api/analytics/missions/recommendations/route.ts`
- Uses `MissionAnalyticsEngine.recommendMissionAdjustments()`
- Analyzes last 14 missions for pattern detection
- Provides duration/complexity/objective type recommendations
- Confidence score based on data quality and pattern strength

---

### POST /api/missions/:id/feedback
Submit feedback for a completed mission.

**Request Body**:
```json
{
  "helpfulnessRating": 4,
  "relevanceScore": 3,
  "paceRating": "JUST_RIGHT",
  "improvementSuggestions": "More anatomy objectives"
}
```

**Validation**:
- `helpfulnessRating`: 1-5 integer (required)
- `relevanceScore`: 1-5 integer (required)
- `paceRating`: `TOO_SLOW` | `JUST_RIGHT` | `TOO_FAST` (required)
- `improvementSuggestions`: String, optional

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "feedback": {
      "id": "cuid",
      "missionId": "cuid",
      "helpfulnessRating": 4,
      "relevanceScore": 3,
      "paceRating": "JUST_RIGHT",
      "improvementSuggestions": "More anatomy objectives",
      "submittedAt": "2025-10-15T..."
    },
    "aggregatedFeedback": {
      "avgHelpfulness": 4.2,
      "avgRelevance": 3.8,
      "paceDistribution": {
        "too_slow": 1,
        "just_right": 5,
        "too_fast": 1
      }
    }
  }
}
```

**Implementation**: `apps/web/src/app/api/missions/[id]/feedback/route.ts`
- POST handler creates new `MissionFeedback` record
- GET handler retrieves aggregated feedback for a mission
- Feedback influences adaptive mission generation (Story 2.6 Task 5)

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate email) |
| `BAD_REQUEST` | 400 | Malformed request |
| `INTERNAL_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `FETCH_FAILED` | 500 | Failed to fetch data |
| `CREATE_FAILED` | 500 | Failed to create resource |
| `UPDATE_FAILED` | 500 | Failed to update resource |
| `DELETE_FAILED` | 500 | Failed to delete resource |

---

## Implementation Notes

1. **Authentication**: Currently uses hardcoded Kevy user (`kevy@americano.dev`). Add proper authentication when deploying for multiple users (see Story 1.1).

2. **Rate Limiting**: Deferred for MVP (single user, no abuse risk). Implement when deploying for multiple users using Upstash Rate Limit or Vercel Edge Config.

3. **pgvector Indexes**: Currently deferred due to pgvector 0.8.1's 2000-dimension limit (Gemini embeddings are 3072 dimensions). Semantic search works via sequential scan for MVP (<10k chunks acceptable). Add indexes when pgvector 0.9.0+ is released or implement dimensionality reduction.

4. **Response Utilities**: All endpoints use standardized `successResponse()` and `errorResponse()` helpers from `/src/lib/api-response.ts`.

5. **Error Handling**: All endpoints use `withErrorHandler()` wrapper from `/src/lib/api-error.ts` for consistent error formatting.

6. **Validation**: All request bodies validated using Zod schemas from `/src/lib/validation.ts`.

---

## Testing

For MVP, manual testing via curl or Postman is acceptable:

```bash
# Get user profile
curl http://localhost:3000/api/user/profile

# List courses
curl http://localhost:3000/api/content/courses

# List lectures with filters
curl "http://localhost:3000/api/content/lectures?courseId=xxx&status=COMPLETED&page=1&limit=10"

# Create course
curl -X POST http://localhost:3000/api/content/courses \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Course","code":"TEST-101"}'

# Update lecture
curl -X PATCH http://localhost:3000/api/content/lectures/xxx \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","weekNumber":2}'
```

Add Vitest + Playwright tests when deploying to production with multiple users.
