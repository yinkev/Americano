// @ts-nocheck - Suppress TypeScript errors for vitest imports (project uses Jest)
/**
 * Unit Tests: GoalManager
 * Story 5.6 Task 5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GoalManager } from '../goal-manager'
import { prisma } from '@/lib/db'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    behavioralGoal: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    behavioralPattern: {
      findMany: vi.fn(),
    },
    userLearningProfile: {
      findUnique: vi.fn(),
    },
    studySession: {
      findMany: vi.fn(),
    },
    insightNotification: {
      create: vi.fn(),
    },
    achievement: {
      create: vi.fn(),
    },
  },
}))

describe('GoalManager', () => {
  const mockUserId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createGoal', () => {
    it('should create goal with valid input', async () => {
      const input = {
        goalType: 'STUDY_TIME_CONSISTENCY' as const,
        targetMetric: 'peakHourSessionsPerWeek',
        targetValue: 5,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }

      vi.mocked(prisma.userLearningProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: mockUserId,
        preferredStudyTimes: [{ dayOfWeek: -1, startHour: 7, endHour: 8 }],
        averageSessionDuration: 45,
        optimalSessionDuration: 50,
        contentPreferences: {},
        learningStyleProfile: {},
        personalizedForgettingCurve: {},
        lastAnalyzedAt: new Date(),
        dataQualityScore: 0.8,
        loadTolerance: null,
        avgCognitiveLoad: null,
        stressProfile: null,
      })
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([
        {
          id: 'session-1',
          userId: mockUserId,
          missionId: null,
          startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          completedAt: new Date(),
          durationMs: 30 * 60 * 1000,
          reviewsCompleted: 10,
          newCardsStudied: 5,
          sessionNotes: null,
          currentObjectiveIndex: 0,
          missionObjectives: null,
          objectiveCompletions: null,
        },
      ])
      vi.mocked(prisma.behavioralGoal.create).mockResolvedValue({
        id: 'goal-1',
        userId: mockUserId,
        goalType: 'STUDY_TIME_CONSISTENCY',
        title: 'Study during peak hours consistently',
        description: expect.any(String),
        targetMetric: 'peakHourSessionsPerWeek',
        currentValue: 1,
        targetValue: 5,
        deadline: input.deadline,
        status: 'ACTIVE',
        progressHistory: [
          {
            date: expect.any(String),
            value: 1,
            note: 'Goal created',
          },
        ],
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.insightNotification.create).mockResolvedValue({
        id: 'notif-1',
        userId: mockUserId,
        notificationType: 'NEW_PATTERN',
        title: 'New Goal Created',
        message: expect.any(String),
        priority: 'NORMAL',
        relatedEntityId: 'goal-1',
        relatedEntityType: 'goal',
        readAt: null,
        actionTaken: false,
        createdAt: new Date(),
      })

      const goal = await GoalManager.createGoal(mockUserId, input)

      expect(goal).toBeDefined()
      expect(goal.goalType).toBe('STUDY_TIME_CONSISTENCY')
      expect(goal.targetValue).toBe(5)
      expect(goal.status).toBe('ACTIVE')
    })

    it('should throw error if deadline exceeds 90 days', async () => {
      const input = {
        goalType: 'STUDY_TIME_CONSISTENCY' as const,
        targetMetric: 'peakHourSessionsPerWeek',
        targetValue: 5,
        deadline: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000), // 100 days
      }

      await expect(GoalManager.createGoal(mockUserId, input)).rejects.toThrow(
        /cannot exceed 90 days/,
      )
    })

    it('should throw error if targetValue <= currentValue', async () => {
      const input = {
        goalType: 'STUDY_TIME_CONSISTENCY' as const,
        targetMetric: 'peakHourSessionsPerWeek',
        targetValue: 1,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      vi.mocked(prisma.userLearningProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: mockUserId,
        preferredStudyTimes: [{ dayOfWeek: -1, startHour: 7, endHour: 8 }],
        averageSessionDuration: 45,
        optimalSessionDuration: 50,
        contentPreferences: {},
        learningStyleProfile: {},
        personalizedForgettingCurve: {},
        lastAnalyzedAt: new Date(),
        dataQualityScore: 0.8,
        loadTolerance: null,
        avgCognitiveLoad: null,
        stressProfile: null,
      })
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([
        {
          id: 'session-1',
          userId: mockUserId,
          missionId: null,
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 30 * 60 * 1000,
          reviewsCompleted: 10,
          newCardsStudied: 5,
          sessionNotes: null,
          currentObjectiveIndex: 0,
          missionObjectives: null,
          objectiveCompletions: null,
        },
        {
          id: 'session-2',
          userId: mockUserId,
          missionId: null,
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 30 * 60 * 1000,
          reviewsCompleted: 10,
          newCardsStudied: 5,
          sessionNotes: null,
          currentObjectiveIndex: 0,
          missionObjectives: null,
          objectiveCompletions: null,
        },
      ])

      await expect(GoalManager.createGoal(mockUserId, input)).rejects.toThrow(
        /must be greater than current value/,
      )
    })
  })

  describe('updateGoalProgress', () => {
    it('should update progress and trigger milestone notification', async () => {
      const goal = {
        id: 'goal-1',
        userId: mockUserId,
        goalType: 'STUDY_TIME_CONSISTENCY',
        title: 'Test Goal',
        description: 'Test',
        targetMetric: 'peakHourSessionsPerWeek',
        currentValue: 2,
        targetValue: 5,
        deadline: new Date(),
        status: 'ACTIVE' as const,
        progressHistory: [{ date: new Date().toISOString(), value: 1 }],
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.behavioralGoal.findUnique).mockResolvedValue(goal)
      vi.mocked(prisma.behavioralGoal.update).mockResolvedValue({
        ...goal,
        currentValue: 3,
      })
      vi.mocked(prisma.insightNotification.create).mockResolvedValue({
        id: 'notif-1',
        userId: mockUserId,
        notificationType: 'GOAL_PROGRESS_50',
        title: 'Halfway There!',
        message: expect.any(String),
        priority: 'NORMAL',
        relatedEntityId: 'goal-1',
        relatedEntityType: 'goal',
        readAt: null,
        actionTaken: false,
        createdAt: new Date(),
      })

      const result = await GoalManager.updateGoalProgress('goal-1', 3, 'Progress note')

      expect(result.goal.currentValue).toBe(3)
      expect(result.completed).toBe(false)
      expect(prisma.insightNotification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notificationType: 'GOAL_PROGRESS_50',
          }),
        }),
      )
    })

    it('should mark goal as completed when target reached', async () => {
      const goal = {
        id: 'goal-1',
        userId: mockUserId,
        goalType: 'STUDY_TIME_CONSISTENCY',
        title: 'Test Goal',
        description: 'Test',
        targetMetric: 'peakHourSessionsPerWeek',
        currentValue: 4,
        targetValue: 5,
        deadline: new Date(),
        status: 'ACTIVE' as const,
        progressHistory: [{ date: new Date().toISOString(), value: 1 }],
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.behavioralGoal.findUnique)
        .mockResolvedValueOnce(goal)
        .mockResolvedValueOnce(goal)
      vi.mocked(prisma.behavioralGoal.update)
        .mockResolvedValueOnce({
          ...goal,
          status: 'COMPLETED',
          completedAt: new Date(),
        })
        .mockResolvedValueOnce({
          ...goal,
          currentValue: 5,
          status: 'COMPLETED',
          completedAt: new Date(),
        })
      vi.mocked(prisma.behavioralGoal.count).mockResolvedValue(1)
      vi.mocked(prisma.achievement.create).mockResolvedValue({
        id: 'achievement-1',
        userId: mockUserId,
        type: 'OBJECTIVES_COMPLETED',
        name: 'STUDY_TIME_CONSISTENCY BRONZE',
        description: expect.any(String),
        tier: 'BRONZE',
        earnedAt: new Date(),
        metadata: null,
      })

      const result = await GoalManager.updateGoalProgress('goal-1', 5)

      expect(result.completed).toBe(true)
      expect(prisma.behavioralGoal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            completedAt: expect.any(Date),
          }),
        }),
      )
    })
  })

  describe('suggestGoals', () => {
    it('should suggest goals based on patterns', async () => {
      const mockPatterns = [
        {
          id: 'pattern-1',
          userId: mockUserId,
          patternType: 'OPTIMAL_STUDY_TIME',
          patternName: 'Morning peak',
          confidence: 0.85,
          evidence: {},
          occurrenceCount: 5,
          detectedAt: new Date(),
          lastSeenAt: new Date(),
        },
      ]

      const mockProfile = {
        id: 'profile-1',
        userId: mockUserId,
        preferredStudyTimes: [{ dayOfWeek: -1, startHour: 7, endHour: 8 }],
        averageSessionDuration: 45,
        optimalSessionDuration: 50,
        contentPreferences: {},
        learningStyleProfile: { visual: 0.6, auditory: 0.2, kinesthetic: 0.1, reading: 0.1 },
        personalizedForgettingCurve: {},
        lastAnalyzedAt: new Date(),
        dataQualityScore: 0.8,
        loadTolerance: null,
        avgCognitiveLoad: null,
        stressProfile: null,
      }

      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue(mockPatterns)
      vi.mocked(prisma.userLearningProfile.findUnique).mockResolvedValue(mockProfile)
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([])

      const suggestions = await GoalManager.suggestGoals(mockUserId)

      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toHaveProperty('template')
      expect(suggestions[0]).toHaveProperty('currentValue')
      expect(suggestions[0]).toHaveProperty('targetValue')
      expect(suggestions[0]).toHaveProperty('rationale')
      expect(suggestions[0]).toHaveProperty('confidence')
    })

    it('should suggest content diversification for skewed VARK', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: mockUserId,
        preferredStudyTimes: [],
        averageSessionDuration: 45,
        optimalSessionDuration: 50,
        contentPreferences: {},
        learningStyleProfile: {
          visual: 0.8, // Heavily skewed
          auditory: 0.1,
          kinesthetic: 0.05,
          reading: 0.05,
        },
        personalizedForgettingCurve: {},
        lastAnalyzedAt: new Date(),
        dataQualityScore: 0.8,
        loadTolerance: null,
        avgCognitiveLoad: null,
        stressProfile: null,
      }

      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue([])
      vi.mocked(prisma.userLearningProfile.findUnique).mockResolvedValue(mockProfile)
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([])

      const suggestions = await GoalManager.suggestGoals(mockUserId)

      const diversificationSuggestion = suggestions.find(
        (s) => s.template.type === 'CONTENT_DIVERSIFICATION',
      )
      expect(diversificationSuggestion).toBeDefined()
      expect(diversificationSuggestion?.rationale).toContain('skewed')
    })
  })

  describe('checkGoalCompletion', () => {
    it('should return true when goal is complete', async () => {
      const goal = {
        id: 'goal-1',
        userId: mockUserId,
        goalType: 'STUDY_TIME_CONSISTENCY',
        title: 'Test Goal',
        description: 'Test',
        targetMetric: 'peakHourSessionsPerWeek',
        currentValue: 5,
        targetValue: 5,
        deadline: new Date(),
        status: 'ACTIVE' as const,
        progressHistory: [],
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.behavioralGoal.findUnique).mockResolvedValue(goal)
      vi.mocked(prisma.behavioralGoal.update).mockResolvedValue({
        ...goal,
        status: 'COMPLETED',
        completedAt: new Date(),
      })
      vi.mocked(prisma.insightNotification.create).mockResolvedValue({
        id: 'notif-1',
        userId: mockUserId,
        notificationType: 'GOAL_ACHIEVED',
        title: 'Goal Achieved! 🎉',
        message: expect.any(String),
        priority: 'HIGH',
        relatedEntityId: 'goal-1',
        relatedEntityType: 'goal',
        readAt: null,
        actionTaken: false,
        createdAt: new Date(),
      })
      vi.mocked(prisma.behavioralGoal.count).mockResolvedValue(1)

      const completed = await GoalManager.checkGoalCompletion('goal-1', 5)

      expect(completed).toBe(true)
    })

    it('should return false when goal not yet complete', async () => {
      const goal = {
        id: 'goal-1',
        userId: mockUserId,
        goalType: 'STUDY_TIME_CONSISTENCY',
        title: 'Test Goal',
        description: 'Test',
        targetMetric: 'peakHourSessionsPerWeek',
        currentValue: 3,
        targetValue: 5,
        deadline: new Date(),
        status: 'ACTIVE' as const,
        progressHistory: [],
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.behavioralGoal.findUnique).mockResolvedValue(goal)

      const completed = await GoalManager.checkGoalCompletion('goal-1', 3)

      expect(completed).toBe(false)
    })
  })
})
