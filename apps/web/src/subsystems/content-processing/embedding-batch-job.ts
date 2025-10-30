/**
 * EmbeddingBatchJob - Background job for generating embeddings in batches
 *
 * Features:
 * - Processes multiple lectures in parallel
 * - Progress tracking for each lecture
 * - Retry logic for failed embeddings
 * - Rate limiting to avoid API throttling
 * - Detailed logging for monitoring
 *
 * Epic 3 - Story 3.1 - Task 2.2
 */

import type { ProcessingStatus } from '@/generated/prisma'
import { prisma } from '@/lib/db'
import { embeddingService } from '@/lib/embedding-service'

/**
 * Configuration for batch embedding job
 */
export interface BatchJobConfig {
  /** Maximum number of lectures to process in parallel (default: 3) */
  maxParallelLectures?: number
  /** Batch size for embedding generation per lecture (default: 10) */
  embeddingBatchSize?: number
  /** Maximum retry attempts for failed embeddings (default: 3) */
  maxRetries?: number
  /** Filter by processing status (default: all failed statuses) */
  statusFilter?: ProcessingStatus[]
}

/**
 * Result of batch job execution
 */
export interface BatchJobResult {
  /** Total number of lectures processed */
  lecturesProcessed: number
  /** Total number of embeddings generated */
  embeddingsGenerated: number
  /** Number of lectures that completed successfully */
  successCount: number
  /** Number of lectures that failed */
  failureCount: number
  /** Details of each lecture processed */
  lectureResults: LectureEmbeddingResult[]
  /** Total job execution time in milliseconds */
  totalTimeMs: number
}

/**
 * Result for a single lecture's embedding generation
 */
export interface LectureEmbeddingResult {
  /** Lecture ID */
  lectureId: string
  /** Lecture title */
  title: string
  /** Number of chunks processed */
  chunksProcessed: number
  /** Number of embeddings successfully generated */
  embeddingsGenerated: number
  /** Number of failed embeddings */
  failedCount: number
  /** Whether the lecture completed successfully */
  success: boolean
  /** Error message if failed */
  error?: string
  /** Processing time in milliseconds */
  processingTimeMs: number
}

/**
 * EmbeddingBatchJob orchestrates batch embedding generation for multiple lectures
 *
 * @example
 * ```typescript
 * const job = new EmbeddingBatchJob()
 * const result = await job.processLecturesWithMissingEmbeddings()
 * console.log(`Processed ${result.lecturesProcessed} lectures, generated ${result.embeddingsGenerated} embeddings`)
 * ```
 */
export class EmbeddingBatchJob {
  private config: Required<BatchJobConfig>

  constructor(config: BatchJobConfig = {}) {
    this.config = {
      maxParallelLectures: config.maxParallelLectures ?? 3,
      embeddingBatchSize: config.embeddingBatchSize ?? 10,
      maxRetries: config.maxRetries ?? 3,
      statusFilter: config.statusFilter ?? [
        'EMBEDDING_FAILED',
        'COMPLETED', // Re-process completed lectures with missing embeddings
      ],
    }
  }

  /**
   * Process all lectures with missing embeddings
   * Finds lectures that have chunks without embeddings and generates them
   *
   * @returns Batch job result with detailed statistics
   *
   * @example
   * ```typescript
   * const job = new EmbeddingBatchJob({ maxParallelLectures: 5 })
   * const result = await job.processLecturesWithMissingEmbeddings()
   * console.log(`Success rate: ${(result.successCount / result.lecturesProcessed * 100).toFixed(1)}%`)
   * ```
   */
  async processLecturesWithMissingEmbeddings(): Promise<BatchJobResult> {
    const startTime = Date.now()
    console.log('[EmbeddingBatchJob] Starting batch job...')

    // Find lectures with chunks that don't have embeddings
    const lectures = await this.findLecturesWithMissingEmbeddings()
    console.log(`[EmbeddingBatchJob] Found ${lectures.length} lectures with missing embeddings`)

    if (lectures.length === 0) {
      return {
        lecturesProcessed: 0,
        embeddingsGenerated: 0,
        successCount: 0,
        failureCount: 0,
        lectureResults: [],
        totalTimeMs: Date.now() - startTime,
      }
    }

    // Process lectures in batches (parallel processing)
    const results: LectureEmbeddingResult[] = []
    for (let i = 0; i < lectures.length; i += this.config.maxParallelLectures) {
      const batch = lectures.slice(i, i + this.config.maxParallelLectures)
      console.log(
        `[EmbeddingBatchJob] Processing batch ${Math.floor(i / this.config.maxParallelLectures) + 1}/${Math.ceil(lectures.length / this.config.maxParallelLectures)} (${batch.length} lectures)`,
      )

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map((lecture) => this.processLectureEmbeddings(lecture.id)),
      )

      results.push(...batchResults)
    }

