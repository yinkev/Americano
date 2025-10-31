import rawContracts from '../../data/mock/analytics/contracts.json';

export const ANALYTICS_MOCK_KEYS = [
  'FailurePattern',
  'FeedbackRequest',
  'FeedbackResponse',
  'StructuredFeedback',
  'PatternDetectionRequest',
  'PatternDetectionResponse',
  'RetryScheduleRequest',
  'RetryScheduleResponse',
  'AIInsight',
  'AnalyticsRequest',
  'CalibrationIssue',
  'ComparisonRequest',
  'ComparisonResponse',
  'MemorizationVsUnderstandingGap',
  'ComparisonResult',
  'DimensionComparison',
  'ComprehensionPattern',
  'ObjectiveStrength',
  'ObjectiveWeakness',
  'CorrelationMatrix',
  'CorrelationsRequest',
  'DailyInsight',
  'DashboardMetricSummary',
  'DashboardRequest',
  'DashboardResponse',
  'MasterySummary',
  'DashboardSummary',
  'MasteryBreakdown',
  'TrendPoint',
  'ExamSuccessPrediction',
  'ContributingFactors',
  'ForgettingRiskPrediction',
  'GrowthTrajectory',
  'ImprovementRate',
  'InterventionSuggestion',
  'LongitudinalMetric',
  'Milestone',
  'Regression',
  'ImprovementRates',
  'LongitudinalRequest',
  'MasteryDatePrediction',
  'ModelAccuracy',
  'PatternsRequest',
  'PeerBenchmark',
  'PeerDistribution',
  'Quartiles',
  'RelativePerformance',
  'PeerBenchmarkRequest',
  'PredictionsRequest',
  'RecommendationData',
  'WeeklyTopObjective',
  'TimeToMasteryEstimate',
  'RecommendationsRequest',
  'RelativeStrength',
  'RelativeWeakness',
  'UnderstandingPrediction',
  'ModelAccuracy1',
  'AlertResponse',
  'PredictionDetail',
  'FeatureVector',
  'PredictionRequest',
  'PredictionResponse',
  'InterventionApplyRequest',
  'InterventionApplyResponse',
  'InterventionResponse',
  'ModelPerformanceResponse',
  'Calibration',
  'StruggleReductionResponse',
  'TimelinePoint',
] as const;

export type AnalyticsMockKey = (typeof ANALYTICS_MOCK_KEYS)[number];

const analyticsMocks = rawContracts as Record<AnalyticsMockKey, unknown>;

export const ANALYTICS_MOCK_METADATA = {
  source: 'mock',
  version: '2025-01',
} as const;

export type AnalyticsMockMetadata = typeof ANALYTICS_MOCK_METADATA;

export function getAnalyticsMock<
  K extends AnalyticsMockKey,
  TReturn = Record<string, unknown>,
>(key: K) {
  const payload = analyticsMocks[key];
  if (payload === undefined) {
    throw new Error(`No analytics mock registered for key: ${key}`);
  }
  return payload as TReturn;
}

export function listAnalyticsMockKeys(): AnalyticsMockKey[] {
  return [...ANALYTICS_MOCK_KEYS];
}

export function getAnalyticsMockRegistry() {
  return { ...analyticsMocks } as Record<AnalyticsMockKey, unknown>;
}
