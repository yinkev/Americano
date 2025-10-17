'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Loader2, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FirstAidUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: () => void
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

export function FirstAidUpload({ open, onOpenChange, onUploadComplete }: FirstAidUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are supported')
        return
      }
      // Validate file size (max 100MB for First Aid book)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File size must be less than 100MB')
        return
      }
      setSelectedFile(file)
      setErrorMessage(null)
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setUploadState('idle')
    setUploadProgress(0)
    setErrorMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploadState('uploading')
      setUploadProgress(10)

      const formData = new FormData()
      formData.append('file', selectedFile)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 90))
      }, 500)

      const response = await fetch('/api/first-aid/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (result.success) {
        setUploadState('success')
        toast.success('First Aid book uploaded successfully! Processing will begin shortly.')

        // Wait a moment before closing
        setTimeout(() => {
          resetUpload()
          onOpenChange(false)
          onUploadComplete?.()
        }, 2000)
      } else {
        setUploadState('error')
        setErrorMessage(result.error?.message || 'Upload failed')
        toast.error(result.error?.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadState('error')
      setErrorMessage('Failed to upload file. Please try again.')
      toast.error('Failed to upload file')
    }
  }

  const handleClose = () => {
    if (uploadState === 'uploading' || uploadState === 'processing') {
      if (!confirm('Upload is in progress. Are you sure you want to cancel?')) {
        return
      }
    }
    resetUpload()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] bg-white/80 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <DialogTitle>Upload First Aid for USMLE Step 1</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Upload your personal copy of First Aid to enable cross-referencing with your lecture content.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Copyright Notice */}
          <Alert className="border-amber-200 bg-amber-50/80 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4" style={{ color: 'oklch(0.6 0.15 60)' }} />
            <AlertTitle className="text-amber-900">Copyright Notice</AlertTitle>
            <AlertDescription className="text-amber-800 text-xs space-y-1">
              <p>
                First Aid for the USMLE Step 1 is copyrighted material by McGraw Hill Education.
              </p>
              <p className="font-medium">
                By uploading, you confirm that you legally own this book and will use it for personal study only.
              </p>
              <p>
                This content will not be shared, redistributed, or used for commercial purposes.
              </p>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="grid gap-2">
            <Label htmlFor="file">PDF File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={uploadState !== 'idle'}
                className="cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Max file size: 100MB • Supported format: PDF
            </p>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                'bg-white/60 backdrop-blur-sm border-border/60'
              )}
            >
              <FileText className="size-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {uploadState === 'idle' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={resetUpload}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {(uploadState === 'uploading' || uploadState === 'processing') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {uploadState === 'uploading' ? 'Uploading...' : 'Processing...'}
                </span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {uploadState === 'uploading'
                  ? 'Uploading your First Aid book...'
                  : 'Extracting content and creating embeddings...'}
              </p>
            </div>
          )}

          {/* Success State */}
          {uploadState === 'success' && (
            <Alert className="border-green-200 bg-green-50/80 backdrop-blur-sm">
              <CheckCircle2 className="h-4 w-4" style={{ color: 'oklch(0.6 0.15 150)' }} />
              <AlertTitle className="text-green-900">Upload Successful</AlertTitle>
              <AlertDescription className="text-green-800 text-xs">
                Your First Aid book has been uploaded successfully. Processing will begin shortly, and references will appear in your lectures once complete.
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {uploadState === 'error' && errorMessage && (
            <Alert className="border-red-200 bg-red-50/80 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4" style={{ color: 'oklch(0.6 0.2 20)' }} />
              <AlertTitle className="text-red-900">Upload Failed</AlertTitle>
              <AlertDescription className="text-red-800 text-xs">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploadState === 'uploading' || uploadState === 'processing'}
          >
            {uploadState === 'success' ? 'Close' : 'Cancel'}
          </Button>
          {uploadState === 'idle' && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile}
            >
              <Upload className="size-4 mr-2" />
              Upload
            </Button>
          )}
          {uploadState === 'error' && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile}
            >
              <Upload className="size-4 mr-2" />
              Retry Upload
            </Button>
          )}
          {(uploadState === 'uploading' || uploadState === 'processing') && (
            <Button type="button" disabled>
              <Loader2 className="size-4 mr-2 animate-spin" />
              {uploadState === 'uploading' ? 'Uploading...' : 'Processing...'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
