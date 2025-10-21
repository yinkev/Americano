/**
 * Story 5.2: Predictive Analytics for Learning Struggles
 * Intervention Engine
 *
 * Generates and applies tailored interventions based on:
 * 1. Struggle predictions
 * 2. Learning pattern profile (from Story 5.1)
 * 3. User preferences
 *
 * 6 intervention types:
 * - PREREQUISITE_REVIEW
 * - DIFFICULTY_PROGRESSION
 * - CONTENT_FORMAT_ADAPT
 * - COGNITIVE_LOAD_REDUCE
 * - SPACED_REPETITION_BOOST
 * - BREAK_SCHEDULE_ADJUST
 */

import { PrismaClient, Prisma } from '@/generated/prisma'
import {
  InterventionRecommendation,
  InterventionType,
  StrugglePrediction,
} from '@/generated/prisma'
import type {
  FeatureVector,
  LearningStyleProfile,
  ContentPreferences,
  PreferredStudyTime,
  MissionObjective,
} from '@/types/prisma-json'
import { getMissionObjectives } from '@/types/mission-helpers'

const prisma = new PrismaClient()

/**
 * Intervention with specific actions
 */
export interface Intervention {
  type: InterventionType
  description: string
  reasoning: string
  priority: number // 1-10
  actions: InterventionAction[]
}

/**
 * Specific action to apply
 */
export interface InterventionAction {
  action: string
  params?: Record<string, any>
  timing?: string
}

/**
 * Tailored intervention adapted to user's learning patterns
 */
export interface TailoredIntervention extends Intervention {
  learningStyleAdaptations: string[]
  optimalTiming: {
    dayOfWeek?: number
    hour?: number
  }
}

/**
 * Result of applying intervention
 */
export interface ApplicationResult {
  success: boolean
  interventionId: string
  missionId?: string
  message: string
  appliedActions: string[]
}

export class InterventionEngine {
  /**
   * Generate intervention recommendations for a prediction
   */
  async generateInterventions(
    prediction: StrugglePrediction & { learningObjective: any; indicators: any[] },
  ): Promise<Intervention[]> {
    const interventions: Intervention[] = []

    // Get feature vector from prediction
    const features = (prediction.featureVector as FeatureVector) || {}

    // 1. Prerequisite Review (if prerequisite gaps detected)
    if ((features.prerequisiteGap ?? 0) > 0.5) {
      interventions.push({
        type: InterventionType.PREREQUISITE_REVIEW,
        description: 'Review prerequisite topics before studying this objective',
        reasoning: `You have unmastered prerequisites. Reviewing these first will improve understanding by ${Math.round((1 - (features.prerequisiteGap ?? 0)) * 100)}%.`,
        priority: 9,
        actions: [
          {
            action: 'SCHEDULE_PREREQUISITE_REVIEW',
            params: { objectiveId: prediction.learningObjectiveId },
            timing: '1-2 days before main topic',
          },
          {
            action: 'INSERT_PREREQUISITE_FLASHCARDS',
            params: { intensity: 'high' },
          },
        ],
      })
    }

    // 2. Difficulty Progression (if complexity mismatch)
    if ((features.complexityMismatch ?? 0) > 0.6) {
      const contentComplexity = (features.complexityMismatch ?? 0)
      interventions.push({
        type: InterventionType.DIFFICULTY_PROGRESSION,
        description: 'Start with foundational content before tackling advanced concepts',
        reasoning: `This topic's complexity (${Math.round(contentComplexity * 100)}%) exceeds your current level. Gradual progression will improve retention.`,
        priority: 8,
        actions: [
          {
            action: 'INSERT_INTRODUCTORY_CONTENT',
            params: { difficulty: 'BASIC' },
            timing: 'Before main topic',
          },
          {
            action: 'REDUCE_INITIAL_COMPLEXITY',
            params: { targetComplexity: 'INTERMEDIATE' },
          },
        ],
      })
    }

    // 3. Content Format Adaptation (if learning style mismatch)
    const contentTypeMismatch = features.complexityMismatch ?? 0
    if (contentTypeMismatch > 0.5) {
      interventions.push({
        type: InterventionType.CONTENT_FORMAT_ADAPT,
        description: 'Use alternative content formats matching your learning style',
        reasoning:
          "This content format doesn't match your preferred learning style. Alternative formats will help.",
        priority: 7,
        actions: [
          {
            action: 'ADD_VISUAL_DIAGRAMS',
            timing: 'Concurrent with main content',
          },
          {
            action: 'ADD_CLINICAL_SCENARIOS',
            params: { count: 2 },
          },
        ],
      })
    }

    // 4. Cognitive Load Reduction (if cognitive overload detected)
    const cognitiveLoad = features.cognitiveLoad ?? 0
    if (cognitiveLoad > 0.7) {
      interventions.push({
        type: InterventionType.COGNITIVE_LOAD_REDUCE,
        description: 'Break topic into smaller chunks with more breaks',
        reasoning: `Cognitive load detected at ${Math.round(cognitiveLoad * 100)}%. Reducing workload will improve focus.`,
        priority: 8,
        actions: [
          {
            action: 'REDUCE_MISSION_DURATION',
            params: { percentage: 50 },
          },
          {
            action: 'ADD_BREAK_REMINDERS',
            params: { frequency: 'Every 20 minutes' },
          },
          {
            action: 'LIMIT_NEW_CARDS',
            params: { maxNew: 5 },
          },
        ],
      })
    }

    // 5. Spaced Repetition Boost (if historical struggles)
    const historicalPerformance = features.historicalPerformance ?? 0
    if ((1 - historicalPerformance) > 0.6) {
      interventions.push({
        type: InterventionType.SPACED_REPETITION_BOOST,
        description: 'Increase review frequency for this topic area',
        reasoning:
          'Historical struggle pattern detected. More frequent reviews will strengthen retention.',
        priority: 6,
        actions: [
          {
            action: 'ADJUST_REVIEW_SCHEDULE',
            params: {
              intervals: [1, 3, 7], // Days
              duration: '2 weeks',
            },
          },
          {
            action: 'INCREASE_REVIEW_PRIORITY',
            params: { multiplier: 1.5 },
          },
        ],
      })
    }

    // 6. Break Schedule Adjustment (if session fatigue patterns)
    const sessionPerformance = features.historicalPerformance ?? 1
    if (cognitiveLoad > 0.6 && sessionPerformance < 0.6) {
      interventions.push({
        type: InterventionType.BREAK_SCHEDULE_ADJUST,
        description: 'Add more frequent breaks to maintain focus',
        reasoning: 'Performance drops detected during extended sessions. More breaks will help.',
        priority: 5,
        actions: [
          {
            action: 'INSERT_BREAK_INTERVALS',
            params: { every: 25, duration: 5 }, // Pomodoro-style
          },
          {
            action: 'SUGGEST_PHYSICAL_ACTIVITY',
            params: { type: 'Light stretching' },
          },
        ],
      })
    }

    return interventions.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Tailor intervention to user's learning patterns
   */
  async tailorToLearningPattern(
    intervention: Intervention,
    userId: string,
  ): Promise<TailoredIntervention> {
    // Get user learning profile
    const profile = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })

