import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { validateQuery, calibrationQuerySchema } from '@/lib/validation';

/**
 * GET /api/validation/calibration
 *
 * Fetch calibration metrics for the current user.
 *
 * **Calibration** measures how well a user's confidence matches their actual performance.
 * - **Well-calibrated**: High confidence correlates with high scores
 * - **Overconfident**: High confidence but low scores (dangerous - false sense of mastery)
 * - **Underconfident**: Low confidence but high scores (missed opportunities)
 *
 * **Workflow**:
 * 1. Get current user ID
 * 2. Query ValidationResponse records within date range
 * 3. Calculate calibration metrics:
 *    - Mean Absolute Error (MAE): avg(|confidence - score|)
 *    - Correlation coefficient: how confidence tracks with score
 *    - Overconfidence examples: confidence > score + 15
 *    - Underconfidence examples: score > confidence + 15
 * 4. Calculate trend (improving/stable/worsening) by comparing recent vs older MAE
 * 5. Return metrics with specific examples
 *
 * **Query Parameters**:
 * - dateRange: '7days' | '30days' | '90days' (default '30days')
 *
 * **Response**:
 * {
 *   calibrationScore: number, // 0-100 (100 = perfect calibration)
 *   meanAbsoluteError: number, // Average |confidence - score|
 *   correlationCoefficient: number, // -1 to 1 (1 = perfect positive correlation)
 *   overconfidentExamples: Array<{
 *     promptId: string,
 *     conceptName: string,
 *     confidence: number,
 *     score: number,
 *     delta: number
 *   }>,
 *   underconfidentExamples: Array<{...}>,
 *   trend: 'IMPROVING' | 'STABLE' | 'WORSENING',
 *   totalAttempts: number
 * }
 *
 * @see Story 4.3 Task 11 (API Endpoints)
 * @see Story 4.3 AC#7 (Confidence Recalibration)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const { dateRange } = validateQuery(searchParams, calibrationQuerySchema);

    // Calculate date range
    const daysMap = { '7days': 7, '30days': 30, '90days': 90 };
    const days = daysMap[dateRange];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Query validation responses with confidence data
    const responses = await prisma.validationResponse.findMany({
      where: {
        userId,
        respondedAt: {
          gte: startDate,
        },
        confidenceLevel: {
          not: null,
        },
        skipped: false,
      },
      include: {
        prompt: {
          select: {
            id: true,
            conceptName: true,
          },
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
    });

    if (responses.length === 0) {
      return NextResponse.json(
        successResponse({
          calibrationScore: 0,
          meanAbsoluteError: 0,
          correlationCoefficient: 0,
          overconfidentExamples: [],
          underconfidentExamples: [],
          trend: 'STABLE',
          totalAttempts: 0,
        })
      );
    }

    // Calculate calibration metrics
    const dataPoints = responses.map(r => ({
      promptId: r.promptId,
      conceptName: r.prompt.conceptName,
      confidence: ((r.confidenceLevel! - 1) * 25), // Convert 1-5 to 0-100
      score: r.score * 100, // Convert 0-1 to 0-100
      respondedAt: r.respondedAt,
    }));

    // Mean Absolute Error (MAE)
    const absoluteErrors = dataPoints.map(d => Math.abs(d.confidence - d.score));
    const meanAbsoluteError = absoluteErrors.reduce((sum, err) => sum + err, 0) / absoluteErrors.length;

    // Correlation coefficient (Pearson's r)
    const confidences = dataPoints.map(d => d.confidence);
    const scores = dataPoints.map(d => d.score);

    const meanConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const meanScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    const numerator = dataPoints.reduce((sum, d) => {
      return sum + (d.confidence - meanConfidence) * (d.score - meanScore);
    }, 0);

    const denominator = Math.sqrt(
      confidences.reduce((sum, c) => sum + Math.pow(c - meanConfidence, 2), 0) *
      scores.reduce((sum, s) => sum + Math.pow(s - meanScore, 2), 0)
    );

    const correlationCoefficient = denominator === 0 ? 0 : numerator / denominator;

    // Calibration score: 0-100 (100 = perfect calibration)
    // Based on MAE (lower is better) and correlation (higher is better)
    const maeScore = Math.max(0, 100 - meanAbsoluteError); // 0 MAE = 100, 100 MAE = 0
    const correlationScore = (correlationCoefficient + 1) * 50; // -1 to 1 -> 0 to 100
    const calibrationScore = (maeScore * 0.7 + correlationScore * 0.3); // Weight MAE more

    // Identify overconfident and underconfident examples
    const overconfidentExamples = dataPoints
      .filter(d => d.confidence - d.score > 15) // Confidence exceeds score by >15
      .sort((a, b) => (b.confidence - b.score) - (a.confidence - a.score))
      .slice(0, 5)
      .map(d => ({
        promptId: d.promptId,
        conceptName: d.conceptName,
        confidence: Math.round(d.confidence),
        score: Math.round(d.score),
        delta: Math.round(d.confidence - d.score),
      }));

    const underconfidentExamples = dataPoints
      .filter(d => d.score - d.confidence > 15) // Score exceeds confidence by >15
      .sort((a, b) => (b.score - b.confidence) - (a.score - a.confidence))
      .slice(0, 5)
      .map(d => ({
        promptId: d.promptId,
        conceptName: d.conceptName,
        confidence: Math.round(d.confidence),
        score: Math.round(d.score),
        delta: Math.round(d.score - d.confidence),
      }));

    // Calculate trend (compare recent half vs older half)
    const midpoint = Math.floor(dataPoints.length / 2);
    const recentData = dataPoints.slice(0, midpoint);
    const olderData = dataPoints.slice(midpoint);

    const recentMAE = recentData.length > 0
      ? recentData.reduce((sum, d) => sum + Math.abs(d.confidence - d.score), 0) / recentData.length
      : meanAbsoluteError;

    const olderMAE = olderData.length > 0
      ? olderData.reduce((sum, d) => sum + Math.abs(d.confidence - d.score), 0) / olderData.length
      : meanAbsoluteError;

    let trend: 'IMPROVING' | 'STABLE' | 'WORSENING' = 'STABLE';
    const maeDiff = olderMAE - recentMAE; // Positive = improving (MAE decreased)

    if (maeDiff > 5) {
      trend = 'IMPROVING';
    } else if (maeDiff < -5) {
      trend = 'WORSENING';
    }

    return NextResponse.json(
      successResponse({
        calibrationScore: Math.round(calibrationScore),
        meanAbsoluteError: Math.round(meanAbsoluteError * 10) / 10, // Round to 1 decimal
        correlationCoefficient: Math.round(correlationCoefficient * 100) / 100, // Round to 2 decimals
        overconfidentExamples,
        underconfidentExamples,
        trend,
        totalAttempts: responses.length,
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
