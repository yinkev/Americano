# First Aid Integration Database Schema Design

**Created:** 2025-10-17
**Story:** 3.3 - First Aid Integration and Cross-Referencing
**Status:** Complete

## Overview

This document outlines the database schema design for First Aid integration, which enables medical students to automatically link lecture content to relevant First Aid sections, supporting semantic search, conflict detection, and cross-referencing capabilities.

## Schema Models

### 1. FirstAidSection

**Purpose:** Stores First Aid book content with structure preservation and embeddings for semantic search.

**Fields:**
- `id` (String): Primary key (cuid)
- `userId` (String): User who uploaded this content
- `edition` (String): Edition identifier (e.g., "2026", "2025")
- `year` (Int): Numeric year for sorting
- `system` (String): Medical system category (e.g., "Cardiovascular", "Respiratory")
- `section` (String): Major section title
- `subsection` (String?): Optional subsection title
- `pageNumber` (Int): Page reference in physical book
- `content` (Text): Full section content
- `isHighYield` (Boolean): Flag for starred/high-yield content
- `mnemonics` (String[]): List of mnemonics in this section
- `clinicalCorrelations` (String[]): Clinical application notes
- `visualMarkers` (Json?): Structured metadata for visual elements
- `embedding` (vector(1536)?): Semantic embedding for similarity search
- `encryptionKeyHash` (String?): User-specific encryption for copyright protection
- `accessCount` (Int): Access tracking for rate limiting
- `lastAccessedAt` (DateTime?): Last access timestamp
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- `userId`: Fast user content lookup
- `(edition, system)`: Composite index for edition+system filtering
- `isHighYield`: Quick filtering of high-yield content
- `pageNumber`: Page-based navigation

**Relations:**
- `lectureMappings` → LectureFirstAidMapping[]
- `conflictsAsSourceA` → Conflict[]
- `conflictsAsSourceB` → Conflict[]
- `conceptMappings` → FirstAidConceptMapping[]

**Design Decisions:**
1. **User-specific content:** Each user uploads their own First Aid copy (copyright compliance)
2. **Structure preservation:** Separate fields for mnemonics, correlations maintain original structure
3. **Vector embeddings:** 1536-dimensional embeddings match Gemini text-embedding-001 format
4. **Encryption support:** Optional encryption for sensitive copyrighted content
5. **Access tracking:** Rate limiting prevents bulk content extraction

---

### 2. LectureFirstAidMapping

**Purpose:** Links lecture content to relevant First Aid sections with confidence scoring.

**Fields:**
- `id` (String): Primary key (cuid)
- `lectureId` (String): Foreign key to Lecture
- `firstAidSectionId` (String): Foreign key to FirstAidSection
- `confidence` (Float): Similarity score (0.0-1.0)
- `priority` (MappingPriority): HIGH_YIELD, STANDARD, or SUGGESTED
- `rationale` (Text?): Human-readable explanation of mapping
- `userFeedback` (MappingFeedback?): User validation (HELPFUL, NOT_HELPFUL, SOMEWHAT_HELPFUL)
- `feedbackNotes` (Text?): Additional user feedback
- `autoMapped` (Boolean): True if algorithmically generated
- `mappedAt` (DateTime): Mapping creation timestamp
- `validatedAt` (DateTime?): User validation timestamp

**Indexes:**
- `lectureId`: Fast lecture-to-First-Aid lookups
- `firstAidSectionId`: Reverse lookups (First Aid to lectures)
- `confidence`: Sorting by confidence score
- `priority`: Filtering by priority level
- UNIQUE `(lectureId, firstAidSectionId)`: Prevent duplicate mappings

**Constraints:**
- CHECK `confidence >= 0.0 AND confidence <= 1.0`

**Relations:**
- `lecture` → Lecture (CASCADE delete)
- `firstAidSection` → FirstAidSection (CASCADE delete)

**Design Decisions:**
1. **Confidence scoring:** Float 0.0-1.0 enables threshold-based filtering
2. **Priority enum:** Separates high-yield content from standard mappings
3. **User feedback loop:** Validates algorithm accuracy, improves future mappings
4. **Rationale storage:** Explainability for AI-generated mappings
5. **Cascade delete:** Automatically clean up mappings when source content deleted

---

