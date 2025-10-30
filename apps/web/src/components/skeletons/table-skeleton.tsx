/**
 * Table Skeleton Component
 * Wave 2: Content-Aware Skeleton Loading States
 *
 * Design: Matches table structure with headers, rows, and columns
 * Uses shadcn/ui Skeleton component with OKLCH colors, glassmorphism
 * Prevents layout shift by matching real table dimensions
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface TableSkeletonProps {
  className?: string
  rows?: number
  columns?: number
  showHeader?: boolean
  showActions?: boolean
}

export function TableSkeleton({
  className,
  rows = 5,
  columns = 4,
  showHeader = true,
  showActions = false,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white/80 backdrop-blur-md border border-border rounded-xl overflow-hidden',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          {showHeader && (
            <thead>
              <tr className="border-b border-border">
                {[...Array(columns + (showActions ? 1 : 0))].map((_, i) => (
                  <th key={i} className="px-6 py-4 text-left">
                    <Skeleton
                      className="h-4"
                      style={{
                        width: i === columns && showActions ? '60px' : '80%',
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* Table Body */}
          <tbody>
            {[...Array(rows)].map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn('border-b border-muted', rowIndex % 2 === 0 && 'bg-muted/30')}
              >
                {[...Array(columns)].map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <Skeleton
                      className="h-4"
                      style={{
                        width: `${60 + Math.random() * 30}%`,
                      }}
                    />
                  </td>
                ))}
                {showActions && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
