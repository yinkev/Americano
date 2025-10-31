/**
 * Mastery Verification Engine (Story 4.5 Task 6)
 *
 * Implements the multi-dimensional mastery verification protocol with 5 criteria:
 * 1. Consecutive high scores (3+ assessments > 80%)
 * 2. Multiple assessment types (comprehension, reasoning, application)
 * 3. Difficulty matches complexity level
 * 4. Confidence calibration accurate (within ±15 points)
 * 5. Time-spaced verification (≥2 days between assessments)
 *
 * @module mastery-verification-engine
 */

import { differenceInDays, subDays } from 'date-fns'
import type { MasteryStatus } from '@/generated/prisma'
import { prisma } from '@/lib/db'

// ============================================
// Type Definitions
// ============================================

/**
 * Individual mastery criterion check result
 */
export interface CriterionCheck {
  met: boolean
  progress: number // 0.0-1.0 progress toward meeting this criterion
  details: string
}

/**
 * All 5 mastery verification criteria with results
 */
export interface MasteryCriteria {
  consecutiveHighScores: CriterionCheck // Criterion 1
  multipleAssessmentTypes: CriterionCheck // Criterion 2
  difficultyMatch: CriterionCheck // Criterion 3
  calibrationAccuracy: CriterionCheck // Criterion 4
  timeSpacing: CriterionCheck // Criterion 5
}

/**
 * Mastery verification status result
 */
export interface MasteryVerificationResult {
  status: MasteryStatus
  criteria: MasteryCriteria
  overallProgress: number // 0.0-1.0 (average of all criteria progress)
  verifiedAt?: Date
  nextSteps: string[] // Actionable guidance for the user
}

/**
 * Assessment type for mastery verification
 */
export type AssessmentType = 'COMPREHENSION' | 'REASONING' | 'APPLICATION'

/**
 * Recent assessment for mastery checking
 */
interface RecentAssessment {
  id: string
  score: number // 0-100 scale
  type: AssessmentType
  difficulty: number // 0-100 scale
  confidenceLevel?: number // 1-5 scale
  calibrationDelta?: number
  respondedAt: Date
}

// ============================================
// Constants
// ============================================

const MASTERY_SCORE_THRESHOLD = 80 // Minimum score for high performance
const CONSECUTIVE_REQUIRED = 3 // Number of consecutive high scores needed
const CALIBRATION_TOLERANCE = 15 // ±15 points calibration acceptable range
const MIN_DAYS_SPACING = 2 // Minimum days between assessments
const MIN_ASSESSMENT_TYPES = 2 // Minimum different assessment types required

// ============================================
// Mastery Verification Engine
// ============================================

/**
 * Check if user has achieved mastery on a learning objective
 * Evaluates all 5 mastery criteria and returns detailed status
 *
 * @param userId - User ID
 * @param objectiveId - Learning objective ID
 * @returns Mastery verification result with criteria breakdown
 */
export async function checkMasteryStatus(
  userId: string,
  objectiveId: string,
): Promise<MasteryVerificationResult> {
  // Fetch recent assessments for this objective (last 30 days, up to 50 assessments)
  const recentAssessments = await fetchRecentAssessments(userId, objectiveId, 30, 50)

  // Get the learning objective to check complexity level
  const objective = await prisma.learningObjective.findUnique({
    where: { id: objectiveId },
    select: { complexity: true },
  })

  if (!objective) {
    throw new Error(`Learning objective ${objectiveId} not found`)
  }

  // Check each of the 5 mastery criteria
  const criteria: MasteryCriteria = {
    consecutiveHighScores: checkConsecutiveHighScores(recentAssessments),
    multipleAssessmentTypes: checkMultipleAssessmentTypes(recentAssessments),
    difficultyMatch: checkDifficultyMatch(recentAssessments, objective.complexity),
    calibrationAccuracy: checkCalibrationAccuracy(recentAssessments),
    timeSpacing: checkTimeSpacing(recentAssessments),
  }

  // Calculate overall progress (average of all criteria)
  const overallProgress = calculateOverallProgress(criteria)

  // Determine mastery status
  const allCriteriaMet = Object.values(criteria).every((c) => c.met)
  const anyCriteriaProgress = Object.values(criteria).some((c) => c.progress > 0)

  let status: MasteryStatus
  if (allCriteriaMet) {
    status = 'VERIFIED'
  } else if (anyCriteriaProgress) {
    status = 'IN_PROGRESS'
  } else {
    status = 'NOT_STARTED'
  }

  // Generate next steps guidance
  const nextSteps = generateNextSteps(criteria, status)

  return {
    status,
    criteria,
    overallProgress,
    verifiedAt: allCriteriaMet ? new Date() : undefined,
    nextSteps,
  }
}

