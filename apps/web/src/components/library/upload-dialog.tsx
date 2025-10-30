'use client'

import { FileText, Loader2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Course {
  id: string
  name: string
  code: string | null
  color: string | null
}

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: () => void
  courses?: Course[]
}

export function UploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  courses = [],
}: UploadDialogProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are supported')
        return
      }
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    if (!selectedCourseId) {
      toast.error('Please select a course')
      return
    }

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('courseId', selectedCourseId)

      const response = await fetch('/api/content/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Lecture uploaded successfully! Processing will begin shortly.')
        setSelectedFile(null)
        setSelectedCourseId('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onOpenChange(false)
        onUploadComplete?.()
      } else {
        toast.error(result.error?.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Lecture</DialogTitle>
          <DialogDescription>
            Upload a PDF lecture file. It will be automatically processed to extract learning
            objectives and create flashcards.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {courses.length === 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <p className="font-medium mb-1">No courses available</p>
              <p className="text-xs">
                Please{' '}
                <a href="/library?action=create-course" className="underline font-medium">
                  create a course
                </a>{' '}
                first before uploading lectures.
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="course">Course</Label>
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
              disabled={uploading || courses.length === 0}
            >
              <SelectTrigger id="course">
                <SelectValue
                  placeholder={courses.length === 0 ? 'No courses available' : 'Select a course'}
                />
              </SelectTrigger>
              <SelectContent>
                {courses.length === 0 ? (
                  <SelectItem value="no-courses" disabled>
                    No courses available
                  </SelectItem>
                ) : (
                  courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code ? `${course.code} - ${course.name}` : course.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="file">PDF File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={uploading}
                className="cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">Max file size: 50MB</p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <FileText className="size-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => {
                  setSelectedFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                disabled={uploading}
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || !selectedCourseId || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="size-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
