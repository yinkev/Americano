/**
 * Story 3.5: Recommendation Analytics API
 * GET /api/analytics/recommendations - Get recommendation performance analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, ApiError, ErrorCodes } from '@/lib/api-response';

// ============================================
// Validation Schema
// ============================================

const QuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).optional().default('7d'),
});

// ============================================
// GET Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Hard-coded user for MVP
    const userId = 'kevy@americano.dev';

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = QuerySchema.safeParse(queryParams);

    if (!validatedParams.success) {
      return NextResponse.json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid query parameters', validatedParams.error.issues), { status: 400 });
    }

    const { period } = validatedParams.data;

    // Calculate date range
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch recommendations in period
    const recommendations = await prisma.contentRecommendation.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      include: {
        feedback: true,
      },
    });

    // Calculate metrics
    const totalRecommendations = recommendations.length;
    const viewedCount = recommendations.filter(r => r.viewedAt !== null).length;
    const dismissedCount = recommendations.filter(r => r.status === 'DISMISSED').length;

    // Fetch behavioral events for click tracking
    const clickEvents = await prisma.behavioralEvent.findMany({
      where: {
        userId,
        eventType: 'RECOMMENDATION_CLICKED',
        timestamp: { gte: startDate },
      },
    });
    const clickedCount = clickEvents.length;

    // Calculate CTR (click-through rate)
    const ctr = totalRecommendations > 0 ? clickedCount / totalRecommendations : 0;

    // Calculate average rating
    const allFeedback = recommendations.flatMap(r => r.feedback);
    const avgRating = allFeedback.length > 0
      ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length
      : 0;

    // Calculate average engagement time (placeholder - would track actual time)
    const avgEngagementTimeMs = 0; // Would calculate from time-on-content tracking

    // Calculate top source types
    const sourceTypeCounts: Record<string, number> = {};
    for (const rec of recommendations) {
      sourceTypeCounts[rec.sourceType] = (sourceTypeCounts[rec.sourceType] || 0) + 1;
    }

    const topSources = Object.entries(sourceTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate improvement correlation (placeholder)
    // Would correlate recommendation engagement with performance metrics
    const improvementCorrelation = 0; // Placeholder

    return NextResponse.json(successResponse({
      period,
      startDate,
      endDate: new Date(),
      metrics: {
        totalRecommendations,
        viewedCount,
        clickedCount,
        dismissedCount,
        ctr: parseFloat(ctr.toFixed(3)),
        avgRating: parseFloat(avgRating.toFixed(2)),
        avgEngagementTimeMs,
        topSources,
        improvementCorrelation,
      },
    }));
  } catch (error) {
    console.error('[GET /api/analytics/recommendations] Error:', error);

    if (error instanceof ApiError) {
      return NextResponse.json(errorResponse(error.code, error.message), { status: error.statusCode });
    }

    return NextResponse.json(errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch recommendation analytics'), { status: 500 });
  }
}
