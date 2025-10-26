'use client'

import { useState, useRef } from 'react'
import { UploadCloud, X, FileText, Loader2, PartyPopper } from 'lucide-react'
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
import { toast } from 'sonner'

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
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are supported')
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    // Upload logic
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card  rounded-xl border-border/50 shadow-none-2xl">
        {/* I would add a motion.div here for a playful entrance animation */}
        <DialogHeader className="p-6 text-center">
          <div className="mx-auto w-fit p-3 bg-card rounded-xl mb-4">
            <UploadCloud className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-3xl font-heading">Upload a New Lecture</DialogTitle>
          <DialogDescription className="text-lg">Drop a PDF file here or click to select one. Your lecture will be ready for studying in minutes!</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-6">
            <div className="p-8 border-2 border-dashed border-primary/30 rounded-xl text-center bg-card hover:bg-card cursor-pointer transition-colors duration-300">
                <UploadCloud className="w-12 h-12 text-primary/50 mx-auto mb-4" />
                <p className="text-lg font-semibold">Drag & Drop your PDF here</p>
                <p className="text-muted-foreground">or</p>
                <Button variant="link" className="text-lg">Browse Files</Button>
            </div>

          <div className="space-y-2">
            <Label htmlFor="course" className="text-lg font-semibold">Select a Course</Label>
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
              disabled={uploading || courses.length === 0}
            >
              <SelectTrigger id="course" className="h-14 text-lg rounded-full bg-card border-none focus:ring-2 focus:ring-primary">
                <SelectValue placeholder={courses.length === 0 ? 'No courses available' : 'Select a course'} />
              </SelectTrigger>
              <SelectContent className="bg-card  rounded-xl border-border/50">
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="text-lg">
                    {course.code ? `${course.code} - ${course.name}` : course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
        <DialogFooter className="p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
            className="rounded-full text-lg px-6 py-3"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || !selectedCourseId || uploading}
            className="rounded-full text-lg px-6 py-3 gap-2"
          >
            {uploading ? (
              <><Loader2 className="size-5 animate-spin" /> Uploading...</>
            ) : (
              <><PartyPopper className="size-5" /> Start Upload</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
