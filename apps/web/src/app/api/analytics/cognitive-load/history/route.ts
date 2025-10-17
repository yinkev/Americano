/**
 * GET /api/analytics/cognitive-load/history
 *
 * Get time-series cognitive load data for visualization
 * Story 5.4 Task 6.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const granularity = searchParams.get('granularity') || 'hour'; // 'hour' | 'day' | 'week'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Default to last 7 days if no date range provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : subDays(endDate, 7);

    // Fetch cognitive load metrics in date range
    const metrics = await prisma.cognitiveLoadMetric.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        timestamp: true,
        loadScore: true,
        stressIndicators: true,
        confidenceLevel: true,
        sessionId: true,
      },
    });

    // Transform data based on granularity
    const dataPoints = metrics.map(metric => ({
      timestamp: metric.timestamp,
      loadScore: metric.loadScore,
      loadLevel:
        metric.loadScore >= 80 ? 'CRITICAL' :
        metric.loadScore >= 60 ? 'HIGH' :
        metric.loadScore >= 40 ? 'MODERATE' : 'LOW',
      stressIndicators: metric.stressIndicators,
      sessionId: metric.sessionId,
      confidenceLevel: metric.confidenceLevel,
    }));

    // Calculate summary statistics
    const avgLoad = dataPoints.length > 0
      ? dataPoints.reduce((sum, d) => sum + d.loadScore, 0) / dataPoints.length
      : 0;

    const maxLoad = dataPoints.length > 0
      ? Math.max(...dataPoints.map(d => d.loadScore))
      : 0;

    const overloadEpisodes = dataPoints.filter(d => d.loadScore > 80).length;

    return NextResponse.json({
      success: true,
      dataPoints,
      summary: {
        avgLoad,
        maxLoad,
        overloadEpisodes,
        totalDataPoints: dataPoints.length,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching cognitive load history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cognitive load history' },
      { status: 500 }
    );
  }
}
