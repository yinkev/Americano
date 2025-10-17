# Story 3.1: Semantic Search Implementation with Vector Embeddings

Status: Ready

## Story

As a medical student,
I want to search my content using natural language questions,
So that I can quickly find relevant information without remembering exact keywords.

## Acceptance Criteria

1. Content processed into vector embeddings using Gemini text-embedding model
2. Natural language search queries processed and vectorized for similarity matching
3. Search results ranked by semantic relevance with confidence scores
4. Search interface supports complex medical terminology and concepts
5. Results display with context snippets and source attribution
6. Search history maintained for repeated queries and pattern analysis
7. Advanced search filters for content type, course, and date ranges
8. Search performance <1 second for typical queries across full content database

## Tasks / Subtasks

### Task 1: Configure Embedding Generation Pipeline (AC: #1)
- [ ] 1.1: Verify Gemini embedding configuration
  - Confirm text-embedding-001 model with output_dimensionality: 1536
  - Verify API credentials and rate limiting settings
  - Test embedding generation with sample medical content
  - Source: [solution-architecture.md#AI/ML section, Story 2.1 corrections]
- [ ] 1.2: Update Prisma schema for Lecture embeddings
  - Already exists: `Lecture.embedding` field (vector(1536))
  - Verify pgvector extension enabled
  - Create vector index if not present: `CREATE INDEX lectures_embedding_idx ON lectures USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
  - Source: [solution-architecture.md#Database Schema, lines 813-814, 1146-1154]
- [ ] 1.3: Create `EmbeddingService` utility class
  - Location: `apps/web/src/lib/embedding-service.ts`
  - Method: `generateEmbedding(text: string): Promise<number[]>`
  - Method: `generateBatchEmbeddings(texts: string[]): Promise<number[][]>`
  - Implements retry logic and error handling
  - Rate limiting: Max 60 requests/minute (Gemini API limit)
- [ ] 1.4: Implement content chunking strategy
  - Chunk size: 1000 tokens (~750 words) for optimal embedding quality
  - Overlap: 200 tokens between chunks for context preservation
  - Store chunk metadata: lectureId, chunkIndex, pageNumber
  - Already modeled: `ContentChunk` table with embedding field
  - Source: [solution-architecture.md#Database Schema, lines 810-824]

### Task 2: Implement Embedding Generation on Content Upload (AC: #1)
- [ ] 2.1: Extend PDF processing pipeline
  - Location: `apps/web/src/subsystems/content-processing/pdf-processor.ts`
  - After OCR extraction, generate embeddings for each content chunk
  - Update processing status: PROCESSING → EMBEDDING → COMPLETED
  - Add error state: EMBEDDING_FAILED with retry mechanism
- [ ] 2.2: Create batch embedding job
  - Process embeddings in batches of 10 for efficiency
  - Progress tracking: Store embedding progress in Lecture model
  - Add field: `embeddingProgress: Float` (0.0 to 1.0)
  - Emit progress events for UI updates
- [ ] 2.3: Backfill embeddings for existing content
  - Create migration script: `scripts/backfill-embeddings.ts`
  - Process all lectures with `processingStatus = COMPLETED` and `embedding IS NULL`
  - Rate limit: 10 embeddings/minute to avoid API throttling
  - Log progress and errors for monitoring

### Task 3: Build Semantic Search Engine (AC: #2, #3, #8)
- [ ] 3.1: Create `SemanticSearchEngine` class
  - Location: `apps/web/src/subsystems/knowledge-graph/semantic-search.ts`
  - Method: `search(query: string, filters?: SearchFilters): Promise<SearchResult[]>`
  - Method: `searchLectures(query: string, limit: number): Promise<LectureSearchResult[]>`
  - Method: `searchChunks(query: string, limit: number): Promise<ChunkSearchResult[]>`
  - Source: [solution-architecture.md#Subsystem 3, lines 551-575]
- [ ] 3.2: Implement cosine similarity search
  - SQL query using pgvector `<=>` operator for cosine distance
  - Formula: `SELECT *, (embedding <=> query_embedding) AS distance FROM content_chunks ORDER BY distance LIMIT 20`
  - Convert distance to similarity score: `similarity = 1 - (distance / 2)`
  - Threshold: Only return results with similarity > 0.7 (configurable)
  - Source: [solution-architecture.md#Database Architecture, epics file lines 402]
- [ ] 3.3: Implement query processing
  - Clean query: Remove stop words, normalize medical terms
  - Generate query embedding using `EmbeddingService`
  - Cache query embeddings for repeated searches (TTL: 1 hour)
  - Query expansion: Add medical synonyms for better recall
- [ ] 3.4: Optimize search performance
  - Ensure vector indexes exist on all embedding columns
  - Use Prisma raw SQL for vector queries (not supported in ORM)
  - Implement connection pooling for concurrent searches
  - Target: <500ms for embedding generation + <500ms for similarity search = <1s total
  - Source: [NFR1 from PRD, Epic 3 success criteria lines 374]

### Task 4: Create Search API Endpoints (AC: #2, #3, #5)
- [ ] 4.1: Create `/api/graph/search` POST endpoint
  - Request body: `{ query: string, filters?: SearchFilters, limit?: number }`
  - Response: `{ results: SearchResult[], total: number, queryTime: number }`
  - SearchFilters: `{ courseId?: string, category?: string, dateRange?: [Date, Date] }`
  - Source: [solution-architecture.md#API Endpoints, lines 1332-1344]
- [ ] 4.2: Implement search result formatting
  - SearchResult fields:
    - `id`: Lecture or chunk ID
    - `type`: "lecture" | "chunk"
    - `title`: Lecture title
    - `snippet`: Context snippet (200 chars with highlighting)
    - `similarity`: Confidence score (0.0 to 1.0)
    - `metadata`: { courseId, date, pageNumber }
  - Highlight matching terms in snippet (fuzzy match)
- [ ] 4.3: Add context snippet generation
  - Extract 200-character snippet around best matching content
  - Add "..." ellipsis for truncated text
  - Highlight query terms: Wrap in `<mark>` tags
  - Preserve sentence boundaries when possible
- [ ] 4.4: Implement source attribution
  - Include full lecture metadata in results
  - Fields: `lectureId`, `lectureTitle`, `courseName`, `uploadDate`, `pageNumber`
  - Enable "View in context" link to lecture detail page
  - AC #5 requirement

### Task 5: Build Search UI Components (AC: #4, #5, #7)
- [ ] 5.1: Create `/search` page
  - Location: `apps/web/src/app/search/page.tsx`
  - Layout: Search bar at top, filters sidebar, results main area
  - Real-time search: Debounce 300ms after user stops typing
  - Loading state: Show skeleton results during search
  - Empty state: "No results found for '...' Try different keywords"
  - Source: [ux-specification.md#Search screen]
- [ ] 5.2: Design `SearchBar` component
  - Location: `apps/web/src/components/search/search-bar.tsx`
  - Auto-focus on mount
  - Medical term autocomplete (optional for MVP)
  - Clear button
  - Search icon with loading spinner state
  - Keyboard shortcut: Cmd+K / Ctrl+K to focus
- [ ] 5.3: Create `SearchFilters` component
  - Location: `apps/web/src/components/search/search-filters.tsx`
  - Filter by course: Multi-select dropdown
  - Filter by date: Date range picker
  - Filter by content type: Lecture / Objective / Concept
  - "Clear filters" button
  - Show active filter count badge
  - AC #7 requirement
- [ ] 5.4: Build `SearchResults` component
  - Location: `apps/web/src/components/search/search-results.tsx`
  - Display results as cards with snippet, source, similarity score
  - Similarity score: Visual indicator (filled circle 0-100%)
  - Source attribution: "From: [Lecture Title] - [Course] - Page X"
  - "View in context" button opens lecture detail page
  - Pagination: 20 results per page (infinite scroll optional)
  - AC #4, #5 requirements
- [ ] 5.5: Add global search to navigation
  - Update main navigation: Add search icon
  - Clicking opens search page or inline search modal
  - Keyboard shortcut support

### Task 6: Implement Search History and Analytics (AC: #6)
- [ ] 6.1: Create `SearchHistory` data model
  - Add to Prisma schema: `SearchQuery` model
  - Fields: `userId`, `query`, `filters`, `resultCount`, `topResultId`, `timestamp`
  - Index: `@@index([userId, timestamp])`
  - Store every search query for pattern analysis
- [ ] 6.2: Implement search logging
  - Log search queries in `POST /api/graph/search` endpoint
  - Async write: Don't block search response
  - Include: query text, filter params, result count, response time
  - Privacy: Only log for authenticated users with consent
- [ ] 6.3: Build search history UI
  - Location: `/search/history` page or sidebar panel
  - Display recent searches (last 50)
  - Click to re-run search with same filters
  - "Clear history" button
  - Group by date: Today, Yesterday, Last 7 days, Older
- [ ] 6.4: Implement search analytics
  - Most searched terms (word cloud or list)
  - Search frequency over time (line chart)
  - Common query patterns (e.g., concept explanations, case studies)
  - Use for content recommendation in Epic 3.5

### Task 7: Testing and Performance Optimization (AC: #8)
- [ ] 7.1: Test embedding generation
  - Unit tests: `EmbeddingService` methods
  - Test cases: Empty string, very long text (>2000 tokens), special characters
  - Verify embedding dimensions: 1536
  - Mock Gemini API for faster tests
- [ ] 7.2: Test semantic search accuracy
  - Manual test queries:
    - "How does the heart pump blood?" → Should return cardiac physiology content
    - "muscle contraction mechanism" → Should return physiology and histology
    - "cardiovascular system anatomy" → Should return relevant anatomy lectures
  - Measure: Precision@10 (are top 10 results relevant?)
  - Target: >80% precision for medical queries
- [ ] 7.3: Performance benchmarking
  - Measure search latency: Embedding generation + similarity search + formatting
  - Test with 100, 1000, 10000 content chunks
  - Target: <1 second for all scenarios (AC #8)
  - Optimize if needed: Adjust vector index parameters, implement caching
- [ ] 7.4: Load testing
  - Simulate 10 concurrent search requests
  - Verify no performance degradation
  - Check database connection pool limits
  - Monitor: API response time, database query time, memory usage

## Dev Notes

### Architecture Context

**Subsystem:** Knowledge Graph & Semantic Search (Subsystem 3)
- Primary implementation in: `apps/web/src/subsystems/knowledge-graph/`
- API routes: `apps/web/src/app/api/graph/search/route.ts`
- UI components: `apps/web/src/components/search/`

**Technology Stack:**
- **Embeddings:** Google Gemini text-embedding-001, 1536 dimensions, $0.15/1M tokens
- **Vector DB:** PostgreSQL 16 + pgvector extension
- **Similarity metric:** Cosine distance (`<=>` operator)
- **Frontend:** React, shadcn/ui components, Tailwind CSS

**Source:** [solution-architecture.md#Section 3, lines 551-575; #Section 7, lines 1747-1751]

### Integration Points

**Existing Infrastructure to Leverage:**
1. **GeminiClient** (from Story 2.1)
   - Location: `apps/web/src/lib/ai/gemini-client.ts`
   - Already configured for embeddings with 1536 dimensions
   - Reuse for `EmbeddingService`

2. **Prisma Schema** (from Story 1.5, updated in 2.1)
   - `Lecture.embedding: vector(1536)` field exists
   - `ContentChunk.embedding: vector(1536)` field exists
   - pgvector extension enabled
   - May need vector indexes if not created

3. **PDF Processing Pipeline** (Story 1.2)
   - Location: `apps/web/src/subsystems/content-processing/pdf-processor.ts`
   - Extend to call `EmbeddingService` after text extraction
   - Update `ProcessingStatus` enum to include embedding states

4. **API Response Patterns** (Story 1.5)
   - Location: `apps/web/src/lib/api-response.ts`
   - Use `successResponse()` and `errorResponse()` helpers
   - Consistent error handling across API routes

**Source:** [solution-architecture.md#Database Schema lines 813-814; #Subsystem Integration Patterns lines 673-685]

### Performance Considerations

**Embedding Generation:**
- Gemini API latency: ~200-300ms per request
- Batch requests: 10 embeddings at once for efficiency
- Caching: Cache query embeddings (1 hour TTL) for repeated searches
- Backfilling: Rate limit to 10 embeddings/minute to avoid throttling

**Vector Search:**
- pgvector `ivfflat` index: Approximate nearest neighbor (ANN) search
- Index parameters: `lists = 100` for ~10k chunks (adjust as database grows)
- Query time: <100ms for similarity search on indexed embeddings
- Connection pooling: Ensure Prisma pool size ≥10 for concurrent searches

**Target Performance (AC #8):**
- Total search latency: <1 second
  - Query embedding: <300ms
  - Similarity search: <100ms
  - Result formatting: <100ms
  - Network overhead: <500ms buffer

**Source:** [solution-architecture.md#Database Indexes Strategy lines 1137-1154; NFR1 lines 167-171 in PRD]

### Medical Content Specificity

**Query Processing Enhancements:**
- Medical term normalization: "MI" → "myocardial infarction"
- Synonym expansion: "heart attack" → also search "myocardial infarction", "acute coronary syndrome"
- Acronym handling: Detect and expand common medical acronyms
- Not required for MVP but improves search quality

**Test Queries for Validation:**
1. Anatomy: "heart anatomy", "cardiac chambers", "coronary arteries"
2. Physiology: "action potential", "muscle contraction", "nerve conduction"
3. Pathology: "inflammation process", "cell death mechanisms"
4. Clinical: "chest pain differential", "shortness of breath causes"

**Expected Behavior:**
- Semantic search should find related concepts even with different wording
- Example: Query "high blood pressure" should return "hypertension" lectures
- Ranking should prioritize exact term matches > semantic similarity

### User Experience Notes

**Search Interface Guidelines:**
- Instant feedback: Show loading state immediately
- Progressive disclosure: Show top 5 results, "Show more" for additional results
- Context preservation: Clicking result opens lecture with search term highlighted
- Search suggestions: Show recent searches when input is empty
- Mobile optimization: Full-width search bar, swipeable filters

**Error Handling:**
- Gemini API error: "Search temporarily unavailable, please try again"
- No results: Suggest adjusting query or removing filters
- Slow query: Show progress indicator after 2 seconds
- Rate limiting: "Too many searches, please wait 1 minute"

**Source:** [ux-specification.md#Search flow, UX Design Principles in PRD lines 343-374]

### Security and Privacy

**Data Privacy:**
- Search queries stored per-user with consent (behavioral data collection)
- Content embeddings are non-reversible (cannot reconstruct original text)
- User can clear search history at any time

**API Security:**
- Authenticated endpoints: Require user session (deferred for MVP since single user)
- Rate limiting: 60 searches per minute per user (future implementation)
- Input sanitization: Prevent SQL injection in filter parameters

**Source:** [NFR3 Security & Privacy, PRD lines 179-183]

### Testing Strategy

**Unit Tests:**
- `EmbeddingService`: Mock Gemini API, verify dimensions and error handling
- `SemanticSearchEngine`: Mock database, verify query construction and ranking
- API routes: Test request validation, response formatting, error cases

**Integration Tests:**
- End-to-end: Upload lecture → Generate embeddings → Search → Verify results
- Performance: Measure search latency with real database and embeddings
- Edge cases: Empty query, very long query, special characters, filters

**Manual Testing:**
- Medical content accuracy: Review top 10 results for sample queries
- UI/UX: Test search flow on desktop and mobile
- Performance: Measure response time with browser dev tools

**No automated tests required for MVP** (per solution-architecture.md #Section 2, line 386)

### Project Structure Notes

**New Files to Create:**
```
apps/web/src/
├── lib/
│   └── embedding-service.ts                    # Core embedding generation
├── subsystems/
│   └── knowledge-graph/
│       └── semantic-search.ts                  # Search engine logic
├── app/
│   ├── search/
│   │   ├── page.tsx                           # Search page
│   │   └── history/
│   │       └── page.tsx                       # Search history page
│   └── api/
│       └── graph/
│           └── search/
│               └── route.ts                   # Search API endpoint
└── components/
    └── search/
        ├── search-bar.tsx                     # Search input component
        ├── search-filters.tsx                 # Filter sidebar
        └── search-results.tsx                 # Results display

scripts/
└── backfill-embeddings.ts                     # Migration script
```

**Source:** [solution-architecture.md#Section 8, lines 1808-1989]

### References

**Technical Documentation:**
- [solution-architecture.md#Database Schema, lines 810-824] - ContentChunk and embedding fields
- [solution-architecture.md#Subsystem 3, lines 551-575] - Knowledge Graph & Semantic Search subsystem
- [solution-architecture.md#API Endpoints, lines 1332-1344] - Search API specification
- [solution-architecture.md#Technology Stack, lines 1747-1751] - Gemini embeddings config

**Requirements Documentation:**
- [epics-Americano-2025-10-14.md#Story 3.1, lines 382-403] - Original story specification
- [PRD-Americano-2025-10-14.md#FR3, lines 83-87] - Knowledge Graph Foundation requirement
- [PRD-Americano-2025-10-14.md#FR15, lines 159-163] - Search & Discovery Engine requirement
- [PRD-Americano-2025-10-14.md#NFR1, lines 167-171] - Performance requirements (<1s search)

**Previous Stories:**
- Story 1.2: PDF Content Upload and Processing Pipeline (OCR and text extraction)
- Story 1.5: Database Schema and API Foundation (Prisma setup, pgvector)
- Story 2.1: Learning Objective Extraction (GeminiClient, embedding dimensions corrected)

### Known Issues / Risks

**Risk 1: Embedding Generation Cost**
- Gemini API cost: $0.15 per 1 million tokens
- Estimated cost: 100 lectures × 10k words × $0.00000015 = ~$0.15 for full library
- Mitigation: Acceptable for MVP, optimize batching for scale

**Risk 2: pgvector Performance at Scale**
- `ivfflat` index trades accuracy for speed (approximate nearest neighbor)
- For >100k chunks, may need `hnsw` index (more accurate but slower to build)
- Mitigation: Start with `ivfflat`, migrate to `hnsw` if accuracy drops

**Risk 3: Medical Term Ambiguity**
- Example: "MI" could mean "myocardial infarction" or "mitral insufficiency"
- Mitigation: Use context from surrounding query terms, implement query expansion in Epic 3.6

**Risk 4: Search Result Relevance**
- Semantic search may return conceptually related but not directly relevant results
- Mitigation: Combine with keyword search (hybrid approach), tune similarity threshold

**Decision Required:**
- Hybrid search (semantic + keyword) vs. pure semantic search for MVP?
- Recommendation: Start with pure semantic, add keyword boosting in Epic 3.6 if needed

## Dev Agent Record

### Context Reference

- Story Context: [story-context-3.1.xml](./story-context-3.1.xml) - Generated 2025-10-16

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
