/**
 * Personalization Engine Tests
 * Story 5.5: Adaptive Personalization Engine
 *
 * TARGET: 60%+ coverage for P0 CRITICAL file
 *
 * Tests:
 * - Multi-subsystem insight aggregation (Stories 5.1-5.4)
 * - Personalization context switching (mission/content/assessment/session)
 * - Confidence calculation based on data availability
 * - Defensive fallbacks for missing data
 * - Edge cases and error handling
 */

import { PersonalizationEngine, type AggregatedInsights } from '../personalization-engine'

// Mock Prisma
jest.mock('@/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    userLearningProfile: {
      findUnique: jest.fn(),
    },
    strugglePrediction: {
      findMany: jest.fn(),
    },
    studyScheduleRecommendation: {
      findFirst: jest.fn(),
    },
    mission: {
      findMany: jest.fn(),
    },
    cognitiveLoadMetric: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    burnoutRiskAssessment: {
      findFirst: jest.fn(),
    },
    stressResponsePattern: {
      findMany: jest.fn(),
    },
    behavioralPattern: {
      findFirst: jest.fn(),
    },
  })),
}))

import { PrismaClient } from '@/generated/prisma'

describe('PersonalizationEngine', () => {
  let engine: PersonalizationEngine
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    engine = new PersonalizationEngine(mockPrisma)
    jest.clearAllMocks()
  })

  describe('aggregateInsights - Multi-Subsystem Integration', () => {
    it('should aggregate insights from all 4 Epic 5 stories', async () => {
      // Mock Story 5.1: Learning Pattern Recognition
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 50,
        averageSessionDuration: 48,
        preferredStudyTimes: [
          { dayOfWeek: 1, startHour: 9, endHour: 11, effectiveness: 0.85 },
        ],
        learningStyleProfile: {
          visual: 0.4,
          auditory: 0.2,
          reading: 0.3,
          kinesthetic: 0.1,
        },
        personalizedForgettingCurve: {
          R0: 0.9,
          k: 0.15,
          halfLife: 5.2,
        },
        contentPreferences: {
          cardiology: 0.9,
          neurology: 0.7,
        },
      })

      // Mock Story 5.2: Struggle Predictions
      mockPrisma.strugglePrediction.findMany.mockResolvedValue([
        {
          id: 'pred-1',
          userId: 'user-1',
          topicId: 'topic-1',
          predictedStruggleProbability: 0.75,
          predictionConfidence: 0.8,
          predictionStatus: 'PENDING',
          indicators: [{ indicatorType: 'LOW_RETENTION' }],
          interventions: [
            {
              id: 'int-1',
              type: 'REVIEW_BOOST',
              description: 'Extra review sessions',
              priority: 8,
              status: 'PENDING',
            },
          ],
        },
      ])

      // Mock Story 5.3: Session Orchestration
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue({
        userId: 'user-1',
        recommendedSchedule: {
          startTime: new Date().toISOString(),
          duration: 50,
        },
        createdAt: new Date(),
      })

      mockPrisma.mission.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          recommendedStartTime: new Date(),
          completedAt: new Date(),
          status: 'COMPLETED',
        },
        {
          userId: 'user-1',
          recommendedStartTime: new Date(),
          completedAt: new Date(),
          status: 'COMPLETED',
        },
      ])

      // Mock Story 5.4: Cognitive Load
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue({
        userId: 'user-1',
        loadScore: 55,
        timestamp: new Date(),
      })

      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue(
        Array(7)
          .fill(null)
          .map(() => ({ loadScore: 50 })),
      )

      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue({
        userId: 'user-1',
        riskLevel: 'MEDIUM',
        assessmentDate: new Date(),
      })

      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          patternData: { type: 'EXAM_PROXIMITY' },
          confidence: 0.8,
        },
      ])

      const insights = await engine.aggregateInsights('user-1')

      // Verify all 4 data sources aggregated
      expect(insights.patterns).not.toBeNull()
      expect(insights.predictions).not.toBeNull()
      expect(insights.orchestration).not.toBeNull()
      expect(insights.cognitiveLoad).not.toBeNull()

      // Verify data quality tracking
      expect(insights.dataQuality.patternsAvailable).toBe(true)
      expect(insights.dataQuality.predictionsAvailable).toBe(true)
      expect(insights.dataQuality.orchestrationAvailable).toBe(true)
      expect(insights.dataQuality.cognitiveLoadAvailable).toBe(true)
      expect(insights.dataQuality.overallScore).toBe(1.0) // All 4 sources available
    })

    it('should handle missing Story 5.1 patterns gracefully', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(null)
      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const insights = await engine.aggregateInsights('user-1')

      expect(insights.patterns).toBeNull()
      expect(insights.dataQuality.patternsAvailable).toBe(false)
      expect(insights.dataQuality.overallScore).toBe(0)
    })

    it('should filter low-quality data (dataQualityScore < 0.6)', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.4, // Below threshold
        optimalSessionDuration: 50,
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const insights = await engine.aggregateInsights('user-1')

      expect(insights.patterns).toBeNull() // Filtered out
      expect(insights.dataQuality.patternsAvailable).toBe(false)
    })

    it('should filter low-confidence predictions (<0.7)', async () => {
      mockPrisma.strugglePrediction.findMany.mockResolvedValue([
        {
          id: 'pred-1',
          userId: 'user-1',
          topicId: 'topic-1',
          predictedStruggleProbability: 0.75,
          predictionConfidence: 0.5, // Below threshold
          predictionStatus: 'PENDING',
          indicators: [],
          interventions: [],
        },
      ])

      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(null)
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const insights = await engine.aggregateInsights('user-1')

      expect(insights.predictions).toBeNull() // No high-confidence predictions
      expect(insights.dataQuality.predictionsAvailable).toBe(false)
    })
  })

  describe('applyPersonalization - Context Switching', () => {
    it('should apply mission context personalization', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 45,
        averageSessionDuration: 45,
        preferredStudyTimes: [],
        learningStyleProfile: { visual: 0.4, auditory: 0.2, reading: 0.3, kinesthetic: 0.1 },
        contentPreferences: {},
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue({
        userId: 'user-1',
        loadScore: 70, // High load
        timestamp: new Date(),
      })
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([{ loadScore: 70 }])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue({
        userId: 'user-1',
        riskLevel: 'MEDIUM',
        assessmentDate: new Date(),
      })
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'mission')

      expect(config.missionPersonalization).toBeDefined()
      expect(config.missionPersonalization.recommendedDuration).toBeLessThanOrEqual(45)
      expect(config.missionPersonalization.intensityLevel).toBe('LOW') // Reduced due to high load
      expect(config.reasoning.some((r) => r.includes('cognitive load'))).toBe(true)
    })

    it('should apply content context personalization', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 50,
        averageSessionDuration: 50,
        learningStyleProfile: {
          visual: 0.6, // Strong visual preference
          auditory: 0.1,
          reading: 0.2,
          kinesthetic: 0.1,
        },
        preferredStudyTimes: [],
        contentPreferences: {},
        personalizedForgettingCurve: {
          R0: 0.9,
          k: 0.2,
          halfLife: 4.5,
        },
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'content')

      expect(config.contentPersonalization.learningStyleAdaptation.visual).toBe(0.6)
      expect(config.reasoning.some((r) => r.includes('visual learning preference'))).toBe(true)
    })

    it('should apply assessment context personalization', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 50,
        averageSessionDuration: 50,
        learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
        preferredStudyTimes: [],
        contentPreferences: {},
        personalizedForgettingCurve: {
          R0: 0.9,
          k: 0.3, // Steeper curve
          halfLife: 2.5,
        },
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'assessment')

      expect(config.assessmentPersonalization.validationFrequency).toBe('HIGH') // Steep forgetting curve
      expect(config.reasoning.some((r) => r.includes('forgetting curve'))).toBe(true)
    })

    it('should apply session context personalization', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 50,
        averageSessionDuration: 50,
        learningStyleProfile: {
          visual: 0.7, // Dominant style
          auditory: 0.1,
          reading: 0.1,
          kinesthetic: 0.1,
        },
        preferredStudyTimes: [],
        contentPreferences: {},
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue({
        userId: 'user-1',
        loadScore: 75, // High load
        timestamp: new Date(),
      })
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([{ loadScore: 75 }])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])
      mockPrisma.behavioralPattern.findFirst.mockResolvedValue(null)

      const config = await engine.applyPersonalization('user-1', 'session')

      expect(config.sessionPersonalization.breakSchedule.length).toBeGreaterThan(0)
      expect(config.sessionPersonalization.contentMixing).toBe(true) // Enabled for dominant style
    })
  })

  describe('calculateConfidence - Data Availability Weighting', () => {
    it('should calculate high confidence (1.0) when all data available', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 50,
        averageSessionDuration: 50,
        learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
        preferredStudyTimes: [],
        contentPreferences: {},
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([
        {
          id: 'pred-1',
          userId: 'user-1',
          topicId: 'topic-1',
          predictedStruggleProbability: 0.8,
          predictionConfidence: 0.8,
          predictionStatus: 'PENDING',
          indicators: [],
          interventions: [],
        },
      ])

      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue({
        userId: 'user-1',
        recommendedSchedule: { startTime: new Date().toISOString(), duration: 50 },
        createdAt: new Date(),
      })

      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue({
        userId: 'user-1',
        loadScore: 50,
        timestamp: new Date(),
      })

      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([{ loadScore: 50 }])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue({
        userId: 'user-1',
        riskLevel: 'LOW',
        assessmentDate: new Date(),
      })
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          recommendedStartTime: new Date(),
          completedAt: new Date(),
          status: 'COMPLETED',
        },
      ])

      const config = await engine.applyPersonalization('user-1', 'mission')

      expect(config.confidence).toBeGreaterThan(0.9)
    })

    it('should calculate low confidence (0.5) when no data available', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(null)
      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'mission')

      expect(config.confidence).toBe(0.5) // Base confidence
      expect(config.dataQualityWarnings.length).toBeGreaterThan(0)
    })

    it('should apply correct weights (patterns: 0.3, predictions: 0.25, orchestration: 0.25, cognitive: 0.2)', async () => {
      // Only patterns available (weight 0.3)
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 50,
        averageSessionDuration: 50,
        learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
        preferredStudyTimes: [],
        contentPreferences: {},
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'mission')

      // Base 0.5 + patterns 0.3 = 0.8
      expect(config.confidence).toBeCloseTo(0.8, 1)
    })
  })

  describe('Defensive Fallbacks and Defaults', () => {
    it('should use default values when no personalization data available', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(null)
      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'mission')

      // Verify defaults
      expect(config.missionPersonalization.recommendedDuration).toBe(50)
      expect(config.missionPersonalization.intensityLevel).toBe('MEDIUM')
      expect(config.contentPersonalization.difficultyLevel).toBe('MODERATE')
      expect(config.assessmentPersonalization.validationFrequency).toBe('MEDIUM')
      expect(config.sessionPersonalization.breakSchedule).toEqual([
        { afterMinutes: 25, durationMinutes: 5 },
      ])
    })

    it('should provide data quality warnings for missing subsystems', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(null)
      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'mission')

      expect(config.dataQualityWarnings).toContain(
        expect.stringContaining('Learning patterns unavailable'),
      )
      expect(config.dataQualityWarnings).toContain(
        expect.stringContaining('Struggle predictions unavailable'),
      )
      expect(config.dataQualityWarnings).toContain(
        expect.stringContaining('Session orchestration data unavailable'),
      )
      expect(config.dataQualityWarnings).toContain(
        expect.stringContaining('Cognitive load data unavailable'),
      )
    })
  })

  describe('High Burnout Risk Adjustments', () => {
    it('should reduce intensity for HIGH burnout risk', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 60,
        averageSessionDuration: 60,
        learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
        preferredStudyTimes: [],
        contentPreferences: {},
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue({
        userId: 'user-1',
        loadScore: 50,
        timestamp: new Date(),
      })
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([{ loadScore: 50 }])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue({
        userId: 'user-1',
        riskLevel: 'HIGH', // High burnout risk
        assessmentDate: new Date(),
      })
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'mission')

      expect(config.missionPersonalization.intensityLevel).toBe('LOW')
      expect(config.missionPersonalization.recommendedDuration).toBeLessThanOrEqual(30)
      expect(config.reasoning.some((r) => r.includes('burnout risk'))).toBe(true)
    })

    it('should reduce intensity for CRITICAL burnout risk', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 60,
        averageSessionDuration: 60,
        learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
        preferredStudyTimes: [],
        contentPreferences: {},
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue({
        userId: 'user-1',
        loadScore: 50,
        timestamp: new Date(),
      })
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([{ loadScore: 50 }])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue({
        userId: 'user-1',
        riskLevel: 'CRITICAL', // Critical burnout risk
        assessmentDate: new Date(),
      })
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'mission')

      expect(config.missionPersonalization.intensityLevel).toBe('LOW')
      expect(config.missionPersonalization.recommendedDuration).toBeLessThanOrEqual(30)
      expect(config.reasoning.some((r) => r.includes('CRITICAL burnout risk'))).toBe(true)
    })
  })

  describe('Struggle Prediction Integration', () => {
    it('should include high-priority interventions in mission personalization', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 50,
        averageSessionDuration: 50,
        learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
        preferredStudyTimes: [],
        contentPreferences: {},
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([
        {
          id: 'pred-1',
          userId: 'user-1',
          topicId: 'topic-1',
          predictedStruggleProbability: 0.85,
          predictionConfidence: 0.8,
          predictionStatus: 'PENDING',
          indicators: [],
          interventions: [
            {
              id: 'int-1',
              type: 'REVIEW_BOOST',
              description: 'Extra review',
              priority: 9, // High priority
              status: 'PENDING',
            },
            {
              id: 'int-2',
              type: 'SCAFFOLDING',
              description: 'Add hints',
              priority: 8,
              status: 'PENDING',
            },
          ],
        },
      ])

      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'mission')

      expect(config.missionPersonalization.includeInterventions).toBe(true)
      expect(config.missionPersonalization.interventionIds).toEqual(['int-1', 'int-2'])
      expect(config.reasoning.some((r) => r.includes('interventions'))).toBe(true)
    })

    it('should prioritize topics with predicted struggles in content personalization', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 50,
        averageSessionDuration: 50,
        learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
        preferredStudyTimes: [],
        contentPreferences: {},
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([
        {
          id: 'pred-1',
          userId: 'user-1',
          topicId: 'topic-cardiology',
          predictedStruggleProbability: 0.8,
          predictionConfidence: 0.75,
          predictionStatus: 'PENDING',
          indicators: [],
          interventions: [],
        },
        {
          id: 'pred-2',
          userId: 'user-1',
          topicId: 'topic-neurology',
          predictedStruggleProbability: 0.75,
          predictionConfidence: 0.7,
          predictionStatus: 'PENDING',
          indicators: [],
          interventions: [],
        },
      ])

      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'content')

      expect(config.contentPersonalization.priorityTopics).toContain('topic-cardiology')
      expect(config.contentPersonalization.priorityTopics).toContain('topic-neurology')
      expect(config.reasoning.some((r) => r.includes('predicted struggles'))).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.userLearningProfile.findUnique.mockRejectedValue(new Error('Database error'))

      const config = await engine.applyPersonalization('user-1', 'mission')

      expect(config).toBeDefined()
      expect(config.confidence).toBeLessThan(1.0)
    })

    it('should handle null/undefined fields in learning profile', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 50,
        averageSessionDuration: 50,
        learningStyleProfile: null, // Null field
        preferredStudyTimes: null,
        contentPreferences: null,
        personalizedForgettingCurve: null,
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const config = await engine.applyPersonalization('user-1', 'content')

      // Should use defaults
      expect(config.contentPersonalization.learningStyleAdaptation.visual).toBe(0.25)
      expect(config.contentPersonalization.learningStyleAdaptation.auditory).toBe(0.25)
    })

    it('should calculate correct data quality score (0/4, 1/4, 2/4, 3/4, 4/4)', async () => {
      // Test 2/4 data sources available
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: 'user-1',
        dataQualityScore: 0.8,
        optimalSessionDuration: 50,
        averageSessionDuration: 50,
        learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
        preferredStudyTimes: [],
        contentPreferences: {},
      })

      mockPrisma.strugglePrediction.findMany.mockResolvedValue([])
      mockPrisma.studyScheduleRecommendation.findFirst.mockResolvedValue(null)
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue({
        userId: 'user-1',
        loadScore: 50,
        timestamp: new Date(),
      })
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([{ loadScore: 50 }])
      mockPrisma.burnoutRiskAssessment.findFirst.mockResolvedValue(null)
      mockPrisma.stressResponsePattern.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const insights = await engine.aggregateInsights('user-1')

      expect(insights.dataQuality.overallScore).toBeCloseTo(0.5, 1) // 2/4 = 0.5
    })
  })
})
