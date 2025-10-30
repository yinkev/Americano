/**
 * Burnout Prevention Engine Tests
 * Story 5.4: Cognitive Health Monitoring
 *
 * TARGET: 60%+ coverage for P0 CRITICAL file
 *
 * Tests:
 * - 6-factor burnout risk assessment
 * - 5 warning signal detection types
 * - Intervention recommendations (4 risk levels)
 * - Recovery progress tracking
 * - Edge cases and error handling
 */

import { BurnoutPreventionEngine, type BurnoutRiskAssessment } from '../burnout-prevention-engine'

// Mock Prisma
jest.mock('@/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    studySession: {
      findMany: jest.fn(),
    },
    cognitiveLoadMetric: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    mission: {
      findMany: jest.fn(),
    },
    performanceMetric: {
      findMany: jest.fn(),
    },
    burnoutRiskAssessment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    behavioralPattern: {
      findFirst: jest.fn(),
    },
    stressResponsePattern: {
      findMany: jest.fn(),
    },
  })),
  BurnoutRiskLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
  Prisma: {
    InputJsonValue: {},
  },
}))

import { PrismaClient } from '@/generated/prisma'

describe('BurnoutPreventionEngine', () => {
  let engine: BurnoutPreventionEngine
  let mockPrisma: any

  beforeEach(() => {
    engine = new BurnoutPreventionEngine()
    mockPrisma = new PrismaClient()
    jest.clearAllMocks()
  })

  describe('assessBurnoutRisk - 6-Factor Algorithm', () => {
    it('should calculate risk from all 6 factors correctly', async () => {
      // Mock 14-day data showing moderate burnout risk
      const now = new Date()
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      mockPrisma.studySession.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            id: `session-${i}`,
            userId: 'user-1',
            startedAt: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
            completedAt: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000 + 3600000), // 1 hour
            durationMs: 3600000, // 60 minutes per session
          })),
      )

      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            id: `metric-${i}`,
            userId: 'user-1',
            loadScore: 65, // Chronic high load
            timestamp: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
          })),
      )

      mockPrisma.mission.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            id: `mission-${i}`,
            userId: 'user-1',
            status: i % 4 === 0 ? 'SKIPPED' : 'COMPLETED', // 25% skip rate
            date: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
            difficultyRating: 3,
          })),
      )

      mockPrisma.performanceMetric.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            id: `perf-${i}`,
            userId: 'user-1',
            retentionScore: i < 7 ? 0.8 : 0.65, // 19% decline
            date: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
          })),
      )

      mockPrisma.burnoutRiskAssessment.create.mockResolvedValue({ id: 'assessment-1' })

      const result = await engine.assessBurnoutRisk('user-1')

      // Verify result structure
      expect(result).toMatchObject({
        riskScore: expect.any(Number),
        riskLevel: expect.any(String),
        contributingFactors: expect.any(Array),
        warningSignals: expect.any(Array),
        recommendations: expect.any(Array),
        assessmentDate: expect.any(Date),
        confidence: expect.any(Number),
      })

      // Verify 6 contributing factors present
      expect(result.contributingFactors).toHaveLength(6)
      expect(result.contributingFactors.map((f) => f.factor)).toContain('Study Intensity')
      expect(result.contributingFactors.map((f) => f.factor)).toContain('Performance Decline')
      expect(result.contributingFactors.map((f) => f.factor)).toContain('Chronic Cognitive Load')
      expect(result.contributingFactors.map((f) => f.factor)).toContain('Schedule Irregularity')
      expect(result.contributingFactors.map((f) => f.factor)).toContain('Engagement Decay')
      expect(result.contributingFactors.map((f) => f.factor)).toContain('Recovery Deficit')

      // Verify percentages sum to 100
      const totalPercentage = result.contributingFactors.reduce((sum, f) => sum + f.percentage, 0)
      expect(totalPercentage).toBe(100)

      // Verify risk score in valid range
      expect(result.riskScore).toBeGreaterThanOrEqual(0)
      expect(result.riskScore).toBeLessThanOrEqual(100)
    })

    it('should apply correct weighted formula (0.2 + 0.25 + 0.25 + 0.15 + 0.1 + 0.05 = 1.0)', async () => {
      // Set up data to test specific factor weights
      const now = new Date()
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      // High intensity: 45 hrs/week = 100 score (weight 0.2 = 20 points)
      mockPrisma.studySession.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            durationMs: 3 * 60 * 60 * 1000, // 3 hours per day = 42 hrs/week
            startedAt: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
            completedAt: new Date(
              twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
            ),
          })),
      )

      // Performance decline: 40% drop = 100 score (weight 0.25 = 25 points)
      mockPrisma.performanceMetric.findMany.mockResolvedValue([
        ...Array(7)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            retentionScore: 0.8,
            date: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
          })),
        ...Array(7)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            retentionScore: 0.48, // 40% drop
            date: new Date(twoWeeksAgo.getTime() + (i + 7) * 24 * 60 * 60 * 1000),
          })),
      ])

      // Chronic load: 60% high-load days = 100 score (weight 0.25 = 25 points)
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            loadScore: i < 8 ? 65 : 50, // 8/14 = 57% high load
            timestamp: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
          })),
      )

      // Irregularity: 35% skip rate = 100 score (weight 0.15 = 15 points)
      mockPrisma.mission.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            status: i % 3 === 0 ? 'SKIPPED' : 'COMPLETED', // 33% skip
            date: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
            difficultyRating: 3,
          })),
      )

      mockPrisma.burnoutRiskAssessment.create.mockResolvedValue({ id: 'assessment-1' })

      const result = await engine.assessBurnoutRisk('user-1')

      // Risk score should be high (roughly 20 + 25 + 25 + 15 = 85)
      expect(result.riskScore).toBeGreaterThan(75)
      expect(result.riskLevel).toMatch(/HIGH|CRITICAL/)
    })

    it('should determine CRITICAL risk level for score >=75', async () => {
      const now = new Date()
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      // Create extreme burnout conditions
      mockPrisma.studySession.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            durationMs: 4 * 60 * 60 * 1000, // 4 hours/day = 56 hrs/week
            startedAt: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
            completedAt: new Date(
              twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
            ),
          })),
      )

      mockPrisma.performanceMetric.findMany.mockResolvedValue([
        ...Array(7)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            retentionScore: 0.85,
            date: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
          })),
        ...Array(7)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            retentionScore: 0.5, // 41% decline
            date: new Date(twoWeeksAgo.getTime() + (i + 7) * 24 * 60 * 60 * 1000),
          })),
      ])

      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            loadScore: 75, // Chronic high load
            timestamp: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
          })),
      )

      mockPrisma.mission.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            status: i % 2 === 0 ? 'SKIPPED' : 'COMPLETED', // 50% skip
            date: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
            difficultyRating: 2,
          })),
      )

      mockPrisma.burnoutRiskAssessment.create.mockResolvedValue({ id: 'assessment-1' })

      const result = await engine.assessBurnoutRisk('user-1')

      expect(result.riskLevel).toBe('CRITICAL')
      expect(result.riskScore).toBeGreaterThanOrEqual(75)
    })

    it('should determine LOW risk level for score <25', async () => {
      const now = new Date()
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      // Healthy study pattern
      mockPrisma.studySession.findMany.mockResolvedValue(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            durationMs: 45 * 60 * 1000, // 45 min/day
            startedAt: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
            completedAt: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
          })),
      )

      mockPrisma.performanceMetric.findMany.mockResolvedValue(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            retentionScore: 0.85,
            date: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
          })),
      )

      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            loadScore: 45, // Moderate load
            timestamp: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
          })),
      )

      mockPrisma.mission.findMany.mockResolvedValue(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            status: 'COMPLETED',
            date: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
            difficultyRating: 3,
          })),
      )

      mockPrisma.burnoutRiskAssessment.create.mockResolvedValue({ id: 'assessment-1' })

      const result = await engine.assessBurnoutRisk('user-1')

      expect(result.riskLevel).toBe('LOW')
      expect(result.riskScore).toBeLessThan(25)
    })
  })

  describe('detectWarningSignals - 5 Signal Types', () => {
    it('should detect CHRONIC_OVERLOAD signal (7+ high-load days)', async () => {
      const now = new Date()
      const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            loadScore: i < 9 ? 70 : 50, // 9 high-load days
            timestamp: new Date(windowStart.getTime() + i * 24 * 60 * 60 * 1000),
          })),
      )

      mockPrisma.performanceMetric.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const signals = await engine.detectWarningSignals('user-1', 14)

      const chronicSignal = signals.find((s) => s.type === 'CHRONIC_OVERLOAD')
      expect(chronicSignal).toBeDefined()
      expect(chronicSignal?.detected).toBe(true)
      expect(chronicSignal?.severity).toMatch(/MEDIUM|HIGH/)
    })

    it('should detect PERFORMANCE_DROP signal (>20% decline)', async () => {
      const now = new Date()
      const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      mockPrisma.performanceMetric.findMany.mockResolvedValue([
        ...Array(7)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            retentionScore: 0.8,
            date: new Date(windowStart.getTime() + i * 24 * 60 * 60 * 1000),
          })),
        ...Array(7)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            retentionScore: 0.6, // 25% decline
            date: new Date(windowStart.getTime() + (i + 7) * 24 * 60 * 60 * 1000),
          })),
      ])

      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const signals = await engine.detectWarningSignals('user-1', 14)

      const performanceSignal = signals.find((s) => s.type === 'PERFORMANCE_DROP')
      expect(performanceSignal).toBeDefined()
      expect(performanceSignal?.detected).toBe(true)
      expect(performanceSignal?.description).toContain('Performance declined')
    })

    it('should detect ENGAGEMENT_LOSS signal (3+ skipped missions)', async () => {
      const now = new Date()
      const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      mockPrisma.mission.findMany.mockResolvedValue([
        { userId: 'user-1', status: 'SKIPPED', date: new Date() },
        { userId: 'user-1', status: 'SKIPPED', date: new Date() },
        { userId: 'user-1', status: 'SKIPPED', date: new Date() },
        { userId: 'user-1', status: 'IN_PROGRESS', date: new Date() },
        { userId: 'user-1', status: 'COMPLETED', date: new Date() },
      ])

      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.performanceMetric.findMany.mockResolvedValue([])

      const signals = await engine.detectWarningSignals('user-1', 14)

      const engagementSignal = signals.find((s) => s.type === 'ENGAGEMENT_LOSS')
      expect(engagementSignal).toBeDefined()
      expect(engagementSignal?.detected).toBe(true)
    })

    it('should detect IRREGULAR_PATTERN signal (>3 missed sessions)', async () => {
      const now = new Date()
      const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      // Only 8 missions in 14 days = 6 missed
      mockPrisma.mission.findMany.mockResolvedValue(
        Array(8)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            status: 'COMPLETED',
            date: new Date(windowStart.getTime() + i * 24 * 60 * 60 * 1000),
          })),
      )

      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.performanceMetric.findMany.mockResolvedValue([])

      const signals = await engine.detectWarningSignals('user-1', 14)

      const irregularSignal = signals.find((s) => s.type === 'IRREGULAR_PATTERN')
      expect(irregularSignal).toBeDefined()
      expect(irregularSignal?.detected).toBe(true)
      expect(irregularSignal?.description).toContain('missed study sessions')
    })

    it('should detect NO_RECOVERY signal (no low-load days in 7 days)', async () => {
      const now = new Date()
      const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue(
        Array(14)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            loadScore: 60, // No recovery days
            timestamp: new Date(windowStart.getTime() + i * 24 * 60 * 60 * 1000),
          })),
      )

      mockPrisma.performanceMetric.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])

      const signals = await engine.detectWarningSignals('user-1', 14)

      const recoverySignal = signals.find((s) => s.type === 'NO_RECOVERY')
      expect(recoverySignal).toBeDefined()
      expect(recoverySignal?.detected).toBe(true)
      expect(recoverySignal?.severity).toBe('HIGH')
    })
  })

  describe('recommendIntervention', () => {
    it('should recommend MANDATORY_REST for CRITICAL risk', () => {
      const assessment: BurnoutRiskAssessment = {
        riskScore: 80,
        riskLevel: 'CRITICAL',
        contributingFactors: [],
        warningSignals: [],
        recommendations: [],
        assessmentDate: new Date(),
        confidence: 0.9,
      }

      const intervention = engine.recommendIntervention(assessment)

      expect(intervention.interventionType).toBe('MANDATORY_REST')
      expect(intervention.urgency).toBe('CRITICAL')
      expect(intervention.estimatedRecoveryDays).toBeGreaterThanOrEqual(5)
      expect(intervention.recommendedActions.some((a) => a.includes('3-day study break'))).toBe(
        true,
      )
    })

    it('should recommend WORKLOAD_REDUCTION for HIGH risk', () => {
      const assessment: BurnoutRiskAssessment = {
        riskScore: 65,
        riskLevel: 'HIGH',
        contributingFactors: [],
        warningSignals: [],
        recommendations: [],
        assessmentDate: new Date(),
        confidence: 0.8,
      }

      const intervention = engine.recommendIntervention(assessment)

      expect(intervention.interventionType).toBe('WORKLOAD_REDUCTION')
      expect(intervention.urgency).toBe('HIGH')
      expect(
        intervention.recommendedActions.some((a) => a.includes('Reduce study hours by 50%')),
      ).toBe(true)
    })

    it('should recommend SCHEDULE_ADJUSTMENT for MEDIUM risk', () => {
      const assessment: BurnoutRiskAssessment = {
        riskScore: 40,
        riskLevel: 'MEDIUM',
        contributingFactors: [],
        warningSignals: [],
        recommendations: [],
        assessmentDate: new Date(),
        confidence: 0.7,
      }

      const intervention = engine.recommendIntervention(assessment)

      expect(intervention.interventionType).toBe('SCHEDULE_ADJUSTMENT')
      expect(intervention.urgency).toBe('MEDIUM')
      expect(
        intervention.recommendedActions.some((a) => a.includes('Reduce study hours by 30%')),
      ).toBe(true)
    })

    it('should recommend CONTENT_SIMPLIFICATION for LOW risk', () => {
      const assessment: BurnoutRiskAssessment = {
        riskScore: 15,
        riskLevel: 'LOW',
        contributingFactors: [],
        warningSignals: [],
        recommendations: [],
        assessmentDate: new Date(),
        confidence: 0.6,
      }

      const intervention = engine.recommendIntervention(assessment)

      expect(intervention.interventionType).toBe('CONTENT_SIMPLIFICATION')
      expect(intervention.urgency).toBe('LOW')
      expect(
        intervention.recommendedActions.some((a) => a.includes('Continue current routine')),
      ).toBe(true)
    })

    it('should add factor-specific recommendations for high-scoring factors', () => {
      const assessment: BurnoutRiskAssessment = {
        riskScore: 65,
        riskLevel: 'HIGH',
        contributingFactors: [
          {
            factor: 'Study Intensity',
            score: 80,
            percentage: 20,
            severity: 'HIGH',
          },
          {
            factor: 'Chronic Cognitive Load',
            score: 75,
            percentage: 25,
            severity: 'HIGH',
          },
          {
            factor: 'Performance Decline',
            score: 50,
            percentage: 25,
            severity: 'MEDIUM',
          },
        ],
        warningSignals: [],
        recommendations: [],
        assessmentDate: new Date(),
        confidence: 0.8,
      }

      const intervention = engine.recommendIntervention(assessment)

      expect(intervention.recommendedActions.some((a) => a.includes('High study intensity'))).toBe(
        true,
      )
      expect(intervention.recommendedActions.some((a) => a.includes('Persistent high load'))).toBe(
        true,
      )
    })
  })

  describe('trackRecoveryProgress', () => {
    it('should track improvement when risk score decreases', async () => {
      mockPrisma.burnoutRiskAssessment.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          riskScore: 45, // Current
          riskLevel: 'MEDIUM',
          assessmentDate: new Date(),
        },
        {
          userId: 'user-1',
          riskScore: 70, // Baseline
          riskLevel: 'HIGH',
          assessmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      ])

      const recovery = await engine.trackRecoveryProgress('user-1', 'intervention-1')

      expect(recovery.currentRiskScore).toBe(45)
      expect(recovery.riskScoreChange).toBe(-25) // Improvement
      expect(recovery.recoveryProgress).toBeGreaterThan(0)
      expect(recovery.isRecovered).toBe(false) // Still MEDIUM risk
    })

    it('should detect full recovery when risk drops to LOW', async () => {
      mockPrisma.burnoutRiskAssessment.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          riskScore: 20, // Current - LOW
          riskLevel: 'LOW',
          assessmentDate: new Date(),
        },
        {
          userId: 'user-1',
          riskScore: 65, // Baseline - HIGH
          riskLevel: 'HIGH',
          assessmentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      ])

      const recovery = await engine.trackRecoveryProgress('user-1', 'intervention-1')

      expect(recovery.isRecovered).toBe(true)
      expect(recovery.recoveryProgress).toBeGreaterThan(0.5)
    })

    it('should handle case with insufficient assessment history', async () => {
      mockPrisma.burnoutRiskAssessment.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          riskScore: 50,
          riskLevel: 'MEDIUM',
          assessmentDate: new Date(),
        },
      ])

      const recovery = await engine.trackRecoveryProgress('user-1', 'intervention-1')

      expect(recovery.daysSinceIntervention).toBe(0)
      expect(recovery.riskScoreChange).toBe(0)
      expect(recovery.recoveryProgress).toBe(0)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty data gracefully', async () => {
      mockPrisma.studySession.findMany.mockResolvedValue([])
      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])
      mockPrisma.performanceMetric.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.create.mockResolvedValue({ id: 'assessment-1' })

      const result = await engine.assessBurnoutRisk('user-1')

      expect(result.riskScore).toBeGreaterThanOrEqual(0)
      expect(result.riskScore).toBeLessThanOrEqual(100)
      expect(result.confidence).toBe(0) // No data = no confidence
    })

    it('should return safe defaults on database error', async () => {
      mockPrisma.studySession.findMany.mockRejectedValue(new Error('Database error'))

      const result = await engine.assessBurnoutRisk('user-1')

      expect(result.riskScore).toBe(25)
      expect(result.riskLevel).toBe('LOW')
      expect(result.confidence).toBe(0)
      expect(result.recommendations).toContain('Unable to assess burnout risk')
    })

    it('should calculate confidence based on data availability', async () => {
      const now = new Date()
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      // Minimal data (5 sessions, 8 load metrics)
      mockPrisma.studySession.findMany.mockResolvedValue(
        Array(5)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            durationMs: 60 * 60 * 1000,
            startedAt: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
            completedAt: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          })),
      )

      mockPrisma.cognitiveLoadMetric.findMany.mockResolvedValue(
        Array(8)
          .fill(null)
          .map((_, i) => ({
            userId: 'user-1',
            loadScore: 50,
            timestamp: new Date(twoWeeksAgo.getTime() + i * 24 * 60 * 60 * 1000),
          })),
      )

      mockPrisma.performanceMetric.findMany.mockResolvedValue([])
      mockPrisma.mission.findMany.mockResolvedValue([])
      mockPrisma.burnoutRiskAssessment.create.mockResolvedValue({ id: 'assessment-1' })

      const result = await engine.assessBurnoutRisk('user-1')

      // Confidence should be reduced due to insufficient data
      expect(result.confidence).toBeLessThan(0.5)
    })
  })
})
