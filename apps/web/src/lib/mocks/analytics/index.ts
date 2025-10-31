import {
  type ComprehensionPattern,
  type CorrelationMatrix,
  type DailyInsight,
  type GrowthTrajectory,
  type ImprovementRate,
  type LongitudinalMetric,
  type PeerBenchmark,
  type RecommendationData,
  type TimeToMasteryEstimate,
  type WeeklyTopObjective,
} from '@/types/api-generated'

function nowIso(): string {
  return new Date().toISOString()
}

function createDailyInsight(userId: string): DailyInsight {
  return {
    user_id: userId,
    priority_objective_id: 'obj-cardio-velocity',
    priority_objective_name: 'Interpret Vascular Flow Velocities',
    insight_category: 'dangerous_gap',
    title: 'Urgent: Reinforce Doppler Velocity Interpretation',
    description:
      'Recent validation responses show confident answers on Doppler velocity scenarios despite a 34% accuracy rate. This is creating a dangerous gap in cardiovascular interpretation.',
    action_items: [
      'Review the Doppler hemodynamics quick-reference (15 min)',
      'Complete the “Velocity Patterns in Stenosis” simulation with instructor feedback',
      'Schedule a spaced repetition review in 48 hours to confirm retention',
    ],
    estimated_time_minutes: 45,
    generated_at: nowIso(),
  }
}

const WEEKLY_OBJECTIVES: WeeklyTopObjective[] = [
  {
    objective_id: 'obj-neuro-precision',
    objective_name: 'Neurologic Localization Accuracy',
    rationale:
      'Improved reasoning accuracy by 12% when cases required cortical vs. peripheral differentiation—doubling down this week should lock in the gains.',
    estimated_hours: 4,
  },
  {
    objective_id: 'obj-cardio-integration',
    objective_name: 'Cardiac Pharmacology Integration',
    rationale:
      'Confidence is high but retention curves show a steep decline after day 5; add a mixed-format review to prevent regression.',
    estimated_hours: 3,
  },
  {
    objective_id: 'obj-renal-master',
    objective_name: 'Renal Failure Pattern Recognition',
    rationale:
      'Performance jumped 18 percentile points after targeted coaching—sustain momentum with deliberate practice sessions.',
    estimated_hours: 2,
  },
]

const TIME_ESTIMATES: TimeToMasteryEstimate[] = [
  {
    objective_id: 'obj-cardio-velocity',
    objective_name: 'Interpret Vascular Flow Velocities',
    current_score: 62,
    hours_to_mastery: 5,
    weeks_to_mastery: 2,
  },
  {
    objective_id: 'obj-neuro-precision',
    objective_name: 'Neurologic Localization Accuracy',
    current_score: 71,
    hours_to_mastery: 4,
    weeks_to_mastery: 1,
  },
  {
    objective_id: 'obj-renal-master',
    objective_name: 'Renal Failure Pattern Recognition',
    current_score: 78,
    hours_to_mastery: 3,
    weeks_to_mastery: 1,
  },
]

export function getMockDailyInsight(userId: string): DailyInsight {
  return createDailyInsight(userId)
}

export function getMockWeeklySummary(userId: string): WeeklyTopObjective[] {
  return WEEKLY_OBJECTIVES.map((objective) => ({ ...objective }))
}

