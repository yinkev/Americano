/**
 * Study Intensity Modulator Tests
 * Story 5.3 Task 5
 */

import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { StudyIntensityModulator } from '@/subsystems/behavioral-analytics/study-intensity-modulator'

// Mock fetch for Story 5.4 API integration
global.fetch = vi.fn()

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    userLearningProfile: {
      findUnique: vi.fn(),
    },
    studySession: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    behavioralEvent: {
      findMany: vi.fn(),
    },
    validationResponse: {
      findMany: vi.fn(),
    },
  },
}))

describe('StudyIntensityModulator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('assessCognitiveLoad', () => {
    it('should use Story 5.4 API when available', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ loadScore: 65, loadLevel: 'MODERATE', timestamp: new Date() }),
      } as Response)

      const load = await StudyIntensityModulator.assessCognitiveLoad('user-1')

      expect(load).toBe(65)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/cognitive-load/current'),
      )
    })

    it('should fallback to local calculation when API unavailable', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('API unavailable'))

      const { prisma } = await import('@/lib/db')

      // Mock local data for calculation
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([])
      vi.mocked(prisma.behavioralEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.validationResponse.findMany).mockResolvedValue([])
      vi.mocked(prisma.userLearningProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        preferredStudyTimes: [],
        averageSessionDuration: 45,
        optimalSessionDuration: 45,
        contentPreferences: {},
        learningStyleProfile: {},
        personalizedForgettingCurve: {},
        lastAnalyzedAt: new Date(),
        dataQualityScore: 0.7,
      })

      const load = await StudyIntensityModulator.assessCognitiveLoad('user-1')

      expect(typeof load).toBe('number')
      expect(load).toBeGreaterThanOrEqual(0)
      expect(load).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateIntensityLevel', () => {
    it('should return LOW for load < 40', () => {
      expect(StudyIntensityModulator.calculateIntensityLevel(30)).toBe('LOW')
    })

    it('should return MEDIUM for load 40-70', () => {
      expect(StudyIntensityModulator.calculateIntensityLevel(50)).toBe('MEDIUM')
      expect(StudyIntensityModulator.calculateIntensityLevel(70)).toBe('MEDIUM')
    })

    it('should return HIGH for load > 70', () => {
      expect(StudyIntensityModulator.calculateIntensityLevel(75)).toBe('HIGH')
      expect(StudyIntensityModulator.calculateIntensityLevel(90)).toBe('HIGH')
    })
  })

  describe('recommendRecoveryPeriod', () => {
    it('should require 2 days off for critical load (>80)', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ loadScore: 85, loadLevel: 'CRITICAL', timestamp: new Date() }),
      } as Response)

      const recovery = await StudyIntensityModulator.recommendRecoveryPeriod('user-1')

      expect(recovery.required).toBe(true)
      expect(recovery.daysOff).toBe(2)
      expect(recovery.message).toContain('Take 2 days off')
    })

    it('should recommend light review for high load (70-80)', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ loadScore: 75, loadLevel: 'HIGH', timestamp: new Date() }),
      } as Response)

      const recovery = await StudyIntensityModulator.recommendRecoveryPeriod('user-1')

      expect(recovery.required).toBe(true)
      expect(recovery.lightReviewOnly).toBe(true)
      expect(recovery.message).toContain('light review sessions')
    })
  })
})
