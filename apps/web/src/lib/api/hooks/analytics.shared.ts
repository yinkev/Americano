export type DataSource = 'api' | 'mock'

export interface SourceMeta {
  source: DataSource
}

export type SourceTagged<T extends Record<string, unknown> | any[]> = T & SourceMeta

export function attachSource<T extends Record<string, unknown> | any[]>(
  data: T,
  source: DataSource,
): SourceTagged<T> {
  if (Array.isArray(data)) {
    const clone = [...data] as SourceTagged<T>
    ;(clone as unknown as SourceMeta).source = source
    return clone
  }
  return { ...data, source } as SourceTagged<T>
}

export function getDataSource(value: unknown): DataSource | undefined {
  if (value && typeof value === 'object' && 'source' in value) {
    const source = (value as { source?: unknown }).source
    if (source === 'api' || source === 'mock') {
      return source
    }
  }
  return undefined
}

export function isMockSource(value: unknown): value is SourceMeta {
  return getDataSource(value) === 'mock'
}

export interface SuccessProbabilityResponse {
  objective_id: string
  planned_study_hours: number
  success_probability: number
  confidence_level: 'high' | 'medium' | 'low'
}

export type AnalyticsDateRange = '7d' | '30d' | '90d' | '1y' | 'all'
