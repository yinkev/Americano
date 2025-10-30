/**
 * MCMC Diagnostics Panel Component
 *
 * Displays convergence diagnostics for Bayesian MCMC sampling:
 * - R-hat (Gelman-Rubin statistic): measures chain convergence
 * - ESS (Effective Sample Size): measures independent samples
 * - Divergent transitions: indicates sampling problems
 * - Overall convergence status
 *
 * Created: 2025-10-27T10:00:00-07:00
 * Part of: Day 7-8 Research Analytics Implementation
 */

'use client'

import { useState } from 'react'

// ==================== TYPE DEFINITIONS ====================

interface MCMCDiagnosticsProps {
  diagnostics: {
    r_hat: Record<string, number>
    effective_sample_size: Record<string, number>
    divergent_transitions: number
    max_tree_depth: number
    converged: boolean
  }
}

// ==================== HELPER FUNCTIONS ====================

function getRhatColor(rhat: number): string {
  if (rhat < 1.01) return 'bg-green-100 text-green-800 border-green-200'
  if (rhat < 1.05) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

function getRhatStatus(rhat: number): string {
  if (rhat < 1.01) return 'Excellent'
  if (rhat < 1.05) return 'Acceptable'
  return 'Poor'
}

function getESSStatus(ess: number, totalSamples: number = 8000): string {
  const ratio = ess / totalSamples
  if (ratio > 0.5) return 'Good'
  if (ratio > 0.1) return 'Acceptable'
  return 'Low'
}

function getESSColor(ess: number, totalSamples: number = 8000): string {
  const ratio = ess / totalSamples
  if (ratio > 0.5) return 'text-green-600'
  if (ratio > 0.1) return 'text-yellow-600'
  return 'text-red-600'
}

// ==================== COMPONENT ====================

export default function MCMCDiagnosticsPanel({ diagnostics }: MCMCDiagnosticsProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Extract parameter names and sort by R-hat (worst first)
  const parameterMetrics = Object.keys(diagnostics.r_hat)
    .map((param) => ({
      name: param,
      rhat: diagnostics.r_hat[param],
      ess: diagnostics.effective_sample_size[param],
    }))
    .sort((a, b) => b.rhat - a.rhat)

  // Get worst R-hat for summary
  const worstRhat = parameterMetrics[0]?.rhat || 1.0

  return (
    <div className="space-y-4">
      {/* Header with Convergence Status */}
      <div className="rounded-lg border border-white/20 bg-white/80 backdrop-blur-md p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">MCMC Convergence Diagnostics</h3>
          <div className="flex items-center gap-2">
            {diagnostics.converged ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                ✓ Converged
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                ⚠ Not Converged
              </span>
            )}
          </div>
        </div>

        {/* Summary Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Worst R-hat */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Worst R̂</span>
              <InfoTooltip content="R̂ (R-hat) measures chain convergence. Values < 1.01 indicate excellent convergence. This shows the worst parameter." />
            </div>
            <div className="text-2xl font-bold">{worstRhat.toFixed(4)}</div>
            <div
              className={`text-xs ${
                worstRhat < 1.01
                  ? 'text-green-600'
                  : worstRhat < 1.05
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {getRhatStatus(worstRhat)}
            </div>
          </div>

          {/* Divergent Transitions */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Divergences</span>
              <InfoTooltip content="Number of divergent transitions. Should be 0 for reliable results. Divergences indicate sampling problems." />
            </div>
            <div className="text-2xl font-bold">{diagnostics.divergent_transitions}</div>
            <div
              className={`text-xs ${
                diagnostics.divergent_transitions === 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {diagnostics.divergent_transitions === 0 ? 'None' : 'Warning'}
            </div>
          </div>

          {/* Max Tree Depth */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Max Tree Depth</span>
              <InfoTooltip content="Maximum NUTS tree depth reached. High values may indicate sampling inefficiency." />
            </div>
            <div className="text-2xl font-bold">{diagnostics.max_tree_depth}</div>
            <div className="text-xs text-gray-600">NUTS depth</div>
          </div>

          {/* Parameters Tracked */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Parameters</span>
              <InfoTooltip content="Number of model parameters monitored for convergence." />
            </div>
            <div className="text-2xl font-bold">{parameterMetrics.length}</div>
            <div className="text-xs text-gray-600">Tracked</div>
          </div>
        </div>

        {/* Toggle Details Button */}
        <div className="mt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {showDetails ? '▼ Hide' : '▶ Show'} Parameter Details
          </button>
        </div>

        {/* Detailed Parameter Metrics */}
        {showDetails && (
          <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Parameter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    R̂ (R-hat)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    ESS
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {parameterMetrics.map((param) => (
                  <tr key={param.name} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-900">
                      {param.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`rounded px-2 py-1 font-medium ${getRhatColor(param.rhat)}`}>
                        {param.rhat.toFixed(4)}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-sm font-medium ${getESSColor(param.ess)}`}
                    >
                      {Math.round(param.ess)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {getRhatStatus(param.rhat)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interpretation Guide */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-blue-900">Understanding MCMC Diagnostics</h4>
        <dl className="space-y-2 text-sm text-blue-800">
          <div>
            <dt className="font-semibold">R̂ (R-hat):</dt>
            <dd>
              Measures chain convergence. Values close to 1.0 indicate chains have converged.{' '}
              <strong>&lt; 1.01 is excellent</strong>, &lt; 1.05 is acceptable, ≥ 1.05 suggests lack
              of convergence.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">ESS (Effective Sample Size):</dt>
            <dd>
              Number of independent samples. Higher is better. Should be at least 10% of total
              samples (800+ for 8,000 samples).
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Divergent Transitions:</dt>
            <dd>
              Indicates sampling problems in high-curvature regions. <strong>Should be 0</strong>.
              If &gt; 0, results may be unreliable.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Max Tree Depth:</dt>
            <dd>
              NUTS algorithm tree depth. Values hitting the limit (usually 10) may indicate
              inefficient sampling.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

// ==================== SUB-COMPONENTS ====================

function InfoTooltip({ content }: { content: string }) {
  return (
    <div className="group relative inline-block">
      <span className="cursor-help text-gray-400 hover:text-gray-600">ⓘ</span>
      <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden w-64 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
        {content}
        <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900" />
      </div>
    </div>
  )
}
