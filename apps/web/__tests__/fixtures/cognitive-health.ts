/**
 * Test Fixtures for Cognitive Health (Story 5.4)
 */

export const mockCognitiveLoadMetric = {
  id: 'load-1',
  userId: 'test-user-id',
  sessionId: 'session-1',
  loadScore: 65,
  stressIndicators: ['TASK_COMPLEXITY', 'TIME_PRESSURE'],
  timestamp: new Date('2025-10-20T14:30:00Z'),
  confidenceLevel: 0.82,
  calculationMetadata: {
    taskComplexity: 0.6,
    timePressure: 0.5,
    cognitiveFatigue: 0.7,
    multitaskingLoad: 0.4,
    environmentalDistractions: 0.3,
  },
  createdAt: new Date('2025-10-20T14:30:00Z'),
}

export const mockCognitiveLoadHistory = [
  {
    id: 'load-1',
    userId: 'test-user-id',
    sessionId: 'session-1',
    loadScore: 65,
    timestamp: new Date('2025-10-20T14:30:00Z'),
    confidenceLevel: 0.82,
  },
  {
    id: 'load-2',
    userId: 'test-user-id',
    sessionId: 'session-2',
    loadScore: 72,
    timestamp: new Date('2025-10-19T14:30:00Z'),
    confidenceLevel: 0.85,
  },
  {
    id: 'load-3',
    userId: 'test-user-id',
    sessionId: 'session-3',
    loadScore: 58,
    timestamp: new Date('2025-10-18T14:30:00Z'),
    confidenceLevel: 0.79,
  },
]

export const mockBurnoutAssessment = {
  riskScore: 45,
  riskLevel: 'MEDIUM' as const,
  contributingFactors: [
    {
      factor: 'Study Intensity',
      score: 65,
      percentage: 20,
      severity: 'MEDIUM' as const,
    },
    {
      factor: 'Performance Decline',
      score: 42,
      percentage: 25,
      severity: 'MEDIUM' as const,
    },
    {
      factor: 'Chronic Cognitive Load',
      score: 55,
      percentage: 25,
      severity: 'MEDIUM' as const,
    },
  ],
  warningSignals: [
    {
      type: 'PERFORMANCE_DECLINE',
      detected: true,
      severity: 'MEDIUM' as const,
      description: 'Performance has declined 12% over the past 2 weeks',
      firstDetectedAt: new Date('2025-10-15'),
    },
  ],
  recommendations: [
    'Consider reducing study hours by 15-20%',
    'Schedule a recovery day this week',
    'Focus on active recall instead of passive reading',
  ],
  assessmentDate: new Date('2025-10-20'),
  confidence: 0.75,
}

export const mockStressProfile = {
  profileExists: true,
  primaryStressors: [
    {
      type: 'ATTENTION_CYCLE',
      frequency: 15,
      confidence: 0.85,
    },
    {
      type: 'PERFORMANCE_PEAK',
      frequency: 12,
      confidence: 0.78,
    },
  ],
  loadTolerance: 65,
  avgCognitiveLoad: 62,
  avgRecoveryTime: 24,
  effectiveCopingStrategies: ['SHORT_BREAKS', 'ENVIRONMENT_CHANGE'],
  profileConfidence: 0.72,
  lastAnalyzedAt: new Date('2025-10-20'),
}

export const mockNewUserStressProfile = {
  profileExists: false,
  primaryStressors: [],
  loadTolerance: 65,
  avgCognitiveLoad: null,
  avgRecoveryTime: null,
  effectiveCopingStrategies: [],
  profileConfidence: 0,
}
