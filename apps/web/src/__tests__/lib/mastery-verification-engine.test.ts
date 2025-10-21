/**
 * Unit tests for Mastery Verification Engine (Story 4.5 Task 6)
 *
 * Tests the 5-criteria mastery verification logic:
 * 1. Consecutive high scores
 * 2. Multiple assessment types
 * 3. Difficulty matching
 * 4. Calibration accuracy
 * 5. Time spacing
 */

// Jest globals (describe, it, expect, beforeEach) are available without imports
import { checkMasteryStatus, updateMasteryStatus } from '@/lib/mastery-verification-engine'
import { prisma } from '@/lib/db'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    learningObjective: {
      findUnique: jest.fn(),
    },
    validationResponse: {
      findMany: jest.fn(),
    },
    scenarioResponse: {
      findMany: jest.fn(),
    },
    masteryVerification: {
      upsert: jest.fn(),
    },
  },
}))

describe('Mastery Verification Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkMasteryStatus', () => {
    it('should return NOT_STARTED status with no assessments', async () => {
      // Setup mocks
      (prisma.learningObjective.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-1',
        complexity: 'INTERMEDIATE',
      } as any)

      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([])
      (prisma.scenarioResponse.findMany as jest.Mock).mockResolvedValue([])

      // Execute
      const result = await checkMasteryStatus('user-1', 'obj-1')

      // Verify
      expect(result.status).toBe('NOT_STARTED')
      expect(result.overallProgress).toBe(0)
      expect(result.criteria.consecutiveHighScores.met).toBe(false)
      expect(result.criteria.multipleAssessmentTypes.met).toBe(false)
      expect(result.verifiedAt).toBeUndefined()
    })

    it('should return IN_PROGRESS status with partial criteria met', async () => {
      // Setup mocks - objective
      (prisma.learningObjective.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-1',
        complexity: 'INTERMEDIATE',
      } as any)

      // Mock 2 high-scoring comprehension assessments (same day)
      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'resp-1',
          score: 0.85, // 85%
          respondedAt: new Date('2025-01-15T10:00:00Z'),
          confidenceLevel: 4,
          calibrationDelta: 10,
          prompt: {
            promptType: 'EXPLAIN_TO_PATIENT',
            difficultyLevel: 55,
          },
        },
        {
          id: 'resp-2',
          score: 0.90, // 90%
          respondedAt: new Date('2025-01-15T14:00:00Z'),
          confidenceLevel: 5,
          calibrationDelta: 5,
          prompt: {
            promptType: 'EXPLAIN_TO_PATIENT',
            difficultyLevel: 60,
          },
        },
      ] as any)

      (prisma.scenarioResponse.findMany as jest.Mock).mockResolvedValue([])

      // Execute
      const result = await checkMasteryStatus('user-1', 'obj-1')

      // Verify
      expect(result.status).toBe('IN_PROGRESS')
      expect(result.criteria.consecutiveHighScores.progress).toBeCloseTo(0.667, 2) // 2/3
      expect(result.criteria.consecutiveHighScores.met).toBe(false)
      expect(result.criteria.multipleAssessmentTypes.met).toBe(false) // Only 1 type
      expect(result.criteria.timeSpacing.met).toBe(false) // Same day
    })

    it('should return VERIFIED status when all 5 criteria are met', async () => {
      // Setup mocks - objective
      (prisma.learningObjective.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-1',
        complexity: 'INTERMEDIATE',
      } as any)

      // Mock 3 high-scoring comprehension assessments across 3 days
      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'resp-1',
          score: 0.85, // 85%
          respondedAt: new Date('2025-01-10T10:00:00Z'),
          confidenceLevel: 4,
          calibrationDelta: 8,
          prompt: {
            promptType: 'EXPLAIN_TO_PATIENT',
            difficultyLevel: 55,
          },
        },
        {
          id: 'resp-2',
          score: 0.90, // 90%
          respondedAt: new Date('2025-01-12T14:00:00Z'),
          confidenceLevel: 5,
          calibrationDelta: 5,
          prompt: {
            promptType: 'EXPLAIN_TO_PATIENT',
            difficultyLevel: 60,
          },
        },
        {
          id: 'resp-3',
          score: 0.88, // 88%
          respondedAt: new Date('2025-01-14T09:00:00Z'),
          confidenceLevel: 4,
          calibrationDelta: 12,
          prompt: {
            promptType: 'CLINICAL_REASONING',
            difficultyLevel: 58,
          },
        },
      ] as any)

      // Mock 1 clinical reasoning assessment
      (prisma.scenarioResponse.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'scenario-1',
          score: 82, // 82%
          respondedAt: new Date('2025-01-13T11:00:00Z'),
          scenario: {
            difficulty: 'INTERMEDIATE',
          },
        },
      ] as any)

      // Execute
      const result = await checkMasteryStatus('user-1', 'obj-1')

      // Verify
      expect(result.status).toBe('VERIFIED')
      expect(result.criteria.consecutiveHighScores.met).toBe(true) // 3 consecutive > 80%
      expect(result.criteria.multipleAssessmentTypes.met).toBe(true) // COMPREHENSION + REASONING
      expect(result.criteria.difficultyMatch.met).toBe(true) // INTERMEDIATE difficulty
      expect(result.criteria.calibrationAccuracy.met).toBe(true) // Within ±15
      expect(result.criteria.timeSpacing.met).toBe(true) // 4 days spacing
      expect(result.overallProgress).toBeCloseTo(1.0, 1)
      expect(result.verifiedAt).toBeInstanceOf(Date)
    })

    it('should check consecutive high scores correctly', async () => {
      (prisma.learningObjective.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-1',
        complexity: 'INTERMEDIATE',
      } as any)

      // Mock: 90%, 85%, 70%, 95% scores (consecutive broken by 70%)
      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'resp-1',
          score: 0.90,
          respondedAt: new Date('2025-01-15T10:00:00Z'),
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 50 },
        },
        {
          id: 'resp-2',
          score: 0.85,
          respondedAt: new Date('2025-01-14T10:00:00Z'),
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 50 },
        },
        {
          id: 'resp-3',
          score: 0.70, // Breaks consecutive streak
          respondedAt: new Date('2025-01-13T10:00:00Z'),
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 50 },
        },
        {
          id: 'resp-4',
          score: 0.95,
          respondedAt: new Date('2025-01-12T10:00:00Z'),
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 50 },
        },
      ] as any)

      (prisma.scenarioResponse.findMany as jest.Mock).mockResolvedValue([])

      const result = await checkMasteryStatus('user-1', 'obj-1')

      // Only 2 consecutive high scores (90%, 85%) from most recent
      expect(result.criteria.consecutiveHighScores.progress).toBeCloseTo(0.667, 2)
      expect(result.criteria.consecutiveHighScores.met).toBe(false)
    })

    it('should check multiple assessment types correctly', async () => {
      (prisma.learningObjective.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-1',
        complexity: 'INTERMEDIATE',
      } as any)

      // Mock 2 comprehension + 1 reasoning assessment
      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'resp-1',
          score: 0.85,
          respondedAt: new Date('2025-01-15T10:00:00Z'),
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 50 },
        },
        {
          id: 'resp-2',
          score: 0.82,
          respondedAt: new Date('2025-01-14T10:00:00Z'),
          prompt: { promptType: 'CLINICAL_REASONING', difficultyLevel: 55 },
        },
      ] as any)

      (prisma.scenarioResponse.findMany as jest.Mock).mockResolvedValue([])

      const result = await checkMasteryStatus('user-1', 'obj-1')

      // 2 types: COMPREHENSION + REASONING
      expect(result.criteria.multipleAssessmentTypes.progress).toBe(1.0)
      expect(result.criteria.multipleAssessmentTypes.met).toBe(true)
    })

    it('should check calibration accuracy correctly', async () => {
      (prisma.learningObjective.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-1',
        complexity: 'INTERMEDIATE',
      } as any)

      // Mock assessments with varying calibration
      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'resp-1',
          score: 0.85,
          calibrationDelta: 10, // Well calibrated
          respondedAt: new Date('2025-01-15T10:00:00Z'),
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 50 },
        },
        {
          id: 'resp-2',
          score: 0.82,
          calibrationDelta: 25, // Poorly calibrated
          respondedAt: new Date('2025-01-14T10:00:00Z'),
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 50 },
        },
        {
          id: 'resp-3',
          score: 0.88,
          calibrationDelta: 5, // Well calibrated
          respondedAt: new Date('2025-01-13T10:00:00Z'),
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 50 },
        },
      ] as any)

      (prisma.scenarioResponse.findMany as jest.Mock).mockResolvedValue([])

      const result = await checkMasteryStatus('user-1', 'obj-1')

      // 2/3 well calibrated = 66.7% (meets threshold)
      expect(result.criteria.calibrationAccuracy.progress).toBeCloseTo(0.667, 2)
      expect(result.criteria.calibrationAccuracy.met).toBe(true)
    })

    it('should check time spacing correctly', async () => {
      (prisma.learningObjective.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-1',
        complexity: 'INTERMEDIATE',
      } as any)

      // Mock assessments 3 days apart
      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'resp-1',
          score: 0.85,
          respondedAt: new Date('2025-01-10T10:00:00Z'), // Day 1
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 50 },
        },
        {
          id: 'resp-2',
          score: 0.82,
          respondedAt: new Date('2025-01-12T10:00:00Z'), // Day 3
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 50 },
        },
        {
          id: 'resp-3',
          score: 0.88,
          respondedAt: new Date('2025-01-13T10:00:00Z'), // Day 4
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 50 },
        },
      ] as any)

      (prisma.scenarioResponse.findMany as jest.Mock).mockResolvedValue([])

      const result = await checkMasteryStatus('user-1', 'obj-1')

      // 3 days spacing (exceeds 2-day minimum)
      expect(result.criteria.timeSpacing.met).toBe(true)
      expect(result.criteria.timeSpacing.progress).toBeGreaterThanOrEqual(1.0)
    })

    it('should check difficulty match for INTERMEDIATE complexity', async () => {
      (prisma.learningObjective.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-1',
        complexity: 'INTERMEDIATE',
      } as any)

      // Mock assessments at appropriate difficulty (41-70 for INTERMEDIATE)
      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'resp-1',
          score: 0.85,
          respondedAt: new Date('2025-01-15T10:00:00Z'),
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 55 }, // Matches
        },
        {
          id: 'resp-2',
          score: 0.82,
          respondedAt: new Date('2025-01-14T10:00:00Z'),
          prompt: { promptType: 'EXPLAIN_TO_PATIENT', difficultyLevel: 35 }, // Too easy
        },
      ] as any)

      (prisma.scenarioResponse.findMany as jest.Mock).mockResolvedValue([])

      const result = await checkMasteryStatus('user-1', 'obj-1')

      // 1 high-scoring assessment at appropriate difficulty
      expect(result.criteria.difficultyMatch.met).toBe(true)
    })
  })

  describe('updateMasteryStatus', () => {
    it('should create new mastery verification record', async () => {
      const mockResult = {
        status: 'IN_PROGRESS' as const,
        criteria: {
          consecutiveHighScores: { met: false, progress: 0.667, details: '2/3 high scores' },
          multipleAssessmentTypes: { met: true, progress: 1.0, details: '2 types' },
          difficultyMatch: { met: true, progress: 1.0, details: 'Matches' },
          calibrationAccuracy: { met: false, progress: 0.5, details: '50% calibrated' },
          timeSpacing: { met: false, progress: 0.5, details: '1 day' },
        },
        overallProgress: 0.73,
        nextSteps: ['Get one more high score'],
      }

      (prisma.masteryVerification.upsert as jest.Mock).mockResolvedValue({} as any)

      await updateMasteryStatus('user-1', 'obj-1', mockResult)

      expect(prisma.masteryVerification.upsert).toHaveBeenCalledWith({
        where: {
          userId_objectiveId: {
            userId: 'user-1',
            objectiveId: 'obj-1',
          },
        },
        create: expect.objectContaining({
          userId: 'user-1',
          objectiveId: 'obj-1',
          status: 'IN_PROGRESS',
          criteria: {
            consecutiveHighScores: false,
            multipleAssessmentTypes: true,
            difficultyMatch: true,
            calibrationAccuracy: false,
            timeSpacing: false,
          },
        }),
        update: expect.objectContaining({
          status: 'IN_PROGRESS',
        }),
      })
    })

    it('should update existing mastery verification record with VERIFIED status', async () => {
      const mockResult = {
        status: 'VERIFIED' as const,
        criteria: {
          consecutiveHighScores: { met: true, progress: 1.0, details: '3 high scores' },
          multipleAssessmentTypes: { met: true, progress: 1.0, details: '2 types' },
          difficultyMatch: { met: true, progress: 1.0, details: 'Matches' },
          calibrationAccuracy: { met: true, progress: 1.0, details: '100% calibrated' },
          timeSpacing: { met: true, progress: 1.0, details: '3 days' },
        },
        overallProgress: 1.0,
        verifiedAt: new Date('2025-01-15T12:00:00Z'),
        nextSteps: ['Congratulations!'],
      }

      (prisma.masteryVerification.upsert as jest.Mock).mockResolvedValue({} as any)

      await updateMasteryStatus('user-1', 'obj-1', mockResult)

      expect(prisma.masteryVerification.upsert).toHaveBeenCalledWith({
        where: {
          userId_objectiveId: {
            userId: 'user-1',
            objectiveId: 'obj-1',
          },
        },
        create: expect.objectContaining({
          status: 'VERIFIED',
          verifiedAt: mockResult.verifiedAt,
        }),
        update: expect.objectContaining({
          status: 'VERIFIED',
          verifiedAt: mockResult.verifiedAt,
        }),
      })
    })
  })
})
