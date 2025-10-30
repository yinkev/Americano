/* Centralized endpoint path builders.
 * TODO: Align each path with FastAPI routers once confirmed.
 */
export const endpoints = {
  // Service health
  health: () => '/health',

  // Analytics (FastAPI analytics router)
  analytics: {
    health: () => '/analytics/health',
    dailyInsight: () => '/analytics/daily-insight',
    weeklySummary: () => '/analytics/weekly-summary',
  },

  // Validation
  validation: {
    generatePrompt: () => '/validation/generate-prompt',
    evaluate: () => '/validation/evaluate',
    scenarioMetrics: () => '/validation/scenarios/metrics',
  },

  // Challenge
  challenge: {
    feedback: () => '/challenge/feedback',
    scheduleRetries: () => '/challenge/schedule-retries',
  },

  // Adaptive
  adaptive: {
    nextQuestion: () => '/adaptive/question/next',
    sessionMetrics: (sessionId: string, objectiveId: string) =>
      `/adaptive/session/${encodeURIComponent(sessionId)}/metrics?objective_id=${encodeURIComponent(objectiveId)}`,
  },
} as const

export type Endpoint = ReturnType<typeof endpoints.health>
