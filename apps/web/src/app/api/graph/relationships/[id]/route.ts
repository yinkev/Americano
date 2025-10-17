/**
 * DELETE /api/graph/relationships/:id
 * Delete user-defined relationship
 *
 * Story 3.2 Task 5.2
 *
 * AC #6: User can add custom connections and annotations to graph
 * - Only allow deletion of user-defined relationships (isUserDefined: true)
 * - System-generated relationships cannot be deleted
 */

import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/api-error'
import { successResponse, errorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Fetch the relationship to verify it exists and is user-defined
    const relationship = await prisma.conceptRelationship.findUnique({
      where: { id },
    })

    if (!relationship) {
      return Response.json(
        errorResponse('NOT_FOUND', 'Relationship not found'),
        { status: 404 }
      )
    }

    // Validate that only user-defined relationships can be deleted
    if (!relationship.isUserDefined) {
      return Response.json(
        errorResponse(
          'FORBIDDEN',
          'Cannot delete system-generated relationships. Only user-defined relationships can be deleted.',
          { isUserDefined: false }
        ),
        { status: 403 }
      )
    }

    // Delete the relationship
    await prisma.conceptRelationship.delete({
      where: { id },
    })

    return Response.json(
      successResponse({
        success: true,
        message: 'Relationship deleted successfully',
        deletedId: id,
      })
    )
  } catch (error) {
    console.error('Failed to delete relationship:', error)
    return Response.json(
      errorResponse('DELETE_FAILED', 'Failed to delete relationship'),
      { status: 500 }
    )
  }
}

export const DELETE = withErrorHandler(handler)
