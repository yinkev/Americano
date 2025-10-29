/* Query key helpers for TanStack Query */
export const qk = {
  health: () => ['health'] as const,
  challenges: {
    list: (params?: Record<string, unknown>) => ['challenges', 'list', params ?? null] as const,
    byId: (id: string) => ['challenges', id] as const,
  },
  validation: {
    run: (id: string) => ['validation', 'run', id] as const,
  },
  analytics: {
    summary: (scope: string = 'default') => ['analytics', 'summary', scope] as const,
  },
}

export type QueryKey = ReturnType<typeof qk.health>

