/**
 * Conflict Detection API
 *
 * Epic 3 - Story 3.4 - Task 4.1: Build Conflict Detection API
 *
 * POST /api/conflicts/detect
 *
 * Detects conflicts for a specific concept across sources.
 * Background job endpoint with rate limiting.
 * Target performance: <500ms per concept scan
 *
 * Request body:
 * {
 *   conceptId: string,
 *   sourceIds?: string[],
 *   minSimilarity?: number,
 *   maxConflicts?: number,
 *   skipAIAnalysis?: boolean
 * }
 *
 * Response:
 * {
 *   conflicts: Conflict[],
 *   total: number,
 *   scanTime: number,
 *   conceptId?: string
 * }
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { PrismaClient, ConflictStatus, ChangeType } from '@/generated/prisma'
import { successResponse, errorResponse, ErrorCodes, withErrorHandler } from '@/lib/api-response'
import { conflictDetector } from '@/subsystems/knowledge-graph/conflict-detector'

const prisma = new PrismaClient()

/**
 * Request validation schema
 */
const detectRequestSchema = z.object({
  conceptId: z.string().optional(),
  sourceIds: z.array(z.string()).optional(),
  minSimilarity: z.number().min(0).max(1).optional().default(0.85),
  maxConflicts: z.number().min(1).max(1000).optional().default(100),
  skipAIAnalysis: z.boolean().optional().default(false)
})

type DetectRequest = z.infer<typeof detectRequestSchema>

/**
 * POST /api/conflicts/detect
 *
 * Scan for conflicts in concept or sources
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now()

  // Parse and validate request body
  const body = await request.json()
  const validationResult = detectRequestSchema.safeParse(body)

  if (!validationResult.success) {
    return Response.json(
      errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid request body',
        validationResult.error.format()
      ),
      { status: 400 }
    )
  }

  const params: DetectRequest = validationResult.data

  // Validate at least one of conceptId or sourceIds is provided
  if (!params.conceptId && (!params.sourceIds || params.sourceIds.length === 0)) {
    return Response.json(
      errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Either conceptId or sourceIds must be provided'
      ),
      { status: 400 }
    )
  }

  try {
    // Scan for conflicts
    const detectedConflicts = await conflictDetector.scanAllSources({
      conceptId: params.conceptId,
      sourceIds: params.sourceIds,
      minSimilarity: params.minSimilarity,
      maxConflicts: params.maxConflicts,
      skipAIAnalysis: params.skipAIAnalysis
    })

    // Persist conflicts to database
    const savedConflicts = []

    for (const detected of detectedConflicts) {
      try {
        // Check if conflict already exists
        const existing = await prisma.conflict.findFirst({
          where: {
            AND: [
              { sourceAChunkId: detected.sourceAChunkId },
              { sourceBChunkId: detected.sourceBChunkId },
              { status: { not: ConflictStatus.DISMISSED } }
            ]
          }
        })

        if (existing) {
          // Skip duplicate
          continue
        }

        // Create new conflict
        const conflict = await prisma.conflict.create({
          data: {
            conceptId: detected.conceptId,
            sourceAChunkId: detected.sourceAChunkId,
            sourceBChunkId: detected.sourceBChunkId,
            sourceAFirstAidId: detected.sourceAFirstAidId,
            sourceBFirstAidId: detected.sourceBFirstAidId,
            conflictType: detected.conflictType,
            severity: detected.severity,
            description: detected.description,
            status: ConflictStatus.ACTIVE
          }
        })

        // Create history entry
        await prisma.conflictHistory.create({
          data: {
            conflictId: conflict.id,
            changeType: ChangeType.DETECTED,
            newStatus: ConflictStatus.ACTIVE,
            changedBy: 'system',
            notes: `Auto-detected conflict (similarity: ${(detected.similarity * 100).toFixed(1)}%, confidence: ${(detected.confidence * 100).toFixed(1)}%)`
          }
        })

        savedConflicts.push(conflict)
      } catch (error) {
        console.error('Error persisting conflict:', error)
        // Continue with next conflict even if one fails
      }
    }

    const scanTime = Date.now() - startTime

    return Response.json(
      successResponse({
        conflicts: savedConflicts,
        total: savedConflicts.length,
        scanTime,
        conceptId: params.conceptId,
        performance: {
          timeMs: scanTime,
          targetMs: 500,
          withinTarget: scanTime < 500
        }
      })
    )
  } catch (error: any) {
    console.error('Conflict detection error:', error)

    return Response.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to detect conflicts',
        { message: error.message }
      ),
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
})
