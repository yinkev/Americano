// GET /api/personalization/config
// Returns active PersonalizationConfig for user

import type { NextRequest } from 'next/server'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

interface PersonalizationConfigData {
  missionPersonalization: {
    enabled: boolean
    strategy: string
    parameters: Record<string, any>
    confidence: number
  }
  contentPersonalization: {
    enabled: boolean
    strategy: string
    parameters: Record<string, any>
    confidence: number
  }
  assessmentPersonalization: {
    enabled: boolean
    strategy: string
    parameters: Record<string, any>
    confidence: number
  }
  sessionPersonalization: {
    enabled: boolean
    strategy: string
    parameters: Record<string, any>
    confidence: number
  }
}

/**
 * GET /api/personalization/config
 * Fetch active personalization configuration for user
 *
 * @returns PersonalizationConfig with all personalization settings
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // For MVP: Use hardcoded Kevy user (auth deferred)
  const user = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
    select: { id: true },
  })

  if (!user) {
    throw ApiError.notFound('User not found. Run: npx prisma db seed to create default user')
  }

  // Get user learning profile for confidence scoring
  const learningProfile = await prisma.userLearningProfile.findUnique({
    where: { userId: user.id },
  })

  // Default configuration (graceful degradation if no profile exists)
  const defaultConfig: PersonalizationConfigData = {
    missionPersonalization: {
      enabled: false,
      strategy: 'default',
      parameters: {},
      confidence: 0.0,
    },
    contentPersonalization: {
      enabled: false,
      strategy: 'default',
      parameters: {},
      confidence: 0.0,
    },
    assessmentPersonalization: {
      enabled: false,
      strategy: 'default',
      parameters: {},
      confidence: 0.0,
    },
    sessionPersonalization: {
      enabled: false,
      strategy: 'default',
      parameters: {},
      confidence: 0.0,
    },
  }

  if (!learningProfile || learningProfile.dataQualityScore < 0.6) {
    // Insufficient data - return default config
    return Response.json(
      successResponse({
        config: defaultConfig,
        message:
          'Insufficient data for personalization. Complete 6+ weeks of study for personalized recommendations.',
      }),
    )
  }

  // Build personalization config from learning profile
  const config: PersonalizationConfigData = {
    missionPersonalization: {
      enabled: true,
      strategy: 'pattern-based',
      parameters: {
        optimalStudyTimes: learningProfile.preferredStudyTimes,
        recommendedDuration: learningProfile.optimalSessionDuration,
      },
      confidence: learningProfile.dataQualityScore,
    },
    contentPersonalization: {
      enabled: true,
      strategy: 'learning-style-adaptive',
      parameters: {
        learningStyleProfile: learningProfile.learningStyleProfile,
        contentPreferences: learningProfile.contentPreferences,
      },
      confidence: learningProfile.dataQualityScore,
    },
    assessmentPersonalization: {
      enabled: true,
      strategy: 'forgetting-curve-optimized',
      parameters: {
        forgettingCurve: learningProfile.personalizedForgettingCurve,
      },
      confidence: learningProfile.dataQualityScore,
    },
    sessionPersonalization: {
      enabled: true,
      strategy: 'attention-cycle-based',
      parameters: {
        sessionDuration: learningProfile.optimalSessionDuration,
        learningStyleProfile: learningProfile.learningStyleProfile,
      },
      confidence: learningProfile.dataQualityScore,
    },
  }

  return Response.json(
    successResponse({
      config,
      dataQualityScore: learningProfile.dataQualityScore,
      lastAnalyzedAt: learningProfile.lastAnalyzedAt,
    }),
  )
})
