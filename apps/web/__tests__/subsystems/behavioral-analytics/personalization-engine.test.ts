// @ts-nocheck - Suppress TypeScript errors for non-existent Prisma models in mock
/**
 * PersonalizationEngine - Unit Tests (Story 5.5 Phase 1)
 *
 * Tests comprehensive personalization orchestration with:
 * - Defensive fallbacks for missing data
 * - Confidence scoring based on data availability
 * - Context-specific personalization
 * - Integration with Stories 5.1-5.4
 */

import { PrismaClient } from '@/generated/prisma'
import {
  PersonalizationEngine,
  type AggregatedInsights,
  type PersonalizationConfig,
} from '@/subsystems/behavioral-analytics/personalization-engine'

// Mock Prisma Client
const mockPrisma = {
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
} as unknown as PrismaClient

describe('PersonalizationEngine', () => {
  let engine: PersonalizationEngine
  const testUserId = 'test-user-123'

  beforeEach(() => {
    engine = new PersonalizationEngine(mockPrisma)
    jest.clearAllMocks()
  })

  describe('aggregateInsights', () => {
    it('should aggregate all insights when all data available', async () => {
      // Mock Story 5.1 data
      ;(mockPrisma.userLearningProfile.findUnique as jest.Mock).mockResolvedValue({
        userId: testUserId,
        preferredStudyTimes: [
          { dayOfWeek: 1, startHour: 7, endHour: 9 },
          { dayOfWeek: 3, startHour: 19, endHour: 21 },
        ],
        averageSessionDuration: 45,
        optimalSessionDuration: 50,
        contentPreferences: { lectures: 0.4, flashcards: 0.3, validation: 0.3 },
        learningStyleProfile: { visual: 0.4, auditory: 0.2, reading: 0.25, kinesthetic: 0.15 },
        personalizedForgettingCurve: { R0: 0.9, k: 0.15, halfLife: 4.6, confidence: 0.8 },
        dataQualityScore: 0.85,
      })

      // Mock Story 5.2 data
      ;(mockPrisma.strugglePrediction.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'pred-1',
          topicId: 'topic-123',
          predictedStruggleProbability: 0.82,
          predictionConfidence: 0.75,
          indicators: [{ indicatorType: 'LOW_RETENTION' }, { indicatorType: 'PREREQUISITE_GAP' }],
          interventions: [
            {
              id: 'int-1',
              interventionType: 'PREREQUISITE_REVIEW',
              description: 'Review prerequisite topics',
              priority: 9,
            },
          ],
        },
      ])

      // Mock Story 5.3 data
      ;(mockPrisma.studyScheduleRecommendation.findFirst as jest.Mock).mockResolvedValue({
        recommendedStartTime: new Date('2025-10-17T07:00:00Z'),
        recommendedDuration: 50,
        confidence: 0.82,
      })

      ;(mockPrisma.mission.findMany as jest.Mock).mockResolvedValue([
        { recommendedStartTime: new Date(), completedAt: new Date() },
        { recommendedStartTime: new Date(), completedAt: new Date() },
        { recommendedStartTime: null, completedAt: new Date() },
      ])

      // Mock Story 5.4 data
      ;(mockPrisma.cognitiveLoadMetric.findFirst as jest.Mock).mockResolvedValue({
        loadScore: 55,
      })

      ;(mockPrisma.cognitiveLoadMetric.findMany as jest.Mock).mockResolvedValue([
        { loadScore: 50 },
        { loadScore: 55 },
        { loadScore: 60 },
      ])

      ;(mockPrisma.burnoutRiskAssessment.findFirst as jest.Mock).mockResolvedValue({
        riskLevel: 'LOW',
      })

      ;(mockPrisma.stressResponsePattern.findMany as jest.Mock).mockResolvedValue([
        { patternType: 'DIFFICULTY_INDUCED' },
      ])

      const insights = await engine.aggregateInsights(testUserId)

      expect(insights.dataQuality.overallScore).toBe(1.0) // All 4 sources available
      expect(insights.patterns).not.toBeNull()
      expect(insights.predictions).not.toBeNull()
      expect(insights.orchestration).not.toBeNull()
      expect(insights.cognitiveLoad).not.toBeNull()
    })

    it('should handle missing Story 5.1 data with defensive fallbacks', async () => {
      ;(mockPrisma.userLearningProfile.findUnique as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.strugglePrediction.findMany as jest.Mock).mockResolvedValue([])
      ;(mockPrisma.studyScheduleRecommendation.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.mission.findMany as jest.Mock).mockResolvedValue([])
      ;(mockPrisma.cognitiveLoadMetric.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.cognitiveLoadMetric.findMany as jest.Mock).mockResolvedValue([])
      ;(mockPrisma.burnoutRiskAssessment.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.stressResponsePattern.findMany as jest.Mock).mockResolvedValue([])

      const insights = await engine.aggregateInsights(testUserId)

      expect(insights.patterns).toBeNull()
      expect(insights.dataQuality.patternsAvailable).toBe(false)
      expect(insights.dataQuality.overallScore).toBe(0) // No data available
    })

    it('should respect minimum data quality threshold for patterns', async () => {
      ;(mockPrisma.userLearningProfile.findUnique as jest.Mock).mockResolvedValue({
        userId: testUserId,
        dataQualityScore: 0.5, // Below 0.6 threshold
        preferredStudyTimes: [],
        averageSessionDuration: 45,
        optimalSessionDuration: 50,
        contentPreferences: {},
        learningStyleProfile: {},
        personalizedForgettingCurve: {},
      })

      const insights = await engine.aggregateInsights(testUserId)

      expect(insights.patterns).toBeNull()
      expect(insights.dataQuality.patternsAvailable).toBe(false)
    })

    it('should filter predictions by minimum confidence threshold', async () => {
      ;(mockPrisma.userLearningProfile.findUnique as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.strugglePrediction.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'pred-1',
          predictionConfidence: 0.65, // Below 0.7 threshold
          indicators: [],
          interventions: [],
        },
      ])

      const insights = await engine.aggregateInsights(testUserId)

      expect(insights.predictions).toBeNull()
    })

    it('should calculate cognitive load level correctly', async () => {
      ;(mockPrisma.userLearningProfile.findUnique as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.strugglePrediction.findMany as jest.Mock).mockResolvedValue([])
      ;(mockPrisma.studyScheduleRecommendation.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.mission.findMany as jest.Mock).mockResolvedValue([])
      ;(mockPrisma.burnoutRiskAssessment.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.stressResponsePattern.findMany as jest.Mock).mockResolvedValue([])

      // Test different load levels
      const testCases = [
        { score: 30, expectedLevel: 'LOW' },
        { score: 50, expectedLevel: 'MODERATE' },
        { score: 70, expectedLevel: 'HIGH' },
        { score: 85, expectedLevel: 'CRITICAL' },
      ]

      for (const testCase of testCases) {
        ;(mockPrisma.cognitiveLoadMetric.findFirst as jest.Mock).mockResolvedValue({
          loadScore: testCase.score,
        })
        ;(mockPrisma.cognitiveLoadMetric.findMany as jest.Mock).mockResolvedValue([
          { loadScore: testCase.score },
        ])

        const insights = await engine.aggregateInsights(testUserId)
        expect(insights.cognitiveLoad?.loadLevel).toBe(testCase.expectedLevel)
      }
    })
  })

  describe('applyPersonalization - Mission Context', () => {
    it('should apply orchestration recommendations with high confidence', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: null,
        predictions: null,
        orchestration: {
          lastRecommendation: {
            startTime: new Date('2025-10-17T07:00:00Z'),
            duration: 50,
            confidence: 0.85,
          },
          adherenceRate: 0.8,
          performanceImprovement: 0.15,
        },
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: false,
          predictionsAvailable: false,
          orchestrationAvailable: true,
          cognitiveLoadAvailable: false,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'mission')

      expect(config.missionPersonalization.recommendedStartTime).toEqual(
        new Date('2025-10-17T07:00:00Z'),
      )
      expect(config.missionPersonalization.recommendedDuration).toBe(50)
      expect(config.reasoning).toContain(
        'Recommended start time based on orchestration (confidence: 85%)',
      )
    })

    it('should reduce intensity for high burnout risk', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: null,
        predictions: null,
        orchestration: null,
        cognitiveLoad: {
          currentLoad: 50,
          loadLevel: 'MODERATE',
          burnoutRisk: 'HIGH',
          avgLoad7Days: 65,
          stressPatterns: [],
        },
        dataQuality: {
          patternsAvailable: false,
          predictionsAvailable: false,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: true,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'mission')

      expect(config.missionPersonalization.intensityLevel).toBe('LOW')
      expect(config.missionPersonalization.recommendedDuration).toBeLessThanOrEqual(30)
      expect(config.reasoning).toContain('Reduced intensity due to HIGH burnout risk')
    })

    it('should include high-priority interventions', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: null,
        predictions: {
          activePredictions: [
            {
              id: 'pred-1',
              topicId: 'topic-123',
              probability: 0.8,
              confidence: 0.75,
              indicators: ['LOW_RETENTION'],
            },
          ],
          interventions: [
            {
              id: 'int-1',
              type: 'PREREQUISITE_REVIEW',
              description: 'Review prerequisites',
              priority: 9,
            },
            {
              id: 'int-2',
              type: 'DIFFICULTY_PROGRESSION',
              description: 'Start easier',
              priority: 8,
            },
            {
              id: 'int-3',
              type: 'COGNITIVE_LOAD_REDUCE',
              description: 'Reduce complexity',
              priority: 6,
            },
          ],
        },
        orchestration: null,
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: false,
          predictionsAvailable: true,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: false,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'mission')

      expect(config.missionPersonalization.includeInterventions).toBe(true)
      expect(config.missionPersonalization.interventionIds).toHaveLength(2) // Top 2 with priority >= 7
      expect(config.missionPersonalization.interventionIds).toContain('int-1')
      expect(config.missionPersonalization.interventionIds).toContain('int-2')
    })

    it('should use optimal session duration from patterns', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: {
          optimalStudyTimes: [],
          sessionDurationPreference: {
            optimal: 60,
            average: 50,
            confidence: 0.85,
          },
          learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
          forgettingCurve: { R0: 0.9, k: 0.15, halfLife: 4.6, confidence: 0.7 },
          contentPreferences: {},
        },
        predictions: null,
        orchestration: null,
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: true,
          predictionsAvailable: false,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: false,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'mission')

      expect(config.missionPersonalization.recommendedDuration).toBe(60)
      expect(config.reasoning).toContain('Session duration set to optimal 60 minutes')
    })
  })

  describe('applyPersonalization - Content Context', () => {
    it('should adapt to dominant learning style', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: {
          optimalStudyTimes: [],
          sessionDurationPreference: { optimal: 50, average: 45, confidence: 0.7 },
          learningStyleProfile: {
            visual: 0.55,
            auditory: 0.2,
            reading: 0.15,
            kinesthetic: 0.1,
          },
          forgettingCurve: { R0: 0.9, k: 0.15, halfLife: 4.6, confidence: 0.7 },
          contentPreferences: {},
        },
        predictions: null,
        orchestration: null,
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: true,
          predictionsAvailable: false,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: false,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'content')

      expect(config.contentPersonalization.learningStyleAdaptation.visual).toBe(0.55)
      expect(config.reasoning).toContain('Content adapted for visual learning preference')
    })

    it('should prioritize topics with predicted struggles', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: null,
        predictions: {
          activePredictions: [
            {
              id: 'pred-1',
              topicId: 'physiology-101',
              probability: 0.85,
              confidence: 0.8,
              indicators: [],
            },
            {
              id: 'pred-2',
              topicId: 'anatomy-201',
              probability: 0.75,
              confidence: 0.75,
              indicators: [],
            },
            {
              id: 'pred-3',
              topicId: 'biochem-301',
              probability: 0.65,
              confidence: 0.7,
              indicators: [],
            },
          ],
          interventions: [],
        },
        orchestration: null,
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: false,
          predictionsAvailable: true,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: false,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'content')

      expect(config.contentPersonalization.priorityTopics).toHaveLength(2) // Only >= 0.7 probability
      expect(config.contentPersonalization.priorityTopics).toContain('physiology-101')
      expect(config.contentPersonalization.priorityTopics).toContain('anatomy-201')
    })

    it('should adjust review frequency based on forgetting curve', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: {
          optimalStudyTimes: [],
          sessionDurationPreference: { optimal: 50, average: 45, confidence: 0.7 },
          learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
          forgettingCurve: {
            R0: 0.9,
            k: 0.25,
            halfLife: 2.8, // Short half-life = steep forgetting curve
            confidence: 0.8,
          },
          contentPreferences: {},
        },
        predictions: null,
        orchestration: null,
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: true,
          predictionsAvailable: false,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: false,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'content')

      expect(config.contentPersonalization.reviewFrequency).toBeGreaterThan(30) // High frequency for steep curve
      expect(config.reasoning).toContain(
        'Review frequency adjusted based on personal forgetting curve',
      )
    })
  })

  describe('applyPersonalization - Assessment Context', () => {
    it('should increase validation frequency for steep forgetting curve', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: {
          optimalStudyTimes: [],
          sessionDurationPreference: { optimal: 50, average: 45, confidence: 0.7 },
          learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
          forgettingCurve: {
            R0: 0.85,
            k: 0.3,
            halfLife: 2.3, // Very steep
            confidence: 0.85,
          },
          contentPreferences: {},
        },
        predictions: null,
        orchestration: null,
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: true,
          predictionsAvailable: false,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: false,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'assessment')

      expect(config.assessmentPersonalization.validationFrequency).toBe('HIGH')
      expect(config.reasoning).toContain('High validation frequency due to steep forgetting curve')
    })

    it('should use gradual progression for high cognitive load', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: null,
        predictions: null,
        orchestration: null,
        cognitiveLoad: {
          currentLoad: 75,
          loadLevel: 'HIGH',
          burnoutRisk: 'MEDIUM',
          avgLoad7Days: 70,
          stressPatterns: [],
        },
        dataQuality: {
          patternsAvailable: false,
          predictionsAvailable: false,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: true,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'assessment')

      expect(config.assessmentPersonalization.difficultyProgression).toBe('GRADUAL')
      expect(config.reasoning).toContain(
        'Gradual difficulty progression due to high cognitive load',
      )
    })

    it('should enable comprehensive feedback for multiple struggles', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: null,
        predictions: {
          activePredictions: [
            {
              id: 'pred-1',
              topicId: 'topic-1',
              probability: 0.8,
              confidence: 0.75,
              indicators: [],
            },
            {
              id: 'pred-2',
              topicId: 'topic-2',
              probability: 0.75,
              confidence: 0.8,
              indicators: [],
            },
            {
              id: 'pred-3',
              topicId: 'topic-3',
              probability: 0.82,
              confidence: 0.77,
              indicators: [],
            },
          ],
          interventions: [],
        },
        orchestration: null,
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: false,
          predictionsAvailable: true,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: false,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'assessment')

      expect(config.assessmentPersonalization.feedbackDetail).toBe('COMPREHENSIVE')
      expect(config.reasoning).toContain(
        'Comprehensive feedback enabled due to multiple predicted struggles',
      )
    })
  })

  describe('applyPersonalization - Session Context', () => {
    it('should increase break frequency for high cognitive load', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: null,
        predictions: null,
        orchestration: null,
        cognitiveLoad: {
          currentLoad: 85,
          loadLevel: 'CRITICAL',
          burnoutRisk: 'MEDIUM',
          avgLoad7Days: 60,
          stressPatterns: [],
        },
        dataQuality: {
          patternsAvailable: false,
          predictionsAvailable: false,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: true,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'session')

      expect(config.sessionPersonalization.breakSchedule.length).toBeGreaterThan(1)
      expect(config.sessionPersonalization.breakSchedule[0].afterMinutes).toBeLessThanOrEqual(20)
      expect(config.reasoning).toContain('Increased break frequency due to high cognitive load')
    })

    it('should enable content mixing for dominant learning style', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: {
          optimalStudyTimes: [],
          sessionDurationPreference: { optimal: 50, average: 45, confidence: 0.7 },
          learningStyleProfile: {
            visual: 0.7, // Dominant
            auditory: 0.15,
            reading: 0.1,
            kinesthetic: 0.05,
          },
          forgettingCurve: { R0: 0.9, k: 0.15, halfLife: 4.6, confidence: 0.7 },
          contentPreferences: {},
        },
        predictions: null,
        orchestration: null,
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: true,
          predictionsAvailable: false,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: false,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'session')

      expect(config.sessionPersonalization.contentMixing).toBe(true)
      expect(config.reasoning).toContain(
        'Content mixing enabled to balance dominant learning style',
      )
    })

    it('should enable attention cycle adaptation when pattern detected', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: {
          optimalStudyTimes: [],
          sessionDurationPreference: { optimal: 50, average: 45, confidence: 0.7 },
          learningStyleProfile: { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 },
          forgettingCurve: { R0: 0.9, k: 0.15, halfLife: 4.6, confidence: 0.7 },
          contentPreferences: {},
        },
        predictions: null,
        orchestration: null,
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: true,
          predictionsAvailable: false,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: false,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      ;(mockPrisma.behavioralPattern.findFirst as jest.Mock).mockResolvedValue({
        id: 'pattern-1',
        patternType: 'ATTENTION_CYCLE',
        confidence: 0.8,
      })

      const config = await engine.applyPersonalization(testUserId, 'session')

      expect(config.sessionPersonalization.attentionCycleAdaptation).toBe(true)
      expect(config.reasoning).toContain(
        'Attention cycle adaptation enabled based on detected patterns',
      )
    })
  })

  describe('calculateConfidence', () => {
    it('should calculate confidence based on data availability', async () => {
      const testCases = [
        {
          available: [false, false, false, false],
          expectedMin: 0.5,
          expectedMax: 0.5,
        },
        {
          available: [true, false, false, false],
          expectedMin: 0.79,
          expectedMax: 0.81,
        },
        {
          available: [true, true, false, false],
          expectedMin: 1.0,
          expectedMax: 1.0,
        },
        {
          available: [true, true, true, true],
          expectedMin: 1.0,
          expectedMax: 1.0,
        },
      ]

      for (const testCase of testCases) {
        const mockInsights: AggregatedInsights = {
          patterns: testCase.available[0] ? ({} as any) : null,
          predictions: testCase.available[1] ? ({} as any) : null,
          orchestration: testCase.available[2] ? ({} as any) : null,
          cognitiveLoad: testCase.available[3] ? ({} as any) : null,
          dataQuality: {
            patternsAvailable: testCase.available[0],
            predictionsAvailable: testCase.available[1],
            orchestrationAvailable: testCase.available[2],
            cognitiveLoadAvailable: testCase.available[3],
            overallScore: testCase.available.filter(Boolean).length / 4,
          },
        }

        jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

        const config = await engine.applyPersonalization(testUserId, 'mission')

        expect(config.confidence).toBeGreaterThanOrEqual(testCase.expectedMin)
        expect(config.confidence).toBeLessThanOrEqual(testCase.expectedMax)
      }
    })
  })

  describe('data quality warnings', () => {
    it('should add warnings for missing data sources', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: null,
        predictions: null,
        orchestration: null,
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: false,
          predictionsAvailable: false,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: false,
          overallScore: 0,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'mission')

      expect(config.dataQualityWarnings).toContain(
        'Learning patterns unavailable - using default preferences. More data needed for personalization.',
      )
      expect(config.dataQualityWarnings).toContain(
        'Struggle predictions unavailable - interventions may be generic.',
      )
      expect(config.dataQualityWarnings).toContain(
        'Session orchestration data unavailable - using default timing recommendations.',
      )
      expect(config.dataQualityWarnings).toContain(
        'Cognitive load data unavailable - intensity adjustments may not be optimal.',
      )
      expect(config.dataQualityWarnings.some((w) => w.includes('0% available'))).toBe(true)
    })

    it('should add overall data quality warning when score < 0.5', async () => {
      const mockInsights: AggregatedInsights = {
        patterns: null,
        predictions: {
          activePredictions: [],
          interventions: [],
        },
        orchestration: null,
        cognitiveLoad: null,
        dataQuality: {
          patternsAvailable: false,
          predictionsAvailable: true,
          orchestrationAvailable: false,
          cognitiveLoadAvailable: false,
          overallScore: 0.25,
        },
      }

      jest.spyOn(engine, 'aggregateInsights').mockResolvedValue(mockInsights)

      const config = await engine.applyPersonalization(testUserId, 'mission')

      expect(
        config.dataQualityWarnings.some((w) =>
          w.includes('Continue studying to improve recommendations'),
        ),
      ).toBe(true)
    })
  })
})
