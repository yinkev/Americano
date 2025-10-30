/**
 * Exam Management API - UPDATE and DELETE
 * Story 2.3: Intelligent Content Prioritization Algorithm
 */

import type { NextRequest } from 'next/server'
import { ApiError, successResponse, withErrorHandler } from '@/lib/api-response'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createExamSchema } from '@/lib/validation/exam'

/**
 * PATCH /api/exams/[id] - Update exam
 */
async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  const { id } = await params
  const body = await request.json()

  // Validate input
  const validation = createExamSchema.safeParse(body)
  if (!validation.success) {
    throw new ApiError(validation.error.issues[0].message, 400)
  }

  const { name, date, courseId, coverageTopics } = validation.data

  // Verify exam exists and belongs to user
  const existingExam = await prisma.exam.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!existingExam) {
    throw new ApiError('Exam not found', 404)
  }

  // Verify course exists and belongs to user
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      userId,
    },
  })

  if (!course) {
    throw new ApiError('Course not found', 404)
  }

  // Update exam
  const exam = await prisma.exam.update({
    where: { id },
    data: {
      name,
      date,
      courseId,
      coverageTopics,
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  })

  return Response.json(successResponse({ exam }))
}

/**
 * DELETE /api/exams/[id] - Delete exam
 */
async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  const { id } = await params

  // Verify exam exists and belongs to user
  const existingExam = await prisma.exam.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!existingExam) {
    throw new ApiError('Exam not found', 404)
  }

  // Delete exam
  await prisma.exam.delete({
    where: { id },
  })

  return Response.json(successResponse({ message: 'Exam deleted successfully' }))
}

const PATCHHandler = withErrorHandler(PATCH)
const DELETEHandler = withErrorHandler(DELETE)

export { PATCHHandler as PATCH, DELETEHandler as DELETE }
