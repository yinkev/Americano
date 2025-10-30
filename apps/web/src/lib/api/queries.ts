/* Minimal example hooks using TanStack Query (safe scaffold) */
import { type UseQueryOptions, useQuery } from '@tanstack/react-query'
import { api } from './client'
import { endpoints } from './endpoints'
import { queryKeys } from './queryKeys'

type HealthResponse = { service?: string; status: string }

export function useHealth(options?: UseQueryOptions<HealthResponse>) {
  return useQuery<HealthResponse>({
    queryKey: queryKeys.health(),
    queryFn: () => api.get<HealthResponse>(endpoints.health()),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

// Add additional hooks incrementally as endpoints are confirmed.

type AnalyticsSummary = unknown // TODO: replace with generated type

export function useAnalyticsSummary(options?: UseQueryOptions<AnalyticsSummary>) {
  return useQuery<AnalyticsSummary>({
    queryKey: queryKeys.analytics('summary'),
    queryFn: () => api.get<AnalyticsSummary>(endpoints.analytics()),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}
