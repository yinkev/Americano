/**
 * Story 5.4: Burnout Prevention Engine
 *
 * Proactive burnout risk assessment using 6-factor weighted algorithm.
 * Monitors chronic stress, performance decline, and recovery patterns.
 *
 * Algorithm (Story 5.4 lines 457-482):
 * riskScore = (intensity * 0.2) + (performanceDecline * 0.25) + (chronicLoad * 0.25)
 *           + (irregularity * 0.15) + (engagementDecay * 0.1) + (recoveryDeficit * 0.05)
 */

import { PrismaClient, BurnoutRiskLevel, Prisma } from '@/generated/prisma'
import { subDays, differenceInDays } from 'date-fns'
import type { ContributingFactor as ContributingFactorType } from '@/types/prisma-json'

const prisma = new PrismaClient()

// ============================================
// Types & Interfaces
// ============================================

export interface BurnoutRiskAssessment {
  riskScore: number // 0-100 scale
  riskLevel: BurnoutRiskLevel
  contributingFactors: ContributingFactor[]
  warningSignals: WarningSignal[]
  recommendations: string[]
  assessmentDate: Date
  confidence: number // 0.0-1.0
}

export interface ContributingFactor {
  factor: string
  score: number // 0-100
  percentage: number // Contribution to total risk
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface WarningSignal {
  type:
    | 'CHRONIC_OVERLOAD'
    | 'PERFORMANCE_DROP'
    | 'ENGAGEMENT_LOSS'
    | 'IRREGULAR_PATTERN'
    | 'NO_RECOVERY'
  detected: boolean
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  firstDetectedAt: Date
}

export interface InterventionPlan {
  interventionType:
    | 'MANDATORY_REST'
    | 'WORKLOAD_REDUCTION'
    | 'SCHEDULE_ADJUSTMENT'
    | 'CONTENT_SIMPLIFICATION'
  description: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendedActions: string[]
  estimatedRecoveryDays: number
}

export interface RecoveryMetrics {
  interventionId: string
  daysSinceIntervention: number
  currentRiskScore: number
  riskScoreChange: number // Negative = improvement
  recoveryProgress: number // 0.0-1.0
  isRecovered: boolean
}

// ============================================
// Burnout Prevention Engine Class
// ============================================

export class BurnoutPreventionEngine {
  /**
   * Assess burnout risk for a user
   * Analyzes 14-day window for chronic stress patterns
   *
   * @param userId - User identifier
   * @returns Comprehensive burnout risk assessment
   */
  async assessBurnoutRisk(userId: string): Promise<BurnoutRiskAssessment> {
    const startTime = performance.now()
    const assessmentDate = new Date()
    const twoWeeksAgo = subDays(assessmentDate, 14)

    try {
      // Fetch data for 14-day analysis window
      const [studySessions, cognitiveLoadMetrics, missions, performanceMetrics] = await Promise.all(
        [
          prisma.studySession.findMany({
            where: {
              userId,
              startedAt: { gte: twoWeeksAgo },
              completedAt: { not: null },
            },
            orderBy: { startedAt: 'asc' },
          }),
          prisma.cognitiveLoadMetric.findMany({
            where: {
              userId,
              timestamp: { gte: twoWeeksAgo },
            },
            orderBy: { timestamp: 'asc' },
          }),
          prisma.mission.findMany({
            where: {
              userId,
              date: { gte: twoWeeksAgo },
            },
            orderBy: { date: 'asc' },
          }),
          prisma.performanceMetric.findMany({
            where: {
              userId,
              date: { gte: twoWeeksAgo },
            },
            orderBy: { date: 'asc' },
          }),
        ],
      )

      // Calculate 6 risk factors
      const intensityScore = this.calculateIntensityScore(studySessions)
      const performanceDeclineScore = this.calculatePerformanceDeclineScore(performanceMetrics)
      const chronicLoadScore = this.calculateChronicLoadScore(cognitiveLoadMetrics)
      const irregularityScore = this.calculateIrregularityScore(missions)
      const engagementDecayScore = this.calculateEngagementDecayScore(missions, studySessions)
      const recoveryDeficitScore = this.calculateRecoveryDeficitScore(cognitiveLoadMetrics)

      // Weighted sum (0.2 + 0.25 + 0.25 + 0.15 + 0.1 + 0.05 = 1.0)
      const riskScore = Math.min(
        100,
        Math.max(
          0,
          intensityScore * 0.2 +
            performanceDeclineScore * 0.25 +
            chronicLoadScore * 0.25 +
            irregularityScore * 0.15 +
            engagementDecayScore * 0.1 +
            recoveryDeficitScore * 0.05,
        ),
      )

      // Determine risk level
      const riskLevel = this.determineRiskLevel(riskScore)

      // Build contributing factors
      const contributingFactors: ContributingFactor[] = [
        {
          factor: 'Study Intensity',
          score: intensityScore,
          percentage: 20,
          severity: this.scoreSeverity(intensityScore),
        },
        {
          factor: 'Performance Decline',
          score: performanceDeclineScore,
          percentage: 25,
          severity: this.scoreSeverity(performanceDeclineScore),
        },
        {
          factor: 'Chronic Cognitive Load',
          score: chronicLoadScore,
          percentage: 25,
          severity: this.scoreSeverity(chronicLoadScore),
        },
        {
          factor: 'Schedule Irregularity',
          score: irregularityScore,
          percentage: 15,
          severity: this.scoreSeverity(irregularityScore),
        },
        {
          factor: 'Engagement Decay',
          score: engagementDecayScore,
          percentage: 10,
          severity: this.scoreSeverity(engagementDecayScore),
        },
        {
          factor: 'Recovery Deficit',
          score: recoveryDeficitScore,
          percentage: 5,
          severity: this.scoreSeverity(recoveryDeficitScore),
        },
      ]

      // Detect warning signals
      const warningSignals = await this.detectWarningSignals(userId, 14)

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        riskLevel,
        contributingFactors,
        warningSignals,
      )

      // Calculate confidence based on data quality
      const confidence = this.calculateConfidence(studySessions.length, cognitiveLoadMetrics.length)

      // Store assessment to database
      await this.recordAssessment(userId, {
        riskScore,
        riskLevel,
        contributingFactors,
        recommendations,
      })

      const endTime = performance.now()
      console.log(`Burnout assessment completed in ${(endTime - startTime).toFixed(2)}ms`)

      return {
        riskScore,
        riskLevel,
        contributingFactors,
        warningSignals,
        recommendations,
        assessmentDate,
        confidence,
      }
    } catch (error) {
      console.error('Error assessing burnout risk:', error)

      // Return safe default on error
      return {
        riskScore: 25,
        riskLevel: 'LOW',
        contributingFactors: [],
        warningSignals: [],
        recommendations: ['Unable to assess burnout risk - insufficient data'],
        assessmentDate,
        confidence: 0,
      }
    }
  }

