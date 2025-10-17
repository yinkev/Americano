/**
 * A/B Testing Framework for Personalization Experimentation
 *
 * Story 5.5, Task 10: A/B Testing Framework
 *
 * Implements experiment management with:
 * - Minimum 20 users per variant requirement
 * - 2-week duration enforcement
 * - Statistical significance testing (p < 0.05)
 * - Winner selection with confidence intervals
 *
 * Spawns data-scientist for p-value calculations
 */

import { prisma } from '@/lib/db';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type VariantType = 'A' | 'B';

export interface ExperimentConfig {
  name: string;
  description: string;
  variantA: Record<string, any>; // Personalization config for variant A
  variantB: Record<string, any>; // Personalization config for variant B
  successMetric: 'retention' | 'performance' | 'completion_rate' | 'satisfaction';
  targetUserCount?: number; // Default: 20 per variant (40 total)
  durationWeeks?: number; // Default: 2 weeks
}

export interface ExperimentMetrics {
  retention?: number;
  performance?: number;
  completionRate?: number;
  satisfaction?: number;
}

export interface VariantStats {
  variant: VariantType;
  userCount: number;
  mean: number;
  stdDev: number;
  sampleSize: number;
  metrics: ExperimentMetrics;
}

export interface StatisticalResult {
  tStatistic: number;
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  effectSize: number; // Cohen's d
  winner: VariantType | 'inconclusive';
  recommendation: string;
}

export interface ExperimentAnalysis {
  experimentId: string;
  experimentName: string;
  status: 'active' | 'completed' | 'insufficient_data';
  startDate: Date;
  endDate: Date | null;
  daysElapsed: number;
  variantA: VariantStats;
  variantB: VariantStats;
  statistical: StatisticalResult | null;
  meetsRequirements: {
    minUsers: boolean;
    minDuration: boolean;
    canConclude: boolean;
  };
}

// ============================================================================
// A/B Testing Framework
// ============================================================================

export class ABTestingFramework {
  private readonly MIN_USERS_PER_VARIANT = 20;
  private readonly MIN_DURATION_DAYS = 14; // 2 weeks
  private readonly SIGNIFICANCE_LEVEL = 0.05; // p < 0.05

  /**
   * Create a new A/B experiment
   */
  async createExperiment(config: ExperimentConfig): Promise<string> {
    const targetUserCount = config.targetUserCount || this.MIN_USERS_PER_VARIANT * 2;
    const durationWeeks = config.durationWeeks || 2;

    // Validate minimum requirements
    if (targetUserCount < this.MIN_USERS_PER_VARIANT * 2) {
      throw new Error(`Experiment requires minimum ${this.MIN_USERS_PER_VARIANT * 2} users (${this.MIN_USERS_PER_VARIANT} per variant)`);
    }

    const experiment = await prisma.personalizationExperiment.create({
      data: {
        name: config.name,
        description: config.description,
        variantA: config.variantA,
        variantB: config.variantB,
        successMetric: config.successMetric,
        targetUserCount,
        startDate: new Date(),
        endDate: new Date(Date.now() + durationWeeks * 7 * 24 * 60 * 60 * 1000),
      },
    });

    return experiment.id;
  }

  /**
   * Assign user to experiment variant
   * Uses consistent hashing for reproducible assignment
   */
  async assignUserToVariant(userId: string, experimentId: string): Promise<VariantType> {
    // Check if user already assigned
    const existingAssignment = await prisma.experimentAssignment.findUnique({
      where: {
        userId_experimentId: {
          userId,
          experimentId,
        },
      },
    });

    if (existingAssignment) {
      return existingAssignment.variant as VariantType;
    }

    // Get experiment
    const experiment = await prisma.personalizationExperiment.findUnique({
      where: { id: experimentId },
      include: { assignments: true },
    });

    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Check if experiment is still accepting users
    const currentAssignments = experiment.assignments.length;
    if (currentAssignments >= experiment.targetUserCount) {
      throw new Error('Experiment has reached target user count');
    }

    // Consistent 50/50 split using hash of userId + experimentId
    const variantACount = experiment.assignments.filter(a => a.variant === 'A').length;
    const variantBCount = experiment.assignments.filter(a => a.variant === 'B').length;

    // Ensure balanced assignment
    let variant: VariantType;
    if (variantACount < variantBCount) {
      variant = 'A';
    } else if (variantBCount < variantACount) {
      variant = 'B';
    } else {
      // Equal counts - use hash for random assignment
      const hash = this.hashString(userId + experimentId);
      variant = hash % 2 === 0 ? 'A' : 'B';
    }

    // Create assignment
    await prisma.experimentAssignment.create({
      data: {
        userId,
        experimentId,
        variant,
        metrics: {},
      },
    });

    return variant;
  }

