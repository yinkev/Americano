/**
 * Story 4.6 Task 6: Predictions Tab
 *
 * Displays ML-powered predictions for:
 * - Exam success probability with confidence intervals
 * - Forgetting risk analysis for objectives
 * - Mastery date predictions with hours needed
 * - Model accuracy metrics for transparency
 *
 * Architecture: TypeScript + React Query + Recharts
 * Data Source: /api/analytics/understanding/predictions
 *
 * @see docs/stories/story-4.6.md - Task 6
 */

'use client'

import { AlertTriangle, Calendar, Info, Target, TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { usePredictions } from '@/hooks/use-understanding-analytics'

/**
 * Main Predictions Tab Component
 */
export default function PredictionsTab() {
  const { data, isLoading, error } = usePredictions()

  if (isLoading) {
    return <PredictionsTabSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-12 h-12 mx-auto" style={{ color: 'oklch(0.65 0.20 25)' }} />
          <p className="text-lg font-medium" style={{ color: 'oklch(0.3 0.02 240)' }}>
            Failed to load predictions
          </p>
          <p className="text-sm" style={{ color: 'oklch(0.5 0.02 240)' }}>
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Exam Success Prediction */}
      <ExamSuccessCard prediction={data.examSuccess} />

      {/* Grid for Forgetting Risks and Mastery Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForgettingRisksList risks={data.forgettingRisks} />
        <MasteryDatesList predictions={data.masteryDates} />
      </div>

      {/* Model Accuracy Metrics */}
      <ModelAccuracyCard accuracy={data.modelAccuracy} />
    </div>
  )
}

/**
 * Exam Success Prediction Card
 */
