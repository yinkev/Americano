/**
 * Behavioral Pattern Engine
 * Story 5.1 Task 6
 *
 * Orchestrates behavioral pattern analysis by coordinating all analyzer modules
 * to detect learning patterns, generate insights, and maintain user learning profiles.
 *
 * @subsystem Behavioral Analytics and Personalization
 * @location apps/web/src/subsystems/behavioral-analytics/behavioral-pattern-engine.ts
 */

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import type {
  BehavioralPattern,
  BehavioralInsight,
  UserLearningProfile,
  BehavioralPatternType,
  InsightType,
} from '@/generated/prisma'
import type {
  BehavioralPatternData,
  LearningStyleProfile,
  ContentPreferences,
  PersonalizedForgettingCurve,
  PreferredStudyTime,
} from '@/types/prisma-json'
import { StudyTimeAnalyzer } from './study-time-analyzer'
import { SessionDurationAnalyzer } from './session-duration-analyzer'
import { ContentPreferenceAnalyzer } from './content-preference-analyzer'
import { ForgettingCurveAnalyzer } from './forgetting-curve-analyzer'

/**
 * Data sufficiency requirements for pattern analysis
 */
interface DataRequirements {
  weeksNeeded: number
  sessionsNeeded: number
  reviewsNeeded: number
}

/**
 * Complete analysis results including patterns, insights, and profile
 */
export interface AnalysisResults {
  patterns: BehavioralPattern[]
  insights: BehavioralInsight[]
  profile: UserLearningProfile
  insufficientData?: boolean
  requirements?: DataRequirements
}

/**
 * Results from updating existing patterns
 */
export interface UpdateResults {
  updated: number
  deprecated: number
  deleted: number
  newPatterns: number
}

/**
 * Minimum data requirements (from story context lines 579-587)
 */
const MIN_WEEKS = 6
const MIN_SESSIONS = 20
const MIN_REVIEWS = 50

/**
 * Confidence thresholds (from story context lines 596-600)
 */
const PATTERN_SAVE_THRESHOLD = 0.6
const INSIGHT_DISPLAY_THRESHOLD = 0.7

/**
 * Pattern evolution constants (from story context lines 916-921)
 */
const CONFIDENCE_INCREMENT = 0.05
const MAX_CONFIDENCE = 0.95
const CONFIDENCE_DECREMENT = 0.1
const MIN_CONFIDENCE = 0.4
const MAX_CONSECUTIVE_NON_OCCURRENCES = 3

/**
 * BehavioralPatternEngine
 *
 * Orchestrates the full behavioral analysis pipeline:
 * 1. Data sufficiency validation
 * 2. Parallel execution of specialized analyzers
 * 3. Pattern aggregation and persistence
 * 4. Insight generation from high-confidence patterns
 * 5. User learning profile updates
 */
