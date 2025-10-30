/**
 * Study Time Analyzer Tests
 * Story 5.1 Task 2
 *
 * Tests optimal study time detection algorithm
 * Target: 60%+ coverage
 */

import { prisma } from '@/lib/db'
import { PerformanceCalculator } from '@/lib/performance-calculator'
import { StudyTimeAnalyzer } from '../study-time-analyzer'

jest.mock('@/lib/db')
jest.mock('@/lib/performance-calculator')

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockPerformanceCalculator = PerformanceCalculator as jest.Mocked<typeof PerformanceCalculator>

describe('StudyTimeAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('analyzeOptimalStudyTimes', () => {
    it('should identify optimal study times from session data', async () => {
      const userId = 'test-user'

      // Create sessions at specific hours with varying performance
      const mockSessions = [
        // Morning sessions (9 AM) - High performance
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `morning-${i}`,
          userId,
          startedAt: new Date(`2025-01-${i + 1}T09:00:00Z`),
          completedAt: new Date(`2025-01-${i + 1}T10:00:00Z`),
          durationMs: 3600000, // 1 hour
          reviewsCompleted: 40,
          objectiveCompletions: [
            { objectiveId: 'obj1', completedAt: new Date().toISOString(), selfAssessment: 5 },
            { objectiveId: 'obj2', completedAt: new Date().toISOString(), selfAssessment: 4 },
          ],
          reviews: [{ id: `r${i}`, rating: 'GOOD' }],
        })),
        // Afternoon sessions (2 PM) - Medium performance
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `afternoon-${i}`,
          userId,
          startedAt: new Date(`2025-01-${i + 1}T14:00:00Z`),
          completedAt: new Date(`2025-01-${i + 1}T15:00:00Z`),
          durationMs: 3600000,
          reviewsCompleted: 25,
          objectiveCompletions: [
            { objectiveId: 'obj3', completedAt: new Date().toISOString(), selfAssessment: 3 },
          ],
          reviews: [{ id: `r${i}`, rating: 'HARD' }],
        })),
        // Night sessions (9 PM) - Low performance
        ...Array.from({ length: 6 }, (_, i) => ({
          id: `night-${i}`,
          userId,
          startedAt: new Date(`2025-01-${i + 1}T21:00:00Z`),
          completedAt: new Date(`2025-01-${i + 1}T22:00:00Z`),
          durationMs: 3600000,
          reviewsCompleted: 15,
          objectiveCompletions: [{ objectiveId: 'obj4', selfAssessment: 2 }],
          reviews: [{ id: `r${i}`, rating: 'AGAIN' }],
        })),
      ]

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Mock retention scores based on performance
      mockPerformanceCalculator.calculateRetentionScore.mockImplementation((reviews: any[]) => {
        if (!reviews || reviews.length === 0) return 0
        const rating = reviews[0].rating
        return rating === 'GOOD' ? 0.9 : rating === 'HARD' ? 0.6 : 0.3
      })

      // Act
      const result = await StudyTimeAnalyzer.analyzeOptimalStudyTimes(userId, 6)

      // Assert
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeLessThanOrEqual(3) // Top 3 hours

      if (result.length > 0) {
        // First result should be 9 AM (highest performance)
        const topHour = result[0]
        expect(topHour.hourOfDay).toBe(9)
        expect(topHour.sessionCount).toBeGreaterThanOrEqual(5)
        expect(topHour.timeOfDayScore).toBeGreaterThan(0)
        expect(topHour.avgPerformanceScore).toBeGreaterThan(topHour.avgEngagement || 0)
        expect(topHour.confidence).toBeGreaterThan(0)
        expect(topHour.confidence).toBeLessThanOrEqual(1.0)
      }
    })

    it('should calculate timeOfDayScore using weighted formula (40/30/20/10)', async () => {
      const userId = 'test-weighted'

      const mockSessions = Array.from({ length: 6 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date(`2025-01-${i + 1}T10:00:00Z`),
        completedAt: new Date(`2025-01-${i + 1}T11:00:00Z`),
        durationMs: 3600000,
        reviewsCompleted: 30,
        objectiveCompletions: [
          { objectiveId: 'obj', completedAt: new Date().toISOString(), selfAssessment: 4 },
        ],
        reviews: [{ id: `r${i}`, rating: 'GOOD' }],
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)
      mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0.8)

      // Act
      const result = await StudyTimeAnalyzer.analyzeOptimalStudyTimes(userId)

      // Assert
      expect(result.length).toBeGreaterThan(0)
      const pattern = result[0]

      // Verify weighted calculation
      // timeOfDayScore = performance * 0.4 + retention * 100 * 0.3 + completion * 100 * 0.2 + engagement * 0.1
      const expectedScore =
        pattern.avgPerformanceScore * 0.4 +
        pattern.avgRetention * 100 * 0.3 +
        pattern.completionRate * 100 * 0.2 +
        pattern.avgEngagement * 0.1

      expect(pattern.timeOfDayScore).toBeCloseTo(expectedScore, 1)
    })

    it('should return empty array with no sessions', async () => {
      const userId = 'test-empty'
      mockPrisma.studySession.findMany.mockResolvedValue([])

      // Act
      const result = await StudyTimeAnalyzer.analyzeOptimalStudyTimes(userId)

      // Assert
      expect(result).toEqual([])
    })

    it('should filter out hours with <5 sessions (insufficient data)', async () => {
      const userId = 'test-filter'

      // Create only 4 sessions at 8 AM (below threshold)
      const mockSessions = Array.from({ length: 4 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date(`2025-01-${i + 1}T08:00:00Z`),
        completedAt: new Date(`2025-01-${i + 1}T09:00:00Z`),
        durationMs: 3600000,
        reviewsCompleted: 20,
        objectiveCompletions: [],
        reviews: [],
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)
      mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0.7)

      // Act
      const result = await StudyTimeAnalyzer.analyzeOptimalStudyTimes(userId)

      // Assert - should be filtered out due to insufficient sessions
      expect(result).toEqual([])
    })

    it('should return top 3 hours sorted by timeOfDayScore DESC', async () => {
      const userId = 'test-top3'

      // Create sessions across 5 different hours with varying scores
      const hours = [7, 9, 14, 16, 21]
      const performances = [90, 85, 70, 60, 40] // Descending

      const mockSessions = hours.flatMap((hour, hourIdx) =>
        Array.from({ length: 6 }, (_, i) => ({
          id: `h${hour}-s${i}`,
          userId,
          startedAt: new Date(`2025-01-${i + 1}T${hour.toString().padStart(2, '0')}:00:00Z`),
          completedAt: new Date(
            `2025-01-${i + 1}T${(hour + 1).toString().padStart(2, '0')}:00:00Z`,
          ),
          durationMs: 3600000,
          reviewsCompleted: 30,
          objectiveCompletions: [
            {
              objectiveId: 'obj',
              completedAt: new Date().toISOString(),
              selfAssessment: Math.round(performances[hourIdx] / 20),
            },
          ],
          reviews: [{ id: `r`, rating: 'GOOD' }],
        })),
      )

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)
      mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0.8)

      // Act
      const result = await StudyTimeAnalyzer.analyzeOptimalStudyTimes(userId)

      // Assert
      expect(result.length).toBeLessThanOrEqual(3)
      expect(result[0].hourOfDay).toBe(7) // Highest performance

      // Verify sorted descending
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].timeOfDayScore).toBeGreaterThanOrEqual(result[i + 1].timeOfDayScore)
      }
    })

    it('should calculate confidence based on sample size (min 1.0 at 50 sessions)', async () => {
      const userId = 'test-confidence'

      // Create exactly 50 sessions at 10 AM
      const mockSessions = Array.from({ length: 50 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date(`2025-01-01T10:00:00Z`),
        completedAt: new Date(`2025-01-01T11:00:00Z`),
        durationMs: 3600000,
        reviewsCompleted: 25,
        objectiveCompletions: [{ objectiveId: 'obj', selfAssessment: 4 }],
        reviews: [{ id: 'r', rating: 'GOOD' }],
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)
      mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0.8)

      // Act
      const result = await StudyTimeAnalyzer.analyzeOptimalStudyTimes(userId)

      // Assert
      expect(result[0].confidence).toBe(1.0) // 50 sessions = max confidence
    })

    it('should respect minWeeks parameter for date range', async () => {
      const userId = 'test-weeks'
      const minWeeks = 8

      mockPrisma.studySession.findMany.mockResolvedValue([])

      // Act
      await StudyTimeAnalyzer.analyzeOptimalStudyTimes(userId, minWeeks)

      // Assert
      const callArgs = mockPrisma.studySession.findMany.mock.calls[0][0]
      expect(callArgs.where.startedAt.gte).toBeInstanceOf(Date)

      // Verify date is minWeeks ago
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - minWeeks * 7)
      const actualDate = callArgs.where.startedAt.gte

      const daysDiff = Math.abs(
        (expectedDate.getTime() - actualDate.getTime()) / (1000 * 60 * 60 * 24),
      )
      expect(daysDiff).toBeLessThan(1) // Within 1 day tolerance
    })
  })

  describe('detectPerformancePeaks', () => {
    it('should detect multi-hour windows of consistent high performance (>80 score)', async () => {
      const userId = 'test-peaks'

      // Create consistent high-performance sessions Mon-Fri 7-9 AM
      const mockSessions = []
      for (let day = 1; day <= 5; day++) {
        // Monday = 1, Friday = 5
        for (let hour = 7; hour <= 9; hour++) {
          for (let week = 0; week < 4; week++) {
            mockSessions.push({
              id: `d${day}-h${hour}-w${week}`,
              userId,
              startedAt: new Date(`2025-01-${day + week * 7}T${hour}:00:00Z`),
              completedAt: new Date(`2025-01-${day + week * 7}T${hour + 1}:00:00Z`),
              durationMs: 3600000,
              reviewsCompleted: 35,
              objectiveCompletions: [
                { objectiveId: 'obj', selfAssessment: 5 }, // High performance
              ],
              reviews: [{ id: 'r', rating: 'GOOD' }],
            })
          }
        }
      }

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await StudyTimeAnalyzer.detectPerformancePeaks(userId)

      // Assert
      expect(result.length).toBeGreaterThan(0)

      const peak = result[0]
      expect(peak.avgScore).toBeGreaterThanOrEqual(80)
      expect(peak.endHour - peak.startHour).toBeGreaterThanOrEqual(1) // Multi-hour window
      expect(peak.sessionCount).toBeGreaterThan(0)
      expect(peak.consistency).toBeGreaterThan(0)
      expect(peak.consistency).toBeLessThanOrEqual(1.0)
      expect(peak.label).toContain('AM') // Human-readable label
    })

    it('should return empty array with no high-performance sessions', async () => {
      const userId = 'test-no-peaks'

      // All sessions have low performance (<80)
      const mockSessions = Array.from({ length: 20 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date(`2025-01-${Math.floor(i / 3) + 1}T10:00:00Z`),
        completedAt: new Date(`2025-01-${Math.floor(i / 3) + 1}T11:00:00Z`),
        durationMs: 3600000,
        reviewsCompleted: 10,
        objectiveCompletions: [{ objectiveId: 'obj', selfAssessment: 2 }], // Low performance
        reviews: [],
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await StudyTimeAnalyzer.detectPerformancePeaks(userId)

      // Assert
      expect(result).toEqual([])
    })

    it('should account for weekday vs weekend variations', async () => {
      const userId = 'test-weekday-weekend'

      // Weekday sessions (Monday = day 1)
      const weekdaySessions = Array.from({ length: 5 }, (_, i) => ({
        id: `weekday-${i}`,
        userId,
        startedAt: new Date(`2025-01-06T09:00:00Z`), // Monday
        completedAt: new Date(`2025-01-06T10:00:00Z`),
        durationMs: 3600000,
        reviewsCompleted: 30,
        objectiveCompletions: [{ objectiveId: 'obj', selfAssessment: 5 }],
        reviews: [],
      }))

      // Weekend sessions (Sunday = day 0)
      const weekendSessions = Array.from({ length: 5 }, (_, i) => ({
        id: `weekend-${i}`,
        userId,
        startedAt: new Date(`2025-01-05T14:00:00Z`), // Sunday
        completedAt: new Date(`2025-01-05T15:00:00Z`),
        durationMs: 3600000,
        reviewsCompleted: 30,
        objectiveCompletions: [{ objectiveId: 'obj', selfAssessment: 5 }],
        reviews: [],
      }))

      mockPrisma.studySession.findMany.mockResolvedValue([
        ...weekdaySessions,
        ...weekendSessions,
      ] as any)

      // Act
      const result = await StudyTimeAnalyzer.detectPerformancePeaks(userId)

      // Assert - should detect separate peaks for weekday and weekend
      expect(result.length).toBeGreaterThanOrEqual(2)

      const weekdayPeak = result.find((p) => p.dayOfWeek === 1) // Monday
      const weekendPeak = result.find((p) => p.dayOfWeek === 0) // Sunday

      expect(weekdayPeak).toBeDefined()
      expect(weekendPeak).toBeDefined()
    })

    it('should sort peaks by avgScore DESC', async () => {
      const userId = 'test-sort-peaks'

      // Create peaks with different scores
      const mockSessions = [
        // High score window (7-9 AM)
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `high-${i}`,
          userId,
          startedAt: new Date(`2025-01-${i + 1}T07:00:00Z`),
          completedAt: new Date(`2025-01-${i + 1}T09:00:00Z`),
          durationMs: 7200000,
          reviewsCompleted: 50,
          objectiveCompletions: [{ objectiveId: 'obj', selfAssessment: 5 }],
          reviews: [],
        })),
        // Medium score window (14-16)
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `med-${i}`,
          userId,
          startedAt: new Date(`2025-01-${i + 1}T14:00:00Z`),
          completedAt: new Date(`2025-01-${i + 1}T16:00:00Z`),
          durationMs: 7200000,
          reviewsCompleted: 40,
          objectiveCompletions: [{ objectiveId: 'obj', selfAssessment: 4 }],
          reviews: [],
        })),
      ]

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await StudyTimeAnalyzer.detectPerformancePeaks(userId)

      // Assert - sorted by score
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].avgScore).toBeGreaterThanOrEqual(result[i + 1].avgScore)
      }
    })

    it('should generate human-readable labels (e.g., "Monday 7 AM-9 AM")', async () => {
      const userId = 'test-labels'

      const mockSessions = Array.from({ length: 5 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date(`2025-01-06T09:00:00Z`), // Monday 9 AM
        completedAt: new Date(`2025-01-06T11:00:00Z`),
        durationMs: 7200000,
        reviewsCompleted: 40,
        objectiveCompletions: [{ objectiveId: 'obj', selfAssessment: 5 }],
        reviews: [],
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await StudyTimeAnalyzer.detectPerformancePeaks(userId)

      // Assert
      if (result.length > 0) {
        const peak = result[0]
        expect(peak.label).toMatch(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/)
        expect(peak.label).toMatch(/\d{1,2} (AM|PM)/)
      }
    })
  })

  describe('calculateTimeOfDayEffectiveness', () => {
    it('should return effectiveness scores for all hours with data', async () => {
      const userId = 'test-effectiveness'

      const mockSessions = [
        ...Array.from({ length: 6 }, (_, i) => ({
          id: `m${i}`,
          userId,
          startedAt: new Date(`2025-01-${i + 1}T09:00:00Z`),
          completedAt: new Date(`2025-01-${i + 1}T10:00:00Z`),
          durationMs: 3600000,
          reviewsCompleted: 30,
          objectiveCompletions: [
            { objectiveId: 'obj', completedAt: new Date().toISOString(), selfAssessment: 4 },
          ],
          reviews: [{ id: 'r', rating: 'GOOD' }],
        })),
        ...Array.from({ length: 6 }, (_, i) => ({
          id: `a${i}`,
          userId,
          startedAt: new Date(`2025-01-${i + 1}T14:00:00Z`),
          completedAt: new Date(`2025-01-${i + 1}T15:00:00Z`),
          durationMs: 3600000,
          reviewsCompleted: 25,
          objectiveCompletions: [
            { objectiveId: 'obj', completedAt: new Date().toISOString(), selfAssessment: 3 },
          ],
          reviews: [{ id: 'r', rating: 'HARD' }],
        })),
      ]

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)
      mockPerformanceCalculator.calculateRetentionScore.mockImplementation((reviews: any[]) =>
        reviews[0]?.rating === 'GOOD' ? 0.85 : 0.6,
      )

      // Act
      const result = await StudyTimeAnalyzer.calculateTimeOfDayEffectiveness(userId)

      // Assert
      expect(result.length).toBeGreaterThan(0)

      result.forEach((score) => {
        expect(score.hour).toBeGreaterThanOrEqual(0)
        expect(score.hour).toBeLessThanOrEqual(23)
        expect(score.score).toBeGreaterThanOrEqual(0)
        expect(score.sessionCount).toBeGreaterThan(0)
        expect(score.metrics).toBeDefined()
        expect(score.metrics.performance).toBeDefined()
        expect(score.metrics.retention).toBeDefined()
        expect(score.metrics.completion).toBeDefined()
        expect(score.metrics.engagement).toBeDefined()
      })
    })
  })

  describe('identifyAttentionCycles', () => {
    it('should analyze within-session performance degradation', async () => {
      const userId = 'test-attention'
      const baseDate = new Date('2025-01-01T10:00:00Z')

      // Create long session (90 min) with reviews throughout
      const reviews = Array.from({ length: 50 }, (_, i) => ({
        id: `r${i}`,
        reviewedAt: new Date(baseDate.getTime() + i * 60 * 1000), // Every minute
        rating: i < 30 ? 'GOOD' : 'HARD', // Performance drops after 30 min
      }))

      const mockSessions = [
        {
          id: 's1',
          userId,
          startedAt: baseDate,
          completedAt: new Date(baseDate.getTime() + 90 * 60 * 1000),
          durationMs: 90 * 60 * 1000, // 90 minutes
          reviewsCompleted: 50,
          objectiveCompletions: [],
          reviews,
        },
      ]

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await StudyTimeAnalyzer.identifyAttentionCycles(userId)

      // Assert
      expect(result.length).toBeGreaterThan(0)

      const cycle = result[0]
      expect(cycle.avgSessionDuration).toBeGreaterThan(60) // Minutes
      expect(cycle.timeToFatigue).toBeGreaterThan(0)
      expect(cycle.optimalBreakInterval).toBeGreaterThan(0)
      expect(cycle.flowStateIndicators).toBeDefined()
      expect(cycle.flowStateIndicators.avgFlowDuration).toBeGreaterThanOrEqual(0)
      expect(cycle.flowStateIndicators.flowFrequency).toBeGreaterThanOrEqual(0)
      expect(cycle.flowStateIndicators.flowFrequency).toBeLessThanOrEqual(1)
    })

    it('should return empty array with no long sessions (>60 min)', async () => {
      const userId = 'test-short-sessions'

      // Only short sessions
      const mockSessions = Array.from({ length: 10 }, (_, i) => ({
        id: `s${i}`,
        userId,
        startedAt: new Date(`2025-01-${i + 1}T10:00:00Z`),
        completedAt: new Date(`2025-01-${i + 1}T10:30:00Z`),
        durationMs: 30 * 60 * 1000, // 30 minutes
        reviewsCompleted: 20,
        objectiveCompletions: [],
        reviews: [],
      }))

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await StudyTimeAnalyzer.identifyAttentionCycles(userId)

      // Assert
      expect(result).toEqual([])
    })

    it('should detect flow state (>85% accuracy for 20+ minutes)', async () => {
      const userId = 'test-flow'
      const baseDate = new Date('2025-01-01T10:00:00Z')

      // Create 30-minute flow state window
      const reviews = Array.from({ length: 60 }, (_, i) => ({
        id: `r${i}`,
        reviewedAt: new Date(baseDate.getTime() + i * 60 * 1000),
        rating: 'GOOD', // Consistent high performance
      }))

      const mockSessions = [
        {
          id: 's-flow',
          userId,
          startedAt: baseDate,
          completedAt: new Date(baseDate.getTime() + 70 * 60 * 1000),
          durationMs: 70 * 60 * 1000,
          reviewsCompleted: 60,
          objectiveCompletions: [],
          reviews,
        },
      ]

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await StudyTimeAnalyzer.identifyAttentionCycles(userId)

      // Assert
      expect(result[0].flowStateIndicators.avgFlowDuration).toBeGreaterThanOrEqual(20)
      expect(result[0].flowStateIndicators.flowFrequency).toBeGreaterThan(0)
    })

    it('should calculate optimal break interval (90% of fatigue time)', async () => {
      const userId = 'test-breaks'
      const baseDate = new Date('2025-01-01T10:00:00Z')

      const mockSessions = [
        {
          id: 's',
          userId,
          startedAt: baseDate,
          completedAt: new Date(baseDate.getTime() + 80 * 60 * 1000),
          durationMs: 80 * 60 * 1000,
          reviewsCompleted: 40,
          objectiveCompletions: [],
          reviews: Array.from({ length: 40 }, (_, i) => ({
            id: `r${i}`,
            reviewedAt: new Date(baseDate.getTime() + i * 2 * 60 * 1000),
            rating: i < 20 ? 'GOOD' : 'HARD',
          })),
        },
      ]

      mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)

      // Act
      const result = await StudyTimeAnalyzer.identifyAttentionCycles(userId)

      // Assert
      expect(result[0].optimalBreakInterval).toBeLessThan(result[0].timeToFatigue)
      expect(result[0].optimalBreakInterval).toBeCloseTo(result[0].timeToFatigue * 0.9, 1)
    })
  })
})

