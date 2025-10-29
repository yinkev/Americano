/* Centralized endpoint path builders.
 * TODO: Align each path with FastAPI routers once confirmed.
 */
export const endpoints = {
  // Health
  health: () => '/health',

  // Analytics (placeholder)
  analytics: (id?: string) => (id ? `/analytics/${id}` : '/analytics/summary'),

  // Predictions (ML service placeholder)
  predictions: () => '/ml/predictions/struggle',

  // Interventions (ML service placeholder)
  interventions: () => '/ml/interventions',

  // Validation (examples)
  validation: {
    runs: () => '/validation/runs',
    run: (id: string) => `/validation/runs/${id}`,
  },
} as const

export type Endpoint = ReturnType<typeof endpoints.health>
