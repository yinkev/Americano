/**
 * Story 5.4: Difficulty Adapter
 *
 * Automatic difficulty adjustment based on cognitive load state.
 * Prevents cognitive overload through dynamic content adaptation.
 *
 * Adjustment Logic (Story 5.4 lines 485-525):
 * - Low load (<30): Increase challenge
 * - Moderate (40-60): Maintain difficulty, add scaffolding
 * - High (60-80): Reduce difficulty 1 level, 80% review ratio
 * - Critical (>80): Emergency adaptation, 100% review, suggest break
 */

import { PrismaClient } from '@/generated/prisma'
import type { LearningStyleProfile } from '@/types/prisma-json'

const prisma = new PrismaClient()

// ============================================
// Types & Interfaces
// ============================================

export interface DifficultyAdjustment {
  action: 'INCREASE' | 'MAINTAIN' | 'REDUCE' | 'EMERGENCY'
  difficultyChange: number // -2, -1, 0, +1 levels
  reviewRatio: number // 0.0-1.0 (ratio of review vs new content)
  sessionModifications: SessionModification[]
  reasoning: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface SessionModification {
  type:
    | 'CONTENT_DIFFICULTY'
    | 'VALIDATION_COMPLEXITY'
    | 'SESSION_DURATION'
    | 'BREAK_FREQUENCY'
    | 'SCAFFOLDING'
  description: string
  value: string | number
}

export interface ContentRecommendation {
  preferredContentTypes: string[] // ['review', 'familiar', 'easy']
  avoidContentTypes: string[] // ['new', 'difficult', 'clinical_reasoning']
  maxComplexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  scaffoldingLevel: 'NONE' | 'MINIMAL' | 'MODERATE' | 'EXTENSIVE'
  validationPromptComplexity: number // 0.0-1.0 multiplier for prompt complexity
  suggestedTopics: string[]
  reasoning: string
}

export interface ChallengeLevel {
  difficulty: 'EASY' | 'MODERATE' | 'CHALLENGING' | 'ADVANCED'
  complexity: number // 1-10 scale
  newContentRatio: number // 0.0-1.0
  validationIntensity: 'LOW' | 'MEDIUM' | 'HIGH'
  sessionDurationMinutes: number
  breakFrequencyMinutes: number
}

export interface SessionContext {
  userId: string
  sessionId: string
  currentLoad: number // 0-100
  loadTrend: 'INCREASING' | 'STABLE' | 'DECREASING'
  sessionDuration: number // minutes
  performanceScore: number // 0.0-1.0
  errorRate: number // 0.0-1.0
  engagementLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface UserProfile {
  userId: string
  loadTolerance: number // Personalized threshold (0-100)
  avgCognitiveLoad: number // 7-day rolling average
  optimalLoadZone: { min: number; max: number } // Optimal performance range
  stressProfile: {
    primaryStressors: string[]
    avgRecoveryTime: number // hours
    copingStrategies: string[]
  }
}

export interface LoadState {
  current: number
  baseline: number
  trend: 'INCREASING' | 'STABLE' | 'DECREASING'
  timeInZone: number // minutes in current load zone
}

// ============================================
// Difficulty Adapter Class
// ============================================

export class DifficultyAdapter {
  /**
   * Adjust difficulty based on current cognitive load
   *
   * @param userId - User identifier
   * @param currentLoad - Current cognitive load score (0-100)
   * @returns Difficulty adjustment recommendations
   */
  async adjustDifficulty(userId: string, currentLoad: number): Promise<DifficultyAdjustment> {
    // Determine adjustment action based on load zones
    let action: DifficultyAdjustment['action']
    let difficultyChange = 0
    let reviewRatio = 0.5 // Default 50/50
    let urgency: DifficultyAdjustment['urgency'] = 'LOW'
    const sessionModifications: SessionModification[] = []

    // Fetch user's load tolerance (personalized threshold)
    const userProfile = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })

