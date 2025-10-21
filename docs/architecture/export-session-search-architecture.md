# Export & Session Search Architecture

**Story 3.6 - Tasks 6 & 7: System Architecture**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │  SearchResults   │         │  StudySession Page          │  │
│  │                  │         │                             │  │
│  │  ┌────────────┐  │         │  ┌───────────────────────┐ │  │
│  │  │ ExportBtn  │  │         │  │  InSessionSearch      │ │  │
│  │  │            │  │         │  │                       │ │  │
│  │  │ • JSON     │  │         │  │  • Cmd/Ctrl+K        │ │  │
│  │  │ • CSV      │  │         │  │  • Context aware     │ │  │
│  │  │ • Markdown │  │         │  │  • Add to Session    │ │  │
│  │  └────────────┘  │         │  └───────────────────────┘ │  │
│  └──────────────────┘         └─────────────────────────────┘  │
│           │                                    │                │
└───────────┼────────────────────────────────────┼────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /api/graph/search/export    POST /api/study/session/add  │
│  ┌─────────────────────────┐      ┌─────────────────────────┐  │
│  │  Export Handler         │      │  Add Content Handler    │  │
│  │                         │      │                         │  │
│  │  1. Validate request    │      │  1. Validate session    │  │
│  │  2. Check rate limit    │      │  2. Verify content      │  │
│  │  3. Execute search      │      │  3. Create link         │  │
│  │  4. Format results      │      │  4. Update progress     │  │
│  │  5. Stream response     │      │  5. Track history       │  │
│  │  6. Update rate limit   │      │                         │  │
│  └─────────────────────────┘      └─────────────────────────┘  │
│           │                                    │                │
└───────────┼────────────────────────────────────┼────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SemanticSearchService                                   │   │
│  │                                                          │   │
│  │  • search(query, filters) → SearchResponse             │   │
│  │  • Hybrid search (70% vector + 30% keyword)            │   │
│  │  • Result ranking & relevance scoring                  │   │
│  │  • Snippet generation with highlighting                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────┐    ┌─────────────────────────────┐   │
│  │  Export Formatters   │    │  Rate Limiter              │   │
│  │                      │    │                            │   │
│  │  • exportToJSON()    │    │  • In-memory map           │   │
│  │  • exportToCSV()     │    │  • 10/hour per user        │   │
│  │  • exportToMarkdown()│    │  • Auto-reset tracking     │   │
│  └──────────────────────┘    └─────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer (Prisma)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ SearchQuery  │  │ StudySession │  │ ContentChunk         │  │
│  │              │  │              │  │                      │  │
│  │ • query      │  │ • sessionId  │  │ • lectureId          │  │
│  │ • filters    │  │ • missionId  │  │ • content            │  │
│  │ • resultCnt  │  │ • progress   │  │ • embedding (vector) │  │
│  │ • timestamp  │  │ • objectives │  │ • chunkIndex         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐ │
│  │ LearningObjective│  │ Concept        │  │ Lecture         │ │
│  │                  │  │                │  │                 │ │
│  │ • objective      │  │ • name         │  │ • title         │ │
│  │ • complexity     │  │ • description  │  │ • courseId      │ │
│  │ • boardExamTags  │  │ • embedding    │  │ • embedding     │ │
│  └──────────────────┘  └────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL + pgvector                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Vector similarity search (cosine distance)                  │
│  • Full-text search (tsvector)                                 │
│  • Indexes: vector, timestamp, userId, query                   │
│  • 1536-dimension embeddings (Gemini)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Export Flow

```
User clicks Export Button
         │
         ▼
ExportButton component
         │
         ├─ Validate: query exists, not rate limited
         │
         ▼
POST /api/graph/search/export
         │
         ├─ 1. Check rate limit (in-memory map)
         │      ├─ If exceeded → 429 response
         │      └─ If allowed → continue
         │
         ├─ 2. Execute search via SemanticSearchService
         │      ├─ Generate query embedding (Gemini)
         │      ├─ Vector search (pgvector)
         │      ├─ Hybrid scoring (70% vector + 30% keyword)
         │      └─ Return results (max 1000)
         │
         ├─ 3. Format results
         │      ├─ JSON: Full structure with metadata
         │      ├─ CSV: Flatten to table format
         │      └─ Markdown: Human-readable sections
         │
         ├─ 4. Generate file response
         │      ├─ Set Content-Type header
         │      ├─ Set Content-Disposition (filename)
         │      ├─ Add rate limit headers
         │      └─ Stream file data
         │
         ├─ 5. Increment rate limit counter
         │
         ▼
Browser downloads file
         │
         ▼
ExportButton shows success toast
```

