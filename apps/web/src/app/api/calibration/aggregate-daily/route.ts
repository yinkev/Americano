/**
 * Story 4.4 Task 4.5: CalibrationMetric Daily Aggregation API
 *
 * Background job to aggregate daily calibration metrics for performance.
 * Processes ValidationResponse records from previous day and calculates:
 * - Average calibration delta per user/concept
 * - Pearson correlation coefficient
 * - Category counts (overconfident/underconfident/calibrated)
 * - Trend analysis (improving/stable/declining)
 *
 * Can be triggered by:
 * 1. Vercel Cron (configured in vercel.json)
 * 2. External cron service hitting this endpoint
 * 3. Manual invocation for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { subDays, startOfDay, endOfDay } from 'date-fns';

// Hardcoded user for MVP (as per Story 4.4 constraint #14)
const MVP_USER_ID = 'kevy@americano.dev';

/**
 * Calculate Pearson correlation coefficient between two arrays
 * Formula: r = [n*Σ(xy) - Σx*Σy] / sqrt([n*Σx² - (Σx)²] * [n*Σy² - (Σy)²])
 *
 * @param confidenceArray - Array of normalized confidence values (0-100)
 * @param scoreArray - Array of actual scores (0-100)
 * @returns Pearson's r correlation coefficient (-1 to 1)
 */
