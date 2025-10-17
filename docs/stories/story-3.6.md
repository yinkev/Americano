# Story 3.6: Advanced Search and Discovery Features

Status: Approved
Completed: 2025-10-16
Approved: 2025-10-17

## Story

As a medical student,
I want powerful search tools that help me explore and discover content,
So that I can efficiently find information and make unexpected connections.

## Acceptance Criteria

1. Advanced search supports boolean operators, field-specific queries
2. Search suggestions and autocomplete based on content and user history
3. Saved searches and search alerts for new relevant content
4. Visual search interface showing results in knowledge graph format
5. Search analytics showing most common queries and gap areas
6. Export functionality for search results and related content
7. Search integration with study sessions for seamless workflow
8. Mobile-optimized search interface for quick lookup during study

## Tasks / Subtasks

### Task 1: Implement Advanced Search Query Parser (AC: #1)
- [ ] 1.1: Design query parser for boolean operators
  - Support AND, OR, NOT operators (e.g., "cardiac AND failure NOT chronic")
  - Support parentheses for grouping: "(hypertension OR HTN) AND treatment"
  - Case-insensitive operator matching
  - Validate query syntax and provide error messages
  - Source: [Epic 3 Story 3.6 Technical Notes, lines 509]
- [ ] 1.2: Implement field-specific search syntax
  - Support field prefixes: "title:", "course:", "date:", "author:"
  - Example: "title:anatomy AND course:physiology"
  - Field validation against available metadata fields
  - Combine field filters with semantic search
  - Date range syntax: "date:2024-01-01..2024-12-31"
- [ ] 1.3: Create QueryBuilder utility class
  - Location: `apps/web/src/lib/query-builder.ts`
  - Method: `parseQuery(query: string): ParsedQuery`
  - Method: `buildSemanticQuery(parsed: ParsedQuery): SemanticQuery`
  - Method: `buildFilterQuery(parsed: ParsedQuery): FilterQuery`
  - Combine semantic similarity with boolean logic
- [ ] 1.4: Update search API endpoint
  - Modify `/api/graph/search` to accept advanced query syntax
  - Parse and execute boolean queries with semantic search
  - Return query execution plan for debugging
  - Performance optimization for complex queries (<2s for most queries)

