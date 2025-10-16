/**
 * DELETE /api/performance/reset
 * Story 2.2 Task 8.1
 *
 * Reset all performance data for a user
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response';

export async function DELETE(request: NextRequest) {
  try {
    // Hardcoded user for MVP
    const userId = 'kevy@americano.dev';

    // Delete all performance metrics
    const deletedMetrics = await prisma.performanceMetric.deleteMany({
      where: { userId },
    });

    // Reset performance fields on all learning objectives
    const objectives = await prisma.learningObjective.findMany({
      where: {
        lecture: {
          userId,
        },
      },
      select: { id: true },
    });

    await prisma.learningObjective.updateMany({
      where: {
        id: {
          in: objectives.map((obj) => obj.id),
        },
      },
      data: {
        masteryLevel: 'NOT_STARTED',
        weaknessScore: 0.5,
        totalStudyTimeMs: 0,
        lastStudiedAt: null,
      },
    });

    return Response.json(
      successResponse({
        deleted: {
          performanceMetrics: deletedMetrics.count,
          objectivesReset: objectives.length,
        },
        message: 'All performance data has been reset',
      })
    );
  } catch (error) {
    console.error('Error resetting performance data:', error);
    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to reset performance data'),
      { status: 500 }
    );
  }
}
