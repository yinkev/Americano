# Task 6 & 7 Integration Checklist

**For Frontend Developers Integrating Export & Session Search**

---

## Prerequisites

- [x] Backend API endpoints deployed
- [x] Components available in codebase
- [ ] shadcn/ui components installed (Dialog, DropdownMenu, Toast)
- [ ] Hooks configured (useToast)

---

## Task 6: Export Functionality Integration

### Step 1: Import Component

```tsx
import { ExportButton } from '@/components/search/export-button'
```

### Step 2: Add to Search Results Page

```tsx
// In your SearchPage or SearchResults component
function SearchPage() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [results, setResults] = useState<SearchResult[]>([])

  return (
    <div>
      {/* Existing search UI */}
      <SearchBar
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
      />

      <SearchFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* ADD THIS: Export Button */}
      <div className="flex justify-between items-center mb-4">
        <h2>{results.length} Results</h2>
        <ExportButton
          query={query}
          filters={filters}
          disabled={results.length === 0}
        />
      </div>

      <SearchResults results={results} />
    </div>
  )
}
```

### Step 3: Test Export Functionality

**Manual Testing:**
- [ ] Export button visible on search page
- [ ] Button disabled when no query
- [ ] Dropdown shows 3 formats (JSON, CSV, Markdown)
- [ ] Metadata toggle works
- [ ] Rate limit counter displays (X/10 left)
- [ ] File downloads correctly
- [ ] Toast notifications appear
- [ ] Rate limit enforced at 10 exports

**Test Queries:**
```typescript
// Test with these queries
1. "cardiac conduction system" (should return ~20 results)
2. "anatomy of the heart" (should return ~50 results)
3. "" (empty - button should be disabled)

// Test formats
1. Export as JSON → verify structure
2. Export as CSV → open in Excel
3. Export as Markdown → verify readable

// Test rate limiting
1. Export 10 times rapidly
2. Verify 11th attempt returns 429 error
3. Check error message shows reset time
```

---

## Task 7: Study Session Search Integration

### Step 1: Import Component

```tsx
import { InSessionSearch } from '@/components/study/in-session-search'
```

### Step 2: Add to Study Session Page

```tsx
// In your StudySessionPage component
function StudySessionPage() {
  const session = useStudySession() // Your existing hook
  const { currentObjective } = useCurrentObjective() // Your existing hook

  // Extract keywords from objective
  const keywords = React.useMemo(() => {
    if (!currentObjective?.objective) return []

    return currentObjective.objective
      .split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 3)
  }, [currentObjective])

  // Handle adding content to session
  const handleAddToSession = async (contentId: string, contentType: string) => {
    try {
      const response = await fetch('/api/study/session/add-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          contentId,
          contentType,
          searchQuery: lastSearchQuery // Track what search led to this
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      // Refresh session data
      await session.refresh()

      return response.json()
    } catch (error) {
      console.error('Add to session failed:', error)
      throw error
    }
  }

  return (
    <div>
      {/* Existing study session UI */}
      <ObjectiveCard objective={currentObjective} />

      {/* ADD THIS: In-Session Search */}
      <InSessionSearch
        sessionId={session.id}
        missionId={session.missionId}
        currentObjective={currentObjective?.objective}
        initialKeywords={keywords}
        onAddToSession={handleAddToSession}
        onSearchPerformed={(query) => {
          // Optional: Track analytics
          console.log('Session search:', query)
        }}
      />
    </div>
  )
}
```

### Step 3: Test Session Search

**Manual Testing:**
- [ ] Press Cmd/Ctrl+K → dialog opens
- [ ] Search input auto-focused
- [ ] Context shown in dialog header
- [ ] Search pre-populated with keywords
- [ ] Press Enter → search executes
- [ ] Results display correctly
- [ ] "Add to Session" button on each result
- [ ] Click "Add to Session" → content added
- [ ] Toast notification appears
- [ ] Dialog closes after success
- [ ] Session data updated
- [ ] Press Escape → dialog closes

**Test Scenarios:**
```typescript
// Scenario 1: Contextual search
Objective: "Understand cardiac conduction system"
Keywords extracted: ["Understand", "cardiac", "conduction", "system"]
Pre-populated: "cardiac conduction system"

// Scenario 2: Search history
1. Search "cardiac output"
2. Search "stroke volume"
3. Open dialog again → see history buttons
4. Click history button → re-execute search

// Scenario 3: Add to session
1. Search "SA node"
2. Click "Add to Session" on first result
3. Verify session.newCardsStudied incremented
4. Verify content linked to session
```

