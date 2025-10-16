import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse } from '@/lib/api-response';
import { withErrorHandler, ApiError } from '@/lib/api-error';

// PATCH /api/learning/sessions/:id/resume - Resume a paused study session
export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    // Get the current session
    const currentSession = await prisma.studySession.findUnique({
      where: { id },
    });

    if (!currentSession) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

    if (currentSession.completedAt) {
      throw new ApiError(400, 'SESSION_ALREADY_COMPLETED', 'Cannot resume a completed session');
    }

    // For MVP, we'll just acknowledge the resume
    // The client (Zustand store) will calculate pausedDuration locally

    return Response.json(successResponse({
      session: currentSession,
      message: 'Session resumed. Client should track resume time locally.',
    }));
  }
);
