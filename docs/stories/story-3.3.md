# Story 3.3: First Aid Integration and Cross-Referencing

Status: Draft

## Story

As a medical student,
I want my lecture content automatically linked to relevant First Aid sections,
So that I can quickly access board-relevant information while studying.

## Acceptance Criteria

1. First Aid content processed and integrated into knowledge graph
2. Automatic mapping between lecture topics and First Aid sections
3. Cross-references displayed contextually during content viewing
4. Search results include relevant First Aid passages
5. Conflict detection when lecture content differs from First Aid
6. User can navigate seamlessly between lecture content and First Aid references
7. First Aid integration prioritized for high-yield board exam topics
8. Update system for new First Aid editions and content changes

## Tasks / Subtasks

### Task 1: First Aid Content Processing and Ingestion (AC: #1)
- [ ] 1.1: Create First Aid content import pipeline
  - Location: `apps/web/src/subsystems/content-processing/first-aid-processor.ts`
  - Support PDF upload of First Aid Step 1 book
  - Extract content preserving structure: sections, subsections, page numbers
  - Identify high-yield topics (starred content, bolded terms)
  - Store metadata: edition year, page layout, topic categories
  - IMPORTANT: Handle copyright considerations - personal use only, no redistribution
- [ ] 1.2: Process First Aid structure preservation
  - Parse hierarchical structure: System → Organ → Pathology → Pharmacology
  - Preserve visual markers: stars (high-yield), boxes (mnemonics), diagrams
  - Extract and tag "Clinical Correlations" and "Exam Focus" callouts
  - Maintain cross-references within First Aid (e.g., "See also page X")
  - Store section hierarchy in database with parent-child relationships
