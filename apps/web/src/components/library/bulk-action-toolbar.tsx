'use client'

import { useState } from 'react'
import { Trash2, FolderInput, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
// import { NewDeleteConfirmation } from './new-delete-confirmation'

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
    // Move to course logic
  }

  const handleDeleteConfirm = async () => {
    // Delete logic
  }

  return (
    <>
      {/* I would add a motion.div here for a playful entrance animation */}
      <div className="p-4 rounded-full bg-card  border-2 border-primary/20 shadow-none flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg text-primary">
            {selectedCount} selected
          </span>

          <div className="flex gap-2">
            <Button variant="ghost" className="rounded-full font-semibold text-lg gap-2" onClick={() => setSelectedAction('move')}>
                <FolderInput className="w-5 h-5" />
                Move
            </Button>
            <Button variant="ghost" className="rounded-full font-semibold text-lg text-destructive gap-2" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="w-5 h-5" />
                Delete
            </Button>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* <NewDeleteConfirmation /> */}
    </>
  )
}