export class BehavioralPatternEngine {
  /**
   * Run full behavioral pattern analysis for a user
   *
   * Orchestration (from story context lines 856-869):
   * 1. Check data sufficiency (6 weeks, 20+ sessions, 50+ reviews)
   * 2. IF insufficient: return {insufficientData: true, requirements: {...}}
   * 3. Run all analyzers in parallel
   * 4. Aggregate results into BehavioralPattern records
   * 5. Save patterns with confidence >= 0.6
   * 6. Generate insights via generateInsights()
   * 7. Update UserLearningProfile
   * 8. Return {patterns[], insights[], profile}
   *
   * @param userId - User ID to analyze
   * @returns Complete analysis results or insufficientData response
   */
  static async runFullAnalysis(userId: string): Promise<AnalysisResults> {
    // Step 1: Check data sufficiency
    const sufficiencyCheck = await this.checkDataSufficiency(userId)

    if (!sufficiencyCheck.sufficient) {
      return {
        patterns: [],
        insights: [],
        profile: await this.getOrCreateProfile(userId),
        insufficientData: true,
        requirements: sufficiencyCheck.requirements,
      }
    }

    // Step 3: Run all analyzers in parallel
    const [studyTimePatterns, durationPattern, contentPrefs, learningStyle, forgettingCurve] =
      await Promise.all([
        StudyTimeAnalyzer.analyzeOptimalStudyTimes(userId),
        new SessionDurationAnalyzer().analyzeSessionDurationPatterns(userId),
        new ContentPreferenceAnalyzer().analyzeContentPreferences(userId),
        new ContentPreferenceAnalyzer().identifyLearningStyle(userId),
        ForgettingCurveAnalyzer.calculatePersonalizedForgettingCurve(userId),
      ])

    // Step 4: Aggregate results into BehavioralPattern records
    const patterns = await this.aggregatePatternsFromAnalysis(userId, {
      studyTimePatterns,
      durationPattern,
      contentPrefs,
      learningStyle,
      forgettingCurve,
    })

    // Step 5: Save patterns with confidence >= 0.6
    const savedPatterns = await this.savePatternsWithEvolution(userId, patterns)

    // Step 6: Generate insights
    const insights = await this.generateInsights(userId)

    // Step 7: Update UserLearningProfile
    const profile = await this.updateUserLearningProfile(userId, {
      studyTimePatterns,
      durationPattern,
      contentPrefs,
      learningStyle,
      forgettingCurve,
    })

    // Step 8: Return results
    return {
      patterns: savedPatterns,
      insights,
      profile,
    }
  }