### Task 2: Build Search Suggestions and Autocomplete (AC: #2)
- [ ] 2.1: Create search suggestion engine
  - Location: `apps/web/src/subsystems/knowledge-graph/search-suggestions.ts`
  - Method: `getSuggestions(partial: string, limit: number): Promise<Suggestion[]>`
  - Suggestions from: medical terms, previous searches, content titles, learning objectives
  - Rank by: frequency, recency, semantic relevance
  - Source: [Epic 3 Story 3.6 AC #2]
- [ ] 2.2: Implement autocomplete data model
  - Add to Prisma schema: `SearchSuggestion` model
  - Fields: `term`, `frequency`, `lastUsed`, `suggestionType`, `metadata`
  - Index: `@@index([term, frequency])`
  - Types: "medical_term", "previous_search", "content_title", "concept"
- [ ] 2.3: Build autocomplete API endpoint
  - Create `/api/graph/autocomplete` GET endpoint
  - Query params: `q` (partial query), `limit` (default 10)
  - Response: `{ suggestions: Suggestion[], total: number }`
  - Suggestion format: `{ text, type, metadata, score }`
  - Debounced requests on frontend (150ms delay)
- [ ] 2.4: Create autocomplete UI component
  - Location: `apps/web/src/components/search/search-autocomplete.tsx`
  - Dropdown appears below search bar with suggestions
  - Keyboard navigation: Up/Down arrows, Enter to select, Escape to close
  - Click to select suggestion
  - Visual indicators for suggestion type (icon, badge)
  - Show recent searches at top when input is empty

### Task 3: Implement Saved Searches and Alerts (AC: #3)
- [ ] 3.1: Create SavedSearch data model
  - Add to Prisma schema: `SavedSearch` model
  - Fields: `userId`, `name`, `query`, `filters`, `alertEnabled`, `lastRun`, `createdAt`
  - Relations: `searchAlerts` (one-to-many with SearchAlert)
  - Index: `@@index([userId, createdAt])`
- [ ] 3.2: Build saved search API endpoints
  - `POST /api/graph/searches/save` - Save new search
  - `GET /api/graph/searches/saved` - List user's saved searches
  - `PUT /api/graph/searches/saved/:id` - Update saved search
  - `DELETE /api/graph/searches/saved/:id` - Delete saved search
  - `POST /api/graph/searches/saved/:id/run` - Execute saved search
- [ ] 3.3: Implement search alerts system
  - Add `SearchAlert` model with fields: `savedSearchId`, `frequency`, `lastNotified`
  - Frequency options: "immediate", "daily", "weekly"
  - Background job checks for new content matching saved searches
  - Notification when new results found
  - Email digest for daily/weekly alerts (future enhancement)
- [ ] 3.4: Create saved searches UI
  - Location: `apps/web/src/components/search/saved-searches.tsx`
  - Sidebar or dropdown showing saved searches
  - Click to run saved search
  - Edit/Delete buttons for each saved search
  - Toggle switch for alert enable/disable
  - "New results" badge when alert triggered
  - Export saved searches to JSON for backup

### Task 4: Visual Search with Knowledge Graph Integration (AC: #4)
- [ ] 4.1: Create graph-based search result view
  - Location: `apps/web/src/components/search/search-graph-view.tsx`
  - Integrate with React Flow (existing knowledge graph library)
  - Display search results as nodes in graph
  - Show relationships between result nodes
  - Color-code by relevance score (gradient: low to high)
  - Source: [solution-architecture.md#Technology Stack, line 1740]
- [ ] 4.2: Implement result clustering in graph view
  - Group similar results into clusters
  - Cluster by: course, topic, concept similarity
  - Visual cluster boundaries or grouping
  - Expand/collapse clusters for exploration
  - Click node to view detailed result
- [ ] 4.3: Add graph navigation controls
  - Zoom in/out controls
  - Pan across graph
  - Reset view button
  - Toggle between graph view and list view
  - Filter nodes by type (lecture, chunk, concept)
  - Highlight search terms in graph
- [ ] 4.4: Implement "expand search" from graph nodes
  - Right-click or button on node to "Search related"
  - Automatically perform semantic search using node content
  - Add results to existing graph view
  - Build exploration path for discovery workflow
  - Breadcrumb trail showing search expansion history

### Task 5: Search Analytics and Insights (AC: #5)
- [ ] 5.1: Create SearchAnalytics data model
  - Add to Prisma schema: `SearchAnalytics` model
  - Aggregate fields: `query`, `resultCount`, `avgClickPosition`, `timestamp`
  - Extend existing `SearchHistory` (from Story 3.1) if present
  - Track: query frequency, zero-result queries, popular filters
- [ ] 5.2: Build analytics collection
  - Track search queries in real-time
  - Capture: query text, result count, filters used, clicked results, time to click
  - Async logging (don't block search response)
  - Privacy: Only track for authenticated users with consent
  - Aggregate daily for performance
- [ ] 5.3: Create analytics dashboard
  - Location: `apps/web/src/app/search/analytics/page.tsx`
  - Most searched terms (top 20, bar chart or word cloud)
  - Search frequency over time (line chart, 7/30/90 days)
  - Zero-result queries (identify content gaps)
  - Popular search filters and combinations
  - Click-through rate by result position
- [ ] 5.4: Implement gap analysis
  - Identify topics with high search volume but low content
  - Query: "frequently searched but few results"
  - Recommend content to add based on search patterns
  - Display in analytics dashboard as actionable insights
  - Integration with daily missions: "Consider adding content on [topic]"

### Task 6: Search Result Export Functionality (AC: #6)
- [ ] 6.1: Create export API endpoint
  - `POST /api/graph/search/export` - Export search results
  - Request: `{ query, filters, format }`
  - Formats: JSON, CSV, Markdown, PDF
  - Response: File download with appropriate Content-Type
  - Include: result metadata, snippets, source attribution
- [ ] 6.2: Implement JSON export
  - Full search result data in structured JSON
  - Include: query, filters, results array with all metadata
  - Timestamp and user information
  - Format for re-import or external processing
- [ ] 6.3: Implement CSV export
  - Tabular format for spreadsheet analysis
  - Columns: title, snippet, similarity, course, date, pageNumber, lectureId
  - Properly escaped CSV formatting
  - Include header row
- [ ] 6.4: Implement Markdown export
  - Human-readable formatted results
  - Include: search query, result count, results list with links
  - Format: "## [Title] - Similarity: 0.85\n\nSnippet...\n\nSource: [Course] - Page X"
  - Suitable for notes or documentation
- [ ] 6.5: Add export UI controls
  - "Export results" button on search page
  - Format selection dropdown
  - Download progress indicator for large exports
  - Limit: Export max 1000 results (configurable)
  - Notification on export completion

### Task 7: Study Session Search Integration (AC: #7)
- [ ] 7.1: Add in-session search widget
  - Location: `apps/web/src/components/study/in-session-search.tsx`
  - Floating search button/icon during study sessions
  - Quick search without leaving study mode
  - Keyboard shortcut: Cmd/Ctrl + K
  - Search results in sidebar or modal overlay
- [ ] 7.2: Implement contextual search
  - Automatic search context from current study content
  - Pre-populate search with current topic/concept
  - "Search related to current card" button
  - Filter results to relevant course by default
  - Option to expand search beyond current context
- [ ] 7.3: Create "Add to current session" feature
  - Button on search results: "Review this in current session"
  - Add result content to current study queue
  - Seamless integration with flashcard system
  - Track session additions for analytics
  - Limit: Max 5 additions per session to avoid overload
- [ ] 7.4: Build session search history
  - Track searches performed during study sessions
  - Session summary shows searched topics
  - Identify knowledge gaps based on session searches
  - Integration with behavioral analytics (Epic 5)
  - Use for mission generation: "You searched for X, let's study it"

### Task 8: Mobile-Optimized Search Interface (AC: #8)
- [ ] 8.1: Create mobile-first search layout
  - Responsive design: Full-width search bar on mobile
  - Touch-friendly UI elements (min 44px tap targets)
  - Swipeable filters drawer (slide from left/right)
  - Bottom sheet for autocomplete suggestions
  - Optimized for one-handed use
- [ ] 8.2: Implement mobile search interactions
  - Voice search input (browser's speech API)
  - Camera search: OCR from photos (future enhancement, defer for MVP)
  - Pull-to-refresh search results
  - Infinite scroll instead of pagination
  - "Scroll to top" button for long result lists
- [ ] 8.3: Optimize mobile search performance
  - Reduce result payload size for mobile
  - Lazy load images and heavy content
  - Prefetch autocomplete suggestions
  - Cache recent searches locally
  - Target: <1s search on 4G connection
- [ ] 8.4: Add offline search capabilities
  - Service worker caching for recent searches
  - Local search in cached content
  - "No connection" message with cached results
  - Sync search history when online
  - PWA offline mode integration

### Task 9: Search Performance Optimization (AC: #1, #8)
- [ ] 9.1: Implement search result caching
  - Redis or in-memory cache for common queries
  - Cache key: hash of (query + filters)
  - TTL: 1 hour for query results
  - Invalidate cache when new content added
  - Cache hit rate monitoring
  - Source: [Epic 3 Story 3.6 Technical Notes, line 512]
- [ ] 9.2: Optimize complex query execution
  - Query plan analysis for boolean queries
  - Short-circuit evaluation for OR queries
  - Parallel execution for independent AND clauses
  - Index usage verification for field filters
  - Target: <2s for complex boolean queries
- [ ] 9.3: Add search query optimization
  - Stop word removal for better performance
  - Query normalization (lowercase, trim, etc.)
  - Medical term expansion (cache expanded terms)
  - Limit complexity: Max 5 boolean operators per query
  - Warn user if query too complex
- [ ] 9.4: Implement search rate limiting
  - Rate limit: 60 searches per minute per user
  - Sliding window algorithm
  - Error message: "Too many searches, please wait"
  - Exempt saved search alerts from rate limiting
  - Monitor for abuse patterns

### Task 10: Testing and Quality Assurance
- [ ] 10.1: Test advanced query parsing
  - Unit tests for QueryBuilder
  - Test cases: Simple AND/OR, nested parentheses, field filters, edge cases
  - Invalid syntax handling: Missing quotes, unmatched parentheses
  - Medical term handling in boolean queries
- [ ] 10.2: Test autocomplete accuracy
  - Verify suggestion ranking algorithm
  - Test with medical terminology dataset
  - Measure suggestion relevance (manual review)
  - Performance test: <100ms for autocomplete response
- [ ] 10.3: Test saved searches and alerts
  - Create, update, delete saved searches
  - Alert triggering when new content matches
  - Alert frequency respect (daily, weekly)
  - Concurrent saved search execution
- [ ] 10.4: Test graph view performance
  - Test with 50, 100, 200 result nodes
  - Verify smooth interactions (zoom, pan)
  - Check for memory leaks in graph rendering
  - Mobile graph view usability
- [ ] 10.5: Test export functionality
  - Generate exports in all formats (JSON, CSV, Markdown)
  - Verify data integrity in exports
  - Test large exports (1000 results)
  - Download functionality across browsers
- [ ] 10.6: Mobile testing
  - Test on iOS and Android devices
  - Verify touch interactions
  - Performance on slow connections
  - Offline functionality
  - Voice search (if implemented)

## Dev Notes

### Architecture Context

**Subsystem:** Knowledge Graph & Semantic Search (Subsystem 3)
- Primary implementation in: `apps/web/src/subsystems/knowledge-graph/`
- API routes: `apps/web/src/app/api/graph/`
- UI components: `apps/web/src/components/search/`

**Technology Stack:**
- **Query Parsing:** Custom parser (TypeScript) for boolean operators
- **Autocomplete:** Debounced API calls, fuzzy matching
- **Graph Visualization:** React Flow (already in stack from Story 3.2)
- **Export:** Server-side generation (Node.js streams for large files)
- **Caching:** In-memory cache (Map with TTL) or Redis (if available)

**Source:** [solution-architecture.md#Section 3, lines 551-575; Epic 3 Story 3.6]

### Integration Points

**Existing Infrastructure to Leverage:**

1. **SemanticSearchEngine** (from Story 3.1)
   - Location: `apps/web/src/subsystems/knowledge-graph/semantic-search.ts`
   - Extend with advanced query support
   - Add boolean operator execution
   - Integrate with QueryBuilder

2. **Knowledge Graph Visualization** (Story 3.2)
   - Location: `apps/web/src/components/graph/knowledge-graph.tsx`
   - Reuse React Flow implementation
   - Adapt for search result visualization
   - Add clustering algorithms

3. **SearchHistory Model** (from Story 3.1)
   - Extend for analytics tracking
   - Add fields for click tracking, filters used
   - Aggregate queries for analytics dashboard

4. **Study Session System** (Story 2.5)
   - Location: `apps/web/src/subsystems/learning-engine/session-orchestrator.ts`
   - Integrate search widget into study UI
   - Add search results to session queue
   - Track session search behavior

**Source:** [Story 3.1 Dev Notes, Story 3.2 references, solution-architecture.md]

### Performance Considerations

**Query Parsing:**
- Parse query client-side before API call (validate syntax)
- Server-side re-parsing for security
- Cache parsed query structures for repeated searches
- Max query complexity: 5 boolean operators, 3 nesting levels

**Autocomplete:**
- Debounce: 150ms to reduce API calls
- Client-side caching of suggestions (session storage)
- Server-side suggestion cache (1 hour TTL)
- Max suggestions: 10 per request

**Search Caching:**
- Cache common queries (e.g., "cardiac anatomy")
- Cache hit rate target: >40% for reduced load
- Invalidate cache on content updates
- Memory limit: 100MB for search cache

**Graph Rendering:**
- Limit visible nodes: Max 200 in view
- Virtualization for large graphs
- Progressive loading: Show top results first
- Debounce zoom/pan interactions

**Target Performance:**
- Simple query: <1 second (maintained from Story 3.1)
- Complex boolean query: <2 seconds
- Autocomplete: <100ms
- Export (100 results): <3 seconds
- Mobile search: <1s on 4G

**Source:** [Epic 3 Success Criteria, NFR1 Performance Requirements]

### Medical Content Specificity

**Boolean Query Examples:**
- "cardiac AND (failure OR insufficiency) NOT chronic"
- "hypertension OR HTN" (synonym handling)
- "title:anatomy AND course:physiology"
- "(diabetes OR DM) AND treatment NOT insulin"

**Autocomplete Medical Terms:**
- Prioritize medical terminology over common words
- Include acronym expansions: "MI" → "myocardial infarction"
- Suggest related anatomical terms
- Include common misspellings: "sepsis" suggestions for "sepsus"

**Search Analytics Insights:**
- Most searched anatomy topics
- Common pathology queries
- Frequently searched but low-content topics (gap analysis)
- Search patterns by course or exam proximity

**Export Use Cases:**
- Export search results for study guide creation
- CSV export for flashcard import (Anki, Quizlet)
- Markdown export for note integration
- PDF export for printable study sheets (future)

### User Experience Notes

**Advanced Search Discovery:**
- "Search tips" button showing boolean operator syntax
- Example queries on search page: "Try: cardiac AND failure"
- Progressive disclosure: Simple search → Advanced options
- Syntax highlighting in search input (future enhancement)

**Saved Search Workflows:**
- Quick save button after search
- Name saved search with auto-generated default
- Organize saved searches by folder/tag (future)
- Share saved searches with study groups (future)

**Graph View Navigation:**
- Tutorial overlay on first graph view
- "Related to this" button for exploration
- Breadcrumb trail for search path
- "Back to list view" toggle

**Mobile Considerations:**
- Voice search for hands-free lookup during study
- Bottom navigation bar for quick access
- Swipe gestures: Left (filters), Right (saved searches)
- Haptic feedback for interactions (iOS/Android)

**Error Handling:**
- Invalid query syntax: Inline error with suggestion
- No autocomplete results: "Try searching for..."
- Zero search results: Suggest removing filters
- Export failure: Retry button, error details

**Source:** [ux-specification.md#Search patterns, UX Design Principles]

### Security and Privacy

**Query Security:**
- Sanitize boolean operators to prevent injection
- Limit query complexity to prevent DoS
- Rate limiting on autocomplete and search APIs
- Validate field names in field-specific queries

**Data Privacy:**
- Search history private to user
- Analytics aggregated anonymously
- Saved searches encrypted at rest (future)
- Export contains no PII beyond user's own data

**API Security:**
- Authenticated endpoints (require user session)
- CSRF protection for mutations
- Rate limiting: 60 searches/min, 120 autocomplete/min
- Export rate limit: 10 exports per hour

**Source:** [NFR3 Security & Privacy, solution-architecture.md#API Security]

### Testing Strategy

**Unit Tests:**
- QueryBuilder: Parse all operator combinations
- SearchSuggestions: Ranking algorithm correctness
- Export generators: Format validation for JSON/CSV/Markdown

**Integration Tests:**
- End-to-end: Complex boolean query → Results → Export
- Autocomplete: Type query → Suggestions → Select → Search
- Saved search: Save → Alert trigger → Notification
- Graph view: Search → Graph render → Node click → Details

**Performance Tests:**
- Load test: 100 concurrent complex queries
- Cache effectiveness: Hit rate measurement
- Mobile: Network throttling (3G, 4G)
- Large exports: 1000 results in <5 seconds

**Manual Testing:**
- Medical query accuracy for boolean operators
- Autocomplete relevance for medical terms
- Graph view usability on desktop and mobile
- Export file integrity and formatting

**No automated tests required for MVP** (per solution-architecture.md)

### Project Structure Notes

**New Files to Create:**
```
apps/web/src/
├── lib/
│   ├── query-builder.ts                    # Boolean query parser
│   └── search-cache.ts                     # Search result caching
├── subsystems/
│   └── knowledge-graph/
│       ├── search-suggestions.ts           # Autocomplete engine
│       └── search-analytics.ts             # Analytics tracking
├── app/
│   ├── search/
│   │   ├── analytics/
│   │   │   └── page.tsx                   # Analytics dashboard
│   │   └── saved/
│   │       └── page.tsx                   # Saved searches page
│   └── api/
│       └── graph/
│           ├── autocomplete/route.ts       # Autocomplete API
│           ├── searches/
│           │   ├── save/route.ts          # Save search
│           │   ├── saved/route.ts         # List saved searches
│           │   └── saved/[id]/
│           │       ├── route.ts           # Get/update/delete saved search
│           │       └── run/route.ts       # Execute saved search
│           └── search/
│               └── export/route.ts        # Export results
└── components/
    └── search/
        ├── search-autocomplete.tsx         # Autocomplete dropdown
        ├── saved-searches.tsx              # Saved search list
        ├── search-graph-view.tsx           # Graph visualization
        ├── advanced-query-builder.tsx      # Query builder UI (optional)
        └── search-export.tsx               # Export controls
    └── study/
        └── in-session-search.tsx           # Study mode search widget

prisma/schema.prisma                        # Add SavedSearch, SearchAlert, SearchAnalytics models

scripts/
└── analyze-search-gaps.ts                  # Content gap analysis script
```

**Source:** [solution-architecture.md#Section 8, Epic 3 Story 3.6]

### References

**Technical Documentation:**
- [solution-architecture.md#Subsystem 3, lines 551-575] - Knowledge Graph subsystem
- [solution-architecture.md#API Endpoints, lines 1332-1344] - Search API spec
- [solution-architecture.md#Technology Stack, line 1740] - React Flow for graphs
- [Epic 3 Story 3.6, lines 492-513] - Original story specification

**Requirements Documentation:**
- [epics-Americano-2025-10-14.md#Story 3.6, lines 492-513] - Story details
- [PRD-Americano-2025-10-14.md#FR15, lines 159-163] - Search & Discovery requirement
- [PRD-Americano-2025-10-14.md#NFR1, lines 167-171] - Performance requirements

**Previous Stories:**
- Story 3.1: Semantic Search Implementation (foundation)
- Story 3.2: Knowledge Graph Construction (graph visualization)
- Story 3.5: Context-Aware Content Recommendations (recommendation engine)
- Story 2.5: Time-Boxed Study Session Orchestration (session integration)

### Known Issues / Risks

**Risk 1: Query Parsing Complexity**
- Complex boolean queries may be difficult for users to construct
- Mitigation: Provide query builder UI (visual interface), example queries, syntax help
- Alternative: Start with simple AND/OR, defer complex nesting to v2

**Risk 2: Graph Rendering Performance**
- Large result sets (>200 nodes) may cause performance issues
- Mitigation: Limit visible nodes, implement clustering, progressive loading
- Monitor: Frame rate during interactions, memory usage

**Risk 3: Autocomplete Latency**
- Medical term database may be large, slowing autocomplete
- Mitigation: Index optimization, client-side caching, debouncing
- Target: <100ms response time maintained

**Risk 4: Cache Invalidation Complexity**
- Determining when to invalidate cached searches is complex
- Mitigation: Simple TTL-based cache (1 hour), invalidate on content updates
- Trade-off: May serve stale results briefly, acceptable for MVP

**Risk 5: Export Performance for Large Results**
- Exporting 1000 results may timeout or consume excessive memory
- Mitigation: Streaming exports, pagination for large sets, background job (future)
- Limit: 1000 results max per export for MVP

**Decision Required:**
- Visual query builder UI vs. text-based syntax only?
- Recommendation: Start text-based with examples, add visual builder in Epic 3.7 if user feedback requests it

**Decision Required:**
- Voice search for mobile - Include in MVP or defer?
- Recommendation: Defer to v2, browser speech API simple but requires testing across devices

## Dev Agent Record

### Context Reference

- **Story Context XML**: `docs/stories/story-context-3.6.xml` (Generated: 2025-10-16)

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
