import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getUserId } from '@/lib/auth';

// Zod validation schema for PATCH request body
const updateResponseSchema = z.object({
  reflectionNotes: z.string().optional(),
});

/**
 * PATCH /api/validation/responses/[id]
 *
 * Updates a ValidationResponse with reflection notes after calibration feedback.
 *
 * **Workflow**:
 * 1. Validate request body (reflectionNotes)
 * 2. Fetch existing ValidationResponse
 * 3. Verify ownership (userId matches)
 * 4. Update reflectionNotes field
 * 5. Return updated response
 *
 * @see Story 4.4 Task 10.5 (Reflection Integration)
 * @see Story 4.4 AC#5 (Metacognitive Reflection Prompts)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateResponseSchema.parse(body);
    const { reflectionNotes } = validatedData;

    // Get user ID (hardcoded for MVP per CLAUDE.md)
    const userId = await getUserId();

    // Fetch existing ValidationResponse
    const existingResponse = await prisma.validationResponse.findUnique({
      where: { id },
    });

    if (!existingResponse) {
      return NextResponse.json(
        errorResponse('RESPONSE_NOT_FOUND', 'Validation response not found'),
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingResponse.userId !== userId) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'You do not have permission to update this response'),
        { status: 403 }
      );
    }

    // Update ValidationResponse with reflection notes
    const updatedResponse = await prisma.validationResponse.update({
      where: { id },
      data: {
        reflectionNotes: reflectionNotes || null,
      },
    });

    // Return updated response
    return NextResponse.json(
      successResponse({
        responseId: updatedResponse.id,
        reflectionNotes: updatedResponse.reflectionNotes,
        updatedAt: updatedResponse.updatedAt,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid request data', error.issues),
        { status: 400 }
      );
    }

    console.error('Error updating validation response:', error);
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to update validation response'
      ),
      { status: 500 }
    );
  }
}