### Study Session Search Flow

```
User presses Cmd/Ctrl+K
         │
         ▼
InSessionSearch dialog opens
         │
         ├─ Auto-focus search input
         ├─ Pre-populate with context keywords
         │    (from currentObjective)
         ├─ Load search history from sessionStorage
         │
         ▼
User types query & presses Enter
         │
         ▼
POST /api/graph/search
         │
         ├─ Execute semantic search (limit: 10)
         ├─ Return results
         │
         ▼
Display results in dialog
         │
         ├─ Show "Add to Session" button on each
         │
         ▼
User clicks "Add to Session"
         │
         ▼
POST /api/study/session/add-content
         │
         ├─ 1. Validate session exists & active
         │      └─ If completed → 400 error
         │
         ├─ 2. Verify content exists
         │      ├─ Fetch Lecture/Chunk/Objective/Concept
         │      └─ If not found → 404 error
         │
         ├─ 3. Update session progress
         │      ├─ Increment newCardsStudied
         │      └─ (Future: add to objectiveCompletions)
         │
         ├─ 4. Track search query (for analytics)
         │      └─ Log: sessionId + contentId + searchQuery
         │
         ▼
Return success response
         │
         ▼
InSessionSearch shows success toast
         │
         ├─ Save search to history (sessionStorage)
         ├─ Close dialog after 500ms
         │
         ▼
Parent component refreshes session data
```

---

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                          SearchPage                                │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  State Management                                           │  │
│  │  • query: string                                            │  │
│  │  • filters: SearchFilters                                   │  │
│  │  • results: SearchResult[]                                  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  SearchBar      │→│ SearchResults│→│  ExportButton        │  │
│  │                 │  │              │  │                      │  │
│  │  onChange()     │  │  • List view │  │  query={query}       │  │
│  │  onSubmit()     │  │  • Graph view│  │  filters={filters}   │  │
│  └─────────────────┘  └──────────────┘  └──────────────────────┘  │
│                              │                      │              │
│                              ▼                      ▼              │
│                       SearchResultItem    DropdownMenu (formats)   │
└────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────┐
│                     StudySessionPage                               │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  State Management                                           │  │
│  │  • session: StudySession                                    │  │
│  │  • currentObjective: LearningObjective                      │  │
│  │  • missionId: string                                        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────┐  ┌─────────────────────────────────────┐  │
│  │  ObjectiveCard     │  │  InSessionSearch                    │  │
│  │                    │  │                                     │  │
│  │  • Display obj     │  │  Props:                             │  │
│  │  • Progress bar    │  │  • sessionId                        │  │
│  │  • Study controls  │  │  • currentObjective (context)       │  │
│  │                    │  │  • initialKeywords (pre-populate)   │  │
│  │  [Search Related]──┼─→│                                     │  │
│  │     Button         │  │  Callbacks:                         │  │
│  └────────────────────┘  │  • onAddToSession()                 │  │
│                          │  • onSearchPerformed()              │  │
│                          └─────────────────────────────────────┘  │
│                                         │                          │
│                                         ▼                          │
│                              Dialog with SearchResults             │
│                              + "Add to Session" buttons            │
└────────────────────────────────────────────────────────────────────┘
```

---

## State Management

### ExportButton State

```typescript
interface ExportButtonState {
  // UI State
  isExporting: boolean              // Loading state
  includeMetadata: boolean          // Toggle for metadata

  // Rate Limiting State
  remainingExports: number | null   // Exports left this hour
  resetTime: Date | null            // When limit resets
}