- [ ] 1.3: Generate First Aid content embeddings
  - Chunk First Aid content at section/subsection level (not arbitrary 1000 tokens)
  - Use `EmbeddingService` from Story 3.1 for vectorization
  - Store embeddings in `ContentChunk` table with `source: 'first_aid'`
  - Tag high-yield content with `isHighYield: true` flag
  - Create separate index for First Aid chunks for filtering
  - Source: [solution-architecture.md#Database Schema, lines 810-824]
- [ ] 1.4: Add First Aid data model to schema
  - Create `FirstAidSection` model:
    - `id`, `edition`, `system`, `section`, `subsection`, `pageNumber`
    - `content: Text`, `isHighYield: Boolean`, `embedding: vector(1536)`
    - `mnemonics: String[]`, `clinicalCorrelations: String[]`
    - `relatedLectureIds: String[]`, `conflictFlags: Json`
  - Migration script: `prisma migrate dev --name add-first-aid`
  - Add to Prisma schema with proper indexes
  - Source: [solution-architecture.md#Subsystem 1, lines 494-520]

### Task 2: Automatic Content Mapping Using Semantic Similarity (AC: #2, #7)
- [ ] 2.1: Implement First Aid mapping algorithm
  - Location: `apps/web/src/subsystems/knowledge-graph/first-aid-mapper.ts`
  - Class: `FirstAidMapper`
  - Method: `mapLectureToFirstAid(lectureId: string): Promise<FirstAidMapping[]>`
  - Method: `findRelevantFirstAidSections(conceptName: string): Promise<FirstAidSection[]>`
  - Method: `calculateMappingConfidence(lectureChunk, firstAidChunk): Promise<number>`
  - Use semantic similarity from Story 3.1 (cosine distance on embeddings)
- [ ] 2.2: Semantic similarity-based mapping
  - For each lecture `ContentChunk`, find top 5 most similar First Aid sections
  - Similarity threshold: >0.75 for automatic mapping, 0.65-0.75 for suggestions
  - Prioritize high-yield First Aid sections (weighted boost: +0.1 to similarity)
  - Store mappings in `LectureFirstAidMapping` table
  - Include confidence score and mapping rationale
  - Batch processing: Map all existing lectures on First Aid upload
- [ ] 2.3: High-yield topic prioritization
  - Flag mappings to starred First Aid content with `priority: 'high_yield'`
  - Board exam topic categorization (e.g., Cardiology, Immunology)
  - USMLE Step 1 topic alignment from First Aid structure
  - Create `HighYieldTopic` model tracking exam importance
  - UI indicator for high-yield mappings (star icon, highlight color)
- [ ] 2.4: Mapping quality validation
  - Manual review interface for validating auto-generated mappings
  - User feedback: "Is this First Aid reference helpful?" (thumbs up/down)
  - Track mapping accuracy metrics for algorithm improvement
  - Periodic re-mapping job when new lectures added or First Aid updated
  - Export mapping report for review: `scripts/export-first-aid-mappings.ts`

### Task 3: Cross-Reference Display in Lecture View (AC: #3, #6)
- [ ] 3.1: Create `FirstAidCrossReference` component
  - Location: `apps/web/src/components/library/first-aid-cross-reference.tsx`
  - Display First Aid references contextually in lecture view
  - Show: Section title, page number, confidence score, high-yield indicator
  - Preview snippet (first 200 chars) with "View full section" link
  - Collapsible panel to avoid overwhelming main content
  - Position: Right sidebar or expandable panel below lecture content
- [ ] 3.2: Implement contextual reference triggering
  - Detect current lecture section being viewed (scroll position tracking)
  - Load relevant First Aid mappings for visible content
  - Debounce 500ms to avoid excessive API calls during scrolling
  - Prefetch adjacent section mappings for smooth scrolling
  - Loading state: Skeleton while fetching references
- [ ] 3.3: Build First Aid section detail view
  - Page: `apps/web/src/app/first-aid/sections/[id]/page.tsx`
  - Display full First Aid section content with preserved formatting
  - Show related lecture content (reverse mapping)
  - Navigation breadcrumbs: System > Organ > Section
  - "Jump to page" functionality linking to original PDF page
  - Bookmark/favorite functionality for frequently referenced sections
- [ ] 3.4: Seamless navigation between content
  - Bidirectional links: Lecture → First Aid and First Aid → Lecture
  - "View in context" button opens lecture at relevant section
  - Keyboard shortcuts: Ctrl+F to toggle First Aid panel
  - History tracking: Recent First Aid references visited
  - Browser back button support for navigation flow
  - AC #6 requirement

### Task 4: Search Integration with First Aid Content (AC: #4)
- [ ] 4.1: Extend semantic search to include First Aid
  - Update `SemanticSearchEngine` from Story 3.1
  - Search across both lecture content AND First Aid simultaneously
  - Deduplicate results: If lecture and First Aid cover same topic, show both
  - Source indicator: Badge showing "Lecture" vs. "First Aid" vs. "Both"
  - Ranking: Slightly boost First Aid results for board exam queries
  - Source: [solution-architecture.md#Subsystem 3, lines 551-575]
- [ ] 4.2: Add First Aid filtering to search interface
  - Update `SearchFilters` component from Story 3.1
  - Filter: "Show only First Aid" toggle
  - Filter: "Show high-yield content only" toggle
  - Filter: First Aid edition selector (if multiple editions stored)
  - Default: Show all sources, with clear visual distinction
  - Source: [Story 3.1 Task 5.3, lines 132-138]
- [ ] 4.3: First Aid-specific search enhancements
  - Query expansion for board exam terminology
  - Example: "MI" → Also search "myocardial infarction" in First Aid index
  - First Aid mnemonic search: Find sections with specific mnemonics
  - Page number search: "First Aid page 123" direct navigation
  - Topic hierarchy navigation: "Cardiology → Heart Failure"
- [ ] 4.4: Search result formatting for First Aid
  - Snippet includes: Section title, page number, high-yield indicator
  - Highlight: Starred content, bolded terms from First Aid
  - Context: Show parent section for orientation (e.g., "Cardiology > Heart")
  - Preview: Mnemonic boxes, clinical correlations if present
  - Quick actions: "Add to review", "Bookmark", "View related lectures"

### Task 5: Conflict Detection Between Sources (AC: #5)
- [ ] 5.1: Implement content conflict detection algorithm
  - Location: `apps/web/src/subsystems/knowledge-graph/conflict-detector.ts`
  - Class: `ContentConflictDetector`
  - Method: `detectConflicts(lectureId: string): Promise<Conflict[]>`
  - Method: `compareStatements(lecture: string, firstAid: string): Promise<ConflictAnalysis>`
  - Use GPT-5 (ChatMock) to analyze semantic differences
  - Prompt: "Compare these two medical statements. Do they contradict each other?"
- [ ] 5.2: Conflict detection criteria
  - Semantic contradiction: Lecture says A, First Aid says NOT A
  - Example: Lecture "Drug X increases HR", First Aid "Drug X decreases HR"
  - Numerical discrepancies: Different values, ranges, statistics
  - Example: "Normal range 3.5-5.0" vs. "Normal range 4.0-5.5"
  - Terminology differences: Different terms for same concept (not conflict)
  - Threshold: Flag as conflict if GPT-5 confidence >0.8
  - Source: [solution-architecture.md#AI Integration, lines 1437-1470]
- [ ] 5.3: Create `ContentConflict` data model
  - Add to Prisma schema:
    - `id`, `lectureChunkId`, `firstAidSectionId`, `conflictType`
    - `lectureStatement: Text`, `firstAidStatement: Text`
    - `severity: String` ("minor", "moderate", "critical")
    - `resolution: String?` (user notes, expert opinion)
    - `status: String` ("detected", "reviewing", "resolved")
  - Index: `@@index([lectureChunkId, status])`
- [ ] 5.4: Conflict visualization in UI
  - Component: `apps/web/src/components/library/conflict-indicator.tsx`
  - Warning icon next to content with detected conflicts
  - Conflict panel showing side-by-side comparison
  - Lecture statement | First Aid statement | Severity
  - User actions: "Mark as resolved", "Report incorrect detection"
  - Severity color coding: Yellow (minor), Orange (moderate), Red (critical)
  - Tooltip: "This content may conflict with First Aid. Click to review."

### Task 6: Version Management and Update System (AC: #8)
- [ ] 6.1: First Aid edition tracking system
  - `FirstAidEdition` model:
    - `id`, `year`, `versionNumber`, `uploadedAt`, `isActive: Boolean`
    - `changeLog: Text` (what changed between editions)
    - `mappingStatus: String` ("pending", "in_progress", "completed")
  - Support multiple editions stored simultaneously
  - Default to latest edition for mappings
  - Allow users to select edition for comparison
- [ ] 6.2: Implement edition update workflow
  - Upload new First Aid edition via admin interface
  - Automatic comparison: Old edition vs. New edition
  - Generate change report: Added sections, removed sections, modified content
  - Re-run mapping algorithm for changed sections
  - Notify users: "First Aid 2026 available. Review updated sections."
  - Incremental migration: Don't delete old edition until verification complete
- [ ] 6.3: Content change detection between editions
  - Diff algorithm: Compare section embeddings between editions
  - Similarity <0.9 = Content has changed significantly
  - Flag affected lecture mappings for review
  - UI notification: "First Aid updated. X mappings need review."
  - User review queue for changed mappings
  - Auto-archive old edition mappings after 6 months
- [ ] 6.4: Create update notification system
  - Email/in-app notification when new edition processed
  - Dashboard widget: "First Aid 2026 changes: 47 sections updated"
  - "What's new" summary generated by GPT-5 from changelog
  - User preferences: Auto-update to latest edition vs. manual review
  - Study session interruption: "Note: First Aid content updated since last study"

### Task 7: Copyright and Licensing Considerations (Technical Note)
- [ ] 7.1: Implement copyright compliance measures
  - IMPORTANT: First Aid content is copyrighted material
  - User must own physical/digital copy of First Aid
  - Upload verification: Display copyright notice during upload
  - Personal use only: No sharing, no redistribution
  - Watermark First Aid content with user ID for tracking
  - Terms of Service: User confirms legal ownership before upload
- [ ] 7.2: Content protection and access control
  - First Aid content encrypted at rest in database
  - User-specific decryption keys (cannot share content)
  - Rate limiting on First Aid content access (prevent bulk export)
  - Disable screenshot/copy for First Aid content views
  - Audit logging: Track all First Aid content access
  - Future: Partner with First Aid publisher for official integration
- [ ] 7.3: Attribution and source indication
  - Clear attribution: "Content from First Aid for USMLE Step 1, 20XX edition"
  - Page number citations for all First Aid references
  - "Buy First Aid" affiliate link in UI (future monetization)
  - Disclaimer: "First Aid content for personal study use only"
  - Compliance monitoring: Regular review of usage patterns

### Task 8: Testing and Quality Assurance (AC: #1-#8)
- [ ] 8.1: Test First Aid content processing
  - Upload sample First Aid PDF (10-20 pages for testing)
  - Verify structure preservation: Sections, subsections, page numbers
  - Validate high-yield detection: Stars and bolded terms captured
  - Check embedding generation: All sections have valid embeddings
  - Test edge cases: Complex diagrams, tables, multi-column layouts
- [ ] 8.2: Test automatic mapping accuracy
  - Manual validation: Review 50 lecture-to-First-Aid mappings
  - Precision: Are mapped First Aid sections actually relevant?
  - Recall: Are important First Aid sections being missed?
  - Target: >80% precision, >70% recall for automatic mappings
  - Test high-yield prioritization: Starred content ranked higher
- [ ] 8.3: Test cross-reference UI and navigation
  - Verify First Aid panel displays in lecture view
  - Test contextual loading: Correct sections for current lecture position
  - Navigation flow: Lecture → First Aid → back to lecture
  - Bidirectional links work correctly
  - Keyboard shortcuts functional
  - Mobile responsiveness: Panel adapts to smaller screens
- [ ] 8.4: Test conflict detection
  - Create test cases: Known contradictions between lecture and First Aid
  - Example: Outdated lecture content vs. updated First Aid
  - Verify conflict detection triggers correctly
  - Check false positive rate: Don't flag non-conflicts
  - Test severity classification accuracy
  - User feedback loop: Resolution tracking works
- [ ] 8.5: Test edition update workflow
  - Simulate First Aid edition update (use two different sample PDFs)
  - Verify change detection: Modified sections identified
  - Re-mapping triggers correctly for changed content
  - User notifications sent appropriately
  - Old edition archived properly
  - Performance: Update processing completes within reasonable time

## Dev Notes

### Architecture Context

**Subsystem:** Knowledge Graph & Semantic Search (Subsystem 3)
- Primary implementation: `apps/web/src/subsystems/knowledge-graph/`
- Additional processing: `apps/web/src/subsystems/content-processing/first-aid-processor.ts`
- API routes: `apps/web/src/app/api/first-aid/` (new)
- UI components: `apps/web/src/components/library/` and `apps/web/src/components/first-aid/`

**Technology Stack:**
- **Content Processing:** PaddleOCR for First Aid PDF extraction (same as lectures)
- **Embeddings:** Google Gemini text-embedding-001, 1536 dimensions (consistent with Story 3.1)
- **Mapping Algorithm:** Cosine similarity via pgvector (semantic matching)
- **Conflict Detection:** ChatMock GPT-5 for semantic analysis
- **Database:** PostgreSQL + Prisma (new models for First Aid)

**Source:** [solution-architecture.md#Subsystem 3, lines 551-575; #Content Processing, lines 494-520]

### Integration Points

**Existing Infrastructure to Leverage:**

1. **PDF Processing Pipeline** (Story 1.2)
   - Location: `apps/web/src/subsystems/content-processing/pdf-processor.ts`
   - Extend for First Aid: Preserve different structure (not lecture format)
   - Reuse OCR extraction, but different chunking strategy
   - First Aid has sections/subsections vs. lecture slides

2. **Embedding Service** (Story 3.1)
   - Location: `apps/web/src/lib/embedding-service.ts`
   - Reuse for First Aid content vectorization
   - Already configured for 1536 dimensions
   - Batch processing for efficiency

3. **Semantic Search Engine** (Story 3.1)
   - Location: `apps/web/src/subsystems/knowledge-graph/semantic-search.ts`
   - Extend to search across First Aid content
   - Add source filtering (lecture vs. First Aid)
   - Modify ranking algorithm for high-yield boosting

4. **Knowledge Graph** (Story 3.2)
   - Integrate First Aid sections as new concept nodes
   - Link lecture concepts to First Aid sections
   - Visualize cross-references in graph view
   - Prerequisite: Story 3.2 must be completed first

5. **API Response Patterns** (Story 1.5)
   - Location: `apps/web/src/lib/api-response.ts`
   - Use `successResponse()` and `errorResponse()` helpers
   - Consistent error handling for First Aid endpoints

**Source:** [solution-architecture.md#Subsystem Integration Patterns, lines 673-685]

### First Aid-Specific Processing Challenges

**Structure Preservation:**
- First Aid uses complex multi-column layouts with visual markers
- Diagrams and tables critical for understanding (not just text)
- Page references essential for cross-referencing physical book
- Hierarchical structure: System → Organ → Disease → Pharmacology

**Chunking Strategy Differences:**
- Lectures: Slide-based chunking (~1 slide per chunk)
- First Aid: Section-based chunking (preserve semantic units)
- Example: Don't split "Myocardial Infarction" section mid-paragraph
- Chunk size varies: Some sections 50 words, others 500 words

**High-Yield Identification:**
- Visual markers: Stars (★), bold text, boxed content
- OCR must preserve these markers or detect via layout analysis
- NLP heuristics: Phrases like "High-yield", "Exam focus", "Boards tip"
- Store metadata separately for filtering and prioritization

### Mapping Algorithm Design

**Semantic Similarity Approach:**
- Cosine distance between lecture chunk embedding and First Aid section embedding
- Threshold: >0.75 = Strong match, 0.65-0.75 = Weak match, <0.65 = No match
- High-yield boost: Add 0.1 to similarity score for starred First Aid content
- Topic alignment: Additional boost if lecture course matches First Aid system

**Confidence Scoring:**
- Factors: Similarity score, topic alignment, keyword overlap, source credibility
- Formula: `confidence = (similarity * 0.6) + (topic_match * 0.2) + (keyword_overlap * 0.2)`
- Display confidence to user: High (>0.8), Medium (0.65-0.8), Low (<0.65)

**False Positive Mitigation:**
- Manual review queue for low-confidence mappings (0.65-0.75)
- User feedback: "Was this helpful?" trains mapping algorithm
- Negative signals: User dismisses mapping → Lower confidence for similar future mappings

### Conflict Detection Methodology

**Types of Conflicts:**
1. **Direct Contradiction:** "A causes B" vs. "A prevents B"
2. **Numerical Discrepancy:** Different values, ranges, statistics
3. **Terminology Difference:** Same concept, different terms (NOT a conflict)
4. **Outdated Information:** Lecture uses old guidelines, First Aid has current

**Detection Algorithm:**
- Step 1: Extract key medical statements from both sources
- Step 2: GPT-5 semantic comparison with medical context
- Step 3: Classify conflict severity (minor, moderate, critical)
- Step 4: Human review for critical conflicts

**Severity Classification:**
- **Minor:** Terminology differences, non-critical details
- **Moderate:** Different ranges, conflicting non-critical facts
- **Critical:** Direct contradictions on diagnosis, treatment, pathophysiology
- **Auto-resolution:** Minor conflicts auto-marked "terminology difference"

### Copyright and Legal Considerations

**CRITICAL - Read Carefully:**
- First Aid for USMLE Step 1 is copyrighted by McGraw Hill Education
- Users must legally own First Aid to upload content
- Platform facilitates personal study use only (Fair Use doctrine)
- No redistribution, sharing, or commercial use of First Aid content
- No public display of First Aid content outside user's account

**Implementation Requirements:**
- Upload flow: Copyright notice with user confirmation
- Terms of Service: Explicit legal ownership requirement
- Content encryption: Prevent unauthorized access
- Access logging: Audit trail for compliance
- Rate limiting: Prevent bulk extraction

**Future Considerations:**
- Official partnership with First Aid publisher (ideal solution)
- Licensing agreement for commercial usage
- Revenue sharing model if platform scales
- Alternative: Partner with open medical education resources

### User Experience Considerations

**Cross-Reference Display Principles:**
- Non-intrusive: Don't overwhelm primary lecture content
- Contextual: Show references relevant to current reading position
- On-demand: Collapsible panel, user controls visibility
- Visual clarity: Clear distinction between lecture and First Aid content
- Quick access: Single click to jump to First Aid section

**Navigation Flow:**
- Primary: Studying lecture → See related First Aid reference → Open in sidebar
- Secondary: Searching First Aid → Find relevant lecture → Jump to lecture section
- Tertiary: Knowledge graph view → Explore First Aid connections

**Conflict Handling UX:**
- Gentle warning: Yellow highlight, not alarming red error
- Informative: Explain nature of conflict, don't just flag
- Actionable: Provide resolution options or expert references
- Learning opportunity: Teach critical evaluation of sources

**Mobile Optimization:**
- Swipe gestures: Swipe left to reveal First Aid panel
- Bottom sheet: First Aid references in bottom drawer
- Full-screen view: Tap to expand First Aid section
- Offline access: Cache frequently referenced First Aid sections

### Performance Considerations

**Mapping Performance:**
- Batch mapping: Process all existing lectures overnight when First Aid uploaded
- Incremental mapping: New lectures mapped immediately on upload
- Caching: Cache lecture-to-First-Aid mappings for fast retrieval
- Pagination: Don't load all mappings for large lectures at once

**Search Performance:**
- Dual-source search: Query both lecture and First Aid indexes in parallel
- Deduplication: Merge results efficiently without duplicate processing
- Ranking: Combined ranking algorithm for mixed results
- Target: <1 second total search time (same as Story 3.1)

**Storage Considerations:**
- First Aid content size: ~500 pages, ~1MB per page = 500MB
- Embeddings: 500 sections × 1536 dimensions × 4 bytes = ~3MB
- Total storage per First Aid edition: ~500MB (acceptable)
- Multiple editions: ~500MB per edition (2-3 editions = 1-1.5GB)

**Source:** [solution-architecture.md#Database Indexes Strategy, lines 1137-1154]

### Testing Strategy

**Unit Tests:**
- `FirstAidProcessor`: Test structure extraction, high-yield detection
- `FirstAidMapper`: Test mapping algorithm with known lecture-First Aid pairs
- `ConflictDetector`: Test conflict detection with known contradictions
- Mock GPT-5 API for consistent testing

**Integration Tests:**
- End-to-end: Upload First Aid → Map to lectures → Display cross-references → Navigate
- Search integration: Query returns both lecture and First Aid results
- Conflict detection workflow: Detect → Review → Resolve
- Edition update: Upload new edition → Re-map → Notify users

**Manual Testing:**
- Medical accuracy: Review mappings with actual medical knowledge
- Conflict detection: Validate real conflicts vs. false positives
- UI/UX: Navigate cross-references on desktop and mobile
- Performance: Test with full First Aid book (500+ pages)

**No automated tests required for MVP** (per solution-architecture.md #Section 2, line 386)

### Security and Privacy

**Data Protection:**
- First Aid content encrypted at rest (AES-256)
- User-specific access control (cannot view others' First Aid content)
- Audit logging: Track all First Aid uploads and access
- Rate limiting: Prevent bulk export or scraping
- Session-based access: Re-authentication for sensitive operations

**Copyright Compliance:**
- Upload verification: User confirms legal ownership
- Watermarking: Embed user ID in displayed content (invisible)
- Export restrictions: No bulk export of First Aid content
- Usage monitoring: Alert on suspicious access patterns
- Legal documentation: Terms of Service, Privacy Policy updates

### Project Structure

**New Files to Create:**
```
apps/web/src/
├── subsystems/
│   ├── content-processing/
│   │   └── first-aid-processor.ts              # First Aid PDF processing
│   └── knowledge-graph/
│       ├── first-aid-mapper.ts                  # Lecture-to-First-Aid mapping
│       └── conflict-detector.ts                 # Content conflict detection
├── app/
│   ├── first-aid/
│   │   ├── page.tsx                            # First Aid library page
│   │   ├── upload/
│   │   │   └── page.tsx                        # First Aid upload interface
│   │   └── sections/
│   │       └── [id]/
│   │           └── page.tsx                    # First Aid section detail view
│   └── api/
│       └── first-aid/
│           ├── upload/route.ts                  # Upload endpoint
│           ├── sections/route.ts                # List sections
│           ├── sections/[id]/route.ts           # Get section details
│           ├── mappings/
│           │   └── [lectureId]/route.ts        # Get mappings for lecture
│           └── conflicts/route.ts               # Detect/manage conflicts
└── components/
    ├── library/
    │   ├── first-aid-cross-reference.tsx        # Cross-reference panel
    │   └── conflict-indicator.tsx               # Conflict warning UI
    └── first-aid/
        ├── section-viewer.tsx                   # First Aid section display
        ├── edition-selector.tsx                 # Edition version picker
        └── copyright-notice.tsx                 # Upload copyright notice

scripts/
├── map-first-aid-to-lectures.ts                 # Batch mapping script
└── update-first-aid-edition.ts                  # Edition update workflow
```

**Source:** [solution-architecture.md#Section 8, lines 1808-1989]

### References

**Technical Documentation:**
- [solution-architecture.md#Subsystem 3, lines 551-575] - Knowledge Graph subsystem
- [solution-architecture.md#Content Processing, lines 494-520] - Content processing pipeline
- [solution-architecture.md#Database Schema, lines 810-824] - ContentChunk and embeddings
- [solution-architecture.md#AI Integration, lines 1437-1470] - GPT-5 usage for conflict detection

**Requirements Documentation:**
- [epics-Americano-2025-10-14.md#Story 3.3, lines 426-447] - Original story specification
- [PRD-Americano-2025-10-14.md#FR3, lines 83-87] - Knowledge Graph Foundation requirement
- [PRD-Americano-2025-10-14.md#NFR3, lines 179-183] - Security and privacy (copyright compliance)

**Related Stories:**
- Story 1.2: PDF Content Upload and Processing Pipeline (OCR foundation)
- Story 1.5: Database Schema and API Foundation (Prisma setup)
- Story 2.1: Learning Objective Extraction (GPT-5 content analysis)
- Story 3.1: Semantic Search Implementation (Embedding service, similarity search)
- Story 3.2: Knowledge Graph Construction (Graph integration, prerequisite)

### Known Issues / Risks

**Risk 1: Copyright Infringement**
- First Aid content is heavily copyrighted, strict legal compliance required
- Mitigation: Personal use only, user ownership verification, no redistribution
- Mitigation: Consider official partnership with McGraw Hill (long-term)
- Decision: Start with strict personal use, explore licensing if platform scales

**Risk 2: Mapping Accuracy - Medical Content Complexity**
- Medical terminology ambiguity may cause incorrect mappings
- Example: "MI" could map to multiple First Aid sections
- Mitigation: Manual review queue for low-confidence mappings
- Mitigation: User feedback loop to improve algorithm over time
- Target: >80% precision acceptable for MVP, improve to >90% with feedback

**Risk 3: First Aid Edition Updates - Content Drift**
- First Aid updates annually, mappings become outdated
- Mitigation: Edition tracking system, automatic re-mapping for changes
- Mitigation: User notifications for affected content
- Challenge: Maintaining multiple editions increases storage and complexity

**Risk 4: Conflict Detection False Positives**
- GPT-5 may flag non-conflicts (terminology differences) as conflicts
- Example: "Heart attack" vs. "Myocardial infarction" (same thing)
- Mitigation: Tuned GPT-5 prompts with medical context
- Mitigation: Severity classification to filter minor issues
- Mitigation: User feedback: "Not a conflict" to train model

**Risk 5: Performance with Large First Aid Content**
- 500+ pages of First Aid = 500+ sections to embed and map
- Initial mapping job may take hours for full content library
- Mitigation: Async background job with progress tracking
- Mitigation: Incremental mapping for new lectures (fast)
- Mitigation: Caching and pagination for UI performance

**Risk 6: User Expectation - "Perfect" First Aid Integration**
- Users may expect 100% accurate, instant First Aid references
- Reality: Semantic matching is probabilistic, not perfect
- Mitigation: Clear communication of confidence scores
- Mitigation: Manual review and editing capabilities
- Mitigation: Educational content about AI limitations

**Decision Required:**
- Should we support multiple First Aid editions simultaneously?
- Recommendation: Yes, store 2-3 recent editions for comparison and transition
- Rationale: Students may own different editions, edition transitions take time

**Decision Required:**
- Should conflict detection be automatic or user-initiated?
- Recommendation: Automatic detection with user review workflow
- Rationale: Proactive conflict awareness improves learning quality

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
