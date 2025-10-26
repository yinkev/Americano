'use client'

/**
 * LoadingStates - Skeleton components for loading states
 * OKLCH-based skeleton colors with pulsing animation
 *
 * Components:
 * - CardSkeleton: For dashboard cards
 * - ListSkeleton: For library/list items
 * - ChartSkeleton: For analytics charts
 * - HeaderSkeleton: For page headers
 */

import { motion } from 'motion/react'
import { skeletonVariants, spacing } from '@/lib/design-system'

// Skeleton base component
function SkeletonBase({ className = '' }: { className?: string }) {
  return (
    <motion.div
      variants={skeletonVariants}
      initial="initial"
      animate="animate"
      className={`rounded-xl bg-card ${className}`}
    />
  )
}

// ============================================================================
// Card Skeleton - For dashboard cards
// ============================================================================
export interface CardSkeletonProps {
  count?: number
  className?: string
}

export function CardSkeleton({ count = 1, className = '' }: CardSkeletonProps) {
  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card p-6 shadow-none">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <SkeletonBase className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonBase className="h-4 w-3/4" />
              <SkeletonBase className="h-3 w-1/2" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <SkeletonBase className="h-3 w-full" />
            <SkeletonBase className="h-3 w-5/6" />
            <SkeletonBase className="h-3 w-4/6" />
          </div>

          {/* Footer */}
          <div className="mt-6 flex gap-2">
            <SkeletonBase className="h-9 w-24 rounded-xl" />
            <SkeletonBase className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// List Skeleton - For library items, search results
// ============================================================================
export interface ListSkeletonProps {
  count?: number
  className?: string
}

export function ListSkeleton({ count = 5, className = '' }: ListSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-none"
        >
          {/* Icon/Thumbnail */}
          <SkeletonBase className="h-12 w-12 flex-shrink-0 rounded-xl" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <SkeletonBase className="h-4 w-3/4" />
            <SkeletonBase className="h-3 w-1/2" />
          </div>

          {/* Action */}
          <SkeletonBase className="h-9 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Chart Skeleton - For analytics/dashboard charts
// ============================================================================
export interface ChartSkeletonProps {
  className?: string
}

export function ChartSkeleton({ className = '' }: ChartSkeletonProps) {
  return (
    <div className={`rounded-xl border border-border/50 bg-card p-6 shadow-none ${className}`}>
      {/* Chart Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBase className="h-5 w-48" />
          <SkeletonBase className="h-3 w-32" />
        </div>
        <SkeletonBase className="h-9 w-32 rounded-xl" />
      </div>

      {/* Chart Area */}
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 flex h-full flex-col justify-between py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBase key={i} className="h-3 w-8" />
          ))}
        </div>

        {/* Chart bars/lines */}
        <div className="ml-12 flex h-full items-end gap-4">
          {Array.from({ length: 7 }).map((_, i) => {
            const height = `${Math.random() * 60 + 40}%`
            return (
              <div key={i} className="flex-1" style={{ height }}>
                <SkeletonBase className="h-full w-full" />
              </div>
            )
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="ml-12 mt-4 flex gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBase key={i} className="h-3 flex-1" />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Header Skeleton - For page headers
// ============================================================================
export interface HeaderSkeletonProps {
  className?: string
}

export function HeaderSkeleton({ className = '' }: HeaderSkeletonProps) {
  return (
    <div className={`mb-8 ${className}`}>
      {/* Breadcrumbs */}
      <div className="mb-4 flex items-center gap-2">
        <SkeletonBase className="h-3 w-16" />
        <SkeletonBase className="h-3 w-2" />
        <SkeletonBase className="h-3 w-24" />
      </div>

      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <SkeletonBase className="h-8 w-64" />
          <SkeletonBase className="h-4 w-96" />
        </div>
        <div className="flex gap-3">
          <SkeletonBase className="h-10 w-32 rounded-xl" />
          <SkeletonBase className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-6 flex gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBase className="h-3 w-20" />
            <SkeletonBase className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Table Skeleton - For data tables
// ============================================================================
export interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 4, className = '' }: TableSkeletonProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-border/50 bg-card shadow-none ${className}`}>
      {/* Table Header */}
      <div className="flex gap-4 border-b border-border/50 bg-card p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBase key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <SkeletonBase key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Grid Skeleton - For grid layouts (e.g., lecture cards)
// ============================================================================
export interface GridSkeletonProps {
  count?: number
  columns?: number
  className?: string
}

export function GridSkeleton({ count = 6, columns = 3, className = '' }: GridSkeletonProps) {
  const gridClass = `grid-cols-${columns}`

  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:${gridClass} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-none"
        >
          {/* Image/Thumbnail */}
          <SkeletonBase className="h-40 w-full rounded-none" />

          {/* Content */}
          <div className="p-6 space-y-3">
            <SkeletonBase className="h-5 w-3/4" />
            <SkeletonBase className="h-3 w-full" />
            <SkeletonBase className="h-3 w-5/6" />

            {/* Footer */}
            <div className="flex items-center justify-between pt-4">
              <SkeletonBase className="h-3 w-20" />
              <SkeletonBase className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