---

## API Endpoint Verification

### Export API

**Endpoint:** `POST /api/graph/search/export`

**Test with curl:**
```bash
curl -X POST http://localhost:3000/api/graph/search/export \
  -H "Content-Type: application/json" \
  -d '{
    "query": "cardiac conduction",
    "format": "json",
    "includeMetadata": true
  }' \
  --output export.json

# Check file
cat export.json | jq '.results | length'  # Should show result count
```

**Expected Response Headers:**
- `Content-Type`: `application/json`
- `Content-Disposition`: `attachment; filename="search-results-*.json"`
- `X-Export-Count`: `[number]`
- `X-Processing-Time`: `[ms]`
- `X-Rate-Limit-Remaining`: `[0-10]`

### Add to Session API

**Endpoint:** `POST /api/study/session/add-content`

**Test with curl:**
```bash
# Get a valid sessionId first
SESSION_ID="[your-session-id]"
CONTENT_ID="[valid-chunk-id]"

curl -X POST http://localhost:3000/api/study/session/add-content \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"contentId\": \"$CONTENT_ID\",
    \"contentType\": \"chunk\",
    \"searchQuery\": \"cardiac output\"
  }" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "sessionId": "cm3abc123",
  "addedContent": {
    "id": "cm3xyz789",
    "type": "chunk",
    "title": "Cardiac Conduction System",
    "source": { ... }
  },
  "message": "chunk successfully added to study session"
}
```

---

## Error Handling Integration

### Export Errors

```tsx
// In your component
const handleExport = async (format: ExportFormat) => {
  try {
    const response = await fetch('/api/graph/search/export', { ... })

    // Handle rate limiting
    if (response.status === 429) {
      const error = await response.json()
      const resetIn = calculateMinutesUntil(error.resetAt)

      toast.error(`Export limit reached. Try again in ${resetIn} minutes.`)
      return
    }

    // Handle validation errors
    if (response.status === 400) {
      const error = await response.json()
      toast.error(error.message || 'Invalid export request')
      return
    }

    // Handle server errors
    if (!response.ok) {
      throw new Error('Export failed')
    }

    // Success - download file
    const blob = await response.blob()
    downloadBlob(blob, filename)
    toast.success('Export successful!')

  } catch (error) {
    toast.error('Export failed. Please try again.')
  }
}
```

### Session Search Errors

```tsx
// In your component
const handleAddToSession = async (contentId: string, contentType: string) => {
  try {
    const response = await fetch('/api/study/session/add-content', { ... })

    // Handle not found
    if (response.status === 404) {
      toast.error('Content not found')
      return
    }

    // Handle invalid session
    if (response.status === 400) {
      const error = await response.json()
      toast.error(error.error || 'Cannot add to this session')
      return
    }

    // Success
    const data = await response.json()
    toast.success(`${data.addedContent.title} added to session`)

    // Refresh session
    await refreshSession()

  } catch (error) {
    toast.error('Failed to add content. Please try again.')
  }
}
```

---

## Performance Checklist

### Export Performance

- [ ] Export <3 seconds for 100 results
- [ ] No UI blocking during export
- [ ] Progress indicator shown
- [ ] File downloads automatically
- [ ] Large exports (1000 results) complete successfully

**Optimization Tips:**
```tsx
// ✅ Good: Show loading state
const [isExporting, setIsExporting] = useState(false)

<ExportButton disabled={isExporting} />

// ✅ Good: Async download (non-blocking)
async function downloadFile() {
  setIsExporting(true)
  try {
    await fetch('/api/graph/search/export', { ... })
  } finally {
    setIsExporting(false)
  }
}
```

### Search Performance

- [ ] Search <1 second for typical queries
- [ ] Dialog opens instantly (<100ms)
- [ ] Keyboard shortcut responsive
- [ ] Search history loads quickly
- [ ] No lag when typing

