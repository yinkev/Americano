import type {
  FailurePattern,
  FeedbackRequest,
  FeedbackResponse,
  StructuredFeedback,
  PatternDetectionRequest,
  PatternDetectionResponse,
  RetryScheduleRequest,
  RetryScheduleResponse,
  AIInsight,
  AnalyticsRequest,
  CalibrationIssue,
  ComparisonRequest,
  ComparisonResponse,
  MemorizationVsUnderstandingGap,
  ComparisonResult,
  DimensionComparison,
  ComprehensionPattern,
  ObjectiveStrength,
  ObjectiveWeakness,
  CorrelationMatrix,
  CorrelationsRequest,
  DailyInsight,
  DashboardMetricSummary,
  DashboardRequest,
  DashboardResponse,
  MasterySummary,
  DashboardSummary,
  MasteryBreakdown,
  TrendPoint,
  ExamSuccessPrediction,
  ContributingFactors,
  ForgettingRiskPrediction,
  GrowthTrajectory,
  ImprovementRate,
  InterventionSuggestion,
  LongitudinalMetric,
  Milestone,
  Regression,
  ImprovementRates,
  LongitudinalRequest,
  MasteryDatePrediction,
  ModelAccuracy,
  PatternsRequest,
  PeerBenchmark,
  PeerDistribution,
  Quartiles,
  RelativePerformance,
  PeerBenchmarkRequest,
  PredictionsRequest,
  RecommendationData,
  WeeklyTopObjective,
  TimeToMasteryEstimate,
  RecommendationsRequest,
  RelativeStrength,
  RelativeWeakness,
  UnderstandingPrediction,
  ModelAccuracy1,
  AlertResponse,
  PredictionDetail,
  FeatureVector,
  PredictionRequest,
  PredictionResponse,
  InterventionApplyRequest,
  InterventionApplyResponse,
  InterventionResponse,
  ModelPerformanceResponse,
  Calibration,
  StruggleReductionResponse,
  TimelinePoint,
} from '../../types/api-generated'
import {
  ANALYTICS_MOCK_METADATA,
  getAnalyticsMock,
  type AnalyticsMockKey,
  type AnalyticsMockMetadata,
} from '@americano/api-client/mocks/analytics'

type AnalyticsMockRegistry = {
  FailurePattern: FailurePattern;
  FeedbackRequest: FeedbackRequest;
  FeedbackResponse: FeedbackResponse;
  StructuredFeedback: StructuredFeedback;
  PatternDetectionRequest: PatternDetectionRequest;
  PatternDetectionResponse: PatternDetectionResponse;
  RetryScheduleRequest: RetryScheduleRequest;
  RetryScheduleResponse: RetryScheduleResponse;
  AIInsight: AIInsight;
  AnalyticsRequest: AnalyticsRequest;
  CalibrationIssue: CalibrationIssue;
  ComparisonRequest: ComparisonRequest;
  ComparisonResponse: ComparisonResponse;
  MemorizationVsUnderstandingGap: MemorizationVsUnderstandingGap;
  ComparisonResult: ComparisonResult;
  DimensionComparison: DimensionComparison;
  ComprehensionPattern: ComprehensionPattern;
  ObjectiveStrength: ObjectiveStrength;
  ObjectiveWeakness: ObjectiveWeakness;
  CorrelationMatrix: CorrelationMatrix;
  CorrelationsRequest: CorrelationsRequest;
  DailyInsight: DailyInsight;
  DashboardMetricSummary: DashboardMetricSummary;
  DashboardRequest: DashboardRequest;
  DashboardResponse: DashboardResponse;
  MasterySummary: MasterySummary;
  DashboardSummary: DashboardSummary;
  MasteryBreakdown: MasteryBreakdown;
  TrendPoint: TrendPoint;
  ExamSuccessPrediction: ExamSuccessPrediction;
  ContributingFactors: ContributingFactors;
  ForgettingRiskPrediction: ForgettingRiskPrediction;
  GrowthTrajectory: GrowthTrajectory;
  ImprovementRate: ImprovementRate;
  InterventionSuggestion: InterventionSuggestion;
  LongitudinalMetric: LongitudinalMetric;
  Milestone: Milestone;
  Regression: Regression;
  ImprovementRates: ImprovementRates;
  LongitudinalRequest: LongitudinalRequest;
  MasteryDatePrediction: MasteryDatePrediction;
  ModelAccuracy: ModelAccuracy;
  PatternsRequest: PatternsRequest;
  PeerBenchmark: PeerBenchmark;
  PeerDistribution: PeerDistribution;
  Quartiles: Quartiles;
  RelativePerformance: RelativePerformance;
  PeerBenchmarkRequest: PeerBenchmarkRequest;
  PredictionsRequest: PredictionsRequest;
  RecommendationData: RecommendationData;
  WeeklyTopObjective: WeeklyTopObjective;
  TimeToMasteryEstimate: TimeToMasteryEstimate;
  RecommendationsRequest: RecommendationsRequest;
  RelativeStrength: RelativeStrength;
  RelativeWeakness: RelativeWeakness;
  UnderstandingPrediction: UnderstandingPrediction;
  ModelAccuracy1: ModelAccuracy1;
  AlertResponse: AlertResponse;
  PredictionDetail: PredictionDetail;
  FeatureVector: FeatureVector;
  PredictionRequest: PredictionRequest;
  PredictionResponse: PredictionResponse;
  InterventionApplyRequest: InterventionApplyRequest;
  InterventionApplyResponse: InterventionApplyResponse;
  InterventionResponse: InterventionResponse;
  ModelPerformanceResponse: ModelPerformanceResponse;
  Calibration: Calibration;
  StruggleReductionResponse: StruggleReductionResponse;
  TimelinePoint: TimelinePoint;
};

