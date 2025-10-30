'use client'

import { TrendingUp } from 'lucide-react'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ProgressChartProps {
  examReadiness: number // 0-1 scale
}

/**
 * Progress Chart Component
 *
 * Displays exam readiness progress with visual indicators
 */
export function ProgressChart({ examReadiness }: ProgressChartProps) {
  const percentage = Math.round(examReadiness * 100)

  // Determine readiness level
  const getReadinessLevel = () => {
    if (percentage >= 90) return { label: 'Excellent', color: 'oklch(0.75 0.20 145)' }
    if (percentage >= 75) return { label: 'Very Good', color: 'oklch(0.75 0.20 145)' }
    if (percentage >= 60) return { label: 'Good', color: 'oklch(0.80 0.18 90)' }
    if (percentage >= 40) return { label: 'Fair', color: 'oklch(0.80 0.18 90)' }
    return { label: 'Needs Work', color: 'oklch(0.70 0.22 40)' }
  }

  const readiness = getReadinessLevel()

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Exam Readiness
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main progress indicator */}
        <div className="text-center space-y-4">
          <div className="relative inline-flex items-center justify-center">
            {/* Circular progress */}
            <svg className="w-32 h-32 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="oklch(0.922 0 0)"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={readiness.color}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - examReadiness)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: readiness.color }}>
                {percentage}%
              </span>
              <span className="text-xs text-muted-foreground mt-1">Ready</span>
            </div>
          </div>

          <div>
            <p className="text-lg font-semibold" style={{ color: readiness.color }}>
              {readiness.label}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {percentage >= 75
                ? "You're on track for a great score!"
                : 'Keep studying to improve your readiness'}
            </p>
          </div>
        </div>

        {/* Breakdown by domain (mock data) */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Domain Breakdown</p>
          {[
            { name: 'Cardiology', progress: 0.85 },
            { name: 'Neurology', progress: 0.72 },
            { name: 'Immunology', progress: 0.68 },
            { name: 'Pharmacology', progress: 0.55 },
          ].map((domain) => (
            <div key={domain.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{domain.name}</span>
                <span className="font-medium text-primary">
                  {Math.round(domain.progress * 100)}%
                </span>
              </div>
              <Progress value={domain.progress * 100} className="h-1.5" />
            </div>
          ))}
        </div>

        {/* Study time remaining estimate */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated study time to 90%</span>
            <span className="font-semibold text-foreground">
              {Math.max(0, Math.round((90 - percentage) * 2))} hours
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
