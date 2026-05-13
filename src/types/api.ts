export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  meta?: PaginationMeta
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