describe('robustness - NaN and UTC', () => {
  it('should use UTC hours and never emit NaN', async () => {
    const userId = 'test-utc-nan'
    const baseDate = new Date('2025-01-01T09:00:00Z')

    const mockSessions = [
      // 5 valid sessions at 09:00Z to satisfy threshold
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `valid-${i}`,
        userId,
        startedAt: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
        completedAt: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        durationMs: 60 * 60 * 1000,
        reviewsCompleted: 30,
        objectiveCompletions: [
          { objectiveId: 'obj', completedAt: new Date().toISOString(), selfAssessment: 4 },
        ],
        reviews: [{ id: `r${i}`, rating: 'GOOD' }],
      })),
      // Invalid/edge inputs that should be ignored safely
      {
        id: 'bad-1',
        userId,
        startedAt: 'invalid-date' as any,
        completedAt: 'invalid-date' as any,
        durationMs: null,
        reviewsCompleted: 0,
        objectiveCompletions: [],
        reviews: [],
      },
    ]

    mockPrisma.studySession.findMany.mockResolvedValue(mockSessions as any)
    mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0.8)

    const patterns = await StudyTimeAnalyzer.analyzeOptimalStudyTimes(userId, 6)

    // Should have valid numeric hours and finite scores
    patterns.forEach((p) => {
      expect(typeof p.hourOfDay).toBe('number')
      expect(Number.isNaN(p.hourOfDay)).toBe(false)
      expect(p.hourOfDay).toBeGreaterThanOrEqual(0)
      expect(p.hourOfDay).toBeLessThanOrEqual(23)
      expect(Number.isFinite(p.timeOfDayScore)).toBe(true)
    })

    const effectiveness = await StudyTimeAnalyzer.calculateTimeOfDayEffectiveness(userId)
    effectiveness.forEach((e) => {
      expect(e.hour).toBeGreaterThanOrEqual(0)
      expect(e.hour).toBeLessThanOrEqual(23)
      expect(Number.isFinite(e.score)).toBe(true)
    })
  })
})
