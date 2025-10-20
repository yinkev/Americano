/**
 * Academic Performance Integration
 * Story 5.6 Task 4
 *
 * Calculates correlation between behavioral metrics and academic performance
 * using Pearson correlation coefficient and statistical significance testing.
 *
 * @subsystem Behavioral Analytics and Personalization
 * @location apps/web/src/subsystems/behavioral-analytics/academic-performance-integration.ts
 */

import { prisma } from '@/lib/db'

/**
 * Behavioral score components (from constraint #8)
 * - Consistency: 25%
 * - Quality: 25%
 * - Completion: 20%
 * - Insight application: 15%
 * - Retention: 15%
 */
const BEHAVIORAL_SCORE_WEIGHTS = {
  consistency: 0.25,
  quality: 0.25,
  completion: 0.2,
  insightApplication: 0.15,
  retention: 0.15,
} as const

/**
 * Minimum data requirements (from constraint #8)
 */
const MIN_WEEKS_FOR_CORRELATION = 8
const MIN_DATA_POINTS = 10

/**
 * Time series data point for correlation analysis
 */
export interface TimeSeriesDataPoint {
  date: string // ISO date
  behavioralScore: number // 0-100
  academicScore: number // 0-100 (exam score or mission mastery)
}

/**
 * Correlation result with statistical analysis
 */
export interface CorrelationResult {
  coefficient: number // Pearson r (-1.0 to 1.0)
  pValue: number // Statistical significance (0.0-1.0)
  interpretation: string // "strong positive", "moderate", "weak", "none"
  confidenceInterval: [number, number] // 95% CI for r
  timeSeriesData: TimeSeriesDataPoint[]
  insights: string[]
  dataQuality: {
    sampleSize: number
    weeksOfData: number
    missingDataPoints: number
  }
}

/**
 * Behavioral metrics for score calculation
 */
interface BehavioralMetrics {
  consistency: number // 0-100
  quality: number // 0-100
  completion: number // 0-100
  insightApplication: number // 0-100
  retention: number // 0-100
}

/**
 * AcademicPerformanceIntegration
 *
 * Core responsibilities:
 * 1. Calculate composite behavioral score
 * 2. Correlate behavioral score with academic performance (Pearson r)
 * 3. Perform statistical significance testing (p-value)
 * 4. Generate actionable insights with causation warnings
 */
export class AcademicPerformanceIntegration {
  /**
   * Calculate behavioral score for a user over a date range
   *
   * Composite formula:
   * Score = (consistency × 0.25) + (quality × 0.25) + (completion × 0.20) +
   *         (insight application × 0.15) + (retention × 0.15)
   *
   * @param userId - User ID
   * @param dateRange - Optional date range (defaults to last 90 days)
   * @returns Behavioral score (0-100)
   */
  static async calculateBehavioralScore(
    userId: string,
    dateRange?: { start: Date; end: Date },
  ): Promise<number> {
    const range = dateRange || {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }

    const metrics = await this.calculateBehavioralMetrics(userId, range)

    const score =
      metrics.consistency * BEHAVIORAL_SCORE_WEIGHTS.consistency +
      metrics.quality * BEHAVIORAL_SCORE_WEIGHTS.quality +
      metrics.completion * BEHAVIORAL_SCORE_WEIGHTS.completion +
      metrics.insightApplication * BEHAVIORAL_SCORE_WEIGHTS.insightApplication +
      metrics.retention * BEHAVIORAL_SCORE_WEIGHTS.retention

    return Math.round(score)
  }