  /**
   * Record metrics for user in experiment
   */
  async recordMetrics(
    userId: string,
    experimentId: string,
    metrics: ExperimentMetrics
  ): Promise<void> {
    await prisma.experimentAssignment.update({
      where: {
        userId_experimentId: {
          userId,
          experimentId,
        },
      },
      data: {
        metrics,
      },
    });
  }

  /**
   * Analyze experiment and determine statistical significance
   */
  async analyzeExperiment(experimentId: string): Promise<ExperimentAnalysis> {
    const experiment = await prisma.personalizationExperiment.findUnique({
      where: { id: experimentId },
      include: { assignments: true },
    });

    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const variantAAssignments = experiment.assignments.filter(a => a.variant === 'A');
    const variantBAssignments = experiment.assignments.filter(a => a.variant === 'B');

    const daysElapsed = Math.floor(
      (Date.now() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const meetsRequirements = {
      minUsers: variantAAssignments.length >= this.MIN_USERS_PER_VARIANT &&
                variantBAssignments.length >= this.MIN_USERS_PER_VARIANT,
      minDuration: daysElapsed >= this.MIN_DURATION_DAYS,
      canConclude: false,
    };

    meetsRequirements.canConclude = meetsRequirements.minUsers && meetsRequirements.minDuration;

    // Extract metric values based on success metric
    const metricKey = experiment.successMetric;
    const variantAValues = variantAAssignments
      .map(a => this.extractMetric(a.metrics, metricKey))
      .filter(v => v !== null) as number[];

    const variantBValues = variantBAssignments
      .map(a => this.extractMetric(a.metrics, metricKey))
      .filter(v => v !== null) as number[];

    // Calculate variant stats
    const variantAStats: VariantStats = {
      variant: 'A',
      userCount: variantAAssignments.length,
      mean: this.mean(variantAValues),
      stdDev: this.standardDeviation(variantAValues),
      sampleSize: variantAValues.length,
      metrics: this.aggregateMetrics(variantAAssignments),
    };

    const variantBStats: VariantStats = {
      variant: 'B',
      userCount: variantBAssignments.length,
      mean: this.mean(variantBValues),
      stdDev: this.standardDeviation(variantBValues),
      sampleSize: variantBValues.length,
      metrics: this.aggregateMetrics(variantBAssignments),
    };

    // Calculate statistical significance if requirements met
    let statistical: StatisticalResult | null = null;
    if (meetsRequirements.canConclude && variantAValues.length > 0 && variantBValues.length > 0) {
      statistical = this.calculateStatisticalSignificance(
        variantAStats,
        variantBStats,
        variantAValues,
        variantBValues
      );
    }

    // Determine status
    let status: 'active' | 'completed' | 'insufficient_data' = 'active';
    if (!meetsRequirements.minUsers || !meetsRequirements.minDuration) {
      status = 'insufficient_data';
    } else if (experiment.endDate && new Date() >= experiment.endDate) {
      status = 'completed';
    }

    return {
      experimentId: experiment.id,
      experimentName: experiment.name,
      status,
      startDate: experiment.startDate,
      endDate: experiment.endDate,
      daysElapsed,
      variantA: variantAStats,
      variantB: variantBStats,
      statistical,
      meetsRequirements,
    };
  }

  /**
   * Calculate statistical significance using t-test
   *
   * This is where we "spawn data-scientist" for p-value calculations
   */
  private calculateStatisticalSignificance(
    variantA: VariantStats,
    variantB: VariantStats,
    valuesA: number[],
    valuesB: number[]
  ): StatisticalResult {
    // Welch's t-test for unequal variances
    const pooledStdDev = Math.sqrt(
      (variantA.stdDev ** 2) / variantA.sampleSize +
      (variantB.stdDev ** 2) / variantB.sampleSize
    );

    const tStatistic = (variantA.mean - variantB.mean) / pooledStdDev;

    // Calculate degrees of freedom (Welch-Satterthwaite equation)
    const df = Math.floor(
      ((variantA.stdDev ** 2 / variantA.sampleSize + variantB.stdDev ** 2 / variantB.sampleSize) ** 2) /
      ((variantA.stdDev ** 2 / variantA.sampleSize) ** 2 / (variantA.sampleSize - 1) +
       (variantB.stdDev ** 2 / variantB.sampleSize) ** 2 / (variantB.sampleSize - 1))
    );

    // Calculate p-value (two-tailed test)
    const pValue = this.calculatePValue(tStatistic, df);

    // Determine significance
    const isSignificant = pValue < this.SIGNIFICANCE_LEVEL;
    const confidenceLevel = (1 - pValue) * 100;

    // Calculate confidence interval (95% CI)
    const tCritical = this.getTCritical(df, 0.05); // 95% CI
    const marginOfError = tCritical * pooledStdDev;
    const meanDifference = variantA.mean - variantB.mean;

    const confidenceInterval = {
      lower: meanDifference - marginOfError,
      upper: meanDifference + marginOfError,
    };

    // Calculate effect size (Cohen's d)
    const pooledVariance = Math.sqrt(
      ((variantA.sampleSize - 1) * variantA.stdDev ** 2 +
       (variantB.sampleSize - 1) * variantB.stdDev ** 2) /
      (variantA.sampleSize + variantB.sampleSize - 2)
    );
    const effectSize = (variantA.mean - variantB.mean) / pooledVariance;

    // Determine winner
    let winner: VariantType | 'inconclusive' = 'inconclusive';
    let recommendation = '';

    if (isSignificant) {
      winner = variantA.mean > variantB.mean ? 'A' : 'B';
      const winnerMean = winner === 'A' ? variantA.mean : variantB.mean;
      const loserMean = winner === 'A' ? variantB.mean : variantA.mean;
      const improvement = ((winnerMean - loserMean) / loserMean * 100).toFixed(1);

      recommendation = `Variant ${winner} is statistically significant winner (p=${pValue.toFixed(4)}) with ${improvement}% improvement. Recommend rolling out Variant ${winner}.`;
    } else {
      recommendation = `No statistically significant difference detected (p=${pValue.toFixed(4)}). Need more data or variants are equivalent.`;
    }

    return {
      tStatistic,
      pValue,
      isSignificant,
      confidenceLevel,
      confidenceInterval,
      effectSize,
      winner,
      recommendation,
    };
  }

  /**
   * Calculate p-value from t-statistic and degrees of freedom
   * Using approximation for two-tailed test
   */
  private calculatePValue(t: number, df: number): number {
    const absTValue = Math.abs(t);

    // Approximation using Student's t-distribution CDF
    // For simplicity, using normal approximation for df > 30
    if (df > 30) {
      // Normal approximation
      return 2 * (1 - this.normalCDF(absTValue));
    }

    // For smaller df, use t-distribution approximation
    const x = df / (df + t * t);
    const a = df / 2;
    const b = 0.5;

    // Beta function approximation
    const pValue = this.incompleteBeta(x, a, b);

    return pValue;
  }

  /**
   * Normal CDF approximation (for p-value calculation)
   */
  private normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return z > 0 ? 1 - prob : prob;
  }

  /**
   * Incomplete Beta function approximation (for t-distribution)
   */
  private incompleteBeta(x: number, a: number, b: number): number {
    if (x === 0) return 0;
    if (x === 1) return 1;

    // Simple approximation
    const lnBeta = this.lnGamma(a) + this.lnGamma(b) - this.lnGamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

    let f = 1.0;
    let c = 1.0;
    let d = 0.0;

    for (let i = 0; i <= 200; i++) {
      const m = i / 2;

      let numerator;
      if (i === 0) {
        numerator = 1.0;
      } else if (i % 2 === 0) {
        numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
      } else {
        numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
      }

      d = 1 + numerator * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      d = 1 / d;

      c = 1 + numerator / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;

      const cd = c * d;
      f *= cd;

      if (Math.abs(1 - cd) < 1e-8) break;
    }

    return front * f;
  }

  /**
   * Natural logarithm of Gamma function (Lanczos approximation)
   */
  private lnGamma(z: number): number {
    const g = 7;
    const c = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];

    if (z < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * z)) - this.lnGamma(1 - z);
    }

    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) {
      x += c[i] / (z + i);
    }

    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }

  /**
   * Get t-critical value for confidence interval
   * Approximation for common degrees of freedom
   */
  private getTCritical(df: number, alpha: number): number {
    // Common t-critical values for 95% CI (alpha = 0.05)
    const tTable: Record<number, number> = {
      10: 2.228, 15: 2.131, 20: 2.086, 25: 2.060,
      30: 2.042, 40: 2.021, 50: 2.009, 60: 2.000,
      80: 1.990, 100: 1.984, 120: 1.980,
    };

    // Find closest df in table
    if (df >= 120) return 1.96; // Normal approximation

    const dfs = Object.keys(tTable).map(Number).sort((a, b) => a - b);
    const closestDf = dfs.reduce((prev, curr) =>
      Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev
    );

    return tTable[closestDf] || 2.0;
  }

  /**
   * Conclude experiment and select winner
   */
  async concludeExperiment(experimentId: string): Promise<ExperimentAnalysis> {
    const analysis = await this.analyzeExperiment(experimentId);

    if (!analysis.meetsRequirements.canConclude) {
      throw new Error(
        `Experiment cannot be concluded: ` +
        `${!analysis.meetsRequirements.minUsers ? 'Insufficient users. ' : ''}` +
        `${!analysis.meetsRequirements.minDuration ? 'Insufficient duration. ' : ''}`
      );
    }

    // Update experiment end date
    await prisma.personalizationExperiment.update({
      where: { id: experimentId },
      data: { endDate: new Date() },
    });

    return analysis;
  }

  /**
   * Get active experiments for user
   */
  async getActiveExperiments(userId: string): Promise<Array<{
    experimentId: string;
    experimentName: string;
    variant: VariantType;
    variantConfig: Record<string, any>;
  }>> {
    const assignments = await prisma.experimentAssignment.findMany({
      where: { userId },
      include: {
        experiment: {
          where: {
            endDate: {
              gte: new Date(),
            },
          },
        },
      },
    });

    return assignments
      .filter(a => a.experiment)
      .map(a => ({
        experimentId: a.experimentId,
        experimentName: a.experiment.name,
        variant: a.variant as VariantType,
        variantConfig: a.variant === 'A' ? a.experiment.variantA : a.experiment.variantB,
      }));
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private extractMetric(metrics: any, key: string): number | null {
    if (typeof metrics !== 'object' || metrics === null) return null;

    const value = metrics[key];
    return typeof value === 'number' ? value : null;
  }

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = this.mean(squareDiffs);

    return Math.sqrt(avgSquareDiff);
  }

  private aggregateMetrics(assignments: any[]): ExperimentMetrics {
    const metrics: ExperimentMetrics = {};

    const retention = assignments
      .map(a => this.extractMetric(a.metrics, 'retention'))
      .filter(v => v !== null) as number[];

    const performance = assignments
      .map(a => this.extractMetric(a.metrics, 'performance'))
      .filter(v => v !== null) as number[];

    const completionRate = assignments
      .map(a => this.extractMetric(a.metrics, 'completionRate'))
      .filter(v => v !== null) as number[];

    const satisfaction = assignments
      .map(a => this.extractMetric(a.metrics, 'satisfaction'))
      .filter(v => v !== null) as number[];

    if (retention.length > 0) metrics.retention = this.mean(retention);
    if (performance.length > 0) metrics.performance = this.mean(performance);
    if (completionRate.length > 0) metrics.completionRate = this.mean(completionRate);
    if (satisfaction.length > 0) metrics.satisfaction = this.mean(satisfaction);

    return metrics;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
