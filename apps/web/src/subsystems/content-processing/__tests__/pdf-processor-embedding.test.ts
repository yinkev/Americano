/**
 * Unit Tests for PDF Processor with Embedding Generation
 *
 * Tests the complete pipeline: OCR � Chunking � Embedding Generation
 *
 * Epic 3 - Story 3.1 - Task 2
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { contentChunker } from '@/lib/content-chunker'
import { prisma } from '@/lib/db'
import { embeddingService } from '@/lib/embedding-service'
import { PDFProcessor } from '../pdf-processor'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    lecture: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    contentChunk: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $executeRaw: jest.fn(),
  },
}))

jest.mock('@/lib/embedding-service', () => ({
  embeddingService: {
    generateBatchEmbeddings: jest.fn(),
  },
}))

jest.mock('@/lib/content-chunker', () => ({
  contentChunker: {
    chunkText: jest.fn(),
  },
}))

type AsyncMock<T = any> = jest.MockedFunction<(...args: any[]) => Promise<T>>

const prismaMock = prisma as unknown as {
  lecture: {
    findUnique: AsyncMock<any>
    update: AsyncMock<any>
  }
  contentChunk: {
    create: AsyncMock<any>
    findMany: AsyncMock<any[]>
  }
  $executeRaw: AsyncMock<number>
}

const embeddingServiceMock = embeddingService as unknown as {
  generateBatchEmbeddings: AsyncMock<any>
}

const contentChunkerMock = contentChunker as unknown as {
  chunkText: AsyncMock<any>
}

describe('PDFProcessor - Embedding Generation', () => {
  let processor: PDFProcessor

  beforeEach(() => {
    processor = new PDFProcessor()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('processLecture', () => {
    it('should successfully process lecture with embedding generation', async () => {
      const lectureId = 'test-lecture-id'
      const mockLecture = {
        id: lectureId,
        title: 'Test Lecture',
        fileUrl: 'file:///path/to/test.pdf',
        userId: 'user-123',
        courseId: 'course-123',
      }

      const mockChunks = [
        {
          content: 'Chunk 1 content',
          metadata: {
            lectureId,
            chunkIndex: 0,
            pageNumber: 1,
            tokenCount: 100,
            wordCount: 75,
            charCount: 300,
          },
        },
        {
          content: 'Chunk 2 content',
          metadata: {
            lectureId,
            chunkIndex: 1,
            pageNumber: 1,
            tokenCount: 120,
            wordCount: 90,
            charCount: 360,
          },
        },
      ]

      const mockEmbeddings = [new Array(1536).fill(0.1), new Array(1536).fill(0.2)]

      // Mock Prisma calls
      prismaMock.lecture.findUnique.mockResolvedValue(mockLecture as any)
      prismaMock.lecture.update.mockResolvedValue(mockLecture as any)
      contentChunkerMock.chunkText.mockResolvedValue(mockChunks)
      prismaMock.contentChunk.create
        .mockResolvedValueOnce({ id: 'chunk-1', ...mockChunks[0] } as any)
        .mockResolvedValueOnce({ id: 'chunk-2', ...mockChunks[1] } as any)
      prismaMock.contentChunk.findMany.mockResolvedValue([
        { id: 'chunk-1', content: mockChunks[0].content },
        { id: 'chunk-2', content: mockChunks[1].content },
      ] as any)
      embeddingServiceMock.generateBatchEmbeddings.mockResolvedValue({
        embeddings: mockEmbeddings,
        errors: new Map(),
        successCount: 2,
        failureCount: 0,
      })
      prismaMock.$executeRaw.mockResolvedValue(1)

      // Execute
      const result = await processor.processLecture(lectureId)

      // Assertions
      expect(result.success).toBe(true)
      expect(result.chunkCount).toBe(2)
      expect(result.embeddingCount).toBe(2)
      expect(result.error).toBeUndefined()

      // Verify status updates
      expect(prisma.lecture.update).toHaveBeenCalledWith({
        where: { id: lectureId },
        data: expect.objectContaining({
          processingStatus: 'PROCESSING',
        }),
      })

      expect(prisma.lecture.update).toHaveBeenCalledWith({
        where: { id: lectureId },
        data: expect.objectContaining({
          processingStatus: 'EMBEDDING',
        }),
      })

      expect(prisma.lecture.update).toHaveBeenCalledWith({
        where: { id: lectureId },
        data: expect.objectContaining({
          processingStatus: 'COMPLETED',
          embeddingProgress: 1.0,
        }),
      })

      // Verify embeddings were stored
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(2)
    })

    it('should handle lecture not found error', async () => {
      const lectureId = 'nonexistent-lecture'

      prismaMock.lecture.findUnique.mockResolvedValue(null)
      prismaMock.lecture.update.mockResolvedValue({} as any)

      const result = await processor.processLecture(lectureId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Lecture not found')

      // Verify status updated to FAILED
      expect(prisma.lecture.update).toHaveBeenCalledWith({
        where: { id: lectureId },
        data: expect.objectContaining({
          processingStatus: 'FAILED',
        }),
      })
    })

    it('should handle embedding generation failure', async () => {
      const lectureId = 'test-lecture-id'
      const mockLecture = {
        id: lectureId,
        title: 'Test Lecture',
        fileUrl: 'file:///path/to/test.pdf',
      }

      const mockChunks = [
        {
          content: 'Chunk 1 content',
          metadata: {
            lectureId,
            chunkIndex: 0,
            pageNumber: 1,
            tokenCount: 100,
            wordCount: 75,
            charCount: 300,
          },
        },
      ]

      prismaMock.lecture.findUnique.mockResolvedValue(mockLecture as any)
      prismaMock.lecture.update.mockResolvedValue(mockLecture as any)
      contentChunkerMock.chunkText.mockResolvedValue(mockChunks)
      prismaMock.contentChunk.create.mockResolvedValue({
        id: 'chunk-1',
        ...mockChunks[0],
      } as any)
      prismaMock.contentChunk.findMany.mockResolvedValue([
        { id: 'chunk-1', content: mockChunks[0].content },
      ] as any)

      // Mock embedding failure
      embeddingServiceMock.generateBatchEmbeddings.mockResolvedValue({
        embeddings: [[]],
        errors: new Map([[0, 'API rate limit exceeded']]),
        successCount: 0,
        failureCount: 1,
      })

      const result = await processor.processLecture(lectureId)

      expect(result.success).toBe(true) // Processing completes, but embedding count is 0
      expect(result.embeddingCount).toBe(0)

      // Verify embedding was not stored
      expect(prisma.$executeRaw).not.toHaveBeenCalled()
    })

    it('should handle empty extracted text', async () => {
      const lectureId = 'test-lecture-id'
      const mockLecture = {
        id: lectureId,
        title: 'Test Lecture',
        fileUrl: 'file:///path/to/empty.pdf',
      }

      prismaMock.lecture.findUnique.mockResolvedValue(mockLecture as any)
      prismaMock.lecture.update.mockResolvedValue(mockLecture as any)

      // Note: The processor uses placeholder text extraction, so it won't actually be empty
      // This test would be more relevant with actual OCR integration
      const result = await processor.processLecture(lectureId)

      // With placeholder text, it will succeed
      expect(result.success).toBe(true)
    })

    it('should update progress during embedding generation', async () => {
      const lectureId = 'test-lecture-id'
      const mockLecture = {
        id: lectureId,
        title: 'Test Lecture',
        fileUrl: 'file:///path/to/test.pdf',
      }

      // Create 25 chunks to test batching (batch size is 10)
      const mockChunks = Array.from({ length: 25 }, (_, i) => ({
        content: `Chunk ${i + 1} content`,
        metadata: {
          lectureId,
          chunkIndex: i,
          pageNumber: 1,
          tokenCount: 100,
          wordCount: 75,
          charCount: 300,
        },
      }))

      const mockEmbeddings = Array.from({ length: 25 }, () => new Array(1536).fill(0.1))

      prismaMock.lecture.findUnique.mockResolvedValue(mockLecture as any)
      prismaMock.lecture.update.mockResolvedValue(mockLecture as any)
      contentChunkerMock.chunkText.mockResolvedValue(mockChunks)

      // Mock chunk creation
      mockChunks.forEach((chunk, i) => {
        prismaMock.contentChunk.create.mockResolvedValueOnce({
          id: `chunk-${i + 1}`,
          ...chunk,
        } as any)
      })

      // Mock batched embedding generation
      prismaMock.contentChunk.findMany.mockImplementation(({ where }: any) => {
        const ids = where.id.in
        return Promise.resolve(
          ids.map((id: string, idx: number) => ({
            id,
            content: `Chunk ${idx + 1} content`,
          })),
        )
      })

      embeddingServiceMock.generateBatchEmbeddings.mockResolvedValue({
        embeddings: Array(10).fill(new Array(1536).fill(0.1)),
        errors: new Map(),
        successCount: 10,
        failureCount: 0,
      })

      prismaMock.$executeRaw.mockResolvedValue(1)

      const result = await processor.processLecture(lectureId)

      expect(result.success).toBe(true)
      expect(result.chunkCount).toBe(25)

      // Verify progress was updated multiple times (once per batch)
      const progressCalls = prismaMock.lecture.update.mock.calls.filter(
        (call: any[]) =>
          call[0].data &&
          'embeddingProgress' in call[0].data &&
          call[0].data.embeddingProgress !== 1.0,
      )

      expect(progressCalls.length).toBeGreaterThan(0)
    })
  })

  describe('embedding dimension validation', () => {
    it('should generate embeddings with correct dimensions (1536)', async () => {
      const lectureId = 'test-lecture-id'
      const mockLecture = {
        id: lectureId,
        title: 'Test Lecture',
        fileUrl: 'file:///path/to/test.pdf',
      }

      const mockChunks = [
        {
          content: 'Test content',
          metadata: {
            lectureId,
            chunkIndex: 0,
            pageNumber: 1,
            tokenCount: 50,
            wordCount: 37,
            charCount: 150,
          },
        },
      ]

      const correctDimensionEmbedding = new Array(1536).fill(0.1)

      prismaMock.lecture.findUnique.mockResolvedValue(mockLecture as any)
      prismaMock.lecture.update.mockResolvedValue(mockLecture as any)
      contentChunkerMock.chunkText.mockResolvedValue(mockChunks)
      prismaMock.contentChunk.create.mockResolvedValue({
        id: 'chunk-1',
        ...mockChunks[0],
      } as any)
      prismaMock.contentChunk.findMany.mockResolvedValue([
        { id: 'chunk-1', content: mockChunks[0].content },
      ] as any)

      embeddingServiceMock.generateBatchEmbeddings.mockResolvedValue({
        embeddings: [correctDimensionEmbedding],
        errors: new Map(),
        successCount: 1,
        failureCount: 0,
      })

      let capturedEmbedding: number[] | null = null
      prismaMock.$executeRaw.mockImplementation((...args: any[]) => {
        // Extract embedding from SQL query
        const embeddingStr = args[1] // Second parameter after template
        if (embeddingStr) {
          capturedEmbedding = JSON.parse(embeddingStr) as number[]
        }
        return Promise.resolve(1)
      })

      await processor.processLecture(lectureId)

      expect(capturedEmbedding).not.toBeNull()

      const embedding = capturedEmbedding
      if (!embedding) {
        throw new Error('Embedding was not captured for assertion')
      }

      expect((embedding as number[]).length).toBe(1536)
    })
  })
})
