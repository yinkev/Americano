import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ProcessingOrchestrator } from '@/subsystems/content-processing/processing-orchestrator'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: lectureId } = await params

    // Check if lecture exists
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        _count: {
          select: {
            learningObjectives: true,
          },
        },
      },
    })

    if (!lecture) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'LECTURE_NOT_FOUND',
            message: 'Lecture not found',
          },
        },
        { status: 404 },
      )
    }

    // Check if lecture is currently processing
    if (lecture.processingStatus === 'PROCESSING') {
      return Response.json(
        {
          success: false,
          error: {
            code: 'ALREADY_PROCESSING',
            message: 'Lecture is currently being processed',
          },
        },
        { status: 400 },
      )
    }

    // Check if lecture has existing chunks
    const existingChunks = await prisma.contentChunk.count({
      where: { lectureId },
    })

    const hasChunks = existingChunks > 0

    // Reset lecture status to PROCESSING (skip PENDING since we're starting immediately)
    await prisma.lecture.update({
      where: { id: lectureId },
      data: {
        processingStatus: 'PROCESSING',
        processingProgress: hasChunks ? 70 : 0, // Start at 70% if skipping OCR
        processedAt: null,
        processingStartedAt: new Date(),
        estimatedCompletionAt: null,
      },
    })

    // Trigger reprocessing (skip OCR if chunks already exist)
    const orchestrator = new ProcessingOrchestrator()
    orchestrator.reprocessLecture(lectureId, { skipOCR: hasChunks }).catch((error) => {
      console.error(`Reprocessing failed for lecture ${lectureId}:`, error)
    })

    return Response.json({
      success: true,
      data: {
        message: 'Reprocessing started',
        lectureId,
      },
    })
  } catch (error) {
    console.error('Reprocess error:', error)

    return Response.json(
      {
        success: false,
        error: {
          code: 'REPROCESS_FAILED',
          message: 'Failed to start reprocessing',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      },
      { status: 500 },
    )
  }
}
