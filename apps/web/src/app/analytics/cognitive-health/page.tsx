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

// Loading skeleton components - Clean, flat cards
function LoadMeterSkeleton() {
  return (
    <div className="bg-white border shadow-sm rounded-lg p-4 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded mb-4" />
      <div className="w-full aspect-square max-w-[320px] mx-auto bg-muted rounded-full mb-4" />
      <div className="h-12 bg-muted rounded-lg mb-4" />
      <div className="h-10 bg-muted rounded mb-4" />
      <div className="h-4 bg-muted rounded" />
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="bg-white border shadow-sm rounded-lg p-4 animate-pulse">
      <div className="h-6 w-40 bg-muted rounded mb-4" />
      <div className="grid grid-cols-3 gap-4 mb-4">
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
    <div className="bg-white border shadow-sm rounded-lg p-4 animate-pulse">
      <div className="h-6 w-32 bg-muted rounded mb-4" />
      <div className="h-24 bg-muted rounded-lg mb-4" />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
      </div>
      <div className="space-y-3 mb-4">
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
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[oklch(0.95_0.12_350)]/50 shrink-0">
              <Brain className="size-8 text-[oklch(0.65_0.18_350)]" />
            </div>
            <div className="flex-1">
              <h1 className="text-[28px] md:text-[32px] font-heading font-bold tracking-tight text-foreground mb-2">
                Cognitive Health Dashboard
              </h1>
              <p className="text-[15px] text-muted-foreground max-w-2xl leading-relaxed">
                Monitor your cognitive load, identify stress patterns, and prevent burnout with
                data-driven insights. Your learning effectiveness depends on maintaining a healthy
                cognitive balance.
              </p>
            </div>
          </div>

          {/* Quick stats bar - Compact playful badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white shadow-sm border">
              <Activity className="size-5 text-success shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted-foreground">Current Session</div>
                <div className="text-[13px] font-semibold text-foreground truncate">
                  Real-time monitoring active
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-white shadow-sm border">
              <TrendingUp className="size-5 text-info shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted-foreground">Analysis Period</div>
                <div className="text-[13px] font-semibold text-foreground truncate">
                  Last 30 days tracked
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-white shadow-sm border">
              <Brain className="size-5 text-[oklch(0.65_0.18_350)] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted-foreground">Real-time Updates</div>
                <div className="text-[13px] font-semibold text-foreground truncate">
                  Refreshes every 30 seconds
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Adaptive responsive grid */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Load meter column */}
              <div className="lg:col-span-1">
                <LoadMeterSkeleton />
              </div>

              {/* Timeline and risk panel column */}
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <TimelineSkeleton />
                <RiskPanelSkeleton />
              </div>
            </div>
          }
        >
          <CognitiveHealthDashboard />
        </Suspense>
      </div>

      {/* Footer info - OKLCH colors only */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl pb-8">
        <div className="bg-info/10 border border-info/30 rounded-lg p-4">
          <h3 className="text-[13px] font-semibold text-info mb-2">
            About Cognitive Load Monitoring
          </h3>
          <p className="text-[13px] text-info/80 leading-relaxed">
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
