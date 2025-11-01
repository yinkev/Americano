/**
 * Performance Correlation API
 * Story 5.6 Task 10
 *
 * GET /api/analytics/behavioral-insights/correlation
 *
 * Returns performance correlation analysis using AcademicPerformanceIntegration subsystem.
 * Calculates Pearson correlation coefficient, p-value, and confidence intervals
 * between behavioral scores and academic performance.
 *
 * @route GET /api/analytics/behavioral-insights/correlation
 */

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUserId } from '@/lib/auth'
import { AcademicPerformanceIntegration } from '@/subsystems/behavioral-analytics/academic-performance-integration'

/**
 * Query parameter validation schema
 */
const QuerySchema = z.object({
  weeks: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 12))
    .refine((val) => !Number.isNaN(val) && val >= 8 && val <= 52, {
      message: 'weeks must be between 8 and 52',
    }),
  metric: z.enum(['behavioral', 'mission']).optional().default('behavioral'),
  userId: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : undefined))
    .refine((val) => val === undefined || val.length > 0, {
      message: 'userId cannot be empty',
    }),
})

/**
 * Response type for correlation analysis
 */
interface CorrelationResponse {
  coefficient: number // Pearson r (-1.0 to 1.0)
  pValue: number // Statistical significance (0.0-1.0)
  interpretation: string // Human-readable interpretation
  confidenceInterval: [number, number] // 95% CI
  timeSeriesData: Array<{
    date: string
    behavioralScore: number
    academicScore: number
  }>
  insights: string[] // Actionable insights with causation warnings
  dataQuality: {
    sampleSize: number
    weeksOfData: number
    missingDataPoints: number
  }
}

/**
 * Error response helper
 */
function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status },
  )
}

/**
 * Success response helper
 */
function successResponse(data: CorrelationResponse) {
  return NextResponse.json({
    success: true,
    data,
  })
}

/**
 * GET /api/analytics/behavioral-insights/correlation
 *
 * Query Parameters:
 * - weeks: Number of weeks to analyze (8-52, default 12)
 * - metric: Type of metric to correlate ("behavioral" | "mission", default "behavioral")
 * - userId: Optional user identifier (defaults to current authenticated user)
 *
 * Response:
 * {
 *   coefficient: number,        // Pearson r
 *   pValue: number,             // Statistical significance
 *   interpretation: string,      // "strong positive", etc.
 *   confidenceInterval: [min, max],
 *   timeSeriesData: [...],
 *   insights: [...],
 *   dataQuality: {...}
 * }
 *
 * Errors:
 * - 400: Invalid query parameters
 * - 400: Insufficient data (< 10 data points or < 8 weeks)
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUserId = await getCurrentUserId()

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      weeks: searchParams.get('weeks'),
      metric: searchParams.get('metric'),
      userId: searchParams.get('userId'),
    }

    const validatedParams = QuerySchema.safeParse(queryParams)

    if (!validatedParams.success) {
      return errorResponse(
        `Invalid query parameters: ${validatedParams.error.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`,
      )
    }

    const { weeks, metric, userId: queryUserId } = validatedParams.data

    const sessionUserId = await getCurrentUserId()

    if (!sessionUserId) {
      return errorResponse('Unable to resolve authenticated user', 401)
    }

    if (queryUserId && queryUserId !== sessionUserId) {
      return errorResponse('Forbidden: userId does not match the authenticated user', 403)
    }

    const userId = sessionUserId

    // Calculate correlation using AcademicPerformanceIntegration subsystem
    let correlationResult

    try {
      correlationResult = await AcademicPerformanceIntegration.correlatePerformance(userId, weeks)
    } catch (error) {
      if (error instanceof Error && error.message.includes('Insufficient data')) {
        return errorResponse(error.message, 400)
      }
      throw error // Re-throw unexpected errors
    }

    // Build response
    const response: CorrelationResponse = {
      coefficient: correlationResult.coefficient,
      pValue: correlationResult.pValue,
      interpretation: correlationResult.interpretation,
      confidenceInterval: correlationResult.confidenceInterval,
      timeSeriesData: correlationResult.timeSeriesData,
      insights: correlationResult.insights,
      dataQuality: correlationResult.dataQuality,
    }

    return successResponse(response)
  } catch (error) {
    console.error('[Correlation API Error]:', error)
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
}
