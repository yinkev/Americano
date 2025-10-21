/**
 * Adaptive Session Orchestrator (Story 4.5 Task 7)
 *
 * Orchestrates adaptive assessment sessions with:
 * - Initial difficulty calibration based on user history
 * - Real-time difficulty adjustments based on performance
 * - Fatigue detection and break recommendations
 * - Strategic session termination (mastery verification or user fatigue)
 * - Mid-session difficulty recalibration
 * - Session summary with adaptation decisions
 *
 * @example
 * ```typescript
 * const orchestrator = new AdaptiveSessionOrchestrator();
 *
 * // Initialize session
 * const session = await orchestrator.initializeAdaptiveSession(userId, objectiveId, sessionId);
 *
 * // Main assessment loop
 * while (!session.shouldTerminate) {
 *   const result = await orchestrator.conductAdaptiveAssessment(session.id);
 *   if (result.recommendBreak) {
 *     // Show break recommendation
 *   }
 * }
 *
 * // End strategically
 * const summary = await orchestrator.endStrategically(session.id);
 * ```
 */

import { prisma } from '@/lib/db'
import { AdaptiveDifficultyEngine } from '@/lib/adaptive/adaptive-engine'
import { ObjectiveComplexity, MasteryStatus } from '@/generated/prisma'

/**
 * Adaptive session state
 */
export interface AdaptiveSessionState {
  /** Session ID */
  id: string
  /** User ID */
  userId: string
  /** Related study session ID */
  sessionId: string | null
  /** Current difficulty level (0-100) */
  currentDifficulty: number
  /** Initial difficulty when session started */
  initialDifficulty: number
  /** Number of questions asked so far */
  questionCount: number
  /** Number of difficulty adjustments made */
  adjustmentCount: number
  /** Performance trajectory */
  trajectory: Array<{
    questionId: string
    difficulty: number
    score: number
    adjustment: number
    timestamp: Date
  }>
  /** Should terminate session */
  shouldTerminate: boolean
  /** Termination reason */
  terminationReason?: string
  /** Session start time */
  startedAt: Date
  /** IRT knowledge estimate (theta) */
  irtEstimate?: number
  /** Confidence interval for early stopping */
  confidenceInterval?: number
}

/**
 * Assessment result from conducting adaptive assessment
 */
export interface AssessmentResult {
  /** Question prompt ID */
  promptId: string
  /** Question text */
  promptText: string
  /** Current difficulty level */
  difficulty: number
  /** User's response score (0-100) */
  score?: number
  /** Whether to recommend a break */
  recommendBreak: boolean
  /** Break recommendation reason */
  breakReason?: string
  /** Can stop early (IRT converged) */
  canStopEarly: boolean
  /** Efficiency metrics */
  efficiencyMetrics: {
    questionsAsked: number
    timeSaved: number
    efficiencyScore: number
  }
}

/**
 * Session summary after completion
 */
export interface SessionSummary {
  /** Session ID */
  sessionId: string
  /** Total questions asked */
  totalQuestions: number
  /** Difficulty progression */
  difficultyProgression: Array<{
    questionNum: number
    difficulty: number
    score: number
    adjustment: number
  }>
  /** Adaptation decisions made */
  adaptations: string[]
  /** Final IRT knowledge estimate */
  finalKnowledgeEstimate?: number
  /** Mastery status achieved */
  masteryStatus: MasteryStatus
  /** Session duration (milliseconds) */
  durationMs: number
  /** Efficiency score (0-100) */
  efficiencyScore: number
  /** Number of breaks recommended */
  breaksRecommended: number
}

/**
 * Adaptive Session Orchestrator
 *
 * Manages the lifecycle of an adaptive assessment session from initialization
 * to strategic termination, including real-time difficulty adjustments,
 * fatigue detection, and mastery verification.
 */
export class AdaptiveSessionOrchestrator {
  private difficultyEngine: AdaptiveDifficultyEngine

  /** Maximum questions before fatigue detection */
  private static readonly MAX_QUESTIONS_BEFORE_FATIGUE = 10

  /** Maximum session duration (30 minutes in milliseconds) */
  private static readonly MAX_SESSION_DURATION_MS = 30 * 60 * 1000

  /** Performance decline threshold (score drop > 15 points) */
  private static readonly PERFORMANCE_DECLINE_THRESHOLD = 15

  /** Number of consecutive declines to recommend break */
  private static readonly CONSECUTIVE_DECLINES_FOR_BREAK = 2

  /** Maximum difficulty adjustments per session */
  private static readonly MAX_ADJUSTMENTS_PER_SESSION = 3

