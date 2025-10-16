/**
 * Mission Reviews API Endpoint
 *
 * GET /api/analytics/reviews - Get all reviews for a user
 * POST /api/analytics/reviews - Generate a new review (weekly or monthly)
 *
 * Story 2.6: Task 7 - Weekly/Monthly Review System
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { MissionReviewEngine } from '@/lib/mission-review-engine'
import { ReviewPeriod } from '@/generated/prisma'
import {
  successResponse,
  errorResponse,
  withErrorHandler,
} from '@/lib/api-response'

// Zod validation schemas
const GetReviewsQuerySchema = z.object({
  period: z.enum(['WEEK', 'MONTH']).optional(),
})

const GenerateReviewBodySchema = z.object({
  period: z.enum(['WEEK', 'MONTH']),
  startDate: z.string().datetime().optional(),
})

/**
 * GET /api/analytics/reviews
 *
 * Retrieves all mission reviews for the authenticated user.
 * Optionally filter by review period (weekly or monthly).
 *
 * Query Parameters:
 * - period: 'WEEK' | 'MONTH' (optional)
 *
 * Response:
 * {
 *   reviews: [{
 *     id: string
 *     period: 'WEEK' | 'MONTH'
 *     startDate: string
 *     endDate: string
 *     summary: { missionsCompleted, totalTime, avgSuccessScore, ... }
 *     highlights: { longestStreak, bestPerformance, topObjectives, personalBests }
 *     insights: { patterns, correlations, improvements, concerns }
 *     recommendations: { actionItems, adjustments }
 *     generatedAt: string
 *   }]
 * }
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // MVP: Get user from X-User-Email header
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'

  // Get user ID from email
  const { prisma } = await import('@/lib/db')
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(errorResponse('USER_NOT_FOUND', 'User not found'), { status: 404 })
  }

  // Parse and validate query parameters
  const { searchParams } = new URL(request.url)
  const queryParams = {
    period: searchParams.get('period'),
  }

  const validatedParams = GetReviewsQuerySchema.parse(queryParams)

  // Get reviews using MissionReviewEngine
  const reviewEngine = new MissionReviewEngine()
  const reviews = await reviewEngine.getUserReviews(
    user.id,
    validatedParams.period as ReviewPeriod | undefined
  )

  return Response.json(successResponse({
    reviews: reviews.map((review) => ({
      id: review.id,
      period: review.period,
      startDate: review.startDate.toISOString(),
      endDate: review.endDate.toISOString(),
      summary: review.summary,
      highlights: review.highlights,
      insights: review.insights,
      recommendations: review.recommendations,
      generatedAt: review.generatedAt.toISOString(),
    })),
  }))
})

/**
 * POST /api/analytics/reviews
 *
 * Generates a new mission review (weekly or monthly).
 * If review already exists for the period, returns existing review.
 *
 * Request Body:
 * {
 *   period: 'WEEK' | 'MONTH'
 *   startDate?: string (ISO 8601 datetime, optional)
 * }
 *
 * Response:
 * {
 *   review: {
 *     id: string
 *     period: 'WEEK' | 'MONTH'
 *     startDate: string
 *     endDate: string
 *     summary: { ... }
 *     highlights: { ... }
 *     insights: { ... }
 *     recommendations: { ... }
 *     generatedAt: string
 *   }
 * }
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // MVP: Get user from X-User-Email header
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'

  // Get user ID from email
  const { prisma } = await import('@/lib/db')
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(errorResponse('USER_NOT_FOUND', 'User not found'), { status: 404 })
  }

  // Parse and validate request body
  const body = await request.json()
  const validatedBody = GenerateReviewBodySchema.parse(body)

  const startDate = validatedBody.startDate
    ? new Date(validatedBody.startDate)
    : undefined

  // Generate review using MissionReviewEngine
  const reviewEngine = new MissionReviewEngine()
  let review

  if (validatedBody.period === 'WEEK') {
    review = await reviewEngine.generateWeeklyReview(user.id, startDate)
  } else {
    review = await reviewEngine.generateMonthlyReview(user.id, startDate)
  }

  return Response.json(
    successResponse({
      review: {
        id: review.id,
        period: review.period,
        startDate: review.startDate.toISOString(),
        endDate: review.endDate.toISOString(),
        summary: review.summary,
        highlights: review.highlights,
        insights: review.insights,
        recommendations: review.recommendations,
        generatedAt: review.generatedAt.toISOString(),
      },
    }),
    { status: 201 }
  )
})
