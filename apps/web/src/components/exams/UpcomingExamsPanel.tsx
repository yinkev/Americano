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
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
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
        'bg-white/80 backdrop-blur-md border-white/30',
        'shadow-[0_8px_32px_rgba(31,38,135,0.1)]',
        'rounded-2xl p-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            Upcoming Exams
          </h2>
          {exams.length > 0 && (
            <Badge
              variant="secondary"
              className="rounded-full bg-blue-100/80 text-blue-700 border-blue-200"
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
                'rounded-full gap-2',
                'bg-blue-500 hover:bg-blue-600 text-white',
                'shadow-sm hover:shadow-md',
                'transition-all duration-200'
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
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">
            No upcoming exams scheduled
          </p>
          <p className="text-gray-400 text-xs mt-1">
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
                  'p-4 border-2 transition-all duration-200',
                  'hover:shadow-md hover:scale-[1.01]',
                  urgency.bgColor,
                  urgency.borderColor
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Exam Info */}
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {exam.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {exam.course.code} - {exam.course.name}
                          </span>
                        </div>
                      </div>

                      <Badge
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold',
                          'border',
                          urgency.color,
                          urgency.borderColor.replace('border-', 'bg-'),
                          'backdrop-blur-sm'
                        )}
                      >
                        {urgency.label}
                      </Badge>
                    </div>

                    {/* Date & Countdown */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 font-medium">
                          {format(new Date(exam.date), 'PPP')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
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
                            className={cn(
                              'text-xs rounded-full px-2 py-0.5',
                              'bg-white/60 backdrop-blur-sm',
                              'border-gray-200 text-gray-700'
                            )}
                          >
                            {topic}
                          </Badge>
                        ))}
                        {exam.coverageTopics.length > 5 && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs rounded-full px-2 py-0.5',
                              'bg-white/60 backdrop-blur-sm',
                              'border-gray-200 text-gray-500'
                            )}
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
                      className={cn(
                        'h-8 w-8 p-0 rounded-lg',
                        'hover:bg-white/80',
                        'transition-all duration-200'
                      )}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteExam(exam.id)}
                      className={cn(
                        'h-8 w-8 p-0 rounded-lg',
                        'hover:bg-rose-50 hover:text-rose-600',
                        'transition-all duration-200'
                      )}
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
export function UpcomingExamsCompact({
  exams,
  className,
}: {
  exams: Exam[]
  className?: string
}) {
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
              'p-3 rounded-xl border',
              'bg-white/60 backdrop-blur-sm',
              urgency.borderColor,
              'transition-all duration-200 hover:shadow-sm'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {exam.name}
                </p>
                <p className="text-xs text-gray-600 truncate mt-0.5">
                  {exam.course.code}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn('text-xs font-medium', urgency.color)}>
                  {daysUntil === 0
                    ? 'Today'
                    : daysUntil === 1
                      ? 'Tomorrow'
                      : `${daysUntil}d`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {format(new Date(exam.date), 'MMM dd')}
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {nextThreeExams.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">
          No upcoming exams
        </p>
      )}
    </div>
  )
}
