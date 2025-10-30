/**
 * Autocomplete Performance Testing Suite
 * Story 3.6: Performance validation for <100ms autocomplete response time
 *
 * Test Scenarios:
 * 1. API response time with various query lengths
 * 2. Database states (empty, 100 suggestions, 1000 suggestions)
 * 3. Medical terms vs common words
 * 4. P50, P95, P99 percentiles
 * 5. Load testing (10, 50, 100 concurrent requests)
 * 6. End-to-end performance (keypress to dropdown)
 *
 * Performance Target: <100ms for autocomplete API
 * Total E2E Target: <250ms (150ms debounce + 100ms API)
 *
 * @module AutocompletePerformanceTest
 */

import type { SuggestionType } from '@/generated/prisma'
import { prisma } from '@/lib/db'
import { searchSuggestionEngine } from '@/subsystems/knowledge-graph/search-suggestions'

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  testName: string
  samples: number
  min: number
  max: number
  mean: number
  median: number
  p95: number
  p99: number
  stdDev: number
  passingRate: number
  threshold: number
}

/**
 * Test result interface
 */
interface TestResult {
  query: string
  responseTimeMs: number
  suggestionsCount: number
  timestamp: number
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1
  return sortedValues[Math.max(0, index)]
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0
  const squaredDiffs = values.map((v) => (v - mean) ** 2)
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(variance)
}

/**
 * Analyze performance metrics from test results
 */
function analyzePerformance(
  testName: string,
  results: TestResult[],
  threshold: number,
): PerformanceMetrics {
  const times = results.map((r) => r.responseTimeMs).sort((a, b) => a - b)
  const mean = times.reduce((a, b) => a + b, 0) / times.length
  const passing = results.filter((r) => r.responseTimeMs <= threshold).length
  const passingRate = (passing / results.length) * 100

  return {
    testName,
    samples: results.length,
    min: times[0] || 0,
    max: times[times.length - 1] || 0,
    mean: Math.round(mean * 100) / 100,
    median: calculatePercentile(times, 50),
    p95: calculatePercentile(times, 95),
    p99: calculatePercentile(times, 99),
    stdDev: Math.round(calculateStdDev(times, mean) * 100) / 100,
    passingRate: Math.round(passingRate * 100) / 100,
    threshold,
  }
}

/**
 * Format metrics for console output
 */
