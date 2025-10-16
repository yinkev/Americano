import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse } from '@/lib/api-response';
import { withErrorHandler, ApiError } from '@/lib/api-error';
import { PerformanceCalculator } from '@/lib/performance-calculator';
import { z } from 'zod';

/**
 * GET /api/learning/sessions/compare
 * Story 2.5 Task 12.3: Session Comparison Endpoint
 *
 * Compares performance across multiple study sessions to show improvement trends.
 * Used for progress visualization and identifying patterns.
 *
 * Query Parameters:
 * - sessionIds: Comma-separated list of session IDs to compare (required, max 5)
 */

const compareSessionsSchema = z.object({
  sessionIds: z
    .string()
    .transform((val) => val.split(',').filter((id) => id.length > 0))
    .pipe(z.array(z.string()).min(2).max(5)),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  const queryParams = {
    sessionIds: searchParams.get('sessionIds') || '',
  };

  const validatedParams = compareSessionsSchema.parse(queryParams);

  // Get user from header (MVP: no auth)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev';
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw ApiError.notFound('User');
  }

  // Fetch all requested sessions
  const sessions = await prisma.studySession.findMany({
    where: {
      id: { in: validatedParams.sessionIds },
      userId: user.id,
    },
    include: {
      mission: true,
      reviews: {
        include: {
          card: {
            include: {
              objective: true,
            },
          },
        },
      },
    },
    orderBy: {
      startedAt: 'asc',
    },
  });

  // Verify all sessions found and belong to user
  if (sessions.length !== validatedParams.sessionIds.length) {
    const foundIds = sessions.map((s) => s.id);
    const missingIds = validatedParams.sessionIds.filter((id) => !foundIds.includes(id));
    throw ApiError.notFound(
      `Session(s) not found or not accessible: ${missingIds.join(', ')}`
    );
  }

  // Calculate analytics for each session
  const sessionAnalytics = await Promise.all(
    sessions.map(async (session) => {
      const analytics = await PerformanceCalculator.calculateSessionAnalytics(session.id);

      const objectiveCompletions = (session.objectiveCompletions || []) as any[];
      const missionObjectives = (session.missionObjectives || []) as any[];

      return {
        sessionId: session.id,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        durationMs: session.durationMs,
        objectivesCompleted: objectiveCompletions.length,
        totalObjectives: missionObjectives.length,
        completionRate:
          missionObjectives.length > 0
            ? objectiveCompletions.length / missionObjectives.length
            : 0,
        cardAccuracy: analytics.cards.accuracy,
        totalCardsReviewed: analytics.cards.totalReviewed,
        averageCardTimeMs: analytics.cards.averageTimeMs,
        cardsByRating: analytics.cards.byRating,
        averageObjectiveTimeMs: analytics.timeBreakdown.averageObjectiveMs,
        totalObjectiveTimeMs: analytics.timeBreakdown.totalObjectiveMs,
        averageSelfAssessment:
          analytics.objectives.length > 0
            ? analytics.objectives.reduce(
                (sum, o) => sum + (o.selfAssessment || 0),
                0
              ) / analytics.objectives.length
            : null,
        averageConfidenceRating:
          analytics.objectives.length > 0
            ? analytics.objectives.reduce(
                (sum, o) => sum + (o.confidenceRating || 0),
                0
              ) / analytics.objectives.length
            : null,
      };
    })
  );

  // Calculate comparison metrics and trends
  const comparison = {
    sessions: sessionAnalytics,
    trends: calculateTrends(sessionAnalytics),
    improvements: calculateImprovements(sessionAnalytics),
  };

  return Response.json(successResponse(comparison));
});

/**
 * Calculate trends across sessions (e.g., improving, stable, declining)
 */
