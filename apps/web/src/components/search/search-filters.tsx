"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export interface SearchFilters {
  courseIds: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  contentTypes: string[]
}

interface Course {
  id: string
  name: string
  code?: string
  color?: string
}

interface SearchFiltersProps {
  courses: Course[]
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  className?: string
}

const CONTENT_TYPES = [
  { value: "lecture", label: "Lectures" },
  { value: "objective", label: "Learning Objectives" },
  { value: "card", label: "Flashcards" },
  { value: "concept", label: "Concepts" },
]

export function SearchFilters({
  courses,
  filters,
  onChange,
  className,
}: SearchFiltersProps) {
  const [dateRangeOpen, setDateRangeOpen] = React.useState(false)

  const activeFilterCount =
    filters.courseIds.length +
    filters.contentTypes.length +
    (filters.dateRange ? 1 : 0)

  const handleCourseToggle = (courseId: string) => {
    const newCourseIds = filters.courseIds.includes(courseId)
      ? filters.courseIds.filter(id => id !== courseId)
      : [...filters.courseIds, courseId]

    onChange({ ...filters, courseIds: newCourseIds })
  }

  const handleContentTypeToggle = (type: string) => {
    const newTypes = filters.contentTypes.includes(type)
      ? filters.contentTypes.filter(t => t !== type)
      : [...filters.contentTypes, type]

    onChange({ ...filters, contentTypes: newTypes })
  }

  const handleDateRangeChange = (range: { start?: Date; end?: Date } | undefined) => {
    if (!range || !range.start || !range.end) {
      onChange({ ...filters, dateRange: undefined })
    } else {
      onChange({
        ...filters,
        dateRange: { start: range.start, end: range.end }
      })
    }
  }

  const handleClearAll = () => {
    onChange({
      courseIds: [],
      contentTypes: [],
      dateRange: undefined,
    })
  }

  return (
    <Card className={cn(
      "border-border bg-card  shadow-none",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="rounded-full">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Course Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Courses</Label>
          <div className="space-y-2">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`course-${course.id}`}
                  checked={filters.courseIds.includes(course.id)}
                  onCheckedChange={() => handleCourseToggle(course.id)}
                  className="rounded-md"
                />
                <Label
                  htmlFor={`course-${course.id}`}
                  className="flex-1 text-sm font-normal cursor-pointer leading-tight"
                >
                  {course.name}
                  {course.code && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({course.code})
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-card" />

        {/* Content Type Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Content Type</Label>
          <div className="space-y-2">
            {CONTENT_TYPES.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={filters.contentTypes.includes(type.value)}
                  onCheckedChange={() => handleContentTypeToggle(type.value)}
                  className="rounded-md"
                />
                <Label
                  htmlFor={`type-${type.value}`}
                  className="flex-1 text-sm font-normal cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-card" />

        {/* Date Range Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Date Range</Label>
          <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-10 rounded-xl",
                  "bg-card hover:bg-card border-border",
                  !filters.dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {filters.dateRange ? (
                  <>
                    {format(filters.dateRange.start, "MMM d, yyyy")} -{" "}
                    {format(filters.dateRange.end, "MMM d, yyyy")}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-card  border-border"
              align="start"
            >
              <Calendar
                mode="range"
                selected={filters.dateRange ? { from: filters.dateRange.start, to: filters.dateRange.end } : undefined}
                onSelect={(range) => {
                  if (!range || !range.from || !range.to) {
                    handleDateRangeChange(undefined)
                  } else {
                    handleDateRangeChange({ start: range.from, end: range.to })
                  }
                }}
                numberOfMonths={2}
                className="rounded-xl"
              />
              {filters.dateRange && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleDateRangeChange(undefined)
                      setDateRangeOpen(false)
                    }}
                    className="w-full justify-center"
                  >
                    <X className="size-4 mr-2" />
                    Clear date range
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  )
}
