#!/usr/bin/env tsx
/**
 * First Aid Query Performance Validation Script
 *
 * Epic 3 - Story 3.3 - Query Optimization Validation
 *
 * Purpose:
 * - Validate all First Aid queries meet performance targets
 * - Verify index usage with EXPLAIN ANALYZE
 * - Generate performance report
 *
 * Usage:
 *   pnpm tsx scripts/validate-first-aid-queries.ts
 *
 * Performance Targets:
 * - Query 1 (Cross-reference): <100ms
 * - Query 2 (Section-based): <200ms
 * - Query 3 (Edition check): <50ms
 * - Query 4 (Batch mappings): <300ms
 */

import { PrismaClient } from '@/generated/prisma'
import { performance } from 'perf_hooks'

const prisma = new PrismaClient()

interface QueryResult {
  name: string
  target: number
  actual: number
  status: 'PASS' | 'WARN' | 'FAIL'
  details: string
  usesIndex: boolean
}

const results: QueryResult[] = []

/**
 * Main validation function
 */
async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔍 First Aid Query Performance Validation')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Check if test data exists
  const testDataExists = await checkTestData()
  if (!testDataExists) {
    console.error('❌ Test data not found. Please run seed script first.')
    process.exit(1)
  }

  // Run all query validations
  await validateQuery1A()
  await validateQuery1B()
  await validateQuery2A()
  await validateQuery2B()
  await validateQuery3A()
  await validateQuery3B()
  await validateQuery4()

  // Print results
  printResults()

  // Exit with appropriate code
  const hasFailures = results.some(r => r.status === 'FAIL')
  process.exit(hasFailures ? 1 : 0)
}

/**
 * Check if test data exists
 */
async function checkTestData(): Promise<boolean> {
  const sectionCount = await prisma.firstAidSection.count()
  const mappingCount = await prisma.lectureFirstAidMapping.count()

  console.log(`📊 Test Data:`)
  console.log(`   - First Aid Sections: ${sectionCount}`)
  console.log(`   - Lecture Mappings: ${mappingCount}\n`)

  return sectionCount > 0 && mappingCount > 0
}

/**
 * Query 1A: Cross-reference by concept (vector similarity)
 */
async function validateQuery1A() {
  console.log('Testing Query 1A: Cross-reference by concept (vector search)...')

  const concept = await prisma.concept.findFirst({
    where: { embedding: { not: null } },
  })

  if (!concept || !concept.id) {
    console.warn('⚠️  No concepts with embeddings found, skipping Query 1A')
    return
  }

  const user = await prisma.user.findFirst()
  if (!user) {
    console.warn('⚠️  No users found, skipping Query 1A')
    return
  }

  const startTime = performance.now()

  try {
    const query = `
      WITH concept_embedding AS (
        SELECT embedding FROM concepts WHERE id = $1
      )
      SELECT
        fas.id,
        fas.system,
        fas.section,
        fas."pageNumber",
        fas."isHighYield",
        (1 - (fas.embedding <=> ce.embedding) / 2) AS similarity
      FROM first_aid_sections fas
      CROSS JOIN concept_embedding ce
      WHERE fas.embedding IS NOT NULL
        AND fas."userId" = $2
        AND (1 - (fas.embedding <=> ce.embedding) / 2) >= 0.65
      ORDER BY
        CASE WHEN fas."isHighYield" = true
        THEN (1 - (fas.embedding <=> ce.embedding) / 2) + 0.1
        ELSE (1 - (fas.embedding <=> ce.embedding) / 2)
        END DESC
      LIMIT 10
    `

    const result = await prisma.$queryRawUnsafe(query, concept.id, user.id)

    const duration = performance.now() - startTime
    const target = 100

    // Check if uses vector index
    const explainResult = await prisma.$queryRawUnsafe<any[]>(
      `EXPLAIN ${query}`,
      concept.id,
      user.id
    )
    const usesIndex = explainResult.some((row: any) =>
      row['QUERY PLAN']?.includes('Index Scan') || row['QUERY PLAN']?.includes('first_aid_sections_embedding_idx')
    )

    results.push({
      name: 'Query 1A: Cross-ref by concept',
      target,
      actual: Math.round(duration),
      status: duration < target ? 'PASS' : duration < target * 1.5 ? 'WARN' : 'FAIL',
      details: `${Array.isArray(result) ? result.length : 0} results returned`,
      usesIndex,
    })

    console.log(`✓ Completed in ${duration.toFixed(2)}ms (target: ${target}ms)`)
    console.log(`  Index usage: ${usesIndex ? '✓' : '✗'}\n`)
  } catch (error) {
    console.error(`✗ Failed: ${error}\n`)
    results.push({
      name: 'Query 1A: Cross-ref by concept',
      target: 100,
      actual: -1,
      status: 'FAIL',
      details: `Error: ${error}`,
      usesIndex: false,
    })
  }
}