function calculateTrends(sessions: Array<{
  cardAccuracy: number;
  averageSelfAssessment: number | null;
  completionRate: number;
  averageObjectiveTimeMs: number;
}>) {
  if (sessions.length < 2) {
    return null;
  }

  const first = sessions[0];
  const last = sessions[sessions.length - 1];

  return {
    cardAccuracy: {
      trend: getTrendDirection(first.cardAccuracy, last.cardAccuracy),
      change: last.cardAccuracy - first.cardAccuracy,
      percentChange:
        first.cardAccuracy > 0
          ? ((last.cardAccuracy - first.cardAccuracy) / first.cardAccuracy) * 100
          : 0,
    },
    selfAssessment: {
      trend:
        first.averageSelfAssessment !== null && last.averageSelfAssessment !== null
          ? getTrendDirection(first.averageSelfAssessment, last.averageSelfAssessment)
          : 'unknown',
      change:
        first.averageSelfAssessment !== null && last.averageSelfAssessment !== null
          ? last.averageSelfAssessment - first.averageSelfAssessment
          : null,
    },
    completionRate: {
      trend: getTrendDirection(first.completionRate, last.completionRate),
      change: last.completionRate - first.completionRate,
      percentChange:
        first.completionRate > 0
          ? ((last.completionRate - first.completionRate) / first.completionRate) * 100
          : 0,
    },
    efficiency: {
      trend: getTrendDirection(
        last.averageObjectiveTimeMs, // Inverted: lower is better
        first.averageObjectiveTimeMs
      ),
      change: last.averageObjectiveTimeMs - first.averageObjectiveTimeMs,
      percentChange:
        first.averageObjectiveTimeMs > 0
          ? ((last.averageObjectiveTimeMs - first.averageObjectiveTimeMs) /
              first.averageObjectiveTimeMs) *
            100
          : 0,
    },
  };
}

/**
 * Get trend direction based on value comparison
 */
function getTrendDirection(
  firstValue: number,
  lastValue: number
): 'improving' | 'stable' | 'declining' {
  const percentChange = Math.abs(((lastValue - firstValue) / firstValue) * 100);

  if (percentChange < 5) {
    return 'stable';
  }

  return lastValue > firstValue ? 'improving' : 'declining';
}

/**
 * Calculate specific improvements and areas of concern
 */
function calculateImprovements(sessions: Array<{
  cardAccuracy: number;
  averageSelfAssessment: number | null;
  averageConfidenceRating: number | null;
  completionRate: number;
  totalCardsReviewed: number;
  averageObjectiveTimeMs: number;
}>) {
  if (sessions.length < 2) {
    return [];
  }

  const improvements: string[] = [];
  const first = sessions[0];
  const last = sessions[sessions.length - 1];

  // Card accuracy improvements
  const accuracyImprovement = last.cardAccuracy - first.cardAccuracy;
  if (accuracyImprovement > 0.1) {
    improvements.push(
      `Card accuracy improved by ${(accuracyImprovement * 100).toFixed(0)}%`
    );
  } else if (accuracyImprovement < -0.1) {
    improvements.push(
      `Card accuracy declined by ${Math.abs(accuracyImprovement * 100).toFixed(0)}% - review fundamentals`
    );
  }

  // Self-assessment improvements
  if (
    first.averageSelfAssessment !== null &&
    last.averageSelfAssessment !== null
  ) {
    const assessmentImprovement =
      last.averageSelfAssessment - first.averageSelfAssessment;
    if (assessmentImprovement > 0.5) {
      improvements.push(
        `Self-assessed mastery increased by ${assessmentImprovement.toFixed(1)} stars`
      );
    } else if (assessmentImprovement < -0.5) {
      improvements.push(
        `Self-assessed mastery decreased by ${Math.abs(assessmentImprovement).toFixed(1)} stars`
      );
    }
  }

  // Confidence improvements
  if (
    first.averageConfidenceRating !== null &&
    last.averageConfidenceRating !== null
  ) {
    const confidenceImprovement =
      last.averageConfidenceRating - first.averageConfidenceRating;
    if (confidenceImprovement > 0.5) {
      improvements.push(
        `Confidence increased by ${confidenceImprovement.toFixed(1)} stars`
      );
    }
  }

  // Completion rate improvements
  const completionImprovement = last.completionRate - first.completionRate;
  if (completionImprovement > 0.2) {
    improvements.push(
      `Mission completion rate improved by ${(completionImprovement * 100).toFixed(0)}%`
    );
  }

  // Time efficiency improvements
  const timeChange = last.averageObjectiveTimeMs - first.averageObjectiveTimeMs;
  const timePercentChange =
    first.averageObjectiveTimeMs > 0
      ? (timeChange / first.averageObjectiveTimeMs) * 100
      : 0;
  if (timePercentChange < -10) {
    improvements.push(
      `Study efficiency improved - ${Math.abs(timePercentChange).toFixed(0)}% faster per objective`
    );
  }

  // Volume improvements
  const cardVolumeChange = last.totalCardsReviewed - first.totalCardsReviewed;
  if (cardVolumeChange > 5) {
    improvements.push(
      `Increased review volume by ${cardVolumeChange} cards per session`
    );
  }

  return improvements;
}
