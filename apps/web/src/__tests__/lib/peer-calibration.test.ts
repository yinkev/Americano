/**
 * Peer Calibration Analyzer Tests
 *
 * Tests for privacy-protected peer comparison analytics.
 * Covers:
 * - Privacy enforcement (opt-in only, minimum 20 users)
 * - Distribution statistics calculation (quartiles, median, mean)
 * - Percentile ranking
 * - Common overconfident topic identification
 * - Edge cases and error handling
 *
 * Story 4.4 Task 9: Peer Calibration Comparison
 */

import { prisma } from '@/lib/db'
// Jest globals (describe, it, expect, beforeEach) are available without imports
import { PeerCalibrationAnalyzer } from '@/lib/peer-calibration'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    calibrationMetric: {
      findMany: jest.fn(),
    },
    validationResponse: {
      findMany: jest.fn(),
    },
    learningObjective: {
      findMany: jest.fn(),
    },
  },
}))

describe('PeerCalibrationAnalyzer', () => {
  let analyzer: PeerCalibrationAnalyzer

  beforeEach(() => {
    analyzer = new PeerCalibrationAnalyzer()
    jest.clearAllMocks()
  })

  describe('aggregatePeerData', () => {
    it('should enforce minimum pool size of 20 users', async () => {
      // Mock only 15 opted-in users
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 15 }, (_, i) => ({ id: `user${i}` })),
      )

      await expect(analyzer.aggregatePeerData()).rejects.toThrow(
        'Insufficient peer data for comparison. Need at least 20 participants (current: 15)',
      )
    })

    it('should only include opted-in users', async () => {
      // Mock 25 opted-in users
      const optedInUsers = Array.from({ length: 25 }, (_, i) => ({ id: `user${i}` }))
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(optedInUsers)

      // Mock calibration metrics
      const metrics = optedInUsers.map((user, i) => ({
        userId: user.id,
        correlationCoeff: 0.5 + i / 100, // 0.50 to 0.74
        sampleSize: 10,
      }))
      ;(prisma.calibrationMetric.findMany as jest.Mock).mockResolvedValue(metrics)

      const result = await analyzer.aggregatePeerData()

      // Verify query was called with sharePeerCalibrationData: true filter
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          sharePeerCalibrationData: true,
        },
        select: {
          id: true,
        },
      })

      expect(result.poolSize).toBe(25)
    })

    it('should calculate correct distribution statistics', async () => {
      // Mock 20 opted-in users
      const optedInUsers = Array.from({ length: 20 }, (_, i) => ({ id: `user${i}` }))
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(optedInUsers)

      // Mock calibration metrics with known distribution
      const correlations = [
        0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75,
        0.85, 0.95, 0.5,
      ]
      const metrics = optedInUsers.map((user, i) => ({
        userId: user.id,
        correlationCoeff: correlations[i],
        sampleSize: 10,
      }))
      ;(prisma.calibrationMetric.findMany as jest.Mock).mockResolvedValue(metrics)

      const result = await analyzer.aggregatePeerData()

      expect(result.poolSize).toBe(20)
      expect(result.correlations).toHaveLength(20)

      // Check quartiles are calculated
      expect(result.quartiles).toHaveLength(3)
      expect(result.quartiles[0]).toBeLessThan(result.quartiles[1]) // Q1 < Median
      expect(result.quartiles[1]).toBeLessThan(result.quartiles[2]) // Median < Q3

      // Check median is middle value
      expect(result.median).toBe(result.quartiles[1])

      // Check mean is calculated correctly
      const expectedMean = correlations.reduce((sum, c) => sum + c, 0) / correlations.length
      expect(result.mean).toBeCloseTo(expectedMean, 2)
    })

    it('should weight correlations by sample size', async () => {
      // Mock 20 opted-in users with varying sample sizes
      const optedInUsers = Array.from({ length: 20 }, (_, i) => ({ id: `user${i}` }))
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(optedInUsers)

      // User has multiple metrics with different sample sizes
      const metrics = [
        { userId: 'user0', correlationCoeff: 0.8, sampleSize: 20 }, // High weight
        { userId: 'user0', correlationCoeff: 0.2, sampleSize: 5 }, // Low weight
        ...optedInUsers.slice(1).map((user) => ({
          userId: user.id,
          correlationCoeff: 0.5,
          sampleSize: 10,
        })),
      ]
      ;(prisma.calibrationMetric.findMany as jest.Mock).mockResolvedValue(metrics)

      const result = await analyzer.aggregatePeerData()

      // User0's weighted average should be closer to 0.8 than 0.2
      // (0.8 * 20 + 0.2 * 5) / 25 = 17 / 25 = 0.68
      const sortedCorrelations = result.correlations.sort((a, b) => b - a)
      expect(sortedCorrelations[0]).toBeCloseTo(0.68, 2)
    })

    it('should filter out users with insufficient samples (< 5)', async () => {
      // Mock 25 opted-in users
      const optedInUsers = Array.from({ length: 25 }, (_, i) => ({ id: `user${i}` }))
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(optedInUsers)

      // 5 users have only 3 samples each (should be excluded)
      const metrics = [
        ...optedInUsers.slice(0, 5).map((user) => ({
          userId: user.id,
          correlationCoeff: 0.5,
          sampleSize: 3, // Below minimum
        })),
        ...optedInUsers.slice(5).map((user) => ({
          userId: user.id,
          correlationCoeff: 0.6,
          sampleSize: 10, // Valid
        })),
      ]
      ;(prisma.calibrationMetric.findMany as jest.Mock).mockResolvedValue(metrics)

      const result = await analyzer.aggregatePeerData()

      // Should only include 20 users (those with >= 5 samples)
      expect(result.poolSize).toBe(20)
    })
  })

  describe('calculateUserPercentile', () => {
    it('should calculate percentile correctly', () => {
      const peerDistribution = {
        correlations: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        quartiles: [0.325, 0.55, 0.775] as [number, number, number],
        median: 0.55,
        mean: 0.55,
        poolSize: 10,
      }

      // User at 0.75 should be at 70th percentile (7 out of 10 below)
      const percentile = analyzer.calculateUserPercentile(0.75, peerDistribution)
      expect(percentile).toBe(70)
    })

    it('should return 0 for user below all peers', () => {
      const peerDistribution = {
        correlations: [0.5, 0.6, 0.7, 0.8, 0.9],
        quartiles: [0.6, 0.7, 0.8] as [number, number, number],
        median: 0.7,
        mean: 0.7,
        poolSize: 5,
      }

      const percentile = analyzer.calculateUserPercentile(0.3, peerDistribution)
      expect(percentile).toBe(0)
    })

    it('should return 100 for user above all peers', () => {
      const peerDistribution = {
        correlations: [0.5, 0.6, 0.7, 0.8, 0.9],
        quartiles: [0.6, 0.7, 0.8] as [number, number, number],
        median: 0.7,
        mean: 0.7,
        poolSize: 5,
      }

      const percentile = analyzer.calculateUserPercentile(0.95, peerDistribution)
      expect(percentile).toBe(100)
    })

    it('should handle duplicate values correctly', () => {
      const peerDistribution = {
        correlations: [0.5, 0.5, 0.5, 0.8, 0.8],
        quartiles: [0.5, 0.5, 0.8] as [number, number, number],
        median: 0.5,
        mean: 0.62,
        poolSize: 5,
      }

      // User at 0.7 should be above 3 peers (all 0.5s)
      const percentile = analyzer.calculateUserPercentile(0.7, peerDistribution)
      expect(percentile).toBe(60)
    })
  })

  describe('identifyCommonOverconfidentTopics', () => {
    it('should identify topics with >= 50% prevalence by default', async () => {
      // Mock 20 opted-in users
      const optedInUsers = Array.from({ length: 20 }, (_, i) => ({ id: `user${i}` }))
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(optedInUsers)

      // Mock overconfident responses
      // 12 users (60%) show overconfidence in Cardiology
      // 8 users (40%) show overconfidence in Pharmacology
      const responses = [
        ...Array.from({ length: 12 }, (_, i) => ({
          userId: `user${i}`,
          calibrationDelta: 20 + i,
          prompt: { conceptName: 'Cardiology' },
        })),
        ...Array.from({ length: 8 }, (_, i) => ({
          userId: `user${i + 12}`,
          calibrationDelta: 18 + i,
          prompt: { conceptName: 'Pharmacology' },
        })),
      ]
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(responses)

      const topics = await analyzer.identifyCommonOverconfidentTopics()

      // Should only return Cardiology (60% >= 50%)
      expect(topics).toHaveLength(1)
      expect(topics[0].topic).toBe('Cardiology')
      expect(topics[0].prevalence).toBeCloseTo(0.6, 2)
      expect(topics[0].avgDelta).toBeGreaterThan(0)
    })

    it('should sort topics by prevalence (most common first)', async () => {
      const optedInUsers = Array.from({ length: 20 }, (_, i) => ({ id: `user${i}` }))
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(optedInUsers)

      const responses = [
        ...Array.from({ length: 15 }, (_, i) => ({
          userId: `user${i}`,
          calibrationDelta: 20,
          prompt: { conceptName: 'Cardiology' },
        })),
        ...Array.from({ length: 12 }, (_, i) => ({
          userId: `user${i}`,
          calibrationDelta: 18,
          prompt: { conceptName: 'Neurology' },
        })),
        ...Array.from({ length: 10 }, (_, i) => ({
          userId: `user${i}`,
          calibrationDelta: 22,
          prompt: { conceptName: 'Pharmacology' },
        })),
      ]
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(responses)

      const topics = await analyzer.identifyCommonOverconfidentTopics()

      // Should be sorted: Cardiology (75%) > Neurology (60%) > Pharmacology (50%)
      expect(topics).toHaveLength(3)
      expect(topics[0].topic).toBe('Cardiology')
      expect(topics[1].topic).toBe('Neurology')
      expect(topics[2].topic).toBe('Pharmacology')
    })

    it('should calculate average delta correctly', async () => {
      const optedInUsers = Array.from({ length: 20 }, (_, i) => ({ id: `user${i}` }))
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(optedInUsers)

      // 10 users show overconfidence in Cardiology with deltas [20, 22, 24, ...]
      const responses = Array.from({ length: 10 }, (_, i) => ({
        userId: `user${i}`,
        calibrationDelta: 20 + i * 2, // 20, 22, 24, ..., 38
        prompt: { conceptName: 'Cardiology' },
      }))
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(responses)

      const topics = await analyzer.identifyCommonOverconfidentTopics()

      // Average of [20, 22, 24, 26, 28, 30, 32, 34, 36, 38] = 29
      expect(topics).toHaveLength(1)
      expect(topics[0].avgDelta).toBeCloseTo(29, 1)
    })

    it('should return empty array when insufficient peers', async () => {
      // Only 15 users (below minimum)
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 15 }, (_, i) => ({ id: `user${i}` })),
      )

      const topics = await analyzer.identifyCommonOverconfidentTopics()
      expect(topics).toEqual([])
    })
  })

  describe('generatePeerComparison', () => {
    it('should throw error if user not opted-in', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        sharePeerCalibrationData: false,
      } as any)

      await expect(analyzer.generatePeerComparison('user1')).rejects.toThrow(
        'User has not opted into peer calibration data sharing',
      )
    })

    it('should throw error if user has insufficient data', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        sharePeerCalibrationData: true,
      } as any)

      // User has no calibration metrics
      ;(prisma.calibrationMetric.findMany as jest.Mock).mockResolvedValue([])

      await expect(analyzer.generatePeerComparison('user1')).rejects.toThrow(
        'Insufficient user data for peer comparison',
      )
    })

    it('should generate complete peer comparison successfully', async () => {
      // User is opted-in
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        sharePeerCalibrationData: true,
      } as any)

      // User has calibration metrics
      jest
        .mocked(prisma.calibrationMetric.findMany)
        .mockResolvedValueOnce([
          { correlationCoeff: 0.7, sampleSize: 15 },
          { correlationCoeff: 0.8, sampleSize: 10 },
        ] as any) // User metrics
        .mockResolvedValueOnce(
          Array.from({ length: 20 }, (_, i) => ({
            userId: `user${i}`,
            correlationCoeff: 0.5 + i / 40, // 0.5 to 0.975
            sampleSize: 10,
          })) as any,
        ) // Peer metrics

      // Peer users (for peer data aggregation)
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ id: `user${i}` })),
      )

      // Common topics
      ;(prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 15 }, (_, i) => ({
          userId: `user${i}`,
          calibrationDelta: 20,
          prompt: { conceptName: 'Cardiology' },
        })) as any,
      )

      const result = await analyzer.generatePeerComparison('user1')

      expect(result).toHaveProperty('userCorrelation')
      expect(result).toHaveProperty('userPercentile')
      expect(result).toHaveProperty('peerDistribution')
      expect(result).toHaveProperty('commonOverconfidentTopics')
      expect(result).toHaveProperty('peerAvgCorrelation')

      // User correlation should be weighted average: (0.7*15 + 0.8*10) / 25 = 0.74
      expect(result.userCorrelation).toBeCloseTo(0.74, 2)
    })
  })

  describe('Edge cases', () => {
    it('should handle perfect correlation (1.0)', async () => {
      const optedInUsers = Array.from({ length: 20 }, (_, i) => ({ id: `user${i}` }))
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(optedInUsers)

      const metrics = optedInUsers.map((user) => ({
        userId: user.id,
        correlationCoeff: 1.0,
        sampleSize: 10,
      }))
      ;(prisma.calibrationMetric.findMany as jest.Mock).mockResolvedValue(metrics)

      const result = await analyzer.aggregatePeerData()

      expect(result.mean).toBe(1.0)
      expect(result.median).toBe(1.0)
      expect(result.quartiles[0]).toBe(1.0)
      expect(result.quartiles[2]).toBe(1.0)
    })

    it('should handle negative correlations', async () => {
      const optedInUsers = Array.from({ length: 20 }, (_, i) => ({ id: `user${i}` }))
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(optedInUsers)

      const metrics = optedInUsers.map((user, i) => ({
        userId: user.id,
        correlationCoeff: -0.5 + i / 40, // -0.5 to -0.025
        sampleSize: 10,
      }))
      ;(prisma.calibrationMetric.findMany as jest.Mock).mockResolvedValue(metrics)

      const result = await analyzer.aggregatePeerData()

      expect(result.mean).toBeLessThan(0)
      expect(result.median).toBeLessThan(0)
    })

    it('should handle single user with multiple metrics', async () => {
      const optedInUsers = Array.from({ length: 20 }, (_, i) => ({ id: `user${i}` }))
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(optedInUsers)

      // One user has 5 different metrics (e.g., across different dates)
      const metrics = [
        { userId: 'user0', correlationCoeff: 0.5, sampleSize: 10 },
        { userId: 'user0', correlationCoeff: 0.6, sampleSize: 10 },
        { userId: 'user0', correlationCoeff: 0.7, sampleSize: 10 },
        { userId: 'user0', correlationCoeff: 0.8, sampleSize: 10 },
        { userId: 'user0', correlationCoeff: 0.9, sampleSize: 10 },
        ...optedInUsers.slice(1).map((user) => ({
          userId: user.id,
          correlationCoeff: 0.5,
          sampleSize: 10,
        })),
      ]
      ;(prisma.calibrationMetric.findMany as jest.Mock).mockResolvedValue(metrics)

      const result = await analyzer.aggregatePeerData()

      // user0's average: (0.5+0.6+0.7+0.8+0.9) / 5 = 0.7
      expect(result.poolSize).toBe(20)
    })
  })
})
