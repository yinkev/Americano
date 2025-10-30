/**
 * TypeScript wrapper for RetryScheduler (Story 4.3 Task 5)
 *
 * Calls Python FastAPI service for retry schedule generation.
 * Provides type-safe interface for Next.js API routes and UI components.
 */

// ============================================================================
// Types (mirroring Python Pydantic models)
// ============================================================================

export interface RetryScheduleRequest {
  failure_id: string
  failed_at?: string // ISO datetime string (defaults to now in Python)
}

export interface RetryScheduleResponse {
  failure_id: string
  retry_dates: string[] // Array of ISO date strings [+1d, +3d, +7d, +14d, +30d]
  retry_intervals_days: number[] // [1, 3, 7, 14, 30]
  reasoning: string
  variation_strategy: string
}

export interface RetryProgress {
  status: 'INITIAL_FAILURE' | 'IN_PROGRESS' | 'MASTERED'
  completed_retries: number
  total_retries: number
  remaining_retries: number
  next_retry_date: string | null // ISO date string
  progress_percentage: number
}

// ============================================================================
// Configuration
// ============================================================================

const PYTHON_API_BASE_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'

// ============================================================================
// RetryScheduler Client
// ============================================================================

export class RetryScheduler {
  private baseUrl: string

  // Spaced repetition intervals (matches Python implementation)
  static readonly RETRY_INTERVALS = [1, 3, 7, 14, 30]

  constructor(baseUrl: string = PYTHON_API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Generate retry schedule for a failed challenge.
   *
   * Calls Python FastAPI service which calculates spaced repetition intervals.
   *
   * @param request - RetryScheduleRequest with failure context
   * @returns Promise<RetryScheduleResponse> with retry dates and strategy
   * @throws Error if API call fails
   */
  async scheduleRetries(request: RetryScheduleRequest): Promise<RetryScheduleResponse> {
    const url = `${this.baseUrl}/challenge/schedule-retries`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Retry scheduling failed: ${response.statusText}`)
      }

      const data: RetryScheduleResponse = await response.json()
      return data
    } catch (error) {
      console.error('L RetryScheduler error:', error)
      throw error
    }
  }

  /**
   * Calculate retry progress from retry schedule.
   *
   * Client-side utility to track progress through retry attempts.
   *
   * @param retryDates - Array of retry dates from schedule
   * @param completedRetryCount - Number of retries completed (0-5)
   * @returns RetryProgress object with status and metrics
   */
  calculateProgress(retryDates: string[], completedRetryCount: number): RetryProgress {
    const totalRetries = retryDates.length
    const completed = completedRetryCount
    const remaining = totalRetries - completed

    let status: 'INITIAL_FAILURE' | 'IN_PROGRESS' | 'MASTERED'
    let nextRetryDate: string | null

    if (remaining === 0) {
      status = 'MASTERED'
      nextRetryDate = null
    } else if (completed === 0) {
      status = 'INITIAL_FAILURE'
      nextRetryDate = retryDates[0]
    } else {
      status = 'IN_PROGRESS'
      nextRetryDate = retryDates[completed]
    }

    return {
      status,
      completed_retries: completed,
      total_retries: totalRetries,
      remaining_retries: remaining,
      next_retry_date: nextRetryDate,
      progress_percentage: Math.round((completed / totalRetries) * 100),
    }
  }

  /**
   * Check if a retry is due based on current date.
   *
   * @param retryDates - Array of retry dates from schedule
   * @param completedRetryCount - Number of retries completed
   * @param currentDate - Current date (defaults to today)
   * @returns true if next retry is due, false otherwise
   */
  isRetryDue(
    retryDates: string[],
    completedRetryCount: number,
    currentDate: Date = new Date(),
  ): boolean {
    if (completedRetryCount >= retryDates.length) {
      return false // All retries completed
    }

    const nextRetryDate = new Date(retryDates[completedRetryCount])
    return currentDate >= nextRetryDate
  }

  /**
   * Get next retry date from schedule.
   *
   * @param retryDates - Array of retry dates from schedule
   * @param completedRetryCount - Number of retries completed
   * @returns Next retry date or null if all completed
   */
  getNextRetryDate(retryDates: string[], completedRetryCount: number): Date | null {
    if (completedRetryCount >= retryDates.length) {
      return null
    }
    return new Date(retryDates[completedRetryCount])
  }

  /**
   * Format retry dates for display.
   *
   * @param retryDates - Array of ISO date strings
   * @returns Array of formatted date strings
   */
  formatRetryDates(retryDates: string[]): string[] {
    return retryDates.map((dateStr) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    })
  }

  /**
   * Get time until next retry.
   *
   * @param retryDates - Array of retry dates from schedule
   * @param completedRetryCount - Number of retries completed
   * @param currentDate - Current date (defaults to now)
   * @returns Days until next retry, or null if all completed
   */
  getDaysUntilNextRetry(
    retryDates: string[],
    completedRetryCount: number,
    currentDate: Date = new Date(),
  ): number | null {
    const nextRetryDate = this.getNextRetryDate(retryDates, completedRetryCount)
    if (!nextRetryDate) {
      return null
    }

    const msPerDay = 1000 * 60 * 60 * 24
    const diffMs = nextRetryDate.getTime() - currentDate.getTime()
    const diffDays = Math.ceil(diffMs / msPerDay)

    return diffDays
  }

  /**
   * Validate retry schedule request before sending to API.
   *
   * @param request - RetryScheduleRequest to validate
   * @throws Error if validation fails
   */
  validateRequest(request: RetryScheduleRequest): void {
    if (!request.failure_id || request.failure_id.trim() === '') {
      throw new Error('failure_id is required')
    }

    // Validate failed_at if provided
    if (request.failed_at) {
      const failedDate = new Date(request.failed_at)
      if (isNaN(failedDate.getTime())) {
        throw new Error('failed_at must be a valid ISO datetime string')
      }

      // Ensure failure date is not in the future
      if (failedDate > new Date()) {
        throw new Error('failed_at cannot be in the future')
      }
    }
  }
}

// ============================================================================
// Default Export (Singleton Instance)
// ============================================================================

const retryScheduler = new RetryScheduler()
export default retryScheduler