function calculateCorrelation(confidenceArray: number[], scoreArray: number[]): number {
  const n = confidenceArray.length;

  // Require minimum 5 assessments for meaningful correlation (Story 4.4 constraint #4)
  if (n < 5) {
    return 0;
  }

  const sumX = confidenceArray.reduce((a, b) => a + b, 0);
  const sumY = scoreArray.reduce((a, b) => a + b, 0);
  const sumXY = confidenceArray.reduce((sum, x, i) => sum + x * scoreArray[i], 0);
  const sumX2 = confidenceArray.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = scoreArray.reduce((sum, y) => sum + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  // Handle divide by zero (all same values = no variance)
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Normalize confidence value from 1-5 scale to 0-100 scale
 * Formula: (confidence - 1) * 25
 * Maps: 1→0, 2→25, 3→50, 4→75, 5→100
 */
function normalizeConfidence(confidence: number): number {
  return (confidence - 1) * 25;
}

/**
 * Calculate calibration delta and categorize
 * Delta = confidenceNormalized - score
 * Categories (15-point threshold per Story 4.4 constraint #3):
 * - OVERCONFIDENT: delta > 15
 * - UNDERCONFIDENT: delta < -15
 * - CALIBRATED: -15 <= delta <= 15
 */
function categorizeCalibration(delta: number): 'OVERCONFIDENT' | 'UNDERCONFIDENT' | 'CALIBRATED' {
  if (delta > 15) return 'OVERCONFIDENT';
  if (delta < -15) return 'UNDERCONFIDENT';
  return 'CALIBRATED';
}

/**
 * Determine trend by comparing today's correlation to previous day
 * - IMPROVING: correlation increased significantly (> 0.1 improvement)
 * - DECLINING: correlation decreased significantly (> 0.1 decline)
 * - STABLE: within ±0.1 of previous day
 */
function determineTrend(
  currentCorrelation: number,
  previousCorrelation: number | null
): 'IMPROVING' | 'STABLE' | 'DECLINING' {
  if (previousCorrelation === null) return 'STABLE';

  const delta = currentCorrelation - previousCorrelation;

  if (delta > 0.1) return 'IMPROVING';
  if (delta < -0.1) return 'DECLINING';
  return 'STABLE';
}

/**
 * Aggregate calibration metrics for a specific date
 * Groups by user and optionally by learning objective
 */
async function aggregateCalibrationMetrics(date: Date) {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);

  console.log(`Aggregating calibration metrics for ${date.toISOString()}`);

  // Fetch all ValidationResponse records with confidence data from the target day
  const responses = await prisma.validationResponse.findMany({
    where: {
      respondedAt: {
        gte: startDate,
        lte: endDate,
      },
      preAssessmentConfidence: {
        not: null,
      },
      // Only process responses with actual scores
      score: {
        not: null,
      },
    },
    select: {
      userId: true,
      preAssessmentConfidence: true,
      score: true,
      calibrationDelta: true,
      calibrationCategory: true,
      prompt: {
        select: {
          objectiveId: true,
          conceptName: true,
        },
      },
    },
    orderBy: {
      respondedAt: 'asc',
    },
  });

  console.log(`Found ${responses.length} validation responses with confidence data`);

  if (responses.length === 0) {
    console.log('No responses to aggregate');
    return { aggregated: 0, metrics: [] };
  }

  // Group responses by userId and objectiveId (per-user per-objective aggregation)
  const groupedResponses = new Map<string, typeof responses>();

  for (const response of responses) {
    // Create separate metrics for:
    // 1. User-level (all objectives combined)
    // 2. User + Objective level (specific objective)

    const userKey = response.userId;
    const userObjectiveKey = response.prompt.objectiveId
      ? `${response.userId}:${response.prompt.objectiveId}`
      : null;

    // Add to user-level group
    if (!groupedResponses.has(userKey)) {
      groupedResponses.set(userKey, []);
    }
    groupedResponses.get(userKey)!.push(response);

    // Add to user+objective-level group if objectiveId exists
    if (userObjectiveKey) {
      if (!groupedResponses.has(userObjectiveKey)) {
        groupedResponses.set(userObjectiveKey, []);
      }
      groupedResponses.get(userObjectiveKey)!.push(response);
    }
  }

  console.log(`Grouped into ${groupedResponses.size} unique user/objective combinations`);

  // Calculate metrics for each group
  const metricsToCreate = [];

  for (const [key, groupResponses] of groupedResponses.entries()) {
    const [userId, objectiveId] = key.includes(':') ? key.split(':') : [key, null];

    // Extract confidence and score arrays for correlation calculation
    const confidenceArray: number[] = [];
    const scoreArray: number[] = [];
    let sumDelta = 0;
    let overconfidentCount = 0;
    let underconfidentCount = 0;
    let calibratedCount = 0;

    for (const response of groupResponses) {
      const confidence = response.preAssessmentConfidence!;
      const score = response.score! * 100; // Normalize score from 0-1 to 0-100

      const confidenceNormalized = normalizeConfidence(confidence);
      confidenceArray.push(confidenceNormalized);
      scoreArray.push(score);

      // Calculate delta (may differ slightly from stored calibrationDelta due to rounding)
      const delta = confidenceNormalized - score;
      sumDelta += delta;

      // Count calibration categories
      const category = categorizeCalibration(delta);
      if (category === 'OVERCONFIDENT') overconfidentCount++;
      else if (category === 'UNDERCONFIDENT') underconfidentCount++;
      else calibratedCount++;
    }

    const sampleSize = groupResponses.length;
    const avgDelta = sumDelta / sampleSize;
    const correlationCoeff = calculateCorrelation(confidenceArray, scoreArray);

    // Calculate Mean Absolute Error (MAE) for calibration quality
    const sumAbsoluteDelta = groupResponses.reduce((sum, r) => {
      const confidence = r.preAssessmentConfidence!;
      const score = r.score! * 100;
      const delta = normalizeConfidence(confidence) - score;
      return sum + Math.abs(delta);
    }, 0);
    const meanAbsoluteError = sumAbsoluteDelta / sampleSize;

    // Determine trend by comparing to previous day's metric
    const previousDayStart = startOfDay(subDays(date, 1));
    const previousDayEnd = endOfDay(subDays(date, 1));

    const previousMetric = await prisma.calibrationMetric.findFirst({
      where: {
        userId,
        objectiveId: objectiveId || null,
        date: {
          gte: previousDayStart,
          lte: previousDayEnd,
        },
      },
      select: {
        correlationCoeff: true,
      },
    });

    const trend = determineTrend(
      correlationCoeff,
      previousMetric?.correlationCoeff ?? null
    );

    metricsToCreate.push({
      userId,
      objectiveId: objectiveId || null,
      date: startDate,
      avgDelta,
      correlationCoeff,
      sampleSize,
      trend,
      overconfidentCount,
      underconfidentCount,
      calibratedCount,
      meanAbsoluteError,
    });
  }

  console.log(`Creating ${metricsToCreate.length} calibration metrics`);

  // Upsert metrics (update if exists, create if not)
  // This handles re-running aggregation for the same day
  const results = await Promise.all(
    metricsToCreate.map((metric) =>
      prisma.calibrationMetric.upsert({
        where: {
          userId_date_objectiveId: {
            userId: metric.userId,
            date: metric.date,
            objectiveId: metric.objectiveId,
          },
        },
        update: {
          avgDelta: metric.avgDelta,
          correlationCoeff: metric.correlationCoeff,
          sampleSize: metric.sampleSize,
          trend: metric.trend,
          overconfidentCount: metric.overconfidentCount,
          underconfidentCount: metric.underconfidentCount,
          calibratedCount: metric.calibratedCount,
          meanAbsoluteError: metric.meanAbsoluteError,
        },
        create: metric,
      })
    )
  );

  console.log(`Successfully aggregated ${results.length} calibration metrics`);

  return {
    aggregated: results.length,
    metrics: results.map((m) => ({
      userId: m.userId,
      objectiveId: m.objectiveId,
      avgDelta: m.avgDelta,
      correlationCoeff: m.correlationCoeff,
      sampleSize: m.sampleSize,
      trend: m.trend,
    })),
  };
}

/**
 * POST /api/calibration/aggregate-daily
 *
 * Aggregate calibration metrics for a specific date (or yesterday by default)
 *
 * Request body (optional):
 * {
 *   "date": "2025-10-17" // ISO date string, defaults to yesterday
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "date": "2025-10-16T00:00:00.000Z",
 *   "aggregated": 5,
 *   "metrics": [...]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Default to yesterday (typical use case for daily aggregation)
    const targetDate = body.date
      ? new Date(body.date)
      : subDays(new Date(), 1);

    console.log(`Starting calibration aggregation for ${targetDate.toISOString()}`);

    const result = await aggregateCalibrationMetrics(targetDate);

    return NextResponse.json({
      success: true,
      date: startOfDay(targetDate),
      aggregated: result.aggregated,
      metrics: result.metrics,
      message: `Successfully aggregated ${result.aggregated} calibration metrics`,
    }, { status: 200 });

  } catch (error) {
    console.error('Calibration aggregation failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to aggregate calibration metrics',
    }, { status: 500 });
  }
}

/**
 * GET /api/calibration/aggregate-daily
 *
 * Health check endpoint to verify aggregation status
 * Returns the most recent aggregation metrics
 */
export async function GET() {
  try {
    // Get the most recent calibration metric to show aggregation status
    const latestMetric = await prisma.calibrationMetric.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        date: true,
        createdAt: true,
        userId: true,
        sampleSize: true,
        correlationCoeff: true,
      },
    });

    if (!latestMetric) {
      return NextResponse.json({
        message: 'No calibration metrics found. Run POST to aggregate data.',
        hasData: false,
      }, { status: 200 });
    }

    // Count total metrics for the latest aggregation date
    const metricsCount = await prisma.calibrationMetric.count({
      where: {
        date: latestMetric.date,
      },
    });

    return NextResponse.json({
      message: 'Calibration aggregation service is healthy',
      hasData: true,
      latestAggregation: {
        date: latestMetric.date,
        createdAt: latestMetric.createdAt,
        metricsCount,
        sampleMetric: {
          userId: latestMetric.userId,
          sampleSize: latestMetric.sampleSize,
          correlationCoeff: latestMetric.correlationCoeff,
        },
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json({
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
