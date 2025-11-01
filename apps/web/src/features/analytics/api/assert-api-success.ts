export type ApiResponse<TData> =
  | { success: true; data: TData; message?: string }
  | { success: false; data?: TData; message?: string }

export function assertApiSuccess<TData>(
  response: ApiResponse<TData>,
  fallbackMessage = 'Request failed',
): asserts response is { success: true; data: TData; message?: string } {
  if (!response.success) {
    throw new Error(response.message ?? fallbackMessage)
  }
}
