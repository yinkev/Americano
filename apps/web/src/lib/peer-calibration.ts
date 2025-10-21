/**
 * Peer Calibration Analyzer
 *
 * Privacy-first peer comparison analytics for confidence calibration.
 * Implements:
 * - Anonymized peer data aggregation (opt-in only)
 * - Distribution statistics (quartiles, median, mean)
 * - User percentile ranking
 * - Common overconfidence topic identification
 * - Privacy protection (minimum 20 user pool size)
 *
 * Story 4.4 Task 9: Peer Calibration Comparison
 */

import { prisma } from './db';

const MINIMUM_PEER_POOL_SIZE = 20;
const OVERCONFIDENCE_THRESHOLD = 15;
const COMMON_TOPIC_PREVALENCE_THRESHOLD = 0.5; // 50%

export interface PeerDistribution {
  correlations: number[];
  quartiles: [number, number, number]; // Q1, Q2 (median), Q3
  median: number;
  mean: number;
  poolSize: number;
}

export interface CommonOverconfidentTopic {
  topic: string;
  prevalence: number; // 0.0-1.0
  avgDelta: number;
}

export interface PeerComparisonResult {
  userCorrelation: number;
  userPercentile: number;
  peerDistribution: PeerDistribution;
  commonOverconfidentTopics: CommonOverconfidentTopic[];
  peerAvgCorrelation: number;
}

