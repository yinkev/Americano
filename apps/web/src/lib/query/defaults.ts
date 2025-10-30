// React Query defaults and helpers (scaffold)
export type NormalizedError = {
  status: number
  message?: string
}

export const rqDefaults = {
  queries: {
    staleTime: 30_000, // 30s
    gcTime: 5 * 60_000, // 5m
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: 0,
  },
} as const

export function createKey<Parts extends readonly (string | number | boolean | null | undefined)[]>(
  ...parts: Parts
) {
  return parts.map((p) => (p == null ? 'null' : String(p))) as readonly string[]
}
