'use client'

import { BookOpen, Calendar, Filter, Star, Tag, X } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export interface SearchFilters {
  courses?: string[]
  tags?: string[]
  dateRange?: {
    from?: Date
    to?: Date
  }
  difficulty?: ('basic' | 'intermediate' | 'advanced')[]
  highYieldOnly?: boolean
}

interface SearchFiltersMobileProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  availableCourses?: Array<{ id: string; name: string }>
  availableTags?: Array<{ id: string; name: string }>
  className?: string
}

/**
 * SearchFiltersMobile - Bottom sheet filter component for mobile
 *
 * Features:
 * - Bottom sheet design pattern (mobile-native UX)
 * - Swipe-to-dismiss gesture support
 * - Large touch targets (min 44px)
 * - Filter badge count indicator
 * - Smooth animations
 */
export function SearchFiltersMobile({
  filters,
  onFiltersChange,
  availableCourses = [],
  availableTags = [],
  className,
}: SearchFiltersMobileProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [localFilters, setLocalFilters] = React.useState<SearchFilters>(filters)

  // Sync with parent filters when they change externally
  React.useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Calculate active filter count
  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (localFilters.courses && localFilters.courses.length > 0)
      count += localFilters.courses.length
    if (localFilters.tags && localFilters.tags.length > 0) count += localFilters.tags.length
    if (localFilters.difficulty && localFilters.difficulty.length > 0)
      count += localFilters.difficulty.length
    if (localFilters.highYieldOnly) count += 1
    return count
  }, [localFilters])

  const handleCourseToggle = (courseId: string) => {
    const currentCourses = localFilters.courses || []
    const updatedCourses = currentCourses.includes(courseId)
      ? currentCourses.filter((id) => id !== courseId)
      : [...currentCourses, courseId]

    setLocalFilters({ ...localFilters, courses: updatedCourses })
  }

  const handleTagToggle = (tagId: string) => {
    const currentTags = localFilters.tags || []
    const updatedTags = currentTags.includes(tagId)
      ? currentTags.filter((id) => id !== tagId)
      : [...currentTags, tagId]

    setLocalFilters({ ...localFilters, tags: updatedTags })
  }

  const handleDifficultyToggle = (difficulty: 'basic' | 'intermediate' | 'advanced') => {
    const currentDifficulty = localFilters.difficulty || []
    const updatedDifficulty = currentDifficulty.includes(difficulty)
      ? currentDifficulty.filter((d) => d !== difficulty)
      : [...currentDifficulty, difficulty]

    setLocalFilters({ ...localFilters, difficulty: updatedDifficulty })
  }

  const handleHighYieldToggle = () => {
    setLocalFilters({ ...localFilters, highYieldOnly: !localFilters.highYieldOnly })
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleClear = () => {
    const clearedFilters: SearchFilters = {}
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            // Mobile-optimized sizing: min 44px height
            'h-14 px-6 gap-3 rounded-2xl',
            'bg-white/90 backdrop-blur-md border-2 border-white/60',
            'hover:bg-white hover:border-primary/30',
            'transition-all duration-200',
            className,
          )}
          aria-label={`Filters ${activeFilterCount > 0 ? `(${activeFilterCount} active)` : ''}`}
        >
          <Filter className="size-5" aria-hidden="true" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="ml-1 h-6 min-w-6 rounded-full bg-primary text-primary-foreground"
              aria-label={`${activeFilterCount} filters active`}
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className={cn(
          // Mobile-optimized bottom sheet
          'h-[85vh] rounded-t-3xl',
          'bg-white/95 backdrop-blur-lg border-t-2 border-white/60',
          // Safe area for mobile devices
          'pb-safe',
        )}
      >
        <SheetHeader className="px-2 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold">Search Filters</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close filters"
              className="h-11 w-11 rounded-xl"
            >
              <X className="size-5" />
            </Button>
          </div>
          <SheetDescription className="text-left">
            Refine your search results with filters
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-180px)] px-2">
          <div className="space-y-6 py-4">
            {/* High Yield Filter */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Star className="size-5 text-amber-500" aria-hidden="true" />
                High Yield Content
              </Label>
              <div className="flex items-center space-x-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200/50">
                <Checkbox
                  id="high-yield"
                  checked={localFilters.highYieldOnly || false}
                  onCheckedChange={handleHighYieldToggle}
                  className="h-6 w-6"
                  aria-label="Show only high-yield content"
                />
                <Label htmlFor="high-yield" className="text-sm font-medium cursor-pointer flex-1">
                  Show only high-yield content
                </Label>
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Tag className="size-5" aria-hidden="true" />
                Difficulty Level
              </Label>
              <div className="space-y-2">
                {(['basic', 'intermediate', 'advanced'] as const).map((level) => (
                  <div
                    key={level}
                    className="flex items-center space-x-3 p-4 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <Checkbox
                      id={`difficulty-${level}`}
                      checked={localFilters.difficulty?.includes(level) || false}
                      onCheckedChange={() => handleDifficultyToggle(level)}
                      className="h-6 w-6"
                      aria-label={`${level} difficulty`}
                    />
                    <Label
                      htmlFor={`difficulty-${level}`}
                      className="text-sm font-medium cursor-pointer capitalize flex-1"
                    >
                      {level}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Courses Filter */}
            {availableCourses.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <BookOpen className="size-5" aria-hidden="true" />
                  Courses ({localFilters.courses?.length || 0} selected)
                </Label>
                <div className="space-y-2">
                  {availableCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center space-x-3 p-4 rounded-xl bg-muted/30 border border-border/50"
                    >
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={localFilters.courses?.includes(course.id) || false}
                        onCheckedChange={() => handleCourseToggle(course.id)}
                        className="h-6 w-6"
                        aria-label={course.name}
                      />
                      <Label
                        htmlFor={`course-${course.id}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {course.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Tag className="size-5" aria-hidden="true" />
                  Tags ({localFilters.tags?.length || 0} selected)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = localFilters.tags?.includes(tag.id) || false
                    return (
                      <Button
                        key={tag.id}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTagToggle(tag.id)}
                        className={cn(
                          'h-11 px-4 rounded-xl transition-all',
                          isSelected && 'bg-primary text-primary-foreground',
                        )}
                        aria-pressed={isSelected}
                        aria-label={`${tag.name} tag ${isSelected ? 'selected' : 'not selected'}`}
                      >
                        {tag.name}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row gap-3 pt-4 px-2 border-t border-border/50">
          <Button
            variant="outline"
            size="lg"
            onClick={handleClear}
            className="flex-1 h-14 rounded-2xl"
            disabled={activeFilterCount === 0}
          >
            Clear All
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={handleApply}
            className="flex-1 h-14 rounded-2xl"
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
