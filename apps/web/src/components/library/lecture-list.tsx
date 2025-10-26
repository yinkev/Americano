'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, FileText, Clock, CheckCircle, AlertTriangle, Loader } from 'lucide-react'

interface Course {
  id: string
  name: string
  code: string | null
  color: string | null
}

interface Lecture {
  id: string
  title: string
  fileName: string
  uploadedAt: string
  processedAt: string | null
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  weekNumber: number | null
  topicTags: string[]
  course: Course
  chunkCount: number
  objectiveCount: number
  cardCount: number
}

interface LectureListProps {
  lectures: Lecture[]
  selectedLectures: Set<string>
  onToggleSelection: (lectureId: string) => void
  onRefresh: () => void
}

const statusIcons = {
  PENDING: <Clock className="w-4 h-4 text-muted-foreground" />,
  PROCESSING: <Loader className="w-4 h-4 text-primary animate-spin" />,
  COMPLETED: <CheckCircle className="w-4 h-4 text-success" />,
  FAILED: <AlertTriangle className="w-4 h-4 text-destructive" />,
}

export function LectureList({ lectures, selectedLectures, onToggleSelection, onRefresh }: LectureListProps) {
  return (
    <div className="space-y-4">
      {lectures.map((lecture) => (
        // I would add a motion.div here for a playful entrance animation
        <div key={lecture.id} className="p-4 rounded-xl bg-card flex items-center gap-4 transition-all duration-300 hover:bg-card">
          <Checkbox
            checked={selectedLectures.has(lecture.id)}
            onCheckedChange={() => onToggleSelection(lecture.id)}
            className="rounded-full w-6 h-6"
          />
          <div className="flex-1 grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4 flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                    <p className="font-semibold text-lg text-foreground truncate">{lecture.title}</p>
                    <p className="text-sm text-muted-foreground">{lecture.course.name}</p>
                </div>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground font-medium">
              {new Date(lecture.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="col-span-2 flex items-center gap-2">
                {statusIcons[lecture.processingStatus]}
                <span className="text-sm font-medium capitalize">{lecture.processingStatus.toLowerCase()}</span>
            </div>
            <div className="col-span-2">
                <Badge variant="secondary">{lecture.cardCount} cards</Badge>
            </div>
            <div className="col-span-2 flex justify-end">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreVertical className="w-5 h-5" />
                </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
