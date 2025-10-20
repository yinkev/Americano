// /api/content/lectures route
// GET: List all lectures with filtering, sorting, and pagination

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ProcessingStatus } from '@/generated/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get Kevy user (auth deferred for MVP)
    const user = await prisma.user.findFirst({
      where: { email: 'kevy@americano.dev' },
    })

    if (!user) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Kevy user not found. Run: npx prisma db seed',
          },
        },
        { status: 500 },
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status') as ProcessingStatus | null
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const sortBy = searchParams.get('sortBy') || 'uploadedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return Response.json(
        {
          success: false,
          error: { code: 'INVALID_PARAMS', message: 'Invalid page or limit parameters' },
        },
        { status: 400 },
      )
    }

    const validSortFields = ['uploadedAt', 'title', 'processedAt', 'processingStatus']
    if (!validSortFields.includes(sortBy)) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'INVALID_SORT',
            message: `Sort field must be one of: ${validSortFields.join(', ')}`,
          },
        },
        { status: 400 },
      )
    }

    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      return Response.json(
        {
          success: false,
          error: { code: 'INVALID_ORDER', message: 'Sort order must be asc or desc' },
        },
        { status: 400 },
      )
    }

    // Build where clause
    const where: any = {
      userId: user.id,
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (status) {
      where.processingStatus = status
    }

    if (tags.length > 0) {
      where.topicTags = {
        hasSome: tags,
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch lectures with pagination
    const [lectures, totalCount] = await Promise.all([
      prisma.lecture.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
            },
          },
          _count: {
            select: {
              contentChunks: true,
              learningObjectives: true,
              cards: true,
            },
          },
        },
      }),
      prisma.lecture.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return Response.json({
      success: true,
      data: {
        lectures: lectures.map((lecture) => ({
          id: lecture.id,
          title: lecture.title,
          fileName: lecture.fileName,
          fileUrl: lecture.fileUrl,
          fileSize: lecture.fileSize,
          processingStatus: lecture.processingStatus,
          uploadedAt: lecture.uploadedAt,
          processedAt: lecture.processedAt,
          weekNumber: lecture.weekNumber,
          topicTags: lecture.topicTags,
          processingProgress: lecture.processingProgress,
          totalPages: lecture.totalPages,
          processedPages: lecture.processedPages,
          processingStartedAt: lecture.processingStartedAt,
          course: lecture.course,
          chunkCount: lecture._count.contentChunks,
          objectiveCount: lecture._count.learningObjectives,
          cardCount: lecture._count.cards,
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch lectures:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch lectures',
          details: { error: errorMessage },
        },
      },
      { status: 500 },
    )
  }
}