  /**
   * Detect warning signals for burnout
   *
   * @param userId - User identifier
   * @param timeWindow - Days to analyze
   * @returns Array of detected warning signals
   */
  async detectWarningSignals(userId: string, timeWindow: number): Promise<WarningSignal[]> {
    const windowStart = subDays(new Date(), timeWindow)
    const signals: WarningSignal[] = []

    // Fetch relevant data
    const [loadMetrics, performanceMetrics, missions] = await Promise.all([
      prisma.cognitiveLoadMetric.findMany({
        where: { userId, timestamp: { gte: windowStart } },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.performanceMetric.findMany({
        where: { userId, date: { gte: windowStart } },
        orderBy: { date: 'asc' },
      }),
      prisma.mission.findMany({
        where: { userId, date: { gte: windowStart } },
        orderBy: { date: 'asc' },
      }),
    ])

    // Signal 1: Chronic cognitive overload (>60 load for 7+ days)
    const highLoadDays = loadMetrics.filter((m) => m.loadScore > 60).length
    const avgLoad = loadMetrics.reduce((sum, m) => sum + m.loadScore, 0) / (loadMetrics.length || 1)

    if (highLoadDays >= 7 && avgLoad > 60) {
      signals.push({
        type: 'CHRONIC_OVERLOAD',
        detected: true,
        severity: highLoadDays >= 10 ? 'HIGH' : 'MEDIUM',
        description: `High cognitive load detected on ${highLoadDays} of last ${timeWindow} days (avg: ${avgLoad.toFixed(1)})`,
        firstDetectedAt: loadMetrics.find((m) => m.loadScore > 60)?.timestamp || new Date(),
      })
    }

    // Signal 2: Performance decline (>20% drop)
    if (performanceMetrics.length >= 7) {
      const firstWeek = performanceMetrics.slice(0, 7)
      const recentWeek = performanceMetrics.slice(-7)
      const firstAvg = firstWeek.reduce((sum, p) => sum + p.retentionScore, 0) / firstWeek.length
      const recentAvg = recentWeek.reduce((sum, p) => sum + p.retentionScore, 0) / recentWeek.length
      const decline = (firstAvg - recentAvg) / firstAvg

      if (decline > 0.2) {
        signals.push({
          type: 'PERFORMANCE_DROP',
          detected: true,
          severity: decline > 0.35 ? 'HIGH' : 'MEDIUM',
          description: `Performance declined ${(decline * 100).toFixed(1)}% over ${timeWindow} days`,
          firstDetectedAt: recentWeek[0]?.date || new Date(),
        })
      }
    }

    // Signal 3: Engagement decay (skipped missions, incomplete sessions)
    const skippedMissions = missions.filter((m) => m.status === 'SKIPPED').length
    const incompleteSessions = missions.filter((m) => m.status === 'IN_PROGRESS').length
    const engagementIssues = skippedMissions + incompleteSessions

    if (engagementIssues >= 3) {
      signals.push({
        type: 'ENGAGEMENT_LOSS',
        detected: true,
        severity: engagementIssues >= 5 ? 'HIGH' : 'MEDIUM',
        description: `${skippedMissions} missions skipped, ${incompleteSessions} incomplete in ${timeWindow} days`,
        firstDetectedAt: missions.find((m) => m.status === 'SKIPPED')?.date || new Date(),
      })
    }

    // Signal 4: Irregular study pattern (>3 missed scheduled sessions)
    const expectedSessions = timeWindow // Assume daily sessions
    const actualSessions = missions.filter((m) => m.status !== 'SKIPPED').length
    const missedSessions = Math.max(0, expectedSessions - actualSessions)

    if (missedSessions > 3) {
      signals.push({
        type: 'IRREGULAR_PATTERN',
        detected: true,
        severity: missedSessions > 5 ? 'HIGH' : 'MEDIUM',
        description: `${missedSessions} missed study sessions in ${timeWindow} days`,
        firstDetectedAt: windowStart,
      })
    }

    // Signal 5: No recovery days (no low-load days <40 in past 7 days)
    const recentLoadMetrics = loadMetrics.filter((m) => m.timestamp >= subDays(new Date(), 7))
    const lowLoadDays = recentLoadMetrics.filter((m) => m.loadScore < 40).length

    if (lowLoadDays === 0 && recentLoadMetrics.length > 0) {
      signals.push({
        type: 'NO_RECOVERY',
        detected: true,
        severity: 'HIGH',
        description: 'No recovery days (load <40) in past 7 days',
        firstDetectedAt: recentLoadMetrics[0]?.timestamp || new Date(),
      })
    }

    return signals
  }

  /**
   * Recommend intervention based on risk assessment
   *
   * @param riskAssessment - Current burnout risk assessment
   * @returns Intervention plan
   */
  recommendIntervention(riskAssessment: BurnoutRiskAssessment): InterventionPlan {
    const { riskLevel, riskScore, contributingFactors } = riskAssessment

    // Determine intervention type and urgency
    let interventionType: InterventionPlan['interventionType']
    let urgency: InterventionPlan['urgency']
    let recommendedActions: string[] = []
    let estimatedRecoveryDays = 3

    switch (riskLevel) {
      case 'CRITICAL':
        interventionType = 'MANDATORY_REST'
        urgency = 'CRITICAL'
        estimatedRecoveryDays = 5
        recommendedActions = [
          '🚨 MANDATORY 3-day study break starting immediately',
          'Disable all new content and mission generation',
          'Light review only (15 minutes max per day) if desired',
          'Focus on rest, sleep, and stress-reducing activities',
          'Resume studying only when rested and motivated',
        ]
        break

      case 'HIGH':
        interventionType = 'WORKLOAD_REDUCTION'
        urgency = 'HIGH'
        estimatedRecoveryDays = 4
        recommendedActions = [
          '⚠️ Mandatory rest day within next 48 hours',
          'Reduce study hours by 50% for next 3 days',
          'Switch to review-only content (no new material)',
          'Limit sessions to 20-30 minutes maximum',
          'Take 10-minute break every 15 minutes of study',
        ]
        break

      case 'MEDIUM':
        interventionType = 'SCHEDULE_ADJUSTMENT'
        urgency = 'MEDIUM'
        estimatedRecoveryDays = 3
        recommendedActions = [
          '⚡ Reduce study hours by 30% this week',
          'Add 2 rest days in next 7 days',
          'Focus on familiar topics (reduce difficulty)',
          'Increase break frequency (every 25 minutes)',
          'Consider shorter sessions (30-40 minutes)',
        ]
        break

      default: // LOW
        interventionType = 'CONTENT_SIMPLIFICATION'
        urgency = 'LOW'
        estimatedRecoveryDays = 2
        recommendedActions = [
          '✓ Continue current routine with minor adjustments',
          'Add 1 rest day this week as prevention',
          'Monitor stress levels closely',
          'Increase break frequency if load rises',
          'Maintain balanced content mix (60/40 review/new)',
        ]
    }

    // Add factor-specific recommendations
    const topFactors = contributingFactors
      .filter((f) => f.score > 60)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)

    topFactors.forEach((factor) => {
      if (
        factor.factor === 'Study Intensity' &&
        !recommendedActions.some((a) => a.includes('study hours'))
      ) {
        recommendedActions.push('💡 High study intensity detected - reduce daily study time by 25%')
      }
      if (factor.factor === 'Chronic Cognitive Load') {
        recommendedActions.push(
          '💡 Persistent high load - switch to easier content and more scaffolding',
        )
      }
      if (factor.factor === 'Performance Decline') {
        recommendedActions.push(
          '💡 Performance dropping - review prerequisite concepts before new material',
        )
      }
      if (factor.factor === 'Recovery Deficit') {
        recommendedActions.push(
          '💡 Insufficient recovery - schedule 2 consecutive low-intensity days',
        )
      }
    })

    return {
      interventionType,
      description: this.getInterventionDescription(interventionType, riskScore),
      urgency,
      recommendedActions,
      estimatedRecoveryDays,
    }
  }

  /**
   * Track recovery progress after intervention
   *
   * @param userId - User identifier
   * @param interventionId - Intervention tracking ID
   * @returns Recovery metrics
   */
  async trackRecoveryProgress(userId: string, interventionId: string): Promise<RecoveryMetrics> {
    // Note: interventionId would come from InterventionRecommendation table in Story 5.2
    // For now, we'll track based on most recent assessment

    const recentAssessments = await prisma.burnoutRiskAssessment.findMany({
      where: { userId },
      orderBy: { assessmentDate: 'desc' },
      take: 2,
    })

    if (recentAssessments.length < 2) {
      return {
        interventionId,
        daysSinceIntervention: 0,
        currentRiskScore: recentAssessments[0]?.riskScore || 0,
        riskScoreChange: 0,
        recoveryProgress: 0,
        isRecovered: false,
      }
    }

    const [current, baseline] = recentAssessments
    const daysSinceIntervention = differenceInDays(current.assessmentDate, baseline.assessmentDate)
    const riskScoreChange = current.riskScore - baseline.riskScore

    // Recovery progress: 1.0 when risk drops to LOW (<25)
    const recoveryProgress =
      baseline.riskScore > 0
        ? Math.max(0, Math.min(1, (baseline.riskScore - current.riskScore) / baseline.riskScore))
        : 0

    const isRecovered = current.riskLevel === 'LOW' && current.riskScore < 25

    return {
      interventionId,
      daysSinceIntervention,
      currentRiskScore: current.riskScore,
      riskScoreChange,
      recoveryProgress,
      isRecovered,
    }
  }

  // ============================================
  // Private Helper Methods (6-factor calculations)
  // ============================================

  private calculateIntensityScore(sessions: any[]): number {
    if (sessions.length === 0) return 0

    // Calculate total study hours in past 14 days
    const totalMinutes = sessions.reduce((sum, s) => {
      return sum + (s.durationMs ? s.durationMs / (1000 * 60) : 0)
    }, 0)

    const hoursPerWeek = totalMinutes / 60 / 2 // 2-week average

    // >40 hrs/week = 100%, 30-40 = 75%, 20-30 = 50%, <20 = 25%
    if (hoursPerWeek > 40) return 100
    if (hoursPerWeek > 30) return 75
    if (hoursPerWeek > 20) return 50
    return 25
  }

  private calculatePerformanceDeclineScore(metrics: any[]): number {
    if (metrics.length < 7) return 0

    // Compare first week vs second week
    const mid = Math.floor(metrics.length / 2)
    const firstHalf = metrics.slice(0, mid)
    const secondHalf = metrics.slice(mid)

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.retentionScore, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.retentionScore, 0) / secondHalf.length

    const decline = (firstAvg - secondAvg) / firstAvg

    // >20% drop = high risk
    if (decline > 0.35) return 100
    if (decline > 0.25) return 75
    if (decline > 0.15) return 50
    if (decline > 0.05) return 25
    return 0
  }

