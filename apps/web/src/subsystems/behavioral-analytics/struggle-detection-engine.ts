/**
 * Story 5.2: Predictive Analytics for Learning Struggles
 * Struggle Detection Engine
 *
 * Orchestrates the complete prediction workflow:
 * 1. Identify upcoming learning objectives (7-14 days ahead)
 * 2. Extract feature vectors for each objective
 * 3. Run predictions via ML model
 * 4. Detect struggle indicators in real-time
 * 5. Generate intervention recommendations
 *
 * Runs as daily batch job (11 PM) or on-demand
 */

import { addDays, subDays } from 'date-fns'
import {
  IndicatorType,
  type InterventionRecommendation,
  InterventionStatus,
  InterventionType,
  MasteryLevel,
  PredictionStatus,
  type Prisma,
  PrismaClient,
  ReviewRating,
  Severity,
  type StruggleIndicator,
  type StrugglePrediction,
} from '@/generated/prisma'
import { getMissionObjectives, getSessionMissionObjectives } from '@/types/mission-helpers'
import type { FeatureVector } from '@/types/prisma-json'
import { StruggleFeatureExtractor } from './struggle-feature-extractor'
import { StrugglePredictionModel } from './struggle-prediction-model'

const prisma = new PrismaClient()

/**
 * Struggle alert for user notification
 */
export interface StruggleAlert {
  id: string
  type: 'PROACTIVE_WARNING' | 'PREREQUISITE_ALERT' | 'REAL_TIME_ALERT' | 'INTERVENTION_SUGGESTION'
  title: string
  message: string
  severity: Severity
  predictionId?: string
  interventionId?: string
  priority: number // 0-100
  createdAt: Date
}

export class StruggleDetectionEngine {
  private featureExtractor: StruggleFeatureExtractor
  private predictionModel: StrugglePredictionModel

  constructor() {
    this.featureExtractor = new StruggleFeatureExtractor()
    this.predictionModel = new StrugglePredictionModel(false) // Use rule-based for MVP
  }

  /**
   * Run predictions for all upcoming objectives (main batch workflow)
   */
  async runPredictions(userId: string): Promise<StrugglePrediction[]> {
    // Get upcoming missions in next 7-14 days
    const upcomingMissions = await prisma.mission.findMany({
      where: {
        userId,
        date: {
          gte: new Date(),
          lte: addDays(new Date(), 14),
        },
        status: {
          not: 'COMPLETED',
        },
      },
    })

    // Extract objectives from missions
    const objectiveIds: string[] = []
    for (const mission of upcomingMissions) {
      const objectives = getMissionObjectives(mission)
      objectiveIds.push(...objectives.map((o) => o.id))
    }

    // Also include objectives not yet in missions (next to be scheduled)
    const unscheduledObjectives = await prisma.learningObjective.findMany({
      where: {
        lecture: { userId },
        masteryLevel: {
          not: MasteryLevel.MASTERED,
        },
        id: {
          notIn: objectiveIds,
        },
      },
      orderBy: [
        { weaknessScore: 'desc' }, // Prioritize weak areas
        { isHighYield: 'desc' },
      ],
      take: 10, // Next 10 unscheduled objectives
    })

    objectiveIds.push(...unscheduledObjectives.map((o) => o.id))

    // Remove duplicates
    const uniqueObjectiveIds = [...new Set(objectiveIds)]

    // Run predictions for each objective
    const predictions: StrugglePrediction[] = []

    for (const objectiveId of uniqueObjectiveIds) {
      try {
        const prediction = await this.predictForObjective(userId, objectiveId)

        // Only save predictions with probability >0.5 (significant risk)
        if (prediction && prediction.predictedStruggleProbability > 0.5) {
          predictions.push(prediction)
        }
      } catch (error) {
        console.error(`Failed to predict for objective ${objectiveId}:`, error)
      }
    }

    return predictions
  }

