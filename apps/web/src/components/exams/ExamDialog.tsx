/**
 * ExamDialog Component
 * Story 2.3: Task 8 - UI Components
 *
 * Dialog for creating and editing exams with glassmorphism design
 */

'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TagInput } from '@/components/ui/tag-input'
import { createExamSchema, type CreateExamInput } from '@/lib/validation/exam'

// Dynamically import Calendar to avoid SSR issues with DOMMatrix
const Calendar = dynamic(() => import('@/components/ui/calendar').then((mod) => mod.Calendar), {
  ssr: false,
})

interface Course {
  id: string
  name: string
  code: string
}

// Form-specific type with Date instead of Zod coerced type
type ExamFormValues = {
  name: string
  date: Date | undefined
  courseId: string
  coverageTopics: string[]
}

interface ExamDialogProps {
  trigger?: React.ReactNode
  exam?: {
    id: string
    name: string
    date: Date
    courseId: string
    coverageTopics: string[]
  } | null
  courses: Course[]
  onSubmit: (data: CreateExamInput) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ExamDialog({
  trigger,
  exam = null,
  courses,
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ExamDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [internalOpen, setInternalOpen] = React.useState(false)

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(createExamSchema) as any,
    defaultValues: exam
      ? {
          name: exam.name,
          date: exam.date,
          courseId: exam.courseId,
          coverageTopics: exam.coverageTopics,
        }
      : {
          name: '',
          date: undefined,
          courseId: '',
          coverageTopics: [],
        },
  })

  React.useEffect(() => {
    if (open && exam) {
      form.reset({
        name: exam.name,
        date: exam.date,
        courseId: exam.courseId,
        coverageTopics: exam.coverageTopics,
      })
    } else if (!open) {
      form.reset({
        name: '',
        date: undefined,
        courseId: '',
        coverageTopics: [],
      })
    }
  }, [open, exam, form])

  const handleSubmit = async (data: ExamFormValues) => {
    try {
      setIsSubmitting(true)
      // Convert form values to CreateExamInput (date is already Date type)
      await onSubmit(data as CreateExamInput)
      form.reset()
      setOpen(false)
    } catch (error) {
      console.error('Failed to submit exam:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        className={cn(
          'sm:max-w-[525px]',
          'bg-white/95 backdrop-blur-xl border-white/30',
          'shadow-[0_8px_32px_rgba(31,38,135,0.15)]',
          'rounded-2xl',
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {exam ? 'Edit Exam' : 'Add New Exam'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {exam
              ? 'Update exam details and coverage topics'
              : 'Schedule an upcoming exam and specify what topics it will cover'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">
            {/* Exam Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Exam Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Midterm Exam, Final Exam"
                      className={cn(
                        'bg-white/60 backdrop-blur-sm',
                        'border-gray-200 focus:border-blue-400',
                        'rounded-lg transition-all duration-200',
                      )}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Give your exam a descriptive name
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Course Selection */}
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Course</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          'bg-white/60 backdrop-blur-sm',
                          'border-gray-200 focus:border-blue-400',
                          'rounded-lg transition-all duration-200',
                        )}
                      >
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent
                      className={cn(
                        'bg-white/95 backdrop-blur-xl border-white/30',
                        'rounded-xl shadow-lg',
                      )}
                    >
                      {courses.map((course) => (
                        <SelectItem
                          key={course.id}
                          value={course.id}
                          className="cursor-pointer hover:bg-gray-50/80"
                        >
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs text-gray-500">
                    Select the course this exam is for
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Exam Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">Exam Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            'bg-white/60 backdrop-blur-sm',
                            'border-gray-200 hover:border-blue-400',
                            'rounded-lg transition-all duration-200',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className={cn(
                        'w-auto p-0',
                        'bg-white/95 backdrop-blur-xl border-white/30',
                        'rounded-xl shadow-lg',
                      )}
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-xs text-gray-500">
                    When is this exam scheduled?
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Coverage Topics */}
            <FormField
              control={form.control}
              name="coverageTopics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Coverage Topics
                  </FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Type topic and press Enter..."
                      maxTags={20}
                      className={cn('bg-white/60 backdrop-blur-sm', 'transition-all duration-200')}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Add topics that will be covered in this exam (press Enter to add)
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className={cn(
                  'rounded-lg',
                  'border-gray-200 hover:bg-gray-50/80',
                  'transition-all duration-200',
                )}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'rounded-lg',
                  'bg-blue-500 hover:bg-blue-600',
                  'text-white font-medium',
                  'shadow-sm hover:shadow-md',
                  'transition-all duration-200',
                )}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {exam ? 'Update Exam' : 'Create Exam'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
