/**
 * POST /api/analytics/cognitive-load/calculate
 *
 * Calculate cognitive load for a study session
 * Story 5.4 Task 6.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cognitiveLoadMonitor, SessionBehavioralData } from '@/subsystems/behavioral-analytics/cognitive-load-monitor';

const calculateRequestSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  behavioralData: z.object({
    responseLatencies: z.array(z.number()).default([]),
    errorRate: z.number().min(0).max(1).default(0),
    engagementMetrics: z.object({
      pauseCount: z.number(),
      pauseDurationMs: z.number(),
      cardInteractions: z.number(),
    }).optional(),
    performanceScores: z.array(z.number()).default([]),
    sessionDuration: z.number().min(0), // minutes
    baselineData: z.object({
      avgResponseLatency: z.number(),
      baselinePerformance: z.number(),
    }).optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, behavioralData } = calculateRequestSchema.parse(body);

    // Build session data for cognitive load calculation
    const sessionData: SessionBehavioralData = {
      userId,
      sessionId,
      ...behavioralData,
    };

    // Calculate cognitive load
    const result = await cognitiveLoadMonitor.calculateCurrentLoad(userId, sessionId, sessionData);

    return NextResponse.json({
      success: true,
      loadScore: result.loadScore,
      loadLevel: result.loadLevel,
      stressIndicators: result.stressIndicators,
      overloadDetected: result.overloadDetected,
      recommendations: result.recommendations,
      confidenceLevel: result.confidenceLevel,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('Error calculating cognitive load:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to calculate cognitive load' },
      { status: 500 }
    );
  }
}
