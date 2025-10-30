/**
 * Challenge Identifier Client (Story 4.3 Task 2)
 *
 * TypeScript wrapper for Python Challenge Identification service.
 * Identifies vulnerable concepts for targeted challenge generation.
 */

export interface PerformanceRecord {
  objective_id: string
  objective_text: string
  confidence_level: number // 1-5 scale
  comprehension_score: number // 0-100 scale
  is_failure?: boolean
  attempted_at: string // ISO datetime string
}

export interface VulnerableConceptScore {
  concept_id: string
  concept_name: string
  vulnerability_score: number // 0-100
  vulnerability_type: 'overconfidence' | 'partial_understanding' | 'recent_mistakes'
  overconfidence_score: number
  partial_understanding_score: number
  recent_mistakes_score: number
  avg_confidence: number
  avg_comprehension_score: number
  failure_count: number
  last_attempted_at: string | null
}

export interface ChallengeIdentificationResult {
  vulnerable_concepts: VulnerableConceptScore[]
  user_id: string
  identified_at: string
}

export interface ChallengeIdentificationRequest {
  user_id: string
  performance_data: PerformanceRecord[]
  limit?: number // Default: 5
}

/**
 * Call Python FastAPI service to identify vulnerable concepts.
 *
 * @param request - Challenge identification request with user ID and performance data
 * @returns Top vulnerable concepts ranked by score
 */
export async function identifyVulnerableConcepts(
  request: ChallengeIdentificationRequest,
): Promise<ChallengeIdentificationResult> {
  const apiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'

  const response = await fetch(`${apiUrl}/validation/challenge/identify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(`Challenge identification failed: ${error.detail || response.statusText}`)
  }

  return response.json()
}

/**
 * Get vulnerability type label for UI display.
 */
export function getVulnerabilityTypeLabel(
  type: VulnerableConceptScore['vulnerability_type'],
): string {
  const labels = {
    overconfidence: 'Overconfidence',
    partial_understanding: 'Partial Understanding',
    recent_mistakes: 'Recent Mistakes',
  }
  return labels[type] || type
}

/**
 * Get vulnerability type description for UI tooltips.
 */
export function getVulnerabilityTypeDescription(
  type: VulnerableConceptScore['vulnerability_type'],
): string {
  const descriptions = {
    overconfidence:
      'High confidence but low performance - knowledge gaps masked by false confidence',
    partial_understanding: 'Score 60-79% - has basics but missing depth and application',
    recent_mistakes: '3+ failures in last 7 days - recurring errors that need addressing',
  }
  return descriptions[type] || 'Concept identified as vulnerable for challenge'
}

/**
 * Get vulnerability score color for UI (OKLCH color space).
 */
export function getVulnerabilityScoreColor(score: number): string {
  // Orange for challenge mode (Story 4.3 constraint #8)
  if (score >= 70) {
    return 'oklch(0.72 0.16 45)' // High vulnerability - bright orange
  } else if (score >= 50) {
    return 'oklch(0.75 0.14 50)' // Medium vulnerability - medium orange
  } else {
    return 'oklch(0.78 0.12 55)' // Low vulnerability - light orange
  }
}
