/**
 * POST /api/analytics/patterns/analyze
 *
 * Triggers full behavioral pattern analysis for user
 *
 * Story 5.1: Learning Pattern Recognition and Analysis - Task 8.1
 */

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { errorResponse, successResponse, withErrorHandler } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { BehavioralPatternEngine } from '@/subsystems/behavioral-analytics/behavioral-pattern-engine'

// Zod validation schema for request body
const AnalyzeRequestSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  forceReanalysis: z.boolean().optional().default(false),
})

/**
 * POST /api/analytics/patterns/analyze
 *
 * Triggers full behavioral pattern analysis for user
 * - Runs BehavioralPatternEngine.runFullAnalysis()
 * - Checks data sufficiency (6 weeks, 20+ sessions)
 * - Saves patterns with confidence >= 0.6
 * - Generates top 5 insights by impact
 * - Updates UserLearningProfile
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse and validate request body
  const body = await request.json()
  const params = AnalyzeRequestSchema.parse(body)

  // Find user and check behavioral analysis is enabled (privacy controls)
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
  })

  if (!user) {
    return Response.json(errorResponse('USER_NOT_FOUND', `User ${params.userId} not found`), {
      status: 404,
    })
  }

  // Check if user has enabled behavioral analysis (privacy control)
  if (!user.behavioralAnalysisEnabled) {
    return Response.json(
      errorResponse(
        'ANALYSIS_DISABLED',
        'Behavioral analysis is disabled in your privacy settings. Enable it in Settings to use this feature.',
      ),
      { status: 403 },
    )
  }

  // Run full analysis using static method
  const analysisResults = await BehavioralPatternEngine.runFullAnalysis(params.userId)

  // If insufficient data, return friendly message with requirements
  if (analysisResults.insufficientData && analysisResults.requirements) {
    return Response.json(
      successResponse({
        insufficientData: true,
        dataRequirements: analysisResults.requirements,
        message: `Complete ${analysisResults.requirements.weeksNeeded} more weeks of study sessions to enable pattern analysis`,
      }),
    )
  }

  // Return full analysis results
  return Response.json(
    successResponse({
      patterns: analysisResults.patterns,
      insights: analysisResults.insights,
      profile: analysisResults.profile,
    }),
  )
})