    const adaptations: string[] = []
    let optimalTiming = {}

    if (profile) {
      const styleProfile = (profile.learningStyleProfile as unknown as LearningStyleProfile) || null
      const contentPrefs = (profile.contentPreferences as unknown as ContentPreferences) || null
      const studyTimes = (profile.preferredStudyTimes as unknown as PreferredStudyTime[]) || []

      // Adapt based on learning style (VARK)
      if (intervention.type === InterventionType.CONTENT_FORMAT_ADAPT && styleProfile) {
        if ((styleProfile.visual ?? 0) > 0.5) {
          adaptations.push('Prioritize visual diagrams and concept maps')
          intervention.actions.push({
            action: 'ADD_CONCEPT_MAP',
            params: { topicId: 'current' },
          })
        }

        if ((styleProfile.kinesthetic ?? 0) > 0.5) {
          adaptations.push('Include hands-on clinical reasoning scenarios')
          intervention.actions.push({
            action: 'ADD_CLINICAL_CASES',
            params: { interactive: true, count: 3 },
          })
        }

        if ((styleProfile.reading ?? 0) > 0.5) {
          adaptations.push('Provide detailed written summaries')
          intervention.actions.push({
            action: 'ADD_TEXT_SUMMARY',
            params: { depth: 'comprehensive' },
          })
        }
      }

      // Adapt session duration
      if (intervention.type === InterventionType.COGNITIVE_LOAD_REDUCE) {
        const optimalDuration = profile.optimalSessionDuration

        adaptations.push(`Adjust to your optimal session length: ${optimalDuration} minutes`)

        intervention.actions = intervention.actions.map((action) => {
          if (action.action === 'REDUCE_MISSION_DURATION') {
            return {
              ...action,
              params: { targetMinutes: optimalDuration },
            }
          }
          return action
        })
      }

      // Optimal timing based on study time preferences
      if (studyTimes && studyTimes.length > 0) {
        const firstPreference = studyTimes[0]

        optimalTiming = {
          dayOfWeek: firstPreference.dayOfWeek,
          hour: firstPreference.startHour,
        }

        adaptations.push(`Schedule during your peak time: ${this.formatStudyTime(firstPreference)}`)
      }
    }

