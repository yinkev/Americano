'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Course name is required')
    .max(100, 'Course name must be 100 characters or less'),
  code: z.string().max(20, 'Course code must be 20 characters or less').optional(),
  term: z.string().optional(),
  color: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Course {
  id: string
  name: string
  code: string | null
  term: string | null
  color: string | null
}

interface CourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
  onSuccess: () => void
}

// Preset OKLCH colors for courses
const COURSE_COLORS = [
  { name: 'Blue', value: 'oklch(0.7 0.15 230)' },
  { name: 'Green', value: 'oklch(0.7 0.15 150)' },
  { name: 'Red', value: 'oklch(0.7 0.15 20)' },
  { name: 'Purple', value: 'oklch(0.7 0.15 290)' },
  { name: 'Orange', value: 'oklch(0.7 0.15 50)' },
  { name: 'Teal', value: 'oklch(0.7 0.15 180)' },
  { name: 'Pink', value: 'oklch(0.7 0.15 340)' },
  { name: 'Yellow', value: 'oklch(0.8 0.15 90)' },
  { name: 'Cyan', value: 'oklch(0.7 0.15 200)' },
  { name: 'Indigo', value: 'oklch(0.6 0.15 270)' },
]

export function CourseDialog({ open, onOpenChange, course, onSuccess }: CourseDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      term: '',
      color: COURSE_COLORS[0].value,
    },
  })

  useEffect(() => {
    if (course) {
      form.reset({
        name: course.name,
        code: course.code || '',
        term: course.term || '',
        color: course.color || COURSE_COLORS[0].value,
      })
    } else {
      form.reset({
        name: '',
        code: '',
        term: '',
        color: COURSE_COLORS[0].value,
      })
    }
  }, [course, form, open])

  const onSubmit = async (values: FormValues) => {
    try {
      const url = course ? `/api/content/courses/${course.id}` : '/api/content/courses'

      const method = course ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          code: values.code?.trim() || null,
          term: values.term?.trim() || null,
          color: values.color || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(course ? 'Course updated successfully' : 'Course created successfully')
        onSuccess()
      } else {
        toast.error(data.error?.message || 'Failed to save course')
      }
    } catch (error) {
      toast.error('Failed to save course')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{course ? 'Edit Course' : 'Add Course'}</DialogTitle>
          <DialogDescription>
            {course ? 'Update course information' : 'Create a new course to organize your lectures'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Gross Anatomy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input placeholder="ANAT 505" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="term"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <FormControl>
                    <Input placeholder="Fall 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-5 gap-2">
                      {COURSE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => field.onChange(color.value)}
                          className={`
                            h-10 w-full rounded-md border-2 transition-all
                            ${field.value === color.value ? 'border-foreground scale-110' : 'border-transparent'}
                          `}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{course ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