  /** Minimum questions for IRT early stopping */
  private static readonly MIN_QUESTIONS_FOR_EARLY_STOP = 3

  /** IRT confidence interval threshold for early stopping (±X points) */
  private static readonly IRT_CONFIDENCE_THRESHOLD = 10

  constructor() {
    this.difficultyEngine = new AdaptiveDifficultyEngine()
  }

  /**
   * Initialize adaptive session with initial difficulty calibration
   *
   * AC#1: Start with initial difficulty based on user history (last 10 assessments)
   * Baseline difficulty ± 10 points for initial challenge
   *
   * @param userId - User ID
   * @param objectiveId - Learning objective ID
   * @param sessionId - Optional study session ID for linking
   * @returns Promise<AdaptiveSessionState> - Initialized session state
   *
   * @example
   * ```typescript
   * const session = await orchestrator.initializeAdaptiveSession(
   *   'user123',
   *   'obj456',
   *   'session789'
   * );
   * // Returns: { id, currentDifficulty: 65, questionCount: 0, ... }
   * ```
   */
  async initializeAdaptiveSession(
    userId: string,
    objectiveId: string,
    sessionId: string | null = null
  ): Promise<AdaptiveSessionState> {
    // Calculate initial difficulty from user history
    const initialDifficulty = await this.difficultyEngine.calculateInitialDifficulty(
      userId,
      objectiveId
    )

    // Create adaptive session record in database
    const adaptiveSession = await prisma.adaptiveSession.create({
      data: {
        userId,
        sessionId,
        initialDifficulty,
        currentDifficulty: initialDifficulty,
        questionCount: 0,
        trajectory: [],
      },
    })

    return {
      id: adaptiveSession.id,
      userId,
      sessionId,
      currentDifficulty: initialDifficulty,
      initialDifficulty,
      questionCount: 0,
      adjustmentCount: 0,
      trajectory: [],
      shouldTerminate: false,
      startedAt: adaptiveSession.createdAt,
    }
  }

  /**
   * Conduct adaptive assessment - main loop for question delivery and difficulty adjustment
   *
   * AC#2: Real-time difficulty adjustment based on response quality
   * - Score > 85%: +15 points
   * - Score 60-85%: ±5 points variation
   * - Score < 60%: -15 points
   * - Max 3 adjustments per session
   *
   * AC#8: Adaptive session orchestration
   * - Recommend breaks on performance decline
   * - Re-calibrate difficulty mid-session
   * - End strategically
   *
   * @param sessionStateId - Adaptive session state ID
   * @param lastScore - Score from previous question (0-100), undefined for first question
   * @returns Promise<AssessmentResult> - Next question and session state
   *
   * @example
   * ```typescript
   * // First question
   * const result1 = await orchestrator.conductAdaptiveAssessment(sessionId);
   *
   * // Subsequent questions (after user submits answer)
   * const result2 = await orchestrator.conductAdaptiveAssessment(sessionId, 85);
   * ```
   */
  async conductAdaptiveAssessment(
    sessionStateId: string,
    lastScore?: number
  ): Promise<AssessmentResult> {
    // Fetch current session state
    const session = await prisma.adaptiveSession.findUnique({
      where: { id: sessionStateId },
    })

    if (!session) {
      throw new Error(`Adaptive session ${sessionStateId} not found`)
    }

    const trajectory = (session.trajectory as any[]) || []

    // If this is not the first question, update difficulty based on last score
    let newDifficulty = session.currentDifficulty
    let adjustment = 0

    if (lastScore !== undefined && session.questionCount > 0) {
      // Check if we've hit max adjustments
      const adjustmentCount = trajectory.filter((t) => t.adjustment !== 0).length

      if (adjustmentCount < AdaptiveSessionOrchestrator.MAX_ADJUSTMENTS_PER_SESSION) {
        const difficultyAdjustment = this.difficultyEngine.adjustDifficulty(
          lastScore,
          session.currentDifficulty
        )
        newDifficulty = difficultyAdjustment.newDifficulty
        adjustment = difficultyAdjustment.adjustment
      }
    }

    // Check for fatigue indicators
    const { recommendBreak, breakReason } = this.checkBreakRecommendation(
      session.questionCount,
      session.createdAt,
      trajectory
    )

    // Check for early stopping (IRT convergence)
    const canStopEarly = this.checkEarlyStop(
      session.questionCount,
      session.irtEstimate,
      session.confidenceInterval
    )

    // Select next question at target difficulty
    // For MVP, we'll use a placeholder prompt (actual question selection would use QuestionBankManager)
    const promptId = `prompt_${session.questionCount + 1}` // Placeholder
    const promptText = `Adaptive question at difficulty ${newDifficulty}` // Placeholder

    // Calculate efficiency metrics
    const efficiencyMetrics = this.calculateEfficiencyMetrics(
      session.questionCount + 1,
      session.createdAt
    )

    // Update session state in database
    await prisma.adaptiveSession.update({
      where: { id: sessionStateId },
      data: {
        currentDifficulty: newDifficulty,
        questionCount: session.questionCount + 1,
        trajectory: [
          ...trajectory,
          {
            questionId: promptId,
            difficulty: newDifficulty,
            score: lastScore ?? 0,
            adjustment,
            timestamp: new Date(),
          },
        ],
      },
    })

    return {
      promptId,
      promptText,
      difficulty: newDifficulty,
      score: lastScore,
      recommendBreak,
      breakReason,
      canStopEarly,
      efficiencyMetrics,
    }
  }

