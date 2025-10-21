/**
 * Session Plan Generation API Route
 * Story 5.3 Task 7: POST /api/orchestration/session-plan
 *
 * Generate complete orchestration plan for study session
 * Integrates all 4 subsystems for comprehensive planning
 */

import { NextRequest, NextResponse } from 'next/server'
import { SessionDurationOptimizer } from '@/subsystems/behavioral-analytics/session-duration-optimizer'
import { ContentSequencer } from '@/subsystems/behavioral-analytics/content-sequencer'
import { StudyIntensityModulator } from '@/subsystems/behavioral-analytics/study-intensity-modulator'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const SessionPlanSchema = z.object({
  userId: z.string().min(1),
  missionId: z.string().min(1),
  startTime: z.string().datetime(),
  duration: z.number().min(15).max(180).optional(),
  intensity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, missionId, startTime, duration, intensity } = SessionPlanSchema.parse(body)

    // Get mission complexity
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        id: true,
        objectives: true,
      },
    })

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
    }

    // Determine mission complexity (heuristic based on objectives)
    const objectivesArray = Array.isArray(mission.objectives) ? mission.objectives : []
    const missionComplexity = objectivesArray.length > 3
      ? ('ADVANCED' as const)
      : objectivesArray.length > 1
        ? ('INTERMEDIATE' as const)
        : ('BASIC' as const)

    // Get duration recommendation
    const startDateTime = new Date(startTime)
    const durationRec = await SessionDurationOptimizer.recommendDuration(
      userId,
      missionComplexity,
      startDateTime,
    )

    // Use provided duration or recommended
    const sessionDuration = duration || durationRec.recommendedDuration

    // Generate content sequence
    const contentSeq = await ContentSequencer.sequenceContent(userId, missionId, sessionDuration)

    // Get intensity recommendation
    const intensityRec = await StudyIntensityModulator.recommendIntensity(userId)

    // Calculate plan confidence (average of component confidences)
    const confidence = (durationRec.confidence + intensityRec.confidence) / 2

    // TODO: Create session orchestration plan in database
    // NOTE: SessionOrchestrationPlan model needs to be added to Prisma schema
    // const plan = await prisma.sessionOrchestrationPlan.create({
    //   data: {
    //     missionId,
    //     userId,
    //     plannedStartTime: startDateTime,
    //     plannedEndTime: new Date(startDateTime.getTime() + sessionDuration * 60 * 1000),
    //     plannedBreaks: durationRec.breaks as any,
    //     intensityModulation: intensity || intensityRec.intensity,
    //     contentSequence: contentSeq.sequence as any,
    //   },
    //})

    const plannedEndTime = new Date(startDateTime.getTime() + sessionDuration * 60 * 1000)

    return NextResponse.json({
      plan: {
        id: `temp-${Date.now()}`, // Temporary ID until Prisma model is created
        missionId,
        userId,
        startTime: startDateTime,
        endTime: plannedEndTime,
        duration: sessionDuration,
        intensity: intensity || intensityRec.intensity,
        contentSequence: contentSeq,
        breaks: durationRec.breaks,
        confidence,
        reasoning: {
          timeSelection: [`Session scheduled for ${startDateTime.toLocaleTimeString()}`],
          durationLogic: durationRec.reasoning,
          contentSequencing: [`${contentSeq.sequence.length} items sequenced across 3 phases`],
          intensityFactors: intensityRec.reasoning,
        },
      },
      confidence,
    })
  } catch (error) {
    console.error('Session plan generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Failed to generate session plan' }, { status: 500 })
  }
}
