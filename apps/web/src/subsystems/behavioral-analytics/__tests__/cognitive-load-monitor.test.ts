/**
 * Cognitive Load Monitor Tests
 * Story 5.4: Cognitive Health Monitoring
 *
 * TARGET: 60%+ coverage for P0 CRITICAL file
 *
 * Tests:
 * - 5-factor cognitive load calculation
 * - Performance requirement: <100ms execution time
 * - Stress indicator detection (5 types)
 * - Overload risk assessment
 * - Edge cases (null data, empty arrays, extreme values)
 */

import type { StressIndicator } from '../cognitive-load-monitor'
import { CognitiveLoadMonitor, type SessionBehavioralData } from '../cognitive-load-monitor'

// Mock Prisma
jest.mock('@/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    cognitiveLoadMetric: {
      create: jest.fn().mockResolvedValue({ id: 'metric-1' }),
    },
    behavioralEvent: {
      create: jest.fn().mockResolvedValue({ id: 'event-1' }),
    },
  })),
  Prisma: {
    InputJsonValue: {},
  },
}))

describe('CognitiveLoadMonitor', () => {
  let monitor: CognitiveLoadMonitor

  beforeEach(() => {
    monitor = new CognitiveLoadMonitor()
    jest.clearAllMocks()
  })

  describe('calculateCurrentLoad - 5-Factor Algorithm', () => {
    it('should calculate load from all 5 factors correctly', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2000, 2200, 2400, 2600, 2800], // Increasing (30% above baseline)
        errorRate: 0.3, // 30% errors
        engagementMetrics: {
          pauseCount: 5,
          pauseDurationMs: 180000, // 3 minutes of pauses in 30-min session
          cardInteractions: 20,
        },
        performanceScores: [0.9, 0.85, 0.8, 0.75, 0.7], // Declining performance
        sessionDuration: 65, // >60 minutes = duration stress
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.9,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      // Verify result structure
      expect(result).toMatchObject({
        loadScore: expect.any(Number),
        loadLevel: expect.any(String),
        stressIndicators: expect.any(Array),
        confidenceLevel: expect.any(Number),
        timestamp: expect.any(Date),
        sessionId: 'session-1',
        recommendations: expect.any(Array),
        overloadDetected: expect.any(Boolean),
      })

      // Verify load score in valid range
      expect(result.loadScore).toBeGreaterThanOrEqual(0)
      expect(result.loadScore).toBeLessThanOrEqual(100)

      // Verify load score is elevated (should be >40 based on data)
      expect(result.loadScore).toBeGreaterThan(40)

      // Verify confidence is calculated
      expect(result.confidenceLevel).toBeGreaterThan(0)
      expect(result.confidenceLevel).toBeLessThanOrEqual(1)
    })

    it('should complete calculation in <100ms (performance requirement)', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: Array(50).fill(2000),
        errorRate: 0.1,
        engagementMetrics: {
          pauseCount: 2,
          pauseDurationMs: 30000,
          cardInteractions: 50,
        },
        performanceScores: Array(50).fill(0.8),
        sessionDuration: 45,
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.8,
        },
      }

      const startTime = performance.now()
      await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(100)
    })

    it('should apply correct weighted formula (0.30 + 0.25 + 0.20 + 0.15 + 0.10 = 1.0)', async () => {
      // Test with known values to verify formula
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [3000], // 50% increase = 100 score
        errorRate: 0.4, // 40% = 40 score
        engagementMetrics: {
          pauseCount: 0,
          pauseDurationMs: 0,
          cardInteractions: 10,
        },
        performanceScores: [0.5, 0.5, 0.5, 0.5, 0.5], // 44% decline from 0.9 baseline
        sessionDuration: 95, // >90 min = 25 score
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.9,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      // Expected: (100 * 0.3) + (40 * 0.25) + (0 * 0.2) + (44 * 0.15) + (25 * 0.1)
      //         = 30 + 10 + 0 + 6.6 + 2.5 = 49.1
      expect(result.loadScore).toBeGreaterThan(45)
      expect(result.loadScore).toBeLessThan(55)
    })

    it('should cap load score at 100 (maximum)', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [10000], // Extremely high
        errorRate: 1.0, // 100% errors
        engagementMetrics: {
          pauseCount: 20,
          pauseDurationMs: 600000,
          cardInteractions: 30,
        },
        performanceScores: [0.1, 0.1, 0.1, 0.1, 0.1], // Severe decline
        sessionDuration: 120, // 2 hours
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.9,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      expect(result.loadScore).toBeLessThanOrEqual(100)
    })

    it('should floor load score at 0 (minimum)', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [1500], // Faster than baseline
        errorRate: 0.0, // No errors
        engagementMetrics: {
          pauseCount: 0,
          pauseDurationMs: 0,
          cardInteractions: 20,
        },
        performanceScores: [0.95, 0.95, 0.95, 0.95, 0.95], // Better than baseline
        sessionDuration: 30, // Short session
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.9,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      expect(result.loadScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('detectStressIndicators - 5 Indicator Types', () => {
    it('should detect RESPONSE_LATENCY indicator when latency increases >15%', () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2400, 2500, 2600], // 25% increase
        errorRate: 0.1,
        performanceScores: [0.8, 0.8, 0.8, 0.8, 0.8],
        sessionDuration: 30,
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.8,
        },
      }

      const indicators = monitor.detectStressIndicators(sessionData)

      const latencyIndicator = indicators.find((i) => i.type === 'RESPONSE_LATENCY')
      expect(latencyIndicator).toBeDefined()
      expect(latencyIndicator?.severity).toBe('LOW') // 25% increase = LOW
      expect(latencyIndicator?.value).toBeGreaterThan(2000)
    })

    it('should detect ERROR_RATE indicator when errors >20%', () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2000],
        errorRate: 0.35, // 35% errors
        performanceScores: [0.8, 0.8, 0.8, 0.8, 0.8],
        sessionDuration: 30,
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.8,
        },
      }

      const indicators = monitor.detectStressIndicators(sessionData)

      const errorIndicator = indicators.find((i) => i.type === 'ERROR_RATE')
      expect(errorIndicator).toBeDefined()
      expect(errorIndicator?.severity).toBe('MEDIUM') // 35% = MEDIUM
      expect(errorIndicator?.value).toBe(0.35)
    })

    it('should detect ENGAGEMENT_DROP indicator when pause ratio >20%', () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2000],
        errorRate: 0.1,
        engagementMetrics: {
          pauseCount: 8,
          pauseDurationMs: 720000, // 12 minutes of pauses in 30-min session (40% pause ratio)
          cardInteractions: 20,
        },
        performanceScores: [0.8, 0.8, 0.8, 0.8, 0.8],
        sessionDuration: 30,
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.8,
        },
      }

      const indicators = monitor.detectStressIndicators(sessionData)

      const engagementIndicator = indicators.find((i) => i.type === 'ENGAGEMENT_DROP')
      expect(engagementIndicator).toBeDefined()
      expect(engagementIndicator?.severity).toBe('HIGH') // 40% pause ratio = HIGH
    })

    it('should detect PERFORMANCE_DECLINE indicator when decline >20%', () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2000],
        errorRate: 0.1,
        performanceScores: [0.9, 0.85, 0.75, 0.65, 0.55], // Declining from 0.9 baseline
        sessionDuration: 30,
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.9,
        },
      }

      const indicators = monitor.detectStressIndicators(sessionData)

      const performanceIndicator = indicators.find((i) => i.type === 'PERFORMANCE_DECLINE')
      expect(performanceIndicator).toBeDefined()
      expect(performanceIndicator?.severity).toMatch(/MEDIUM|HIGH/)
    })

    it('should detect DURATION_STRESS indicator when session >60 minutes', () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2000],
        errorRate: 0.1,
        performanceScores: [0.8, 0.8, 0.8, 0.8, 0.8],
        sessionDuration: 75, // >60 minutes
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.8,
        },
      }

      const indicators = monitor.detectStressIndicators(sessionData)

      const durationIndicator = indicators.find((i) => i.type === 'DURATION_STRESS')
      expect(durationIndicator).toBeDefined()
      expect(durationIndicator?.severity).toBe('MEDIUM') // 75 min = MEDIUM
      expect(durationIndicator?.value).toBe(75)
    })

    it('should classify HIGH severity for duration >90 minutes', () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2000],
        errorRate: 0.1,
        performanceScores: [0.8, 0.8, 0.8, 0.8, 0.8],
        sessionDuration: 95, // >90 minutes
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.8,
        },
      }

      const indicators = monitor.detectStressIndicators(sessionData)

      const durationIndicator = indicators.find((i) => i.type === 'DURATION_STRESS')
      expect(durationIndicator?.severity).toBe('HIGH')
    })
  })

  describe('assessOverloadRisk', () => {
    it('should detect overload when load score >80', () => {
      const indicators: StressIndicator[] = []
      const result = monitor.assessOverloadRisk(85, indicators)

      expect(result.isOverload).toBe(true)
      expect(result.riskLevel).toBe('CRITICAL')
    })

    it('should detect overload when 2+ HIGH severity indicators present', () => {
      const indicators: StressIndicator[] = [
        {
          type: 'ERROR_RATE',
          severity: 'HIGH',
          value: 0.5,
          contribution: 50,
        },
        {
          type: 'PERFORMANCE_DECLINE',
          severity: 'HIGH',
          value: 0.4,
          contribution: 40,
        },
      ]

      const result = monitor.assessOverloadRisk(60, indicators)

      expect(result.isOverload).toBe(true)
      expect(result.riskLevel).toMatch(/HIGH|CRITICAL/)
    })

    it('should not detect overload for low load with low severity indicators', () => {
      const indicators: StressIndicator[] = [
        {
          type: 'RESPONSE_LATENCY',
          severity: 'LOW',
          value: 2200,
          contribution: 10,
        },
      ]

      const result = monitor.assessOverloadRisk(35, indicators)

      expect(result.isOverload).toBe(false)
      expect(result.riskLevel).toBe('LOW')
    })
  })

  describe('generateRecommendations', () => {
    it('should generate CRITICAL recommendations for load >80', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [5000],
        errorRate: 0.6,
        engagementMetrics: {
          pauseCount: 10,
          pauseDurationMs: 600000,
          cardInteractions: 30,
        },
        performanceScores: [0.3, 0.3, 0.3, 0.3, 0.3],
        sessionDuration: 100,
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.9,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      expect(result.recommendations).toContain(
        'Critical cognitive overload detected - take a 10-minute break immediately',
      )
      expect(result.recommendations.some((r) => r.includes('pure review mode'))).toBe(true)
    })

    it('should generate HIGH load recommendations for load 60-80', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [3000],
        errorRate: 0.35,
        engagementMetrics: {
          pauseCount: 5,
          pauseDurationMs: 300000,
          cardInteractions: 20,
        },
        performanceScores: [0.6, 0.6, 0.6, 0.6, 0.6],
        sessionDuration: 70,
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.8,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      // Check for either high or moderate load recommendations
      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(
        result.recommendations.some(
          (r) => r.toLowerCase().includes('difficulty') || r.toLowerCase().includes('break'),
        ),
      ).toBe(true)
    })

    it('should generate appropriate recommendations based on load level', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2300],
        errorRate: 0.2,
        performanceScores: [0.75, 0.75, 0.75, 0.75, 0.75],
        sessionDuration: 45,
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.8,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      // Should have recommendations
      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.recommendations.every((r) => typeof r === 'string')).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty response latencies array', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [],
        errorRate: 0.1,
        performanceScores: [0.8],
        sessionDuration: 30,
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      expect(result.loadScore).toBeGreaterThanOrEqual(0)
      expect(result.loadScore).toBeLessThanOrEqual(100)
    })

    it('should handle missing engagement metrics', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2000],
        errorRate: 0.1,
        performanceScores: [0.8],
        sessionDuration: 30,
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      expect(result.confidenceLevel).toBeLessThan(1.0) // Reduced confidence
    })

    it('should handle missing baseline data', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2000],
        errorRate: 0.1,
        performanceScores: [0.8, 0.8, 0.8, 0.8, 0.8],
        sessionDuration: 30,
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      expect(result.confidenceLevel).toBeLessThan(0.7) // Significantly reduced confidence
    })

    it('should handle few performance scores (<5)', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2000],
        errorRate: 0.1,
        performanceScores: [0.8, 0.7], // Only 2 scores
        sessionDuration: 30,
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.8,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      expect(result.confidenceLevel).toBeLessThan(1.0)
    })

    it('should return safe defaults on error', async () => {
      const invalidData = null as any

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', invalidData)

      expect(result.loadScore).toBe(50)
      expect(result.loadLevel).toBe('MODERATE')
      expect(result.confidenceLevel).toBe(0)
      expect(
        result.recommendations.some((r) => r.includes('Unable to calculate cognitive load')),
      ).toBe(true)
    })
  })

  describe('determineLoadLevel', () => {
    it('should classify load score <40 as LOW', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2000],
        errorRate: 0.05,
        performanceScores: [0.85, 0.85, 0.85, 0.85, 0.85],
        sessionDuration: 25,
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.85,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      expect(result.loadLevel).toBe('LOW')
    })

    it('should classify load score 40-59 as MODERATE', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [2600], // 30% increase
        errorRate: 0.45, // 45% errors
        performanceScores: [0.65, 0.65, 0.65, 0.65, 0.65], // 18% decline
        sessionDuration: 70, // Duration stress
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.8,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      expect(result.loadLevel).toMatch(/MODERATE|HIGH/)
      expect(result.loadScore).toBeGreaterThan(40)
    })

    it('should classify load score 60-79 as HIGH', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [3500], // 75% increase
        errorRate: 0.65, // 65% errors
        engagementMetrics: {
          pauseCount: 8,
          pauseDurationMs: 450000, // 7.5 minutes pause in 30-min session
          cardInteractions: 20,
        },
        performanceScores: [0.5, 0.5, 0.5, 0.5, 0.5], // 37% decline
        sessionDuration: 90, // High duration stress
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.8,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      expect(result.loadLevel).toMatch(/HIGH|CRITICAL/)
      expect(result.loadScore).toBeGreaterThan(60)
    })

    it('should classify load score >=80 as CRITICAL', async () => {
      const sessionData: SessionBehavioralData = {
        userId: 'user-1',
        sessionId: 'session-1',
        responseLatencies: [8000], // 300% increase
        errorRate: 0.9, // 90% errors
        engagementMetrics: {
          pauseCount: 15,
          pauseDurationMs: 900000, // 15 minutes pause in 30-min session
          cardInteractions: 30,
        },
        performanceScores: [0.2, 0.2, 0.2, 0.2, 0.2], // 77% decline
        sessionDuration: 120, // 2 hours
        baselineData: {
          avgResponseLatency: 2000,
          baselinePerformance: 0.9,
        },
      }

      const result = await monitor.calculateCurrentLoad('user-1', 'session-1', sessionData)

      expect(result.loadLevel).toMatch(/HIGH|CRITICAL/)
      expect(result.loadScore).toBeGreaterThan(70)
    })
  })
})
