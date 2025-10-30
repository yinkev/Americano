// POST /api/personalization/apply
// Triggers personalization engine for specific context

import type { NextRequest } from 'next/server'
import type { PersonalizationContext } from '@/generated/prisma'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

/**
 * POST /api/personalization/apply
 * Apply personalization for specific context (mission/content/assessment/session)
 *
 * @body {
 *   context: "MISSION" | "CONTENT" | "ASSESSMENT" | "SESSION",
 *   params?: {
 *     missionDate?: ISO date,
 *     topicId?: string,
 *     currentDifficulty?: number,
 *     sessionDuration?: number
 *   }
 * }
 * @returns PersonalizationConfig for requested context
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse request body
  const body = await request.json()
  const { context, params = {} } = body

  // Validate context
  const validContexts = ['MISSION', 'CONTENT', 'ASSESSMENT', 'SESSION']
  if (!context || !validContexts.includes(context)) {
    throw ApiError.badRequest(`Invalid context. Must be one of: ${validContexts.join(', ')}`)
  }

  // For MVP: Use hardcoded Kevy user (auth deferred)
  const user = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
    select: { id: true },
  })

  if (!user) {
    throw ApiError.notFound('User not found. Run: npx prisma db seed to create default user')
  }

  // Get user preferences
  const preferences = await prisma.personalizationPreferences.findUnique({
    where: { userId: user.id },
  })

  // Check if personalization is enabled for this context
  const isEnabled = preferences && getContextEnabled(preferences, context)

  if (!isEnabled) {
    return Response.json(
      successResponse({
        personalizationApplied: false,
        context,
        config: getDefaultConfig(context),
        message: `Personalization disabled for ${context} context`,
      }),
    )
  }

  // Get user learning profile
  const learningProfile = await prisma.userLearningProfile.findUnique({
    where: { userId: user.id },
  })

  if (!learningProfile || learningProfile.dataQualityScore < 0.6) {
    return Response.json(
      successResponse({
        personalizationApplied: false,
        context,
        config: getDefaultConfig(context),
        message: 'Insufficient data for personalization. Continue studying to build your profile.',
        dataQualityScore: learningProfile?.dataQualityScore || 0,
      }),
    )
  }

  // Apply confidence threshold based on personalization level
  const confidenceThreshold = getConfidenceThreshold(preferences?.personalizationLevel || 'MEDIUM')

  if (learningProfile.dataQualityScore < confidenceThreshold) {
    return Response.json(
      successResponse({
        personalizationApplied: false,
        context,
        config: getDefaultConfig(context),
        message: `Data quality (${learningProfile.dataQualityScore.toFixed(2)}) below threshold (${confidenceThreshold}) for ${preferences?.personalizationLevel} level`,
        dataQualityScore: learningProfile.dataQualityScore,
      }),
    )
  }

  // Build context-specific personalization config
  const config = buildPersonalizationConfig(context, learningProfile, params)

  // Create or update PersonalizationConfig record
  const existingConfig = await prisma.personalizationConfig.findFirst({
    where: {
      userId: user.id,
      preferencesId: preferences!.id,
      context: context as PersonalizationContext,
      isActive: true,
    },
  })

  if (existingConfig) {
    // Update existing config
    await prisma.personalizationConfig.update({
      where: { id: existingConfig.id },
      data: {
        ...getConfigFields(context, config),
        confidenceScore: learningProfile.dataQualityScore,
        updatedAt: new Date(),
      },
    })
  } else {
    // Create new config
    await prisma.personalizationConfig.create({
      data: {
        userId: user.id,
        preferencesId: preferences!.id,
        context: context as PersonalizationContext,
        strategyVariant: 'Balanced', // Default strategy
        ...getConfigFields(context, config),
        confidenceScore: learningProfile.dataQualityScore,
        isActive: true,
      },
    })
  }

  return Response.json(
    successResponse({
      personalizationApplied: true,
      context,
      config,
      confidence: learningProfile.dataQualityScore,
      message: `Personalization applied for ${context} context`,
    }),
  )
})

// Helper functions
function getContextEnabled(preferences: any, context: string): boolean {
  switch (context) {
    case 'MISSION':
      return preferences.missionPersonalizationEnabled
    case 'CONTENT':
      return preferences.contentPersonalizationEnabled
    case 'ASSESSMENT':
      return preferences.assessmentPersonalizationEnabled
    case 'SESSION':
      return preferences.sessionPersonalizationEnabled
    default:
      return false
  }
}

function getConfidenceThreshold(level: string): number {
  switch (level) {
    case 'NONE':
      return 1.0 // Impossible to meet
    case 'LOW':
      return 0.85 // Conservative
    case 'MEDIUM':
      return 0.7 // Balanced
    case 'HIGH':
      return 0.6 // Aggressive
    default:
      return 0.7
  }
}

function getDefaultConfig(context: string): any {
  return {
    enabled: false,
    strategy: 'default',
    parameters: {},
    confidence: 0.0,
  }
}

function buildPersonalizationConfig(context: string, profile: any, params: any): any {
  switch (context) {
    case 'MISSION':
      return {
        enabled: true,
        strategy: 'pattern-based',
        parameters: {
          optimalStudyTimes: profile.preferredStudyTimes,
          recommendedDuration: profile.optimalSessionDuration,
          contentPreferences: profile.contentPreferences,
        },
        confidence: profile.dataQualityScore,
      }

    case 'CONTENT':
      return {
        enabled: true,
        strategy: 'learning-style-adaptive',
        parameters: {
          learningStyleProfile: profile.learningStyleProfile,
          contentPreferences: profile.contentPreferences,
          topicId: params.topicId,
        },
        confidence: profile.dataQualityScore,
      }

    case 'ASSESSMENT':
      return {
        enabled: true,
        strategy: 'forgetting-curve-optimized',
        parameters: {
          forgettingCurve: profile.personalizedForgettingCurve,
          currentDifficulty: params.currentDifficulty,
        },
        confidence: profile.dataQualityScore,
      }

    case 'SESSION':
      return {
        enabled: true,
        strategy: 'attention-cycle-based',
        parameters: {
          sessionDuration: params.sessionDuration || profile.optimalSessionDuration,
          learningStyle: profile.learningStyleProfile,
        },
        confidence: profile.dataQualityScore,
      }

    default:
      return getDefaultConfig(context)
  }
}

function getConfigFields(context: string, config: any): any {
  switch (context) {
    case 'MISSION':
      return { missionPersonalization: config }
    case 'CONTENT':
      return { contentPersonalization: config }
    case 'ASSESSMENT':
      return { assessmentPersonalization: config }
    case 'SESSION':
      return { sessionPersonalization: config }
    default:
      return {}
  }
}
