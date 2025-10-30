/**
 * Unit tests for Adaptive Session Orchestrator (Story 4.5 Task 7)
 *
 * Tests cover:
 * - AC#1: Initial difficulty calibration
 * - AC#2: Real-time difficulty adjustment
 * - AC#4: Mastery verification protocol
 * - AC#7: IRT-based early stopping
 * - AC#8: Adaptive session orchestration (breaks, recalibration, strategic ending)
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { MasteryStatus } from '@/generated/prisma'
import { AdaptiveSessionOrchestrator } from '@/lib/adaptive-session-orchestrator'

// Mock Prisma client
const mockPrisma = {
  adaptiveSession: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    update: jest.fn() as any,
  },
  validationResponse: {
    findMany: jest.fn() as any,
  },
  calibrationMetric: {
    findMany: jest.fn() as any,
  },
  masteryVerification: {
    findUnique: jest.fn() as any,
  },
}

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

describe('AdaptiveSessionOrchestrator', () => {
  let orchestrator: AdaptiveSessionOrchestrator

  beforeEach(() => {
    orchestrator = new AdaptiveSessionOrchestrator()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initializeAdaptiveSession', () => {
    it('AC#1: should calculate initial difficulty from user history', async () => {
      // Mock user with no history → default difficulty 50
      mockPrisma.validationResponse.findMany.mockResolvedValue([])
      mockPrisma.calibrationMetric.findMany.mockResolvedValue([])
      mockPrisma.adaptiveSession.create.mockResolvedValue({
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        initialDifficulty: 50,
        currentDifficulty: 50,
        questionCount: 0,
        trajectory: [],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const session = await orchestrator.initializeAdaptiveSession('user123', 'obj456')

      expect(session.initialDifficulty).toBe(50)
      expect(session.currentDifficulty).toBe(50)
      expect(session.questionCount).toBe(0)
      expect(session.trajectory).toEqual([])
      expect(mockPrisma.adaptiveSession.create).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          sessionId: null,
          initialDifficulty: 50,
          currentDifficulty: 50,
          questionCount: 0,
          trajectory: [],
        },
      })
    })

    it('AC#1: should adjust initial difficulty based on recent high performance', async () => {
      // Mock user with high recent scores (avg 90%)
      mockPrisma.validationResponse.findMany.mockResolvedValue(
        Array(10).fill({
          score: 0.9, // 90% converted to 0-1 scale
          respondedAt: new Date(),
          prompt: { objectiveId: 'obj456' },
        }) as any,
      )
      mockPrisma.calibrationMetric.findMany.mockResolvedValue([])
      mockPrisma.adaptiveSession.create.mockResolvedValue({
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        initialDifficulty: 90, // High difficulty for high performers
        currentDifficulty: 90,
        questionCount: 0,
        trajectory: [],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const session = await orchestrator.initializeAdaptiveSession('user123', 'obj456')

      // High performers should get high initial difficulty (90 + calibration adjustment)
      expect(session.initialDifficulty).toBeGreaterThanOrEqual(85)
    })

    it('should link to study session when sessionId provided', async () => {
      mockPrisma.validationResponse.findMany.mockResolvedValue([])
      mockPrisma.calibrationMetric.findMany.mockResolvedValue([])
      mockPrisma.adaptiveSession.create.mockResolvedValue({
        id: 'adaptive123',
        userId: 'user123',
        sessionId: 'study789',
        initialDifficulty: 50,
        currentDifficulty: 50,
        questionCount: 0,
        trajectory: [],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const session = await orchestrator.initializeAdaptiveSession('user123', 'obj456', 'study789')

      expect(session.sessionId).toBe('study789')
      expect(mockPrisma.adaptiveSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: 'study789',
        }),
      })
    })
  })

  describe('conductAdaptiveAssessment', () => {
    it('AC#2: should increase difficulty after high score (>85%)', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 1,
        trajectory: [
          {
            questionId: 'q1',
            difficulty: 60,
            score: 90, // High score
            adjustment: 0,
            timestamp: new Date(),
          },
        ],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const result = await orchestrator.conductAdaptiveAssessment('session123', 90)

      // Difficulty should increase by 15 points (90 > 85)
      expect(result.difficulty).toBe(75) // 60 + 15
      expect(mockPrisma.adaptiveSession.update).toHaveBeenCalledWith({
        where: { id: 'session123' },
        data: expect.objectContaining({
          currentDifficulty: 75,
          questionCount: 2,
        }),
      })
    })

    it('AC#2: should decrease difficulty after low score (<60%)', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 1,
        trajectory: [
          {
            questionId: 'q1',
            difficulty: 60,
            score: 45, // Low score
            adjustment: 0,
            timestamp: new Date(),
          },
        ],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const result = await orchestrator.conductAdaptiveAssessment('session123', 45)

      // Difficulty should decrease by 15 points (45 < 60)
      expect(result.difficulty).toBe(45) // 60 - 15
    })

    it('AC#2: should maintain difficulty for moderate scores (60-85%)', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 1,
        trajectory: [
          {
            questionId: 'q1',
            difficulty: 60,
            score: 75, // Moderate score
            adjustment: 0,
            timestamp: new Date(),
          },
        ],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const result = await orchestrator.conductAdaptiveAssessment('session123', 75)

      // Difficulty should maintain with slight variation (60 ± 5)
      expect(result.difficulty).toBeGreaterThanOrEqual(55)
      expect(result.difficulty).toBeLessThanOrEqual(65)
    })

    it('AC#2: should enforce max 3 adjustments per session', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 75,
        initialDifficulty: 50,
        questionCount: 4,
        trajectory: [
          { questionId: 'q1', difficulty: 50, score: 90, adjustment: 15, timestamp: new Date() },
          { questionId: 'q2', difficulty: 65, score: 90, adjustment: 15, timestamp: new Date() },
          { questionId: 'q3', difficulty: 80, score: 90, adjustment: 15, timestamp: new Date() },
          { questionId: 'q4', difficulty: 75, score: 90, adjustment: 0, timestamp: new Date() }, // 3rd adjustment already made
        ],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const result = await orchestrator.conductAdaptiveAssessment('session123', 90)

      // Difficulty should NOT change (max adjustments reached)
      expect(result.difficulty).toBe(75) // No change from current
    })

    it('AC#8: should calculate efficiency metrics', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 4,
        trajectory: [],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const result = await orchestrator.conductAdaptiveAssessment('session123')

      expect(result.efficiencyMetrics).toBeDefined()
      expect(result.efficiencyMetrics.questionsAsked).toBe(5) // 4 + 1 new
      // Baseline is 15, asked 5 → saved 10 → 67% efficiency
      expect(result.efficiencyMetrics.efficiencyScore).toBeGreaterThan(60)
    })
  })

  describe('checkBreakRecommendation', () => {
    it('AC#8: should recommend break after 10+ questions', () => {
      const { recommendBreak, breakReason } = orchestrator.checkBreakRecommendation(
        12,
        new Date(),
        [],
      )

      expect(recommendBreak).toBe(true)
      expect(breakReason).toContain('12 questions')
    })

    it('AC#8: should recommend break after 30+ minutes', () => {
      const sessionStart = new Date(Date.now() - 35 * 60 * 1000) // 35 minutes ago

      const { recommendBreak, breakReason } = orchestrator.checkBreakRecommendation(
        5,
        sessionStart,
        [],
      )

      expect(recommendBreak).toBe(true)
      expect(breakReason).toContain('30+ minutes')
    })

    it('AC#8: should recommend break on performance decline (2 consecutive drops > 15 points)', () => {
      const trajectory = [
        { score: 85, timestamp: new Date() },
        { score: 65, timestamp: new Date() }, // Drop of 20
        { score: 45, timestamp: new Date() }, // Drop of 20
      ]

      const { recommendBreak, breakReason } = orchestrator.checkBreakRecommendation(
        3,
        new Date(),
        trajectory,
      )

      expect(recommendBreak).toBe(true)
      expect(breakReason).toContain('Performance declining')
    })

    it('should not recommend break for normal session', () => {
      const trajectory = [
        { score: 75, timestamp: new Date() },
        { score: 80, timestamp: new Date() },
        { score: 78, timestamp: new Date() },
      ]

      const { recommendBreak } = orchestrator.checkBreakRecommendation(
        3,
        new Date(Date.now() - 10 * 60 * 1000), // 10 minutes
        trajectory,
      )

      expect(recommendBreak).toBe(false)
    })
  })

  describe('shouldTerminateSession', () => {
    it('AC#4: should terminate when mastery verified', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 80,
        initialDifficulty: 50,
        questionCount: 5,
        trajectory: [
          { questionId: 'q1', difficulty: 80, score: 85, adjustment: 0, timestamp: new Date() },
          { questionId: 'q2', difficulty: 80, score: 90, adjustment: 0, timestamp: new Date() },
          { questionId: 'q3', difficulty: 80, score: 88, adjustment: 0, timestamp: new Date() },
        ],
        irtEstimate: 0.85,
        confidenceInterval: 8,
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        updatedAt: new Date(),
      }

      const mockMastery = {
        id: 'mastery123',
        userId: 'user123',
        objectiveId: 'obj456',
        status: MasteryStatus.VERIFIED,
        verifiedAt: new Date(),
        criteria: {},
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.masteryVerification.findUnique.mockResolvedValue(mockMastery as any)

      const shouldTerminate = await orchestrator.shouldTerminateSession('session123', 'obj456')

      expect(shouldTerminate).toBe(true)
    })

    it('should terminate on user fatigue (30+ minutes)', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 8,
        trajectory: [],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.masteryVerification.findUnique.mockResolvedValue(null)

      const shouldTerminate = await orchestrator.shouldTerminateSession('session123', 'obj456')

      expect(shouldTerminate).toBe(true)
    })

    it('should terminate on excessive questions (20+)', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 22,
        trajectory: [],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.masteryVerification.findUnique.mockResolvedValue(null)

      const shouldTerminate = await orchestrator.shouldTerminateSession('session123', 'obj456')

      expect(shouldTerminate).toBe(true)
    })

    it('should not terminate for normal session', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 5,
        trajectory: [
          { questionId: 'q1', difficulty: 60, score: 75, adjustment: 0, timestamp: new Date() },
        ],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.masteryVerification.findUnique.mockResolvedValue(null)

      const shouldTerminate = await orchestrator.shouldTerminateSession('session123', 'obj456')

      expect(shouldTerminate).toBe(false)
    })
  })

  describe('recalibrateSession', () => {
    it('AC#8: should increase difficulty on improving trend (>20 point improvement)', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 6,
        trajectory: [
          { questionId: 'q1', difficulty: 60, score: 60, adjustment: 0, timestamp: new Date() },
          { questionId: 'q2', difficulty: 60, score: 65, adjustment: 0, timestamp: new Date() },
          { questionId: 'q3', difficulty: 60, score: 70, adjustment: 0, timestamp: new Date() },
          { questionId: 'q4', difficulty: 60, score: 85, adjustment: 0, timestamp: new Date() }, // First half avg: 62.5
          { questionId: 'q5', difficulty: 60, score: 90, adjustment: 0, timestamp: new Date() }, // Second half avg: 85
          { questionId: 'q6', difficulty: 60, score: 88, adjustment: 0, timestamp: new Date() },
        ],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const newDifficulty = await orchestrator.recalibrateSession('session123')

      // Should increase difficulty by 20 (trend improvement > 20)
      expect(newDifficulty).toBe(80) // 60 + 20
      expect(mockPrisma.adaptiveSession.update).toHaveBeenCalledWith({
        where: { id: 'session123' },
        data: {
          currentDifficulty: 80,
        },
      })
    })

    it('AC#8: should decrease difficulty on declining trend (>20 point decline)', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 70,
        initialDifficulty: 50,
        questionCount: 6,
        trajectory: [
          { questionId: 'q1', difficulty: 70, score: 85, adjustment: 0, timestamp: new Date() },
          { questionId: 'q2', difficulty: 70, score: 88, adjustment: 0, timestamp: new Date() },
          { questionId: 'q3', difficulty: 70, score: 90, adjustment: 0, timestamp: new Date() }, // First half avg: 87.7
          { questionId: 'q4', difficulty: 70, score: 65, adjustment: 0, timestamp: new Date() },
          { questionId: 'q5', difficulty: 70, score: 60, adjustment: 0, timestamp: new Date() }, // Second half avg: 63.3
          { questionId: 'q6', difficulty: 70, score: 65, adjustment: 0, timestamp: new Date() },
        ],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const newDifficulty = await orchestrator.recalibrateSession('session123')

      // Should decrease difficulty by 20 (trend decline > 20)
      expect(newDifficulty).toBe(50) // 70 - 20
    })

    it('should not recalibrate for stable trend', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 4,
        trajectory: [
          { questionId: 'q1', difficulty: 60, score: 75, adjustment: 0, timestamp: new Date() },
          { questionId: 'q2', difficulty: 60, score: 78, adjustment: 0, timestamp: new Date() },
          { questionId: 'q3', difficulty: 60, score: 76, adjustment: 0, timestamp: new Date() },
          { questionId: 'q4', difficulty: 60, score: 80, adjustment: 0, timestamp: new Date() },
        ],
        irtEstimate: null,
        confidenceInterval: null,
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)

      const newDifficulty = await orchestrator.recalibrateSession('session123')

      // Should maintain current difficulty (trend change < 20)
      expect(newDifficulty).toBe(60)
      expect(mockPrisma.adaptiveSession.update).not.toHaveBeenCalled()
    })
  })

  describe('endStrategically', () => {
    it('AC#8: should add confidence-building easy question if user struggled', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 70,
        initialDifficulty: 60,
        questionCount: 5,
        trajectory: [
          { questionId: 'q1', difficulty: 70, score: 75, adjustment: 0, timestamp: new Date() },
          { questionId: 'q2', difficulty: 70, score: 65, adjustment: 0, timestamp: new Date() },
          { questionId: 'q3', difficulty: 70, score: 60, adjustment: -15, timestamp: new Date() },
          { questionId: 'q4', difficulty: 55, score: 62, adjustment: 0, timestamp: new Date() },
          { questionId: 'q5', difficulty: 55, score: 58, adjustment: 0, timestamp: new Date() },
        ], // Recent avg: 60 (< 70 threshold)
        irtEstimate: 0.65,
        confidenceInterval: 12,
        createdAt: new Date(Date.now() - 12 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const summary = await orchestrator.endStrategically('session123')

      expect(summary.adaptations).toContainEqual(
        expect.stringContaining('Confidence-building easy question'),
      )
      // Check that update was called with modified trajectory
      expect(mockPrisma.adaptiveSession.update).toHaveBeenCalled()
    })

    it('should generate comprehensive session summary', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 70,
        initialDifficulty: 50,
        questionCount: 5,
        trajectory: [
          { questionId: 'q1', difficulty: 50, score: 90, adjustment: 15, timestamp: new Date() },
          { questionId: 'q2', difficulty: 65, score: 85, adjustment: 0, timestamp: new Date() },
          { questionId: 'q3', difficulty: 65, score: 45, adjustment: -15, timestamp: new Date() },
          { questionId: 'q4', difficulty: 50, score: 75, adjustment: 0, timestamp: new Date() },
          { questionId: 'q5', difficulty: 50, score: 80, adjustment: 0, timestamp: new Date() },
        ],
        irtEstimate: 0.72,
        confidenceInterval: 9,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const summary = await orchestrator.endStrategically('session123')

      expect(summary.sessionId).toBe('session123')
      expect(summary.totalQuestions).toBe(5)
      expect(summary.difficultyProgression).toHaveLength(5)
      expect(summary.adaptations).toContain(expect.stringContaining('Increased difficulty +15'))
      expect(summary.adaptations).toContain(expect.stringContaining('Decreased difficulty -15'))
      expect(summary.finalKnowledgeEstimate).toBe(0.72)
      expect(summary.efficiencyScore).toBeGreaterThan(0) // Efficiency vs baseline
    })

    it('should calculate efficiency score correctly', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 5, // 5 questions vs 15 baseline
        trajectory: [],
        irtEstimate: 0.75,
        confidenceInterval: 8,
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const summary = await orchestrator.endStrategically('session123')

      // Efficiency: (15 - 5) / 15 = 0.67 → 67%
      expect(summary.efficiencyScore).toBe(67)
    })
  })

  describe('IRT early stopping', () => {
    it('AC#7: should allow early stop when CI < 10 and >= 3 questions', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 3,
        trajectory: [],
        irtEstimate: 0.75,
        confidenceInterval: 8, // < 10 threshold
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const result = await orchestrator.conductAdaptiveAssessment('session123')

      expect(result.canStopEarly).toBe(true)
    })

    it('AC#7: should not allow early stop with wide CI', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 5,
        trajectory: [],
        irtEstimate: 0.75,
        confidenceInterval: 15, // > 10 threshold
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const result = await orchestrator.conductAdaptiveAssessment('session123')

      expect(result.canStopEarly).toBe(false)
    })

    it('AC#7: should not allow early stop with < 3 questions', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        sessionId: null,
        currentDifficulty: 60,
        initialDifficulty: 50,
        questionCount: 2, // < 3 minimum
        trajectory: [],
        irtEstimate: 0.75,
        confidenceInterval: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.adaptiveSession.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.adaptiveSession.update.mockResolvedValue({} as any)

      const result = await orchestrator.conductAdaptiveAssessment('session123')

      expect(result.canStopEarly).toBe(false)
    })
  })
})
