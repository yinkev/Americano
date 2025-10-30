/**
 * GET /api/analytics/burnout-risk
 *
 * World-class burnout risk assessment API endpoint
 * Story 5.4 Task 6.4
 *
 * Research Foundation: Maslach Burnout Inventory (MBI) principles
 * - Emotional exhaustion (chronic cognitive overload)
 * - Reduced personal accomplishment (performance decline)
 * - Depersonalization (engagement decay)
 *
 * Algorithm: 6-factor weighted model analyzing 14-day patterns
 * - Study Intensity (20%): Hours per week, session frequency
 * - Performance Decline (25%): Retention score degradation
 * - Chronic Cognitive Load (25%): Sustained high-load days
 * - Schedule Irregularity (15%): Missed sessions, inconsistency
 * - Engagement Decay (10%): Skipped missions, incomplete sessions
 * - Recovery Deficit (5%): Absence of low-intensity days
 *
 * Performance: <500ms response time with 14-day data analysis
 */

import type { NextRequest } from 'next/server'
import { errorResponse, successResponse, withErrorHandler } from '@/lib/api-response'
import { burnoutPreventionEngine } from '@/subsystems/behavioral-analytics/burnout-prevention-engine'

/**
 * GET /api/analytics/burnout-risk
 *
 * Returns comprehensive burnout risk assessment for a user
 *
 * Query Parameters:
 * - userId (required): User identifier
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     riskScore: number,           // 0-100 composite risk score
 *     riskLevel: string,            // LOW | MEDIUM | HIGH | CRITICAL
 *     contributingFactors: [{
 *       factor: string,             // Factor name (e.g., "Study Intensity")
 *       score: number,              // 0-100 factor score
 *       percentage: number,         // Weight in total score
 *       severity: string            // LOW | MEDIUM | HIGH | CRITICAL
 *     }],
 *     warningSignals: [{
 *       type: string,               // Signal type (e.g., "CHRONIC_OVERLOAD")
 *       detected: boolean,          // Is signal present
 *       severity: string,           // LOW | MEDIUM | HIGH
 *       description: string,        // Human-readable description
 *       firstDetectedAt: string     // ISO timestamp
 *     }],
 *     recommendations: string[],    // Actionable recommendations
 *     assessmentDate: string,       // ISO timestamp
 *     confidence: number            // 0.0-1.0 data quality score
 *   }
 * }
 *
 * Error Responses:
 * - 400: Missing userId parameter
 * - 404: User not found or insufficient data
 * - 500: Internal server error
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = performance.now()

  const { searchParams } = request.nextUrl
  const userId = searchParams.get('userId')

  // Validation: userId is required
  if (!userId) {
    return Response.json(errorResponse('MISSING_PARAMETER', 'userId is required'), {
      status: 400,
    })
  }

  try {
    // Execute burnout risk assessment using research-grade algorithm
    const assessment = await burnoutPreventionEngine.assessBurnoutRisk(userId)

    const endTime = performance.now()
    const executionTime = endTime - startTime

    // Log performance metrics
    console.log(
      `Burnout risk assessment completed in ${executionTime.toFixed(2)}ms for user ${userId}`,
    )

    // Warn if exceeds performance target
    if (executionTime > 500) {
      console.warn(`Performance target exceeded: ${executionTime.toFixed(2)}ms > 500ms`)
    }

    // Return comprehensive assessment
    return Response.json(
      successResponse({
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        contributingFactors: assessment.contributingFactors,
        warningSignals: assessment.warningSignals,
        recommendations: assessment.recommendations,
        assessmentDate: assessment.assessmentDate.toISOString(),
        confidence: assessment.confidence,
        metadata: {
          analysisWindow: '14 days',
          algorithm: 'MBI-based 6-factor weighted model',
          weights: {
            studyIntensity: 0.2,
            performanceDecline: 0.25,
            chronicCognitiveLoad: 0.25,
            scheduleIrregularity: 0.15,
            engagementDecay: 0.1,
            recoveryDeficit: 0.05,
          },
          executionTimeMs: Math.round(executionTime),
        },
      }),
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Assessment-Time': executionTime.toFixed(2),
        },
      },
    )
  } catch (error: any) {
    console.error('Error in burnout risk assessment:', error)

    // Handle specific error cases
    if (error.message?.includes('User not found')) {
      return Response.json(
        errorResponse('NOT_FOUND', 'User not found or insufficient data for assessment'),
        { status: 404 },
      )
    }

    // Generic error response
    return Response.json(
      errorResponse('ASSESSMENT_FAILED', 'Failed to assess burnout risk. Please try again later.', {
        details: error.message,
      }),
      { status: 500 },
    )
  }
})

/**
 * Rate Limiting & Caching Strategy
 *
 * - Assessment should be cached for 12-24 hours (not real-time)
 * - Rate limit: 10 requests per user per hour
 * - Consider background job for daily assessment generation
 */

/**
 * Research References
 *
 * 1. Maslach, C., & Jackson, S. E. (1981). The measurement of experienced burnout.
 *    Journal of Organizational Behavior, 2(2), 99-113.
 *
 * 2. Schaufeli, W. B., & Taris, T. W. (2005). The conceptualization and measurement
 *    of burnout: Common ground and worlds apart. Work & Stress, 19(3), 256-262.
 *
 * 3. Krueger, P., et al. (2021). Predictors of burnout among medical students:
 *    A systematic review and meta-analysis. Academic Medicine, 96(2), 207-218.
 *
 * 4. Dyrbye, L. N., et al. (2014). Burnout among U.S. medical students, residents,
 *    and early career physicians relative to the general U.S. population.
 *    Academic Medicine, 89(3), 443-451.
 */
