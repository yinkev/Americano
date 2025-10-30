/**
 * POST /api/analytics/behavioral-insights/recommendations/:id/apply
 *
 * Applies recommendation to user settings/preferences
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 6
 */

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@/generated/prisma'
import { errorResponse, successResponse, withErrorHandler } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { RecommendationsEngine } from '@/subsystems/behavioral-analytics/recommendations-engine'
import type {
  ContentPreferences,
  PersonalizedForgettingCurve,
  PreferredStudyTime,
} from '@/types/prisma-json'

// Zod validation schema for request body
const ApplyRecommendationSchema = z.object({
  applicationType: z.enum(['AUTO', 'MANUAL', 'REMINDER', 'GOAL'], {
    message: 'applicationType is required',
  }),
  settings: z.record(z.string(), z.any()).optional(),
})

/**
 * POST /api/analytics/behavioral-insights/recommendations/:id/apply
 *
 * Body:
 * - applicationType: 'AUTO' | 'MANUAL' | 'REMINDER' | 'GOAL'
 * - settings?: Record<string, any> - Optional settings to apply
 *
 * Creates AppliedRecommendation record with baselineMetrics
 * If applicationType === 'AUTO', updates user settings automatically
 *
 * Returns:
 * - success: boolean
 * - updatedSettings: Record<string, any> (if AUTO)
 * - trackingId: string (AppliedRecommendation ID)
 */
export const POST = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const validatedBody = ApplyRecommendationSchema.parse(body)

    // Fetch recommendation
    const recommendation = await prisma.recommendation.findUnique({
      where: { id },
    })

    if (!recommendation) {
      return Response.json(errorResponse('Recommendation not found', 'NOT_FOUND'), { status: 404 })
    }

    if (recommendation.appliedAt) {
      return Response.json(errorResponse('Recommendation already applied', 'ALREADY_APPLIED'), {
        status: 400,
      })
    }

    // Track recommendation effectiveness (captures baseline metrics)
    const appliedRecommendation = await RecommendationsEngine.trackRecommendationEffectiveness(
      recommendation.userId,
      id,
      validatedBody.applicationType,
    )

    let updatedSettings: Record<string, any> = {}

    // If AUTO, apply settings automatically based on recommendation type
    if (validatedBody.applicationType === 'AUTO') {
      updatedSettings = await applyRecommendationSettings(
        recommendation.userId,
        recommendation,
        validatedBody.settings,
      )
    }

    return Response.json(
      successResponse({
        success: true,
        appliedRecommendation: {
          id: appliedRecommendation.id,
          applicationType: appliedRecommendation.applicationType,
          appliedAt: appliedRecommendation.appliedAt,
        },
        updatedSettings: Object.keys(updatedSettings).length > 0 ? updatedSettings : undefined,
        trackingId: appliedRecommendation.id,
      }),
    )
  },
)

/**
 * Apply recommendation settings based on type
 */
async function applyRecommendationSettings(
  userId: string,
  recommendation: any,
  customSettings?: Record<string, any>,
): Promise<Record<string, any>> {
  const profile = await prisma.userLearningProfile.findUnique({
    where: { userId },
  })

  if (!profile) {
    return {}
  }

  const updates: Record<string, any> = {}

  // Parse recommendation description to extract values
  switch (recommendation.recommendationType) {
    case 'STUDY_TIME_OPTIMIZATION': {
      // Extract hour range from title (e.g., "Study during your peak hours (14:00-15:00)")
      const hourMatch = recommendation.title.match(/\((\d+):00-(\d+):00\)/)
      if (hourMatch) {
        const startHour = parseInt(hourMatch[1], 10)
        const endHour = parseInt(hourMatch[2], 10)
        const existingTimes = (profile.preferredStudyTimes as unknown as PreferredStudyTime[]) || []
        const newTime: PreferredStudyTime = {
          startHour,
          endHour,
          dayOfWeek: -1,
          effectiveness: 0.8,
        }
        updates.preferredStudyTimes = [
          ...existingTimes,
          newTime,
        ] as unknown as Prisma.InputJsonValue
      }
      break
    }

    case 'SESSION_DURATION_ADJUSTMENT': {
      // Extract duration from title (e.g., "Optimize session length to 45 minutes")
      const durationMatch = recommendation.title.match(/to (\d+) minutes/)
      if (durationMatch) {
        updates.optimalSessionDuration = parseInt(durationMatch[1], 10)
      }
      break
    }

    case 'CONTENT_TYPE_BALANCE': {
      // Extract content type from title (e.g., "Increase flashcards content to 40%")
      const contentMatch = recommendation.title.match(/Increase (\w+) content to (\d+)%/)
      if (contentMatch) {
        const contentType = contentMatch[1]
        const targetPercentage = parseInt(contentMatch[2], 10) / 100
        const preferences = (profile.contentPreferences as unknown as ContentPreferences) || {
          preferredTypes: [],
          difficultyPreference: 'balanced',
          interactivityLevel: 'medium',
        }
        const updatedPrefs = { ...preferences, [contentType]: targetPercentage }
        updates.contentPreferences = updatedPrefs as unknown as Prisma.InputJsonValue
      }
      break
    }

    case 'RETENTION_STRATEGY': {
      // Extract review frequency from title (e.g., "Review every 3 days for optimal retention")
      const reviewMatch = recommendation.title.match(/every (\d+) days/)
      if (reviewMatch) {
        const reviewDays = parseInt(reviewMatch[1], 10)
        // Update forgetting curve with recommended review schedule
        const curve =
          (profile.personalizedForgettingCurve as unknown as PersonalizedForgettingCurve) || {
            initialRetention: 1.0,
            decayRate: 0.14,
            stabilityFactor: 5,
          }
        const updatedCurve = { ...curve, recommendedReviewInterval: reviewDays }
        updates.personalizedForgettingCurve = updatedCurve as unknown as Prisma.InputJsonValue
      }
      break
    }

    default:
      // For other types, apply custom settings if provided
      if (customSettings) {
        Object.assign(updates, customSettings)
      }
      break
  }

  // Update profile if there are changes
  if (Object.keys(updates).length > 0) {
    await prisma.userLearningProfile.update({
      where: { userId },
      data: updates,
    })
  }

  return updates
}