export class PeerCalibrationAnalyzer {
  /**
   * Aggregate anonymized calibration data from opted-in users
   * @param courseId Optional filter by course
   * @param dateRange Optional date range for metrics (default: last 30 days)
   */
  async aggregatePeerData(
    courseId?: string,
    dateRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }
  ): Promise<PeerDistribution> {
    // Query opted-in users only (privacy enforcement)
    const optedInUsers = await prisma.user.findMany({
      where: {
        sharePeerCalibrationData: true,
      },
      select: {
        id: true,
      },
    });

    // Enforce minimum pool size for privacy protection
    if (optedInUsers.length < MINIMUM_PEER_POOL_SIZE) {
      throw new Error(
        `Insufficient peer data for comparison. Need at least ${MINIMUM_PEER_POOL_SIZE} participants (current: ${optedInUsers.length})`
      );
    }

    const userIds = optedInUsers.map((u) => u.id);

    // Aggregate calibration metrics for opted-in users
    const calibrationMetrics = await prisma.calibrationMetric.findMany({
      where: {
        userId: { in: userIds },
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        ...(courseId && {
          objectiveId: {
            in: await this.getObjectiveIdsByCourse(courseId),
          },
        }),
      },
      select: {
        userId: true,
        correlationCoeff: true,
        sampleSize: true,
      },
    });

    // Calculate weighted average correlation per user
    const userCorrelations = new Map<string, { totalWeightedCorr: number; totalSamples: number }>();

    calibrationMetrics.forEach((metric) => {
      const existing = userCorrelations.get(metric.userId) || { totalWeightedCorr: 0, totalSamples: 0 };
      existing.totalWeightedCorr += metric.correlationCoeff * metric.sampleSize;
      existing.totalSamples += metric.sampleSize;
      userCorrelations.set(metric.userId, existing);
    });

    // Calculate final correlations (weighted by sample size)
    const correlations = Array.from(userCorrelations.values())
      .filter((u) => u.totalSamples >= 5) // Require minimum 5 samples for statistical validity
      .map((u) => u.totalWeightedCorr / u.totalSamples);

    if (correlations.length < MINIMUM_PEER_POOL_SIZE) {
      throw new Error(
        `Insufficient peer data with valid samples. Need at least ${MINIMUM_PEER_POOL_SIZE} participants`
      );
    }

    // Sort for quartile calculation
    const sortedCorrelations = [...correlations].sort((a, b) => a - b);

    // Calculate distribution statistics
    const quartiles = this.calculateQuartiles(sortedCorrelations);
    const median = quartiles[1];
    const mean = correlations.reduce((sum, c) => sum + c, 0) / correlations.length;

    return {
      correlations: sortedCorrelations,
      quartiles,
      median,
      mean,
      poolSize: correlations.length,
    };
  }

  /**
   * Calculate user's percentile ranking within peer distribution
   * @param userCorrelation User's correlation coefficient
   * @param peerDistribution Peer distribution data
   * @returns Percentile (0-100)
   */
  calculateUserPercentile(userCorrelation: number, peerDistribution: PeerDistribution): number {
    const { correlations } = peerDistribution;

    // Count peers below user's correlation
    const peersBelow = correlations.filter((c) => c < userCorrelation).length;

    // Calculate percentile (0-100)
    const percentile = (peersBelow / correlations.length) * 100;

    return Math.round(percentile);
  }

  /**
   * Identify topics where peers commonly show overconfidence
   * @param minPrevalence Minimum percentage of peers showing pattern (default: 50%)
   * @param dateRange Optional date range
   */
  async identifyCommonOverconfidentTopics(
    minPrevalence: number = COMMON_TOPIC_PREVALENCE_THRESHOLD,
    dateRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }
  ): Promise<CommonOverconfidentTopic[]> {
    // Query opted-in users
    const optedInUsers = await prisma.user.findMany({
      where: {
        sharePeerCalibrationData: true,
      },
      select: {
        id: true,
      },
    });

    if (optedInUsers.length < MINIMUM_PEER_POOL_SIZE) {
      return [];
    }

    const userIds = optedInUsers.map((u) => u.id);

    // Get validation responses showing overconfidence
    const overconfidentResponses = await prisma.validationResponse.findMany({
      where: {
        userId: { in: userIds },
        respondedAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        calibrationCategory: 'OVERCONFIDENT',
      },
      select: {
        userId: true,
        calibrationDelta: true,
        prompt: {
          select: {
            conceptName: true,
          },
        },
      },
    });

    // Group by concept and count users showing overconfidence
    const conceptStats = new Map<string, { userSet: Set<string>; totalDelta: number; count: number }>();

    overconfidentResponses.forEach((response) => {
      const concept = response.prompt.conceptName;
      const existing = conceptStats.get(concept) || {
        userSet: new Set<string>(),
        totalDelta: 0,
        count: 0,
      };

      existing.userSet.add(response.userId);
      existing.totalDelta += response.calibrationDelta || 0;
      existing.count += 1;

      conceptStats.set(concept, existing);
    });

    // Calculate prevalence and filter by threshold
    const commonTopics: CommonOverconfidentTopic[] = [];

    conceptStats.forEach((stats, topic) => {
      const prevalence = stats.userSet.size / optedInUsers.length;

      if (prevalence >= minPrevalence) {
        commonTopics.push({
          topic,
          prevalence,
          avgDelta: stats.totalDelta / stats.count,
        });
      }
    });

    // Sort by prevalence (most common first)
    commonTopics.sort((a, b) => b.prevalence - a.prevalence);

    return commonTopics;
  }

  /**
   * Generate complete peer comparison analysis for a user
   * @param userId User to analyze
   * @param courseId Optional course filter
   */
  async generatePeerComparison(userId: string, courseId?: string): Promise<PeerComparisonResult> {
    // Check if user is opted-in
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sharePeerCalibrationData: true },
    });

    if (!user?.sharePeerCalibrationData) {
      throw new Error('User has not opted into peer calibration data sharing');
    }

    // Get user's correlation coefficient
    const dateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    const userMetrics = await prisma.calibrationMetric.findMany({
      where: {
        userId,
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        ...(courseId && {
          objectiveId: {
            in: await this.getObjectiveIdsByCourse(courseId),
          },
        }),
      },
      select: {
        correlationCoeff: true,
        sampleSize: true,
      },
    });

    if (userMetrics.length === 0) {
      throw new Error('Insufficient user data for peer comparison. Complete at least 5 assessments.');
    }

    // Calculate weighted average user correlation
    const totalWeighted = userMetrics.reduce((sum, m) => sum + m.correlationCoeff * m.sampleSize, 0);
    const totalSamples = userMetrics.reduce((sum, m) => sum + m.sampleSize, 0);
    const userCorrelation = totalWeighted / totalSamples;

    // Get peer distribution
    const peerDistribution = await this.aggregatePeerData(courseId, dateRange);

    // Calculate user percentile
    const userPercentile = this.calculateUserPercentile(userCorrelation, peerDistribution);

    // Get common overconfident topics
    const commonOverconfidentTopics = await this.identifyCommonOverconfidentTopics(
      COMMON_TOPIC_PREVALENCE_THRESHOLD,
      dateRange
    );

    return {
      userCorrelation,
      userPercentile,
      peerDistribution,
      commonOverconfidentTopics,
      peerAvgCorrelation: peerDistribution.mean,
    };
  }

  /**
   * Calculate quartiles from sorted array
   * @param sortedArray Sorted array of numbers
   * @returns [Q1, Q2 (median), Q3]
   */
  private calculateQuartiles(sortedArray: number[]): [number, number, number] {
    const n = sortedArray.length;

    const getMedian = (arr: number[]): number => {
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
    };

    const q2 = getMedian(sortedArray);

    const lowerHalf = sortedArray.slice(0, Math.floor(n / 2));
    const upperHalf = sortedArray.slice(Math.ceil(n / 2));

    const q1 = getMedian(lowerHalf);
    const q3 = getMedian(upperHalf);

    return [q1, q2, q3];
  }

  /**
   * Get objective IDs for a specific course
   * @param courseId Course ID
   */
  private async getObjectiveIdsByCourse(courseId: string): Promise<string[]> {
    const objectives = await prisma.learningObjective.findMany({
      where: {
        lecture: {
          courseId,
        },
      },
      select: {
        id: true,
      },
    });

    return objectives.map((o) => o.id);
  }
}
