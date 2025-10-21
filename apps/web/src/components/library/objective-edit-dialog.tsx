'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { ObjectiveComplexity } from '@/lib/ai/chatmock-client'

interface ObjectiveEditDialogProps {
  objective: {
    id: string
    objective: string
    complexity: ObjectiveComplexity
    pageStart: number | null
    pageEnd: number | null
    isHighYield: boolean
    boardExamTags: string[]
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (
    updated: Partial<{
      objective: string
      complexity: ObjectiveComplexity
      pageStart: number | null
      isHighYield: boolean
      boardExamTags: string[]
    }>,
  ) => Promise<void>
  onDelete: () => Promise<void>
}

export function ObjectiveEditDialog({
  objective,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: ObjectiveEditDialogProps) {
  const [formData, setFormData] = useState({
    objective: objective.objective,
    complexity: objective.complexity,
    pageStart: objective.pageStart?.toString() || '',
    isHighYield: objective.isHighYield,
    boardExamTags: objective.boardExamTags.join(', '),
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        objective: formData.objective,
        complexity: formData.complexity,
        pageStart: formData.pageStart ? parseInt(formData.pageStart) : null,
        isHighYield: formData.isHighYield,
        boardExamTags: formData.boardExamTags
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save objective:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this objective?')) return

    setIsDeleting(true)
    try {
      await onDelete()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete objective:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Learning Objective</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="objective">Objective Text</Label>
            <Textarea
              id="objective"
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="complexity">Complexity</Label>
              <Select
                value={formData.complexity}
                onValueChange={(value) =>
                  setFormData({ ...formData, complexity: value as ObjectiveComplexity })
                }
              >
                <SelectTrigger id="complexity" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pageStart">Page Number (optional)</Label>
              <Input
                id="pageStart"
                type="number"
                value={formData.pageStart}
                onChange={(e) => setFormData({ ...formData, pageStart: e.target.value })}
                placeholder="e.g., 42"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isHighYield"
              checked={formData.isHighYield}
              onChange={(e) => setFormData({ ...formData, isHighYield: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="isHighYield" className="!mt-0">
              High-yield (board exam relevant)
            </Label>
          </div>

          <div>
            <Label htmlFor="boardExamTags">Board Exam Tags (comma-separated)</Label>
            <Input
              id="boardExamTags"
              value={formData.boardExamTags}
              onChange={(e) => setFormData({ ...formData, boardExamTags: e.target.value })}
              placeholder="e.g., USMLE-Step1-Cardio, COMLEX-L1-Anatomy, NBME-Renal"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || isSaving}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