/**
 * Update mastery verification status in database
 * Creates or updates the MasteryVerification record
 *
 * @param userId - User ID
 * @param objectiveId - Learning objective ID
 * @param result - Mastery verification result
 */
export async function updateMasteryStatus(
  userId: string,
  objectiveId: string,
  result: MasteryVerificationResult,
): Promise<void> {
  // Serialize criteria to JSON for database storage
  const criteriaJson = {
    consecutiveHighScores: result.criteria.consecutiveHighScores.met,
    multipleAssessmentTypes: result.criteria.multipleAssessmentTypes.met,
    difficultyMatch: result.criteria.difficultyMatch.met,
    calibrationAccuracy: result.criteria.calibrationAccuracy.met,
    timeSpacing: result.criteria.timeSpacing.met,
  }

  // Upsert MasteryVerification record
  await prisma.masteryVerification.upsert({
    where: {
      userId_objectiveId: {
        userId,
        objectiveId,
      },
    },
    create: {
      userId,
      objectiveId,
      status: result.status,
      criteria: criteriaJson,
      verifiedAt: result.verifiedAt,
    },
    update: {
      status: result.status,
      criteria: criteriaJson,
      verifiedAt: result.verifiedAt,
      updatedAt: new Date(),
    },
  })
}

// ============================================
// Criterion Checking Functions
// ============================================

/**
 * Criterion 1: Check for 3+ consecutive assessments scoring >80%
 */
function checkConsecutiveHighScores(assessments: RecentAssessment[]): CriterionCheck {
  if (assessments.length === 0) {
    return {
      met: false,
      progress: 0,
      details: 'No assessments completed yet',
    }
  }

  // Sort assessments by date (most recent first)
  const sorted = [...assessments].sort((a, b) => b.respondedAt.getTime() - a.respondedAt.getTime())

  // Count consecutive high scores from most recent
  let consecutiveCount = 0
  for (const assessment of sorted) {
    if (assessment.score >= MASTERY_SCORE_THRESHOLD) {
      consecutiveCount++
    } else {
      break // Stop counting on first non-high score
    }
  }

  const progress = Math.min(consecutiveCount / CONSECUTIVE_REQUIRED, 1.0)
  const met = consecutiveCount >= CONSECUTIVE_REQUIRED

  return {
    met,
    progress,
    details: met
      ? `${consecutiveCount} consecutive high scores (≥80%) achieved`
      : `${consecutiveCount}/${CONSECUTIVE_REQUIRED} consecutive high scores (need ${CONSECUTIVE_REQUIRED - consecutiveCount} more)`,
  }
}

/**
 * Criterion 2: Check for multiple assessment types
 * (Comprehension, Reasoning, Application)
 */
function checkMultipleAssessmentTypes(assessments: RecentAssessment[]): CriterionCheck {
  const uniqueTypes = new Set(assessments.map((a) => a.type))
  const typesCount = uniqueTypes.size

  const progress = Math.min(typesCount / MIN_ASSESSMENT_TYPES, 1.0)
  const met = typesCount >= MIN_ASSESSMENT_TYPES

  const typesArray = Array.from(uniqueTypes)

  return {
    met,
    progress,
    details: met
      ? `Demonstrated competence across ${typesCount} types: ${typesArray.join(', ')}`
      : `Completed ${typesCount} type(s): ${typesArray.join(', ')}. Need ${MIN_ASSESSMENT_TYPES} types minimum.`,
  }
}

