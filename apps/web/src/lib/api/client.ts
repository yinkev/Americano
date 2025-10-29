/* Minimal API client wrapper (scaffold). Safe to merge. */
import { ApiError, toApiError } from './errors'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type JsonValue = unknown

export async function apiFetch<T = JsonValue>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  const headers: HeadersInit = {
    'Accept': 'application/json',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...init.headers,
  }

  const resp = await fetch(url, { ...init, headers })
  if (!resp.ok) throw await toApiError(resp)

  // Try JSON; fall back to text
  const ct = resp.headers.get('Content-Type') || ''
  if (ct.includes('application/json')) return (await resp.json()) as T
  // @ts-expect-error allow text fallback for generic
  return (await resp.text()) as T
}

export const apiBase = API_BASE

