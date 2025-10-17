// /api/user/privacy route
// GET: Fetch user privacy settings
// PATCH: Update user privacy settings (Story 5.1 Task 11)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse } from '@/lib/api-response';
import { ApiError, withErrorHandler } from '@/lib/api-error';

/**
 * GET /api/user/privacy
 * Fetch the current user's privacy settings
 *
 * @returns Privacy settings (behavioralAnalysisEnabled, learningStyleProfilingEnabled)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // For MVP: Use hardcoded Kevy user (auth deferred)
  const user = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
    select: {
      id: true,
      behavioralAnalysisEnabled: true,
      learningStyleProfilingEnabled: true,
      shareAnonymizedPatterns: true,
    },
  });

  if (!user) {
    throw ApiError.notFound(
      'User not found. Run: npx prisma db seed to create default user'
    );
  }

  return Response.json(
    successResponse({
      behavioralAnalysisEnabled: user.behavioralAnalysisEnabled,
      learningStyleProfilingEnabled: user.learningStyleProfilingEnabled,
      shareAnonymizedPatterns: user.shareAnonymizedPatterns,
    })
  );
});

/**
 * PATCH /api/user/privacy
 * Update the current user's privacy settings
 *
 * @body { behavioralAnalysisEnabled?, learningStyleProfilingEnabled? }
 * @returns Updated privacy settings
 */
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  // Parse request body
  const body = await request.json();
  const { behavioralAnalysisEnabled, learningStyleProfilingEnabled } = body;

  // Validate types
  if (
    behavioralAnalysisEnabled !== undefined &&
    typeof behavioralAnalysisEnabled !== 'boolean'
  ) {
    throw ApiError.badRequest('behavioralAnalysisEnabled must be a boolean');
  }

  if (
    learningStyleProfilingEnabled !== undefined &&
    typeof learningStyleProfilingEnabled !== 'boolean'
  ) {
    throw ApiError.badRequest('learningStyleProfilingEnabled must be a boolean');
  }

  // At least one field must be provided
  if (behavioralAnalysisEnabled === undefined && learningStyleProfilingEnabled === undefined) {
    throw ApiError.badRequest('At least one privacy setting must be provided');
  }

  // For MVP: Use hardcoded Kevy user (auth deferred)
  const existingUser = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
  });

  if (!existingUser) {
    throw ApiError.notFound(
      'User not found. Run: npx prisma db seed to create default user'
    );
  }

  // Update privacy settings
  const updatedUser = await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      ...(behavioralAnalysisEnabled !== undefined && { behavioralAnalysisEnabled }),
      ...(learningStyleProfilingEnabled !== undefined && { learningStyleProfilingEnabled }),
    },
    select: {
      id: true,
      behavioralAnalysisEnabled: true,
      learningStyleProfilingEnabled: true,
      shareAnonymizedPatterns: true,
    },
  });

  // If behavioral analysis is disabled, delete all behavioral data
  if (behavioralAnalysisEnabled === false) {
    await prisma.$transaction([
      // Delete all behavioral patterns
      prisma.behavioralPattern.deleteMany({
        where: { userId: existingUser.id },
      }),
      // Delete all behavioral insights
      prisma.behavioralInsight.deleteMany({
        where: { userId: existingUser.id },
      }),
      // Delete user learning profile
      prisma.userLearningProfile.deleteMany({
        where: { userId: existingUser.id },
      }),
    ]);
  }

  return Response.json(
    successResponse({
      behavioralAnalysisEnabled: updatedUser.behavioralAnalysisEnabled,
      learningStyleProfilingEnabled: updatedUser.learningStyleProfilingEnabled,
      shareAnonymizedPatterns: updatedUser.shareAnonymizedPatterns,
    })
  );
});
