/**
 * Type-safe helpers for Mission-related operations
 */

import type { Mission } from '@/generated/prisma'
import type { MissionObjective, ObjectiveCompletion } from './prisma-json'

/**
 * Type-safe getter for mission objectives
 */
export function getMissionObjectives(
  mission: Mission | { objectives: unknown },
): MissionObjective[] {
  if (!mission.objectives) return []

  // Prisma returns JSON fields as objects already
  if (Array.isArray(mission.objectives)) {
    return mission.objectives as unknown as MissionObjective[]
  }

  return []
}

/**
 * Type-safe getter for session objective completions
 */
export function getObjectiveCompletions(objectiveCompletions: unknown): ObjectiveCompletion[] {
  if (!objectiveCompletions) return []

  if (Array.isArray(objectiveCompletions)) {
    return objectiveCompletions as unknown as ObjectiveCompletion[]
  }

  return []
}

/**
 * Type-safe getter for session mission objectives
 */
export function getSessionMissionObjectives(missionObjectives: unknown): MissionObjective[] {
  if (!missionObjectives) return []

  if (Array.isArray(missionObjectives)) {
    return missionObjectives as unknown as MissionObjective[]
  }

  return []
}