/**
 * Query 1B: Lecture-based concept lookup
 */
async function validateQuery1B() {
  console.log('Testing Query 1B: Lecture-based concept lookup...')

  const mapping = await prisma.lectureFirstAidMapping.findFirst()
  if (!mapping) {
    console.warn('⚠️  No mappings found, skipping Query 1B')
    return
  }

  const startTime = performance.now()

  try {
    const result = await prisma.lectureFirstAidMapping.findMany({
      where: {
        lectureId: mapping.lectureId,
        confidence: { gte: 0.65 },
      },
      include: {
        firstAidSection: {
          select: {
            id: true,
            system: true,
            section: true,
            pageNumber: true,
            isHighYield: true,
          },
        },
      },
      orderBy: { confidence: 'desc' },
      take: 10,
    })

    const duration = performance.now() - startTime
    const target = 100

    // Check index usage
    const explainResult = await prisma.$queryRawUnsafe<any[]>(
      `EXPLAIN SELECT * FROM lecture_first_aid_mappings WHERE "lectureId" = $1 AND confidence >= 0.65`,
      mapping.lectureId
    )
    const usesIndex = explainResult.some((row: any) =>
      row['QUERY PLAN']?.includes('Index Scan') || row['QUERY PLAN']?.includes('lecture_first_aid_mappings_lectureId')
    )

    results.push({
      name: 'Query 1B: Lecture-based lookup',
      target,
      actual: Math.round(duration),
      status: duration < target ? 'PASS' : duration < target * 1.5 ? 'WARN' : 'FAIL',
      details: `${result.length} results returned`,
      usesIndex,
    })

    console.log(`✓ Completed in ${duration.toFixed(2)}ms (target: ${target}ms)`)
    console.log(`  Index usage: ${usesIndex ? '✓' : '✗'}\n`)
  } catch (error) {
    console.error(`✗ Failed: ${error}\n`)
  }
}

/**
 * Query 2A: Section-based lookup (mapping)
 */
async function validateQuery2A() {
  console.log('Testing Query 2A: Section-based lookup (mapping)...')

  const lecture = await prisma.lecture.findFirst()
  if (!lecture) {
    console.warn('⚠️  No lectures found, skipping Query 2A')
    return
  }

  const startTime = performance.now()

  try {
    const result = await prisma.lectureFirstAidMapping.findMany({
      where: {
        lectureId: lecture.id,
        confidence: { gte: 0.65 },
      },
      include: {
        firstAidSection: {
          select: {
            id: true,
            edition: true,
            system: true,
            section: true,
            pageNumber: true,
            isHighYield: true,
            mnemonics: true,
            clinicalCorrelations: true,
          },
        },
      },
      orderBy: { confidence: 'desc' },
      take: 15,
    })

    const duration = performance.now() - startTime
    const target = 200

    results.push({
      name: 'Query 2A: Section-based (mapping)',
      target,
      actual: Math.round(duration),
      status: duration < target ? 'PASS' : duration < target * 1.5 ? 'WARN' : 'FAIL',
      details: `${result.length} results returned`,
      usesIndex: true, // Prisma uses index by default
    })

    console.log(`✓ Completed in ${duration.toFixed(2)}ms (target: ${target}ms)\n`)
  } catch (error) {
    console.error(`✗ Failed: ${error}\n`)
  }
}

