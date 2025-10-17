/**
 * Unit Tests for Embedding Batch Job
 *
 * Tests background job processing for batch embedding generation
 *
 * Epic 3 - Story 3.1 - Task 2.2
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { EmbeddingBatchJob } from '../embedding-batch-job'
import { prisma } from '@/lib/db'
import { embeddingService } from '@/lib/embedding-service'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    lecture: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    contentChunk: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  },
}))

jest.mock('@/lib/embedding-service', () => ({
  embeddingService: {
    generateBatchEmbeddings: jest.fn(),
  },
}))

describe('EmbeddingBatchJob', () => {
  let batchJob: EmbeddingBatchJob

  beforeEach(() => {
    batchJob = new EmbeddingBatchJob()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('processLecturesWithMissingEmbeddings', () => {
    it('should process multiple lectures with missing embeddings', async () => {
      const mockLectures = [
        { id: 'lec-1', title: 'Lecture 1', missingCount: 5 },
        { id: 'lec-2', title: 'Lecture 2', missingCount: 3 },
      ]

      const mockChunksLec1 = [
        { id: 'chunk-1', content: 'Content 1' },
        { id: 'chunk-2', content: 'Content 2' },
      ]

      const mockChunksLec2 = [{ id: 'chunk-3', content: 'Content 3' }]

      const mockEmbeddings = [new Array(1536).fill(0.1)]

      // Mock finding lectures with missing embeddings
      jest.mocked(prisma.$queryRaw).mockResolvedValue(mockLectures)

      // Mock lecture lookups
      jest.mocked(prisma.lecture.findUnique)
        .mockResolvedValueOnce({
          id: 'lec-1',
          title: 'Lecture 1',
        } as any)
        .mockResolvedValueOnce({
          id: 'lec-2',
          title: 'Lecture 2',
        } as any)

      // Mock chunk lookups
      jest.mocked(prisma.contentChunk.findMany)
        .mockResolvedValueOnce(mockChunksLec1 as any)
        .mockResolvedValueOnce(mockChunksLec2 as any)

      // Mock embedding generation
      jest.mocked(embeddingService.generateBatchEmbeddings)
        .mockResolvedValueOnce({
          embeddings: Array(2).fill(mockEmbeddings[0]),
          errors: new Map(),
          successCount: 2,
          failureCount: 0,
        })
        .mockResolvedValueOnce({
          embeddings: [mockEmbeddings[0]],
          errors: new Map(),
          successCount: 1,
          failureCount: 0,
        })

      // Mock database updates
      jest.mocked(prisma.lecture.update).mockResolvedValue({} as any)
      jest.mocked(prisma.$executeRaw).mockResolvedValue(1)

      // Execute
      const result = await batchJob.processLecturesWithMissingEmbeddings()

      // Assertions
      expect(result.lecturesProcessed).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.failureCount).toBe(0)
      expect(result.embeddingsGenerated).toBe(3)
      expect(result.lectureResults).toHaveLength(2)
    })

    it('should handle no lectures with missing embeddings', async () => {
      jest.mocked(prisma.$queryRaw).mockResolvedValue([])

      const result = await batchJob.processLecturesWithMissingEmbeddings()

      expect(result.lecturesProcessed).toBe(0)
      expect(result.embeddingsGenerated).toBe(0)
      expect(result.lectureResults).toHaveLength(0)
    })

    it('should handle partial failures across lectures', async () => {
      const mockLectures = [
        { id: 'lec-1', title: 'Lecture 1', missingCount: 2 },
        { id: 'lec-2', title: 'Lecture 2', missingCount: 2 },
      ]

      jest.mocked(prisma.$queryRaw).mockResolvedValue(mockLectures)

      // First lecture succeeds
      jest.mocked(prisma.lecture.findUnique)
        .mockResolvedValueOnce({
          id: 'lec-1',
          title: 'Lecture 1',
        } as any)
        .mockResolvedValueOnce({
          id: 'lec-2',
          title: 'Lecture 2',
        } as any)

      jest.mocked(prisma.contentChunk.findMany)
        .mockResolvedValueOnce([
          { id: 'chunk-1', content: 'Content 1' },
        ] as any)
        .mockRejectedValueOnce(new Error('Database error'))

      jest.mocked(embeddingService.generateBatchEmbeddings).mockResolvedValue({
        embeddings: [new Array(1536).fill(0.1)],
        errors: new Map(),
        successCount: 1,
        failureCount: 0,
      })

      jest.mocked(prisma.lecture.update).mockResolvedValue({} as any)
      jest.mocked(prisma.$executeRaw).mockResolvedValue(1)

      const result = await batchJob.processLecturesWithMissingEmbeddings()

      expect(result.lecturesProcessed).toBe(2)
      expect(result.successCount).toBe(1)
      expect(result.failureCount).toBe(1)
      expect(result.embeddingsGenerated).toBe(1)

      const failedResult = result.lectureResults.find((r) => !r.success)
      expect(failedResult?.error).toContain('Database error')
    })
  })

  describe('processLectureEmbeddings', () => {
    it('should generate embeddings for a single lecture', async () => {
      const lectureId = 'lec-123'

      jest.mocked(prisma.lecture.findUnique).mockResolvedValue({
        id: lectureId,
        title: 'Test Lecture',
      } as any)

      jest.mocked(prisma.contentChunk.findMany).mockResolvedValue([
        { id: 'chunk-1', content: 'Content 1' },
        { id: 'chunk-2', content: 'Content 2' },
      ] as any)

      jest.mocked(embeddingService.generateBatchEmbeddings).mockResolvedValue({
        embeddings: [
          new Array(1536).fill(0.1),
          new Array(1536).fill(0.2),
        ],
        errors: new Map(),
        successCount: 2,
        failureCount: 0,
      })

      jest.mocked(prisma.lecture.update).mockResolvedValue({} as any)
      jest.mocked(prisma.$executeRaw).mockResolvedValue(1)

      const result = await batchJob.processLectureEmbeddings(lectureId)

      expect(result.success).toBe(true)
      expect(result.lectureId).toBe(lectureId)
      expect(result.embeddingsGenerated).toBe(2)
      expect(result.failedCount).toBe(0)
    })

    it('should handle lecture with no missing embeddings', async () => {
      const lectureId = 'lec-123'

      jest.mocked(prisma.lecture.findUnique).mockResolvedValue({
        id: lectureId,
        title: 'Test Lecture',
      } as any)

      jest.mocked(prisma.contentChunk.findMany).mockResolvedValue([])
      jest.mocked(prisma.lecture.update).mockResolvedValue({} as any)

      const result = await batchJob.processLectureEmbeddings(lectureId)

      expect(result.success).toBe(true)
      expect(result.embeddingsGenerated).toBe(0)
      expect(result.chunksProcessed).toBe(0)
    })

    it('should track partial embedding failures', async () => {
      const lectureId = 'lec-123'

      jest.mocked(prisma.lecture.findUnique).mockResolvedValue({
        id: lectureId,
        title: 'Test Lecture',
      } as any)

      jest.mocked(prisma.contentChunk.findMany).mockResolvedValue([
        { id: 'chunk-1', content: 'Content 1' },
        { id: 'chunk-2', content: 'Content 2' },
        { id: 'chunk-3', content: 'Content 3' },
      ] as any)

      // First embedding succeeds, second and third fail
      jest.mocked(embeddingService.generateBatchEmbeddings).mockResolvedValue({
        embeddings: [new Array(1536).fill(0.1), [], []],
        errors: new Map([
          [1, 'API rate limit'],
          [2, 'Timeout'],
        ]),
        successCount: 1,
        failureCount: 2,
      })

      jest.mocked(prisma.lecture.update).mockResolvedValue({} as any)
      jest.mocked(prisma.$executeRaw).mockResolvedValue(1)

      const result = await batchJob.processLectureEmbeddings(lectureId)

      expect(result.success).toBe(false) // Not fully successful
      expect(result.embeddingsGenerated).toBe(1)
      expect(result.failedCount).toBe(2)
      expect(result.chunksProcessed).toBe(3)
    })

    it('should update lecture status correctly through lifecycle', async () => {
      const lectureId = 'lec-123'

      jest.mocked(prisma.lecture.findUnique).mockResolvedValue({
        id: lectureId,
        title: 'Test Lecture',
      } as any)

      jest.mocked(prisma.contentChunk.findMany).mockResolvedValue([
        { id: 'chunk-1', content: 'Content 1' },
      ] as any)

      jest.mocked(embeddingService.generateBatchEmbeddings).mockResolvedValue({
        embeddings: [new Array(1536).fill(0.1)],
        errors: new Map(),
        successCount: 1,
        failureCount: 0,
      })

      jest.mocked(prisma.lecture.update).mockResolvedValue({} as any)
      jest.mocked(prisma.$executeRaw).mockResolvedValue(1)

      await batchJob.processLectureEmbeddings(lectureId)

      // Verify status progression: EMBEDDING � COMPLETED
      const updateCalls = jest.mocked(prisma.lecture.update).mock.calls

      // Should update to EMBEDDING status
      expect(updateCalls).toContainEqual([
        {
          where: { id: lectureId },
          data: expect.objectContaining({
            processingStatus: 'EMBEDDING',
          }),
        },
      ])

      // Should update to COMPLETED status
      expect(updateCalls).toContainEqual([
        {
          where: { id: lectureId },
          data: expect.objectContaining({
            processingStatus: 'COMPLETED',
            embeddingProgress: 1.0,
          }),
        },
      ])
    })
  })

  describe('parallel processing', () => {
    it('should respect maxParallelLectures configuration', async () => {
      const batchJobWithLimit = new EmbeddingBatchJob({
        maxParallelLectures: 2,
      })

      const mockLectures = [
        { id: 'lec-1', title: 'Lecture 1', missingCount: 1 },
        { id: 'lec-2', title: 'Lecture 2', missingCount: 1 },
        { id: 'lec-3', title: 'Lecture 3', missingCount: 1 },
        { id: 'lec-4', title: 'Lecture 4', missingCount: 1 },
        { id: 'lec-5', title: 'Lecture 5', missingCount: 1 },
      ]

      jest.mocked(prisma.$queryRaw).mockResolvedValue(mockLectures)
      jest.mocked(prisma.lecture.findUnique).mockImplementation(({ where }) =>
        Promise.resolve({
          id: where.id,
          title: `Lecture ${where.id}`,
        } as any)
      )
      jest.mocked(prisma.contentChunk.findMany).mockResolvedValue([
        { id: 'chunk-1', content: 'Content' },
      ] as any)
      jest.mocked(embeddingService.generateBatchEmbeddings).mockResolvedValue({
        embeddings: [new Array(1536).fill(0.1)],
        errors: new Map(),
        successCount: 1,
        failureCount: 0,
      })
      jest.mocked(prisma.lecture.update).mockResolvedValue({} as any)
      jest.mocked(prisma.$executeRaw).mockResolvedValue(1)

      const result = await batchJobWithLimit.processLecturesWithMissingEmbeddings()

      expect(result.lecturesProcessed).toBe(5)
      expect(result.successCount).toBe(5)
    })
  })

  describe('progress tracking', () => {
    it('should update embedding progress during processing', async () => {
      const lectureId = 'lec-123'

      jest.mocked(prisma.lecture.findUnique).mockResolvedValue({
        id: lectureId,
        title: 'Test Lecture',
      } as any)

      // Create 15 chunks to test progress updates (batch size is 10)
      const mockChunks = Array.from({ length: 15 }, (_, i) => ({
        id: `chunk-${i + 1}`,
        content: `Content ${i + 1}`,
      }))

      jest.mocked(prisma.contentChunk.findMany).mockResolvedValue(
        mockChunks as any
      )

      jest.mocked(embeddingService.generateBatchEmbeddings).mockResolvedValue({
        embeddings: Array(10).fill(new Array(1536).fill(0.1)),
        errors: new Map(),
        successCount: 10,
        failureCount: 0,
      })

      jest.mocked(prisma.lecture.update).mockResolvedValue({} as any)
      jest.mocked(prisma.$executeRaw).mockResolvedValue(1)

      await batchJob.processLectureEmbeddings(lectureId)

      // Verify progress was updated during processing
      const progressUpdates = jest
        .mocked(prisma.lecture.update)
        .mock.calls.filter(
          (call) => call[0].data && 'embeddingProgress' in call[0].data
        )

      expect(progressUpdates.length).toBeGreaterThan(0)
    })
  })
})
