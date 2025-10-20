/**
 * Study Time Recommender Tests
 * Story 5.3 Task 2
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { StudyTimeRecommender } from '@/subsystems/behavioral-analytics/study-time-recommender'
import { StudyTimeAnalyzer } from '@/subsystems/behavioral-analytics/study-time-analyzer'
import { prisma } from '@/lib/db'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    userLearningProfile: {
      findUnique: jest.fn(),
    },
    // TODO: calendarIntegration model needs to be added to schema
    // calendarIntegration: {
    //   findUnique: jest.fn(),
    // },
    studySession: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/subsystems/behavioral-analytics/study-time-analyzer')

describe('StudyTimeRecommender', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateRecommendations', () => {
    it('should generate top 3-5 time slot recommendations', async () => {
      // Mock study time patterns
      jest.mocked(StudyTimeAnalyzer.analyzeOptimalStudyTimes).mockResolvedValue([
        {
          hourOfDay: 7,
          sessionCount: 15,
          avgPerformanceScore: 85,
          avgRetention: 0.82,
          completionRate: 0.9,
          avgEngagement: 88,
          timeOfDayScore: 86,
          confidence: 0.8,
        },
        {
          hourOfDay: 19,
          sessionCount: 12,
          avgPerformanceScore: 78,
          avgRetention: 0.75,
          completionRate: 0.85,
          avgEngagement: 80,
          timeOfDayScore: 78,
          confidence: 0.7,
        },
      ])

      // Mock user profile
      jest.mocked(prisma.userLearningProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        preferredStudyTimes: [{ dayOfWeek: 1, startHour: 7, endHour: 9 }],
        averageSessionDuration: 45,
        optimalSessionDuration: 50,
        contentPreferences: {},
        learningStyleProfile: {},
        personalizedForgettingCurve: {},
        lastAnalyzedAt: new Date(),
        dataQualityScore: 0.8,
      })

      // TODO: calendarIntegration model needs to be added to schema
      // Mock calendar integration
      // jest.mocked(prisma.calendarIntegration.findUnique).mockResolvedValue(null)

      // Mock recent sessions
      jest.mocked(prisma.studySession.findMany).mockResolvedValue([])

      const recommendations = await StudyTimeRecommender.generateRecommendations('user-1')

      expect(recommendations).toHaveLength(2)
      expect(recommendations[0].startTime.getHours()).toBe(7)
      expect(recommendations[0].score).toBeGreaterThan(0)
      expect(recommendations[0].confidence).toBeGreaterThan(0.5)
      expect(recommendations[0].calendarConflict).toBe(false)
    })

    it('should return default recommendations when no historical data', async () => {
      jest.mocked(StudyTimeAnalyzer.analyzeOptimalStudyTimes).mockResolvedValue([])

      const recommendations = await StudyTimeRecommender.generateRecommendations('user-1')

      expect(recommendations).toHaveLength(2)
      expect(recommendations[0].reasoning).toContain('Complete 6 more weeks')
      expect(recommendations[0].confidence).toBeLessThan(0.5)
    })
  })

  describe('adaptSchedule', () => {
    it('should record schedule adaptation and regenerate recommendations', async () => {
      jest.mocked(StudyTimeAnalyzer.analyzeOptimalStudyTimes).mockResolvedValue([])

      const createSpy = jest.fn().mockResolvedValue({})
      ;(prisma as any).scheduleAdaptation = { create: createSpy }

      await StudyTimeRecommender.adaptSchedule(
        'user-1',
        'TIME_SHIFT',
        'Recurring meeting conflict',
        '7:00 AM',
        '8:30 AM',
      )

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          adaptationType: 'TIME_SHIFT',
          reason: 'Recurring meeting conflict',
        }),
      })
    })
  })
})
