export class ApiError<T = unknown> extends Error {
  readonly status: number
  readonly data?: T
  readonly url: string
  readonly method: string

  constructor(message: string, status: number, data?: T, meta?: { url?: string; method?: string }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.url = meta?.url ?? 'unknown'
    this.method = meta?.method ?? 'GET'
  }
}

export async function toApiError<T = unknown>(
  resp: Response,
  meta?: { url?: string; method?: string },
) {
  try {
    const data = (await resp
      .clone()
      .json()
      .catch(() => undefined)) as T | undefined
    const message =
      (data as any)?.message || (data as any)?.detail || resp.statusText || `HTTP ${resp.status}`
    return new ApiError<T>(message, resp.status, data, {
      url: meta?.url ?? resp.url,
      method: meta?.method,
    })
  } catch {
    return new ApiError<T>(resp.statusText || `HTTP ${resp.status}`, resp.status, undefined, {
      url: meta?.url ?? resp.url,
      method: meta?.method,
    })
  }
}
