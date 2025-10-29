export class ApiError<T = unknown> extends Error {
  status: number
  data?: T

  constructor(message: string, status: number, data?: T) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}