    // Extract load tolerance from learning profile data or use default
    const learningStyle = userProfile?.learningStyleProfile as unknown as
      | (LearningStyleProfile & { loadTolerance?: number })
      | null
    const loadTolerance = learningStyle?.loadTolerance || 65 // Default threshold

    // Critical overload (>80)
    if (currentLoad > 80) {
      action = 'EMERGENCY'
      difficultyChange = -2
      reviewRatio = 1.0 // 100% review
      urgency = 'CRITICAL'

      sessionModifications.push(
        {
          type: 'CONTENT_DIFFICULTY',
          description: 'Switch to easiest available content',
          value: 'BASIC',
        },
        {
          type: 'VALIDATION_COMPLEXITY',
          description: 'Disable complex validation prompts',
          value: 0,
        },
        {
          type: 'SESSION_DURATION',
          description: 'Suggest ending session',
          value: 'IMMEDIATE',
        },
        {
          type: 'BREAK_FREQUENCY',
          description: 'Immediate 10-minute break',
          value: 0,
        },
        {
          type: 'SCAFFOLDING',
          description: 'Maximum scaffolding (hints, examples, step-by-step)',
          value: 'EXTENSIVE',
        },
      )
    }
    // High load (60-80)
    else if (currentLoad > 60) {
      action = 'REDUCE'
      difficultyChange = -1
      reviewRatio = 0.8 // 80% review, 20% new
      urgency = 'HIGH'

      sessionModifications.push(
        {
          type: 'CONTENT_DIFFICULTY',
          description: 'Reduce difficulty by 1 level',
          value: -1,
        },
        {
          type: 'VALIDATION_COMPLEXITY',
          description: 'Simplify validation prompts (skip "explain to patient")',
          value: 0.5,
        },
        {
          type: 'BREAK_FREQUENCY',
          description: 'Breaks every 20 minutes',
          value: 20,
        },
        {
          type: 'SCAFFOLDING',
          description: 'Add moderate scaffolding',
          value: 'MODERATE',
        },
      )
    }
    // Moderate load (40-60)
    else if (currentLoad >= 40) {
      action = 'MAINTAIN'
      difficultyChange = 0
      reviewRatio = 0.6 // 60% review, 40% new
      urgency = 'MEDIUM'

      sessionModifications.push(
        {
          type: 'CONTENT_DIFFICULTY',
          description: 'Maintain current difficulty',
          value: 0,
        },
        {
          type: 'SCAFFOLDING',
          description: 'Add minor scaffolding (hints if needed)',
          value: 'MINIMAL',
        },
        {
          type: 'BREAK_FREQUENCY',
          description: 'Breaks every 30 minutes',
          value: 30,
        },
      )
    }
    // Low load (<40)
    else {
      action = 'INCREASE'
      difficultyChange = currentLoad < 30 ? 1 : 0
      reviewRatio = 0.5 // 50% review, 50% new
      urgency = 'LOW'

      sessionModifications.push(
        {
          type: 'CONTENT_DIFFICULTY',
          description: currentLoad < 30 ? 'Gradually increase difficulty' : 'Maintain difficulty',
          value: difficultyChange,
        },
        {
          type: 'VALIDATION_COMPLEXITY',
          description: 'Enable full validation suite',
          value: 1.0,
        },
        {
          type: 'SCAFFOLDING',
          description: 'Minimal scaffolding for optimal challenge',
          value: 'NONE',
        },
      )
    }

    const reasoning = this.generateAdjustmentReasoning(action, currentLoad, loadTolerance)

    return {
      action,
      difficultyChange,
      reviewRatio,
      sessionModifications,
      reasoning,
      urgency,
    }
  }

