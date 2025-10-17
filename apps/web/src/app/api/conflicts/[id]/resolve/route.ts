/**
 * POST /api/conflicts/:id/resolve
 * Resolve a conflict with preferred source selection
 *
 * Story 3.4 Task 4.4: Conflict resolution API endpoint
 *
 * Features:
 * - Create ConflictResolution record
 * - Track resolution method and chosen source
 * - Update conflict status to RESOLVED
 * - Create ConflictHistory entry for audit trail
 * - Support evidence-based resolution reasoning
 *
 * @openapi
 * /api/conflicts/:id/resolve:
 *   post:
 *     summary: Resolve a conflict
 *     description: |
 *       Mark a conflict as resolved with a preferred source selection and
 *       optional evidence. Creates a resolution record and updates conflict status.
 *     tags:
 *       - Conflicts
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Conflict ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resolution
 *             properties:
 *               resolution:
 *                 type: string
 *                 description: Resolution explanation
 *                 minLength: 10
 *                 maxLength: 2000
 *               preferredSourceId:
 *                 type: string
 *                 description: ID of the preferred source (chunk or First Aid section)
 *               evidence:
 *                 type: string
 *                 description: Supporting evidence for resolution
 *                 maxLength: 5000
 *               notes:
 *                 type: string
 *                 description: Additional resolution notes
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Conflict resolved successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Conflict not found
 *       500:
 *         description: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { ConflictStatus, ChangeType } from '@/generated/prisma'

// ============================================
// Validation Schema
// ============================================

const ResolveRequestSchema = z.object({
  resolution: z.string().min(10).max(2000),
  preferredSourceId: z.string().optional(),
  evidence: z.string().max(5000).optional(),
  notes: z.string().max(1000).optional(),
})

// ============================================
// POST Handler
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conflictId } = await params

    // Hard-coded user for MVP (Story 1.5 constraint)
    const userId = 'kevy@americano.dev'

    // Parse and validate request body
    const body = await request.json()
    const validatedBody = ResolveRequestSchema.safeParse(body)

    if (!validatedBody.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request body',
          validatedBody.error.issues
        ),
        { status: 400 }
      )
    }

    const { resolution, preferredSourceId, evidence, notes } = validatedBody.data

    // Fetch conflict to validate it exists and can be resolved
    const conflict = await prisma.conflict.findUnique({
      where: { id: conflictId },
      select: {
        id: true,
        status: true,
        sourceAChunkId: true,
        sourceBChunkId: true,
        sourceAFirstAidId: true,
        sourceBFirstAidId: true,
      },
    })

    if (!conflict) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'Conflict not found'),
        { status: 404 }
      )
    }

    // Check if already resolved
    if (conflict.status === ConflictStatus.RESOLVED) {
      // Check if user is trying to update an existing resolution
      const existingResolution = await prisma.conflictResolution.findFirst({
        where: { conflictId },
        orderBy: { resolvedAt: 'desc' },
      })

      if (existingResolution && existingResolution.resolvedBy === userId) {
        return NextResponse.json(
          errorResponse(
            ErrorCodes.CONFLICT,
            'Conflict already resolved by you. Use PATCH /api/conflicts/:id to reopen if needed.',
            { existingResolutionId: existingResolution.id }
          ),
          { status: 409 }
        )
      }
    }

    // Validate preferredSourceId if provided
    if (preferredSourceId) {
      const validSourceIds = [
        conflict.sourceAChunkId,
        conflict.sourceBChunkId,
        conflict.sourceAFirstAidId,
        conflict.sourceBFirstAidId,
      ].filter(Boolean)

      if (!validSourceIds.includes(preferredSourceId)) {
        return NextResponse.json(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Preferred source ID must be one of the conflict sources',
            {
              providedSourceId: preferredSourceId,
              validSourceIds,
            }
          ),
          { status: 400 }
        )
      }
    }

    // Create resolution and update conflict in transaction
    const [conflictResolution, updatedConflict] = await prisma.$transaction([
      // Create ConflictResolution record
      prisma.conflictResolution.create({
        data: {
          conflictId,
          resolvedBy: userId,
          resolution,
          preferredSourceId: preferredSourceId || null,
          evidence: evidence || null,
          notes: notes || null,
        },
      }),

      // Update Conflict status to RESOLVED
      prisma.conflict.update({
        where: { id: conflictId },
        data: {
          status: ConflictStatus.RESOLVED,
          resolvedAt: new Date(),
        },
        include: {
          concept: {
            select: {
              id: true,
              name: true,
            },
          },
          sourceAChunk: {
            select: {
              id: true,
              lecture: {
                select: {
                  title: true,
                },
              },
            },
          },
          sourceBChunk: {
            select: {
              id: true,
              lecture: {
                select: {
                  title: true,
                },
              },
            },
          },
          sourceAFirstAid: {
            select: {
              id: true,
              system: true,
              section: true,
            },
          },
          sourceBFirstAid: {
            select: {
              id: true,
              system: true,
              section: true,
            },
          },
        },
      }),

      // Create ConflictHistory entry
      prisma.conflictHistory.create({
        data: {
          conflictId,
          changeType: ChangeType.RESOLVED,
          oldStatus: conflict.status,
          newStatus: ConflictStatus.RESOLVED,
          changedBy: userId,
          notes: notes || `Resolved with preferred source: ${preferredSourceId || 'not specified'}`,
        },
      }),
    ])

    return NextResponse.json(
      successResponse({
        conflict: {
          id: updatedConflict.id,
          status: updatedConflict.status,
          conflictType: updatedConflict.conflictType,
          severity: updatedConflict.severity,
          description: updatedConflict.description,
          resolvedAt: updatedConflict.resolvedAt,
          concept: updatedConflict.concept,
        },
        resolution: {
          id: conflictResolution.id,
          resolution: conflictResolution.resolution,
          preferredSourceId: conflictResolution.preferredSourceId,
          evidence: conflictResolution.evidence,
          notes: conflictResolution.notes,
          resolvedBy: conflictResolution.resolvedBy,
          resolvedAt: conflictResolution.resolvedAt,
        },
        message: 'Conflict resolved successfully',
      })
    )
  } catch (error) {
    console.error('[POST /api/conflicts/:id/resolve] Error:', error)

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to resolve conflict'),
      { status: 500 }
    )
  }
}
