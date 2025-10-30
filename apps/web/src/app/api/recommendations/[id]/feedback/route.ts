/**
 * Story 3.5: Recommendation Feedback API
 * POST /api/recommendations/[id]/feedback - Submit feedback for a recommendation
 */

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

// ============================================
// Validation Schema
// ============================================

const FeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedbackText: z.string().optional(),
  helpful: z.boolean().optional(),
})

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Hard-coded user for MVP
    const userId = 'kevy@americano.dev'

    // Get recommendation ID from params
    const { id: recommendationId } = await params

    // Parse and validate request body
    const body = await request.json()
    const validatedBody = FeedbackSchema.safeParse(body)

    if (!validatedBody.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request body',
          validatedBody.error.issues,
        ),
        { status: 400 },
      )
    }

    const { rating, feedbackText, helpful } = validatedBody.data

    // Check if recommendation exists
    const recommendation = await prisma.contentRecommendation.findUnique({
      where: { id: recommendationId },
    })

    if (!recommendation) {
      return NextResponse.json(errorResponse(ErrorCodes.NOT_FOUND, 'Recommendation not found'), {
        status: 404,
      })
    }

    // Create feedback
    const feedback = await prisma.recommendationFeedback.create({
      data: {
        recommendationId,
        userId,
        rating,
        feedbackText,
        helpful,
      },
    })

    // Update recommendation status to RATED
    const updatedRecommendation = await prisma.contentRecommendation.update({
      where: { id: recommendationId },
      data: { status: 'RATED' },
    })

    // Track behavioral event
    await prisma.behavioralEvent.create({
      data: {
        userId,
        eventType: 'RECOMMENDATION_RATED',
        eventData: {
          recommendationId,
          rating,
          helpful,
        },
      },
    })

    return NextResponse.json(
      successResponse({
        success: true,
        feedback,
        updatedScore: updatedRecommendation.score,
      }),
      { status: 201 },
    )
  } catch (error) {
    console.error('[POST /api/recommendations/[id]/feedback] Error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(errorResponse(error.code, error.message), {
        status: error.statusCode,
      })
    }

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to submit feedback'),
      { status: 500 },
    )
  }
}
