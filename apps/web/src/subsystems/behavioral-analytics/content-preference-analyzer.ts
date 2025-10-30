/**
 * ContentPreferenceAnalyzer
 *
 * Analyzes user content preferences and learning style patterns based on behavioral data.
 * Implements VARK (Visual, Auditory, Reading/Writing, Kinesthetic) learning style profiling
 * and content type effectiveness detection for personalized learning recommendations.
 *
 * @subsystem Behavioral Analytics and Personalization (Story 5.1 Task 4)
 * @location apps/web/src/subsystems/behavioral-analytics/content-preference-analyzer.ts
 */

import type { BehavioralEvent, StudySession, ValidationResponse } from '@/generated/prisma'
import { prisma } from '@/lib/db'

/**
 * Content preference distribution across different content types.
 * All values are normalized scores (0-1) that sum to 1.0.
 */
export interface ContentPreferenceProfile {
  lectures: number // 0-1: Preference for lecture content
  flashcards: number // 0-1: Preference for flashcard reviews
  validation: number // 0-1: Preference for validation exercises
  clinicalReasoning: number // 0-1: Preference for clinical reasoning scenarios
}

/**
 * VARK learning style profile with normalized scores.
 * Each dimension represents a different learning modality.
 * All values sum to 1.0 for comparative analysis.
 */
export interface LearningStyleProfile {
  visual: number // 0-1: Visual learning preference (diagrams, graphs, knowledge graphs)
  auditory: number // 0-1: Auditory learning preference (verbal explanations)
  kinesthetic: number // 0-1: Kinesthetic learning preference (hands-on, clinical scenarios)
  reading: number // 0-1: Reading/Writing preference (text content, note-taking)
}

/**
 * Effectiveness scores for different content types based on user outcomes.
 * Higher scores indicate better retention and mastery outcomes.
 */
export interface ContentTypeScores {
  lectures: ContentTypeEffectiveness
  flashcards: ContentTypeEffectiveness
  validation: ContentTypeEffectiveness
  clinicalReasoning: ContentTypeEffectiveness
}

/**
 * Detailed effectiveness metrics for a specific content type.
 */
export interface ContentTypeEffectiveness {
  score: number // 0-100: Composite effectiveness score
  retentionRate: number // 0-1: Average retention from this content type
  completionRate: number // 0-1: Percentage of sessions completed
  engagementScore: number // 0-100: Average engagement level
  sampleSize: number // Number of sessions analyzed
}

/**
 * ContentPreferenceAnalyzer
 *
 * Analyzes user behavioral data to identify content preferences and learning styles.
 * Uses historical study sessions, behavioral events, and validation responses to
 * generate personalized insights about optimal content delivery methods.
 */
export class ContentPreferenceAnalyzer {
  /**
   * Analyzes user content preferences across different content types.
   *
   * Calculates engagement metrics, study time distribution, and completion rates
   * to identify which content types the user engages with most effectively.
   *
   * @param userId - The user ID to analyze
   * @returns ContentPreferenceProfile with normalized scores summing to 1.0
   *
   * @example
   * ```typescript
   * const analyzer = new ContentPreferenceAnalyzer();
   * const preferences = await analyzer.analyzeContentPreferences("user_123");
   * // { lectures: 0.4, flashcards: 0.3, validation: 0.2, clinicalReasoning: 0.1 }
   * ```
   */
  async analyzeContentPreferences(userId: string): Promise<ContentPreferenceProfile> {
    // Query all study sessions with content type data from behavioral events
    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      include: {
        reviews: true,
        validationResponses: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    })

    // Query behavioral events for content type tracking
    const behavioralEvents = await prisma.behavioralEvent.findMany({
      where: {
        userId,
        contentType: { not: null },
      },
    })

    // Initialize content type engagement metrics
    const contentMetrics = {
      lectures: { totalTime: 0, sessionCount: 0, completionRate: 0 },
      flashcards: { totalTime: 0, sessionCount: 0, completionRate: 0 },
      validation: { totalTime: 0, sessionCount: 0, completionRate: 0 },
      clinicalReasoning: { totalTime: 0, sessionCount: 0, completionRate: 0 },
    }

