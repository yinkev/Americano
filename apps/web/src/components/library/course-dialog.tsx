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
import { FolderPlus, Palette } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(100, 'Course name must be 100 characters or less'),
  code: z.string().max(20, 'Course code must be 20 characters or less').optional(),
  color: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Course {
  id: string
  name: string
  code: string | null
  color: string | null
}

interface CourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
  onSuccess: () => void
}

const COURSE_COLORS = [
  'oklch(0.75 0.12 240)', // Primary Blue
  'oklch(0.70 0.15 150)', // Secondary Green
  'oklch(0.78 0.13 340)', // Accent Pink
  'oklch(0.8 0.15 90)',   // Warning Yellow
  'oklch(0.7 0.15 290)',   // Purple
  'oklch(0.7 0.15 50)',    // Orange
]

export function CourseDialog({ open, onOpenChange, course, onSuccess }: CourseDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      color: COURSE_COLORS[0],
    },
  })

  useEffect(() => {
    if (course) {
      form.reset({
        name: course.name,
        code: course.code || '',
        color: course.color || COURSE_COLORS[0],
      })
    } else {
      form.reset({
        name: '',
        code: '',
        color: COURSE_COLORS[0],
      })
    }
  }, [course, form, open])

  const onSubmit = async (values: FormValues) => {
    // Submit logic
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card  rounded-xl border-border/50 shadow-none-2xl">
        {/* I would add a motion.div here for a playful entrance animation */}
        <DialogHeader className="p-6 text-center">
            <div className="mx-auto w-fit p-3 bg-card rounded-xl mb-4">
                <FolderPlus className="w-10 h-10 text-primary" />
            </div>
          <DialogTitle className="text-3xl font-heading">{course ? 'Edit Course' : 'Create a New Course'}</DialogTitle>
          <DialogDescription className="text-lg">Organize your lectures and notes into courses for better tracking.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Course Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cardiovascular Block" {...field} className="h-14 text-lg rounded-full bg-card border-none focus:ring-2 focus:ring-primary" />
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
                  <FormLabel className="text-lg font-semibold">Course Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CARD-501" {...field} className="h-14 text-lg rounded-full bg-card border-none focus:ring-2 focus:ring-primary" />
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
                  <FormLabel className="text-lg font-semibold flex items-center gap-2"><Palette /> Course Color</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-6 gap-3 pt-2">
                      {COURSE_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`h-12 w-full rounded-full border-4 transition-all duration-300 ${field.value === color ? 'border-primary scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full text-lg px-6 py-3">Cancel</Button>
                <Button type="submit" className="rounded-full text-lg px-6 py-3">{course ? 'Save Changes' : 'Create Course'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
