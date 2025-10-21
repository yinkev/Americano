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
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Loading skeleton components - Epic 5 design with glassmorphism
function LoadMeterSkeleton() {
  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader className="p-4 pb-0">
        <Skeleton className="h-6 w-32 rounded-lg" />
      </CardHeader>
      <CardContent className="p-4 pt-4">
        <Skeleton className="w-full aspect-square max-w-[320px] mx-auto rounded-full mb-4" />
        <Skeleton className="h-12 rounded-lg mb-4" />
        <Skeleton className="h-10 rounded-lg mb-4" />
        <Skeleton className="h-4 rounded-lg" />
      </CardContent>
    </Card>
  )
}

function TimelineSkeleton() {
  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader className="p-4 pb-0">
        <Skeleton className="h-6 w-40 rounded-lg" />
      </CardHeader>
      <CardContent className="p-4 pt-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </CardContent>
    </Card>
  )
}

function RiskPanelSkeleton() {
  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader className="p-4 pb-0">
        <Skeleton className="h-6 w-32 rounded-lg" />
      </CardHeader>
      <CardContent className="p-4 pt-4">
        <Skeleton className="h-24 rounded-xl mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <div className="space-y-3 mb-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function CognitiveHealthPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
          <div className="flex items-start gap-4">
            <div
              className="p-3 rounded-xl shrink-0"
              style={{ backgroundColor: 'oklch(0.95 0.12 350 / 0.5)' }}
            >
              <Brain className="size-8" style={{ color: 'oklch(0.65 0.18 350)' }} />
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

          {/* Quick stats bar - Epic 5 design with glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/80 backdrop-blur-md shadow-sm border border-white/30">
              <Activity className="size-5 shrink-0" style={{ color: 'oklch(0.7 0.15 145)' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted-foreground font-medium">Current Session</div>
                <div className="text-[13px] font-semibold text-foreground truncate">
                  Real-time monitoring active
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/80 backdrop-blur-md shadow-sm border border-white/30">
              <TrendingUp className="size-5 shrink-0" style={{ color: 'oklch(0.65 0.18 240)' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted-foreground font-medium">Analysis Period</div>
                <div className="text-[13px] font-semibold text-foreground truncate">
                  Last 30 days tracked
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/80 backdrop-blur-md shadow-sm border border-white/30">
              <Brain className="size-5 shrink-0" style={{ color: 'oklch(0.65 0.18 350)' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted-foreground font-medium">Real-time Updates</div>
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

      {/* Footer info - Epic 5 design with OKLCH colors */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl pb-8">
        <div
          className="rounded-xl p-6 border"
          style={{
            backgroundColor: 'oklch(0.65 0.18 240 / 0.08)',
            borderColor: 'oklch(0.65 0.18 240 / 0.2)',
          }}
        >
          <h3
            className="text-[13px] font-semibold mb-2"
            style={{ color: 'oklch(0.65 0.18 240)' }}
          >
            About Cognitive Load Monitoring
          </h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
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
