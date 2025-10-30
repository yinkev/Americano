// /api/content/courses/[id] route
// GET: Fetch single course details
// PATCH: Update course
// DELETE: Delete course (with safety checks)

import type { NextRequest } from 'next/server'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { updateCourseSchema, validateRequest } from '@/lib/validation'

/**
 * GET /api/content/courses/[id]
 * Fetch single course with lecture count
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lectures: true },
        },
      },
    })

    if (!course) {
      throw ApiError.notFound('Course not found')
    }

    return Response.json(
      successResponse({
        course: {
          ...course,
          lectureCount: course._count.lectures,
        },
      }),
    )
  },
)

/**
 * PATCH /api/content/courses/[id]
 * Update course details
 */
export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    // Validate request body
    const data = await validateRequest(request, updateCourseSchema)

    // Update course
    try {
      const course = await prisma.course.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.code !== undefined && { code: data.code?.trim() || null }),
          ...(data.term !== undefined && { term: data.term?.trim() || null }),
          ...(data.color !== undefined && { color: data.color || null }),
        },
      })

      return Response.json(successResponse({ course }))
    } catch (error: any) {
      // Handle Prisma not found error
      if (error?.code === 'P2025') {
        throw ApiError.notFound('Course not found')
      }
      throw error
    }
  },
)

/**
 * DELETE /api/content/courses/[id]
 * Delete course (with safety check - prevents deletion if course has lectures)
 */
export const DELETE = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    // Safety check: Cannot delete course with lectures
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lectures: true },
        },
      },
    })

    if (!course) {
      throw ApiError.notFound('Course not found')
    }

    if (course._count.lectures > 0) {
      throw ApiError.validation(
        `Cannot delete course with ${course._count.lectures} lecture(s). Please move or delete lectures first.`,
        { lectureCount: course._count.lectures },
      )
    }

    // Delete course
    await prisma.course.delete({
      where: { id },
    })

    return Response.json(successResponse({ deleted: true }))
  },
)
