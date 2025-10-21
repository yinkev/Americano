import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lectureId: string }> },
) {
  try {
    const resolvedParams = await params
    const { lectureId } = resolvedParams

    // Get lecture with processing status
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: {
        id: true,
        processingStatus: true,
        processedAt: true,
        uploadedAt: true,
        _count: {
          select: {
            contentChunks: true,
            learningObjectives: true,
          },
        },
      },
    })

    if (!lecture) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lecture not found',
        },
        { status: 404 },
      )
    }

    // Calculate progress percentage
    let progress = 0
    switch (lecture.processingStatus) {
      case 'PENDING':
        progress = 10
        break
      case 'PROCESSING':
        progress = 50
        break
      case 'COMPLETED':
        progress = 100
        break
      case 'FAILED':
        progress = 0
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        lectureId: lecture.id,
        status: lecture.processingStatus,
        progress,
        processedAt: lecture.processedAt,
        uploadedAt: lecture.uploadedAt,
        chunksCount: lecture._count.contentChunks,
        objectivesCount: lecture._count.learningObjectives,
      },
    })
  } catch (error) {
    console.error('Processing status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get processing status',
      },
      { status: 500 },
    )
  }
}