/**
 * Criterion 3: Check if difficulty matches objective complexity level
 * BASIC = 0-40, INTERMEDIATE = 41-70, ADVANCED = 71-100
 */
function checkDifficultyMatch(
  assessments: RecentAssessment[],
  complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED',
): CriterionCheck {
  if (assessments.length === 0) {
    return {
      met: false,
      progress: 0,
      details: 'No assessments completed yet',
    }
  }

  // Define difficulty ranges for each complexity level
  const difficultyRanges = {
    BASIC: { min: 0, max: 40 },
    INTERMEDIATE: { min: 41, max: 70 },
    ADVANCED: { min: 71, max: 100 },
  }

  const range = difficultyRanges[complexity]

  // Check high-scoring assessments that match difficulty
  const matchingAssessments = assessments.filter(
    (a) =>
      a.score >= MASTERY_SCORE_THRESHOLD && a.difficulty >= range.min && a.difficulty <= range.max,
  )

  const progress = Math.min(matchingAssessments.length / CONSECUTIVE_REQUIRED, 1.0)
  const met = matchingAssessments.length >= 1 // At least 1 high-scoring assessment at appropriate difficulty

  return {
    met,
    progress,
    details: met
      ? `High scores achieved at ${complexity} difficulty level`
      : `Need high scores at ${complexity} difficulty (${range.min}-${range.max})`,
  }
}

/**
 * Criterion 4: Check confidence calibration accuracy
 * Calibration delta should be within ±15 points
 */
function checkCalibrationAccuracy(assessments: RecentAssessment[]): CriterionCheck {
  const assessmentsWithCalibration = assessments.filter(
    (a) => a.calibrationDelta !== undefined && a.calibrationDelta !== null,
  )

  if (assessmentsWithCalibration.length === 0) {
    return {
      met: false,
      progress: 0,
      details: 'No calibration data available yet',
    }
  }

  // Count assessments with accurate calibration
  const wellCalibratedCount = assessmentsWithCalibration.filter(
    (a) => Math.abs(a.calibrationDelta!) <= CALIBRATION_TOLERANCE,
  ).length

  const progress = wellCalibratedCount / assessmentsWithCalibration.length
  const met = progress >= 0.66 // At least 2/3 of assessments well-calibrated

  return {
    met,
    progress,
    details: met
      ? `${wellCalibratedCount}/${assessmentsWithCalibration.length} assessments well-calibrated`
      : `${wellCalibratedCount}/${assessmentsWithCalibration.length} assessments within ±${CALIBRATION_TOLERANCE} points (need 66%+)`,
  }
}

/**
 * Criterion 5: Check time-spacing (≥2 days between first and last assessment)
 */
