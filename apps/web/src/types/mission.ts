/**
 * Mission TypeScript Interfaces
 * Story 2.4: Daily Mission Generation and Display
 */

import type { LearningObjective } from '@/generated/prisma'

/**
 * MissionObjective represents a single learning objective within a mission
 * Stored as JSON in Mission.objectives field
 */
export interface MissionObjective {
  objectiveId: string
  objective?: LearningObjective // Nested objective data for display
  estimatedMinutes: number
  completed: boolean
  completedAt?: Date | string
  notes?: string
}

/**
 * Mission state machine transitions:
 * PENDING → IN_PROGRESS → COMPLETED
 * PENDING → IN_PROGRESS → SKIPPED
 * PENDING → (regenerate) → Deleted, new mission created
 */
export type MissionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'

/**
 * Mission with populated objectives for API responses
 */
export interface MissionWithObjectives {
  id: string
  userId: string
  date: Date | string
  status: MissionStatus
  estimatedMinutes: number
  actualMinutes?: number
  completedObjectivesCount: number
  completedAt?: Date | string
  objectives: MissionObjective[]
  reviewCardCount: number
  newContentCount: number
}

/**
 * Mission progress summary
 */
export interface MissionProgress {
  total: number
  completed: number
  percentage: number
  estimatedMinutesRemaining: number
  actualMinutesSpent: number
}

/**
 * Mission generation constraints
 */
export interface MissionGenerationConstraints {
  targetMinutes?: number // Default: 45-60 minutes
  minObjectives?: number // Default: 2
  maxObjectives?: number // Default: 4
  includeHighYield?: boolean // Default: true
  includeFSRSDue?: boolean // Default: true
  includeWeakAreas?: boolean // Default: true
}

/**
 * Prioritized objective for mission generation
 */
export interface PrioritizedObjective {
  objective: LearningObjective
  priorityScore: number
  reason: string // Why this objective was prioritized
}