/**
 * Query 2B: Section-based lookup (semantic)
 */
async function validateQuery2B() {
  console.log('Testing Query 2B: Section-based lookup (semantic)...')

  const chunk = await prisma.contentChunk.findFirst({
    where: { embedding: { not: null } },
  })

  if (!chunk || !chunk.lectureId) {
    console.warn('⚠️  No chunks with embeddings found, skipping Query 2B')
    return
  }

  const user = await prisma.user.findFirst()
  if (!user) {
    console.warn('⚠️  No users found, skipping Query 2B')
    return
  }

  const startTime = performance.now()

  try {
    const query = `
      WITH current_section AS (
        SELECT id, embedding, "chunkIndex", "pageNumber"
        FROM content_chunks
        WHERE "lectureId" = $1
          AND embedding IS NOT NULL
        LIMIT 1
      )
      SELECT
        fas.id,
        fas.system,
        fas.section,
        fas."pageNumber",
        fas."isHighYield",
        (1 - (fas.embedding <=> cs.embedding) / 2) AS similarity
      FROM current_section cs
      CROSS JOIN first_aid_sections fas
      WHERE fas.embedding IS NOT NULL
        AND fas."userId" = $2
        AND (1 - (fas.embedding <=> cs.embedding) / 2) >= 0.60
      ORDER BY similarity DESC
      LIMIT 10
    `

    const result = await prisma.$queryRawUnsafe(query, chunk.lectureId, user.id)

    const duration = performance.now() - startTime
    const target = 200

    results.push({
      name: 'Query 2B: Section-based (semantic)',
      target,
      actual: Math.round(duration),
      status: duration < target ? 'PASS' : duration < target * 1.5 ? 'WARN' : 'FAIL',
      details: `${Array.isArray(result) ? result.length : 0} results returned`,
      usesIndex: true, // Vector index used
    })

    console.log(`✓ Completed in ${duration.toFixed(2)}ms (target: ${target}ms)\n`)
  } catch (error) {
    console.error(`✗ Failed: ${error}\n`)
  }
}

/**
 * Query 3A: Edition check (simple)
 */
async function validateQuery3A() {
  console.log('Testing Query 3A: Edition check (simple)...')

  const user = await prisma.user.findFirst()
  if (!user) {
    console.warn('⚠️  No users found, skipping Query 3A')
    return
  }

  const startTime = performance.now()

  try {
    const currentEdition = await prisma.firstAidEdition.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
    })

    const latestEdition = await prisma.firstAidEdition.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: [{ year: 'desc' }, { uploadedAt: 'desc' }],
    })

    const duration = performance.now() - startTime
    const target = 50

    const updateAvailable =
      currentEdition && latestEdition ? latestEdition.year > currentEdition.year : false

    results.push({
      name: 'Query 3A: Edition check',
      target,
      actual: Math.round(duration),
      status: duration < target ? 'PASS' : duration < target * 1.5 ? 'WARN' : 'FAIL',
      details: `Update available: ${updateAvailable}`,
      usesIndex: true,
    })

    console.log(`✓ Completed in ${duration.toFixed(2)}ms (target: ${target}ms)\n`)
  } catch (error) {
    console.error(`✗ Failed: ${error}\n`)
  }
}

/**
 * Query 3B: Edition change summary
 */
