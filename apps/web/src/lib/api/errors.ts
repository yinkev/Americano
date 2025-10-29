export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function toApiError(resp: Response): Promise<ApiError> {
  try {
    const data = await resp.clone().json().catch(() => undefined)
    const message = (data as any)?.message || (data as any)?.detail || resp.statusText || `HTTP ${resp.status}`
    return new ApiError(message, resp.status, data)
  } catch {
    return new ApiError(resp.statusText || `HTTP ${resp.status}`, resp.status)
  }
}
