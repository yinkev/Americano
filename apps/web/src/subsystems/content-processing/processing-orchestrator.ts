import { ProcessingStatus } from '@/generated/prisma'
import { prisma } from '@/lib/db'
import { ContentAnalyzer } from './content-analyzer'
import { EmbeddingGenerator } from './embedding-generator'
import { PDFProcessor } from './pdf-processor'

interface OrchestrationResult {
  success: boolean
  lectureId: string
  status: ProcessingStatus
  error?: string
}

export class ProcessingOrchestrator {
  private pdfProcessor: PDFProcessor
  private contentAnalyzer: ContentAnalyzer
  private embeddingGenerator: EmbeddingGenerator

  constructor() {
    this.pdfProcessor = new PDFProcessor()
    this.contentAnalyzer = new ContentAnalyzer()
    this.embeddingGenerator = new EmbeddingGenerator()
  }

  /**
   * Reprocess a lecture with optional steps
   * Useful for reprocessing lectures that failed or need objective extraction
   */
  async reprocessLecture(
    lectureId: string,
    options: { skipOCR?: boolean } = {},
  ): Promise<OrchestrationResult> {
    try {
      console.log(`[Orchestrator] Starting reprocessing for lecture ${lectureId}`)
      console.log(`[Orchestrator] Options: skipOCR=${options.skipOCR || false}`)

      // Step 1: Extract text (skip if chunks already exist)
      if (!options.skipOCR) {
        console.log('[Orchestrator] Step 1: Extracting text with PaddleOCR...')
        const pdfResult = await this.pdfProcessor.processLecture(lectureId)

        if (!pdfResult.success) {
          throw new Error(`PDF processing failed: ${pdfResult.error}`)
        }

        console.log(
          `[Orchestrator] Step 1 complete: ${pdfResult.chunks?.length || 0} chunks created`,
        )
      } else {
        console.log('[Orchestrator] Step 1: Skipping OCR (chunks already exist)')
      }

      // Step 2: Extract learning objectives
      console.log('[Orchestrator] Step 2: Extracting learning objectives with ChatMock...')

      // Update progress: starting objectives extraction (70%)
      await prisma.lecture.update({
        where: { id: lectureId },
        data: { processingProgress: 70 },
      })

      const analysisResult = await this.contentAnalyzer.extractLearningObjectives(lectureId)

      if (analysisResult.success) {
        console.log(
          `[Orchestrator] Step 2 complete: ${analysisResult.objectivesCount} objectives extracted`,
        )
      } else {
        console.warn(
          `[Orchestrator] Step 2 warning: ${analysisResult.error} - continuing without objectives`,
        )
      }

      // Step 3: Generate embeddings
      console.log('[Orchestrator] Step 3: Generating embeddings with Gemini...')

      // Update progress: starting embeddings (80%)
      await prisma.lecture.update({
        where: { id: lectureId },
        data: { processingProgress: 80 },
      })

      const embeddingResult = await this.embeddingGenerator.generateEmbeddings(lectureId)

      if (!embeddingResult.success) {
        throw new Error(`Embedding generation failed: ${embeddingResult.error}`)
      }

      console.log(
        `[Orchestrator] Step 3 complete: ${embeddingResult.embeddingsGenerated} embeddings generated`,
      )

      // Step 4: Mark lecture as COMPLETED
      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          processingStatus: ProcessingStatus.COMPLETED,
          processedAt: new Date(),
          processingProgress: 100,
        },
      })

      console.log(`[Orchestrator] Reprocessing complete for lecture ${lectureId}`)

      return {
        success: true,
        lectureId,
        status: ProcessingStatus.COMPLETED,
      }
    } catch (error) {
      console.error(`[Orchestrator] Reprocessing failed for lecture ${lectureId}:`, error)

      // Mark lecture as FAILED
      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          processingStatus: ProcessingStatus.FAILED,
          processedAt: new Date(),
        },
      })

      return {
        success: false,
        lectureId,
        status: ProcessingStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Orchestrate the complete processing pipeline for a lecture
   * Steps:
   * 1. Extract text with PaddleOCR
   * 2. Extract learning objectives with ChatMock
   * 3. Generate embeddings with Gemini
   * 4. Mark lecture as COMPLETED
   */
  async processLecture(lectureId: string): Promise<OrchestrationResult> {
    try {
      console.log(`[Orchestrator] Starting processing for lecture ${lectureId}`)

      // Step 1: Extract text and create chunks
      console.log('[Orchestrator] Step 1: Extracting text with PaddleOCR...')
      const pdfResult = await this.pdfProcessor.processLecture(lectureId)

      if (!pdfResult.success) {
        throw new Error(`PDF processing failed: ${pdfResult.error}`)
      }

      console.log(`[Orchestrator] Step 1 complete: ${pdfResult.chunks?.length || 0} chunks created`)

      // Step 2: Extract learning objectives (optional - continue if fails)
      console.log('[Orchestrator] Step 2: Extracting learning objectives with ChatMock...')

      // Update progress: starting objectives extraction (70%)
      await prisma.lecture.update({
        where: { id: lectureId },
        data: { processingProgress: 70 },
      })

      const analysisResult = await this.contentAnalyzer.extractLearningObjectives(lectureId)

      if (analysisResult.success) {
        console.log(
          `[Orchestrator] Step 2 complete: ${analysisResult.objectivesCount} objectives extracted`,
        )
      } else {
        console.warn(
          `[Orchestrator] Step 2 warning: ${analysisResult.error} - continuing without objectives`,
        )
      }

      // Step 3: Generate embeddings
      console.log('[Orchestrator] Step 3: Generating embeddings with Gemini...')

      // Update progress: starting embeddings (80%)
      await prisma.lecture.update({
        where: { id: lectureId },
        data: { processingProgress: 80 },
      })

      const embeddingResult = await this.embeddingGenerator.generateEmbeddings(lectureId)

      if (!embeddingResult.success) {
        throw new Error(`Embedding generation failed: ${embeddingResult.error}`)
      }

      console.log(
        `[Orchestrator] Step 3 complete: ${embeddingResult.embeddingsGenerated} embeddings generated`,
      )

      // Step 4: Mark lecture as COMPLETED
      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          processingStatus: ProcessingStatus.COMPLETED,
          processedAt: new Date(),
          processingProgress: 100,
        },
      })

      console.log(`[Orchestrator] Processing complete for lecture ${lectureId}`)

      return {
        success: true,
        lectureId,
        status: ProcessingStatus.COMPLETED,
      }
    } catch (error) {
      console.error(`[Orchestrator] Processing failed for lecture ${lectureId}:`, error)

      // Mark lecture as FAILED
      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          processingStatus: ProcessingStatus.FAILED,
          processedAt: new Date(),
        },
      })

      return {
        success: false,
        lectureId,
        status: ProcessingStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