  /**
   * Check if break should be recommended based on fatigue detection
   *
   * AC#8: Recommend breaks on performance decline detection
   * - 10+ questions asked
   * - 30+ minutes elapsed
   * - 2+ consecutive score drops > 15 points
   *
   * @param questionCount - Number of questions asked
   * @param sessionStart - Session start time
   * @param trajectory - Performance trajectory
   * @returns { recommendBreak: boolean, breakReason?: string }
   *
   * @example
   * ```typescript
   * const { recommendBreak, breakReason } = orchestrator.checkBreakRecommendation(
   *   12,
   *   sessionStart,
   *   trajectory
   * );
   * // Returns: { recommendBreak: true, breakReason: "10+ questions completed - take a break!" }
   * ```
   */
  checkBreakRecommendation(
    questionCount: number,
    sessionStart: Date,
    trajectory: Array<{ score: number; timestamp: Date }>
  ): { recommendBreak: boolean; breakReason?: string } {
    // Check question count threshold
    if (questionCount >= AdaptiveSessionOrchestrator.MAX_QUESTIONS_BEFORE_FATIGUE) {
      return {
        recommendBreak: true,
        breakReason: `${questionCount} questions completed - take a break to maintain focus!`,
      }
    }

    // Check session duration threshold
    const durationMs = Date.now() - sessionStart.getTime()
    if (durationMs >= AdaptiveSessionOrchestrator.MAX_SESSION_DURATION_MS) {
      return {
        recommendBreak: true,
        breakReason: `30+ minutes of focused study - time for a break!`,
      }
    }

    // Check for performance decline (2+ consecutive drops > 15 points)
    if (trajectory.length >= 3) {
      const recentScores = trajectory.slice(-3).map((t) => t.score)
      let consecutiveDeclines = 0

      for (let i = 1; i < recentScores.length; i++) {
        const drop = recentScores[i - 1] - recentScores[i]
        if (drop > AdaptiveSessionOrchestrator.PERFORMANCE_DECLINE_THRESHOLD) {
          consecutiveDeclines++
        } else {
          consecutiveDeclines = 0
        }
      }

      if (consecutiveDeclines >= AdaptiveSessionOrchestrator.CONSECUTIVE_DECLINES_FOR_BREAK) {
        return {
          recommendBreak: true,
          breakReason: `Performance declining - take a break to recharge!`,
        }
      }
    }

    return { recommendBreak: false }
  }

  /**
   * Check if session should terminate (mastery verified or user fatigue)
   *
   * AC#4: Mastery verification protocol
   * - 3 consecutive assessments > 80%
   * - Multiple assessment types
   * - Difficulty matches complexity level
   * - Confidence calibration within ±15 points
   * - Time-spaced ≥ 2 days
   *
   * @param sessionStateId - Adaptive session state ID
   * @param objectiveId - Learning objective ID
   * @returns Promise<boolean> - True if should terminate
   *
   * @example
   * ```typescript
   * const shouldEnd = await orchestrator.shouldTerminateSession(sessionId, objectiveId);
   * if (shouldEnd) {
   *   const summary = await orchestrator.endStrategically(sessionId);
   * }
   * ```
   */
  async shouldTerminateSession(
    sessionStateId: string,
    objectiveId: string
  ): Promise<boolean> {
    const session = await prisma.adaptiveSession.findUnique({
      where: { id: sessionStateId },
    })

    if (!session) {
      return false
    }

    const trajectory = (session.trajectory as any[]) || []

    // Check for user fatigue (extended session)
    const durationMs = Date.now() - session.createdAt.getTime()
    if (durationMs > AdaptiveSessionOrchestrator.MAX_SESSION_DURATION_MS) {
      return true
    }

    // Check for mastery verification
    // Query mastery verification record
    const mastery = await prisma.masteryVerification.findUnique({
      where: {
        userId_objectiveId: {
          userId: session.userId,
          objectiveId,
        },
      },
    })

    // If mastery already verified, can terminate
    if (mastery?.status === MasteryStatus.VERIFIED) {
      return true
    }

    // Check for 3 consecutive high scores (one of the mastery criteria)
    if (trajectory.length >= 3) {
      const recentScores = trajectory.slice(-3).map((t) => t.score)
      const allHighScores = recentScores.every((score) => score > 80)

      if (allHighScores) {
        // High performance detected - candidate for mastery verification
        // (Full mastery verification requires additional checks: multiple types, calibration, time-spacing)
        // For now, we'll continue session but flag this for mastery check
        return false
      }
    }

    // Check for excessive question count (fatigue indicator)
    if (session.questionCount >= AdaptiveSessionOrchestrator.MAX_QUESTIONS_BEFORE_FATIGUE * 2) {
      return true
    }

    return false
  }

