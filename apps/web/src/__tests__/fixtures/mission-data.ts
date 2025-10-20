import type { Mission, MissionReview, MissionFeedback } from '@/generated/prisma'

/**
 * Test fixtures for mission analytics testing
 */

export const mockMissions: Partial<Mission>[] = [
  {
    id: 'mission-1',
    userId: 'user-1',
    status: 'COMPLETED',
    completedAt: new Date('2024-10-10T10:00:00Z'),
    date: new Date('2024-10-10T09:00:00Z'),
    estimatedMinutes: 45,
    objectives: {},
  },
  {
    id: 'mission-2',
    userId: 'user-1',
    status: 'COMPLETED',
    completedAt: new Date('2024-10-11T10:00:00Z'),
    date: new Date('2024-10-11T09:00:00Z'),
    estimatedMinutes: 50,
    objectives: {},
  },
  {
    id: 'mission-3',
    userId: 'user-1',
    status: 'SKIPPED',
    completedAt: null,
    date: new Date('2024-10-12T09:00:00Z'),
    estimatedMinutes: 45,
    objectives: {},
  },
  {
    id: 'mission-4',
    userId: 'user-1',
    status: 'COMPLETED',
    completedAt: new Date('2024-10-13T10:00:00Z'),
    date: new Date('2024-10-13T09:00:00Z'),
    estimatedMinutes: 60,
    objectives: {},
  },
  {
    id: 'mission-5',
    userId: 'user-1',
    status: 'COMPLETED',
    completedAt: new Date('2024-10-14T10:00:00Z'),
    date: new Date('2024-10-14T09:00:00Z'),
    estimatedMinutes: 45,
    objectives: {},
  },
]

export const mockMissionReviews: Partial<MissionReview>[] = [
  {
    id: 'review-1',
    userId: 'user-1',
    period: 'WEEK',
    startDate: new Date('2024-10-07T00:00:00Z'),
    endDate: new Date('2024-10-13T23:59:59Z'),
    summary: { completionRate: 75.0, totalMissions: 8, completedMissions: 6 },
    highlights: {},
    insights: {},
    recommendations: {},
    generatedAt: new Date('2024-10-14T00:00:00Z'),
  },
  {
    id: 'review-2',
    userId: 'user-1',
    period: 'MONTH',
    startDate: new Date('2024-09-01T00:00:00Z'),
    endDate: new Date('2024-09-30T23:59:59Z'),
    summary: { completionRate: 82.0, totalMissions: 50, completedMissions: 41 },
    highlights: {},
    insights: {},
    recommendations: {},
    generatedAt: new Date('2024-10-01T00:00:00Z'),
  },
]

export const mockMissionFeedback: Partial<MissionFeedback>[] = [
  {
    id: 'feedback-1',
    userId: 'user-1',
    missionId: 'mission-1',
    helpfulnessRating: 4,
    relevanceScore: 5,
    paceRating: 'JUST_RIGHT',
    improvementSuggestions: 'Great mission, very helpful!',
    submittedAt: new Date('2024-10-10T10:05:00Z'),
  },
  {
    id: 'feedback-2',
    userId: 'user-1',
    missionId: 'mission-2',
    helpfulnessRating: 3,
    relevanceScore: 4,
    paceRating: 'TOO_FAST',
    improvementSuggestions: 'A bit rushed',
    submittedAt: new Date('2024-10-11T10:05:00Z'),
  },
]

export const mockUserPreferences = {
  id: 'pref-1',
  userId: 'user-1',
  difficultyLevel: 'MEDIUM' as const,
  objectiveComplexity: 'INTERMEDIATE' as const,
  dailyStudyMinutes: 45,
  adaptationLog: [],
  createdAt: new Date('2024-10-01T00:00:00Z'),
  updatedAt: new Date('2024-10-01T00:00:00Z'),
}

export const mockAnalyticsData = {
  completionRate: 75.0,
  averageSuccessScore: 85.5,
  totalMissions: 8,
  completedMissions: 6,
  skippedMissions: 2,
  performanceCorrelation: 0.65,
  trendDirection: 'IMPROVING' as const,
}
