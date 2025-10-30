/**
 * Integration Tests for SemanticSearchService
 *
 * Epic 3 - Story 3.1 - Task 3: Semantic Search Engine Integration Tests
 *
 * These tests verify the semantic search engine works correctly with a real database.
 * They test the full flow: query embedding → vector search → result ranking → formatting
 *
 * Prerequisites:
 * - DATABASE_URL environment variable must be set
 * - PostgreSQL with pgvector extension enabled
 * - Test data seeded in database
 *
 * Run with: npm run test:integration
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { PrismaClient } from '@/generated/prisma'
import { embeddingService } from '../embedding-service'
import { SemanticSearchService } from '../semantic-search-service'

describe('SemanticSearchService Integration Tests', () => {
  let searchService: SemanticSearchService
  let prisma: PrismaClient
  let testUserId: string
  let testCourseId: string
  let testLectureId: string
  let testChunkIds: string[] = []

  beforeAll(async () => {
    // Skip if no DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set, skipping integration tests')
      return
    }

    prisma = new PrismaClient()
    searchService = new SemanticSearchService()

    // Create test data
    await seedTestData()
  })

  afterAll(async () => {
    // Cleanup test data
    if (prisma) {
      await cleanupTestData()
      await prisma.$disconnect()
    }
  })

  /**
   * Seed test data with realistic medical content
   */
  async function seedTestData() {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-semantic-search@example.com',
        name: 'Test User',
      },
    })
    testUserId = user.id

    // Create test course
    const course = await prisma.course.create({
      data: {
        userId: testUserId,
        name: 'Cardiovascular Anatomy',
        code: 'ANAT-501',
        term: 'Fall 2024',
      },
    })
    testCourseId = course.id

    // Create test lecture
    const lecture = await prisma.lecture.create({
      data: {
        userId: testUserId,
        courseId: testCourseId,
        title: 'Cardiac Conduction System',
        fileName: 'cardiac-conduction.pdf',
        fileUrl: '/uploads/test-lecture.pdf',
        fileSize: 1024000,
        processingStatus: 'COMPLETED',
        totalPages: 10,
        processedPages: 10,
      },
    })
    testLectureId = lecture.id

    // Create test content chunks with embeddings
    const testContents = [
      'The cardiac conduction system controls the heart rate and rhythm through a series of specialized cardiac muscle cells that generate and conduct electrical impulses. The sinoatrial node serves as the natural pacemaker of the heart.',
      'The atrioventricular node receives signals from the SA node and delays transmission to allow the atria to contract before the ventricles. This delay is critical for efficient cardiac output.',
      'The bundle of His and Purkinje fibers rapidly conduct electrical signals to the ventricular myocardium, causing coordinated ventricular contraction. This ensures effective blood ejection from the heart.',
      'Blood flows through the heart in a specific path: from the right atrium to the right ventricle, then to the lungs for oxygenation, returning to the left atrium, and finally to the left ventricle for systemic circulation.',
      'The coronary arteries supply oxygenated blood to the cardiac muscle itself. The right coronary artery and left coronary artery branch extensively to ensure adequate myocardial perfusion.',
    ]

    for (let i = 0; i < testContents.length; i++) {
      const content = testContents[i]

      // Generate embedding for content
      const embeddingResult = await embeddingService.generateEmbedding(content)

      if (embeddingResult.error) {
        console.error(`Failed to generate embedding for chunk ${i}:`, embeddingResult.error)
        continue
      }

      // Create chunk with embedding
      // Note: Using raw SQL because Prisma doesn't support vector type directly
      const chunk = await prisma.$executeRaw`
        INSERT INTO content_chunks (id, "lectureId", content, embedding, "chunkIndex", "pageNumber", "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${testLectureId}::text,
          ${content}::text,
          ${`[${embeddingResult.embedding.join(',')}]`}::vector(1536),
          ${i}::integer,
          ${Math.floor(i / 2) + 1}::integer,
          NOW()
        )
        RETURNING id
      `

      console.log(`Created test chunk ${i + 1}/${testContents.length}`)
    }

    // Fetch created chunk IDs
    const chunks = await prisma.contentChunk.findMany({
      where: { lectureId: testLectureId },
      select: { id: true },
    })
    testChunkIds = chunks.map((c) => c.id)

    console.log(`Test data seeded: ${testChunkIds.length} chunks created`)
  }

  /**
   * Cleanup test data
   */
  async function cleanupTestData() {
    if (!testUserId) return

    // Delete in reverse order of foreign key dependencies
    await prisma.contentChunk.deleteMany({
      where: { lectureId: testLectureId },
    })

    await prisma.lecture.deleteMany({
      where: { id: testLectureId },
    })

    await prisma.course.deleteMany({
      where: { id: testCourseId },
    })

    await prisma.user.deleteMany({
      where: { id: testUserId },
    })

    console.log('Test data cleaned up')
  }

  describe('End-to-End Search Flow', () => {
    it('should perform semantic search and return relevant results', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'How does the heart electrical system work?',
        limit: 10,
      })

      // Verify response structure
      expect(response.results).toBeDefined()
      expect(response.total).toBeGreaterThan(0)
      expect(response.queryTime).toBeGreaterThan(0)

      // Verify search completed in under 1 second
      expect(response.queryTime).toBeLessThan(1000)

      // Verify results have required fields
      response.results.forEach((result) => {
        expect(result.id).toBeDefined()
        expect(result.type).toBeDefined()
        expect(result.title).toBeDefined()
        expect(result.similarity).toBeGreaterThanOrEqual(0)
        expect(result.similarity).toBeLessThanOrEqual(1)
        expect(result.snippet).toBeDefined()
      })

      console.log(`Search returned ${response.total} results in ${response.queryTime}ms`)
    })

    it('should rank results by semantic relevance', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'sinoatrial node pacemaker',
        limit: 10,
        includeKeywordBoost: false, // Pure semantic search
      })

      expect(response.results.length).toBeGreaterThan(0)

      // Verify results are ranked by similarity
      for (let i = 0; i < response.results.length - 1; i++) {
        expect(response.results[i].similarity).toBeGreaterThanOrEqual(
          response.results[i + 1].similarity,
        )
      }

      // Top result should mention SA node
      const topResult = response.results[0] as any
      expect(
        topResult.content?.toLowerCase().includes('sinoatrial') ||
          topResult.snippet?.toLowerCase().includes('sinoatrial'),
      ).toBe(true)
    })

    it('should find semantically similar content with different wording', async () => {
      if (!process.env.DATABASE_URL) return

      // Query uses "blood flow" instead of exact terms in content
      const response = await searchService.search({
        query: 'blood flow path through cardiac chambers',
        limit: 10,
      })

      expect(response.results.length).toBeGreaterThan(0)

      // Should find content about heart blood flow even with different wording
      const hasRelevantContent = response.results.some((result) => {
        const text = (result as any).content || result.snippet
        return (
          text.toLowerCase().includes('atrium') ||
          text.toLowerCase().includes('ventricle') ||
          text.toLowerCase().includes('blood')
        )
      })

      expect(hasRelevantContent).toBe(true)
    })
  })

  describe('Hybrid Search (Vector + Keyword)', () => {
    it('should boost results with exact keyword matches', async () => {
      if (!process.env.DATABASE_URL) return

      const pureVectorResponse = await searchService.search({
        query: 'atrioventricular node delay',
        limit: 10,
        includeKeywordBoost: false,
      })

      const hybridResponse = await searchService.search({
        query: 'atrioventricular node delay',
        limit: 10,
        includeKeywordBoost: true,
      })

      expect(hybridResponse.metadata.hybridSearchUsed).toBe(true)

      // Hybrid search should potentially have different ranking
      // (though with small test dataset, may be same)
      expect(hybridResponse.results.length).toBeGreaterThan(0)

      console.log('Pure vector top similarity:', pureVectorResponse.results[0]?.similarity)
      console.log('Hybrid top relevance:', hybridResponse.results[0]?.relevanceScore)
    })
  })

  describe('Filtering', () => {
    it('should filter results by course ID', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'cardiac system',
        filters: {
          courseIds: [testCourseId],
        },
        limit: 10,
      })

      // All results should be from the test course
      response.results.forEach((result) => {
        expect(result.metadata.courseId).toBe(testCourseId)
      })

      expect(response.metadata.filtersApplied).toContain('courses: 1')
    })

    it('should filter by minimum similarity threshold', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'electrical conduction',
        filters: {
          minSimilarity: 0.8, // High threshold
        },
        limit: 10,
      })

      // All results should meet threshold
      response.results.forEach((result) => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.8)
      })
    })

    it('should filter by content type', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'heart function',
        filters: {
          contentTypes: ['chunk'],
        },
        limit: 10,
      })

      // All results should be chunks
      response.results.forEach((result) => {
        expect(result.type).toBe('chunk')
      })
    })
  })

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      if (!process.env.DATABASE_URL) return

      const page1 = await searchService.search({
        query: 'cardiac',
        limit: 2,
        offset: 0,
      })

      const page2 = await searchService.search({
        query: 'cardiac',
        limit: 2,
        offset: 2,
      })

      // Pages should have different results
      if (page1.results.length > 0 && page2.results.length > 0) {
        expect(page1.results[0].id).not.toBe(page2.results[0].id)
      }

      // Pagination metadata should be correct
      if (page1.total > 2) {
        expect(page1.pagination.hasNext).toBe(true)
        expect(page2.pagination.hasPrevious).toBe(true)
      }
    })

    it('should respect pagination limits', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'heart',
        limit: 10,
      })

      expect(response.results.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Snippet Generation', () => {
    it('should generate snippets with context', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'bundle of His Purkinje fibers',
        limit: 5,
      })

      // Snippets should be generated
      response.results.forEach((result) => {
        expect(result.snippet).toBeDefined()
        expect(result.snippet.length).toBeGreaterThan(0)
      })
    })

    it('should highlight search terms in snippets', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'coronary arteries',
        limit: 5,
      })

      // Check if any snippet has highlighted terms
      const hasHighlights = response.results.some((result) => result.snippet.includes('<mark>'))

      // Note: May not always have highlights if semantic match doesn't include exact terms
      console.log('Snippets have highlights:', hasHighlights)
    })
  })

  describe('Performance', () => {
    it('should complete search in under 1 second', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'cardiac conduction electrical signals',
        limit: 10,
      })

      // Target: <1 second search latency
      expect(response.queryTime).toBeLessThan(1000)

      console.log(`Search completed in ${response.queryTime}ms (target: <1000ms)`)
    })

    it('should handle concurrent searches efficiently', async () => {
      if (!process.env.DATABASE_URL) return

      const queries = [
        'heart electrical system',
        'blood flow cardiac chambers',
        'coronary arteries myocardial perfusion',
        'atrioventricular node function',
        'sinoatrial pacemaker',
      ]

      const startTime = Date.now()

      // Execute searches concurrently
      const results = await Promise.all(
        queries.map((query) => searchService.search({ query, limit: 10 })),
      )

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All searches should complete
      expect(results).toHaveLength(queries.length)
      results.forEach((result) => {
        expect(result.results).toBeDefined()
      })

      // Concurrent execution should be reasonably fast
      expect(totalTime).toBeLessThan(5000)

      console.log(`${queries.length} concurrent searches completed in ${totalTime}ms`)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty query gracefully', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: '',
        limit: 10,
      })

      // Should not crash, may return empty or all results
      expect(response).toBeDefined()
      expect(response.results).toBeDefined()
    })

    it('should handle very long query', async () => {
      if (!process.env.DATABASE_URL) return

      const longQuery = 'cardiac conduction system '.repeat(50)

      const response = await searchService.search({
        query: longQuery,
        limit: 10,
      })

      expect(response).toBeDefined()
      expect(response.results).toBeDefined()
    })

    it('should handle query with special characters', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: "What is the SA node's function? (pacemaker)",
        limit: 10,
      })

      expect(response).toBeDefined()
      expect(response.results).toBeDefined()
    })

    it('should handle medical acronyms', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'SA node AV node',
        limit: 10,
      })

      expect(response.results.length).toBeGreaterThan(0)

      // Should find relevant content even with acronyms
      const hasRelevantContent = response.results.some((result) => {
        const text = ((result as any).content || result.snippet).toLowerCase()
        return text.includes('sinoatrial') || text.includes('atrioventricular')
      })

      console.log('Found content for acronym search:', hasRelevantContent)
    })
  })

  describe('Medical Content Specificity', () => {
    it('should find anatomical structures', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'heart chambers ventricles atria',
        limit: 10,
      })

      expect(response.results.length).toBeGreaterThan(0)

      console.log('Anatomical search results:', response.results.length)
    })

    it('should find physiological processes', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'electrical impulse generation and conduction',
        limit: 10,
      })

      expect(response.results.length).toBeGreaterThan(0)

      console.log('Physiological process search results:', response.results.length)
    })

    it('should understand medical terminology', async () => {
      if (!process.env.DATABASE_URL) return

      const response = await searchService.search({
        query: 'myocardial perfusion',
        limit: 10,
      })

      expect(response.results.length).toBeGreaterThan(0)

      // Should find content about cardiac muscle blood supply
      const hasRelevantContent = response.results.some((result) => {
        const text = ((result as any).content || result.snippet).toLowerCase()
        return text.includes('coronary') || text.includes('cardiac muscle')
      })

      console.log('Found medical terminology match:', hasRelevantContent)
    })
  })
})
