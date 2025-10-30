/**
 * Struggle Predictions Loading State
 * Wave 2: Progressive Loading
 *
 * Route-level loading state using Next.js 15 loading.tsx convention
 * Shows immediately upon navigation while page data loads
 */

import { AlertTriangle, Calendar, MessageSquare, Target, TrendingUp } from 'lucide-react'
import { AnalyticsCardSkeleton, ChartSkeleton, TimelineSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-[oklch(0.6_0.15_25)]/10">
            <AlertTriangle className="size-6 text-[oklch(0.6_0.15_25)]" />
          </div>
          <div className="h-9 w-96 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
        </div>
        <div className="h-5 w-[28rem] bg-[oklch(0.92_0.02_230)] rounded animate-pulse" />
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content - Left 2 columns */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Active Predictions */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="size-5 text-[oklch(0.6_0.15_25)]" />
              <div className="h-6 w-40 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
              <div className="ml-auto h-5 w-20 bg-[oklch(0.92_0.02_230)] rounded animate-pulse" />
            </div>
            <AnalyticsCardSkeleton showChart={false} />
          </section>

          {/* Section 3: Accuracy Trends */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-5 text-[oklch(0.7_0.15_230)]" />
              <div className="h-6 w-56 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
            </div>
            <ChartSkeleton variant="line" height={384} />
          </section>

          {/* Section 4: Struggle Risk Timeline */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="size-5 text-[oklch(0.646_0.222_41.116)]" />
              <div className="h-6 w-64 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
            </div>
            <TimelineSkeleton variant="horizontal" items={7} />
          </section>

          {/* Section 5: Struggle Reduction Metrics */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Target className="size-5 text-[oklch(0.7_0.12_145)]" />
              <div className="h-6 w-56 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
            </div>
            <AnalyticsCardSkeleton showStats variant="wide" />
          </section>
        </div>

        {/* Sidebar - Right 1 column */}
        <div className="space-y-6">
          {/* Section 2: Interventions */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="size-5 text-[oklch(0.7_0.15_230)]" />
              <div className="h-6 w-48 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
            </div>
            <AnalyticsCardSkeleton variant="compact" />
          </section>
        </div>
      </div>
    </div>
  )
}
