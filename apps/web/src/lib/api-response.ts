// API response utilities
// Standardized response format for all API endpoints

export type SuccessResponse<T> = {
  success: true
  data: T
}

export type ErrorResponse = {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

/**
 * Create a standardized success response
 * @param data - The response payload
 * @returns Formatted success response
 *
 * @example
 * return Response.json(successResponse({ user }));
 */
export function successResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  }
}

/**
 * Create a standardized error response
 * @param code - Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @returns Formatted error response
 *
 * @example
 * return Response.json(
 *   errorResponse('NOT_FOUND', 'User not found'),
 *   { status: 404 }
 * );
 */
export function errorResponse(code: string, message: string, details?: unknown): ErrorResponse {
  const error: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  }

  if (details) {
    error.error.details = details
  }

  return error
}

/**
 * Standard error codes used across the API
 */
export const ErrorCodes = {
  // Client errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Operation-specific errors
  FETCH_FAILED: 'FETCH_FAILED',
  CREATE_FAILED: 'CREATE_FAILED',
  UPDATE_FAILED: 'UPDATE_FAILED',
  DELETE_FAILED: 'DELETE_FAILED',
} as const

/**
 * Map HTTP status codes to error responses
 */
export function getErrorResponseForStatus(status: number, message?: string): ErrorResponse {
  const defaultMessages: Record<number, { code: string; message: string }> = {
    400: { code: ErrorCodes.BAD_REQUEST, message: 'Bad request' },
    401: { code: ErrorCodes.UNAUTHORIZED, message: 'Unauthorized' },
    403: { code: ErrorCodes.FORBIDDEN, message: 'Forbidden' },
    404: { code: ErrorCodes.NOT_FOUND, message: 'Resource not found' },
    409: { code: ErrorCodes.CONFLICT, message: 'Resource conflict' },
    500: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal server error' },
  }

  const defaultError = defaultMessages[status] || defaultMessages[500]

  return errorResponse(defaultError.code, message || defaultError.message)
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = ErrorCodes.INTERNAL_ERROR,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Higher-order function to wrap route handlers with error handling
 * Based on Next.js 15 App Router best practices (verified via context7 MCP)
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (error: any) {
      // Log full error with stack trace for debugging
      console.error('========== API ERROR ==========')
      console.error('Error:', error)
      console.error('Error Name:', error?.name)
      console.error('Error Message:', error?.message)
      if (error?.stack) {
        console.error('Stack Trace:', error.stack)
      }
      if (error?.cause) {
        console.error('Cause:', error.cause)
      }
      console.error('==============================')

      // Handle Zod validation errors
      if (error?.name === 'ZodError' || error?.issues) {
        return Response.json(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Validation failed',
            error.issues || error.errors,
          ),
          { status: 400 },
        )
      }

      // Handle custom ApiError instances
      if (error instanceof ApiError) {
        return Response.json(errorResponse(error.code, error.message), { status: error.statusCode })
      }

      // Handle Prisma errors
      if (error?.code && typeof error.code === 'string' && error.code.startsWith('P')) {
        return Response.json(
          errorResponse(
            ErrorCodes.DATABASE_ERROR,
            `Database error: ${error.message || 'Unknown database error'}`,
          ),
          { status: 500 },
        )
      }

      // Default to 500 for unexpected errors with more detail
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      return Response.json(errorResponse(ErrorCodes.INTERNAL_ERROR, errorMessage), { status: 500 })
    }
  }) as T
}
