/**
 * Metacognitive Intervention Engine
 *
 * Provides targeted interventions for students showing poor confidence calibration.
 * Helps students develop accurate self-assessment skills through personalized feedback.
 *
 * Key Features:
 * - Detects overconfidence and underconfidence patterns
 * - Triggers interventions when calibration health is poor (correlation < 0.5)
 * - Generates personalized recommendations
 * - Tracks dismissals and effectiveness
 * - Enforces 7-day cooldown between interventions
 *
 * @see docs/stories/story-4.4.md - Task 8: Metacognitive Intervention Engine
 */

import {
  type CalibrationCategory,
  calculateCorrelation,
  normalizeConfidence,
} from '@/lib/confidence-calibrator'
import { prisma } from '@/lib/db'

/**
 * Intervention types based on calibration patterns
 */
export enum InterventionType {
  OVERCONFIDENCE = 'OVERCONFIDENCE',
  UNDERCONFIDENCE = 'UNDERCONFIDENCE',
  GENERAL = 'GENERAL',
}

/**
 * Calibration health check result
 */
export interface CalibrationHealthCheck {
  /** Whether an intervention is needed */
  needsIntervention: boolean
  /** Type of intervention recommended */
  interventionType: InterventionType | null
  /** Current correlation coefficient */
  correlationCoeff: number | null
  /** Number of recent assessments analyzed */
  assessmentCount: number
  /** Reason for intervention (or why not needed) */
  reason: string
}

/**
 * Intervention details for display
 */
export interface InterventionRecommendation {
  /** Intervention type */
  type: InterventionType
  /** Main intervention message */
  message: string
  /** Specific action items */
  recommendations: string[]
  /** Educational content about metacognition */
  educationalContent: string
  /** Example assessments showing the pattern */
  exampleAssessments?: Array<{
    conceptName: string
    confidence: number
    score: number
    delta: number
  }>
}

/**
 * Intervention dismissal record
 */
export interface InterventionDismissal {
  id: string
  userId: string
  interventionType: InterventionType
  dismissedAt: Date
  correlationAtDismissal: number
  assessmentCount: number
}

/**
 * Metacognitive Intervention Engine
 *
 * Monitors student calibration patterns and triggers interventions
 * when calibration health deteriorates.
 */
export class MetacognitiveInterventionEngine {
  /**
   * Minimum number of assessments required to check calibration health
   */
  private static readonly MIN_ASSESSMENTS = 10

  /**
   * Correlation threshold below which intervention is triggered
   */
  private static readonly INTERVENTION_THRESHOLD = 0.5

  /**
   * Cooldown period between interventions (days)
   */
  private static readonly COOLDOWN_DAYS = 7

  /**
   * Delta threshold for overconfidence pattern detection
   */
  private static readonly OVERCONFIDENCE_THRESHOLD = 15

  /**
   * Delta threshold for underconfidence pattern detection
   */
  private static readonly UNDERCONFIDENCE_THRESHOLD = -15

