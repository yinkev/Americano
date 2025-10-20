/**
 * Table Skeleton Component
 * Wave 2: Content-Aware Skeleton Loading States
 *
 * Design: Matches table structure with headers, rows, and columns
 * OKLCH colors, glassmorphism, subtle pulse animation
 * Prevents layout shift by matching real table dimensions
 */

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
        'bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)] rounded-xl overflow-hidden',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          {showHeader && (
            <thead>
              <tr className="border-b border-[oklch(0.9_0.02_230)]">
                {[...Array(columns + (showActions ? 1 : 0))].map((_, i) => (
                  <th key={i} className="px-6 py-4 text-left">
                    <div
                      className="h-4 bg-[oklch(0.85_0.02_230)] rounded animate-pulse"
                      style={{
                        width: i === columns && showActions ? '60px' : '80%',
                        animationDelay: `${i * 0.1}s`,
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
                className={cn(
                  'border-b border-[oklch(0.95_0.01_230)]',
                  rowIndex % 2 === 0 && 'bg-[oklch(0.98_0.01_230)]',
                )}
              >
                {[...Array(columns)].map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div
                      className="h-4 bg-[oklch(0.9_0.02_230)] rounded animate-pulse"
                      style={{
                        width: `${60 + Math.random() * 30}%`,
                        animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s`,
                      }}
                    />
                  </td>
                ))}
                {showActions && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
                      <div className="h-8 w-8 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
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
