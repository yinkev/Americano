// /api/analytics/patterns/all route
// DELETE: Delete all behavioral data for the user (Story 5.1 Task 11)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse } from '@/lib/api-response';
import { ApiError, withErrorHandler } from '@/lib/api-error';

/**
 * DELETE /api/analytics/patterns/all
 * Delete all behavioral data for the current user
 * This includes:
 * - BehavioralPattern (cascades to InsightPattern)
 * - BehavioralInsight (cascades to InsightPattern)
 * - UserLearningProfile
 *
 * @returns Success confirmation with deletion counts
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  // For MVP: Use hardcoded Kevy user (auth deferred)
  const user = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw ApiError.notFound(
      'User not found. Run: npx prisma db seed to create default user'
    );
  }

  // Delete all behavioral data in a transaction
  // Order matters for referential integrity:
  // 1. InsightPattern (join table) - deleted via cascade from BehavioralPattern/BehavioralInsight
  // 2. BehavioralPattern
  // 3. BehavioralInsight
  // 4. UserLearningProfile
  const [deletedPatterns, deletedInsights, deletedProfiles] = await prisma.$transaction([
    prisma.behavioralPattern.deleteMany({
      where: { userId: user.id },
    }),
    prisma.behavioralInsight.deleteMany({
      where: { userId: user.id },
    }),
    prisma.userLearningProfile.deleteMany({
      where: { userId: user.id },
    }),
  ]);

  return Response.json(
    successResponse({
      message: 'All behavioral data deleted successfully',
      deletedCounts: {
        patterns: deletedPatterns.count,
        insights: deletedInsights.count,
        profiles: deletedProfiles.count,
      },
    })
  );
});
