/**
 * POST /api/performance/self-assessment
 * Story 2.2 Task 3.4
 *
 * Allows users to input self-assessment confidence levels
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response';
import { PerformanceCalculator } from '@/lib/performance-calculator';

const BodySchema = z.object({
  objectiveId: z.string().cuid(),
  confidenceLevel: z.number().int().min(1).max(5),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Hardcoded user for MVP
    const userId = 'kevy@americano.dev';

    // Parse request body
    const body = await request.json();
    const validated = BodySchema.parse(body);
    const { objectiveId, confidenceLevel, notes } = validated;

    // Verify objective exists and user owns it
    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
      include: {
        lecture: {
          select: {
            userId: true,
          },
        },
        cards: true,
      },
    });

    if (!objective) {
      return Response.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'Learning objective not found'),
        { status: 404 }
      );
    }

    if (objective.lecture.userId !== userId) {
      return Response.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized to assess this objective'),
        { status: 403 }
      );
    }

    // Fetch reviews for weakness calculation
    const reviews = await prisma.review.findMany({
      where: {
        userId,
        card: {
          objectiveId,
        },
      },
    });

    // Recalculate weakness score with user confidence
    const weaknessScore = PerformanceCalculator.calculateWeaknessScore(
      objective,
      reviews,
      confidenceLevel
    );

    // Update objective with new weakness score
    await prisma.learningObjective.update({
      where: { id: objectiveId },
      data: {
        weaknessScore,
      },
    });

    // Log self-assessment as behavioral event (optional)
    // Could be used for future analytics
    if (notes) {
      await prisma.behavioralEvent.create({
        data: {
          userId,
          eventType: 'VALIDATION_COMPLETED',
          eventData: {
            objectiveId,
            confidenceLevel,
            notes,
            weaknessScore,
          },
        },
      });
    }

    return Response.json(
      successResponse({
        success: true,
        weaknessScore,
        message: `Confidence recorded: ${confidenceLevel}/5`,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'),
        { status: 400 }
      );
    }

    console.error('Error recording self-assessment:', error);
    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to record self-assessment'),
      { status: 500 }
    );
  }
}
