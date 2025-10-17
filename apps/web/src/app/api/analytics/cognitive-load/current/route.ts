/**
 * GET /api/analytics/cognitive-load/current
 *
 * Get user's current cognitive load state
 * Story 5.4 Task 6.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Find most recent cognitive load metric from active session
    const recentMetric = await prisma.cognitiveLoadMetric.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      include: {
        session: {
          select: {
            id: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });

    if (!recentMetric) {
      return NextResponse.json({
        success: true,
        loadScore: null,
        loadLevel: null,
        stressIndicators: [],
        timestamp: null,
        trend: null,
        sessionActive: false,
      });
    }

    // Determine load level
    const loadLevel =
      recentMetric.loadScore >= 80 ? 'CRITICAL' :
      recentMetric.loadScore >= 60 ? 'HIGH' :
      recentMetric.loadScore >= 40 ? 'MODERATE' : 'LOW';

    // Calculate trend (compare to previous metric)
    const previousMetric = await prisma.cognitiveLoadMetric.findFirst({
      where: {
        userId,
        timestamp: { lt: recentMetric.timestamp },
      },
      orderBy: { timestamp: 'desc' },
    });

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (previousMetric) {
      const loadChange = recentMetric.loadScore - previousMetric.loadScore;
      if (loadChange > 10) trend = 'up';
      else if (loadChange < -10) trend = 'down';
    }

    const sessionActive = recentMetric.session?.completedAt === null;

    return NextResponse.json({
      success: true,
      loadScore: recentMetric.loadScore,
      loadLevel,
      stressIndicators: recentMetric.stressIndicators,
      timestamp: recentMetric.timestamp,
      trend,
      sessionActive,
      confidenceLevel: recentMetric.confidenceLevel,
    });
  } catch (error) {
    console.error('Error fetching current cognitive load:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch current cognitive load' },
      { status: 500 }
    );
  }
}
