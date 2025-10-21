/**
 * UpcomingExamsPanel Component
 * Story 2.3: Task 8 - UI Components
 *
 * Displays upcoming exams with urgency indicators and glassmorphism design
 */

'use client'

import React from 'react'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import { Calendar, Clock, BookOpen, Edit, Trash2, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ExamDialog } from './ExamDialog'

interface Exam {
  id: string
  name: string
  date: Date
  course: {
    id: string
    name: string
    code: string
  }
  coverageTopics: string[]
}

interface UpcomingExamsPanelProps {
  exams: Exam[]
  courses: Array<{ id: string; name: string; code: string }>
  onCreateExam: (data: any) => Promise<void>
  onUpdateExam: (id: string, data: any) => Promise<void>
  onDeleteExam: (id: string) => Promise<void>
  className?: string
}

/**
 * Get urgency level based on days until exam
 */
function getUrgencyLevel(daysUntil: number): {
  level: 'critical' | 'high' | 'medium' | 'low'
  label: string
  color: string
  bgColor: string
  borderColor: string
} {
  if (daysUntil <= 3) {
    return {
      level: 'critical',
      label: 'URGENT',
      color: 'text-rose-700',
      bgColor: 'bg-rose-50/80',
      borderColor: 'border-rose-200',
    }
  } else if (daysUntil <= 7) {
    return {
      level: 'high',
      label: 'SOON',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50/80',
      borderColor: 'border-amber-200',
    }
  } else if (daysUntil <= 14) {
    return {
      level: 'medium',
      label: 'UPCOMING',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50/80',
      borderColor: 'border-blue-200',
    }
  }

  return {
    level: 'low',
    label: 'SCHEDULED',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50/80',
    borderColor: 'border-emerald-200',
  }
}

export function UpcomingExamsPanel({
  exams,
  courses,
  onCreateExam,
  onUpdateExam,
  onDeleteExam,
  className,
}: UpcomingExamsPanelProps) {
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Sort exams by date (soonest first)
  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    // Delay clearing editing exam to prevent flash
    setTimeout(() => setEditingExam(null), 200)
  }

  const handleUpdate = async (data: any) => {
    if (editingExam) {
      await onUpdateExam(editingExam.id, data)
      handleDialogClose()
    }
  }

  return (
    <Card
      className={cn(
        'bg-background border shadow-sm',
        'rounded-lg p-4',
        'hover:shadow-md transition-shadow duration-300',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-clinical" />
          <h2 className="text-[20px] font-heading font-semibold">Upcoming Exams</h2>
          {exams.length > 0 && (
            <Badge
              variant="secondary"
              className="rounded-full"
            >
              {exams.length}
            </Badge>
          )}
        </div>

        <ExamDialog
          trigger={
            <Button
              size="sm"
              className={cn(
                'rounded-lg gap-2',
                'bg-clinical text-clinical-foreground hover:bg-clinical/90',
                'transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]',
              )}
            >
              <Plus className="w-4 h-4" />
              Add Exam
            </Button>
          }
          courses={courses}
          onSubmit={onCreateExam}
        />
      </div>

      {/* Exams List */}
      {sortedExams.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-[13px]">No upcoming exams scheduled</p>
          <p className="text-muted-foreground/60 text-[11px] mt-1">
            Add your first exam to start prioritizing your study content
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedExams.map((exam) => {
            const daysUntil = differenceInDays(new Date(exam.date), new Date())
            const urgency = getUrgencyLevel(daysUntil)

            return (
              <Card
                key={exam.id}
                className={cn(
                  'p-4 border-2 transition-all duration-300',
                  'hover:shadow-md hover:scale-[1.005]',
                  urgency.bgColor,
                  urgency.borderColor,
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Exam Info */}
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-heading font-semibold text-[16px]">{exam.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="text-[13px] text-muted-foreground">
                            {exam.course.code} - {exam.course.name}
                          </span>
                        </div>
                      </div>

                      <Badge
                        className={cn(
                          'rounded-full px-3 py-1 text-[11px] font-semibold',
                          'border',
                          urgency.color,
                          urgency.borderColor.replace('border-', 'bg-'),
                        )}
                      >
                        {urgency.label}
                      </Badge>
                    </div>

                    {/* Date & Countdown */}
                    <div className="flex items-center gap-4 text-[13px]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(exam.date), 'PPP')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className={cn('font-medium', urgency.color)}>
                          {formatDistanceToNow(new Date(exam.date), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Coverage Topics */}
                    {exam.coverageTopics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {exam.coverageTopics.slice(0, 5).map((topic, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-[11px] rounded-full px-2 py-0.5"
                          >
                            {topic}
                          </Badge>
                        ))}
                        {exam.coverageTopics.length > 5 && (
                          <Badge
                            variant="outline"
                            className="text-[11px] rounded-full px-2 py-0.5 text-muted-foreground"
                          >
                            +{exam.coverageTopics.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(exam)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-secondary transition-all duration-150"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteExam(exam.id)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <ExamDialog
        exam={
          editingExam
            ? {
                id: editingExam.id,
                name: editingExam.name,
                date: new Date(editingExam.date),
                courseId: editingExam.course.id,
                coverageTopics: editingExam.coverageTopics,
              }
            : null
        }
        courses={courses}
        onSubmit={handleUpdate}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </Card>
  )
}

/**
 * Compact version for dashboard/overview
 */
export function UpcomingExamsCompact({ exams, className }: { exams: Exam[]; className?: string }) {
  const nextThreeExams = [...exams]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  return (
    <div className={cn('space-y-3', className)}>
      {nextThreeExams.map((exam) => {
        const daysUntil = differenceInDays(new Date(exam.date), new Date())
        const urgency = getUrgencyLevel(daysUntil)

        return (
          <div
            key={exam.id}
            className={cn(
              'p-3 rounded-lg border',
              'bg-background',
              urgency.borderColor,
              'transition-all duration-150 hover:shadow-sm',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[13px] truncate">{exam.name}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{exam.course.code}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn('text-[11px] font-medium', urgency.color)}>
                  {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {format(new Date(exam.date), 'MMM dd')}
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {nextThreeExams.length === 0 && (
        <p className="text-[11px] text-muted-foreground/60 text-center py-4">No upcoming exams</p>
      )}
    </div>
  )
}
