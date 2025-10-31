import {
  attachSource,
  type AnalyticsDateRange,
  type SourceTagged,
  type SuccessProbabilityResponse,
} from './analytics.shared'
import type {
  ComparisonResult,
  ComprehensionPattern,
  CorrelationMatrix,
  DailyInsight,
  DashboardSummary,
  InterventionSuggestion,
  LongitudinalMetric,
  PeerBenchmark,
  RecommendationData,
  TimeToMasteryEstimate,
  UnderstandingPrediction,
  WeeklyTopObjective,
} from './types/generated'

const MOCK_GENERATED_AT = new Date('2024-03-01T12:00:00Z').toISOString()

export function createMockDailyInsight(userId: string): SourceTagged<DailyInsight> {
  return attachSource(
    {
      user_id: userId,
      priority_objective_id: 'obj_cardiac_conduction',
      priority_objective_name: 'Cardiac Conduction Pathways',
      insight_category: 'weakness',
      title: 'Reinforce cardiac action potential sequencing',
      description:
        'Confidence is trailing performance on conduction sequencing. Refresh the electrophysiology steps and practice ECG mapping to rebuild speed.',
      action_items: [
        'Review conduction pathway diagram for 10 minutes',
        'Complete 6 ECG interpretation drills focusing on conduction delays',
        'Teach back the sequence aloud to reinforce recall',
      ],
      estimated_time_minutes: 45,
      generated_at: MOCK_GENERATED_AT,
    },
    'mock',
  )
}

export function createMockWeeklySummary(userId: string): SourceTagged<WeeklyTopObjective[]> {
  return attachSource(
    [
      {
        objective_id: 'obj_ekg_patterns',
        objective_name: 'Electrocardiogram Pattern Recognition',
        rationale:
          'Pattern errors in differential questions indicate a gap identifying ischemic changes. Focused review improves diagnostic confidence.',
        estimated_hours: 4,
      },
      {
        objective_id: 'obj_hemodynamics',
        objective_name: 'Cardiovascular Hemodynamics',
        rationale:
          'Simulation sessions show slowed reasoning when calculating afterload adjustments. Targeted practice accelerates scenario throughput.',
        estimated_hours: 3,
      },
      {
        objective_id: 'obj_pharm_autonomics',
        objective_name: 'Autonomic Pharmacology',
        rationale:
          'Recent adaptive sessions flagged retention dips in beta-blocker mechanisms. Short spaced reviews will stabilize recall.',
        estimated_hours: 2.5,
      },
    ],
    'mock',
  )
}

export function createMockInterventions(userId: string): SourceTagged<InterventionSuggestion[]> {
  return attachSource(
    [
      {
        pattern_detected: 'poor_retention',
        intervention_type: 'spaced_repetition',
        description:
          'Revisit core electrophysiology prompts every 48 hours with 3-question micro-reviews to reinforce decaying concepts.',
        priority: 'high',
        estimated_time_hours: 0.8,
      },
      {
        pattern_detected: 'weak_reasoning',
        intervention_type: 'clinical_scenarios',
        description:
          'Blend two cardio renal scenarios per week that require explaining conduction findings to patients to strengthen articulation.',
        priority: 'medium',
        estimated_time_hours: 1.2,
      },
      {
        pattern_detected: 'bottleneck_detected',
        intervention_type: 'foundational_review',
        description:
          'Insert a 30-minute foundational recap on ion channel phases before tackling advanced arrhythmia cases.',
        priority: 'medium',
        estimated_time_hours: 0.5,
      },
    ],
    'mock',
  )
}

export function createMockTimeToMastery(
  objectiveId: string,
  objectiveName = 'Cardiac Electrophysiology',
): SourceTagged<TimeToMasteryEstimate> {
  return attachSource(
    {
      objective_id: objectiveId,
      objective_name: objectiveName,
      current_score: 72.5,
      hours_to_mastery: 11.5,
      weeks_to_mastery: 1.7,
    },
    'mock',
  )
}

