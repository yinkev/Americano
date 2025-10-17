/**
 * GET /api/analytics/stress-patterns
 *
 * Get identified stress response patterns
 * Story 5.4 Task 6.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StressPatternType } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.6');
    const patternType = searchParams.get('patternType') as StressPatternType | null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Build query filters
    const whereClause: any = {
      userId,
      confidence: { gte: minConfidence },
    };

    if (patternType) {
      whereClause.patternType = patternType;
    }

    // Fetch stress patterns
    const patterns = await prisma.stressResponsePattern.findMany({
      where: whereClause,
      orderBy: [
        { confidence: 'desc' },
        { frequency: 'desc' },
      ],
    });

    // Transform patterns for response
    const patternsData = patterns.map(pattern => ({
      id: pattern.id,
      patternType: pattern.patternType,
      triggerConditions: pattern.triggerConditions,
      responseProfile: pattern.responseProfile,
      frequency: pattern.frequency,
      confidence: pattern.confidence,
      detectedAt: pattern.detectedAt,
      lastOccurrence: pattern.lastOccurrence,
    }));

    // Calculate summary statistics
    const patternTypeDistribution = patterns.reduce((acc, p) => {
      acc[p.patternType] = (acc[p.patternType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgConfidence = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 0;

    return NextResponse.json({
      success: true,
      patterns: patternsData,
      summary: {
        totalPatterns: patterns.length,
        avgConfidence,
        patternTypeDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching stress patterns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stress patterns' },
      { status: 500 }
    );
  }
}
