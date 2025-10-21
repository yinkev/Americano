/**
 * Mock Epic 5 Subsystems for Testing
 */

// Mock BehavioralPatternEngine
export const mockBehavioralPatternEngine = {
  runFullAnalysis: jest.fn(),
  analyzeUserPatterns: jest.fn(),
  identifyPatterns: jest.fn(),
}

// Mock BurnoutPreventionEngine
export const mockBurnoutPreventionEngine = {
  assessBurnoutRisk: jest.fn(),
  calculateRiskScore: jest.fn(),
  getWarningSignals: jest.fn(),
}

// Mock PersonalizationEngine
export const mockPersonalizationEngine = {
  generateRecommendations: jest.fn(),
  applyPersonalization: jest.fn(),
  getActivePersonalizations: jest.fn(),
}

// Mock CognitiveLoadMonitor
export const mockCognitiveLoadMonitor = {
  calculateCurrentLoad: jest.fn(),
  getLoadHistory: jest.fn(),
  analyzeLoadFactors: jest.fn(),
}

// Mock ExperimentEngine
export const mockExperimentEngine = {
  listActiveExperiments: jest.fn(),
  assignUserToExperiment: jest.fn(),
  recordExperimentOutcome: jest.fn(),
}

// Default mock implementations
export const setupDefaultMocks = () => {
  // BehavioralPatternEngine defaults
  mockBehavioralPatternEngine.runFullAnalysis.mockResolvedValue({
    patterns: [],
    insights: [],
    profile: null,
    insufficientData: false,
  })

  // BurnoutPreventionEngine defaults
  mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue({
    riskScore: 45,
    riskLevel: 'MEDIUM',
    contributingFactors: [],
    warningSignals: [],
    recommendations: [],
    assessmentDate: new Date(),
    confidence: 0.75,
  })

  // PersonalizationEngine defaults
  mockPersonalizationEngine.generateRecommendations.mockResolvedValue([
    {
      id: 'rec-1',
      type: 'DIFFICULTY_ADJUSTMENT',
      priority: 'HIGH',
      description: 'Test recommendation',
    },
  ])

  // CognitiveLoadMonitor defaults
  mockCognitiveLoadMonitor.calculateCurrentLoad.mockResolvedValue({
    loadScore: 65,
    loadLevel: 'MODERATE',
    factors: {
      taskComplexity: 0.6,
      timePressure: 0.5,
      cognitiveFatigue: 0.7,
      multitaskingLoad: 0.4,
      environmentalDistractions: 0.3,
    },
  })

  // ExperimentEngine defaults
  mockExperimentEngine.listActiveExperiments.mockResolvedValue([])
}

// Reset all subsystem mocks
export const resetAllSubsystemMocks = () => {
  mockBehavioralPatternEngine.runFullAnalysis.mockReset()
  mockBehavioralPatternEngine.analyzeUserPatterns.mockReset()
  mockBehavioralPatternEngine.identifyPatterns.mockReset()

  mockBurnoutPreventionEngine.assessBurnoutRisk.mockReset()
  mockBurnoutPreventionEngine.calculateRiskScore.mockReset()
  mockBurnoutPreventionEngine.getWarningSignals.mockReset()

  mockPersonalizationEngine.generateRecommendations.mockReset()
  mockPersonalizationEngine.applyPersonalization.mockReset()
  mockPersonalizationEngine.getActivePersonalizations.mockReset()

  mockCognitiveLoadMonitor.calculateCurrentLoad.mockReset()
  mockCognitiveLoadMonitor.getLoadHistory.mockReset()
  mockCognitiveLoadMonitor.analyzeLoadFactors.mockReset()

  mockExperimentEngine.listActiveExperiments.mockReset()
  mockExperimentEngine.assignUserToExperiment.mockReset()
  mockExperimentEngine.recordExperimentOutcome.mockReset()

  setupDefaultMocks()
}