function checkTimeSpacing(assessments: RecentAssessment[]): CriterionCheck {
  if (assessments.length < CONSECUTIVE_REQUIRED) {
    return {
      met: false,
      progress: 0,
      details: `Need at least ${CONSECUTIVE_REQUIRED} assessments to check time spacing`,
    }
  }

  // Sort by date to get first and last
  const sorted = [...assessments].sort((a, b) => a.respondedAt.getTime() - b.respondedAt.getTime())
  const firstDate = sorted[0].respondedAt
  const lastDate = sorted[sorted.length - 1].respondedAt

  const daysDifference = differenceInDays(lastDate, firstDate)
  const progress = Math.min(daysDifference / MIN_DAYS_SPACING, 1.0)
  const met = daysDifference >= MIN_DAYS_SPACING

  return {
    met,
    progress,
    details: met
      ? `Assessments spread across ${daysDifference} days`
      : `Assessments span ${daysDifference} day(s) (need ${MIN_DAYS_SPACING}+ days)`,
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Fetch recent assessments for a user and objective
 * Combines ValidationResponse and ScenarioResponse data
 */
async function fetchRecentAssessments(
  userId: string,
  objectiveId: string,
  daysBack: number,
  limit: number,
): Promise<RecentAssessment[]> {
  const cutoffDate = subDays(new Date(), daysBack)

  // Fetch comprehension assessments (ValidationResponse)
  const comprehensionResponses = await prisma.validationResponse.findMany({
    where: {
      userId,
      prompt: {
        objectiveId,
      },
      respondedAt: {
        gte: cutoffDate,
      },
    },
    select: {
      id: true,
      score: true,
      respondedAt: true,
      confidenceLevel: true,
      calibrationDelta: true,
      // include minimal prompt fields needed for mapping
      prompt: {
        select: {
          promptType: true,
          difficultyLevel: true,
        },
      },
      // also keep initialDifficulty in case prompt difficulty is null
      initialDifficulty: true,
    },
    orderBy: {
      respondedAt: 'desc',
    },
    take: limit,
  })

  // Fetch clinical reasoning assessments (ScenarioResponse)
  const reasoningResponses = await prisma.scenarioResponse.findMany({
    where: {
      userId,
      scenario: {
        objectiveId,
      },
      respondedAt: {
        gte: cutoffDate,
      },
    },
    include: {
      scenario: {
        select: {
          difficulty: true,
        },
      },
    },
    orderBy: {
      respondedAt: 'desc',
    },
    take: limit,
  })

  // Map to unified RecentAssessment format
  const comprehensionAssessments: RecentAssessment[] = comprehensionResponses.map((r) => ({
    id: r.id,
    score: r.score * 100, // Convert 0.0-1.0 to 0-100
    type: r.prompt?.promptType === 'CLINICAL_REASONING' ? 'REASONING' : 'COMPREHENSION',
    // Coerce nullable difficulty fields to a sane numeric value (0-100)
    difficulty:
      (r.prompt?.difficultyLevel ?? (r.initialDifficulty ?? 0.5) * 100) as number,
    confidenceLevel: r.confidenceLevel ?? undefined,
    calibrationDelta: r.calibrationDelta ?? undefined,
    respondedAt: r.respondedAt,
  }))

  const reasoningAssessments: RecentAssessment[] = reasoningResponses.map((r) => ({
    id: r.id,
    score: r.score, // Already 0-100
    type: 'REASONING',
    difficulty: parseDifficultyString(r.scenario.difficulty),
    respondedAt: r.respondedAt,
  }))

  // Combine and sort by date (most recent first)
  const allAssessments = [...comprehensionAssessments, ...reasoningAssessments]
  allAssessments.sort((a, b) => b.respondedAt.getTime() - a.respondedAt.getTime())

  return allAssessments.slice(0, limit)
}

/**
 * Parse difficulty string to numeric value
 * BASIC = 20, INTERMEDIATE = 50, ADVANCED = 80
 */
function parseDifficultyString(difficulty: string): number {
  const mapping: Record<string, number> = {
    BASIC: 20,
    INTERMEDIATE: 50,
    ADVANCED: 80,
  }
  return mapping[difficulty.toUpperCase()] || 50
}

/**
 * Calculate overall progress as average of all criteria progress
 */
function calculateOverallProgress(criteria: MasteryCriteria): number {
  const progressValues = Object.values(criteria).map((c) => c.progress)
  const sum = progressValues.reduce((acc, val) => acc + val, 0)
  return sum / progressValues.length
}

/**
 * Generate actionable next steps based on criteria status
 */
function generateNextSteps(criteria: MasteryCriteria, status: MasteryStatus): string[] {
  if (status === 'VERIFIED') {
    return [
      'Congratulations! You have achieved mastery on this objective.',
      'Continue practicing to maintain your skills.',
      'Consider moving to more advanced topics.',
    ]
  }

  const steps: string[] = []

  if (!criteria.consecutiveHighScores.met) {
    steps.push(criteria.consecutiveHighScores.details)
  }

  if (!criteria.multipleAssessmentTypes.met) {
    steps.push('Try different assessment types to demonstrate broader competence')
  }

  if (!criteria.difficultyMatch.met) {
    steps.push(criteria.difficultyMatch.details)
  }

  if (!criteria.calibrationAccuracy.met) {
    steps.push('Work on calibrating your confidence to match your actual performance')
  }

  if (!criteria.timeSpacing.met) {
    steps.push('Allow more time between assessments for better retention verification')
  }

  return steps.length > 0
    ? steps
    : ['Keep working on assessments to build toward mastery verification']
}
