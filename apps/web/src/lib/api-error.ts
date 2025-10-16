// API error handling utilities
// Custom error class and error handling patterns

/**
 * Custom API error class with HTTP status code
 * Use this to throw errors that should be caught and formatted
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message: string = 'Unauthorized', details?: unknown): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message, details);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message: string = 'Forbidden', details?: unknown): ApiError {
    return new ApiError(403, 'FORBIDDEN', message, details);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(resource: string = 'Resource', details?: unknown): ApiError {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`, details);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message: string, details?: unknown): ApiError {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  /**
   * Create a 422 Validation Error
   */
  static validation(message: string, details?: unknown): ApiError {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(message: string = 'Internal server error', details?: unknown): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message, details);
  }
}

/**
 * Handle Prisma errors and convert to ApiError
 */
export function handlePrismaError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return ApiError.conflict(
          'A record with this value already exists',
          { field: prismaError.meta?.target }
        );

      case 'P2025': // Record not found
        return ApiError.notFound('Record');

      case 'P2003': // Foreign key constraint violation
        return ApiError.badRequest(
          'Invalid reference to related record',
          { field: prismaError.meta?.field_name }
        );

      case 'P2014': // Required relation violation
        return ApiError.badRequest(
          'Required relation missing',
          { relation: prismaError.meta?.relation_name }
        );

      default:
        return ApiError.internal('Database operation failed', { code: prismaError.code });
    }
  }

  return ApiError.internal('Unknown database error');
}

/**
 * Async error handler wrapper for API routes
 * Catches errors and formats them as standardized error responses
 *
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const user = await prisma.user.findUnique(...);
 *   if (!user) throw ApiError.notFound('User');
 *   return Response.json(successResponse(user));
 * });
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);

      // Handle ApiError instances
      if (error instanceof ApiError) {
        const responseBody: any = {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
        if (error.details) {
          responseBody.error.details = error.details;
        }
        return Response.json(responseBody, { status: error.statusCode });
      }

      // Handle Prisma errors
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = handlePrismaError(error);
        const responseBody: any = {
          success: false,
          error: {
            code: apiError.code,
            message: apiError.message,
          },
        };
        if (apiError.details) {
          responseBody.error.details = apiError.details;
        }
        return Response.json(responseBody, { status: apiError.statusCode });
      }

      // Handle generic errors
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return Response.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message,
          },
        },
        { status: 500 }
      );
    }
  }) as T;
}
