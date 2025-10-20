/**
 * Learning Patterns Loading State
 * Wave 2: Progressive Loading
 *
 * Route-level loading state using Next.js 15 loading.tsx convention
 * Shows immediately upon navigation while page data loads
 */

import { AnalyticsCardSkeleton, ChartSkeleton, HeatmapSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header Skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-9 w-96 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
        <div className="h-5 w-[32rem] bg-[oklch(0.92_0.02_230)] rounded animate-pulse" />
      </div>

      {/* Content Skeletons */}
      <div className="space-y-6">
        {/* Profile Summary Card */}
        <AnalyticsCardSkeleton showHeader showStats />

        {/* Heatmap */}
        <div className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)] rounded-xl p-6">
          <div className="h-6 w-48 bg-[oklch(0.9_0.02_230)] rounded mb-4 animate-pulse" />
          <HeatmapSkeleton />
        </div>

        {/* Two Column Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)] rounded-xl p-6">
            <div className="h-6 w-56 bg-[oklch(0.9_0.02_230)] rounded mb-4 animate-pulse" />
            <ChartSkeleton variant="line" height={320} />
          </div>
          <div className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)] rounded-xl p-6">
            <div className="h-6 w-48 bg-[oklch(0.9_0.02_230)] rounded mb-4 animate-pulse" />
            <ChartSkeleton variant="radar" height={320} />
          </div>
        </div>

        {/* Forgetting Curve */}
        <div className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)] rounded-xl p-6">
          <div className="h-6 w-56 bg-[oklch(0.9_0.02_230)] rounded mb-4 animate-pulse" />
          <ChartSkeleton variant="area" height={320} />
        </div>

        {/* Insights */}
        <div className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)] rounded-xl p-6">
          <div className="h-6 w-40 bg-[oklch(0.9_0.02_230)] rounded mb-4 animate-pulse" />
          <AnalyticsCardSkeleton showHeader={false} showStats={false} />
        </div>
      </div>
    </div>
  )
}
