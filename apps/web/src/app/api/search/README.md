# Search API Documentation

**Story 3.1 Task 4: Create Search API Endpoints**

This directory contains the semantic search API endpoints for the Americano medical education platform.

## Endpoints

### POST /api/search

Performs semantic search across all content using natural language queries and vector embeddings.

**Features:**
- Vector-based semantic search (understands meaning, not just keywords)
- Advanced filtering (course, date, content type, high-yield only)
- Pagination support
- Rate limited to 20 requests per minute per user
- Performance target: <1 second response time

**Request:**
```typescript
POST /api/search
Content-Type: application/json
X-User-Email: kevy@americano.dev

{
  "query": "How does the cardiac conduction system work?",
  "limit": 20,          // Optional, default: 20, max: 100
  "offset": 0,          // Optional, default: 0
  "filters": {          // Optional
    "courseIds": ["course-id-1"],
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    },
    "contentTypes": ["lecture", "objective"],
    "highYieldOnly": true,
    "minSimilarity": 0.7
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "obj-xyz",
        "type": "objective",
        "title": "Cardiac Conduction System Overview",
        "snippet": "The <mark>cardiac</mark> <mark>conduction</mark> <mark>system</mark> consists of...",
        "similarity": 0.92,
        "metadata": {
          "lectureId": "lec-123",
          "lectureTitle": "Cardiovascular Physiology",
          "courseId": "course-456",
          "courseName": "Physiology (PHYS 501)",
          "courseCode": "PHYS 501",
          "uploadDate": "2024-10-01T12:00:00Z",
          "pageNumber": 15,
          "isHighYield": true,
          "boardExamTags": ["USMLE-Step1-Cardio"]
        }
      }
    ],
    "total": 42,
    "latency": 234,
    "query": "How does the cardiac conduction system work?",
    "filters": { ... },
    "pagination": {
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Rate Limit Headers:**
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 2024-10-16T14:30:00Z
```

**Error Responses:**
- `400` - Validation error (invalid query, limit, filters)
- `404` - User not found
- `429` - Rate limit exceeded
- `500` - Server error

---

### GET /api/search/suggestions

Provides search autocomplete suggestions based on recent searches, medical terms, and concepts.

**Features:**
- Autocomplete for search interface
- Sources: recent searches, learning objectives, concepts, lecture titles
- Rate limited (shared with /api/search - 20 requests per minute)

**Request:**
```
GET /api/search/suggestions?q=card&limit=5&courseId=course-123
X-User-Email: kevy@americano.dev
```

**Query Parameters:**
- `q` (required): Partial search query (minimum 2 characters, max 100)
- `limit` (optional): Maximum suggestions (default: 5, max: 20)
- `courseId` (optional): Filter suggestions by course

**Response:**
```typescript
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "cardiac conduction system",
        "category": "recent",
        "resultCount": 12,
        "context": "Searched 2h ago"
      },
      {
        "text": "Cardiac muscle contraction mechanisms",
        "category": "concept",
        "context": "Physiology (PHYS 501) • High-Yield"
      },
      {
        "text": "Cardiovascular System Lecture",
        "category": "lecture",
        "resultCount": 15,
        "context": "PHYS 501"
      }
    ],
    "query": "card"
  }
}
```

**Suggestion Categories:**
- `recent`: User's recent searches
- `term`: Common medical terminology
- `concept`: Learning objectives and concepts
- `lecture`: Lecture titles

**Error Responses:**
- `400` - Validation error (missing/invalid query)
- `404` - User not found
- `429` - Rate limit exceeded
- `500` - Server error

---

## Rate Limiting

Both endpoints share a rate limit of **20 requests per minute per user**.

**Implementation:**
- Algorithm: Token bucket with sliding window
- Storage: In-memory (suitable for MVP single-instance deployment)
- Identifier: User email from `X-User-Email` header

**Rate Limit Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Maximum 20 requests per minute. Please try again in 30 seconds.",
    "details": {
      "limit": 20,
      "remaining": 0,
      "resetAt": "2024-10-16T14:30:00Z",
      "retryAfter": 30
    }
  }
}
```

**Headers on Rate Limit:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-10-16T14:30:00Z
```

---

## Request Validation

All requests are validated using Zod schemas:

### Search Request Validation
- `query`: 2-500 characters, trimmed
- `limit`: 1-100 (default: 20)
- `offset`: ≥0 (default: 0)
- `filters.dateRange.start`: Must be ≤ `end`
- `filters.minSimilarity`: 0.0-1.0

### Suggestions Request Validation
- `q`: 2-100 characters, trimmed
- `limit`: 1-20 (default: 5)
- `courseId`: Valid CUID

**Validation Error Example:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "query: Search query must be at least 2 characters",
    "details": {
      "fieldErrors": {
        "query": ["Search query must be at least 2 characters"]
      }
    }
  }
}
```

---

## Search Analytics

Every search query is logged to the `SearchQuery` table for analytics:

**Logged Data:**
- User ID
- Query string
- Applied filters
- Result count
- Top result ID
- Response time (ms)
- Timestamp

**Analytics Use Cases (Story 3.1 Task 6):**
- Recent searches for autocomplete
- Most searched terms
- Search frequency over time
- Common query patterns
- Content recommendation

---

## Architecture

### File Structure
```
apps/web/src/
├── app/api/search/
│   ├── route.ts                      # POST /api/search
│   ├── suggestions/
│   │   └── route.ts                  # GET /api/search/suggestions
│   ├── __tests__/
│   │   └── search-api.test.ts        # Integration tests
│   └── README.md                     # This file
├── lib/
│   ├── rate-limiter.ts               # Rate limiting utility
│   ├── api-response.ts               # Response helpers
│   └── api-error.ts                  # Error handling
└── subsystems/knowledge-graph/
    ├── types.ts                      # TypeScript types
    ├── validation.ts                 # Zod schemas
    └── semantic-search.ts            # Search engine (Task 3)