  /**
   * Check if user needs a metacognitive intervention
   *
   * Analyzes recent assessment history to determine calibration health.
   * Triggers intervention if:
   * 1. User has 10+ recent assessments with confidence data
   * 2. Correlation coefficient < 0.5
   * 3. No intervention dismissed in last 7 days
   *
   * @param userId - User ID to check
   * @returns Calibration health check result
   */
  public static async checkCalibrationHealth(userId: string): Promise<CalibrationHealthCheck> {
    try {
      // Fetch recent validation responses with confidence data
      const recentResponses = await prisma.validationResponse.findMany({
        where: {
          userId,
          preAssessmentConfidence: { not: null },
          score: { not: null },
        },
        orderBy: { respondedAt: 'desc' },
        take: 50, // Analyze up to 50 recent assessments
        include: {
          prompt: {
            select: {
              conceptName: true,
            },
          },
        },
      })

      // Check if sufficient data exists
      if (recentResponses.length < MetacognitiveInterventionEngine.MIN_ASSESSMENTS) {
        return {
          needsIntervention: false,
          interventionType: null,
          correlationCoeff: null,
          assessmentCount: recentResponses.length,
          reason: `Insufficient data: Need at least ${MetacognitiveInterventionEngine.MIN_ASSESSMENTS} assessments, have ${recentResponses.length}`,
        }
      }

      // Extract confidence and score arrays
      const confidenceArray = recentResponses.map(
        (r) => normalizeConfidence(r.preAssessmentConfidence!), // Normalize 1-5 to 0-100
      )
      const scoreArray = recentResponses.map((r) => r.score * 100) // Convert 0-1 to 0-100

      // Calculate correlation coefficient
      const correlationCoeff = calculateCorrelation(confidenceArray, scoreArray)

      // Check if correlation is below threshold
      if (
        correlationCoeff === null ||
        correlationCoeff >= MetacognitiveInterventionEngine.INTERVENTION_THRESHOLD
      ) {
        return {
          needsIntervention: false,
          interventionType: null,
          correlationCoeff,
          assessmentCount: recentResponses.length,
          reason:
            correlationCoeff === null
              ? 'Insufficient data for correlation calculation'
              : `Calibration is acceptable (r = ${correlationCoeff.toFixed(2)})`,
        }
      }

      // Check cooldown period
      const lastDismissal = await MetacognitiveInterventionEngine.getLastDismissal(userId)
      if (lastDismissal) {
        const daysSinceDismissal = Math.floor(
          (Date.now() - lastDismissal.dismissedAt.getTime()) / (1000 * 60 * 60 * 24),
        )
        if (daysSinceDismissal < MetacognitiveInterventionEngine.COOLDOWN_DAYS) {
          return {
            needsIntervention: false,
            interventionType: null,
            correlationCoeff,
            assessmentCount: recentResponses.length,
            reason: `Cooldown period: ${MetacognitiveInterventionEngine.COOLDOWN_DAYS - daysSinceDismissal} days remaining`,
          }
        }
      }

      // Determine intervention type based on delta pattern
      const deltas = recentResponses
        .map((r) => {
          const confNormalized = normalizeConfidence(r.preAssessmentConfidence!)
          const score = r.score * 100
          return confNormalized - score
        })
        .filter((d) => !isNaN(d))

      const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length
      const interventionType = MetacognitiveInterventionEngine.determineInterventionType(avgDelta)

      return {
        needsIntervention: true,
        interventionType,
        correlationCoeff,
        assessmentCount: recentResponses.length,
        reason: `Poor calibration detected (r = ${correlationCoeff.toFixed(2)}, avg delta = ${avgDelta.toFixed(1)})`,
      }
    } catch (error) {
      console.error('Error checking calibration health:', error)
      throw new Error('Failed to check calibration health')
    }
  }

  /**
   * Determine intervention type based on average delta
   *
   * @param avgDelta - Average calibration delta
   * @returns Intervention type
   */
  private static determineInterventionType(avgDelta: number): InterventionType {
    if (avgDelta > 10) {
      // Consistent overconfidence
      return InterventionType.OVERCONFIDENCE
    } else if (avgDelta < -10) {
      // Consistent underconfidence
      return InterventionType.UNDERCONFIDENCE
    } else {
      // Mixed or general calibration issues
      return InterventionType.GENERAL
    }
  }

