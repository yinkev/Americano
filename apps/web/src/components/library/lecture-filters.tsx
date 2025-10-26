'use client'

import { ArrowUpDown, SlidersHorizontal } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface Course {
  id: string
  name: string
  code: string | null
}

interface LectureFiltersProps {
  courses: Course[]
  selectedCourse: string
  selectedStatus: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onCourseChange: (courseId: string) => void
  onStatusChange: (status: string) => void
  onSortChange: (field: string, order: 'asc' | 'desc') => void
}

export function LectureFilters({
  courses,
  selectedCourse,
  selectedStatus,
  sortBy,
  sortOrder,
  onCourseChange,
  onStatusChange,
  onSortChange,
}: LectureFiltersProps) {
  const toggleSortOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    // I would add a motion.div here for a playful entrance animation
    <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-muted-foreground">
            <SlidersHorizontal className="w-6 h-6" />
            <span>Filters:</span>
        </div>
      <Select value={selectedCourse} onValueChange={onCourseChange}>
        <SelectTrigger className="rounded-full h-12 text-md font-semibold bg-card border-none focus:ring-2 focus:ring-primary">
          <SelectValue placeholder="All Courses" />
        </SelectTrigger>
        <SelectContent className="bg-card  rounded-xl border-border/50">
          <SelectItem value="all">All Courses</SelectItem>
          {courses.map((course) => (
            <SelectItem key={course.id} value={course.id}>
              {course.code ? `${course.code} - ${course.name}` : course.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="rounded-full h-12 text-md font-semibold bg-card border-none focus:ring-2 focus:ring-primary">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent className="bg-card  rounded-xl border-border/50">
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="PROCESSING">Processing</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="FAILED">Failed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={(field) => onSortChange(field, sortOrder)}>
        <SelectTrigger className="rounded-full h-12 text-md font-semibold bg-card border-none focus:ring-2 focus:ring-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card  rounded-xl border-border/50">
          <SelectItem value="uploadedAt">Sort by Date</SelectItem>
          <SelectItem value="title">Sort by Title</SelectItem>
          <SelectItem value="processingStatus">Sort by Status</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="ghost" onClick={toggleSortOrder} className="rounded-full h-12 text-md font-semibold gap-2">
        <ArrowUpDown className="h-5 w-5" />
        {sortOrder === 'asc' ? 'ASC' : 'DESC'}
      </Button>
    </div>
  )
}
