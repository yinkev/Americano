import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

// Validation schema for session event
const sessionEventSchema = z.object({
  sessionId: z.string(),
  eventType: z.enum([
    'pause',
    'resume',
    'objective_complete',
    'card_review',
    'assessment_complete',
  ]),
  eventData: z.record(z.string(), z.any()).optional(), // Flexible JSON for event-specific data
  timestamp: z.string().optional(), // ISO date string, defaults to now
})

/**
 * POST /api/analytics/session-event
 *
 * Stores session events for detailed analytics tracking.
 *
 * Event Types:
 * - pause: Session paused by user
 * - resume: Session resumed after pause
 * - objective_complete: Learning objective completed
 * - card_review: Flashcard reviewed
 * - assessment_complete: Self-assessment or validation completed
 *
 * Request Body:
 * - sessionId: ID of the study session
 * - eventType: Type of event (see enum above)
 * - eventData: Additional event-specific data (optional)
 * - timestamp: ISO 8601 timestamp (optional, defaults to now)
 *
 * Response:
 * - event: The created behavioral event record
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse and validate request body
  const body = await request.json()
  const validatedData = sessionEventSchema.parse(body)

  // Verify session exists
  const session = await prisma.studySession.findUnique({
    where: { id: validatedData.sessionId },
    select: { id: true, userId: true },
  })

  if (!session) {
    throw ApiError.notFound('Study session')
  }

  // Map event type to BehavioralEvent EventType enum
  const eventTypeMap: Record<string, string> = {
    pause: 'SESSION_ENDED', // Pause is a temporary session end
    resume: 'SESSION_STARTED', // Resume is like starting again
    objective_complete: 'MISSION_COMPLETED', // Objective completion
    card_review: 'CARD_REVIEWED',
    assessment_complete: 'VALIDATION_COMPLETED',
  }

  const mappedEventType = eventTypeMap[validatedData.eventType]

  if (!mappedEventType) {
    throw ApiError.badRequest(`Invalid event type: ${validatedData.eventType}`)
  }

  // Build event data with session context
  const eventData = {
    sessionId: validatedData.sessionId,
    eventType: validatedData.eventType,
    ...(validatedData.eventData || {}),
  }

  // Create behavioral event
  const behavioralEvent = await prisma.behavioralEvent.create({
    data: {
      userId: session.userId,
      eventType: mappedEventType as any, // Cast to EventType enum
      eventData,
      timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date(),
    },
  })

  return Response.json(
    successResponse({
      event: {
        id: behavioralEvent.id,
        userId: behavioralEvent.userId,
        eventType: validatedData.eventType, // Return the original event type
        eventData: behavioralEvent.eventData,
        timestamp: behavioralEvent.timestamp.toISOString(),
      },
    }),
    { status: 201 },
  )
})
