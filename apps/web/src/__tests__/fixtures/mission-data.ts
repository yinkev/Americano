import type { Mission, MissionReview, MissionFeedback } from '@/generated/prisma'

/**
 * Test fixtures for mission analytics testing
 */

export const mockMissions: Partial<Mission>[] = [
  {
    id: 'mission-1',
    userId: 'user-1',
    sessionId: 'session-1',
    status: 'COMPLETED',
    completedAt: new Date('2024-10-10T10:00:00Z'),
    createdAt: new Date('2024-10-10T09:00:00Z'),
    updatedAt: new Date('2024-10-10T10:00:00Z'),
  },
  {
    id: 'mission-2',
    userId: 'user-1',
    sessionId: 'session-2',
    status: 'COMPLETED',
    completedAt: new Date('2024-10-11T10:00:00Z'),
    createdAt: new Date('2024-10-11T09:00:00Z'),
    updatedAt: new Date('2024-10-11T10:00:00Z'),
  },
  {
    id: 'mission-3',
    userId: 'user-1',
    sessionId: 'session-3',
    status: 'SKIPPED',
    completedAt: null,
    createdAt: new Date('2024-10-12T09:00:00Z'),
    updatedAt: new Date('2024-10-12T09:30:00Z'),
  },
  {
    id: 'mission-4',
    userId: 'user-1',
    sessionId: 'session-4',
    status: 'COMPLETED',
    completedAt: new Date('2024-10-13T10:00:00Z'),
    createdAt: new Date('2024-10-13T09:00:00Z'),
    updatedAt: new Date('2024-10-13T10:00:00Z'),
  },
  {
    id: 'mission-5',
    userId: 'user-1',
    sessionId: 'session-5',
    status: 'COMPLETED',
    completedAt: new Date('2024-10-14T10:00:00Z'),
    createdAt: new Date('2024-10-14T09:00:00Z'),
    updatedAt: new Date('2024-10-14T10:00:00Z'),
  },
]

export const mockMissionReviews: Partial<MissionReview>[] = [
  {
    id: 'review-1',
    userId: 'user-1',
    period: 'WEEK',
    startDate: new Date('2024-10-07T00:00:00Z'),
    endDate: new Date('2024-10-13T23:59:59Z'),
    completionRate: 75.0,
    averageSuccessScore: 85.5,
    totalMissions: 8,
    completedMissions: 6,
    createdAt: new Date('2024-10-14T00:00:00Z'),
    updatedAt: new Date('2024-10-14T00:00:00Z'),
  },
  {
    id: 'review-2',
    userId: 'user-1',
    period: 'MONTH',
    startDate: new Date('2024-09-01T00:00:00Z'),
    endDate: new Date('2024-09-30T23:59:59Z'),
    completionRate: 82.0,
    averageSuccessScore: 88.0,
    totalMissions: 50,
    completedMissions: 41,
    createdAt: new Date('2024-10-01T00:00:00Z'),
    updatedAt: new Date('2024-10-01T00:00:00Z'),
  },
]

export const mockMissionFeedback: Partial<MissionFeedback>[] = [
  {
    id: 'feedback-1',
    missionId: 'mission-1',
    difficultyRating: 4,
    paceRating: 'JUST_RIGHT',
    feedbackText: 'Great mission, very helpful!',
    createdAt: new Date('2024-10-10T10:05:00Z'),
    updatedAt: new Date('2024-10-10T10:05:00Z'),
  },
  {
    id: 'feedback-2',
    missionId: 'mission-2',
    difficultyRating: 3,
    paceRating: 'TOO_FAST',
    feedbackText: 'A bit rushed',
    createdAt: new Date('2024-10-11T10:05:00Z'),
    updatedAt: new Date('2024-10-11T10:05:00Z'),
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