  private calculateChronicLoadScore(loadMetrics: any[]): number {
    if (loadMetrics.length === 0) return 0

    // Count days with avgLoad >60
    const highLoadDays = loadMetrics.filter((m) => m.loadScore > 60).length
    const totalDays = Math.max(
      1,
      new Set(loadMetrics.map((m) => m.timestamp.toISOString().split('T')[0])).size,
    )

    const highLoadRatio = highLoadDays / totalDays

    // >50% of days with high load = critical
    if (highLoadRatio > 0.5) return 100
    if (highLoadRatio > 0.35) return 75
    if (highLoadRatio > 0.2) return 50
    if (highLoadRatio > 0.1) return 25
    return 0
  }

  private calculateIrregularityScore(missions: any[]): number {
    if (missions.length < 7) return 0

    // Count missed/skipped sessions
    const skippedCount = missions.filter((m) => m.status === 'SKIPPED').length
    const totalExpected = 14 // Assume daily missions

    const missRate = skippedCount / totalExpected

    // >30% miss rate = high irregularity
    if (missRate > 0.3) return 100
    if (missRate > 0.2) return 75
    if (missRate > 0.1) return 50
    if (missRate > 0.05) return 25
    return 0
  }

  private calculateEngagementDecayScore(missions: any[], sessions: any[]): number {
    if (missions.length === 0) return 0

    // Low ratings, skipped missions, incomplete sessions
    const skippedMissions = missions.filter((m) => m.status === 'SKIPPED').length
    const lowDifficultyRatings = missions.filter(
      (m) => m.difficultyRating && m.difficultyRating <= 2,
    ).length

    const engagementIssues = skippedMissions + lowDifficultyRatings
    const engagementRatio = engagementIssues / missions.length

    if (engagementRatio > 0.4) return 100
    if (engagementRatio > 0.3) return 75
    if (engagementRatio > 0.2) return 50
    if (engagementRatio > 0.1) return 25
    return 0
  }

