import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

// Validation schema
const completeSessionSchema = z.object({
  pausedDurationMs: z.number().min(0).default(0),
})

// PATCH /api/learning/sessions/:id/complete - Complete a study session
export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const body = await request.json()
    const { pausedDurationMs } = completeSessionSchema.parse(body)

    // Get the current session
    const currentSession = await prisma.studySession.findUnique({
      where: { id },
      include: {
        reviews: true,
      },
    })

    if (!currentSession) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found')
    }

    if (currentSession.completedAt) {
      throw new ApiError(400, 'SESSION_ALREADY_COMPLETED', 'Session already completed')
    }

    const completedAt = new Date()
    const totalElapsedMs = completedAt.getTime() - currentSession.startedAt.getTime()
    const durationMs = totalElapsedMs - pausedDurationMs

    // Count reviews completed and new cards studied
    const reviewsCompleted = currentSession.reviews.length
    const newCardsStudied = currentSession.reviews.filter((review) => {
      // A review is for a "new card" if it's the first review of that card
      return review.difficultyBefore === 0 && review.stabilityBefore === 0
    }).length

    // Update session with completion data
    const updatedSession = await prisma.studySession.update({
      where: { id },
      data: {
        completedAt,
        durationMs,
        reviewsCompleted,
        newCardsStudied,
      },
      include: {
        mission: true,
        reviews: {
          include: {
            card: {
              select: {
                id: true,
                front: true,
                lecture: {
                  select: {
                    id: true,
                    title: true,
                    course: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Calculate session stats
    const stats = {
      duration: durationMs,
      durationFormatted: formatDuration(durationMs),
      reviewsCompleted,
      newCardsStudied,
      cardsPerMinute: durationMs > 0 ? (reviewsCompleted / (durationMs / 60000)).toFixed(1) : '0',
    }

    return Response.json(
      successResponse({
        session: updatedSession,
        stats,
        message: 'Session completed successfully',
      }),
    )
  },
)

// Helper function to format duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
