/**
 * Story 5.2 Task 9: Struggle Reduction Analyzer
 *
 * Measures effectiveness of predictive struggle system by comparing:
 * - Baseline struggle rate (BEFORE predictive system)
 * - Current struggle rate (AFTER predictive alerts and interventions)
 * - Intervention effectiveness tracking
 * - Success metrics for dashboard
 *
 * Success Target: 25%+ reduction in struggle rate
 * (e.g., 40% baseline → 30% current = 25% reduction)
 */

import { prisma } from '@/lib/db'
import { subDays, subWeeks, differenceInDays } from 'date-fns'
import type {
  StrugglePrediction,
  InterventionRecommendation,
  Review,
  StudySession,
  BehavioralEvent,
  ValidationResponse,
} from '@/generated/prisma'
import { ReviewRating, InterventionType } from '@/generated/prisma'

/**
 * Struggle rate calculation result
 */
export interface StruggleRate {
  rate: number // 0-1 (percentage of topics with struggles)
  topicsAnalyzed: number
  topicsWithStruggles: number
  period: {
    startDate: Date
    endDate: Date
  }
  indicators: {
    lowPerformanceSessions: number
    againRatings: number
    lowValidationScores: number
  }
}

/**
 * Comprehensive reduction metrics
 */
export interface ReductionMetrics {
  baselineRate: number // 0-1
  currentRate: number // 0-1
  reductionPercentage: number // Percentage improvement
  timeline: Array<{ date: Date; rate: number }> // Weekly/monthly trend
  interventionEffectiveness: InterventionEffectiveness[]
  averagePerformanceImprovement: number // 0-100
  timeSavedMinutes: number // Estimated time saved
  confidenceIncrease: number // 0-1
  meetsTarget: boolean // True if reduction >= 25%
  dataQuality: {
    baselineSessions: number
    currentSessions: number
    predictionsEvaluated: number
    sufficientData: boolean
  }
}

/**
 * Intervention effectiveness analysis
 */
export interface InterventionEffectiveness {
  interventionType: InterventionType
  appliedCount: number
  successRate: number // 0-1 (prevented struggles / total applied)
  avgStruggleReduction: number // 0-1 (improvement in struggle rate)
  mostEffectiveFor: string[] // Topic areas where this works best
  confidence: number // 0-1, based on sample size
}

/**
 * Comparative analysis between groups
 */
interface ComparisonGroup {
  withIntervention: {
    topicsCount: number
    struggleRate: number
    avgPerformanceScore: number
  }
  withoutIntervention: {
    topicsCount: number
    struggleRate: number
    avgPerformanceScore: number
  }
}

/**
 * StruggleReductionAnalyzer
 *
 * Tracks and measures the impact of the predictive struggle system.
 * Calculates baseline vs. current struggle rates to demonstrate system effectiveness.
 */
