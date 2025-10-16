# Story 1.3: Basic Content Organization and Management

Status: Draft

## Story

As a medical student,
I want to organize my uploaded content by course and topic,
so that I can easily find and manage my study materials.

## Acceptance Criteria

1. User can create course categories (Anatomy, Physiology, etc.)
2. Uploaded content can be assigned to specific courses
3. Content can be tagged with topics and keywords
4. User can rename, delete, or move content between categories
5. Folder structure supports nested organization
6. Content list displays with filtering and sorting options
7. Search functionality finds content by name, tag, or course
8. Bulk operations available for multiple content items

## Tasks / Subtasks

- [ ] Task 1: Implement Course management (AC: #1, #2)
  - [ ] 1.1: Verify Course model exists in Prisma schema (solution-architecture.md lines 736-752)
  - [ ] 1.2: Create `/api/content/courses` GET endpoint (list all courses)
  - [ ] 1.3: Create `/api/content/courses` POST endpoint (create new course)
  - [ ] 1.4: Create `/api/content/courses/:id` PATCH endpoint (update course)
  - [ ] 1.5: Create `/api/content/courses/:id` DELETE endpoint (delete course with cascade)
  - [ ] 1.6: Add validation: course name required, code optional, term optional
  - [ ] 1.7: Test CRUD operations via API

- [ ] Task 2: Extend Lecture model for organization (AC: #2, #3, #4)
  - [ ] 2.1: Verify Lecture model has courseId foreign key (lines 754-781)
  - [ ] 2.2: Verify Lecture model has topicTags array field (line 768)
  - [ ] 2.3: Add weekNumber field if not present (optional Int)
  - [ ] 2.4: Create migration if schema changes needed
  - [ ] 2.5: Test lecture assignment to courses

- [ ] Task 3: Build Course management UI (AC: #1)
  - [ ] 3.1: Create courses page at app/library/courses/page.tsx
  - [ ] 3.2: Build course list component with cards/table view
  - [ ] 3.3: Create "Add Course" dialog with form (name, code, term)
  - [ ] 3.4: Implement course edit functionality
  - [ ] 3.5: Add course delete confirmation dialog
  - [ ] 3.6: Display lecture count per course
  - [ ] 3.7: Add course color picker for visual organization
  - [ ] 3.8: Show validation errors in UI

- [ ] Task 4: Create Content Library page (AC: #2, #4, #6)
  - [ ] 4.1: Create library page at app/library/page.tsx
  - [ ] 4.2: Build lecture list component (LectureList.tsx)
  - [ ] 4.3: Display lectures with metadata (title, course, date, status)
  - [ ] 4.4: Add course filter dropdown
  - [ ] 4.5: Add status filter (All, Processing, Completed, Failed)
  - [ ] 4.6: Implement sorting options (date, name, course)
  - [ ] 4.7: Add pagination (50 lectures per page)
  - [ ] 4.8: Create empty state for "No lectures yet"

- [ ] Task 5: Implement tagging system (AC: #3)
  - [ ] 5.1: Create tag input component (multi-select with autocomplete)
  - [ ] 5.2: Update lecture edit form to include tags
  - [ ] 5.3: Create `/api/content/lectures/:id/tags` PATCH endpoint
  - [ ] 5.4: Store tags as string array in Lecture.topicTags
  - [ ] 5.5: Build tag filter UI (clickable tags)
  - [ ] 5.6: Show tag suggestions from existing lectures
  - [ ] 5.7: Add tag creation on-the-fly
  - [ ] 5.8: Display tags visually as badges/chips

- [ ] Task 6: Build lecture detail view (AC: #2, #3, #4)
  - [ ] 6.1: Create lecture detail page at app/library/[lectureId]/page.tsx
  - [ ] 6.2: Display lecture metadata (title, course, week, tags)
  - [ ] 6.3: Show extracted content chunks (ContentChunks)
  - [ ] 6.4: Display learning objectives (LearningObjectives)
  - [ ] 6.5: Add "Edit" button to modify metadata
  - [ ] 6.6: Add "Delete" button with confirmation
  - [ ] 6.7: Add "Move to Course" dropdown
  - [ ] 6.8: Show processing status if not completed

- [ ] Task 7: Implement content modification operations (AC: #4)
  - [ ] 7.1: Create `/api/content/lectures/:id` PATCH endpoint (update lecture)
  - [ ] 7.2: Support title update
  - [ ] 7.3: Support courseId update (move between courses)
  - [ ] 7.4: Support weekNumber update
  - [ ] 7.5: Support topicTags update
  - [ ] 7.6: Create `/api/content/lectures/:id` DELETE endpoint
  - [ ] 7.7: Add cascade delete for ContentChunks and LearningObjectives
  - [ ] 7.8: Delete PDF file from storage on lecture deletion

- [ ] Task 8: Implement search functionality (AC: #7)
  - [ ] 8.1: Create `/api/content/search` GET endpoint
  - [ ] 8.2: Implement PostgreSQL full-text search on Lecture.title
  - [ ] 8.3: Search across course names
  - [ ] 8.4: Search across topicTags
  - [ ] 8.5: Add search input component in library header
  - [ ] 8.6: Show search results with highlighting
  - [ ] 8.7: Implement debounced search (300ms delay)
  - [ ] 8.8: Add "Clear search" button

- [ ] Task 9: Implement bulk operations (AC: #8)
  - [ ] 9.1: Add checkbox selection to lecture list items
  - [ ] 9.2: Create "Select All" checkbox in header
  - [ ] 9.3: Show bulk action toolbar when items selected
  - [ ] 9.4: Implement "Move to Course" bulk action
  - [ ] 9.5: Implement "Add Tags" bulk action
  - [ ] 9.6: Implement "Delete" bulk action with confirmation
  - [ ] 9.7: Create `/api/content/lectures/bulk` PATCH endpoint
  - [ ] 9.8: Show success/error toast messages after bulk operations

- [ ] Task 10: Create folder/nested organization (AC: #5)
  - [ ] 10.1: Decide on folder implementation approach:
    - Option A: Virtual folders (tags-based grouping)
    - Option B: True nested Course model with parentId
    - Option C: Defer nested folders to v2 (recommend for MVP)
  - [ ] 10.2: If implementing: Add parentId to Course model
  - [ ] 10.3: If implementing: Create folder tree UI component
  - [ ] 10.4: If deferring: Document decision and future implementation plan

- [ ] Task 11: Add UI polish and interactions (AC: #6, #7)
  - [ ] 11.1: Add loading skeletons for list views
  - [ ] 11.2: Implement optimistic UI updates
  - [ ] 11.3: Add confirmation dialogs for destructive actions
  - [ ] 11.4: Show toast notifications for success/error
  - [ ] 11.5: Add keyboard shortcuts (Ctrl+K for search, etc.)
  - [ ] 11.6: Implement responsive layout (mobile-friendly)
  - [ ] 11.7: Add empty states for filters with no results
  - [ ] 11.8: Create intuitive drag-drop for reordering (future enhancement)

- [ ] Task 12: Testing and validation (All ACs)
  - [ ] 12.1: Test course CRUD operations
  - [ ] 12.2: Test lecture filtering by course, status, tags
  - [ ] 12.3: Test search functionality across all fields
  - [ ] 12.4: Test bulk operations on 10+ lectures
  - [ ] 12.5: Test lecture deletion with cascade
  - [ ] 12.6: Verify responsive design on mobile/tablet
  - [ ] 12.7: Test with 100+ lectures for performance
  - [ ] 12.8: Test search performance with large content set

## Dev Notes

**Architecture Context:**
- Database models: Course, Lecture (solution-architecture.md lines 736-781)
- API endpoints: /api/content/courses, /api/content/lectures (lines 1239-1253)
- UI components: library/*, shared/* (lines 1857-1863)

**Critical Technical Decisions:**

1. **Course Organization:**
   - Flat course structure for MVP (no nested folders)
   - Each lecture assigned to exactly one course
   - Future enhancement: nested courses with parentId

2. **Tagging System:**
   - Tags stored as string[] in Lecture.topicTags
   - No dedicated Tag model for MVP (avoid over-engineering)
   - Tag autocomplete from existing lectures
   - Future: Tag model with usage counts and descriptions

3. **Search Implementation:**
   - PostgreSQL full-text search for MVP (simple, works well)
   - Search fields: lecture title, course name, topic tags
   - No semantic search yet (that's Epic 3 - Story 3.1)
   - Future: Integrate with pgvector semantic search

4. **Filtering Strategy:**
   - Client-side filtering for <100 lectures
   - Server-side filtering via API query params for scalability
   - Filter combinations: course + status + tags
   - Persist filter state in URL query params

5. **Bulk Operations:**
   - Batch API endpoint: `/api/content/lectures/bulk`
   - Request body: `{ lectureIds: string[], action: 'move'|'tag'|'delete', data: object }`
   - Transaction support via Prisma for data consistency
   - Maximum 50 lectures per bulk operation

6. **Performance Considerations:**
   - Pagination: 50 lectures per page
   - Eager load course data to avoid N+1 queries
   - Index on Lecture.courseId, Lecture.processingStatus
   - Consider virtual scrolling for 500+ lectures (future)

7. **UI/UX Patterns:**
   - Library page: Primary view (table/grid toggle)
   - Course page: Secondary view (course-centric)
   - Detail page: Full lecture information + edit
   - Consistent navigation breadcrumbs

### Project Structure Notes

**Files to Create:**

```
apps/web/
├── src/
│   ├── app/
│   │   ├── library/
│   │   │   ├── page.tsx                      # Main library list
│   │   │   ├── courses/
│   │   │   │   └── page.tsx                  # Course management
│   │   │   └── [lectureId]/
│   │   │       └── page.tsx                  # Lecture detail
│   │   └── api/
│   │       └── content/
│   │           ├── courses/
│   │           │   ├── route.ts              # GET, POST courses
│   │           │   └── [id]/route.ts         # PATCH, DELETE course
│   │           ├── lectures/
│   │           │   ├── route.ts              # GET lectures (with filters)
│   │           │   ├── [id]/
│   │           │   │   ├── route.ts          # GET, PATCH, DELETE lecture
│   │           │   │   └── tags/route.ts     # PATCH tags
│   │           │   └── bulk/route.ts         # Bulk operations
│   │           └── search/route.ts           # Search endpoint
│   ├── components/
│   │   └── library/
│   │       ├── course-list.tsx
│   │       ├── course-card.tsx
│   │       ├── course-dialog.tsx             # Add/Edit course
│   │       ├── lecture-list.tsx
│   │       ├── lecture-card.tsx
│   │       ├── lecture-filters.tsx
│   │       ├── lecture-search.tsx
│   │       ├── tag-input.tsx
│   │       ├── bulk-action-toolbar.tsx
│   │       └── delete-confirmation.tsx
│   └── lib/
│       └── search.ts                         # Search utilities
```

**Database Indexes to Add:**

```sql
-- Add indexes for common query patterns
CREATE INDEX idx_lectures_course_id ON lectures(course_id);
CREATE INDEX idx_lectures_processing_status ON lectures(processing_status);
CREATE INDEX idx_lectures_uploaded_at ON lectures(uploaded_at DESC);

-- Full-text search index (if using PostgreSQL FTS)
CREATE INDEX idx_lectures_title_fts ON lectures USING GIN(to_tsvector('english', title));
```

### Important Implementation Notes

1. **MVP Scope Decisions:**
   - **Defer nested folders** - Flat course structure sufficient for MVP
   - Tag-based organization provides flexibility without complexity
   - Can add folder hierarchy in v2 if user requests

2. **Search Scope:**
   - Basic PostgreSQL text search for MVP
   - NOT implementing semantic search (that's Epic 3)
   - Search limited to metadata: title, course, tags
   - Content search comes with pgvector in Epic 3

3. **Responsive Design:**
   - Desktop: Table view with multiple columns
   - Tablet: Card view with key info
   - Mobile: Compact list with essential details
   - Use shadcn/ui responsive patterns

4. **Course Color Coding:**
   - Allow users to assign colors to courses
   - Store as hex code in Course table (add `color` field)
   - Visual distinction in library view
   - Default palette: 10 medical-friendly colors

5. **Data Validation:**
   - Course name: Required, 1-100 characters
   - Course code: Optional, 1-20 characters (e.g., "ANAT 505")
   - Lecture title: Required, 1-200 characters
   - Tags: Max 10 tags per lecture, 1-30 characters each

6. **Delete Cascades:**
   - Deleting Course: Offer options (delete lectures OR move to "Uncategorized")
   - Deleting Lecture: Cascade delete ContentChunks, LearningObjectives
   - Also delete PDF file from storage
   - Cannot delete Course with lectures (safety check)

### References

- [Source: docs/epics-Americano-2025-10-14.md - Epic 1, Story 1.3 (lines 109-130)]
- [Source: docs/solution-architecture.md - Course Model (lines 736-752)]
- [Source: docs/solution-architecture.md - Lecture Model (lines 754-781)]
- [Source: docs/solution-architecture.md - API Endpoints - Content (lines 1239-1253)]
- [Source: docs/solution-architecture.md - UI Components (lines 1857-1863)]
- [Source: docs/PRD-Americano-2025-10-14.md - FR12: Content Management & Organization]

## Dev Agent Record

### Context Reference

- docs/stories/story-context-1.3.xml

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled by dev agent)

### Completion Notes List

(To be filled by dev agent)

### File List

(To be filled by dev agent)
