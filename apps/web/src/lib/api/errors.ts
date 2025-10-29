export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function toApiError(resp: Response): Promise<ApiError> {
  try {
    const data = await resp.clone().json().catch(() => null)
    const code = data?.code ?? undefined
    const details = data?.detail ?? data?.details ?? data ?? undefined
    const message = data?.message ?? data?.detail ?? resp.statusText || `HTTP ${resp.status}`
    return new ApiError(resp.status, message, code, details)
  } catch {
    return new ApiError(resp.status, resp.statusText || `HTTP ${resp.status}`)
  }
}

