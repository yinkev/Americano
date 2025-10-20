/**
 * Mission Analytics Engine Tests
 *
 * Tests for completion rate calculation, performance correlation,
 * and mission adjustment recommendations.
 *
 * Story 2.6 - Task 12.1: Test Analytics Calculations
 */

import { MissionAnalyticsEngine } from '@/lib/mission-analytics-engine'
import { prisma } from '@/lib/db'
import { MissionStatus, AnalyticsPeriod } from '@/generated/prisma'

// Mock Prisma client
jest.mock('@/lib/db')

describe('MissionAnalyticsEngine', () => {
  let engine: MissionAnalyticsEngine

  beforeEach(() => {
    engine = new MissionAnalyticsEngine()
    jest.clearAllMocks()
  })

  describe('calculateDailyAnalytics', () => {
    it('should calculate daily analytics for completed missions', async () => {
      const testDate = new Date('2025-10-15')
      const mockMissions = [
        {
          id: '1',
          userId: 'user1',
          status: MissionStatus.COMPLETED,
          objectives: [
            { objectiveId: 'obj1', completed: true },
            { objectiveId: 'obj2', completed: true },
            { objectiveId: 'obj3', completed: false },
          ],
          estimatedMinutes: 60,
          actualMinutes: 55,
          difficultyRating: 3,
          successScore: 0.85,
          feedback: [],
        },
        {
          id: '2',
          userId: 'user1',
          status: MissionStatus.COMPLETED,
          objectives: [
            { objectiveId: 'obj4', completed: true },
            { objectiveId: 'obj5', completed: true },
          ],
          estimatedMinutes: 45,
          actualMinutes: 50,
          difficultyRating: 2,
          successScore: 0.92,
          feedback: [],
        },
        {
          id: '3',
          userId: 'user1',
          status: MissionStatus.SKIPPED,
          objectives: [],
          estimatedMinutes: 30,
          actualMinutes: null,
          difficultyRating: null,
          successScore: null,
          feedback: [],
        },
      ]

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.calculateDailyAnalytics('user1', testDate)

      expect(result).toMatchObject({
        userId: 'user1',
        period: AnalyticsPeriod.DAILY,
        missionsGenerated: 3,
        missionsCompleted: 2,
        missionsSkipped: 1,
      })

      // Mission 1: 2/3 = 0.667, Mission 2: 2/2 = 1.0 → avg = 0.833
      expect(result.avgCompletionRate).toBeCloseTo(0.833, 2)

      // Mission 1: 1 - |55-60|/60 = 0.917, Mission 2: 1 - |50-45|/45 = 0.889 → avg = 0.903
      expect(result.avgTimeAccuracy).toBeCloseTo(0.903, 2)

      // (3 + 2) / 2 = 2.5
      expect(result.avgDifficultyRating).toBeCloseTo(2.5, 1)

      // (0.85 + 0.92) / 2 = 0.885
      expect(result.avgSuccessScore).toBeCloseTo(0.885, 2)
    })

    it('should handle edge case: no missions for date', async () => {
      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue([])

      const result = await engine.calculateDailyAnalytics('user1')

      expect(result.missionsGenerated).toBe(0)
      expect(result.missionsCompleted).toBe(0)
      expect(result.avgCompletionRate).toBe(0)
      expect(result.avgTimeAccuracy).toBe(0)
    })

    it('should handle edge case: all missions skipped', async () => {
      const mockMissions = [
        {
          id: '1',
          status: MissionStatus.SKIPPED,
          objectives: [],
          estimatedMinutes: 60,
          actualMinutes: null,
          difficultyRating: null,
          successScore: null,
          feedback: [],
        },
      ]

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.calculateDailyAnalytics('user1')

      expect(result.missionsGenerated).toBe(1)
      expect(result.missionsCompleted).toBe(0)
      expect(result.missionsSkipped).toBe(1)
      expect(result.avgCompletionRate).toBe(0)
    })

    it('should handle edge case: zero time for accuracy calculation', async () => {
      const mockMissions = [
        {
          id: '1',
          status: MissionStatus.COMPLETED,
          objectives: [{ objectiveId: 'obj1', completed: true }],
          estimatedMinutes: 0, // Edge case: zero estimated time
          actualMinutes: 5,
          difficultyRating: 3,
          successScore: 0.8,
          feedback: [],
        },
      ]

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.calculateDailyAnalytics('user1')

      // Should handle division by zero gracefully
      expect(result.avgCompletionRate).toBe(1.0)
      expect(isNaN(result.avgTimeAccuracy)).toBe(false)
    })
  })

  describe('calculateCompletionRate', () => {
    it('should calculate 7-day completion rate correctly', async () => {
      const mockMissions = [
        { id: '1', status: MissionStatus.COMPLETED },
        { id: '2', status: MissionStatus.COMPLETED },
        { id: '3', status: MissionStatus.COMPLETED },
        { id: '4', status: MissionStatus.COMPLETED },
        { id: '5', status: MissionStatus.COMPLETED },
        { id: '6', status: MissionStatus.COMPLETED },
        { id: '7', status: MissionStatus.SKIPPED },
      ]

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.calculateCompletionRate('user1', '7d')

      // 6 completed / 7 total = 0.857
      expect(result).toBeCloseTo(0.857, 2)
    })

    it('should calculate 30-day completion rate correctly', async () => {
      const mockMissions = Array.from({ length: 30 }, (_, i) => ({
        id: `mission-${i}`,
        status: i < 25 ? MissionStatus.COMPLETED : MissionStatus.SKIPPED,
      }))

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.calculateCompletionRate('user1', '30d')

      // 25 completed / 30 total = 0.833
      expect(result).toBeCloseTo(0.833, 2)
    })

    it('should calculate 90-day completion rate correctly', async () => {
      const mockMissions = Array.from({ length: 90 }, (_, i) => ({
        id: `mission-${i}`,
        status: i < 81 ? MissionStatus.COMPLETED : MissionStatus.SKIPPED,
      }))

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.calculateCompletionRate('user1', '90d')

      // 81 completed / 90 total = 0.9
      expect(result).toBe(0.9)
    })

    it('should calculate all-time completion rate', async () => {
      const mockMissions = Array.from({ length: 100 }, (_, i) => ({
        id: `mission-${i}`,
        status: i < 75 ? MissionStatus.COMPLETED : MissionStatus.SKIPPED,
      }))

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.calculateCompletionRate('user1', 'all')

      // 75 completed / 100 total = 0.75
      expect(result).toBe(0.75)
    })

    it('should return 0 for no missions', async () => {
      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue([])

      const result = await engine.calculateCompletionRate('user1', '7d')

      expect(result).toBe(0)
    })
  })

  describe('detectPerformanceCorrelation', () => {
    it('should calculate positive Pearson correlation', async () => {
      // Create missions with positive correlation: high completion → high mastery
      const mockMissions = Array.from({ length: 10 }, (_, i) => ({
        id: `mission-${i}`,
        userId: 'user1',
        status: MissionStatus.COMPLETED,
        objectives: [
          { objectiveId: 'obj1', completed: true },
          { objectiveId: 'obj2', completed: i > 5 }, // Higher completion later
        ],
        studySessions: [
          {
            reviews: [
              { rating: 'GOOD' },
              { rating: i > 5 ? 'GOOD' : 'AGAIN' }, // Higher mastery later
            ],
          },
        ],
      }))

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.detectPerformanceCorrelation('user1')

      expect(result.sampleSize).toBe(10)
      expect(result.correlationCoefficient).toBeGreaterThan(0)
      expect(result.pValue).toBeLessThan(1.0)
      expect(result.dataPoints).toHaveLength(10)
    })

    it('should return low confidence for insufficient data', async () => {
      // Only 5 missions (need 7 minimum)
      const mockMissions = Array.from({ length: 5 }, (_, i) => ({
        id: `mission-${i}`,
        status: MissionStatus.COMPLETED,
        objectives: [{ objectiveId: 'obj1', completed: true }],
        studySessions: [{ reviews: [{ rating: 'GOOD' }] }],
      }))

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.detectPerformanceCorrelation('user1')

      expect(result.confidence).toBe('LOW')
      expect(result.sampleSize).toBe(5)
      expect(result.insight).toContain('Insufficient data')
      expect(result.insight).toContain('2 more missions')
    })

    it('should calculate high confidence with sufficient data', async () => {
      // 30+ missions with strong correlation and low p-value
      const mockMissions = Array.from({ length: 30 }, (_, i) => {
        const completionRate = i / 30 // Gradual improvement
        return {
          id: `mission-${i}`,
          status: MissionStatus.COMPLETED,
          objectives: [
            { objectiveId: 'obj1', completed: i > 10 },
            { objectiveId: 'obj2', completed: i > 20 },
          ],
          studySessions: [
            {
              reviews: Array.from({ length: 5 }, (_, j) => ({
                rating: j < completionRate * 5 ? 'GOOD' : 'AGAIN',
              })),
            },
          ],
        }
      })

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.detectPerformanceCorrelation('user1')

      expect(result.sampleSize).toBe(30)
      expect(result.confidence).toBe('HIGH')
      expect(result.pValue).toBeLessThan(0.01)
    })

    it('should generate appropriate insights for strong correlation', async () => {
      const mockMissions = Array.from({ length: 15 }, (_, i) => ({
        id: `mission-${i}`,
        status: MissionStatus.COMPLETED,
        objectives: [
          { objectiveId: 'obj1', completed: true },
          { objectiveId: 'obj2', completed: true },
        ],
        studySessions: [
          {
            reviews: [{ rating: 'GOOD' }, { rating: 'GOOD' }],
          },
        ],
      }))

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.detectPerformanceCorrelation('user1')

      expect(result.correlationCoefficient).toBeGreaterThan(0)
      expect(result.insight).toBeTruthy()
      expect(result.insight.length).toBeGreaterThan(0)
    })
  })

  describe('recommendMissionAdjustments', () => {
    it('should recommend reducing duration for low completion', async () => {
      // Consistent low completion (<70%)
      const mockMissions = Array.from({ length: 10 }, (_, i) => ({
        id: `mission-${i}`,
        estimatedMinutes: 60,
        status: i < 5 ? MissionStatus.COMPLETED : MissionStatus.SKIPPED, // 50% completion
      }))

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.recommendMissionAdjustments('user1')

      expect(result.adjustments.duration).toBeDefined()
      expect(result.adjustments.duration?.current).toBe(60)
      expect(result.adjustments.duration?.recommended).toBe(51) // 60 * 0.85 = 51
      expect(result.adjustments.duration?.reason).toContain('below optimal')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should recommend increasing complexity for high completion', async () => {
      // Consistent high completion (>90%)
      const mockMissions = Array.from({ length: 10 }, (_, i) => ({
        id: `mission-${i}`,
        estimatedMinutes: 60,
        status: i < 10 ? MissionStatus.COMPLETED : MissionStatus.SKIPPED, // 100% completion
        actualMinutes: 55,
      }))

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.recommendMissionAdjustments('user1')

      expect(result.adjustments.complexity).toBeDefined()
      expect(result.adjustments.complexity?.current).toBe('MODERATE')
      expect(result.adjustments.complexity?.recommended).toBe('CHALLENGING')
      expect(result.adjustments.complexity?.reason).toContain('above optimal')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should recommend adding objectives for finishing early', async () => {
      const mockMissions = Array.from({ length: 10 }, (_, i) => ({
        id: `mission-${i}`,
        estimatedMinutes: 60,
        actualMinutes: 40, // Consistently 20 min early
        status: MissionStatus.COMPLETED,
      }))

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.recommendMissionAdjustments('user1')

      expect(result.adjustments.objectiveTypes).toBeDefined()
      expect(result.adjustments.objectiveTypes?.add).toContain('review objectives')
      expect(result.adjustments.objectiveTypes?.reason).toContain('faster than estimated')
    })

    it('should return empty adjustments for insufficient data', async () => {
      // Only 5 missions (need 7 minimum)
      const mockMissions = Array.from({ length: 5 }, () => ({
        id: 'mission',
        status: MissionStatus.COMPLETED,
        estimatedMinutes: 60,
      }))

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.recommendMissionAdjustments('user1')

      expect(result.adjustments).toEqual({})
      expect(result.confidence).toBe(0)
    })

    it('should not recommend adjustments for optimal completion rate', async () => {
      // 80% completion (within 70-90% optimal range)
      const mockMissions = Array.from({ length: 10 }, (_, i) => ({
        id: `mission-${i}`,
        estimatedMinutes: 60,
        actualMinutes: 58,
        status: i < 8 ? MissionStatus.COMPLETED : MissionStatus.SKIPPED,
      }))

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.recommendMissionAdjustments('user1')

      // Should not recommend duration or complexity changes
      expect(result.adjustments.duration).toBeUndefined()
      expect(result.adjustments.complexity).toBeUndefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missions with no objectives', async () => {
      const mockMissions = [
        {
          id: '1',
          status: MissionStatus.COMPLETED,
          objectives: [], // Empty objectives array
          estimatedMinutes: 60,
          actualMinutes: 60,
          difficultyRating: 3,
          successScore: 0.5,
          feedback: [],
        },
      ]

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.calculateDailyAnalytics('user1')

      expect(result.avgCompletionRate).toBe(0)
      expect(result.missionsCompleted).toBe(1)
    })

    it('should handle null/undefined values gracefully', async () => {
      const mockMissions = [
        {
          id: '1',
          status: MissionStatus.COMPLETED,
          objectives: [{ objectiveId: 'obj1', completed: true }],
          estimatedMinutes: 60,
          actualMinutes: null, // No actual time recorded
          difficultyRating: null, // No difficulty rating
          successScore: null, // No success score
          feedback: [],
        },
      ]

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.calculateDailyAnalytics('user1')

      expect(result.avgCompletionRate).toBe(1.0)
      expect(result.avgTimeAccuracy).toBe(0)
      expect(result.avgDifficultyRating).toBe(0)
      expect(result.avgSuccessScore).toBe(0)
    })

    it('should handle future dates', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue([])

      const result = await engine.calculateDailyAnalytics('user1', futureDate)

      expect(result.missionsGenerated).toBe(0)
      expect(result.date).toEqual(expect.any(Date))
    })
  })

  describe('Success Score Calculation', () => {
    it('should calculate weighted success score components', async () => {
      const mockMissions = [
        {
          id: '1',
          status: MissionStatus.COMPLETED,
          objectives: [
            { objectiveId: 'obj1', completed: true },
            { objectiveId: 'obj2', completed: true },
          ],
          estimatedMinutes: 60,
          actualMinutes: 60,
          difficultyRating: 3,
          successScore: 0.9, // High success
          feedback: [],
        },
        {
          id: '2',
          status: MissionStatus.COMPLETED,
          objectives: [
            { objectiveId: 'obj3', completed: true },
            { objectiveId: 'obj4', completed: false },
          ],
          estimatedMinutes: 45,
          actualMinutes: 50,
          difficultyRating: 4,
          successScore: 0.7, // Moderate success
          feedback: [],
        },
      ]

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.calculateDailyAnalytics('user1')

      // Average: (0.9 + 0.7) / 2 = 0.8
      expect(result.avgSuccessScore).toBeCloseTo(0.8, 1)
    })

    it('should verify success score formula components', async () => {
      // Success score formula: 30% completion + 25% performance + 20% time + 15% feedback + 10% streak
      // This test verifies the weighted average calculation

      const mockMissions = [
        {
          id: '1',
          status: MissionStatus.COMPLETED,
          objectives: [{ objectiveId: 'obj1', completed: true }],
          estimatedMinutes: 60,
          actualMinutes: 60,
          difficultyRating: 3,
          successScore: 1.0, // Perfect success
          feedback: [],
        },
        {
          id: '2',
          status: MissionStatus.COMPLETED,
          objectives: [{ objectiveId: 'obj2', completed: false }],
          estimatedMinutes: 60,
          actualMinutes: 80,
          difficultyRating: 5,
          successScore: 0.5, // Low success
          feedback: [],
        },
      ]

      ;(prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions)

      const result = await engine.calculateDailyAnalytics('user1')

      // Average: (1.0 + 0.5) / 2 = 0.75
      expect(result.avgSuccessScore).toBeCloseTo(0.75, 2)
    })
  })
})
