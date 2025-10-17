# SQL Schema Validation - Quick Reference

This directory contains Zod schemas for validating raw SQL query results in Epic 3.

## Quick Start

```typescript
import { CoOccurrenceResultSchema, validateSQLResults } from '@/lib/validation/sql-schemas'

// Execute raw SQL query
const rawResults = await prisma.$queryRaw`SELECT ...`

// Validate results
const validated = validateSQLResults(CoOccurrenceResultSchema, rawResults as unknown[])
// validated is now fully typed as CoOccurrenceResult[]
```

## Files

- **`sql-schemas.ts`** - Main schema definitions (17 schemas)
- **`sql-schemas-usage-examples.ts`** - Comprehensive usage examples
- **`exam.ts`** - Exam validation schemas (existing)

## Available Schemas

### Knowledge Graph (Story 3.2)
- `CoOccurrenceResultSchema` - Co-occurrence detection results
- `SemanticSimilarityResultSchema` - Vector similarity results
- `ConceptCreationResultSchema` - Concept insertion results

### Semantic Search (Story 3.1)
- `VectorSearchChunkResultSchema` - Content chunk search results
- `VectorSearchLectureResultSchema` - Lecture search results
- `VectorSearchConceptResultSchema` - Concept search results
- `KeywordSearchResultSchema` - Full-text search results

### Search Analytics (Story 3.1.6, 3.6.5)
- `PopularSearchResultSchema` - Popular search aggregations
- `ZeroResultQuerySchema` - Zero-result queries
- `CTRByPositionResultSchema` - Click-through rate by position
- `SearchPerformanceMetricsSchema` - Performance metrics
- `P95ResponseTimeSchema` - 95th percentile response time
- `SearchSuggestionResultSchema` - Search suggestions
- `SearchVolumeOverTimeSchema` - Time-series search volume
- `ContentTypeDistributionSchema` - Content type distribution
- `ContentGapResultSchema` - Content gap analysis
- `TopQueryByCTRSchema` - Top queries by CTR

## Usage Patterns

### Pattern 1: Throwing Validation (in services)
```typescript
try {
  const validated = validateSQLResults(schema, rawResults)
  return processResults(validated)
} catch (error) {
  throw new ValidationError('Invalid SQL results', error)
}
```

### Pattern 2: Safe Validation (in API routes)
```typescript
const result = safeValidateSQLResults(schema, rawResults)
if (!result.success) {
  return NextResponse.json({ error: 'Validation failed' }, { status: 500 })
}
return NextResponse.json({ data: result.data })
```

### Pattern 3: BigInt Conversion (analytics)
```typescript
const validated = validateSQLResults(PopularSearchResultSchema, rawResults)
const converted = convertBigIntFields(validated, ['count'])
// count is now number instead of bigint
```

## Utility Functions

- `validateSQLResults(schema, results)` - Validate array, throws on error
- `safeValidateSQLResults(schema, results)` - Safe validation, returns result object
- `bigIntToNumber(value)` - Convert PostgreSQL bigint to number
- `convertBigIntFields(results, fields)` - Batch convert bigint fields

## Examples

See `sql-schemas-usage-examples.ts` for:
- Co-occurrence detection validation
- Vector search validation
- Analytics with BigInt conversion
- Error handling patterns
- Service integration
- Testing examples

## TypeScript Support

All schemas provide full TypeScript type inference:

```typescript
import type { CoOccurrenceResult } from '@/lib/validation/sql-schemas'

function processResults(results: CoOccurrenceResult[]) {
  // results is fully typed with autocomplete support
  results.forEach(r => {
    console.log(r.concept1_name) // ✓ Type-safe
    console.log(r.invalid_field)  // ✗ TypeScript error
  })
}
```

## Namespace Import

```typescript
import { SQLSchemas, type SQLTypes } from '@/lib/validation/sql-schemas'

// Access any schema via namespace
const schema = SQLSchemas.CoOccurrenceResult
const data: SQLTypes['CoOccurrenceResult'] = { ... }
```

## More Information

- Full documentation: `DELIVERABLE-SQL-SCHEMAS.md`
- Usage examples: `sql-schemas-usage-examples.ts`
- Story context: Epic 3 Stories 3.1, 3.2, 3.6
