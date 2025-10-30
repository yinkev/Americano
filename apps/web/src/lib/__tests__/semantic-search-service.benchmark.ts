/**
 * Performance Benchmarks for SemanticSearchService
 *
 * Epic 3 - Story 3.1 - Task 3: Semantic Search Engine Performance Tests
 *
 * Benchmarks:
 * - Search latency under various conditions
 * - Throughput (searches per second)
 * - Concurrent request handling
 * - Scaling with dataset size
 *
 * Performance Targets (from Story 3.1):
 * - Total search latency: <1 second
 * - Embedding generation: <300ms
 * - Vector similarity search: <100ms
 * - Result formatting: <100ms
 *
 * Run with: npm run benchmark
 */

import { embeddingService } from '../embedding-service'
import { SemanticSearchService } from '../semantic-search-service'

interface BenchmarkResult {
  testName: string
  avgTime: number
  minTime: number
  maxTime: number
  medianTime: number
  p95Time: number
  p99Time: number
  totalRuns: number
  successRate: number
}

interface PerformanceMetrics {
  embeddingTime: number
  vectorSearchTime: number
  resultFormattingTime: number
  totalTime: number
}

class SemanticSearchBenchmark {
  private searchService: SemanticSearchService
  private results: BenchmarkResult[] = []

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL required for benchmarks')
    }
    this.searchService = new SemanticSearchService()
  }

  /**
   * Run all benchmarks
   */
  async runAll(): Promise<void> {
    console.log('='.repeat(80))
    console.log('SEMANTIC SEARCH ENGINE PERFORMANCE BENCHMARKS')
    console.log('='.repeat(80))
    console.log()

    await this.benchmarkBasicSearch()
    await this.benchmarkHybridSearch()
    await this.benchmarkPaginatedSearch()
    await this.benchmarkFilteredSearch()
    await this.benchmarkConcurrentSearches()
    await this.benchmarkComplexQueries()
    await this.benchmarkEmbeddingGeneration()

    this.printSummary()
  }

  /**
   * Benchmark: Basic semantic search
   */
  async benchmarkBasicSearch(): Promise<void> {
    console.log('Benchmark: Basic Semantic Search')
    console.log('-'.repeat(80))

    const queries = [
      'cardiac conduction system',
      'heart anatomy',
      'blood flow',
      'myocardial function',
      'electrical signals',
    ]

    const times: number[] = []
    let successCount = 0

    for (let i = 0; i < 20; i++) {
      const query = queries[i % queries.length]
      const startTime = performance.now()

      try {
        await this.searchService.search({
          query,
          limit: 10,
          includeKeywordBoost: false,
        })

        const endTime = performance.now()
        times.push(endTime - startTime)
        successCount++
      } catch (error) {
        console.error(`Search failed: ${error}`)
      }
    }

    const result = this.calculateStatistics('Basic Search', times, 20)
    this.results.push(result)
    this.printResult(result)

    // Verify performance target
    if (result.avgTime < 1000) {
      console.log('✓ PASSED: Average search time < 1000ms target')
    } else {
      console.log('✗ FAILED: Average search time exceeds 1000ms target')
    }

    console.log()
  }

  /**
   * Benchmark: Hybrid search (vector + keyword)
   */
  async benchmarkHybridSearch(): Promise<void> {
    console.log('Benchmark: Hybrid Search (Vector + Keyword)')
    console.log('-'.repeat(80))

    const queries = [
      'How does the heart pump blood?',
      'What is the function of SA node?',
      'Explain cardiac conduction pathway',
      'Blood supply to heart muscle',
      'Electrical system of the heart',
    ]

    const times: number[] = []

    for (let i = 0; i < 20; i++) {
      const query = queries[i % queries.length]
      const startTime = performance.now()

      try {
        await this.searchService.search({
          query,
          limit: 10,
          includeKeywordBoost: true,
          vectorWeight: 0.7,
        })

        const endTime = performance.now()
        times.push(endTime - startTime)
      } catch (error) {
        console.error(`Hybrid search failed: ${error}`)
      }
    }

    const result = this.calculateStatistics('Hybrid Search', times, 20)
    this.results.push(result)
    this.printResult(result)

    // Hybrid search should still meet target
    if (result.avgTime < 1000) {
      console.log('✓ PASSED: Hybrid search within 1000ms target')
    } else {
      console.log('✗ WARNING: Hybrid search exceeds target')
    }

    console.log()
  }

  /**
   * Benchmark: Paginated searches
   */
  async benchmarkPaginatedSearch(): Promise<void> {
    console.log('Benchmark: Paginated Search')
    console.log('-'.repeat(80))

    const times: number[] = []

    // Test different page sizes
    const limits = [10, 25, 50]

    for (const limit of limits) {
      for (let page = 0; page < 3; page++) {
        const startTime = performance.now()

        try {
          await this.searchService.search({
            query: 'cardiac anatomy',
            limit,
            offset: page * limit,
          })

          const endTime = performance.now()
          times.push(endTime - startTime)
        } catch (error) {
          console.error(`Paginated search failed: ${error}`)
        }
      }
    }

    const result = this.calculateStatistics('Paginated Search', times, times.length)
    this.results.push(result)
    this.printResult(result)

    console.log()
  }

  /**
   * Benchmark: Filtered searches
   */
  async benchmarkFilteredSearch(): Promise<void> {
    console.log('Benchmark: Filtered Search')
    console.log('-'.repeat(80))

    const times: number[] = []

    for (let i = 0; i < 15; i++) {
      const startTime = performance.now()

      try {
        await this.searchService.search({
          query: 'heart function',
          limit: 10,
          filters: {
            minSimilarity: 0.7,
            contentTypes: ['chunk'],
          },
        })

        const endTime = performance.now()
        times.push(endTime - startTime)
      } catch (error) {
        console.error(`Filtered search failed: ${error}`)
      }
    }

    const result = this.calculateStatistics('Filtered Search', times, 15)
    this.results.push(result)
    this.printResult(result)

    console.log()
  }

  /**
   * Benchmark: Concurrent searches
   */
  async benchmarkConcurrentSearches(): Promise<void> {
    console.log('Benchmark: Concurrent Searches')
    console.log('-'.repeat(80))

    const queries = [
      'cardiac conduction',
      'blood flow heart',
      'coronary arteries',
      'SA node pacemaker',
      'ventricular contraction',
      'atrial function',
      'heart anatomy',
      'myocardial perfusion',
      'electrical impulses',
      'cardiac output',
    ]

    // Test with 5, 10, and 20 concurrent searches
    const concurrencyLevels = [5, 10, 20]

    for (const concurrency of concurrencyLevels) {
      console.log(`Testing ${concurrency} concurrent searches...`)

      const times: number[] = []

      for (let batch = 0; batch < 3; batch++) {
        const batchQueries = queries.slice(0, concurrency)
        const startTime = performance.now()

        try {
          await Promise.all(
            batchQueries.map((query) => this.searchService.search({ query, limit: 10 })),
          )

          const endTime = performance.now()
          const avgTimePerSearch = (endTime - startTime) / concurrency
          times.push(avgTimePerSearch)
        } catch (error) {
          console.error(`Concurrent search failed: ${error}`)
        }
      }

      const result = this.calculateStatistics(
        `Concurrent Search (${concurrency} parallel)`,
        times,
        times.length,
      )
      this.results.push(result)
      this.printResult(result)
    }

    console.log()
  }

  /**
   * Benchmark: Complex queries
   */
  async benchmarkComplexQueries(): Promise<void> {
    console.log('Benchmark: Complex Queries')
    console.log('-'.repeat(80))

    const complexQueries = [
      'Explain the complete pathway of electrical conduction through the heart from SA node to Purkinje fibers',
      'How does blood flow through all four chambers of the heart and what valves are involved in each step?',
      'Describe the relationship between coronary artery anatomy and myocardial blood supply including perfusion territories',
      'What are the mechanisms of cardiac automaticity and how do specialized conduction cells generate rhythmic electrical activity?',
    ]

    const times: number[] = []

    for (let i = 0; i < 12; i++) {
      const query = complexQueries[i % complexQueries.length]
      const startTime = performance.now()

      try {
        await this.searchService.search({
          query,
          limit: 20,
          includeKeywordBoost: true,
        })

        const endTime = performance.now()
        times.push(endTime - startTime)
      } catch (error) {
        console.error(`Complex query failed: ${error}`)
      }
    }

    const result = this.calculateStatistics('Complex Queries', times, 12)
    this.results.push(result)
    this.printResult(result)

    console.log()
  }

  /**
   * Benchmark: Embedding generation
   */
  async benchmarkEmbeddingGeneration(): Promise<void> {
    console.log('Benchmark: Embedding Generation')
    console.log('-'.repeat(80))

    const queries = [
      'short query',
      'This is a medium length query with more words',
      'This is a longer query that contains significantly more text and medical terminology including cardiac conduction system anatomical structures',
    ]

    const times: number[] = []

    for (let i = 0; i < 15; i++) {
      const query = queries[i % queries.length]
      const startTime = performance.now()

      try {
        await embeddingService.generateEmbedding(query)

        const endTime = performance.now()
        times.push(endTime - startTime)
      } catch (error) {
        console.error(`Embedding generation failed: ${error}`)
      }
    }

    const result = this.calculateStatistics('Embedding Generation', times, 15)
    this.results.push(result)
    this.printResult(result)

    // Verify embedding performance target
    if (result.avgTime < 300) {
      console.log('✓ PASSED: Embedding generation < 300ms target')
    } else {
      console.log('✗ WARNING: Embedding generation exceeds 300ms target')
    }

    console.log()
  }

  /**
   * Calculate statistics from timing data
   */
  private calculateStatistics(
    testName: string,
    times: number[],
    totalRuns: number,
  ): BenchmarkResult {
    if (times.length === 0) {
      return {
        testName,
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        medianTime: 0,
        p95Time: 0,
        p99Time: 0,
        totalRuns,
        successRate: 0,
      }
    }

    const sorted = [...times].sort((a, b) => a - b)
    const sum = times.reduce((acc, t) => acc + t, 0)

    const p95Index = Math.floor(sorted.length * 0.95)
    const p99Index = Math.floor(sorted.length * 0.99)

    return {
      testName,
      avgTime: sum / times.length,
      minTime: sorted[0],
      maxTime: sorted[sorted.length - 1],
      medianTime: sorted[Math.floor(sorted.length / 2)],
      p95Time: sorted[p95Index],
      p99Time: sorted[p99Index],
      totalRuns,
      successRate: (times.length / totalRuns) * 100,
    }
  }

  /**
   * Print benchmark result
   */
  private printResult(result: BenchmarkResult): void {
    console.log(`Test: ${result.testName}`)
    console.log(`  Runs:        ${result.totalRuns}`)
    console.log(`  Success:     ${result.successRate.toFixed(1)}%`)
    console.log(`  Avg:         ${result.avgTime.toFixed(2)}ms`)
    console.log(`  Min:         ${result.minTime.toFixed(2)}ms`)
    console.log(`  Max:         ${result.maxTime.toFixed(2)}ms`)
    console.log(`  Median:      ${result.medianTime.toFixed(2)}ms`)
    console.log(`  P95:         ${result.p95Time.toFixed(2)}ms`)
    console.log(`  P99:         ${result.p99Time.toFixed(2)}ms`)
  }

  /**
   * Print summary of all benchmarks
   */
  private printSummary(): void {
    console.log('='.repeat(80))
    console.log('BENCHMARK SUMMARY')
    console.log('='.repeat(80))
    console.log()

    console.log('Performance Targets:')
    console.log('  - Total search latency: <1000ms')
    console.log('  - Embedding generation: <300ms')
    console.log('  - Vector search: <100ms')
    console.log('  - Result formatting: <100ms')
    console.log()

    console.log('Results:')
    console.log()

    const basicSearch = this.results.find((r) => r.testName === 'Basic Search')
    const hybridSearch = this.results.find((r) => r.testName === 'Hybrid Search')
    const embeddingGen = this.results.find((r) => r.testName === 'Embedding Generation')

    if (basicSearch) {
      const status = basicSearch.avgTime < 1000 ? '✓ PASS' : '✗ FAIL'
      console.log(`Basic Search:          ${basicSearch.avgTime.toFixed(2)}ms ${status}`)
    }

    if (hybridSearch) {
      const status = hybridSearch.avgTime < 1000 ? '✓ PASS' : '✗ FAIL'
      console.log(`Hybrid Search:         ${hybridSearch.avgTime.toFixed(2)}ms ${status}`)
    }

    if (embeddingGen) {
      const status = embeddingGen.avgTime < 300 ? '✓ PASS' : '⚠ WARN'
      console.log(`Embedding Generation:  ${embeddingGen.avgTime.toFixed(2)}ms ${status}`)
    }

    console.log()

    // Overall assessment
    const allPass =
      (basicSearch?.avgTime ?? 0) < 1000 &&
      (hybridSearch?.avgTime ?? 0) < 1000 &&
      (embeddingGen?.avgTime ?? 0) < 300

    if (allPass) {
      console.log('✓ ALL PERFORMANCE TARGETS MET')
    } else {
      console.log('⚠ SOME PERFORMANCE TARGETS NOT MET')
      console.log('  Consider optimization:')
      console.log('  - Adjust pgvector index parameters')
      console.log('  - Implement query embedding caching')
      console.log('  - Optimize database connection pooling')
    }

    console.log()
    console.log('='.repeat(80))
  }
}

/**
 * Run benchmarks
 */
async function main() {
  try {
    const benchmark = new SemanticSearchBenchmark()
    await benchmark.runAll()
  } catch (error) {
    console.error('Benchmark failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { SemanticSearchBenchmark }
export type { BenchmarkResult, PerformanceMetrics }