export type MetadataEnvelope<T> = {
  metadata: AnalyticsMockMetadata;
  payload: T;
}

export const ANALYTICS_MOCK_METADATA_HEADER = 'x-analytics-metadata'
export const ANALYTICS_MOCK_METADATA_SYMBOL = Symbol.for('americano.analytics.mockMetadata')

const METADATA = ANALYTICS_MOCK_METADATA;

const clone = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

const fetchMock = <K extends keyof AnalyticsMockRegistry>(key: K): AnalyticsMockRegistry[K] => {
  return getAnalyticsMock(key as AnalyticsMockKey) as AnalyticsMockRegistry[K];
};

const mergePayload = <T>(base: T, overrides?: Partial<T>): T => {
  if (!overrides) {
    return base;
  }

  if (Array.isArray(base)) {
    return (overrides as T) ?? base;
  }

  if (typeof base === 'object' && base !== null) {
    return {
      ...(base as Record<string, unknown>),
      ...(overrides as Record<string, unknown>),
    } as T;
  }

  return (overrides as T) ?? base;
};

const withMetadata = <T>(payload: T): MetadataEnvelope<T> => ({
  metadata: METADATA,
  payload,
})

export function getMockAnalyticsPayload<K extends keyof AnalyticsMockRegistry>(
  key: K,
  overrides?: Partial<AnalyticsMockRegistry[K]>,
): MetadataEnvelope<AnalyticsMockRegistry[K]> {
  const base = clone(fetchMock(key));
  const payload = mergePayload(base, overrides);
  return withMetadata(payload);
}

export const getMockDailyInsight = (userId?: string) =>
  getMockAnalyticsPayload('DailyInsight', userId ? { user_id: userId } : undefined)

export const getMockWeeklySummary = (userId?: string) => {
  const envelope = getMockRecommendationData(userId)
  const objectives: WeeklyTopObjective[] = Array.isArray(envelope.payload.weekly_top3)
    ? envelope.payload.weekly_top3.map((objective) => ({ ...objective }))
    : []
  return {
    metadata: envelope.metadata,
    payload: objectives,
  }
}

export const getMockRecommendationData = (userId?: string) =>
  getMockAnalyticsPayload('RecommendationData', userId ? { user_id: userId } : undefined)

export const getMockUnderstandingPrediction = (userId?: string) =>
  getMockAnalyticsPayload('UnderstandingPrediction', userId ? { user_id: userId } : undefined);

export const getMockDashboardResponse = (userId?: string) =>
  getMockAnalyticsPayload('DashboardResponse', userId ? { user_id: userId } : undefined);

export const getMockDashboardSummary = () => getMockAnalyticsPayload('DashboardSummary');

export const getMockComparisonResponse = (userId?: string) =>
  getMockAnalyticsPayload('ComparisonResponse', userId ? { user_id: userId } : undefined);

export const getMockPeerBenchmark = (userId?: string, objectiveId?: string | null) => {
  const overrides: Partial<PeerBenchmark> = {};
  if (userId) {
    overrides.user_id = userId;
  }
  if (objectiveId !== undefined) {
    overrides.objective_id = objectiveId;
  }
  return getMockAnalyticsPayload(
    'PeerBenchmark',
    Object.keys(overrides).length > 0 ? overrides : undefined,
  );
};

export const getMockLongitudinalMetric = (userId?: string) =>
  getMockAnalyticsPayload('LongitudinalMetric', userId ? { user_id: userId } : undefined)

export const getMockComprehensionPattern = (userId?: string) =>
  getMockAnalyticsPayload('ComprehensionPattern', userId ? { user_id: userId } : undefined)

export const getMockCorrelationMatrix = (userId?: string) =>
  getMockAnalyticsPayload('CorrelationMatrix', userId ? { user_id: userId } : undefined)

export const getMockPredictionResponse = () => getMockAnalyticsPayload('PredictionResponse');

export const getMockModelPerformanceResponse = () =>
  getMockAnalyticsPayload('ModelPerformanceResponse');

export const getMockStruggleReductionResponse = () =>
  getMockAnalyticsPayload('StruggleReductionResponse');

export const getMockAlertResponse = () => getMockAnalyticsPayload('AlertResponse');

export const getMockInterventionResponse = () =>
  getMockAnalyticsPayload('InterventionResponse');

export const getMockWeeklyTopObjective = () =>
  getMockAnalyticsPayload('WeeklyTopObjective');

export const getMockTimeToMasteryEstimate = () =>
  getMockAnalyticsPayload('TimeToMasteryEstimate');

export const getMockRelativeStrength = () => getMockAnalyticsPayload('RelativeStrength');

export const getMockRelativeWeakness = () => getMockAnalyticsPayload('RelativeWeakness');

export function respondWithMock<T>(
  envelope: MetadataEnvelope<T>,
  init?: ResponseInit,
): Response {
  const headers = new Headers(init?.headers)
  headers.set(ANALYTICS_MOCK_METADATA_HEADER, JSON.stringify(envelope.metadata))
  return Response.json(envelope.payload, {
    ...init,
    headers,
  })
}

export function respondWithMockPayload<T>(
  payload: T,
  metadata: AnalyticsMockMetadata,
  init?: ResponseInit,
): Response {
  return respondWithMock({ payload, metadata }, init)
}

export type { AnalyticsMockRegistry, MetadataEnvelope }
