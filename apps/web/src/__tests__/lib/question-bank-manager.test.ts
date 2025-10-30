/**
 * Question Bank Manager Tests
 *
 * Tests for Story 4.5 Task 8 - Question Bank Manager
 *
 * Covers:
 * - Load question bank with metadata
 * - Filter by difficulty range (±10 points)
 * - Enforce 14-day cooldown
 * - Select best question (usage + discrimination)
 * - Update question stats (usage, discrimination)
 * - Flag poor questions (D < 0.2)
 */

import { prisma } from '@/lib/db'
import type { QuestionBankQuestion } from '@/lib/question-bank-manager'
import { QuestionBankManager } from '@/lib/question-bank-manager'

// Prisma is already mocked in jest.setup.ts
// We just need to cast it for TypeScript
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('QuestionBankManager', () => {
  let manager: QuestionBankManager

  beforeEach(() => {
    manager = new QuestionBankManager()
    jest.clearAllMocks()
  })

  describe('loadQuestionBank', () => {
    it('should load all questions for an objective', async () => {
      const mockQuestions = [
        {
          id: 'prompt1',
          promptText: 'Explain cardiac conduction',
          conceptName: 'Cardiac Electrophysiology',
          promptType: 'EXPLAIN_TO_PATIENT',
          difficultyLevel: 50,
          discriminationIndex: 0.45,
          timesUsed: 5,
          lastUsedAt: new Date('2025-10-01'),
          objectiveId: 'obj1',
        },
        {
          id: 'prompt2',
          promptText: 'Describe ECG findings',
          conceptName: 'ECG Interpretation',
          promptType: 'CLINICAL_REASONING',
          difficultyLevel: 60,
          discriminationIndex: 0.32,
          timesUsed: 2,
          lastUsedAt: new Date('2025-10-10'),
          objectiveId: 'obj1',
        },
      ]

      ;(mockPrisma.validationPrompt.findMany as jest.Mock).mockResolvedValue(mockQuestions as any)

      const questions = await manager.loadQuestionBank('obj1')

      expect(questions).toHaveLength(2)
      expect(questions[0].id).toBe('prompt1')
      expect(questions[1].id).toBe('prompt2')
      expect(prisma.validationPrompt.findMany).toHaveBeenCalledWith({
        where: { objectiveId: 'obj1' },
        select: expect.any(Object),
        orderBy: [{ timesUsed: 'asc' }, { discriminationIndex: 'desc' }],
      })
    })

    it('should return empty array if no questions found', async () => {
      ;(mockPrisma.validationPrompt.findMany as jest.Mock).mockResolvedValue([])

      const questions = await manager.loadQuestionBank('obj_nonexistent')

      expect(questions).toHaveLength(0)
    })
  })

  describe('filterByDifficulty', () => {
    const mockQuestions: QuestionBankQuestion[] = [
      {
        id: 'q1',
        promptText: 'Easy question',
        conceptName: 'Concept A',
        promptType: 'EXPLAIN_TO_PATIENT',
        difficultyLevel: 30,
        discriminationIndex: 0.4,
        timesUsed: 1,
        lastUsedAt: null,
        objectiveId: 'obj1',
      },
      {
        id: 'q2',
        promptText: 'Medium question',
        conceptName: 'Concept B',
        promptType: 'EXPLAIN_TO_PATIENT',
        difficultyLevel: 50,
        discriminationIndex: 0.5,
        timesUsed: 2,
        lastUsedAt: null,
        objectiveId: 'obj1',
      },
      {
        id: 'q3',
        promptText: 'Hard question',
        conceptName: 'Concept C',
        promptType: 'CLINICAL_REASONING',
        difficultyLevel: 80,
        discriminationIndex: 0.35,
        timesUsed: 0,
        lastUsedAt: null,
        objectiveId: 'obj1',
      },
    ]

    it('should filter questions within ±10 difficulty range', () => {
      const filtered = manager.filterByDifficulty(mockQuestions, 50)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('q2')
      expect(filtered[0].difficultyLevel).toBe(50)
    })

    it('should include questions at boundary (target - 10)', () => {
      const filtered = manager.filterByDifficulty(mockQuestions, 40)

      expect(filtered).toHaveLength(2) // q1 (30) and q2 (50)
      expect(filtered.some((q) => q.difficultyLevel === 30)).toBe(true)
      expect(filtered.some((q) => q.difficultyLevel === 50)).toBe(true)
    })

    it('should include questions at boundary (target + 10)', () => {
      const filtered = manager.filterByDifficulty(mockQuestions, 70)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].difficultyLevel).toBe(80)
    })

    it('should clamp to 0-100 range at boundaries', () => {
      // Target difficulty 5 should include questions 0-15
      const filtered = manager.filterByDifficulty(mockQuestions, 5)

      expect(filtered).toHaveLength(0) // No questions in 0-15 range
    })

    it('should return empty array if no questions in range', () => {
      const filtered = manager.filterByDifficulty(mockQuestions, 95)

      expect(filtered).toHaveLength(0)
    })
  })

  describe('enforceCooldown', () => {
    const mockQuestions: QuestionBankQuestion[] = [
      {
        id: 'q1',
        promptText: 'Question 1',
        conceptName: 'Concept A',
        promptType: 'EXPLAIN_TO_PATIENT',
        difficultyLevel: 50,
        discriminationIndex: 0.4,
        timesUsed: 2,
        lastUsedAt: new Date('2025-10-01'),
        objectiveId: 'obj1',
      },
      {
        id: 'q2',
        promptText: 'Question 2',
        conceptName: 'Concept B',
        promptType: 'CLINICAL_REASONING',
        difficultyLevel: 60,
        discriminationIndex: 0.5,
        timesUsed: 1,
        lastUsedAt: new Date('2025-09-01'),
        objectiveId: 'obj1',
      },
      {
        id: 'q3',
        promptText: 'Question 3',
        conceptName: 'Concept C',
        promptType: 'EXPLAIN_TO_PATIENT',
        difficultyLevel: 55,
        discriminationIndex: 0.3,
        timesUsed: 0,
        lastUsedAt: null,
        objectiveId: 'obj1',
      },
    ]

    it('should remove questions answered in last 14 days', async () => {
      const now = new Date('2025-10-15')
      jest.setSystemTime(now)

      // Mock: User answered q1 on 2025-10-10 (5 days ago - within cooldown)
      ;(mockPrisma.validationResponse.findMany as jest.Mock).mockResolvedValue([
        { promptId: 'q1' },
      ] as any)

      const filtered = await manager.enforceCooldown(mockQuestions, 'user1')

      expect(filtered).toHaveLength(2)
      expect(filtered.some((q) => q.id === 'q1')).toBe(false) // Excluded (within cooldown)
      expect(filtered.some((q) => q.id === 'q2')).toBe(true) // Included
      expect(filtered.some((q) => q.id === 'q3')).toBe(true) // Included
    })

    it('should include questions answered > 14 days ago', async () => {
      const now = new Date('2025-10-20')
      jest.setSystemTime(now)

      // Mock: User answered q1 on 2025-10-01 (19 days ago - outside cooldown)
      ;(mockPrisma.validationResponse.findMany as jest.Mock).mockResolvedValue([])

      const filtered = await manager.enforceCooldown(mockQuestions, 'user1')

      expect(filtered).toHaveLength(3) // All included
    })

    it('should include questions never answered', async () => {
      ;(mockPrisma.validationResponse.findMany as jest.Mock).mockResolvedValue([])

      const filtered = await manager.enforceCooldown(mockQuestions, 'user1')

      expect(filtered).toHaveLength(3)
    })
  })

  describe('selectBestQuestion', () => {
    const mockQuestions: QuestionBankQuestion[] = [
      {
        id: 'q1_unused_high_disc',
        promptText: 'Unused, high discrimination',
        conceptName: 'Concept A',
        promptType: 'EXPLAIN_TO_PATIENT',
        difficultyLevel: 50,
        discriminationIndex: 0.6,
        timesUsed: 0,
        lastUsedAt: null,
        objectiveId: 'obj1',
      },
      {
        id: 'q2_unused_low_disc',
        promptText: 'Unused, low discrimination',
        conceptName: 'Concept B',
        promptType: 'CLINICAL_REASONING',
        difficultyLevel: 55,
        discriminationIndex: 0.3,
        timesUsed: 0,
        lastUsedAt: null,
        objectiveId: 'obj1',
      },
      {
        id: 'q3_used_high_disc',
        promptText: 'Used once, high discrimination',
        conceptName: 'Concept C',
        promptType: 'EXPLAIN_TO_PATIENT',
        difficultyLevel: 52,
        discriminationIndex: 0.7,
        timesUsed: 1,
        lastUsedAt: new Date('2025-09-01'),
        objectiveId: 'obj1',
      },
      {
        id: 'q4_used_low_disc',
        promptText: 'Used twice, low discrimination',
        conceptName: 'Concept D',
        promptType: 'CLINICAL_REASONING',
        difficultyLevel: 48,
        discriminationIndex: 0.25,
        timesUsed: 2,
        lastUsedAt: new Date('2025-09-15'),
        objectiveId: 'obj1',
      },
    ]

    it('should prioritize unused questions with high discrimination', () => {
      const selected = manager.selectBestQuestion(mockQuestions, {
        preferUnused: true,
        sortByDiscrimination: true,
        excludeRecent: false,
      })

      expect(selected?.id).toBe('q1_unused_high_disc')
    })

    it('should select unused question even if discrimination is lower', () => {
      const selected = manager.selectBestQuestion(mockQuestions, {
        preferUnused: true,
        sortByDiscrimination: true,
        excludeRecent: false,
      })

      // Should still prefer unused over used, even with lower discrimination
      expect(selected?.timesUsed).toBe(0)
    })

    it('should sort by timesUsed ASC when not sorting by discrimination', () => {
      const selected = manager.selectBestQuestion(mockQuestions, {
        preferUnused: true,
        sortByDiscrimination: false,
        excludeRecent: false,
      })

      expect(selected?.timesUsed).toBe(0)
    })

    it('should handle questions with null discrimination', () => {
      const questionsWithNull: QuestionBankQuestion[] = [
        {
          id: 'q1_null',
          promptText: 'Null discrimination',
          conceptName: 'Concept A',
          promptType: 'EXPLAIN_TO_PATIENT',
          difficultyLevel: 50,
          discriminationIndex: null,
          timesUsed: 0,
          lastUsedAt: null,
          objectiveId: 'obj1',
        },
        {
          id: 'q2_valid',
          promptText: 'Valid discrimination',
          conceptName: 'Concept B',
          promptType: 'CLINICAL_REASONING',
          difficultyLevel: 55,
          discriminationIndex: 0.5,
          timesUsed: 0,
          lastUsedAt: null,
          objectiveId: 'obj1',
        },
      ]

      const selected = manager.selectBestQuestion(questionsWithNull, {
        preferUnused: true,
        sortByDiscrimination: true,
        excludeRecent: false,
      })

      // Should prefer valid discrimination over null
      expect(selected?.id).toBe('q2_valid')
    })

    it('should return null if no questions available', () => {
      const selected = manager.selectBestQuestion([], {
        preferUnused: true,
        sortByDiscrimination: true,
        excludeRecent: false,
      })

      expect(selected).toBeNull()
    })
  })

  describe('updateQuestionStats', () => {
    it('should increment timesUsed and update lastUsedAt', async () => {
      ;(mockPrisma.validationPrompt.update as jest.Mock).mockResolvedValue({} as any)
      ;(mockPrisma.validationResponse.count as jest.Mock).mockResolvedValue(10) // Not enough for discrimination

      const mockLastUsedAt = new Date('2025-10-17T12:00:00.000Z')
      ;(mockPrisma.validationPrompt.findUnique as jest.Mock).mockResolvedValue({
        id: 'prompt1',
        timesUsed: 6,
        lastUsedAt: mockLastUsedAt,
        discriminationIndex: null,
      } as any)

      const stats = await manager.updateQuestionStats('prompt1', 50, 85)

      expect(stats.promptId).toBe('prompt1')
      expect(stats.timesUsed).toBe(6)
      expect(stats.lastUsedAt).toEqual(mockLastUsedAt)

      // Verify update was called with correct structure (don't check exact timestamp)
      expect(prisma.validationPrompt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prompt1' },
          data: expect.objectContaining({
            timesUsed: { increment: 1 },
            lastUsedAt: expect.any(Date),
          }),
        }),
      )
    })

    it('should calculate discrimination index when ≥20 responses', async () => {
      ;(mockPrisma.validationResponse.count as jest.Mock).mockResolvedValue(20)

      // Mock responses for discrimination calculation
      const mockResponses = [
        ...Array(8).fill({ score: 0.9 }), // Top 27%: 8 responses, all correct
        ...Array(4).fill({ score: 0.5 }), // Middle: 4 responses
        ...Array(8).fill({ score: 0.2 }), // Bottom 27%: 8 responses, none correct
      ]
      ;(mockPrisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses as any)

      ;(mockPrisma.validationPrompt.update as jest.Mock).mockResolvedValue({} as any)
      ;(mockPrisma.validationPrompt.findUnique as jest.Mock).mockResolvedValue({
        id: 'prompt1',
        timesUsed: 21,
        lastUsedAt: new Date(),
        discriminationIndex: 1.0, // Perfect discrimination
      } as any)

      const stats = await manager.updateQuestionStats('prompt1', 50, 85)

      expect(stats.discriminationIndex).toBe(1.0)
      expect(stats.isFlagged).toBe(false)
    })

    it('should flag questions with discrimination < 0.2', async () => {
      ;(mockPrisma.validationResponse.count as jest.Mock).mockResolvedValue(25)

      // Mock poor discrimination: top and bottom perform similarly
      const mockResponses = [
        ...Array(7).fill({ score: 0.5 }), // Top 27%: mediocre performance
        ...Array(11).fill({ score: 0.5 }), // Middle
        ...Array(7).fill({ score: 0.45 }), // Bottom 27%: similar mediocre performance
      ]
      ;(mockPrisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses as any)

      ;(mockPrisma.validationPrompt.update as jest.Mock).mockResolvedValue({} as any)
      ;(mockPrisma.validationPrompt.findUnique as jest.Mock).mockResolvedValue({
        id: 'prompt1',
        timesUsed: 26,
        lastUsedAt: new Date(),
        discriminationIndex: 0.15,
      } as any)

      const stats = await manager.updateQuestionStats('prompt1', 50, 60)

      expect(stats.isFlagged).toBe(true)
      expect(stats.flagReason).toContain('Low discrimination index')
    })
  })

  describe('calculateDiscriminationIndex', () => {
    it('should return 0.0 if fewer than 20 responses', async () => {
      ;(mockPrisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array(15).fill({ score: 0.9 }) as any,
      )

      const index = await manager.calculateDiscriminationIndex('prompt1')

      expect(index).toBe(0.0)
    })

    it('should calculate D = (top 27% correct) - (bottom 27% correct)', async () => {
      // 30 responses total -> ceil(30 * 0.27) = 9 for top and bottom 27%
      const mockResponses = [
        ...Array(9).fill({ score: 0.9 }), // Top 27%: 9 responses, all correct
        ...Array(12).fill({ score: 0.5 }), // Middle: 12 responses
        ...Array(9).fill({ score: 0.3 }), // Bottom 27%: 9 responses, none correct
      ]
      ;(mockPrisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses as any)

      const index = await manager.calculateDiscriminationIndex('prompt1')

      // Top 27%: 9/9 correct (100%) - all scores >= 0.8
      // Bottom 27%: 0/9 correct (0%) - no scores >= 0.8
      // D = 1.0 - 0.0 = 1.0 (perfect discrimination)
      expect(index).toBeCloseTo(1.0, 2)
    })

    it('should handle equal performance (no discrimination)', async () => {
      const mockResponses = Array(30).fill({ score: 0.85 }) // Everyone scores 85%
      ;(mockPrisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses as any)

      const index = await manager.calculateDiscriminationIndex('prompt1')

      // D = 1.0 - 1.0 = 0.0 (no discrimination)
      expect(index).toBeCloseTo(0.0, 2)
    })

    it('should clamp result to 0-1 range', async () => {
      // Edge case: bottom performs better than top (negative D)
      const mockResponses = [
        ...Array(8).fill({ score: 0.5 }), // Top 27%: mediocre
        ...Array(14).fill({ score: 0.5 }),
        ...Array(8).fill({ score: 0.9 }), // Bottom 27%: excellent (shouldn't happen, but test clamping)
      ]
      ;(mockPrisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses as any)

      const index = await manager.calculateDiscriminationIndex('prompt1')

      expect(index).toBeGreaterThanOrEqual(0.0)
      expect(index).toBeLessThanOrEqual(1.0)
    })
  })

  describe('flagPoorQuestions', () => {
    it('should flag question with discrimination < 0.2 and ≥20 responses', async () => {
      ;(mockPrisma.validationPrompt.findUnique as jest.Mock).mockResolvedValue({
        id: 'prompt1',
        discriminationIndex: 0.15,
        responses: Array(25).fill({}),
      } as any)

      const isFlagged = await manager.flagPoorQuestions('prompt1')

      expect(isFlagged).toBe(true)
    })

    it('should not flag question with discrimination ≥ 0.2', async () => {
      ;(mockPrisma.validationPrompt.findUnique as jest.Mock).mockResolvedValue({
        id: 'prompt1',
        discriminationIndex: 0.45,
        responses: Array(30).fill({}),
      } as any)

      const isFlagged = await manager.flagPoorQuestions('prompt1')

      expect(isFlagged).toBe(false)
    })

    it('should not flag question with < 20 responses', async () => {
      ;(mockPrisma.validationPrompt.findUnique as jest.Mock).mockResolvedValue({
        id: 'prompt1',
        discriminationIndex: 0.1, // Low, but not enough data
        responses: Array(15).fill({}),
      } as any)

      const isFlagged = await manager.flagPoorQuestions('prompt1')

      expect(isFlagged).toBe(false)
    })

    it('should calculate discrimination if null', async () => {
      ;(mockPrisma.validationPrompt.findUnique as jest.Mock).mockResolvedValue({
        id: 'prompt1',
        discriminationIndex: null,
        responses: Array(25).fill({}),
      } as any)

      // Mock calculation to return low discrimination
      const mockResponses = Array(25).fill({ score: 0.5 })
      ;(mockPrisma.validationResponse.findMany as jest.Mock).mockResolvedValue(mockResponses as any)

      ;(mockPrisma.validationPrompt.update as jest.Mock).mockResolvedValue({} as any)

      const isFlagged = await manager.flagPoorQuestions('prompt1')

      expect(prisma.validationPrompt.update).toHaveBeenCalled()
      expect(isFlagged).toBe(true) // Assuming calculation returns < 0.2
    })

    it('should return false if question not found', async () => {
      ;(mockPrisma.validationPrompt.findUnique as jest.Mock).mockResolvedValue(null)

      const isFlagged = await manager.flagPoorQuestions('nonexistent')

      expect(isFlagged).toBe(false)
    })
  })

  describe('getFlaggedQuestions', () => {
    it('should return questions with discrimination < 0.2 and ≥20 responses', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          promptText: 'Poor question 1',
          conceptName: 'Concept A',
          promptType: 'EXPLAIN_TO_PATIENT',
          difficultyLevel: 50,
          discriminationIndex: 0.15,
          timesUsed: 25,
          lastUsedAt: new Date(),
          objectiveId: 'obj1',
          responses: Array(25).fill({}),
        },
        {
          id: 'q2',
          promptText: 'Poor question 2',
          conceptName: 'Concept B',
          promptType: 'CLINICAL_REASONING',
          difficultyLevel: 60,
          discriminationIndex: 0.18,
          timesUsed: 30,
          lastUsedAt: new Date(),
          objectiveId: 'obj1',
          responses: Array(30).fill({}),
        },
      ]

      ;(mockPrisma.validationPrompt.findMany as jest.Mock).mockResolvedValue(mockQuestions as any)

      const flagged = await manager.getFlaggedQuestions('obj1')

      expect(flagged).toHaveLength(2)
      expect(flagged[0].flagReason).toContain('Low discrimination index')
    })

    it('should filter out questions with < 20 responses', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          promptText: 'Low sample size',
          conceptName: 'Concept A',
          promptType: 'EXPLAIN_TO_PATIENT',
          difficultyLevel: 50,
          discriminationIndex: 0.15,
          timesUsed: 15,
          lastUsedAt: new Date(),
          objectiveId: 'obj1',
          responses: Array(15).fill({}),
        },
      ]

      ;(mockPrisma.validationPrompt.findMany as jest.Mock).mockResolvedValue(mockQuestions as any)

      const flagged = await manager.getFlaggedQuestions('obj1')

      expect(flagged).toHaveLength(0)
    })

    it('should work without objectiveId filter', async () => {
      ;(mockPrisma.validationPrompt.findMany as jest.Mock).mockResolvedValue([])

      const flagged = await manager.getFlaggedQuestions()

      expect(flagged).toHaveLength(0)
      expect(prisma.validationPrompt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            objectiveId: undefined,
          }),
        }),
      )
    })
  })
})
