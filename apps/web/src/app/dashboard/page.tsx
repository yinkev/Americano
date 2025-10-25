/**
 * Dashboard Page
 * Epic 5 UI Transformation
 *
 * Displays mission analytics dashboard with:
 * - Mission statistics (streak, completion rate, success score)
 * - Completion trend charts
 * - Insights panel
 * - Recommendations panel
 *
 * Design System: Epic 5 (OKLCH colors, glassmorphism, motion.dev animations)
 */

'use client'

import { useState, useEffect } from 'react'
import { MissionCompletionChart } from '@/components/analytics/mission-completion-chart'
import { InsightsPanel } from '@/components/analytics/insights-panel'
import { RecommendationsPanel } from '@/components/analytics/recommendations-panel'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { MissionProgress } from '@/components/dashboard/mission-progress'
import { BadgesDisplay } from '@/components/dashboard/badges-display'
import { ProgressStats } from '@/components/dashboard/progress-stats'
import { Trophy, Target, Flame, TrendingUp, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { typography, glassmorphism } from '@/lib/design-tokens'

interface MissionSummary {
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
  insights: string[]
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<MissionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSummary()
  }, [])

  async function fetchSummary() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics/missions/summary?period=7d', {
        headers: {
          'X-User-Email': 'kevy@americano.dev',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch mission summary')
      }

      const result = await response.json()
      setSummary(result.data)
    } catch (err) {
      console.error('Error fetching mission summary:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <div className="border-b bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
            <div className="flex items-start gap-4">
              <Skeleton className="size-14 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-64 rounded-lg" />
                <Skeleton className="h-4 w-96 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card
                key={i}
                className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]"
              >
                <CardContent className="p-6">
                  <Skeleton className="h-20 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl mb-8" />
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-16">
          <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
            <CardContent className="p-8 text-center">
              <div
                className="size-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'oklch(0.6 0.20 30 / 0.1)' }}
              >
                <Activity className="size-8" style={{ color: 'oklch(0.6 0.20 30)' }} />
              </div>
              <p className="text-[15px] mb-4" style={{ color: 'oklch(0.6 0.20 30)' }}>
                {error || 'Failed to load dashboard'}
              </p>
              <button
                onClick={fetchSummary}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-150 hover:scale-102"
                style={{
                  backgroundColor: 'oklch(0.7 0.15 230)',
                  color: 'white',
                }}
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={`border-b ${glassmorphism.light}`}>
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
          <div className="flex items-start gap-4">
            <div
              className="p-3 rounded-xl shrink-0"
              style={{ backgroundColor: 'oklch(0.7 0.15 230 / 0.1)' }}
            >
              <Activity className="size-8" style={{ color: 'oklch(0.7 0.15 230)' }} />
            </div>
            <div className="flex-1">
              <h1 className={`${typography.heading.h1} text-foreground mb-2`}>
                Mission Analytics
              </h1>
              <p className={`${typography.body.base} text-muted-foreground max-w-2xl`}>
                Track your mission performance and get personalized insights to optimize your
                learning journey
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        {/* Your Progress */}
        <div className="mb-8">
          <h2 className={`${typography.heading.h2} text-foreground mb-4`}>Your Progress</h2>
          <ProgressStats
            streak={summary.streak.current}
            cardsReviewed={summary.missions.completed}
            accuracy={(summary.completionRate * 100).toFixed(1)}
            points={summary.successScore.toFixed(2) * 1000}
          />
          <BadgesDisplay />
        </div>

        {/* Today's Mission */}
        <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`${typography.heading.h2} text-foreground`}>Today's Mission</h2>
              <button className="primary-button">Regenerate mission</button>
            </div>
            <p className={`${typography.body.base} text-muted-foreground mb-4`}>Fri, Oct 24</p>
            <MissionProgress current={summary.missions.completed} total={summary.missions.total} />
            {summary.missions.completed === summary.missions.total && summary.missions.total > 0 ? (
              <div className="flex items-center justify-center py-4 rounded-lg"
                   style={{ backgroundColor: 'oklch(from var(--color-success) l c h / 0.1)' }}>
                <p className={`${typography.body.base} text-success font-semibold`}>🎉 Mission complete!</p>
              </div>
            ) : (
              <p className={`${typography.body.base} text-muted-foreground text-center py-4`}>
                {summary.missions.total - summary.missions.completed} objectives remaining
              </p>
            )}
          </CardContent>
        </Card>

        {/* Completion Trends Chart */}
        <div className="mb-8">
          <MissionCompletionChart period="30d" chartType="line" />
        </div>

        {/* Two Column Layout: Insights + Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <InsightsPanel />
          <RecommendationsPanel />
        </div>
      </div>
    </div>
  )
}