**Optimization Tips:**
```tsx
// ✅ Good: Debounce search input
const debouncedQuery = useDebounce(query, 300)

// ✅ Good: Limit results for in-session search
const response = await fetch('/api/graph/search', {
  body: JSON.stringify({ query, limit: 10 }) // Not 50
})

// ✅ Good: Memoize keyword extraction
const keywords = useMemo(() => extractKeywords(objective), [objective])
```

---

## Accessibility Checklist

### Export Button

- [ ] Keyboard navigable (Tab to button, Enter to open)
- [ ] ARIA labels present (`aria-label="Export search results"`)
- [ ] Focus visible on dropdown items
- [ ] Screen reader announces state ("Exporting...")
- [ ] Error messages read by screen reader

### InSessionSearch Dialog

- [ ] Keyboard shortcut (Cmd/Ctrl+K) works
- [ ] Escape key closes dialog
- [ ] Enter key executes search
- [ ] Focus trap within dialog
- [ ] ARIA labels on all interactive elements
- [ ] Dialog title read by screen reader
- [ ] Loading states announced

---

## Security Checklist

### Export Security

- [ ] Rate limiting enforced (10/hour)
- [ ] User can only export their own data
- [ ] Query sanitization (prevent injection)
- [ ] CSV escapes quotes properly
- [ ] No sensitive data in error messages

### Session Security

- [ ] Session validation (user owns session)
- [ ] Content verification (user has access)
- [ ] Completed session protection
- [ ] XSS prevention in search history
- [ ] No sensitive data in sessionStorage

---

## Deployment Checklist

### Environment Setup

- [ ] Database migrations applied
- [ ] API routes deployed
- [ ] Components bundled
- [ ] Dependencies installed
- [ ] Environment variables set

### Monitoring Setup

- [ ] Export API logging enabled
- [ ] Rate limit metrics tracked
- [ ] Search analytics configured
- [ ] Error tracking (Sentry/etc.)
- [ ] Performance monitoring

---

## Troubleshooting Guide

### Common Issues

**Issue: Export button always disabled**
- ✅ Check `query` prop is not empty
- ✅ Verify component receives correct props
- ✅ Check console for errors

**Issue: Rate limit not working**
- ✅ Verify server is running (in-memory map persists only while running)
- ✅ Check rate limit headers in response
- ✅ Test with different user IDs

**Issue: Cmd/Ctrl+K not opening dialog**
- ✅ Verify component is mounted
- ✅ Check for conflicting keyboard shortcuts
- ✅ Ensure no other elements capturing event

**Issue: Search history not persisting**
- ✅ Verify sessionId is provided
- ✅ Check sessionStorage not disabled
- ✅ Confirm not in private/incognito mode

**Issue: Add to Session fails**
- ✅ Verify session is active (not completed)
- ✅ Check contentId is valid
- ✅ Ensure user has access to content

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- [ ] Deploy to staging environment
- [ ] Internal team testing
- [ ] Fix critical bugs
- [ ] Performance tuning

### Phase 2: Beta Users (Week 2)
- [ ] Deploy to beta environment
- [ ] Select beta testers
- [ ] Collect feedback
- [ ] Iterate on UX

### Phase 3: Production (Week 3)
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Track usage metrics
- [ ] Support user questions

---

## Success Metrics

### Export Feature
- **Usage:** >50 exports per week
- **Performance:** <3s average processing time
- **Reliability:** <1% error rate
- **Formats:** All 3 formats used regularly

### Session Search
- **Usage:** >100 searches per week
- **Conversion:** >50% searches → content added
- **Performance:** <1s average search time
- **Engagement:** >3 searches per session average

---

## Support Resources

### Documentation
- [Implementation Summary](../implementation/story-3.6-task-6-7-summary.md)
- [Developer Guide](../developer-guides/export-and-session-search-guide.md)
- [Architecture Diagram](../architecture/export-session-search-architecture.md)

### Code Examples
- Export Button: `/components/search/export-button.tsx`
- InSessionSearch: `/components/study/in-session-search.tsx`
- Export API: `/app/api/graph/search/export/route.ts`
- Add to Session API: `/app/api/study/session/add-content/route.ts`

### Contact
- **Backend Issues:** Backend Architecture Team
- **Frontend Issues:** UI/UX Team
- **API Issues:** API Team
- **Performance Issues:** Performance Engineering Team

---

**Last Updated:** 2025-10-16
**Integration Status:** ✅ Ready for Integration
**Next Review:** After production deployment