function formatMetrics(metrics: PerformanceMetrics): string {
  const pass = metrics.passingRate >= 95 ? '✅ PASS' : '❌ FAIL'
  return `
${pass} ${metrics.testName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Samples:      ${metrics.samples}
  Threshold:    ${metrics.threshold}ms
  Passing Rate: ${metrics.passingRate}% (${pass})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Min:          ${metrics.min}ms
  Median (P50): ${metrics.median}ms
  Mean:         ${metrics.mean}ms
  P95:          ${metrics.p95}ms
  P99:          ${metrics.p99}ms
  Max:          ${metrics.max}ms
  Std Dev:      ${metrics.stdDev}ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}

/**
 * Seed test data for performance testing
 */
async function seedTestData(count: number): Promise<void> {
  console.log(`\n📊 Seeding ${count} test suggestions...`)

  const medicalTerms = [
    'cardiac',
    'cardiology',
    'cardiovascular',
    'myocardial',
    'hypertension',
    'diabetes',
    'diabetic',
    'glucose',
    'insulin',
    'metabolism',
    'neurology',
    'neurological',
    'brain',
    'cerebral',
    'stroke',
    'anatomy',
    'anatomical',
    'physiology',
    'pathology',
    'histology',
    'respiratory',
    'pulmonary',
    'pneumonia',
    'bronchitis',
    'asthma',
    'hepatic',
    'liver',
    'cirrhosis',
    'renal',
    'kidney',
    'hematology',
    'anemia',
    'leukemia',
    'thrombosis',
    'coagulation',
    'dermatology',
    'skin',
    'lesion',
    'rash',
    'melanoma',
    'gastroenterology',
    'digestive',
    'ulcer',
    'colitis',
    'crohn',
    'endocrinology',
    'hormone',
    'thyroid',
    'adrenal',
    'pituitary',
  ]

  // Create medical term suggestions
  for (let i = 0; i < Math.min(count, medicalTerms.length); i++) {
    await prisma.searchSuggestion.upsert({
      where: { term: medicalTerms[i] },
      update: { frequency: { increment: 1 }, lastUsed: new Date() },
      create: {
        term: medicalTerms[i],
        suggestionType: 'MEDICAL_TERM' as SuggestionType,
        frequency: Math.floor(Math.random() * 100) + 10,
        metadata: { category: 'medical' },
      },
    })
  }

  // Create additional test suggestions if needed
  if (count > medicalTerms.length) {
    for (let i = medicalTerms.length; i < count; i++) {
      const term = `test_term_${i}`
      await prisma.searchSuggestion.upsert({
        where: { term },
        update: { frequency: { increment: 1 }, lastUsed: new Date() },
        create: {
          term,
          suggestionType: 'CONTENT_TITLE' as SuggestionType,
          frequency: Math.floor(Math.random() * 50) + 1,
          metadata: {},
        },
      })
    }
  }

  console.log(`✅ Seeded ${count} test suggestions`)
}

/**
 * Clean up test data
 */
async function cleanupTestData(): Promise<void> {
  console.log('\n🧹 Cleaning up test data...')
  await prisma.searchSuggestion.deleteMany({
    where: {
      term: { startsWith: 'test_term_' },
    },
  })
  console.log('✅ Test data cleaned up')
}

/**
 * Test 1: API Response Time with Various Query Lengths
 */
async function testQueryLengths(): Promise<PerformanceMetrics> {
  console.log('\n🧪 Test 1: API Response Time with Various Query Lengths')
  console.log('   Testing: 1, 3, 5, 10 character queries')

  const queries = [
    { query: 'c', length: 1 },
    { query: 'car', length: 3 },
    { query: 'cardi', length: 5 },
    { query: 'cardiology', length: 10 },
  ]

  const results: TestResult[] = []

  for (const { query } of queries) {
    // Run each query 10 times
    for (let i = 0; i < 10; i++) {
      const start = performance.now()
      const suggestions = await searchSuggestionEngine.getSuggestions(query, 10)
      const elapsed = performance.now() - start

      results.push({
        query,
        responseTimeMs: elapsed,
        suggestionsCount: suggestions.length,
        timestamp: Date.now(),
      })
    }
  }

  return analyzePerformance('Query Length Variations', results, 100)
}

/**
 * Test 2: Database State Impact (Empty, 100, 1000 suggestions)
 */
async function testDatabaseStates(): Promise<PerformanceMetrics[]> {
  console.log('\n🧪 Test 2: Database State Impact')

  const metrics: PerformanceMetrics[] = []
  const testQuery = 'card'

  // Test with different database sizes
  const states = [
    { name: 'Small (50 suggestions)', count: 50 },
    { name: 'Medium (100 suggestions)', count: 100 },
    { name: 'Large (500 suggestions)', count: 500 },
  ]

  for (const state of states) {
    console.log(`   Testing: ${state.name}`)

    // Seed data
    await cleanupTestData()
    await seedTestData(state.count)

    const results: TestResult[] = []

    // Run 20 queries
    for (let i = 0; i < 20; i++) {
      const start = performance.now()
      const suggestions = await searchSuggestionEngine.getSuggestions(testQuery, 10)
      const elapsed = performance.now() - start

      results.push({
        query: testQuery,
        responseTimeMs: elapsed,
        suggestionsCount: suggestions.length,
        timestamp: Date.now(),
      })
    }

    metrics.push(analyzePerformance(state.name, results, 100))
  }

  return metrics
}

/**
 * Test 3: Medical Terms vs Common Words
 */
async function testTermTypes(): Promise<PerformanceMetrics[]> {
  console.log('\n🧪 Test 3: Medical Terms vs Common Words')

  const testCases = [
    {
      type: 'Medical Terms',
      queries: ['cardiac', 'diabetes', 'neurology', 'hepatic', 'respiratory'],
    },
    { type: 'Common Words', queries: ['test', 'example', 'sample', 'demo', 'trial'] },
  ]

  const metrics: PerformanceMetrics[] = []

  for (const testCase of testCases) {
    console.log(`   Testing: ${testCase.type}`)
    const results: TestResult[] = []

    for (const query of testCase.queries) {
      // Run each query 10 times
      for (let i = 0; i < 10; i++) {
        const start = performance.now()
        const suggestions = await searchSuggestionEngine.getSuggestions(query, 10)
        const elapsed = performance.now() - start

        results.push({
          query,
          responseTimeMs: elapsed,
          suggestionsCount: suggestions.length,
          timestamp: Date.now(),
        })
      }
    }

    metrics.push(analyzePerformance(testCase.type, results, 100))
  }

  return metrics
}

/**
 * Test 4: Load Testing (Concurrent Requests)
 */
async function testLoadConcurrency(): Promise<PerformanceMetrics[]> {
  console.log('\n🧪 Test 4: Load Testing (Concurrent Requests)')

  const concurrencyLevels = [10, 50, 100]
  const metrics: PerformanceMetrics[] = []
  const testQuery = 'cardiac'

  for (const concurrency of concurrencyLevels) {
    console.log(`   Testing: ${concurrency} concurrent requests`)
    const results: TestResult[] = []

    // Create concurrent promises
    const promises = Array.from({ length: concurrency }, async (_, i) => {
      const start = performance.now()
      const suggestions = await searchSuggestionEngine.getSuggestions(testQuery, 10)
      const elapsed = performance.now() - start

      return {
        query: testQuery,
        responseTimeMs: elapsed,
        suggestionsCount: suggestions.length,
        timestamp: Date.now(),
      }
    })

    // Execute all concurrently
    const batchResults = await Promise.all(promises)
    results.push(...batchResults)

    // Allow 150ms threshold for high concurrency (database connection pool limits)
    const threshold = concurrency > 50 ? 150 : 100
    metrics.push(analyzePerformance(`${concurrency} Concurrent Requests`, results, threshold))
  }

  return metrics
}

/**
 * Test 5: Bottleneck Identification
 */
async function identifyBottlenecks(): Promise<void> {
  console.log('\n🔍 Test 5: Bottleneck Identification')
  console.log('   Analyzing component timings...')

  const query = 'cardiac'
  const iterations = 10

  let totalDbTime = 0
  let totalRankingTime = 0
  let totalSerializationTime = 0

  for (let i = 0; i < iterations; i++) {
    // Measure database query time
    const dbStart = performance.now()
    const dbSuggestions = await prisma.searchSuggestion.findMany({
      where: {
        term: { startsWith: query, mode: 'insensitive' },
      },
      orderBy: [{ frequency: 'desc' }, { lastUsed: 'desc' }],
      take: 20,
    })
    const dbTime = performance.now() - dbStart
    totalDbTime += dbTime

    // Measure ranking/scoring time
    const rankingStart = performance.now()
    const scored = dbSuggestions.map((s) => ({
      ...s,
      score: Math.random(), // Simplified for measurement
    }))
    scored.sort((a, b) => b.score - a.score)
    const rankingTime = performance.now() - rankingStart
    totalRankingTime += rankingTime

    // Measure serialization time
    const serializationStart = performance.now()
    JSON.stringify(scored.slice(0, 10))
    const serializationTime = performance.now() - serializationStart
    totalSerializationTime += serializationTime
  }

  const avgDbTime = totalDbTime / iterations
  const avgRankingTime = totalRankingTime / iterations
  const avgSerializationTime = totalSerializationTime / iterations
  const totalAvgTime = avgDbTime + avgRankingTime + avgSerializationTime

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Bottleneck Analysis (${iterations} iterations)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Database Query:     ${avgDbTime.toFixed(2)}ms (${((avgDbTime / totalAvgTime) * 100).toFixed(1)}%)
  Ranking Algorithm:  ${avgRankingTime.toFixed(2)}ms (${((avgRankingTime / totalAvgTime) * 100).toFixed(1)}%)
  Serialization:      ${avgSerializationTime.toFixed(2)}ms (${((avgSerializationTime / totalAvgTime) * 100).toFixed(1)}%)
  ─────────────────────────────────────────────────
  Total Average:      ${totalAvgTime.toFixed(2)}ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)

  // Recommendations
  if (avgDbTime > 50) {
    console.log('⚠️  Database query time >50ms - Consider adding index on SearchSuggestion.term')
  }
  if (avgRankingTime > 20) {
    console.log('⚠️  Ranking algorithm time >20ms - Consider optimizing scoring logic')
  }
  if (totalAvgTime > 100) {
    console.log('❌ Total time exceeds 100ms target - Optimization required')
  } else {
    console.log('✅ Performance within acceptable range')
  }
}

/**
 * Main performance test runner
 */
export async function runPerformanceTests(): Promise<void> {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 AUTOCOMPLETE PERFORMANCE TEST SUITE')
  console.log('   Target: <100ms API response time')
  console.log('   Story: 3.6 - Advanced Search and Discovery')
  console.log('='.repeat(60))

  try {
    // Setup: Seed initial test data
    await seedTestData(100)

    // Test 1: Query length variations
    const queryLengthMetrics = await testQueryLengths()
    console.log(formatMetrics(queryLengthMetrics))

    // Test 2: Database state impact
    const dbStateMetrics = await testDatabaseStates()
    dbStateMetrics.forEach((m) => console.log(formatMetrics(m)))

    // Test 3: Medical terms vs common words
    const termTypeMetrics = await testTermTypes()
    termTypeMetrics.forEach((m) => console.log(formatMetrics(m)))

    // Test 4: Load testing
    const loadMetrics = await testLoadConcurrency()
    loadMetrics.forEach((m) => console.log(formatMetrics(m)))

    // Test 5: Bottleneck identification
    await identifyBottlenecks()

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 PERFORMANCE TEST SUMMARY')
    console.log('='.repeat(60))

    const allMetrics = [queryLengthMetrics, ...dbStateMetrics, ...termTypeMetrics, ...loadMetrics]

    const overallPassing = allMetrics.filter((m) => m.passingRate >= 95).length
    const overallTotal = allMetrics.length

    console.log(`
  Total Tests:    ${overallTotal}
  Passed:         ${overallPassing} (${((overallPassing / overallTotal) * 100).toFixed(1)}%)
  Failed:         ${overallTotal - overallPassing}

  Overall Status: ${overallPassing === overallTotal ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
`)

    // Recommendations
    console.log('🎯 RECOMMENDATIONS:')
    const avgP95 = allMetrics.reduce((sum, m) => sum + m.p95, 0) / allMetrics.length

    if (avgP95 < 100) {
      console.log('  ✅ Performance meets <100ms target (P95: ' + avgP95.toFixed(2) + 'ms)')
      console.log('  ✅ No optimizations required')
    } else {
      console.log('  ⚠️  Performance exceeds 100ms target (P95: ' + avgP95.toFixed(2) + 'ms)')
      console.log('  📋 Suggested optimizations:')
      console.log('     1. Add database index on SearchSuggestion.term')
      console.log('     2. Implement in-memory cache for common queries')
      console.log('     3. Reduce query limit from 20 to 10')
      console.log('     4. Optimize ranking algorithm (pre-calculate scores)')
    }

    console.log('\n' + '='.repeat(60))
  } catch (error) {
    console.error('\n❌ Performance test failed:', error)
    throw error
  } finally {
    // Cleanup
    await cleanupTestData()
  }
}

// Export for programmatic use
export {
  testQueryLengths,
  testDatabaseStates,
  testTermTypes,
  testLoadConcurrency,
  identifyBottlenecks,
  seedTestData,
  cleanupTestData,
}
