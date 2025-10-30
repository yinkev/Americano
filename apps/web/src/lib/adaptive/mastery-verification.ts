/**
 * Mastery Verification Engine
 *
 * Implements Story 4.5 AC#4: Mastery Verification Protocol
 *
 * Mastery criteria (ALL must be met):
 * 1. 3 consecutive assessments scoring > 80%
 * 2. Multiple assessment types (Comprehension, Reasoning, Application)
 * 3. Difficulty matches or exceeds user's complexity level
 * 4. Confidence calibration within ±15 points of score
 * 5. Time-spaced verification: ≥ 2 days between assessments
 *
 * Status: VERIFIED, IN_PROGRESS, NOT_STARTED
 */

import { differenceInDays } from 'date-fns'
import { prisma } from '@/lib/db'

export enum MasteryStatus {
  VERIFIED = 'VERIFIED',
  IN_PROGRESS = 'IN_PROGRESS',
  NOT_STARTED = 'NOT_STARTED',
}

export interface MasteryCriteria {
  consecutiveHighScores: boolean // 3 consecutive > 80%
  multipleAssessmentTypes: boolean // Comprehension, Reasoning, Application
  appropriateDifficulty: boolean // Difficulty matches complexity
  accurateCalibration: boolean // Confidence within ±15 points
  timeSpaced: boolean // ≥ 2 days spread
}

export interface MasteryProgress {
  status: MasteryStatus
  progress: MasteryCriteria
  verifiedAt?: Date
  nextSteps: string[]
  recentAssessments: Array<{
    type: string
    score: number
    date: Date
    calibrationDelta: number
  }>
}

