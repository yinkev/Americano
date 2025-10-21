'use client'

import { useState } from 'react'
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts'

// Types
interface CompetencyScores {
  dataGathering: number
  diagnosis: number
  management: number
  clinicalReasoning: number
}

interface ClinicalScenario {
  id: string
  title?: string
  difficulty?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
}

interface EvaluationResult {
  overallScore: number
  competencyScores: CompetencyScores
  strengths: string[]
  weaknesses: string[]
  missedFindings: string[]
  cognitiveBiases: string[]
  optimalPathway: string
  teachingPoints: string[]
}

interface ClinicalFeedbackPanelProps {
  evaluation: EvaluationResult
  scenario: ClinicalScenario
  onReview: () => void
  onNext: () => void
}

// Helper function to get score threshold color
function getScoreColor(score: number): string {
  if (score >= 80) return 'oklch(0.7 0.15 145)' // Green - Proficient
  if (score >= 60) return 'oklch(0.75 0.12 85)' // Yellow - Developing
  return 'oklch(0.65 0.20 25)' // Red - Needs Improvement
}

// Helper function to get score label
function getScoreLabel(score: number): string {
  if (score >= 80) return 'Proficient'
  if (score >= 60) return 'Developing'
  return 'Needs Improvement'
}

export function ClinicalFeedbackPanel({
  evaluation,
  scenario,
  onReview,
  onNext,
}: ClinicalFeedbackPanelProps) {
  const [isReviewing] = useState(false)

  // Prepare radar chart data
  const competencyData = [
    {
      competency: 'Data Gathering',
      score: evaluation.competencyScores.dataGathering,
      fullMark: 100
    },
    {
      competency: 'Diagnosis',
      score: evaluation.competencyScores.diagnosis,
      fullMark: 100
    },
    {
      competency: 'Management',
      score: evaluation.competencyScores.management,
      fullMark: 100
    },
    {
      competency: 'Clinical Reasoning',
      score: evaluation.competencyScores.clinicalReasoning,
      fullMark: 100
    },
  ]

  const scoreColor = getScoreColor(evaluation.overallScore)
  const scoreLabel = getScoreLabel(evaluation.overallScore)

  // Calculate circle parameters for progress ring
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const progress = (evaluation.overallScore / 100) * circumference
  const dashOffset = circumference - progress

  return (
    <div className="space-y-6 py-6">
      {/* Overall Score with Progress Ring */}
      <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-8">
        <h2 className="text-2xl font-heading font-semibold text-[oklch(0.145_0_0)] mb-6">
          Clinical Reasoning Assessment
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Progress Ring */}
          <div className="flex-shrink-0 relative" aria-label={`Overall score: ${evaluation.overallScore} out of 100`}>
            <svg width="160" height="160" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="oklch(0.97 0 0)"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={scoreColor}
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            {/* Centered score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-heading font-bold text-[oklch(0.145_0_0)]">
                {evaluation.overallScore}
              </span>
              <span className="text-sm text-[oklch(0.556_0_0)] mt-1">out of 100</span>
            </div>
          </div>

          {/* Score Details */}
          <div className="flex-1 space-y-4">
            <div>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ backgroundColor: `${scoreColor}/10` }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: scoreColor }}
                >
                  {scoreLabel}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[oklch(0.556_0_0)]">Data Gathering</span>
                <span className="font-semibold text-[oklch(0.145_0_0)]">
                  {evaluation.competencyScores.dataGathering}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[oklch(0.556_0_0)]">Diagnosis</span>
                <span className="font-semibold text-[oklch(0.145_0_0)]">
                  {evaluation.competencyScores.diagnosis}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[oklch(0.556_0_0)]">Management</span>
                <span className="font-semibold text-[oklch(0.145_0_0)]">
                  {evaluation.competencyScores.management}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[oklch(0.556_0_0)]">Clinical Reasoning</span>
                <span className="font-semibold text-[oklch(0.145_0_0)]">
                  {evaluation.competencyScores.clinicalReasoning}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competency Radar Chart */}
      <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-8">
        <h3 className="text-xl font-heading font-semibold text-[oklch(0.145_0_0)] mb-6">
          Competency Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={competencyData}>
            <PolarGrid stroke="oklch(0.8 0.02 230)" />
            <PolarAngleAxis
              dataKey="competency"
              tick={{ fill: 'oklch(0.556 0 0)', fontSize: 14 }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
            />
            <Radar
              dataKey="score"
              stroke="oklch(0.65 0.18 200)"
              fill="oklch(0.65 0.18 200 / 0.3)"
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Strengths Section */}
      {evaluation.strengths.length > 0 && (
        <div
          className="rounded-2xl backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6"
          style={{ backgroundColor: 'oklch(0.95 0.05 145)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="size-5" style={{ color: 'oklch(0.7 0.15 145)' }} />
            <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
              Strengths
            </h3>
          </div>
          <ul className="space-y-2">
            {evaluation.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-[oklch(0.145_0_0)]">
                <span className="text-[oklch(0.7_0.15_145)] mt-1">•</span>
                <span className="flex-1">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses Section */}
      {evaluation.weaknesses.length > 0 && (
        <div
          className="rounded-2xl backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6"
          style={{ backgroundColor: 'oklch(0.95 0.05 85)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="size-5" style={{ color: 'oklch(0.75 0.12 85)' }} />
            <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
              Areas for Improvement
            </h3>
          </div>
          <ul className="space-y-2">
            {evaluation.weaknesses.map((weakness, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-[oklch(0.145_0_0)]">
                <span className="text-[oklch(0.75_0.12_85)] mt-1">•</span>
                <span className="flex-1">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missed Findings (if any) */}
      {evaluation.missedFindings.length > 0 && (
        <div
          className="rounded-2xl backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6"
          style={{ backgroundColor: 'oklch(0.95 0.05 25)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="size-5" style={{ color: 'oklch(0.65 0.20 25)' }} />
            <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
              Missed Findings
            </h3>
          </div>
          <ul className="space-y-2">
            {evaluation.missedFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-[oklch(0.145_0_0)]">
                <span className="text-[oklch(0.65_0.20_25)] mt-1">•</span>
                <span className="flex-1">{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cognitive Biases (if detected) */}
      {evaluation.cognitiveBiases.length > 0 && (
        <div
          className="rounded-2xl backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6"
          style={{ backgroundColor: 'oklch(0.95 0.05 25)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="size-5" style={{ color: 'oklch(0.65 0.20 25)' }} />
            <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
              Cognitive Biases Detected
            </h3>
          </div>
          <div className="space-y-3">
            {evaluation.cognitiveBiases.map((bias, idx) => (
              <div key={idx} className="text-sm text-[oklch(0.145_0_0)]">
                <p className="font-semibold mb-1">{bias}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimal Pathway */}
      {evaluation.optimalPathway && (
        <div
          className="rounded-2xl backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6"
          style={{ backgroundColor: 'oklch(0.95 0.05 230)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="size-5" style={{ color: 'oklch(0.7 0.15 230)' }} />
            <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
              Optimal Diagnostic Pathway
            </h3>
          </div>
          <div className="text-sm text-[oklch(0.145_0_0)] space-y-2">
            {evaluation.optimalPathway.split('\n').map((paragraph, idx) => (
              paragraph.trim() && <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* Teaching Points */}
      {evaluation.teachingPoints.length > 0 && (
        <div
          className="rounded-2xl backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6"
          style={{ backgroundColor: 'oklch(0.95 0.05 280)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="size-5" style={{ color: 'oklch(0.68 0.16 280)' }} />
            <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
              Teaching Points
            </h3>
          </div>
          <ol className="space-y-3">
            {evaluation.teachingPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-[oklch(0.145_0_0)]">
                <span
                  className="flex-shrink-0 font-semibold"
                  style={{ color: 'oklch(0.68 0.16 280)' }}
                >
                  {idx + 1}.
                </span>
                <span className="flex-1">{point}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={onReview}
          disabled={isReviewing}
          className="flex-1 min-h-[44px] rounded-lg bg-white/80 backdrop-blur-md border border-white/30 px-6 py-3
                     text-[oklch(0.145_0_0)] font-semibold text-sm
                     hover:bg-white/95 transition-colors duration-200
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          type="button"
        >
          <RefreshCw className="size-4" />
          Review Case
        </button>
        <button
          onClick={onNext}
          className="flex-1 min-h-[44px] rounded-lg bg-[oklch(0.7_0.15_230)] px-6 py-3
                     text-white font-semibold text-sm
                     hover:bg-[oklch(0.65_0.15_230)] transition-colors duration-200
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
                     flex items-center justify-center gap-2"
          type="button"
        >
          Continue Session
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
