# First Aid Query Quick Reference

**For:** Backend developers implementing First Aid cross-reference API endpoints
**Performance Targets:** <100ms cross-ref, <200ms section lookup, <50ms version check

---

## Quick Start: Common Queries

### 1. Get Cross-References by Concept ID

```typescript
// Use this when: User clicks on a concept in knowledge graph
// API Route: GET /api/first-aid/cross-references?conceptId=...
// Performance: <100ms

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function getCrossReferencesByConcept(
  conceptId: string,
  userId: string
): Promise<FirstAidReference[]> {
  // Use raw SQL for vector similarity search
  const results = await prisma.$queryRaw<FirstAidReference[]>`
    WITH concept_embedding AS (
      SELECT embedding FROM concepts WHERE id = ${conceptId}
    )
    SELECT
      fas.id,
      fas.edition,
      fas.system,
      fas.section,
      fas.subsection,
      fas."pageNumber",
      fas."isHighYield",
      fas.mnemonics,
      fas."clinicalCorrelations",
      LEFT(fas.content, 200) || '...' AS content_preview,
      (1 - (fas.embedding <=> ce.embedding) / 2) AS similarity
    FROM first_aid_sections fas
    CROSS JOIN concept_embedding ce
    WHERE fas.embedding IS NOT NULL
      AND fas."userId" = ${userId}
      AND (1 - (fas.embedding <=> ce.embedding) / 2) >= 0.65
    ORDER BY
      CASE WHEN fas."isHighYield" = true
      THEN (1 - (fas.embedding <=> ce.embedding) / 2) + 0.1
      ELSE (1 - (fas.embedding <=> ce.embedding) / 2)
      END DESC
    LIMIT 10
  `;

  return results;
}

interface FirstAidReference {
  id: string;
  edition: string;
  system: string;
  section: string;
  subsection?: string;
  pageNumber: number;
  isHighYield: boolean;
  mnemonics: string[];
  clinicalCorrelations: string[];
  content_preview: string;
  similarity: number;
}
```

---

### 2. Get Contextual References by Section/Scroll Position

```typescript
// Use this when: User scrolls through lecture content
// API Route: GET /api/first-aid/mappings/[lectureId]?chunkIndex=...
// Performance: <200ms

async function getContextualReferences(
  lectureId: string,
  currentChunkIndex: number,
  userId: string
): Promise<ContextualReference[]> {
  // Option A: Fast lookup using pre-computed mappings (recommended)
  const mappings = await prisma.lectureFirstAidMapping.findMany({
    where: {
      lectureId: lectureId,
      confidence: { gte: 0.65 },
    },
    include: {
      firstAidSection: {
        select: {
          id: true,
          edition: true,
          system: true,
          section: true,
          subsection: true,
          pageNumber: true,
          isHighYield: true,
          mnemonics: true,
          clinicalCorrelations: true,
          content: true,
        },
      },
    },
    orderBy: [
      { confidence: 'desc' },
    ],
    take: 15,
  });

  return mappings.map(m => ({
    id: m.id,
    confidence: m.confidence,
    priority: m.priority,
    rationale: m.rationale,
    section: m.firstAidSection,
  }));
}

interface ContextualReference {
  id: string;
  confidence: number;
  priority: 'HIGH_YIELD' | 'STANDARD' | 'SUGGESTED';
  rationale: string | null;
  section: {
    id: string;
    edition: string;
    system: string;
    section: string;
    subsection?: string;
    pageNumber: number;
    isHighYield: boolean;
    mnemonics: string[];
    clinicalCorrelations: string[];
    content: string;
  };
}
```

---

### 3. Check for Edition Updates

```typescript
// Use this when: Showing update notification
// API Route: GET /api/first-aid/editions/check-update
// Performance: <50ms

async function checkForEditionUpdate(
  userId: string
): Promise<EditionCheckResult> {
  const currentEdition = await prisma.firstAidEdition.findFirst({
    where: {
      userId: userId,
      isActive: true,
    },
  });

  const latestEdition = await prisma.firstAidEdition.findFirst({
    where: {
      userId: userId,
    },
    orderBy: [
      { year: 'desc' },
      { uploadedAt: 'desc' },
    ],
  });

  if (!currentEdition || !latestEdition) {
    return { updateAvailable: false };
  }

  return {
    updateAvailable: latestEdition.year > currentEdition.year,
    currentEdition: {
      year: currentEdition.year,
      version: currentEdition.versionNumber,
    },
    latestEdition: {
      year: latestEdition.year,
      version: latestEdition.versionNumber,
      sectionCount: latestEdition.sectionCount,
      highYieldCount: latestEdition.highYieldCount,
    },
  };
}

interface EditionCheckResult {
  updateAvailable: boolean;
  currentEdition?: {
    year: number;
    version: string;
  };
  latestEdition?: {
    year: number;
    version: string;
    sectionCount: number;
    highYieldCount: number;
  };
}
```