  /**
   * Detect new patterns since last analysis (incremental detection)
   *
   * @param userId - User ID to analyze
   * @returns Array of newly detected behavioral patterns
   */
  static async detectNewPatterns(userId: string): Promise<BehavioralPattern[]> {
    const profile = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })

    if (!profile?.lastAnalyzedAt) {
      // No previous analysis, run full analysis
      const results = await this.runFullAnalysis(userId)
      return results.patterns
    }

    // Query sessions since last analysis
    const recentSessionCount = await prisma.studySession.count({
      where: {
        userId,
        startedAt: { gte: profile.lastAnalyzedAt },
      },
    })

    // Need at least 10 new sessions for incremental analysis
    if (recentSessionCount < 10) {
      return []
    }

    // Run analyzers and compare with existing patterns
    const results = await this.runFullAnalysis(userId)
    const existingPatternTypes = await prisma.behavioralPattern.findMany({
      where: { userId },
      select: { patternType: true, patternName: true },
    })

    const existingSet = new Set(
      existingPatternTypes.map((p) => `${p.patternType}-${p.patternName}`),
    )

    return results.patterns.filter((p) => !existingSet.has(`${p.patternType}-${p.patternName}`))
  }

  /**
   * Update existing patterns with evolution tracking
   *
   * Algorithm (from story context lines 879-887):
   * 1. Compare new analysis results with existing BehavioralPattern records
   * 2. IF pattern reoccurs: increment occurrenceCount, update lastSeenAt
   * 3. Increase confidence score (max 0.95) with repeated occurrences
   * 4. Deprecate patterns not seen in 3 consecutive analyses
   *
   * @param userId - User ID to analyze
   * @returns Update results summary
   */
  static async updateExistingPatterns(userId: string): Promise<UpdateResults> {
    const results = await this.runFullAnalysis(userId)

    if (results.insufficientData) {
      return {
        updated: 0,
        deprecated: 0,
        deleted: 0,
        newPatterns: 0,
      }
    }

    const existingPatterns = await prisma.behavioralPattern.findMany({
      where: { userId },
    })

    let updated = 0
    let deprecated = 0
    let deleted = 0
    let newPatterns = 0

    // Track which existing patterns were seen in new analysis
    const seenPatternIds = new Set<string>()

    for (const newPattern of results.patterns) {
      const existing = existingPatterns.find(
        (p) => p.patternType === newPattern.patternType && p.patternName === newPattern.patternName,
      )

      if (existing) {
        // Pattern reoccurs - update it
        seenPatternIds.add(existing.id)

        const newConfidence = Math.min(MAX_CONFIDENCE, existing.confidence + CONFIDENCE_INCREMENT)

        await prisma.behavioralPattern.update({
          where: { id: existing.id },
          data: {
            occurrenceCount: existing.occurrenceCount + 1,
            lastSeenAt: new Date(),
            confidence: newConfidence,
            evidence: newPattern.evidence,
          },
        })
        updated++
      } else {
        // New pattern - it was already saved in runFullAnalysis
        newPatterns++
      }
    }

    // Handle patterns not seen in this analysis
    for (const existing of existingPatterns) {
      if (!seenPatternIds.has(existing.id)) {
        const evidenceArray = existing.evidence as string[]
        const evidenceData = existing.patternData as BehavioralPatternData & { consecutiveNonOccurrences?: number }
        const consecutiveNonOccurrences = (evidenceData?.consecutiveNonOccurrences || 0) + 1

        if (consecutiveNonOccurrences >= MAX_CONSECUTIVE_NON_OCCURRENCES) {
          // Delete pattern
          await prisma.behavioralPattern.delete({
            where: { id: existing.id },
          })
          deleted++
        } else {
          // Decrease confidence
          const newConfidence = Math.max(0, existing.confidence - CONFIDENCE_DECREMENT)

          if (newConfidence < MIN_CONFIDENCE) {
            await prisma.behavioralPattern.delete({
              where: { id: existing.id },
            })
            deleted++
          } else {
            await prisma.behavioralPattern.update({
              where: { id: existing.id },
              data: {
                confidence: newConfidence,
                patternData: {
                  ...evidenceData,
                  consecutiveNonOccurrences,
                } as Prisma.JsonValue,
              },
            })
            deprecated++
          }
        }
      }
    }

    return {
      updated,
      deprecated,
      deleted,
      newPatterns,
    }
  }

  /**
   * Generate actionable insights from high-confidence patterns
   *
   * Algorithm (from story context lines 888-914):
   * 1. Query BehavioralPattern WHERE confidence >= 0.7
   * 2. Transform patterns into actionable insights using templates
   * 3. Prioritize by impact (high-confidence patterns affecting performance)
   * 4. Limit to top 5 insights
   * 5. Create BehavioralInsight records with supportingPatternIds
   * 6. Return insights[]
   *
   * @param userId - User ID to generate insights for
   * @returns Array of behavioral insights (top 5 by impact)
   */
  static async generateInsights(userId: string): Promise<BehavioralInsight[]> {
    // Step 1: Query high-confidence patterns
    const patterns = await prisma.behavioralPattern.findMany({
      where: {
        userId,
        confidence: { gte: INSIGHT_DISPLAY_THRESHOLD },
      },
      orderBy: {
        confidence: 'desc',
      },
    })

    if (patterns.length === 0) {
      return []
    }

    // Step 2: Transform patterns into insights using templates
    const insights: Array<{
      insightType: InsightType
      title: string
      description: string
      actionableRecommendation: string
      confidence: number
      supportingPatternIds: string[]
      impact: number
    }> = []

    for (const pattern of patterns) {
      const insight = this.createInsightFromPattern(pattern)
      if (insight) {
        insights.push(insight)
      }
    }

    // Step 3: Prioritize by impact (confidence * pattern type weight)
    insights.sort((a, b) => b.impact - a.impact)

    // Step 4: Limit to top 5 insights
    const topInsights = insights.slice(0, 5)

    // Step 5: Create BehavioralInsight records
    const savedInsights: BehavioralInsight[] = []

    for (const insight of topInsights) {
      // Check if insight already exists (avoid duplicates)
      const existing = await prisma.behavioralInsight.findFirst({
        where: {
          userId,
          insightType: insight.insightType,
          title: insight.title,
          acknowledgedAt: null,
        },
      })

      if (existing) {
        savedInsights.push(existing)
        continue
      }

      const savedInsight = await prisma.behavioralInsight.create({
        data: {
          userId,
          insightType: insight.insightType,
          title: insight.title,
          description: insight.description,
          actionableRecommendation: insight.actionableRecommendation,
          confidence: insight.confidence,
        },
      })

      // Create InsightPattern join records
      for (const patternId of insight.supportingPatternIds) {
        await prisma.insightPattern.create({
          data: {
            insightId: savedInsight.id,
            patternId,
          },
        })
      }

      savedInsights.push(savedInsight)
    }

    return savedInsights
  }

  // ==================== Private Helper Methods ====================

  /**
   * Check if user has sufficient data for pattern analysis
   */
  private static async checkDataSufficiency(userId: string): Promise<{
    sufficient: boolean
    requirements: DataRequirements
  }> {
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - MIN_WEEKS * 7)

    const [sessionCount, reviewCount, oldestSession] = await Promise.all([
      prisma.studySession.count({
        where: {
          userId,
          completedAt: { not: null },
        },
      }),
      prisma.review.count({
        where: { userId },
      }),
      prisma.studySession.findFirst({
        where: { userId },
        orderBy: { startedAt: 'asc' },
        select: { startedAt: true },
      }),
    ])

    const weeksOfData = oldestSession
      ? Math.floor((Date.now() - oldestSession.startedAt.getTime()) / (1000 * 60 * 60 * 24 * 7))
      : 0

    const sufficient =
      weeksOfData >= MIN_WEEKS && sessionCount >= MIN_SESSIONS && reviewCount >= MIN_REVIEWS

    return {
      sufficient,
      requirements: {
        weeksNeeded: Math.max(0, MIN_WEEKS - weeksOfData),
        sessionsNeeded: Math.max(0, MIN_SESSIONS - sessionCount),
        reviewsNeeded: Math.max(0, MIN_REVIEWS - reviewCount),
      },
    }
  }

  /**
   * Aggregate analyzer results into BehavioralPattern records
   */
  private static async aggregatePatternsFromAnalysis(
    userId: string,
    analysis: {
      studyTimePatterns: Awaited<ReturnType<typeof StudyTimeAnalyzer.analyzeOptimalStudyTimes>>
      durationPattern: Awaited<
        ReturnType<SessionDurationAnalyzer['analyzeSessionDurationPatterns']>
      >
      contentPrefs: Awaited<ReturnType<ContentPreferenceAnalyzer['analyzeContentPreferences']>>
      learningStyle: Awaited<ReturnType<ContentPreferenceAnalyzer['identifyLearningStyle']>>
      forgettingCurve: Awaited<
        ReturnType<typeof ForgettingCurveAnalyzer.calculatePersonalizedForgettingCurve>
      >
    },
  ): Promise<Array<Omit<BehavioralPattern, 'id' | 'detectedAt' | 'lastSeenAt'>>> {
    const patterns: Array<Omit<BehavioralPattern, 'id' | 'detectedAt' | 'lastSeenAt'>> = []

    // Study time patterns
    for (const timePattern of analysis.studyTimePatterns) {
      patterns.push({
        userId,
        patternType: 'OPTIMAL_STUDY_TIME' as BehavioralPatternType,
        patternName: `Optimal study time: ${timePattern.hourOfDay}:00`,
        confidence: timePattern.confidence,
        patternData: {
          hourOfDay: timePattern.hourOfDay,
          sessionCount: timePattern.sessionCount,
          avgPerformanceScore: timePattern.avgPerformanceScore,
          avgRetention: timePattern.avgRetention,
          completionRate: timePattern.completionRate,
          timeOfDayScore: timePattern.timeOfDayScore,
        } as Prisma.JsonValue,
        evidence: [
          `${timePattern.sessionCount} sessions analyzed`,
          `Performance score: ${Math.round(timePattern.avgPerformanceScore * 100)}%`,
          `Retention rate: ${Math.round(timePattern.avgRetention * 100)}%`,
        ],
        occurrenceCount: 1,
        firstDetectedAt: new Date(),
      })
    }

    // Session duration pattern
    if (analysis.durationPattern.confidence >= PATTERN_SAVE_THRESHOLD) {
      patterns.push({
        userId,
        patternType: 'SESSION_DURATION_PREFERENCE' as BehavioralPatternType,
        patternName: `Optimal session duration: ${analysis.durationPattern.recommendedDuration} minutes`,
        confidence: analysis.durationPattern.confidence,
        patternData: {
          recommendedDuration: analysis.durationPattern.recommendedDuration,
          optimalBucket: analysis.durationPattern.optimalBucket,
          totalSessionsAnalyzed: analysis.durationPattern.totalSessionsAnalyzed,
        } as Prisma.JsonValue,
        evidence: [
          `${analysis.durationPattern.totalSessionsAnalyzed} sessions analyzed`,
          `Optimal range: ${analysis.durationPattern.optimalBucket}`,
        ],
        occurrenceCount: 1,
        firstDetectedAt: new Date(),
      })
    }

    // Content type preferences
    const topContentType = Object.entries(analysis.contentPrefs).sort(([, a], [, b]) => b - a)[0]
    if (topContentType && topContentType[1] > 0.3) {
      patterns.push({
        userId,
        patternType: 'CONTENT_TYPE_PREFERENCE' as BehavioralPatternType,
        patternName: `Prefers ${topContentType[0]} content`,
        confidence: Math.min(1.0, topContentType[1] * 1.5),
        patternData: {
          contentPreferences: analysis.contentPrefs,
          topContentType: topContentType[0],
          effectiveness: topContentType[1],
        } as Prisma.JsonValue,
        evidence: [
          `Top content type: ${topContentType[0]}`,
          `Effectiveness: ${Math.round(topContentType[1] * 100)}%`,
        ],
        occurrenceCount: 1,
        firstDetectedAt: new Date(),
      })
    }

    // Forgetting curve pattern
    if (analysis.forgettingCurve.confidence >= PATTERN_SAVE_THRESHOLD) {
      patterns.push({
        userId,
        patternType: 'FORGETTING_CURVE' as BehavioralPatternType,
        patternName: `Personal forgetting curve: ${analysis.forgettingCurve.deviation}`,
        confidence: analysis.forgettingCurve.confidence,
        patternData: {
          R0: analysis.forgettingCurve.R0,
          k: analysis.forgettingCurve.k,
          halfLife: analysis.forgettingCurve.halfLife,
          deviation: analysis.forgettingCurve.deviation,
        } as Prisma.JsonValue,
        evidence: [
          `Half-life: ${Math.round(analysis.forgettingCurve.halfLife)} days`,
          `Deviation: ${analysis.forgettingCurve.deviation}`,
          `Decay rate (k): ${analysis.forgettingCurve.k.toFixed(3)}`,
        ],
        occurrenceCount: 1,
        firstDetectedAt: new Date(),
      })
    }

    return patterns
  }

  /**
   * Save patterns with evolution tracking
   */
  private static async savePatternsWithEvolution(
    userId: string,
    patterns: Array<Omit<BehavioralPattern, 'id' | 'detectedAt' | 'lastSeenAt'>>,
  ): Promise<BehavioralPattern[]> {
    const savedPatterns: BehavioralPattern[] = []

    for (const pattern of patterns) {
      if (pattern.confidence < PATTERN_SAVE_THRESHOLD) {
        continue
      }

      // Check if pattern already exists
      const existing = await prisma.behavioralPattern.findFirst({
        where: {
          userId,
          patternType: pattern.patternType,
          patternName: pattern.patternName,
        },
      })

      if (existing) {
        // Update existing pattern
        const updated = await prisma.behavioralPattern.update({
          where: { id: existing.id },
          data: {
            occurrenceCount: existing.occurrenceCount + 1,
            lastSeenAt: new Date(),
            confidence: Math.min(MAX_CONFIDENCE, existing.confidence + CONFIDENCE_INCREMENT),
            evidence: pattern.evidence,
          },
        })
        savedPatterns.push(updated)
      } else {
        // Create new pattern
        const created = await prisma.behavioralPattern.create({
          data: {
            userId: pattern.userId,
            patternType: pattern.patternType,
            patternData: pattern.patternData,
            patternName: pattern.patternName,
            confidence: pattern.confidence,
            evidence: pattern.evidence,
            occurrenceCount: pattern.occurrenceCount,
            firstDetectedAt: pattern.firstDetectedAt,
            detectedAt: new Date(),
            lastSeenAt: new Date(),
          },
        })
        savedPatterns.push(created)
      }
    }

    return savedPatterns
  }

  /**
   * Update or create user learning profile
   */
  private static async updateUserLearningProfile(
    userId: string,
    analysis: {
      studyTimePatterns: Awaited<ReturnType<typeof StudyTimeAnalyzer.analyzeOptimalStudyTimes>>
      durationPattern: Awaited<
        ReturnType<SessionDurationAnalyzer['analyzeSessionDurationPatterns']>
      >
      contentPrefs: Awaited<ReturnType<ContentPreferenceAnalyzer['analyzeContentPreferences']>>
      learningStyle: Awaited<ReturnType<ContentPreferenceAnalyzer['identifyLearningStyle']>>
      forgettingCurve: Awaited<
        ReturnType<typeof ForgettingCurveAnalyzer.calculatePersonalizedForgettingCurve>
      >
    },
  ): Promise<UserLearningProfile> {
    // Convert study time patterns to preferred study times
    const preferredStudyTimes: PreferredStudyTime[] = analysis.studyTimePatterns.map((p) => ({
      dayOfWeek: -1, // All days (not day-specific yet)
      startHour: p.hourOfDay,
      endHour: p.hourOfDay + 1,
      effectiveness: p.confidence,
    }))

    // Calculate data quality score
    const dataQualityScore = Math.min(
      1.0,
      (analysis.durationPattern.confidence +
        analysis.forgettingCurve.confidence +
        (analysis.studyTimePatterns[0]?.confidence || 0)) /
        3,
    )

    const profileData = {
      userId,
      preferredStudyTimes,
      averageSessionDuration: Math.round(
        analysis.durationPattern.totalSessionsAnalyzed > 0
          ? analysis.durationPattern.allBuckets.reduce(
              (sum, b) => sum + ((b.minMinutes + b.maxMinutes) / 2) * b.sessionCount,
              0,
            ) / analysis.durationPattern.totalSessionsAnalyzed
          : 45,
      ),
      optimalSessionDuration: analysis.durationPattern.recommendedDuration,
      contentPreferences: analysis.contentPrefs as Prisma.JsonValue,
      learningStyleProfile: analysis.learningStyle as Prisma.JsonValue,
      personalizedForgettingCurve: {
        initialRetention: analysis.forgettingCurve.R0,
        decayRate: analysis.forgettingCurve.k,
        stabilityFactor: analysis.forgettingCurve.halfLife,
      } as Prisma.JsonValue,
      lastAnalyzedAt: new Date(),
      dataQualityScore,
    }

    return await prisma.userLearningProfile.upsert({
      where: { userId },
      update: {
        ...profileData,
        preferredStudyTimes: profileData.preferredStudyTimes as Prisma.JsonValue,
      },
      create: {
        ...profileData,
        preferredStudyTimes: profileData.preferredStudyTimes as Prisma.JsonValue,
      },
    })
  }

  /**
   * Get or create user learning profile
   */
  private static async getOrCreateProfile(userId: string): Promise<UserLearningProfile> {
    const existing = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })

    if (existing) {
      return existing
    }

    const defaultContentPrefs: ContentPreferences = {
      preferredTypes: ['lectures', 'flashcards', 'validation', 'clinicalReasoning'],
      difficultyPreference: 'balanced',
      interactivityLevel: 'medium',
    }

    const defaultLearningStyle: LearningStyleProfile = {
      visual: 0.25,
      auditory: 0.25,
      kinesthetic: 0.25,
      reading: 0.25,
    }

    const defaultForgettingCurve: PersonalizedForgettingCurve = {
      initialRetention: 1.0,
      decayRate: 0.14,
      stabilityFactor: 5,
    }

    return await prisma.userLearningProfile.create({
      data: {
        userId,
        preferredStudyTimes: [],
        averageSessionDuration: 45,
        optimalSessionDuration: 45,
        contentPreferences: defaultContentPrefs as Prisma.JsonValue,
        learningStyleProfile: defaultLearningStyle as Prisma.JsonValue,
        personalizedForgettingCurve: defaultForgettingCurve as Prisma.JsonValue,
        lastAnalyzedAt: new Date(),
        dataQualityScore: 0,
      },
    })
  }

  /**
   * Create insight from pattern using templates (from story context lines 900-913)
   */
  private static createInsightFromPattern(pattern: BehavioralPattern): {
    insightType: InsightType
    title: string
    description: string
    actionableRecommendation: string
    confidence: number
    supportingPatternIds: string[]
    impact: number
  } | null {
    const evidenceArray = pattern.evidence as string[]
    const patternData = pattern.patternData as BehavioralPatternData & Record<string, unknown>

    switch (pattern.patternType) {
      case 'OPTIMAL_STUDY_TIME': {
        const timeOfDayScore = patternData.timeOfDayScore as number || 80
        const hourOfDay = patternData.hourOfDay as number || 9
        const sessionCount = patternData.sessionCount as number || 0

        return {
          insightType: 'STUDY_TIME_OPTIMIZATION' as InsightType,
          title: 'Study during your peak hours',
          description: `You perform ${Math.round(((timeOfDayScore - 70) / 70) * 100)}% better during ${hourOfDay}:00-${hourOfDay + 1}:00 based on ${sessionCount} sessions.`,
          actionableRecommendation: `Schedule high-priority missions during ${hourOfDay}:00-${hourOfDay + 1}:00 for optimal retention and performance.`,
          confidence: pattern.confidence,
          supportingPatternIds: [pattern.id],
          impact: pattern.confidence * 1.2, // High impact for study time optimization
        }
      }

      case 'SESSION_DURATION_PREFERENCE': {
        const recommendedDuration = patternData.recommendedDuration as number || 45
        const totalSessionsAnalyzed = patternData.totalSessionsAnalyzed as number || 0

        return {
          insightType: 'SESSION_LENGTH_ADJUSTMENT' as InsightType,
          title: 'Optimize your session length',
          description: `Your optimal session length is ${recommendedDuration} minutes (based on ${totalSessionsAnalyzed} sessions).`,
          actionableRecommendation: `Adjust mission duration preferences to ${recommendedDuration} minutes for better completion rates and reduced fatigue.`,
          confidence: pattern.confidence,
          supportingPatternIds: [pattern.id],
          impact: pattern.confidence * 1.0,
        }
      }

      case 'CONTENT_TYPE_PREFERENCE': {
        const topContentType = patternData.topContentType as string || 'flashcards'
        const effectiveness = patternData.effectiveness as number || 0.5

        return {
          insightType: 'CONTENT_PREFERENCE' as InsightType,
          title: 'Focus on your preferred content type',
          description: `You learn best with ${topContentType} (${Math.round(effectiveness * 100)}% effectiveness).`,
          actionableRecommendation: `Prioritize ${topContentType} content in your study sessions for improved learning outcomes.`,
          confidence: pattern.confidence,
          supportingPatternIds: [pattern.id],
          impact: pattern.confidence * 0.9,
        }
      }

      case 'FORGETTING_CURVE': {
        const halfLife = patternData.halfLife as number || 5
        const k = patternData.k as number || 0.14
        const standardHalfLife = Math.log(2) / 0.14
        const deviationPercent = Math.abs(
          ((halfLife - standardHalfLife) / standardHalfLife) * 100,
        )
        const fasterSlower = k > 0.14 ? 'faster' : 'slower'
        const recommendedDays = Math.round(halfLife * 0.7) // Review before 50% decay

        return {
          insightType: 'RETENTION_STRATEGY' as InsightType,
          title: 'Personalize your review schedule',
          description: `Your retention decays ${Math.round(deviationPercent)}% ${fasterSlower} than average (half-life: ${Math.round(halfLife)} days).`,
          actionableRecommendation: `Adjust review frequency to every ${recommendedDays} days to maintain 70%+ retention.`,
          confidence: pattern.confidence,
          supportingPatternIds: [pattern.id],
          impact: pattern.confidence * 1.1, // High impact for retention optimization
        }
      }

      default:
        return null
    }
  }
}
