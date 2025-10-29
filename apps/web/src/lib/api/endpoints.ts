/* Centralized endpoint path builders */
export const endpoints = {
  health: () => '/health',
  validation: {
    runs: () => '/validation/runs',
    run: (id: string) => `/validation/runs/${id}`,
  },
  challenges: {
    root: () => '/challenge',
    byId: (id: string) => `/challenge/${id}`,
  },
  analytics: {
    summary: () => '/analytics/summary',
  },
  adaptive: {
    recommendations: (challengeId: string) => `/adaptive/recommendations?challengeId=${encodeURIComponent(challengeId)}`,
  },
} as const

export type Endpoint = ReturnType<typeof endpoints.health>