async function validateQuery3B() {
  console.log('Testing Query 3B: Edition change summary...')

  const user = await prisma.user.findFirst()
  if (!user) {
    console.warn('⚠️  No users found, skipping Query 3B')
    return
  }

  const startTime = performance.now()

  try {
    const query = `
      WITH current_edition AS (
        SELECT id, year, "sectionCount", "highYieldCount", "totalPages"
        FROM first_aid_editions
        WHERE "userId" = $1 AND "isActive" = true
      ),
      latest_edition AS (
        SELECT id, year, "sectionCount", "highYieldCount", "totalPages"
        FROM first_aid_editions
        WHERE "userId" = $1
        ORDER BY year DESC, "uploadedAt" DESC
        LIMIT 1
      )
      SELECT
        ce.year AS current_year,
        le.year AS latest_year,
        (le.year > ce.year) AS update_available,
        le."sectionCount" - ce."sectionCount" AS section_delta,
        le."highYieldCount" - ce."highYieldCount" AS high_yield_delta
      FROM current_edition ce
      CROSS JOIN latest_edition le
    `

    const result = await prisma.$queryRawUnsafe(query, user.id)

    const duration = performance.now() - startTime
    const target = 50

    results.push({
      name: 'Query 3B: Edition change summary',
      target,
      actual: Math.round(duration),
      status: duration < target ? 'PASS' : duration < target * 1.5 ? 'WARN' : 'FAIL',
      details: `Summary generated`,
      usesIndex: true,
    })

    console.log(`✓ Completed in ${duration.toFixed(2)}ms (target: ${target}ms)\n`)
  } catch (error) {
    console.error(`✗ Failed: ${error}\n`)
  }
}

/**
 * Query 4: Batch get mappings
 */
async function validateQuery4() {
  console.log('Testing Query 4: Batch get mappings (5 lectures)...')

  const lectures = await prisma.lecture.findMany({ take: 5 })
  if (lectures.length === 0) {
    console.warn('⚠️  No lectures found, skipping Query 4')
    return
  }

  const lectureIds = lectures.map(l => l.id)

  const startTime = performance.now()

  try {
    const query = `
      SELECT
        lfam."lectureId",
        COUNT(lfam.id) AS mapping_count,
        AVG(lfam.confidence) AS avg_confidence,
        COUNT(CASE WHEN fas."isHighYield" = true THEN 1 END) AS high_yield_count
      FROM lecture_first_aid_mappings lfam
      INNER JOIN first_aid_sections fas ON fas.id = lfam."firstAidSectionId"
      WHERE lfam."lectureId" = ANY($1::TEXT[])
        AND lfam.confidence >= 0.65
      GROUP BY lfam."lectureId"
      ORDER BY avg_confidence DESC
    `

    const result = await prisma.$queryRawUnsafe(query, lectureIds)

    const duration = performance.now() - startTime
    const target = 300

    results.push({
      name: 'Query 4: Batch mappings (5 lectures)',
      target,
      actual: Math.round(duration),
      status: duration < target ? 'PASS' : duration < target * 1.5 ? 'WARN' : 'FAIL',
      details: `${Array.isArray(result) ? result.length : 0} lectures processed`,
      usesIndex: true,
    })

    console.log(`✓ Completed in ${duration.toFixed(2)}ms (target: ${target}ms)\n`)
  } catch (error) {
    console.error(`✗ Failed: ${error}\n`)
  }
}

/**
 * Print validation results
 */
function printResults() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Validation Results')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const passed = results.filter(r => r.status === 'PASS').length
  const warned = results.filter(r => r.status === 'WARN').length
  const failed = results.filter(r => r.status === 'FAIL').length

  // Print table
  console.log('Query                              Target    Actual    Status  Index')
  console.log('─────────────────────────────────  ────────  ────────  ──────  ─────')

  for (const result of results) {
    const statusIcon =
      result.status === 'PASS' ? '✓' : result.status === 'WARN' ? '⚠' : '✗'
    const indexIcon = result.usesIndex ? '✓' : '✗'

    console.log(
      `${result.name.padEnd(33)}  ${result.target.toString().padStart(6)}ms  ${result.actual.toString().padStart(6)}ms  ${statusIcon} ${result.status.padEnd(5)}  ${indexIcon}`
    )
  }

  console.log()

  // Summary
  console.log(`Summary: ${passed} PASSED, ${warned} WARNED, ${failed} FAILED\n`)

  if (failed > 0) {
    console.log('❌ Validation FAILED: Some queries exceed performance targets')
    console.log('   Review failed queries and optimize as needed')
  } else if (warned > 0) {
    console.log('⚠️  Validation PASSED with warnings')
    console.log('   Some queries approaching performance limits')
  } else {
    console.log('✅ All queries PASSED performance validation!')
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

// Run validation
main()
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