function ExamSuccessCard({ prediction }: { prediction: any }) {
  const probability = Math.round(prediction.probability * 100)
  const { lower, upper } = prediction.confidenceInterval
  const confidenceRange = Math.round((upper - lower) * 100)

  // Color based on probability
  const getColor = () => {
    if (probability >= 80) return 'oklch(0.7 0.15 145)' // Green - high success
    if (probability >= 60) return 'oklch(0.75 0.12 85)' // Yellow - moderate
    return 'oklch(0.65 0.20 25)' // Red - needs work
  }

  return (
    <div
      className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/50"
      style={{ minHeight: '44px' }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" style={{ color: 'oklch(0.6 0.18 230)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'oklch(0.3 0.02 240)' }}>
              Exam Success Prediction
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'oklch(0.5 0.02 240)' }}>
            Based on your current understanding metrics
          </p>
        </div>
      </div>

      {/* Main Probability Display */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-5xl font-bold" style={{ color: getColor() }}>
            {probability}%
          </span>
          <span className="text-lg" style={{ color: 'oklch(0.5 0.02 240)' }}>
            success probability
          </span>
        </div>

        {/* Confidence Interval */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="px-3 py-1 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'oklch(0.95 0.02 240)',
              color: 'oklch(0.5 0.02 240)',
            }}
          >
            ±{confidenceRange}% confidence interval
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
            style={{
              width: `${probability}%`,
              backgroundColor: getColor(),
            }}
          />
        </div>
      </div>

      {/* Contributing Factors */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'oklch(0.4 0.02 240)' }}>
          Key Contributing Factors
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {prediction.factors.map((factor: string, idx: number) => (
            <div
              key={idx}
              className="px-3 py-2 rounded-lg text-sm text-center"
              style={{
                backgroundColor: 'oklch(0.97 0.02 240)',
                color: 'oklch(0.4 0.02 240)',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {factor}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Forgetting Risk List Component
 */
function ForgettingRisksList({ risks }: { risks: any[] }) {
  // Sort by risk level (high -> medium -> low)
  const sortedRisks = [...risks].sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 }
    return (
      riskOrder[a.riskLevel as keyof typeof riskOrder] -
      riskOrder[b.riskLevel as keyof typeof riskOrder]
    )
  })

  const getRiskColor = (level: string) => {
    if (level === 'high') return 'oklch(0.65 0.20 25)' // Red
    if (level === 'medium') return 'oklch(0.75 0.12 85)' // Yellow
    return 'oklch(0.7 0.15 145)' // Green
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div
      className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/50"
      style={{ minHeight: '44px' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5" style={{ color: 'oklch(0.65 0.20 25)' }} />
        <h3 className="text-lg font-semibold" style={{ color: 'oklch(0.3 0.02 240)' }}>
          Forgetting Risk Analysis
        </h3>
      </div>

      <p className="text-sm mb-6" style={{ color: 'oklch(0.5 0.02 240)' }}>
        Objectives at risk of forgetting, sorted by urgency
      </p>

      {sortedRisks.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto mb-3" style={{ color: 'oklch(0.7 0.15 145)' }} />
          <p className="text-sm font-medium" style={{ color: 'oklch(0.4 0.02 240)' }}>
            No forgetting risks detected
          </p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.5 0.02 240)' }}>
            Your knowledge retention is strong!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {sortedRisks.map((risk, idx) => (
            <button
              key={risk.objectiveId}
              className="w-full text-left p-4 rounded-xl hover:shadow-md transition-all duration-200 group"
              style={{
                backgroundColor: 'oklch(0.98 0.01 240)',
                border: '1px solid oklch(0.9 0.02 240)',
                minHeight: '44px',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold uppercase"
                      style={{
                        backgroundColor: getRiskColor(risk.riskLevel),
                        color: 'white',
                      }}
                    >
                      {risk.riskLevel} risk
                    </span>
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: 'oklch(0.3 0.02 240)' }}
                    >
                      {risk.objectiveName}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-4 text-xs"
                    style={{ color: 'oklch(0.5 0.02 240)' }}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Last studied: {formatDate(risk.lastStudied)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Review in {risk.daysUntilForgetting} days</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Mastery Date Predictions Component
 */
function MasteryDatesList({ predictions }: { predictions: any[] }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`
    if (hours < 24) return `${Math.round(hours)} hrs`
    return `${Math.round(hours / 24)} days`
  }

  return (
    <div
      className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/50"
      style={{ minHeight: '44px' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5" style={{ color: 'oklch(0.6 0.18 230)' }} />
        <h3 className="text-lg font-semibold" style={{ color: 'oklch(0.3 0.02 240)' }}>
          Mastery Date Predictions
        </h3>
      </div>

      <p className="text-sm mb-6" style={{ color: 'oklch(0.5 0.02 240)' }}>
        Estimated achievement dates for in-progress objectives
      </p>

      {predictions.length === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: 'oklch(0.6 0.18 230)' }} />
          <p className="text-sm font-medium" style={{ color: 'oklch(0.4 0.02 240)' }}>
            No active objectives
          </p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.5 0.02 240)' }}>
            Start learning to see predictions
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {predictions.map((pred, idx) => (
            <div
              key={pred.objectiveId}
              className="p-4 rounded-xl"
              style={{
                backgroundColor: 'oklch(0.98 0.01 240)',
                border: '1px solid oklch(0.9 0.02 240)',
                minHeight: '44px',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h4
                    className="font-medium text-sm mb-1 truncate"
                    style={{ color: 'oklch(0.3 0.02 240)' }}
                  >
                    {pred.objectiveName}
                  </h4>
                  <div
                    className="flex items-center gap-3 text-xs"
                    style={{ color: 'oklch(0.5 0.02 240)' }}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Est: {formatDate(pred.estimatedDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{formatHours(pred.hoursNeeded)} needed</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold" style={{ color: 'oklch(0.6 0.18 230)' }}>
                    {Math.round(pred.currentProgress)}%
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pred.currentProgress}%`,
                    backgroundColor: 'oklch(0.6 0.18 230)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Model Accuracy Metrics Card
 */
function ModelAccuracyCard({ accuracy }: { accuracy: any }) {
  const accuracyPercentage = Math.max(0, Math.min(100, 100 - accuracy.mae))

  return (
    <div
      className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/50"
      style={{ minHeight: '44px' }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5" style={{ color: 'oklch(0.6 0.18 230)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'oklch(0.3 0.02 240)' }}>
              Model Accuracy Metrics
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'oklch(0.5 0.02 240)' }}>
            Transparency report on prediction quality
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MAE Metric */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold" style={{ color: 'oklch(0.6 0.18 230)' }}>
              {accuracy.mae.toFixed(2)}
            </span>
            <span className="text-sm" style={{ color: 'oklch(0.5 0.02 240)' }}>
              Mean Absolute Error
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'oklch(0.5 0.02 240)' }}>
            Lower is better. Measures average prediction error.
          </p>

          {/* MAE Visual */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                width: `${accuracyPercentage}%`,
                backgroundColor: 'oklch(0.7 0.15 145)',
              }}
            />
          </div>
        </div>

        {/* Sample Size */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold" style={{ color: 'oklch(0.6 0.18 230)' }}>
              {accuracy.sampleSize.toLocaleString()}
            </span>
            <span className="text-sm" style={{ color: 'oklch(0.5 0.02 240)' }}>
              data points
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'oklch(0.5 0.02 240)' }}>
            Number of historical predictions used for validation
          </p>

          {/* Sample size indicator */}
          <div className="flex items-center gap-2">
            {accuracy.sampleSize >= 100 ? (
              <>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'oklch(0.7 0.15 145)' }}
                />
                <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.02 240)' }}>
                  High confidence
                </span>
              </>
            ) : accuracy.sampleSize >= 30 ? (
              <>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'oklch(0.75 0.12 85)' }}
                />
                <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.02 240)' }}>
                  Moderate confidence
                </span>
              </>
            ) : (
              <>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'oklch(0.65 0.20 25)' }}
                />
                <span className="text-xs font-medium" style={{ color: 'oklch(0.4 0.02 240)' }}>
                  Building confidence
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div
        className="mt-6 p-4 rounded-xl text-sm"
        style={{
          backgroundColor: 'oklch(0.95 0.02 240)',
          color: 'oklch(0.4 0.02 240)',
        }}
      >
        <p className="font-medium mb-2">How to interpret these metrics:</p>
        <ul className="space-y-1 text-xs" style={{ color: 'oklch(0.5 0.02 240)' }}>
          <li>• MAE &lt; 5: Highly accurate predictions</li>
          <li>• MAE 5-10: Good predictive accuracy</li>
          <li>• MAE &gt; 10: Model improving with more data</li>
          <li>• Sample size &gt; 100: Statistical significance achieved</li>
        </ul>
      </div>
    </div>
  )
}

