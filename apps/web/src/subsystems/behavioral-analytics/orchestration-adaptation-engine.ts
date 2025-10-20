/**
 * Orchestration Adaptation Engine
 * Story 5.3 Task 10: Adaptive orchestration based on changing circumstances
 *
 * Detects schedule changes, assesses impact, and generates adaptation plans
 * Measures effectiveness of orchestration over time
 */

import { prisma } from '@/lib/db'
import { StudyTimeRecommender } from './study-time-recommender'
import type { AdaptationType } from '@/generated/prisma'
import { addDays, differenceInHours } from 'date-fns'

interface ScheduleChange {
  type: AdaptationType
  reason: string
  detectedAt: Date
  severity: 'MINOR' | 'MODERATE' | 'MAJOR'
  affectedTimeSlots: Date[]
}

interface ImpactAssessment {
  severity: 'MINOR' | 'MODERATE' | 'MAJOR'
  affectedSessions: number
  performanceImpact: number // -100 to 100
  description: string
  recommendations: string[]
}

interface AdaptationPlan {
  adaptationId: string
  changes: ScheduleChange[]
  impact: ImpactAssessment
  alternatives: Array<{
    timeSlot: Date
    confidence: number
    performance: number
    reasoning: string
  }>
  appliedAt: Date
}

export class OrchestrationAdaptationEngine {
  private recommender: StudyTimeRecommender

  constructor() {
    this.recommender = new StudyTimeRecommender()
  }

  /**
   * Task 10.2: Detect schedule changes from calendar, exams, or user input
   * Identifies conflicts and availability shifts
   *
   * @param userId User ID
   * @param triggerSource Source of change (calendar, exam, user)
   * @returns Detected schedule changes
   */
  async detectScheduleChanges(
    userId: string,
    triggerSource: 'calendar' | 'exam' | 'user',
  ): Promise<ScheduleChange[]> {
    const changes: ScheduleChange[] = []

    // Get current recommendations
    const currentRecommendations = await prisma.studyScheduleRecommendation.findMany({
      where: {
        userId,
        createdAt: {
          gte: addDays(new Date(), -30), // Last 30 days of recommendations
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get recent schedule adaptations to avoid duplicate detection
    const recentAdaptations = await prisma.scheduleAdaptation.findMany({
      where: {
        userId,
        appliedAt: {
          gte: addDays(new Date(), -1), // Last 24 hours
        },
      },
    })

    if (triggerSource === 'calendar') {
      // Check calendar conflicts with recommendations
      const calendarIntegration = await prisma.calendarIntegration.findUnique({
        where: { userId },
      })

      if (calendarIntegration && calendarIntegration.syncEnabled) {
        // Calendar sync would have been triggered externally
        // Check for new conflicts not yet adapted
        for (const rec of currentRecommendations) {
          // Parse recommendedSchedule to get time slots
          const schedule = rec.recommendedSchedule as { startTime?: string } | null
          const startTimeStr = schedule?.startTime

          const existingAdaptation = recentAdaptations.find(
            (a) =>
              a.adaptationType === 'TIME_SHIFT' &&
              startTimeStr &&
              JSON.stringify(a.adaptationDetails).includes(startTimeStr),
          )

          if (!existingAdaptation && startTimeStr) {
            // This is a new conflict
            changes.push({
              type: 'TIME_SHIFT',
              reason: 'Calendar conflict detected',
              detectedAt: new Date(),
              severity: 'MODERATE',
              affectedTimeSlots: [new Date(startTimeStr)],
            })
          }
        }
      }
    } else if (triggerSource === 'exam') {
      // Exam schedule shift detected (placeholder for exam integration)
      // In production, this would query Exam model for changes
      changes.push({
        type: 'FREQUENCY_CHANGE',
        reason: 'Exam date approaching',
        detectedAt: new Date(),
        severity: 'MAJOR',
        affectedTimeSlots: currentRecommendations
          .map((r) => {
            const schedule = r.recommendedSchedule as { startTime?: string } | null
            return schedule?.startTime ? new Date(schedule.startTime) : null
          })
          .filter((d): d is Date => d !== null),
      })
    } else if (triggerSource === 'user') {
      // User-initiated change (via UI)
      // This would be triggered by user action (e.g., "I can't study mornings anymore")
      changes.push({
        type: 'TIME_SHIFT',
        reason: 'User preference change',
        detectedAt: new Date(),
        severity: 'MODERATE',
        affectedTimeSlots: currentRecommendations
          .slice(0, 3)
          .map((r) => {
            const schedule = r.recommendedSchedule as { startTime?: string } | null
            return schedule?.startTime ? new Date(schedule.startTime) : null
          })
          .filter((d): d is Date => d !== null),
      })
    }

    return changes
  }

  /**
   * Task 10.3: Assess impact of schedule changes
   * Classifies severity and estimates performance impact
   *
   * @param userId User ID
   * @param changes Detected schedule changes
   * @returns Impact assessment
   */
  async assessImpact(userId: string, changes: ScheduleChange[]): Promise<ImpactAssessment> {
    if (changes.length === 0) {
      return {
        severity: 'MINOR',
        affectedSessions: 0,
        performanceImpact: 0,
        description: 'No significant changes detected',
        recommendations: [],
      }
    }

    // Calculate overall severity (highest among changes)
    const maxSeverity = changes.reduce(
      (max, change) => {
        const severityScore = { MINOR: 1, MODERATE: 2, MAJOR: 3 }
        const changeScore = severityScore[change.severity]
        const maxScore = severityScore[max]
        return changeScore > maxScore ? change.severity : max
      },
      'MINOR' as 'MINOR' | 'MODERATE' | 'MAJOR',
    )

    // Count affected sessions (upcoming sessions in next 7 days)
    const upcomingSessions = await prisma.sessionOrchestrationPlan.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(),
          lte: addDays(new Date(), 7),
        },
      },
    })

    const affectedSessions = upcomingSessions.filter((session) => {
      const planData = session.planData as { plannedStartTime?: string } | null
      const plannedStart = planData?.plannedStartTime ? new Date(planData.plannedStartTime) : null

      if (!plannedStart) return false

      return changes.some((change) =>
        change.affectedTimeSlots.some(
          (slot) => differenceInHours(plannedStart, slot) < 2,
        ),
      )
    }).length

    // Estimate performance impact based on severity
    const performanceImpactMap = {
      MINOR: -5, // -5% performance impact
      MODERATE: -15, // -15% performance impact
      MAJOR: -30, // -30% performance impact
    }
    const performanceImpact = performanceImpactMap[maxSeverity]

    // Generate description
    const changeTypes = [...new Set(changes.map((c) => c.type))]
    const reasons = [...new Set(changes.map((c) => c.reason))]
    const description = `${maxSeverity} impact: ${reasons.join(', ')}. ${affectedSessions} sessions affected.`

    // Generate recommendations
    const recommendations: string[] = []

    if (maxSeverity === 'MAJOR') {
      recommendations.push('Regenerate study schedule with new constraints')
      recommendations.push('Consider adjusting study goals for this week')
      recommendations.push('Notify user of significant schedule disruption')
    } else if (maxSeverity === 'MODERATE') {
      recommendations.push('Suggest alternative time slots')
      recommendations.push('Adjust session durations if needed')
    } else {
      recommendations.push('Minor adjustment - update recommendations')
    }

    if (changeTypes.includes('TIME_SHIFT')) {
      recommendations.push('Find alternative time slots with similar performance potential')
    }

    if (changeTypes.includes('FREQUENCY_CHANGE')) {
      recommendations.push('Adjust session frequency to accommodate changes')
    }

    return {
      severity: maxSeverity,
      affectedSessions,
      performanceImpact,
      description,
      recommendations,
    }
  }

