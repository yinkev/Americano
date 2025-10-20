/**
 * POST /api/analytics/cognitive-load/calculate
 *
 * Research-Grade Cognitive Load Calculation API
 * Story 5.4 Task 6.1 - Cognitive Load Monitoring
 *
 * **Theoretical Foundation:** Cognitive Load Theory (Sweller, 2011)
 *
 * Calculates real-time cognitive load using a 5-factor weighted algorithm:
 * - Response Latency (30%): Measures processing time increases
 * - Error Rate (25%): Indicates intrinsic load from content difficulty
 * - Engagement Drop (20%): Detects extraneous load from interface issues
 * - Performance Decline (15%): Tracks germane load effectiveness
 * - Duration Stress (10%): Identifies fatigue-related overload
 *
 * **Performance:** <100ms calculation time (real-time monitoring requirement)
 *
 * **Input:**
 * - userId: User identifier
 * - sessionId: Current study session ID
 * - behavioralData: Real-time behavioral metrics from study session
 *
 * **Output:**
 * - loadScore: 0-100 composite cognitive load score
 * - loadLevel: LOW | MODERATE | HIGH | CRITICAL
 * - stressIndicators: Array of detected stress factors with severity
 * - overloadDetected: Boolean flag for immediate intervention
 * - recommendations: Actionable suggestions to reduce cognitive load
 * - confidenceLevel: 0.0-1.0 confidence based on data quality
 *
 * **References:**
 * - Sweller, J. (2011). Cognitive load theory. Psychology of Learning and Motivation, 55, 37-76.
 * - Paas, F., & Van Merriënboer, J. J. (2020). Cognitive-load theory. Current Directions in Psychological Science.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  cognitiveLoadMonitor,
  SessionBehavioralData,
} from '@/subsystems/behavioral-analytics/cognitive-load-monitor'

const calculateRequestSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  behavioralData: z.object({
    responseLatencies: z.array(z.number()).default([]),
    errorRate: z.number().min(0).max(1).default(0),
    engagementMetrics: z
      .object({
        pauseCount: z.number(),
        pauseDurationMs: z.number(),
        cardInteractions: z.number(),
      })
      .optional(),
    performanceScores: z.array(z.number()).default([]),
    sessionDuration: z.number().min(0), // minutes
    baselineData: z
      .object({
        avgResponseLatency: z.number(),
        baselinePerformance: z.number(),
      })
      .optional(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId, behavioralData } = calculateRequestSchema.parse(body)

    // Build session data for cognitive load calculation
    const sessionData: SessionBehavioralData = {
      userId,
      sessionId,
      ...behavioralData,
    }

    // Calculate cognitive load
    const result = await cognitiveLoadMonitor.calculateCurrentLoad(userId, sessionId, sessionData)

    return NextResponse.json({
      success: true,
      loadScore: result.loadScore,
      loadLevel: result.loadLevel,
      stressIndicators: result.stressIndicators,
      overloadDetected: result.overloadDetected,
      recommendations: result.recommendations,
      confidenceLevel: result.confidenceLevel,
      timestamp: result.timestamp,
    })
  } catch (error) {
    console.error('Error calculating cognitive load:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to calculate cognitive load' },
      { status: 500 },
    )
  }
}
