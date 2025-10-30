'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'

interface ProcessingProgressProps {
  lectureId: string
  initialProgress: number
  totalPages?: number
  processedPages: number
  processingStartedAt?: string
}

export function ProcessingProgress({
  lectureId,
  initialProgress,
  totalPages,
  processedPages,
  processingStartedAt,
}: ProcessingProgressProps) {
  const [progress, setProgress] = useState(initialProgress)
  const [eta, setEta] = useState<string | null>(null)

  useEffect(() => {
    // Poll for progress updates every 2 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/content/lectures/${lectureId}`)
        const data = await response.json()

        if (data.success && data.lecture) {
          const newProgress = data.lecture.processingProgress
          setProgress(newProgress)

          // Calculate ETA
          if (data.lecture.processingStartedAt && newProgress > 0 && newProgress < 100) {
            const startTime = new Date(data.lecture.processingStartedAt).getTime()
            const currentTime = Date.now()
            const elapsedMs = currentTime - startTime
            const progressRate = newProgress / elapsedMs // progress per ms
            const remainingProgress = 100 - newProgress
            const estimatedRemainingMs = remainingProgress / progressRate

            if (estimatedRemainingMs < 60000) {
              // Less than a minute
              setEta(`${Math.ceil(estimatedRemainingMs / 1000)}s`)
            } else {
              // Minutes
              setEta(`${Math.ceil(estimatedRemainingMs / 60000)}m`)
            }
          }

          // Stop polling if complete or failed
          if (
            data.lecture.processingStatus === 'COMPLETED' ||
            data.lecture.processingStatus === 'FAILED'
          ) {
            clearInterval(interval)
          }
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [lectureId])

  const getProgressLabel = () => {
    if (progress === 0) return 'Starting...'
    if (progress < 60) return 'Extracting text from PDF'
    if (progress < 70) return 'Creating content chunks'
    if (progress < 80) return 'Extracting learning objectives'
    if (progress < 100) return 'Generating embeddings'
    return 'Complete'
  }

  return (
    <div className="space-y-2 min-w-[200px]">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getProgressLabel()}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{progress}%</span>
              {eta && <span className="text-xs text-muted-foreground">~{eta} left</span>}
            </div>
          </div>
          <Progress value={progress} className="h-2 mt-1" />
          {totalPages && (
            <div className="text-xs text-muted-foreground mt-1">
              {processedPages}/{totalPages} pages processed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