### 3. FirstAidGuideline

**Purpose:** Stores First Aid clinical guidelines (alternative to sections model) for procedural/protocol content.

**Fields:**
- `id` (String): Primary key (cuid)
- `title` (String): Guideline title
- `slug` (String): URL-friendly unique identifier
- `content` (Text): Full guideline content
- `category` (String): Category (e.g., "CPR", "Bleeding", "Burns")
- `edition` (String): Edition reference (e.g., "2024 Edition")
- `publishedAt` (DateTime): Publication date
- `embedding` (vector(1536)?): Semantic embedding
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- UNIQUE `slug`: Fast URL-based lookups
- `category`: Category filtering
- `edition`: Edition-specific queries

**Relations:**
- `conceptMappings` → FirstAidConceptMapping[]

**Design Decisions:**
1. **Separate from sections:** Guidelines are procedural (CPR steps), sections are educational (anatomy)
2. **Slug field:** SEO-friendly URLs for guideline pages
3. **Category-based:** Enables emergency-type filtering (trauma, cardiac, respiratory)
4. **Edition tracking:** Supports multiple guideline versions

---

### 4. FirstAidConceptMapping

**Purpose:** Links First Aid content (guidelines or sections) to knowledge graph concepts.

**Fields:**
- `id` (String): Primary key (cuid)
- `guidelineId` (String?): Optional FK to FirstAidGuideline
- `sectionId` (String?): Optional FK to FirstAidSection
- `conceptId` (String): FK to Concept (required)
- `relevanceScore` (Float): Relevance score (0.0-1.0, default 0.5)
- `mappingType` (MappingType): DIRECT, CONTEXTUAL, or PROCEDURAL
- `sourceSection` (String?): Specific section reference within guideline
- `createdAt` (DateTime): Creation timestamp

**Indexes:**
- `conceptId`: Fast concept-to-First-Aid lookups
- `relevanceScore`: Sorting by relevance
- `mappingType`: Filtering by mapping type
- UNIQUE `(guidelineId, conceptId)` WHERE guidelineId NOT NULL
- UNIQUE `(sectionId, conceptId)` WHERE sectionId NOT NULL

**Constraints:**
- CHECK `relevanceScore >= 0.0 AND relevanceScore <= 1.0`
- At least one of `guidelineId` or `sectionId` must be set

**Relations:**
- `guideline` → FirstAidGuideline (CASCADE delete)
- `section` → FirstAidSection (CASCADE delete)
- `concept` → Concept (CASCADE delete)

**Enums:**
```prisma
enum MappingType {
  DIRECT        // Guideline directly mentions concept
  CONTEXTUAL    // Related by context/symptoms
  PROCEDURAL    // Part of same procedure/protocol
}
```

**Design Decisions:**
1. **Flexible FK:** Supports both guidelines and sections with optional foreign keys
2. **Relevance scoring:** Weighted ranking for search results
3. **Mapping types:** Semantic classification improves search filtering
4. **Source section:** Precise referencing within large guidelines
5. **Partial unique indexes:** PostgreSQL WHERE clause ensures uniqueness only when FK present

---

### 5. FirstAidVersion

**Purpose:** Tracks different editions/versions of First Aid resources for version management.

**Fields:**
- `id` (String): Primary key (cuid)
- `edition` (String): Unique edition identifier (e.g., "2024 Edition")
- `publishedAt` (DateTime): Official publication date
- `downloadedAt` (DateTime): When downloaded/imported to system
- `isActive` (Boolean): Currently active version
- `sourceUrl` (String?): Optional source URL for reference
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- UNIQUE `edition`: Prevent duplicate edition entries
- `isActive`: Quick active version lookup
- `publishedAt`: Chronological sorting

**Relations:**
- None (standalone tracking table)

**Design Decisions:**
1. **Edition uniqueness:** One record per edition for consistency
2. **Active flag:** Simplifies default edition selection
3. **Source tracking:** Optional URL for traceability
4. **Publication vs download:** Separates content date from import date

---

### 6. FirstAidEdition

**Purpose:** Tracks user-specific First Aid edition uploads and processing status.

