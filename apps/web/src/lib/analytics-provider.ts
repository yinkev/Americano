import type { NextRequest } from 'next/server'

export type AnalyticsProvider = 'mock' | 'legacy'

const ANALYTICS_PROVIDER_HEADER = 'x-analytics-provider'
const DEFAULT_PROVIDER: AnalyticsProvider = 'mock'

type RequestLike = Pick<NextRequest, 'headers'>

function normalizeProvider(value: string | null | undefined): AnalyticsProvider | null {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized === 'mock') return 'mock'
  if (normalized === 'legacy') return 'legacy'
  return null
}

export function resolveAnalyticsProvider(request?: RequestLike): AnalyticsProvider {
  const headerProvider = request ? normalizeProvider(request.headers.get(ANALYTICS_PROVIDER_HEADER)) : null
  if (headerProvider) {
    return headerProvider
  }

  const envProvider = normalizeProvider(process.env.ANALYTICS_PROVIDER)
  if (envProvider) {
    return envProvider
  }

  return DEFAULT_PROVIDER
}

export function usingMockAnalytics(request?: RequestLike): boolean {
  return resolveAnalyticsProvider(request) === 'mock'
}
