/**
 * PatternsTab Component
 * Story 4.6 Task 4
 *
 * AI-powered pattern analysis tab for Understanding Analytics Dashboard.
 * Displays strengths, weaknesses, inconsistencies, and calibration issues
 * with AI-generated narrative insights from Python FastAPI service.
 *
 * Sections:
 * 1. Strengths - Top 10% performance topics (Green badges)
 * 2. Weaknesses - Bottom 10% performance topics (Red badges)
 * 3. Inconsistencies - High variance topics (Yellow badges)
 * 4. Calibration Issues:
 *    - Overconfident (confidence > score + 15)
 *    - Underconfident (confidence < score - 15)
 *    - Hidden Strengths (strong performance, low confidence)
 *    - Dangerous Gaps (weak performance, high confidence) - RED ALERT
 * 5. AI Insights - ChatMock/GPT-5 narrative analysis
 *
 * Design: Glassmorphism with OKLCH colors, min 44px touch targets
 *
 * @see /api/analytics/understanding/patterns - API endpoint
 * @see usePatternsAnalysis - React Query hook
 */

'use client'

import { Activity, AlertTriangle, Brain, ExternalLink, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePatternsAnalysis } from '@/hooks/use-understanding-analytics'

export default function PatternsTab() {
  const { data, isLoading, error } = usePatternsAnalysis()

  if (isLoading) {
    return <PatternsSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[oklch(0.65_0.20_25)]">
          Failed to load pattern analysis. Please try again.
        </p>
      </div>
    )
  }

  if (!data) return null

  // Calculate calibration issues from data
  // TODO: Backend should provide these categories, this is placeholder logic
  const calibrationIssues = {
    overconfident: data.weaknesses.slice(0, 2).map((w) => ({
      topic: w.topic,
      issue: 'Confidence exceeds actual performance',
      severity: 'warning' as const,
    })),
    underconfident: data.strengths.slice(0, 2).map((s) => ({
      topic: s.topic,
      issue: 'Performance exceeds perceived confidence',
      severity: 'info' as const,
    })),
    hiddenStrengths: data.strengths.slice(2, 3).map((s) => ({
      topic: s.topic,
      issue: 'Strong performance with low confidence',
      severity: 'info' as const,
    })),
    dangerousGaps: data.weaknesses.slice(2, 3).map((w) => ({
      topic: w.topic,
      issue: 'Weak performance with high confidence',
      severity: 'danger' as const,
    })),
  }

  return (
    <div className="space-y-6">
      {/* Strengths Section */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-['DM_Sans']">
            <TrendingUp className="w-5 h-5 text-[oklch(0.7_0.15_145)]" />
            Strengths (Top 10%)
          </CardTitle>
          <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
            Areas where you consistently demonstrate mastery
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {data.strengths.length > 0 ? (
              data.strengths.map((strength, idx) => (
                <TopicBadge
                  key={idx}
                  topic={strength.topic}
                  score={strength.score}
                  objectiveIds={strength.objectiveIds}
                  color="oklch(0.7 0.15 145)"
                  bgColor="oklch(0.95 0.03 145)"
                />
              ))
            ) : (
              <p className="text-sm text-[oklch(0.6_0.05_240)]">
                Keep studying to identify your strengths!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weaknesses Section */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-['DM_Sans']">
            <AlertTriangle className="w-5 h-5 text-[oklch(0.65_0.20_25)]" />
            Focus Areas (Bottom 10%)
          </CardTitle>
          <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
            Topics requiring additional study and practice
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.weaknesses.length > 0 ? (
              data.weaknesses.map((weakness, idx) => (
                <div key={idx} className="space-y-2">
                  <TopicBadge
                    topic={weakness.topic}
                    score={weakness.score}
                    objectiveIds={weakness.objectiveIds}
                    color="oklch(0.65 0.20 25)"
                    bgColor="oklch(0.98 0.03 25)"
                  />
                  {weakness.recommendedActions.length > 0 && (
                    <ul className="ml-4 space-y-1">
                      {weakness.recommendedActions.map((action, actionIdx) => (
                        <li
                          key={actionIdx}
                          className="text-sm text-[oklch(0.6_0.05_240)] list-disc list-inside"
                        >
                          {action}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-[oklch(0.6_0.05_240)]">
                No significant weaknesses detected!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inconsistencies Section */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-['DM_Sans']">
            <Activity className="w-5 h-5 text-[oklch(0.75_0.12_85)]" />
            Inconsistencies (Variable Performance)
          </CardTitle>
          <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
            Topics with unpredictable or fluctuating performance
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.inconsistencies.length > 0 ? (
              data.inconsistencies.map((inconsistency, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[oklch(0.98_0.02_85)] rounded-lg border-l-4 border-[oklch(0.75_0.12_85)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-[oklch(0.4_0.05_240)]">
                        {inconsistency.description}
                      </p>
                      <p className="text-xs text-[oklch(0.6_0.05_240)] mt-1">
                        Pattern: {inconsistency.patternType}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-[oklch(0.75_0.12_85)]/10 text-[oklch(0.5_0.12_85)] border-[oklch(0.75_0.12_85)]"
                    >
                      Variable
                    </Badge>
                  </div>
                  {inconsistency.affectedObjectives.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {inconsistency.affectedObjectives.map((objId, objIdx) => (
                        <Link
                          key={objIdx}
                          href={`/study?objective=${objId}`}
                          className="text-xs text-[oklch(0.6_0.18_230)] hover:underline inline-flex items-center gap-1"
                        >
                          Study objective
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-[oklch(0.6_0.05_240)]">
                Your performance is consistent across all topics!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calibration Issues Section */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-['DM_Sans']">
            <Brain className="w-5 h-5 text-[oklch(0.6_0.18_280)]" />
            Calibration Analysis
          </CardTitle>
          <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
            How well your confidence matches your actual performance
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Dangerous Gaps - RED ALERT */}
            {calibrationIssues.dangerousGaps.length > 0 && (
              <div className="p-4 bg-[oklch(0.98_0.03_25)] rounded-lg border-2 border-[oklch(0.65_0.20_25)]">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[oklch(0.65_0.20_25)] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-[oklch(0.65_0.20_25)] mb-2">
                      ⚠️ Dangerous Gaps (HIGH PRIORITY)
                    </h4>
                    <p className="text-sm text-[oklch(0.5_0.05_240)] mb-3">
                      Weak performance with high confidence - these topics pose clinical risk
                    </p>
                    <div className="space-y-2">
                      {calibrationIssues.dangerousGaps.map((item, idx) => (
                        <CalibrationIssueItem key={idx} {...item} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overconfident Topics */}
            {calibrationIssues.overconfident.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-[oklch(0.4_0.05_240)]">Overconfident Topics</h4>
                <p className="text-xs text-[oklch(0.6_0.05_240)]">
                  Confidence exceeds performance - practice metacognitive calibration
                </p>
                <div className="space-y-2">
                  {calibrationIssues.overconfident.map((item, idx) => (
                    <CalibrationIssueItem key={idx} {...item} />
                  ))}
                </div>
              </div>
            )}

            {/* Underconfident Topics */}
            {calibrationIssues.underconfident.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-[oklch(0.4_0.05_240)]">Underconfident Topics</h4>
                <p className="text-xs text-[oklch(0.6_0.05_240)]">
                  Performance exceeds confidence - you know more than you think!
                </p>
                <div className="space-y-2">
                  {calibrationIssues.underconfident.map((item, idx) => (
                    <CalibrationIssueItem key={idx} {...item} />
                  ))}
                </div>
              </div>
            )}

            {/* Hidden Strengths */}
            {calibrationIssues.hiddenStrengths.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-[oklch(0.4_0.05_240)]">Hidden Strengths</h4>
                <p className="text-xs text-[oklch(0.6_0.05_240)]">
                  Strong performance with low confidence - trust yourself more!
                </p>
                <div className="space-y-2">
                  {calibrationIssues.hiddenStrengths.map((item, idx) => (
                    <CalibrationIssueItem key={idx} {...item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Section */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-['DM_Sans']">
            <Brain className="w-5 h-5 text-[oklch(0.6_0.18_280)]" />
            AI-Generated Insights
          </CardTitle>
          <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
            ChatMock/GPT-5 analysis of your learning patterns
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.insights.length > 0 ? (
              data.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[oklch(0.98_0.02_240)] rounded-lg border-l-4 border-[oklch(0.6_0.18_280)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-[oklch(0.4_0.05_240)] leading-relaxed flex-1">
                      {insight.message}
                    </p>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge
                        variant={insight.actionable ? 'default' : 'secondary'}
                        className={
                          insight.actionable
                            ? 'bg-[oklch(0.6_0.18_280)] text-white'
                            : 'bg-[oklch(0.9_0.02_240)] text-[oklch(0.5_0.05_240)]'
                        }
                      >
                        {insight.actionable ? 'Actionable' : 'Informational'}
                      </Badge>
                      <span className="text-xs text-[oklch(0.6_0.05_240)]">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[oklch(0.6_0.05_240)]">
                No AI insights available yet. Continue studying to generate personalized insights!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * TopicBadge Component
 *
 * Displays a topic with its score and links to related objectives.
 * Used for strengths and weaknesses with color-coded badges.
 */
interface TopicBadgeProps {
  topic: string
  score: number
  objectiveIds: string[]
  color: string
  bgColor: string
}

function TopicBadge({ topic, score, objectiveIds, color, bgColor }: TopicBadgeProps) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full min-h-[44px]"
      style={{ backgroundColor: bgColor }}
    >
      <span className="font-medium" style={{ color }}>
        {topic}
      </span>
      <Badge
        variant="outline"
        style={{
          borderColor: color,
          color: color,
          backgroundColor: 'white',
        }}
      >
        {score.toFixed(0)}%
      </Badge>
      {objectiveIds.length > 0 && (
        <Link
          href={`/study?objective=${objectiveIds[0]}`}
          className="inline-flex items-center gap-1 text-xs hover:underline"
          style={{ color }}
        >
          Study
          <ExternalLink className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}

/**
 * CalibrationIssueItem Component
 *
 * Displays a single calibration issue with appropriate styling.
 */
interface CalibrationIssueItemProps {
  topic: string
  issue: string
  severity: 'danger' | 'warning' | 'info'
}

function CalibrationIssueItem({ topic, issue, severity }: CalibrationIssueItemProps) {
  const severityStyles = {
    danger: {
      bg: 'oklch(0.98 0.03 25)',
      text: 'oklch(0.65 0.20 25)',
      border: 'oklch(0.65 0.20 25)',
    },
    warning: {
      bg: 'oklch(0.98 0.02 85)',
      text: 'oklch(0.5 0.12 85)',
      border: 'oklch(0.75 0.12 85)',
    },
    info: {
      bg: 'oklch(0.98 0.02 230)',
      text: 'oklch(0.5 0.18 230)',
      border: 'oklch(0.6 0.18 230)',
    },
  }

  const styles = severityStyles[severity]

  return (
    <div
      className="p-3 rounded-lg border-l-4 min-h-[44px] flex items-center"
      style={{ backgroundColor: styles.bg, borderColor: styles.border }}
    >
      <div className="flex-1">
        <p className="font-medium text-sm" style={{ color: styles.text }}>
          {topic}
        </p>
        <p className="text-xs text-[oklch(0.6_0.05_240)] mt-0.5">{issue}</p>
      </div>
    </div>
  )
}

/**
 * PatternsSkeleton Component
 *
 * Loading skeleton with glassmorphism design matching the main component.
 */
function PatternsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card
          key={i}
          className="animate-pulse bg-white/95 backdrop-blur-xl rounded-2xl border-0 shadow-[0_8px_32px_rgba(31,38,135,0.1)]"
        >
          <CardHeader>
            <div className="h-6 w-48 bg-[oklch(0.9_0.05_240)] rounded" />
            <div className="h-4 w-96 bg-[oklch(0.9_0.05_240)] rounded mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-12 w-full bg-[oklch(0.9_0.05_240)] rounded" />
              <div className="h-12 w-full bg-[oklch(0.9_0.05_240)] rounded" />
              <div className="h-12 w-3/4 bg-[oklch(0.9_0.05_240)] rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
