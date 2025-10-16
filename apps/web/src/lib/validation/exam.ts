/**
 * Zod Validation Schemas for Exam Management
 * Story 2.3: Intelligent Content Prioritization Algorithm
 */

import { z } from 'zod'

/**
 * Create Exam Schema
 */
export const createExamSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Exam date must be in the future',
  }),
  courseId: z.string().cuid(),
  coverageTopics: z
    .array(z.string().min(1).max(100))
    .min(1, 'At least one coverage topic is required')
    .max(20, 'Maximum 20 coverage topics allowed'),
})

export type CreateExamInput = z.infer<typeof createExamSchema>

/**
 * Update Exam Schema
 */
export const updateExamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  date: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      message: 'Exam date must be in the future',
    })
    .optional(),
  coverageTopics: z
    .array(z.string().min(1).max(100))
    .min(1)
    .max(20)
    .optional(),
})

export type UpdateExamInput = z.infer<typeof updateExamSchema>

/**
 * Set Course Priority Schema
 */
export const setCoursePrioritySchema = z.object({
  priorityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
})

export type SetCoursePriorityInput = z.infer<typeof setCoursePrioritySchema>

/**
 * Priority Feedback Schema
 */
export const priorityFeedbackSchema = z.object({
  objectiveId: z.string().cuid(),
  userFeedback: z.enum(['TOO_HIGH', 'JUST_RIGHT', 'TOO_LOW']),
  notes: z.string().max(500).optional(),
})

export type PriorityFeedbackInput = z.infer<typeof priorityFeedbackSchema>

/**
 * Priority Query Filters Schema
 */
export const priorityFiltersSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  courseId: z.string().cuid().optional(),
  minPriority: z.coerce.number().min(0).max(1).optional().default(0),
  excludeRecent: z.coerce.boolean().optional().default(false),
})

export type PriorityFiltersInput = z.infer<typeof priorityFiltersSchema>
