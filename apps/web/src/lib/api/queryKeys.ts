/* Query key helpers for TanStack Query */
export const queryKeys = {
  health: () => ['health'] as const,
  analytics: (id: string = 'summary') => ['analytics', id] as const,
  predictions: (userId?: string) => ['predictions', userId ?? 'self'] as const,
  interventions: (targetId?: string) => ['interventions', targetId ?? 'default'] as const,
  validation: {
    run: (id: string) => ['validation', 'run', id] as const,
  },
}

export type QueryKey = ReturnType<typeof queryKeys.health>
