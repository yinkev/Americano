/**
 * Tests for SQL Result Validation Utility
 *
 * @module ValidationUtilsTests
 */

import { describe, expect, it } from '@jest/globals'
import { z } from 'zod'
import { isErr, isOk } from '@/lib/result'
import {
  validateSqlResult,
  validateSingleSqlResult,
  validateOptionalSqlResult,
  type InferSchemaType,
  type ValidatedQueryResult,
} from '../validate-sql-result'
import { DatabaseValidationError } from '@/lib/errors'

/* ============================================================================
 * TEST SCHEMAS
 * ========================================================================== */

const conceptSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  type: z.enum(['DISEASE', 'SYMPTOM', 'TREATMENT', 'ANATOMY']),
  createdAt: z.coerce.date(),
})

type Concept = InferSchemaType<typeof conceptSchema>

const searchResultSchema = z.object({
  conceptId: z.string().uuid(),
  name: z.string(),
  similarity: z.number().min(0).max(1),
  metadata: z.record(z.string(), z.any()).optional(),
})

/* ============================================================================
 * VALIDATE SQL RESULT TESTS
 * ========================================================================== */

describe('validateSqlResult', () => {
  const validationContext = {
    query: 'SELECT * FROM ConceptNode WHERE type = ?',
    operation: 'findConceptsByType',
    metadata: { type: 'DISEASE' },
  }

  it('should validate valid array of results', () => {
    const rawData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Hypertension',
        description: 'High blood pressure',
        type: 'DISEASE',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174000',
        name: 'Diabetes',
        description: null,
        type: 'DISEASE',
        createdAt: new Date('2024-01-02'),
      },
    ]

    const result = validateSqlResult(rawData, conceptSchema, validationContext)

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value).toHaveLength(2)
      expect(result.value[0]?.name).toBe('Hypertension')
      expect(result.value[1]?.description).toBeNull()
    }
  })

  it('should validate empty array', () => {
    const rawData: unknown[] = []

    const result = validateSqlResult(rawData, conceptSchema, validationContext)

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value).toHaveLength(0)
    }
  })

  it('should reject non-array data', () => {
    const rawData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Hypertension',
    }

    const result = validateSqlResult(rawData, conceptSchema, validationContext)

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error).toBeInstanceOf(DatabaseValidationError)
      expect(result.error.validationErrors).toContain('Expected array, received object')
      expect(result.error.retriable).toBe(false)
      expect(result.error.httpStatus).toBe(500)
    }
  })

  it('should reject invalid row data', () => {
    const rawData = [
      {
        id: 'invalid-uuid', // Invalid UUID
        name: 'Hypertension',
        description: 'High blood pressure',
        type: 'DISEASE',
        createdAt: new Date('2024-01-01'),
      },
    ]

    const result = validateSqlResult(rawData, conceptSchema, validationContext)

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error).toBeInstanceOf(DatabaseValidationError)
      expect(result.error.validationErrors.length).toBeGreaterThan(0)
      expect(result.error.validationErrors[0]).toContain('id')
    }
  })

  it('should collect multiple validation errors', () => {
    const rawData = [
      {
        id: 'invalid-uuid',
        name: '', // Empty string (min length 1)
        description: 'Valid',
        type: 'INVALID_TYPE', // Not in enum
        createdAt: 'not-a-date', // Invalid date
      },
    ]

    const result = validateSqlResult(rawData, conceptSchema, validationContext)

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error.validationErrors.length).toBeGreaterThan(1)
    }
  })

  it('should include context in error', () => {
    const rawData = 'not-an-array'

    const result = validateSqlResult(rawData, conceptSchema, validationContext)

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error.context.operation).toBe('findConceptsByType')
      expect(result.error.context.query).toContain('SELECT')
      expect(result.error.metadata.type).toBe('DISEASE')
    }
  })

  it('should handle partial validation (some valid, some invalid)', () => {
    const rawData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Valid Concept',
        description: 'Valid',
        type: 'DISEASE',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'invalid-uuid',
        name: 'Invalid Concept',
        description: 'Invalid',
        type: 'DISEASE',
        createdAt: new Date('2024-01-01'),
      },
    ]

    const result = validateSqlResult(rawData, conceptSchema, validationContext)

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      // Should have validation errors for row 1
      expect(result.error.validationErrors.some((err) => err.includes('Row 1'))).toBe(
        true
      )
      // Metadata should show both total and validated rows
      expect(result.error.metadata.totalRows).toBe(2)
      expect(result.error.metadata.validatedRows).toBe(1)
      expect(result.error.metadata.failedRows).toBe(1)
    }
  })

  it('should coerce date strings', () => {
    const rawData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Hypertension',
        description: null,
        type: 'DISEASE',
        createdAt: '2024-01-01T00:00:00.000Z', // String date
      },
    ]

    const result = validateSqlResult(rawData, conceptSchema, validationContext)

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value[0]?.createdAt).toBeInstanceOf(Date)
    }
  })
})

/* ============================================================================
 * VALIDATE SINGLE SQL RESULT TESTS
 * ========================================================================== */

