/**
 * TypeScript wrapper for Python FailurePatternDetector service.
 *
 * Story 4.3 Task 6: Failure Pattern Detector
 * Implements AC#6: Performance Pattern Analysis
 *
 * This file provides a TypeScript interface to the Python pattern detection service.
 * In production, this would:
 * 1. Query Prisma for user's failed ValidationResponse records
 * 2. Transform to format expected by Python service
 * 3. Call Python API endpoint
 * 4. Store detected patterns in database
 * 5. Return patterns for UI display
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas (Type-safe validation)
// ============================================================================

/**
 * Schema for a single failure record (from ValidationResponse).
 */
export const ControlledFailureRecordSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  objective_id: z.string(),
  prompt_id: z.string(),
  is_correct: z.boolean(),
  score: z.number().min(0).max(1),
  confidence_level: z.number().int().min(1).max(5).nullable(),
  responded_at: z.string().datetime(), // ISO datetime string

  // Metadata for pattern detection
  concept_name: z.string().nullable(),
  course_name: z.string().nullable(),
  topic_tags: z.array(z.string()),
  board_exam_tags: z.array(z.string()),
});

export type ControlledFailureRecord = z.infer<typeof ControlledFailureRecordSchema>;

/**
 * Schema for detected failure pattern.
 */
export const FailurePatternSchema = z.object({
  id: z.string().nullable(),
  user_id: z.string(),
  pattern_type: z.string(), // 'category', 'systematic_error', 'topic', 'board_exam_tag'
  pattern_description: z.string(),
  affected_objectives: z.array(z.string()),
  frequency: z.number().int().min(1),
  remediation: z.string(),
  detected_at: z.string().datetime(),
});

export type FailurePattern = z.infer<typeof FailurePatternSchema>;

/**
 * Schema for pattern detection request.
 */
export const PatternDetectionRequestSchema = z.object({
  user_id: z.string(),
  min_frequency: z.number().int().min(1).default(3),
});

export type PatternDetectionRequest = z.infer<typeof PatternDetectionRequestSchema>;

/**
 * Schema for pattern detection response.
 */
export const PatternDetectionResponseSchema = z.object({
  patterns: z.array(FailurePatternSchema),
  total_patterns: z.number().int().min(0),
  detection_timestamp: z.string().datetime(),
});

export type PatternDetectionResponse = z.infer<typeof PatternDetectionResponseSchema>;

// ============================================================================
// Python Service Client
// ============================================================================

const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

/**
 * Client for interacting with Python FailurePatternDetector service.
 */
export class FailurePatternDetectorClient {
  private baseUrl: string;

  constructor(baseUrl: string = PYTHON_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Detect failure patterns for a user.
   *
   * This method:
   * 1. Queries Prisma for user's failed ValidationResponse records
   * 2. Transforms to ControlledFailureRecord format
   * 3. Calls Python API endpoint
   * 4. Returns detected patterns
   *
   * Note: In production, you would also store patterns in database.
   *
   * @param userId - User ID to analyze
   * @param minFrequency - Minimum failure frequency to consider a pattern (default: 3)
   * @returns Detected patterns
   * @throws Error if API call fails
   */
  async detectPatterns(
    userId: string,
    minFrequency: number = 3
  ): Promise<FailurePattern[]> {
    try {
      // In production, fetch failures from Prisma here
      // For now, this demonstrates the integration pattern
      const failures = await this.fetchFailuresFromDatabase(userId);

      // Call Python service
      const response = await fetch(`${this.baseUrl}/challenge/detect-patterns-with-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          failures,
          min_frequency: minFrequency,
          lookback_days: 30,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Pattern detection failed: ${error.detail || response.statusText}`);
      }

      const data = await response.json();

      // Validate response
      const validated = PatternDetectionResponseSchema.parse(data);

      // In production, store patterns in database here
      // await this.storePatternsInDatabase(validated.patterns);

      return validated.patterns;
    } catch (error) {
      console.error('Failed to detect patterns:', error);
      throw error;
    }
  }

  /**
   * Fetch user's failed validation attempts from database.
   *
   * This is a placeholder - in production, this would query Prisma:
   *
   * ```typescript
   * const failures = await prisma.validationResponse.findMany({
   *   where: {
   *     userId,
   *     score: { lt: 0.6 }, // Score < 60% = failure
   *     respondedAt: { gte: thirtyDaysAgo }
   *   },
   *   include: {
   *     prompt: {
   *       include: {
   *         learningObjective: {
   *           include: {
   *             lecture: {
   *               include: { course: true }
   *             }
   *           }
   *         }
   *       }
   *     }
   *   }
   * });
   * ```
   *
   * @param userId - User ID
   * @returns Array of failure records
   */
  private async fetchFailuresFromDatabase(
    userId: string
  ): Promise<ControlledFailureRecord[]> {
    // TODO: Implement Prisma query
    // For now, return empty array (testing with Python service directly)
    console.warn('fetchFailuresFromDatabase not yet implemented - requires Prisma integration');
    return [];
  }

  /**
   * Store detected patterns in database.
   *
   * This is a placeholder - in production, this would:
   *
   * ```typescript
   * await prisma.failurePattern.createMany({
   *   data: patterns.map(p => ({
   *     userId: p.user_id,
   *     patternType: p.pattern_type,
   *     patternDescription: p.pattern_description,
   *     affectedObjectives: p.affected_objectives,
   *     frequency: p.frequency,
   *     remediation: p.remediation,
   *     detectedAt: new Date(p.detected_at)
   *   })),
   *   skipDuplicates: true
   * });
   * ```
   *
   * @param patterns - Detected patterns to store
   */
  private async storePatternsInDatabase(patterns: FailurePattern[]): Promise<void> {
    // TODO: Implement Prisma mutation
    console.warn('storePatternsInDatabase not yet implemented - requires Prisma schema extension');
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Detect failure patterns for a user (convenience wrapper).
 *
 * @param userId - User ID to analyze
 * @param minFrequency - Minimum failure frequency (default: 3)
 * @returns Detected patterns
 */
export async function detectFailurePatterns(
  userId: string,
  minFrequency: number = 3
): Promise<FailurePattern[]> {
  const client = new FailurePatternDetectorClient();
  return client.detectPatterns(userId, minFrequency);
}

/**
 * Get top failure patterns for display in "Common Pitfalls" dashboard.
 *
 * @param userId - User ID
 * @param limit - Maximum number of patterns to return (default: 5)
 * @returns Top patterns ranked by frequency
 */
export async function getTopFailurePatterns(
  userId: string,
  limit: number = 5
): Promise<FailurePattern[]> {
  const patterns = await detectFailurePatterns(userId);
  return patterns.slice(0, limit);
}
