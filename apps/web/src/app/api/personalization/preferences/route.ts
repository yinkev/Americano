// PATCH /api/personalization/preferences
// Update user personalization preferences with feature-level toggles

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse } from '@/lib/api-response';
import { ApiError, withErrorHandler } from '@/lib/api-error';
import { PersonalizationLevel } from '@prisma/client';

/**
 * PATCH /api/personalization/preferences
 * Update user personalization preferences
 *
 * @body {
 *   personalizationLevel?: "NONE" | "LOW" | "MEDIUM" | "HIGH",
 *   missionPersonalizationEnabled?: boolean,
 *   contentPersonalizationEnabled?: boolean,
 *   assessmentPersonalizationEnabled?: boolean,
 *   sessionPersonalizationEnabled?: boolean,
 *   autoAdaptEnabled?: boolean,
 *   disabledFeatures?: string[]
 * }
 * @returns Updated PersonalizationPreferences
 */
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  // Parse request body
  const body = await request.json();
  const {
    personalizationLevel,
    missionPersonalizationEnabled,
    contentPersonalizationEnabled,
    assessmentPersonalizationEnabled,
    sessionPersonalizationEnabled,
    autoAdaptEnabled,
    disabledFeatures,
  } = body;

  // Validate personalizationLevel if provided
  if (personalizationLevel !== undefined) {
    const validLevels = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];
    if (!validLevels.includes(personalizationLevel)) {
      throw ApiError.badRequest(
        `Invalid personalizationLevel. Must be one of: ${validLevels.join(', ')}`
      );
    }
  }

  // Validate boolean fields
  const booleanFields = {
    missionPersonalizationEnabled,
    contentPersonalizationEnabled,
    assessmentPersonalizationEnabled,
    sessionPersonalizationEnabled,
    autoAdaptEnabled,
  };

  for (const [key, value] of Object.entries(booleanFields)) {
    if (value !== undefined && typeof value !== 'boolean') {
      throw ApiError.badRequest(`${key} must be a boolean`);
    }
  }

  // Validate disabledFeatures array
  if (disabledFeatures !== undefined) {
    if (!Array.isArray(disabledFeatures)) {
      throw ApiError.badRequest('disabledFeatures must be an array');
    }
    if (!disabledFeatures.every((f) => typeof f === 'string')) {
      throw ApiError.badRequest('All disabledFeatures must be strings');
    }
  }

  // At least one field must be provided
  const hasUpdate = Object.values(body).some((v) => v !== undefined);
  if (!hasUpdate) {
    throw ApiError.badRequest('At least one preference field must be provided');
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

  // Get or create preferences
  let preferences = await prisma.personalizationPreferences.findUnique({
    where: { userId: user.id },
  });

  if (!preferences) {
    // Create default preferences
    preferences = await prisma.personalizationPreferences.create({
      data: {
        userId: user.id,
        personalizationLevel: PersonalizationLevel.MEDIUM,
        autoAdaptEnabled: true,
        missionPersonalizationEnabled: true,
        contentPersonalizationEnabled: true,
        assessmentPersonalizationEnabled: true,
        sessionPersonalizationEnabled: true,
        disabledFeatures: [],
      },
    });
  }

  // Build update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (personalizationLevel !== undefined) {
    updateData.personalizationLevel = personalizationLevel as PersonalizationLevel;

    // Auto-adjust feature toggles based on level
    if (personalizationLevel === 'NONE') {
      updateData.missionPersonalizationEnabled = false;
      updateData.contentPersonalizationEnabled = false;
      updateData.assessmentPersonalizationEnabled = false;
      updateData.sessionPersonalizationEnabled = false;
    } else if (personalizationLevel === 'LOW') {
      updateData.missionPersonalizationEnabled = true;
      updateData.contentPersonalizationEnabled = false;
      updateData.assessmentPersonalizationEnabled = false;
      updateData.sessionPersonalizationEnabled = true;
    } else if (personalizationLevel === 'MEDIUM') {
      updateData.missionPersonalizationEnabled = true;
      updateData.contentPersonalizationEnabled = true;
      updateData.assessmentPersonalizationEnabled = true;
      updateData.sessionPersonalizationEnabled = true;
    } else if (personalizationLevel === 'HIGH') {
      updateData.missionPersonalizationEnabled = true;
      updateData.contentPersonalizationEnabled = true;
      updateData.assessmentPersonalizationEnabled = true;
      updateData.sessionPersonalizationEnabled = true;
    }
  }

  // Individual feature toggles (override level-based settings)
  if (missionPersonalizationEnabled !== undefined) {
    updateData.missionPersonalizationEnabled = missionPersonalizationEnabled;
  }
  if (contentPersonalizationEnabled !== undefined) {
    updateData.contentPersonalizationEnabled = contentPersonalizationEnabled;
  }
  if (assessmentPersonalizationEnabled !== undefined) {
    updateData.assessmentPersonalizationEnabled = assessmentPersonalizationEnabled;
  }
  if (sessionPersonalizationEnabled !== undefined) {
    updateData.sessionPersonalizationEnabled = sessionPersonalizationEnabled;
  }
  if (autoAdaptEnabled !== undefined) {
    updateData.autoAdaptEnabled = autoAdaptEnabled;
  }
  if (disabledFeatures !== undefined) {
    updateData.disabledFeatures = disabledFeatures;
  }

  // Update preferences
  const updatedPreferences = await prisma.personalizationPreferences.update({
    where: { id: preferences.id },
    data: updateData,
  });

  // If personalization is set to NONE, deactivate all configs
  if (personalizationLevel === 'NONE') {
    await prisma.personalizationConfig.updateMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });
  }

  return Response.json(
    successResponse({
      preferences: {
        personalizationLevel: updatedPreferences.personalizationLevel,
        missionPersonalizationEnabled: updatedPreferences.missionPersonalizationEnabled,
        contentPersonalizationEnabled: updatedPreferences.contentPersonalizationEnabled,
        assessmentPersonalizationEnabled: updatedPreferences.assessmentPersonalizationEnabled,
        sessionPersonalizationEnabled: updatedPreferences.sessionPersonalizationEnabled,
        autoAdaptEnabled: updatedPreferences.autoAdaptEnabled,
        disabledFeatures: updatedPreferences.disabledFeatures,
        updatedAt: updatedPreferences.updatedAt,
      },
      message: `Personalization preferences updated to ${updatedPreferences.personalizationLevel} level`,
    })
  );
});
