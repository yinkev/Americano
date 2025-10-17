/**
 * Recommendations Engine
 * Story 5.6 Task 2
 *
 * Generates personalized study recommendations from behavioral patterns, insights,
 * and struggle predictions with intelligent priority scoring.
 *
 * @subsystem Behavioral Analytics and Personalization
 * @location apps/web/src/subsystems/behavioral-analytics/recommendations-engine.ts
 */

import { prisma } from '@/lib/db'
import type {
  Recommendation,
  BehavioralPattern,
  BehavioralInsight,
  InterventionRecommendation,
  RecommendationType,
} from '@/generated/prisma'

/**
 * Recommendation template with scoring weights
 */
interface RecommendationTemplate {
  type: RecommendationType
  titleTemplate: string
  descriptionTemplate: string
  actionableTemplate: string
  estimatedImpactBase: number // 0.0-1.0
  easeOfImplementationBase: number // 0.0-1.0
}

/**
 * Scoring weights (from story context constraint #5)
 * - Confidence: 30%
 * - Impact: 40%
 * - Ease: 20%
 * - Readiness: 10%
 */
const SCORING_WEIGHTS = {
  confidence: 0.3,
  impact: 0.4,
  ease: 0.2,
  readiness: 0.1,
} as const

/**
 * Minimum confidence threshold for recommendations
 */
const MIN_CONFIDENCE = 0.7

/**
 * Maximum recommendations to return
 */
const MAX_RECOMMENDATIONS = 5

/**
 * Recommendation templates mapped to pattern/insight types
 */
const RECOMMENDATION_TEMPLATES: Record<string, RecommendationTemplate> = {
  OPTIMAL_STUDY_TIME: {
    type: 'STUDY_TIME_OPTIMIZATION',
    titleTemplate: 'Study during your peak hours ({{hourRange}})',
    descriptionTemplate:
      'Your analysis shows {{performanceIncrease}}% better performance during {{hourRange}} based on {{sessionCount}} sessions.',
    actionableTemplate:
      'Schedule high-priority missions during {{hourRange}} for optimal retention and performance.',
    estimatedImpactBase: 0.85,
    easeOfImplementationBase: 0.7,
  },
  SESSION_DURATION_PREFERENCE: {
    type: 'SESSION_DURATION_ADJUSTMENT',
    titleTemplate: 'Optimize session length to {{duration}} minutes',
    descriptionTemplate:
      'Your optimal session length is {{duration}} minutes ({{completionRate}}% completion rate).',
    actionableTemplate:
      'Adjust mission duration preferences to {{duration}} minutes for better completion and reduced fatigue.',
    estimatedImpactBase: 0.75,
    easeOfImplementationBase: 0.9,
  },
  CONTENT_TYPE_PREFERENCE: {
    type: 'CONTENT_TYPE_BALANCE',
    titleTemplate: 'Increase {{contentType}} content to {{targetPercentage}}%',
    descriptionTemplate:
      'You learn {{effectiveness}}% more effectively with {{contentType}} content.',
    actionableTemplate:
      'Prioritize {{contentType}} content in your study sessions for improved learning outcomes.',
    estimatedImpactBase: 0.65,
    easeOfImplementationBase: 0.75,
  },
  FORGETTING_CURVE: {
    type: 'RETENTION_STRATEGY',
    titleTemplate: 'Review every {{reviewDays}} days for optimal retention',
    descriptionTemplate:
      'Your retention decays {{deviationPercent}}% {{fasterSlower}} than average (half-life: {{halfLife}} days).',
    actionableTemplate:
      'Adjust review frequency to every {{reviewDays}} days to maintain 70%+ retention.',
    estimatedImpactBase: 0.8,
    easeOfImplementationBase: 0.6,
  },
  CONSISTENCY_BUILDING: {
    type: 'CONSISTENCY_BUILDING',
    titleTemplate: 'Build study consistency: {{targetDays}} days per week',
    descriptionTemplate:
      'Increasing study consistency from {{currentDays}} to {{targetDays}} days/week can improve retention by {{improvementPercent}}%.',
    actionableTemplate:
      'Set calendar reminders for study sessions on {{suggestedDays}} to build a consistent habit.',
    estimatedImpactBase: 0.7,
    easeOfImplementationBase: 0.65,
  },
  EXPERIMENTAL_SUGGESTION: {
    type: 'EXPERIMENTAL_SUGGESTION',
    titleTemplate: 'Try {{experimentType}} for {{topic}}',
    descriptionTemplate:
      'Based on similar learners, {{experimentType}} may improve your {{topic}} performance.',
    actionableTemplate:
      'Experiment with {{experimentType}} in your next 3 study sessions and track results.',
    estimatedImpactBase: 0.6,
    easeOfImplementationBase: 0.5,
  },
}

