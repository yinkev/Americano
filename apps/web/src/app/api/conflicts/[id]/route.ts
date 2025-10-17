/**
 * GET /api/conflicts/:id
 * Get single conflict with full details
 *
 * Story 3.4 Task 4.2: Conflict detail API endpoint
 *
 * Features:
 * - Full conflict details with all resolutions
 * - Complete source content (not just snippets)
 * - Historical state changes
 * - EBM evaluation results
 * - Performance target: <300ms response time
 *
 * PATCH /api/conflicts/:id
 * Update conflict status
 *
 * Story 3.4 Task 4.2: Conflict status update endpoint
 *
 * Features:
 * - Status transitions: ACTIVE → UNDER_REVIEW → RESOLVED/DISMISSED
 * - Historical tracking of status changes
 * - Validation of allowed transitions
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { ConflictStatus, ChangeType } from '@/generated/prisma'
import { ebmEvaluator } from '@/lib/ebm-evaluator'

// ============================================
// Validation Schemas
// ============================================

const PatchBodySchema = z.object({
  status: z.nativeEnum(ConflictStatus),
  notes: z.string().optional(),
})

// ============================================
// GET Handler
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const startTime = Date.now()
    const { id } = await params

    // Fetch conflict with all related data
    const conflict = await prisma.conflict.findUnique({
      where: { id },
      include: {
        concept: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
          },
        },
        sourceAChunk: {
          select: {
            id: true,
            content: true,
            pageNumber: true,
            chunkIndex: true,
            lecture: {
              select: {
                id: true,
                title: true,
                fileName: true,
                course: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
        sourceBChunk: {
          select: {
            id: true,
            content: true,
            pageNumber: true,
            chunkIndex: true,
            lecture: {
              select: {
                id: true,
                title: true,
                fileName: true,
                course: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
        sourceAFirstAid: {
          select: {
            id: true,
            edition: true,
            year: true,
            system: true,
            section: true,
            subsection: true,
            pageNumber: true,
            content: true,
            isHighYield: true,
          },
        },
        sourceBFirstAid: {
          select: {
            id: true,
            edition: true,
            year: true,
            system: true,
            section: true,
            subsection: true,
            pageNumber: true,
            content: true,
            isHighYield: true,
          },
        },
        resolutions: {
          orderBy: {
            resolvedAt: 'desc',
          },
          take: 10, // Limit to most recent resolutions
        },
        history: {
          orderBy: {
            changedAt: 'desc',
          },
          take: 20, // Limit to recent history
        },
        flags: {
          select: {
            id: true,
            userId: true,
            description: true,
            userNotes: true,
            flaggedAt: true,
            status: true,
          },
          orderBy: {
            flaggedAt: 'desc',
          },
        },
      },
    })

    if (!conflict) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'Conflict not found'),
        { status: 404 }
      )
    }

    // Get EBM evaluation for this conflict
    let ebmComparison = null
    try {
      ebmComparison = await ebmEvaluator.compareEvidence(id)
    } catch (error) {
      console.error('EBM evaluation failed:', error)
      // Continue without EBM comparison (non-critical)
    }

    const latency = Date.now() - startTime

    return NextResponse.json(
      successResponse({
        conflict: {
          id: conflict.id,
          conceptId: conflict.conceptId,
          conflictType: conflict.conflictType,
          severity: conflict.severity,
          status: conflict.status,
          description: conflict.description,
          createdAt: conflict.createdAt,
          resolvedAt: conflict.resolvedAt,
          concept: conflict.concept,
          sourceA: conflict.sourceAChunk
            ? {
                type: 'lecture',
                id: conflict.sourceAChunk.id,
                content: conflict.sourceAChunk.content,
                pageNumber: conflict.sourceAChunk.pageNumber,
                chunkIndex: conflict.sourceAChunk.chunkIndex,
                lecture: {
                  id: conflict.sourceAChunk.lecture.id,
                  title: conflict.sourceAChunk.lecture.title,
                  fileName: conflict.sourceAChunk.lecture.fileName,
                  course: conflict.sourceAChunk.lecture.course,
                },
              }
            : conflict.sourceAFirstAid
            ? {
                type: 'first_aid',
                id: conflict.sourceAFirstAid.id,
                content: conflict.sourceAFirstAid.content,
                edition: conflict.sourceAFirstAid.edition,
                year: conflict.sourceAFirstAid.year,
                system: conflict.sourceAFirstAid.system,
                section: conflict.sourceAFirstAid.section,
                subsection: conflict.sourceAFirstAid.subsection,
                pageNumber: conflict.sourceAFirstAid.pageNumber,
                isHighYield: conflict.sourceAFirstAid.isHighYield,
              }
            : null,
          sourceB: conflict.sourceBChunk
            ? {
                type: 'lecture',
                id: conflict.sourceBChunk.id,
                content: conflict.sourceBChunk.content,
                pageNumber: conflict.sourceBChunk.pageNumber,
                chunkIndex: conflict.sourceBChunk.chunkIndex,
                lecture: {
                  id: conflict.sourceBChunk.lecture.id,
                  title: conflict.sourceBChunk.lecture.title,
                  fileName: conflict.sourceBChunk.lecture.fileName,
                  course: conflict.sourceBChunk.lecture.course,
                },
              }
            : conflict.sourceBFirstAid
            ? {
                type: 'first_aid',
                id: conflict.sourceBFirstAid.id,
                content: conflict.sourceBFirstAid.content,
                edition: conflict.sourceBFirstAid.edition,
                year: conflict.sourceBFirstAid.year,
                system: conflict.sourceBFirstAid.system,
                section: conflict.sourceBFirstAid.section,
                subsection: conflict.sourceBFirstAid.subsection,
                pageNumber: conflict.sourceBFirstAid.pageNumber,
                isHighYield: conflict.sourceBFirstAid.isHighYield,
              }
            : null,
          resolutions: conflict.resolutions,
          history: conflict.history,
          flags: conflict.flags,
        },
        ebmComparison,
        latency,
      })
    )
  } catch (error) {
    console.error('[GET /api/conflicts/:id] Error:', error)

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch conflict details'),
      { status: 500 }
    )
  }
}

// ============================================
// PATCH Handler
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Hard-coded user for MVP (Story 1.5 constraint)
    const userId = 'kevy@americano.dev'

    // Parse and validate request body
    const body = await request.json()
    const validatedBody = PatchBodySchema.safeParse(body)

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

    const { status, notes } = validatedBody.data

    // Fetch current conflict
    const currentConflict = await prisma.conflict.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!currentConflict) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'Conflict not found'),
        { status: 404 }
      )
    }

    // Validate status transition
    const allowedTransitions: Record<ConflictStatus, ConflictStatus[]> = {
      ACTIVE: [ConflictStatus.UNDER_REVIEW, ConflictStatus.DISMISSED],
      UNDER_REVIEW: [ConflictStatus.ACTIVE, ConflictStatus.RESOLVED, ConflictStatus.DISMISSED],
      RESOLVED: [ConflictStatus.ACTIVE], // Can reopen
      DISMISSED: [ConflictStatus.ACTIVE], // Can reopen
    }

    const allowed = allowedTransitions[currentConflict.status]
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.BAD_REQUEST,
          `Invalid status transition from ${currentConflict.status} to ${status}`,
          {
            currentStatus: currentConflict.status,
            requestedStatus: status,
            allowedTransitions: allowed,
          }
        ),
        { status: 400 }
      )
    }

    // Determine change type
    let changeType: ChangeType
    if (status === ConflictStatus.RESOLVED) {
      changeType = ChangeType.RESOLVED
    } else if (status === ConflictStatus.DISMISSED) {
      changeType = ChangeType.DISMISSED
    } else if (currentConflict.status === ConflictStatus.RESOLVED || currentConflict.status === ConflictStatus.DISMISSED) {
      changeType = ChangeType.REOPENED
    } else {
      changeType = ChangeType.DETECTED // Default
    }

    // Update conflict and create history record in transaction
    const [updatedConflict] = await prisma.$transaction([
      prisma.conflict.update({
        where: { id },
        data: {
          status,
          resolvedAt: status === ConflictStatus.RESOLVED ? new Date() : null,
        },
        include: {
          concept: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.conflictHistory.create({
        data: {
          conflictId: id,
          changeType,
          oldStatus: currentConflict.status,
          newStatus: status,
          changedBy: userId,
          notes,
        },
      }),
    ])

    return NextResponse.json(
      successResponse({
        conflict: updatedConflict,
        message: `Conflict status updated to ${status}`,
      })
    )
  } catch (error) {
    console.error('[PATCH /api/conflicts/:id] Error:', error)

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update conflict status'),
      { status: 500 }
    )
  }
}
