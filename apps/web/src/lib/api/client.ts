/* Minimal API client wrapper (scaffold). Safe to merge. */
import { toApiError } from './errors'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type JsonValue = unknown
export type Query = Record<string, string | number | boolean | null | undefined>

function buildQuery(query?: Query): string {
  if (!query) return ''
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue
    sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

async function request<T = JsonValue>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  opts: { query?: Query; body?: unknown; init?: RequestInit } = {},
): Promise<T> {
  const { query, body, init } = opts
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}${buildQuery(query)}`
  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(body != null ? { 'Content-Type': 'application/json' } : {}),
    ...init?.headers,
  }
  const resp = await fetch(url, {
    method,
    body: body != null ? JSON.stringify(body) : undefined,
    ...init,
    headers,
  })
  if (!resp.ok) throw await toApiError(resp)
  const ct = resp.headers.get('Content-Type') || ''
  if (ct.includes('application/json')) return (await resp.json()) as T
  // @ts-expect-error allow text fallback for generic
  return (await resp.text()) as T
}

export const api = {
  get: <T = JsonValue>(path: string, query?: Query, init?: RequestInit) => request<T>('GET', path, { query, init }),
  post: <T = JsonValue>(path: string, body?: unknown, init?: RequestInit) => request<T>('POST', path, { body, init }),
  put: <T = JsonValue>(path: string, body?: unknown, init?: RequestInit) => request<T>('PUT', path, { body, init }),
  patch: <T = JsonValue>(path: string, body?: unknown, init?: RequestInit) => request<T>('PATCH', path, { body, init }),
  delete: <T = JsonValue>(path: string, query?: Query, init?: RequestInit) => request<T>('DELETE', path, { query, init }),
}

export const apiBase = API_BASE
