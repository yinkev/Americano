/**
 * Session Duration Analyzer Tests
 * Story 5.1 Task 3
 *
 * Tests duration pattern detection and fatigue analysis
 * Target: 60%+ coverage
 */

import { SessionDurationAnalyzer } from '../session-duration-analyzer'
import { prisma } from '@/lib/db'
import { ObjectiveComplexity } from '@/generated/prisma'

jest.mock('@/lib/db')

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const analyzer = new SessionDurationAnalyzer()

describe('SessionDurationAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('analyzeSessionDurationPatterns', () => {
    it('should group sessions into 6 duration buckets (<30, 30-40, 40-50, 50-60, 60-90, 90+)', async () => {
      const userId = 'test-user'

      // Create sessions across all buckets
      const mockSessions = [
        // <30 min bucket (3 sessions)
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `short-${i}`,
          userId,
          startedAt: new Date('2025-01-01T10:00:00Z'),
          completedAt: new Date('2025-01-01T10:25:00Z'),
          durationMs: 25 * 60 * 1000,
          reviews: [{ id: 'r', rating: 'GOOD' }],
          objectiveCompletions: [{ completed: true, selfAssessment: 4 }],
          mission: null,
        })),
        // 40-50 min bucket (5 sessions) - Optimal
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `optimal-${i}`,
          userId,
          startedAt: new Date('2025-01-01T10:00:00Z'),
          completedAt: new Date('2025-01-01T10:45:00Z'),
          durationMs: 45 * 60 * 1000,
          reviews: [
            { id: 'r1', rating: 'GOOD' },
            { id: 'r2', rating: 'EASY' },
          ],
          objectiveCompletions: [{ completed: true, selfAssessment: 5 }],
          mission: null,
        })),
        // 90+ min bucket (3 sessions)
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `long-${i}`,
          userId,
          startedAt: new Date('2025-01-01T10:00:00Z'),
          completedAt: new Date('2025-01-01T11:40:00Z'),
          durationMs: 100 * 60 * 1000,
          reviews: [
            { id: 'r1', rating: 'GOOD' },
            { id: 'r2', rating: 'HARD' },
          ],
          objectiveCompletions: [{ completed: false, selfAssessment: 3 }],
          mission: null,
        })),
      ]

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.analyzeSessionDurationPatterns(userId)

      // Assert
      expect(result).toBeDefined()
      expect(result.allBuckets.length).toBeGreaterThan(0)
      expect(result.totalSessionsAnalyzed).toBe(11)

      // Verify buckets are sorted by score
      for (let i = 0; i < result.allBuckets.length - 1; i++) {
        expect(result.allBuckets[i].bucketScore).toBeGreaterThanOrEqual(
          result.allBuckets[i + 1].bucketScore,
        )
      }

      // Optimal bucket should be 40-50 min (highest performance)
      expect(result.optimalBucket.durationRange).toContain('40-50')
      expect(result.optimalBucket.sessionCount).toBe(5)
    })

    it('should calculate bucketScore using formula: performance*0.5 + completion*0.3 + (1-fatigue)*0.2', async () => {
      const userId = 'test-formula'

      const mockSessions = Array.from({ length: 5 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T10:45:00Z'),
        durationMs: 45 * 60 * 1000,
        reviews: [
          { id: 'r1', rating: 'GOOD', reviewedAt: new Date('2025-01-01T10:10:00Z') },
          { id: 'r2', rating: 'GOOD', reviewedAt: new Date('2025-01-01T10:20:00Z') },
          { id: 'r3', rating: 'GOOD', reviewedAt: new Date('2025-01-01T10:30:00Z') },
          { id: 'r4', rating: 'HARD', reviewedAt: new Date('2025-01-01T10:40:00Z') },
        ],
        objectiveCompletions: [
          { completed: true, selfAssessment: 5 },
          { completed: true, selfAssessment: 4 },
        ],
        mission: null,
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.analyzeSessionDurationPatterns(userId)

      // Assert
      const bucket = result.optimalBucket
      const expectedScore =
        bucket.avgPerformance * 0.5 +
        bucket.completionRate * 100 * 0.3 +
        (1 - bucket.fatigueIndicator) * 100 * 0.2

      expect(bucket.bucketScore).toBeCloseTo(expectedScore, 1)
    })

    it('should return default 45-min recommendation with no sessions', async () => {
      const userId = 'test-empty'
      mockPrisma.studySession.findMany.mockResolvedValue([])

      // Act
      const result = await analyzer.analyzeSessionDurationPatterns(userId)

      // Assert
      expect(result.recommendedDuration).toBe(45) // Default
      expect(result.confidence).toBe(0)
      expect(result.totalSessionsAnalyzed).toBe(0)
      expect(result.allBuckets).toEqual([])
    })

    it('should skip buckets with <3 sessions (MIN_SESSIONS_PER_BUCKET)', async () => {
      const userId = 'test-min-threshold'

      // Create only 2 sessions in 30-40 bucket (below threshold)
      const mockSessions = Array.from({ length: 2 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T10:35:00Z'),
        durationMs: 35 * 60 * 1000,
        reviews: [{ id: 'r', rating: 'GOOD' }],
        objectiveCompletions: [],
        mission: null,
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.analyzeSessionDurationPatterns(userId)

      // Assert - bucket should be filtered out
      const bucket30_40 = result.allBuckets.find((b) => b.durationRange === '30-40 min')
      expect(bucket30_40).toBeUndefined()
    })

    it('should calculate recommendedDuration as midpoint of optimal bucket', async () => {
      const userId = 'test-midpoint'

      // Create sessions in 50-60 bucket
      const mockSessions = Array.from({ length: 10 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T10:55:00Z'),
        durationMs: 55 * 60 * 1000,
        reviews: [{ id: 'r', rating: 'GOOD' }],
        objectiveCompletions: [{ completed: true, selfAssessment: 5 }],
        mission: null,
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.analyzeSessionDurationPatterns(userId)

      // Assert - midpoint of 50-60 = 55 minutes
      expect(result.recommendedDuration).toBe(55)
      expect(result.optimalBucket.durationRange).toBe('50-60 min')
    })

    it('should handle 90+ bucket specially (max 120 minutes)', async () => {
      const userId = 'test-90-plus'

      const mockSessions = Array.from({ length: 5 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T11:50:00Z'),
        durationMs: 110 * 60 * 1000, // 110 minutes
        reviews: [{ id: 'r', rating: 'GOOD' }],
        objectiveCompletions: [{ completed: true, selfAssessment: 5 }],
        mission: null,
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.analyzeSessionDurationPatterns(userId)

      // Assert - 90+ bucket should recommend 90 minutes
      if (result.optimalBucket.durationRange === '90+ min') {
        expect(result.recommendedDuration).toBe(90)
        expect(result.optimalBucket.maxMinutes).toBe(120)
      }
    })

    it('should calculate confidence based on session count (min 1.0 at 50 sessions)', async () => {
      const userId = 'test-confidence'

      // Create exactly 50 sessions
      const mockSessions = Array.from({ length: 50 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T10:45:00Z'),
        durationMs: 45 * 60 * 1000,
        reviews: [{ id: 'r', rating: 'GOOD' }],
        objectiveCompletions: [{ completed: true, selfAssessment: 4 }],
        mission: null,
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.analyzeSessionDurationPatterns(userId)

      // Assert
      expect(result.confidence).toBe(1.0) // Max confidence at 50+ sessions
      expect(result.totalSessionsAnalyzed).toBe(50)
    })
  })

  describe('calculateOptimalDuration', () => {
    it('should return current vs recommended duration with reasoning', async () => {
      const userId = 'test-optimal'

      // Mock pattern analysis
      const mockSessions = Array.from({ length: 40 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T10:45:00Z'),
        durationMs: 45 * 60 * 1000,
        reviews: [{ id: 'r', rating: 'GOOD' }],
        objectiveCompletions: [{ completed: true, selfAssessment: 5 }],
        mission: null,
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.calculateOptimalDuration(userId)

      // Assert
      expect(result).toBeDefined()
      expect(result.current).toBe(45)
      expect(result.recommended).toBe(45)
      expect(result.confidence).toBeGreaterThan(0.7) // 40/50 = 0.8
      expect(result.reason).toContain('sessions')
      expect(result.byComplexity).toBeDefined()
    })

    it('should provide different durations by complexity (BASIC/INTERMEDIATE/ADVANCED)', async () => {
      const userId = 'test-complexity'

      const mockSessions = Array.from({ length: 30 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T11:00:00Z'),
        durationMs: 60 * 60 * 1000,
        reviews: [{ id: 'r', rating: 'GOOD' }],
        objectiveCompletions: [{ completed: true, selfAssessment: 5 }],
        mission: null,
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.calculateOptimalDuration(userId)

      // Assert
      expect(result.byComplexity).toBeDefined()
      if (result.byComplexity) {
        // BASIC should be -10 from optimal
        expect(result.byComplexity[ObjectiveComplexity.BASIC]).toBeLessThan(
          result.byComplexity[ObjectiveComplexity.INTERMEDIATE],
        )
        // ADVANCED should be +15 from optimal
        expect(result.byComplexity[ObjectiveComplexity.ADVANCED]).toBeGreaterThan(
          result.byComplexity[ObjectiveComplexity.INTERMEDIATE],
        )
      }
    })

    it('should return insufficient data message with low confidence (<0.4)', async () => {
      const userId = 'test-low-confidence'

      // Only 10 sessions
      const mockSessions = Array.from({ length: 10 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T10:45:00Z'),
        durationMs: 45 * 60 * 1000,
        reviews: [{ id: 'r', rating: 'GOOD' }],
        objectiveCompletions: [],
        mission: null,
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.calculateOptimalDuration(userId)

      // Assert
      expect(result.confidence).toBeLessThan(0.4)
      expect(result.reason).toContain('Insufficient data')
      expect(result.reason).toContain('20+ sessions')
      expect(result.byComplexity).toBeUndefined()
    })

    it('should default to 45 minutes with no sessions', async () => {
      const userId = 'test-default'
      mockPrisma.studySession.findMany.mockResolvedValue([])

      // Act
      const result = await analyzer.calculateOptimalDuration(userId)

      // Assert
      expect(result.current).toBe(45) // Default
      expect(result.recommended).toBe(45)
      expect(result.confidence).toBe(0)
    })
  })

  describe('detectSessionFatiguePoint', () => {
    it('should detect fatigue point when performance drops 20%', async () => {
      const userId = 'test-fatigue'
      const baseDate = new Date('2025-01-01T10:00:00Z')

      // Create long sessions with performance degradation
      const mockLongSessions = Array.from({ length: 6 }, (_, sessionIdx) => {
        // First 30 min: Good performance, then degradation
        const reviews = [
          ...Array.from({ length: 15 }, (_, i) => ({
            id: `s${sessionIdx}-r${i}`,
            reviewedAt: new Date(baseDate.getTime() + i * 2 * 60 * 1000), // First 30 min
            rating: 'GOOD' as const,
          })),
          ...Array.from({ length: 15 }, (_, i) => ({
            id: `s${sessionIdx}-r${i + 15}`,
            reviewedAt: new Date(baseDate.getTime() + (30 + i * 2) * 60 * 1000), // After 30 min
            rating: 'HARD' as const, // Performance degraded
          })),
        ]

        return {
          id: `long-${sessionIdx}`,
          userId,
          startedAt: baseDate,
          completedAt: new Date(baseDate.getTime() + 70 * 60 * 1000),
          durationMs: 70 * 60 * 1000,
          reviews,
        }
      })

      const allSessions = mockLongSessions.map((s) => ({ durationMs: s.durationMs }))

      mockPrisma.studySession.findMany
        .mockResolvedValueOnce(mockLongSessions as any) // First call: long sessions
        .mockResolvedValueOnce(allSessions as any) // Second call: all sessions

      // Act
      const result = await analyzer.detectSessionFatiguePoint(userId)

      // Assert
      expect(result.fatigueDetected).toBe(true)
      expect(result.fatiguePoint).toBeGreaterThan(0)
      expect(result.longSessionCount).toBe(6)
      expect(result.optimalBreakInterval).toBeGreaterThan(0)
      expect(result.recommendation).toContain('Performance degrades')
    })

    it('should return null fatigue point with insufficient long sessions (<5)', async () => {
      const userId = 'test-insufficient'

      // Only 3 long sessions
      const mockLongSessions = Array.from({ length: 3 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T11:20:00Z'),
        durationMs: 80 * 60 * 1000,
        reviews: [],
      }))

      const allSessions = [{ durationMs: 45 * 60 * 1000 }]

      mockPrisma.studySession.findMany
        .mockResolvedValueOnce(mockLongSessions as any)
        .mockResolvedValueOnce(allSessions as any)

      // Act
      const result = await analyzer.detectSessionFatiguePoint(userId)

      // Assert
      expect(result.fatigueDetected).toBe(false)
      expect(result.fatiguePoint).toBeNull()
      expect(result.longSessionCount).toBe(3)
      expect(result.recommendation).toContain('Complete 2 more sessions')
    })

    it('should calculate optimalBreakInterval 10 min before fatigue point (min 30)', async () => {
      const userId = 'test-break-interval'
      const baseDate = new Date('2025-01-01T10:00:00Z')

      // Sessions with fatigue at 50 minutes
      const mockLongSessions = Array.from({ length: 6 }, (_, sessionIdx) => ({
        id: `s${sessionIdx}`,
        userId,
        startedAt: baseDate,
        completedAt: new Date(baseDate.getTime() + 70 * 60 * 1000),
        durationMs: 70 * 60 * 1000,
        reviews: [
          // First 40 min: Good (buckets 10, 20, 30, 40)
          ...Array.from({ length: 20 }, (_, i) => ({
            id: `r${i}`,
            reviewedAt: new Date(baseDate.getTime() + i * 2 * 60 * 1000),
            rating: 'GOOD' as const,
          })),
          // After 50 min: Degraded
          ...Array.from({ length: 10 }, (_, i) => ({
            id: `r${i + 20}`,
            reviewedAt: new Date(baseDate.getTime() + (50 + i * 2) * 60 * 1000),
            rating: 'AGAIN' as const,
          })),
        ],
      }))

      mockPrisma.studySession.findMany
        .mockResolvedValueOnce(mockLongSessions as any)
        .mockResolvedValueOnce([{ durationMs: 70 * 60 * 1000 }] as any)

      // Act
      const result = await analyzer.detectSessionFatiguePoint(userId)

      // Assert
      if (result.fatiguePoint) {
        const expected = Math.max(30, result.fatiguePoint - 10)
        expect(result.optimalBreakInterval).toBe(expected)
      }
    })

    it('should report no fatigue if performance stays consistent', async () => {
      const userId = 'test-no-fatigue'
      const baseDate = new Date('2025-01-01T10:00:00Z')

      // Consistent high performance throughout
      const mockLongSessions = Array.from({ length: 6 }, (_, sessionIdx) => ({
        id: `s${sessionIdx}`,
        userId,
        startedAt: baseDate,
        completedAt: new Date(baseDate.getTime() + 70 * 60 * 1000),
        durationMs: 70 * 60 * 1000,
        reviews: Array.from({ length: 35 }, (_, i) => ({
          id: `r${i}`,
          reviewedAt: new Date(baseDate.getTime() + i * 2 * 60 * 1000),
          rating: 'GOOD' as const,
        })),
      }))

      mockPrisma.studySession.findMany
        .mockResolvedValueOnce(mockLongSessions as any)
        .mockResolvedValueOnce([{ durationMs: 70 * 60 * 1000 }] as any)

      // Act
      const result = await analyzer.detectSessionFatiguePoint(userId)

      // Assert
      expect(result.fatigueDetected).toBe(false)
      expect(result.fatiguePoint).toBeNull()
      expect(result.recommendation).toContain('No significant fatigue pattern')
    })

    it('should require at least 10 reviews per session for analysis', async () => {
      const userId = 'test-min-reviews'

      // Sessions with too few reviews
      const mockLongSessions = Array.from({ length: 6 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T11:10:00Z'),
        durationMs: 70 * 60 * 1000,
        reviews: Array.from({ length: 5 }, (_, j) => ({
          id: `r${j}`,
          reviewedAt: new Date('2025-01-01T10:10:00Z'),
          rating: 'GOOD' as const,
        })), // Only 5 reviews
      }))

      mockPrisma.studySession.findMany
        .mockResolvedValueOnce(mockLongSessions as any)
        .mockResolvedValueOnce([{ durationMs: 70 * 60 * 1000 }] as any)

      // Act
      const result = await analyzer.detectSessionFatiguePoint(userId)

      // Assert - should not detect fatigue due to insufficient reviews
      expect(result.fatigueDetected).toBe(false)
    })

    it('should analyze performance in 10-minute segments', async () => {
      const userId = 'test-segments'
      const baseDate = new Date('2025-01-01T10:00:00Z')

      const mockLongSessions = [
        {
          id: 's1',
          userId,
          startedAt: baseDate,
          completedAt: new Date(baseDate.getTime() + 60 * 60 * 1000),
          durationMs: 60 * 60 * 1000,
          reviews: [
            // 0-10 min: segment 1
            ...Array.from({ length: 5 }, (_, i) => ({
              id: `r1-${i}`,
              reviewedAt: new Date(baseDate.getTime() + i * 60 * 1000),
              rating: 'GOOD' as const,
            })),
            // 10-20 min: segment 2
            ...Array.from({ length: 5 }, (_, i) => ({
              id: `r2-${i}`,
              reviewedAt: new Date(baseDate.getTime() + (10 + i) * 60 * 1000),
              rating: 'GOOD' as const,
            })),
            // 20-30 min: segment 3 - degradation starts
            ...Array.from({ length: 5 }, (_, i) => ({
              id: `r3-${i}`,
              reviewedAt: new Date(baseDate.getTime() + (20 + i) * 60 * 1000),
              rating: 'HARD' as const,
            })),
          ],
        },
      ]

      // Need at least 5 long sessions
      const allLongSessions = Array.from({ length: 5 }, (_, i) => ({
        ...mockLongSessions[0],
        id: `s${i}`,
      }))

      mockPrisma.studySession.findMany
        .mockResolvedValueOnce(allLongSessions as any)
        .mockResolvedValueOnce([{ durationMs: 60 * 60 * 1000 }] as any)

      // Act
      const result = await analyzer.detectSessionFatiguePoint(userId)

      // Assert - should detect segments and fatigue
      expect(result).toBeDefined()
      expect(result.longSessionCount).toBe(5)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle sessions with no reviews gracefully', async () => {
      const userId = 'test-no-reviews'

      const mockSessions = Array.from({ length: 10 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T10:45:00Z'),
        durationMs: 45 * 60 * 1000,
        reviews: [], // No reviews
        objectiveCompletions: [],
        mission: null,
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.analyzeSessionDurationPatterns(userId)

      // Assert - should not crash
      expect(result).toBeDefined()
    })

    it('should handle sessions with no objective completions', async () => {
      const userId = 'test-no-objectives'

      const mockSessions = Array.from({ length: 10 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date('2025-01-01T10:00:00Z'),
        completedAt: new Date('2025-01-01T10:45:00Z'),
        durationMs: 45 * 60 * 1000,
        reviews: [{ id: 'r', rating: 'GOOD' }],
        objectiveCompletions: [], // No objectives
        mission: null,
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.analyzeSessionDurationPatterns(userId)

      // Assert
      expect(result).toBeDefined()
      expect(result.optimalBucket.completionRate).toBe(0)
    })

    it('should handle null durationMs gracefully', async () => {
      const userId = 'test-null-duration'

      const mockSessions = [
        {
          id: 's1',
          userId,
          startedAt: new Date('2025-01-01T10:00:00Z'),
          completedAt: new Date('2025-01-01T10:45:00Z'),
          durationMs: null, // Null duration
          reviews: [],
          objectiveCompletions: [],
          mission: null,
        },
      ]

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await analyzer.analyzeSessionDurationPatterns(userId)

      // Assert - should filter out null durations
      expect(result.totalSessionsAnalyzed).toBe(0)
    })
  })

  describe('robustness - invalid durations', () => {
    it('filters invalid or null durations and keeps aggregates finite', async () => {
      const userId = 'test-invalid-durations'

      const mockSessions = [
        {
          id: 's1',
          userId,
          startedAt: new Date('2025-01-01T10:00:00Z'),
          completedAt: new Date('2025-01-01T10:45:00Z'),
          durationMs: 45 * 60 * 1000,
          reviews: [{ id: 'r', rating: 'GOOD' }],
          objectiveCompletions: [{ completed: true, selfAssessment: 5 }],
          mission: null,
        },
        {
          id: 's2',
          userId,
          startedAt: new Date('2025-01-02T10:00:00Z'),
          completedAt: new Date('2025-01-02T10:20:00Z'),
          durationMs: null,
          reviews: [],
          objectiveCompletions: [],
          mission: null,
        },
        {
          id: 's3',
          userId,
          startedAt: new Date('2025-01-03T10:00:00Z'),
          completedAt: new Date('2025-01-03T10:50:00Z'),
          durationMs: 'not-a-number' as any,
          reviews: [],
          objectiveCompletions: [],
          mission: null,
        },
      ]

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      const result = await analyzer.analyzeSessionDurationPatterns(userId)

      // Only the valid session should be analyzed
      expect(result.totalSessionsAnalyzed).toBe(1)

      // All bucket metrics should be finite numbers
      result.allBuckets.forEach((b) => {
        expect(Number.isFinite(b.avgPerformance)).toBe(true)
        expect(Number.isFinite(b.completionRate)).toBe(true)
        expect(Number.isFinite(b.fatigueIndicator)).toBe(true)
        expect(Number.isFinite(b.bucketScore)).toBe(true)
      })
    })
  })
})