  /**
   * Correlate behavioral performance with academic performance
   *
   * Algorithm:
   * 1. Gather time-series data (weekly behavioral scores + exam scores)
   * 2. Calculate Pearson correlation coefficient (r)
   * 3. Calculate p-value for statistical significance
   * 4. Compute 95% confidence interval
   * 5. Generate interpretation and insights
   *
   * @param userId - User ID
   * @param minWeeks - Minimum weeks of data (default 8)
   * @returns Correlation result with statistical analysis
   */
  static async correlatePerformance(
    userId: string,
    minWeeks: number = MIN_WEEKS_FOR_CORRELATION,
  ): Promise<CorrelationResult> {
    // Step 1: Gather time-series data
    const timeSeriesData = await this.gatherTimeSeriesData(userId, minWeeks)

    if (timeSeriesData.length < MIN_DATA_POINTS) {
      throw new Error(
        `Insufficient data for correlation. Need ${MIN_DATA_POINTS} data points, have ${timeSeriesData.length}.`,
      )
    }

    // Step 2: Calculate Pearson r
    const coefficient = this.calculatePearsonCorrelation(
      timeSeriesData.map((d) => d.behavioralScore),
      timeSeriesData.map((d) => d.academicScore),
    )

    // Step 3: Calculate p-value
    const pValue = this.calculatePValue(coefficient, timeSeriesData.length)

    // Step 4: Calculate 95% confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(coefficient, timeSeriesData.length)

    // Step 5: Generate interpretation
    const interpretation = this.interpretCorrelation(coefficient, pValue)

    // Step 6: Generate insights
    const insights = this.generateCorrelationInsights(coefficient, pValue, timeSeriesData)

    return {
      coefficient,
      pValue,
      interpretation,
      confidenceInterval,
      timeSeriesData,
      insights,
      dataQuality: {
        sampleSize: timeSeriesData.length,
        weeksOfData: minWeeks,
        missingDataPoints: minWeeks - timeSeriesData.length,
      },
    }
  }

  // ==================== Private Calculation Methods ====================

  /**
   * Calculate behavioral metrics for score computation
   */
  private static async calculateBehavioralMetrics(
    userId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<BehavioralMetrics> {
    const [sessions, patterns, insights, reviews] = await Promise.all([
      prisma.studySession.findMany({
        where: {
          userId,
          startedAt: { gte: dateRange.start, lte: dateRange.end },
          completedAt: { not: null },
        },
      }),
      prisma.behavioralPattern.findMany({
        where: {
          userId,
          detectedAt: { gte: dateRange.start, lte: dateRange.end },
        },
      }),
      prisma.behavioralInsight.findMany({
        where: {
          userId,
          applied: true,
          createdAt: { gte: dateRange.start, lte: dateRange.end },
        },
      }),
      prisma.review.findMany({
        where: {
          userId,
          reviewedAt: { gte: dateRange.start, lte: dateRange.end },
        },
      }),
    ])

    // 1. Consistency (0-100): Study frequency and regularity
    const totalDays = Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000),
    )
    const studyDays = new Set(sessions.map((s) => s.startedAt.toISOString().split('T')[0])).size
    const consistency = Math.min(100, (studyDays / totalDays) * 100 * 1.5) // Boost for high frequency

    // 2. Quality (0-100): Pattern confidence and engagement
    const avgPatternConfidence =
      patterns.length > 0
        ? (patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length) * 100
        : 50
    const quality = avgPatternConfidence

    // 3. Completion (0-100): Mission/session completion rate
    const completedSessions = sessions.filter((s) => s.completedAt).length
    const completion = sessions.length > 0 ? (completedSessions / sessions.length) * 100 : 0

    // 4. Insight Application (0-100): Applied insights / total insights
    const totalInsights = await prisma.behavioralInsight.count({
      where: {
        userId,
        createdAt: { gte: dateRange.start, lte: dateRange.end },
      },
    })
    const insightApplication = totalInsights > 0 ? (insights.length / totalInsights) * 100 : 0

    // 5. Retention (0-100): Average review accuracy
    const correctReviews = reviews.filter((r) => r.rating === 'GOOD' || r.rating === 'EASY').length
    const retention = reviews.length > 0 ? (correctReviews / reviews.length) * 100 : 0