export function createMockSuccessProbability(
  objectiveId: string,
  plannedHours: number,
): SourceTagged<SuccessProbabilityResponse> {
  const successProbability = Math.min(0.92, 0.55 + plannedHours * 0.03)
  const confidence: SuccessProbabilityResponse['confidence_level'] =
    successProbability >= 0.75 ? 'high' : successProbability >= 0.6 ? 'medium' : 'low'

  return attachSource(
    {
      objective_id: objectiveId,
      planned_study_hours: plannedHours,
      success_probability: Number(successProbability.toFixed(2)),
      confidence_level: confidence,
    },
    'mock',
  )
}

export function createMockRecommendations(userId: string): SourceTagged<RecommendationData> {
  const dailyInsight = createMockDailyInsight(userId)
  const weeklySummary = createMockWeeklySummary(userId)
  const interventions = createMockInterventions(userId)
  const timeEstimate = createMockTimeToMastery('obj_cardiac_conduction')

  return attachSource(
    {
      user_id: userId,
      daily_insight: dailyInsight,
      weekly_top3: weeklySummary,
      interventions,
      time_estimates: [timeEstimate],
      exam_success_probability: 0.82,
      generated_at: MOCK_GENERATED_AT,
    },
    'mock',
  )
}

export function createMockPredictions(userId: string): SourceTagged<UnderstandingPrediction> {
  return attachSource(
    {
      user_id: userId,
      exam_success: {
        probability: 0.81,
        confidence_interval: [0.74, 0.88],
        contributing_factors: {
          comprehension: 0.28,
          reasoning: 0.31,
          mastery: 0.24,
          calibration: 0.17,
        },
        recommendation:
          'Maintain two adaptive sessions per week and add one spaced repetition block before the simulated exam.',
      },
      forgetting_risks: [
        {
          objective_id: 'obj_autonomic',
          objective_name: 'Autonomic Pharmacology',
          retention_probability: 0.54,
          days_since_review: 9,
          strength_score: 62,
          risk_level: 'high',
          recommended_review_date: MOCK_GENERATED_AT,
        },
      ],
      mastery_dates: [
        {
          objective_id: 'obj_cardiac_conduction',
          objective_name: 'Cardiac Conduction Pathways',
          current_score: 72,
          predicted_mastery_date: new Date('2024-03-18T12:00:00Z').toISOString(),
          days_to_mastery: 17,
          weekly_improvement_rate: 4.2,
          confidence: 'moderate',
        },
      ],
      model_accuracy: {
        forgetting_risk: {
          metric_name: 'Mean Absolute Error',
          mean_absolute_error: 0.08,
          r_squared: 0.81,
          sample_size: 325,
          last_updated: MOCK_GENERATED_AT,
        },
        mastery_projection: {
          metric_name: 'R-Squared',
          mean_absolute_error: 5.2,
          r_squared: 0.76,
          sample_size: 412,
          last_updated: MOCK_GENERATED_AT,
        },
      },
      generated_at: MOCK_GENERATED_AT,
    },
    'mock',
  )
}

