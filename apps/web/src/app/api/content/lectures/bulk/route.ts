// /api/content/lectures/bulk route
// POST: Perform bulk operations on multiple lectures (move, tag, delete)

import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getStorageProvider } from '@/lib/storage'

type BulkAction = 'move' | 'tag' | 'delete'

interface BulkOperationRequest {
  lectureIds: string[]
  action: BulkAction
  data?: {
    courseId?: string
    tags?: string[]
    addTags?: boolean // true = append tags, false = replace tags
  }
}

export async function POST(request: NextRequest) {
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

    const body: BulkOperationRequest = await request.json()
    const { lectureIds, action, data } = body

    // Validate request
    if (!Array.isArray(lectureIds) || lectureIds.length === 0) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'MISSING_LECTURE_IDS',
            message: 'lectureIds array is required and must not be empty',
          },
        },
        { status: 400 },
      )
    }

    if (lectureIds.length > 50) {
      return Response.json(
        {
          success: false,
          error: { code: 'TOO_MANY_LECTURES', message: 'Maximum 50 lectures per bulk operation' },
        },
        { status: 400 },
      )
    }

    if (!action || !['move', 'tag', 'delete'].includes(action)) {
      return Response.json(
        {
          success: false,
          error: { code: 'INVALID_ACTION', message: 'Action must be one of: move, tag, delete' },
        },
        { status: 400 },
      )
    }

    // Verify all lectures belong to the user
    const lectureCount = await prisma.lecture.count({
      where: {
        id: { in: lectureIds },
        userId: user.id,
      },
    })

    if (lectureCount !== lectureIds.length) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'LECTURES_NOT_FOUND',
            message: 'Some lectures not found or do not belong to user',
          },
        },
        { status: 404 },
      )
    }

    // Perform bulk operation based on action
    let result

    switch (action) {
      case 'move': {
        if (!data?.courseId) {
          return Response.json(
            {
              success: false,
              error: { code: 'MISSING_COURSE_ID', message: 'courseId is required for move action' },
            },
            { status: 400 },
          )
        }

        // Verify course exists
        const course = await prisma.course.findUnique({
          where: { id: data.courseId },
        })

        if (!course) {
          return Response.json(
            { success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found' } },
            { status: 404 },
          )
        }

        // Move lectures to new course
        result = await prisma.lecture.updateMany({
          where: { id: { in: lectureIds } },
          data: { courseId: data.courseId },
        })

        return Response.json({
          success: true,
          action: 'move',
          affectedCount: result.count,
          message: `${result.count} lecture(s) moved to course: ${course.name}`,
        })
      }

      case 'tag':
        if (!data?.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
          return Response.json(
            {
              success: false,
              error: { code: 'MISSING_TAGS', message: 'tags array is required for tag action' },
            },
            { status: 400 },
          )
        }

        // Validate tags
        if (data.tags.length > 10) {
          return Response.json(
            {
              success: false,
              error: { code: 'TOO_MANY_TAGS', message: 'Maximum 10 tags allowed' },
            },
            { status: 400 },
          )
        }

        for (const tag of data.tags) {
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

        if (data.addTags) {
          // Append tags to existing tags
          const lectures = await prisma.lecture.findMany({
            where: { id: { in: lectureIds } },
            select: { id: true, topicTags: true },
          })

          const updates = lectures.map((lecture) => {
            const existingTags = lecture.topicTags || []
            const newTags = Array.from(new Set([...existingTags, ...data.tags!]))
            return prisma.lecture.update({
              where: { id: lecture.id },
              data: { topicTags: newTags.slice(0, 10) }, // Enforce 10 tag limit
            })
          })

          await prisma.$transaction(updates)

          return Response.json({
            success: true,
            action: 'tag',
            affectedCount: lectures.length,
            message: `Tags added to ${lectures.length} lecture(s)`,
          })
        } else {
          // Replace tags
          result = await prisma.lecture.updateMany({
            where: { id: { in: lectureIds } },
            data: { topicTags: data.tags },
          })

          return Response.json({
            success: true,
            action: 'tag',
            affectedCount: result.count,
            message: `Tags updated for ${result.count} lecture(s)`,
          })
        }

      case 'delete': {
        // Fetch all lectures to get file URLs before deletion
        const lecturesToDelete = await prisma.lecture.findMany({
          where: { id: { in: lectureIds } },
          select: { id: true, fileUrl: true, title: true },
        })

        // Delete lectures from database (cascades to ContentChunks and LearningObjectives)
        const deleteResult = await prisma.lecture.deleteMany({
          where: { id: { in: lectureIds } },
        })

        // Delete PDF files from storage (best-effort, don't fail if some deletions fail)
        const storage = getStorageProvider()
        const deletionResults = await Promise.allSettled(
          lecturesToDelete.map((lecture) => storage.delete(lecture.fileUrl)),
        )

        const failedDeletions = deletionResults.filter((r) => r.status === 'rejected').length
        if (failedDeletions > 0) {
          console.warn(`Failed to delete ${failedDeletions} PDF file(s) from storage`)
        }

        return Response.json({
          success: true,
          action: 'delete',
          affectedCount: deleteResult.count,
          message: `${deleteResult.count} lecture(s) deleted successfully`,
          storageCleanup: {
            total: lecturesToDelete.length,
            succeeded: deletionResults.filter((r) => r.status === 'fulfilled').length,
            failed: failedDeletions,
          },
        })
      }

      default:
        return Response.json(
          { success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action' } },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('Failed to perform bulk operation:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: {
          code: 'BULK_OPERATION_FAILED',
          message: 'Failed to perform bulk operation',
          details: { error: errorMessage },
        },
      },
      { status: 500 },
    )
  }
}
