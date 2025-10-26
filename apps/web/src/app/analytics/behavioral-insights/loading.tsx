/**
 * Behavioral Insights Loading State
 * Story 5.6: Epic 5 UI Transformation
 *
 * Route-level loading state using Next.js 15 loading.tsx convention
 * Shows immediately upon navigation while page data loads
 *
 * Design System:
 * - OKLCH skeleton colors (no hex)
 * - Staggered animations with design tokens
 * - Typography from /lib/design-tokens.ts
 * - Glassmorphism (bg-card )
 */

import { Brain, TrendingUp, Target, BookOpen } from 'lucide-react'
import { typography } from '@/lib/design-tokens'

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Dashboard Header */}
      <div className="mb-8 space-y-3">
        <div
          className="h-10 w-80 rounded animate-pulse"
          style={{ backgroundColor: 'oklch(0.9 0.02 230)' }}
        />
        <div
          className="h-5 w-[28rem] rounded animate-pulse"
          style={{ backgroundColor: 'oklch(0.92 0.02 230)', animationDelay: '0.1s' }}
        />
        <div
          className="h-4 w-96 rounded animate-pulse mt-3"
          style={{ backgroundColor: 'oklch(0.94 0.02 230)', animationDelay: '0.2s' }}
        />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="grid grid-cols-4 w-full max-w-2xl mx-auto gap-2 p-1 bg-card rounded-lg">
          {[Brain, TrendingUp, Target, BookOpen].map((Icon, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-2 p-2 rounded bg-card  animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <Icon className="size-4 text-muted-foreground" />
              <div
                className="h-4 w-16 rounded hidden sm:block"
                style={{ backgroundColor: 'oklch(0.9 0.02 230)' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div
            className="h-8 w-64 rounded animate-pulse"
            style={{ backgroundColor: 'oklch(0.9 0.02 230)' }}
          />
          <div
            className="h-5 w-[32rem] rounded animate-pulse"
            style={{ backgroundColor: 'oklch(0.92 0.02 230)', animationDelay: '0.1s' }}
          />
        </div>

        {/* Grid of cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-card  border rounded-xl p-6 space-y-4 animate-pulse"
              style={{
                borderColor: 'oklch(0.9 0.02 230)',
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 rounded" style={{ backgroundColor: 'oklch(0.9 0.02 230)' }} />
                <div
                  className="size-8 rounded-full"
                  style={{ backgroundColor: 'oklch(0.92 0.02 230)' }}
                />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded" style={{ backgroundColor: 'oklch(0.92 0.02 230)' }} />
                <div
                  className="h-4 w-5/6 rounded"
                  style={{ backgroundColor: 'oklch(0.94 0.02 230)' }}
                />
              </div>
              <div className="h-10 w-24 rounded" style={{ backgroundColor: 'oklch(0.9 0.02 230)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