  /**
   * Generate intervention recommendations
   *
   * @param userId - User ID
   * @param interventionType - Type of intervention needed
   * @returns Intervention recommendation with personalized content
   */
  public static async generateInterventionRecommendations(
    userId: string,
    interventionType: InterventionType,
  ): Promise<InterventionRecommendation> {
    // Fetch recent problematic assessments as examples
    const recentResponses = await prisma.validationResponse.findMany({
      where: {
        userId,
        preAssessmentConfidence: { not: null },
        score: { not: null },
      },
      orderBy: { respondedAt: 'desc' },
      take: 20,
      include: {
        prompt: {
          select: {
            conceptName: true,
          },
        },
      },
    })

    // Extract examples showing the pattern
    const exampleAssessments = recentResponses
      .slice(0, 3)
      .map((r) => ({
        conceptName: r.prompt.conceptName,
        confidence: r.preAssessmentConfidence!,
        score: Math.round(r.score * 100),
        delta: normalizeConfidence(r.preAssessmentConfidence!) - r.score * 100,
      }))
      .filter((ex) => {
        if (interventionType === InterventionType.OVERCONFIDENCE) {
          return ex.delta > MetacognitiveInterventionEngine.OVERCONFIDENCE_THRESHOLD
        } else if (interventionType === InterventionType.UNDERCONFIDENCE) {
          return ex.delta < MetacognitiveInterventionEngine.UNDERCONFIDENCE_THRESHOLD
        }
        return true
      })

    switch (interventionType) {
      case InterventionType.OVERCONFIDENCE:
        return {
          type: InterventionType.OVERCONFIDENCE,
          message:
            "We've noticed a pattern: You often feel more confident than your actual performance shows. This is called overconfidence, and it's common in medical education.",
          recommendations: [
            'Review concepts where you felt certain but performed weaker',
            'Before marking objectives complete, quiz yourself without notes',
            'Practice calibration: After studying, predict your score before testing',
            'Identify specific areas of weakness within topics you thought you knew',
            'Use the "teach back" method: Explain concepts to verify understanding',
          ],
          educationalContent: `**Understanding Overconfidence (Dunning-Kruger Effect)**

Overconfidence occurs when we overestimate our knowledge or abilities. This is especially dangerous in medicine, where assumptions can have serious consequences.

**Why it happens:**
- Limited awareness of what we don't know
- Familiarity with terms doesn't equal deep understanding
- Pattern recognition can mask conceptual gaps

**How to combat it:**
- Seek active challenges to your understanding
- Practice retrieval before reviewing materials
- Welcome difficult questions as learning opportunities
- Regularly self-test in realistic conditions`,
          exampleAssessments,
        }

      case InterventionType.UNDERCONFIDENCE:
        return {
          type: InterventionType.UNDERCONFIDENCE,
          message:
            'Great news: Your understanding is stronger than you think! You consistently score higher than your confidence suggests.',
          recommendations: [
            'Review your past successful assessments to build confidence',
            'Recognize patterns where you doubt yourself but perform well',
            'Trust your preparation - your knowledge is more solid than you feel',
            'Before studying, remind yourself of recent wins',
            'Identify what triggers your self-doubt vs. actual knowledge gaps',
          ],
          educationalContent: `**Understanding Underconfidence (Imposter Syndrome)**

Underconfidence, or imposter syndrome, is when competent individuals doubt their abilities despite evidence of success. This is common among high-achieving medical students.

**Why it happens:**
- High standards and perfectionism
- Comparing yourself to idealized peers
- Focusing on mistakes while discounting successes
- Lack of positive feedback or recognition

**How to build confidence:**
- Track your progress objectively with data
- Celebrate small wins and acknowledge growth
- Focus on improvement, not perfection
- Seek feedback from mentors and peers
- Remember: Uncertainty is part of learning`,
          exampleAssessments,
        }

      case InterventionType.GENERAL:
      default:
        return {
          type: InterventionType.GENERAL,
          message:
            "Your confidence doesn't consistently match your performance. Let's work on improving your self-assessment accuracy.",
          recommendations: [
            'After each study session, rate your understanding (1-5)',
            'Then test yourself and compare your prediction to actual results',
            'Reflect: What made you over/underestimate your knowledge?',
            'Keep a calibration journal to track patterns',
            'Practice metacognitive awareness during studying',
          ],
          educationalContent: `**Developing Metacognitive Awareness**

Metacognition is "thinking about thinking" - being aware of what you know and don't know. This is a critical skill for medical professionals.

**Why it matters:**
- Accurate self-assessment prevents errors
- Helps you study more efficiently
- Builds clinical judgment and decision-making
- Essential for lifelong learning in medicine

**How to improve calibration:**
- Practice active self-monitoring during study
- Use confidence ratings before and after tests
- Analyze your mistakes AND successes
- Develop a growth mindset toward learning
- Seek regular feedback and act on it`,
          exampleAssessments,
        }
    }
  }

