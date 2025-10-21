/**
 * Exam Management API - GET and POST
 * Story 2.3: Intelligent Content Prioritization Algorithm
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, ApiError } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-response'
import { createExamSchema } from '@/lib/validation/exam'
import { getCurrentUserId } from '@/lib/auth'

/**
 * GET /api/exams - List exams with filters
 *
 * Query Parameters:
 * @param request.searchParams.upcoming - Filter for upcoming exams only (boolean)
 * @param request.searchParams.courseId - Filter by specific course ID
 *
 * @returns {Promise<Response>} JSON response with exams array
 * @example
 * GET /api/exams?upcoming=true
 * Response: { status: "success", data: [{ id, name, date, course }] }
 */
async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  const { searchParams } = request.nextUrl
  const upcoming = searchParams.get('upcoming') === 'true'
  const courseId = searchParams.get('courseId')

  const where: any = {
    userId,
  }

  if (upcoming) {
    where.date = { gte: new Date() }
  }

  if (courseId) {
    where.courseId = courseId
  }

  const exams = await prisma.exam.findMany({
    where,
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  // Find next upcoming exam
  const nextExam = upcoming && exams.length > 0 ? exams[0] : undefined

  return Response.json(successResponse(exams))
}

/**
 * POST /api/exams - Create new exam
 *
 * Request Body:
 * @param {string} name - Exam name (1-100 characters)
 * @param {Date} date - Exam date (must be in future)
 * @param {string} courseId - Course ID (cuid format)
 * @param {string[]} coverageTopics - Array of topic strings (1-20 items)
 *
 * @returns {Promise<Response>} JSON response with created exam object
 * @throws {ApiError} 400 - Validation error
 * @throws {ApiError} 404 - Course not found or doesn't belong to user
 * @example
 * POST /api/exams
 * Body: { name: "Midterm", date: "2025-11-15", courseId: "abc123", coverageTopics: ["topic1"] }
 * Response: { status: "success", data: { exam } }
 */
async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  const body = await request.json()

  // Validate input
  const validation = createExamSchema.safeParse(body)
  if (!validation.success) {
    throw new ApiError(validation.error.issues[0].message, 400)
  }

  const { name, date, courseId, coverageTopics } = validation.data

  // Verify course exists and belongs to user
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      userId,
    },
  })

  if (!course) {
    throw new ApiError(`Course ${courseId} not found or does not belong to user`, 404)
  }

  // Create exam
  const exam = await prisma.exam.create({
    data: {
      userId,
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

  return Response.json(successResponse({ exam }), { status: 201 })
}

const GETHandler = withErrorHandler(GET)
const POSTHandler = withErrorHandler(POST)

export { GETHandler as GET, POSTHandler as POST }
