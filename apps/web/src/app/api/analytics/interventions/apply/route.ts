/**
 * POST /api/analytics/interventions/apply
 *
 * Apply recommended intervention (workload reduction, break schedule, content adjustment)
 * Story 5.4 Task 6.7
 */

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@/generated/prisma'
import { difficultyAdapter } from '@/subsystems/behavioral-analytics/difficulty-adapter'

const prisma = new PrismaClient()

const applyInterventionSchema = z.object({
  userId: z.string(),
  interventionType: z.enum([
    'WORKLOAD_REDUCTION',
    'BREAK_SCHEDULE_ADJUST',
    'CONTENT_SIMPLIFICATION',
    'DIFFICULTY_REDUCTION',
    'MANDATORY_REST',
  ]),
  accepted: z.boolean(),
  sessionId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(), // Additional intervention-specific data
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, interventionType, accepted, sessionId, metadata } =
      applyInterventionSchema.parse(body)

    if (!accepted) {
      // User dismissed intervention - log for tracking
      console.log(`User ${userId} dismissed intervention: ${interventionType}`)

      return NextResponse.json({
        success: true,
        applied: false,
        message: 'Intervention dismissed by user',
      })
    }

    // Apply intervention based on type
    let updatedMission = null
    let recoveryPlan = null

    switch (interventionType) {
      case 'WORKLOAD_REDUCTION':
        // Reduce mission complexity and duration
        if (metadata?.missionId) {
          const mission = await prisma.mission.findUnique({
            where: { id: metadata.missionId },
          })

          if (mission) {
            updatedMission = await prisma.mission.update({
              where: { id: metadata.missionId },
              data: {
                estimatedMinutes: Math.max(15, Math.floor(mission.estimatedMinutes * 0.5)),
                // objectives would be filtered to review-only in mission logic
              },
            })
          }
        }
        break

      case 'DIFFICULTY_REDUCTION':
        // Apply difficulty adapter recommendations
        if (sessionId) {
          const currentLoad = metadata?.currentLoad || 70
          const adjustment = await difficultyAdapter.adjustDifficulty(userId, currentLoad)
          await difficultyAdapter.applyAdaptation(sessionId, adjustment)
        }
        break

      case 'BREAK_SCHEDULE_ADJUST':
        // Update break frequency in session plan
        recoveryPlan = {
          breakFrequency: metadata?.breakFrequencyMinutes || 15,
          breakDuration: metadata?.breakDurationMinutes || 5,
          nextBreak: new Date(Date.now() + (metadata?.breakFrequencyMinutes || 15) * 60 * 1000),
        }
        break

      case 'CONTENT_SIMPLIFICATION':
        // Switch to easier content
        if (metadata?.sessionContext) {
          const recommendation = await difficultyAdapter.recommendContentModification(
            metadata.sessionContext,
          )
          recoveryPlan = {
            contentRecommendation: recommendation,
          }
        }
        break

      case 'MANDATORY_REST':
        // Disable mission generation for specified days
        recoveryPlan = {
          restDays: metadata?.restDays || 3,
          resumeDate: new Date(Date.now() + (metadata?.restDays || 3) * 24 * 60 * 60 * 1000),
          lightReviewOnly: true,
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown intervention type' },
          { status: 400 },
        )
    }

    // Log intervention application for effectiveness tracking
    console.log(`Applied intervention for user ${userId}:`, {
      interventionType,
      timestamp: new Date(),
      sessionId,
      metadata,
    })

    // Note: Integration with Story 5.2 InterventionRecommendation table
    // would track effectiveness and update intervention status

    return NextResponse.json({
      success: true,
      applied: true,
      interventionType,
      updatedMission,
      recoveryPlan,
      message: 'Intervention applied successfully',
    })
  } catch (error) {
    console.error('Error applying intervention:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to apply intervention' },
      { status: 500 },
    )
  }
}