/**
 * Skeleton loader for Predictions Tab
 */
function PredictionsTabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Exam Success Skeleton */}
      <div
        className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/50"
        style={{ minHeight: '300px' }}
      >
        <div className="h-6 w-48 rounded" style={{ backgroundColor: 'oklch(0.9 0.02 240)' }} />
        <div
          className="mt-4 h-16 w-32 rounded"
          style={{ backgroundColor: 'oklch(0.9 0.02 240)' }}
        />
        <div
          className="mt-4 h-3 w-full rounded"
          style={{ backgroundColor: 'oklch(0.9 0.02 240)' }}
        />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/50"
            style={{ minHeight: '400px' }}
          >
            <div
              className="h-6 w-48 rounded mb-4"
              style={{ backgroundColor: 'oklch(0.9 0.02 240)' }}
            />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-20 rounded-xl"
                  style={{ backgroundColor: 'oklch(0.95 0.02 240)' }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Accuracy Skeleton */}
      <div
        className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/50"
        style={{ minHeight: '200px' }}
      >
        <div className="h-6 w-48 rounded" style={{ backgroundColor: 'oklch(0.9 0.02 240)' }} />
        <div className="mt-4 grid grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded"
              style={{ backgroundColor: 'oklch(0.95 0.02 240)' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
