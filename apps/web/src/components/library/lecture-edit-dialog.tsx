'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TagInput } from './tag-input'

const formSchema = z.object({
  title: z
    .string()
    .min(1, 'Lecture title is required')
    .max(200, 'Title must be 200 characters or less'),
  courseId: z.string().min(1, 'Course is required'),
  weekNumber: z.string().optional(),
  topicTags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
})

type FormValues = z.infer<typeof formSchema>

interface Course {
  id: string
  name: string
  code: string | null
  color: string | null
}

interface Lecture {
  id: string
  title: string
  course: Course
  weekNumber: number | null
  topicTags: string[]
}

interface LectureEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lecture: Lecture
  onSuccess: () => void
}

export function LectureEditDialog({
  open,
  onOpenChange,
  lecture,
  onSuccess,
}: LectureEditDialogProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [generatingTags, setGeneratingTags] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: lecture.title,
      courseId: lecture.course.id,
      weekNumber: lecture.weekNumber?.toString() || '',
      topicTags: lecture.topicTags,
    },
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (open) {
      form.reset({
        title: lecture.title,
        courseId: lecture.course.id,
        weekNumber: lecture.weekNumber?.toString() || '',
        topicTags: lecture.topicTags,
      })
    }
  }, [open, lecture, form])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/content/courses')
      const result = await response.json()
      if (result.success) {
        setCourses(result.data.courses)
      }
    } catch (error) {
      toast.error('Failed to load courses')
    }
  }

  const handleAutoGenerateTags = async () => {
    setGeneratingTags(true)
    try {
      const response = await fetch('/api/ai/generate-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId: lecture.id }),
      })

      const result = await response.json()

      if (result.success) {
        const newTags = result.data.tags
        form.setValue('topicTags', newTags)
        toast.success(`Generated ${newTags.length} tags`)
      } else {
        toast.error(result.error?.message || 'Failed to generate tags')
      }
    } catch (error) {
      toast.error('Failed to generate tags')
    } finally {
      setGeneratingTags(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch(`/api/content/lectures/${lecture.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title.trim(),
          courseId: values.courseId,
          weekNumber: values.weekNumber ? parseInt(values.weekNumber, 10) : null,
          topicTags: values.topicTags,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Lecture updated successfully')
        onSuccess()
      } else {
        toast.error(data.error?.message || 'Failed to update lecture')
      }
    } catch (error) {
      toast.error('Failed to update lecture')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Lecture</DialogTitle>
          <DialogDescription>Update lecture metadata and organization</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Lecture title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code ? `${course.code} - ${course.name}` : course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weekNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Week Number</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="52" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topicTags"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Topic Tags</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAutoGenerateTags}
                      disabled={generatingTags}
                      className="h-7 text-xs"
                    >
                      {generatingTags ? (
                        <>
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1.5 h-3 w-3" />
                          Auto-generate
                        </>
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <TagInput value={field.value} onChange={field.onChange} maxTags={10} />
                  </FormControl>
                  <FormDescription>
                    Add up to 10 topic tags, or use AI to generate them automatically
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
