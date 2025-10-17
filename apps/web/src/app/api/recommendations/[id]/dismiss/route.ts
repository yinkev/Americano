/**
 * Story 3.5: Recommendation Dismiss API
 * POST /api/recommendations/[id]/dismiss - Dismiss a recommendation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, ApiError, ErrorCodes } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Hard-coded user for MVP
    const userId = 'kevy@americano.dev';

    // Get recommendation ID from params
    const { id: recommendationId } = await params;

    // Check if recommendation exists
    const recommendation = await prisma.contentRecommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      return NextResponse.json(errorResponse(ErrorCodes.NOT_FOUND, 'Recommendation not found'), { status: 404 });
    }

    // Update recommendation status to DISMISSED
    await prisma.contentRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: 'DISMISSED',
        dismissedAt: new Date(),
      },
    });

    // Track behavioral event
    await prisma.behavioralEvent.create({
      data: {
        userId,
        eventType: 'RECOMMENDATION_DISMISSED',
        eventData: {
          recommendationId,
          contentId: recommendation.recommendedContentId,
        },
      },
    });

    return NextResponse.json(successResponse({ success: true }));
  } catch (error) {
    console.error('[POST /api/recommendations/[id]/dismiss] Error:', error);

    if (error instanceof ApiError) {
      return NextResponse.json(errorResponse(error.code, error.message), { status: error.statusCode });
    }

    return NextResponse.json(errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to dismiss recommendation'), { status: 500 });
  }
}