export function createMockPatterns(
  userId: string,
  dateRange: AnalyticsDateRange = '30d',
): SourceTagged<ComprehensionPattern> {
  return attachSource(
    {
      user_id: userId,
      strengths: [
        {
          objective_id: 'obj_micro_circulation',
          objective_name: 'Microcirculation Regulation',
          score: 88,
          percentile_rank: 92,
        },
      ],
      weaknesses: [
        {
          objective_id: 'obj_ecg_analysis',
          objective_name: 'ECG Analysis',
          score: 64,
          percentile_rank: 18,
        },
      ],
      calibration_issues: [
        {
          objective_id: 'obj_cardiac_conduction',
          objective_name: 'Cardiac Conduction',
          calibration_delta: 18,
          category: 'overconfident',
          description: 'High confidence responses with sub-70% accuracy across last 3 sessions.',
        },
      ],
      ai_insights: [
        {
          category: 'pattern',
          observation:
            'Reasoning accuracy improves 12 points when prompts include scaffolded diagrams.',
          action: 'Embed diagram-first prompts into weekly review block.',
          confidence: 0.78,
        },
        {
          category: 'recommendation',
          observation: 'Spaced repetition blocks are skipped after long simulation days.',
          action: 'Schedule lightweight 10-minute reviews immediately after simulations.',
          confidence: 0.71,
        },
        {
          category: 'strength',
          observation: 'Terminology recall rebounds quickly when using teach-back summaries.',
          action: 'Continue weekly peer teaching session to reinforce terminology.',
          confidence: 0.82,
        },
      ],
      analysis_date_range: [
        new Date('2024-02-01T12:00:00Z').toISOString(),
        new Date('2024-03-01T12:00:00Z').toISOString(),
      ],
      generated_at: MOCK_GENERATED_AT,
    },
    'mock',
  )
}

export function createMockLongitudinal(
  userId: string,
  dateRange: AnalyticsDateRange = '90d',
): SourceTagged<LongitudinalMetric> {
  return attachSource(
    {
      user_id: userId,
      metrics: [
        {
          timestamp: Date.parse('2024-01-07T12:00:00Z'),
          comprehension: 68,
          reasoning: 64,
          calibration: 58,
          mastery: 52,
        },
        {
          timestamp: Date.parse('2024-02-04T12:00:00Z'),
          comprehension: 74,
          reasoning: 70,
          calibration: 63,
          mastery: 58,
        },
        {
          timestamp: Date.parse('2024-03-03T12:00:00Z'),
          comprehension: 79,
          reasoning: 75,
          calibration: 69,
          mastery: 63,
        },
      ],
      milestones: [
        {
          objective_id: 'obj_reasoning_depth',
          objective_name: 'Clinical Reasoning Depth',
          milestone_type: 'major_improvement',
          date_achieved: new Date('2024-02-18T12:00:00Z').toISOString(),
          description: 'Improved reasoning accuracy by 12 points week-over-week.',
          score_before: 63,
          score_after: 75,
        },
      ],
      regressions: [
        {
          objective_id: 'obj_confidence_alignment',
          objective_name: 'Confidence Alignment',
          score_before: 72,
          score_after: 64,
          decline_amount: 8,
          date_detected: new Date('2024-01-21T12:00:00Z').toISOString(),
          possible_causes: ['Skipped reflection journal after rapid-fire session'],
        },
      ],
      growth_trajectory: [
        {
          objective_id: 'obj_cardiac_conduction',
          objective_name: 'Cardiac Conduction',
          slope: 3.1,
          intercept: 48.2,
          r_squared: 0.81,
          predicted_days_to_mastery: 28,
        },
      ],
      improvement_rates: {
        week: {
          period: 'week',
          rate: 3.4,
          trend: 'accelerating',
        },
        month: {
          period: 'month',
          rate: 6.1,
          trend: 'stable',
        },
      },
      date_range: [
        new Date('2023-12-10T12:00:00Z').toISOString(),
        new Date('2024-03-03T12:00:00Z').toISOString(),
      ],
      generated_at: MOCK_GENERATED_AT,
    },
    'mock',
  )
}