    // Track engagement from behavioral events
    for (const event of behavioralEvents) {
      const contentType = event.contentType as string
      const eventData = event.eventData as { durationMs?: number; completed?: boolean }

      if (contentType === 'lecture' && contentMetrics.lectures) {
        contentMetrics.lectures.sessionCount++
        if (eventData?.durationMs) {
          contentMetrics.lectures.totalTime += eventData.durationMs
        }
        if (eventData?.completed) {
          contentMetrics.lectures.completionRate++
        }
      } else if (contentType === 'flashcard' && contentMetrics.flashcards) {
        contentMetrics.flashcards.sessionCount++
        if (eventData?.durationMs) {
          contentMetrics.flashcards.totalTime += eventData.durationMs
        }
        if (eventData?.completed) {
          contentMetrics.flashcards.completionRate++
        }
      } else if (contentType === 'validation' && contentMetrics.validation) {
        contentMetrics.validation.sessionCount++
        if (eventData?.durationMs) {
          contentMetrics.validation.totalTime += eventData.durationMs
        }
        if (eventData?.completed) {
          contentMetrics.validation.completionRate++
        }
      } else if (contentType === 'clinical_reasoning' && contentMetrics.clinicalReasoning) {
        contentMetrics.clinicalReasoning.sessionCount++
        if (eventData?.durationMs) {
          contentMetrics.clinicalReasoning.totalTime += eventData.durationMs
        }
        if (eventData?.completed) {
          contentMetrics.clinicalReasoning.completionRate++
        }
      }
    }

    // Infer content types from session activities
    for (const session of sessions) {
      if (session.reviews.length > 0) {
        contentMetrics.flashcards.sessionCount++
        if (session.durationMs) {
          contentMetrics.flashcards.totalTime += session.durationMs
        }
        if (session.completedAt) {
          contentMetrics.flashcards.completionRate++
        }
      }

      if (session.validationResponses.length > 0) {
        contentMetrics.validation.sessionCount++
        if (session.durationMs) {
          contentMetrics.validation.totalTime += session.durationMs
        }
        if (session.completedAt) {
          contentMetrics.validation.completionRate++
        }
      }
    }

    // Calculate raw preference scores based on engagement
    const lectureScore =
      contentMetrics.lectures.totalTime * 0.6 + contentMetrics.lectures.sessionCount * 100 * 0.4
    const flashcardScore =
      contentMetrics.flashcards.totalTime * 0.6 + contentMetrics.flashcards.sessionCount * 100 * 0.4
    const validationScore =
      contentMetrics.validation.totalTime * 0.6 + contentMetrics.validation.sessionCount * 100 * 0.4
    const clinicalReasoningScore =
      contentMetrics.clinicalReasoning.totalTime * 0.6 +
      contentMetrics.clinicalReasoning.sessionCount * 100 * 0.4

    // Normalize to sum = 1.0
    const total = lectureScore + flashcardScore + validationScore + clinicalReasoningScore

    if (total === 0) {
      // No data available, return balanced defaults
      return {
        lectures: 0.25,
        flashcards: 0.25,
        validation: 0.25,
        clinicalReasoning: 0.25,
      }
    }