**Fields:**
- `id` (String): Primary key (cuid)
- `userId` (String): User who owns this edition
- `year` (Int): Edition year
- `versionNumber` (String): Version identifier (e.g., "2026.1")
- `uploadedAt` (DateTime): Upload timestamp
- `isActive` (Boolean): Latest edition for this user
- `changeLog` (Text?): What changed from previous edition
- `mappingStatus` (EditionMappingStatus): PENDING, IN_PROGRESS, COMPLETED, FAILED
- `processingProgress` (Int): 0-100 percentage
- `sectionCount` (Int): Total sections in this edition
- `highYieldCount` (Int): High-yield section count
- `totalPages` (Int): Total page count
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- UNIQUE `(userId, year)`: One edition per year per user
- `(userId, isActive)`: Fast active edition lookup
- `year`: Chronological sorting

**Enums:**
```prisma
enum EditionMappingStatus {
  PENDING       // Not yet processed
  IN_PROGRESS   // Currently mapping
  COMPLETED     // All mappings done
  FAILED        // Processing failed
}
```

**Design Decisions:**
1. **User-specific:** Each user manages their own First Aid editions
2. **Processing state:** Tracks async mapping job progress
3. **Metadata counters:** Quick statistics without table scans
4. **Change tracking:** Documents edition differences

---

## Enums

### MappingPriority
```prisma
enum MappingPriority {
  HIGH_YIELD  // Starred First Aid content
  STANDARD    // Normal mapping
  SUGGESTED   // Low confidence, needs review
}
```

### MappingFeedback
```prisma
enum MappingFeedback {
  HELPFUL
  NOT_HELPFUL
  SOMEWHAT_HELPFUL
}
```

### MappingType
```prisma
enum MappingType {
  DIRECT        // Guideline directly mentions concept
  CONTEXTUAL    // Related by context/symptoms
  PROCEDURAL    // Part of same procedure/protocol
}
```

### EditionMappingStatus
```prisma
enum EditionMappingStatus {
  PENDING       // Not yet processed
  IN_PROGRESS   // Currently mapping
  COMPLETED     // All mappings done
  FAILED        // Processing failed
}
```

---

## Integration with Existing Schema

### Concept Model Extension

Added relation to Concept model:
```prisma
model Concept {
  // ... existing fields ...
  firstAidMappings FirstAidConceptMapping[]
}
```

### Conflict Model Extension

Existing Conflict model already supports First Aid through optional foreign keys:
- `sourceAFirstAidId` (String?)
- `sourceBFirstAidId` (String?)

### ConflictFlag Model Extension

Existing ConflictFlag model supports First Aid conflict reporting:
- `sourceAFirstAidId` (String?)
- `sourceBFirstAidId` (String?)

---

## Vector Index Strategy

### Embedding Dimensions
- All embeddings: `vector(1536)` matching Gemini text-embedding-001 output

### Index Types
- **ivfflat:** For approximate nearest neighbor search on embeddings
- **B-tree:** For standard field indexes (userId, edition, category)
- **Composite:** For multi-column queries (edition+system, userId+isActive)

### Performance Considerations
1. Vector indexes created AFTER data population (faster bulk insert)
2. Partial indexes for conditional uniqueness (guidelineId/sectionId)
3. Covering indexes avoid table lookups for common queries

---

## Migration Strategy

### Migration 1: `20251017000000_add_first_aid_integration`
- Creates FirstAidSection, LectureFirstAidMapping, FirstAidEdition
- Adds First Aid foreign keys to Conflict and ConflictFlag tables
- Includes enums: MappingPriority, MappingFeedback, EditionMappingStatus

### Migration 2: `20251017060000_add_first_aid_guidelines`
- Creates FirstAidGuideline, FirstAidConceptMapping, FirstAidVersion
- Adds MappingType enum
- Adds CHECK constraints for score ranges
- Includes table and column comments for documentation

---

## Data Integrity Constraints

### CHECK Constraints
1. `first_aid_concept_mappings.relevanceScore`: Must be between 0.0 and 1.0
2. `lecture_first_aid_mappings.confidence`: Must be between 0.0 and 1.0

### Foreign Key Cascades
- CASCADE delete: Mappings deleted when source content removed
- Prevents orphaned mapping records
- Maintains referential integrity across user content deletions