/**
 * RecommendationsEngine
 *
 * Core responsibilities:
 * 1. Generate recommendations from patterns, insights, and interventions
 * 2. Prioritize using composite scoring algorithm
 * 3. Track effectiveness of applied recommendations
 */
export class RecommendationsEngine {
  /**
   * Generate personalized recommendations from all available sources
   *
   * Algorithm:
   * 1. Fetch high-confidence patterns (≥0.7), insights, and interventions
   * 2. Transform into recommendation templates with personalized data
   * 3. Calculate priority scores (confidence 30% + impact 40% + ease 20% + readiness 10%)
   * 4. Diversify by type (max 2 per type)
   * 5. Return top 5 by priority score
   *
   * @param userId - User ID to generate recommendations for
   * @returns Array of prioritized recommendations
   */
  static async generateRecommendations(
    userId: string
  ): Promise<Recommendation[]> {
    // Step 1: Fetch source data in parallel
    const [patterns, insights, interventions, existingRecs] = await Promise.all([
      prisma.behavioralPattern.findMany({
        where: {
          userId,
          confidence: { gte: MIN_CONFIDENCE },
        },
        orderBy: { confidence: 'desc' },
        take: 10,
      }),
      prisma.behavioralInsight.findMany({
        where: {
          userId,
          acknowledgedAt: null,
          confidence: { gte: MIN_CONFIDENCE },
        },
        orderBy: { confidence: 'desc' },
        take: 10,
      }),
      prisma.interventionRecommendation.findMany({
        where: {
          userId,
          status: 'PENDING',
        },
        orderBy: { priority: 'desc' },
        take: 5,
      }),
      prisma.recommendation.findMany({
        where: {
          userId,
          dismissedAt: null,
          appliedAt: null,
        },
      }),
    ])

    // Skip if already have recent recommendations
    const hasRecentRecs = existingRecs.some(
      (rec) =>
        rec.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24h
    )
    if (hasRecentRecs && existingRecs.length >= MAX_RECOMMENDATIONS) {
      return existingRecs.slice(0, MAX_RECOMMENDATIONS)
    }

    // Step 2: Transform sources into recommendations
    const recommendations: Array<
      Omit<
        Recommendation,
        'id' | 'createdAt' | 'appliedAt' | 'dismissedAt'
      >
    > = []

    // From patterns
    for (const pattern of patterns) {
      const rec = this.createRecommendationFromPattern(userId, pattern)
      if (rec) recommendations.push(rec)
    }

    // From insights
    for (const insight of insights) {
      const rec = this.createRecommendationFromInsight(userId, insight)
      if (rec) recommendations.push(rec)
    }

    // From interventions
    for (const intervention of interventions) {
      const rec = this.createRecommendationFromIntervention(userId, intervention)
      if (rec) recommendations.push(rec)
    }

    // Step 3: Prioritize recommendations
    const prioritized = this.prioritizeRecommendations(recommendations)

    // Step 4: Save top recommendations
    const saved: Recommendation[] = []
    for (const rec of prioritized.slice(0, MAX_RECOMMENDATIONS)) {
      // Check if similar recommendation already exists
      const exists = existingRecs.some(
        (existing) =>
          existing.recommendationType === rec.recommendationType &&
          existing.title === rec.title
      )

      if (!exists) {
        const created = await prisma.recommendation.create({
          data: rec,
        })
        saved.push(created)
      }
    }

    return saved.length > 0 ? saved : existingRecs.slice(0, MAX_RECOMMENDATIONS)
  }

