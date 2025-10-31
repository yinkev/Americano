/**
 * Mock data metadata helper
 *
 * Provides a consistent structure that all analytics endpoints can attach to
 * their responses so that clients can surface the "Mock data" affordance.
 */

export type MockAnalyticsMetadata = {
  /** Indicates that this payload is backed by demo/mock data */
  isMockData: true
  /** Stable identifier for the mock dataset */
  dataSource: 'prisma.seed.analytics'
  /** Release identifier for the mock analytics bundle */
  datasetVersion: string
  /** ISO timestamp describing when the mock payload was generated */
  generatedAt: string
  /** API surface that produced the payload (for debugging provenance) */
  endpoint: string
  /** Optional developer notes shown in documentation/UI tooltips */
  notes: string
}

const DEFAULT_NOTES =
  'Demo analytics seeded from prisma fixtures – swap to production pipeline before launch.'

/**
 * Create metadata object describing a mock analytics payload.
 */
export function createMockAnalyticsMetadata(
  options: {
    endpoint: string
    datasetVersion?: string
    notes?: string
  },
): MockAnalyticsMetadata {
  const { endpoint, datasetVersion = 'v1-demo', notes = DEFAULT_NOTES } = options

  return {
    isMockData: true,
    dataSource: 'prisma.seed.analytics',
    datasetVersion,
    generatedAt: new Date().toISOString(),
    endpoint,
    notes,
  }
}
