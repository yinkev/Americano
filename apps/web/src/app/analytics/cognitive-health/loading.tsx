/**
 * Cognitive Health Loading State
 * Wave 2: Progressive Loading
 *
 * Route-level loading state using Next.js 15 loading.tsx convention
 * Shows immediately upon navigation while page data loads
 */

import { Brain, TrendingUp, Activity } from 'lucide-react'

export default function Loading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Brain className="size-8 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="h-9 w-96 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
              <div className="h-5 w-[32rem] bg-[oklch(0.92_0.02_230)] rounded animate-pulse" />
            </div>
          </div>

          {/* Quick stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[Activity, TrendingUp, Brain].map((Icon, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/30"
              >
                <Icon className="size-5 text-primary shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-[oklch(0.92_0.02_230)] rounded animate-pulse" />
                  <div className="h-4 w-40 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Load meter column */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl p-6 animate-pulse">
              <div className="h-6 w-32 bg-muted rounded mb-6" />
              <div className="w-full aspect-square max-w-[280px] mx-auto bg-muted rounded-full mb-6" />
              <div className="h-12 bg-muted rounded-lg mb-4" />
              <div className="h-10 bg-muted rounded mb-4" />
              <div className="h-4 bg-muted rounded" />
            </div>
          </div>

          {/* Timeline and risk panel column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl p-6 animate-pulse">
              <div className="h-6 w-40 bg-muted rounded mb-6" />
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg" />
                ))}
              </div>
              <div className="h-[300px] bg-muted rounded-lg" />
            </div>

            {/* Risk panel */}
            <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl p-6 animate-pulse">
              <div className="h-6 w-32 bg-muted rounded mb-6" />
              <div className="h-24 bg-muted rounded-xl mb-6" />
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