  private calculateRecoveryDeficitScore(loadMetrics: any[]): number {
    if (loadMetrics.length === 0) return 0

    // Days since last low-load day (<40)
    const recentMetrics = loadMetrics.slice(-7) // Last 7 days
    const lowLoadDays = recentMetrics.filter((m) => m.loadScore < 40).length

    // No recovery days in 7 days = high risk
    if (lowLoadDays === 0) return 100
    if (lowLoadDays === 1) return 50
    if (lowLoadDays === 2) return 25
    return 0
  }

  private determineRiskLevel(riskScore: number): BurnoutRiskLevel {
    if (riskScore >= 75) return 'CRITICAL'
    if (riskScore >= 50) return 'HIGH'
    if (riskScore >= 25) return 'MEDIUM'
    return 'LOW'
  }

  private scoreSeverity(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 75) return 'CRITICAL'
    if (score >= 50) return 'HIGH'
    if (score >= 25) return 'MEDIUM'
    return 'LOW'
  }

  private calculateConfidence(sessionCount: number, loadMetricCount: number): number {
    let confidence = 1.0

    // Reduce confidence if insufficient data
    if (sessionCount < 10) confidence *= 0.7
    if (sessionCount < 5) confidence *= 0.5
    if (loadMetricCount < 20) confidence *= 0.8
    if (loadMetricCount < 10) confidence *= 0.6

    return Math.max(0, Math.min(1, confidence))
  }

  private generateRecommendations(
    riskLevel: BurnoutRiskLevel,
    factors: ContributingFactor[],
    signals: WarningSignal[],
  ): string[] {
    const recommendations: string[] = []

    // Risk-level specific recommendations
    switch (riskLevel) {
      case 'CRITICAL':
        recommendations.push('🚨 CRITICAL: Take immediate 3-day study break')
        recommendations.push('Disable all new content until rested')
        recommendations.push('Seek support from peers or counselor')
        break
      case 'HIGH':
        recommendations.push('⚠️ HIGH RISK: Mandatory rest day within 48 hours')
        recommendations.push('Reduce study hours by 50% this week')
        recommendations.push('Switch to review-only content')
        break
      case 'MEDIUM':
        recommendations.push('⚡ MEDIUM RISK: Add 2 rest days this week')
        recommendations.push('Reduce study intensity by 30%')
        recommendations.push('Focus on familiar, easier topics')
        break
      default:
        recommendations.push('✓ LOW RISK: Continue with awareness')
        recommendations.push('Add 1 preventive rest day this week')
        recommendations.push('Monitor stress levels closely')
    }

    // Factor-specific recommendations
    factors
      .filter((f) => f.severity === 'HIGH' || f.severity === 'CRITICAL')
      .forEach((factor) => {
        if (factor.factor === 'Study Intensity') {
          recommendations.push('Reduce daily study time by 25-50%')
        }
        if (factor.factor === 'Chronic Cognitive Load') {
          recommendations.push('Take more frequent breaks (every 15 minutes)')
        }
        if (factor.factor === 'Performance Decline') {
          recommendations.push('Review prerequisite concepts before new material')
        }
        if (factor.factor === 'Schedule Irregularity') {
          recommendations.push('Establish consistent daily study routine')
        }
      })

    // Signal-specific recommendations
    signals
      .filter((s) => s.severity === 'HIGH')
      .forEach((signal) => {
        if (signal.type === 'CHRONIC_OVERLOAD') {
          recommendations.push('Reduce cognitive load: easier content + more scaffolding')
        }
        if (signal.type === 'NO_RECOVERY') {
          recommendations.push('Schedule 2 consecutive low-intensity recovery days')
        }
      })

    return [...new Set(recommendations)] // Remove duplicates
  }

  private getInterventionDescription(
    type: InterventionPlan['interventionType'],
    riskScore: number,
  ): string {
    const descriptions = {
      MANDATORY_REST: `Critical burnout risk detected (score: ${riskScore.toFixed(1)}). Immediate rest required to prevent academic burnout and maintain long-term performance.`,
      WORKLOAD_REDUCTION: `High burnout risk (score: ${riskScore.toFixed(1)}). Significant workload reduction needed to restore cognitive capacity and prevent performance collapse.`,
      SCHEDULE_ADJUSTMENT: `Moderate burnout risk (score: ${riskScore.toFixed(1)}). Schedule adjustments recommended to improve recovery and maintain sustainable study patterns.`,
      CONTENT_SIMPLIFICATION: `Low burnout risk (score: ${riskScore.toFixed(1)}). Minor content adjustments recommended as preventive measure for optimal long-term performance.`,
    }
    return descriptions[type]
  }

  private async recordAssessment(
    userId: string,
    assessment: {
      riskScore: number
      riskLevel: BurnoutRiskLevel
      contributingFactors: ContributingFactor[]
      recommendations: string[]
    },
  ): Promise<void> {
    await prisma.burnoutRiskAssessment.create({
      data: {
        userId,
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        contributingFactors: assessment.contributingFactors as unknown as Prisma.InputJsonValue,
        recommendations: assessment.recommendations,
      },
    })
  }
}

// Export singleton instance
export const burnoutPreventionEngine = new BurnoutPreventionEngine()
