/**
 * GraphFilters - Filter sidebar component for knowledge graph
 *
 * Story 3.2 Task 7.1: Create GraphFilters component
 *
 * Features:
 * - Multi-select for categories (anatomy, physiology, pathology, etc.)
 * - Multi-select for relationship types (PREREQUISITE, RELATED, INTEGRATED, CLINICAL)
 * - Clear filters button
 * - Active filter count badge
 * - Glassmorphism design with OKLCH colors
 * - Mobile-responsive (44px minimum touch targets)
 */

'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Category options for filtering
 */
const CATEGORIES = [
  { id: 'anatomy', label: 'Anatomy', color: 'oklch(0.6 0.15 240)' },
  { id: 'physiology', label: 'Physiology', color: 'oklch(0.6 0.15 140)' },
  { id: 'pathology', label: 'Pathology', color: 'oklch(0.6 0.15 20)' },
  { id: 'pharmacology', label: 'Pharmacology', color: 'oklch(0.6 0.15 290)' },
  { id: 'biochemistry', label: 'Biochemistry', color: 'oklch(0.6 0.15 80)' },
  { id: 'microbiology', label: 'Microbiology', color: 'oklch(0.6 0.15 200)' },
  { id: 'immunology', label: 'Immunology', color: 'oklch(0.6 0.15 330)' },
  { id: 'clinical', label: 'Clinical', color: 'oklch(0.6 0.15 50)' },
] as const

/**
 * Relationship type options for filtering
 */
const RELATIONSHIP_TYPES = [
  { id: 'PREREQUISITE', label: 'Prerequisite', color: 'oklch(0.6 0.15 50)' },
  { id: 'RELATED', label: 'Related', color: 'oklch(0.5 0.05 240)' },
  { id: 'INTEGRATED', label: 'Integrated', color: 'oklch(0.6 0.15 200)' },
  { id: 'CLINICAL', label: 'Clinical', color: 'oklch(0.6 0.15 330)' },
] as const

export type GraphFilters = {
  categories: string[]
  relationshipTypes: string[]
}

export type GraphFiltersProps = {
  onFilterChange: (filters: GraphFilters) => void
  className?: string
  initialFilters?: GraphFilters
}

/**
 * GraphFilters Component
 * Provides multi-select filters for knowledge graph visualization
 */
export default function GraphFilters({
  onFilterChange,
  className,
  initialFilters = { categories: [], relationshipTypes: [] },
}: GraphFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters.categories
  )
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<string[]>(
    initialFilters.relationshipTypes
  )

  // Notify parent when filters change
  useEffect(() => {
    onFilterChange({
      categories: selectedCategories,
      relationshipTypes: selectedRelationshipTypes,
    })
  }, [selectedCategories, selectedRelationshipTypes, onFilterChange])

  // Calculate active filter count
  const activeFilterCount = selectedCategories.length + selectedRelationshipTypes.length

  /**
   * Toggle category selection
   */
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  /**
   * Toggle relationship type selection
   */
  const toggleRelationshipType = (typeId: string) => {
    setSelectedRelationshipTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    )
  }

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedRelationshipTypes([])
  }

  return (
    <div
      className={cn(
        'rounded-xl border  overflow-hidden',
        className
      )}
      style={{
        backgroundColor: 'oklch(0.98 0.02 240 / 0.85)',
        borderColor: 'oklch(0.85 0.05 240 / 0.3)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'oklch(0.85 0.05 240 / 0.3)' }}
      >
        <div className="flex items-center gap-2">
          <Filter
            className="w-4 h-4"
            style={{ color: 'oklch(0.4 0.05 240)' }}
          />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'oklch(0.2 0.05 240)' }}
          >
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 px-2 text-xs"
              style={{
                backgroundColor: 'oklch(0.6 0.15 240)',
                color: 'white',
              }}
            >
              {activeFilterCount}
            </Badge>
          )}
        </div>

        {/* Clear button */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-medium transition-colors rounded px-2 py-1 min-h-[44px] sm:min-h-0"
            style={{
              color: 'oklch(0.5 0.05 240)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'oklch(0.3 0.05 240)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'oklch(0.5 0.05 240)'
            }}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Categories section */}
        <div>
          <h4
            className="text-xs font-semibold mb-3 uppercase tracking-wide"
            style={{ color: 'oklch(0.4 0.05 240)' }}
          >
            Categories
          </h4>
          <div className="space-y-3">
            {CATEGORIES.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-3 cursor-pointer group min-h-[44px] sm:min-h-0"
                onMouseOver={(e) => {
                  const label = e.currentTarget.querySelector('span')
                  if (label) {
                    ;(label as HTMLElement).style.color = 'oklch(0.2 0.05 240)'
                  }
                }}
                onMouseOut={(e) => {
                  const label = e.currentTarget.querySelector('span')
                  if (label && !selectedCategories.includes(category.id)) {
                    ;(label as HTMLElement).style.color = 'oklch(0.3 0.05 240)'
                  }
                }}
              >
                <Checkbox
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                  className="min-w-[20px] min-h-[20px]"
                  style={{
                    borderColor: category.color,
                  }}
                />
                <span
                  className="text-sm transition-colors flex items-center gap-2"
                  style={{
                    color: selectedCategories.includes(category.id)
                      ? 'oklch(0.2 0.05 240)'
                      : 'oklch(0.3 0.05 240)',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Relationship types section */}
        <div>
          <h4
            className="text-xs font-semibold mb-3 uppercase tracking-wide"
            style={{ color: 'oklch(0.4 0.05 240)' }}
          >
            Relationship Types
          </h4>
          <div className="space-y-3">
            {RELATIONSHIP_TYPES.map((type) => (
              <label
                key={type.id}
                className="flex items-center gap-3 cursor-pointer group min-h-[44px] sm:min-h-0"
                onMouseOver={(e) => {
                  const label = e.currentTarget.querySelector('span')
                  if (label) {
                    ;(label as HTMLElement).style.color = 'oklch(0.2 0.05 240)'
                  }
                }}
                onMouseOut={(e) => {
                  const label = e.currentTarget.querySelector('span')
                  if (label && !selectedRelationshipTypes.includes(type.id)) {
                    ;(label as HTMLElement).style.color = 'oklch(0.3 0.05 240)'
                  }
                }}
              >
                <Checkbox
                  checked={selectedRelationshipTypes.includes(type.id)}
                  onCheckedChange={() => toggleRelationshipType(type.id)}
                  className="min-w-[20px] min-h-[20px]"
                  style={{
                    borderColor: type.color,
                  }}
                />
                <span
                  className="text-sm transition-colors"
                  style={{
                    color: selectedRelationshipTypes.includes(type.id)
                      ? 'oklch(0.2 0.05 240)'
                      : 'oklch(0.3 0.05 240)',
                  }}
                >
                  {type.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
