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

    const durationOptimizer = new SessionDurationOptimizer()
    const contentSequencer = new ContentSequencer()
    const intensityModulator = new StudyIntensityModulator()

    // Get mission complexity
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        objectives: true,
      },
    })

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
    }

    // Determine mission complexity (heuristic based on objectives)
    const missionComplexity = mission.objectives ?
      (mission.objectives.length > 3 ? 'ADVANCED' : mission.objectives.length > 1 ? 'INTERMEDIATE' : 'BASIC')
      : 'INTERMEDIATE'

    // Get duration recommendation
    const startDateTime = new Date(startTime)
    const durationRec = await durationOptimizer.recommendDuration(
      userId,
      missionComplexity,
      startDateTime
    )

    // Use provided duration or recommended
    const sessionDuration = duration || durationRec.recommendedDuration

    // Generate content sequence
    const contentSeq = await contentSequencer.sequenceContent(userId, missionId, sessionDuration)

    // Get intensity recommendation
    const intensityRec = await intensityModulator.recommendIntensity(userId)

    // Calculate plan confidence (average of component confidences)
    const confidence = (durationRec.confidence + intensityRec.confidence) / 2

    // Create session orchestration plan
    const plan = await prisma.sessionOrchestrationPlan.create({
      data: {
        missionId,
        userId,
        plannedStartTime: startDateTime,
        plannedEndTime: new Date(startDateTime.getTime() + sessionDuration * 60 * 1000),
        plannedBreaks: durationRec.breaks,
        intensityModulation: intensity || intensityRec.intensity,
        contentSequence: contentSeq.sequence,
      },
    })

    return NextResponse.json({
      plan: {
        id: plan.id,
        missionId: plan.missionId,
        userId: plan.userId,
        startTime: plan.plannedStartTime,
        endTime: plan.plannedEndTime,
        duration: sessionDuration,
        intensity: plan.intensityModulation,
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
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to generate session plan' }, { status: 500 })
  }
}