```

### Dependencies
- **Next.js App Router**: Route handlers
- **Zod**: Request validation
- **Prisma**: Database queries
- **Rate Limiter**: Custom in-memory implementation

### Integration Points
- **Task 3** (Build Semantic Search Engine): Implements actual vector search
- **Task 6** (Search History and Analytics): Uses logged search queries
- **Story 3.2** (UI Components): Consumes these API endpoints

---

## Testing

### Manual Testing with curl

**Valid search:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -H "X-User-Email: kevy@americano.dev" \
  -d '{"query": "cardiac conduction system", "limit": 10}'
```

**Search with filters:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -H "X-User-Email: kevy@americano.dev" \
  -d '{
    "query": "anatomy",
    "filters": {
      "highYieldOnly": true,
      "contentTypes": ["lecture", "objective"]
    }
  }'
```

**Autocomplete suggestions:**
```bash
curl "http://localhost:3000/api/search/suggestions?q=card&limit=5" \
  -H "X-User-Email: kevy@americano.dev"
```

**Test rate limiting:**
```bash
# Run this 21 times rapidly to trigger rate limit
for i in {1..21}; do
  curl -X POST http://localhost:3000/api/search \
    -H "Content-Type: application/json" \
    -H "X-User-Email: kevy@americano.dev" \
    -d '{"query": "test"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 0.1
done
```

### Test Cases
See `__tests__/search-api.test.ts` for comprehensive test cases including:
- Valid requests
- Validation errors
- Rate limiting
- Error handling
- Performance (<1s latency)
- Pagination
- Filtering

---

## Performance Considerations

**Target Performance (AC #8):**
- Total search latency: <1 second
  - Query embedding: <300ms (Task 3)
  - Similarity search: <100ms (Task 3)
  - Result formatting: <100ms
  - Network overhead: <500ms buffer

**Optimization Strategies:**
- Query embedding caching (1 hour TTL) - Task 3
- pgvector indexes (ivfflat) - Task 3
- Connection pooling (Prisma default)
- Async search logging (non-blocking)

**Monitoring:**
- Response time logged in SearchQuery table
- Rate limit status tracked per user
- Error logging to console

---

## Security

**Authentication:**
- MVP: User identified by `X-User-Email` header
- Production: Replace with proper JWT/session authentication

**Input Validation:**
- All inputs validated with Zod schemas
- SQL injection prevented by Prisma ORM
- XSS prevented by escaping in snippets (future enhancement)

**Rate Limiting:**
- Prevents abuse (20 requests/minute per user)
- In-memory storage (suitable for MVP)
- Production: Use Redis for distributed rate limiting

**Privacy:**
- Search queries logged per-user with consent
- Analytics aggregated for insights
- User can clear search history (Task 6)

---

## Future Enhancements

**From Story 3.1:**
- Task 3: Full vector search implementation
- Task 5: Search UI components
- Task 6: Search history UI and analytics
- Task 7: Performance optimization and testing

**Beyond Epic 3:**
- Hybrid search (semantic + keyword)
- Medical term synonym expansion
- Query autocorrection
- Distributed rate limiting (Redis)
- Real-time search results
- Search result caching
- A/B testing search algorithms

---

## OpenAPI Specification

Full OpenAPI/Swagger documentation is embedded in JSDoc comments above each route handler.

**To generate OpenAPI spec:**
```bash
# Install openapi-comment-parser (if not already installed)
npm install -D openapi-comment-parser

# Generate spec from JSDoc comments
npx openapi-comment-parser src/app/api/search/**/*.ts > openapi.json
```

**To view in Swagger UI:**
```bash
# Serve Swagger UI with generated spec
npx swagger-ui-express openapi.json
```

---

## Troubleshooting

**Issue:** 404 User Not Found
- **Solution:** Ensure database is seeded: `npx prisma db seed`
- **Check:** User exists: `npx prisma studio` → Users table

**Issue:** 429 Rate Limit Exceeded
- **Solution:** Wait 1 minute or reset rate limiter (restart server)
- **Debug:** Check `X-RateLimit-Reset` header for reset time

**Issue:** Validation errors
- **Solution:** Check request body against schemas in `validation.ts`
- **Debug:** Error details include field-specific messages

**Issue:** Slow responses (>1s)
- **Cause:** Task 3 not yet implemented (using placeholder)
- **Solution:** Wait for Task 3 (Semantic Search Engine) implementation

---

## References

- Story 3.1: [/docs/stories/story-3.1.md](../../../../../docs/stories/story-3.1.md)
- Solution Architecture: [/docs/solution-architecture.md](../../../../../docs/solution-architecture.md)
- AGENTS.MD Protocol: [/AGENTS.MD](../../../../../AGENTS.MD)
- Next.js App Router Docs: [https://nextjs.org/docs/app/building-your-application/routing/route-handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- Zod Documentation: [https://zod.dev](https://zod.dev)