export function createMockCorrelations(userId: string): SourceTagged<CorrelationMatrix> {
  return attachSource(
    {
      user_id: userId,
      matrix: [
        [1, 0.68, 0.42],
        [0.68, 1, 0.55],
        [0.42, 0.55, 1],
      ],
      objective_ids: ['obj_cardiac_conduction', 'obj_ecg_analysis', 'obj_pharm_autonomics'],
      objective_names: [
        'Cardiac Conduction',
        'ECG Analysis',
        'Autonomic Pharmacology',
      ],
      foundational_objectives: [
        {
          objective_id: 'obj_cardiac_conduction',
          objective_name: 'Cardiac Conduction',
          avg_correlation: 0.62,
          connected_count: 2,
        },
      ],
      bottleneck_objectives: [
        {
          objective_id: 'obj_ecg_analysis',
          objective_name: 'ECG Analysis',
          avg_correlation: 0.44,
          connected_count: 1,
        },
      ],
      recommended_study_sequence: [
        'Review conduction sequencing diagrams',
        'Practice ECG interpretation cases',
        'Reinforce autonomic pharmacology cards',
      ],
      generated_at: MOCK_GENERATED_AT,
    },
    'mock',
  )
}

export function createMockPeerBenchmark(
  userId: string,
  objectiveId?: string,
): SourceTagged<PeerBenchmark> {
  return attachSource(
    {
      user_id: userId,
      objective_id: objectiveId,
      peer_distribution: {
        mean: 76,
        median: 74,
        std_dev: 8,
        quartiles: { p25: 68, p50: 74, p75: 82 },
        q1: 68,
        q2: 74,
        q3: 82,
        iqr: 14,
        whisker_low: 58,
        whisker_high: 92,
        sample_size: 128,
        last_calculated: MOCK_GENERATED_AT,
      },
      user_percentile: 78,
      relative_strengths: [
        {
          objective_id: 'obj_renal',
          objective_name: 'Renal Physiology',
          user_percentile: 88,
          peer_avg: 73,
          advantage: 15,
        },
      ],
      relative_weaknesses: [
        {
          objective_id: 'obj_ecg_analysis',
          objective_name: 'ECG Analysis',
          user_percentile: 42,
          peer_avg: 70,
          disadvantage: -8,
        },
      ],
      generated_at: MOCK_GENERATED_AT,
    },
    'mock',
  )
}

export function createMockDashboard(
  userId: string,
  timeRange: AnalyticsDateRange = '30d',
): SourceTagged<DashboardSummary> {
  return attachSource(
    {
      overall_score: 78.5,
      total_sessions: 36,
      total_questions: 412,
      mastery_breakdown: {
        beginner: 4,
        proficient: 11,
        expert: 7,
      },
      recent_trends: [
        {
          date: new Date('2024-02-24T12:00:00Z').toISOString(),
          score: 74,
        },
        {
          date: new Date('2024-03-02T12:00:00Z').toISOString(),
          score: 79,
        },
        {
          date: new Date('2024-03-09T12:00:00Z').toISOString(),
          score: 82,
        },
      ],
      calibration_status: 'overconfident',
      top_strengths: ['Renal Physiology', 'Cardiac Output Analysis', 'Pharmacokinetics'],
      improvement_areas: ['ECG Interpretation', 'Cardiac Pharmacology', 'Clinical Explanations'],
      generated_at: MOCK_GENERATED_AT,
    },
    'mock',
  )
}

export function createMockComparison(
  userId: string,
  peerGroup: string = 'all',
): SourceTagged<ComparisonResult> {
  return attachSource(
    {
      user_percentile: 72,
      user_score: 78,
      peer_average: 74,
      peer_std_dev: 6,
      dimension_comparisons: [
        {
          dimension: 'terminology',
          user_score: 82,
          peer_average: 76,
          percentile: 84,
        },
        {
          dimension: 'relationships',
          user_score: 75,
          peer_average: 73,
          percentile: 68,
        },
        {
          dimension: 'application',
          user_score: 71,
          peer_average: 74,
          percentile: 46,
        },
        {
          dimension: 'clarity',
          user_score: 80,
          peer_average: 72,
          percentile: 79,
        },
      ],
      strengths_vs_peers: ['terminology', 'clarity'],
      gaps_vs_peers: ['application'],
      peer_group_size: 164,
      generated_at: MOCK_GENERATED_AT,
    },
    'mock',
  )
}