  /**
   * Prioritize recommendations using composite scoring
   *
   * Score = (confidence × 0.3) + (impact × 0.4) + (ease × 0.2) + (readiness × 0.1)
   *
   * Diversification: Max 2 recommendations per type
   *
   * @param recommendations - Raw recommendations to prioritize
   * @returns Sorted array by priority score (descending)
   */
  static prioritizeRecommendations(
    recommendations: Array<
      Omit<
        Recommendation,
        'id' | 'createdAt' | 'appliedAt' | 'dismissedAt'
      >
    >
  ): Array<
    Omit<
      Recommendation,
      'id' | 'createdAt' | 'appliedAt' | 'dismissedAt'
    >
  > {
    // Calculate priority scores
    const scored = recommendations.map((rec) => ({
      ...rec,
      priorityScore:
        rec.confidence * SCORING_WEIGHTS.confidence +
        rec.estimatedImpact * SCORING_WEIGHTS.impact +
        rec.easeOfImplementation * SCORING_WEIGHTS.ease +
        rec.userReadiness * SCORING_WEIGHTS.readiness,
    }))

    // Sort by priority score (descending)
    scored.sort((a, b) => b.priorityScore - a.priorityScore)

    // Diversify: max 2 per type
    const diversified: typeof scored = []
    const typeCounts = new Map<string, number>()

    for (const rec of scored) {
      const count = typeCounts.get(rec.recommendationType) || 0
      if (count < 2) {
        diversified.push(rec)
        typeCounts.set(rec.recommendationType, count + 1)
      }
    }

    return diversified
  }

