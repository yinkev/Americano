/* API client (timeouts/abort, request id). Safe to merge. */
import { ApiError, toApiError } from './errors'

// Prefer NEXT_PUBLIC_API_BASE_URL; fall back to legacy NEXT_PUBLIC_API_URL; default to '/api'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '/api'

export type JsonValue = unknown
export type Query = Record<string, string | number | boolean | null | undefined>

const DEFAULT_TIMEOUT_MS = 10_000

function randomId(bytes = 8) {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const arr = new Uint8Array(bytes)
    crypto.getRandomValues(arr)
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return Math.random()
    .toString(16)
    .slice(2, 2 + bytes * 2)
}

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

export async function request<T = JsonValue>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  opts: {
    query?: Query
    body?: unknown
    init?: RequestInit
    timeoutMs?: number
    requestId?: string
  } = {},
): Promise<T> {
  const { query, body, init } = opts
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}${buildQuery(query)}`
  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(body != null ? { 'Content-Type': 'application/json' } : {}),
    'X-Request-Id': opts.requestId ?? randomId(),
    ...init?.headers,
  }
  const controller = !init?.signal ? new AbortController() : undefined
  const signal = init?.signal ?? controller?.signal
  const timeout = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    if (controller) timer = setTimeout(() => controller.abort(), timeout)
    const resp = await fetch(url, {
      method,
      body: body != null ? JSON.stringify(body) : undefined,
      ...init,
      headers,
      signal,
    })
    if (!resp.ok) throw await toApiError(resp, { url, method })
    if (resp.status === 204) return undefined as T
    const ct = resp.headers.get('Content-Type') || ''
    if (ct.includes('application/json')) return (await resp.json()) as T
    // @ts-expect-error allow text fallback for generic
    return (await resp.text()) as T
  } catch (err: any) {
    if (err?.name === 'AbortError' || err instanceof TypeError) {
      throw new ApiError('Network error (aborted/timeout)', 0, undefined, { url, method })
    }
    throw err
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export const api = {
  get: <T = JsonValue>(path: string, query?: Query, init?: RequestInit) =>
    request<T>('GET', path, { query, init }),
  post: <T = JsonValue>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>('POST', path, { body, init }),
  put: <T = JsonValue>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>('PUT', path, { body, init }),
  patch: <T = JsonValue>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>('PATCH', path, { body, init }),
  delete: <T = JsonValue>(path: string, query?: Query, init?: RequestInit) =>
    request<T>('DELETE', path, { query, init }),
}

export const apiBase = API_BASE
