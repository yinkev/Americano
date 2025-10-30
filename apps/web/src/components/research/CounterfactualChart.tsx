/**
 * Counterfactual Chart Component
 *
 * Displays the observed vs counterfactual time series from Bayesian ITS analysis.
 * Shows the pre-intervention trend continuation (counterfactual) vs actual observations.
 *
 * Created: 2025-10-27T09:50:00-07:00
 * Part of: Day 7-8 Research Analytics Implementation
 */

'use client'

import { useState } from 'react'

// ==================== TYPE DEFINITIONS ====================

interface CounterfactualChartProps {
  plots: {
    observed_vs_counterfactual: string // base64 encoded PNG
    posterior_predictive_check: string
    effect_distribution: string
    mcmc_diagnostics: string
  }
  observationCounts: {
    pre: number
    post: number
  }
}

// ==================== COMPONENT ====================

export default function CounterfactualChart({
  plots,
  observationCounts,
}: CounterfactualChartProps) {
  const [selectedPlot, setSelectedPlot] = useState<
    'counterfactual' | 'posterior' | 'effects' | 'diagnostics'
  >('counterfactual')

  const plotData = {
    counterfactual: {
      title: 'Observed vs Counterfactual',
      description:
        'Time series showing observed outcomes vs predicted counterfactual (what would have happened without intervention)',
      base64: plots.observed_vs_counterfactual,
    },
    posterior: {
      title: 'Posterior Predictive Check',
      description: 'Model fit validation - observed data should fall within credible intervals',
      base64: plots.posterior_predictive_check,
    },
    effects: {
      title: 'Effect Distribution',
      description: 'Posterior distribution of treatment effects with credible intervals',
      base64: plots.effect_distribution,
    },
    diagnostics: {
      title: 'MCMC Trace Plots',
      description: 'Convergence diagnostics for MCMC sampling chains',
      base64: plots.mcmc_diagnostics,
    },
  }

  const currentPlot = plotData[selectedPlot]

  return (
    <div className="space-y-4">
      {/* Header with Observation Counts */}
      <div className="rounded-lg border border-white/20 bg-white/80 backdrop-blur-md p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Time Series Analysis</h3>
            <p className="text-sm text-gray-600">{currentPlot.description}</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="rounded-md bg-blue-50 px-3 py-2">
              <span className="font-medium text-blue-900">Pre:</span>{' '}
              <span className="text-blue-700">{observationCounts.pre} obs</span>
            </div>
            <div className="rounded-md bg-green-50 px-3 py-2">
              <span className="font-medium text-green-900">Post:</span>{' '}
              <span className="text-green-700">{observationCounts.post} obs</span>
            </div>
          </div>
        </div>

        {/* Plot Tabs */}
        <div className="mb-4 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setSelectedPlot('counterfactual')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedPlot === 'counterfactual'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Counterfactual
          </button>
          <button
            onClick={() => setSelectedPlot('posterior')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedPlot === 'posterior'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Model Fit
          </button>
          <button
            onClick={() => setSelectedPlot('effects')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedPlot === 'effects'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Effects
          </button>
          <button
            onClick={() => setSelectedPlot('diagnostics')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedPlot === 'diagnostics'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Diagnostics
          </button>
        </div>

        {/* Plot Display */}
        <div className="rounded-lg bg-gray-50 p-4">
          {currentPlot.base64 ? (
            <img
              src={`data:image/png;base64,${currentPlot.base64}`}
              alt={currentPlot.title}
              className="w-full rounded-md"
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-gray-400">
              <p>Plot not available</p>
            </div>
          )}
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-blue-900">How to Read This Chart</h4>
        {selectedPlot === 'counterfactual' && (
          <ul className="space-y-1 text-sm text-blue-800">
            <li>
              • <strong>Blue line:</strong> Observed outcomes (actual data)
            </li>
            <li>
              • <strong>Orange line:</strong> Counterfactual prediction (without intervention)
            </li>
            <li>
              • <strong>Shaded area:</strong> 95% credible interval for counterfactual
            </li>
            <li>
              • <strong>Vertical line:</strong> Intervention date (pre/post divider)
            </li>
            <li>
              • <strong>Gap between lines:</strong> Estimated causal effect of intervention
            </li>
          </ul>
        )}
        {selectedPlot === 'posterior' && (
          <ul className="space-y-1 text-sm text-blue-800">
            <li>
              • <strong>Dots:</strong> Observed data points
            </li>
            <li>
              • <strong>Dark line:</strong> Model posterior mean prediction
            </li>
            <li>
              • <strong>Shaded area:</strong> 95% credible interval (model uncertainty)
            </li>
            <li>
              • <strong>Good fit:</strong> Most dots should fall within shaded area
            </li>
          </ul>
        )}
        {selectedPlot === 'effects' && (
          <ul className="space-y-1 text-sm text-blue-800">
            <li>
              • <strong>Histogram:</strong> Distribution of effect sizes from MCMC samples
            </li>
            <li>
              • <strong>Vertical lines:</strong> Credible interval bounds
            </li>
            <li>
              • <strong>Shift from zero:</strong> Evidence of causal effect
            </li>
            <li>
              • <strong>Width:</strong> Uncertainty in effect estimate
            </li>
          </ul>
        )}
        {selectedPlot === 'diagnostics' && (
          <ul className="space-y-1 text-sm text-blue-800">
            <li>
              • <strong>Multiple chains:</strong> Different colors = independent MCMC runs
            </li>
            <li>
              • <strong>Good convergence:</strong> Chains should mix and overlap
            </li>
            <li>
              • <strong>Horizontal trend:</strong> Samples exploring stable posterior
            </li>
            <li>
              • <strong>No drift:</strong> Chains should not trend up/down over time
            </li>
          </ul>
        )}
      </div>
    </div>
  )
}
