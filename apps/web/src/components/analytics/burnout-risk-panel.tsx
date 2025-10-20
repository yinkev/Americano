/**
 * BurnoutRiskPanel Component
 * Story 5.4 Task 7.4
 *
 * Displays burnout risk assessment with:
 * - Risk level indicator (LOW/MEDIUM/HIGH/CRITICAL)
 * - Contributing factors breakdown with percentages
 * - Actionable recommendations based on risk level
 * - Days since last rest counter
 * - Recovery progress tracking
 *
 * Design: Glassmorphism, OKLCH colors, supportive messaging
 */

'use client'

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Calendar,
  TrendingDown,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

export type BurnoutRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface BurnoutContributingFactor {
  factor: string
  percentage: number
  description: string
}

interface BurnoutRiskPanelProps {
  riskLevel: BurnoutRiskLevel
  riskScore: number // 0-100
  contributingFactors: BurnoutContributingFactor[]
  recommendations: string[]
  daysSinceLastRest: number
  recoveryProgress?: number // 0-100, optional if user is in recovery
  lastAssessmentDate: Date
  className?: string
}

// Risk level configurations
const RISK_CONFIGS = {
  LOW: {
    color: 'oklch(0.7 0.15 145)', // Green
    icon: CheckCircle,
    label: 'Low Risk',
    message: 'Your cognitive health is strong. Keep up the balanced approach!',
  },
  MEDIUM: {
    color: 'oklch(0.8 0.15 90)', // Yellow
    icon: AlertTriangle,
    label: 'Medium Risk',
    message: 'Some signs of stress detected. Consider adjusting your study schedule.',
  },
  HIGH: {
    color: 'oklch(0.7 0.15 50)', // Orange
    icon: AlertCircle,
    label: 'High Risk',
    message: 'You need a break soon. Prioritize rest to maintain effective learning.',
  },
  CRITICAL: {
    color: 'oklch(0.6 0.20 30)', // Red
    icon: ShieldAlert,
    label: 'Critical Risk',
    message: 'Take immediate action! Your learning effectiveness is compromised.',
  },
} as const

export function BurnoutRiskPanel({
  riskLevel,
  riskScore,
  contributingFactors,
  recommendations,
  daysSinceLastRest,
  recoveryProgress,
  lastAssessmentDate,
  className = '',
}: BurnoutRiskPanelProps) {
  const config = RISK_CONFIGS[riskLevel]
  const RiskIcon = config.icon

  // Sort factors by percentage (highest first)
  const sortedFactors = [...contributingFactors].sort((a, b) => b.percentage - a.percentage)

  return (
    <div
      className={`bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-foreground text-lg">Burnout Risk</h3>
        <div className="text-xs text-muted-foreground">
          Updated {format(lastAssessmentDate, 'MMM d, h:mm a')}
        </div>
      </div>

      {/* Risk level indicator */}
      <div
        className="flex items-center gap-4 p-4 rounded-xl mb-6"
        style={{
          backgroundColor: `color-mix(in oklch, ${config.color}, transparent 90%)`,
          borderLeft: `6px solid ${config.color}`,
        }}
      >
        <div
          className="p-3 rounded-full shrink-0"
          style={{ backgroundColor: `color-mix(in oklch, ${config.color}, transparent 80%)` }}
        >
          <RiskIcon className="size-7" style={{ color: config.color }} />
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-3 mb-1">
            <h4 className="text-2xl font-bold font-heading" style={{ color: config.color }}>
              {config.label}
            </h4>
            <span className="text-lg font-semibold text-muted-foreground">
              {Math.round(riskScore)}/100
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{config.message}</p>
        </div>
      </div>

      {/* Days since last rest */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg ${
            daysSinceLastRest > 7 ? 'bg-red-50 border border-red-200' : 'bg-muted/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar
              className={`size-4 ${daysSinceLastRest > 7 ? 'text-red-600' : 'text-muted-foreground'}`}
            />
            <span className="text-xs font-medium text-muted-foreground">Days Since Rest</span>
          </div>
          <div
            className={`text-2xl font-bold font-heading ${
              daysSinceLastRest > 7 ? 'text-red-600' : 'text-foreground'
            }`}
          >
            {daysSinceLastRest}
          </div>
          {daysSinceLastRest > 7 && <p className="text-xs text-red-600 mt-1">Rest day overdue</p>}
        </div>

        {/* Recovery progress (if in recovery) */}
        {recoveryProgress !== undefined && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="size-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">Recovery Progress</span>
            </div>
            <div className="text-2xl font-bold font-heading text-green-600">
              {Math.round(recoveryProgress)}%
            </div>
            <p className="text-xs text-green-600 mt-1">On track</p>
          </div>
        )}
      </div>

      {/* Contributing factors */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-foreground mb-3">Contributing Factors</h4>
        <div className="space-y-3">
          {sortedFactors.map((factor, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{factor.factor}</span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {Math.round(factor.percentage)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${factor.percentage}%`,
                    backgroundColor: config.color,
                  }}
                />
              </div>

              <p className="text-xs text-muted-foreground">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Recommendations</h4>
        <div className="space-y-2">
          {recommendations.map((recommendation, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <div
                className="shrink-0 size-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{
                  backgroundColor: `color-mix(in oklch, ${config.color}, transparent 80%)`,
                  color: config.color,
                }}
              >
                {index + 1}
              </div>
              <p className="text-sm text-foreground flex-1">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons (optional - future enhancement) */}
      {riskLevel === 'HIGH' || riskLevel === 'CRITICAL' ? (
        <div className="mt-6 pt-6 border-t border-muted">
          <button
            className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: config.color }}
          >
            Schedule Rest Day
          </button>
        </div>
      ) : null}

      {/* ARIA live region for screen readers */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Burnout risk is {config.label} with a score of {Math.round(riskScore)} out of 100.
        {daysSinceLastRest > 7 && `It has been ${daysSinceLastRest} days since your last rest day.`}
        {recommendations.length > 0 && `${recommendations.length} recommendations available.`}
      </div>
    </div>
  )
}
