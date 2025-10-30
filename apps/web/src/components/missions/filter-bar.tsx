'use client'

import { ArrowUpDown, Download, Filter, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { selectActiveFiltersCount, selectFilters, useMissionStore } from '@/stores/mission'

interface FilterBarProps {
  onExport?: () => void
  showExport?: boolean
}

type SortOption = {
  value: string
  label: string
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'date-desc', label: 'Date (Newest)' },
  { value: 'date-asc', label: 'Date (Oldest)' },
  { value: 'completion-desc', label: 'Completion (High)' },
  { value: 'completion-asc', label: 'Completion (Low)' },
  { value: 'status', label: 'Status' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SKIPPED', label: 'Skipped' },
]

export function FilterBar({ onExport, showExport = false }: FilterBarProps) {
  const filters = useMissionStore(selectFilters)
  const activeFiltersCount = useMissionStore(selectActiveFiltersCount)
  const { setSearchQuery, setStatusFilter, resetFilters } = useMissionStore()

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      setStatusFilter([])
    } else {
      setStatusFilter([value as any])
    }
  }

  const hasFilters = activeFiltersCount > 0

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          {hasFilters && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search missions by objectives..."
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-white/60 border-white/30 focus:border-primary focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-48">
          <Select
            value={filters.statuses.length > 0 ? filters.statuses[0] : 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="bg-white/60 border-white/30">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Export Button */}
        {showExport && onExport && (
          <Button
            variant="outline"
            onClick={onExport}
            className="w-full lg:w-auto border-white/30 hover:bg-white/60"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/30">
          {filters.searchQuery && (
            <Badge variant="outline" className="gap-1">
              Search: {filters.searchQuery}
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 hover:bg-gray-100 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.statuses.length > 0 && (
            <Badge variant="outline" className="gap-1">
              Status: {filters.statuses[0]}
              <button
                onClick={() => setStatusFilter([])}
                className="ml-1 hover:bg-gray-100 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
