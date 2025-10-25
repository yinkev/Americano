#!/usr/bin/env tsx
/**
 * Story 4.4 Task 4.5: Standalone Calibration Metrics Aggregation Script
 *
 * This script can be run directly via:
 * 1. Node.js: `npx tsx scripts/aggregate-calibration-metrics.ts`
 * 2. Cron job: Add to crontab for daily execution
 * 3. npm script: `npm run aggregate:calibration`
 *
 * Usage:
 *   # Aggregate yesterday's data (default)
 *   npx tsx scripts/aggregate-calibration-metrics.ts
 *
 *   # Aggregate specific date
 *   npx tsx scripts/aggregate-calibration-metrics.ts --date 2025-10-16
 *
 *   # Aggregate last N days (backfill)
 *   npx tsx scripts/aggregate-calibration-metrics.ts --days 7
 *
 * Cron example (run daily at 2 AM):
 *   0 2 * * * cd /path/to/americano-epic4/apps/web && npx tsx scripts/aggregate-calibration-metrics.ts >> /var/log/calibration-aggregation.log 2>&1
 */

import { prisma } from '@/lib/db';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

const prismaClient = prisma;

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
function calculateCorrelation(confidenceArray: number[], scoreArray: number[]): number {
  const n = confidenceArray.length;

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

  return denominator === 0 ? 0 : numerator / denominator;
}

function normalizeConfidence(confidence: number): number {
  return (confidence - 1) * 25;
}

function categorizeCalibration(delta: number): 'OVERCONFIDENT' | 'UNDERCONFIDENT' | 'CALIBRATED' {
  if (delta > 15) return 'OVERCONFIDENT';
  if (delta < -15) return 'UNDERCONFIDENT';
  return 'CALIBRATED';
}

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
 */
async function aggregateCalibrationMetrics(date: Date) {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);

  console.log(`\n[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] Aggregating calibration metrics for ${format(date, 'yyyy-MM-dd')}`);

  const responses = await prismaClient.validationResponse.findMany({
    where: {
      respondedAt: {
        gte: startDate,
        lte: endDate,
      },
      preAssessmentConfidence: {
        not: null,
      },
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

  console.log(`  → Found ${responses.length} validation responses with confidence data`);

  if (responses.length === 0) {
    console.log('  ✓ No responses to aggregate (skipping)');
    return { aggregated: 0, metrics: [] };
  }

  // Group responses by userId and objectiveId
  const groupedResponses = new Map<string, typeof responses>();

  for (const response of responses) {
    const userKey = response.userId;
    const userObjectiveKey = response.prompt.objectiveId
      ? `${response.userId}:${response.prompt.objectiveId}`
      : null;

    if (!groupedResponses.has(userKey)) {
      groupedResponses.set(userKey, []);
    }
    groupedResponses.get(userKey)!.push(response);

    if (userObjectiveKey) {
      if (!groupedResponses.has(userObjectiveKey)) {
        groupedResponses.set(userObjectiveKey, []);
      }
      groupedResponses.get(userObjectiveKey)!.push(response);
    }
  }

  console.log(`  → Grouped into ${groupedResponses.size} unique user/objective combinations`);

  const metricsToCreate = [];

  for (const [key, groupResponses] of groupedResponses.entries()) {
    const [userId, objectiveId] = key.includes(':') ? key.split(':') : [key, null];

    const confidenceArray: number[] = [];
    const scoreArray: number[] = [];
    let sumDelta = 0;
    let overconfidentCount = 0;
    let underconfidentCount = 0;
    let calibratedCount = 0;

    for (const response of groupResponses) {
      const confidence = response.preAssessmentConfidence!;
      const score = response.score! * 100;

      const confidenceNormalized = normalizeConfidence(confidence);
      confidenceArray.push(confidenceNormalized);
      scoreArray.push(score);

      const delta = confidenceNormalized - score;
      sumDelta += delta;

      const category = categorizeCalibration(delta);
      if (category === 'OVERCONFIDENT') overconfidentCount++;
      else if (category === 'UNDERCONFIDENT') underconfidentCount++;
      else calibratedCount++;
    }

    const sampleSize = groupResponses.length;
    const avgDelta = sumDelta / sampleSize;
    const correlationCoeff = calculateCorrelation(confidenceArray, scoreArray);

    const sumAbsoluteDelta = groupResponses.reduce((sum, r) => {
      const confidence = r.preAssessmentConfidence!;
      const score = r.score! * 100;
      const delta = normalizeConfidence(confidence) - score;
      return sum + Math.abs(delta);
    }, 0);
    const meanAbsoluteError = sumAbsoluteDelta / sampleSize;

    const previousDayStart = startOfDay(subDays(date, 1));
    const previousDayEnd = endOfDay(subDays(date, 1));

    const previousMetric = await prismaClient.calibrationMetric.findFirst({
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

  console.log(`  → Creating ${metricsToCreate.length} calibration metrics`);

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

  console.log(`  ✓ Successfully aggregated ${results.length} calibration metrics`);

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
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config: {
    date?: Date;
    days?: number;
  } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--date' && i + 1 < args.length) {
      config.date = new Date(args[i + 1]);
      i++;
    } else if (arg === '--days' && i + 1 < args.length) {
      config.days = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Calibration Metrics Aggregation Script

Usage:
  npx tsx scripts/aggregate-calibration-metrics.ts [options]

Options:
  --date YYYY-MM-DD    Aggregate specific date (default: yesterday)
  --days N             Aggregate last N days (backfill)
  --help, -h           Show this help message

Examples:
  # Aggregate yesterday's data
  npx tsx scripts/aggregate-calibration-metrics.ts

  # Aggregate specific date
  npx tsx scripts/aggregate-calibration-metrics.ts --date 2025-10-16

  # Backfill last 7 days
  npx tsx scripts/aggregate-calibration-metrics.ts --days 7
      `);
      process.exit(0);
    }
  }

  return config;
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log('Calibration Metrics Daily Aggregation');
  console.log('='.repeat(60));

  try {
    const config = parseArgs();

    let datesToAggregate: Date[] = [];

    if (config.days) {
      // Backfill mode: aggregate last N days
      console.log(`\nBackfill mode: aggregating last ${config.days} days`);
      for (let i = 1; i <= config.days; i++) {
        datesToAggregate.push(subDays(new Date(), i));
      }
    } else if (config.date) {
      // Specific date mode
      console.log(`\nAggregating specific date: ${format(config.date, 'yyyy-MM-dd')}`);
      datesToAggregate = [config.date];
    } else {
      // Default: aggregate yesterday
      const yesterday = subDays(new Date(), 1);
      console.log(`\nDefault mode: aggregating yesterday (${format(yesterday, 'yyyy-MM-dd')})`);
      datesToAggregate = [yesterday];
    }

    let totalAggregated = 0;

    for (const date of datesToAggregate) {
      const result = await aggregateCalibrationMetrics(date);
      totalAggregated += result.aggregated;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log(`✓ Aggregation complete`);
    console.log(`  Total metrics created/updated: ${totalAggregated}`);
    console.log(`  Processing time: ${duration}s`);
    console.log('='.repeat(60));

    await prisma.$disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Aggregation failed:', error);
    console.error(error instanceof Error ? error.stack : error);

    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the script
main();
