// /api/content/lectures/[id] route
// GET: Fetch single lecture with details
// PATCH: Update lecture metadata (title, courseId, weekNumber, topicTags)
// DELETE: Delete lecture with cascades (chunks, objectives, PDF file)

import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getStorageProvider } from '@/lib/storage'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    const lecture = await prisma.lecture.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
        contentChunks: {
          select: {
            id: true,
            content: true,
            chunkIndex: true,
            pageNumber: true,
          },
          orderBy: { chunkIndex: 'asc' },
        },
        learningObjectives: {
          select: {
            id: true,
            objective: true,
            complexity: true,
            pageStart: true,
            pageEnd: true,
            isHighYield: true,
            boardExamTags: true,
            extractedBy: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            contentChunks: true,
            learningObjectives: true,
            cards: true,
          },
        },
      },
    })

    if (!lecture) {
      return Response.json(
        { success: false, error: { code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' } },
        { status: 404 },
      )
    }

    return Response.json({
      success: true,
      data: {
        lecture: {
          ...lecture,
          chunkCount: lecture._count.contentChunks,
          objectiveCount: lecture._count.learningObjectives,
          cardCount: lecture._count.cards,
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch lecture:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch lecture',
          details: { error: errorMessage },
        },
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    const body = await request.json()
    const { title, courseId, weekNumber, topicTags } = body

    // Validate title if provided
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return Response.json(
          {
            success: false,
            error: { code: 'MISSING_TITLE', message: 'Lecture title cannot be empty' },
          },
          { status: 400 },
        )
      }

      if (title.length > 200) {
        return Response.json(
          {
            success: false,
            error: {
              code: 'TITLE_TOO_LONG',
              message: 'Lecture title must be 200 characters or less',
            },
          },
          { status: 400 },
        )
      }
    }

    // Validate courseId if provided
    if (courseId !== undefined) {
      const courseExists = await prisma.course.findUnique({
        where: { id: courseId },
      })

      if (!courseExists) {
        return Response.json(
          { success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found' } },
          { status: 404 },
        )
      }
    }

    // Validate topicTags if provided
    if (topicTags !== undefined) {
      if (!Array.isArray(topicTags)) {
        return Response.json(
          {
            success: false,
            error: { code: 'INVALID_TAGS', message: 'Topic tags must be an array' },
          },
          { status: 400 },
        )
      }

      if (topicTags.length > 10) {
        return Response.json(
          {
            success: false,
            error: { code: 'TOO_MANY_TAGS', message: 'Maximum 10 tags allowed per lecture' },
          },
          { status: 400 },
        )
      }

      for (const tag of topicTags) {
        if (typeof tag !== 'string' || tag.length === 0 || tag.length > 30) {
          return Response.json(
            {
              success: false,
              error: { code: 'INVALID_TAG', message: 'Each tag must be 1-30 characters' },
            },
            { status: 400 },
          )
        }
      }
    }

    // Update lecture
    const lecture = await prisma.lecture.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(courseId !== undefined && { courseId }),
        ...(weekNumber !== undefined && { weekNumber }),
        ...(topicTags !== undefined && { topicTags }),
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
      },
    })

    return Response.json({
      success: true,
      data: {
        lecture,
      },
    })
  } catch (error) {
    console.error('Failed to update lecture:', error)

    // Handle Prisma not found error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return Response.json(
        { success: false, error: { code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' } },
        { status: 404 },
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update lecture',
          details: { error: errorMessage },
        },
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    // Fetch lecture to get fileUrl and status before deletion
    const lecture = await prisma.lecture.findUnique({
      where: { id },
      select: {
        id: true,
        fileUrl: true,
        title: true,
        processingStatus: true,
      },
    })

    if (!lecture) {
      return Response.json(
        { success: false, error: { code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' } },
        { status: 404 },
      )
    }

    // Only allow deletion if processing hasn't completed
    if (lecture.processingStatus === 'COMPLETED' || lecture.processingStatus === 'PROCESSING') {
      return Response.json(
        {
          success: false,
          error: {
            code: 'CANNOT_DELETE',
            message:
              'Cannot delete lectures that have been processed or are currently processing. Please use the bulk actions to manage processed lectures.',
          },
        },
        { status: 400 },
      )
    }

    // Delete lecture from database (cascades to ContentChunks and LearningObjectives via Prisma schema)
    await prisma.lecture.delete({
      where: { id },
    })

    // Delete PDF file from storage
    try {
      const storage = getStorageProvider()
      // Strip file:// protocol and basePath to get relative path
      let filePath = lecture.fileUrl.replace(/^file:\/\//, '')
      // If filePath is absolute, extract only the relative part after basePath
      const basePath = process.env.LOCAL_STORAGE_PATH || '~/americano-data/pdfs'
      const expandedBasePath = basePath.startsWith('~')
        ? basePath.replace('~', process.env.HOME || process.env.USERPROFILE || '')
        : basePath

      if (filePath.startsWith(expandedBasePath)) {
        filePath = filePath.substring(expandedBasePath.length + 1) // +1 to remove leading slash
      }

      await storage.delete(filePath)
    } catch (storageError) {
      // Log but don't fail - database record is already deleted
      console.warn('Failed to delete PDF file from storage:', storageError)
    }

    return Response.json({
      success: true,
      message: 'Lecture deleted successfully',
      deletedLecture: {
        id: lecture.id,
        title: lecture.title,
      },
    })
  } catch (error) {
    console.error('Failed to delete lecture:', error)

    // Handle Prisma not found error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return Response.json(
        { success: false, error: { code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' } },
        { status: 404 },
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete lecture',
          details: { error: errorMessage },
        },
      },
      { status: 500 },
    )
  }
}
