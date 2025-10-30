/**
 * Mission Analytics Dashboard Page
 * Story 2.6 Task 3.1
 *
 * Comprehensive mission performance analytics and insights
 */

'use client'

import { ArrowLeft, Award, Calendar, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { InsightsPanel } from '@/components/analytics/insights-panel'
import { MissionCompletionChart } from '@/components/analytics/mission-completion-chart'
import { MissionEffectivenessTable } from '@/components/analytics/mission-effectiveness-table'
import { PerformanceCorrelationPanel } from '@/components/analytics/performance-correlation-panel'
import { RecommendationsPanel } from '@/components/analytics/recommendations-panel'

interface MissionStats {
  completionRate: number
  streak: {
    current: number
    longest: number
  }
  successScore: number
  missions: {
    completed: number
    skipped: number
    total: number
  }
}

export default function MissionAnalyticsPage() {
  const [stats, setStats] = useState<MissionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchStats()
  }, [period])

  async function fetchStats() {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/missions/summary?period=${period}`, {
        headers: {
          'X-User-Email': 'kevy@americano.dev',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const result = await response.json()
      setStats(result.data)
    } catch (error) {
      console.error('Error fetching mission stats:', error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const getSuccessRating = (score: number): string => {
    if (score >= 0.8) return 'EXCELLENT'
    if (score >= 0.6) return 'GOOD'
    if (score >= 0.4) return 'FAIR'
    if (score >= 0.2) return 'NEEDS IMPROVEMENT'
    return 'POOR'
  }

  const getSuccessColor = (score: number): string => {
    if (score >= 0.8) return 'oklch(0.75 0.15 160)'
    if (score >= 0.6) return 'oklch(0.7 0.15 230)'
    if (score >= 0.4) return 'oklch(0.7 0.15 50)'
    return 'oklch(0.65 0.15 10)'
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[oklch(0.7_0.15_230)] hover:text-[oklch(0.65_0.15_230)] font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-heading font-bold tracking-tight text-foreground mb-2">
              Mission Analytics
            </h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Track your mission completion and performance insights
            </p>
          </div>
          {/* Period Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  period === p
                    ? 'bg-[oklch(0.7_0.15_230)] text-white shadow-sm'
                    : 'bg-white/80 backdrop-blur-md text-[oklch(0.556_0_0)] hover:bg-white hover:shadow-sm border border-white/30'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6 animate-pulse"
            >
              <div className="h-12 bg-[oklch(0.922_0_0)] rounded" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Completion Rate */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-2">
                <Target className="size-5 text-[oklch(0.7_0.15_230)]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[oklch(0.145_0_0)] mb-1">
              {(stats.completionRate * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-[oklch(0.556_0_0)]">Completion Rate</div>
            <div className="mt-2 text-xs text-[oklch(0.556_0_0)]">
              {stats.missions.completed} of {stats.missions.total} missions
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-full bg-[oklch(0.7_0.15_50)]/10 p-2">
                <Calendar className="size-5 text-[oklch(0.7_0.15_50)]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[oklch(0.145_0_0)] mb-1">
              {stats.streak.current}
            </div>
            <div className="text-sm text-[oklch(0.556_0_0)]">Current Streak</div>
            <div className="mt-2 text-xs text-[oklch(0.556_0_0)]">
              Longest: {stats.streak.longest} days
            </div>
          </div>

          {/* Success Score */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-full bg-[oklch(0.75_0.15_160)]/10 p-2">
                <Award className="size-5 text-[oklch(0.75_0.15_160)]" />
              </div>
            </div>
            <div
              className="text-3xl font-bold mb-1"
              style={{ color: getSuccessColor(stats.successScore) }}
            >
              {(stats.successScore * 100).toFixed(0)}
            </div>
            <div className="text-sm text-[oklch(0.556_0_0)]">Success Score</div>
            <div className="mt-2 text-xs text-[oklch(0.556_0_0)]">
              {getSuccessRating(stats.successScore)}
            </div>
          </div>

          {/* Performance Trend */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-2">
                <TrendingUp className="size-5 text-[oklch(0.7_0.15_230)]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[oklch(0.145_0_0)] mb-1">
              {stats.missions.completed}
            </div>
            <div className="text-sm text-[oklch(0.556_0_0)]">Missions Completed</div>
            <div className="mt-2 text-xs text-[oklch(0.556_0_0)]">
              {stats.missions.skipped} skipped
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6 mb-8">
          <p className="text-sm text-[oklch(0.556_0_0)] text-center">No mission data available</p>
        </div>
      )}

      {/* Insights Panel */}
      <div className="mb-8">
        <InsightsPanel />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Completion Trends */}
        <div>
          <MissionCompletionChart period={period} />
        </div>

        {/* Performance Correlation */}
        <div>
          <PerformanceCorrelationPanel />
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-8">
        <RecommendationsPanel />
      </div>

      {/* Effectiveness Table */}
      <div className="mb-8">
        <MissionEffectivenessTable />
      </div>

      {/* Additional Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/missions/history"
          className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all"
        >
          <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)] mb-2">
            Mission History
          </h3>
          <p className="text-sm text-[oklch(0.556_0_0)] mb-4">
            View all past missions and track your progress over time
          </p>
          <span className="text-sm text-[oklch(0.7_0.15_230)] font-medium">View History →</span>
        </Link>

        <Link
          href="/settings"
          className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all"
        >
          <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)] mb-2">
            Mission Settings
          </h3>
          <p className="text-sm text-[oklch(0.556_0_0)] mb-4">
            Customize mission preferences and adaptation settings
          </p>
          <span className="text-sm text-[oklch(0.7_0.15_230)] font-medium">Go to Settings →</span>
        </Link>
      </div>
    </div>
  )
}