  /**
   * Track intervention dismissal
   *
   * Records when a user dismisses an intervention for effectiveness tracking
   * and cooldown enforcement.
   *
   * @param userId - User ID
   * @param interventionType - Type of intervention dismissed
   * @param correlationAtDismissal - Correlation coefficient when dismissed
   * @param assessmentCount - Number of assessments at dismissal
   */
  public static async trackInterventionDismissal(
    userId: string,
    interventionType: InterventionType,
    correlationAtDismissal: number,
    assessmentCount: number,
  ): Promise<void> {
    try {
      // Store dismissal in user behavioral events
      await prisma.behavioralEvent.create({
        data: {
          userId,
          eventType: 'VALIDATION_COMPLETED', // Reuse existing enum
          eventData: {
            type: 'intervention_dismissal',
            interventionType,
            correlationAtDismissal,
            assessmentCount,
          },
        },
      })
    } catch (error) {
      console.error('Error tracking intervention dismissal:', error)
      throw new Error('Failed to track intervention dismissal')
    }
  }

  /**
   * Get the most recent intervention dismissal
   *
   * @param userId - User ID
   * @returns Last dismissal record or null
   */
  private static async getLastDismissal(userId: string): Promise<{ dismissedAt: Date } | null> {
    try {
      const lastEvent = await prisma.behavioralEvent.findFirst({
        where: {
          userId,
          eventType: 'VALIDATION_COMPLETED',
        },
        orderBy: { timestamp: 'desc' },
      })

      if (
        lastEvent &&
        typeof lastEvent.eventData === 'object' &&
        lastEvent.eventData !== null &&
        'type' in lastEvent.eventData &&
        lastEvent.eventData.type === 'intervention_dismissal'
      ) {
        return { dismissedAt: lastEvent.timestamp }
      }

      return null
    } catch (error) {
      console.error('Error fetching last dismissal:', error)
      return null
    }
  }

  /**
   * Check intervention effectiveness
   *
   * Compares correlation before and after intervention to measure effectiveness.
   *
   * @param userId - User ID
   * @param interventionDate - Date of intervention
   * @returns Effectiveness metrics
   */
  public static async checkInterventionEffectiveness(
    userId: string,
    interventionDate: Date,
  ): Promise<{
    correlationBefore: number | null
    correlationAfter: number | null
    improvement: number | null
    isEffective: boolean
  }> {
    try {
      // Get assessments before intervention (14 days prior)
      const beforeDate = new Date(interventionDate)
      beforeDate.setDate(beforeDate.getDate() - 14)

      const responsesBefore = await prisma.validationResponse.findMany({
        where: {
          userId,
          preAssessmentConfidence: { not: null },
          score: { not: null },
          respondedAt: {
            gte: beforeDate,
            lt: interventionDate,
          },
        },
        orderBy: { respondedAt: 'desc' },
      })

      // Get assessments after intervention (14 days after)
      const afterDate = new Date(interventionDate)
      afterDate.setDate(afterDate.getDate() + 14)

      const responsesAfter = await prisma.validationResponse.findMany({
        where: {
          userId,
          preAssessmentConfidence: { not: null },
          score: { not: null },
          respondedAt: {
            gte: interventionDate,
            lte: afterDate,
          },
        },
        orderBy: { respondedAt: 'desc' },
      })

      // Calculate correlations
      const correlationBefore =
        responsesBefore.length >= 5
          ? calculateCorrelation(
              responsesBefore.map((r) => normalizeConfidence(r.preAssessmentConfidence!)),
              responsesBefore.map((r) => r.score * 100),
            )
          : null

      const correlationAfter =
        responsesAfter.length >= 5
          ? calculateCorrelation(
              responsesAfter.map((r) => normalizeConfidence(r.preAssessmentConfidence!)),
              responsesAfter.map((r) => r.score * 100),
            )
          : null

      const improvement =
        correlationBefore !== null && correlationAfter !== null
          ? correlationAfter - correlationBefore
          : null

      const isEffective = improvement !== null && improvement > 0.1 // 0.1 improvement threshold

      return {
        correlationBefore,
        correlationAfter,
        improvement,
        isEffective,
      }
    } catch (error) {
      console.error('Error checking intervention effectiveness:', error)
      throw new Error('Failed to check intervention effectiveness')
    }
  }
}
