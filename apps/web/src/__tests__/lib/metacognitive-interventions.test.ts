/**
 * Tests for Metacognitive Intervention Engine
 *
 * Validates intervention triggering logic, cooldown enforcement,
 * pattern detection, and effectiveness tracking.
 *
 * @see apps/web/src/lib/metacognitive-interventions.ts
 * @see docs/stories/story-4.4.md - Task 8 Acceptance Criteria
 */

// Jest globals (describe, it, expect, beforeEach, afterEach) are available without imports
import { prisma } from '@/lib/db'
import {
  InterventionType,
  MetacognitiveInterventionEngine,
} from '@/lib/metacognitive-interventions'

// Mock Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    validationResponse: {
      findMany: jest.fn(),
    },
    behavioralEvent: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

describe('MetacognitiveInterventionEngine', () => {
  const mockUserId = 'test-user-123'
  const mockPromptConceptName = 'Cardiac Physiology'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('checkCalibrationHealth', () => {
    it('should return needsIntervention=false when insufficient data (< 10 assessments)', async () => {
      // Mock only 5 responses
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => ({
          id: `response-${i}`,
          userId: mockUserId,
          preAssessmentConfidence: 3,
          score: 0.5,
          respondedAt: new Date(),
          prompt: { conceptName: mockPromptConceptName },
          // Other required fields
          promptId: `prompt-${i}`,
          sessionId: null,
          userAnswer: 'Test answer',
          aiEvaluation: 'Test evaluation',
          confidence: null,
          confidenceLevel: 3,
          calibrationDelta: null,
          detailedFeedback: null,
          skipped: false,
          isControlledFailure: false,
          retryAttemptNumber: null,
          postAssessmentConfidence: null,
          confidenceShift: null,
          confidenceRationale: null,
          reflectionNotes: null,
          calibrationCategory: null,
        })),
      )

      const result = await MetacognitiveInterventionEngine.checkCalibrationHealth(mockUserId)

      expect(result.needsIntervention).toBe(false)
      expect(result.assessmentCount).toBe(5)
      expect(result.reason).toContain('Insufficient data')
    })

    it('should return needsIntervention=false when correlation >= 0.5 (acceptable calibration)', async () => {
      // Mock 15 responses with good calibration (confidence matches score)
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
          Array.from({ length: 15 }, (_, i) => ({
            id: `response-${i}`,
            userId: mockUserId,
            preAssessmentConfidence: 3, // Normalized to 50
            score: 0.5, // 50 when scaled to 0-100
            respondedAt: new Date(),
            prompt: { conceptName: mockPromptConceptName },
            promptId: `prompt-${i}`,
            sessionId: null,
            userAnswer: 'Test answer',
            aiEvaluation: 'Test evaluation',
            confidence: null,
            confidenceLevel: 3,
            calibrationDelta: 0,
            detailedFeedback: null,
            skipped: false,
            isControlledFailure: false,
            retryAttemptNumber: null,
            postAssessmentConfidence: null,
            confidenceShift: null,
            confidenceRationale: null,
            reflectionNotes: null,
            calibrationCategory: 'CALIBRATED',
          })),
      )
      ;(prisma.behavioralEvent.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await MetacognitiveInterventionEngine.checkCalibrationHealth(mockUserId)

      expect(result.needsIntervention).toBe(false)
      expect(result.correlationCoeff).toBeGreaterThanOrEqual(0.5)
      expect(result.reason).toContain('acceptable')
    })

    it('should return needsIntervention=true when correlation < 0.5 (poor calibration)', async () => {
      // Mock 15 responses with poor calibration (low confidence, high scores)
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
          Array.from({ length: 15 }, (_, i) => ({
            id: `response-${i}`,
            userId: mockUserId,
            preAssessmentConfidence: 2, // Normalized to 25
            score: 0.8, // 80 when scaled to 0-100
            respondedAt: new Date(),
            prompt: { conceptName: mockPromptConceptName },
            promptId: `prompt-${i}`,
            sessionId: null,
            userAnswer: 'Test answer',
            aiEvaluation: 'Test evaluation',
            confidence: null,
            confidenceLevel: 2,
            calibrationDelta: -55,
            detailedFeedback: null,
            skipped: false,
            isControlledFailure: false,
            retryAttemptNumber: null,
            postAssessmentConfidence: null,
            confidenceShift: null,
            confidenceRationale: null,
            reflectionNotes: null,
            calibrationCategory: 'UNDERCONFIDENT',
          })),
      )
      ;(prisma.behavioralEvent.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await MetacognitiveInterventionEngine.checkCalibrationHealth(mockUserId)

      expect(result.needsIntervention).toBe(true)
      expect(result.correlationCoeff).toBeLessThan(0.5)
      expect(result.interventionType).toBe(InterventionType.UNDERCONFIDENCE)
    })

    it('should enforce 7-day cooldown period after dismissal', async () => {
      // Mock poor calibration data
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 15 }, (_, i) => ({
          id: `response-${i}`,
          userId: mockUserId,
          preAssessmentConfidence: 5, // Normalized to 100
          score: 0.5, // 50 when scaled to 0-100
          respondedAt: new Date(),
          prompt: { conceptName: mockPromptConceptName },
          promptId: `prompt-${i}`,
          sessionId: null,
          userAnswer: 'Test answer',
          aiEvaluation: 'Test evaluation',
          confidence: null,
          confidenceLevel: 5,
          calibrationDelta: 50,
          detailedFeedback: null,
          skipped: false,
          isControlledFailure: false,
          retryAttemptNumber: null,
          postAssessmentConfidence: null,
          confidenceShift: null,
          confidenceRationale: null,
          reflectionNotes: null,
          calibrationCategory: 'OVERCONFIDENT',
        })),
      )

      // Mock recent dismissal (3 days ago)
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      ;(prisma.behavioralEvent.findFirst as jest.Mock).mockResolvedValue({
          id: 'event-123',
          userId: mockUserId,
          eventType: 'VALIDATION_COMPLETED',
          eventData: {
            type: 'intervention_dismissal',
            interventionType: InterventionType.OVERCONFIDENCE,
            correlationAtDismissal: 0.3,
            assessmentCount: 15,
          },
          timestamp: threeDaysAgo,
          completionQuality: null,
          contentType: null,
          dayOfWeek: null,
          difficultyLevel: null,
          engagementLevel: null,
          sessionPerformanceScore: null,
          timeOfDay: null,
        })

      const result = await MetacognitiveInterventionEngine.checkCalibrationHealth(mockUserId)

      expect(result.needsIntervention).toBe(false)
      expect(result.reason).toContain('Cooldown period')
      expect(result.reason).toContain('4 days remaining') // 7 - 3 = 4
    })

    it('should allow intervention after cooldown period expires (8 days)', async () => {
      // Mock poor calibration data
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 15 }, (_, i) => ({
          id: `response-${i}`,
          userId: mockUserId,
          preAssessmentConfidence: 5,
          score: 0.5,
          respondedAt: new Date(),
          prompt: { conceptName: mockPromptConceptName },
          promptId: `prompt-${i}`,
          sessionId: null,
          userAnswer: 'Test answer',
          aiEvaluation: 'Test evaluation',
          confidence: null,
          confidenceLevel: 5,
          calibrationDelta: 50,
          detailedFeedback: null,
          skipped: false,
          isControlledFailure: false,
          retryAttemptNumber: null,
          postAssessmentConfidence: null,
          confidenceShift: null,
          confidenceRationale: null,
          reflectionNotes: null,
          calibrationCategory: 'OVERCONFIDENT',
        })),
      )

      // Mock old dismissal (8 days ago - past cooldown)
      const eightDaysAgo = new Date()
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)
      ;(prisma.behavioralEvent.findFirst as jest.Mock).mockResolvedValue({
          id: 'event-123',
          userId: mockUserId,
          eventType: 'VALIDATION_COMPLETED',
          eventData: {
            type: 'intervention_dismissal',
            interventionType: InterventionType.OVERCONFIDENCE,
            correlationAtDismissal: 0.3,
            assessmentCount: 15,
          },
          timestamp: eightDaysAgo,
          completionQuality: null,
          contentType: null,
          dayOfWeek: null,
          difficultyLevel: null,
          engagementLevel: null,
          sessionPerformanceScore: null,
          timeOfDay: null,
        })

      const result = await MetacognitiveInterventionEngine.checkCalibrationHealth(mockUserId)

      expect(result.needsIntervention).toBe(true)
      expect(result.interventionType).toBe(InterventionType.OVERCONFIDENCE)
    })

    it('should detect OVERCONFIDENCE pattern (consistent high deltas)', async () => {
      // Mock responses with consistent overconfidence (high confidence, low scores)
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
          Array.from({ length: 15 }, (_, i) => ({
            id: `response-${i}`,
            userId: mockUserId,
            preAssessmentConfidence: 5, // Normalized to 100
            score: 0.4, // 40 when scaled to 0-100
            respondedAt: new Date(),
            prompt: { conceptName: mockPromptConceptName },
            promptId: `prompt-${i}`,
            sessionId: null,
            userAnswer: 'Test answer',
            aiEvaluation: 'Test evaluation',
            confidence: null,
            confidenceLevel: 5,
            calibrationDelta: 60,
            detailedFeedback: null,
            skipped: false,
            isControlledFailure: false,
            retryAttemptNumber: null,
            postAssessmentConfidence: null,
            confidenceShift: null,
            confidenceRationale: null,
            reflectionNotes: null,
            calibrationCategory: 'OVERCONFIDENT',
          })),
      )
      ;(prisma.behavioralEvent.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await MetacognitiveInterventionEngine.checkCalibrationHealth(mockUserId)

      expect(result.needsIntervention).toBe(true)
      expect(result.interventionType).toBe(InterventionType.OVERCONFIDENCE)
    })

    it('should detect UNDERCONFIDENCE pattern (consistent low deltas)', async () => {
      // Mock responses with consistent underconfidence (low confidence, high scores)
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
          Array.from({ length: 15 }, (_, i) => ({
            id: `response-${i}`,
            userId: mockUserId,
            preAssessmentConfidence: 2, // Normalized to 25
            score: 0.85, // 85 when scaled to 0-100
            respondedAt: new Date(),
            prompt: { conceptName: mockPromptConceptName },
            promptId: `prompt-${i}`,
            sessionId: null,
            userAnswer: 'Test answer',
            aiEvaluation: 'Test evaluation',
            confidence: null,
            confidenceLevel: 2,
            calibrationDelta: -60,
            detailedFeedback: null,
            skipped: false,
            isControlledFailure: false,
            retryAttemptNumber: null,
            postAssessmentConfidence: null,
            confidenceShift: null,
            confidenceRationale: null,
            reflectionNotes: null,
            calibrationCategory: 'UNDERCONFIDENT',
          })),
      )
      ;(prisma.behavioralEvent.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await MetacognitiveInterventionEngine.checkCalibrationHealth(mockUserId)

      expect(result.needsIntervention).toBe(true)
      expect(result.interventionType).toBe(InterventionType.UNDERCONFIDENCE)
    })
  })

  describe('generateInterventionRecommendations', () => {
    it('should generate OVERCONFIDENCE recommendations', async () => {
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'response-1',
          userId: mockUserId,
          preAssessmentConfidence: 5,
          score: 0.5,
          respondedAt: new Date(),
          prompt: { conceptName: 'Cardiovascular System' },
          promptId: 'prompt-1',
          sessionId: null,
          userAnswer: 'Test answer',
          aiEvaluation: 'Test evaluation',
          confidence: null,
          confidenceLevel: 5,
          calibrationDelta: 50,
          detailedFeedback: null,
          skipped: false,
          isControlledFailure: false,
          retryAttemptNumber: null,
          postAssessmentConfidence: null,
          confidenceShift: null,
          confidenceRationale: null,
          reflectionNotes: null,
          calibrationCategory: 'OVERCONFIDENT',
        },
      ])

      const recommendation =
        await MetacognitiveInterventionEngine.generateInterventionRecommendations(
          mockUserId,
          InterventionType.OVERCONFIDENCE,
        )

      expect(recommendation.type).toBe(InterventionType.OVERCONFIDENCE)
      expect(recommendation.message).toContain('overconfidence')
      expect(recommendation.recommendations.length).toBeGreaterThan(0)
      expect(recommendation.recommendations[0]).toContain('Review')
      expect(recommendation.educationalContent).toContain('Dunning-Kruger')
    })

    it('should generate UNDERCONFIDENCE recommendations', async () => {
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'response-1',
          userId: mockUserId,
          preAssessmentConfidence: 2,
          score: 0.85,
          respondedAt: new Date(),
          prompt: { conceptName: 'Pharmacology' },
          promptId: 'prompt-1',
          sessionId: null,
          userAnswer: 'Test answer',
          aiEvaluation: 'Test evaluation',
          confidence: null,
          confidenceLevel: 2,
          calibrationDelta: -60,
          detailedFeedback: null,
          skipped: false,
          isControlledFailure: false,
          retryAttemptNumber: null,
          postAssessmentConfidence: null,
          confidenceShift: null,
          confidenceRationale: null,
          reflectionNotes: null,
          calibrationCategory: 'UNDERCONFIDENT',
        },
      ])

      const recommendation =
        await MetacognitiveInterventionEngine.generateInterventionRecommendations(
          mockUserId,
          InterventionType.UNDERCONFIDENCE,
        )

      expect(recommendation.type).toBe(InterventionType.UNDERCONFIDENCE)
      expect(recommendation.message).toContain('stronger than you think')
      expect(recommendation.recommendations.length).toBeGreaterThan(0)
      expect(recommendation.recommendations[0]).toContain('Review')
      expect(recommendation.educationalContent).toContain('Imposter Syndrome')
    })
  })

  describe('trackInterventionDismissal', () => {
    it('should track dismissal in behavioral events', async () => {
      ;(prisma.behavioralEvent.create as jest.Mock).mockResolvedValue({
        id: 'event-123',
        userId: mockUserId,
        eventType: 'VALIDATION_COMPLETED',
        eventData: {
          type: 'intervention_dismissal',
          interventionType: InterventionType.OVERCONFIDENCE,
          correlationAtDismissal: 0.3,
          assessmentCount: 15,
        },
        timestamp: new Date(),
        completionQuality: null,
        contentType: null,
        dayOfWeek: null,
        difficultyLevel: null,
        engagementLevel: null,
        sessionPerformanceScore: null,
        timeOfDay: null,
      })

      await MetacognitiveInterventionEngine.trackInterventionDismissal(
        mockUserId,
        InterventionType.OVERCONFIDENCE,
        0.3,
        15,
      )

      expect(prisma.behavioralEvent.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          eventType: 'VALIDATION_COMPLETED',
          eventData: {
            type: 'intervention_dismissal',
            interventionType: InterventionType.OVERCONFIDENCE,
            correlationAtDismissal: 0.3,
            assessmentCount: 15,
          },
        },
      })
    })
  })
})
