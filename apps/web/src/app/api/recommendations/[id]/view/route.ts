/**
 * Story 3.5: Recommendation View Tracking API
 * POST /api/recommendations/[id]/view - Track when a recommendation is viewed
 */

import { type NextRequest, NextResponse } from 'next/server'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Hard-coded user for MVP
    const userId = 'kevy@americano.dev'

    // Get recommendation ID from params
    const { id: recommendationId } = await params

    // Check if recommendation exists
    const recommendation = await prisma.contentRecommendation.findUnique({
      where: { id: recommendationId },
    })

    if (!recommendation) {
      return NextResponse.json(errorResponse(ErrorCodes.NOT_FOUND, 'Recommendation not found'), {
        status: 404,
      })
    }

    // Update recommendation status to VIEWED if not already
    if (recommendation.status === 'PENDING') {
      await prisma.contentRecommendation.update({
        where: { id: recommendationId },
        data: {
          status: 'VIEWED',
          viewedAt: new Date(),
        },
      })
    }

    // Track behavioral event
    await prisma.behavioralEvent.create({
      data: {
        userId,
        eventType: 'RECOMMENDATION_VIEWED',
        eventData: {
          recommendationId,
          contentId: recommendation.recommendedContentId,
          score: recommendation.score,
        },
      },
    })

    // Track click event as well (user clicked to view the content)
    await prisma.behavioralEvent.create({
      data: {
        userId,
        eventType: 'RECOMMENDATION_CLICKED',
        eventData: {
          recommendationId,
          contentId: recommendation.recommendedContentId,
          timestamp: new Date(),
        },
      },
    })

    return NextResponse.json(successResponse({ success: true }))
  } catch (error) {
    console.error('[POST /api/recommendations/[id]/view] Error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(errorResponse(error.code, error.message), {
        status: error.statusCode,
      })
    }

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to track recommendation view'),
      { status: 500 },
    )
  }
}
