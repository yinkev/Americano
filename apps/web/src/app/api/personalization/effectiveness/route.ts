// GET /api/personalization/effectiveness
// Returns effectiveness metrics for personalization over time period

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse } from '@/lib/api-response';
import { ApiError, withErrorHandler } from '@/lib/api-error';

/**
 * GET /api/personalization/effectiveness
 * Fetch personalization effectiveness metrics
 *
 * @query {
 *   startDate?: ISO date string (default: 14 days ago),
 *   endDate?: ISO date string (default: now),
 *   metric?: "retention" | "performance" | "completion" | "all" (default: all)
 * }
 * @returns Effectiveness metrics with statistical analysis
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate')!)
    : new Date();

  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days ago

  const metricFilter = searchParams.get('metric') || 'all';

  // Validate dates
  if (isNaN(startDate.getTime())) {
    throw ApiError.badRequest('Invalid startDate format. Use ISO date string');
  }
  if (isNaN(endDate.getTime())) {
    throw ApiError.badRequest('Invalid endDate format. Use ISO date string');
  }
  if (startDate >= endDate) {
    throw ApiError.badRequest('startDate must be before endDate');
  }

  // Validate metric
  const validMetrics = ['retention', 'performance', 'completion', 'all'];
  if (!validMetrics.includes(metricFilter)) {
    throw ApiError.badRequest(
      `Invalid metric. Must be one of: ${validMetrics.join(', ')}`
    );
  }

  // For MVP: Use hardcoded Kevy user (auth deferred)
  const user = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
    select: { id: true },
  });

  if (!user) {
    throw ApiError.notFound(
      'User not found. Run: npx prisma db seed to create default user'
    );
  }

  // Get active personalization configs
  const activeConfigs = await prisma.personalizationConfig.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
    select: {
      id: true,
      context: true,
      strategyVariant: true,
      confidenceScore: true,
    },
  });

  if (activeConfigs.length === 0) {
    // No active personalization - return baseline metrics
    return Response.json(
      successResponse({
        effectiveness: {
          hasPersonalization: false,
          message: 'No active personalization. Enable personalization to track effectiveness.',
          baseline: {
            retentionImprovement: 0,
            performanceImprovement: 0,
            completionRateChange: 0,
            engagementChange: 0,
          },
        },
        period: {
          startDate,
          endDate,
          days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        },
      })
    );
  }

  // Get effectiveness metrics for the period
  const effectivenessMetrics = await prisma.personalizationEffectiveness.findMany({
    where: {
      userId: user.id,
      startDate: { gte: startDate },
      endDate: { lte: endDate },
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  // Calculate aggregate metrics
  const aggregateMetrics = {
    retentionImprovement: 0,
    performanceImprovement: 0,
    completionRateChange: 0,
    engagementChange: 0,
    sampleSize: 0,
    avgCorrelation: 0,
    avgPValue: 1.0,
    isStatisticallySignificant: false,
  };

  if (effectivenessMetrics.length > 0) {
    const validMetrics = effectivenessMetrics.filter(
      (m) => m.retentionImprovement !== null || m.performanceImprovement !== null
    );

    if (validMetrics.length > 0) {
      aggregateMetrics.retentionImprovement =
        validMetrics.reduce((sum, m) => sum + (m.retentionImprovement || 0), 0) / validMetrics.length;
      aggregateMetrics.performanceImprovement =
        validMetrics.reduce((sum, m) => sum + (m.performanceImprovement || 0), 0) / validMetrics.length;
      aggregateMetrics.completionRateChange =
        validMetrics.reduce((sum, m) => sum + (m.completionRateChange || 0), 0) / validMetrics.length;
      aggregateMetrics.engagementChange =
        validMetrics.reduce((sum, m) => sum + (m.engagementChange || 0), 0) / validMetrics.length;
      aggregateMetrics.sampleSize = validMetrics.reduce((sum, m) => sum + m.sampleSize, 0);

      const correlations = validMetrics.filter((m) => m.correlation !== null).map((m) => m.correlation!);
      if (correlations.length > 0) {
        aggregateMetrics.avgCorrelation =
          correlations.reduce((sum, c) => sum + c, 0) / correlations.length;
      }

      const pValues = validMetrics.filter((m) => m.pValue !== null).map((m) => m.pValue!);
      if (pValues.length > 0) {
        aggregateMetrics.avgPValue = pValues.reduce((sum, p) => sum + p, 0) / pValues.length;
        aggregateMetrics.isStatisticallySignificant = aggregateMetrics.avgPValue < 0.05;
      }
    }
  }

  // Filter metrics based on query parameter
  let filteredMetrics: any = {};
  if (metricFilter === 'all') {
    filteredMetrics = {
      retentionImprovement: aggregateMetrics.retentionImprovement,
      performanceImprovement: aggregateMetrics.performanceImprovement,
      completionRateChange: aggregateMetrics.completionRateChange,
      engagementChange: aggregateMetrics.engagementChange,
    };
  } else if (metricFilter === 'retention') {
    filteredMetrics = { retentionImprovement: aggregateMetrics.retentionImprovement };
  } else if (metricFilter === 'performance') {
    filteredMetrics = { performanceImprovement: aggregateMetrics.performanceImprovement };
  } else if (metricFilter === 'completion') {
    filteredMetrics = { completionRateChange: aggregateMetrics.completionRateChange };
  }

  // Build response
  const response = {
    effectiveness: {
      hasPersonalization: true,
      metrics: filteredMetrics,
      statistical: {
        sampleSize: aggregateMetrics.sampleSize,
        correlation: aggregateMetrics.avgCorrelation,
        pValue: aggregateMetrics.avgPValue,
        isStatisticallySignificant: aggregateMetrics.isStatisticallySignificant,
      },
      activeConfigs: activeConfigs.map((c) => ({
        context: c.context,
        strategy: c.strategyVariant,
        confidence: c.confidenceScore,
      })),
    },
    period: {
      startDate,
      endDate,
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    },
    timeline: effectivenessMetrics.map((m) => ({
      startDate: m.startDate,
      endDate: m.endDate,
      retentionImprovement: m.retentionImprovement,
      performanceImprovement: m.performanceImprovement,
      completionRateChange: m.completionRateChange,
      compositeScore: m.compositeScore,
      isStatisticallySignificant: m.isStatisticallySignificant,
    })),
  };

  return Response.json(successResponse(response));
});
