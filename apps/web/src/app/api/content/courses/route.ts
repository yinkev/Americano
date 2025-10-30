// /api/content/courses route
// GET: List all courses for current user
// POST: Create new course

import type { NextRequest } from 'next/server'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { createCourseSchema, validateRequest } from '@/lib/validation'

/**
 * GET /api/content/courses
 * List all courses for current user with lecture counts
 * Auth: Deferred for MVP - uses hardcoded Kevy user
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Get Kevy user (auth deferred for MVP)
  const user = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
  })

  if (!user) {
    throw ApiError.notFound('User not found. Run: npx prisma db seed')
  }

  // Fetch all courses for this user with lecture counts
  const courses = await prisma.course.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      code: true,
      term: true,
      color: true,
      createdAt: true,
      _count: {
        select: { lectures: true },
      },
    },
  })

  return Response.json(
    successResponse({
      courses: courses.map((course) => ({
        ...course,
        lectureCount: course._count.lectures,
      })),
    }),
  )
})

/**
 * POST /api/content/courses
 * Create a new course
 * Auth: Deferred for MVP - uses hardcoded Kevy user
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Get Kevy user (auth deferred for MVP)
  const user = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
  })

  if (!user) {
    throw ApiError.notFound('User not found. Run: npx prisma db seed')
  }

  // Validate request body
  const data = await validateRequest(request, createCourseSchema)

  // Create course
  const course = await prisma.course.create({
    data: {
      userId: user.id,
      name: data.name.trim(),
      code: data.code?.trim() || null,
      term: data.term?.trim() || null,
      color: data.color || null,
    },
  })

  return Response.json(successResponse({ course }), { status: 201 })
})
