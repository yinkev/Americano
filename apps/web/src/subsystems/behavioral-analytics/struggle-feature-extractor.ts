/**
 * Story 5.2: Predictive Analytics for Learning Struggles
 * Feature Engineering Pipeline
 *
 * Extracts 15+ features across 5 categories for struggle prediction:
 * 1. Performance-based features (retention, reviews, validation scores)
 * 2. Prerequisite and dependency features (gaps, mastery)
 * 3. Content complexity features (difficulty, terminology density)
 * 4. Behavioral pattern features (historical struggles, learning style)
 * 5. Contextual features (temporal, workload)
 *
 * All features normalized to 0-1 scale with missing value handling.
 */

import { prisma } from '@/lib/db'
import type {
  LearningObjective,
  PerformanceMetric,
  BehavioralPattern,
  UserLearningProfile,
} from '@/generated/prisma'
import {
  ObjectiveComplexity,
  MasteryLevel,
  BehavioralPatternType,
  ReviewRating,
} from '@/generated/prisma'
import { subDays, differenceInDays } from 'date-fns'
import type { LearningStyleProfile, ContentPreferences, BehavioralPatternData, EventData } from '@/types/prisma-json'

/**
 * Feature vector with 15+ normalized features (0-1 scale)
 */
export interface FeatureVector {
  // Performance features (0-1 normalized)
  retentionScore: number // Average retention for topic area
  retentionDeclineRate: number // Rate of retention degradation
  reviewLapseRate: number // Frequency of AGAIN ratings
  sessionPerformanceScore: number // Recent session performance
  validationScore: number // Validation prompt scores

  // Prerequisite features
  prerequisiteGapCount: number // Number of unmastered prerequisites (normalized)
  prerequisiteMasteryGap: number // Avg mastery gap for prerequisites

  // Complexity features
  contentComplexity: number // Objective difficulty level
  complexityMismatch: number // Difficulty vs. user ability gap

  // Behavioral features
  historicalStruggleScore: number // Past struggles in similar topics
  contentTypeMismatch: number // Content format vs. learning style
  cognitiveLoadIndicator: number // Current cognitive load level

  // Contextual features
  daysUntilExam: number // Urgency factor (normalized)
  daysSinceLastStudy: number // Recency (normalized)
  workloadLevel: number // Current workload (normalized)

  // Metadata
  metadata: {
    extractedAt: Date
    dataQuality: number // 0-1, based on non-default values
  }
}

/**
 * Feature importance scores for model interpretation
 */
export interface FeatureImportanceScores {
  [featureName: string]: number // 0-1 importance score
}

/**
 * Cache entry structure for performance optimization
 */
interface CacheEntry<T> {
  data: T
  timestamp: Date
}

/**
 * Cache TTL configurations (in milliseconds)
 */
const CACHE_TTL = {
  USER_LEARNING_PROFILE: 60 * 60 * 1000, // 1 hour
  BEHAVIORAL_PATTERNS: 12 * 60 * 60 * 1000, // 12 hours
  PERFORMANCE_METRICS: 30 * 60 * 1000, // 30 minutes
}

/**
 * Default neutral value for missing data
 */
const DEFAULT_NEUTRAL_VALUE = 0.5

/**
 * StruggleFeatureExtractor
 *
 * Core feature engineering pipeline for struggle prediction (Story 5.2 Task 2).
 * Extracts and normalizes 15+ features from multiple data sources with intelligent caching.
 */