// State transitions
idle → isExporting (user clicks format)
  → success (file downloads)
    → idle (reset state)
  → rate_limited (429 response)
    → disabled (show warning)
  → error (show toast)
    → idle (allow retry)
```

### InSessionSearch State

```typescript
interface InSessionSearchState {
  // Dialog State
  isOpen: boolean                   // Modal visibility
  query: string                     // Current search query

  // Search State
  isSearching: boolean              // Loading state
  results: SearchResult[]           // Search results

  // History State
  searchHistory: SearchHistoryItem[]// Recent searches
  addingToSession: string | null    // ID of content being added
}

// State transitions
closed → isOpen (Cmd/Ctrl+K pressed)
  → query populated (from initialKeywords)
  → isSearching (Enter pressed)
    → results populated (API response)
      → addingToSession (Add button clicked)
        → success (toast + close dialog)
        → error (toast + keep open)
  → closed (Escape pressed)
```

---

## Security Architecture

### Rate Limiting

```typescript
// In-memory rate limit map
const rateLimitMap = new Map<string, RateLimit>()

interface RateLimit {
  count: number       // Current export count
  resetAt: Date       // When to reset counter
}

// Flow
1. User requests export
2. Check rateLimitMap[userId]
3. If not exists or expired → create new { count: 0, resetAt: now + 1hr }
4. If count >= 10 → return 429
5. Else → allow export, increment count
6. Background job cleans expired entries (optional)
```

**Production Improvement:**
```typescript
// Use Redis for distributed rate limiting
import { Redis } from 'ioredis'

const redis = new Redis()

async function checkRateLimit(userId: string) {
  const key = `export:rate:${userId}`
  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, 3600) // 1 hour TTL
  }

  const ttl = await redis.ttl(key)
  const resetAt = new Date(Date.now() + ttl * 1000)

  return {
    allowed: count <= 10,
    remaining: Math.max(0, 10 - count),
    resetAt
  }
}
```

### Session Validation

```typescript
// Session security checks
async function validateSession(sessionId: string, userId: string) {
  const session = await prisma.studySession.findUnique({
    where: { id: sessionId }
  })

  // Security checks
  if (!session) throw new Error('Session not found')
  if (session.userId !== userId) throw new Error('Unauthorized')
  if (session.completedAt) throw new Error('Session completed')

  return session
}
```

### Content Verification

```typescript
// Verify content exists and user has access
async function verifyContent(
  contentId: string,
  contentType: string,
  userId: string
) {
  switch (contentType) {
    case 'lecture': {
      const lecture = await prisma.lecture.findFirst({
        where: { id: contentId, userId }
      })
      if (!lecture) throw new Error('Lecture not found or access denied')
      return lecture
    }
    // ... other types
  }
}
```

---

## Performance Optimization

### Export Performance

**Target:** <3 seconds for 100 results

**Optimizations:**
1. **Result Limiting:** Max 1000 results enforced
2. **Streaming Response:** No full buffering
   ```typescript
   return new NextResponse(content, {
     headers: {
       'Content-Type': contentType,
       'Content-Disposition': `attachment; filename="${filename}"`
     }
   })
   ```
3. **Efficient Formatters:** Single-pass generation
   ```typescript
   // CSV: Stream rows without building full string
   const rows = results.map(result => formatRow(result))
   return [headers.join(','), ...rows].join('\n')
   ```

### Search Performance

**Target:** <1 second for simple queries

**Optimizations:**
1. **Index Usage:**
   ```sql
   -- Vector index
   CREATE INDEX idx_content_chunks_embedding
   ON content_chunks USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 100);

   -- Composite index for search queries
   CREATE INDEX idx_search_queries_userId_timestamp
   ON search_queries(userId, timestamp);
   ```

2. **Query Optimization:**
   ```typescript
   // Limit vector search candidates
   const vectorResults = await searchVector(
     embedding,
     filters,
     minSimilarity,
     limit * 2  // 2x for hybrid re-ranking
   )
   ```

3. **In-Session Search Limits:**
   ```typescript
   // Limit to 10 results for quick lookup
   const response = await fetch('/api/graph/search', {
     body: JSON.stringify({ query, limit: 10 })
   })
   ```

---

## Error Handling

### Export Errors

```typescript
// Error hierarchy
try {
  // Validate request
  const data = ExportRequestSchema.parse(body)

  // Check rate limit
  const rateLimit = checkRateLimit(userId)
  if (!rateLimit.allowed) {
    return NextResponse.json({ /* 429 */ }, { status: 429 })
  }

  // Execute search
  const results = await semanticSearchService.search(...)

  // Format & return
  return new NextResponse(formatted, { /* headers */ })

} catch (error) {
  if (error instanceof z.ZodError) {
    // Validation error → 400
    return NextResponse.json({ error: 'Validation error', ... }, { status: 400 })
  }

  if (error instanceof RateLimitError) {
    // Rate limit → 429
    return NextResponse.json({ error: 'Rate limit exceeded', ... }, { status: 429 })
  }

  // Unknown error → 500
  console.error('Export error:', error)
  return NextResponse.json({ error: 'Export failed', ... }, { status: 500 })
}
```

### Session Search Errors

```typescript
// UI error handling
const handleAddToSession = async (contentId: string, contentType: string) => {
  try {
    setAddingToSession(contentId)

    const response = await fetch('/api/study/session/add-content', { ... })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add content')
    }

    toast.success('Content added to session')
    setIsOpen(false) // Close dialog

  } catch (error) {
    toast.error(error.message || 'Failed to add content')
    // Keep dialog open for retry

  } finally {
    setAddingToSession(null)
  }
}
```

---

## Browser Storage

### SessionStorage Schema

**Key:** `session-search-history-{sessionId}`

**Value:**
```json
[
  {
    "query": "cardiac conduction system",
    "timestamp": "2025-10-16T10:25:00.000Z"
  },
  {
    "query": "SA node function",
    "timestamp": "2025-10-16T10:20:00.000Z"
  }
]
```

**Lifecycle:**
- Created: When first search performed in session
- Updated: On each new search (prepend, keep last 10)
- Cleared: On browser/tab close (automatic by sessionStorage)

**Access Pattern:**
```typescript
// Load
const history = JSON.parse(
  sessionStorage.getItem(`session-search-history-${sessionId}`) || '[]'
)