  /**
   * Recommend content modifications based on session context
   *
   * @param sessionContext - Current session state
   * @returns Content recommendation
   */
  async recommendContentModification(
    sessionContext: SessionContext,
  ): Promise<ContentRecommendation> {
    const { currentLoad, loadTrend, sessionDuration, performanceScore, errorRate } = sessionContext

    let maxComplexity: ContentRecommendation['maxComplexity'] = 'INTERMEDIATE'
    let scaffoldingLevel: ContentRecommendation['scaffoldingLevel'] = 'MINIMAL'
    let validationPromptComplexity = 1.0
    let preferredContentTypes: string[] = []
    let avoidContentTypes: string[] = []
    let suggestedTopics: string[] = []

    // Critical load (>80)
    if (currentLoad > 80) {
      maxComplexity = 'BASIC'
      scaffoldingLevel = 'EXTENSIVE'
      validationPromptComplexity = 0.3
      preferredContentTypes = ['review', 'familiar', 'mastered']
      avoidContentTypes = ['new', 'advanced', 'clinical_reasoning', 'complex_integration']
      suggestedTopics = ['Previously mastered concepts', 'High-confidence topics']
    }
    // High load (60-80)
    else if (currentLoad > 60) {
      maxComplexity = 'INTERMEDIATE'
      scaffoldingLevel = 'MODERATE'
      validationPromptComplexity = 0.6
      preferredContentTypes = ['review', 'familiar', 'basic']
      avoidContentTypes = ['new', 'advanced', 'clinical_reasoning']
      suggestedTopics = ['Review recent topics', 'Reinforce weak areas']
    }
    // Moderate load (40-60)
    else if (currentLoad >= 40) {
      maxComplexity = 'INTERMEDIATE'
      scaffoldingLevel = 'MINIMAL'
      validationPromptComplexity = 0.8
      preferredContentTypes = ['review', 'familiar', 'moderate']
      avoidContentTypes = ['advanced']
      suggestedTopics = ['Balanced mix of review and new content']
    }
    // Low load (<40)
    else {
      maxComplexity = 'ADVANCED'
      scaffoldingLevel = 'NONE'
      validationPromptComplexity = 1.0
      preferredContentTypes = ['new', 'challenging', 'clinical_reasoning']
      avoidContentTypes = []
      suggestedTopics = ['Challenge yourself with new material', 'Complex integrative concepts']
    }

    // Adjust based on performance and error rate
    if (errorRate > 0.3) {
      maxComplexity = maxComplexity === 'ADVANCED' ? 'INTERMEDIATE' : 'BASIC'
      scaffoldingLevel = scaffoldingLevel === 'NONE' ? 'MINIMAL' : 'MODERATE'
    }

    const reasoning = this.generateContentRecommendationReasoning(
      currentLoad,
      performanceScore,
      errorRate,
    )

    return {
      preferredContentTypes,
      avoidContentTypes,
      maxComplexity,
      scaffoldingLevel,
      validationPromptComplexity,
      suggestedTopics,
      reasoning,
    }
  }

  /**
   * Calculate optimal challenge level for user
   *
   * @param userProfile - User's learning profile
   * @param loadState - Current load state
   * @returns Optimal challenge level
   */
  calculateOptimalChallenge(userProfile: UserProfile, loadState: LoadState): ChallengeLevel {
    const { loadTolerance, optimalLoadZone } = userProfile
    const { current, trend } = loadState

    let difficulty: ChallengeLevel['difficulty']
    let complexity: number
    let newContentRatio: number
    let validationIntensity: ChallengeLevel['validationIntensity']
    let sessionDurationMinutes: number
    let breakFrequencyMinutes: number

    // Determine if user is in optimal zone
    const inOptimalZone = current >= optimalLoadZone.min && current <= optimalLoadZone.max

    if (current > loadTolerance || current > 80) {
      // Overload zone
      difficulty = 'EASY'
      complexity = 2
      newContentRatio = 0.0 // Pure review
      validationIntensity = 'LOW'
      sessionDurationMinutes = 20
      breakFrequencyMinutes = 15
    } else if (current > 60 || (trend === 'INCREASING' && current > 50)) {
      // High load or increasing toward high
      difficulty = 'MODERATE'
      complexity = 4
      newContentRatio = 0.2
      validationIntensity = 'LOW'
      sessionDurationMinutes = 30
      breakFrequencyMinutes = 20
    } else if (inOptimalZone) {
      // Optimal zone - maintain flow
      difficulty = 'MODERATE'
      complexity = 6
      newContentRatio = 0.5
      validationIntensity = 'MEDIUM'
      sessionDurationMinutes = 45
      breakFrequencyMinutes = 30
    } else if (current < 30) {
      // Under-challenged
      difficulty = 'CHALLENGING'
      complexity = 8
      newContentRatio = 0.6
      validationIntensity = 'HIGH'
      sessionDurationMinutes = 60
      breakFrequencyMinutes = 30
    } else {
      // Moderate-low load
      difficulty = 'MODERATE'
      complexity = 5
      newContentRatio = 0.5
      validationIntensity = 'MEDIUM'
      sessionDurationMinutes = 45
      breakFrequencyMinutes = 25
    }

    return {
      difficulty,
      complexity,
      newContentRatio,
      validationIntensity,
      sessionDurationMinutes,
      breakFrequencyMinutes,
    }
  }

