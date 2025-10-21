/**
 * GET /api/performance/export
 * Story 2.2 Task 8.3
 *
 * Export all performance data for a user (FERPA compliance)
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { errorResponse, ErrorCodes } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    // Hardcoded user for MVP
    const userId = 'kevy@americano.dev'

    // Fetch all performance metrics
    const performanceMetrics = await prisma.performanceMetric.findMany({
      where: { userId },
      include: {
        learningObjective: {
          select: {
            id: true,
            objective: true,
            complexity: true,
            lecture: {
              select: {
                title: true,
                course: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Fetch learning objectives with performance fields
    const objectives = await prisma.learningObjective.findMany({
      where: {
        lecture: {
          userId,
        },
      },
      select: {
        id: true,
        objective: true,
        complexity: true,
        masteryLevel: true,
        weaknessScore: true,
        totalStudyTimeMs: true,
        lastStudiedAt: true,
        lecture: {
          select: {
            title: true,
            course: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      summary: {
        totalObjectives: objectives.length,
        totalPerformanceRecords: performanceMetrics.length,
      },
      objectives,
      performanceMetrics: performanceMetrics.map((pm) => ({
        ...pm,
        learningObjective: undefined, // Remove nested object
        objectiveText: pm.learningObjective.objective,
        lectureTitle: pm.learningObjective.lecture.title,
        courseName: pm.learningObjective.lecture.course.name,
      })),
    }

    // Return as JSON download
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="performance-data-${userId}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting performance data:', error)
    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to export performance data'),
      { status: 500 },
    )
  }
}
