/**
 * Integration test for embedding generation pipeline
 *
 * Tests the complete flow:
 * 1. Content chunking
 * 2. Embedding generation
 * 3. Vector dimensions
 * 4. Rate limiting
 *
 * Epic 3 - Story 3.1 - Task 1
 *
 * Run with: pnpm test embedding-integration
 */

import { ContentChunker } from '../content-chunker'
import { EmbeddingService } from '../embedding-service'

// Sample medical content for testing
const SAMPLE_MEDICAL_TEXT = `
The cardiac conduction system is responsible for the generation and propagation of electrical impulses throughout the heart.
The sinoatrial (SA) node, located in the right atrium, serves as the natural pacemaker of the heart, initiating electrical impulses at a rate of 60-100 beats per minute.
These impulses travel through the atria via internodal pathways, causing atrial contraction.

The atrioventricular (AV) node, located at the junction of the atria and ventricles, serves as the gatekeeper of electrical impulses.
It introduces a slight delay (approximately 0.1 seconds) to allow complete ventricular filling before contraction.
From the AV node, the impulse travels through the Bundle of His, which divides into left and right bundle branches.

The bundle branches extend down the interventricular septum and branch into Purkinje fibers, which penetrate the ventricular myocardium.
This specialized conduction system ensures coordinated ventricular contraction from the apex upward, optimizing cardiac output.

Clinical significance: Disruptions in the cardiac conduction system can lead to arrhythmias.
AV blocks occur when impulse transmission through the AV node is impaired.
Bundle branch blocks indicate conduction delays in either the left or right bundle branch.
Understanding the cardiac conduction system is essential for interpreting electrocardiograms (ECGs) and managing cardiac arrhythmias.
`

describe('Embedding Generation Pipeline', () => {
  let chunker: ContentChunker
  let embeddingService: EmbeddingService

  beforeAll(() => {
    // Initialize services
    chunker = new ContentChunker({
      chunkSizeTokens: 200, // Smaller for testing
      overlapTokens: 50,
    })

    embeddingService = new EmbeddingService({
      maxRequestsPerMinute: 60,
      batchSize: 5,
    })
  })

  describe('ContentChunker', () => {
    it('should chunk medical text with appropriate overlap', async () => {
      const chunks = await chunker.chunkText({
        text: SAMPLE_MEDICAL_TEXT,
        lectureId: 'test-lecture-001',
        pageNumber: 1,
      })

      // Verify chunks were created
      expect(chunks.length).toBeGreaterThan(0)

      // Verify metadata
      chunks.forEach((chunk, index) => {
        expect(chunk.metadata.lectureId).toBe('test-lecture-001')
        expect(chunk.metadata.chunkIndex).toBe(index)
        expect(chunk.metadata.pageNumber).toBe(1)
        expect(chunk.metadata.tokenCount).toBeGreaterThan(0)
        expect(chunk.metadata.wordCount).toBeGreaterThan(0)
        expect(chunk.metadata.charCount).toBe(chunk.content.length)
      })

      // Verify overlap between consecutive chunks
      if (chunks.length > 1) {
        const firstChunk = chunks[0].content
        const secondChunk = chunks[1].content

        // Second chunk should start with content from first chunk (overlap)
        const firstChunkEnd = firstChunk.slice(-100)
        expect(secondChunk.toLowerCase()).toContain(firstChunkEnd.slice(0, 50).toLowerCase())
      }
    })

    it('should preserve medical terminology', async () => {
      const chunks = await chunker.chunkText({
        text: SAMPLE_MEDICAL_TEXT,
        lectureId: 'test-lecture-001',
      })

      // Verify medical terms are preserved across chunks
      const allContent = chunks.map((c) => c.content).join(' ')
      expect(allContent).toContain('sinoatrial')
      expect(allContent).toContain('atrioventricular')
      expect(allContent).toContain('Purkinje fibers')
    })

    it('should provide accurate chunking statistics', () => {
      const stats = chunker.getChunkingStats(SAMPLE_MEDICAL_TEXT)

      expect(stats.totalWords).toBeGreaterThan(0)
      expect(stats.totalTokens).toBeGreaterThan(0)
      expect(stats.estimatedChunks).toBeGreaterThan(0)
      expect(stats.avgTokensPerChunk).toBeGreaterThan(0)
    })
  })

  describe('EmbeddingService', () => {
    it('should generate embedding for single text', async () => {
      const result = await embeddingService.generateEmbedding(
        'The cardiac conduction system initiates electrical impulses.',
      )

      expect(result.error).toBeUndefined()
      expect(result.embedding).toBeDefined()
      expect(result.embedding.length).toBe(1536) // gemini-embedding-001 with output_dimensionality: 1536
      expect(result.embedding[0]).toBeGreaterThan(-1)
      expect(result.embedding[0]).toBeLessThan(1)
    }, 30000) // Allow 30s for API call

    it('should handle empty text gracefully', async () => {
      const result = await embeddingService.generateEmbedding('')

      expect(result.error).toBe('Empty text provided')
      expect(result.embedding).toEqual([])
    })

    it('should generate batch embeddings with error tracking', async () => {
      const texts = [
        'The SA node is the natural pacemaker.',
        'The AV node delays electrical impulses.',
        'Purkinje fibers distribute impulses to ventricles.',
      ]

      const result = await embeddingService.generateBatchEmbeddings(texts)

      expect(result.successCount).toBeGreaterThan(0)
      expect(result.embeddings.length).toBe(texts.length)
      expect(result.failureCount).toBe(0)

      // Verify each embedding
      result.embeddings.forEach((embedding) => {
        if (embedding.length > 0) {
          // Skip empty arrays from errors
          expect(embedding.length).toBe(1536)
        }
      })
    }, 60000) // Allow 60s for batch API calls

    it('should respect rate limiting', async () => {
      const status = embeddingService.getRateLimitStatus()

      expect(status.maxRequestsPerMinute).toBe(60)
      expect(status.requestsInLastMinute).toBeGreaterThanOrEqual(0)
      expect(status.availableRequests).toBeLessThanOrEqual(60)
    })
  })

  describe('Integration: Chunking + Embedding', () => {
    it('should process medical text end-to-end', async () => {
      // Step 1: Chunk the text
      const chunks = await chunker.chunkText({
        text: SAMPLE_MEDICAL_TEXT,
        lectureId: 'test-lecture-001',
        pageNumber: 1,
      })

      expect(chunks.length).toBeGreaterThan(0)

      // Step 2: Generate embeddings for chunks
      const chunkTexts = chunks.map((c) => c.content)
      const result = await embeddingService.generateBatchEmbeddings(chunkTexts)

      // Verify all chunks were embedded successfully
      expect(result.successCount).toBe(chunks.length)
      expect(result.failureCount).toBe(0)

      // Verify embeddings match chunk count
      expect(result.embeddings.length).toBe(chunks.length)

      // Verify embedding dimensions
      result.embeddings.forEach((embedding) => {
        expect(embedding.length).toBe(1536)
      })

      console.log(`
=================================================
Integration Test Results
=================================================
Original Text: ${SAMPLE_MEDICAL_TEXT.length} characters
Chunks Created: ${chunks.length}
Embeddings Generated: ${result.successCount}
Failed: ${result.failureCount}
Average Tokens/Chunk: ${chunks.reduce((sum, c) => sum + c.metadata.tokenCount, 0) / chunks.length}
=================================================
      `)
    }, 90000) // Allow 90s for full pipeline
  })
})
