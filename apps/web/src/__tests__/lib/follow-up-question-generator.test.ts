/**
 * Tests for Follow-Up Question Generator
 *
 * Story 4.5 AC#3: Knowledge Graph-Based Follow-Up Questions
 *
 * Test Coverage:
 * - Route based on score (< 60% → prerequisite, > 85% → advanced)
 * - Find prerequisite questions via ObjectivePrerequisite join table
 * - Find advanced questions via dependency graph
 * - Enforce max 2 follow-ups per original question
 * - Calculate difficulty adjustments (-20 for prerequisite, +20 for advanced)
 */

import { prisma } from '@/lib/db'
import { FollowUpQuestionGenerator } from '@/lib/follow-up-question-generator'

// Mock Prisma with complete mock chains
jest.mock('@/lib/db', () => ({
  prisma: {
    validationPrompt: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    validationResponse: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    objectivePrerequisite: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    learningObjective: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    objective: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('FollowUpQuestionGenerator', () => {
  let generator: FollowUpQuestionGenerator

  beforeEach(() => {
    generator = new FollowUpQuestionGenerator()
    jest.clearAllMocks()
    // Reset all mock return values to defaults
    jest.mocked(prisma.validationResponse.count).mockResolvedValue(0)
    jest.mocked(prisma.validationPrompt.findUnique).mockResolvedValue(null)
    jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue([])
    jest.mocked(prisma.learningObjective.findUnique).mockResolvedValue(null)
    jest.mocked(prisma.learningObjective.findMany).mockResolvedValue([])
  })

  describe('generateFollowUp', () => {
    it('should generate prerequisite follow-up for score < 60%', async () => {
      const mockPrompt = { objectiveId: 'obj-123' }
      const mockPrerequisite = [
        {
          prerequisiteId: 'prereq-obj-456',
          strength: 0.9,
          prerequisite: {
            id: 'prereq-obj-456',
            objective: 'Basic concept',
            complexity: 'BASIC',
          },
        },
      ]

      jest.mocked(prisma.validationResponse.count).mockResolvedValue(0)
      jest.mocked(prisma.validationPrompt.findUnique).mockResolvedValue(mockPrompt as any)
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue(mockPrerequisite as any)

      const result = await generator.generateFollowUp('parent-prompt-123', 45, 'user-1')

      expect(result.shouldGenerateFollowUp).toBe(true)
      expect(result.followUpType).toBe('prerequisite')
      expect(result.relatedObjectiveId).toBe('prereq-obj-456')
      expect(result.difficultyAdjustment).toBe(-20)
      expect(result.rationale).toContain('Low score (45%)')
      expect(result.rationale).toContain('easier prerequisite question')
    })

    it('should generate advanced follow-up for score > 85%', async () => {
      const mockPrompt = { objectiveId: 'obj-123' }
      const mockDependent = [
        {
          objectiveId: 'adv-obj-789',
          strength: 0.8,
          objective: {
            id: 'adv-obj-789',
            objective: 'Advanced concept',
            complexity: 'ADVANCED',
          },
        },
      ]

      jest.mocked(prisma.validationResponse.count).mockResolvedValue(0)
      jest.mocked(prisma.validationPrompt.findUnique).mockResolvedValue(mockPrompt as any)
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue(mockDependent as any)

      const result = await generator.generateFollowUp('parent-prompt-123', 92, 'user-1')

      expect(result.shouldGenerateFollowUp).toBe(true)
      expect(result.followUpType).toBe('advanced')
      expect(result.relatedObjectiveId).toBe('adv-obj-789')
      expect(result.difficultyAdjustment).toBe(20)
      expect(result.rationale).toContain('Excellent score (92%)')
      expect(result.rationale).toContain('advanced question')
    })

    it('should not generate follow-up for moderate score (60-85%)', async () => {
      const mockPrompt = { objectiveId: 'obj-123' }

      jest.mocked(prisma.validationResponse.count).mockResolvedValue(0)
      jest.mocked(prisma.validationPrompt.findUnique).mockResolvedValue(mockPrompt as any)

      const result = await generator.generateFollowUp('parent-prompt-123', 75, 'user-1')

      expect(result.shouldGenerateFollowUp).toBe(false)
      expect(result.followUpType).toBe('none')
      expect(result.relatedObjectiveId).toBe(null)
      expect(result.difficultyAdjustment).toBe(0)
      expect(result.rationale).toContain('Good score (75%)')
      expect(result.rationale).toContain('no follow-up needed')
    })

    it('should respect max 2 follow-ups limit', async () => {
      jest.mocked(prisma.validationResponse.count).mockResolvedValue(2) // Already 2 follow-ups

      const result = await generator.generateFollowUp('parent-prompt-123', 45, 'user-1')

      expect(result.shouldGenerateFollowUp).toBe(false)
      expect(result.followUpType).toBe('none')
      expect(result.rationale).toContain('Max 2 follow-ups reached')
    })

    it('should handle missing objectiveId gracefully', async () => {
      jest.mocked(prisma.validationResponse.count).mockResolvedValue(0)
      jest
        .mocked(prisma.validationPrompt.findUnique)
        .mockResolvedValue({ objectiveId: null } as any)

      const result = await generator.generateFollowUp('parent-prompt-123', 45, 'user-1')

      expect(result.shouldGenerateFollowUp).toBe(false)
      expect(result.rationale).toContain('no linked objective')
    })

    it('should handle no available prerequisites', async () => {
      const mockPrompt = { objectiveId: 'obj-123' }

      jest.mocked(prisma.validationResponse.count).mockResolvedValue(0)
      jest.mocked(prisma.validationPrompt.findUnique).mockResolvedValue(mockPrompt as any)
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue([])

      const result = await generator.generateFollowUp('parent-prompt-123', 45, 'user-1')

      expect(result.shouldGenerateFollowUp).toBe(false)
      expect(result.rationale).toContain('no prerequisite concepts available')
    })

    it('should handle no available advanced concepts', async () => {
      const mockPrompt = { objectiveId: 'obj-123' }
      const mockCurrentObjective = {
        id: 'obj-123',
        complexity: 'ADVANCED',
        lecture: { courseId: 'course-1' },
      }

      jest.mocked(prisma.validationResponse.count).mockResolvedValue(0)
      jest.mocked(prisma.validationPrompt.findUnique).mockResolvedValue(mockPrompt as any)
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue([]) // No dependents
      jest
        .mocked(prisma.learningObjective.findUnique)
        .mockResolvedValue(mockCurrentObjective as any)

      const result = await generator.generateFollowUp('parent-prompt-123', 92, 'user-1')

      expect(result.shouldGenerateFollowUp).toBe(false)
      expect(result.rationale).toContain('no advanced concepts available')
    })
  })

  describe('generatePrerequisiteFollowUp', () => {
    it('should find strongest prerequisite from ObjectivePrerequisite', async () => {
      const mockPrompt = { objectiveId: 'obj-123' }
      const mockPrerequisites = [
        {
          prerequisiteId: 'prereq-strong',
          strength: 0.9,
          prerequisite: { id: 'prereq-strong', objective: 'Strong prereq', complexity: 'BASIC' },
        },
        {
          prerequisiteId: 'prereq-weak',
          strength: 0.5,
          prerequisite: { id: 'prereq-weak', objective: 'Weak prereq', complexity: 'BASIC' },
        },
      ]

      jest.mocked(prisma.validationPrompt.findUnique).mockResolvedValue(mockPrompt as any)
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue(mockPrerequisites as any)

      const result = await generator.generatePrerequisiteFollowUp('parent-prompt-123')

      expect(result).toBe('prereq-strong') // Should return strongest
      expect(jest.mocked(prisma.objectivePrerequisite.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { objectiveId: 'obj-123' },
          orderBy: { strength: 'desc' },
          take: 1,
        }),
      )
    })

    it('should return null when no prerequisites exist', async () => {
      const mockPrompt = { objectiveId: 'obj-123' }

      jest.mocked(prisma.validationPrompt.findUnique).mockResolvedValue(mockPrompt as any)
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue([])

      const result = await generator.generatePrerequisiteFollowUp('parent-prompt-123')

      expect(result).toBeNull()
    })

    it('should return null when prompt has no objectiveId', async () => {
      jest
        .mocked(prisma.validationPrompt.findUnique)
        .mockResolvedValue({ objectiveId: null } as any)

      const result = await generator.generatePrerequisiteFollowUp('parent-prompt-123')

      expect(result).toBeNull()
    })
  })

  describe('generateAdvancedFollowUp', () => {
    it('should find dependent objectives (reverse prerequisite lookup)', async () => {
      const mockPrompt = { objectiveId: 'obj-123' }
      const mockDependents = [
        {
          objectiveId: 'dependent-obj',
          strength: 0.8,
          objective: {
            id: 'dependent-obj',
            objective: 'Depends on current',
            complexity: 'ADVANCED',
          },
        },
      ]

      jest.mocked(prisma.validationPrompt.findUnique).mockResolvedValue(mockPrompt as any)
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue(mockDependents as any)

      const result = await generator.generateAdvancedFollowUp('parent-prompt-123')

      expect(result).toBe('dependent-obj')
      expect(jest.mocked(prisma.objectivePrerequisite.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { prerequisiteId: 'obj-123' },
          orderBy: { strength: 'desc' },
        }),
      )
    })

    it('should find higher complexity objectives in same course (fallback)', async () => {
      const mockPrompt = { objectiveId: 'obj-123' }
      const mockCurrentObjective = {
        id: 'obj-123',
        complexity: 'BASIC',
        lecture: { courseId: 'course-1' },
      }
      const mockAdvancedObjectives = [{ id: 'advanced-obj', complexity: 'INTERMEDIATE' }]

      jest.mocked(prisma.validationPrompt.findUnique).mockResolvedValue(mockPrompt as any)
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue([]) // No dependents
      jest
        .mocked(prisma.learningObjective.findUnique)
        .mockResolvedValue(mockCurrentObjective as any)
      jest
        .mocked(prisma.learningObjective.findMany)
        .mockResolvedValue(mockAdvancedObjectives as any)

      const result = await generator.generateAdvancedFollowUp('parent-prompt-123')

      expect(result).toBe('advanced-obj')
      expect(jest.mocked(prisma.learningObjective.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            complexity: 'INTERMEDIATE',
          }),
        }),
      )
    })

    it('should return null when already at highest complexity', async () => {
      const mockPrompt = { objectiveId: 'obj-123' }
      const mockCurrentObjective = {
        id: 'obj-123',
        complexity: 'ADVANCED',
        lecture: { courseId: 'course-1' },
      }

      jest.mocked(prisma.validationPrompt.findUnique).mockResolvedValue(mockPrompt as any)
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue([])
      jest
        .mocked(prisma.learningObjective.findUnique)
        .mockResolvedValue(mockCurrentObjective as any)

      const result = await generator.generateAdvancedFollowUp('parent-prompt-123')

      expect(result).toBeNull()
    })
  })

  describe('findPrerequisiteQuestions', () => {
    it('should return strongest prerequisite objectiveId', async () => {
      const mockPrerequisites = [
        { prerequisiteId: 'prereq-1', strength: 0.9, prerequisite: { id: 'prereq-1' } },
      ]

      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue(mockPrerequisites as any)

      const result = await generator.findPrerequisiteQuestions('obj-123')

      expect(result).toBe('prereq-1')
    })

    it('should return null when no prerequisites', async () => {
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue([])

      const result = await generator.findPrerequisiteQuestions('obj-123')

      expect(result).toBeNull()
    })
  })

  describe('findAdvancedQuestions', () => {
    it('should prioritize dependents over complexity progression', async () => {
      const mockCurrentObjective = {
        id: 'obj-123',
        complexity: 'BASIC',
        lecture: { courseId: 'course-1' },
      }
      const mockDependents = [
        { objectiveId: 'dependent-1', strength: 0.9, objective: { id: 'dependent-1' } },
      ]

      jest
        .mocked(prisma.learningObjective.findUnique)
        .mockResolvedValue(mockCurrentObjective as any)
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue(mockDependents as any)

      const result = await generator.findAdvancedQuestions('obj-123')

      expect(result).toBe('dependent-1')
      // Should not query for higher complexity if dependents found
      expect(jest.mocked(prisma.learningObjective.findMany)).not.toHaveBeenCalled()
    })

    it('should progress BASIC → INTERMEDIATE → ADVANCED', async () => {
      const mockCurrentObjective = {
        id: 'obj-123',
        complexity: 'BASIC',
        lecture: { courseId: 'course-1' },
      }
      const mockIntermediateObjectives = [{ id: 'intermediate-obj', complexity: 'INTERMEDIATE' }]

      jest
        .mocked(prisma.learningObjective.findUnique)
        .mockResolvedValue(mockCurrentObjective as any)
      jest.mocked(prisma.objectivePrerequisite.findMany).mockResolvedValue([])
      jest
        .mocked(prisma.learningObjective.findMany)
        .mockResolvedValue(mockIntermediateObjectives as any)

      const result = await generator.findAdvancedQuestions('obj-123')

      expect(result).toBe('intermediate-obj')
      expect(jest.mocked(prisma.learningObjective.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            complexity: 'INTERMEDIATE',
          }),
        }),
      )
    })

    it('should return null when objective not found', async () => {
      jest.mocked(prisma.learningObjective.findUnique).mockResolvedValue(null)

      const result = await generator.findAdvancedQuestions('nonexistent-obj')

      expect(result).toBeNull()
    })
  })

  describe('limitFollowUps', () => {
    it('should allow follow-ups when count < 2', async () => {
      jest.mocked(prisma.validationResponse.count).mockResolvedValue(1)

      const result = await generator.limitFollowUps('user-1', 'parent-prompt-123')

      expect(result.canGenerateFollowUp).toBe(true)
      expect(result.currentFollowUpCount).toBe(1)
      expect(result.maxAllowed).toBe(2)
      expect(result.reason).toContain('1/2 follow-ups used')
    })

    it('should block follow-ups when count >= 2', async () => {
      jest.mocked(prisma.validationResponse.count).mockResolvedValue(2)

      const result = await generator.limitFollowUps('user-1', 'parent-prompt-123')

      expect(result.canGenerateFollowUp).toBe(false)
      expect(result.currentFollowUpCount).toBe(2)
      expect(result.maxAllowed).toBe(2)
      expect(result.reason).toContain('Max 2 follow-ups reached')
    })

    it('should query correct fields', async () => {
      jest.mocked(prisma.validationResponse.count).mockResolvedValue(0)

      await generator.limitFollowUps('user-1', 'parent-prompt-123')

      expect(jest.mocked(prisma.validationResponse.count)).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          parentPromptId: 'parent-prompt-123',
          isFollowUpQuestion: true,
        },
      })
    })
  })

  describe('calculateFollowUpDifficulty', () => {
    it('should decrease difficulty by 20 for prerequisite', () => {
      const result = generator.calculateFollowUpDifficulty(50, 'prerequisite')
      expect(result).toBe(30)
    })

    it('should increase difficulty by 20 for advanced', () => {
      const result = generator.calculateFollowUpDifficulty(50, 'advanced')
      expect(result).toBe(70)
    })

    it('should clamp prerequisite difficulty to minimum 0', () => {
      const result = generator.calculateFollowUpDifficulty(10, 'prerequisite')
      expect(result).toBe(0)
    })

    it('should clamp advanced difficulty to maximum 100', () => {
      const result = generator.calculateFollowUpDifficulty(90, 'advanced')
      expect(result).toBe(100)
    })
  })

  describe('getFollowUpContext', () => {
    it('should provide prerequisite context for low scores', () => {
      const context = generator.getFollowUpContext('prerequisite', 45)

      expect(context.title).toBe('Building Foundation')
      expect(context.description).toContain('45%')
      expect(context.description).toContain('foundational concepts')
      expect(context.icon).toBe('📚')
    })

    it('should provide advanced context for high scores', () => {
      const context = generator.getFollowUpContext('advanced', 92)

      expect(context.title).toBe('Deeper Challenge')
      expect(context.description).toContain('92%')
      expect(context.description).toContain('deepen your mastery')
      expect(context.icon).toBe('🚀')
    })
  })
})