---

### 4. Batch Get Mappings for Multiple Lectures

```typescript
// Use this when: Loading study session with multiple lectures
// API Route: POST /api/first-aid/mappings/batch
// Performance: <300ms for 5 lectures

async function batchGetMappings(
  lectureIds: string[]
): Promise<BatchMappingResult[]> {
  const results = await prisma.$queryRaw<BatchMappingResult[]>`
    SELECT
      lfam."lectureId",
      l.title AS lecture_title,
      COUNT(lfam.id) AS mapping_count,
      AVG(lfam.confidence) AS avg_confidence,
      COUNT(CASE WHEN fas."isHighYield" = true THEN 1 END) AS high_yield_count,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', fas.id,
          'system', fas.system,
          'section', fas.section,
          'pageNumber', fas."pageNumber",
          'isHighYield', fas."isHighYield",
          'confidence', lfam.confidence
        ) ORDER BY lfam.confidence DESC
      ) FILTER (WHERE lfam.confidence >= 0.70) AS top_sections
    FROM lecture_first_aid_mappings lfam
    INNER JOIN first_aid_sections fas ON fas.id = lfam."firstAidSectionId"
    INNER JOIN lectures l ON l.id = lfam."lectureId"
    WHERE lfam."lectureId" = ANY(${lectureIds}::TEXT[])
      AND lfam.confidence >= 0.65
    GROUP BY lfam."lectureId", l.title
    ORDER BY avg_confidence DESC
  `;

  return results;
}

interface BatchMappingResult {
  lectureId: string;
  lecture_title: string;
  mapping_count: number;
  avg_confidence: number;
  high_yield_count: number;
  top_sections: Array<{
    id: string;
    system: string;
    section: string;
    pageNumber: number;
    isHighYield: boolean;
    confidence: number;
  }>;
}
```

---

## Performance Optimization Tips

### 1. Use Caching for Repeated Queries

```typescript
import { firstAidCache } from '@/lib/first-aid-cache';

async function getCachedReferences(
  conceptId: string,
  userId: string
): Promise<FirstAidReference[]> {
  const cacheKey = firstAidCache.generateKey({
    type: 'concept',
    conceptId: conceptId,
  });

  // Try cache first
  const cached = firstAidCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from database
  const references = await getCrossReferencesByConcept(conceptId, userId);

  // Cache for 30 minutes
  firstAidCache.set(cacheKey, references, {
    ttl: 30 * 60 * 1000,
  });

  return references;
}
```

### 2. Prefetch Adjacent Sections

```typescript
// Prefetch references for adjacent chunks during scroll
async function prefetchAdjacentReferences(
  lectureId: string,
  currentChunkIndex: number,
  userId: string
): Promise<void> {
  // Prefetch -2, -1, +1, +2 chunks in background
  const chunksToFetch = [
    currentChunkIndex - 2,
    currentChunkIndex - 1,
    currentChunkIndex + 1,
    currentChunkIndex + 2,
  ].filter(i => i >= 0);

  // Fire and forget (don't await)
  chunksToFetch.forEach(chunkIndex => {
    getContextualReferences(lectureId, chunkIndex, userId).catch(err => {
      console.error(`Prefetch failed for chunk ${chunkIndex}:`, err);
    });
  });
}
```

### 3. Use Select to Limit Fields

```typescript
// ✅ GOOD: Only retrieve needed fields
const sections = await prisma.firstAidSection.findMany({
  select: {
    id: true,
    section: true,
    pageNumber: true,
    isHighYield: true,
  },
});

// ❌ BAD: Retrieves ALL fields including large content and embedding
const sections = await prisma.firstAidSection.findMany();
```

### 4. Batch Queries Instead of Loops

```typescript
// ✅ GOOD: Single query with IN clause
const mappings = await prisma.lectureFirstAidMapping.findMany({
  where: {
    lectureId: { in: lectureIds },
  },
});

// ❌ BAD: N separate queries
for (const lectureId of lectureIds) {
  const mapping = await prisma.lectureFirstAidMapping.findMany({
    where: { lectureId },
  });
}
```

---

## Common Pitfalls

### ❌ Don't Do This: N+1 Queries

```typescript
// BAD: Causes N+1 queries
const mappings = await prisma.lectureFirstAidMapping.findMany();
for (const mapping of mappings) {
  const section = await prisma.firstAidSection.findUnique({
    where: { id: mapping.firstAidSectionId },
  });
}
```

**Fix:** Use `include` to fetch relations in single query:

```typescript
// GOOD: Single query with JOIN
const mappings = await prisma.lectureFirstAidMapping.findMany({
  include: {
    firstAidSection: true,
  },
});
```

---

### ❌ Don't Do This: Large Result Sets Without Pagination

