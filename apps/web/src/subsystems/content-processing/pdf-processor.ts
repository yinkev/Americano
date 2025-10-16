import { ProcessingStatus } from '@/generated/prisma'
import { prisma } from '@/lib/db'

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

      // Chunk the text
      const chunks = this.chunkText(extractedText.text)

      // Create ContentChunk records
      await this.createContentChunks(lectureId, chunks)

      // Don't mark as COMPLETED here - let orchestrator do it
      return {
        success: true,
        chunks: chunks.map((content, index) => ({ content, chunkIndex: index })),
      }
    } catch (error) {
      // Update lecture status to FAILED
      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          processingStatus: ProcessingStatus.FAILED,
          processedAt: new Date(),
          processingProgress: 0,
        },
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
  private async createContentChunks(lectureId: string, chunks: string[]): Promise<void> {
    await prisma.contentChunk.createMany({
      data: chunks.map((content, index) => ({
        lectureId,
        content,
        chunkIndex: index,
        // embedding will be added later by EmbeddingGenerator
      })),
    })
  }
}
