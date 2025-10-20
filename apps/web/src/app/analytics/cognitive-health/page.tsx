/**
 * Cognitive Health Dashboard Page
 * Story 5.4 Task 7.1
 *
 * Main dashboard displaying:
 * - CognitiveLoadMeter: Current load gauge with color zones
 * - StressPatternsTimeline: Historical load trends (7-day/30-day)
 * - BurnoutRiskPanel: Risk assessment with recommendations
 *
 * Design: Next.js 15 Server Component with client-side data fetching
 * Real-time updates: Load meter refreshes every 5 minutes during active session
 */

import { Suspense } from 'react'
import { Brain, TrendingUp, Activity } from 'lucide-react'
import { CognitiveHealthDashboard } from './cognitive-health-dashboard'

// Loading skeleton components
function LoadMeterSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl p-6 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded mb-6" />
      <div className="w-full aspect-square max-w-[280px] mx-auto bg-muted rounded-full mb-6" />
      <div className="h-12 bg-muted rounded-lg mb-4" />
      <div className="h-10 bg-muted rounded mb-4" />
      <div className="h-4 bg-muted rounded" />
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl p-6 animate-pulse">
      <div className="h-6 w-40 bg-muted rounded mb-6" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="h-16 bg-muted rounded-lg" />
        <div className="h-16 bg-muted rounded-lg" />
        <div className="h-16 bg-muted rounded-lg" />
      </div>
      <div className="h-[300px] bg-muted rounded-lg" />
    </div>
  )
}

function RiskPanelSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl p-6 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded mb-6" />
      <div className="h-24 bg-muted rounded-xl mb-6" />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-16 bg-muted rounded-lg" />
        <div className="h-16 bg-muted rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="h-12 bg-muted rounded-lg" />
        <div className="h-12 bg-muted rounded-lg" />
      </div>
    </div>
  )
}

export default function CognitiveHealthPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Brain className="size-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
                Cognitive Health Dashboard
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Monitor your cognitive load, identify stress patterns, and prevent burnout with
                data-driven insights. Your learning effectiveness depends on maintaining a healthy
                cognitive balance.
              </p>
            </div>
          </div>

          {/* Quick stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/30">
              <Activity className="size-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Current Session</div>
                <div className="text-sm font-semibold text-foreground truncate">
                  Real-time monitoring active
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/30">
              <TrendingUp className="size-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Analysis Period</div>
                <div className="text-sm font-semibold text-foreground truncate">
                  Last 30 days tracked
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/30">
              <Brain className="size-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Next Update</div>
                <div className="text-sm font-semibold text-foreground truncate">
                  Refreshes every 5 minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Load meter column */}
              <div className="lg:col-span-1">
                <LoadMeterSkeleton />
              </div>

              {/* Timeline and risk panel column */}
              <div className="lg:col-span-2 space-y-6">
                <TimelineSkeleton />
                <RiskPanelSkeleton />
              </div>
            </div>
          }
        >
          <CognitiveHealthDashboard />
        </Suspense>
      </div>

      {/* Footer info */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            About Cognitive Load Monitoring
          </h3>
          <p className="text-xs text-blue-700">
            This dashboard uses behavioral analytics to estimate your cognitive load in real-time.
            Cognitive load monitoring helps prevent burnout and optimizes your learning
            effectiveness by adapting content difficulty and recommending breaks when needed. You
            can disable this feature in Settings at any time.
          </p>
        </div>
      </div>
    </main>
  )
}

export const metadata = {
  title: 'Cognitive Health Dashboard | Americano',
  description:
    'Monitor your cognitive load, stress patterns, and burnout risk with real-time analytics',
}