  /**
   * Task 10.4: Generate adaptation plan with alternative recommendations
   * Creates actionable plan based on detected changes and impact
   *
   * @param userId User ID
   * @param changes Detected schedule changes
   * @param impact Impact assessment
   * @returns Adaptation plan with alternatives
   */
  async generateAdaptationPlan(
    userId: string,
    changes: ScheduleChange[],
    impact: ImpactAssessment,
  ): Promise<AdaptationPlan> {
    // Record adaptation in database
    const adaptation = await prisma.scheduleAdaptation.create({
      data: {
        userId,
        adaptationType: changes[0]?.type || 'TIME_SHIFT',
        adaptationDetails: {
          reason: impact.description,
          changes: changes.map(c => ({
            type: c.type,
            reason: c.reason,
            severity: c.severity,
            affectedTimeSlots: c.affectedTimeSlots.map(t => t.toISOString()),
          })),
        },
      },
    })

    // Generate alternative recommendations
    const alternatives: AdaptationPlan['alternatives'] = []

    // Get new recommendations that avoid conflicts
    const newRecommendations = await StudyTimeRecommender.generateRecommendations(
      userId,
      new Date(),
      undefined,
    )

    for (const rec of newRecommendations.slice(0, 5)) {
      alternatives.push({
        timeSlot: rec.startTime,
        confidence: rec.confidence,
        performance: rec.score, // Performance score 0-100
        reasoning: rec.reasoning.join(' • '),
      })
    }

    return {
      adaptationId: adaptation.id,
      changes,
      impact,
      alternatives,
      appliedAt: new Date(),
    }
  }