### Unique Constraints
1. `first_aid_guidelines.slug`: Prevents duplicate URLs
2. `first_aid_versions.edition`: One record per edition
3. `first_aid_editions.(userId, year)`: One edition per year per user
4. `lecture_first_aid_mappings.(lectureId, firstAidSectionId)`: Prevents duplicate mappings
5. `first_aid_concept_mappings.(guidelineId, conceptId)`: Conditional uniqueness
6. `first_aid_concept_mappings.(sectionId, conceptId)`: Conditional uniqueness

---

## Query Patterns

### Common Queries

#### 1. Find First Aid sections for lecture
```sql
SELECT fas.*
FROM first_aid_sections fas
JOIN lecture_first_aid_mappings lfam ON fas.id = lfam."firstAidSectionId"
WHERE lfam."lectureId" = :lectureId
  AND lfam.confidence > 0.75
ORDER BY lfam.priority DESC, lfam.confidence DESC;
```

#### 2. Semantic search across First Aid
```sql
SELECT id, title, content,
       1 - (embedding <=> :query_embedding) as similarity
FROM first_aid_guidelines
WHERE 1 - (embedding <=> :query_embedding) > 0.65
ORDER BY similarity DESC
LIMIT 10;
```

#### 3. High-yield content for user
```sql
SELECT * FROM first_aid_sections
WHERE userId = :userId
  AND isHighYield = true
  AND edition = (
    SELECT versionNumber FROM first_aid_editions
    WHERE userId = :userId AND isActive = true
  )
ORDER BY system, pageNumber;
```

#### 4. Concept to First Aid mapping
```sql
SELECT
  fag.title as guideline_title,
  fas.section as section_title,
  facm.relevanceScore,
  facm.mappingType
FROM first_aid_concept_mappings facm
LEFT JOIN first_aid_guidelines fag ON facm."guidelineId" = fag.id
LEFT JOIN first_aid_sections fas ON facm."sectionId" = fas.id
WHERE facm."conceptId" = :conceptId
ORDER BY facm.relevanceScore DESC;
```

---

## Performance Optimization

### Index Usage Patterns
1. **User content queries:** Use `userId` indexes
2. **Edition filtering:** Use composite `(edition, system)` indexes
3. **Similarity search:** Use vector indexes with cosine distance operator `<=>`
4. **Priority sorting:** Use `priority` and `confidence` indexes

### Query Optimization Tips
1. Use confidence thresholds (>0.75) to limit result sets
2. Leverage `isActive` flag to avoid scanning old editions
3. Batch embedding generation during off-peak hours
4. Use partial indexes for conditional uniqueness

---

## Security Considerations

### Copyright Protection
1. **User-specific content:** Each user uploads their own First Aid copy
2. **Encryption support:** `encryptionKeyHash` field for sensitive content
3. **Access tracking:** `accessCount` and `lastAccessedAt` for rate limiting
4. **Cascade delete:** User content removed when user deleted

### Privacy
1. User mappings and feedback isolated per user
2. No cross-user content sharing
3. Audit trail via timestamps

---

## Future Enhancements

### Potential Schema Additions
1. **FirstAidDiagram:** Store and reference diagrams separately
2. **MappingHistory:** Track mapping algorithm changes over time
3. **UserAnnotations:** Allow users to add notes to First Aid content
4. **CollaborativeFiltering:** Track which mappings are most helpful across users (anonymized)

### Scalability Considerations
1. Partition `first_aid_sections` by `edition` for large datasets
2. Archive old editions to cold storage
3. Implement caching layer for frequent mapping queries

---

## Testing Strategy

### Data Validation
1. Verify confidence scores in valid range (0.0-1.0)
2. Ensure relevance scores in valid range (0.0-1.0)
3. Test cascade deletes propagate correctly
4. Validate unique constraints prevent duplicates

### Performance Testing
1. Benchmark vector similarity queries with 1000+ sections
2. Test mapping algorithm with full lecture corpus
3. Measure index effectiveness with EXPLAIN ANALYZE

---

## References

- **Story 3.3:** First Aid Integration and Cross-Referencing
- **Prisma Docs:** https://www.prisma.io/docs/
- **pgvector:** https://github.com/pgvector/pgvector
- **Solution Architecture:** `docs/solution-architecture.md`

---

**Document Version:** 1.0
**Last Updated:** 2025-10-17
**Author:** Claude (Sonnet 4.5)