describe('validateSingleSqlResult', () => {
  const validationContext = {
    query: 'SELECT * FROM ConceptNode WHERE id = ?',
    operation: 'findConceptById',
    metadata: { id: '123e4567-e89b-12d3-a456-426614174000' },
  }

  it('should validate single row result', () => {
    const rawData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Hypertension',
        description: 'High blood pressure',
        type: 'DISEASE',
        createdAt: new Date('2024-01-01'),
      },
    ]

    const result = validateSingleSqlResult(rawData, conceptSchema, validationContext)

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value.name).toBe('Hypertension')
      expect(result.value.type).toBe('DISEASE')
    }
  })

  it('should reject empty array', () => {
    const rawData: unknown[] = []

    const result = validateSingleSqlResult(rawData, conceptSchema, validationContext)

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error.validationErrors).toContain(
        'Expected exactly 1 row, received 0 rows'
      )
      expect(result.error.metadata.rowCount).toBe(0)
    }
  })

  it('should reject multiple rows', () => {
    const rawData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Hypertension',
        description: 'High blood pressure',
        type: 'DISEASE',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174000',
        name: 'Diabetes',
        description: null,
        type: 'DISEASE',
        createdAt: new Date('2024-01-02'),
      },
    ]

    const result = validateSingleSqlResult(rawData, conceptSchema, validationContext)

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error.validationErrors[0]).toContain(
        'Expected exactly 1 row, received 2 rows'
      )
      expect(result.error.metadata.rowCount).toBe(2)
    }
  })

  it('should reject invalid single row', () => {
    const rawData = [
      {
        id: 'invalid-uuid',
        name: 'Hypertension',
        description: 'High blood pressure',
        type: 'DISEASE',
        createdAt: new Date('2024-01-01'),
      },
    ]

    const result = validateSingleSqlResult(rawData, conceptSchema, validationContext)

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error.validationErrors.some((err) => err.includes('id'))).toBe(true)
    }
  })
})

/* ============================================================================
 * VALIDATE OPTIONAL SQL RESULT TESTS
 * ========================================================================== */

describe('validateOptionalSqlResult', () => {
  const validationContext = {
    query: 'SELECT * FROM ConceptNode WHERE name = ?',
    operation: 'findConceptByName',
    metadata: { name: 'Hypertension' },
  }

  it('should validate single row result', () => {
    const rawData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Hypertension',
        description: 'High blood pressure',
        type: 'DISEASE',
        createdAt: new Date('2024-01-01'),
      },
    ]

    const result = validateOptionalSqlResult(rawData, conceptSchema, validationContext)

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value).toBeDefined()
      expect(result.value?.name).toBe('Hypertension')
    }
  })

  it('should return undefined for empty array', () => {
    const rawData: unknown[] = []

    const result = validateOptionalSqlResult(rawData, conceptSchema, validationContext)

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value).toBeUndefined()
    }
  })

  it('should reject multiple rows', () => {
    const rawData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Hypertension',
        description: 'High blood pressure',
        type: 'DISEASE',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174000',
        name: 'Diabetes',
        description: null,
        type: 'DISEASE',
        createdAt: new Date('2024-01-02'),
      },
    ]

    const result = validateOptionalSqlResult(rawData, conceptSchema, validationContext)

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error.validationErrors[0]).toContain(
        'Expected at most 1 row, received 2 rows'
      )
    }
  })

  it('should reject invalid single row', () => {
    const rawData = [
      {
        id: 'invalid-uuid',
        name: 'Hypertension',
        description: 'High blood pressure',
        type: 'DISEASE',
        createdAt: new Date('2024-01-01'),
      },
    ]

    const result = validateOptionalSqlResult(rawData, conceptSchema, validationContext)

    expect(isErr(result)).toBe(true)
  })
})

/* ============================================================================
 * TYPE UTILITY TESTS
 * ========================================================================== */

describe('Type Utilities', () => {
  it('should infer correct types from schema', () => {
    // Type-only test - compile time validation
    type InferredConcept = InferSchemaType<typeof conceptSchema>

    const concept: InferredConcept = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Hypertension',
      description: null,
      type: 'DISEASE',
      createdAt: new Date(),
    }

    expect(concept.name).toBe('Hypertension')
  })

  it('should create correct ValidatedQueryResult type', () => {
    // Type-only test - compile time validation
    type ConceptQueryResult = ValidatedQueryResult<typeof conceptSchema>

    const result: ConceptQueryResult = {
      success: true,
      value: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Hypertension',
          description: null,
          type: 'DISEASE',
          createdAt: new Date(),
        },
      ],
    }

    expect(result.success).toBe(true)
  })
})

/* ============================================================================
 * INTEGRATION TESTS
 * ========================================================================== */

describe('Integration Tests', () => {
  it('should handle complex nested schema', () => {
    const relationshipSchema = z.object({
      id: z.string().uuid(),
      sourceId: z.string().uuid(),
      targetId: z.string().uuid(),
      type: z.enum(['IS_A', 'PART_OF', 'CAUSES', 'TREATS']),
      strength: z.number().min(0).max(1),
      metadata: z.object({
        source: z.string(),
        confidence: z.number(),
      }),
    })

    const rawData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sourceId: '223e4567-e89b-12d3-a456-426614174000',
        targetId: '323e4567-e89b-12d3-a456-426614174000',
        type: 'CAUSES',
        strength: 0.85,
        metadata: {
          source: 'medical-literature',
          confidence: 0.9,
        },
      },
    ]

    const result = validateSqlResult(rawData, relationshipSchema, {
      query: 'SELECT * FROM ConceptRelationship',
      operation: 'findRelationships',
    })

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value[0]?.metadata.confidence).toBe(0.9)
    }
  })

  it('should handle search result validation', () => {
    const rawData = [
      {
        conceptId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Hypertension',
        similarity: 0.95,
        metadata: { source: 'embedding-search' },
      },
      {
        conceptId: '223e4567-e89b-12d3-a456-426614174000',
        name: 'High Blood Pressure',
        similarity: 0.87,
      },
    ]

    const result = validateSqlResult(rawData, searchResultSchema, {
      query: 'SELECT * FROM search_concepts(?)',
      operation: 'semanticSearch',
      metadata: { searchQuery: 'blood pressure' },
    })

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value).toHaveLength(2)
      expect(result.value[0]?.similarity).toBeGreaterThan(0.9)
    }
  })
})