```typescript
// BAD: Could return thousands of rows
const sections = await prisma.firstAidSection.findMany({
  where: { isHighYield: true },
});
```

**Fix:** Always use `take` to limit results:

```typescript
// GOOD: Limit to reasonable page size
const sections = await prisma.firstAidSection.findMany({
  where: { isHighYield: true },
  take: 20,
});
```

---

### ❌ Don't Do This: Unindexed Filters

```typescript
// BAD: Function on indexed column prevents index usage
const mappings = await prisma.$queryRaw`
  SELECT * FROM lecture_first_aid_mappings
  WHERE LOWER("lectureId") = LOWER(${lectureId})
`;
```

**Fix:** Use indexed columns directly:

```typescript
// GOOD: Uses index on lectureId
const mappings = await prisma.lectureFirstAidMapping.findMany({
  where: { lectureId: lectureId },
});
```

---

## Testing Query Performance

### Use EXPLAIN ANALYZE

```typescript
// Check execution plan for slow queries
const result = await prisma.$queryRawUnsafe(`
  EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
  SELECT * FROM first_aid_sections
  WHERE "userId" = 'test-user'
    AND "isHighYield" = true
  LIMIT 10
`);

console.log(JSON.stringify(result, null, 2));
```

### Monitor Slow Queries

```typescript
// Add timing to API routes
const startTime = performance.now();

const mappings = await getContextualReferences(lectureId, chunkIndex, userId);

const duration = performance.now() - startTime;
if (duration > 200) {
  console.warn(`Slow query: ${duration}ms for lecture ${lectureId}`);
}
```

---

## API Route Examples

### GET /api/first-aid/cross-references

```typescript
// apps/web/src/app/api/first-aid/cross-references/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCrossReferencesByConcept } from '@/lib/first-aid-queries';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conceptId = searchParams.get('conceptId');
  const userId = request.headers.get('x-user-id'); // From auth middleware

  if (!conceptId || !userId) {
    return NextResponse.json(
      { error: 'Missing conceptId or userId' },
      { status: 400 }
    );
  }

  try {
    const startTime = performance.now();
    const references = await getCrossReferencesByConcept(conceptId, userId);
    const duration = performance.now() - startTime;

    return NextResponse.json({
      references,
      metadata: {
        count: references.length,
        queryTime: `${duration.toFixed(2)}ms`,
      },
    });
  } catch (error) {
    console.error('Error fetching cross-references:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### GET /api/first-aid/mappings/[lectureId]

```typescript
// apps/web/src/app/api/first-aid/mappings/[lectureId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getContextualReferences } from '@/lib/first-aid-queries';
import { firstAidCache } from '@/lib/first-aid-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lectureId: string }> }
) {
  const { lectureId } = await params;
  const { searchParams } = new URL(request.url);
  const chunkIndex = parseInt(searchParams.get('chunkIndex') || '0');
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Generate cache key
    const cacheKey = firstAidCache.generateKey({
      type: 'lecture',
      lectureId,
      chunkIndex,
    });

    // Try cache first
    const cached = firstAidCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        references: cached,
        cached: true,
      });
    }

    // Fetch from database
    const startTime = performance.now();
    const references = await getContextualReferences(
      lectureId,
      chunkIndex,
      userId
    );
    const duration = performance.now() - startTime;

    // Cache for 30 minutes
    firstAidCache.set(cacheKey, references, {
      ttl: 30 * 60 * 1000,
    });

    return NextResponse.json({
      references,
      cached: false,
      metadata: {
        count: references.length,
        queryTime: `${duration.toFixed(2)}ms`,
      },
    });
  } catch (error) {
    console.error('Error fetching contextual references:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Troubleshooting

### Query Too Slow (>200ms)

1. **Check if indexes are being used:**
   ```sql
   EXPLAIN ANALYZE your_query_here;
   ```
   Look for "Index Scan" instead of "Seq Scan"

2. **Verify statistics are up-to-date:**
   ```sql
   ANALYZE first_aid_sections;
   ANALYZE lecture_first_aid_mappings;
   ```

3. **Check connection pool:**
   - Max connections: 20 (configured in Prisma)
   - If hitting limit, increase or use connection pooler

4. **Enable query logging:**
   ```sql
   ALTER DATABASE americano SET log_min_duration_statement = 100;
   ```

### Vector Search Not Using Index

1. **Verify index exists:**
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'first_aid_sections'
     AND indexname LIKE '%embedding%';
   ```

2. **Rebuild index if needed:**
   ```sql
   REINDEX INDEX first_aid_sections_embedding_idx;
   ```

3. **Check vector extension:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

---

## Related Documentation

- [Complete Query Optimization Guide](./first-aid-query-optimization.md)
- [Caching Strategy](../implementation/first-aid-cache.md)
- [Story 3.3: First Aid Integration](../stories/story-3.3.md)

---

**Last Updated:** 2025-10-17
**Maintainer:** Backend Team
