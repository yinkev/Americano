/**
 * Tests for Adaptive Difficulty Engine (Story 4.5 AC#1, AC#2, AC#5)
 *
 * Coverage:
 * - Initial difficulty calibration from performance history
 * - Real-time difficulty adjustment based on response quality
 * - Question selection with difficulty matching and cooldown
 * - Discrimination index calculation
 * - Complexity-to-difficulty mapping
 */

import { AdaptiveDifficultyEngine, DifficultyAdjustment, QuestionCriteria } from '@/lib/adaptive-difficulty-engine'
import { prisma } from '@/lib/db'
import { ObjectiveComplexity } from '@prisma/client'

jest.mock('@/lib/db')

describe('AdaptiveDifficultyEngine', () => {
  let engine: AdaptiveDifficultyEngine
  const userId = 'test-user-123'
  const objectiveId = 'test-objective-456'

  beforeEach(() => {
    jest.clearAllMocks()
    engine = new AdaptiveDifficultyEngine()
  })

  describe('calculateInitialDifficulty', () => {
    it('should return default difficulty (50) for user with no history', async () => {
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([])

      const difficulty = await engine.calculateInitialDifficulty(userId, objectiveId)

      expect(difficulty).toBe(50)
      expect(prisma.validationResponse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
          }),
        })
      )
    })

    it('should calculate baseline difficulty from 10 recent high-performing assessments', async () => {
      const mockResponses = Array.from({ length: 10 }, (_, i) => ({
        score: 0.85 + i * 0.01, // 0.85-0.94
        respondedAt: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000),
        prompt: { objectiveId },
      }))

      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses)

      const difficulty = await engine.calculateInitialDifficulty(userId, objectiveId)

      // Average score ~89%, should map to ~89 difficulty
      expect(difficulty).toBeGreaterThanOrEqual(80)
      expect(difficulty).toBeLessThanOrEqual(100)
    })

    it('should weight recent scores higher than older scores', async () => {
      const mockResponses = [
        {
          score: 0.95, // Recent high score
          respondedAt: new Date(),
          prompt: { objectiveId },
        },
        {
          score: 0.5, // Old low score
          respondedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          prompt: { objectiveId },
        },
      ]

      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses)

      const difficulty = await engine.calculateInitialDifficulty(userId, objectiveId)

      // Should be weighted toward recent high score
      expect(difficulty).toBeGreaterThan(72.5) // Average of 95 and 50
    })

    it('should increase difficulty when average score is >= 90%', async () => {
      const mockResponses = Array.from({ length: 5 }, () => ({
        score: 0.92,
        respondedAt: new Date(),
        prompt: { objectiveId },
      }))

      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses)

      const difficulty = await engine.calculateInitialDifficulty(userId, objectiveId)

      // Should be 92 + 10 adjustment for high performance
      expect(difficulty).toBeGreaterThanOrEqual(90)
    })

    it('should decrease difficulty when average score is < 70%', async () => {
      const mockResponses = Array.from({ length: 5 }, () => ({
        score: 0.65,
        respondedAt: new Date(),
        prompt: { objectiveId },
      }))

      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses)

      const difficulty = await engine.calculateInitialDifficulty(userId, objectiveId)

      // Should be 65 - 10 adjustment for low performance
      expect(difficulty).toBeLessThanOrEqual(60)
    })

    it('should clamp difficulty to valid range (0-100)', async () => {
      const mockResponses = [
        {
          score: 0.99,
          respondedAt: new Date(),
          prompt: { objectiveId },
        },
      ]

      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses)

      const difficulty = await engine.calculateInitialDifficulty(userId, objectiveId)

      expect(difficulty).toBeGreaterThanOrEqual(0)
      expect(difficulty).toBeLessThanOrEqual(100)
    })
  })

  describe('adjustDifficulty', () => {
    it('should increase difficulty by 15 points when score > 80%', () => {
      const adjustment = engine.adjustDifficulty(90, 50)

      expect(adjustment.newDifficulty).toBe(65)
      expect(adjustment.adjustment).toBe(15)
      expect(adjustment.reason).toContain('Excellent performance')
    })

    it('should decrease difficulty by 15 points when score < 60%', () => {
      const adjustment = engine.adjustDifficulty(45, 50)

      expect(adjustment.newDifficulty).toBe(35)
      expect(adjustment.adjustment).toBe(-15)
      expect(adjustment.reason).toContain('Needs more practice')
    })

    it('should maintain difficulty ± 5 points when score is 60-80%', () => {
      const adjustment = engine.adjustDifficulty(70, 50)

      expect(adjustment.newDifficulty).toBeGreaterThanOrEqual(45)
      expect(adjustment.newDifficulty).toBeLessThanOrEqual(55)
      expect(Math.abs(adjustment.adjustment)).toBeLessThanOrEqual(5)
      expect(adjustment.reason).toContain('Solid performance')
    })

    it('should clamp to minimum difficulty (0)', () => {
      const adjustment = engine.adjustDifficulty(45, 10)

      expect(adjustment.newDifficulty).toBe(0)
      expect(adjustment.reason).toContain('minimum')
    })

    it('should clamp to maximum difficulty (100)', () => {
      const adjustment = engine.adjustDifficulty(90, 95)

      expect(adjustment.newDifficulty).toBe(100)
      expect(adjustment.reason).toContain('maximum')
    })

    it('should include score in reason message', () => {
      const adjustment = engine.adjustDifficulty(88, 50)

      expect(adjustment.reason).toContain('88')
    })
  })

  describe('getQuestionByDifficulty', () => {
    const criteria: QuestionCriteria = {
      difficulty: 60,
      complexity: ObjectiveComplexity.INTERMEDIATE,
      userId,
      objectiveId,
    }

    it('should select question within difficulty range (±10 points)', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          promptText: 'Test',
          conceptName: 'Concept',
          difficultyLevel: 58,
          timesUsed: 1,
          lastUsedAt: null,
          discriminationIndex: 0.35,
        },
      ]

      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.validationPrompt.findMany as jest.Mock).mockResolvedValue(mockQuestions)

      const question = await engine.getQuestionByDifficulty(criteria)

      expect(question).not.toBeNull()
      expect(question?.difficultyLevel).toBeGreaterThanOrEqual(50)
      expect(question?.difficultyLevel).toBeLessThanOrEqual(70)
    })

    it('should exclude recently answered questions (14-day cooldown)', async () => {
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([
        { promptId: 'q1' },
        { promptId: 'q2' },
      ])
      ;(prisma.validationPrompt.findMany as jest.Mock).mockResolvedValue([])

      await engine.getQuestionByDifficulty(criteria)

      expect(prisma.validationPrompt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: expect.objectContaining({
              notIn: ['q1', 'q2'],
            }),
          }),
        })
      )
    })

    it('should prioritize unused questions', async () => {
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.validationPrompt.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'q1',
          difficultyLevel: 60,
          timesUsed: 5,
          lastUsedAt: null,
          discriminationIndex: 0.35,
        },
      ])

      await engine.getQuestionByDifficulty(criteria)

      expect(prisma.validationPrompt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.arrayContaining([{ timesUsed: 'asc' }]),
        })
      )
    })

    it('should exclude questions with poor discrimination (< 0.2)', async () => {
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.validationPrompt.findMany as jest.Mock).mockResolvedValue([])

      await engine.getQuestionByDifficulty(criteria)

      expect(prisma.validationPrompt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                discriminationIndex: null,
              }),
              expect.objectContaining({
                discriminationIndex: expect.objectContaining({
                  gte: 0.2,
                }),
              }),
            ]),
          }),
        })
      )
    })

    it('should return null when no questions available', async () => {
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.validationPrompt.findMany as jest.Mock).mockResolvedValue([])

      const question = await engine.getQuestionByDifficulty(criteria)

      expect(question).toBeNull()
    })

    it('should return question metadata with all fields', async () => {
      const mockQuestion = {
        id: 'q1',
        promptText: 'Test',
        conceptName: 'Concept',
        difficultyLevel: 60,
        timesUsed: 2,
        lastUsedAt: new Date('2025-01-01'),
        discriminationIndex: 0.45,
      }

      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.validationPrompt.findMany as jest.Mock).mockResolvedValue([mockQuestion])

      const question = await engine.getQuestionByDifficulty(criteria)

      expect(question).toEqual({
        id: 'q1',
        difficultyLevel: 60,
        complexity: ObjectiveComplexity.INTERMEDIATE,
        timesUsed: 2,
        lastUsedAt: '2025-01-01T00:00:00.000Z',
        discriminationIndex: 0.45,
      })
    })
  })

  describe('calculateDiscrimination', () => {
    const promptId = 'test-prompt-123'

    it('should return null when fewer than 20 responses', async () => {
      const mockResponses = Array.from({ length: 10 }, (_, i) => ({
        score: 0.5 + (i * 0.1),
        userId: `user${i}`,
      }))

      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses)

      const discrimination = await engine.calculateDiscrimination(promptId)

      expect(discrimination).toBeNull()
    })

    it('should calculate discrimination index from 20+ responses', async () => {
      const mockResponses = [
        ...Array.from({ length: 20 }, (_, i) => ({
          score: 0.9 - (i * 0.05), // Top performers: 0.9-0.05 = 0.85
          userId: `top-user${i}`,
        })),
        ...Array.from({ length: 20 }, (_, i) => ({
          score: 0.3 - (i * 0.01), // Bottom performers: 0.3-0.2 = 0.1
          userId: `bottom-user${i}`,
        })),
      ]

      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        mockResponses.sort((a, b) => b.score - a.score)
      )

      const discrimination = await engine.calculateDiscrimination(promptId)

      expect(discrimination).not.toBeNull()
      expect(discrimination).toBeGreaterThan(0)
      expect(discrimination).toBeLessThanOrEqual(1)
    })

    it('should correctly calculate top 27% and bottom 27% groups', async () => {
      const mockResponses = Array.from({ length: 100 }, (_, i) => ({
        score: i / 100, // 0.0 to 0.99
        userId: `user${i}`,
      }))
        .reverse() // Sort descending

      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses)

      const discrimination = await engine.calculateDiscrimination(promptId)

      // Top 27% (27 people) should have high scores (>0.72)
      // Bottom 27% (27 people) should have low scores (<0.27)
      expect(discrimination).toBeGreaterThan(0.4) // Good discrimination
    })
  })

  describe('shouldRemoveQuestion', () => {
    const promptId = 'test-prompt-456'

    it('should return false for questions with sufficient discrimination (>= 0.2)', async () => {
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          score: 0.8 - (i * 0.02),
          userId: `user${i}`,
        }))
          .sort((a, b) => b.score - a.score)
      )

      const shouldRemove = await engine.shouldRemoveQuestion(promptId)

      expect(shouldRemove).toBe(false)
    })

    it('should return true for questions with poor discrimination (< 0.2)', async () => {
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 20 }, () => ({
          score: 0.5, // All same score
          userId: `user${Math.random()}`,
        }))
      )

      const shouldRemove = await engine.shouldRemoveQuestion(promptId)

      expect(shouldRemove).toBe(true)
    })

    it('should return false when insufficient data', async () => {
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          score: 0.5 + (i * 0.02),
          userId: `user${i}`,
        }))
      )

      const shouldRemove = await engine.shouldRemoveQuestion(promptId)

      expect(shouldRemove).toBe(false)
    })
  })

  describe('mapDifficultyToComplexity', () => {
    it('should map difficulty 0-39 to BASIC', () => {
      expect(engine.mapDifficultyToComplexity(0)).toBe(ObjectiveComplexity.BASIC)
      expect(engine.mapDifficultyToComplexity(20)).toBe(ObjectiveComplexity.BASIC)
      expect(engine.mapDifficultyToComplexity(39)).toBe(ObjectiveComplexity.BASIC)
    })

    it('should map difficulty 40-69 to INTERMEDIATE', () => {
      expect(engine.mapDifficultyToComplexity(40)).toBe(ObjectiveComplexity.INTERMEDIATE)
      expect(engine.mapDifficultyToComplexity(50)).toBe(ObjectiveComplexity.INTERMEDIATE)
      expect(engine.mapDifficultyToComplexity(69)).toBe(ObjectiveComplexity.INTERMEDIATE)
    })

    it('should map difficulty 70-100 to ADVANCED', () => {
      expect(engine.mapDifficultyToComplexity(70)).toBe(ObjectiveComplexity.ADVANCED)
      expect(engine.mapDifficultyToComplexity(85)).toBe(ObjectiveComplexity.ADVANCED)
      expect(engine.mapDifficultyToComplexity(100)).toBe(ObjectiveComplexity.ADVANCED)
    })
  })

  describe('getDifficultyRangeForComplexity', () => {
    it('should return 0-40 for BASIC complexity', () => {
      const range = engine.getDifficultyRangeForComplexity(ObjectiveComplexity.BASIC)

      expect(range).toEqual({ min: 0, max: 40 })
    })

    it('should return 40-70 for INTERMEDIATE complexity', () => {
      const range = engine.getDifficultyRangeForComplexity(ObjectiveComplexity.INTERMEDIATE)

      expect(range).toEqual({ min: 40, max: 70 })
    })

    it('should return 70-100 for ADVANCED complexity', () => {
      const range = engine.getDifficultyRangeForComplexity(ObjectiveComplexity.ADVANCED)

      expect(range).toEqual({ min: 70, max: 100 })
    })
  })

  describe('edge cases', () => {
    it('should handle boundary score of exactly 80%', () => {
      const adjustment = engine.adjustDifficulty(80, 50)

      expect(adjustment.adjustment).toBe(0)
      expect(adjustment.reason).toContain('Solid performance')
    })

    it('should handle boundary score of exactly 60%', () => {
      const adjustment = engine.adjustDifficulty(60, 50)

      expect(adjustment.adjustment).toBe(0)
      expect(adjustment.reason).toContain('Solid performance')
    })

    it('should handle boundary score of 80.1%', () => {
      const adjustment = engine.adjustDifficulty(80.1, 50)

      expect(adjustment.adjustment).toBe(15)
    })

    it('should handle boundary score of 59.9%', () => {
      const adjustment = engine.adjustDifficulty(59.9, 50)

      expect(adjustment.adjustment).toBe(-15)
    })
  })
})
