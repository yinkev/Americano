/**
 * Bayesian ITS Dashboard Component
 *
 * Displays results from Bayesian Interrupted Time Series analysis:
 * - Causal effect estimates (immediate, sustained, counterfactual)
 * - Counterfactual chart (observed vs predicted)
 * - MCMC convergence diagnostics
 * - Credible intervals and probability of benefit
 *
 * Created: 2025-10-27T09:40:00-07:00
 * Part of: Day 7-8 Research Analytics Implementation
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import CounterfactualChart from './CounterfactualChart'
import MCMCDiagnosticsPanel from './MCMCDiagnosticsPanel'

// ==================== TYPE DEFINITIONS ====================

interface CausalEffect {
  point_estimate: number
  ci_lower: number
  ci_upper: number
  probability_positive: number
  probability_negative: number
}

interface MCMCDiagnostics {
  r_hat: Record<string, number>
  effective_sample_size: Record<string, number>
  divergent_transitions: number
  max_tree_depth: number
  converged: boolean
}

interface ITSAnalysisResponse {
  immediate_effect: CausalEffect
  sustained_effect: CausalEffect
  counterfactual_effect: CausalEffect
  probability_of_benefit: number
  mcmc_diagnostics: MCMCDiagnostics
  plots: {
    observed_vs_counterfactual: string // base64
    posterior_predictive_check: string
    effect_distribution: string
    mcmc_diagnostics: string
  }
  mlflow_run_id: string
  computation_time_seconds: number
  n_observations_pre: number
  n_observations_post: number
}

interface ITSAnalysisRequest {
  user_id: string
  intervention_date: string
  outcome_metric?: string
  include_day_of_week?: boolean
  include_time_of_day?: boolean
  mcmc_samples?: number
  mcmc_chains?: number
  start_date?: string
  end_date?: string
}

// ==================== API FUNCTIONS ====================

async function fetchITSAnalysis(request: ITSAnalysisRequest): Promise<ITSAnalysisResponse> {
  const response = await fetch('/api/analytics/research/bayesian-its', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'ITS analysis failed')
  }

  return response.json()
}

// ==================== COMPONENT ====================

interface BayesianITSDashboardProps {
  userId: string
  interventionDate: string
  outcomeMetric?: string
  autoRun?: boolean
}

export default function BayesianITSDashboard({
  userId,
  interventionDate,
  outcomeMetric = 'sessionPerformanceScore',
  autoRun = false,
}: BayesianITSDashboardProps) {
  const [isAnalysisTriggered, setIsAnalysisTriggered] = useState(autoRun)

  // React Query with 120s timeout for MCMC sampling
  const {
    data: results,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bayesian-its', userId, interventionDate, outcomeMetric],
    queryFn: () =>
      fetchITSAnalysis({
        user_id: userId,
        intervention_date: interventionDate,
        outcome_metric: outcomeMetric,
        mcmc_samples: 2000,
        mcmc_chains: 4,
      }),
    enabled: isAnalysisTriggered,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: false, // Don't retry on failure (expensive MCMC)
  })

  const handleRunAnalysis = () => {
    setIsAnalysisTriggered(true)
  }

  // ==================== RENDER STATES ====================

  if (!isAnalysisTriggered) {
    return (
      <div className="rounded-lg border border-white/20 bg-white/80 backdrop-blur-md p-8 text-center shadow-lg">
        <h2 className="mb-4 text-2xl font-bold">Bayesian ITS Analysis</h2>
        <p className="mb-6 text-gray-600">
          Run Bayesian Interrupted Time Series analysis to estimate causal effects of your
          intervention.
        </p>
        <div className="mb-6 rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Analysis takes 60-120 seconds due to MCMC sampling. Please be
            patient.
          </p>
        </div>
        <button
          onClick={handleRunAnalysis}
          className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Run Analysis
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/20 bg-white/80 backdrop-blur-md p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Bayesian ITS Analysis</h2>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm text-gray-600">Running MCMC sampling...</span>
          </div>
        </div>

        {/* Loading Skeleton */}
        <div className="space-y-6">
          <div className="h-32 animate-pulse rounded-md bg-gray-100" />
          <div className="h-64 animate-pulse rounded-md bg-gray-100" />
          <div className="h-48 animate-pulse rounded-md bg-gray-100" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8">
        <h2 className="mb-4 text-2xl font-bold text-red-900">Analysis Failed</h2>
        <p className="mb-4 text-red-700">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
        <button
          onClick={() => refetch()}
          className="rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
        >
          Retry Analysis
        </button>
      </div>
    )
  }

  if (!results) {
    return null
  }

  // ==================== RESULTS VIEW ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-white/20 bg-white/80 backdrop-blur-md p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Bayesian ITS Results</h2>
            <p className="text-sm text-gray-600">
              Intervention: {new Date(interventionDate).toLocaleDateString()} • Computed in{' '}
              {results.computation_time_seconds.toFixed(1)}s
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
          >
            Re-run
          </button>
        </div>
      </div>

      {/* Causal Effects Summary */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <EffectCard
          title="Immediate Effect"
          effect={results.immediate_effect}
          description="Level change at intervention"
        />
        <EffectCard
          title="Sustained Effect"
          effect={results.sustained_effect}
          description="Slope change post-intervention"
        />
        <EffectCard
          title="Counterfactual Effect"
          effect={results.counterfactual_effect}
          description="Observed vs predicted"
          highlight={true}
        />
      </div>

      {/* Probability of Benefit */}
      <div className="rounded-lg border border-white/20 bg-white/80 backdrop-blur-md p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">Probability of Benefit</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-8 rounded-full bg-gray-200">
              <div
                className="h-8 rounded-full bg-green-500"
                style={{ width: `${results.probability_of_benefit * 100}%` }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold">
            {(results.probability_of_benefit * 100).toFixed(1)}%
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Probability that intervention had a positive effect
        </p>
      </div>

      {/* Counterfactual Chart */}
      <CounterfactualChart
        plots={results.plots}
        observationCounts={{
          pre: results.n_observations_pre,
          post: results.n_observations_post,
        }}
      />

      {/* MCMC Diagnostics */}
      <MCMCDiagnosticsPanel diagnostics={results.mcmc_diagnostics} />

      {/* MLflow Link */}
      <div className="rounded-lg border border-white/20 bg-white/60 backdrop-blur-sm p-4 shadow">
        <p className="text-sm text-gray-600">
          <strong>MLflow Run ID:</strong>{' '}
          <code className="rounded bg-gray-200 px-2 py-1 text-xs">{results.mlflow_run_id}</code>
        </p>
      </div>
    </div>
  )
}

// ==================== SUB-COMPONENTS ====================

interface EffectCardProps {
  title: string
  effect: CausalEffect
  description: string
  highlight?: boolean
}

function EffectCard({ title, effect, description, highlight = false }: EffectCardProps) {
  const isPositive = effect.point_estimate > 0
  const bgColor = highlight ? 'bg-blue-50' : 'bg-white'
  const borderColor = highlight ? 'border-blue-200' : 'border-gray-200'

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} backdrop-blur-md p-6 shadow-lg`}>
      <h3 className="mb-2 text-sm font-medium text-gray-600">{title}</h3>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold">{effect.point_estimate.toFixed(2)}</span>
        <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '↑' : '↓'}
        </span>
      </div>
      <p className="mb-3 text-xs text-gray-500">
        95% CI: [{effect.ci_lower.toFixed(2)}, {effect.ci_upper.toFixed(2)}]
      </p>
      <p className="text-sm text-gray-600">{description}</p>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${effect.probability_positive * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">
          {(effect.probability_positive * 100).toFixed(0)}% positive
        </span>
      </div>
    </div>
  )
}
