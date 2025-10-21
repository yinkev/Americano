/**
 * GET /api/graph/objectives/:objectiveId/prerequisites
 * Get prerequisite pathway for a learning objective
 *
 * Story 3.2 Task 6.2
 *
 * AC #8: Integration with learning objectives showing prerequisite pathways
 *
 * Returns:
 * - The learning objective details
 * - Prerequisite pathway (ordered by depth: foundational → advanced)
 * - Relationship strength scores
 */

import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/api-error'
import { successResponse, errorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

interface PrerequisiteNode {
  id: string
  objective: string
  complexity: string
  masteryLevel: string
  depth: number
  strength: number
  path: string[] // IDs of objectives in path from root to this node
}

/**
 * Recursively build prerequisite pathway tree using depth-first traversal
 */
async function buildPrerequisitePath(
  objectiveId: string,
  visited: Set<string> = new Set(),
  depth: number = 0,
  path: string[] = [],
  maxDepth: number = 5
): Promise<PrerequisiteNode[]> {
  // Prevent infinite loops from circular dependencies
  if (visited.has(objectiveId) || depth > maxDepth) {
    return []
  }

  visited.add(objectiveId)
  const currentPath = [...path, objectiveId]

  // Fetch objective with its prerequisites
  const objective = await prisma.learningObjective.findUnique({
    where: { id: objectiveId },
    include: {
      prerequisites: {
        include: {
          prerequisite: {
            select: {
              id: true,
              objective: true,
              complexity: true,
              masteryLevel: true,
            },
          },
        },
        orderBy: {
          strength: 'desc',
        },
      },
    },
  })

  if (!objective) {
    return []
  }

  const nodes: PrerequisiteNode[] = []

  // Add current objective as a node
  nodes.push({
    id: objective.id,
    objective: objective.objective,
    complexity: objective.complexity,
    masteryLevel: objective.masteryLevel,
    depth,
    strength: 1.0, // Root or prerequisite strength will be set by parent
    path: currentPath,
  })

  // Recursively process prerequisites
  for (const prereqRelation of objective.prerequisites) {
    const prereqNodes = await buildPrerequisitePath(
      prereqRelation.prerequisite.id,
      visited,
      depth + 1,
      currentPath,
      maxDepth
    )

    // Update strength for the direct prerequisite
    if (prereqNodes.length > 0) {
      prereqNodes[0].strength = prereqRelation.strength
    }

    nodes.push(...prereqNodes)
  }

  return nodes
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ objectiveId: string }> }
) {
  const { objectiveId } = await params
  const searchParams = request.nextUrl.searchParams
  const maxDepth = parseInt(searchParams.get('maxDepth') || '5')

  try {
    // Validate objective exists
    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
      include: {
        lecture: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
      },
    })

    if (!objective) {
      return Response.json(
        errorResponse('NOT_FOUND', 'Learning objective not found'),
        { status: 404 }
      )
    }

    // Build prerequisite pathway
    const prerequisitePath = await buildPrerequisitePath(
      objectiveId,
      new Set(),
      0,
      [],
      maxDepth
    )

    // Remove the root node (the objective itself) from prerequisites
    const prerequisites = prerequisitePath.slice(1)

    // Sort by depth (foundational first)
    prerequisites.sort((a, b) => {
      if (a.depth !== b.depth) {
        return b.depth - a.depth // Higher depth = more foundational
      }
      return b.strength - a.strength // Then by strength
    })

    // Group by depth level for visualization
    const levels: Record<number, PrerequisiteNode[]> = {}
    prerequisites.forEach((node) => {
      if (!levels[node.depth]) {
        levels[node.depth] = []
      }
      levels[node.depth].push(node)
    })

    return Response.json(
      successResponse({
        objective: {
          id: objective.id,
          objective: objective.objective,
          complexity: objective.complexity,
          masteryLevel: objective.masteryLevel,
          isHighYield: objective.isHighYield,
          lecture: objective.lecture,
        },
        prerequisitePath: prerequisites,
        levels,
        stats: {
          totalPrerequisites: prerequisites.length,
          maxDepth: Math.max(...prerequisites.map((n) => n.depth), 0),
          avgStrength:
            prerequisites.length > 0
              ? prerequisites.reduce((sum, n) => sum + n.strength, 0) /
                prerequisites.length
              : 0,
        },
      })
    )
  } catch (error) {
    console.error('Failed to fetch prerequisite pathway:', error)
    return Response.json(
      errorResponse('FETCH_FAILED', 'Failed to fetch prerequisite pathway'),
      { status: 500 }
    )
  }
}

export const GET = withErrorHandler(handler)
