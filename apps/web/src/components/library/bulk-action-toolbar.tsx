'use client'

import { useState } from 'react'
import { Trash2, FolderInput, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { DeleteConfirmation } from './delete-confirmation'

interface Course {
  id: string
  name: string
  code: string | null
}

interface BulkActionToolbarProps {
  selectedCount: number
  selectedLectureIds: string[]
  courses: Course[]
  onComplete: () => void
  onCancel: () => void
}

export function BulkActionToolbar({
  selectedCount,
  selectedLectureIds,
  courses,
  onComplete,
  onCancel,
}: BulkActionToolbarProps) {
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleMoveToCourse = async () => {
    if (!selectedCourse) {
      toast.error('Please select a course')
      return
    }

    try {
      const response = await fetch('/api/content/lectures/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureIds: selectedLectureIds,
          action: 'move',
          data: { courseId: selectedCourse },
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        onComplete()
        setSelectedAction('')
        setSelectedCourse('')
      } else {
        toast.error(data.error?.message || 'Failed to move lectures')
      }
    } catch (error) {
      toast.error('Failed to move lectures')
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch('/api/content/lectures/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureIds: selectedLectureIds,
          action: 'delete',
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        onComplete()
        setDeleteOpen(false)
        setSelectedAction('')
      } else {
        toast.error(data.error?.message || 'Failed to delete lectures')
      }
    } catch (error) {
      toast.error('Failed to delete lectures')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 mb-4 bg-primary/10 border border-primary/20 rounded-md">
        <div className="flex items-center gap-4">
          <span className="font-medium">
            {selectedCount} lecture{selectedCount !== 1 ? 's' : ''} selected
          </span>

          <div className="flex gap-2">
            {/* Move to Course */}
            {selectedAction === 'move' ? (
              <div className="flex gap-2">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code ? `${course.code} - ${course.name}` : course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleMoveToCourse}>Move</Button>
                <Button variant="outline" onClick={() => setSelectedAction('')}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setSelectedAction('move')}>
                <FolderInput className="mr-2 h-4 w-4" />
                Move to Course
              </Button>
            )}

            {/* Delete */}
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAction('delete')
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <DeleteConfirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Lectures"
        description={`Are you sure you want to delete ${selectedCount} lecture${
          selectedCount !== 1 ? 's' : ''
        }? This action cannot be undone and will permanently delete all content, objectives, and cards associated with these lectures.`}
      />
    </>
  )
}