  /**
   * Recalibrate session difficulty mid-session based on trend change
   *
   * AC#8: Re-calibrate difficulty mid-session if trend changes
   * Detects when performance trend shifts significantly (improving vs declining)
   *
   * @param sessionStateId - Adaptive session state ID
   * @returns Promise<number> - New calibrated difficulty
   *
   * @example
   * ```typescript
   * const newDifficulty = await orchestrator.recalibrateSession(sessionId);
   * // Returns: 55 (recalibrated from 70 due to declining trend)
   * ```
   */
  async recalibrateSession(sessionStateId: string): Promise<number> {
    const session = await prisma.adaptiveSession.findUnique({
      where: { id: sessionStateId },
    })

    if (!session) {
      throw new Error(`Adaptive session ${sessionStateId} not found`)
    }

    const trajectory = (session.trajectory as any[]) || []

    if (trajectory.length < 4) {
      // Not enough data for recalibration
      return session.currentDifficulty
    }

    // Analyze performance trend (first half vs second half)
    const midpoint = Math.floor(trajectory.length / 2)
    const firstHalfScores = trajectory.slice(0, midpoint).map((t) => t.score)
    const secondHalfScores = trajectory.slice(midpoint).map((t) => t.score)

    const firstHalfAvg = firstHalfScores.reduce((a, b) => a + b, 0) / firstHalfScores.length
    const secondHalfAvg = secondHalfScores.reduce((a, b) => a + b, 0) / secondHalfScores.length

    const trendChange = secondHalfAvg - firstHalfAvg

    let recalibratedDifficulty = session.currentDifficulty

    // Significant improvement (>20 points) → increase difficulty
    if (trendChange > 20) {
      recalibratedDifficulty = Math.min(100, session.currentDifficulty + 20)
    }
    // Significant decline (>20 points) → decrease difficulty
    else if (trendChange < -20) {
      recalibratedDifficulty = Math.max(0, session.currentDifficulty - 20)
    }

    // Update session with recalibrated difficulty
    if (recalibratedDifficulty !== session.currentDifficulty) {
      await prisma.adaptiveSession.update({
        where: { id: sessionStateId },
        data: {
          currentDifficulty: recalibratedDifficulty,
        },
      })
    }

    return recalibratedDifficulty
  }

