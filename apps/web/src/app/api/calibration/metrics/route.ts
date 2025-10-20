/**
 * GET /api/calibration/metrics
 *
 * Fetch user's calibration history with filters and analytics
 *
 * Story 4.4 Task 4.3: Calibration Metrics Endpoint
 *
 * Returns:
 * - Historical calibration data (ValidationResponse records)
 * - Correlation coefficient (Pearson's r)
 * - Trend analysis (improving/stable/declining)
 * - Overconfident topics (delta > 15 consistently)
 * - Underconfident topics (delta < -15 consistently)
 *
 * @see story-context-4.4.xml interface "GET /api/calibration/metrics"
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getUserId } from '@/lib/auth';
import {
  calculateCorrelation,
  interpretCorrelation,
  calculateTrend,
  normalizeConfidence,
  identifyOverconfidentTopics,
  identifyUnderconfidentTopics,
} from '@/lib/confidence-calibrator';

// Zod validation schema for query parameters
const metricsQuerySchema = z.object({
  dateRange: z.enum(['7d', '30d', '90d']).optional().default('30d'),
  courseId: z.string().cuid().optional(),
  assessmentType: z.enum(['comprehension', 'clinical', 'failure']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get user ID (hardcoded for MVP per CLAUDE.md)
    const userId = await getUserId();

    // Parse and validate query parameters
    const { searchParams } = request.nextUrl;
    const queryParams = {
      dateRange: searchParams.get('dateRange') || '30d',
      courseId: searchParams.get('courseId') || undefined,
      assessmentType: searchParams.get('assessmentType') || undefined,
    };

    const validatedParams = metricsQuerySchema.parse(queryParams);
    const { dateRange, courseId, assessmentType } = validatedParams;

    // Calculate date range
    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const daysAgo = daysMap[dateRange];
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(0, 0, 0, 0);

    // Build where clause for ValidationResponse query
    const whereClause: any = {
      userId,
      respondedAt: {
        gte: startDate,
      },
      preAssessmentConfidence: {
        not: null, // Only include responses with calibration data
      },
    };

    // Filter by assessment type
    if (assessmentType) {
      if (assessmentType === 'comprehension') {
        whereClause.prompt = { promptType: 'EXPLAIN_TO_PATIENT' };
      } else if (assessmentType === 'clinical') {
        whereClause.prompt = { promptType: 'CLINICAL_REASONING' };
      } else if (assessmentType === 'failure') {
        whereClause.isControlledFailure = true;
      }
    }

    // Filter by course (via prompt -> objective -> lecture -> course)
    if (courseId) {
      whereClause.prompt = {
        ...whereClause.prompt,
        learningObjective: {
          lecture: {
            courseId,
          },
        },
      };
    }

    // Fetch validation responses with calibration data
    const responses = await prisma.validationResponse.findMany({
      where: whereClause,
      include: {
        prompt: {
          include: {
            learningObjective: {
              include: {
                lecture: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        respondedAt: 'asc',
      },
    });

    // Handle no data case
    if (responses.length === 0) {
      return NextResponse.json(
        successResponse({
          metrics: [],
          correlationCoeff: null,
          correlationInterpretation: 'No calibration data available for the selected period',
          trend: 'stable',
          overconfidentTopics: [],
          underconfidentTopics: [],
          sampleSize: 0,
        })
      );
    }

    // Extract confidence and score arrays for correlation calculation
    const confidenceArray: number[] = [];
    const scoreArray: number[] = [];

    responses.forEach(response => {
      if (response.preAssessmentConfidence !== null) {
        // Normalize confidence to 0-100 scale
        const normalizedConfidence = normalizeConfidence(response.preAssessmentConfidence);
        confidenceArray.push(normalizedConfidence);
        // Score stored as 0-1, convert to 0-100
        scoreArray.push(response.score * 100);
      }
    });

    // Calculate overall correlation coefficient
    const correlationCoeff = calculateCorrelation(confidenceArray, scoreArray);
    const correlationInterpretation = interpretCorrelation(correlationCoeff);

    // Calculate trend (compare recent half to earlier half)
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (responses.length >= 10) {
      const midpoint = Math.floor(responses.length / 2);
      const earlierResponses = responses.slice(0, midpoint);
      const recentResponses = responses.slice(midpoint);

      const earlierConfidence = earlierResponses
        .filter(r => r.preAssessmentConfidence !== null)
        .map(r => normalizeConfidence(r.preAssessmentConfidence!));
      const earlierScores = earlierResponses.map(r => r.score * 100);

      const recentConfidence = recentResponses
        .filter(r => r.preAssessmentConfidence !== null)
        .map(r => normalizeConfidence(r.preAssessmentConfidence!));
      const recentScores = recentResponses.map(r => r.score * 100);

      const earlierCorrelation = calculateCorrelation(earlierConfidence, earlierScores);
      const recentCorrelation = calculateCorrelation(recentConfidence, recentScores);

      trend = calculateTrend(recentCorrelation, earlierCorrelation);
    }

    // Identify overconfident and underconfident topics
    const assessmentsForTopics = responses
      .filter(r => r.calibrationDelta !== null)
      .map(r => ({
        conceptName: r.prompt.conceptName,
        calibrationDelta: r.calibrationDelta!,
      }));

    const overconfidentTopics = identifyOverconfidentTopics(assessmentsForTopics, 15, 3);
    const underconfidentTopics = identifyUnderconfidentTopics(assessmentsForTopics, -15, 3);

    // Format response metrics
    const metrics = responses.map(response => ({
      id: response.id,
      respondedAt: response.respondedAt,
      conceptName: response.prompt.conceptName,
      preAssessmentConfidence: response.preAssessmentConfidence,
      postAssessmentConfidence: response.postAssessmentConfidence,
      confidenceShift: response.confidenceShift,
      score: response.score * 100, // Convert to 0-100
      calibrationDelta: response.calibrationDelta,
      calibrationCategory: response.calibrationCategory,
      courseName: response.prompt.learningObjective?.lecture?.course?.name || null,
    }));

    return NextResponse.json(
      successResponse({
        metrics,
        correlationCoeff,
        correlationInterpretation,
        trend,
        overconfidentTopics,
        underconfidentTopics,
        sampleSize: responses.length,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid query parameters', error.issues),
        { status: 400 }
      );
    }

    console.error('Error fetching calibration metrics:', error);
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch calibration metrics'
      ),
      { status: 500 }
    );
  }
}