export function getMockRecommendationData(userId: string): RecommendationData {
  return {
    user_id: userId,
    daily_insight: createDailyInsight(userId),
    weekly_top3: getMockWeeklySummary(userId),
    interventions: [
      {
        pattern_detected: 'Overconfidence in cardiovascular Doppler interpretations',
        intervention_type: 'immediate_review',
        description:
          'Schedule a failure-driven case set that highlights misinterpreted Doppler readings to recalibrate confidence levels.',
        priority: 'high',
        estimated_time_hours: 1,
      },
      {
        pattern_detected: 'Retention decline after day 5 on pharmacology content',
        intervention_type: 'spaced_repetition',
        description:
          'Automate spaced retrieval drills for high-yield cardio pharmacology within 3, 5, and 10 day intervals.',
        priority: 'medium',
        estimated_time_hours: 0.5,
      },
      {
        pattern_detected: 'Inconsistent application of renal failure heuristics',
        intervention_type: 'more_failure_challenges',
        description:
          'Inject two instructor-authored failure challenges that force re-application of renal failure heuristics under time pressure.',
        priority: 'medium',
        estimated_time_hours: 0.75,
      },
    ],
    time_estimates: TIME_ESTIMATES.map((estimate) => ({ ...estimate })),
    exam_success_probability: 0.87,
    generated_at: nowIso(),
  }
}

function generateMetrics(): Array<Record<string, number>> {
  const start = new Date()
  start.setDate(start.getDate() - 35)
  const points: Array<Record<string, number>> = []
  for (let i = 0; i < 6; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i * 7)
    points.push({
      timestamp: date.getTime(),
      comprehension: 68 + i * 3,
      reasoning: 64 + i * 2.5,
      calibration: 0.68 + i * 0.03,
    })
  }
  return points
}

function generateGrowthTrajectory(): GrowthTrajectory[] & { growth_rate: number } {
  const trajectory: GrowthTrajectory[] = [
    {
      objective_id: 'obj-cardio-velocity',
      objective_name: 'Interpret Vascular Flow Velocities',
      slope: 3.1,
      intercept: 42,
      r_squared: 0.88,
      predicted_days_to_mastery: 24,
    },
    {
      objective_id: 'obj-neuro-precision',
      objective_name: 'Neurologic Localization Accuracy',
      slope: 2.4,
      intercept: 55,
      r_squared: 0.82,
      predicted_days_to_mastery: 18,
    },
  ]

  return Object.assign(trajectory, { growth_rate: 4.6 })
}

function generateImprovementRates(): Record<string, ImprovementRate> {
  return {
    week: { period: 'week', rate: 4.2, trend: 'accelerating' },
    month: { period: 'month', rate: 11.4, trend: 'steady' },
  }
}