  /**
   * Detect upcoming struggles in next N days
   */
  async detectUpcomingStruggles(
    userId: string,
    daysAhead: number = 7,
  ): Promise<StrugglePrediction[]> {
    return await prisma.strugglePrediction.findMany({
      where: {
        userId,
        predictionDate: {
          gte: new Date(),
          lte: addDays(new Date(), daysAhead),
        },
        predictionStatus: PredictionStatus.PENDING,
        predictedStruggleProbability: {
          gte: 0.5,
        },
      },
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
        indicators: true,
        interventions: true,
      },
      orderBy: [{ predictedStruggleProbability: 'desc' }, { predictionDate: 'asc' }],
    })
  }

  /**
   * Analyze current struggles in active sessions (real-time detection)
   */
  async analyzeCurrentStruggles(userId: string): Promise<StruggleIndicator[]> {
    // Get current active session
    const activeSession = await prisma.studySession.findFirst({
      where: {
        userId,
        completedAt: null,
      },
      orderBy: { startedAt: 'desc' },
    })

    if (!activeSession) {
      return [] // No active session
    }

    // Get recent reviews in this session
    const recentReviews = await prisma.review.findMany({
      where: {
        sessionId: activeSession.id,
        reviewedAt: {
          gte: subDays(new Date(), 0.1), // Last ~2 hours
        },
      },
      include: {
        card: {
          include: {
            objective: {
              include: {
                lecture: true,
              },
            },
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
    })

    if (recentReviews.length < 5) {
      return [] // Not enough data yet
    }

    const indicators: StruggleIndicator[] = []

    // Detect struggle patterns:

    // 1. Multiple AGAIN ratings in short period
    const againCount = recentReviews.filter((r) => r.rating === ReviewRating.AGAIN).length
    const lapseRate = againCount / recentReviews.length

    if (lapseRate > 0.3) {
      // >30% lapse rate
      const objectiveId = recentReviews[0].card.objective?.id

      if (objectiveId) {
        const indicator = await prisma.struggleIndicator.create({
          data: {
            userId,
            learningObjectiveId: objectiveId,
            indicatorType: IndicatorType.LOW_RETENTION,
            severity: lapseRate > 0.5 ? Severity.HIGH : Severity.MEDIUM,
            context: {
              lapseRate,
              recentReviewCount: recentReviews.length,
              againCount,
              sessionId: activeSession.id,
            },
          },
        })

        indicators.push(indicator)
      }
    }

    // 2. Session performance drop >20% from average
    const sessionPerformance = await this.calculateSessionPerformance(activeSession.id)
    const avgPerformance = await this.getUserAveragePerformance(userId)

    if (avgPerformance - sessionPerformance > 0.2) {
      // >20% drop
      const currentObjective = await this.getCurrentSessionObjective(activeSession)

      if (currentObjective) {
        const indicator = await prisma.struggleIndicator.create({
          data: {
            userId,
            learningObjectiveId: currentObjective.id,
            indicatorType: IndicatorType.COGNITIVE_OVERLOAD,
            severity: Severity.HIGH,
            context: {
              sessionPerformance,
              averagePerformance: avgPerformance,
              performanceDrop: avgPerformance - sessionPerformance,
              sessionId: activeSession.id,
            },
          },
        })

        indicators.push(indicator)
      }
    }

    return indicators
  }

  /**
   * Identify intervention opportunities based on predictions and indicators
   */
  async identifyInterventionOpportunities(userId: string): Promise<InterventionRecommendation[]> {
    // Get pending predictions with no interventions yet
    const predictions = await prisma.strugglePrediction.findMany({
      where: {
        userId,
        predictionStatus: PredictionStatus.PENDING,
        predictedStruggleProbability: {
          gte: 0.6, // Moderate to high risk
        },
        interventions: {
          none: {}, // No interventions created yet
        },
      },
      include: {
        learningObjective: {
          include: {
            lecture: true,
            prerequisites: {
              include: {
                prerequisite: true,
              },
            },
          },
        },
        indicators: true,
      },
    })

    const interventions: InterventionRecommendation[] = []

    for (const prediction of predictions) {
      const generatedInterventions = await this.generateInterventionsForPrediction(prediction)
      interventions.push(...generatedInterventions)
    }

    return interventions
  }

  /**
   * Predict struggle for a specific objective
   */
  private async predictForObjective(
    userId: string,
    objectiveId: string,
  ): Promise<StrugglePrediction | null> {
    // Extract features
    const featureVector = await StruggleFeatureExtractor.extractFeaturesForObjective(
      userId,
      objectiveId,
    )
    const features = featureVector
    const metadata = featureVector.metadata

    // Run prediction
    const prediction = this.predictionModel.predict(features, metadata.dataQuality)

    // Create database record
    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
      include: {
        lecture: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!objective) {
      return null
    }

    // Create struggle indicators based on top contributing features
    const createdIndicators: StruggleIndicator[] = []

    // Extract top features from feature vector (simplified for MVP)
    const featureVec = features as unknown as FeatureVector
    const topFeatureNames: Array<keyof FeatureVector> = [
      'retentionScore',
      'prerequisiteGap',
      'complexityMismatch',
    ]
    const topFeatures = topFeatureNames
      .map((name) => ({
        name: String(name),
        value: featureVec[name] ?? 0.5,
      }))
      .filter((f) => f.value > 0.5)
      .slice(0, 3)

    for (const feature of topFeatures) {
      const indicatorType = this.mapFeatureToIndicatorType(feature.name)

      if (indicatorType) {
        const indicator = await prisma.struggleIndicator.create({
          data: {
            userId,
            learningObjectiveId: objectiveId,
            indicatorType,
            severity:
              feature.value > 0.7
                ? Severity.HIGH
                : feature.value > 0.4
                  ? Severity.MEDIUM
                  : Severity.LOW,
            context: {
              featureName: feature.name,
              featureValue: feature.value,
            },
          },
        })

        createdIndicators.push(indicator)
      }
    }

    // Create prediction record
    const strugglePrediction = await prisma.strugglePrediction.create({
      data: {
        userId,
        learningObjectiveId: objectiveId,
        topicId: objective.lecture.course.id,
        predictedStruggleProbability: prediction.probability,
        predictionConfidence: prediction.confidence,
        featureVector: features as unknown as Prisma.InputJsonValue,
        strugglingFactors: {
          indicators: createdIndicators.map((i) => i.indicatorType),
          confidence: prediction.confidence,
        } as unknown as Prisma.InputJsonValue,
        predictionStatus: PredictionStatus.PENDING,
      },
    })

    // Link indicators to prediction
    if (createdIndicators.length > 0) {
      await prisma.struggleIndicator.updateMany({
        where: {
          id: {
            in: createdIndicators.map((i) => i.id),
          },
        },
        data: {
          predictionId: strugglePrediction.id,
        },
      })
    }

    return strugglePrediction
  }

  /**
   * Generate intervention recommendations for a prediction
   */
  private async generateInterventionsForPrediction(
    prediction: StrugglePrediction & { indicators: StruggleIndicator[]; learningObjective: any },
  ): Promise<InterventionRecommendation[]> {
    const interventions: InterventionRecommendation[] = []

    // 1. Prerequisite review if PREREQUISITE_GAP detected
    const prerequisiteGaps = prediction.indicators.filter(
      (i) => i.indicatorType === IndicatorType.PREREQUISITE_GAP,
    )

    if (prerequisiteGaps.length > 0) {
      const intervention = await prisma.interventionRecommendation.create({
        data: {
          predictionId: prediction.id,
          userId: prediction.userId,
          interventionType: InterventionType.PREREQUISITE_REVIEW,
          description: 'Review prerequisite concepts before studying this objective',
          reasoning: `You have ${prerequisiteGaps.length} prerequisite concepts that need review. Mastering these first will improve understanding.`,
          priority: 9,
          status: InterventionStatus.PENDING,
        },
      })

      interventions.push(intervention)
    }

    // 2. Difficulty progression if COMPLEXITY_MISMATCH
    const complexityMismatches = prediction.indicators.filter(
      (i) => i.indicatorType === IndicatorType.COMPLEXITY_MISMATCH,
    )

    if (complexityMismatches.length > 0) {
      const intervention = await prisma.interventionRecommendation.create({
        data: {
          predictionId: prediction.id,
          userId: prediction.userId,
          interventionType: InterventionType.DIFFICULTY_PROGRESSION,
          description: 'Start with foundational content before tackling advanced concepts',
          reasoning:
            'This topic is more complex than your current level. Building up gradually will improve retention.',
          priority: 8,
          status: InterventionStatus.PENDING,
        },
      })

      interventions.push(intervention)
    }

    // 3. Cognitive load reduction if COGNITIVE_OVERLOAD
    const cognitiveOverload = prediction.indicators.filter(
      (i) => i.indicatorType === IndicatorType.COGNITIVE_OVERLOAD,
    )

    if (cognitiveOverload.length > 0) {
      const intervention = await prisma.interventionRecommendation.create({
        data: {
          predictionId: prediction.id,
          userId: prediction.userId,
          interventionType: InterventionType.COGNITIVE_LOAD_REDUCE,
          description: 'Break topic into smaller chunks with more breaks',
          reasoning:
            "You're showing signs of cognitive fatigue. Reducing workload will improve focus.",
          priority: 8,
          status: InterventionStatus.PENDING,
        },
      })

      interventions.push(intervention)
    }

    // 4. Spaced repetition boost if HISTORICAL_STRUGGLE_PATTERN
    const historicalStruggles = prediction.indicators.filter(
      (i) => i.indicatorType === IndicatorType.HISTORICAL_STRUGGLE_PATTERN,
    )

    if (historicalStruggles.length > 0) {
      const intervention = await prisma.interventionRecommendation.create({
        data: {
          predictionId: prediction.id,
          userId: prediction.userId,
          interventionType: InterventionType.SPACED_REPETITION_BOOST,
          description: 'Increase review frequency for this topic area',
          reasoning:
            "You've struggled with similar topics before. More frequent reviews will strengthen retention.",
          priority: 6,
          status: InterventionStatus.PENDING,
        },
      })

      interventions.push(intervention)
    }

    return interventions
  }

  /**
   * Helper: Map feature name to indicator type
   */
  private mapFeatureToIndicatorType(featureName: string): IndicatorType | null {
    const mapping: Record<string, IndicatorType> = {
      retentionScore: IndicatorType.LOW_RETENTION,
      prerequisiteGapCount: IndicatorType.PREREQUISITE_GAP,
      complexityMismatch: IndicatorType.COMPLEXITY_MISMATCH,
      cognitiveLoadIndicator: IndicatorType.COGNITIVE_OVERLOAD,
      historicalStruggleScore: IndicatorType.HISTORICAL_STRUGGLE_PATTERN,
      'Low retention': IndicatorType.LOW_RETENTION,
      'Moderate retention': IndicatorType.LOW_RETENTION,
      'Prerequisite gaps': IndicatorType.PREREQUISITE_GAP,
      'Some prerequisite gaps': IndicatorType.PREREQUISITE_GAP,
      'Complexity mismatch': IndicatorType.COMPLEXITY_MISMATCH,
      'Cognitive overload': IndicatorType.COGNITIVE_OVERLOAD,
      'Historical struggles': IndicatorType.HISTORICAL_STRUGGLE_PATTERN,
      'Learning style mismatch': IndicatorType.COMPLEXITY_MISMATCH,
    }

    return mapping[featureName] || null
  }

  /**
   * Helper: Calculate session performance (0-1)
   */
  private async calculateSessionPerformance(sessionId: string): Promise<number> {
    const reviews = await prisma.review.findMany({
      where: { sessionId },
    })

    if (reviews.length === 0) return 0.5

    const goodReviews = reviews.filter(
      (r) => r.rating === ReviewRating.GOOD || r.rating === ReviewRating.EASY,
    ).length

    return goodReviews / reviews.length
  }

  /**
   * Helper: Get user's average performance (0-1)
   */
  private async getUserAveragePerformance(userId: string): Promise<number> {
    const recentSessions = await prisma.studySession.findMany({
      where: {
        userId,
        completedAt: {
          not: null,
          gte: subDays(new Date(), 14),
        },
      },
      take: 10,
    })

    if (recentSessions.length === 0) return 0.7 // Optimistic default

    const performances = await Promise.all(
      recentSessions.map((s) => this.calculateSessionPerformance(s.id)),
    )

    return performances.reduce((sum, p) => sum + p, 0) / performances.length
  }

  /**
   * Helper: Get current objective being studied in session
   */
  private async getCurrentSessionObjective(session: any): Promise<any | null> {
    const objectives = getSessionMissionObjectives(session.missionObjectives)

    if (!objectives || objectives.length === 0) {
      return null
    }

    const currentIndex = session.currentObjectiveIndex || 0
    const currentObjectiveId = objectives[currentIndex]?.id

    if (!currentObjectiveId) {
      return null
    }

    return await prisma.learningObjective.findUnique({
      where: { id: currentObjectiveId },
    })
  }

  // ==================== TASK 5: STRUGGLE ALERT SYSTEM ====================

  /**
   * Generate alerts for user notification
   * Alert triggered when: probability >0.7, MEDIUM+ severity, <3 days until due
   * Priority formula: urgency(0.4) + confidence(0.3) + severity(0.2) + cognitiveLoad(0.1)
   * Limit to top 3 alerts
   */
  async generateAlerts(userId: string): Promise<StruggleAlert[]> {
    // Get high-probability predictions in next 3 days
    const predictions = await prisma.strugglePrediction.findMany({
      where: {
        userId,
        predictionStatus: PredictionStatus.PENDING,
        predictedStruggleProbability: {
          gte: 0.7,
        },
        predictionDate: {
          gte: new Date(),
          lte: addDays(new Date(), 3),
        },
      },
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
        indicators: true,
      },
    })

    const alerts: StruggleAlert[] = []

    for (const prediction of predictions) {
      // Calculate severity from indicators
      const severity = this.calculateAlertSeverity(prediction.indicators)

      // Skip if not MEDIUM+ severity
      if (severity === Severity.LOW) continue

      // Calculate days until due
      const daysUntilDue = await this.calculateDaysUntilDue(prediction)

      // Calculate cognitive load from feature vector
      const featureVector = prediction.featureVector as unknown as FeatureVector | null
      const cognitiveLoad = featureVector?.cognitiveLoad ?? 0.5

      // Priority formula: urgency(0.4) + confidence(0.3) + severity(0.2) + cognitiveLoad(0.1)
      const urgency = 1 - Math.min(daysUntilDue / 3, 1) // Normalize to 0-1 (3 days max)
      const severityScore =
        severity === Severity.HIGH ? 1.0 : severity === Severity.MEDIUM ? 0.7 : 0.3
      const priority =
        (urgency * 0.4 +
          prediction.predictionConfidence * 0.3 +
          severityScore * 0.2 +
          cognitiveLoad * 0.1) *
        100 // Scale to 0-100

      const objective = prediction.learningObjective
      const courseName = objective?.lecture?.course?.name || 'Unknown course'
      const objectiveName = objective?.objective || 'Unknown topic'

      // Determine alert type
      const hasPrerequisiteGap = prediction.indicators.some(
        (i: any) => i.indicatorType === IndicatorType.PREREQUISITE_GAP,
      )

      const alertType = hasPrerequisiteGap
        ? 'PREREQUISITE_ALERT'
        : daysUntilDue < 1
          ? 'REAL_TIME_ALERT'
          : 'PROACTIVE_WARNING'

      // Generate alert message
      const message = this.generateAlertMessage(
        prediction,
        severity,
        daysUntilDue,
        hasPrerequisiteGap,
      )

      alerts.push({
        id: `alert-${prediction.id}`,
        type: alertType,
        title: `Potential struggle with ${courseName}`,
        message,
        severity,
        predictionId: prediction.id,
        priority,
        createdAt: prediction.predictionDate,
      })
    }

    // Sort by priority and limit to top 3
    return this.prioritizeAlerts(alerts)
  }

  /**
   * Prioritize alerts and limit to top 3
   * Sorts by priority score (highest first)
   */
  prioritizeAlerts(alerts: StruggleAlert[]): StruggleAlert[] {
    return alerts.sort((a, b) => b.priority - a.priority).slice(0, 3)
  }

  /**
   * Calculate alert severity from indicators
   */
  private calculateAlertSeverity(indicators: any[]): Severity {
    if (indicators.length === 0) return Severity.LOW

    // Count indicators by severity
    const highCount = indicators.filter((i: any) => i.severity === Severity.HIGH).length
    const mediumCount = indicators.filter((i: any) => i.severity === Severity.MEDIUM).length

    // High severity if 2+ high indicators or 1 high + 2+ medium
    if (highCount >= 2 || (highCount >= 1 && mediumCount >= 2)) {
      return Severity.HIGH
    }

    // Medium severity if 1 high or 2+ medium
    if (highCount >= 1 || mediumCount >= 2) {
      return Severity.MEDIUM
    }

    return Severity.LOW
  }

  /**
   * Calculate days until objective is due
   */
  private async calculateDaysUntilDue(prediction: any): Promise<number> {
    // Check if objective is in upcoming mission
    const missions = await prisma.mission.findMany({
      where: {
        userId: prediction.userId,
        date: {
          gte: new Date(),
        },
        status: {
          not: 'COMPLETED',
        },
      },
      orderBy: { date: 'asc' },
      take: 5,
    })

    // Find mission containing this objective
    for (const mission of missions) {
      const objectives = getMissionObjectives(mission)
      const hasObjective = objectives.some((o) => o.id === prediction.learningObjectiveId)

      if (hasObjective) {
        const daysDiff = Math.ceil(
          (mission.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        )
        return Math.max(0, daysDiff)
      }
    }

    // Check for upcoming exams
    if (prediction.learningObjective?.lecture?.course) {
      const exam = await prisma.exam.findFirst({
        where: {
          userId: prediction.userId,
          courseId: prediction.learningObjective.lecture.course.id,
          date: {
            gte: new Date(),
          },
        },
        orderBy: { date: 'asc' },
      })

      if (exam) {
        const daysDiff = Math.ceil(
          (exam.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        )
        return Math.max(0, daysDiff)
      }
    }

    // Default: estimate based on probability (high probability = more urgent)
    return prediction.predictedStruggleProbability > 0.8 ? 1 : 2
  }

  /**
   * Generate user-friendly alert message
   */
  private generateAlertMessage(
    prediction: any,
    severity: Severity,
    daysUntilDue: number,
    hasPrerequisiteGap: boolean,
  ): string {
    const objectiveName = prediction.learningObjective?.objective || 'this topic'
    const probability = Math.round(prediction.predictedStruggleProbability * 100)

    let urgencyPhrase = ''
    if (daysUntilDue === 0) {
      urgencyPhrase = 'today'
    } else if (daysUntilDue === 1) {
      urgencyPhrase = 'tomorrow'
    } else if (daysUntilDue <= 3) {
      urgencyPhrase = `in ${daysUntilDue} days`
    } else {
      urgencyPhrase = 'soon'
    }

    let baseMessage = `You have a ${probability}% chance of struggling with "${objectiveName}" ${urgencyPhrase}.`

    // Add specific recommendations
    if (hasPrerequisiteGap) {
      baseMessage += ' We recommend reviewing prerequisite concepts first.'
    } else if (severity === Severity.HIGH) {
      baseMessage += ' Consider breaking it into smaller chunks and scheduling extra review time.'
    } else {
      baseMessage += ' We have some strategies to help you succeed.'
    }

    return baseMessage
  }
}
