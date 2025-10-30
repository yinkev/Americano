import type { AnalyticsHealth } from '@americano/api-client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { endpoints } from '@/lib/api/endpoints'

export function useAnalyticsHealth() {
  return useQuery({
    queryKey: ['analytics', 'health'],
    queryFn: () => api.get<AnalyticsHealth>(endpoints.analytics.health()),
    staleTime: 60_000,
  })
}

export function useDailyInsight(userId: string) {
  return useQuery({
    queryKey: ['analytics', 'daily-insight', userId],
    queryFn: () => api.post(endpoints.analytics.dailyInsight(), { user_id: userId }),
  })
}

export function useWeeklySummary(userId: string) {
  return useQuery({
    queryKey: ['analytics', 'weekly-summary', userId],
    queryFn: () => api.post(endpoints.analytics.weeklySummary(), { user_id: userId }),
  })
}