export class StruggleReductionAnalyzer {
  /**
   * Calculate baseline struggle rate BEFORE predictive system was activated
   *
   * Baseline Period: First 4-6 weeks of user activity
   * Struggle Definition:
   * - Sessions with AGAIN ratings (Review.rating === 'AGAIN')
   * - Low session scores (BehavioralEvent.sessionPerformanceScore < 65)
   * - Low validation scores (ValidationResponse.score < 60%)
   *
   * @param userId - User ID to analyze
   * @param beforeDate - Date BEFORE predictive system activated
   * @returns Baseline struggle rate
   */
  static async calculateBaselineStruggleRate(
    userId: string,
    beforeDate: Date,
  ): Promise<StruggleRate> {
    // Define baseline period: 4-6 weeks BEFORE predictive system
    const baselineEndDate = beforeDate
    const baselineStartDate = subWeeks(beforeDate, 6)

    // Query sessions during baseline period
    const baselineSessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: {
          gte: baselineStartDate,
          lte: baselineEndDate,
        },
        completedAt: {
          not: null,
        },
      },
      include: {
        reviews: true,
        validationResponses: true,
      },
    })

    if (baselineSessions.length === 0) {
      return this.getEmptyStruggleRate(baselineStartDate, baselineEndDate)
    }

    // Also query behavioral events for session performance scores
    const behavioralEvents = await prisma.behavioralEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: baselineStartDate,
          lte: baselineEndDate,
        },
        eventType: 'SESSION_ENDED',
        sessionPerformanceScore: {
          not: null,
        },
      },
    })

    // Extract unique topics (learning objectives) from sessions
    const topicSet = new Set<string>()
    const topicStruggles = new Map<string, boolean>() // Track which topics had struggles

    let lowPerformanceSessionsCount = 0
    let againRatingsCount = 0
    let lowValidationScoresCount = 0

    for (const session of baselineSessions) {
      // Extract topics from objective completions
      const objectiveCompletions = (session.objectiveCompletions || []) as Array<{
        objectiveId: string
        selfAssessment?: number
      }>

      for (const completion of objectiveCompletions) {
        if (completion.objectiveId) {
          topicSet.add(completion.objectiveId)
        }
      }

      // Check for struggle indicators

      // 1. AGAIN ratings in reviews
      const againReviews = session.reviews.filter((r) => r.rating === ReviewRating.AGAIN)
      if (againReviews.length > 0) {
        againRatingsCount++
        // Mark topics associated with these reviews as struggles
        for (const review of againReviews) {
          const card = await prisma.card.findUnique({
            where: { id: review.cardId },
            select: { objectiveId: true },
          })
          if (card?.objectiveId) {
            topicStruggles.set(card.objectiveId, true)
          }
        }
      }

      // 2. Low validation scores (<60%)
      const lowValidationScores = session.validationResponses.filter((v) => v.score < 0.6)
      if (lowValidationScores.length > 0) {
        lowValidationScoresCount++
        // Mark associated topics (via validation prompt concept)
        for (const validation of lowValidationScores) {
          const prompt = await prisma.validationPrompt.findUnique({
            where: { id: validation.promptId },
            select: { conceptName: true },
          })
          // For MVP, use conceptName as proxy for topic
          if (prompt?.conceptName) {
            topicStruggles.set(prompt.conceptName, true)
          }
        }
      }
    }

    // 3. Check behavioral events for low session performance scores
    for (const event of behavioralEvents) {
      if (event.sessionPerformanceScore !== null && event.sessionPerformanceScore < 65) {
        lowPerformanceSessionsCount++
        // Mark topics from this session as struggles
        const eventData = event.eventData as any
        if (eventData.objectiveIds && Array.isArray(eventData.objectiveIds)) {
          for (const objectiveId of eventData.objectiveIds) {
            topicStruggles.set(objectiveId, true)
          }
        }
      }
    }

    // Calculate struggle rate
    const topicsAnalyzed = topicSet.size
    const topicsWithStruggles = topicStruggles.size
    const rate = topicsAnalyzed > 0 ? topicsWithStruggles / topicsAnalyzed : 0

    return {
      rate,
      topicsAnalyzed,
      topicsWithStruggles,
      period: {
        startDate: baselineStartDate,
        endDate: baselineEndDate,
      },
      indicators: {
        lowPerformanceSessions: lowPerformanceSessionsCount,
        againRatings: againRatingsCount,
        lowValidationScores: lowValidationScoresCount,
      },
    }
  }

  /**
   * Calculate current struggle rate AFTER predictive system activated
   *
   * Post-Prediction Period: Track struggles AFTER predictive alerts active
   * Comparison Groups:
   * - Topics WITH intervention applied vs WITHOUT intervention
   * - Predicted struggles that were prevented vs not prevented
   *
   * @param userId - User ID to analyze
   * @param afterDate - Date AFTER predictive system activated
   * @returns Current struggle rate
   */
  static async calculateCurrentStruggleRate(
    userId: string,
    afterDate: Date,
  ): Promise<StruggleRate> {
    // Define current period: FROM prediction system activation to now
    const currentStartDate = afterDate
    const currentEndDate = new Date()

    // Query sessions during current period
    const currentSessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: {
          gte: currentStartDate,
          lte: currentEndDate,
        },
        completedAt: {
          not: null,
        },
      },
      include: {
        reviews: true,
        validationResponses: true,
      },
    })

    if (currentSessions.length === 0) {
      return this.getEmptyStruggleRate(currentStartDate, currentEndDate)
    }

    // Query behavioral events for session performance scores
    const behavioralEvents = await prisma.behavioralEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: currentStartDate,
          lte: currentEndDate,
        },
        eventType: 'SESSION_ENDED',
        sessionPerformanceScore: {
          not: null,
        },
      },
    })

    // Extract unique topics and track struggles
    const topicSet = new Set<string>()
    const topicStruggles = new Map<string, boolean>()

    let lowPerformanceSessionsCount = 0
    let againRatingsCount = 0
    let lowValidationScoresCount = 0

    for (const session of currentSessions) {
      // Extract topics from objective completions
      const objectiveCompletions = (session.objectiveCompletions || []) as Array<{
        objectiveId: string
        selfAssessment?: number
      }>

      for (const completion of objectiveCompletions) {
        if (completion.objectiveId) {
          topicSet.add(completion.objectiveId)
        }
      }

      // Check for struggle indicators (same as baseline)

      // 1. AGAIN ratings
      const againReviews = session.reviews.filter((r) => r.rating === ReviewRating.AGAIN)
      if (againReviews.length > 0) {
        againRatingsCount++
        for (const review of againReviews) {
          const card = await prisma.card.findUnique({
            where: { id: review.cardId },
            select: { objectiveId: true },
          })
          if (card?.objectiveId) {
            topicStruggles.set(card.objectiveId, true)
          }
        }
      }

      // 2. Low validation scores
      const lowValidationScores = session.validationResponses.filter((v) => v.score < 0.6)
      if (lowValidationScores.length > 0) {
        lowValidationScoresCount++
        for (const validation of lowValidationScores) {
          const prompt = await prisma.validationPrompt.findUnique({
            where: { id: validation.promptId },
            select: { conceptName: true },
          })
          if (prompt?.conceptName) {
            topicStruggles.set(prompt.conceptName, true)
          }
        }
      }
    }

    // 3. Low session performance scores from behavioral events
    for (const event of behavioralEvents) {
      if (event.sessionPerformanceScore !== null && event.sessionPerformanceScore < 65) {
        lowPerformanceSessionsCount++
        const eventData = event.eventData as any
        if (eventData.objectiveIds && Array.isArray(eventData.objectiveIds)) {
          for (const objectiveId of eventData.objectiveIds) {
            topicStruggles.set(objectiveId, true)
          }
        }
      }
    }

    // Calculate struggle rate
    const topicsAnalyzed = topicSet.size
    const topicsWithStruggles = topicStruggles.size
    const rate = topicsAnalyzed > 0 ? topicsWithStruggles / topicsAnalyzed : 0

    return {
      rate,
      topicsAnalyzed,
      topicsWithStruggles,
      period: {
        startDate: currentStartDate,
        endDate: currentEndDate,
      },
      indicators: {
        lowPerformanceSessions: lowPerformanceSessionsCount,
        againRatings: againRatingsCount,
        lowValidationScores: lowValidationScoresCount,
      },
    }
  }

  /**
   * Measure comprehensive reduction metrics
   *
   * Primary Metric: Percentage reduction in struggle rate
   * Formula: ((Baseline Rate - Current Rate) / Baseline Rate) × 100
   * Target: 25%+ reduction
   *
   * Secondary Metrics:
   * - Average performance improvement on predicted topics
   * - Time saved (reduced study time due to fewer struggles)
   * - User confidence increase (from confidence calibration)
   * - Intervention effectiveness
   *
   * @param userId - User ID to analyze
   * @param predictionActivationDate - When predictive system was activated (default: 6 weeks ago)
   * @returns Comprehensive reduction metrics
   */
  static async measureReduction(
    userId: string,
    predictionActivationDate?: Date,
  ): Promise<ReductionMetrics> {
    // Default: Assume prediction system activated 6 weeks ago
    const activationDate = predictionActivationDate || subWeeks(new Date(), 6)

    // Calculate baseline (before activation)
    const baselineRate = await this.calculateBaselineStruggleRate(userId, activationDate)

    // Calculate current (after activation)
    const currentRate = await this.calculateCurrentStruggleRate(userId, activationDate)

    // Calculate reduction percentage
    const reductionPercentage =
      baselineRate.rate > 0 ? ((baselineRate.rate - currentRate.rate) / baselineRate.rate) * 100 : 0

    // Check if target met (25%+ reduction)
    const meetsTarget = reductionPercentage >= 25

    // Generate timeline (weekly aggregation)
    const timeline = await this.generateTimeline(userId, baselineRate.period.startDate, new Date())

    // Analyze intervention effectiveness
    const interventionEffectiveness = await this.identifySuccessfulInterventions(userId)

    // Calculate average performance improvement
    const performanceImprovement = await this.calculatePerformanceImprovement(
      userId,
      activationDate,
    )

    // Estimate time saved
    const timeSavedMinutes = await this.estimateTimeSaved(userId, baselineRate, currentRate)

    // Calculate confidence increase
    const confidenceIncrease = await this.calculateConfidenceIncrease(userId, activationDate)

    // Data quality metrics
    const baselineSessions = await prisma.studySession.count({
      where: {
        userId,
        startedAt: {
          gte: baselineRate.period.startDate,
          lte: baselineRate.period.endDate,
        },
      },
    })

    const currentSessions = await prisma.studySession.count({
      where: {
        userId,
        startedAt: {
          gte: currentRate.period.startDate,
          lte: currentRate.period.endDate,
        },
      },
    })

    const predictionsEvaluated = await prisma.strugglePrediction.count({
      where: {
        userId,
        actualOutcome: {
          not: null,
        },
      },
    })

    const sufficientData =
      baselineSessions >= 20 && currentSessions >= 20 && predictionsEvaluated >= 10

    return {
      baselineRate: baselineRate.rate,
      currentRate: currentRate.rate,
      reductionPercentage,
      timeline,
      interventionEffectiveness,
      averagePerformanceImprovement: performanceImprovement,
      timeSavedMinutes,
      confidenceIncrease,
      meetsTarget,
      dataQuality: {
        baselineSessions,
        currentSessions,
        predictionsEvaluated,
        sufficientData,
      },
    }
  }

  /**
   * Identify successful interventions by type
   *
   * Intervention Success Metrics:
   * - % of predictions with intervention vs without
   * - Struggle rate: intervention applied vs not applied
   * - Most/least effective intervention types
   *
   * @param userId - User ID to analyze
   * @returns Array of intervention effectiveness metrics
   */
  static async identifySuccessfulInterventions(
    userId: string,
  ): Promise<InterventionEffectiveness[]> {
    // Query all interventions for this user
    const interventions = await prisma.interventionRecommendation.findMany({
      where: {
        userId,
        status: {
          in: ['COMPLETED'],
        },
      },
      include: {
        prediction: {
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
    })

    if (interventions.length === 0) {
      return []
    }

    // Group interventions by type
    const interventionsByType = new Map<InterventionType, Array<(typeof interventions)[0]>>()

    for (const intervention of interventions) {
      if (!interventionsByType.has(intervention.interventionType)) {
        interventionsByType.set(intervention.interventionType, [])
      }
      interventionsByType.get(intervention.interventionType)!.push(intervention)
    }

    // Analyze effectiveness for each type
    const effectiveness: InterventionEffectiveness[] = []

    for (const [type, typeInterventions] of interventionsByType.entries()) {
      const appliedCount = typeInterventions.length

      // Calculate success rate: predictions that didn't result in struggles
      const successfulInterventions = typeInterventions.filter((intervention) => {
        return intervention.prediction?.actualOutcome === false // Did NOT struggle
      })

      const successRate = appliedCount > 0 ? successfulInterventions.length / appliedCount : 0

      // Calculate average struggle reduction (placeholder - would need effectiveness tracking)
      const avgStruggleReduction = successRate // Use success rate as proxy for now

      // Identify topic areas where this intervention works best
      const topicAreas = new Map<string, number>() // topic -> success count

      for (const intervention of successfulInterventions) {
        const topic = intervention.prediction?.learningObjective?.lecture.course.name || 'Unknown'
        topicAreas.set(topic, (topicAreas.get(topic) || 0) + 1)
      }

      // Sort by success count and take top 3
      const mostEffectiveFor = Array.from(topicAreas.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((entry) => entry[0])

      // Confidence based on sample size
      const confidence = Math.min(1.0, appliedCount / 20) // Max confidence at 20+ examples

      effectiveness.push({
        interventionType: type,
        appliedCount,
        successRate,
        avgStruggleReduction,
        mostEffectiveFor,
        confidence,
      })
    }

    // Sort by success rate DESC
    return effectiveness.sort((a, b) => b.successRate - a.successRate)
  }

  // ==================== Helper Methods ====================

  /**
   * Generate weekly struggle rate timeline
   */
  private static async generateTimeline(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ date: Date; rate: number }>> {
    const timeline: Array<{ date: Date; rate: number }> = []
    const weekCount = Math.ceil(differenceInDays(endDate, startDate) / 7)

    for (let weekIndex = 0; weekIndex < weekCount; weekIndex++) {
      const weekStart = new Date(startDate)
      weekStart.setDate(weekStart.getDate() + weekIndex * 7)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      // Calculate struggle rate for this week
      const weekSessions = await prisma.studySession.findMany({
        where: {
          userId,
          startedAt: {
            gte: weekStart,
            lt: weekEnd,
          },
          completedAt: {
            not: null,
          },
        },
        include: {
          reviews: true,
        },
      })

      const topicSet = new Set<string>()
      const topicStruggles = new Map<string, boolean>()

      for (const session of weekSessions) {
        const objectiveCompletions = (session.objectiveCompletions || []) as Array<{
          objectiveId: string
        }>

        for (const completion of objectiveCompletions) {
          if (completion.objectiveId) {
            topicSet.add(completion.objectiveId)
          }
        }

        // Check for AGAIN ratings
        const againReviews = session.reviews.filter((r) => r.rating === ReviewRating.AGAIN)

        for (const review of againReviews) {
          const card = await prisma.card.findUnique({
            where: { id: review.cardId },
            select: { objectiveId: true },
          })
          if (card?.objectiveId) {
            topicStruggles.set(card.objectiveId, true)
          }
        }
      }

      const rate = topicSet.size > 0 ? topicStruggles.size / topicSet.size : 0

      timeline.push({
        date: weekStart,
        rate,
      })
    }

    return timeline
  }

  /**
   * Calculate average performance improvement on predicted topics
   */
  private static async calculatePerformanceImprovement(
    userId: string,
    activationDate: Date,
  ): Promise<number> {
    // Query predictions with interventions applied
    type PredictionWithObjective = {
      id: string
      learningObjective: {
        performanceMetrics: Array<{ date: Date; retentionScore: number }>
      } | null
    }

    const predictions = (await prisma.strugglePrediction.findMany({
      where: {
        userId,
        predictionDate: {
          gte: activationDate,
        },
        interventions: {
          some: {
            status: {
              in: ['COMPLETED'],
            },
          },
        },
      },
      include: {
        learningObjective: {
          include: {
            performanceMetrics: {
              where: {
                userId,
                date: {
                  gte: activationDate,
                },
              },
              select: {
                date: true,
                retentionScore: true,
              },
            },
          },
        },
      },
    })) as unknown as PredictionWithObjective[]

    if (predictions.length === 0) {
      return 0
    }

    let totalImprovement = 0
    let count = 0

    for (const prediction of predictions) {
      const metrics = prediction.learningObjective?.performanceMetrics

      if (metrics && metrics.length >= 2) {
        // Calculate improvement: recent performance - initial performance
        const sortedMetrics = [...metrics].sort((a, b) => a.date.getTime() - b.date.getTime())
        const initial = sortedMetrics[0].retentionScore * 100
        const recent = sortedMetrics[sortedMetrics.length - 1].retentionScore * 100

        const improvement = recent - initial
        totalImprovement += improvement
        count++
      }
    }

    return count > 0 ? totalImprovement / count : 0
  }

  /**
   * Estimate time saved due to reduced struggles
   */
  private static async estimateTimeSaved(
    userId: string,
    baselineRate: StruggleRate,
    currentRate: StruggleRate,
  ): Promise<number> {
    // Assumption: Each struggle requires 30 extra minutes of study time
    const minutesPerStruggle = 30

    // Calculate struggles prevented
    const baselineStruggles = baselineRate.topicsAnalyzed * baselineRate.rate
    const currentStruggles = currentRate.topicsAnalyzed * currentRate.rate

    const strugglesPrevented = Math.max(0, baselineStruggles - currentStruggles)

    return Math.round(strugglesPrevented * minutesPerStruggle)
  }

  /**
   * Calculate confidence increase from predictions
   */
  private static async calculateConfidenceIncrease(
    userId: string,
    activationDate: Date,
  ): Promise<number> {
    // Query validation responses before and after activation
    const beforeResponses = await prisma.validationResponse.findMany({
      where: {
        session: {
          userId,
          startedAt: {
            lt: activationDate,
          },
        },
        confidence: {
          not: null,
        },
      },
      select: {
        confidence: true,
      },
    })

    const afterResponses = await prisma.validationResponse.findMany({
      where: {
        session: {
          userId,
          startedAt: {
            gte: activationDate,
          },
        },
        confidence: {
          not: null,
        },
      },
      select: {
        confidence: true,
      },
    })

    if (beforeResponses.length === 0 || afterResponses.length === 0) {
      return 0
    }

    const beforeAvg =
      beforeResponses.reduce((sum, r) => sum + (r.confidence || 0), 0) / beforeResponses.length

    const afterAvg =
      afterResponses.reduce((sum, r) => sum + (r.confidence || 0), 0) / afterResponses.length

    return afterAvg - beforeAvg
  }

  /**
   * Get empty struggle rate for periods with no data
   */
  private static getEmptyStruggleRate(startDate: Date, endDate: Date): StruggleRate {
    return {
      rate: 0,
      topicsAnalyzed: 0,
      topicsWithStruggles: 0,
      period: {
        startDate,
        endDate,
      },
      indicators: {
        lowPerformanceSessions: 0,
        againRatings: 0,
        lowValidationScores: 0,
      },
    }
  }
}