    return {
      lectures: lectureScore / total,
      flashcards: flashcardScore / total,
      validation: validationScore / total,
      clinicalReasoning: clinicalReasoningScore / total,
    }
  }

  /**
   * Identifies user learning style using VARK framework.
   *
   * VARK Algorithm (from story context lines 759-778):
   * - Visual: Knowledge graph views + diagram card engagement
   * - Auditory: "Explain to patient" prompt performance (verbal explanation proxy)
   * - Kinesthetic: Clinical reasoning scenario engagement
   * - Reading/Writing: Text content duration + note-taking activity
   *
   * @param userId - The user ID to analyze
   * @returns LearningStyleProfile with VARK scores normalized to sum = 1.0
   *
   * @example
   * ```typescript
   * const analyzer = new ContentPreferenceAnalyzer();
   * const style = await analyzer.identifyLearningStyle("user_123");
   * // { visual: 0.3, auditory: 0.2, kinesthetic: 0.4, reading: 0.1 }
   * ```
   */
  async identifyLearningStyle(userId: string): Promise<LearningStyleProfile> {
    // Visual indicators: Knowledge graph views + diagram card engagement
    const graphViewEvents = await prisma.behavioralEvent.count({
      where: {
        userId,
        eventType: 'GRAPH_VIEWED',
      },
    })

    // Get diagram card engagement from event data
    const diagramEvents = await prisma.behavioralEvent.findMany({
      where: {
        userId,
        eventType: 'CARD_REVIEWED',
      },
    })

    let diagramCardEngagement = 0
    let diagramCardCount = 0
    for (const event of diagramEvents) {
      const eventData = event.eventData as { hasDiagram?: boolean; engagementScore?: number }
      if (eventData?.hasDiagram) {
        diagramCardCount++
        diagramCardEngagement += eventData.engagementScore || 0.5
      }
    }
    const avgDiagramEngagement = diagramCardCount > 0 ? diagramCardEngagement / diagramCardCount : 0

    const visual = graphViewEvents * 0.5 + avgDiagramEngagement * 0.5

    // Auditory indicators: "Explain to patient" prompt performance (proxy for verbal explanation)
    const explainToPatientResponses = await prisma.validationResponse.findMany({
      where: {
        prompt: {
          promptType: 'EXPLAIN_TO_PATIENT',
        },
      },
      include: {
        prompt: true,
      },
    })

    const explainToPatientScores = explainToPatientResponses
      .filter((response) => response.prompt.promptType === 'EXPLAIN_TO_PATIENT')
      .map((response) => response.score)

    const auditory =
      explainToPatientScores.length > 0
        ? explainToPatientScores.reduce((sum, score) => sum + score, 0) /
          explainToPatientScores.length
        : 0

    // Kinesthetic indicators: Clinical reasoning scenario engagement
    const clinicalReasoningSessions = await prisma.behavioralEvent.findMany({
      where: {
        userId,
        contentType: 'clinical_reasoning',
      },
    })

    let clinicalEngagementSum = 0
    for (const event of clinicalReasoningSessions) {
      const eventData = event.eventData as { engagementScore?: number }
      clinicalEngagementSum += eventData?.engagementScore || 0.5
    }

    const kinesthetic =
      clinicalReasoningSessions.length > 0
        ? clinicalEngagementSum / clinicalReasoningSessions.length
        : 0

    // Reading/Writing indicators: Text content duration + note-taking activity
    const textContentSessions = await prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      select: {
        durationMs: true,
        sessionNotes: true,
      },
    })

    // Calculate text content duration (assume lecture content is text-based)
    const lectureEvents = await prisma.behavioralEvent.findMany({
      where: {
        userId,
        contentType: 'lecture',
      },
    })

    let textContentDuration = 0
    for (const event of lectureEvents) {
      const eventData = event.eventData as { durationMs?: number }
      if (eventData?.durationMs) {
        textContentDuration += eventData.durationMs
      }
    }

    // Note-taking activity count
    const noteTakingActivity = textContentSessions.filter(
      (session) => session.sessionNotes && session.sessionNotes.length > 10,
    ).length

    // Normalize text duration to 0-1 scale (assume max 10 hours = 36000000ms)
    const normalizedTextDuration = Math.min(textContentDuration / 36000000, 1.0)

    // Normalize note-taking (assume max 50 sessions with notes)
    const normalizedNoteTaking = Math.min(noteTakingActivity / 50, 1.0)

    const reading = normalizedTextDuration * 0.6 + normalizedNoteTaking * 0.4

    // Normalize to sum = 1.0
    const total = visual + auditory + kinesthetic + reading

    if (total === 0) {
      // No data available, return balanced defaults
      return {
        visual: 0.25,
        auditory: 0.25,
        kinesthetic: 0.25,
        reading: 0.25,
      }
    }

    return {
      visual: visual / total,
      auditory: auditory / total,
      kinesthetic: kinesthetic / total,
      reading: reading / total,
    }
  }

  /**
   * Detects content type effectiveness for the user.
   *
   * Identifies which content types yield the best retention and mastery outcomes
   * by analyzing performance metrics, completion rates, and engagement levels.
   *
   * @param userId - The user ID to analyze
   * @returns ContentTypeScores with effectiveness metrics for each content type
   *
   * @example
   * ```typescript
   * const analyzer = new ContentPreferenceAnalyzer();
   * const effectiveness = await analyzer.detectContentTypeEffectiveness("user_123");
   * // Returns detailed effectiveness scores for each content type
   * ```
   */
  async detectContentTypeEffectiveness(userId: string): Promise<ContentTypeScores> {
    // Query sessions with performance data
    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      include: {
        reviews: true,
        validationResponses: true,
      },
    })

    // Query behavioral events for content-specific metrics
    const behavioralEvents = await prisma.behavioralEvent.findMany({
      where: {
        userId,
        contentType: { not: null },
        sessionPerformanceScore: { not: null },
      },
    })

    // Initialize effectiveness metrics
    const effectiveness = {
      lectures: this.initializeEffectiveness(),
      flashcards: this.initializeEffectiveness(),
      validation: this.initializeEffectiveness(),
      clinicalReasoning: this.initializeEffectiveness(),
    }

    // Analyze behavioral events by content type
    for (const event of behavioralEvents) {
      const contentType = event.contentType as string
      const performanceScore = event.sessionPerformanceScore || 0
      const eventData = event.eventData as { completed?: boolean; retention?: number }

      if (contentType === 'lecture') {
        this.updateEffectiveness(effectiveness.lectures, performanceScore, eventData)
      } else if (contentType === 'flashcard') {
        this.updateEffectiveness(effectiveness.flashcards, performanceScore, eventData)
      } else if (contentType === 'validation') {
        this.updateEffectiveness(effectiveness.validation, performanceScore, eventData)
      } else if (contentType === 'clinical_reasoning') {
        this.updateEffectiveness(effectiveness.clinicalReasoning, performanceScore, eventData)
      }
    }

    // Analyze flashcard effectiveness from review data
    for (const session of sessions) {
      if (session.reviews.length > 0) {
        const correctReviews = session.reviews.filter(
          (r) => r.rating === 'GOOD' || r.rating === 'EASY',
        ).length
        const totalReviews = session.reviews.length
        const retentionRate = totalReviews > 0 ? correctReviews / totalReviews : 0

        effectiveness.flashcards.sampleSize++
        effectiveness.flashcards.retentionRate += retentionRate
        if (session.completedAt) {
          effectiveness.flashcards.completionRate += 1
        }
      }

      // Analyze validation effectiveness
      if (session.validationResponses.length > 0) {
        const avgScore =
          session.validationResponses.reduce((sum, v) => sum + v.score, 0) /
          session.validationResponses.length

        effectiveness.validation.sampleSize++
        effectiveness.validation.retentionRate += avgScore
        if (session.completedAt) {
          effectiveness.validation.completionRate += 1
        }
      }
    }

    // Calculate final scores
    return {
      lectures: this.finalizeEffectiveness(effectiveness.lectures),
      flashcards: this.finalizeEffectiveness(effectiveness.flashcards),
      validation: this.finalizeEffectiveness(effectiveness.validation),
      clinicalReasoning: this.finalizeEffectiveness(effectiveness.clinicalReasoning),
    }
  }

  /**
   * Initializes effectiveness metrics for a content type.
   * @private
   */
  private initializeEffectiveness(): {
    score: number
    retentionRate: number
    completionRate: number
    engagementScore: number
    sampleSize: number
  } {
    return {
      score: 0,
      retentionRate: 0,
      completionRate: 0,
      engagementScore: 0,
      sampleSize: 0,
    }
  }

  /**
   * Updates effectiveness metrics with new data point.
   * @private
   */
  private updateEffectiveness(
    metrics: ReturnType<typeof this.initializeEffectiveness>,
    performanceScore: number,
    eventData: { completed?: boolean; retention?: number },
  ): void {
    metrics.sampleSize++
    metrics.engagementScore += performanceScore
    if (eventData.completed) {
      metrics.completionRate += 1
    }
    if (eventData.retention !== undefined) {
      metrics.retentionRate += eventData.retention
    }
  }

  /**
   * Finalizes effectiveness metrics by calculating averages.
   * @private
   */
  private finalizeEffectiveness(
    metrics: ReturnType<typeof this.initializeEffectiveness>,
  ): ContentTypeEffectiveness {
    if (metrics.sampleSize === 0) {
      return {
        score: 0,
        retentionRate: 0,
        completionRate: 0,
        engagementScore: 0,
        sampleSize: 0,
      }
    }

    const avgRetention = metrics.retentionRate / metrics.sampleSize
    const avgCompletion = metrics.completionRate / metrics.sampleSize
    const avgEngagement = metrics.engagementScore / metrics.sampleSize

    // Composite effectiveness score: retention (50%) + completion (30%) + engagement (20%)
    const score = avgRetention * 50 + avgCompletion * 30 + avgEngagement * 0.2

    return {
      score: Math.round(score * 100) / 100,
      retentionRate: Math.round(avgRetention * 100) / 100,
      completionRate: Math.round(avgCompletion * 100) / 100,
      engagementScore: Math.round(avgEngagement * 100) / 100,
      sampleSize: metrics.sampleSize,
    }
  }
}