  /**
   * End session strategically (not abruptly)
   *
   * AC#8: End on confidence-building success
   * - If user struggled, give final easy question for confidence boost
   * - Generate comprehensive session summary
   *
   * @param sessionStateId - Adaptive session state ID
   * @returns Promise<SessionSummary> - Session summary with adaptation decisions
   *
   * @example
   * ```typescript
   * const summary = await orchestrator.endStrategically(sessionId);
   * // Returns: { totalQuestions: 5, difficultyProgression: [...], adaptations: [...] }
   * ```
   */
  async endStrategically(sessionStateId: string): Promise<SessionSummary> {
    const session = await prisma.adaptiveSession.findUnique({
      where: { id: sessionStateId },
    })

    if (!session) {
      throw new Error(`Adaptive session ${sessionStateId} not found`)
    }

    const trajectory = (session.trajectory as any[]) || []

    // Check if user struggled in recent questions (avg score < 70 in last 3)
    let struggledRecently = false
    if (trajectory.length >= 3) {
      const recentScores = trajectory.slice(-3).map((t) => t.score)
      const avgRecentScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
      struggledRecently = avgRecentScore < 70
    }

    // If struggled, offer one final easy question (difficulty - 20) for confidence
    if (struggledRecently && trajectory.length > 0) {
      const easyDifficulty = Math.max(0, session.currentDifficulty - 20)

      // Add placeholder final easy question to trajectory
      trajectory.push({
        questionId: `final_confidence_boost`,
        difficulty: easyDifficulty,
        score: 85, // Assume good performance on easy question
        adjustment: -20,
        timestamp: new Date(),
      })
    }

    // Calculate session duration
    const durationMs = Date.now() - session.createdAt.getTime()

    // Extract difficulty progression
    const difficultyProgression = trajectory.map((t, idx) => ({
      questionNum: idx + 1,
      difficulty: t.difficulty,
      score: t.score,
      adjustment: t.adjustment,
    }))

    // Extract adaptation decisions
    const adaptations: string[] = []
    trajectory.forEach((t, idx) => {
      if (t.adjustment > 0) {
        adaptations.push(
          `Q${idx + 1}: Increased difficulty +${t.adjustment} (score ${t.score}%)`
        )
      } else if (t.adjustment < 0) {
        adaptations.push(
          `Q${idx + 1}: Decreased difficulty ${t.adjustment} (score ${t.score}%)`
        )
      }
    })

    if (struggledRecently) {
      adaptations.push(`Final: Confidence-building easy question (strategic ending)`)
    }

    // Calculate efficiency score (questions asked vs baseline 15)
    const baselineQuestions = 15
    const efficiencyScore = Math.max(
      0,
      Math.round(((baselineQuestions - session.questionCount) / baselineQuestions) * 100)
    )

    // Count breaks recommended (from trajectory metadata if tracked)
    const breaksRecommended = 0 // Placeholder - would track in real implementation

    const summary: SessionSummary = {
      sessionId: sessionStateId,
      totalQuestions: session.questionCount,
      difficultyProgression,
      adaptations,
      finalKnowledgeEstimate: session.irtEstimate ?? undefined,
      masteryStatus: MasteryStatus.IN_PROGRESS, // Would query actual mastery verification
      durationMs,
      efficiencyScore,
      breaksRecommended,
    }

    // Update session with final trajectory
    await prisma.adaptiveSession.update({
      where: { id: sessionStateId },
      data: {
        trajectory,
      },
    })

    return summary
  }

  /**
   * Check if IRT has converged for early stopping
   *
   * AC#7: Assessment efficiency optimization (IRT-based)
   * - Target: 3-5 questions (not 20+)
   * - Stop early if confidence interval < 10 points and ≥ 3 questions
   *
   * @param questionCount - Number of questions asked
   * @param irtEstimate - Current IRT knowledge estimate (theta)
   * @param confidenceInterval - Confidence interval (±X at 95%)
   * @returns boolean - True if can stop early
   *
   * @example
   * ```typescript
   * const canStop = orchestrator.checkEarlyStop(5, 0.85, 8);
   * // Returns: true (5 questions, CI < 10)
   * ```
   */
  private checkEarlyStop(
    questionCount: number,
    irtEstimate?: number,
    confidenceInterval?: number
  ): boolean {
    // Need minimum questions
    if (questionCount < AdaptiveSessionOrchestrator.MIN_QUESTIONS_FOR_EARLY_STOP) {
      return false
    }

    // Need IRT estimate and confidence interval
    if (irtEstimate === undefined || confidenceInterval === undefined) {
      return false
    }

    // Check if confidence interval is narrow enough
    return confidenceInterval < AdaptiveSessionOrchestrator.IRT_CONFIDENCE_THRESHOLD
  }

  /**
   * Calculate efficiency metrics for current session
   *
   * @param questionsAsked - Number of questions asked so far
   * @param sessionStart - Session start time
   * @returns Efficiency metrics object
   *
   * @example
   * ```typescript
   * const metrics = orchestrator.calculateEfficiencyMetrics(5, sessionStart);
   * // Returns: { questionsAsked: 5, timeSaved: 67, efficiencyScore: 67 }
   * ```
   */
  private calculateEfficiencyMetrics(
    questionsAsked: number,
    sessionStart: Date
  ): {
    questionsAsked: number
    timeSaved: number
    efficiencyScore: number
  } {
    const baselineQuestions = 15 // Traditional assessment baseline
    const questionsSaved = Math.max(0, baselineQuestions - questionsAsked)
    const timeSaved = Math.round((questionsSaved / baselineQuestions) * 100)
    const efficiencyScore = timeSaved

    return {
      questionsAsked,
      timeSaved,
      efficiencyScore,
    }
  }
}

// Export singleton instance
export const adaptiveSessionOrchestrator = new AdaptiveSessionOrchestrator()
