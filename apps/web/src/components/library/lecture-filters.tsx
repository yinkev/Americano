'use client'

import { ArrowUpDown } from 'lucide-react'
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
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-md">
      {/* Course Filter */}
      <div className="flex-1 min-w-[200px]">
        <Select value={selectedCourse} onValueChange={onCourseChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.code ? `${course.code} - ${course.name}` : course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="flex-1 min-w-[200px]">
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Field */}
      <div className="flex-1 min-w-[200px]">
        <Select value={sortBy} onValueChange={(field) => onSortChange(field, sortOrder)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uploadedAt">Upload Date</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="processedAt">Processed Date</SelectItem>
            <SelectItem value="processingStatus">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Order Toggle */}
      <Button variant="outline" onClick={toggleSortOrder}>
        <ArrowUpDown className="mr-2 h-4 w-4" />
        {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
      </Button>
    </div>
  )
}