  /**
   * Apply difficulty adaptation to active session
   *
   * @param sessionId - Session identifier
   * @param adjustment - Difficulty adjustment to apply
   */
  async applyAdaptation(sessionId: string, adjustment: DifficultyAdjustment): Promise<void> {
    // Log adaptation for tracking effectiveness
    console.log(`Applying difficulty adaptation to session ${sessionId}:`, {
      action: adjustment.action,
      difficultyChange: adjustment.difficultyChange,
      reviewRatio: adjustment.reviewRatio,
      urgency: adjustment.urgency,
    })

    // Store adaptation record (for Story 5.2 intervention tracking)
    // This would integrate with InterventionRecommendation table

    // Note: Actual content switching would happen in mission-generator.ts
    // and study-session controller based on these recommendations
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private generateAdjustmentReasoning(
    action: DifficultyAdjustment['action'],
    currentLoad: number,
    loadTolerance: number,
  ): string {
    const reasons: Record<DifficultyAdjustment['action'], string> = {
      EMERGENCY: `Critical cognitive overload detected (${currentLoad.toFixed(1)}/100). Immediate intervention required to prevent burnout. Switching to pure review mode with maximum scaffolding.`,
      REDUCE: `High cognitive load (${currentLoad.toFixed(1)}/100) detected. Reducing difficulty to prevent overload and maintain sustainable learning. Focus on consolidation over acquisition.`,
      MAINTAIN: `Moderate cognitive load (${currentLoad.toFixed(1)}/100). You're in a productive learning zone. Maintaining current difficulty with minor scaffolding for support.`,
      INCREASE: `Low cognitive load (${currentLoad.toFixed(1)}/100). You have capacity for more challenge. Gradually increasing difficulty to optimize learning and maintain engagement.`,
    }

    const personalizedNote =
      currentLoad > loadTolerance
        ? ` This exceeds your personalized threshold (${loadTolerance.toFixed(1)}), so we're being extra cautious.`
        : ''

    return reasons[action] + personalizedNote
  }

  private generateContentRecommendationReasoning(
    currentLoad: number,
    performanceScore: number,
    errorRate: number,
  ): string {
    let reasoning = `Based on cognitive load (${currentLoad.toFixed(1)}/100)`

    if (performanceScore < 0.6) {
      reasoning += ', low performance score'
    }

    if (errorRate > 0.3) {
      reasoning += ', and elevated error rate (${(errorRate * 100).toFixed(1)}%)'
    }

    if (currentLoad > 80) {
      reasoning += ', recommending easiest content with extensive support to facilitate recovery.'
    } else if (currentLoad > 60) {
      reasoning +=
        ', recommending familiar content with moderate scaffolding to reduce cognitive demand.'
    } else if (currentLoad >= 40) {
      reasoning += ', recommending balanced content mix to maintain productive learning state.'
    } else {
      reasoning += ', recommending challenging content to optimize learning and engagement.'
    }

    return reasoning
  }
}

// Export singleton instance
export const difficultyAdapter = new DifficultyAdapter()