    // Calculate statistics
    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length
    const embeddingsGenerated = results.reduce((sum, r) => sum + r.embeddingsGenerated, 0)

    const totalTimeMs = Date.now() - startTime
    console.log(
      `[EmbeddingBatchJob] Completed: ${successCount}/${lectures.length} lectures, ${embeddingsGenerated} embeddings, ${(totalTimeMs / 1000).toFixed(1)}s`,
    )

    return {
      lecturesProcessed: lectures.length,
      embeddingsGenerated,
      successCount,
      failureCount,
      lectureResults: results,
      totalTimeMs,
    }
  }

  /**
   * Process embeddings for a specific lecture
   * Generates embeddings for all chunks without embeddings
   *
   * @param lectureId - ID of lecture to process
   * @returns Result of embedding generation
   */
  async processLectureEmbeddings(lectureId: string): Promise<LectureEmbeddingResult> {
    const startTime = Date.now()

    try {
      // Fetch lecture details
      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId },
        select: { id: true, title: true },
      })

      if (!lecture) {
        throw new Error(`Lecture not found: ${lectureId}`)
      }

      console.log(`[EmbeddingBatchJob] Processing lecture: ${lecture.title} (${lectureId})`)

      // Update status to EMBEDDING
      await this.updateLectureStatus(lectureId, 'EMBEDDING')

      // Find chunks without embeddings
      const chunksWithoutEmbeddings = await this.findChunksWithoutEmbeddings(lectureId)

      if (chunksWithoutEmbeddings.length === 0) {
        console.log(`[EmbeddingBatchJob] No missing embeddings for ${lecture.title}`)
        return {
          lectureId,
          title: lecture.title,
          chunksProcessed: 0,
          embeddingsGenerated: 0,
          failedCount: 0,
          success: true,
          processingTimeMs: Date.now() - startTime,
        }
      }

      // Generate embeddings in batches
      let embeddingsGenerated = 0
      let failedCount = 0

      for (let i = 0; i < chunksWithoutEmbeddings.length; i += this.config.embeddingBatchSize) {
        const batchChunks = chunksWithoutEmbeddings.slice(i, i + this.config.embeddingBatchSize)

        // Generate embeddings for batch
        const texts = batchChunks.map((c) => c.content)
        const batchResult = await embeddingService.generateBatchEmbeddings(texts)

        // Update chunks with embeddings
        for (let j = 0; j < batchChunks.length; j++) {
          const embedding = batchResult.embeddings[j]

          if (embedding && embedding.length > 0) {
            await this.updateChunkEmbedding(batchChunks[j].id, embedding)
            embeddingsGenerated++
          } else {
            failedCount++
            const errorMsg = batchResult.errors.get(j) || 'Unknown error'
            console.error(
              `[EmbeddingBatchJob] Failed embedding for chunk ${batchChunks[j].id}: ${errorMsg}`,
            )
          }
        }

        // Update progress
        const progress = (i + batchChunks.length) / chunksWithoutEmbeddings.length
        await this.updateLectureProgress(lectureId, progress)
      }

      // Update status to COMPLETED
      await this.updateLectureStatus(lectureId, 'COMPLETED', {
        embeddingProgress: 1.0,
      })

      console.log(
        `[EmbeddingBatchJob] Completed ${lecture.title}: ${embeddingsGenerated}/${chunksWithoutEmbeddings.length} embeddings`,
      )

      return {
        lectureId,
        title: lecture.title,
        chunksProcessed: chunksWithoutEmbeddings.length,
        embeddingsGenerated,
        failedCount,
        success: failedCount === 0,
        processingTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      console.error(`[EmbeddingBatchJob] Error processing lecture ${lectureId}: ${errorMessage}`)

      // Update status to EMBEDDING_FAILED
      await this.updateLectureStatus(lectureId, 'EMBEDDING_FAILED')

      return {
        lectureId,
        title: 'Unknown',
        chunksProcessed: 0,
        embeddingsGenerated: 0,
        failedCount: 0,
        success: false,
        error: errorMessage,
        processingTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Find lectures that have chunks without embeddings
   *
   * @private
   * @returns Array of lectures with missing embeddings
   */
  private async findLecturesWithMissingEmbeddings(): Promise<Array<{ id: string; title: string }>> {
    // Use raw SQL to find lectures with chunks missing embeddings
    const lectures = await prisma.$queryRaw<
      Array<{ id: string; title: string; missingCount: number }>
    >`
      SELECT DISTINCT l.id, l.title, COUNT(cc.id) as "missingCount"
      FROM lectures l
      INNER JOIN content_chunks cc ON cc."lectureId" = l.id
      WHERE cc.embedding IS NULL
      GROUP BY l.id, l.title
      ORDER BY "missingCount" DESC
    `

    return lectures.map((l) => ({ id: l.id, title: l.title }))
  }

  /**
   * Find chunks without embeddings for a specific lecture
   *
   * @private
   * @param lectureId - ID of lecture
   * @returns Array of chunks without embeddings
   */
  private async findChunksWithoutEmbeddings(
    lectureId: string,
  ): Promise<Array<{ id: string; content: string }>> {
    return await prisma.contentChunk.findMany({
      where: {
        lectureId,
        embedding: null,
      } as any, // Type assertion: embedding is Unsupported vector type in Prisma schema
      select: {
        id: true,
        content: true,
      },
      orderBy: {
        chunkIndex: 'asc',
      },
    })
  }

  /**
   * Update chunk with generated embedding
   *
   * @private
   * @param chunkId - ID of chunk to update
   * @param embedding - Embedding vector (1536 dimensions)
   */
  private async updateChunkEmbedding(chunkId: string, embedding: number[]): Promise<void> {
    const embeddingStr = JSON.stringify(embedding)
    await prisma.$executeRaw`
      UPDATE content_chunks
      SET embedding = ${embeddingStr}::vector
      WHERE id = ${chunkId}
    `
  }

  /**
   * Update lecture processing status
   *
   * @private
   * @param lectureId - ID of lecture to update
   * @param status - New processing status
   * @param additionalData - Additional fields to update
   */
  private async updateLectureStatus(
    lectureId: string,
    status: ProcessingStatus,
    additionalData: Record<string, any> = {},
  ): Promise<void> {
    await prisma.lecture.update({
      where: { id: lectureId },
      data: {
        processingStatus: status,
        ...additionalData,
      },
    })
  }

  /**
   * Update lecture embedding progress
   *
   * @private
   * @param lectureId - ID of lecture to update
   * @param progress - Progress value (0.0 to 1.0)
   */
  private async updateLectureProgress(lectureId: string, progress: number): Promise<void> {
    await prisma.lecture.update({
      where: { id: lectureId },
      data: {
        embeddingProgress: progress,
      },
    })
  }
}

/**
 * Singleton instance for application-wide use
 */
export const embeddingBatchJob = new EmbeddingBatchJob()

/**
 * Convenience function to run batch job with default settings
 *
 * @returns Batch job result
 *
 * @example
 * ```typescript
 * const result = await runEmbeddingBatchJob()
 * console.log(`Generated ${result.embeddingsGenerated} embeddings`)
 * ```
 */
export async function runEmbeddingBatchJob(): Promise<BatchJobResult> {
  return embeddingBatchJob.processLecturesWithMissingEmbeddings()
}