// Save
sessionStorage.setItem(
  `session-search-history-${sessionId}`,
  JSON.stringify(updatedHistory)
)
```

---

## Monitoring & Analytics

### Export Metrics

```typescript
// Track export events
{
  event: 'export_performed',
  userId: string,
  format: 'json' | 'csv' | 'markdown',
  resultCount: number,
  processingTime: number,
  includeMetadata: boolean,
  query: string,
  timestamp: Date
}
```

**Dashboard Metrics:**
- Exports per day/week/month
- Most exported formats
- Average processing time
- Rate limit hit frequency
- Top exported queries

### Session Search Metrics

```typescript
// Track search events
{
  event: 'session_search_performed',
  userId: string,
  sessionId: string,
  missionId: string,
  query: string,
  resultCount: number,
  contextObjective: string,
  timestamp: Date
}

// Track add-to-session events
{
  event: 'content_added_to_session',
  userId: string,
  sessionId: string,
  contentId: string,
  contentType: string,
  searchQuery: string,  // What search led to this
  timestamp: Date
}
```

**Dashboard Metrics:**
- Searches per session (average)
- Search → study conversion rate
- Most searched topics during sessions
- Content types most added to sessions

---

## Future Enhancements

### Export System
1. **Persistent Rate Limiting** (Redis)
2. **Export History** (ExportLog model)
3. **Scheduled Exports** (cron jobs)
4. **Export Templates** (custom formats)
5. **Collaborative Exports** (share with team)

### Session Search
1. **Cross-Session Search** (search across all sessions)
2. **AI-Powered Suggestions** (recommend content)
3. **Voice Search** (speech-to-text)
4. **Smart Pre-Population** (ML-based keywords)
5. **Offline Search** (service worker cache)

---

**Last Updated:** 2025-10-16
**Architecture Owner:** Backend Architecture Team
**Status:** ✅ Implemented & Documented
