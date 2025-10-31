'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { Calendar, Filter, X } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * Time range option
 */
export interface TimeRangeOption {
  label: string
  value: string
}

/**
 * Filter option
 */
export interface FilterOption {
  label: string
  value: string
  count?: number
}

/**
 * Quick filter preset
 */
export interface QuickFilter {
  label: string
  value: string
  filters: Record<string, string | string[]>
}

/**
 * Props for the FilterBar component
 */
export interface FilterBarProps extends HTMLMotionProps<'div'> {
  /**
   * Time range options
   */
  timeRanges?: TimeRangeOption[]
  /**
   * Selected time range
   */
  selectedTimeRange?: string
  /**
   * Time range change handler
   */
  onTimeRangeChange?: (value: string) => void
  /**
   * Available filter categories (e.g., "Objectives")
   */
  filterCategories?: Array<{
    label: string
    key: string
    options: FilterOption[]
    multiSelect?: boolean
  }>
  /**
   * Selected filters (key-value pairs)
   */
  selectedFilters?: Record<string, string | string[]>
  /**
   * Filter change handler
   */
  onFilterChange?: (key: string, value: string | string[]) => void
  /**
   * Quick filter presets
   */
  quickFilters?: QuickFilter[]
  /**
   * Selected quick filter
   */
  selectedQuickFilter?: string
  /**
   * Quick filter change handler
   */
  onQuickFilterChange?: (value: string) => void
  /**
   * Clear all filters handler
   */
  onClearAll?: () => void
  /**
   * Whether filters are loading
   */
  loading?: boolean
  /**
   * Compact mode (reduced padding)
   */
  compact?: boolean
  /**
   * Sticky positioning
   */
  sticky?: boolean
  /**
   * Top offset for sticky positioning (in pixels)
   */
  stickyTop?: number
}

const defaultTimeRanges: TimeRangeOption[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
  { label: 'All time', value: 'all' },
]

/**
 * FilterBar - Interactive filter bar with time range, multi-select filters, and presets
 *
 * @example
 * ```tsx
 * <FilterBar
 *   selectedTimeRange="30d"
 *   onTimeRangeChange={setTimeRange}
 *   filterCategories={[
 *     {
 *       label: "Objectives",
 *       key: "objectives",
 *       options: [
 *         { label: "Accuracy", value: "accuracy" },
 *         { label: "Speed", value: "speed" }
 *       ],
 *       multiSelect: true
 *     }
 *   ]}
 *   selectedFilters={{ objectives: ["accuracy"] }}
 *   onFilterChange={handleFilterChange}
 *   onClearAll={clearFilters}
 * />
 * ```
 */
export const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  (
    {
      timeRanges = defaultTimeRanges,
      selectedTimeRange,
      onTimeRangeChange,
      filterCategories = [],
      selectedFilters = {},
      onFilterChange,
      quickFilters = [],
      selectedQuickFilter,
      onQuickFilterChange,
      onClearAll,
      loading = false,
      compact = false,
      sticky = false,
      stickyTop = 0,
      className,
      ...props
    },
    ref,
  ) => {
    // Count active filters
    const activeFilterCount = Object.values(selectedFilters).reduce((count, value) => {
      if (Array.isArray(value)) {
        return count + value.length
      }
      return value ? count + 1 : count
    }, 0)

    const hasActiveFilters = activeFilterCount > 0

    // Handle filter badge removal
    const handleRemoveFilter = React.useCallback(
      (key: string, value?: string) => {
        if (!onFilterChange) return

        const currentValue = selectedFilters[key]

        if (Array.isArray(currentValue) && value) {
          // Remove specific value from array
          const newValue = currentValue.filter((v) => v !== value)
          onFilterChange(key, newValue)
        } else {
          // Clear single value or entire array
          onFilterChange(key, '')
        }
      },
      [selectedFilters, onFilterChange],
    )

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          sticky && 'sticky z-10',
          compact ? 'py-2' : 'py-3',
          className,
        )}
        style={sticky ? { top: `${stickyTop}px` } : undefined}
        role="toolbar"
        aria-label="Filter controls"
        {...props}
      >
        <div className="container">
          {/* Main filter row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time range selector */}
            {timeRanges.length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Select
                  value={selectedTimeRange}
                  onValueChange={onTimeRangeChange}
                  disabled={loading}
                >
                  <SelectTrigger className="h-9 w-[140px]" aria-label="Select time range">
                    <SelectValue placeholder="Time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quick filters */}
            {quickFilters.length > 0 && (
              <div className="flex items-center gap-2">
                {quickFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={selectedQuickFilter === filter.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onQuickFilterChange?.(filter.value)}
                    disabled={loading}
                    className="h-9"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Filter category selectors */}
            {filterCategories.map((category) => (
              <Select
                key={category.key}
                value={
                  Array.isArray(selectedFilters[category.key])
                    ? undefined
                    : (selectedFilters[category.key] as string)
                }
                onValueChange={(value) => onFilterChange?.(category.key, value)}
                disabled={loading}
              >
                <SelectTrigger
                  className="h-9 w-[160px]"
                  aria-label={`Select ${category.label.toLowerCase()}`}
                >
                  <SelectValue placeholder={category.label}>
                    {!Array.isArray(selectedFilters[category.key]) &&
                      selectedFilters[category.key] && (
                        <span className="flex items-center gap-1">
                          <Filter className="h-3 w-3" />
                          {
                            category.options.find(
                              (opt) => opt.value === selectedFilters[category.key],
                            )?.label
                          }
                        </span>
                      )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {category.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                      {option.count !== undefined && (
                        <span className="ml-2 text-muted-foreground">({option.count})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {/* Clear all button */}
            {hasActiveFilters && onClearAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                disabled={loading}
                className="h-9 text-muted-foreground hover:text-foreground"
                aria-label={`Clear all filters (${activeFilterCount} active)`}
              >
                Clear all
                <X className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Active filter badges */}
          <AnimatePresence mode="popLayout">
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 flex flex-wrap items-center gap-2"
              >
                {Object.entries(selectedFilters).map(([key, value]) => {
                  if (!value) return null

                  const category = filterCategories.find((cat) => cat.key === key)
                  if (!category) return null

                  if (Array.isArray(value)) {
                    return value.map((val) => {
                      const option = category.options.find((opt) => opt.value === val)
                      return (
                        <motion.div
                          key={`${key}-${val}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Badge variant="secondary" className="gap-1 pr-1">
                            <span className="text-xs">{option?.label || val}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => handleRemoveFilter(key, val)}
                              aria-label={`Remove ${option?.label || val} filter`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        </motion.div>
                      )
                    })
                  }

                  const option = category.options.find((opt) => opt.value === value)
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Badge variant="secondary" className="gap-1 pr-1">
                        <span className="text-xs">{option?.label || value}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => handleRemoveFilter(key)}
                          aria-label={`Remove ${option?.label || value} filter`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  },
)

FilterBar.displayName = 'FilterBar'
