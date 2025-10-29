/* Minimal example hooks using TanStack Query (safe scaffold) */
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { apiFetch } from './client'
import { endpoints } from './endpoints'
import { qk } from './queryKeys'

type HealthResponse = { service?: string; status: string }

export function useHealth(options?: UseQueryOptions<HealthResponse>) {
  return useQuery<HealthResponse>({
    queryKey: qk.health(),
    queryFn: () => apiFetch<HealthResponse>(endpoints.health()),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

// Add additional hooks incrementally as endpoints are confirmed.