export class StruggleFeatureExtractor {
  // In-memory cache for frequently accessed data
  private static cache = new Map<string, CacheEntry<any>>()
  /**
   * Extract feature vector for a specific learning objective
   *
   * @param userId - User ID
   * @param objectiveId - Learning objective ID
   * @returns Complete feature vector with 15+ normalized features
   */
  static async extractFeaturesForObjective(
    userId: string,
    objectiveId: string,
  ): Promise<FeatureVector> {
    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
      include: {
        lecture: {
          include: {
            course: true,
          },
        },
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
        performanceMetrics: {
          where: {
            userId,
            date: {
              gte: subDays(new Date(), 30), // Last 30 days
            },
          },
          orderBy: { date: 'desc' },
        },
        cards: {
          where: {
            reviews: {
              some: {
                userId,
              },
            },
          },
          include: {
            reviews: {
              where: {
                userId,
                reviewedAt: {
                  gte: subDays(new Date(), 30),
                },
              },
              orderBy: { reviewedAt: 'desc' },
            },
          },
        },
      },
    })

    if (!objective) {
      throw new Error(`Learning objective ${objectiveId} not found`)
    }

    // Extract topic area from lecture course
    const topicArea = objective.lecture.course.name

    // 1. Performance-based features
    const performanceFeatures = await this.extractPerformanceFeatures(
      userId,
      objectiveId,
      topicArea,
      objective.performanceMetrics,
      objective.cards,
    )

    // 2. Prerequisite features
    const prerequisiteFeatures = await this.extractPrerequisiteFeatures(
      userId,
      objective.prerequisites.map((p) => p.prerequisite),
    )

    // 3. Complexity features
    const complexityFeatures = await this.extractComplexityFeatures(userId, objective, topicArea)

    // 4. Behavioral features
    const behavioralFeatures = await this.extractBehavioralFeatures(userId, topicArea, objective)

    // 5. Contextual features
    const contextualFeatures = await this.extractContextualFeatures(
      userId,
      topicArea,
      objective.lecture.course.id,
    )

    // Combine all features
    const features = {
      ...performanceFeatures,
      ...prerequisiteFeatures,
      ...complexityFeatures,
      ...behavioralFeatures,
      ...contextualFeatures,
    }

    // Calculate data quality (how many features have non-default values)
    const featureValues = Object.values(features).filter((v) => typeof v === 'number')
    const nonDefaultCount = featureValues.filter(
      (v) => Math.abs(v - DEFAULT_NEUTRAL_VALUE) > 0.01,
    ).length
    const dataQuality = featureValues.length > 0 ? nonDefaultCount / featureValues.length : 0

    return {
      retentionScore: features.retentionScore ?? DEFAULT_NEUTRAL_VALUE,
      retentionDeclineRate: features.retentionDeclineRate ?? DEFAULT_NEUTRAL_VALUE,
      reviewLapseRate: features.reviewLapseRate ?? DEFAULT_NEUTRAL_VALUE,
      sessionPerformanceScore: features.sessionPerformanceScore ?? DEFAULT_NEUTRAL_VALUE,
      validationScore: features.validationScore ?? DEFAULT_NEUTRAL_VALUE,
      prerequisiteGapCount: features.prerequisiteGapCount ?? DEFAULT_NEUTRAL_VALUE,
      prerequisiteMasteryGap: features.prerequisiteMasteryGap ?? DEFAULT_NEUTRAL_VALUE,
      contentComplexity: features.contentComplexity ?? DEFAULT_NEUTRAL_VALUE,
      complexityMismatch: features.complexityMismatch ?? DEFAULT_NEUTRAL_VALUE,
      historicalStruggleScore: features.historicalStruggleScore ?? DEFAULT_NEUTRAL_VALUE,
      contentTypeMismatch: features.contentTypeMismatch ?? DEFAULT_NEUTRAL_VALUE,
      cognitiveLoadIndicator: features.cognitiveLoadIndicator ?? DEFAULT_NEUTRAL_VALUE,
      daysUntilExam: features.daysUntilExam ?? 1.0,
      daysSinceLastStudy: features.daysSinceLastStudy ?? DEFAULT_NEUTRAL_VALUE,
      workloadLevel: features.workloadLevel ?? DEFAULT_NEUTRAL_VALUE,
      metadata: {
        extractedAt: new Date(),
        dataQuality,
      },
    }
  }

  /**
   * Extract features for a topic area (not tied to specific objective)
   *
   * @param userId - User ID
   * @param topicId - Topic ID (lectureId or courseId)
   * @returns Aggregated feature vector for the topic
   */
  static async extractFeaturesForTopic(userId: string, topicId: string): Promise<FeatureVector> {
    // For MVP, topicId is courseId
    // Find most relevant objective in this topic for feature extraction
    const objectives = await prisma.learningObjective.findMany({
      where: {
        lecture: {
          courseId: topicId,
          userId,
        },
      },
      include: {
        performanceMetrics: {
          where: {
            userId,
            date: {
              gte: subDays(new Date(), 30),
            },
          },
        },
      },
      orderBy: {
        weaknessScore: 'desc', // Start with weakest objective
      },
      take: 1,
    })

    if (objectives.length === 0) {
      // No objectives in this topic, return default features
      return this.getDefaultFeatures()
    }

    return this.extractFeaturesForObjective(userId, objectives[0].id)
  }

  /**
   * Extract performance-based features (retention, reviews, validation)
   */
  private static async extractPerformanceFeatures(
    userId: string,
    objectiveId: string,
    topicArea: string,
    performanceMetrics: any[],
    cards: any[],
  ): Promise<Partial<FeatureVector>> {
    // Retention score: Average retention from performance metrics
    let retentionScore = 0.5 // Default
    if (performanceMetrics.length > 0) {
      const avgRetention =
        performanceMetrics.reduce((sum, m) => sum + m.retentionScore, 0) / performanceMetrics.length
      retentionScore = avgRetention // Already 0-1
    }

    // Retention decline rate: Trend over time
    let retentionDeclineRate = 0.5 // Default (neutral)
    if (performanceMetrics.length >= 3) {
      const recent = performanceMetrics.slice(0, 3)
      const older = performanceMetrics.slice(-3)

      const recentAvg = recent.reduce((sum, m) => sum + m.retentionScore, 0) / recent.length
      const olderAvg = older.reduce((sum, m) => sum + m.retentionScore, 0) / older.length

      const decline = olderAvg - recentAvg // Positive = declining
      retentionDeclineRate = Math.max(0, Math.min(1, 0.5 + decline)) // Normalize around 0.5
    }

    // Review lapse rate: Frequency of AGAIN ratings
    let reviewLapseRate = 0.5 // Default
    const allReviews = cards.flatMap((c) => c.reviews)
    if (allReviews.length > 0) {
      const lapseCount = allReviews.filter((r) => r.rating === ReviewRating.AGAIN).length
      reviewLapseRate = lapseCount / allReviews.length // Already 0-1
    }

    // Session performance score: Recent session average
    const recentSessions = await prisma.studySession.findMany({
      where: {
        userId,
        completedAt: {
          not: null,
          gte: subDays(new Date(), 7),
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    })

    let sessionPerformanceScore = 0.5 // Default
    if (recentSessions.length > 0) {
      // Calculate performance from review accuracy
      const sessionScores = await Promise.all(
        recentSessions.map(async (session) => {
          const reviews = await prisma.review.findMany({
            where: { sessionId: session.id },
          })

          if (reviews.length === 0) return 0.5

          const goodReviews = reviews.filter(
            (r) => r.rating === ReviewRating.GOOD || r.rating === ReviewRating.EASY,
          ).length

          return goodReviews / reviews.length
        }),
      )

      sessionPerformanceScore = sessionScores.reduce((sum, s) => sum + s, 0) / sessionScores.length
    }

    // Validation score: Average validation prompt scores
    const validationResponses = await prisma.validationResponse.findMany({
      where: {
        session: {
          userId,
          completedAt: {
            gte: subDays(new Date(), 14),
          },
        },
      },
      orderBy: { respondedAt: 'desc' },
      take: 10,
    })

    let validationScore = 0.5 // Default
    if (validationResponses.length > 0) {
      const avgScore =
        validationResponses.reduce((sum, r) => sum + r.score, 0) / validationResponses.length
      validationScore = avgScore // Already 0-1
    }

    return {
      retentionScore,
      retentionDeclineRate,
      reviewLapseRate,
      sessionPerformanceScore,
      validationScore,
    }
  }

  /**
   * Extract prerequisite and dependency features
   */
  private static async extractPrerequisiteFeatures(
    userId: string,
    prerequisites: any[],
  ): Promise<Partial<FeatureVector>> {
    if (prerequisites.length === 0) {
      return {
        prerequisiteGapCount: 0, // No prerequisites = no gaps
        prerequisiteMasteryGap: 0,
      }
    }

    // Check mastery level of each prerequisite
    const masteryLevels = prerequisites.map((p) => p.masteryLevel)

    // Count prerequisites with low mastery (<INTERMEDIATE)
    const lowMasteryPrereqs = masteryLevels.filter(
      (m) => m === MasteryLevel.NOT_STARTED || m === MasteryLevel.BEGINNER,
    ).length

    const prerequisiteGapCount = lowMasteryPrereqs / prerequisites.length // Normalize to 0-1

    // Calculate average mastery gap
    const masteryScores = masteryLevels.map((level) => {
      switch (level) {
        case MasteryLevel.NOT_STARTED:
          return 0.0
        case MasteryLevel.BEGINNER:
          return 0.25
        case MasteryLevel.INTERMEDIATE:
          return 0.5
        case MasteryLevel.ADVANCED:
          return 0.75
        case MasteryLevel.MASTERED:
          return 1.0
        default:
          return 0.5
      }
    })

    const avgMastery = masteryScores.reduce((sum: number, s: number) => sum + s, 0) / masteryScores.length
    const prerequisiteMasteryGap = 1 - avgMastery // Higher gap = worse

    return {
      prerequisiteGapCount,
      prerequisiteMasteryGap,
    }
  }

  /**
   * Extract content complexity features
   */
  private static async extractComplexityFeatures(
    userId: string,
    objective: any,
    topicArea: string,
  ): Promise<Partial<FeatureVector>> {
    // Content complexity: Map enum to 0-1
    let contentComplexity = 0.5 // Default INTERMEDIATE
    switch (objective.complexity) {
      case ObjectiveComplexity.BASIC:
        contentComplexity = 0.3
        break
      case ObjectiveComplexity.INTERMEDIATE:
        contentComplexity = 0.6
        break
      case ObjectiveComplexity.ADVANCED:
        contentComplexity = 0.9
        break
    }

    // User ability level: Average mastery in this topic area
    const topicObjectives = await prisma.learningObjective.findMany({
      where: {
        lecture: {
          course: {
            name: topicArea,
          },
          userId,
        },
      },
      select: {
        masteryLevel: true,
      },
    })

    let userAbilityLevel = 0.5 // Default
    if (topicObjectives.length > 0) {
      const masteryScores = topicObjectives.map((o) => {
        switch (o.masteryLevel) {
          case MasteryLevel.NOT_STARTED:
            return 0.0
          case MasteryLevel.BEGINNER:
            return 0.25
          case MasteryLevel.INTERMEDIATE:
            return 0.5
          case MasteryLevel.ADVANCED:
            return 0.75
          case MasteryLevel.MASTERED:
            return 1.0
          default:
            return 0.5
        }
      })

      userAbilityLevel = masteryScores.reduce((sum: number, s: number) => sum + s, 0) / masteryScores.length
    }

    // Complexity mismatch: Content difficulty exceeds user ability
    const complexityMismatch = Math.max(0, contentComplexity - userAbilityLevel)

    return {
      contentComplexity,
      complexityMismatch,
    }
  }

  /**
   * Extract behavioral pattern features (historical struggles, learning style)
   */
  private static async extractBehavioralFeatures(
    userId: string,
    topicArea: string,
    objective: any,
  ): Promise<Partial<FeatureVector>> {
    // Historical struggle patterns (from Story 5.1)
    const strugglePatterns = await prisma.behavioralPattern.findMany({
      where: {
        userId,
        patternType: BehavioralPatternType.FORGETTING_CURVE, // High forgetting rate = struggle
        confidence: {
          gte: 0.6,
        },
      },
      orderBy: { lastSeenAt: 'desc' },
      take: 5,
    })

    let historicalStruggleScore = 0 // Default
    if (strugglePatterns.length > 0) {
      // Check if evidence includes this topic area
      const relevantPatterns = strugglePatterns.filter((p) => {
        const evidence = p.evidence as unknown as BehavioralPatternData & Record<string, unknown>
        return (evidence.topicArea as string) === topicArea || (evidence.courseId as string) === objective.lecture.courseId
      })

      if (relevantPatterns.length > 0) {
        historicalStruggleScore =
          relevantPatterns.reduce((sum, p) => sum + p.confidence, 0) / relevantPatterns.length
      }
    }

    // Content type preference mismatch
    const learningProfile = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })

    let contentTypeMismatch = 0 // Default (no mismatch)
    if (learningProfile) {
      const styleProfile = learningProfile.learningStyleProfile as unknown as LearningStyleProfile | null
      const contentPrefs = learningProfile.contentPreferences as unknown as ContentPreferences | null

      // For MVP, assume lecture-based objectives match "reading" style
      // Visual learners may struggle with text-heavy content
      const lecturePreference = (contentPrefs?.preferredTypes?.includes('lectures')) ? 0.8 : 0.2
      if ((styleProfile?.visual || 0) > 0.5 && lecturePreference > 0.4) {
        contentTypeMismatch = 0.6 // Moderate mismatch
      }
    }

    // Cognitive load indicator
    const recentEvents = await prisma.behavioralEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: subDays(new Date(), 1),
        },
        sessionPerformanceScore: {
          not: null,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    })

    let cognitiveLoadIndicator = 0.5 // Default
    if (recentEvents.length > 0) {
      const avgPerformance =
        recentEvents.reduce((sum, e) => sum + (e.sessionPerformanceScore || 50), 0) /
        recentEvents.length

      // High cognitive load = low performance
      cognitiveLoadIndicator = 1 - avgPerformance / 100 // Invert and normalize
    }

    return {
      historicalStruggleScore,
      contentTypeMismatch,
      cognitiveLoadIndicator,
    }
  }

  /**
   * Extract contextual features (temporal, workload)
   */
  private static async extractContextualFeatures(
    userId: string,
    topicArea: string,
    courseId: string,
  ): Promise<Partial<FeatureVector>> {
    // Days until exam (urgency factor)
    const upcomingExams = await prisma.exam.findMany({
      where: {
        userId,
        courseId,
        date: {
          gte: new Date(),
        },
      },
      orderBy: { date: 'asc' },
      take: 1,
    })

    let daysUntilExam = 1.0 // Default (no urgency)
    if (upcomingExams.length > 0) {
      const daysLeft = differenceInDays(upcomingExams[0].date, new Date())
      daysUntilExam = Math.max(0, Math.min(1, daysLeft / 90)) // Normalize to 0-1 (90 days max)
    }

    // Days since last studied this topic
    const lastSession = await prisma.studySession.findFirst({
      where: {
        userId,
        completedAt: {
          not: null,
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    let daysSinceLastStudy = 0.5 // Default (neutral)
    if (lastSession && lastSession.completedAt) {
      const daysSince = differenceInDays(new Date(), lastSession.completedAt)
      daysSinceLastStudy = Math.min(1, daysSince / 30) // Normalize to 0-1 (30 days max)
    }

    // Workload level (pending objectives)
    const pendingObjectives = await prisma.learningObjective.count({
      where: {
        lecture: {
          userId,
        },
        masteryLevel: {
          not: MasteryLevel.MASTERED,
        },
      },
    })

    const workloadLevel = Math.min(1, pendingObjectives / 50) // Normalize (50 objectives = max workload)

    return {
      daysUntilExam,
      daysSinceLastStudy,
      workloadLevel,
    }
  }

  /**
   * Calculate feature importance scores for model interpretation
   *
   * Based on domain knowledge and empirical patterns:
   * - Performance features are strongest predictors (30%)
   * - Prerequisites are critical for foundational knowledge (25%)
   * - Behavioral patterns reveal historical struggles (20%)
   * - Contextual factors affect readiness (15%)
   * - Complexity features indicate difficulty (10%)
   *
   * @returns Feature importance scores (0-1)
   */
  static calculateFeatureImportance(): FeatureImportanceScores {
    return {
      // Performance features (30% total weight)
      retentionScore: 0.12, // Strongest single predictor
      retentionDeclineRate: 0.08,
      reviewLapseRate: 0.06,
      sessionPerformanceScore: 0.03,
      validationScore: 0.01, // May not exist for all users (Story 4.1)

      // Prerequisite features (25% total weight)
      prerequisiteGapCount: 0.15, // Critical for foundational gaps
      prerequisiteMasteryGap: 0.1,

      // Behavioral features (20% total weight)
      historicalStruggleScore: 0.12, // Strong predictor from past patterns
      cognitiveLoadIndicator: 0.05,
      contentTypeMismatch: 0.03,

      // Contextual features (15% total weight)
      daysUntilExam: 0.08, // Urgency affects readiness
      workloadLevel: 0.04,
      daysSinceLastStudy: 0.03,

      // Complexity features (10% total weight)
      complexityMismatch: 0.07,
      contentComplexity: 0.03,
    }
  }

  /**
   * Get default feature vector when insufficient data
   */
  private static getDefaultFeatures(): FeatureVector {
    return {
      retentionScore: DEFAULT_NEUTRAL_VALUE,
      retentionDeclineRate: DEFAULT_NEUTRAL_VALUE,
      reviewLapseRate: DEFAULT_NEUTRAL_VALUE,
      sessionPerformanceScore: DEFAULT_NEUTRAL_VALUE,
      validationScore: DEFAULT_NEUTRAL_VALUE,
      prerequisiteGapCount: DEFAULT_NEUTRAL_VALUE,
      prerequisiteMasteryGap: DEFAULT_NEUTRAL_VALUE,
      contentComplexity: DEFAULT_NEUTRAL_VALUE,
      complexityMismatch: DEFAULT_NEUTRAL_VALUE,
      historicalStruggleScore: DEFAULT_NEUTRAL_VALUE,
      contentTypeMismatch: DEFAULT_NEUTRAL_VALUE,
      cognitiveLoadIndicator: DEFAULT_NEUTRAL_VALUE,
      daysUntilExam: 1.0, // No urgency
      daysSinceLastStudy: DEFAULT_NEUTRAL_VALUE,
      workloadLevel: DEFAULT_NEUTRAL_VALUE,
      metadata: {
        extractedAt: new Date(),
        dataQuality: 0.0, // All defaults
      },
    }
  }

  // ==================== Caching Methods ====================

  /**
   * Get cached user learning profile (1 hour TTL)
   */
  private static async getCachedUserLearningProfile(
    userId: string,
  ): Promise<UserLearningProfile | null> {
    const cacheKey = `profile:${userId}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp.getTime() < CACHE_TTL.USER_LEARNING_PROFILE) {
      return cached.data
    }

    const profile = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })

    this.cache.set(cacheKey, { data: profile, timestamp: new Date() })
    return profile
  }

  /**
   * Get cached behavioral patterns (12 hours TTL)
   */
  private static async getCachedBehavioralPatterns(userId: string): Promise<BehavioralPattern[]> {
    const cacheKey = `patterns:${userId}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp.getTime() < CACHE_TTL.BEHAVIORAL_PATTERNS) {
      return cached.data
    }

    const patterns = await prisma.behavioralPattern.findMany({
      where: { userId },
    })

    this.cache.set(cacheKey, { data: patterns, timestamp: new Date() })
    return patterns
  }

  /**
   * Get cached performance metrics (30 minutes TTL)
   */
  private static async getCachedPerformanceMetrics(
    userId: string,
    objectiveId: string,
  ): Promise<PerformanceMetric[]> {
    const cacheKey = `metrics:${userId}:${objectiveId}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp.getTime() < CACHE_TTL.PERFORMANCE_METRICS) {
      return cached.data
    }

    const metrics = await prisma.performanceMetric.findMany({
      where: {
        userId,
        learningObjectiveId: objectiveId,
        date: {
          gte: subDays(new Date(), 30), // Last 30 days
        },
      },
      orderBy: { date: 'desc' },
    })

    this.cache.set(cacheKey, { data: metrics, timestamp: new Date() })
    return metrics
  }

  /**
   * Clear cache (useful for testing or manual invalidation)
   */
  static clearCache(): void {
    this.cache.clear()
  }
}
