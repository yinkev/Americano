/**
 * Prioritization Engine Types
 * Story 2.3: Intelligent Content Prioritization Algorithm
 */

import type { LearningObjective } from '@/generated/prisma'

/**
 * Priority Explanation Interface
 * Provides transparency for prioritization decisions
 */
export interface PriorityExplanation {
  objectiveId: string
  priorityScore: number // 0.0-1.0
  factors: PriorityFactor[]
  reasoning: string
  recommendations: string[]
  visualIndicator: '🔴 CRITICAL' | '🟠 HIGH' | '🟡 MEDIUM' | '🟢 LOW'
}

/**
 * Individual Factor Contribution
 */
export interface PriorityFactor {
  name: string
  value: number // Factor's raw value (0.0-1.0)
  weight: number // Factor's weight in formula (0.0-1.0, sum to 1.0)
  contribution: number // value * weight
  explanation: string
}

/**
 * Priority Context
 * Input data for calculating priority score
 */
export interface PriorityContext {
  userId: string
  objectiveId: string
  today?: Date
}

/**
 * Priority Filters
 * For querying prioritized objectives
 */
export interface PriorityFilters {
  courseId?: string
  minPriority?: number // 0.0-1.0
  excludeRecent?: boolean // Exclude objectives studied in last 24 hours
  limit?: number
}

/**
 * Prioritized Objective
 * Objective with calculated priority score
 */
export interface PrioritizedObjective {
  objective: LearningObjective & {
    lecture?: {
      id: string
      title: string
      courseId: string
      course: {
        name: string
      }
    }
  }
  priorityScore: number
  reason: string
}

/**
 * Exam Urgency Data
 */
export interface ExamUrgencyData {
  examId: string
  examName: string
  examDate: Date
  daysUntilExam: number
  urgencyScore: number // 0.0-1.0
}

/**
 * Prerequisite Data
 */
export interface PrerequisiteData {
  prerequisiteObjectives: Array<{
    id: string
    objective: string
    masteryLevel: string
  }>
  avgDependentWeakness: number // 0.0-1.0
  prerequisiteFactor: number // 0.0-1.0
}
