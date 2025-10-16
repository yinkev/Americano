'use client'

/**
 * Exams Client Component
 * Story 2.3: Intelligent Content Prioritization Algorithm
 *
 * Interactive exam management with CRUD operations
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO, isPast } from 'date-fns'
import { Plus, Calendar as CalendarIcon, Pencil, Trash2, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExamDialog } from '@/components/exams/ExamDialog'
import { type CreateExamInput } from '@/lib/validation/exam'

interface Course {
  id: string
  name: string
  code: string
}

interface Exam {
  id: string
  name: string
  date: string
  courseId: string
  coverageTopics: string[]
  course: Course
}

interface ExamsClientProps {
  exams: Exam[]
  courses: Course[]
}

export function ExamsClient({ exams: initialExams, courses }: ExamsClientProps) {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>(initialExams)
  const [isCreating, setIsCreating] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateExam = async (data: CreateExamInput) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        throw new Error('Failed to create exam')
      }

      const result = await res.json()
      setExams([...exams, result.data.exam])
      setIsCreating(false)
      router.refresh()
    } catch (error) {
      console.error('Error creating exam:', error)
      alert('Failed to create exam. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateExam = async (data: CreateExamInput) => {
    if (!editingExam) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/exams/${editingExam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        throw new Error('Failed to update exam')
      }

      const result = await res.json()
      setExams(exams.map((e) => (e.id === editingExam.id ? result.data.exam : e)))
      setEditingExam(null)
      router.refresh()
    } catch (error) {
      console.error('Error updating exam:', error)
      alert('Failed to update exam. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete exam')
      }

      setExams(exams.filter((e) => e.id !== examId))
      router.refresh()
    } catch (error) {
      console.error('Error deleting exam:', error)
      alert('Failed to delete exam. Please try again.')
    }
  }

  const upcomingExams = exams
    .filter((e) => !isPast(parseISO(e.date)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastExams = exams
    .filter((e) => isPast(parseISO(e.date)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6">
      {/* Create Exam Button */}
      <div className="flex justify-end">
        <ExamDialog
          trigger={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Add Exam
            </Button>
          }
          courses={courses}
          onSubmit={handleCreateExam}
          open={isCreating}
          onOpenChange={setIsCreating}
        />
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Exams</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingExams.map((exam) => (
              <Card
                key={exam.id}
                className="bg-white/80 backdrop-blur-md border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl transition-all duration-200 hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)]"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {exam.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 mt-1">
                        {exam.course.code} - {exam.course.name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingExam(exam)}
                        className="h-8 w-8 rounded-lg hover:bg-white/60"
                      >
                        <Pencil className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExam(exam.id)}
                        className="h-8 w-8 rounded-lg hover:bg-white/60 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{format(parseISO(exam.date), 'MMMM d, yyyy')}</span>
                  </div>

                  {exam.coverageTopics.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Coverage Topics:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {exam.coverageTopics.slice(0, 3).map((topic, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-white/60 text-gray-700 text-xs rounded-lg border-gray-200"
                          >
                            {topic}
                          </Badge>
                        ))}
                        {exam.coverageTopics.length > 3 && (
                          <Badge
                            variant="secondary"
                            className="bg-white/60 text-gray-700 text-xs rounded-lg border-gray-200"
                          >
                            +{exam.coverageTopics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Exams */}
      {pastExams.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Past Exams</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastExams.map((exam) => (
              <Card
                key={exam.id}
                className="bg-white/60 backdrop-blur-md border-white/20 shadow-[0_4px_16px_rgba(31,38,135,0.06)] rounded-2xl opacity-75"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-700">
                        {exam.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500 mt-1">
                        {exam.course.code} - {exam.course.name}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExam(exam.id)}
                      className="h-8 w-8 rounded-lg hover:bg-white/60 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{format(parseISO(exam.date), 'MMMM d, yyyy')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {exams.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No exams scheduled</p>
            <p className="text-gray-500 text-sm mb-6">
              Add your upcoming exams to help prioritize your learning objectives
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Exam
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingExam && (
        <ExamDialog
          exam={{
            ...editingExam,
            date: parseISO(editingExam.date),
          }}
          courses={courses}
          onSubmit={handleUpdateExam}
          open={!!editingExam}
          onOpenChange={(open) => !open && setEditingExam(null)}
        />
      )}
    </div>
  )
}