  /**
   * Task 10.5: Measure orchestration effectiveness over time
   * Compares orchestrated vs self-scheduled session performance
   *
   * @param userId User ID
   * @param dateRange Number of days to analyze
   * @returns Effectiveness metrics with comparison
   */
  async measureEffectiveness(
    userId: string,
    dateRange: number = 30,
  ): Promise<{
    adherenceRate: number
    performanceGain: number
    optimalTimeAccuracy: number
    durationOptimizationAccuracy: number
    overallEffectiveness: number
    insights: string[]
  }> {
    const startDate = addDays(new Date(), -dateRange)

    // Get completed sessions
    const sessions = await prisma.mission.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
        status: 'COMPLETED',
      },
      select: {
        id: true,
        recommendedStartTime: true,
        actualStartTime: true,
        recommendedDuration: true,
        actualDuration: true,
        sessionPerformanceScore: true,
      },
    })

    if (sessions.length < 5) {
      return {
        adherenceRate: 0,
        performanceGain: 0,
        optimalTimeAccuracy: 0,
        durationOptimizationAccuracy: 0,
        overallEffectiveness: 0,
        insights: ['Need at least 5 completed sessions for effectiveness analysis'],
      }
    }

    // Calculate adherence rate (sessions that followed recommendations)
    const orchestratedSessions = sessions.filter((s) => s.recommendedStartTime && s.actualStartTime)
    const adherentSessions = orchestratedSessions.filter((s) => {
      const timeDiff = Math.abs(s.actualStartTime!.getTime() - s.recommendedStartTime!.getTime())
      return timeDiff <= 30 * 60 * 1000 // Within 30 minutes
    })

    const adherenceRate = (adherentSessions.length / orchestratedSessions.length) * 100

    // Calculate performance gain
    const adherentPerf =
      adherentSessions.reduce((sum, s) => sum + (s.sessionPerformanceScore || 0), 0) /
      adherentSessions.length

    const nonAdherentPerf =
      sessions
        .filter((s) => !adherentSessions.includes(s))
        .reduce((sum, s) => sum + (s.sessionPerformanceScore || 0), 0) /
      (sessions.length - adherentSessions.length || 1)

    const performanceGain = ((adherentPerf - nonAdherentPerf) / nonAdherentPerf) * 100

    // Calculate optimal time accuracy (how often recommended times correlated with high performance)
    const optimalTimeAccuracy =
      (adherentSessions.filter((s) => (s.sessionPerformanceScore || 0) >= 75).length /
        adherentSessions.length) *
      100

    // Calculate duration optimization accuracy
    const durationAccuracySessions = orchestratedSessions.filter(
      (s) => s.recommendedDuration && s.actualDuration,
    )
    const durationOptimizationAccuracy =
      (durationAccuracySessions.filter((s) => {
        const durationDiff = Math.abs((s.actualDuration || 0) - (s.recommendedDuration || 0))
        return durationDiff <= 10 // Within 10 minutes
      }).length /
        durationAccuracySessions.length) *
      100

    // Overall effectiveness score (weighted average)
    const overallEffectiveness =
      adherenceRate * 0.3 +
      Math.max(0, performanceGain) * 0.4 +
      optimalTimeAccuracy * 0.2 +
      durationOptimizationAccuracy * 0.1

    // Generate insights
    const insights: string[] = []

    if (adherenceRate >= 70) {
      insights.push(`Excellent adherence at ${Math.round(adherenceRate)}%`)
    } else if (adherenceRate >= 50) {
      insights.push(`Good adherence at ${Math.round(adherenceRate)}%`)
    } else {
      insights.push(
        `Low adherence at ${Math.round(adherenceRate)}%. Try following more recommendations.`,
      )
    }

    if (performanceGain >= 20) {
      insights.push(`Strong performance gain: ${Math.round(performanceGain)}% improvement`)
    } else if (performanceGain >= 10) {
      insights.push(`Moderate performance gain: ${Math.round(performanceGain)}% improvement`)
    } else if (performanceGain < 0) {
      insights.push('Self-scheduled sessions performing better. Recommendations adapting.')
    }

    if (optimalTimeAccuracy >= 80) {
      insights.push('Optimal time recommendations are highly accurate')
    } else if (optimalTimeAccuracy >= 60) {
      insights.push('Optimal time recommendations show good accuracy')
    } else {
      insights.push('Building accuracy in time recommendations')
    }

    return {
      adherenceRate: Math.round(adherenceRate),
      performanceGain: Math.round(performanceGain * 10) / 10,
      optimalTimeAccuracy: Math.round(optimalTimeAccuracy),
      durationOptimizationAccuracy: Math.round(durationOptimizationAccuracy),
      overallEffectiveness: Math.round(overallEffectiveness),
      insights,
    }
  }

  /**
   * Apply adaptation plan to user's schedule
   * Updates recommendations and notifies user
   *
   * @param userId User ID
   * @param adaptationPlan Generated adaptation plan
   * @returns Success status
   */
  async applyAdaptationPlan(userId: string, adaptationPlan: AdaptationPlan): Promise<boolean> {
    try {
      // Mark old recommendations as superseded by creating new adaptations
      // Note: Since StudyScheduleRecommendation doesn't have appliedAt field,
      // we track this through ScheduleAdaptation records instead

      // Create new recommendations from alternatives
      for (const alt of adaptationPlan.alternatives) {
        await prisma.studyScheduleRecommendation.create({
          data: {
            userId,
            recommendedSchedule: {
              startTime: alt.timeSlot.toISOString(),
              duration: 60, // Default duration in minutes
              performanceScore: alt.performance,
            },
            reasoning: alt.reasoning,
          },
        })
      }

      return true
    } catch (error) {
      console.error('Failed to apply adaptation plan:', error)
      return false
    }
  }
}
