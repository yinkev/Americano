/**
 * Test Fixtures for Behavioral Patterns
 */

export const mockBehavioralPattern = {
  id: 'pattern-1',
  userId: 'test-user-id',
  patternType: 'OPTIMAL_STUDY_TIME',
  description: 'User performs best during morning hours',
  confidence: 0.85,
  occurrenceCount: 15,
  firstSeenAt: new Date('2025-10-01'),
  lastSeenAt: new Date('2025-10-20'),
  metadata: {
    timeOfDay: 'morning',
    averagePerformance: 0.82,
  },
  createdAt: new Date('2025-10-01'),
  updatedAt: new Date('2025-10-20'),
}

export const mockPatterns = [
  mockBehavioralPattern,
  {
    id: 'pattern-2',
    userId: 'test-user-id',
    patternType: 'SESSION_DURATION_PREFERENCE',
    description: 'User prefers 45-minute study sessions',
    confidence: 0.78,
    occurrenceCount: 12,
    firstSeenAt: new Date('2025-10-05'),
    lastSeenAt: new Date('2025-10-20'),
    metadata: {
      preferredDuration: 45,
    },
    createdAt: new Date('2025-10-05'),
    updatedAt: new Date('2025-10-20'),
  },
  {
    id: 'pattern-3',
    userId: 'test-user-id',
    patternType: 'ATTENTION_CYCLE',
    description: 'Attention drops after 30 minutes',
    confidence: 0.72,
    occurrenceCount: 10,
    firstSeenAt: new Date('2025-10-08'),
    lastSeenAt: new Date('2025-10-20'),
    metadata: {
      attentionDropMinutes: 30,
    },
    createdAt: new Date('2025-10-08'),
    updatedAt: new Date('2025-10-20'),
  },
] as any[]

export const mockPatternAnalysisResult = {
  patterns: mockPatterns,
  insights: [
    {
      id: 'insight-1',
      type: 'OPTIMAL_TIME',
      description: 'Your peak performance is during morning hours (8-11am)',
      impact: 'HIGH',
      confidence: 0.85,
    },
    {
      id: 'insight-2',
      type: 'SESSION_LENGTH',
      description: 'You perform best with 45-minute sessions',
      impact: 'MEDIUM',
      confidence: 0.78,
    },
  ],
  profile: {
    userId: 'test-user-id',
    optimalStudyTime: 'morning',
    preferredSessionLength: 45,
    lastUpdated: new Date(),
  },
  insufficientData: false,
}

export const mockInsufficientDataResult = {
  patterns: [],
  insights: [],
  profile: null,
  insufficientData: true,
  requirements: {
    weeksNeeded: 4,
    sessionsNeeded: 15,
    currentWeeks: 2,
    currentSessions: 8,
  },
}
