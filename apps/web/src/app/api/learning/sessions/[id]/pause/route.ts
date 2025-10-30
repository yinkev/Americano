import type { NextRequest } from 'next/server'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

// PATCH /api/learning/sessions/:id/pause - Pause a study session
export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    // Get the current session
    const currentSession = await prisma.studySession.findUnique({
      where: { id },
    })

    if (!currentSession) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found')
    }

    if (currentSession.completedAt) {
      throw new ApiError(400, 'SESSION_ALREADY_COMPLETED', 'Cannot pause a completed session')
    }

    // For MVP, we'll just acknowledge the pause
    // The client (Zustand store) will track pausedAt timestamp locally
    // On completion, client will send total pausedDuration to calculate final durationMs

    return Response.json(
      successResponse({
        session: currentSession,
        message: 'Session paused. Client should track pause time locally.',
      }),
    )
  },
)
