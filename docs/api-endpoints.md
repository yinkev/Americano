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
