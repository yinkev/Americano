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

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ChangeType, ConflictStatus } from "@/generated/prisma";
import { ErrorCodes, errorResponse, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { ebmEvaluator } from "@/lib/ebm-evaluator";

// ============================================
// Validation Schemas
// ============================================

const PatchBodySchema = z.object({
  status: z.nativeEnum(ConflictStatus),
  notes: z.string().optional(),
});

// ============================================
// GET Handler
// ============================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const startTime = Date.now();
    const { id } = await params;

    // Fetch conflict with all related data
    const conflict = await prisma.conflicts.findUnique({
      where: { id },
      include: {
        concepts: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
          },
        },
        content_chunks_conflicts_sourceAChunkIdTocontent_chunks: {
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
        content_chunks_conflicts_sourceBChunkIdTocontent_chunks: {
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
        conflict_resolutions: {
          orderBy: {
            resolvedAt: "desc",
          },
          take: 10, // Limit to most recent resolutions
        },
        conflict_history: {
          orderBy: {
            changedAt: "desc",
          },
          take: 20, // Limit to recent history
        },
        conflict_flags: {
          select: {
            id: true,
            userId: true,
            description: true,
            userNotes: true,
            flaggedAt: true,
            status: true,
          },
          orderBy: {
            flaggedAt: "desc",
          },
        },
      },
    });

    if (!conflict) {
      return NextResponse.json(errorResponse(ErrorCodes.NOT_FOUND, "Conflict not found"), {
        status: 404,
      });
    }

    // Type assertion to help TypeScript understand the included relations
    const typedConflict = conflict as typeof conflict & {
      concepts?: any;
      content_chunks_conflicts_sourceAChunkIdTocontent_chunks?: any;
      content_chunks_conflicts_sourceBChunkIdTocontent_chunks?: any;
      conflict_resolutions?: any[];
      conflict_history?: any[];
      conflict_flags?: any[];
    };

    // Get EBM evaluation for this conflict
    let ebmComparison = null;
    try {
      ebmComparison = await ebmEvaluator.compareEvidence(id);
    } catch (error) {
      console.error("EBM evaluation failed:", error);
      // Continue without EBM comparison (non-critical)
    }

    const latency = Date.now() - startTime;

    return NextResponse.json(
      successResponse({
        conflict: {
          id: typedConflict.id,
          conceptId: typedConflict.conceptId,
          conflictType: typedConflict.conflictType,
          severity: typedConflict.severity,
          status: typedConflict.status,
          description: typedConflict.description,
          createdAt: typedConflict.createdAt,
          resolvedAt: typedConflict.resolvedAt,
          concept: typedConflict.concepts,
          // Guard optional relations with presence of their IDs
          sourceA:
            typedConflict.sourceAChunkId &&
            typedConflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks
            ? {
                type: "lecture",
                id: typedConflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.id,
                content:
                  typedConflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.content,
                pageNumber:
                  typedConflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.pageNumber,
                chunkIndex:
                  typedConflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.chunkIndex,
                lecture: {
                  id: typedConflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.lecture
                    .id,
                  title:
                    typedConflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.lecture
                      .title,
                  fileName:
                    typedConflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.lecture
                      .fileName,
                  course:
                    typedConflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.lecture
                      .course,
                },
              }
            : null,
          sourceB:
            typedConflict.sourceBChunkId &&
            typedConflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks
            ? {
                type: "lecture",
                id: typedConflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.id,
                content:
                  typedConflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.content,
                pageNumber:
                  typedConflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.pageNumber,
                chunkIndex:
                  typedConflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.chunkIndex,
                lecture: {
                  id: typedConflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.lecture
                    .id,
                  title:
                    typedConflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.lecture
                      .title,
                  fileName:
                    typedConflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.lecture
                      .fileName,
                  course:
                    typedConflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.lecture
                      .course,
                },
              }
            : null,
          resolutions: typedConflict.conflict_resolutions,
          history: typedConflict.conflict_history,
          flags: typedConflict.conflict_flags,
        },
        ebmComparison,
        latency,
      }),
    );
  } catch (error) {
    console.error("[GET /api/conflicts/:id] Error:", error);

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch conflict details"),
      { status: 500 },
    );
  }
}

// ============================================
// PATCH Handler
// ============================================

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Hard-coded user for MVP (Story 1.5 constraint)
    const userId = "kevy@americano.dev";

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = PatchBodySchema.safeParse(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "Invalid request body",
          validatedBody.error.issues,
        ),
        { status: 400 },
      );
    }

    const { status, notes } = validatedBody.data;

    // Fetch current conflict
    const currentConflict = await prisma.conflicts.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!currentConflict) {
      return NextResponse.json(errorResponse(ErrorCodes.NOT_FOUND, "Conflict not found"), {
        status: 404,
      });
    }

    // Validate status transition
    const allowedTransitions: Record<ConflictStatus, ConflictStatus[]> = {
      ACTIVE: [ConflictStatus.UNDER_REVIEW, ConflictStatus.DISMISSED],
      UNDER_REVIEW: [ConflictStatus.ACTIVE, ConflictStatus.RESOLVED, ConflictStatus.DISMISSED],
      RESOLVED: [ConflictStatus.ACTIVE], // Can reopen
      DISMISSED: [ConflictStatus.ACTIVE], // Can reopen
    };

    const allowed = allowedTransitions[currentConflict.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.BAD_REQUEST,
          `Invalid status transition from ${currentConflict.status} to ${status}`,
          {
            currentStatus: currentConflict.status,
            requestedStatus: status,
            allowedTransitions: allowed,
          },
        ),
        { status: 400 },
      );
    }

    // Determine change type
    let changeType: ChangeType;
    if (status === ConflictStatus.RESOLVED) {
      changeType = ChangeType.RESOLVED;
    } else if (status === ConflictStatus.DISMISSED) {
      changeType = ChangeType.DISMISSED;
    } else if (
      currentConflict.status === ConflictStatus.RESOLVED ||
      currentConflict.status === ConflictStatus.DISMISSED
    ) {
      changeType = ChangeType.REOPENED;
    } else {
      changeType = ChangeType.DETECTED; // Default
    }

    // Update conflict and create history record in transaction
    const [updatedConflict] = await prisma.$transaction([
      prisma.conflicts.update({
        where: { id },
        data: {
          status,
          resolvedAt: status === ConflictStatus.RESOLVED ? new Date() : null,
        },
        include: {
          concepts: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.conflict_history.create({
        data: {
          conflictId: id,
          changeType,
          oldStatus: currentConflict.status,
          newStatus: status,
          changedBy: userId,
          notes,
        },
      }),
    ]);

    return NextResponse.json(
      successResponse({
        conflict: updatedConflict,
        message: `Conflict status updated to ${status}`,
      }),
    );
  } catch (error) {
    console.error("[PATCH /api/conflicts/:id] Error:", error);

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to update conflict status"),
      { status: 500 },
    );
  }
}