  /**
   * Track recommendation effectiveness after application
   *
   * Measures improvement over 2-week period:
   * - Behavioral score change
   * - Pattern confidence change
   * - Academic performance change (if available)
   *
   * @param userId - User ID
   * @param recommendationId - Recommendation ID
   * @param applicationType - How it was applied
   * @returns AppliedRecommendation record
   */
  static async trackRecommendationEffectiveness(
    userId: string,
    recommendationId: string,
    applicationType: 'AUTO' | 'MANUAL' | 'REMINDER' | 'GOAL'
  ) {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    })

    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`)
    }

    // Capture baseline metrics
    const baselineMetrics = await this.captureBaselineMetrics(userId)

    // Create tracking record
    const applied = await prisma.appliedRecommendation.create({
      data: {
        recommendationId,
        userId,
        applicationType,
        baselineMetrics,
      },
    })

    // Mark recommendation as applied
    await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { appliedAt: new Date() },
    })

    return applied
  }

  /**
   * Evaluate recommendation effectiveness after 2 weeks
   *
   * @param appliedRecommendationId - Applied recommendation ID
   * @returns Effectiveness score (0.0-1.0)
   */
  static async evaluateRecommendationEffectiveness(
    appliedRecommendationId: string
  ): Promise<number> {
    const applied = await prisma.appliedRecommendation.findUnique({
      where: { id: appliedRecommendationId },
    })

    if (!applied) {
      throw new Error(`Applied recommendation ${appliedRecommendationId} not found`)
    }

    // Check if 2 weeks have passed
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000
    const elapsed = Date.now() - applied.appliedAt.getTime()

    if (elapsed < twoWeeksMs) {
      throw new Error(
        `Evaluation requires 2 weeks. Only ${Math.floor(elapsed / (24 * 60 * 60 * 1000))} days have passed.`
      )
    }

    // Capture current metrics
    const currentMetrics = await this.captureBaselineMetrics(applied.userId)

    // Calculate effectiveness (improvement percentage)
    const baseline = applied.baselineMetrics as any
    const current = currentMetrics as any

    const improvements = []
    if (baseline.behavioralScore && current.behavioralScore) {
      const improvement =
        (current.behavioralScore - baseline.behavioralScore) /
        baseline.behavioralScore
      improvements.push(improvement)
    }

    if (baseline.avgConfidence && current.avgConfidence) {
      const improvement =
        (current.avgConfidence - baseline.avgConfidence) / baseline.avgConfidence
      improvements.push(improvement)
    }

    const effectiveness =
      improvements.length > 0
        ? improvements.reduce((sum, val) => sum + val, 0) / improvements.length
        : 0

    // Clamp to 0.0-1.0 range
    const clampedEffectiveness = Math.max(0, Math.min(1, effectiveness))

    // Update record
    await prisma.appliedRecommendation.update({
      where: { id: appliedRecommendationId },
      data: {
        currentMetrics,
        effectiveness: clampedEffectiveness,
        evaluatedAt: new Date(),
      },
    })

    return clampedEffectiveness
  }

  // ==================== Private Helper Methods ====================

  /**
   * Create recommendation from behavioral pattern
   */
  private static createRecommendationFromPattern(
    userId: string,
    pattern: BehavioralPattern
  ): Omit<
    Recommendation,
    'id' | 'createdAt' | 'appliedAt' | 'dismissedAt'
  > | null {
    const template = RECOMMENDATION_TEMPLATES[pattern.patternType]
    if (!template) return null

    const evidence = pattern.evidence as any
    const placeholders = this.extractPlaceholders(pattern, evidence)

    return {
      userId,
      recommendationType: template.type,
      title: this.fillTemplate(template.titleTemplate, placeholders),
      description: this.fillTemplate(template.descriptionTemplate, placeholders),
      actionableText: this.fillTemplate(template.actionableTemplate, placeholders),
      confidence: pattern.confidence,
      estimatedImpact: template.estimatedImpactBase * pattern.confidence,
      easeOfImplementation: template.easeOfImplementationBase,
      userReadiness: this.calculateUserReadiness(pattern),
      priorityScore: 0, // Calculated in prioritization
      sourcePatternIds: [pattern.id],
      sourceInsightIds: [],
    }
  }

  /**
   * Create recommendation from behavioral insight
   */
  private static createRecommendationFromInsight(
    userId: string,
    insight: BehavioralInsight
  ): Omit<
    Recommendation,
    'id' | 'createdAt' | 'appliedAt' | 'dismissedAt'
  > | null {
    // Map insight type to recommendation type
    const typeMap: Record<string, RecommendationType> = {
      STUDY_TIME_OPTIMIZATION: 'STUDY_TIME_OPTIMIZATION',
      SESSION_LENGTH_ADJUSTMENT: 'SESSION_DURATION_ADJUSTMENT',
      CONTENT_PREFERENCE: 'CONTENT_TYPE_BALANCE',
      RETENTION_STRATEGY: 'RETENTION_STRATEGY',
    }

    const recommendationType = typeMap[insight.insightType]
    if (!recommendationType) return null

    return {
      userId,
      recommendationType,
      title: insight.title,
      description: insight.description,
      actionableText: insight.actionableRecommendation,
      confidence: insight.confidence,
      estimatedImpact: 0.75 * insight.confidence, // Conservative estimate
      easeOfImplementation: 0.7,
      userReadiness: 0.8, // Insights are already personalized
      priorityScore: 0,
      sourcePatternIds: [],
      sourceInsightIds: [insight.id],
    }
  }

  /**
   * Create recommendation from intervention (Story 5.2 integration)
   */
  private static createRecommendationFromIntervention(
    userId: string,
    intervention: InterventionRecommendation
  ): Omit<
    Recommendation,
    'id' | 'createdAt' | 'appliedAt' | 'dismissedAt'
  > | null {
    // Map intervention type to recommendation type
    const typeMap: Record<string, RecommendationType> = {
      PREREQUISITE_REVIEW: 'RETENTION_STRATEGY',
      DIFFICULTY_PROGRESSION: 'EXPERIMENTAL_SUGGESTION',
      CONTENT_FORMAT_ADAPT: 'CONTENT_TYPE_BALANCE',
      COGNITIVE_LOAD_REDUCE: 'SESSION_DURATION_ADJUSTMENT',
      SPACED_REPETITION_BOOST: 'RETENTION_STRATEGY',
      BREAK_SCHEDULE_ADJUST: 'SESSION_DURATION_ADJUSTMENT',
    }

    const recommendationType = typeMap[intervention.interventionType]
    if (!recommendationType) return null

    const confidence = intervention.priority / 10 // Convert priority 1-10 to 0.1-1.0

    return {
      userId,
      recommendationType,
      title: `Intervention: ${intervention.interventionType.replace(/_/g, ' ').toLowerCase()}`,
      description: intervention.description,
      actionableText: intervention.reasoning,
      confidence,
      estimatedImpact: 0.8, // Interventions are high-impact
      easeOfImplementation: 0.6,
      userReadiness: 0.7,
      priorityScore: 0,
      sourcePatternIds: [],
      sourceInsightIds: [],
    }
  }

  /**
   * Extract placeholders from pattern evidence
   */
  private static extractPlaceholders(
    pattern: BehavioralPattern,
    evidence: any
  ): Record<string, string> {
    const placeholders: Record<string, string> = {}

    switch (pattern.patternType) {
      case 'OPTIMAL_STUDY_TIME':
        placeholders.hourRange = `${evidence.hourOfDay}:00-${evidence.hourOfDay + 1}:00`
        placeholders.performanceIncrease = Math.round(
          ((evidence.timeOfDayScore - 70) / 70) * 100
        ).toString()
        placeholders.sessionCount = evidence.sessionCount?.toString() || '0'
        break

      case 'SESSION_DURATION_PREFERENCE':
        placeholders.duration = evidence.recommendedDuration?.toString() || '45'
        placeholders.completionRate = '85' // Placeholder
        break

      case 'CONTENT_TYPE_PREFERENCE':
        placeholders.contentType = evidence.topContentType || 'flashcards'
        placeholders.targetPercentage = Math.round(
          (evidence.effectiveness || 0.5) * 100
        ).toString()
        placeholders.effectiveness = Math.round(
          (evidence.effectiveness || 0.5) * 100
        ).toString()
        break

      case 'FORGETTING_CURVE':
        const halfLife = evidence.halfLife || 5
        placeholders.halfLife = halfLife.toString()
        placeholders.reviewDays = Math.round(halfLife * 0.7).toString()
        placeholders.deviationPercent = '15' // Placeholder
        placeholders.fasterSlower = evidence.k > 0.14 ? 'faster' : 'slower'
        break
    }

    return placeholders
  }

  /**
   * Fill template with placeholders
   */
  private static fillTemplate(
    template: string,
    placeholders: Record<string, string>
  ): string {
    let filled = template
    for (const [key, value] of Object.entries(placeholders)) {
      filled = filled.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    return filled
  }

  /**
   * Calculate user readiness (how likely user is to adopt this recommendation)
   */
  private static calculateUserReadiness(pattern: BehavioralPattern): number {
    // Higher confidence = higher readiness
    // More occurrences = higher readiness
    const confidenceFactor = pattern.confidence
    const occurrenceFactor = Math.min(1.0, pattern.occurrenceCount / 5)
    return (confidenceFactor + occurrenceFactor) / 2
  }

  /**
   * Capture baseline behavioral metrics
   */
  private static async captureBaselineMetrics(userId: string) {
    const [patterns, profile, recentSessions] = await Promise.all([
      prisma.behavioralPattern.findMany({
        where: { userId },
        select: { confidence: true },
      }),
      prisma.userLearningProfile.findUnique({
        where: { userId },
      }),
      prisma.studySession.findMany({
        where: {
          userId,
          startedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ])

    const avgConfidence =
      patterns.length > 0
        ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
        : 0

    const behavioralScore = profile?.dataQualityScore || 0

    return {
      avgConfidence,
      behavioralScore,
      sessionCount: recentSessions.length,
      capturedAt: new Date().toISOString(),
    }
  }
}
