# Export & Session Search Developer Guide

**Quick Reference for Tasks 6 & 7 - Story 3.6**

---

## Table of Contents
1. [Export Functionality](#export-functionality)
2. [Study Session Search](#study-session-search)
3. [API Reference](#api-reference)
4. [Common Patterns](#common-patterns)
5. [Troubleshooting](#troubleshooting)

---

## Export Functionality

### Basic Usage

```tsx
import { ExportButton } from '@/components/search/export-button'

function SearchPage() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})

  return (
    <div>
      {/* Search UI */}
      <ExportButton
        query={query}
        filters={filters}
      />
    </div>
  )
}
```

### Export Formats

#### JSON Export
**Best for:** API consumption, data processing
**Structure:**
```json
{
  "exportedAt": "2025-10-16T10:30:00.000Z",
  "format": "json",
  "totalResults": 50,
  "results": [
    {
      "id": "...",
      "type": "lecture",
      "title": "Cardiac Physiology",
      "snippet": "...",
      "similarity": 0.89,
      "relevanceScore": 0.85,
      "metadata": { ... }
    }
  ]
}
```

#### CSV Export
**Best for:** Excel, spreadsheet analysis
**Columns:**
- ID, Type, Title, Content, Source, Score, Date
- (Optional) Course, Lecture, Page

#### Markdown Export
**Best for:** Documentation, sharing, printing
**Format:**
```markdown
# Search Results Export
**Exported:** Oct 16, 2025
**Total Results:** 50

## 1. Cardiac Physiology
**Type:** lecture
**Relevance Score:** 85.0%

### Content Preview
The heart pumps blood through...

### Source Information
- **Course:** Physiology (PHYS 501)
- **Date:** Oct 15, 2025
```

### Rate Limiting

**Limit:** 10 exports per hour per user

**Handling:**
```tsx
// Rate limit info in response headers
const response = await fetch('/api/graph/search/export', { ... })

const remaining = response.headers.get('X-Rate-Limit-Remaining') // e.g., "7"
const resetTime = response.headers.get('X-Rate-Limit-Reset')     // ISO date

if (response.status === 429) {
  const error = await response.json()
  // error.message: "You have reached the export limit..."
  // error.resetAt: "2025-10-16T11:30:00.000Z"
}
```

**UI Updates:**
- ExportButton automatically shows remaining exports
- Warning badge when ≤3 exports left
- Disables button when limit reached

---

## Study Session Search

### Basic Integration

```tsx
import { InSessionSearch } from '@/components/study/in-session-search'

function StudySessionPage() {
  const session = useStudySession()
  const currentObjective = useCurrentObjective()

  const handleAddToSession = async (contentId: string, contentType: string) => {
    const response = await fetch('/api/study/session/add-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        contentId,
        contentType,
        searchQuery: lastSearchQuery // optional
      })
    })

    if (!response.ok) throw new Error('Failed to add content')

    // Refresh session data
    await session.refresh()
  }

  return (
    <div>
      {/* Study session UI */}

      <InSessionSearch
        sessionId={session.id}
        missionId={session.missionId}
        currentObjective={currentObjective?.objective}
        initialKeywords={extractKeywords(currentObjective)}
        onAddToSession={handleAddToSession}
        onSearchPerformed={(query) => {
          // Track search analytics
          trackEvent('session_search', { query, sessionId: session.id })
        }}
      />
    </div>
  )
}
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search dialog |
| `Escape` | Close dialog |
| `Enter` | Perform search |
| `↑/↓` | Navigate results (future) |

### Contextual Pre-Population

**Automatic Context Detection:**
```tsx
// Extract keywords from current objective
function extractKeywords(objective?: string): string[] {
  if (!objective) return []

  // Remove common words, extract medical terms
  const stopWords = ['the', 'a', 'an', 'of', 'in', 'on', 'at', ...]
  const words = objective
    .toLowerCase()
    .split(/\s+/)
    .filter(word => !stopWords.includes(word) && word.length > 3)

  return words.slice(0, 5) // Top 5 keywords
}

// Usage
<InSessionSearch
  initialKeywords={extractKeywords("Understand cardiac conduction system pathways")}
  // Pre-populates: "cardiac conduction system pathways"
/>
```

### Search History

**Storage:** Browser `sessionStorage`
**Key:** `session-search-history-{sessionId}`
**Retention:** Until browser/tab closes

**Format:**
```json
[
  { "query": "cardiac conduction", "timestamp": "2025-10-16T10:25:00Z" },
  { "query": "SA node function", "timestamp": "2025-10-16T10:20:00Z" }
]
```

**Accessing History:**
```tsx
// In custom hook
function useSessionSearchHistory(sessionId?: string) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])

  useEffect(() => {
    if (!sessionId) return

    const key = `session-search-history-${sessionId}`
    const stored = sessionStorage.getItem(key)

    if (stored) {
      setHistory(JSON.parse(stored))
    }
  }, [sessionId])

  return history
}
```

---

## API Reference

### POST /api/graph/search/export

**Request:**
```typescript
{
  query?: string,             // Search query (required if no searchId)
  searchId?: string,          // Saved search ID (future)
  filters?: {
    courseIds?: string[],
    category?: string,
    dateRange?: { start: Date, end: Date },
    contentTypes?: ('lecture' | 'chunk' | 'concept')[],
    minSimilarity?: number
  },
  format: 'json' | 'csv' | 'markdown',
  includeMetadata: boolean    // Default: true
}
```

**Response (200):**
- **Headers:**
  - `Content-Type`: `application/json` | `text/csv` | `text/markdown`
  - `Content-Disposition`: `attachment; filename="..."`
  - `X-Export-Count`: Number of results
  - `X-Processing-Time`: Processing time in ms
  - `X-Rate-Limit-Remaining`: Exports remaining
  - `X-Rate-Limit-Reset`: Reset timestamp

**Response (429 - Rate Limited):**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have reached the export limit of 10 exports per hour. Try again in 45 minutes.",
  "resetAt": "2025-10-16T11:30:00.000Z"
}
```

### POST /api/study/session/add-content

**Request:**
```typescript
{
  sessionId: string,
  contentId: string,
  contentType: 'lecture' | 'chunk' | 'concept' | 'objective',
  searchQuery?: string        // Optional: for analytics
}
```

**Response (200):**
```json
{
  "success": true,
  "sessionId": "cm3abc123",
  "addedContent": {
    "id": "cm3xyz789",
    "type": "chunk",
    "title": "Cardiac Conduction System",
    "source": {
      "lectureTitle": "Cardiac Physiology",
      "courseName": "Physiology (PHYS 501)",
      "pageNumber": 12
    }
  },
  "message": "chunk successfully added to study session"
}
```

**Response (404):**
```json
{
  "error": "Study session not found"
}
```

**Response (400):**
```json
{
  "error": "Cannot add content to completed session"
}
```

---

## Common Patterns

### Pattern 1: Export Button with Loading State

```tsx
function SearchResults({ query, results }) {
  const [isExporting, setIsExporting] = useState(false)

  return (
    <div>
      <div className="flex justify-between">
        <h2>{results.length} Results</h2>
        <ExportButton
          query={query}
          disabled={isExporting || results.length === 0}
        />
      </div>

      {/* Results */}
    </div>
  )
}
```

### Pattern 2: Contextual Session Search

```tsx
function ObjectiveStudyCard({ objective }) {
  const session = useStudySession()
  const [showSearch, setShowSearch] = useState(false)

  // Extract keywords from objective
  const keywords = React.useMemo(() => {
    return objective.objective
      .split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 3)
  }, [objective])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{objective.objective}</CardTitle>
        <Button onClick={() => setShowSearch(true)}>
          Search Related Content
        </Button>
      </CardHeader>

      <InSessionSearch
        sessionId={session.id}
        currentObjective={objective.objective}
        initialKeywords={keywords}
        onAddToSession={async (contentId, contentType) => {
          await addContentToSession(session.id, contentId, contentType)
          toast.success("Content added to study session")
        }}
      />
    </Card>
  )
}
```

### Pattern 3: Export with Custom Filters

```tsx
function AdvancedSearchPage() {
  const [query, setQuery] = useState('')
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [minSimilarity, setMinSimilarity] = useState(0.7)

  const filters: SearchFilters = {
    courseIds: selectedCourses,
    minSimilarity,
    contentTypes: ['lecture', 'chunk']
  }

  return (
    <div>
      <SearchFilters
        selectedCourses={selectedCourses}
        onCoursesChange={setSelectedCourses}
        minSimilarity={minSimilarity}
        onSimilarityChange={setMinSimilarity}
      />

      <ExportButton
        query={query}
        filters={filters}
      />
    </div>
  )
}
```

---

## Troubleshooting

### Export Issues

**Problem:** Export button disabled
- ✅ Check `query` is not empty
- ✅ Check not rate limited (10/hour max)
- ✅ Check results exist

**Problem:** Export takes >3 seconds
- ✅ Limit results (max 1000)
- ✅ Check database performance
- ✅ Consider pagination

**Problem:** Rate limit not resetting
- ⚠️ In-memory rate limit resets on server restart
- 🔧 Production: Use Redis for persistent rate limiting

### Session Search Issues

**Problem:** Cmd+K shortcut not working
- ✅ Check component is mounted
- ✅ Check no conflicting shortcuts
- ✅ Verify event listener attached

**Problem:** Search history not persisting
- ✅ Verify `sessionId` provided
- ✅ Check sessionStorage not cleared
- ⚠️ History lost on browser close (by design)

**Problem:** Add to Session fails
- ✅ Verify session is active (not completed)
- ✅ Check content exists
- ✅ Verify API endpoint reachable

---

## Performance Tips

### Export Optimization
```tsx
// ✅ Good: Limit results
<ExportButton query={query} />

// ❌ Bad: Exporting all results (>1000)
// Will be capped at 1000 automatically
```

### Session Search Optimization
```tsx
// ✅ Good: Debounce search input
const debouncedQuery = useDebounce(query, 300)

// ✅ Good: Limit initial results
const response = await fetch('/api/graph/search', {
  body: JSON.stringify({ query, limit: 10 }) // Not 50
})
```

---

## Security Considerations

### Export Security
- ✅ Rate limiting prevents abuse
- ✅ Query validation (Zod schema)
- ✅ CSV injection prevention (quote escaping)
- ⚠️ MVP uses hardcoded user (add auth in production)

### Session Security
- ✅ Session ownership validation
- ✅ Completed session protection
- ✅ Content existence verification
- ⚠️ Search query sanitization (prevent XSS)

---

## Best Practices

### DO ✅
- Validate export format before API call
- Show loading states during export
- Display rate limit warnings
- Track export analytics
- Pre-populate session search with context
- Clear search history on session end
- Handle keyboard shortcuts gracefully

### DON'T ❌
- Export without user confirmation (large exports)
- Ignore rate limit headers
- Store sensitive data in search history
- Hard-code sessionId (pass as prop)
- Forget to handle API errors
- Block UI during async operations

---

## Migration Notes (MVP → Production)

### Export System
1. **Rate Limiting:** Move from in-memory to Redis
   ```typescript
   // Replace in-memory map with Redis
   const rateLimitKey = `export:rate:${userId}`
   await redis.incr(rateLimitKey)
   await redis.expire(rateLimitKey, 3600) // 1 hour
   ```

2. **Export History:** Add `ExportLog` model
   ```prisma
   model ExportLog {
     id          String   @id @default(cuid())
     userId      String
     query       String
     format      String
     resultCount Int
     exportedAt  DateTime @default(now())
   }
   ```

### Session Search
1. **Persistent History:** Move from sessionStorage to database
   ```prisma
   model SessionSearchHistory {
     id        String   @id @default(cuid())
     sessionId String
     query     String
     timestamp DateTime @default(now())
   }
   ```

2. **Advanced Analytics:** Track search → study conversion
   ```typescript
   // Track if search led to objective completion
   await trackSearchConversion(searchQuery, objectiveId, completed)
   ```

---

**Last Updated:** 2025-10-16
**Maintained By:** Backend Architecture Team
**Related Stories:** Story 3.6 (Tasks 6 & 7)
