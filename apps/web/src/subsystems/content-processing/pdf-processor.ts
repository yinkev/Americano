import { ProcessingStatus } from '@/generated/prisma'
import { prisma } from '@/lib/db'
import { embeddingService } from '@/lib/embedding-service'
import { contentChunker } from '@/lib/content-chunker'

interface OCRResponse {
  text: string
  confidence: number
  pages: Array<{
    page_number: number
    text: string
  }>
}

interface ProcessingResult {
  success: boolean
  chunks?: Array<{ content: string; chunkIndex: number }>
  embeddingCount?: number
  error?: string
}

export class PDFProcessor {
  private readonly OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8000'
  private readonly MAX_CHUNK_TOKENS = 1000
  private readonly CHUNK_OVERLAP_TOKENS = 100

  /**
   * Process a lecture PDF: extract text, create chunks, update database
   */
  async processLecture(lectureId: string): Promise<ProcessingResult> {
    const startTime = Date.now()

    try {
      // Update status to PROCESSING and initialize progress
      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          processingStatus: ProcessingStatus.PROCESSING,
          processingStartedAt: new Date(),
          processingProgress: 0,
          processedPages: 0,
        },
      })

      // Get lecture file path
      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId },
      })

      if (!lecture) {
        throw new Error(`Lecture ${lectureId} not found`)
      }

      // Call PaddleOCR service
      // Strip file:// protocol if present (local storage uses file:// URLs)
      const filePath = lecture.fileUrl.replace(/^file:\/\//, '')
      const extractedText = await this.callOCRService(filePath)

      // Update progress with page info (OCR complete - 60% done)
      const totalPages = extractedText.pages.length
      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          totalPages,
          processedPages: totalPages,
          processingProgress: 60,
        },
      })

      // Chunk the text using ContentChunker for better semantic segmentation
      const contentChunks = await contentChunker.chunkText({
        text: extractedText.text,
        lectureId,
        pageNumber: 1, // TODO: Extract actual page numbers from OCR response
      })

      // Create ContentChunk records in database (without embeddings initially)
      const chunkIds = await this.createContentChunks(lectureId, contentChunks)

      // Update progress (chunking complete - 80% done)
      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          processingProgress: 80,
        },
      })

      // Generate embeddings for all chunks
      await this.updateLectureStatus(lectureId, 'EMBEDDING')
      const embeddingCount = await this.generateEmbeddingsForChunks(
        lectureId,
        chunkIds
      )

      // Mark as COMPLETED
      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          processingStatus: ProcessingStatus.COMPLETED,
          processedAt: new Date(),
          processingProgress: 100,
          embeddingProgress: 1.0,
        },
      })

      return {
        success: true,
        chunks: contentChunks.map((chunk, index) => ({
          content: chunk.content,
          chunkIndex: index,
        })),
        embeddingCount,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'

      // Determine error status based on failure point
      const errorStatus = errorMessage.includes('embedding')
        ? ProcessingStatus.EMBEDDING_FAILED
        : ProcessingStatus.FAILED

      // Update lecture status to FAILED or EMBEDDING_FAILED
      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          processingStatus: errorStatus,
          processedAt: new Date(),
          processingProgress: errorStatus === ProcessingStatus.EMBEDDING_FAILED ? 80 : 0,
        },
      })

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Call PaddleOCR service to extract text from PDF
   */
  private async callOCRService(filePath: string): Promise<OCRResponse> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 minute timeout

      try {
        const response = await fetch(`${this.OCR_SERVICE_URL}/extract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file_path: filePath }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(
            `OCR service error (${response.status}): ${errorText || response.statusText}`,
          )
        }

        const result: OCRResponse = await response.json()
        return result
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (error) {
      // Check if it's a timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('OCR service timeout after 3 minutes - file may be too large or complex')
      }

      // Retry once on failure
      console.warn('OCR service call failed, retrying once...', error)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 180000)

        try {
          const response = await fetch(`${this.OCR_SERVICE_URL}/extract`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file_path: filePath }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(
              `OCR service error on retry (${response.status}): ${errorText || response.statusText}`,
            )
          }

          return await response.json()
        } finally {
          clearTimeout(timeoutId)
        }
      } catch (retryError) {
        if (retryError instanceof Error && retryError.name === 'AbortError') {
          throw new Error(
            'OCR service timeout after retry - file is too large or complex to process',
          )
        }
        throw new Error(
          `OCR service failed after retry: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`,
        )
      }
    }
  }

  /**
   * Chunk text into smaller pieces for embedding generation
   * Uses simple token approximation (4 chars ≈ 1 token)
   */
  private chunkText(text: string): string[] {
    const chunks: string[] = []
    const approxTokens = text.length / 4

    // If text is small enough, return as single chunk
    if (approxTokens <= this.MAX_CHUNK_TOKENS) {
      return [text]
    }

    // Split text into sentences for chunking
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

    let currentChunk = ''
    let currentTokens = 0

    for (const sentence of sentences) {
      const sentenceTokens = sentence.length / 4

      // If adding this sentence exceeds MAX_CHUNK_TOKENS, start new chunk
      if (currentTokens + sentenceTokens > this.MAX_CHUNK_TOKENS && currentChunk) {
        chunks.push(currentChunk.trim())

        // Start new chunk with overlap (last few sentences)
        const overlapText = currentChunk
          .split(/[.!?]+/)
          .slice(-2)
          .join('. ')
        currentChunk = overlapText + ' ' + sentence
        currentTokens = overlapText.length / 4 + sentenceTokens
      } else {
        currentChunk += sentence
        currentTokens += sentenceTokens
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  /**
   * Create ContentChunk records in database
   */
  private async createContentChunks(
    lectureId: string,
    chunks: Array<{ content: string; metadata: any }>
  ): Promise<string[]> {
    const chunkIds: string[] = []

    for (const chunk of chunks) {
      const stored = await prisma.contentChunk.create({
        data: {
          lectureId,
          content: chunk.content,
          chunkIndex: chunk.metadata.chunkIndex,
          pageNumber: chunk.metadata.pageNumber,
          // embedding will be added later
        },
      })
      chunkIds.push(stored.id)
    }

    return chunkIds
  }

  /**
   * Generate embeddings for stored chunks with progress tracking
   * Epic 3 - Story 3.1 - Task 2.1
   */
  private async generateEmbeddingsForChunks(
    lectureId: string,
    chunkIds: string[]
  ): Promise<number> {
    let successCount = 0
    const totalChunks = chunkIds.length
    const batchSize = 10 // Process 10 embeddings at a time

    // Process in batches
    for (let i = 0; i < chunkIds.length; i += batchSize) {
      const batchIds = chunkIds.slice(i, i + batchSize)

      // Fetch chunk contents
      const chunks = await prisma.contentChunk.findMany({
        where: { id: { in: batchIds } },
        select: { id: true, content: true },
      })

      // Generate embeddings for batch
      const texts = chunks.map((c) => c.content)
      const batchResult = await embeddingService.generateBatchEmbeddings(texts)

      // Update chunks with embeddings
      for (let j = 0; j < chunks.length; j++) {
        const embedding = batchResult.embeddings[j]

        // Only update if embedding was successfully generated
        if (embedding && embedding.length > 0) {
          await this.updateChunkEmbedding(chunks[j].id, embedding)
          successCount++
        } else {
          const errorMsg = batchResult.errors.get(j)
          console.error(
            `Failed to generate embedding for chunk ${chunks[j].id}: ${errorMsg}`
          )
        }
      }

      // Update progress (embedding generation: 80-100%)
      const progress = 0.8 + (0.2 * (i + batchIds.length)) / totalChunks
      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          embeddingProgress: progress,
          processingProgress: Math.floor(80 + 20 * progress),
        },
      })
    }

    return successCount
  }

  /**
   * Update chunk with generated embedding
   * Uses raw SQL to update vector column (not supported by Prisma ORM)
   */
  private async updateChunkEmbedding(
    chunkId: string,
    embedding: number[]
  ): Promise<void> {
    const embeddingStr = JSON.stringify(embedding)
    // Use raw SQL to update vector column
    await prisma.$executeRaw`
      UPDATE content_chunks
      SET embedding = ${embeddingStr}::vector
      WHERE id = ${chunkId}
    `
  }

  /**
   * Update lecture processing status
   */
  private async updateLectureStatus(
    lectureId: string,
    status: ProcessingStatus
  ): Promise<void> {
    await prisma.lecture.update({
      where: { id: lectureId },
      data: {
        processingStatus: status,
        embeddingProgress: status === 'EMBEDDING' ? 0 : undefined,
      },
    })
  }
}
