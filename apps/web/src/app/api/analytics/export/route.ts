// /api/analytics/export route
// GET: Export all behavioral data as JSON (Story 5.1 Task 11)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse } from '@/lib/api-response';
import { ApiError, withErrorHandler } from '@/lib/api-error';

/**
 * GET /api/analytics/export
 * Export all behavioral data for the current user as JSON
 * Returns:
 * - exportedAt: ISO timestamp
 * - userId: user ID
 * - patterns: all BehavioralPattern records
 * - insights: all BehavioralInsight records
 * - learningProfile: UserLearningProfile record
 *
 * @returns JSON export of behavioral data (FERPA compliance)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // For MVP: Use hardcoded Kevy user (auth deferred)
  const user = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    throw ApiError.notFound(
      'User not found. Run: npx prisma db seed to create default user'
    );
  }

  // Fetch all behavioral data
  const [patterns, insights, learningProfile] = await Promise.all([
    // Get all behavioral patterns with supporting evidence
    prisma.behavioralPattern.findMany({
      where: { userId: user.id },
      orderBy: [
        { confidence: 'desc' },
        { lastSeenAt: 'desc' },
      ],
      include: {
        insights: {
          select: {
            insightId: true,
          },
        },
      },
    }),

    // Get all behavioral insights with supporting patterns
    prisma.behavioralInsight.findMany({
      where: { userId: user.id },
      orderBy: [
        { confidence: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        patterns: {
          select: {
            patternId: true,
          },
        },
      },
    }),

    // Get user learning profile
    prisma.userLearningProfile.findUnique({
      where: { userId: user.id },
    }),
  ]);

  // Format export data
  const exportData = {
    exportedAt: new Date().toISOString(),
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    patterns: patterns.map((pattern) => ({
      id: pattern.id,
      patternType: pattern.patternType,
      patternName: pattern.patternName,
      confidence: pattern.confidence,
      evidence: pattern.evidence,
      detectedAt: pattern.detectedAt.toISOString(),
      lastSeenAt: pattern.lastSeenAt.toISOString(),
      occurrenceCount: pattern.occurrenceCount,
      linkedInsights: pattern.insights.map((i) => i.insightId),
    })),
    insights: insights.map((insight) => ({
      id: insight.id,
      insightType: insight.insightType,
      title: insight.title,
      description: insight.description,
      actionableRecommendation: insight.actionableRecommendation,
      confidence: insight.confidence,
      createdAt: insight.createdAt.toISOString(),
      acknowledgedAt: insight.acknowledgedAt?.toISOString() ?? null,
      applied: insight.applied,
      supportingPatterns: insight.patterns.map((p) => p.patternId),
    })),
    learningProfile: learningProfile
      ? {
          id: learningProfile.id,
          preferredStudyTimes: learningProfile.preferredStudyTimes,
          averageSessionDuration: learningProfile.averageSessionDuration,
          optimalSessionDuration: learningProfile.optimalSessionDuration,
          contentPreferences: learningProfile.contentPreferences,
          learningStyleProfile: learningProfile.learningStyleProfile,
          personalizedForgettingCurve: learningProfile.personalizedForgettingCurve,
          lastAnalyzedAt: learningProfile.lastAnalyzedAt.toISOString(),
          dataQualityScore: learningProfile.dataQualityScore,
        }
      : null,
    metadata: {
      totalPatterns: patterns.length,
      totalInsights: insights.length,
      hasLearningProfile: !!learningProfile,
      exportFormat: 'behavioral-patterns-v1.0',
    },
  };

  return Response.json(exportData);
});
