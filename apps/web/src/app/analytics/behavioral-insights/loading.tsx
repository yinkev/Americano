/**
 * Behavioral Insights Loading State
 * Wave 2: Progressive Loading
 *
 * Route-level loading state using Next.js 15 loading.tsx convention
 * Shows immediately upon navigation while page data loads
 */

import { Brain, TrendingUp, Target, BookOpen } from 'lucide-react'

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Dashboard Header */}
      <div className="mb-8 space-y-3">
        <div className="h-10 w-80 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
        <div className="h-5 w-[28rem] bg-[oklch(0.92_0.02_230)] rounded animate-pulse" />
        <div className="h-4 w-96 bg-[oklch(0.94_0.02_230)] rounded animate-pulse mt-3" />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="grid grid-cols-4 w-full max-w-2xl mx-auto gap-2 p-1 bg-muted/30 rounded-lg">
          {[Brain, TrendingUp, Target, BookOpen].map((Icon, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-2 p-2 rounded bg-white/80 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="h-4 w-16 bg-[oklch(0.9_0.02_230)] rounded hidden sm:block" />
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
          <div className="h-5 w-[32rem] bg-[oklch(0.92_0.02_230)] rounded animate-pulse" />
        </div>

        {/* Grid of cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)] rounded-xl p-6 space-y-4 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-[oklch(0.9_0.02_230)] rounded" />
                <div className="h-8 w-8 rounded-full bg-[oklch(0.92_0.02_230)]" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-[oklch(0.92_0.02_230)] rounded" />
                <div className="h-4 w-5/6 bg-[oklch(0.94_0.02_230)] rounded" />
              </div>
              <div className="h-10 w-24 bg-[oklch(0.9_0.02_230)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