export function getMockLongitudinalMetric(userId: string): LongitudinalMetric {
  const start = new Date()
  start.setDate(start.getDate() - 42)
  const end = new Date()

  return {
    user_id: userId,
    metrics: generateMetrics(),
    milestones: [
      {
        objective_id: 'obj-renal-master',
        objective_name: 'Renal Failure Pattern Recognition',
        milestone_type: 'major_improvement',
        date_achieved: new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Improvement sprint increased renal failure case accuracy by 18%.',
        score_before: 62,
        score_after: 80,
      },
      {
        objective_id: 'obj-neuro-precision',
        objective_name: 'Neurologic Localization Accuracy',
        milestone_type: 'streak_achieved',
        date_achieved: new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Four consecutive perfect scenario walkthroughs logged.',
        score_before: 78,
        score_after: 90,
      },
    ],
    regressions: [
      {
        objective_id: 'obj-cardio-integration',
        objective_name: 'Cardiac Pharmacology Integration',
        score_before: 84,
        score_after: 72,
        decline_amount: 12,
        date_detected: new Date(end.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        possible_causes: [
          'Long delay between spaced reviews',
          'High cognitive load week with limited retrieval practice',
        ],
      },
    ],
    growth_trajectory: generateGrowthTrajectory(),
    improvement_rates: generateImprovementRates(),
    date_range: [start.toISOString(), end.toISOString()],
    generated_at: nowIso(),
  }
}

export function getMockComprehensionPattern(userId: string): ComprehensionPattern {
  return {
    user_id: userId,
    strengths: [
      {
        objective_id: 'obj-neuro-precision',
        objective_name: 'Neurologic Localization Accuracy',
        score: 92,
        percentile_rank: 96,
      },
      {
        objective_id: 'obj-renal-master',
        objective_name: 'Renal Failure Pattern Recognition',
        score: 88,
        percentile_rank: 90,
      },
    ],
    weaknesses: [
      {
        objective_id: 'obj-cardio-velocity',
        objective_name: 'Interpret Vascular Flow Velocities',
        score: 62,
        percentile_rank: 41,
      },
      {
        objective_id: 'obj-heme-clot',
        objective_name: 'Hypercoagulable State Workups',
        score: 58,
        percentile_rank: 38,
      },
    ],
    calibration_issues: [
      {
        objective_id: 'obj-cardio-velocity',
        objective_name: 'Interpret Vascular Flow Velocities',
        calibration_delta: 0.32,
        category: 'overconfident',
        description:
          'High self-reported confidence (+32%) despite repeated Doppler interpretation errors.',
      },
      {
        objective_id: 'obj-heme-clot',
        objective_name: 'Hypercoagulable State Workups',
        calibration_delta: -0.18,
        category: 'underconfident',
        description:
          'Accuracy is improving (78%) but confidence remains low—add positive reinforcement coaching.',
      },
    ],
    ai_insights: [
      {
        category: 'weakness',
        observation:
          'Cardiovascular Doppler cases show repeated misclassification when velocity ratios exceed 2.5.',
        action: 'Introduce annotated exemplars that contrast moderate vs. critical stenosis velocities.',
        confidence: 0.84,
      },
      {
        category: 'pattern',
        observation:
          'Neuro cases improve dramatically when visual aids are provided before diagnostic questions.',
        action: 'Attach localization schematics to every second neuro case to reinforce pattern recognition.',
        confidence: 0.79,
      },
      {
        category: 'recommendation',
        observation: 'Renal pattern recognition spikes after failure-driven review sessions.',
        action: 'Schedule one more failure-driven review this week to cement heuristics.',
        confidence: 0.82,
      },
    ],
    analysis_date_range: ['2024-04-01', '2024-05-12'],
    generated_at: nowIso(),
  }
}

export function getMockCorrelationMatrix(userId: string): CorrelationMatrix {
  return {
    user_id: userId,
    matrix: [
      [1, 0.72, 0.58],
      [0.72, 1, 0.63],
      [0.58, 0.63, 1],
    ],
    objective_ids: ['obj-cardio-velocity', 'obj-neuro-precision', 'obj-renal-master'],
    objective_names: [
      'Interpret Vascular Flow Velocities',
      'Neurologic Localization Accuracy',
      'Renal Failure Pattern Recognition',
    ],
    foundational_objectives: ['obj-neuro-precision'],
    bottleneck_objectives: ['obj-cardio-velocity'],
    recommended_study_sequence: [
      'obj-neuro-precision',
      'obj-renal-master',
      'obj-cardio-velocity',
    ],
    generated_at: nowIso(),
  }
}

export function getMockPeerBenchmark(userId: string, objectiveId?: string): PeerBenchmark {
  return {
    user_id: userId,
    objective_id: objectiveId ?? 'obj-cardio-velocity',
    peer_distribution: {
      mean: 76,
      median: 78,
      std_dev: 8,
      quartiles: { p25: 70, p50: 78, p75: 84 },
      q1: 70,
      q2: 78,
      q3: 84,
      iqr: 14,
      whisker_low: 58,
      whisker_high: 94,
      sample_size: 214,
      last_calculated: nowIso(),
    },
    user_percentile: 63,
    relative_strengths: [
      {
        objective_id: 'obj-neuro-precision',
        objective_name: 'Neurologic Localization Accuracy',
        user_percentile: 88,
        gap: 9,
      },
    ],
    relative_weaknesses: [
      {
        objective_id: 'obj-cardio-velocity',
        objective_name: 'Interpret Vascular Flow Velocities',
        user_percentile: 42,
        gap: -6,
      },
    ],
    generated_at: nowIso(),
  }
}