export class MasteryVerificationEngine {
  /**
   * Check mastery progress for a learning objective
   *
   * Analyzes recent validation responses and scenario responses
   * Returns current status and what criteria are still needed
   */
  async checkMasteryProgress(userId: string, objectiveId: string): Promise<MasteryProgress> {
    // Get objective complexity level for difficulty matching
    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
      select: { complexity: true },
    })

    if (!objective) {
      throw new Error(`Learning objective ${objectiveId} not found`)
    }

    // Get recent validation responses (comprehension)
    const validationResponses = await prisma.validationResponse.findMany({
      where: {
        userId,
        prompt: {
          objectiveId,
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
      take: 10,
      include: {
        prompt: true,
      },
    })

    // Get recent scenario responses (clinical reasoning)
    const scenarioResponses = await prisma.scenarioResponse.findMany({
      where: {
        userId,
        scenario: {
          objectiveId,
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
      take: 10,
      include: {
        scenario: true,
      },
    })

    // Combine and sort all responses by date
    const allResponses = [
      ...validationResponses.map((r) => ({
        type: 'COMPREHENSION',
        score: r.score * 100, // Convert 0-1 to 0-100
        date: r.respondedAt,
        calibrationDelta: r.calibrationDelta || 0,
        difficulty: r.initialDifficulty || 50,
      })),
      ...scenarioResponses.map((r) => ({
        type: 'CLINICAL_REASONING',
        score: r.score,
        date: r.respondedAt,
        calibrationDelta: 0, // Scenarios don't have calibration yet
        difficulty:
          r.scenario.difficulty === 'ADVANCED'
            ? 80
            : r.scenario.difficulty === 'INTERMEDIATE'
              ? 50
              : 20,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime())

    // Check each criterion
    const criteria = this.evaluateCriteria(allResponses, objective.complexity)

    // Determine status
    let status: MasteryStatus
    if (Object.values(criteria).every((c) => c === true)) {
      status = MasteryStatus.VERIFIED
    } else if (allResponses.length > 0) {
      status = MasteryStatus.IN_PROGRESS
    } else {
      status = MasteryStatus.NOT_STARTED
    }

    // Generate next steps
    const nextSteps = this.generateNextSteps(criteria, allResponses.length)

    return {
      status,
      progress: criteria,
      nextSteps,
      recentAssessments: allResponses.slice(0, 5),
    }
  }

  /**
   * Evaluate all mastery criteria
   */
  private evaluateCriteria(
    responses: Array<{
      type: string
      score: number
      date: Date
      calibrationDelta: number
      difficulty: number
    }>,
    objectiveComplexity: string,
  ): MasteryCriteria {
    // Criterion 1: 3 consecutive assessments > 80%
    const consecutiveHighScores = this.checkConsecutiveHighScores(responses)

    // Criterion 2: Multiple assessment types
    const multipleAssessmentTypes = this.checkMultipleTypes(responses)

    // Criterion 3: Appropriate difficulty
    const appropriateDifficulty = this.checkAppropriateDifficulty(responses, objectiveComplexity)

    // Criterion 4: Accurate calibration (within ±15 points)
    const accurateCalibration = this.checkAccurateCalibration(responses)

    // Criterion 5: Time-spaced (≥ 2 days)
    const timeSpaced = this.checkTimeSpacing(responses)

    return {
      consecutiveHighScores,
      multipleAssessmentTypes,
      appropriateDifficulty,
      accurateCalibration,
      timeSpaced,
    }
  }

  /**
   * Check for 3 consecutive scores > 80%
   */
  private checkConsecutiveHighScores(responses: Array<{ score: number }>): boolean {
    if (responses.length < 3) return false

    const recent3 = responses.slice(0, 3)
    return recent3.every((r) => r.score > 80)
  }

  /**
   * Check for multiple assessment types (at least 2 different types)
   */
  private checkMultipleTypes(responses: Array<{ type: string }>): boolean {
    const types = new Set(responses.map((r) => r.type))
    return types.size >= 2
  }

  /**
   * Check if difficulty matches objective complexity
   *
   * BASIC: difficulty 0-40
   * INTERMEDIATE: difficulty 40-70
   * ADVANCED: difficulty 70-100
   */
  private checkAppropriateDifficulty(
    responses: Array<{ difficulty: number }>,
    objectiveComplexity: string,
  ): boolean {
    if (responses.length === 0) return false

    const avgDifficulty = responses.reduce((sum, r) => sum + r.difficulty, 0) / responses.length

    switch (objectiveComplexity) {
      case 'BASIC':
        return avgDifficulty >= 0 // Any difficulty acceptable for basic
      case 'INTERMEDIATE':
        return avgDifficulty >= 40
      case 'ADVANCED':
        return avgDifficulty >= 70
      default:
        return false
    }
  }

  /**
   * Check calibration accuracy (within ±15 points)
   *
   * Requires at least 3 assessments with calibration data
   * Average |calibrationDelta| must be ≤ 15
   */
  private checkAccurateCalibration(responses: Array<{ calibrationDelta: number }>): boolean {
    const withCalibration = responses.filter((r) => r.calibrationDelta !== 0)
    if (withCalibration.length < 3) return false

    const avgAbsDelta =
      withCalibration.reduce((sum, r) => sum + Math.abs(r.calibrationDelta), 0) /
      withCalibration.length

    return avgAbsDelta <= 15
  }

  /**
   * Check time spacing (≥ 2 days between first and last of 3 high scores)
   */
  private checkTimeSpacing(responses: Array<{ score: number; date: Date }>): boolean {
    const highScores = responses.filter((r) => r.score > 80)
    if (highScores.length < 3) return false

    const dates = highScores.slice(0, 3).map((r) => r.date)
    const firstDate = dates[dates.length - 1] // Oldest of 3
    const lastDate = dates[0] // Most recent

    const daysDiff = differenceInDays(lastDate, firstDate)
    return daysDiff >= 2
  }

  /**
   * Generate actionable next steps based on missing criteria
   */
  private generateNextSteps(criteria: MasteryCriteria, responsesCount: number): string[] {
    const steps: string[] = []

    if (!criteria.consecutiveHighScores) {
      steps.push(
        responsesCount === 0
          ? 'Complete your first assessment to start mastery verification'
          : 'Achieve 3 consecutive assessments scoring above 80%',
      )
    }

    if (!criteria.multipleAssessmentTypes) {
      steps.push(
        'Complete both Comprehension and Clinical Reasoning assessments to demonstrate breadth',
      )
    }

    if (!criteria.appropriateDifficulty) {
      steps.push('Complete assessments at appropriate difficulty level for this concept complexity')
    }

    if (!criteria.accurateCalibration) {
      steps.push(
        'Improve confidence calibration - aim for confidence within ±15 points of actual score',
      )
    }

    if (!criteria.timeSpaced) {
      steps.push('Spread assessments across at least 2 days to demonstrate retention')
    }

    if (steps.length === 0) {
      steps.push('Mastery verified! You can now progress to higher complexity levels')
    }

    return steps
  }

  /**
   * Verify mastery and update objective status
   *
   * Called when all criteria are met
   * Returns verification timestamp
   */
  async verifyMastery(userId: string, objectiveId: string): Promise<Date> {
    const progress = await this.checkMasteryProgress(userId, objectiveId)

    if (progress.status !== MasteryStatus.VERIFIED) {
      throw new Error('Mastery criteria not yet met')
    }

    // Update learning objective mastery level
    await prisma.learningObjective.update({
      where: { id: objectiveId },
      data: {
        masteryLevel: 'MASTERED',
        lastStudiedAt: new Date(),
      },
    })

    return new Date()
  }
}