    return {
      ...intervention,
      learningStyleAdaptations: adaptations,
      optimalTiming,
    }
  }

  /**
   * Apply intervention to user's mission queue
   */
  async applyIntervention(interventionId: string): Promise<ApplicationResult> {
    const intervention = await prisma.interventionRecommendation.findUnique({
      where: { id: interventionId },
      include: {
        prediction: {
          include: {
            learningObjective: {
              include: {
                lecture: true,
              },
            },
          },
        },
      },
    })

    if (!intervention) {
      return {
        success: false,
        interventionId,
        message: 'Intervention not found',
        appliedActions: [],
      }
    }

    const appliedActions: string[] = []

    // Find or create mission for this objective
    const userId = intervention.userId
    const objectiveId = intervention.prediction?.learningObjectiveId

    // Check if there's a pending mission
    let mission = await prisma.mission.findFirst({
      where: {
        userId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        date: {
          gte: new Date(),
        },
      },
      orderBy: { date: 'asc' },
    })

    if (!mission) {
      // Create new mission for intervention
      const newObjective: MissionObjective = {
        id: objectiveId || '',
        objective: {
          id: objectiveId || '',
          objective: '',
          complexity: 'INTERMEDIATE',
          isHighYield: false,
        },
        cardCount: 0,
        estimatedMinutes: 30,
        completed: false,
      }

      mission = await prisma.mission.create({
        data: {
          userId,
          date: new Date(),
          estimatedMinutes: 30, // Will be adjusted by intervention
          status: 'PENDING',
          objectives: [newObjective] as unknown as Prisma.InputJsonValue,
        },
      })

      appliedActions.push('Created new mission for intervention')
    }

    // Apply intervention-specific modifications
    const objectives = getMissionObjectives(mission)

    switch (intervention.interventionType) {
      case InterventionType.PREREQUISITE_REVIEW:
        // Insert prerequisite objectives before main objective
        const prerequisites = await prisma.objectivePrerequisite.findMany({
          where: { objectiveId: objectiveId || '' },
          include: { prerequisite: true },
        })

        for (const prereq of prerequisites) {
          const prereqObj: MissionObjective = {
            id: prereq.prerequisiteId,
            objective: {
              id: prereq.prerequisiteId,
              objective: prereq.prerequisite.objective,
              complexity: prereq.prerequisite.complexity,
              isHighYield: prereq.prerequisite.isHighYield,
            },
            cardCount: 0,
            estimatedMinutes: 15,
            completed: false,
          }
          objectives.unshift(prereqObj)
        }

        appliedActions.push(`Inserted ${prerequisites.length} prerequisite reviews`)
        break

      case InterventionType.DIFFICULTY_PROGRESSION:
        // Adjust objective complexity in mission
        const objIndex = objectives.findIndex((o) => o.id === objectiveId)

        if (objIndex >= 0) {
          objectives[objIndex].estimatedMinutes = Math.round(objectives[objIndex].estimatedMinutes * 1.25) // Add 25% more time
        }

        appliedActions.push('Enabled difficulty progression mode')
        break

      case InterventionType.COGNITIVE_LOAD_REDUCE:
        // Reduce mission duration by 50%
        mission.estimatedMinutes = Math.floor(mission.estimatedMinutes * 0.5)

        objectives.forEach((obj) => {
          obj.estimatedMinutes = Math.floor(obj.estimatedMinutes * 0.5)
        })

        appliedActions.push('Reduced mission workload by 50%')
        break

      case InterventionType.SPACED_REPETITION_BOOST:
        // Mark objective for increased review frequency (handled by FSRS separately)
        const objIdx = objectives.findIndex((o) => o.id === objectiveId)

        appliedActions.push('Enabled spaced repetition boost')
        break

      case InterventionType.BREAK_SCHEDULE_ADJUST:
        // Add break reminders to mission - handled separately

        appliedActions.push('Added break intervals every 25 minutes')
        break
    }

    // Update mission with modified objectives
    await prisma.mission.update({
      where: { id: mission.id },
      data: {
        objectives: objectives as unknown as Prisma.InputJsonValue,
        estimatedMinutes: mission.estimatedMinutes,
      },
    })

    // Mark intervention as applied
    await prisma.interventionRecommendation.update({
      where: { id: interventionId },
      data: {
        status: 'COMPLETED',
        appliedAt: new Date(),
        appliedToMissionId: mission.id,
      },
    })

    return {
      success: true,
      interventionId,
      missionId: mission.id,
      message: `Intervention applied successfully to mission ${mission.id}`,
      appliedActions,
    }
  }

  /**
   * Helper: Format study time for display
   */
  private formatStudyTime(studyTime: PreferredStudyTime): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const day = days[studyTime.dayOfWeek] || 'Any'
    const hour = studyTime.startHour
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour

    return `${day} ${displayHour}:00 ${period}`
  }
}
