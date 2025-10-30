import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

// Validation schema
const updateNotesSchema = z.object({
  notes: z.string().max(1000, 'Notes must be 1000 characters or less'),
})

// PATCH /api/learning/sessions/:id/notes - Update session notes
export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const body = await request.json()
    const { notes } = updateNotesSchema.parse(body)

    // Get the current session
    const currentSession = await prisma.studySession.findUnique({
      where: { id },
    })

    if (!currentSession) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found')
    }

    // Update session notes
    const updatedSession = await prisma.studySession.update({
      where: { id },
      data: {
        sessionNotes: notes,
      },
    })

    return Response.json(
      successResponse({
        session: updatedSession,
        message: 'Session notes updated successfully',
      }),
    )
  },
)
