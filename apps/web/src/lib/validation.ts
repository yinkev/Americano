// Zod validation schemas for API requests
// Provides type-safe request validation with detailed error messages

import { z } from 'zod'
import { ApiError } from './api-error'

/**
 * Validation helper to parse request body with Zod schema
 * Throws ApiError with validation details if parsing fails
 *
 * @example
 * const data = await validateRequest(request, createCourseSchema);
 */
export async function validateRequest<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiError.validation('Invalid request data', {
        errors: error.issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      })
    }
    throw error
  }
}

/**
 * Validation helper for query parameters
 */
export function validateQuery<T>(searchParams: URLSearchParams, schema: z.ZodSchema<T>): T {
  try {
    // Convert searchParams to plain object
    const params: Record<string, string | string[]> = {}
    searchParams.forEach((value, key) => {
      if (params[key]) {
        // Handle multiple values for same key
        if (Array.isArray(params[key])) {
          ;(params[key] as string[]).push(value)
        } else {
          params[key] = [params[key] as string, value]
        }
      } else {
        params[key] = value
      }
    })

    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiError.validation('Invalid query parameters', {
        errors: error.issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      })
    }
    throw error
  }
}

// ============================================
// USER SCHEMAS
// ============================================

export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
  medicalSchool: z
    .string()
    .max(200, 'Medical school name must be 200 characters or less')
    .optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
})

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>

// ============================================
// COURSE SCHEMAS
// ============================================

export const createCourseSchema = z.object({
  name: z
    .string()
    .min(1, 'Course name is required')
    .max(100, 'Course name must be 100 characters or less'),
  code: z.string().max(20, 'Course code must be 20 characters or less').optional(),
  term: z.string().max(50, 'Term must be 50 characters or less').optional(),
  color: z
    .string()
    .regex(/^oklch\([\d\s._]+\)$/, 'Color must be in OKLCH format')
    .optional(),
})

export const updateCourseSchema = z.object({
  name: z
    .string()
    .min(1, 'Course name is required')
    .max(100, 'Course name must be 100 characters or less')
    .optional(),
  code: z.string().max(20, 'Course code must be 20 characters or less').optional(),
  term: z.string().max(50, 'Term must be 50 characters or less').optional(),
  color: z
    .string()
    .regex(/^oklch\([\d\s._]+\)$/, 'Color must be in OKLCH format')
    .optional(),
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>

// ============================================
// LECTURE SCHEMAS
// ============================================

export const updateLectureSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  courseId: z.string().cuid('Invalid course ID').optional(),
  weekNumber: z.number().int().min(1).max(52).optional(),
  topicTags: z
    .array(z.string().min(1, 'Tag cannot be empty').max(30, 'Tag must be 30 characters or less'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
})

export type UpdateLectureInput = z.infer<typeof updateLectureSchema>

// ============================================
// QUERY PARAMETER SCHEMAS
// ============================================

export const lectureListQuerySchema = z.object({
  courseId: z.string().cuid().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  tags: z
    .string()
    .transform((val) => val.split(',').filter(Boolean))
    .optional(),
  sortBy: z.enum(['uploadedAt', 'title', 'processedAt', 'processingStatus']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('50').transform(Number).pipe(z.number().int().min(1).max(100)),
})

export const courseListQuerySchema = z.object({
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type LectureListQuery = z.infer<typeof lectureListQuerySchema>
export type CourseListQuery = z.infer<typeof courseListQuerySchema>

// ============================================
// UPLOAD SCHEMAS
// ============================================

export const uploadMetadataSchema = z.object({
  courseId: z.string().cuid('Invalid course ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  weekNumber: z.number().int().min(1).max(52).optional(),
  topicTags: z
    .array(z.string().min(1, 'Tag cannot be empty').max(30, 'Tag must be 30 characters or less'))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),
})

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>

// ============================================
// HELPER UTILITIES
// ============================================

/**
 * Helper to validate pagination parameters
 */
export function validatePagination(page: number, limit: number): void {
  if (page < 1 || limit < 1 || limit > 100) {
    throw ApiError.validation('Invalid pagination parameters', {
      page,
      limit,
      constraints: {
        page: 'Must be >= 1',
        limit: 'Must be between 1 and 100',
      },
    })
  }
}

/**
 * Helper to validate sort parameters
 */
export function validateSort(sortBy: string, sortOrder: string, validFields: string[]): void {
  if (!validFields.includes(sortBy)) {
    throw ApiError.validation(`Invalid sort field: ${sortBy}`, {
      validFields,
    })
  }

  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    throw ApiError.validation('Sort order must be asc or desc')
  }
}