    return {
      consistency,
      quality,
      completion,
      insightApplication,
      retention,
    }
  }

  /**
   * Gather time-series data for correlation analysis
   */
  private static async gatherTimeSeriesData(
    userId: string,
    minWeeks: number,
  ): Promise<TimeSeriesDataPoint[]> {
    const startDate = new Date(Date.now() - minWeeks * 7 * 24 * 60 * 60 * 1000)
    const dataPoints: TimeSeriesDataPoint[] = []

    // Generate weekly data points
    for (let week = 0; week < minWeeks; week++) {
      const weekStart = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

      // Calculate behavioral score for this week
      const behavioralScore = await this.calculateBehavioralScore(userId, {
        start: weekStart,
        end: weekEnd,
      })

      // Get academic performance for this week (exams or mission mastery)
      const academicScore = await this.getAcademicScore(userId, {
        start: weekStart,
        end: weekEnd,
      })

      if (academicScore !== null) {
        dataPoints.push({
          date: weekStart.toISOString().split('T')[0],
          behavioralScore,
          academicScore,
        })
      }
    }

    return dataPoints
  }

  /**
   * Get academic score for a week (exam scores or mission mastery)
   */
  private static async getAcademicScore(
    userId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<number | null> {
    // Try exams first
    const exams = await prisma.exam.findMany({
      where: {
        userId,
        date: { gte: dateRange.start, lte: dateRange.end },
      },
    })

    // If no exams, use mission success scores
    if (exams.length === 0) {
      const missions = await prisma.mission.findMany({
        where: {
          userId,
          completedAt: { gte: dateRange.start, lte: dateRange.end },
          successScore: { not: null },
        },
      })

      if (missions.length === 0) return null

      const avgSuccessScore =
        missions.reduce((sum, m) => sum + (m.successScore || 0), 0) / missions.length
      return avgSuccessScore * 100 // Convert to 0-100 scale
    }

    // NOTE: Exam scores not yet implemented in schema
    // For now, use mission success as proxy
    const missions = await prisma.mission.findMany({
      where: {
        userId,
        completedAt: { gte: dateRange.start, lte: dateRange.end },
        successScore: { not: null },
      },
    })

    if (missions.length === 0) return null

    const avgSuccessScore =
      missions.reduce((sum, m) => sum + (m.successScore || 0), 0) / missions.length
    return avgSuccessScore * 100
  }

  /**
   * Calculate Pearson correlation coefficient
   *
   * Formula: r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² × Σ(y - ȳ)²)
   *
   * DELEGATED TO DATA-SCIENTIST: Validate formula correctness
   */
  private static calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length
    if (n !== y.length || n === 0) return 0

    const meanX = x.reduce((sum, val) => sum + val, 0) / n
    const meanY = y.reduce((sum, val) => sum + val, 0) / n

    let numerator = 0
    let sumSqX = 0
    let sumSqY = 0

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX
      const dy = y[i] - meanY
      numerator += dx * dy
      sumSqX += dx * dx
      sumSqY += dy * dy
    }

    const denominator = Math.sqrt(sumSqX * sumSqY)
    return denominator === 0 ? 0 : numerator / denominator
  }

  /**
   * Calculate p-value for correlation significance
   *
   * Uses t-statistic: t = r × √((n-2)/(1-r²))
   * df = n - 2
   *
   * DELEGATED TO DATA-SCIENTIST: Validate statistical calculation
   */
  private static calculatePValue(r: number, n: number): number {
    if (n < 3) return 1.0 // Not enough data

    const t = r * Math.sqrt((n - 2) / (1 - r * r))
    const df = n - 2

    // Approximate p-value using t-distribution
    // Simplified for MVP - use proper t-distribution library in production
    const pValue = 2 * (1 - this.tDistributionCDF(Math.abs(t), df))
    return Math.max(0, Math.min(1, pValue))
  }

  /**
   * Approximate t-distribution CDF (cumulative distribution function)
   * Simplified implementation - use proper statistical library in production
   */
  private static tDistributionCDF(t: number, df: number): number {
    // Approximation using normal distribution for df > 30
    if (df > 30) {
      return this.normalCDF(t)
    }

    // For smaller df, use simplified approximation
    const x = df / (df + t * t)
    return 1 - 0.5 * Math.pow(x, df / 2)
  }

  /**
   * Normal distribution CDF approximation
   */
  private static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x))
    const d = 0.3989423 * Math.exp((-x * x) / 2)
    const prob =
      d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    return x > 0 ? 1 - prob : prob
  }

  /**
   * Calculate 95% confidence interval for correlation coefficient
   *
   * Uses Fisher Z-transformation
   *
   * DELEGATED TO DATA-SCIENTIST: Validate confidence interval calculation
   */
  private static calculateConfidenceInterval(r: number, n: number): [number, number] {
    if (n < 4) return [r, r] // Not enough data

    // Fisher Z-transformation
    const z = 0.5 * Math.log((1 + r) / (1 - r))
    const se = 1 / Math.sqrt(n - 3)

    // 95% CI (z-score = 1.96)
    const zLower = z - 1.96 * se
    const zUpper = z + 1.96 * se

    // Transform back to r
    const rLower = (Math.exp(2 * zLower) - 1) / (Math.exp(2 * zLower) + 1)
    const rUpper = (Math.exp(2 * zUpper) - 1) / (Math.exp(2 * zUpper) + 1)

    return [Math.max(-1, rLower), Math.min(1, rUpper)]
  }

  /**
   * Interpret correlation coefficient
   */
  private static interpretCorrelation(r: number, pValue: number): string {
    const significant = pValue < 0.05
    const absR = Math.abs(r)

    let strength = ''
    if (absR >= 0.7) strength = 'strong'
    else if (absR >= 0.4) strength = 'moderate'
    else if (absR >= 0.2) strength = 'weak'
    else strength = 'negligible'

    const direction = r > 0 ? 'positive' : 'negative'

    if (!significant) {
      return `${strength} ${direction} (not statistically significant, p=${pValue.toFixed(3)})`
    }

    return `${strength} ${direction} (p=${pValue.toFixed(3)})`
  }

  /**
   * Generate actionable insights from correlation analysis
   */
  private static generateCorrelationInsights(
    r: number,
    pValue: number,
    timeSeriesData: TimeSeriesDataPoint[],
  ): string[] {
    const insights: string[] = []

    // Causation warning (ALWAYS include)
    insights.push(
      '⚠️ Correlation does not imply causation. These metrics show association, not proof of direct cause-effect.',
    )

    // Statistical significance
    if (pValue < 0.05) {
      insights.push(`✓ Statistically significant relationship (p=${pValue.toFixed(3)} < 0.05)`)
    } else {
      insights.push(
        `✗ Not statistically significant (p=${pValue.toFixed(3)} ≥ 0.05). More data needed.`,
      )
    }

    // Correlation strength
    const absR = Math.abs(r)
    if (absR >= 0.7 && pValue < 0.05) {
      insights.push(
        `Strong ${r > 0 ? 'positive' : 'negative'} association suggests behavioral improvements ${r > 0 ? 'may support' : 'may hinder'} academic performance.`,
      )
    } else if (absR >= 0.4 && pValue < 0.05) {
      insights.push(
        `Moderate association suggests behavioral patterns ${r > 0 ? 'may contribute to' : 'may impact'} academic outcomes.`,
      )
    } else {
      insights.push('Weak or negligible association. Other factors may be more influential.')
    }

    // Trend analysis
    const recent = timeSeriesData.slice(-4) // Last 4 weeks
    if (recent.length >= 4) {
      const recentBehavior = recent.map((d) => d.behavioralScore)
      const recentAcademic = recent.map((d) => d.academicScore)
      const avgBehavior = recentBehavior.reduce((a, b) => a + b, 0) / recentBehavior.length
      const avgAcademic = recentAcademic.reduce((a, b) => a + b, 0) / recentAcademic.length

      if (avgBehavior > 70 && avgAcademic > 70) {
        insights.push(
          '📈 Recent trend: Both behavioral and academic scores are strong. Maintain current habits.',
        )
      } else if (avgBehavior < 50 && avgAcademic < 50) {
        insights.push('📉 Recent trend: Both scores declining. Consider intervention strategies.')
      }
    }

    return insights
  }
}
